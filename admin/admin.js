// 后台管理系统主逻辑
// 服务器配置
const SERVER_CONFIG = {
	// 本地开发时使用
	LOCAL_URL: 'http://localhost:8080',
	// 真实服务器地址（后端开发完成后使用）
	REAL_URL: 'http://192.168.31.189:8000',
	// 当前使用的地址（修改这里切换服务器）
	get BASE_URL() {
		return this.REAL_URL; // 切换到 REAL_URL 使用真实服务器
	}
};

// 将配置挂载到 window 对象，供其他脚本使用
window.SERVER_CONFIG = SERVER_CONFIG;

const API_BASE = `${SERVER_CONFIG.BASE_URL}/api/admin`;

// 全局状态（如果admin-api.js已经创建了简单的版本，这里会覆盖它）
const globalState = window.globalState || {
	isLive: false,
	liveId: null,
	aiStatus: 'stopped', // stopped / running / paused
	aiSessionId: null,
	currentVotes: {
		leftVotes: 0,
		rightVotes: 0
	}
};

// 扩展globalState对象，添加缺失的属性
globalState.liveId = globalState.liveId || null;
globalState.aiSessionId = globalState.aiSessionId || null;
globalState.currentVotes = globalState.currentVotes || {
	leftVotes: 0,
	rightVotes: 0
};

// 确保window.globalState引用的是这个对象
window.globalState = globalState;

// WebSocket 连接
let ws = null;
let wsReconnectTimer = null;

// 页面导航
document.addEventListener('DOMContentLoaded', () => {
	initNavigation();
	loadDashboard();
	initWebSocket();
	// 仍然保留定时更新作为后备（如果 WebSocket 断开）
	setInterval(updateDashboard, 10000); // 每10秒更新一次数据作为后备
});

// 初始化 WebSocket 连接
function initWebSocket() {
	// 从服务器配置获取WebSocket地址
	try {
	const baseUrl = new URL(SERVER_CONFIG.BASE_URL);
	const protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
	const wsUrl = `${protocol}//${baseUrl.host}/ws`;
	
	console.log('🔌 连接WebSocket:', wsUrl);
	
		// 如果已有连接，先关闭
		if (ws && ws.readyState !== WebSocket.CLOSED) {
			try {
				ws.close();
			} catch (e) {
				console.warn('关闭旧WebSocket连接时出错:', e);
			}
		}
		
		ws = new WebSocket(wsUrl);
		
		ws.onopen = () => {
			console.log('✅ WebSocket 已连接');
			clearTimeout(wsReconnectTimer);
			updateConnectionStatus(true);
		};
		
		ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				handleWebSocketMessage(message);
			} catch (error) {
				console.error('WebSocket 消息解析失败:', error);
			}
		};
		
		ws.onerror = (error) => {
			console.error('WebSocket 错误:', error);
			updateConnectionStatus(false);
		};
		
		ws.onclose = (event) => {
			console.log('WebSocket 已断开，5秒后尝试重连...', event.code, event.reason);
			updateConnectionStatus(false);
			// 5秒后尝试重连（如果不是主动关闭）
			if (event.code !== 1000) {
			wsReconnectTimer = setTimeout(() => {
				initWebSocket();
			}, 5000);
			}
		};
		
		// 心跳保持连接（只设置一次）
		if (!window.wsHeartbeatInterval) {
			window.wsHeartbeatInterval = setInterval(() => {
			if (ws && ws.readyState === WebSocket.OPEN) {
					try {
				ws.send(JSON.stringify({ type: 'ping' }));
					} catch (error) {
						console.error('发送心跳失败:', error);
					}
			}
		}, 30000); // 每30秒发送一次 ping
		}
		
	} catch (error) {
		console.error('WebSocket 初始化失败:', error);
		updateConnectionStatus(false);
		// 如果URL解析失败，5秒后重试
		wsReconnectTimer = setTimeout(() => {
			initWebSocket();
		}, 5000);
	}
}

// 更新连接状态显示
function updateConnectionStatus(connected) {
	const statusIndicator = document.querySelector('.status-indicator');
	if (statusIndicator) {
		const statusDot = statusIndicator.querySelector('.status-dot');
		if (statusDot) {
			statusDot.style.backgroundColor = connected ? '#4CAF50' : '#f44336';
		}
	}
}

// 处理 WebSocket 消息
function handleWebSocketMessage(message) {
	console.log('📨 收到WebSocket消息:', message.type, message.data);
	
	switch (message.type) {
		case 'connected':
			console.log('✅', message.message);
			break;
		case 'state':
			// 初始状态同步
			updateDashboardFromState(message.data);
			if (message.data.liveStatus) {
				globalState.isLive = true;
			}
			if (message.data.votes) {
				globalState.currentVotes = message.data.votes;
			}
			break;
		case 'live-started':
			// 直播开始
			globalState.isLive = true;
			globalState.liveId = message.data.liveId;
			updateLiveStatus({ status: 'started', streamUrl: message.data.streamUrl });
			showNotification('直播已开始', 'success');
			loadDashboard();
			break;
		case 'live-stopped':
			// 直播停止
			globalState.isLive = false;
			globalState.liveId = null;
			updateLiveStatus({ status: 'stopped' });
			showNotification('直播已停止', 'info');
			loadDashboard();
			break;
		case 'votes-updated':
			// 投票数据更新
			globalState.currentVotes = {
				leftVotes: message.data.leftVotes,
				rightVotes: message.data.rightVotes
			};
			updateVotesDisplay(message.data);
			showNotification('票数已更新', 'success');
			break;
		case 'ai-started':
			// AI识别启动
			globalState.aiStatus = 'running';
			globalState.aiSessionId = message.data.aiSessionId;
			updateAIStatus('running');
			showNotification('AI识别已启动', 'success');
			break;
		case 'ai-stopped':
			// AI识别停止
			globalState.aiStatus = 'stopped';
			globalState.aiSessionId = null;
			updateAIStatus('stopped');
			showNotification('AI识别已停止', 'info');
			break;
		case 'ai-status-changed':
			// AI状态变更
			globalState.aiStatus = message.data.status;
			updateAIStatus(message.data.status);
			showNotification(`AI识别已${message.data.status === 'paused' ? '暂停' : '恢复'}`, 'info');
			break;
		case 'ai-content-added':
			// AI内容添加
			showNotification('新的AI内容已生成', 'info');
			if (document.getElementById('ai-content').classList.contains('active')) {
				loadAIContent();
			}
			break;
		case 'ai-content-deleted':
			// AI内容删除
			showNotification('AI内容已删除', 'info');
			if (document.getElementById('ai-content').classList.contains('active')) {
				loadAIContent();
			}
			break;
		case 'vote-updated':
			// 实时投票更新（兼容旧格式）
			if (message.data.votes) {
				updateVotesDisplay(message.data.votes);
			}
			break;
		case 'live-status-changed':
			// 直播状态变化（兼容旧格式）
			updateLiveStatus(message.data);
			break;
		case 'debate-updated':
			// 辩论设置更新
			updateDebateSettings(message.data.debate);
			break;
		case 'live-schedule-updated':
			// 直播计划更新
			if (document.getElementById('live-setup').classList.contains('active')) {
				loadLiveSetup();
			}
			loadLiveStatus();
			break;
		case 'live-schedule-cancelled':
			// 直播计划取消
			if (document.getElementById('live-setup').classList.contains('active')) {
				loadLiveSetup();
			}
			loadLiveStatus();
			break;
		case 'ai-content-added':
		case 'ai-content-updated':
			// AI 内容添加/更新
			if (document.getElementById('ai-content').classList.contains('active')) {
				loadAIContent();
			}
			break;
		case 'ai-content-deleted':
			// AI 内容删除
			if (document.getElementById('ai-content').classList.contains('active')) {
				loadAIContent();
			}
			break;
		case 'pong':
			// 心跳响应
			break;
		default:
			console.log('未知的 WebSocket 消息类型:', message.type);
	}
}

