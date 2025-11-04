// 后台管理系统事件处理器
// 本文件包含所有新功能的按钮事件绑定

// 页面加载完成后绑定事件
document.addEventListener('DOMContentLoaded', () => {
	console.log('🎯 初始化后台管理系统事件处理器...');
	initVotesEvents();
	initAIEvents();
	initLiveControlEvents();
});

// ==================== 票数管理事件 ====================

function initVotesEvents() {
	// 功能一：设置票数
	const setVotesBtn = document.getElementById('set-votes-btn');
	if (setVotesBtn) {
		setVotesBtn.addEventListener('click', async () => {
			const leftVotes = parseInt(document.getElementById('set-left-votes').value) || 0;
			const rightVotes = parseInt(document.getElementById('set-right-votes').value) || 0;
			const reason = document.getElementById('set-votes-reason').value || '手动设置';
			
			if (leftVotes === 0 && rightVotes === 0) {
				alert('请输入要设置的票数');
				return;
			}
			
			if (!confirm(`确定要设置票数为：正方 ${leftVotes}，反方 ${rightVotes} 吗？`)) {
				return;
			}
			
			const result = await updateVotes('set', leftVotes, rightVotes, reason, true);
			if (result) {
				// 更新显示
				updateVotesDisplay(result.afterUpdate);
				// 清空输入框
				document.getElementById('set-left-votes').value = '';
				document.getElementById('set-right-votes').value = '';
				document.getElementById('set-votes-reason').value = '';
			}
		});
	}
	
	// 功能二：增加票数
	const addVotesBtn = document.getElementById('add-votes-btn');
	if (addVotesBtn) {
		addVotesBtn.addEventListener('click', async () => {
			const leftVotes = parseInt(document.getElementById('add-left-votes').value) || 0;
			const rightVotes = parseInt(document.getElementById('add-right-votes').value) || 0;
			const reason = document.getElementById('add-votes-reason').value || '增加票数';
			
			if (leftVotes === 0 && rightVotes === 0) {
				alert('请输入要增加的票数');
				return;
			}
			
			if (!confirm(`确定要增加票数：正方 +${leftVotes}，反方 +${rightVotes} 吗？`)) {
				return;
			}
			
			const result = await updateVotes('add', leftVotes, rightVotes, reason, true);
			if (result) {
				// 更新显示
				updateVotesDisplay(result.afterUpdate);
				// 清空输入框
				document.getElementById('add-left-votes').value = '';
				document.getElementById('add-right-votes').value = '';
				document.getElementById('add-votes-reason').value = '';
			}
		});
	}
	
	// 功能三：重置票数
	const resetVotesBtn = document.getElementById('reset-votes-btn');
	if (resetVotesBtn) {
		resetVotesBtn.addEventListener('click', async () => {
			const leftVotes = parseInt(document.getElementById('reset-left-votes').value) || 0;
			const rightVotes = parseInt(document.getElementById('reset-right-votes').value) || 0;
			
			if (!confirm(`⚠️ 确定要重置票数吗？\n将重置为：正方 ${leftVotes}，反方 ${rightVotes}\n当前数据会被自动备份。`)) {
				return;
			}
			
			const result = await resetVotes(leftVotes, rightVotes, true, true);
			if (result) {
				// 更新显示
				updateVotesDisplay({
					leftVotes: result.currentVotes.leftVotes,
					rightVotes: result.currentVotes.rightVotes
				});
			}
		});
	}
}

// 更新票数显示
function updateVotesDisplay(data) {
	const leftVotesEl = document.getElementById('admin-left-votes');
	const rightVotesEl = document.getElementById('admin-right-votes');
	const totalVotesEl = document.getElementById('admin-total-votes');
	const percentageEl = document.getElementById('admin-vote-percentage');
	
	if (leftVotesEl) leftVotesEl.textContent = data.leftVotes || 0;
	if (rightVotesEl) rightVotesEl.textContent = data.rightVotes || 0;
	
	const total = (data.leftVotes || 0) + (data.rightVotes || 0);
	if (totalVotesEl) totalVotesEl.textContent = total;
	
	if (percentageEl) {
		const leftPct = data.leftPercentage || (total > 0 ? Math.round((data.leftVotes / total) * 100) : 50);
		const rightPct = data.rightPercentage || (total > 0 ? Math.round((data.rightVotes / total) * 100) : 50);
		percentageEl.textContent = `正方: ${leftPct}% | 反方: ${rightPct}%`;
	}
}

