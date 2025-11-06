<template>
	<view class="live-select-container">
		<!-- 背景（与 home.vue 相同，但不需要动画） -->
		<view class="fullscreen-bg"></view>
		
		<!-- 顶部标题区域 -->
		<view class="header-section">
			<view class="header-title">
				<view class="title-main">
					<image src="/static/iconfont/zhibo.png" class="title-icon-img" mode="aspectFit"></image>
					<text class="title-main-text">选择直播间</text>
				</view>
				<text class="title-sub">Choose Your Live Room</text>
			</view>
		</view>
		
		<!-- 直播列表 -->
		<scroll-view class="live-list-section" scroll-y="true">
			<!-- 加载中 -->
			<view v-if="loading" class="loading-container">
				<view class="loading-spinner"></view>
				<text class="loading-text">加载直播列表中...</text>
			</view>
			
			<!-- 直播卡片列表 -->
			<view v-else-if="liveStreams.length > 0" class="live-cards-container">
				<view 
					v-for="stream in liveStreams" 
					:key="stream.id"
					class="live-card"
					:class="{ 'is-live': stream.isLive }"
					@click="enterLiveRoom(stream)"
				>
					<!-- 直播状态标签 -->
					<view class="live-status-badge" :class="{ 'live': stream.isLive }">
						<text class="status-dot">●</text>
						<text class="status-text">{{ stream.isLive ? '正在直播' : '未开播' }}</text>
					</view>
					
					<!-- 直播间信息 -->
					<view class="card-content">
						<!-- 直播间名称 -->
						<view class="stream-name">
							<image src="/static/iconfont/bofang.png" class="name-icon-img" mode="aspectFit"></image>
							<text class="name-text">{{ stream.name }}</text>
						</view>
						
						<!-- 辩题信息 -->
						<view v-if="stream.debateTopic && stream.debateTopic.title" class="debate-info">
							<text class="debate-title">{{ stream.debateTopic.title }}</text>
							<view class="debate-sides">
								<view class="side left-side">
									<image src="/static/iconfont/gongjigongju.png" class="side-icon-img" mode="aspectFit"></image>
									<text class="side-text">{{ stream.debateTopic.leftSide || stream.debateTopic.leftPosition || '' }}</text>
								</view>
								<text class="vs">VS</text>
								<view class="side right-side">
									<image src="/static/iconfont/fangyudunpai-.png" class="side-icon-img" mode="aspectFit"></image>
									<text class="side-text">{{ stream.debateTopic.rightSide || stream.debateTopic.rightPosition || '' }}</text>
								</view>
							</view>
						</view>
						
						<!-- 直播数据（仅直播中显示） -->
						<view v-if="stream.isLive" class="stream-stats">
							<view class="stat-item">
								<image src="/static/iconfont/guankanrenshu.png" class="stat-icon-img" mode="aspectFit"></image>
								<text class="stat-label">观看:</text>
								<text class="stat-value">{{ stream.activeUsers || 0 }}</text>
							</view>
							<view class="stat-item">
								<image src="/static/iconfont/toupiao.png" class="stat-icon-img" mode="aspectFit"></image>
								<text class="stat-label">投票:</text>
								<text class="stat-value">{{ stream.totalVotes || 0 }}</text>
							</view>
						</view>
						
						<!-- 投票进度条（仅直播中显示，显示具体票数） -->
						<view v-if="stream.isLive" class="vote-progress">
							<view class="progress-bar-container">
								<view class="progress-left" :style="{ width: stream.leftPercentage + '%' }">
									<text class="progress-text">{{ stream.leftVotes || 0 }}</text>
								</view>
								<view class="progress-right" :style="{ width: stream.rightPercentage + '%' }">
									<text class="progress-text">{{ stream.rightVotes || 0 }}</text>
								</view>
							</view>
							<!-- 票数信息 -->
							<view class="vote-info">
								<text class="vote-label left-label">正方: {{ stream.leftVotes || 0 }}</text>
								<text class="vote-label right-label">反方: {{ stream.rightVotes || 0 }}</text>
							</view>
						</view>
						
						<!-- 进入按钮 -->
						<view class="enter-btn" :class="{ 'disabled': !stream.isLive }">
							<text class="btn-text">{{ stream.isLive ? '进入直播间' : '等待开播' }}</text>
							<image v-if="stream.isLive" src="/static/iconfont/bofang.png" class="btn-icon-img" mode="aspectFit"></image>
							<image v-else src="/static/iconfont/suo.png" class="btn-icon-img" mode="aspectFit"></image>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view v-else class="empty-container">
				<image src="/static/iconfont/zhibo.png" class="empty-icon-img" mode="aspectFit"></image>
				<text class="empty-text">暂无直播间</text>
				<text class="empty-hint">请稍后再来</text>
			</view>
		</scroll-view>
		
		<!-- 底部刷新按钮 -->
		<view class="footer-section">
			<view class="refresh-btn" @click="refreshStreams">
				<image src="/static/iconfont/shuaxin.png" class="refresh-icon-img" mode="aspectFit"></image>
				<text class="refresh-text">刷新列表</text>
			</view>
		</view>
	</view>
