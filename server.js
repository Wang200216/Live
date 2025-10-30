const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { getCurrentServerConfig, printConfig } = require('./config/server-mode.js');

const app = express();
const serverConfig = getCurrentServerConfig();
const port = serverConfig.mode === 'mock' ? serverConfig.port : 8000;

// ==================== WebSocket 支持 ====================
// 尝试加载 ws 模块（如果未安装需要运行: npm install ws）
let WebSocketServer;
try {
	const ws = require('ws');
	WebSocketServer = ws.WebSocketServer;
} catch (error) {
	console.warn('⚠️  WebSocket 模块未安装，实时通信功能将不可用。请运行: npm install ws');
	WebSocketServer = null;
}

// WebSocket 客户端连接池
const wsClients = new Set();

// 创建 HTTP 服务器（用于支持 WebSocket）
const server = http.createServer(app);
let wss = null;

if (WebSocketServer) {
	wss = new WebSocketServer({ server, path: '/ws' });
	
	wss.on('connection', (ws, req) => {
		console.log('✅ WebSocket 客户端已连接:', req.socket.remoteAddress);
		wsClients.add(ws);
		
		// 发送欢迎消息和当前状态
		ws.send(JSON.stringify({
			type: 'connected',
			message: '已连接到实时数据服务'
		}));
		
		// 发送当前状态
		broadcastCurrentState(ws);
		
		ws.on('message', (message) => {
			try {
				const data = JSON.parse(message);
				handleWebSocketMessage(ws, data);
			} catch (error) {
				console.error('WebSocket 消息解析失败:', error);
			}
		});
		
		ws.on('close', () => {
			console.log('❌ WebSocket 客户端已断开');
			wsClients.delete(ws);
		});
		
		ws.on('error', (error) => {
			console.error('WebSocket 错误:', error);
			wsClients.delete(ws);
		});
	});
}

// WebSocket 消息处理
function handleWebSocketMessage(ws, data) {
	switch (data.type) {
		case 'ping':
			ws.send(JSON.stringify({ type: 'pong' }));
			break;
		case 'control-live':
			// 后台管理系统控制直播状态
			handleLiveControl(data);
			break;
		case 'update-debate':
			// 后台管理系统更新辩论设置
			handleDebateUpdate(data);
			break;
		default:
			console.log('未知的 WebSocket 消息类型:', data.type);
	}
}

// 广播消息给所有客户端
function broadcast(type, data) {
	if (!wss || wsClients.size === 0) return;
	
	const message = JSON.stringify({ type, data, timestamp: Date.now() });
	
	// 移除已关闭的连接
	wsClients.forEach(client => {
		if (client.readyState === 1) { // WebSocket.OPEN
			client.send(message);
		} else {
			wsClients.delete(client);
		}
	});
}

// 广播当前状态（用于新连接）
function broadcastCurrentState(ws) {
	if (!ws || ws.readyState !== 1) return;
	
	try {
		const db = require('./admin/db.js');
		const dashboard = db.statistics.getDashboard();
		const debate = db.debate.get();
		
		ws.send(JSON.stringify({
			type: 'state',
			data: {
				votes: currentVotes,
				debate: debate,
				dashboard: dashboard,
				liveStatus: dashboard.isLive
			},
			timestamp: Date.now()
		}));
	} catch (error) {
		console.error('发送当前状态失败:', error);
	}
}

// 处理直播控制
function handleLiveControl(data) {
	try {
		const db = require('./admin/db.js');
		const { action } = data; // 'start' 或 'stop'
		
		if (action === 'start') {
			// 开启直播
			const activeStream = db.streams.getActive();
			if (activeStream) {
				broadcast('live-status-changed', {
					status: 'started',
					streamUrl: activeStream.url,
					timestamp: Date.now()
				});
			}
		} else if (action === 'stop') {
			// 停止直播
			broadcast('live-status-changed', {
				status: 'stopped',
				timestamp: Date.now()
			});
		}
	} catch (error) {
		console.error('处理直播控制失败:', error);
	}
}

// 处理辩论设置更新
function handleDebateUpdate(data) {
	// 这个功能已经通过 REST API 实现了，这里可以添加额外的实时通知
	broadcast('debate-updated', {
		debate: data.debate,
		timestamp: Date.now()
	});
}

app.use(cors());
app.use(express.json());

// ==================== 后台管理路由（必须在代理之前） ====================
const path = require('path');

// 提供后台管理页面
app.get('/admin', (req, res) => {
	res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// 提供后台管理静态资源
app.use('/admin', express.static(path.join(__dirname, 'admin')));
// ==================== 后台管理路由结束 ====================

// ==================== 后台管理 API（必须在代理之前） ====================
const db = require('./admin/db.js');

// 管理API - 数据概览
app.get('/api/admin/dashboard', (req, res) => {
	try {
		const dashboard = db.statistics.getDashboard();
		res.json(dashboard);
	} catch (error) {
		console.error('获取概览数据失败:', error);
		res.status(500).json({ error: '获取数据失败' });
	}
});

// 管理API - 直播流管理
app.get('/api/admin/streams', (req, res) => {
	try {
		const streams = db.streams.getAll();
		res.json(streams);
	} catch (error) {
		console.error('获取直播流失败:', error);
		res.status(500).json({ error: '获取失败' });
	}
});

app.get('/api/admin/streams/:id', (req, res) => {
	try {
		const stream = db.streams.getById(req.params.id);
		if (!stream) {
			return res.status(404).json({ error: '直播流不存在' });
		}
		res.json(stream);
	} catch (error) {
		console.error('获取直播流失败:', error);
		res.status(500).json({ error: '获取失败' });
	}
});

app.post('/api/admin/streams', (req, res) => {
	try {
		const stream = db.streams.create(req.body);
		res.json(stream);
	} catch (error) {
		console.error('创建直播流失败:', error);
		res.status(500).json({ error: '创建失败' });
	}
});

app.put('/api/admin/streams/:id', (req, res) => {
	try {
		const stream = db.streams.update(req.params.id, req.body);
		if (!stream) {
			return res.status(404).json({ error: '直播流不存在' });
		}
		res.json(stream);
	} catch (error) {
		console.error('更新直播流失败:', error);
		res.status(500).json({ error: '更新失败' });
	}
});

app.delete('/api/admin/streams/:id', (req, res) => {
	try {
		const deleted = db.streams.delete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: '直播流不存在' });
		}
		res.json({ success: true });
	} catch (error) {
		console.error('删除直播流失败:', error);
		res.status(500).json({ error: '删除失败' });
	}
});

