// 直播流管理模块

/**
 * 初始化直播流管理功能
 */
function initStreamManagement() {
	console.log('📡 初始化直播流管理模块...');
	bindStreamManagementEvents();
}

/**
 * 绑定直播流管理相关事件
 */
function bindStreamManagementEvents() {
	// 添加直播流按钮
	const addStreamBtn = document.getElementById('add-stream-btn');
	if (addStreamBtn) {
		addStreamBtn.addEventListener('click', openAddStreamModal);
	}
	
	// 关闭弹窗按钮
	const closeModalBtn = document.getElementById('close-stream-modal');
	if (closeModalBtn) {
		closeModalBtn.addEventListener('click', closeStreamModal);
	}
	
	// 取消按钮
	const cancelBtn = document.getElementById('cancel-stream-btn');
	if (cancelBtn) {
		cancelBtn.addEventListener('click', closeStreamModal);
	}
	
	// 表单提交
	const streamForm = document.getElementById('stream-form');
	if (streamForm) {
		streamForm.addEventListener('submit', handleStreamFormSubmit);
	}
	
	// 点击弹窗外部关闭
	const modal = document.getElementById('stream-modal');
	if (modal) {
		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				closeStreamModal();
			}
		});
	}
	
	console.log('✅ 直播流管理事件绑定完成');
}

/**
 * 加载直播流列表
 */
async function loadStreamsList() {
	try {
		console.log('📡 加载直播流列表...');
		
		const result = await getStreamsList();
		console.log('📦 API返回数据:', result);
		
		// 处理返回数据，可能是数组或者包含data字段的对象
		let streams = [];
		if (Array.isArray(result)) {
			streams = result;
		} else if (result && Array.isArray(result.data)) {
			streams = result.data;
		} else if (result && typeof result === 'object') {
			// 如果是对象但不是数组，尝试提取可能的数组字段
			streams = result.streams || result.items || result.list || [];
		}
		
		// 确保 streams 是数组
		if (!Array.isArray(streams)) {
			console.warn('⚠️ 返回数据不是数组格式，转换为空数组:', streams);
			streams = [];
		}
		
		renderStreamsTable(streams);
		
		console.log('✅ 直播流列表加载完成，共', streams.length, '个');
		
	} catch (error) {
		console.error('❌ 加载直播流列表失败:', error);
		showToast('加载直播流列表失败：' + error.message, 'error');
		// 显示空列表
		renderStreamsTable([]);
	}
}

/**
 * 渲染直播流表格
 */
function renderStreamsTable(streams) {
	const tbody = document.getElementById('streams-table-body');
	if (!tbody) {
		console.error('找不到直播流表格容器');
		return;
	}
	
	// 确保 streams 是数组
	if (!Array.isArray(streams)) {
		console.error('❌ renderStreamsTable: streams 不是数组:', streams);
		streams = [];
	}
	
	if (!streams || streams.length === 0) {
		tbody.innerHTML = `
			<tr>
				<td colspan="6" style="text-align: center; padding: 40px; color: #999;">
					暂无直播流，请点击"添加直播流"按钮
				</td>
			</tr>
		`;
		return;
	}
	
	tbody.innerHTML = streams.map(stream => `
		<tr>
			<td>${escapeHtml(stream.name)}</td>
			<td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(stream.url)}">
				${escapeHtml(stream.url)}
			</td>
			<td>
				<span class="badge badge-${stream.type === 'hls' ? 'success' : stream.type === 'rtmp' ? 'warning' : 'info'}">
					${stream.type.toUpperCase()}
				</span>
			</td>
			<td>
				<span class="badge badge-${stream.enabled ? 'success' : 'secondary'}">
					${stream.enabled ? '✓ 已启用' : '✗ 已禁用'}
				</span>
			</td>
			<td style="font-size: 12px; color: #666;">
				${formatDateTime(stream.createdAt)}
			</td>
			<td>
				<button class="btn btn-sm btn-primary" onclick="openEditStreamModal('${stream.id}')">
					✏️ 编辑
				</button>
				<button class="btn btn-sm btn-danger" onclick="handleDeleteStream('${stream.id}', '${escapeHtml(stream.name)}')">
					🗑️ 删除
				</button>
			</td>
		</tr>
	`).join('');
}

/**
 * 打开添加直播流弹窗
 */
function openAddStreamModal() {
	const modal = document.getElementById('stream-modal');
	const title = document.getElementById('stream-modal-title');
	const form = document.getElementById('stream-form');
	
	if (!modal || !title || !form) {
		console.error('找不到弹窗元素');
		return;
	}
	
	// 设置标题
	title.textContent = '添加直播流';
	
	// 重置表单
	form.reset();
	document.getElementById('stream-id').value = '';
	document.getElementById('stream-enabled').checked = true;
	
	// 显示弹窗
	modal.style.display = 'flex';
	
	console.log('打开添加直播流弹窗');
}

/**
 * 打开编辑直播流弹窗
 */
