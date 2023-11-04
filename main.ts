import { Hono } from "https://deno.land/x/hono@v3.8.2/mod.ts";
import {
  decodeBase64,
  encodeBase64,
} from "https://deno.land/std@0.204.0/encoding/base64.ts";
import { v4 } from "https://deno.land/std@0.204.0/uuid/mod.ts";

const app = new Hono();

app.post("/code", async (c) => {
  const body = await c.req.json() as { code: string };
  const code = body.code;
  if (!code) {
    c.status(400);
    return c.json({ error: "invalid code" });
  }

  const decoded = decodeBase64(code);

  const id = crypto.randomUUID();

  try {
    await Deno.writeFile(`./files/input/${id}.rb`, decoded);
  } catch {
    c.status(500);
    return c.json({
      status: "failed to write file",
      id: "",
    });
  }

  return c.json({
    status: "ok",
    id: id,
  });
});

app.post("/code/:id/compile", async (c) => {
  const id = (c.req.param() as { id: string }).id;

  if (!id) {
    c.status(400);
    return c.json({
      status: "failed to compile",
      id: "",
    });
  }

  if (!v4.validate(id)) {
    c.status(400);
    return c.json({
      status: "failed to compile",
      id: "",
    });
  }

  try {
    const a = new Deno.Command("../mrbc", {
      args: [
        "-o",
        `./files/output/${id}.out`,
        `./files/input/${id}.rb`,
      ],
    });

    const output = await a.output();
    const bin = await Deno.readFile(`./files/output/${id}.out`);
    const encodedBin = encodeBase64(bin);

    return c.json({
      binary: encodedBin,
      error: new TextDecoder().decode(output.stderr),
    });
  } catch (e) {
    console.log(e);
    c.status(500);
    return c.json({
      status: "failed to compile",
      id: "",
    });
  }
});

app.get("/code/:id", async (c) => {
  const id = (c.req.param() as { id: string }).id;

  if (!id) {
    c.status(400);
    return c.json({ error: "invalid id" });
  }

  if (!v4.validate(id)) {
    c.status(400);
    return c.json({
      error: "invalid id",
    });
  }

  try {
    const data = await Deno.readFile(`./files/input/${id}.rb`);
    const encodedCode = encodeBase64(data);

    return c.json({
      code: encodedCode,
    });
  } catch (e) {
    console.log(e);
    c.status(500);
    return c.json({
      error: "internal error",
    });
  }
});

Deno.serve(app.fetch);
