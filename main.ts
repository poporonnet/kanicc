import { Hono } from "https://deno.land/x/hono/mod.ts";
import { decodeBase64, encodeBase64 } from "https://deno.land/std/encoding/base64.ts";

const app = new Hono()

app.post("/code",async (c) => {
    const body = await c.req.json() as {code: string}
    const code = body.code
    if (!code) {
        c.status(400);
        return c.json({error: "invalid code"});
    }

    const decoded = decodeBase64(code);
    
    const id = crypto.randomUUID()
    
    try {
        await Deno.writeFile(`./files/input/${id}.rb`, decoded);
    } catch {
        c.status(500)
        return c.json({
            status: "failed to write file",
            id: ""
        })
    }

    
    return c.json({
        status: "ok",
        id: id
    })
})

app.post("/code/:id/compile",async (c) => {
    const id = (c.req.param() as {id: string}).id
    
    if (!id) {
        c.status(400);
        return c.json({error: "invalid code"});
    }
    console.log(id)
    try {
        const a = new Deno.Command("../mrbc", {
            args: [
                "-o",
                "a.out",
                `./files/input/${id}.rb`
            ],
    })
        
        const output = await a.output();
        console.log("ok")
        console.log(new TextDecoder().decode(output.stdout))
        const bin = await Deno.readFile(`a.out`);
        const encodedBin = encodeBase64(bin)
        
        return c.json({
            binary: encodedBin,
            error: new TextDecoder().decode(output.stderr)
        })

    } catch (e) {
        console.log(e)
        c.status(500)
        return c.json({
            status: "failed to compile",
            id: ""
        })
    }
    
})

Deno.serve(app.fetch);
