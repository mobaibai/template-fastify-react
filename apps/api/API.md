# API 接口使用说明

服务运行于 `http://localhost:3001`

## 数据模型

### Item

```ts
interface Item {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}
```

### 创建/更新请求体

- **创建** (`POST`)：`{ "name": "string" }`，`name` 长度 1~100
- **更新** (`PUT`)：`{ "name": "string" }`，所有字段可选

---

## 接口列表

### 1. 健康检查

```http
GET /health
```

**响应示例：**

```json
{
  "status": "ok",
  "timestamp": "2026-06-10T10:00:00.000Z",
  "uptime": 123.45
}
```

---

### 2. 创建 Item

```http
POST /api/items
Content-Type: application/json

{ "name": "hello" }
```

**响应 (201)：**

```json
{ "code": 0, "data": { "id": "1", "name": "hello", "createdAt": "...", "updatedAt": "..." }, "message": "created" }
```

---

### 3. 获取 Item 列表

```http
GET /api/items
```

**响应 (200)：**

```json
{ "code": 0, "data": { "list": [ { "id": "1", "name": "hello", ... } ], "total": 1 }, "message": "ok" }
```

---

### 4. 获取单个 Item

```http
GET /api/items/:id
```

**成功响应 (200)：**

```json
{ "code": 0, "data": { "id": "1", "name": "hello", ... }, "message": "ok" }
```

**失败响应 (404)：**

```json
{ "code": 404, "data": null, "message": "not found" }
```

---

### 5. 更新 Item

```http
PUT /api/items/:id
Content-Type: application/json

{ "name": "world" }
```

**成功响应 (200)：**

```json
{ "code": 0, "data": { "id": "1", "name": "world", ... }, "message": "updated" }
```

**失败响应 (404)：**

```json
{ "code": 404, "data": null, "message": "not found" }
```

---

### 6. 删除 Item

```http
DELETE /api/items/:id
```

**成功响应 (200)：**

```json
{ "code": 0, "data": null, "message": "deleted" }
```

**失败响应 (404)：**

```json
{ "code": 404, "data": null, "message": "not found" }
```

---

## 快速测试 (curl)

```bash
# 健康检查
curl http://localhost:3001/health

# 创建
curl -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'

# 列表
curl http://localhost:3001/api/items

# 详情
curl http://localhost:3001/api/items/1

# 更新
curl -X PUT http://localhost:3001/api/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"updated"}'

# 删除
curl -X DELETE http://localhost:3001/api/items/1
```