</template>

<script>
import apiService from '@/utils/api-service.js';

export default {
	data() {
		return {
			loading: true,
			liveStreams: [],
			wsConnection: null,
			reconnectTimer: null
		};
	},
	
	onLoad() {
		console.log('📺 直播选择页面加载');
		this.loadLiveStreams();
		this.connectWebSocket();
	},
	
	onShow() {
		// 页面显示时刷新列表
		this.refreshStreams();
	},
	
	onUnload() {
		// 页面卸载时断开WebSocket
		this.disconnectWebSocket();
	},
	
	methods: {
		// 加载直播流列表
		async loadLiveStreams() {
			try {
				this.loading = true;
				console.log('📡 正在获取直播流列表...');
				
				const streams = await apiService.getStreamsList();
				
				console.log('✅ 获取到直播流:', streams);
				console.log(`📊 总共 ${streams?.length || 0} 个直播流`);
				
				if (!streams || streams.length === 0) {
					console.warn('⚠️ 没有获取到任何直播流');
					this.liveStreams = [];
					this.loading = false;
					return;
				}
				
				// 筛选已启用的直播流
				const enabledStreams = streams.filter(s => s.enabled);
				console.log(`✅ 筛选后有 ${enabledStreams.length} 个已启用的直播流`);
				
				if (enabledStreams.length === 0) {
					console.warn('⚠️ 没有已启用的直播流');
					this.liveStreams = [];
					this.loading = false;
					return;
				}
				
				// 为每个直播流获取详细信息
				const streamsWithDetails = await Promise.all(
					enabledStreams.map(stream => this.fetchStreamDetails(stream))
				);
				
				this.liveStreams = streamsWithDetails;
				this.loading = false;
				
				console.log('✅ 直播流列表加载完成:');
				this.liveStreams.forEach(stream => {
					console.log(`  - ${stream.name} (ID: ${stream.id}): ${stream.isLive ? '🟢 正在直播' : '⚪ 未开播'}`);
				});
			} catch (error) {
				console.error('❌ 加载直播流列表失败:', error);
				this.loading = false;
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			}
		},
		
		// 获取单个直播流的详细信息
		async fetchStreamDetails(stream) {
			try {
				console.log(`📊 获取直播流 "${stream.name}" (ID: ${stream.id}) 的详细信息...`);
				
				// 🔧 修复：为每个流单独调用Dashboard API，传递streamId参数
				// 这样可以获取每个流的独立状态，支持多流并发直播
				const dashboard = await apiService.getDashboard(stream.id);
				console.log(`📊 流 "${stream.name}" 的 Dashboard 数据:`, {
					isLive: dashboard?.isLive,
					streamId: dashboard?.streamId,
					liveStreamUrl: dashboard?.liveStreamUrl,
					activeUsers: dashboard?.activeUsers
				});
				
				// 直接使用Dashboard返回的isLive状态，确保每个流的状态独立
				const isCurrentlyLive = dashboard?.isLive === true;
				
				console.log(`${isCurrentlyLive ? '🟢' : '⚪'} 直播流 "${stream.name}" 状态: ${isCurrentlyLive ? '正在直播' : '未开播'}`);
				
				// 获取该直播流的投票数据（使用getVotes获取完整票数信息）
				let votesData = null;
				try {
					const votesResponse = await apiService.getVotes(stream.id);
					if (votesResponse && votesResponse.success && votesResponse.data) {
						votesData = votesResponse.data;
					}
				} catch (error) {
					console.warn('⚠️ 获取投票数据失败，尝试使用统计接口:', error);
					// 如果getVotes失败，尝试使用getVotesStatistics作为备用
					try {
						votesData = await apiService.getVotesStatistics(stream.id);
					} catch (statsError) {
						console.warn('⚠️ 获取投票统计数据也失败:', statsError);
					}
				}
				
				// 🔧 如果Dashboard数据包含票数，优先使用Dashboard的数据（更实时）
				if (dashboard && dashboard.leftVotes !== undefined && dashboard.rightVotes !== undefined) {
					console.log('📊 Dashboard包含票数数据，使用Dashboard数据:', {
						left: dashboard.leftVotes,
						right: dashboard.rightVotes
					});
					votesData = {
						leftVotes: dashboard.leftVotes,
						rightVotes: dashboard.rightVotes,
						totalVotes: dashboard.totalVotes || ((dashboard.leftVotes || 0) + (dashboard.rightVotes || 0)),
						leftPercentage: dashboard.leftPercentage,
						rightPercentage: dashboard.rightPercentage
					};
				}
				
				// 获取辩题信息（传递当前流的ID）
				const debateResponse = await apiService.getDebateTopic(stream.id);
				
				// 处理辩题数据，确保格式统一
				let debateTopic = null;
				if (debateResponse && debateResponse.success && debateResponse.data) {
					debateTopic = debateResponse.data;
				} else if (debateResponse && debateResponse.data) {
					debateTopic = debateResponse.data;
				} else if (debateResponse && debateResponse.title) {
					// 直接返回辩题对象的情况
					debateTopic = debateResponse;
				}
				
				return {
					...stream,
					isLive: isCurrentlyLive, // 从该流的Dashboard获取独立状态
					activeUsers: isCurrentlyLive ? (dashboard?.activeUsers || 0) : 0,
					totalVotes: votesData?.totalVotes || (votesData?.leftVotes || 0) + (votesData?.rightVotes || 0),
					leftVotes: votesData?.leftVotes || 0,
					rightVotes: votesData?.rightVotes || 0,
					leftPercentage: votesData?.leftPercentage || 50,
					rightPercentage: votesData?.rightPercentage || 50,
					debateTopic: debateTopic
				};
			} catch (error) {
				console.warn('⚠️ 获取直播流详细信息失败:', stream.id, error);
				return {
					...stream,
					isLive: false,
					activeUsers: 0,
					totalVotes: 0,
					leftVotes: 0,
					rightVotes: 0,
					leftPercentage: 50,
					rightPercentage: 50
				};
			}
		},
		
		// 刷新直播流列表
		async refreshStreams() {
			console.log('🔄 刷新直播流列表');
			await this.loadLiveStreams();
			
			uni.showToast({
				title: '刷新成功',
				icon: 'success',
				duration: 1500
			});
		},
		
		// 进入直播间
		enterLiveRoom(stream) {
			if (!stream.isLive) {
				uni.showToast({
					title: '直播未开始',
					icon: 'none'
				});
				return;
			}
			
			console.log('🚀 进入直播间:', stream.id, stream.name);
			
			// 跳转到直播间页面，传递 streamId
			uni.navigateTo({
				url: `/pages/home/home?streamId=${stream.id}`
			});
		},
		
		// ==================== WebSocket 相关 ====================
		
		// 连接 WebSocket
		connectWebSocket() {
			try {
				const wsUrl = apiService.getWebSocketUrl();
				console.log('🔌 连接 WebSocket:', wsUrl);
				
				this.wsConnection = uni.connectSocket({
					url: wsUrl,
					success: () => {
						console.log('✅ WebSocket 连接请求已发送');
					},
					fail: (error) => {
						console.error('❌ WebSocket 连接失败:', error);
					}
				});
				
				this.wsConnection.onOpen(() => {
					console.log('✅ WebSocket 已连接');
				});
				
				this.wsConnection.onMessage((event) => {
					try {
						const message = JSON.parse(event.data);
						this.handleWebSocketMessage(message);
					} catch (error) {
						console.error('❌ 解析 WebSocket 消息失败:', error);
					}
				});
				
				this.wsConnection.onError((error) => {
					console.error('❌ WebSocket 错误:', error);
					this.scheduleReconnect();
				});
				
				this.wsConnection.onClose(() => {
					console.log('🔌 WebSocket 已断开');
					this.scheduleReconnect();
				});
			} catch (error) {
				console.error('❌ 创建 WebSocket 连接失败:', error);
			}
		},
		
		// 断开 WebSocket
		disconnectWebSocket() {
			if (this.reconnectTimer) {
				clearTimeout(this.reconnectTimer);
				this.reconnectTimer = null;
			}
			
			if (this.wsConnection) {
				try {
					this.wsConnection.close();
					this.wsConnection = null;
				} catch (error) {
					console.error('❌ 关闭 WebSocket 失败:', error);
				}
			}
		},
		
		// 计划重连
		scheduleReconnect() {
			if (this.reconnectTimer) {
				return;
			}
			
			this.reconnectTimer = setTimeout(() => {
				console.log('🔄 尝试重连 WebSocket');
				this.reconnectTimer = null;
				this.connectWebSocket();
			}, 5000);
		},
		
		// 处理 WebSocket 消息
		handleWebSocketMessage(message) {
			const { type, streamId, liveId, data } = message;
			
			// 🔧 支持多种streamId字段名（兼容性处理）
			const currentStreamId = streamId || liveId || data?.streamId || data?.liveId;
			
			console.log('📩 收到 WebSocket 消息:', type, '流ID:', currentStreamId);
			
			switch (type) {
				case 'liveStatus':
				case 'live-status-changed':
					// 处理直播状态更新，支持多流
					if (currentStreamId && data) {
						this.updateLiveStatus(currentStreamId, data);
					} else if (data) {
						// 如果没有streamId，尝试从data中获取
						const streamIdFromData = data.streamId || data.liveId;
						if (streamIdFromData) {
							this.updateLiveStatus(streamIdFromData, data);
						} else {
							console.warn('⚠️ WebSocket消息缺少streamId，无法更新特定流状态');
						}
					}
					break;
				case 'votesUpdate':
				case 'votes-updated':
					// 处理投票更新，支持多流
					if (currentStreamId && data) {
						this.updateVotes(currentStreamId, data);
					}
					break;
				default:
					console.log('📨 未知消息类型:', type);
					break;
			}
		},
		
		// 更新直播状态
		updateLiveStatus(streamId, data) {
			const stream = this.liveStreams.find(s => s.id === streamId);
			if (stream) {
				// 🔧 支持多种状态字段格式
				const isLive = data.isLive !== undefined 
					? data.isLive 
					: (data.status === 'started' || data.status === 'running');
				
				stream.isLive = isLive;
				// 如果提供了activeUsers，也更新
				if (data.activeUsers !== undefined) {
					stream.activeUsers = data.activeUsers;
				}
				
				console.log(`✅ 直播间 "${stream.name}" 状态更新: ${isLive ? '🟢 直播中' : '⚪ 未开播'}`);
				
				// 强制更新视图
				this.$forceUpdate();
			} else {
				console.warn(`⚠️ 未找到流ID为 ${streamId} 的直播流，无法更新状态`);
			}
		},
		
		// 更新投票数据（支持多流，完全符合文档要求）
		updateVotes(streamId, data) {
			const stream = this.liveStreams.find(s => s.id === streamId);
			if (stream) {
				// 🔍 多直播流支持：检查消息是否属于当前流
				const messageStreamId = data.streamId || streamId;
				if (messageStreamId && messageStreamId !== streamId) {
					console.log('⏩ 投票更新消息不属于当前流，忽略:', messageStreamId, '当前流:', streamId);
					return;
				}
				
				// 更新票数数据
				if (data.leftVotes !== undefined) {
					stream.leftVotes = data.leftVotes;
				}
				if (data.rightVotes !== undefined) {
					stream.rightVotes = data.rightVotes;
				}
				if (data.totalVotes !== undefined) {
					stream.totalVotes = data.totalVotes;
				} else if (data.leftVotes !== undefined && data.rightVotes !== undefined) {
					// 如果没有totalVotes，根据leftVotes和rightVotes计算
					stream.totalVotes = (data.leftVotes || 0) + (data.rightVotes || 0);
				}
				if (data.leftPercentage !== undefined) {
					stream.leftPercentage = data.leftPercentage;
				}
				if (data.rightPercentage !== undefined) {
					stream.rightPercentage = data.rightPercentage;
				}
				
				console.log(`✅ 直播间 "${stream.name}" 票数更新:`, {
					left: stream.leftVotes,
					right: stream.rightVotes,
					total: stream.totalVotes
				});
				
				// 强制更新视图
				this.$forceUpdate();
			} else {
				console.warn(`⚠️ 未找到流ID为 ${streamId} 的直播流，无法更新票数`);
			}
		}
	}
};
</script>

