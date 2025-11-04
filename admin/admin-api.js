// 后台管理系统API调用模块
// 本文件包含所有与服务器交互的API函数

// 服务器配置（从admin.js继承）
const getAPIBase = () => {
	// 优先使用admin.js中的配置
	if (window.SERVER_CONFIG && window.SERVER_CONFIG.BASE_URL) {
		return window.SERVER_CONFIG.BASE_URL;
	}
	// 默认使用真实服务器（如果admin.js未加载，使用真实服务器地址）
	return 'http://192.168.31.189:8000';
};

// ==================== 通用请求函数 ====================

// 获取认证Token（如果需要）
function getAuthToken() {
	// 从localStorage或sessionStorage获取token
	if (typeof window !== 'undefined') {
		return localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || null;
	}
	return null;
}

async function apiRequest(endpoint, options = {}) {
	const API_BASE = getAPIBase();
	const url = `${API_BASE}${endpoint}`;
	
	// 准备请求头
	const headers = {
		'Content-Type': 'application/json',
		...options.headers
	};
	
	// 如果是v1接口，添加认证token（如果存在）
	if (endpoint.startsWith('/api/v1/')) {
		const token = getAuthToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	}
	
	try {
		console.log(`📡 API 请求: ${options.method || 'GET'} ${endpoint}`, options.body ? JSON.parse(options.body) : '');
		
		const response = await fetch(url, {
			...options,
			headers
		});
		
		const data = await response.json();
		
		console.log('📦 API 原始响应:', {
			status: response.status,
			statusText: response.statusText,
			data: data
		});
		
		if (!response.ok) {
			const errorMsg = data.message || data.error || `请求失败: ${response.status}`;
			console.error(`❌ HTTP 错误 (${response.status}):`, errorMsg, data);
			throw new Error(errorMsg);
		}
		
		// 检查是否有success字段，如果没有但数据存在，可能是旧格式
		if (data.success === false) {
			throw new Error(data.message || '请求失败');
		}
		
		// 如果没有success字段但有数据，尝试兼容处理
		if (data.success === undefined && data) {
			console.warn('⚠️ API响应缺少success字段，尝试兼容处理:', data);
			// 如果返回的是数组或对象（但不是错误对象），直接返回
			if (Array.isArray(data) || (typeof data === 'object' && !data.error && !data.message)) {
				return data;
			}
		}
		
		// 如果data.success为true，返回data.data，否则返回整个data
		const result = data.success !== undefined ? (data.data || data) : data;
		console.log('✅ API 响应成功:', result);
		return result;
		
	} catch (error) {
		console.error(`❌ API 错误 (${endpoint}):`, error);
		return null;
	}
}

// ==================== 直播控制接口 ====================

/**
 * 开始直播
 * @param {string|null} streamId - 直播流ID（多直播模式下必填）
 * @param {boolean} autoStartAI - 是否自动启动AI识别
 * @param {boolean} notifyUsers - 是否推送通知给用户
 * @returns {Promise<Object|null>}
 */
async function startLive(streamId = null, autoStartAI = false, notifyUsers = true) {
	// 多直播支持：如果未指定 streamId，尝试获取默认的启用流
	if (!streamId) {
		console.warn('⚠️ 未指定 streamId，将使用后端默认的启用流');
	}
	
	return await apiRequest('/api/v1/admin/live/start', {
		method: 'POST',
		body: JSON.stringify({
			streamId,
			autoStartAI,
			notifyUsers
		})
	});
}

/**
 * 停止直播
 * @param {string|null} streamId - 直播流ID（多直播模式下必填，如果为null则停止当前直播）
 * @param {boolean} saveStatistics - 是否保存统计数据
 * @param {boolean} notifyUsers - 是否推送通知给用户
 * @returns {Promise<Object|null>}
 */
async function stopLive(streamId = null, saveStatistics = true, notifyUsers = true) {
	// 多直播支持：streamId 参数
	if (!streamId) {
		console.warn('⚠️ 未指定 streamId，将停止当前正在进行的直播');
	}
	
	return await apiRequest('/api/v1/admin/live/stop', {
		method: 'POST',
		body: JSON.stringify({
			streamId,
			saveStatistics,
			notifyUsers
		})
	});
}

/**
 * 更新投票数据
 * @param {string} action - 操作类型：'set'(设置) | 'add'(增加) | 'reset'(重置)
 * @param {number} leftVotes - 正方票数
 * @param {number} rightVotes - 反方票数
 * @param {string} reason - 操作原因
 * @param {boolean} notifyUsers - 是否推送通知给用户
 * @returns {Promise<Object|null>}
 */
