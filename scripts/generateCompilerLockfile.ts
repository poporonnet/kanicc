import * as v from "@valibot/valibot";
import { parse as parseJsonc } from "@std/jsonc";

// --- 定数定義 ---

const COMPILER_JSON_PATH = "./compiler.jsonc";
const COMPILER_LOCK_JSON_PATH = "./compiler.lock.json";

// --- スキーマ定義 ---

/** compiler.jsonc中のpathの公称 */
const PathSchema = v.pipe(v.string(), v.brand("Path"));
type Path = v.InferOutput<typeof PathSchema>;
/** compiler.jsonc中のversionの公称 */
const VersionSchema = v.pipe(v.string(), v.brand("Version"));
type Version = v.InferOutput<typeof VersionSchema>;

/** compiler.jsoncのスキーマ */
const CompilerJsonSchema = v.pipe(
  v.string(),
  v.transform(parseJsonc), // JSONCなのでv.parseJsonは使えない
  v.object({
    compilers: v.array(v.object({
      path: PathSchema,
      version: VersionSchema,
    })),
  }),
);

/** RITEバージョンのスキーマ */
const RiteSchema = v.pipe(v.string(), v.regex(/^RITE\d{4}$/), v.brand("Rite"));
type Rite = v.InferOutput<typeof RiteSchema>;

/** コマンドの標準出力からRITEバージョンを抽出するスキーマ */
const CommandOutputToRiteSchema = v.pipe(
  v.instance(Uint8Array),
  v.minLength(8),
  v.transform((out) => {
    const decoder = new TextDecoder();
    return decoder.decode(out.slice(0, 8));
  }),
  RiteSchema,
);

/** 生成するlockfileのデータの型 */
type CompilerLock = {
  [v in Version]?: {
    path: Path;
    rite: Rite;
  };
};

// --- Disposable定義 ---

//** 仮コンパイルに使うダミーファイルを管理するDisposable */
class DummyFile implements Disposable {
  path: string;

  constructor(path: string) {
    this.path = path;
    Deno.writeTextFileSync(this.path, "");
  }

  [Symbol.dispose]() {
    Deno.removeSync(this.path);
  }
}

// --- compiler.jsoncのロードとコマンド実行 ---

const compilerJson = Deno.readTextFileSync(COMPILER_JSON_PATH);
const compilers = v.parse(CompilerJsonSchema, compilerJson);
const compilerLock: CompilerLock = {};
{
  using file = new DummyFile("./files/dummy.rb");
  for (const { path, version } of compilers.compilers) {
    if (compilerLock[version]) {
      throw new Error(`Duplicated version specified: ${version}`);
    }

    const command = new Deno.Command(path, {
      args: ["-o", `-`, file.path], // `-o -`で結果を標準出力に出す
    });
    const output = await command.output();
    if (!output.success) {
      throw new Error(
        `${path} exited with code ${output.code}: ${output.stderr}`,
      );
    }

    const rite = v.parse(CommandOutputToRiteSchema, output.stdout);
    compilerLock[version] = { path, rite };
  }
}

// --- lockfileを出力 ---

Deno.writeTextFileSync(
  COMPILER_LOCK_JSON_PATH,
  JSON.stringify(compilerLock, undefined, 2),
);

console.log("✅ Generated lockfile.")