<style scoped>
/* ==================== 容器和背景 ==================== */
.live-select-container {
	width: 100%;
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	box-sizing: border-box; /* 确保宽度计算正确 */
	max-width: 100vw; /* 防止超出视口宽度 */
}

/* 背景 - 与 home.vue 相同的渐变背景 */
.fullscreen-bg {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: linear-gradient(
		135deg,
		rgba(30, 30, 60, 0.98) 0%,
		rgba(20, 20, 40, 0.98) 50%,
		rgba(15, 15, 30, 0.98) 100%
	);
	z-index: 0;
}

/* ==================== 顶部标题区域 ==================== */
.header-section {
	position: relative;
	z-index: 10;
	padding: 60rpx 40rpx 40rpx;
	text-align: center;
}

.header-title {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 15rpx;
}

.title-main {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.title-icon-img {
	width: 48rpx;
	height: 48rpx;
}

.title-main-text {
	font-size: 52rpx;
	font-weight: 700;
	color: #ffffff;
	text-shadow: 
		0 0 20rpx rgba(255, 100, 150, 0.6),
		0 4rpx 10rpx rgba(0, 0, 0, 0.5);
	letter-spacing: 3rpx;
}

.title-sub {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.7);
	letter-spacing: 2rpx;
	text-transform: uppercase;
}

