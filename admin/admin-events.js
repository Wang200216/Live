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
	// 启动AI识别
	const startAIBtn = document.getElementById('start-ai-btn');
	if (startAIBtn) {
		startAIBtn.addEventListener('click', async () => {
			// 获取AI设置
			const settings = {
				mode: document.getElementById('ai-mode')?.value || 'realtime',
				sensitivity: document.getElementById('ai-sensitivity')?.value || 'high',
				interval: parseInt(document.getElementById('ai-interval')?.value) || 5000,
				minConfidence: parseFloat(document.getElementById('ai-confidence')?.value) || 0.7
			};
			
			if (!confirm('确定要启动AI识别吗？')) {
				return;
			}
			
			const result = await startAI(settings, true);
			if (result) {
				updateAIControlButtons('running');
			}
		});
	}
	
	// 停止AI识别
	const stopAIBtn = document.getElementById('stop-ai-btn');
	if (stopAIBtn) {
		stopAIBtn.addEventListener('click', async () => {
			if (!confirm('确定要停止AI识别吗？')) {
				return;
			}
			
			const result = await stopAI(true, true);
			if (result) {
				updateAIControlButtons('stopped');
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
	
	// 更新分页
	const pagination = document.getElementById('ai-content-pagination');
	if (pagination) {
		pagination.style.display = 'block';
		const pageInfo = document.getElementById('ai-page-info');
		if (pageInfo) {
			pageInfo.textContent = `第 ${data.page} 页 / 共 ${Math.ceil(data.total / 20)} 页`;
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
				const globalState = window.globalState || {};
				
				// 更新 globalState 为最新状态
				if (window.globalState) {
					window.globalState.isLive = isLive;
				}
				
				if (isLive) {
					// 停止直播
					if (!confirm('确定要停止直播吗？')) {
						return;
					}
					const result = await stopLive(true, true);
					if (result) {
						controlLiveBtn.textContent = '开始直播';
						controlLiveBtn.classList.remove('btn-danger');
						controlLiveBtn.classList.add('btn-success');
						if (window.globalState) {
							window.globalState.isLive = false;
						}
						// 刷新 dashboard 以更新显示
						if (typeof loadDashboard === 'function') {
							loadDashboard();
						}
					}
				} else {
					// 开始直播
					// 先获取可用的直播流
					const streamId = null; // 使用默认直播流
					const autoStartAI = confirm('是否同时启动AI识别？');
					
					const result = await startLive(streamId, autoStartAI, true);
					if (result) {
						controlLiveBtn.textContent = '停止直播';
						controlLiveBtn.classList.remove('btn-success');
						controlLiveBtn.classList.add('btn-danger');
						if (window.globalState) {
							window.globalState.isLive = true;
						}
						// 刷新 dashboard 以更新显示
						if (typeof loadDashboard === 'function') {
							loadDashboard();
						}
					}
				}
			} catch (error) {
				console.error('获取直播状态失败:', error);
				alert('获取直播状态失败，请刷新页面重试');
			}
		});
	}
	
	// 直播控制页面的开始/停止按钮
	const adminStartLiveBtn = document.getElementById('admin-start-live-btn');
	const adminStopLiveBtn = document.getElementById('admin-stop-live-btn');
	
	if (adminStartLiveBtn) {
		adminStartLiveBtn.addEventListener('click', async () => {
			const autoStartAI = document.getElementById('auto-start-ai-checkbox')?.checked || false;
			const streamId = null; // 使用默认直播流
			
			if (!confirm('确定要开始直播吗？')) {
				return;
			}
			
			const result = await startLive(streamId, autoStartAI, true);
			if (result) {
				adminStartLiveBtn.disabled = true;
				adminStopLiveBtn.disabled = false;
				if (window.globalState) {
					window.globalState.isLive = true;
				}
				
				// 更新显示
				const statusEl = document.getElementById('live-control-status');
				if (statusEl) {
					statusEl.innerHTML = '<span style="color: #4CAF50;">🟢 直播中</span>';
				}
				
				// 更新直播流信息
				if (result.streamUrl) {
					const streamInfoEl = document.getElementById('live-stream-info');
					if (streamInfoEl) {
						streamInfoEl.style.display = 'block';
						document.getElementById('live-stream-id').textContent = result.liveId || '-';
						document.getElementById('live-stream-url').textContent = result.streamUrl || '-';
						document.getElementById('live-start-time').textContent = result.startTime || '-';
					}
				}
			}
		});
	}
	
	if (adminStopLiveBtn) {
		adminStopLiveBtn.addEventListener('click', async () => {
			if (!confirm('确定要停止直播吗？')) {
				return;
			}
			
			const result = await stopLive(true, true);
			if (result) {
				adminStartLiveBtn.disabled = false;
				adminStopLiveBtn.disabled = true;
				if (window.globalState) {
					window.globalState.isLive = false;
				}
				
				// 更新显示
				const statusEl = document.getElementById('live-control-status');
				if (statusEl) {
					statusEl.innerHTML = '<span style="color: #999;">⚪ 未开播</span>';
				}
				
				// 隐藏直播流信息
				const streamInfoEl = document.getElementById('live-stream-info');
				if (streamInfoEl) {
					streamInfoEl.style.display = 'none';
				}
			}
		});
	}
}

console.log('✅ 后台管理系统事件处理器加载完成');