// ==================== AI控制事件 ====================

function initAIEvents() {
	// 启动AI识别（改为通过直播接口启动）
	const startAIBtn = document.getElementById('start-ai-btn');
	if (startAIBtn) {
		startAIBtn.addEventListener('click', async () => {
			// ⚠️ 重要修改：现在必须通过直播接口启动AI，不再使用单独的 /api/admin/ai/start 接口
			try {
				// 先检查当前直播状态
				const dashboard = await fetchDashboard();
				if (!dashboard) {
					console.error('获取直播状态失败');
					return;
				}
				
				const isLive = dashboard.isLive || false;
				const streamId = dashboard.streamId || null;
				
				if (!isLive) {
					console.warn('⚠️ AI实时识别需要先开始直播！请先点击"开始直播"按钮，并勾选"自动启动AI识别"选项。');
					return;
				}
				
				// 如果直播已开始，需要重新启动直播来启用AI
				if (!confirm('确定要启动AI识别吗？\n\n⚠️ 注意：这将重新启动直播以启用AI识别功能。')) {
					return;
				}
				
			// ⚠️ 重要：使用直播接口启动，并设置 autoStartAI: true
			// 先停止当前直播（不通知用户，避免干扰）
			await stopLive(streamId, true, false);
			
			// 立即重新启动直播并自动启动AI
			console.log('🔄 重新启动直播以启用AI识别...');
			const result = await startLive(streamId, true, true);
				
				if (result && result.success) {
					console.log('✅ AI识别已通过直播接口启动');
					console.log('📺 直播流地址:', result.streamUrl);
					
					updateAIControlButtons('running');
					
					// 启动成功后，延迟订阅AI内容更新（等待后端ASR服务就绪）
					setTimeout(() => {
						if (typeof loadAIContentList === 'function') {
							console.log('📡 开始订阅AI内容更新...');
							loadAIContentList(1);
						}
						
						// 设置定时刷新AI内容列表
						if (window.aiContentRefreshTimer) {
							clearInterval(window.aiContentRefreshTimer);
						}
						window.aiContentRefreshTimer = setInterval(() => {
							if (typeof loadAIContentList === 'function') {
								loadAIContentList(1);
							}
						}, 5000); // 每5秒刷新一次
					}, 2000); // 延迟2秒，等待后端ASR服务启动
				} else {
					console.error('❌ 启动AI识别失败:', result);
				}
			} catch (error) {
				console.error('❌ 启动AI识别失败:', error);
			}
		});
	}
	
	// 停止AI识别（改为通过直播接口停止）
	const stopAIBtn = document.getElementById('stop-ai-btn');
	if (stopAIBtn) {
		stopAIBtn.addEventListener('click', async () => {
			if (!confirm('确定要停止AI识别吗？\n（这将停止整个直播）')) {
				return;
			}
			
			try {
				// 获取当前直播流ID
				const dashboard = await fetchDashboard();
				const streamId = dashboard?.streamId || null;
				
				// ⚠️ 重要修改：停止直播时会自动停止AI，无需单独调用 stopAI
				const result = await stopLive(streamId, true, true);
				
				if (result && result.success) {
					console.log('✅ AI识别已通过直播接口停止');
					updateAIControlButtons('stopped');
					
					// 清理AI内容刷新定时器
					if (window.aiContentRefreshTimer) {
						clearInterval(window.aiContentRefreshTimer);
						window.aiContentRefreshTimer = null;
						console.log('🧹 已清理AI内容刷新定时器');
					}
				} else {
					console.error('❌ 停止AI识别失败:', result);
				}
			} catch (error) {
				console.error('❌ 停止AI识别失败:', error);
			}
		});
	}
	
	// 暂停AI识别
	const pauseAIBtn = document.getElementById('pause-ai-btn');
	if (pauseAIBtn) {
		pauseAIBtn.addEventListener('click', async () => {
			const result = await toggleAI('pause', true);
			if (result) {
				updateAIControlButtons('paused');
			}
		});
	}
	
	// 恢复AI识别
	const resumeAIBtn = document.getElementById('resume-ai-btn');
	if (resumeAIBtn) {
		resumeAIBtn.addEventListener('click', async () => {
			const result = await toggleAI('resume', true);
			if (result) {
				updateAIControlButtons('running');
			}
		});
	}
	
	// 刷新AI内容
	const refreshAIBtn = document.getElementById('refresh-ai-content-btn');
	if (refreshAIBtn) {
		refreshAIBtn.addEventListener('click', async () => {
			await loadAIContentList();
		});
	}
}

