# 直播辩论首页API字段说明

## 1. 投票系统接口

### 1.1 获取票数统计 - GET /api/votes

**请求参数：** 无

**响应字段：**
```json
{
  "success": true,                    // 布尔值，请求是否成功
  "data": {
    "leftVotes": 1250,               // 整数，正方票数
    "rightVotes": 1180,              // 整数，反方票数
    "totalVotes": 2430,              // 整数，总票数
    "leftPercentage": 51,            // 整数，正方票数百分比
    "rightPercentage": 49            // 整数，反方票数百分比
  }
}
```

### 1.2 用户投票 - POST /api/user-vote

**投票逻辑说明：**

1. **初始100票分配（直播开始前）**
   - 用户初始拥有100票待分配
   - 用户可以通过拖动预设观点倾向进度条（0-100%）来分配这100票
   - 点击确认按钮后，前端会根据进度条百分比计算正方和反方的票数
   - 分别调用两次本接口：一次提交正方票数，一次提交反方票数
   - 提交后，这100票会累加到全局票数统计中

2. **直播中的投票（直播开始后）**
   - 用户点击投票按钮或拖动进度条时，只影响前端显示，**不会立即发送到数据库**
   - 只有当用户点击确认按钮时，才会将当前票数提交到数据库
   - 同样分别调用两次本接口：一次提交正方票数，一次提交反方票数
   - 注意：本接口是**累加**票数的，每次调用都会在原有票数基础上增加

**请求字段：**
```json
{
  "side": "left",                    // 字符串，必填，"left"或"right"
  "votes": 100,                      // 整数，可选，默认10，投票数量（1-1000之间的正整数）
  "userId": "user123"                // 字符串，可选，用户ID（用于统计用户投票数据）
}
```

**响应字段：**
```json
{
  "success": true,                   // 布尔值，请求是否成功
  "data": {
    "leftVotes": 1260,              // 整数，更新后的正方总票数（累加后）
    "rightVotes": 1180,             // 整数，更新后的反方总票数（累加后）
    "totalVotes": 2440,             // 整数，总票数
    "leftPercentage": 52,           // 整数，更新后的正方百分比（四舍五入）
    "rightPercentage": 48           // 整数，更新后的反方百分比（四舍五入）
  }
}
```

**使用场景示例：**

1. **初始100票提交场景：**
   ```javascript
   // 假设用户拖动进度条到80%，即80%投正方，20%投反方
   const leftVotes = Math.round(0.8 * 100);  // 80票
   const rightVotes = 100 - leftVotes;       // 20票
   
   // 先提交正方票
   await uni.request({
     url: '/api/user-vote',
     method: 'POST',
     data: { side: 'left', votes: leftVotes }
   });
   
   // 再提交反方票
   await uni.request({
     url: '/api/user-vote',
     method: 'POST',
     data: { side: 'right', votes: rightVotes }
   });
   ```

2. **直播中确认提交场景：**
   ```javascript
   // 用户在直播中通过点击投票按钮或拖动进度条，累积了前端的票数
   // 例如：前端显示 leftVotes = 30, rightVotes = 20
   
   // 点击确认按钮后，提交到数据库
   await uni.request({
     url: '/api/user-vote',
     method: 'POST',
     data: { side: 'left', votes: 30 }
   });
   
   await uni.request({
     url: '/api/user-vote',
     method: 'POST',
     data: { side: 'right', votes: 20 }
   });
   ```

## 2. AI内容接口

### 2.1 获取AI内容 - GET /api/ai-content

**请求参数：** 无

**响应字段：**
```json
{
  "success": true,                   // 布尔值，请求是否成功
  "data": [                          // 数组，AI内容列表
    {
      "id": "a1b2c3",              // 字符串，内容唯一ID
      "debate_id": "debate-default-001", // 字符串，辩题ID，标识该观点属于哪个辩题
      "text": "正方观点：痛苦是人生成长的必要经历...", // 字符串，辩论内容
      "side": "left",                // 字符串，"left"或"right"
      "timestamp": 1703123456789,    // 整数，时间戳（毫秒）
      "likes": 45,                   // 整数，点赞数
      "comments": [                  // 数组，评论列表
        {
          "id": "cm_001",          // 字符串，评论唯一ID（用于点赞时识别）
          "user": "心理学家",         // 字符串，用户名
          "text": "痛苦确实能促进心理成长...", // 字符串，评论内容
          "timestamp": 1703123400000, // 整数，时间戳（毫秒）
          "avatar": "🧠",           // 字符串，用户头像
          "likes": 15               // 整数，评论点赞数
        }
      ]
    }
  ]
}
```