app.post('/api/admin/streams/:id/toggle', (req, res) => {
	try {
		const stream = db.streams.toggle(req.params.id);
		if (!stream) {
			return res.status(404).json({ error: '直播流不存在' });
		}
		res.json(stream);
	} catch (error) {
		console.error('切换直播流状态失败:', error);
		res.status(500).json({ error: '操作失败' });
	}
});

// 管理API - 辩论设置
app.get('/api/admin/debate', (req, res) => {
	try {
		const debate = db.debate.get();
		res.json(debate);
	} catch (error) {
		console.error('获取辩论设置失败:', error);
		res.status(500).json({ error: '获取失败' });
	}
});

app.put('/api/admin/debate', (req, res) => {
	try {
		const debate = db.debate.update(req.body);
		// 同步更新内存中的辩题
		debateTopic.title = debate.title;
		debateTopic.description = debate.description;
		
		// 广播辩论设置更新给所有客户端（包括小程序）
		broadcast('debate-updated', {
			debate: debate,
			timestamp: Date.now()
		});
		
		res.json(debate);
	} catch (error) {
		console.error('更新辩论设置失败:', error);
		res.status(500).json({ error: '更新失败' });
	}
});

// 管理API - 用户管理
app.get('/api/admin/users', (req, res) => {
	try {
		const users = db.users.getAll();
		res.json(users);
	} catch (error) {
		console.error('获取用户列表失败:', error);
		res.status(500).json({ error: '获取失败' });
	}
});

app.get('/api/admin/users/:id', (req, res) => {
	try {
		const user = db.users.getById(req.params.id);
		if (!user) {
			return res.status(404).json({ error: '用户不存在' });
		}
		res.json(user);
	} catch (error) {
		console.error('获取用户失败:', error);
		res.status(500).json({ error: '获取失败' });
	}
});

// 获取当前辩题（小程序调用）
app.get('/api/debate-topic', (req, res) => {
	try {
		const db = require('./admin/db.js');
		const debate = db.debate.get();
		res.json({
			success: true,
			data: {
				id: 'debate-default-001',
				title: debate.title,
				description: debate.description
			}
		});
	} catch (error) {
		res.status(500).json({ success: false, message: "获取辩题时出错: " + error.message });
	}
});

// 添加直播状态控制 API
let globalLiveStatus = {
	isLive: false,
	streamUrl: null,
	scheduledStartTime: null,
	scheduledEndTime: null,
	streamId: null,
	isScheduled: false
};

// 定时检查直播计划
let liveScheduleTimer = null;

function checkLiveSchedule() {
	const db = require('./admin/db.js');
	const schedule = db.liveSchedule.get();
	const now = Date.now();
	
	if (schedule.isScheduled && schedule.scheduledStartTime) {
		const startTime = new Date(schedule.scheduledStartTime).getTime();
		
		// 如果到了开始时间且还未开始
		if (now >= startTime && !globalLiveStatus.isLive) {
			console.log('⏰ 定时开始直播');
			startScheduledLive(schedule);
		}
		
		// 如果有结束时间且已到结束时间
		if (schedule.scheduledEndTime && globalLiveStatus.isLive) {
			const endTime = new Date(schedule.scheduledEndTime).getTime();
			if (now >= endTime) {
				console.log('⏰ 定时结束直播');
				stopLive();
			}
		}
	}
}

// 启动定时检查（每分钟检查一次）
function startScheduleCheck() {
	if (liveScheduleTimer) {
		clearInterval(liveScheduleTimer);
	}
	liveScheduleTimer = setInterval(checkLiveSchedule, 60000); // 每分钟检查一次
}

// 启动计划的直播
function startScheduledLive(schedule) {
	const db = require('./admin/db.js');
	
	try {
		let streamUrl = null;
		
		// 获取直播流
		if (schedule.streamId) {
			const stream = db.streams.getById(schedule.streamId);
			if (stream && stream.enabled) {
				streamUrl = stream.url;
			}
		}
		
		if (!streamUrl) {
			const activeStream = db.streams.getActive();
			if (activeStream) {
				streamUrl = activeStream.url;
			}
		}
		
		if (!streamUrl) {
			console.error('❌ 没有可用的直播流');
			return;
		}
		
		globalLiveStatus.isLive = true;
		globalLiveStatus.streamUrl = streamUrl;
		globalLiveStatus.streamId = schedule.streamId;
		
		// 广播直播状态变化
		broadcast('live-status-changed', {
			status: 'started',
			streamUrl: globalLiveStatus.streamUrl,
			timestamp: Date.now(),
			scheduled: true
		});
		
		console.log('✅ 直播已开始:', streamUrl);
	} catch (error) {
		console.error('启动计划直播失败:', error);
	}
}