// 从状态更新仪表板
function updateDashboardFromState(data) {
	if (data.votes) {
		updateVotesDisplay(data.votes);
	}
	if (data.dashboard) {
		updateDashboardDisplay(data.dashboard);
	}
	if (data.debate) {
		// 如果当前在辩论设置页面，更新表单
		const debatePage = document.getElementById('debate');
		if (debatePage && debatePage.classList.contains('active')) {
			updateDebateForm(data.debate);
		}
	}
}

// 更新投票显示
function updateVotesDisplay(votes) {
	// 更新总投票数
	const totalVotesEl = document.getElementById('total-votes');
	if (totalVotesEl) {
		// 如果没有 totalVotes，则计算 leftVotes + rightVotes
		const totalVotes = votes.totalVotes || ((votes.leftVotes || 0) + (votes.rightVotes || 0));
		totalVotesEl.textContent = totalVotes;
	}
	
	// 更新实时投票趋势图（如果有）
	updateVotesChart(votes);
}

// 更新直播状态
function updateLiveStatus(data) {
	const statusText = document.getElementById('live-status-text');
	const liveStatusEl = document.getElementById('live-status');
	
	if (data.status === 'started') {
		currentLiveStatus = true;
		if (statusText) statusText.textContent = '🟢 直播中';
		if (liveStatusEl) liveStatusEl.textContent = '🟢 直播中';
		updateLiveControlButton(true);
		showNotification('直播已开始', 'success');
	} else if (data.status === 'stopped') {
		currentLiveStatus = false;
		if (statusText) statusText.textContent = '⚪ 未开播';
		if (liveStatusEl) liveStatusEl.textContent = '⚪ 未开播';
		updateLiveControlButton(false);
		showNotification('直播已停止', 'info');
	}
}

// 更新辩论设置
function updateDebateSettings(debate) {
	updateDebateForm(debate);
	showNotification('辩论设置已更新', 'success');
}

// 更新辩论表单
function updateDebateForm(debate) {
	if (!debate) return;
	
	const titleInput = document.getElementById('debate-title');
	const descInput = document.getElementById('debate-description');
	const leftInput = document.getElementById('left-position');
	const rightInput = document.getElementById('right-position');
	
	if (titleInput) titleInput.value = debate.title || '';
	if (descInput) descInput.value = debate.description || '';
	if (leftInput) leftInput.value = debate.leftPosition || '';
	if (rightInput) rightInput.value = debate.rightPosition || '';
}

// 更新仪表板显示
function updateDashboardDisplay(dashboard) {
	if (!dashboard) return;
	
	const totalUsersEl = document.getElementById('total-users');
	const liveStatusEl = document.getElementById('live-status');
	const totalVotesEl = document.getElementById('total-votes');
	const activeUsersEl = document.getElementById('active-users');
	const liveStatusTextEl = document.getElementById('live-status-text');
	
	if (totalUsersEl) totalUsersEl.textContent = dashboard.totalUsers || 0;
	if (liveStatusEl) liveStatusEl.textContent = dashboard.isLive ? '🟢 直播中' : '⚪ 未开播';
	if (totalVotesEl) totalVotesEl.textContent = dashboard.totalVotes || 0;
	if (activeUsersEl) activeUsersEl.textContent = dashboard.activeUsers || 0;
	if (liveStatusTextEl) liveStatusTextEl.textContent = dashboard.isLive ? '直播中' : '未开播';
}

// 更新投票图表（简单实现，可以根据需要扩展）
function updateVotesChart(votes) {
	// 这里可以更新图表数据
	// 例如使用 Chart.js 等图表库
}

// 初始化导航
function initNavigation() {
	const navItems = document.querySelectorAll('.nav-item');
	const pages = document.querySelectorAll('.page');
	const pageTitle = document.querySelector('.page-title');

	navItems.forEach(item => {
		item.addEventListener('click', (e) => {
			e.preventDefault();
			const targetPage = item.getAttribute('data-page');
			
			// 更新导航状态
			navItems.forEach(nav => nav.classList.remove('active'));
			item.classList.add('active');
			
			// 切换页面
			pages.forEach(page => page.classList.remove('active'));
			document.getElementById(targetPage).classList.add('active');
			
			// 更新标题
			const titles = {
				'dashboard': '数据概览',
				'live-setup': '直播设置',
				'users': '用户管理',
				'votes': '票数管理',
				'ai-content': 'AI 内容管理',
				'statistics': '数据统计'
			};
			pageTitle.textContent = titles[targetPage] || '管理后台';
			
			// 加载对应页面数据
			loadPageData(targetPage);
		});
	});
}

// 加载页面数据
function loadPageData(page) {
	switch(page) {
		case 'dashboard':
				if (currentLiveStatus) {
			loadDashboard();
				} else {
					document.getElementById('dashboard-container') && (document.getElementById('dashboard-container').innerHTML = '<div style="color: #FF9800; padding: 40px 0; text-align: center;">直播未开始，无需实时监控～</div>');
				}
			break;
			case 'live-setup':
				loadLiveSetup();
			break;
		case 'users':
			loadUsers();
			break;
		case 'votes':
			if (currentLiveStatus) {
				loadVotes();
				startVotesAutoRefresh();
			} else {
				stopVotesAutoRefresh();
				document.getElementById('votes-container') && (document.getElementById('votes-container').innerHTML = '<div style="color: #FF9800; padding: 40px 0; text-align: center;">直播未开始，无需实时监控票数～</div>');
			}
			break;
		case 'stream-manage':
			loadStreamsList();
			break;
		case 'ai-content':
			loadAIContent();
			break;
		case 'statistics':
			loadStatistics();
			break;
	}
}