// 更新AI控制按钮状态
function updateAIControlButtons(status) {
	const startBtn = document.getElementById('start-ai-btn');
	const stopBtn = document.getElementById('stop-ai-btn');
	const pauseBtn = document.getElementById('pause-ai-btn');
	const resumeBtn = document.getElementById('resume-ai-btn');
	const statusIcon = document.getElementById('ai-status-icon');
	const statusText = document.getElementById('ai-status-text');
	
	// 更新状态显示
	if (statusIcon && statusText) {
		switch (status) {
			case 'running':
				statusIcon.textContent = '🟢';
				statusText.textContent = '运行中';
				statusText.style.color = '#4CAF50';
				break;
			case 'paused':
				statusIcon.textContent = '🟡';
				statusText.textContent = '已暂停';
				statusText.style.color = '#FF9800';
				break;
			case 'stopped':
				statusIcon.textContent = '⚪';
				statusText.textContent = '未启动';
				statusText.style.color = '#666';
				break;
		}
	}
	
	// 更新按钮状态
	if (startBtn && stopBtn && pauseBtn && resumeBtn) {
		switch (status) {
			case 'running':
				startBtn.disabled = true;
				stopBtn.disabled = false;
				pauseBtn.disabled = false;
				pauseBtn.style.display = '';
				resumeBtn.style.display = 'none';
				break;
			case 'paused':
				startBtn.disabled = true;
				stopBtn.disabled = false;
				pauseBtn.style.display = 'none';
				resumeBtn.style.display = '';
				resumeBtn.disabled = false;
				break;
			case 'stopped':
				startBtn.disabled = false;
				stopBtn.disabled = true;
				pauseBtn.disabled = true;
				pauseBtn.style.display = '';
				resumeBtn.style.display = 'none';
				break;
		}
	}
}

// 加载AI内容列表
async function loadAIContentList(page = 1) {
	const data = await fetchAIContentList(page, 20, null, null);
	if (!data) return;
	
	const container = document.getElementById('ai-content-list');
	if (!container) return;
	
	if (data.items.length === 0) {
		container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无AI内容</div>';
		return;
	}
	
	// 渲染内容列表
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
	
	// 更新分页（新接口返回格式：{ total, page, items }）
	const pagination = document.getElementById('ai-content-pagination');
	if (pagination) {
		const totalPages = data.total ? Math.ceil(data.total / 20) : 0;
		if (totalPages > 1) {
			pagination.style.display = 'block';
			const pageInfo = document.getElementById('ai-page-info');
			if (pageInfo) {
				pageInfo.textContent = `第 ${data.page || page} 页 / 共 ${totalPages} 页`;
			}
		} else {
			pagination.style.display = 'none';
		}
	}
}

// 删除AI内容（全局函数，供HTML onclick调用）
window.deleteAIContentItem = async function(contentId) {
	if (!confirm('确定要删除这条AI内容吗？')) {
		return;
	}
	
	const reason = prompt('请输入删除原因（可选）：');
	const result = await deleteAIContent(contentId, reason || '管理员删除', true);
	if (result) {
		// 重新加载列表
		await loadAIContentList();
	}
};

// ==================== 直播控制事件 ====================