// 停止直播
function stopLive() {
	globalLiveStatus.isLive = false;
	globalLiveStatus.streamUrl = null;
	globalLiveStatus.streamId = null;
	
	// 清除计划
	const db = require('./admin/db.js');
	db.liveSchedule.clear();
	globalLiveStatus.isScheduled = false;
	globalLiveStatus.scheduledStartTime = null;
	globalLiveStatus.scheduledEndTime = null;
	
	// 广播直播状态变化
	broadcast('live-status-changed', {
		status: 'stopped',
		timestamp: Date.now()
	});
	
		console.log('🛑 直播已停止');
}

app.post('/api/admin/live/control', (req, res) => {
	try {
		const { action, streamUrl } = req.body;
		
		if (action === 'start') {
			if (!streamUrl) {
				const db = require('./admin/db.js');
				const activeStream = db.streams.getActive();
				if (!activeStream) {
					return res.status(400).json({ error: '没有可用的直播流' });
				}
				globalLiveStatus.streamUrl = activeStream.url;
			} else {
				globalLiveStatus.streamUrl = streamUrl;
			}
			globalLiveStatus.isLive = true;
			
			// 广播直播状态变化
			broadcast('live-status-changed', {
				status: 'started',
				streamUrl: globalLiveStatus.streamUrl,
				timestamp: Date.now()
			});
			
			res.json({ success: true, status: 'started', streamUrl: globalLiveStatus.streamUrl });
		} else if (action === 'stop') {
			stopLive();
			res.json({ success: true, status: 'stopped' });
		} else {
			res.status(400).json({ error: '无效的操作' });
		}
	} catch (error) {
		console.error('控制直播状态失败:', error);
		res.status(500).json({ error: '操作失败' });
	}
});

// 设置直播计划
app.post('/api/admin/live/schedule', (req, res) => {
	try {
		const db = require('./admin/db.js');
		const { scheduledStartTime, scheduledEndTime, streamId } = req.body;
		
		if (!scheduledStartTime) {
			return res.status(400).json({ error: '请设置直播开始时间' });
		}
		
		const startTime = new Date(scheduledStartTime).getTime();
		const now = Date.now();
		
		if (startTime <= now) {
			return res.status(400).json({ error: '开始时间必须晚于当前时间' });
		}
		
		// 验证直播流
		if (streamId) {
			const stream = db.streams.getById(streamId);
			if (!stream) {
				return res.status(400).json({ error: '指定的直播流不存在' });
			}
			if (!stream.enabled) {
				return res.status(400).json({ error: '指定的直播流未启用' });
			}
		} else {
			const activeStream = db.streams.getActive();
			if (!activeStream) {
				return res.status(400).json({ error: '没有可用的直播流' });
			}
		}
		
		// 保存计划
		const schedule = db.liveSchedule.update({
			scheduledStartTime,
			scheduledEndTime: scheduledEndTime || null,
			streamId: streamId || null,
			isScheduled: true
		});
		
		globalLiveStatus.scheduledStartTime = scheduledStartTime;
		globalLiveStatus.scheduledEndTime = scheduledEndTime || null;
		globalLiveStatus.streamId = streamId || null;
		globalLiveStatus.isScheduled = true;
		
		// 启动定时检查
		startScheduleCheck();
		
		// 广播计划更新
		broadcast('live-schedule-updated', {
			schedule: schedule,
			timestamp: Date.now()
		});
		
		res.json({
			success: true,
			message: '直播计划已设置',
			data: schedule
		});
	} catch (error) {
		console.error('设置直播计划失败:', error);
		res.status(500).json({ error: '设置失败' });
	}
});

// 获取直播计划
app.get('/api/admin/live/schedule', (req, res) => {
	try {
		const db = require('./admin/db.js');
		const schedule = db.liveSchedule.get();
		res.json({
			success: true,
			data: schedule
		});
	} catch (error) {
		res.status(500).json({ error: '获取失败' });
	}
});

// 取消直播计划
app.post('/api/admin/live/schedule/cancel', (req, res) => {
	try {
		const db = require('./admin/db.js');
		db.liveSchedule.clear();
		
		globalLiveStatus.isScheduled = false;
		globalLiveStatus.scheduledStartTime = null;
		globalLiveStatus.scheduledEndTime = null;
		
		// 广播计划取消
		broadcast('live-schedule-cancelled', {
			timestamp: Date.now()
		});
		
		res.json({
			success: true,
			message: '直播计划已取消'
		});
	} catch (error) {
		res.status(500).json({ error: '取消失败' });
	}
});

app.get('/api/admin/live/status', (req, res) => {
	try {
		const db = require('./admin/db.js');
		const schedule = db.liveSchedule.get();
		res.json({
			...globalLiveStatus,
			schedule: schedule
		});
	} catch (error) {
		res.json(globalLiveStatus);
	}
});