// ==================== 数据概览 ====================
async function loadDashboard() {
	try {
		const data = await fetchDashboard();
		if (!data) return;
		
		// 更新直播状态
		if (data.isLive !== undefined) {
			currentLiveStatus = data.isLive;
			globalState.isLive = data.isLive; // 同时更新 globalState，确保按钮状态正确
		}
		
		document.getElementById('total-users').textContent = data.totalUsers || 0;
		document.getElementById('live-status').textContent = data.isLive ? '🟢 直播中' : '⚪ 未开播';
		document.getElementById('total-votes').textContent = data.totalVotes || 0;
		document.getElementById('active-users').textContent = data.activeUsers || 0;
		document.getElementById('live-status-text').textContent = data.isLive ? '直播中' : '未开播';
		
		// 更新直播控制按钮状态
		updateLiveControlButton(data.isLive);
		
		// 更新票数显示
		if (data.leftVotes !== undefined && data.rightVotes !== undefined) {
			globalState.currentVotes = {
				leftVotes: data.leftVotes,
				rightVotes: data.rightVotes
			};
		}
		
		// 更新AI状态
		if (data.aiStatus) {
			globalState.aiStatus = data.aiStatus;
			if (typeof updateAIControlButtons === 'function') {
				updateAIControlButtons(data.aiStatus);
			}
		}
	} catch (error) {
		console.error('加载概览数据失败:', error);
	}
}

async function updateDashboard() {
	if (document.getElementById('dashboard').classList.contains('active')) {
		await loadDashboard();
	}
}

// ==================== 直播流管理 ====================
async function loadStreams() {
	try {
		const response = await fetch(`${API_BASE}/streams`);
		const streams = await response.json();
		
		const streamList = document.getElementById('stream-list');
		streamList.innerHTML = '';
		
		if (streams.length === 0) {
			streamList.innerHTML = '<div class="empty-state">暂无直播流，点击"添加直播流"开始</div>';
			return;
		}
		
		streams.forEach(stream => {
			const streamCard = createStreamCard(stream);
			streamList.appendChild(streamCard);
		});
	} catch (error) {
		console.error('加载直播流失败:', error);
		showNotification('加载失败', 'error');
	}
}

function createStreamCard(stream) {
	const card = document.createElement('div');
	card.className = 'stream-card';
	card.innerHTML = `
		<div class="stream-card-header">
			<h3>${stream.name}</h3>
			<div class="stream-status ${stream.enabled ? 'enabled' : 'disabled'}">
				<span class="status-dot"></span>
				${stream.enabled ? '已启用' : '已禁用'}
			</div>
		</div>
		<div class="stream-card-body">
			<div class="stream-info">
				<label>流地址:</label>
				<code class="stream-url">${stream.url}</code>
			</div>
			<div class="stream-info">
				<label>类型:</label>
				<span class="stream-type">${stream.type.toUpperCase()}</span>
			</div>
			<div class="stream-info">
				<label>创建时间:</label>
				<span>${new Date(stream.createdAt).toLocaleString()}</span>
			</div>
		</div>
		<div class="stream-card-actions">
			<button class="btn btn-sm btn-primary" onclick='editStream("${stream.id}")'>编辑</button>
			<button class="btn btn-sm btn-secondary" onclick='toggleStream("${stream.id}")'>
				${stream.enabled ? '禁用' : '启用'}
			</button>
			<button class="btn btn-sm btn-danger" onclick='deleteStream("${stream.id}")'>删除</button>
		</div>
	`;
	return card;
}

// 添加/编辑直播流
document.getElementById('add-stream-btn')?.addEventListener('click', () => {
	openStreamModal();
});

document.getElementById('stream-form')?.addEventListener('submit', async (e) => {
	e.preventDefault();
	
	const streamData = {
		id: document.getElementById('stream-id').value || undefined,
		name: document.getElementById('stream-name').value,
		url: document.getElementById('stream-url').value,
		type: document.getElementById('stream-type').value,
		enabled: document.getElementById('stream-enabled').checked
	};
	
	try {
		const url = streamData.id 
			? `${API_BASE}/streams/${streamData.id}`
			: `${API_BASE}/streams`;
		
		const method = streamData.id ? 'PUT' : 'POST';
		
		const response = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(streamData)
		});
		
		if (response.ok) {
			showNotification('保存成功', 'success');
			closeStreamModal();
			loadStreams();
		} else {
			throw new Error('保存失败');
		}
	} catch (error) {
		console.error('保存失败:', error);
		showNotification('保存失败', 'error');
	}
});

function openStreamModal(stream = null) {
	const modal = document.getElementById('stream-modal');
	if (stream) {
		document.getElementById('stream-id').value = stream.id;
		document.getElementById('stream-name').value = stream.name;
		document.getElementById('stream-url').value = stream.url;
		document.getElementById('stream-type').value = stream.type;
		document.getElementById('stream-enabled').checked = stream.enabled;
	} else {
		document.getElementById('stream-form').reset();
		document.getElementById('stream-id').value = '';
	}
	modal.classList.add('show');
}

function closeStreamModal() {
	document.getElementById('stream-modal').classList.remove('show');
}

document.querySelector('.modal-close')?.addEventListener('click', closeStreamModal);
document.getElementById('cancel-stream-btn')?.addEventListener('click', closeStreamModal);

async function editStream(id) {
	try {
		const response = await fetch(`${API_BASE}/streams/${id}`);
		const stream = await response.json();
		openStreamModal(stream);
	} catch (error) {
		console.error('加载直播流失败:', error);
		showNotification('加载失败', 'error');
	}
}

async function toggleStream(id) {
	try {
		const response = await fetch(`${API_BASE}/streams/${id}/toggle`, {
			method: 'POST'
		});
		if (response.ok) {
			showNotification('操作成功', 'success');
			loadStreams();
		}
	} catch (error) {
		console.error('操作失败:', error);
		showNotification('操作失败', 'error');
	}
}

async function deleteStream(id) {
	if (!confirm('确定要删除这个直播流吗？')) return;
	
	try {
		const response = await fetch(`${API_BASE}/streams/${id}`, {
			method: 'DELETE'
		});
		if (response.ok) {
			showNotification('删除成功', 'success');
			loadStreams();
		}
	} catch (error) {
		console.error('删除失败:', error);
		showNotification('删除失败', 'error');
	}
}

// ==================== 辩论设置 ====================
async function loadDebateSettings() {
	try {
		const response = await fetch(`${API_BASE}/debate`);
		const debate = await response.json();
		
		document.getElementById('debate-title').value = debate.title || '';
		document.getElementById('debate-description').value = debate.description || '';
		document.getElementById('left-position').value = debate.leftPosition || '';
		document.getElementById('right-position').value = debate.rightPosition || '';
	} catch (error) {
		console.error('加载辩论设置失败:', error);
	}
}

