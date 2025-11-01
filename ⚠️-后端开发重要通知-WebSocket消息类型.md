# ⚠️ 后端开发重要通知：WebSocket消息类型

## 📋 重要说明

**日期**: 2025-10-31  
**优先级**: 🔴 **必须遵循**

---

## 🎯 核心问题

前端（小程序）实际监听的是以下WebSocket消息类型，**必须与后端实现完全一致**：

| 功能 | ✅ 正确消息类型 | ❌ 错误类型（文档中可能有） | 说明 |
|------|---------------|---------------------------|------|
| 直播开始 | `liveStatus` | `live-started` | **必须使用 `liveStatus`** |
| 直播停止 | `liveStatus` | `live-stopped` | **必须使用 `liveStatus`** |
| AI启动 | `aiStatus` | `ai-started` | **必须使用 `aiStatus`** |
| AI停止 | `aiStatus` | `ai-stopped` | **必须使用 `aiStatus`** |
| AI状态变更 | `aiStatus` | `ai-status-changed` | **必须使用 `aiStatus`** |
| 票数更新 | `votesUpdate` | `votes-updated` | **必须使用 `votesUpdate`** |
| 新AI内容 | `newAIContent` | `ai-content-added` | **必须使用 `newAIContent`** |
| 删除AI内容 | `aiContentDeleted` | `ai-content-deleted` | **必须使用 `aiContentDeleted`** |

---

## ✅ 正确的WebSocket消息格式

### 1. 直播状态消息 (`liveStatus`)

**后端发送**:
```json
{
  "type": "liveStatus",
  "data": {
    "isLive": true,              // boolean, 必填
    "liveId": "live_uuid_789",   // string, 必填
    "streamUrl": "https://play.example.com/live/stream.m3u8",  // string, 必填（开始直播时）
    "startTime": "2025-10-31T10:00:00.000Z"  // string, 开始直播时必填
  }
}
```

**直播停止时**:
```json
{
  "type": "liveStatus",
  "data": {
    "isLive": false,             // boolean, 必填
    "liveId": "live_uuid_789",   // string, 必填
    "stopTime": "2025-10-31T11:00:00.000Z"  // string, 停止直播时必填
  }
}
```

**⚠️ 关键点**:
- ✅ 消息类型必须是 `liveStatus`（不是 `live-started`）
- ✅ `data.streamUrl` **必须包含**（小程序依赖这个来播放）
- ✅ `data.isLive` 用来区分开始/停止

---

### 2. AI状态消息 (`aiStatus`)

**后端发送**:
```json
{
  "type": "aiStatus",
  "data": {
    "status": "running",          // string, 必填: "running" | "stopped" | "paused"
    "aiSessionId": "ai_session_xxx"  // string, 可选
  }
}
```

**⚠️ 关键点**:
- ✅ 消息类型必须是 `aiStatus`（不是 `ai-started` 或 `ai-stopped`）
- ✅ 所有AI状态变更（启动/停止/暂停）都用同一个类型 `aiStatus`
- ✅ 通过 `data.status` 字段区分具体状态

---

### 3. 票数更新消息 (`votesUpdate`)

**后端发送**:
```json
{
  "type": "votesUpdate",
  "data": {
    "leftVotes": 1234,           // number, 必填
    "rightVotes": 987,           // number, 必填
    "leftPercentage": 56,        // number, 必填
    "rightPercentage": 44,       // number, 必填
    "totalVotes": 2221           // number, 可选
  }
}
```

**⚠️ 关键点**:
- ✅ 消息类型必须是 `votesUpdate`（不是 `votes-updated`）

---

### 4. 新AI内容消息 (`newAIContent`)

**后端发送**:
```json
{
  "type": "newAIContent",
  "data": {
    "id": "content_uuid_123",    // string, 必填
    "text": "AI识别的文字内容",   // string, 必填
    "side": "left",              // string, 必填: "left" | "right"
    "timestamp": "2025-10-31T10:30:00.000Z",  // string, 必填
    "likes": 0,                  // number, 可选，默认0
    "comments": []               // array, 可选，默认[]
  }
}
```