// 一次性设置并开始直播（整合API）
app.post('/api/admin/live/setup-and-start', (req, res) => {
	try {
		const db = require('./admin/db.js');
		const { streamId, scheduledStartTime, scheduledEndTime, startNow } = req.body;
		
		// 验证直播流
		let selectedStream = null;
		if (streamId) {
			selectedStream = db.streams.getById(streamId);
			if (!selectedStream) {
				return res.status(400).json({ error: '指定的直播流不存在' });
			}
			if (!selectedStream.enabled) {
				return res.status(400).json({ error: '指定的直播流未启用' });
			}
		} else {
			selectedStream = db.streams.getActive();
			if (!selectedStream) {
				return res.status(400).json({ error: '没有可用的直播流' });
			}
		}
		
		if (startNow) {
			// 立即开始直播
			globalLiveStatus.isLive = true;
			globalLiveStatus.streamUrl = selectedStream.url;
			globalLiveStatus.streamId = selectedStream.id;
			globalLiveStatus.isScheduled = false;
			globalLiveStatus.scheduledStartTime = null;
			globalLiveStatus.scheduledEndTime = null;
			
			// 清除之前的计划
			db.liveSchedule.clear();
			
			// 广播直播状态变化
			broadcast('live-status-changed', {
				status: 'started',
				streamUrl: globalLiveStatus.streamUrl,
				timestamp: Date.now(),
				startedBy: 'admin'
			});
			
			res.json({
				success: true,
				message: '直播已开始',
				data: {
					isLive: true,
					streamUrl: globalLiveStatus.streamUrl,
					streamId: selectedStream.id
				}
			});
		} else {
			// 设置定时开始
			if (!scheduledStartTime) {
				return res.status(400).json({ error: '请设置直播开始时间' });
			}
			
			const startTime = new Date(scheduledStartTime).getTime();
			const now = Date.now();
			
			if (startTime <= now) {
				return res.status(400).json({ error: '开始时间必须晚于当前时间' });
			}
			
			// 保存计划
			const schedule = db.liveSchedule.update({
				scheduledStartTime,
				scheduledEndTime: scheduledEndTime || null,
				streamId: selectedStream.id,
				isScheduled: true
			});
			
			globalLiveStatus.scheduledStartTime = scheduledStartTime;
			globalLiveStatus.scheduledEndTime = scheduledEndTime || null;
			globalLiveStatus.streamId = selectedStream.id;
			globalLiveStatus.isScheduled = true;
			
			// 启动定时检查
			startScheduleCheck();
			
			// 广播计划更新
			broadcast('live-schedule-updated', {
				schedule: schedule,
				timestamp: Date.now()
			});
			
			res.json({
				success: true,
				message: '直播计划已设置',
				data: schedule
			});
		}
	} catch (error) {
		console.error('设置并开始直播失败:', error);
		res.status(500).json({ error: '操作失败' });
	}
});

// ==================== 票数管理 API ====================
app.get('/api/admin/votes', (req, res) => {
	try {
		res.json({
			success: true,
			data: {
				leftVotes: currentVotes.leftVotes,
				rightVotes: currentVotes.rightVotes,
				totalVotes: currentVotes.leftVotes + currentVotes.rightVotes,
				leftPercentage: currentVotes.leftVotes + currentVotes.rightVotes > 0
					? Math.round((currentVotes.leftVotes / (currentVotes.leftVotes + currentVotes.rightVotes)) * 100)
					: 50,
				rightPercentage: currentVotes.leftVotes + currentVotes.rightVotes > 0
					? Math.round((currentVotes.rightVotes / (currentVotes.leftVotes + currentVotes.rightVotes)) * 100)
					: 50
			}
		});
	} catch (error) {
		res.status(500).json({ error: '获取票数失败' });
	}
});

app.put('/api/admin/votes', (req, res) => {
	try {
		const { leftVotes, rightVotes } = req.body;
		
		if (typeof leftVotes !== 'undefined' && typeof leftVotes !== 'number') {
			return res.status(400).json({ error: 'leftVotes 必须是数字' });
		}
		if (typeof rightVotes !== 'undefined' && typeof rightVotes !== 'number') {
			return res.status(400).json({ error: 'rightVotes 必须是数字' });
		}
		if ((typeof leftVotes !== 'undefined' && leftVotes < 0) || (typeof rightVotes !== 'undefined' && rightVotes < 0)) {
			return res.status(400).json({ error: '票数不能为负数' });
		}
		
		if (typeof leftVotes !== 'undefined') {
			currentVotes.leftVotes = leftVotes;
		}
		if (typeof rightVotes !== 'undefined') {
			currentVotes.rightVotes = rightVotes;
		}
		
		// 广播票数更新
		const totalVotes = currentVotes.leftVotes + currentVotes.rightVotes;
		broadcast('vote-updated', {
			votes: {
				leftVotes: currentVotes.leftVotes,
				rightVotes: currentVotes.rightVotes,
				totalVotes: totalVotes,
				leftPercentage: totalVotes > 0
					? Math.round((currentVotes.leftVotes / totalVotes) * 100)
					: 50,
				rightPercentage: totalVotes > 0
					? Math.round((currentVotes.rightVotes / totalVotes) * 100)
					: 50
			},
			updatedBy: 'admin'
		});
		
		res.json({
			success: true,
			data: {
				leftVotes: currentVotes.leftVotes,
				rightVotes: currentVotes.rightVotes,
				totalVotes: totalVotes
			}
		});
	} catch (error) {
		res.status(500).json({ error: '修改票数失败' });
	}
});

app.post('/api/admin/votes/reset', (req, res) => {
	try {
		currentVotes.leftVotes = 0;
		currentVotes.rightVotes = 0;
		
		// 广播票数重置
		broadcast('vote-updated', {
			votes: {
				leftVotes: 0,
				rightVotes: 0,
				totalVotes: 0,
				leftPercentage: 50,
				rightPercentage: 50
			},
			updatedBy: 'admin',
			action: 'reset'
		});
		
		res.json({
			success: true,
			message: '票数已重置'
		});
	} catch (error) {
		res.status(500).json({ error: '重置票数失败' });
	}
});

// ==================== AI 内容管理 API ====================
app.get('/api/admin/ai-content', (req, res) => {
	try {
		res.json({
			success: true,
			data: aiDebateContent
		});
	} catch (error) {
		res.status(500).json({ error: '获取 AI 内容失败' });
	}
});