document.getElementById('save-debate-btn')?.addEventListener('click', async () => {
	const debateData = {
		title: document.getElementById('debate-title').value,
		description: document.getElementById('debate-description').value,
		leftPosition: document.getElementById('left-position').value,
		rightPosition: document.getElementById('right-position').value
	};
	
	try {
		const response = await fetch(`${API_BASE}/debate`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(debateData)
		});
		
		if (response.ok) {
			showNotification('保存成功', 'success');
			// 通过 WebSocket 通知更新（服务器端会自动广播，这里只是额外确认）
		} else {
			throw new Error('保存失败');
		}
	} catch (error) {
		console.error('保存失败:', error);
		showNotification('保存失败', 'error');
	}
});

// ==================== 直播控制 ====================
let currentLiveStatus = false;

// 加载当前直播状态
async function loadLiveStatus() {
	try {
		const data = await fetchDashboard();
		if (data && data.isLive !== undefined) {
			currentLiveStatus = data.isLive;
			updateLiveControlButton(data.isLive);
		}
	} catch (error) {
		console.error('获取直播状态失败:', error);
	}
}

// 更新直播控制按钮
function updateLiveControlButton(isLive) {
	const btn = document.getElementById('control-live-btn');
	if (!btn) return;
	
	if (isLive) {
		btn.textContent = '停止直播';
		btn.className = 'btn btn-sm btn-danger';
	} else {
		btn.textContent = '开始直播';
		btn.className = 'btn btn-sm btn-primary';
	}
}

// 控制直播状态 - 已移至admin-events.js中处理
// 使用admin-api.js中的startLive和stopLive函数
// 注意：直播控制按钮的事件监听器在 admin-events.js 的 initLiveControlEvents() 中绑定

// ==================== 直播设置整合页 ====================
async function loadLiveSetup() {
	try {
		// 加载当前直播状态
		const data = await fetchDashboard();
		if (data) {
			// 更新直播状态显示
			const statusEl = document.getElementById('live-control-status');
			if (statusEl) {
				if (data.isLive) {
					statusEl.innerHTML = '<span style="color: #4CAF50;">🟢 直播中</span>';
					// 启用/禁用按钮
					const startBtn = document.getElementById('admin-start-live-btn');
					const stopBtn = document.getElementById('admin-stop-live-btn');
					if (startBtn) startBtn.disabled = true;
					if (stopBtn) stopBtn.disabled = false;
					
					// 显示直播流信息
					if (data.liveStreamUrl) {
						const streamInfoEl = document.getElementById('live-stream-info');
						if (streamInfoEl) {
							streamInfoEl.style.display = 'block';
							const streamIdEl = document.getElementById('live-stream-id');
							const streamUrlEl = document.getElementById('live-stream-url');
							const startTimeEl = document.getElementById('live-start-time');
							if (streamIdEl) streamIdEl.textContent = data.liveId || '-';
							if (streamUrlEl) streamUrlEl.textContent = data.liveStreamUrl || '-';
							if (startTimeEl) startTimeEl.textContent = data.liveStartTime || '-';
						}
					}
		} else {
					statusEl.innerHTML = '<span style="color: #999;">⚪ 未开播</span>';
					// 启用/禁用按钮
					const startBtn = document.getElementById('admin-start-live-btn');
					const stopBtn = document.getElementById('admin-stop-live-btn');
					if (startBtn) startBtn.disabled = false;
					if (stopBtn) stopBtn.disabled = true;
					
					// 隐藏直播流信息
					const streamInfoEl = document.getElementById('live-stream-info');
					if (streamInfoEl) {
						streamInfoEl.style.display = 'none';
					}
				}
			}
		}
		
		// 如果有其他旧的表单元素，尝试加载（但这些元素可能不存在）
		const streamSelect = document.getElementById('setup-stream-id');
		if (streamSelect) {
			try {
		const streamsResponse = await fetch(`${API_BASE}/streams`);
		const streams = await streamsResponse.json();
		streamSelect.innerHTML = '<option value="">请选择直播流</option>';
		
				if (Array.isArray(streams)) {
		streams.forEach(stream => {
			if (stream.enabled) {
				const option = document.createElement('option');
				option.value = stream.id;
				option.textContent = `${stream.name} (${stream.type.toUpperCase()})`;
				streamSelect.appendChild(option);
			}
		});
				}
			} catch (error) {
				console.warn('加载直播流列表失败:', error);
			}
		}
		
		// 加载辩论设置（如果元素存在）
		const debateTitleEl = document.getElementById('setup-debate-title');
		const debateDescEl = document.getElementById('setup-debate-description');
		const leftPosEl = document.getElementById('setup-left-position');
		const rightPosEl = document.getElementById('setup-right-position');
		
		if (debateTitleEl || debateDescEl || leftPosEl || rightPosEl) {
			try {
		const debateResponse = await fetch(`${API_BASE}/debate`);
		const debate = await debateResponse.json();
		
		if (debate) {
					if (debateTitleEl) debateTitleEl.value = debate.title || '';
					if (debateDescEl) debateDescEl.value = debate.description || '';
					if (leftPosEl) leftPosEl.value = debate.leftPosition || '';
					if (rightPosEl) rightPosEl.value = debate.rightPosition || '';
				}
			} catch (error) {
				console.warn('加载辩论设置失败:', error);
			}
		}
		
	} catch (error) {
		console.error('加载直播设置失败:', error);
		showNotification('加载失败', 'error');
	}
}

// 切换“创建直播流”表单显隐
document.getElementById('setup-toggle-create-stream')?.addEventListener('click', () => {
	const form = document.getElementById('setup-create-stream-form');
	if (form) {
		form.style.display = form.style.display === 'none' ? 'block' : 'none';
	}
});

// 保存直播流并刷新下拉
async function refreshSetupStreams(selectIdToChoose) {
	const streamSelect = document.getElementById('setup-stream-id');
	if (!streamSelect) return;
	const response = await fetch(`${API_BASE}/streams`);
	const streams = await response.json();
	streamSelect.innerHTML = '<option value="">请选择直播流</option>';
	streams.forEach(stream => {
		if (stream.enabled) {
			const option = document.createElement('option');
			option.value = stream.id;
			option.textContent = `${stream.name} (${stream.type.toUpperCase()})`;
			streamSelect.appendChild(option);
		}
	});
	if (selectIdToChoose) {
		streamSelect.value = selectIdToChoose;
	}
}

document.getElementById('setup-save-stream-btn')?.addEventListener('click', async () => {
	const name = document.getElementById('setup-new-stream-name')?.value?.trim();
	const url = document.getElementById('setup-new-stream-url')?.value?.trim();
	const type = document.getElementById('setup-new-stream-type')?.value || 'hls';
	const enabled = document.getElementById('setup-new-stream-enabled')?.checked ?? true;
	if (!name || !url) {
		showNotification('请填写完整的直播流信息（名称与地址）', 'error');
		return;
	}
	try {
		const resp = await fetch(`${API_BASE}/streams`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, url, type, enabled })
		});
		if (!resp.ok) {
			throw new Error('创建直播流失败');
		}
		const created = await resp.json();
		const newId = created?.id || created?.data?.id || null;
		await refreshSetupStreams(newId);
		showNotification('直播流已创建并选用', 'success');
	} catch (e) {
		console.error('创建直播流失败:', e);
		showNotification('创建直播流失败', 'error');
	}
});

