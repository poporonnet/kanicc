import {sentry} from "@hono/sentry"
import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { decodeBase64, encodeBase64 } from "@std/encoding";
import { v4 } from "@std/uuid";

const sentryDSN = Deno.env.get("SENTRY_DSN");
if (!sentryDSN) {
  throw new Error("SENTRY_DSN is not set.");
}

console.debug("Sentry initialized", sentryDSN);
const app = new Hono();

const compilers = Deno.readTextFileSync("./compiler.jsonc");
const Conpilers = JSON.parse(compilers) as {
  compilers: { path: string; version: string }[];
};
const INPUT_DIR_PATH = "./files/input/";

app.use(
  "/*",
  cors({
    origin: "*",
  }),
);

app.use('*', sentry({ dsn: sentryDSN }));
app.get("/versions", (c) => {
  return c.json(Conpilers.compilers.map((v) => {
    return { version: v.version };
  }));
});

/**
 * コードをアップロード
 */
app.post("/code", async (c) => {
  const body = (await c.req.json()) as { code: string | string[] };
  const codes = typeof body.code === "string" ? [body.code] : body.code;
  const ids: string[] = [];

  for (const code of codes) {
    if (!code) {
      return c.json({ error: "invalid code" }, 400);
    }

    const decoded = decodeBase64(code);

    const id = crypto.randomUUID();
    ids.push(id);

    try {
      await Deno.writeFile(`./files/input/${id}.rb`, decoded);
    } catch {
      return c.json(
        {
          status: "failed to write file",
          id: "",
        },
        500
      );
    }
  }

  return c.json({
    status: "ok",
    id: ids.join("_"),
  });
});

/**
 * コードをコンパイル
 */
app.post("/code/:id/compile", async (c) => {
  const id = (c.req.param() as { id: string }).id;
  const { version } = await c.req.json() as { version: string };

  if (!id) {
    return c.json({
      status: "invalid id",
      id: "",
    }, 400);
  }

  if (!v4.validate(id)) {
    return c.json({
      status: "invalid id",
      id: "",
    }, 400);
  }

  try {
    const compilerPath = Conpilers.compilers.find((v) => v.version === version);
    if (!compilerPath) {
      return c.json({
        status: "unknown compiler version",
        id: "",
      }, { status: 400 });
    }

    const a = new Deno.Command(compilerPath.path, {
      args: [
        "-o",
        `./files/output/${id}.out`,
        `./files/input/${id}.rb`,
      ],
    });
    const output = await a.output();

    if (output.code !== 0) {
      return c.json({
        status: "error",
        error: new TextDecoder().decode(output.stderr).replace(INPUT_DIR_PATH, "").replace(`${id}.rb`, "input"),
      })
    }

    const bin = await Deno.readFile(`./files/output/${id}.out`);
    const encodedBin = encodeBase64(bin);

    return c.json({
      status: "ok",
      binary: encodedBin
    });
  } catch (e) {
    console.log(e);
    return c.json({
      status: "failed to compile",
      id: "",
    }, 500);
  }
});

/**
 * コードの存在チェック
 */
app.get("/code/:id", async (c) => {
  const id = (c.req.param() as { id: string }).id;

  if (!id) {
    return c.json({ error: "invalid id" }, 400);
  }

  if (!v4.validate(id)) {
    c.status(400);
    return c.json({
      error: "invalid id",
    }, 400);
  }

  try {
    const data = await Deno.readFile(`./files/input/${id}.rb`);
    const encodedCode = encodeBase64(data);

    return c.json({
      code: encodedCode,
    });
  } catch (e) {
    console.log(e);
    return c.json({
      error: "internal error",
    }, 400);
  }
});

Deno.serve(app.fetch);