async function openEditStreamModal(streamId) {
	try {
		console.log('打开编辑弹窗:', streamId);
		
		const modal = document.getElementById('stream-modal');
		const title = document.getElementById('stream-modal-title');
		
		if (!modal || !title) {
			console.error('找不到弹窗元素');
			return;
		}
		
		// 设置标题
		title.textContent = '编辑直播流';
		
		// 获取流列表，找到对应的流
		const result = await getStreamsList();
		const streams = Array.isArray(result) ? result : (result?.data || result || []);
		const stream = streams.find(s => s.id === streamId);
		
		if (!stream) {
			showToast('找不到指定的直播流', 'error');
			return;
		}
		
		// 填充表单
		document.getElementById('stream-id').value = stream.id;
		document.getElementById('stream-name').value = stream.name;
		document.getElementById('stream-url').value = stream.url;
		document.getElementById('stream-type').value = stream.type;
		document.getElementById('stream-description').value = stream.description || '';
		document.getElementById('stream-enabled').checked = stream.enabled;
		
		// 显示弹窗
		modal.style.display = 'flex';
		
	} catch (error) {
		console.error('❌ 打开编辑弹窗失败:', error);
		showToast('打开编辑弹窗失败：' + error.message, 'error');
	}
}

/**
 * 关闭直播流弹窗
 */
function closeStreamModal() {
	const modal = document.getElementById('stream-modal');
	if (modal) {
		modal.style.display = 'none';
	}
	console.log('关闭直播流弹窗');
}

/**
 * 处理直播流表单提交
 */
async function handleStreamFormSubmit(e) {
	e.preventDefault();
	
	try {
		const streamId = document.getElementById('stream-id').value;
		const streamData = {
			name: document.getElementById('stream-name').value.trim(),
			url: document.getElementById('stream-url').value.trim(),
			type: document.getElementById('stream-type').value,
			description: document.getElementById('stream-description').value.trim(),
			enabled: document.getElementById('stream-enabled').checked
		};
		
		// 验证
		if (!streamData.name || !streamData.url || !streamData.type) {
			showToast('请填写所有必填项', 'error');
			return;
		}
		
		console.log('提交直播流表单:', streamId ? '更新' : '添加', streamData);
		
		// 禁用提交按钮
		const submitBtn = document.querySelector('#stream-form button[type="submit"]');
		const btnText = document.getElementById('save-stream-btn-text');
		if (submitBtn) submitBtn.disabled = true;
		if (btnText) btnText.textContent = '保存中...';
		
		try {
			if (streamId) {
				// 更新
				console.log('调用更新API:', streamId);
				await updateStream(streamId, streamData);
				showToast('直播流更新成功！', 'success');
			} else {
				// 添加
				console.log('调用添加API');
				await addStream(streamData);
				showToast('直播流添加成功！', 'success');
			}
			
			// 关闭弹窗
			closeStreamModal();
			
			// 重新加载列表
			await loadStreamsList();
			
		} finally {
			// 恢复按钮
			if (submitBtn) submitBtn.disabled = false;
			if (btnText) btnText.textContent = '保存';
		}
		
	} catch (error) {
		console.error('❌ 保存直播流失败:', error);
		showToast('保存失败：' + error.message, 'error');
	}
}

/**
 * 删除直播流
 */
async function handleDeleteStream(streamId, streamName) {
	console.log('请求删除直播流:', streamId, streamName);
	
	if (!confirm(`确定要删除直播流"${streamName}"吗？\n\n删除后将无法恢复！`)) {
		console.log('用户取消删除');
		return;
	}
	
	try {
		console.log('调用删除API:', streamId);
		await deleteStream(streamId);
		showToast('直播流删除成功！', 'success');
		
		// 重新加载列表
		await loadStreamsList();
		
	} catch (error) {
		console.error('❌ 删除直播流失败:', error);
		showToast('删除失败：' + error.message, 'error');
	}
}

/**
 * HTML转义
 */
function escapeHtml(text) {
	if (!text) return '';
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateString) {
	if (!dateString) return '-';
	
	try {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		
		return `${year}-${month}-${day} ${hours}:${minutes}`;
	} catch (e) {
		return '-';
	}
}

/**
 * 显示Toast提示
 */
function showToast(message, type = 'info') {
	console.log(`[Toast ${type.toUpperCase()}]`, message);
	
	// 检查是否已有toast动画样式
	if (!document.getElementById('toast-style')) {
		const style = document.createElement('style');
		style.id = 'toast-style';
		style.textContent = `
			@keyframes toastSlideIn {
				from {
					transform: translateX(400px);
					opacity: 0;
				}
				to {
					transform: translateX(0);
					opacity: 1;
				}
			}
			@keyframes toastSlideOut {
				from {
					transform: translateX(0);
					opacity: 1;
				}
				to {
					transform: translateX(400px);
					opacity: 0;
				}
			}
		`;
		document.head.appendChild(style);
	}
	
	// Toast颜色
	const colors = {
		success: '#4caf50',
		error: '#f44336',
		warning: '#ff9800',
		info: '#2196f3'
	};
	
	const toast = document.createElement('div');
	toast.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: ${colors[type] || colors.info};
		color: white;
		padding: 15px 25px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.3);
		z-index: 10000;
		animation: toastSlideIn 0.3s ease;
		font-size: 14px;
		max-width: 400px;
	`;
	toast.textContent = message;
	
	document.body.appendChild(toast);
	
	setTimeout(() => {
		toast.style.animation = 'toastSlideOut 0.3s ease';
		setTimeout(() => {
			if (toast.parentNode) {
				document.body.removeChild(toast);
			}
		}, 300);
	}, 3000);
}

console.log('✅ 直播流管理模块加载完成');