// 切换直播模式（立即开始/定时开始）
function updateLiveModeButtons() {
	const isNow = document.getElementById('live-mode-now')?.checked;
	const scheduleGroup = document.getElementById('schedule-time-group');
	const startNowBtn = document.getElementById('setup-start-now-btn');
	const scheduleBtn = document.getElementById('setup-schedule-btn');
	
	if (isNow) {
		scheduleGroup.style.display = 'none';
		if (startNowBtn) startNowBtn.style.display = 'flex';
		if (scheduleBtn) scheduleBtn.style.display = 'none';
	} else {
		scheduleGroup.style.display = 'block';
		if (startNowBtn) startNowBtn.style.display = 'none';
		if (scheduleBtn) scheduleBtn.style.display = 'flex';
	}
}

document.getElementById('live-mode-now')?.addEventListener('change', updateLiveModeButtons);
document.getElementById('live-mode-schedule')?.addEventListener('change', updateLiveModeButtons);

// 立即开始直播
document.getElementById('setup-start-now-btn')?.addEventListener('click', async () => {
	const streamId = document.getElementById('setup-stream-id').value;
	const debateTitle = document.getElementById('setup-debate-title').value;
	const debateDescription = document.getElementById('setup-debate-description').value;
	const leftPosition = document.getElementById('setup-left-position').value;
	const rightPosition = document.getElementById('setup-right-position').value;
	
	// 验证必填字段
	if (!streamId) {
		showNotification('请选择直播流', 'error');
		return;
	}
	if (!debateTitle || !leftPosition || !rightPosition) {
		showNotification('请填写完整的辩论设置（辩题标题、正方立场、反方立场）', 'error');
		return;
	}
	
	if (!confirm('确定要立即开始直播吗？这将设置当前直播流和辩论，并立即开始直播。')) {
		return;
	}
	
	try {
		// 先设置辩论
		await fetch(`${API_BASE}/debate`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: debateTitle,
				description: debateDescription,
				leftPosition: leftPosition,
				rightPosition: rightPosition
			})
		});
		
		// 然后开始直播
		const response = await fetch(`${API_BASE}/live/setup-and-start`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				streamId: streamId,
				startNow: true
			})
		});
		
		const result = await response.json();
		if (result.success) {
			showNotification('直播已开始！', 'success');
			loadLiveStatus();
		} else {
			throw new Error(result.error || '开始直播失败');
		}
	} catch (error) {
		console.error('开始直播失败:', error);
		showNotification('开始直播失败: ' + error.message, 'error');
	}
});

// 保存并设置定时开始（或保存设置，取决于选择的模式）
document.getElementById('setup-schedule-btn')?.addEventListener('click', async () => {
	const streamId = document.getElementById('setup-stream-id').value;
	const debateTitle = document.getElementById('setup-debate-title').value;
	const debateDescription = document.getElementById('setup-debate-description').value;
	const leftPosition = document.getElementById('setup-left-position').value;
	const rightPosition = document.getElementById('setup-right-position').value;
	const isSchedule = document.getElementById('live-mode-schedule').checked;
	
	// 验证必填字段
	if (!streamId) {
		showNotification('请选择直播流', 'error');
		return;
	}
	if (!debateTitle || !leftPosition || !rightPosition) {
		showNotification('请填写完整的辩论设置（辩题标题、正方立场、反方立场）', 'error');
		return;
	}
	
	let scheduledStartTime = null;
	let scheduledEndTime = null;
	
	if (isSchedule) {
		const startTime = document.getElementById('setup-start-time').value;
		if (!startTime) {
			showNotification('请设置直播开始时间', 'error');
			return;
		}
		scheduledStartTime = new Date(startTime).toISOString();
		const endTime = document.getElementById('setup-end-time').value;
		if (endTime) {
			scheduledEndTime = new Date(endTime).toISOString();
		}
	}
	
	try {
		// 设置辩论
		const debateResponse = await fetch(`${API_BASE}/debate`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: debateTitle,
				description: debateDescription,
				leftPosition: leftPosition,
				rightPosition: rightPosition
			})
		});
		
		if (!debateResponse.ok) {
			throw new Error('保存辩论设置失败');
		}
		
		// 设置直播计划
		const response = await fetch(`${API_BASE}/live/setup-and-start`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				streamId: streamId,
				scheduledStartTime: scheduledStartTime,
				scheduledEndTime: scheduledEndTime,
				startNow: false
			})
		});
		
		const result = await response.json();
		if (result.success) {
			if (isSchedule) {
				showNotification('直播计划已设置！', 'success');
			} else {
				showNotification('设置已保存！', 'success');
			}
			loadLiveStatus();
		} else {
			throw new Error(result.error || '设置失败');
		}
	} catch (error) {
		console.error('设置失败:', error);
		showNotification('设置失败: ' + error.message, 'error');
	}
});

// ==================== 直播计划管理 ====================
let scheduleUpdateTimer = null;

async function loadLiveSchedule() {
	try {
		// 加载直播流列表
		const streamsResponse = await fetch(`${API_BASE}/streams`);
		const streams = await streamsResponse.json();
		
		const streamSelect = document.getElementById('schedule-stream-id');
		streamSelect.innerHTML = '<option value="">使用默认启用的直播流</option>';
		
		streams.forEach(stream => {
			if (stream.enabled) {
				const option = document.createElement('option');
				option.value = stream.id;
				option.textContent = `${stream.name} (${stream.type.toUpperCase()})`;
				streamSelect.appendChild(option);
			}
		});
		
		// 加载当前计划
		const scheduleResponse = await fetch(`${API_BASE}/live/schedule`);
		const scheduleResult = await scheduleResponse.json();
		
		if (scheduleResult.success && scheduleResult.data.isScheduled) {
			const schedule = scheduleResult.data;
			displayScheduleInfo(schedule);
			
			// 设置表单值
			if (schedule.streamId) {
				streamSelect.value = schedule.streamId;
			}
			if (schedule.scheduledStartTime) {
				const startDate = new Date(schedule.scheduledStartTime);
				document.getElementById('schedule-start-time').value = formatDateTimeLocal(startDate);
			}
			if (schedule.scheduledEndTime) {
				const endDate = new Date(schedule.scheduledEndTime);
				document.getElementById('schedule-end-time').value = formatDateTimeLocal(endDate);
			}
			
			document.getElementById('cancel-schedule-btn').style.display = 'inline-block';
			
			// 启动定时更新倒计时（每10秒更新一次）
			if (scheduleUpdateTimer) {
				clearInterval(scheduleUpdateTimer);
			}
			scheduleUpdateTimer = setInterval(async () => {
				try {
					const scheduleResponse = await fetch(`${API_BASE}/live/schedule`);
					const scheduleResult = await scheduleResponse.json();
					if (scheduleResult.success && scheduleResult.data.isScheduled) {
						displayScheduleInfo(scheduleResult.data);
					}
				} catch (error) {
					console.error('更新计划信息失败:', error);
				}
			}, 10000); // 每10秒更新一次倒计时
		} else {
			clearScheduleInfo();
			document.getElementById('cancel-schedule-btn').style.display = 'none';
			if (scheduleUpdateTimer) {
				clearInterval(scheduleUpdateTimer);
				scheduleUpdateTimer = null;
			}
		}
	} catch (error) {
		console.error('加载直播计划失败:', error);
		showNotification('加载失败', 'error');
	}
}