/* ==================== 直播列表区域 ==================== */
.live-list-section {
	flex: 1;
	position: relative;
	z-index: 10;
	padding: 0 30rpx 30rpx;
	overflow-y: auto;
	box-sizing: border-box; /* 确保padding包含在宽度内 */
}

.live-cards-container {
	display: flex;
	flex-direction: column;
	gap: 30rpx;
	padding-bottom: 120rpx; /* 为底部按钮留出空间 */
	width: 100%;
	box-sizing: border-box; /* 确保宽度计算正确 */
}

/* ==================== 直播卡片 ==================== */
.live-card {
	background: linear-gradient(
		135deg,
		rgba(255, 255, 255, 0.08) 0%,
		rgba(255, 255, 255, 0.03) 100%
	);
	border-radius: 24rpx;
	padding: 30rpx;
	backdrop-filter: blur(20rpx);
	border: 2rpx solid rgba(255, 255, 255, 0.1);
	box-shadow: 
		0 8rpx 32rpx rgba(0, 0, 0, 0.3),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;
	width: 100%;
	box-sizing: border-box; /* 确保padding包含在宽度内 */
	max-width: 100%; /* 防止超出容器 */
}

.live-card::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 4rpx;
	background: linear-gradient(90deg, 
		rgba(255, 100, 150, 0.3) 0%,
		rgba(100, 150, 255, 0.3) 100%
	);
	opacity: 0;
	transition: opacity 0.3s;
}