// 立即更新直播状态UI（乐观更新）
function updateLiveStatusUI(isLive) {
	// 更新顶部控制按钮
	const controlLiveBtn = document.getElementById('control-live-btn');
	if (controlLiveBtn) {
		if (isLive) {
			controlLiveBtn.textContent = '停止直播';
			controlLiveBtn.classList.remove('btn-primary', 'btn-success');
			controlLiveBtn.classList.add('btn-danger');
		} else {
			controlLiveBtn.textContent = '开始直播';
			controlLiveBtn.classList.remove('btn-danger');
			controlLiveBtn.classList.add('btn-primary');
		}
	}
	
	// 更新顶部状态显示
	const statusText = document.getElementById('live-status-text');
	if (statusText) {
		statusText.textContent = isLive ? '直播中' : '未开播';
	}
	const liveStatusEl = document.getElementById('live-status');
	if (liveStatusEl) {
		liveStatusEl.textContent = isLive ? '🟢 直播中' : '⚪ 未开播';
	}
	
	// 更新直播控制页面按钮
	const adminStartLiveBtn = document.getElementById('admin-start-live-btn');
	const adminStopLiveBtn = document.getElementById('admin-stop-live-btn');
	if (adminStartLiveBtn && adminStopLiveBtn) {
		adminStartLiveBtn.disabled = isLive;
		adminStopLiveBtn.disabled = !isLive;
	}
	
	// 更新直播控制页面状态显示
	const liveControlStatusEl = document.getElementById('live-control-status');
	if (liveControlStatusEl) {
		if (isLive) {
			liveControlStatusEl.innerHTML = '<span style="color: #4CAF50;">🟢 直播中</span>';
		} else {
			liveControlStatusEl.innerHTML = '<span style="color: #999;">⚪ 未开播</span>';
			// 隐藏直播流信息
			const streamInfoEl = document.getElementById('live-stream-info');
			if (streamInfoEl) {
				streamInfoEl.style.display = 'none';
			}
		}
	}
	
	// 更新全局状态
	if (window.globalState) {
		window.globalState.isLive = isLive;
	}
}