## 4. 辩题管理接口

### 4.1 获取辩题信息 - GET /api/debate-topic

**请求参数：** 无

**响应字段：**
```json
{
  "success": true,                   // 布尔值，请求是否成功
  "data": {
    "id": "debate-default-001",      // 字符串，辩题ID，用于标识辩题
    "title": "如果有一个能一键消除痛苦的按钮，你会按吗？", // 字符串，辩题标题
    "description": "这是一个关于痛苦、成长与人性选择的深度辩论" // 字符串，辩题描述
  }
}
```

## 5. 错误响应字段

所有接口在出错时都会返回统一的错误格式：

```json
{
  "success": false,                  // 布尔值，固定为false
  "message": "错误信息描述"          // 字符串，具体的错误信息
}
```

### HTTP 状态码说明

| 接口 | 状态码 | 错误场景 | 响应示例 |
|-----|--------|---------|--------|
| GET /api/votes | 200 | 成功 | `{"success": true, "data": {...}}` |
| | 500 | 服务器错误 | `{"success": false, "message": "获取票数时出错..."}` |
| GET /api/ai-content | 200 | 成功 | `{"success": true, "data": [...]}` |
| | 500 | 服务器错误 | `{"success": false, "message": "获取AI内容时出错..."}` |
| GET /api/debate-topic | 200 | 成功 | `{"success": true, "data": {...}}` |
| | 500 | 服务器错误 | `{"success": false, "message": "获取辩题时出错..."}` |
| POST /api/user-vote | 200 | 投票成功 | `{"success": true, "data": {...}}` |
| | 400 | 参数错误 | `{"success": false, "message": "缺少必要参数: side..."}` |
| | 500 | 服务器错误 | `{"success": false, "message": "服务器错误"}` |
|  |  |  |  |

## 6. 字段类型说明

| 字段类型 | 说明 | 示例 |
|---------|------|------|
| `boolean` | 布尔值 | `true`, `false` |
| `integer` | 整数 | `123`, `0`, `-1` |
| `string` | 字符串 | `"hello"`, `"123"` |
| `array` | 数组 | `[1, 2, 3]`, `["a", "b"]` |
| `object` | 对象 | `{"key": "value"}` |

## 7. 必填字段说明

### 请求必填字段：
- **用户投票**: `side` (投票方)
- **添加评论**: `contentId` (内容ID), `text` (评论内容)
- **删除评论**: `commentId` (评论ID, URL参数), `contentId` (内容ID, 请求体)
- **点赞功能**: `contentId` (内容ID)

### 可选字段：
- **用户投票**: `votes` (默认10, 1-1000之间的正整数), `userId` (用户ID，用于统计，可选)
- **添加评论**: `user` (默认"匿名用户"), `avatar` (默认"👤")
- **点赞功能**: `commentId` (不传则点赞内容)

## 8. 数据验证规则

1. **side字段**: 只能是 `"left"` 或 `"right"`，必填
2. **votes字段**: 必须是 1-1000 之间的正整数，可选（默认10）。注意：本接口是**累加**票数的，多次调用会在原有票数基础上累加
3. **userId字段**: 字符串，可选，用于统计用户投票数据
4. **contentId字段**: 必须是存在的AI内容ID，必填
5. **commentId字段**: 必须是对应内容下存在的评论ID，删除评论时为必填（URL参数），点赞时为可选
6. **text字段**: 不能为空字符串或仅空格，必填（添加评论时）
7. **user字段**: 用户名字符串，可选（默认"匿名用户"）
8. **avatar字段**: 用户头像字符串，可选（默认"👤"）