app.get('/api/admin/ai-content/:id', (req, res) => {
	try {
		const { id } = req.params;
		const content = aiDebateContent.find(item => item.id === id);
		
		if (!content) {
			return res.status(404).json({ error: '内容不存在' });
		}
		
		res.json({
			success: true,
			data: content
		});
	} catch (error) {
		res.status(500).json({ error: '获取 AI 内容失败' });
	}
});

app.post('/api/admin/ai-content', (req, res) => {
	try {
		const { text, side, debate_id } = req.body;
		
		if (!text || !side) {
			return res.status(400).json({ error: '缺少必要参数: text, side' });
		}
		
		if (side !== 'left' && side !== 'right') {
			return res.status(400).json({ error: 'side 必须是 "left" 或 "right"' });
		}
		
		const newContent = {
			id: uuidv4(),
			debate_id: debate_id || debateTopic.id,
			text: text.trim(),
			side: side,
			timestamp: new Date().getTime(),
			comments: [],
			likes: 0
		};
		
		aiDebateContent.push(newContent);
		
		// 广播新内容添加
		broadcast('ai-content-added', {
			content: newContent,
			updatedBy: 'admin'
		});
		
		res.json({
			success: true,
			data: newContent
		});
	} catch (error) {
		res.status(500).json({ error: '添加 AI 内容失败' });
	}
});

app.put('/api/admin/ai-content/:id', (req, res) => {
	try {
		const { id } = req.params;
		const { text, side, debate_id } = req.body;
		
		const index = aiDebateContent.findIndex(item => item.id === id);
		if (index === -1) {
			return res.status(404).json({ error: '内容不存在' });
		}
		
		if (text !== undefined) {
			aiDebateContent[index].text = text.trim();
		}
		if (side !== undefined) {
			if (side !== 'left' && side !== 'right') {
				return res.status(400).json({ error: 'side 必须是 "left" 或 "right"' });
			}
			aiDebateContent[index].side = side;
		}
		if (debate_id !== undefined) {
			aiDebateContent[index].debate_id = debate_id;
		}
		
		// 广播内容更新
		broadcast('ai-content-updated', {
			content: aiDebateContent[index],
			updatedBy: 'admin'
		});
		
		res.json({
			success: true,
			data: aiDebateContent[index]
		});
	} catch (error) {
		res.status(500).json({ error: '更新 AI 内容失败' });
	}
});

app.delete('/api/admin/ai-content/:id', (req, res) => {
	try {
		const { id } = req.params;
		const index = aiDebateContent.findIndex(item => item.id === id);
		
		if (index === -1) {
			return res.status(404).json({ error: '内容不存在' });
		}
		
		const deletedContent = aiDebateContent.splice(index, 1)[0];
		
		// 广播内容删除
		broadcast('ai-content-deleted', {
			id: id,
			updatedBy: 'admin'
		});
		
		res.json({
			success: true,
			message: '删除成功',
			data: deletedContent
		});
	} catch (error) {
		res.status(500).json({ error: '删除 AI 内容失败' });
	}
});

// ==================== 后台管理 API 结束 ====================