async function updateVotes(action, leftVotes, rightVotes, reason = '', notifyUsers = true) {
	return await apiRequest('/api/admin/live/update-votes', {
		method: 'POST',
		body: JSON.stringify({
			action,
			leftVotes,
			rightVotes,
			reason,
			notifyUsers
		})
	});
}

/**
 * 重置投票数据
 * @param {number} leftVotes - 重置为的正方票数（默认0）
 * @param {number} rightVotes - 重置为的反方票数（默认0）
 * @param {boolean} saveBackup - 是否备份当前数据
 * @param {boolean} notifyUsers - 是否推送通知给用户
 * @returns {Promise<Object|null>}
 */
async function resetVotes(leftVotes = 0, rightVotes = 0, saveBackup = true, notifyUsers = true) {
	return await apiRequest('/api/admin/live/reset-votes', {
		method: 'POST',
		body: JSON.stringify({
			resetTo: {
				leftVotes,
				rightVotes
			},
			saveBackup,
			notifyUsers
		})
	});
}

// ==================== AI控制接口 ====================

/**
 * 启动AI识别
 * @param {Object} settings - AI设置
 * @param {boolean} notifyUsers - 是否推送通知给用户
 * @returns {Promise<Object|null>}
 */
async function startAI(settings = {}, notifyUsers = true) {
	return await apiRequest('/api/admin/ai/start', {
		method: 'POST',
		body: JSON.stringify({
			settings: {
				mode: settings.mode || 'realtime',
				interval: settings.interval || 5000,
				sensitivity: settings.sensitivity || 'high',
				minConfidence: settings.minConfidence || 0.7
			},
			notifyUsers
		})
	});
}

/**
 * 停止AI识别
 * @param {boolean} saveHistory - 是否保存历史
 * @param {boolean} notifyUsers - 是否推送通知给用户
 * @returns {Promise<Object|null>}
 */
async function stopAI(saveHistory = true, notifyUsers = true) {
	return await apiRequest('/api/admin/ai/stop', {
		method: 'POST',
		body: JSON.stringify({
			saveHistory,
			notifyUsers
		})
	});
}

/**
 * 暂停/恢复AI识别
 * @param {string} action - 'pause'(暂停) | 'resume'(恢复)
 * @param {boolean} notifyUsers - 是否推送通知给用户
 * @returns {Promise<Object|null>}
 */
async function toggleAI(action, notifyUsers = true) {
	return await apiRequest('/api/admin/ai/toggle', {
		method: 'POST',
		body: JSON.stringify({
			action,
			notifyUsers
		})
	});
}

/**
 * 删除AI内容
 * @param {string} contentId - 内容ID
 * @param {string} reason - 删除原因
 * @param {boolean} notifyUsers - 是否推送通知给用户
 * @returns {Promise<Object|null>}
 */
async function deleteAIContent(contentId, reason = '管理员删除', notifyUsers = true) {
	return await apiRequest(`/api/admin/ai/content/${contentId}`, {
		method: 'DELETE',
		body: JSON.stringify({
			reason,
			notifyUsers
		})
	});
}

// ==================== 数据查询接口 ====================

/**
 * 获取数据概览
 * @returns {Promise<Object|null>}
 */
async function fetchDashboard() {
	return await apiRequest('/api/admin/dashboard', {
		method: 'GET'
	});
}

/**
 * 获取用户列表
 * @param {number} page - 页码（从1开始）
 * @param {number} pageSize - 每页数量
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Object|null>}
 */
async function fetchUserList(page = 1, pageSize = 20, filters = {}) {
	const queryParams = new URLSearchParams({
		page,
		pageSize,
		...filters
	});
	
	return await apiRequest(`/api/admin/miniprogram/users?${queryParams}`, {
		method: 'GET'
	});
}

/**
 * 获取投票统计
 * @param {string} timeRange - 时间范围：'1h'|'6h'|'12h'|'24h'|'7d'
 * @returns {Promise<Object|null>}
 */
async function fetchVotesStatistics(timeRange = '1h') {
	return await apiRequest(`/api/admin/votes/statistics?timeRange=${timeRange}`, {
		method: 'GET'
	});
}

/**
 * 获取AI内容列表
 * @param {number} page - 页码（从1开始）
 * @param {number} pageSize - 每页数量
 * @param {string|null} startTime - 开始时间（可选，ISO格式：2024-01-01T00:00:00）
 * @param {string|null} endTime - 结束时间（可选，ISO格式：2024-01-01T23:59:59）
 * @returns {Promise<Object|null>}
 */