function formatDateTimeLocal(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function displayScheduleInfo(schedule) {
	const statusDisplay = document.getElementById('schedule-status-display');
	const startTime = new Date(schedule.scheduledStartTime);
	const endTime = schedule.scheduledEndTime ? new Date(schedule.scheduledEndTime) : null;
	const now = new Date();
	const timeUntilStart = startTime - now;
	
	let statusHtml = '';
	if (timeUntilStart > 0) {
		const hours = Math.floor(timeUntilStart / (1000 * 60 * 60));
		const minutes = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
		statusHtml = `
			<p style="color: #4CAF50; font-weight: bold;">✅ 计划已设置</p>
			<p><strong>开始时间:</strong> ${startTime.toLocaleString('zh-CN')}</p>
			${endTime ? `<p><strong>结束时间:</strong> ${endTime.toLocaleString('zh-CN')}</p>` : '<p><strong>结束时间:</strong> 手动停止</p>'}
			<p><strong>距离开始:</strong> ${hours}小时 ${minutes}分钟</p>
		`;
	} else {
		statusHtml = `
			<p style="color: #FF9800; font-weight: bold;">⚠️ 计划时间已过</p>
			<p><strong>开始时间:</strong> ${startTime.toLocaleString('zh-CN')}</p>
		`;
	}
	
	statusDisplay.innerHTML = statusHtml;
}

function clearScheduleInfo() {
	const statusDisplay = document.getElementById('schedule-status-display');
	statusDisplay.innerHTML = '<p style="color: #999;">暂无计划</p>';
}

// 保存直播计划
document.getElementById('save-schedule-btn')?.addEventListener('click', async () => {
	const startTimeInput = document.getElementById('schedule-start-time');
	const endTimeInput = document.getElementById('schedule-end-time');
	const streamIdSelect = document.getElementById('schedule-stream-id');
	
	const startTime = startTimeInput.value;
	if (!startTime) {
		showNotification('请设置直播开始时间', 'error');
		return;
	}
	
	const scheduleData = {
		scheduledStartTime: new Date(startTime).toISOString(),
		scheduledEndTime: endTimeInput.value ? new Date(endTimeInput.value).toISOString() : null,
		streamId: streamIdSelect.value || null
	};
	
	try {
		const response = await fetch(`${API_BASE}/live/schedule`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(scheduleData)
		});
		
		const result = await response.json();
		if (result.success) {
			showNotification('直播计划已设置', 'success');
			loadLiveSchedule();
			loadLiveStatus();
		} else {
			throw new Error(result.error || '设置失败');
		}
	} catch (error) {
		console.error('设置直播计划失败:', error);
		showNotification('设置失败: ' + error.message, 'error');
	}
});

// 取消直播计划
document.getElementById('cancel-schedule-btn')?.addEventListener('click', async () => {
	if (!confirm('确定要取消当前的直播计划吗？')) {
		return;
	}
	
	try {
		const response = await fetch(`${API_BASE}/live/schedule/cancel`, {
			method: 'POST'
		});
		
		const result = await response.json();
		if (result.success) {
			showNotification('直播计划已取消', 'success');
			loadLiveSchedule();
			loadLiveStatus();
		} else {
			throw new Error(result.error || '取消失败');
		}
	} catch (error) {
		console.error('取消直播计划失败:', error);
		showNotification('取消失败', 'error');
	}
});

// 初始化时加载直播状态
loadLiveStatus();