.live-card.is-live::before {
	opacity: 1;
	animation: gradientShift 3s ease-in-out infinite;
}

@keyframes gradientShift {
	0%, 100% {
		background: linear-gradient(90deg, 
			rgba(255, 100, 150, 0.6) 0%,
			rgba(100, 150, 255, 0.6) 100%
		);
	}
	50% {
		background: linear-gradient(90deg, 
			rgba(100, 150, 255, 0.6) 0%,
			rgba(255, 100, 150, 0.6) 100%
		);
	}
}

.live-card:active {
	transform: scale(0.98);
	box-shadow: 
		0 4rpx 16rpx rgba(0, 0, 0, 0.4),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
}

/* ==================== 直播状态标签 ==================== */
.live-status-badge {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
	background: rgba(100, 100, 100, 0.3);
	border: 1rpx solid rgba(255, 255, 255, 0.2);
	margin-bottom: 20rpx;
}

.live-status-badge.live {
	background: rgba(255, 50, 50, 0.2);
	border-color: rgba(255, 50, 50, 0.5);
	animation: pulseLive 2s ease-in-out infinite;
}

@keyframes pulseLive {
	0%, 100% {
		box-shadow: 0 0 0 0 rgba(255, 50, 50, 0.7);
	}
	50% {
		box-shadow: 0 0 0 10rpx rgba(255, 50, 50, 0);
	}
}