## 9. 使用示例

### 前端调用示例：

```javascript
// 获取票数统计
const response = await uni.request({
  url: 'http://localhost:3000/api/votes',
  method: 'GET'
});

// 用户投票（初始100票分配示例）
// 假设用户拖动进度条到70%，即70票投正方，30票投反方
const leftVotes = 70;
const rightVotes = 30;

// 先提交正方票
await uni.request({
  url: 'http://localhost:3000/api/user-vote',
  method: 'POST',
  data: {
    side: 'left',
    votes: leftVotes,
    userId: 'user123'  // 可选
  }
});

// 再提交反方票
await uni.request({
  url: 'http://localhost:3000/api/user-vote',
  method: 'POST',
  data: {
    side: 'right',
    votes: rightVotes,
    userId: 'user123'  // 可选
  }
});

// （省略非必需：评论/点赞示例）
```

## 10. 管理后台接口（/api/admin/...）

说明：管理端接口需管理员鉴权。写操作（新增/修改/删除/控制）一律走 /api/admin，公开读接口可供小程序与后台共用。

### 10.1 直播控制与计划
- POST /api/admin/live/control
  - 请求：`{ "action": "start" | "stop" }`
  - 响应：`{ "success": true, "data": { "isLive": true, "streamUrl": "..." } }`

- GET /api/admin/live/status
  - 响应：`{ "isLive": boolean, "streamUrl": string|null, "schedule": { "scheduledStartTime": ISO, "scheduledEndTime": ISO|null, "streamId": string|null, "isScheduled": boolean } }`

- POST /api/admin/live/schedule
  - 请求：`{ "scheduledStartTime": ISOString, "scheduledEndTime"?: ISOString, "streamId"?: string }`
  - 响应：`{ "success": true, "data": { ...计划对象... } }`

- GET /api/admin/live/schedule
  - 响应：`{ "success": true, "data": { ...计划对象... } }`

- POST /api/admin/live/schedule/cancel
  - 响应：`{ "success": true, "message": "直播计划已取消" }`

- POST /api/admin/live/setup-and-start
  - 请求：`{ "streamId": string, "startNow": boolean, "scheduledStartTime"?: ISOString, "scheduledEndTime"?: ISOString }`
  - 响应：立即：`{ "success": true, "data": { "isLive": true, "streamUrl": "...", "streamId": "..." } }`；定时：返回计划

### 10.2 直播流管理
- GET /api/admin/streams → `[{ id, name, url, type, enabled, createdAt, updatedAt }]`
- GET /api/admin/streams/:id
- POST /api/admin/streams
- PUT /api/admin/streams/:id
- DELETE /api/admin/streams/:id
- POST /api/admin/streams/:id/toggle

### 10.3 辩论设置
- GET /api/admin/debate → `{ title, description, leftPosition, rightPosition, updatedAt }`
- PUT /api/admin/debate

### 10.4 投票管理
- GET /api/admin/votes（推荐，管理端只读别名）
- PUT /api/admin/votes → `{ leftVotes?, rightVotes? }`
- POST /api/admin/votes/reset

### 10.5 AI 内容管理
- GET /api/admin/ai-content
- GET /api/admin/ai-content/:id（推荐保留）
- POST /api/admin/ai-content → `{ text, side: 'left'|'right', debate_id? }`
- PUT /api/admin/ai-content/:id
- DELETE /api/admin/ai-content/:id

（评论治理建议）
- GET /api/admin/ai-content/:id/comments
- POST /api/admin/ai-content/:id/comments
- PUT /api/admin/comments/:comment_id
- DELETE /api/admin/comments/:comment_id

### 10.6 用户管理
- GET /api/admin/users
- GET /api/admin/users/:id

### 10.7 统计
- GET /api/admin/statistics/summary → `{ totalVotes, totalUsers, totalStreams, totalLiveDays }`
- GET /api/admin/statistics/daily → `[{ date: 'YYYY-MM-DD', votes, users, messages }]`

### 10.8 WebSocket 事件（管理端）
- vote-updated、ai-content-added/updated/deleted、live-schedule-updated/cancelled、live-status-changed