async function fetchAIContentList(page = 1, pageSize = 20, startTime = null, endTime = null) {
	const queryParams = new URLSearchParams({
		page: page.toString(),
		pageSize: pageSize.toString()
	});
	
	if (startTime) queryParams.append('startTime', startTime);
	if (endTime) queryParams.append('endTime', endTime);
	
	// 使用新的API路径 /api/v1/admin/ai-content/list
	return await apiRequest(`/api/v1/admin/ai-content/list?${queryParams}`, {
		method: 'GET'
	});
}

/**
 * 获取AI内容评论列表
 * @param {string} contentId - AI内容ID
 * @param {number} page - 页码（从1开始）
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object|null>} 返回 { contentId, contentText, total, page, pageSize, comments }
 */
async function fetchAIContentComments(contentId, page = 1, pageSize = 20) {
	const queryParams = new URLSearchParams({
		page: page.toString(),
		pageSize: pageSize.toString()
	});
	
	// 使用新的API路径 /api/v1/admin/ai-content/{content_id}/comments
	return await apiRequest(`/api/v1/admin/ai-content/${contentId}/comments?${queryParams}`, {
		method: 'GET'
	});
}

/**
 * 删除AI内容评论
 * @param {string} contentId - AI内容ID
 * @param {string} commentId - 评论ID
 * @param {string} reason - 删除原因
 * @param {boolean} notifyUsers - 是否通知用户
 * @returns {Promise<Object|null>}
 */
async function deleteAIContentComment(contentId, commentId, reason = '', notifyUsers = true) {
	// 使用新的API路径 /api/v1/admin/ai-content/{content_id}/comments/{comment_id}
	return await apiRequest(`/api/v1/admin/ai-content/${contentId}/comments/${commentId}`, {
		method: 'DELETE',
		body: JSON.stringify({
			reason,
			notifyUsers
		})
	});
}

// ==================== 直播流管理接口 ====================

/**
 * 获取直播流列表
 * @returns {Promise<Array|null>}
 */
async function getStreamsList() {
	return await apiRequest('/api/admin/streams', {
		method: 'GET'
	});
}

/**
 * 添加直播流
 * @param {Object} streamData - 直播流数据
 * @returns {Promise<Object|null>}
 */
async function addStream(streamData) {
	return await apiRequest('/api/admin/streams', {
		method: 'POST',
		body: JSON.stringify(streamData)
	});
}

/**
 * 更新直播流
 * @param {string} streamId - 直播流ID
 * @param {Object} streamData - 直播流数据
 * @returns {Promise<Object|null>}
 */
async function updateStream(streamId, streamData) {
	return await apiRequest(`/api/admin/streams/${streamId}`, {
		method: 'PUT',
		body: JSON.stringify(streamData)
	});
}

/**
 * 删除直播流
 * @param {string} streamId - 直播流ID
 * @returns {Promise<Object|null>}
 */
async function deleteStream(streamId) {
	return await apiRequest(`/api/admin/streams/${streamId}`, {
		method: 'DELETE'
	});
}

/**
 * 切换直播流启用状态
 * @param {string} streamId - 直播流ID
 * @returns {Promise<Object|null>}
 */
async function toggleStream(streamId) {
	return await apiRequest(`/api/admin/streams/${streamId}/toggle`, {
		method: 'POST'
	});
}

// ==================== 辅助功能 ====================

// 全局状态（用于UI显示）- 如果admin.js已经声明，则使用已有的
// 如果还没有声明，则创建一个简单的版本（admin.js加载后会覆盖）
if (typeof window.globalState === 'undefined') {
	window.globalState = {
		isLive: false,
		aiStatus: 'stopped'
	};
}

// WebSocket 消息处理（与 admin.js 集成）
if (window.ws) {
	// 监听WebSocket消息更新全局状态
	const originalOnMessage = window.ws.onmessage;
	window.ws.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			
			// 更新全局状态
			if (data.type === 'liveStatus' && window.globalState) {
				window.globalState.isLive = data.data.isLive;
			}
			
			if (data.type === 'aiStatus' && window.globalState) {
				window.globalState.aiStatus = data.data.status;
				// 更新UI按钮状态
				if (typeof updateAIControlButtons === 'function') {
					updateAIControlButtons(data.data.status);
				}
			}
			
			if (data.type === 'votesUpdate') {
				// 更新票数显示
				if (typeof updateVotesDisplay === 'function') {
					updateVotesDisplay(data.data);
				}
			}
			
			// 调用原始处理器
			if (originalOnMessage) {
				originalOnMessage.call(window.ws, event);
			}
		} catch (error) {
			console.error('WebSocket 消息处理错误:', error);
		}
	};
}

console.log('✅ 后台管理系统API模块加载完成');
console.log('📡 当前API服务器:', getAPIBase());