.status-dot {
	font-size: 20rpx;
	color: #999;
}

.live-status-badge.live .status-dot {
	color: #ff3232;
	animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
}

.status-text {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.8);
	font-weight: 500;
}

/* ==================== 卡片内容 ==================== */
.card-content {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	width: 100%;
	box-sizing: border-box; /* 确保宽度计算正确 */
}

.stream-name {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.name-icon-img {
	width: 36rpx;
	height: 36rpx;
}

.name-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
	text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

/* ==================== 辩题信息 ==================== */
.debate-info {
	background: rgba(0, 0, 0, 0.2);
	border-radius: 16rpx;
	padding: 20rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.debate-title {
	display: block;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
	margin-bottom: 12rpx;
	line-height: 1.4;
}

.debate-sides {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10rpx;
	width: 100%;
	box-sizing: border-box; /* 确保宽度计算正确 */
}

.side {
	flex: 1;
	font-size: 22rpx;
	padding: 8rpx 12rpx;
	border-radius: 8rpx;
	text-align: center;
	min-width: 0; /* 防止flex子元素溢出 */
	box-sizing: border-box; /* 确保padding包含在宽度内 */
	overflow: hidden; /* 防止文本溢出 */
	text-overflow: ellipsis; /* 文本溢出显示省略号 */
	white-space: nowrap; /* 不换行 */
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6rpx;
}

.side-icon-img {
	width: 24rpx;
	height: 24rpx;
	flex-shrink: 0;
}

.side-text {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.left-side {
	background: rgba(255, 100, 150, 0.15);
	color: rgba(255, 150, 180, 0.95);
	border: 1rpx solid rgba(255, 100, 150, 0.3);
}

.right-side {
	background: rgba(100, 150, 255, 0.15);
	color: rgba(150, 180, 255, 0.95);
	border: 1rpx solid rgba(100, 150, 255, 0.3);
}

.vs {
	font-size: 20rpx;
	color: rgba(255, 255, 255, 0.5);
	font-weight: 600;
}

/* ==================== 统计数据 ==================== */
.stream-stats {
	display: flex;
	gap: 24rpx;
}

.stat-item {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 10rpx 16rpx;
	background: rgba(0, 0, 0, 0.2);
	border-radius: 12rpx;
	border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.stat-icon-img {
	width: 24rpx;
	height: 24rpx;
}

.stat-label {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.6);
}

.stat-value {
	font-size: 24rpx;
	font-weight: 600;
	color: #ffffff;
}

/* ==================== 投票进度条 ==================== */
.vote-progress {
	margin-top: 8rpx;
	width: 100%;
	box-sizing: border-box; /* 确保宽度计算正确 */
}

.progress-bar-container {
	display: flex;
	height: 40rpx;
	border-radius: 20rpx;
	overflow: hidden;
	background: rgba(0, 0, 0, 0.3);
	border: 1rpx solid rgba(255, 255, 255, 0.1);
	width: 100%;
	box-sizing: border-box; /* 确保宽度计算正确 */
	max-width: 100%; /* 防止超出容器 */
}

.progress-left,
.progress-right {
	display: flex;
	align-items: center;
	justify-content: center;
	transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-left {
	background: linear-gradient(90deg, 
		rgba(255, 100, 150, 0.6) 0%,
		rgba(255, 100, 150, 0.8) 100%
	);
}

.progress-right {
	background: linear-gradient(90deg, 
		rgba(100, 150, 255, 0.8) 0%,
		rgba(100, 150, 255, 0.6) 100%
	);
}

.progress-text {
	font-size: 20rpx;
	color: #ffffff;
	font-weight: 600;
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.5);
}

/* ==================== 票数信息 ==================== */
.vote-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 12rpx;
	gap: 12rpx;
}

.vote-label {
	font-size: 22rpx;
	font-weight: 500;
	padding: 6rpx 12rpx;
	border-radius: 8rpx;
}

.left-label {
	color: rgba(255, 150, 180, 0.95);
	background: rgba(255, 100, 150, 0.15);
	border: 1rpx solid rgba(255, 100, 150, 0.3);
}

.right-label {
	color: rgba(150, 180, 255, 0.95);
	background: rgba(100, 150, 255, 0.15);
	border: 1rpx solid rgba(100, 150, 255, 0.3);
}

/* ==================== 进入按钮 ==================== */
.enter-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	padding: 20rpx;
	border-radius: 16rpx;
	background: linear-gradient(135deg, 
		rgba(255, 100, 150, 0.8) 0%,
		rgba(255, 100, 150, 0.6) 100%
	);
	border: 2rpx solid rgba(255, 100, 150, 0.5);
	box-shadow: 
		0 4rpx 12rpx rgba(255, 100, 150, 0.3),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	transition: all 0.3s;
	margin-top: 12rpx;
	width: 100%;
	box-sizing: border-box; /* 确保padding包含在宽度内 */
	max-width: 100%; /* 防止超出容器 */
}

.enter-btn.disabled {
	background: rgba(100, 100, 100, 0.3);
	border-color: rgba(255, 255, 255, 0.1);
	box-shadow: none;
	opacity: 0.6;
}

.btn-text {
	font-size: 28rpx;
	font-weight: 600;
	color: #ffffff;
	text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.btn-icon-img {
	width: 28rpx;
	height: 28rpx;
}

/* ==================== 加载状态 ==================== */
.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 40rpx;
	gap: 30rpx;
}

.loading-spinner {
	width: 60rpx;
	height: 60rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.2);
	border-top-color: rgba(255, 100, 150, 0.8);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.loading-text {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.7);
}

