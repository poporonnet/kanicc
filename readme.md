# kanicc - mruby, mruby/c online compiler

## API Documents

<details>
<summary>複数ファイルの扱いについて</summary>

kaniccは複数ファイルのアップロード・コンパイルをサポートしています。複数ファイルモードでは、入出力の`code`や`binary`はBase64文字列の配列になります。また、URL中のIDは、複数のIDを`_`で連結した文字列になります。詳細は各エンドポイントを参照してください。
</details>

### `GET /versions`

コンパイラのバージョンを取得

#### Response

```json
[
  {
    "version": "3.3.0"
  }
]
```

### `POST /code`

コードをアップロード

#### 単一ファイルの場合

##### Request

```json
{
  "code": "<base64 encoded Ruby Code>"
}
```

##### Response

`Status 200`

```json
{
  "status": "ok",
  "id": "387972832krgr-3jekfjn4t-rkjgnjnedwdgr"
}
```

#### 複数ファイルの場合

##### Request

```json
{
  "code": [
    "<base64 encoded Ruby Code>",
    "<base64 encoded Ruby Code>",
    "<base64 encoded Ruby Code>"
  ]
}
```

##### Response

`Status 200`

```json
{
  "status": "ok",
  "id": "eeec7e5e-d4f9-492d-b83f-b1f8d4c8b9e7_2d8a56d2-23ef-4811-bc9f-ebdc339da72a_3c02a426-85b3-48f6-8087-f4836b6d801f"
}
```

- `id`はそれぞれのファイルに対応するIDを`_`で連結した文字列です。

### GET `/code/:id`

コードが存在するかのチェック

#### 単一ファイルの場合

##### Response

`Status 200`

```json
{
  "code": "<base64 encoded Ruby Code>"
}
```

#### 複数ファイルの場合

URLの`:id`の部分に複数のファイルIDを`_`で結合した文字列を指定します。
- 例: `/code/2d8a56d2-23ef-4811-bc9f-ebdc339da72a_3c02a426-85b3-48f6-8087-f4836b6d801f`

##### Response

`Status 200`

```json
{
  "code": ["<base64 encoded Ruby Code>"]
}
```

### POST `/code/:id/compile`

コードをコンパイル

#### 単一ファイルの場合

##### Request

```json
{
  "version": "3.3.0"
}
```

##### Response

`200 OK`  
コンパイル成功時
```json
{
  "status": "ok",
  "binary": "<base64 encoded mruby/c binary>"
}
```

`200 OK`
コンパイル失敗時

```json
{
  "status": "error",
  "error": "<error message>"
}
```
例:
```json
{
  "status": "error",
  "error": "input:4:0: syntax error, unexpected end of file, expecting \"'end'\"\n"
}
```

`400 Bad Request`
```jsonc
{
  // "invalid id" or "unknown compiler version"
  "status": "<error code>"
  // 常に空
  "id": "",
 }
```

`500 Internal Error`  
他の原因で失敗した場合:
```json
{
  "status": "failed to compile",
  "id": ""
}
```

#### 複数ファイルの場合

URLの`:id`の部分に複数のファイルIDを`_`で結合した文字列を指定します。  
- 例: `/code/2d8a56d2-23ef-4811-bc9f-ebdc339da72a_3c02a426-85b3-48f6-8087-f4836b6d801f/compile`


##### Request

```json
{
  "version": "3.3.0"
}
```

##### Response

`200 OK`  
コンパイル成功時
```json
{
  "status": "ok",
  "binary": ["<base64 encoded mruby/c binary>"]
}
```

## Credits

This project was inspired by [Tanabe-Yumi/kanicon-compile-server](https://github.com/Tanabe-Yumi/kanicon-compile-server) and [nodered-mrubyc/mrubyc-writer](https://github.com/nodered-mrubyc/mrubyc-writer), and developed with the total cooperation of [@sugiymki](https://github.com/sugiymki). Thanks to all contributors!