// ==================== 统计 API（只读） ====================
app.get('/api/admin/statistics/summary', (req, res) => {
    try {
        const db = require('./admin/db.js');
        const stats = db.statistics.get();
        const users = db.users.getAll();
        const streams = db.streams.getAll();
        const totalVotes = stats.totalVotes || 0;
        const totalUsers = users.length;
        const totalStreams = streams.length;
        const totalLiveDays = Array.isArray(stats.dailyStats) ? stats.dailyStats.length : 0;
        res.json({
            success: true,
            data: {
                totalVotes,
                totalUsers,
                totalStreams,
                totalLiveDays
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取统计汇总失败' });
    }
});

app.get('/api/admin/statistics/daily', (req, res) => {
    try {
        const db = require('./admin/db.js');
        const stats = db.statistics.get();
        const daily = Array.isArray(stats.dailyStats) ? stats.dailyStats : [];
        res.json({ success: true, data: daily });
    } catch (error) {
        res.status(500).json({ error: '获取每日统计失败' });
    }
});

// 代理前端（5173 端口）到根路径（排除 /api 和 /admin）
// 创建代理中间件实例（只创建一次，提高性能）
const proxyMiddleware = createProxyMiddleware({
	target: 'http://localhost:5173',
	changeOrigin: true,
	logLevel: 'warn',
	// 支持 WebSocket（热重载需要）
	ws: true,
	onError: (err, req, res) => {
		console.error('代理错误:', err);
		res.status(500).json({ error: '前端服务不可用' });
	}
});

// 使用条件中间件来确保 /api 和 /admin 路径不会被代理
app.use((req, res, next) => {
	// 如果是 /api 或 /admin 路径，直接跳过代理，继续处理
	if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
		return next();
	}
	// 其他路径使用代理
	return proxyMiddleware(req, res, next);
});

// 静态文件服务
app.use(express.static('.'));


// 模拟数据
let currentVotes = {
    leftVotes: 0,   // 正方票数
    rightVotes: 0   // 反方票数
};

// 辩题信息
const debateTopic = {
    id: 'debate-default-001', // 辩题ID，用于标识该辩题
    title: "如果有一个能一键消除痛苦的按钮，你会按吗？",
    description: "这是一个关于痛苦、成长与人性选择的深度辩论"
};

// AI智能识别的辩论内容
const aiDebateContent = [
    {
        id: uuidv4(),
        debate_id: debateTopic.id, // 标识该观点属于哪个辩题
        text: "正方观点：痛苦是人生成长的必要经历，消除痛苦会让我们失去学习和成长的机会。",
        side: "left",
        timestamp: new Date().getTime() - 300000, // 5分钟前
        comments: [
            {
                id: uuidv4(),
                user: "心理学家",
                text: "痛苦确实能促进心理成长，但过度的痛苦也可能造成创伤",
                time: "3分钟前",
                avatar: "🧠",
                likes: 15
            },
            {
                id: uuidv4(),
                user: "哲学家",
                text: "尼采说过，那些杀不死我们的，会让我们更强大",
                time: "4分钟前",
                avatar: "🤔",
                likes: 23
            }
        ],
        likes: 45
    },
    {
        id: uuidv4(),
        debate_id: debateTopic.id, // 标识该观点属于哪个辩题
        text: "反方观点：如果能够消除痛苦，为什么不呢？痛苦本身没有价值，消除痛苦可以让人更专注于积极的事情。",
        side: "right",
        timestamp: new Date().getTime() - 240000, // 4分钟前
        comments: [
            {
                id: uuidv4(),
                user: "医生",
                text: "作为医生，我见过太多不必要的痛苦，如果能消除，我支持",
                time: "2分钟前",
                avatar: "👨‍⚕️",
                likes: 18
            },
            {
                id: uuidv4(),
                user: "患者家属",
                text: "看着亲人痛苦，我多么希望有这样的按钮",
                time: "3分钟前",
                avatar: "💝",
                likes: 31
            }
        ],
        likes: 52
    },
    {
        id: uuidv4(),
        debate_id: debateTopic.id, // 标识该观点属于哪个辩题
        text: "正方回应：痛苦让我们学会同理心，如果所有人都没有痛苦经历，我们如何理解他人的苦难？",
        side: "left",
        timestamp: new Date().getTime() - 180000, // 3分钟前
        comments: [
            {
                id: uuidv4(),
                user: "社工",
                text: "同理心确实需要痛苦的经历来培养",
                time: "1分钟前",
                avatar: "🤝",
                likes: 12
            },
            {
                id: uuidv4(),
                user: "作家",
                text: "很多伟大的文学作品都源于作者的痛苦经历",
                time: "2分钟前",
                avatar: "📚",
                likes: 19
            }
        ],
        likes: 38
    },
    {
        id: uuidv4(),
        debate_id: debateTopic.id, // 标识该观点属于哪个辩题
        text: "反方回应：我们可以通过其他方式培养同理心，比如阅读、教育。消除痛苦不等于消除所有负面情绪。",
        side: "right",
        timestamp: new Date().getTime() - 120000, // 2分钟前
        comments: [
            {
                id: uuidv4(),
                user: "教育工作者",
                text: "教育确实可以培养同理心，不一定需要亲身经历痛苦",
                time: "1分钟前",
                avatar: "👩‍🏫",
                likes: 16
            },
            {
                id: uuidv4(),
                user: "心理咨询师",
                text: "区分痛苦和负面情绪很重要，这个按钮可能只针对真正的痛苦",
                time: "刚刚",
                avatar: "💭",
                likes: 8
            }
        ],
        likes: 41
    },
    {
        id: uuidv4(),
        debate_id: debateTopic.id, // 标识该观点属于哪个辩题
        text: "正方总结：痛苦是人性的一部分，消除痛苦可能会让我们失去作为人的完整性。",
        side: "left",
        timestamp: new Date().getTime() - 60000, // 1分钟前
        comments: [
            {
                id: uuidv4(),
                user: "神学家",
                text: "痛苦在宗教和哲学中都有其深层意义",
                time: "刚刚",
                avatar: "⛪",
                likes: 14
            }
        ],
        likes: 29
    }
];

// 模拟实时票数变化
function simulateVoteChanges() {
    setInterval(() => {
        if (!globalLiveStatus.isLive) return; // 只有直播时才模拟
        // 随机增加票数，模拟观众投票
        const leftIncrease = Math.floor(Math.random() * 5) + 1;
        const rightIncrease = Math.floor(Math.random() * 5) + 1;
        
        currentVotes.leftVotes += leftIncrease;
        currentVotes.rightVotes += rightIncrease;
        
        console.log(`票数更新: 正方 ${currentVotes.leftVotes}, 反方 ${currentVotes.rightVotes}`);
    }, 3000); // 每3秒更新一次
}

// 模拟AI识别新内容
function simulateNewAIContent() {
    const newContents = [
        {
            text: "正方补充：痛苦让我们珍惜快乐，没有对比就没有真正的幸福。",
            side: "left"
        },
        {
            text: "反方补充：现代医学已经在消除很多痛苦，这个按钮只是技术的延伸。",
            side: "right"
        },
        {
            text: "正方质疑：如果所有人都按这个按钮，社会会变成什么样？",
            side: "left"
        },
        {
            text: "反方回应：每个人都有自己的选择权，不应该强迫别人承受痛苦。",
            side: "right"
        }
    ];
    
    setInterval(() => {
        if (!globalLiveStatus.isLive) return; // 只有直播时才模拟AI内容
        const randomContent = newContents[Math.floor(Math.random() * newContents.length)];
        const newContent = {
            id: uuidv4(), // 使用UUID
            debate_id: debateTopic.id, // 标识该观点属于哪个辩题
            text: randomContent.text,
            side: randomContent.side,
            timestamp: new Date().getTime(),
            comments: [],
            likes: Math.floor(Math.random() * 20) + 10
        };
        
        aiDebateContent.push(newContent);
        console.log(`新增AI内容: ${newContent.text}`);
    }, 15000); // 每15秒添加新内容
}

// API路由

// 获取当前票数
app.get('/api/votes', (req, res) => {
    try {
        const totalVotes = currentVotes.leftVotes + currentVotes.rightVotes;
        res.json({
            success: true,
            data: {
                leftVotes: currentVotes.leftVotes,
                rightVotes: currentVotes.rightVotes,
                totalVotes: totalVotes,
                leftPercentage: totalVotes > 0
                    ? Math.round((currentVotes.leftVotes / totalVotes) * 100)
                    : 50,
                rightPercentage: totalVotes > 0
                    ? Math.round((currentVotes.rightVotes / totalVotes) * 100)
                    : 50
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "获取票数时出错: " + error.message
        });
    }
});

// 获取辩题信息
app.get('/api/debate-topic', (req, res) => {
    try {
        // 确保返回的辩题信息包含 id 字段
        res.json({
            success: true,
            data: {
                id: debateTopic.id,
                title: debateTopic.title,
                description: debateTopic.description
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "获取辩题时出错: " + error.message
        });
    }
});

// 获取AI识别内容
app.get('/api/ai-content', (req, res) => {
    try {
        res.json({
            success: true,
            data: aiDebateContent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "获取AI内容时出错: " + error.message
        });
    }
});

// 添加评论
app.post('/api/comment', (req, res) => {
    const { contentId, user, text, avatar } = req.body;

    // 参数验证
    if (!contentId || !text) {
        return res.status(400).json({
            success: false,
            message: "缺少必要参数: contentId 和 text"
        });
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "评论内容不能为空"
        });
    }

    const content = aiDebateContent.find(item => item.id === String(contentId));
    if (content) {
        // 使用UUID生成唯一的评论ID
        const newComment = {
            id: uuidv4(),
            user: user || "匿名用户",
            text: text.trim(),
            time: "刚刚",
            avatar: avatar || "👤",
            likes: 0
        };

        content.comments.push(newComment);

        res.json({
            success: true,
            data: newComment
        });
    } else {
        res.status(404).json({
            success: false,
            message: "内容不存在"
        });
    }
});

// 删除评论
app.delete('/api/comment/:commentId', (req, res) => {
    const { commentId } = req.params;
    const { contentId } = req.body;

    // 参数验证
    if (!commentId || !contentId) {
        return res.status(400).json({
            success: false,
            message: "缺少必要参数: commentId 和 contentId"
        });
    }

    const content = aiDebateContent.find(item => item.id === String(contentId));
    if (!content) {
        return res.status(404).json({
            success: false,
            message: "内容不存在"
        });
    }

    const commentIndex = content.comments.findIndex(c => c.id === String(commentId));
    if (commentIndex === -1) {
        return res.status(404).json({
            success: false,
            message: "评论不存在"
        });
    }

    // 删除评论
    const deletedComment = content.comments.splice(commentIndex, 1)[0];

    res.json({
        success: true,
        data: {
            message: "评论删除成功",
            deletedComment: deletedComment
        }
    });
});

// 点赞
app.post('/api/like', (req, res) => {
    const { contentId, commentId } = req.body;

    // 参数验证
    if (!contentId) {
        return res.status(400).json({
            success: false,
            message: "缺少必要参数: contentId"
        });
    }

    const content = aiDebateContent.find(item => item.id === contentId);
    if (content) {
        if (commentId !== undefined && commentId !== null) {
            // 评论点赞
            const comment = content.comments.find(c => c.id === commentId);
            if (comment) {
                comment.likes += 1;
                res.json({
                    success: true,
                    data: { likes: comment.likes }
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: "评论不存在"
                });
            }
        } else {
            // 内容点赞
            content.likes += 1;
            res.json({
                success: true,
                data: { likes: content.likes }
            });
        }
    } else {
        res.status(404).json({
            success: false,
            message: "内容不存在"
        });
    }
});

// ==================== 微信登录辅助函数 ====================

/**
 * 调用微信API获取openid和session_key
 * @param {string} appid - 微信小程序AppID
 * @param {string} secret - 微信小程序AppSecret
 * @param {string} code - 微信登录code
 * @returns {Promise<Object>} 微信API响应数据
 */
function callWechatAPI(appid, secret, code) {
    return new Promise((resolve, reject) => {
        const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    reject(new Error('解析微信API响应失败: ' + error.message));
                }
            });
        }).on('error', (error) => {
            reject(new Error('调用微信API失败: ' + error.message));
        });
    });
}