/* ==================== 空状态 ==================== */
.empty-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 40rpx;
	gap: 20rpx;
}

.empty-icon-img {
	width: 100rpx;
	height: 100rpx;
	opacity: 0.5;
}

.empty-text {
	font-size: 32rpx;
	color: rgba(255, 255, 255, 0.8);
	font-weight: 500;
}

.empty-hint {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.5);
}

/* ==================== 底部刷新按钮 ==================== */
.footer-section {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 30rpx;
	background: linear-gradient(
		to top,
		rgba(20, 20, 40, 0.95) 0%,
		rgba(20, 20, 40, 0.7) 70%,
		transparent 100%
	);
	backdrop-filter: blur(10rpx);
	z-index: 20;
	display: flex;
	justify-content: center;
}

.refresh-btn {
	display: flex;
	align-items: center;
	gap: 12rpx;
	padding: 18rpx 40rpx;
	border-radius: 50rpx;
	background: rgba(255, 255, 255, 0.1);
	border: 2rpx solid rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10rpx);
	transition: all 0.3s;
}

.refresh-btn:active {
	transform: scale(0.95);
	background: rgba(255, 255, 255, 0.15);
}

.refresh-icon-img {
	width: 30rpx;
	height: 30rpx;
}

.refresh-text {
	font-size: 26rpx;
	color: #ffffff;
	font-weight: 500;
}
</style>

