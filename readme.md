# kanicc - mruby, mruby/c online compiler

## API Documents

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

#### Request

```json
{
  "code": "<base64 encoded Ruby Code>"
}
```

#### Response

`Status 200`

```json
{
  "status": "ok",
  "id": "387972832krgr-3jekfjn4t-rkjgnjnedwdgr"
}
```

### GET `/code/:id`

コードが存在するかのチェック

#### Response

`Status 200`

```json
{
  "code": "<base64 encoded Ruby Code>"
}
```

### POST `/code/:id/compile`

コードをコンパイル

#### Request

```json
{
  "version": "3.3.0"
}
```

#### Response

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