// 微信配置（从统一配置文件获取）
const WECHAT_CONFIG = {
    appid: serverConfig.wechat.appid,
    secret: process.env.WECHAT_SECRET || serverConfig.wechat.secret,
    useMock: serverConfig.wechat.useMock
};

// 微信登录接口
app.post('/api/wechat-login', async (req, res) => {
    const { code, userInfo, encryptedData, iv } = req.body;

    // 参数验证
    if (!code) {
        return res.status(400).json({
            success: false,
            message: "缺少必要参数: code"
        });
    }

    try {
        console.log('═══════════════════════════════════════');
        console.log('微信登录请求收到');
        console.log('═══════════════════════════════════════');
        console.log('Code:', code);
        console.log('UserInfo:', userInfo?.nickName);
        console.log('useMock 配置:', WECHAT_CONFIG.useMock);
        console.log('═══════════════════════════════════════');
        
        let wechatData = null;
        
        // 根据配置决定使用模拟模式还是真实微信API
        if (WECHAT_CONFIG.useMock) {
            // 使用模拟模式（用于开发测试）
            console.log('✅ 使用模拟微信登录响应（开发模式）');
            
            // 模拟微信API响应
            wechatData = {
                openid: 'mock_openid_' + Date.now(),
                session_key: 'mock_session_key_' + Math.random().toString(36).substr(2, 9),
                // 注意：真实API不会返回unionid，除非用户已绑定开放平台
            };
            
            console.log('模拟数据生成成功:', {
                openid: wechatData.openid,
                session_key: wechatData.session_key.substring(0, 10) + '...'
            });
        } else {
            // 使用真实微信API
            console.log('🌐 调用真实微信登录API');
            console.log('AppID:', WECHAT_CONFIG.appid);
            
            try {
                const apiResult = await callWechatAPI(WECHAT_CONFIG.appid, WECHAT_CONFIG.secret, code);
                
                // 检查微信API返回的错误
                if (apiResult.errcode) {
                    console.error('微信API返回错误:', apiResult);
                    return res.status(400).json({
                        success: false,
                        message: `微信登录失败: ${apiResult.errmsg || '未知错误'} (错误码: ${apiResult.errcode})`
                    });
                }
                
                // 成功获取微信数据
                wechatData = {
                    openid: apiResult.openid,
                    session_key: apiResult.session_key,
                    unionid: apiResult.unionid || null
                };
                
                console.log('真实微信API调用成功:', {
                    openid: wechatData.openid,
                    hasSessionKey: !!wechatData.session_key,
                    hasUnionId: !!wechatData.unionid
                });
            } catch (error) {
                console.error('调用真实微信API失败:', error);
                return res.status(500).json({
                    success: false,
                    message: `调用微信API失败: ${error.message}`
                });
            }
        }
        
        // 保存用户到数据库（在管理系统中显示）
        const db = require('./admin/db.js');
        const userId = wechatData.openid; // 使用openid作为用户ID
        if (userId) {
            db.users.createOrUpdate({
                id: userId,
                nickName: userInfo?.nickName || '微信用户',
                avatarUrl: userInfo?.avatarUrl || '/static/logo.png'
            });
        }
        
        // 返回统一的响应格式
        const response = {
            success: true,
            data: {
                openid: wechatData.openid,
                session_key: wechatData.session_key,
                unionid: wechatData.unionid || null, // 如果有开放平台，会返回unionid
                userInfo: userInfo || {
                    nickName: '微信用户',
                    avatarUrl: '/static/logo.png'
                },
                loginTime: new Date().toISOString(),
                isMock: WECHAT_CONFIG.useMock || WECHAT_CONFIG.secret === 'YOUR_APP_SECRET_HERE'
            }
        };
        
        console.log('返回登录响应:', { 
            openid: response.data.openid,
            hasUserInfo: !!userInfo,
            isMock: response.data.isMock
        });
        
        res.json(response);
        
    } catch (error) {
        console.error('微信登录处理错误:', error);
        res.status(500).json({
            success: false,
            message: "服务器处理微信登录时出错: " + error.message
        });
    }
});