function initLiveControlEvents() {
	// 顶部直播控制按钮
	const controlLiveBtn = document.getElementById('control-live-btn');
	if (controlLiveBtn) {
		controlLiveBtn.addEventListener('click', async () => {
			// 先从服务器获取最新状态，确保状态同步
			try {
				const dashboard = await fetchDashboard();
				if (!dashboard) {
					console.error('获取直播状态失败');
					return;
				}
				
				const isLive = dashboard.isLive || false;
				
				// 更新 globalState 为最新状态
				if (window.globalState) {
					window.globalState.isLive = isLive;
				}
				
				if (isLive) {
					// 停止直播
					if (!confirm('确定要停止直播吗？')) {
						return;
					}
					
					// 立即更新UI（乐观更新）
					updateLiveStatusUI(false);
					
					try {
						// 从 dashboard 获取当前流ID
						const dashboard = await fetchDashboard();
						const streamId = dashboard?.streamId || null;
						
						const result = await stopLive(streamId, true, true);
						// 判断成功：有 success 为 true，或者有 status === 'stopped'，或者 result 不为空且没有错误字段
						const isSuccess = result && (
							result.success === true || 
							result.status === 'stopped' ||
							result.data?.status === 'stopped' ||
							(!result.error && !result.message)
						);
						
						if (!isSuccess) {
							// API失败，回滚UI
							updateLiveStatusUI(true);
							console.error('停止直播失败:', result);
							return;
						}
						
						console.log('✅ 停止直播成功:', result);
						
						// 清理AI内容刷新定时器
						if (window.aiContentRefreshTimer) {
							clearInterval(window.aiContentRefreshTimer);
							window.aiContentRefreshTimer = null;
							console.log('🧹 已清理AI内容刷新定时器');
						}
						
						// 立即刷新所有流状态列表
						if (typeof loadAllStreamsStatus === 'function') {
							loadAllStreamsStatus();
						}
						
						// 刷新 dashboard 和状态列表
						setTimeout(() => {
							if (typeof loadDashboard === 'function') {
								loadDashboard();
							}
							if (typeof loadAllStreamsStatus === 'function') {
								loadAllStreamsStatus();
							}
						}, 1000); // 延迟1秒，确保后端状态已更新
					} catch (error) {
						// API异常，回滚UI
						updateLiveStatusUI(true);
						console.error('停止直播失败:', error);
					}
				} else {
					// 开始直播
					// 获取选中的直播流ID（从直播控制页面）
					const streamSelect = document.getElementById('stream-select');
					const streamId = streamSelect?.value || null; // 如果未选择，使用默认直播流
					const autoStartAI = confirm('是否同时启动AI识别？');
					
					// 立即更新UI（乐观更新）
					updateLiveStatusUI(true);
					
					try {
						const result = await startLive(streamId, autoStartAI, true);
						// 判断成功：有 success 为 true，或者有 streamUrl 或 status === 'started'
						const isSuccess = result && (
							result.success === true || 
							result.streamUrl || 
							result.status === 'started' ||
							result.data?.streamUrl ||
							result.data?.status === 'started'
						);
						
						if (!isSuccess) {
							// API失败，回滚UI
							updateLiveStatusUI(false);
							console.error('开始直播失败:', result);
							return;
						}
						
						console.log('✅ 开始直播成功:', result);
						
						// 更新直播流信息（如果API返回了）
						if (result.streamUrl || result.data?.streamUrl) {
							const streamUrl = result.streamUrl || result.data?.streamUrl;
							const streamInfoEl = document.getElementById('live-stream-info');
							if (streamInfoEl) {
								streamInfoEl.style.display = 'block';
								const streamIdEl = document.getElementById('live-stream-id');
								const streamUrlEl = document.getElementById('live-stream-url');
								const startTimeEl = document.getElementById('live-start-time');
								if (streamIdEl) streamIdEl.textContent = result.liveId || result.data?.liveId || '-';
								if (streamUrlEl) streamUrlEl.textContent = streamUrl || '-';
								if (startTimeEl) startTimeEl.textContent = result.startTime || result.data?.startTime || '-';
							}
						}
						
						// 如果自动启动了AI，设置定时刷新AI内容
						if (autoStartAI) {
							setTimeout(() => {
								if (typeof loadAIContentList === 'function') {
									console.log('📡 AI已自动启动，开始订阅AI内容更新...');
									loadAIContentList(1);
								}
								
								// 设置定时刷新AI内容列表
								if (window.aiContentRefreshTimer) {
									clearInterval(window.aiContentRefreshTimer);
								}
								window.aiContentRefreshTimer = setInterval(() => {
									if (typeof loadAIContentList === 'function') {
										loadAIContentList(1);
									}
								}, 5000); // 每5秒刷新一次
							}, 2000); // 延迟2秒，等待后端ASR服务启动
						}
						
						// 立即刷新所有流状态列表
						if (typeof loadAllStreamsStatus === 'function') {
							loadAllStreamsStatus();
						}
						
						// 刷新 dashboard 和状态列表
						setTimeout(() => {
							if (typeof loadDashboard === 'function') {
								loadDashboard();
							}
							if (typeof loadAllStreamsStatus === 'function') {
								loadAllStreamsStatus();
							}
						}, 1000); // 延迟1秒，确保后端状态已更新
					} catch (error) {
						// API异常，回滚UI
						updateLiveStatusUI(false);
						console.error('开始直播失败:', error);
					}
				}
			} catch (error) {
				console.error('获取直播状态失败:', error);
			}
		});
	}
	
	// 直播控制页面的开始/停止按钮
	const adminStartLiveBtn = document.getElementById('admin-start-live-btn');
	const adminStopLiveBtn = document.getElementById('admin-stop-live-btn');
	
	if (adminStartLiveBtn) {
		adminStartLiveBtn.addEventListener('click', async () => {
			const autoStartAI = document.getElementById('auto-start-ai-checkbox')?.checked || false;
			// 获取选中的直播流ID
			const streamSelect = document.getElementById('stream-select');
			const streamId = streamSelect?.value || null; // 如果未选择，使用默认直播流
			
			if (!confirm('确定要开始直播吗？' + (streamId ? '\n将使用选中的直播流。' : '\n将使用默认启用的直播流。'))) {
				return;
			}
			
			// 立即更新UI（乐观更新）
			updateLiveStatusUI(true);
			
			try {
				const result = await startLive(streamId, autoStartAI, true);
				// 判断成功：有 success 为 true，或者有 streamUrl 或 status === 'started'
				const isSuccess = result && (
					result.success === true || 
					result.streamUrl || 
					result.status === 'started' ||
					result.data?.streamUrl ||
					result.data?.status === 'started'
				);
				
				if (!isSuccess) {
					// API失败，回滚UI
					updateLiveStatusUI(false);
					console.error('开始直播失败:', result);
					return;
				}
				
				console.log('✅ 开始直播成功:', result);
				
				// 更新直播流信息（如果API返回了）
				if (result.streamUrl || result.data?.streamUrl) {
					const streamUrl = result.streamUrl || result.data?.streamUrl;
					const streamInfoEl = document.getElementById('live-stream-info');
					if (streamInfoEl) {
						streamInfoEl.style.display = 'block';
						const streamIdEl = document.getElementById('live-stream-id');
						const streamUrlEl = document.getElementById('live-stream-url');
						const startTimeEl = document.getElementById('live-start-time');
						if (streamIdEl) streamIdEl.textContent = result.liveId || result.data?.liveId || '-';
						if (streamUrlEl) streamUrlEl.textContent = streamUrl || '-';
						if (startTimeEl) startTimeEl.textContent = result.startTime || result.data?.startTime || '-';
					}
				}
				
				// 如果自动启动了AI，设置定时刷新AI内容
				if (autoStartAI) {
					setTimeout(() => {
						if (typeof loadAIContentList === 'function') {
							console.log('📡 AI已自动启动，开始订阅AI内容更新...');
							loadAIContentList(1);
						}
						
						// 设置定时刷新AI内容列表
						if (window.aiContentRefreshTimer) {
							clearInterval(window.aiContentRefreshTimer);
						}
						window.aiContentRefreshTimer = setInterval(() => {
							if (typeof loadAIContentList === 'function') {
								loadAIContentList(1);
							}
						}, 5000); // 每5秒刷新一次
					}, 2000); // 延迟2秒，等待后端ASR服务启动
				}
				
				// 立即刷新所有流状态列表
				if (typeof loadAllStreamsStatus === 'function') {
					loadAllStreamsStatus();
				}
				
				// 刷新 dashboard 和状态列表
				setTimeout(() => {
					if (typeof loadDashboard === 'function') {
						loadDashboard();
					}
					if (typeof loadAllStreamsStatus === 'function') {
						loadAllStreamsStatus();
					}
				}, 1000); // 延迟1秒，确保后端状态已更新
			} catch (error) {
				// API异常，回滚UI
				updateLiveStatusUI(false);
				console.error('开始直播失败:', error);
			}
		});
	}
	
	if (adminStopLiveBtn) {
		adminStopLiveBtn.addEventListener('click', async () => {
			// 获取当前直播流ID（多直播支持）
			const streamSelect = document.getElementById('stream-select');
			const streamId = streamSelect?.value || null;
			
			if (!confirm('确定要停止直播吗？')) {
				return;
			}
			
			// 立即更新UI（乐观更新）
			updateLiveStatusUI(false);
			
					try {
						const result = await stopLive(streamId, true, true);
						// 判断成功：有 success 为 true，或者有 status === 'stopped'，或者 result 不为空且没有错误字段
						const isSuccess = result && (
							result.success === true || 
							result.status === 'stopped' ||
							result.data?.status === 'stopped' ||
							(!result.error && !result.message)
						);
						
						if (!isSuccess) {
							// API失败，回滚UI
							updateLiveStatusUI(true);
							console.error('停止直播失败:', result);
							return;
						}
						
						console.log('✅ 停止直播成功:', result);
						
						// 清理AI内容刷新定时器
						if (window.aiContentRefreshTimer) {
							clearInterval(window.aiContentRefreshTimer);
							window.aiContentRefreshTimer = null;
							console.log('🧹 已清理AI内容刷新定时器');
						}
						
						// 立即刷新所有流状态列表
						if (typeof loadAllStreamsStatus === 'function') {
							loadAllStreamsStatus();
						}
						
						// 刷新 dashboard 和状态列表
						setTimeout(() => {
							if (typeof loadDashboard === 'function') {
								loadDashboard();
							}
							if (typeof loadAllStreamsStatus === 'function') {
								loadAllStreamsStatus();
							}
						}, 1000); // 延迟1秒，确保后端状态已更新
					} catch (error) {
						// API异常，回滚UI
						updateLiveStatusUI(true);
						console.error('停止直播失败:', error);
					}
				});
			}
		}

console.log('✅ 后台管理系统事件处理器加载完成');

