import {Hono} from "@hono/hono";
import {cors} from "@hono/hono/cors"
import {decodeBase64, encodeBase64,} from "@std/encoding";
import {v4} from "@std/uuid";

const app = new Hono();

const compilers = Deno.readTextFileSync("./compiler.jsonc");
const Compilers = JSON.parse(compilers) as {
    compilers: { path: string; version: string; default: boolean }[];
};

app.use(
    "/*",
    cors({
        origin: "*",
    }),
);

app.get("/versions", (c) => {
    return c.json(Compilers.compilers.map((v) => {
        return { version: v.version, default: v.default };
    }));
});

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
    const { version } = await c.req.json() as { version: string };

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
        const compilerPath = Compilers.compilers.find((v) => v.version === version);
        if (!compilerPath) {
            return c.json({
                status: "unknown compiler version",
                id: ""
            }, { status: 400})
        }

        const a = new Deno.Command(compilerPath.path, {
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