// 用户投票
app.post('/api/user-vote', (req, res) => {
    const { side, votes } = req.body;

    // 参数验证
    if (!side) {
        return res.status(400).json({
            success: false,
            message: "缺少必要参数: side (必须为 'left' 或 'right')"
        });
    }

    if (side !== 'left' && side !== 'right') {
        return res.status(400).json({
            success: false,
            message: "参数错误: side 必须为 'left' 或 'right'"
        });
    }

    const voteCount = parseInt(votes) || 10;
    if (voteCount < 1 || voteCount > 1000) {
        return res.status(400).json({
            success: false,
            message: "参数错误: 投票数量必须在 1-1000 之间"
        });
    }

    // 更新数据库统计（如果已加载）
    try {
        const db = require('./admin/db.js');
        if (req.body.userId) {
            db.users.updateStats(req.body.userId, { votes: voteCount });
        }
        db.statistics.incrementVotes(voteCount);
    } catch (error) {
        // 如果数据库模块未加载，忽略错误
        console.log('统计数据更新跳过（开发模式）');
    }

    if (side === 'left') {
        currentVotes.leftVotes += voteCount;
    } else if (side === 'right') {
        currentVotes.rightVotes += voteCount;
    }

    const responseData = {
        success: true,
        data: {
            leftVotes: currentVotes.leftVotes,
            rightVotes: currentVotes.rightVotes,
            leftPercentage: currentVotes.leftVotes + currentVotes.rightVotes > 0
                ? Math.round((currentVotes.leftVotes / (currentVotes.leftVotes + currentVotes.rightVotes)) * 100)
                : 50,
            rightPercentage: currentVotes.leftVotes + currentVotes.rightVotes > 0
                ? Math.round((currentVotes.rightVotes / (currentVotes.leftVotes + currentVotes.rightVotes)) * 100)
                : 50
        }
    };

    // 广播投票更新给所有 WebSocket 客户端
    broadcast('vote-updated', {
        votes: responseData.data,
        side: side,
        voteCount: voteCount,
        userId: req.body.userId || 'anonymous'
    });

    res.json(responseData);
});

// 启动服务器
server.listen(port, '0.0.0.0', () => {
    console.log('');
    printConfig();
    console.log(`辩题: ${debateTopic.title}`);
    console.log(`状态: ✅ 服务器运行中`);
    if (wss) {
        console.log(`🌐 WebSocket 服务已启动: ws://localhost:${port}/ws`);
    }
    console.log('═══════════════════════════════════════');
    console.log('');
    
    // 只在模拟模式下启动模拟数据
    if (serverConfig.mode === 'mock') {
        simulateVoteChanges();
        simulateNewAIContent();
        console.log('🤖 模拟数据生成器已启动');
    }
    
    // 启动直播计划检查
    startScheduleCheck();
    console.log('⏰ 直播计划定时检查已启动');
});

module.exports = app;