// ==================== 用户管理 ====================
async function loadUsers() {
	try {
		const data = await fetchUserList(1, 20, {});
		if (!data || !data.users) {
			console.error('获取用户列表失败');
			return;
		}
		
		const tbody = document.getElementById('users-table-body');
		tbody.innerHTML = '';
		
		if (data.users.length === 0) {
			tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">暂无用户</td></tr>';
			return;
		}
		
		data.users.forEach(user => {
			const row = document.createElement('tr');
			// 获取头像URL，支持多种字段名
			const avatarUrl = user.avatar || user.avatarUrl || '';
			
			// 占位符URL（使用单引号避免在HTML属性中冲突）
			const placeholderSvg = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\'%3E%3Crect width=\'40\' height=\'40\' fill=\'%23e0e0e0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%23999\' font-size=\'14\'%3E头像%3C/text%3E%3C/svg%3E';
			
			// 如果头像URL包含 logo.png、为空、或无法访问（微信头像等），使用占位符
			// 同时过滤掉可能导致语法错误的URL
			let avatarSrc = placeholderSvg;
			if (avatarUrl && 
			    !avatarUrl.includes('logo.png') && 
			    !avatarUrl.includes('thirdwx.qlogo.cn') &&
			    avatarUrl.startsWith('http')) {
				// 转义HTML特殊字符
				avatarSrc = avatarUrl.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
			}
			
			// 转义userId中的特殊字符，防止XSS和语法错误
			const safeUserId = (user.userId || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
			
			row.innerHTML = `
				<td>${user.userId ? user.userId.slice(0, 8) + '...' : 'N/A'}</td>
				<td>${(user.nickname || '未设置').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
				<td><img src="${avatarSrc}" class="avatar-img" onerror="this.src='${placeholderSvg}'; this.onerror=null;"></td>
				<td>${user.joinTime ? new Date(user.joinTime).toLocaleString() : '-'}</td>
				<td><span class="badge ${user.status === 'online' ? 'success' : 'secondary'}">${user.status === 'online' ? '在线' : '离线'}</span></td>
				<td>
					<button class="btn btn-sm btn-secondary" onclick='viewUser("${safeUserId}")'>查看</button>
				</td>
			`;
			tbody.appendChild(row);
		});
	} catch (error) {
		console.error('加载用户失败:', error);
		showNotification('加载失败', 'error');
	}
}

// 搜索用户
document.getElementById('user-search')?.addEventListener('input', (e) => {
	// 实现搜索逻辑
	const searchTerm = e.target.value.toLowerCase();
	const rows = document.querySelectorAll('#users-table-body tr');
	rows.forEach(row => {
		const text = row.textContent.toLowerCase();
		row.style.display = text.includes(searchTerm) ? '' : 'none';
	});
});

function viewUser(id) {
	// 实现用户详情查看
	alert(`查看用户 ${id} 的详细信息`);
}

// ==================== 票数管理 ====================
async function loadVotes() {
	try {
		// 从dashboard获取票数信息
		const data = await fetchDashboard();
		if (!data) return;
		
		if (!data.isLive) {
		document.getElementById('votes-container') && (document.getElementById('votes-container').innerHTML = '<div style="color: #FF9800; padding: 40px 0; text-align: center;">直播未开始，无需实时监控票数～</div>');
		return;
	}
		
		const leftVotes = data.leftVotes || 0;
		const rightVotes = data.rightVotes || 0;
		const totalVotes = data.totalVotes || (leftVotes + rightVotes);
		const leftPercentage = data.leftPercentage || (totalVotes > 0 ? Math.round((leftVotes / totalVotes) * 100) : 50);
		const rightPercentage = data.rightPercentage || (totalVotes > 0 ? Math.round((rightVotes / totalVotes) * 100) : 50);
		
		document.getElementById('admin-left-votes').textContent = leftVotes;
		document.getElementById('admin-right-votes').textContent = rightVotes;
		document.getElementById('admin-total-votes').textContent = totalVotes;
			document.getElementById('admin-vote-percentage').textContent = 
			`正方: ${leftPercentage}% | 反方: ${rightPercentage}%`;
			
		// 更新全局状态
		globalState.currentVotes = {
			leftVotes,
			rightVotes
		};
	} catch (error) {
		console.error('加载票数失败:', error);
		showNotification('加载票数失败', 'error');
	}
}

// 票数实时刷新控制
let votesTimer = null;
function startVotesAutoRefresh() {
    if (votesTimer) clearInterval(votesTimer);
    if (!currentLiveStatus) return;
    loadVotes();
    votesTimer = setInterval(() => {
        if (!currentLiveStatus) return;
        loadVotes();
    }, 10000);
}
function stopVotesAutoRefresh() {
    if (votesTimer) clearInterval(votesTimer);
    votesTimer = null;
}

// 票数管理相关函数已移至admin-events.js中处理

// ==================== AI 内容管理 ====================
async function loadAIContent() {
	try {
		const data = await fetchAIContentList(1, 20);
		if (!data || !data.items) {
			console.error('获取AI内容列表失败');
			return;
		}
		
		const container = document.getElementById('ai-content-list');
		if (!container) return;
		
		if (data.items.length === 0) {
			container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无AI内容</div>';
			return;
		}
		
		// 使用与loadAIContentList相同的样式渲染
		container.innerHTML = data.items.map(item => {
			// 转义HTML特殊字符以防止XSS
			const safeContent = (item.content || item.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
			const safeId = (item.id || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
			const timestamp = item.timestamp || '';
			
			return `
				<div class="ai-content-item" style="padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 15px; background: white;">
					<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
						<div style="flex: 1;">
							<span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; background: ${item.position === 'left' ? '#e8f5e9' : '#e3f2fd'}; color: ${item.position === 'left' ? '#4CAF50' : '#2196F3'}; margin-right: 10px;">
								${item.position === 'left' ? '⚔️ 正方' : '🛡️ 反方'}
							</span>
							<span style="color: #999; font-size: 12px;">${timestamp}</span>
							<span style="color: #999; font-size: 12px; margin-left: 10px;">置信度: ${((item.confidence || 0) * 100).toFixed(0)}%</span>
						</div>
						<button class="btn btn-danger btn-sm" onclick="deleteAIContentItem('${safeId}')" style="padding: 4px 12px;">删除</button>
					</div>
					<div style="color: #333; line-height: 1.6; margin-bottom: 10px;">${safeContent}</div>
					<div style="display: flex; gap: 15px; color: #999; font-size: 12px; margin-bottom: 10px;">
						<span>👁️ ${(item.statistics && item.statistics.views) || 0} 查看</span>
						<span>❤️ ${(item.statistics && item.statistics.likes) || 0} 点赞</span>
						<span>💬 ${(item.statistics && item.statistics.comments) || 0} 评论</span>
					</div>
					<div style="display: flex; gap: 10px;">
						<button class="btn btn-danger btn-sm" onclick="deleteAIContentItem('${safeId}')" style="padding: 4px 12px;">删除</button>
						${(item.statistics && item.statistics.comments > 0) ? `<button class="btn btn-primary btn-sm" onclick='openCommentsModal("${safeId}")' style="padding: 4px 12px;">查看评论 (${item.statistics.comments})</button>` : '<button class="btn btn-secondary btn-sm" disabled style="padding: 4px 12px;">暂无评论</button>'}
					</div>
				</div>
			`;
		}).join('');
		
		// 更新分页
		const pagination = document.getElementById('ai-content-pagination');
		if (pagination) {
			if (data.total > 20) {
				pagination.style.display = 'block';
				const pageInfo = document.getElementById('ai-page-info');
				if (pageInfo) {
					pageInfo.textContent = `第 ${data.page || 1} 页 / 共 ${Math.ceil((data.total || 0) / 20)} 页`;
				}
			} else {
				pagination.style.display = 'none';
			}
		}
	} catch (error) {
		console.error('加载 AI 内容失败:', error);
		showNotification('加载 AI 内容失败', 'error');
	}
}

// 打开 AI 内容编辑弹窗
function openAIContentModal(content = null) {
	const modal = document.getElementById('ai-content-modal');
	if (content) {
		document.getElementById('ai-content-id').value = content.id;
		document.getElementById('ai-content-text').value = content.text;
		document.getElementById('ai-content-side').value = content.side;
		document.getElementById('ai-content-debate-id').value = content.debate_id || '';
	} else {
		document.getElementById('ai-content-form').reset();
		document.getElementById('ai-content-id').value = '';
	}
	modal.classList.add('show');
}

function closeAIContentModal() {
	document.getElementById('ai-content-modal').classList.remove('show');
}

// 评论弹窗
// 打开评论查看弹窗
async function openCommentsModal(contentId) {
		const modal = document.getElementById('comments-modal');
		const listEl = document.getElementById('comments-list');
	
	if (!modal || !listEl) {
		console.error('评论弹窗元素不存在');
		return;
	}
	
	// 显示加载状态
	listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">加载中...</div>';
	modal.classList.add('show');
	
	try {
		// 调用API获取评论列表
		const data = await fetchAIContentComments(contentId, 1, 50);
		
		if (!data || !data.comments) {
			listEl.innerHTML = '<div class="empty-state">暂无评论</div>';
			return;
		}
		
		const comments = data.comments || [];
		
		if (comments.length === 0) {
			listEl.innerHTML = '<div class="empty-state">暂无评论</div>';
			return;
		}
		
		// 清空列表
		listEl.innerHTML = '';
		
		// 显示评论总数
		const header = document.createElement('div');
		header.style.cssText = 'padding: 10px 15px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; margin: -15px -15px 15px -15px; font-weight: 600;';
		header.textContent = `共 ${data.total || comments.length} 条评论`;
		listEl.appendChild(header);
		
		// 渲染评论列表
		comments.forEach(comment => {
			const commentEl = document.createElement('div');
			commentEl.style.cssText = 'padding: 15px; border-bottom: 1px solid #eee; background: white;';
			
			const timestamp = comment.timestamp ? new Date(comment.timestamp).toLocaleString('zh-CN') : '';
			const avatar = comment.avatar || '👤';
			const nickname = comment.nickname || '匿名用户';
			const likes = comment.likes || 0;
			
			commentEl.innerHTML = `
				<div style="display: flex; align-items: center; margin-bottom: 10px;">
					<span style="font-size: 24px; margin-right: 10px;">${avatar}</span>
					<div style="flex: 1;">
						<div style="font-weight: 600; color: #333; margin-bottom: 4px;">${nickname}</div>
						<div style="font-size: 12px; color: #999;">
							${timestamp}
							${likes > 0 ? `<span style="margin-left: 10px;">❤️ ${likes}</span>` : ''}
						</div>
					</div>
					<button class="btn btn-sm btn-danger" onclick='deleteComment("${contentId}", "${comment.commentId || comment.id}")' style="padding: 4px 8px; font-size: 12px;">删除</button>
				</div>
				<div style="color: #333; line-height: 1.6; margin-top: 8px;">${(comment.content || comment.text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
			`;
			
			listEl.appendChild(commentEl);
		});
		
	} catch (error) {
		console.error('加载评论失败:', error);
		listEl.innerHTML = '<div class="empty-state" style="color: #f44336;">加载评论失败: ' + error.message + '</div>';
		showNotification('加载评论失败: ' + error.message, 'error');
	}
}

// 将 openCommentsModal 挂载到 window 对象，供 HTML onclick 调用
window.openCommentsModal = openCommentsModal;

// 删除评论（全局函数，供HTML onclick调用）
window.deleteComment = async function(contentId, commentId) {
	if (!confirm('确定要删除这条评论吗？')) {
		return;
	}
	
	const reason = prompt('请输入删除原因（可选）：');
	
	try {
		const result = await deleteAIContentComment(contentId, commentId, reason || '管理员删除', true);
		if (result) {
			showNotification('评论已删除', 'success');
			// 重新加载评论列表
			await openCommentsModal(contentId);
		}
	} catch (error) {
		console.error('删除评论失败:', error);
		showNotification('删除评论失败: ' + error.message, 'error');
	}
};

document.querySelector('[data-modal="comments-modal"]')?.addEventListener('click', () => {
	document.getElementById('comments-modal').classList.remove('show');
});

// 添加 AI 内容按钮
document.getElementById('add-ai-content-btn')?.addEventListener('click', () => {
	openAIContentModal();
});

// AI 内容表单提交
document.getElementById('ai-content-form')?.addEventListener('submit', async (e) => {
	e.preventDefault();
	
	const contentId = document.getElementById('ai-content-id').value;
	const contentData = {
		text: document.getElementById('ai-content-text').value,
		side: document.getElementById('ai-content-side').value,
		debate_id: document.getElementById('ai-content-debate-id').value || undefined
	};
	
	try {
		const url = contentId 
			? `${API_BASE}/ai-content/${contentId}`
			: `${API_BASE}/ai-content`;
		
		const method = contentId ? 'PUT' : 'POST';
		
		const response = await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(contentData)
		});
		
		const result = await response.json();
		if (result.success) {
			showNotification('保存成功', 'success');
			closeAIContentModal();
			loadAIContent();
		} else {
			throw new Error(result.error || '保存失败');
		}
	} catch (error) {
		console.error('保存失败:', error);
		showNotification('保存失败: ' + error.message, 'error');
	}
});

document.getElementById('cancel-ai-content-btn')?.addEventListener('click', closeAIContentModal);
document.querySelector('[data-modal="ai-content-modal"]')?.addEventListener('click', closeAIContentModal);

// deleteAIContent 函数已在 admin-api.js 中定义
// 删除AI内容的调用通过admin-events.js中的deleteAIContentItem函数处理

// ==================== 数据统计 ====================
async function loadStatistics() {
	try {
		// 使用 dashboard 接口获取统计数据
		const data = await fetchDashboard();
		if (!data) {
			console.error('获取统计数据失败');
			return;
		}
		
		// 获取投票统计
		const voteStats = await fetchVotesStatistics('24h');
		
		// 汇总概览渲染（若页面有对应元素可填充，没有则动态插入到 statistics 页面顶部）
		const page = document.getElementById('statistics');
		if (!page) return;
		
		// 创建概览卡片
		let overview = page.querySelector('#stats-overview');
		if (!overview) {
			overview = document.createElement('div');
			overview.id = 'stats-overview';
			overview.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px;';
			page.insertBefore(overview, page.firstChild);
		}
		
		// 使用 dashboard 数据
		overview.innerHTML = `
			<div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
				<h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">观众总数</h4>
				<div style="font-size: 32px; font-weight: 700; color: #667eea;">${data.totalUsers || 0}</div>
  </div>
			<div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
				<h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">累计投票</h4>
				<div style="font-size: 32px; font-weight: 700; color: #4CAF50;">${data.totalVotes || 0}</div>
  </div>
			<div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
				<h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">活跃用户</h4>
				<div style="font-size: 32px; font-weight: 700; color: #FF9800;">${data.activeUsers || 0}</div>
  </div>
			<div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
				<h4 style="margin: 0 0 10px 0; color: #666; font-size: 14px;">投票分布</h4>
				<div style="font-size: 18px; font-weight: 700; color: #2196F3; margin-bottom: 5px;">正方: ${data.leftVotes || 0}</div>
				<div style="font-size: 18px; font-weight: 700; color: #f44336;">反方: ${data.rightVotes || 0}</div>
  </div>
`;
		
		// 如果有投票统计数据，显示时间线（如果页面有对应容器）
		if (voteStats && voteStats.timeline) {
			const timelineContainer = page.querySelector('#vote-timeline');
			if (timelineContainer) {
				// 可以在这里渲染投票趋势图
				console.log('投票统计时间线:', voteStats.timeline);
			}
		}
		
	} catch (error) {
		console.error('加载统计数据失败:', error);
		showNotification('加载失败', 'error');
	}
}

// 全局通知方法，简单 alert 实现，可自定义美化
// ==================== API函数 ====================
// 所有API函数已在admin-api.js中定义，这里不再重复定义
// 如果需要使用API函数，请使用admin-api.js中的函数

// ==================== 辅助函数 ====================

function showNotification(message, type = 'info') {
    // type可以为 'success' | 'error' | 'warning' | 'info'，可扩展美化
    alert(message);
}