**⚠️ 关键点**:
- ✅ 消息类型必须是 `newAIContent`（不是 `ai-content-added`）
- ✅ 可以直接展开内容对象（使用 `...content` 或完整字段）

---

### 5. AI内容删除消息 (`aiContentDeleted`)

**后端发送**:
```json
{
  "type": "aiContentDeleted",
  "data": {
    "contentId": "content_uuid_123"  // string, 必填
  }
}
```

**⚠️ 关键点**:
- ✅ 消息类型必须是 `aiContentDeleted`（不是 `ai-content-deleted`）
- ✅ 字段名是 `contentId`（不是 `id`）

---

## 📋 小程序监听代码（参考）

**前端实际代码** (`pages/home/home.vue`):
```javascript
handleWSMessage(data) {
  switch (data.type) {
    case 'liveStatus':      // ✅ 必须是这个
      this.handleLiveStatusUpdate(data.data);
      break;
      
    case 'aiStatus':        // ✅ 必须是这个
      this.handleAIStatusUpdate(data.data);
      break;
      
    case 'votesUpdate':     // ✅ 必须是这个
      this.handleVotesUpdate(data.data);
      break;
      
    case 'newAIContent':    // ✅ 必须是这个
      this.handleNewAIContent(data.data);
      break;
      
    case 'aiContentDeleted': // ✅ 必须是这个
      this.handleAIContentDeleted(data.data);
      break;
      
    case 'pong':           // 心跳响应
      break;
  }
}
```

---

## ❌ 常见错误

### 错误1: 使用旧的消息类型
```javascript
// ❌ 错误 - 前端无法识别
broadcast('live-started', {...});
broadcast('ai-started', {...});
broadcast('votes-updated', {...});

// ✅ 正确
broadcast('liveStatus', {...});
broadcast('aiStatus', {...});
broadcast('votesUpdate', {...});
```

### 错误2: 直播消息缺少streamUrl
```javascript
// ❌ 错误 - 小程序无法播放
broadcast('liveStatus', {
  isLive: true,
  liveId: "xxx"
  // 缺少 streamUrl
});

// ✅ 正确
broadcast('liveStatus', {
  isLive: true,
  liveId: "xxx",
  streamUrl: "https://play.example.com/live/stream.m3u8"  // 必须有
});
```

### 错误3: AI状态用不同消息类型
```javascript
// ❌ 错误
broadcast('ai-started', {...});   // 启动
broadcast('ai-stopped', {...});   // 停止

// ✅ 正确 - 统一使用 aiStatus
broadcast('aiStatus', {status: 'running'});   // 启动
broadcast('aiStatus', {status: 'stopped'});  // 停止
```

---

## 🔍 验证清单

开发完成后，请确认：

- [ ] ✅ 直播开始时发送 `liveStatus`（不是 `live-started`）
- [ ] ✅ 直播消息包含 `streamUrl` 字段
- [ ] ✅ AI状态统一使用 `aiStatus`（不是 `ai-started`/`ai-stopped`）
- [ ] ✅ 票数更新使用 `votesUpdate`（不是 `votes-updated`）
- [ ] ✅ 新AI内容使用 `newAIContent`（不是 `ai-content-added`）
- [ ] ✅ 删除AI内容使用 `aiContentDeleted`（不是 `ai-content-deleted`）
- [ ] ✅ 所有消息的数据结构符合上面的格式

---

## 📞 如有疑问

**参考文件**:
- `server.js` (line 1896, 1973, 2163, 2218, 2280, 979, 1043, 2325) - 查看正确实现

**测试方法**:
1. 打开小程序开发者工具
2. 查看控制台WebSocket消息
3. 确认消息类型和数据格式

---

## 📝 总结

**关键原则**:
1. ✅ **消息类型必须完全匹配**（区分大小写）
2. ✅ **直播消息必须包含streamUrl**
3. ✅ **统一消息类型**（AI状态都用 `aiStatus`）
4. ✅ **字段名必须一致**（如 `contentId` 不是 `id`）

**如果不遵循，前端将无法接收消息，功能无法正常工作！** ⚠️

---

**创建日期**: 2025-10-31  
**优先级**: 🔴 高优先级  
**状态**: ✅ 必须遵循

