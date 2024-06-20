# kanicc - mruby, mruby/c 

## API Documents

### `GET /versions`

コンパイラのバージョンを取得

#### Response

```json
[
  {
    "version": "3.3.0",
    "default": true
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

```json
{
  "binary": "<base64 encoded mruby/c binary>",
  "error": "<compiler output>"
}
```

