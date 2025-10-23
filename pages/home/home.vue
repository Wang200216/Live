<template>
	<view class="home-container">
		<!-- 直播画面区域 - 优化：改用CSS隐藏而非v-if卸载，保证视频后台播放 -->
		<view class="live-section" :class="{ 'collapsed-hide': isLiveCollapsed }">
			<!-- 直播视频区域 -->
			<view class="live-video-container">
				<!-- 收起按钮 - 浮动在右上角 -->
				<view class="collapse-btn-floating" @click="toggleLiveCollapse">
					<text class="collapse-icon">▲</text>
				</view>
				
				<!-- 票数进度条对比 - 浮动在直播画面上方（实时统计） -->
				<view class="vote-progress-overlay">
					<view class="progress-bar">
						<!-- 左侧区域 -->
						<view class="progress-fill left-fill" :style="{ width: topLeftPercentage + '%' }">
							<view class="progress-text left-text">
								<text class="debater-name">⚔️ 正方</text>
								<text class="vote-count">{{ topLeftVotes }}</text>
							</view>
						</view>
						
						<!-- 动态闪电分界线 -->
						<view class="lightning-divider" :style="{ left: topLeftPercentage + '%' }">
							<view class="lightning-container">
								<view class="lightning">⚡</view>
							</view>
							<view class="lightning-glow"></view>
							<view class="lightning-sparks">
								<view class="spark spark-1">✨</view>
								<view class="spark spark-2">✨</view>
								<view class="spark spark-3">✨</view>
							</view>
						</view>
						
						<!-- 右侧区域 -->
						<view class="progress-fill right-fill" :style="{ width: topRightPercentage + '%' }">
							<view class="progress-text right-text">
								<text class="vote-count">{{ topRightVotes }}</text>
								<text class="debater-name">反方 🛡️</text>
							</view>
						</view>
					</view>
				</view>
				
				<view class="live-video">
					<!-- B站播放器iframe - 持续在后台播放 -->
					<iframe
						v-if="bilibiliUrl"
						:src="bilibiliUrl"
						class="bilibili-player"
						scrolling="no"
						border="0"
						frameborder="no"
						allowfullscreen="true"
						sandbox="allow-top-navigation allow-same-origin allow-forms allow-popups allow-scripts allow-presentation">
					</iframe>

					<!-- 直播开始前显示占位内容 -->
					<view v-if="!isLiveStarted" class="video-placeholder">
						<text class="placeholder-icon">🎬</text>
						<text class="placeholder-text">点击开始直播</text>
					</view>

					<!-- 播放按钮 - 左下角 -->
					<view class="play-button" v-if="!isLiveStarted" @click="startLive">
						<text class="play-icon">▶</text>
					</view>

					<!-- 直播状态指示器 -->
					<view class="live-status-overlay" v-if="isLiveStarted">
						<text class="live-indicator">🔴 LIVE</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 票数进度条对比 - 收起时显示（实时统计） -->
		<view class="vote-progress-container" v-if="isLiveCollapsed">
			<!-- 收起状态下的直播指示器 -->
			<view class="collapsed-live-indicator" v-if="isLiveStarted">
				<text class="live-dot">🔴</text>
				<text class="live-text">直播进行中</text>
			</view>
			<view class="progress-bar">
				<!-- 左侧区域 -->
				<view class="progress-fill left-fill" :style="{ width: topLeftPercentage + '%' }">
					<view class="progress-text left-text">
						<text class="debater-name">⚔️ 正方</text>
						<text class="vote-count">{{ topLeftVotes }}</text>
					</view>
				</view>
				
				<!-- 动态闪电分界线 -->
				<view class="lightning-divider" :style="{ left: topLeftPercentage + '%' }">
					<view class="lightning-container">
						<view class="lightning">⚡</view>
					</view>
					<view class="lightning-glow"></view>
					<view class="lightning-sparks">
						<view class="spark spark-1">✨</view>
						<view class="spark spark-2">✨</view>
						<view class="spark spark-3">✨</view>
					</view>
				</view>
				
				<!-- 右侧区域 -->
				<view class="progress-fill right-fill" :style="{ width: topRightPercentage + '%' }">
					<view class="progress-text right-text">
						<text class="vote-count">{{ topRightVotes }}</text>
						<text class="debater-name">反方 🛡️</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 展开按钮（当直播收起时显示） -->
		<view class="expand-btn" v-if="isLiveCollapsed" @click="toggleLiveCollapse">
			<text class="expand-icon">⬇️</text>
			<text class="expand-text">展开画面</text>
		</view>

		<!-- 主要内容区域 -->
		<view class="main-content" :class="{ 'expanded': isLiveCollapsed }">
			<!-- AI对话区域 -->
			<view class="ai-chat-container">
				<view class="chat-header">
					<view class="ai-icon">
						<text class="ai-emoji"></text>
					</view>
					<text class="chat-title">AI智能识别</text>
					<view class="status-indicator" :class="{'active': isListening && isLiveStarted}">
						<text class="status-dot"></text>
					</view>
				</view>
				
				<scroll-view class="chat-messages" scroll-y="true" :scroll-top="scrollTop">
					<view class="message-item" v-for="(message, index) in aiMessages" :key="message.id" 
						  :class="{'left': message.side === 'left', 'right': message.side === 'right'}"
						  @click="handleMessageClick(message)">
						<view class="message-bubble">
							<text class="message-text">{{ message.text }}</text>
							<view class="message-actions">
								<view class="action-item" @click.stop="handleMessageComment(message)">
									<text class="action-icon">💬</text>
									<text class="action-count">{{ message.comments.length }}</text>
								</view>
								<view class="action-item" @click.stop="handleMessageLike(message)" :class="{'liked': message.isLiked}">
									<text class="action-icon">👍</text>
									<text class="action-count">{{ message.likes }}</text>
								</view>
							</view>
						</view>
					</view>
					
					<view class="placeholder-message" v-if="aiMessages.length === 0">
						<text class="placeholder-icon">🎤</text>
						<text class="placeholder-content" v-if="!isLiveStarted">等待直播开始...</text>
						<text class="placeholder-content" v-else>正在监听直播内容...</text>
						<text class="placeholder-subtitle" v-if="!isLiveStarted">直播开始后，AI将为您实时识别并精简语音内容</text>
						<text class="placeholder-subtitle" v-else>AI将为您实时识别并精简语音内容</text>
					</view>
				</scroll-view>
			</view>

			<!-- 对抗条和投票区域 -->
			<view class="battle-section">
				<!-- 预设观点滑块（直播前显示） -->
				<view class="preset-section" v-if="showPresetSlider && !isLiveStarted">
					<view class="preset-header">
						<text class="preset-title">🎯 预设观点倾向</text>
						<text class="preset-subtitle">在直播开始之前，您可以对本次辩题设置一个初始观点倾向，本次辩题是{{ currentDebateTopic }}</text>
					</view>
					<view class="preset-slider-container">
						<view class="slider-labels">
							<text class="slider-label left-label">⚔️ 正方</text>
							<text class="slider-label right-label">反方 🛡️</text>
						</view>
						<view class="slider-wrapper">
							<slider 
								class="preset-slider"
								:value="presetOpinion"
								@change="onPresetChange"
								:min="0"
								:max="100"
								:step="1"
								block-size="20"
								block-color="#FF1493"
								active-color="#FF8C00"
								background-color="#E0E0E0"
								:show-value="true"
							/>
						</view>
						<view class="preset-info">
							<view class="preset-info-row">
								<text class="preset-percentage">{{ presetOpinion }}%</text>
								<text class="preset-desc">{{ getPresetDescription() }}</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 百分数变化提示 -->
				<view class="percentage-change-tip" v-if="showPercentageTip" :class="percentageTipClass">
					<text class="tip-text">{{ percentageTipText }}</text>
				</view>
				
				<!-- 对抗条 -->
				<view class="battle-bar">
					<view class="battle-fill left-fill" :style="{ width: currentLeftPercentage + '%' }">
						<view class="battle-text left-text">
							<text class="battle-label">⚔️ 正方</text>
							<text class="battle-percentage">{{ currentLeftPercentage }}%</text>
						</view>
					</view>
					
					<!-- 动态火焰分界线 - 大火焰团与跳动离子 -->
					<view class="flame-divider" :class="{ 'divider-hit': dividerHit }" :style="{ left: currentLeftPercentage + '%' }">
						<!-- 中心大火焰团 - 合并成一大团 -->
						<view class="main-flame-container">
							<view class="main-flame main-flame-1">🔥</view>
							<view class="main-flame main-flame-2">🔥</view>
							<view class="main-flame main-flame-3">🔥</view>
							<view class="main-flame main-flame-4">🔥</view>
							<view class="main-flame main-flame-5">🔥</view>
							<view class="main-flame main-flame-6">🔥</view>
						</view>
						
						<!-- 大火焰发光效果 -->
						<view class="main-flame-glow main-glow-1"></view>
						<view class="main-flame-glow main-glow-2"></view>
						<view class="main-flame-glow main-glow-3"></view>
						
						<!-- 周围跳动的小火焰离子 - 20个粒子环绕 -->
						<view class="flame-ions">
							<view class="ion ion-1">🔥</view>
							<view class="ion ion-2">🔥</view>
							<view class="ion ion-3">🔥</view>
							<view class="ion ion-4">🔥</view>
							<view class="ion ion-5">🔥</view>
							<view class="ion ion-6">🔥</view>
							<view class="ion ion-7">🔥</view>
							<view class="ion ion-8">🔥</view>
							<view class="ion ion-9">🔥</view>
							<view class="ion ion-10">🔥</view>
							<view class="ion ion-11">🔥</view>
							<view class="ion ion-12">🔥</view>
							<view class="ion ion-13">✨</view>
							<view class="ion ion-14">✨</view>
							<view class="ion ion-15">✨</view>
							<view class="ion ion-16">✨</view>
							<view class="ion ion-17">✨</view>
							<view class="ion ion-18">✨</view>
							<view class="ion ion-19">✨</view>
							<view class="ion ion-20">✨</view>
						</view>
						
						<!-- 火焰火花效果 -->
						<view class="flame-sparks">
							<view class="spark spark-1">✨</view>
							<view class="spark spark-2">✨</view>
							<view class="spark spark-3">✨</view>
							<view class="spark spark-4">✨</view>
							<view class="spark spark-5">✨</view>
							<view class="spark spark-6">✨</view>
						</view>
					</view>
					
					<view class="battle-fill right-fill" :style="{ width: currentRightPercentage + '%' }">
						<view class="battle-text right-text">
							<text class="battle-percentage">{{ currentRightPercentage }}%</text>
							<text class="battle-label">反方 🛡️</text>
						</view>
					</view>
				</view>
				
				<!-- 投票按钮 -->
				<view class="vote-buttons">
					<view class="vote-btn left-btn" @click="voteLeft" 
						  :class="{ 
							  'voted': userVote === 'left',
							  'click-effect': triggerEffect && triggerEffect.side === 'left',
							  'disabled': !isLiveStarted
						  }">
						<text class="vote-btn-icon">⚔️</text>
						<text class="vote-btn-text">{{ isLiveStarted ? '支持正方' : '等待直播开始' }}</text>
					</view>
					<view class="vote-btn right-btn" @click="voteRight" 
						  :class="{ 
							  'voted': userVote === 'right',
							  'click-effect': triggerEffect && triggerEffect.side === 'right',
							  'disabled': !isLiveStarted
						  }">
						<text class="vote-btn-icon">🛡️</text>
						<text class="vote-btn-text">{{ isLiveStarted ? '支持反方' : '等待直播开始' }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 底部导航栏 -->
		<view class="bottom-nav">
			<view class="nav-item" :class="{ 'active': currentTab === 'home' }" @click="switchTab('home')">
				<view class="nav-icon">
					<text class="icon">🏠</text>
				</view>
				<text class="nav-text">首页</text>
			</view>
			
			<view class="nav-item" :class="{ 'active': currentTab === 'activity' }" @click="switchTab('activity')">
				<view class="nav-icon">
					<text class="icon">🎯</text>
				</view>
				<text class="nav-text">活动</text>
			</view>
			
			<view class="nav-item" :class="{ 'active': currentTab === 'message' }" @click="switchTab('message')">
				<view class="nav-icon">
					<text class="icon">💬</text>
				</view>
				<text class="nav-text">消息</text>
			</view>
			
			<view class="nav-item" :class="{ 'active': currentTab === 'profile' }" @click="switchTab('profile')">
				<view class="nav-icon">
					<text class="icon">👤</text>
				</view>
				<text class="nav-text">我的</text>
			</view>
		</view>
		
		<!-- 投票特效容器 -->
		<view class="vote-effects-container">
			<view class="effect-symbol" 
				  v-for="(effect, index) in voteEffects" 
				  :key="effect.id"
				  :class="effect.class"
				  :style="effect.style">
				<text class="symbol-text">{{ effect.symbol }}</text>
			</view>
		</view>
		
		<!-- 自定义弹窗 -->
		<view class="custom-modal-mask" v-if="showModal" @click="closeModal">
			<view class="custom-modal" @click.stop>
				<!-- 弹窗头部 -->
				<view class="modal-header">
					<text class="modal-title">AI总结评论详情</text>
				</view>
				
				<!-- 弹窗内容 -->
				<scroll-view class="modal-content" scroll-y="true">
					<!-- AI总结内容区域 -->
					<view class="summary-section">
						<view class="section-title">
							<text class="title-icon">📝</text>
							<text class="title-text">AI总结内容</text>
						</view>
						<view class="summary-content">
							<text class="summary-text">{{ selectedMessage ? selectedMessage.text : '' }}</text>
						</view>
					</view>
					
					<!-- 评论区域 -->
					<view class="comments-section">
						<view class="section-title">
							<text class="title-icon">💬</text>
							<text class="title-text">用户评论 ({{ selectedMessage ? selectedMessage.comments.length : 0 }}条)</text>
						</view>
						
						<view class="comments-list" v-if="selectedMessage && selectedMessage.comments.length > 0">
							<view class="comment-item" v-for="(comment, index) in selectedMessage.comments" :key="index">
								<view class="comment-header">
									<view class="user-info">
										<text class="user-avatar">{{ comment.avatar }}</text>
										<text class="user-name">{{ comment.user }}</text>
									</view>
									<text class="comment-time">{{ comment.time }}</text>
								</view>
								<text class="comment-text">{{ comment.text }}</text>
							</view>
						</view>
						
						<view class="empty-comments" v-else>
							<text class="empty-text">暂无评论，快来发表第一条评论吧！</text>
						</view>
					</view>
				</scroll-view>
				
				<!-- 弹窗底部 -->
				<view class="modal-footer">
					<view class="footer-btn cancel-btn" @click="closeModal">
						<text class="btn-text">关闭</text>
					</view>
					<view class="footer-btn confirm-btn" @click="addCommentToMessage(selectedMessage)">
						<text class="btn-text">发表评论</text>
					</view>
				</view>
			</view>
		</view>
	</view>

	<!-- 自定义评论弹窗 -->
	<view class="comment-modal-overlay" v-if="showCommentModal" @click="closeCommentModal">
		<view class="comment-modal" @click.stop>
			<view class="comment-modal-header">
				<text class="comment-modal-title">发表评论</text>
				<view class="comment-close-btn" @click="closeCommentModal">
					<text class="comment-close-icon">✕</text>
				</view>
			</view>
			
			<view class="comment-modal-content">
				<view class="comment-input-container">
					<textarea 
						class="comment-textarea"
						v-model="commentText"
						:placeholder="commentPlaceholder"
						:maxlength="200"
						:auto-focus="true"
						:show-confirm-bar="false"
						@input="onCommentInput"
						@focus="onCommentFocus"
						@blur="onCommentBlur"
					></textarea>
					<view class="comment-char-count">
						<text class="char-count-text">{{ commentText.length }}/200</text>
					</view>
				</view>
			</view>
			
			<view class="comment-modal-footer">
				<view class="comment-footer-btn comment-cancel-btn" @click="closeCommentModal">
					<text class="comment-btn-text">取消</text>
				</view>
				<view class="comment-footer-btn comment-confirm-btn" @click="submitComment" :class="{ 'disabled': !commentText.trim() }">
					<text class="comment-btn-text">确定</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				statusBarHeight: 0,
				isLiveCollapsed: false,

				// B站播放器URL - 点击播放按钮时才赋值
				bilibiliUrl: '',

				// 顶部对抗条数据（实时统计，不受用户操作影响）
				topLeftVotes: 0,
				topRightVotes: 0,
				
				// 底部对抗条数据（用户操作，点击投票改变）
				leftVotes: 0,
				rightVotes: 0,
				userVote: null,
				leftClickCount: 0, // 正方按钮点击次数
				rightClickCount: 0, // 反方按钮点击次数
				triggerEffect: null, // 触发特效状态
				voteEffects: [], // 投票特效数组
				effectIdCounter: 0, // 特效ID计数器
				dividerHit: false, // 分割线被击中状态
				currentTab: 'home', // 当前选中的导航栏
				
				// 直播状态和预设观点相关
				isLiveStarted: false, // 直播是否已开始
				presetOpinion: 50, // 预设观点倾向 (0-100, 50为中性)
				showPresetSlider: true, // 是否显示预设滑块
				initialLeftVotes: 0, // 初始正方票数
				initialRightVotes: 0, // 初始反方票数
				currentDebateTopic: '如果有一个能一键消除痛苦的按钮，你会按吗', // 当前辩题
				
				// 预设观点对抗条数据（显示用户预设倾向）
				presetLeftVotes: 0, // 预设正方票数
				presetRightVotes: 0, // 预设反方票数
				
				
				// 百分数变化提示
				showPercentageTip: false, // 是否显示百分数变化提示
				percentageTipText: '', // 提示文字
				percentageTipClass: '', // 提示样式类
				
				// AI语音识别相关数据
				isListening: true, // 是否正在监听
				aiMessages: [], // AI对话消息列表
				scrollTop: 0, // 滚动位置
				messageIdCounter: 0, // 消息ID计数器
				showModal: false, // 是否显示弹窗
				selectedMessage: null, // 当前选中的消息
				
				// 评论弹窗相关
				showCommentModal: false,
				commentText: '',
				commentPlaceholder: '请输入您对这条AI总结的评论...',
				currentCommentMessage: null,
				
				// AI对话数据现在从服务器获取
				
				// 定时器引用
				recognitionTimer: null,
				
				// 服务器配置
				serverUrl: 'http://localhost:3001',
				topBarUpdateTimer: null, // 顶部对抗条更新定时器
				
				// 性能优化相关
				isVoting: false, // 是否正在处理投票（防抖）
				voteQueue: [], // 投票队列
				lastVoteTime: 0, // 上次投票时间
				
				// 性能监控
				performanceStats: {
					voteCount: 0,
					avgResponseTime: 0,
					lastResponseTime: 0
				}
			}
		},
		computed: {
			// 顶部对抗条计算属性（实时统计）
			topTotalVotes() {
				return this.topLeftVotes + this.topRightVotes;
			},
			topLeftPercentage() {
				// 当总票数为0时，显示50%的中间位置
				return this.topTotalVotes > 0 ? Math.round((this.topLeftVotes / this.topTotalVotes) * 100) : 50;
			},
			topRightPercentage() {
				// 当总票数为0时，显示50%的中间位置
				return this.topTotalVotes > 0 ? Math.round((this.topRightVotes / this.topTotalVotes) * 100) : 50;
			},
			
			// 底部对抗条计算属性（用户操作）
			totalVotes() {
				return this.leftVotes + this.rightVotes;
			},
			leftPercentage() {
				// 当总票数为0时，显示50%的中间位置
				return this.totalVotes > 0 ? Math.round((this.leftVotes / this.totalVotes) * 100) : 50;
			},
			rightPercentage() {
				// 当总票数为0时，显示50%的中间位置
				return this.totalVotes > 0 ? Math.round((this.rightVotes / this.totalVotes) * 100) : 50;
			},
			
			// 预设观点对抗条计算属性（显示用户预设倾向）
			presetTotalVotes() {
				return this.presetLeftVotes + this.presetRightVotes;
			},
			presetLeftPercentage() {
				// 根据预设观点倾向计算百分比
				return this.presetOpinion;
			},
			presetRightPercentage() {
				// 根据预设观点倾向计算百分比
				return 100 - this.presetOpinion;
			},
			
			// 当前对抗条计算属性（根据直播状态决定数据源）
			currentLeftPercentage() {
				// 直播开始前显示预设观点，直播开始后显示投票结果
				return this.isLiveStarted ? this.leftPercentage : this.presetLeftPercentage;
			},
			currentRightPercentage() {
				// 直播开始前显示预设观点，直播开始后显示投票结果
				return this.isLiveStarted ? this.rightPercentage : this.presetRightPercentage;
			},
			
		},
		onLoad() {
			// 获取系统信息，适配安全区域
			this.getSystemInfo();
			// 初始化预设观点
			this.updateInitialVotes();
			// 初始化预设观点对抗条
			this.updatePresetBattleBar();
	},
		onUnload() {
			// 页面卸载时清理定时器
			if (this.recognitionTimer) {
				clearInterval(this.recognitionTimer);
				this.recognitionTimer = null;
			}
			if (this.topBarSimulationTimer) {
				clearInterval(this.topBarSimulationTimer);
				this.topBarSimulationTimer = null;
			}
			if (this.topBarUpdateTimer) {
				clearInterval(this.topBarUpdateTimer);
				this.topBarUpdateTimer = null;
			}
		},
		onReady() {
			// 页面渲染完成后设置安全区域
			this.setSafeArea();
		},
		methods: {
			// API调用方法
			async fetchTopBarVotes() {
				try {
					const response = await uni.request({
						url: `${this.serverUrl}/api/votes`,
						method: 'GET'
					});
					
					if (response.data.success) {
						const data = response.data.data;
						this.topLeftVotes = data.leftVotes;
						this.topRightVotes = data.rightVotes;
					}
				} catch (error) {
					console.error('获取票数失败:', error);
				}
			},
			
			async fetchAIContent(isInitialLoad = false) {
				try {
					const response = await uni.request({
						url: `${this.serverUrl}/api/ai-content`,
						method: 'GET'
					});
					
					if (response.data.success) {
						// 如果是初始加载，清空原有数据
						if (isInitialLoad) {
							this.aiMessages = [];
							this.messageIdCounter = 0;
						}
						
						// 检查是否有新内容
						const serverMessages = response.data.data;
						const currentMessageIds = this.aiMessages.map(msg => msg.serverId || msg.id);
						
						// 添加新的服务器数据
						serverMessages.forEach((content, index) => {
							// 检查是否已存在（通过服务器ID或内容匹配）
							const exists = this.aiMessages.some(msg => 
								msg.serverId === content.id || 
								(msg.text === content.text && msg.side === content.side)
							);
							
							if (!exists) {
								this.addAIMessage(content);
							}
						});
					}
				} catch (error) {
					console.error('获取AI内容失败:', error);
				}
			},
			
			async sendUserVote(side, votes = 10) {
				const startTime = Date.now();
				
				try {
					const response = await uni.request({
						url: `${this.serverUrl}/api/user-vote`,
						method: 'POST',
						data: {
							side: side,
							votes: votes
						}
					});
					
					const responseTime = Date.now() - startTime;
					
					// 更新性能统计
					this.updatePerformanceStats(responseTime);
					
					if (response.data.success) {
						console.log('投票成功:', response.data.data);
					}
				} catch (error) {
					console.error('投票失败:', error);
				}
			},
			
			// 更新性能统计
			updatePerformanceStats(responseTime) {
				this.performanceStats.voteCount++;
				this.performanceStats.lastResponseTime = responseTime;
				
				// 计算平均响应时间
				const totalTime = this.performanceStats.avgResponseTime * (this.performanceStats.voteCount - 1) + responseTime;
				this.performanceStats.avgResponseTime = Math.round(totalTime / this.performanceStats.voteCount);
				
				// 在开发环境下输出性能信息
				if (process.env.NODE_ENV === 'development') {
					console.log(`投票性能统计 - 响应时间: ${responseTime}ms, 平均: ${this.performanceStats.avgResponseTime}ms, 总投票: ${this.performanceStats.voteCount}`);
				}
			},
			
			// 异步投票方法，不阻塞UI
			async sendUserVoteAsync(side, votes = 10) {
				// 防抖：500ms内只允许一次投票
				const now = Date.now();
				if (now - this.lastVoteTime < 500) {
					return;
				}
				this.lastVoteTime = now;
				
				// 添加到投票队列
				this.voteQueue.push({ side, votes, timestamp: now });
				
				// 如果正在处理投票，直接返回
				if (this.isVoting) {
					return;
				}
				
				// 处理投票队列
				this.processVoteQueue();
			},
			
			// 处理投票队列
			async processVoteQueue() {
				if (this.voteQueue.length === 0 || this.isVoting) {
					return;
				}
				
				this.isVoting = true;
				
				try {
					// 批量处理投票（合并相同方向的投票）
					const voteMap = new Map();
					
					// 清空队列并合并投票
					while (this.voteQueue.length > 0) {
						const vote = this.voteQueue.shift();
						const key = vote.side;
						if (voteMap.has(key)) {
							voteMap.get(key).votes += vote.votes;
						} else {
							voteMap.set(key, { side: vote.side, votes: vote.votes });
						}
					}
					
					// 发送合并后的投票
					for (const vote of voteMap.values()) {
						await this.sendUserVote(vote.side, vote.votes);
					}
					
				} catch (error) {
					console.error('处理投票队列失败:', error);
				} finally {
					this.isVoting = false;
					
					// 如果队列中还有新的投票，继续处理
					if (this.voteQueue.length > 0) {
						setTimeout(() => {
							this.processVoteQueue();
						}, 100);
					}
				}
			},
			
			async addCommentToServer(contentId, user, text, avatar) {
				try {
					const response = await uni.request({
						url: `${this.serverUrl}/api/comment`,
						method: 'POST',
						data: {
							contentId: contentId,
							user: user,
							text: text,
							avatar: avatar
						}
					});
					
					if (response.data.success) {
						return response.data.data;
					}
				} catch (error) {
					console.error('添加评论失败:', error);
				}
			},
			
			async likeContent(contentId, commentId = null) {
				try {
					const response = await uni.request({
						url: `${this.serverUrl}/api/like`,
						method: 'POST',
						data: {
							contentId: contentId,
							commentId: commentId
						}
					});
					
					if (response.data.success) {
						return response.data.data;
					}
				} catch (error) {
					console.error('点赞失败:', error);
				}
			},
			
			// 启动顶部对抗条实时更新
			startTopBarRealTimeUpdate() {
				// 立即获取一次数据
				this.fetchTopBarVotes();
				
				// 每5秒更新一次（减少频率）
				this.topBarUpdateTimer = setInterval(() => {
					this.fetchTopBarVotes();
				}, 5000);
			},
			
			// 启动AI内容实时更新
			startAIContentRealTimeUpdate() {
				// 立即获取一次数据
				this.fetchAIContent();
				
				// 每4秒更新一次AI内容（减少频率）
				this.recognitionTimer = setInterval(() => {
					this.fetchAIContent();
				}, 4000);
			},
			
			getSystemInfo() {
				// 获取系统信息
				uni.getSystemInfo({
					success: (res) => {
						this.statusBarHeight = res.statusBarHeight;
						// 设置CSS变量
						uni.setStorageSync('statusBarHeight', res.statusBarHeight);
					}
				});
			},
			setSafeArea() {
				// 设置安全区域样式
				const statusBarHeight = uni.getStorageSync('statusBarHeight') || 0;
				const safeAreaTop = statusBarHeight + 20; // 状态栏高度 + 额外间距
				
				// 动态设置页面顶部padding
				const query = uni.createSelectorQuery().in(this);
				query.select('.home-container').boundingClientRect((rect) => {
					if (rect) {
						// 设置CSS变量
						document.documentElement.style.setProperty('--status-bar-height', safeAreaTop + 'px');
					}
				}).exec();
			},
			toggleLiveCollapse() {
				this.isLiveCollapsed = !this.isLiveCollapsed;
			},
			
			voteLeft() {
				// 如果直播未开始，直接返回
				if (!this.isLiveStarted) {
					uni.showToast({
						title: '请等待直播开始',
						icon: 'none',
						duration: 1500
					});
					return;
				}
				
				// 防抖处理：如果正在处理投票，直接返回
				if (this.isVoting) {
					return;
				}
				
				// 增加点击次数
				this.leftClickCount++;
				
				// 立即更新UI，提供即时反馈
				this.leftVotes += 10;
				this.userVote = 'left';
				
				// 触发飘动特效
				this.triggerDividerHit();
				this.createVoteEffects('left');
				
				// 显示实时百分数变化
				this.showPercentageChange('left');
				
				// 根据点击情况显示不同提示
				if (this.leftClickCount === 1) {
					this.showVoteEffect('left', 'first');
				} else if (this.leftClickCount <= 5) {
					this.showVoteEffect('left', 'repeat');
				} else {
					this.showVoteEffect('left', 'repeat');
				}
				
				// 异步发送到服务器，不阻塞UI
				this.sendUserVoteAsync('left', 10);
			},
			voteRight() {
				// 如果直播未开始，直接返回
				if (!this.isLiveStarted) {
					uni.showToast({
						title: '请等待直播开始',
						icon: 'none',
						duration: 1500
					});
					return;
				}
				
				// 防抖处理：如果正在处理投票，直接返回
				if (this.isVoting) {
					return;
				}
				
				// 增加点击次数
				this.rightClickCount++;
				
				// 立即更新UI，提供即时反馈
				this.rightVotes += 10;
				this.userVote = 'right';
				
				// 触发飘动特效
				this.triggerDividerHit();
				this.createVoteEffects('right');
				
				// 显示实时百分数变化
				this.showPercentageChange('right');
				
				// 根据点击情况显示不同提示
				if (this.rightClickCount === 1) {
					this.showVoteEffect('right', 'first');
				} else if (this.rightClickCount <= 5) {
					this.showVoteEffect('right', 'repeat');
				} else {
					this.showVoteEffect('right', 'repeat');
				}
				
				// 异步发送到服务器，不阻塞UI
				this.sendUserVoteAsync('right', 10);
			},
			
			// 显示投票特效
			showVoteEffect(side, type) {
				const clickCount = side === 'left' ? this.leftClickCount : this.rightClickCount;
				const sideName = side === 'left' ? '正方' : '反方';
				
				// 触发视觉特效
				this.triggerVisualEffect(side);
				
				// 根据点击类型和次数显示不同的特效
				let title = '';
				let icon = 'none';
				let duration = 1500;
				
				if (type === 'first') {
					title = `🎉 支持${sideName}！+1票`;
					icon = 'success';
				} else if (type === 'repeat') {
					// 根据点击次数显示不同的重复点击特效
					if (clickCount <= 3) {
						title = `💪 ${sideName}加油！+1票`;
						icon = 'none';
					} else if (clickCount <= 5) {
						title = `🔥 ${sideName}必胜！+1票`;
						icon = 'none';
					} else if (clickCount <= 10) {
						title = `⚡ ${sideName}无敌！+1票`;
						icon = 'none';
					} else if (clickCount <= 20) {
						title = `🚀 ${sideName}超神！+1票`;
						icon = 'none';
					} else if (clickCount <= 50) {
						title = `💎 ${sideName}传奇！+1票`;
						icon = 'none';
					} else {
						title = `👑 ${sideName}王者！+1票 (${clickCount}次)`;
						icon = 'none';
					}
				}
				
				// 显示提示
				uni.showToast({
					title: title,
					icon: icon,
					duration: duration
				});
				
				// 添加震动反馈（如果支持）
				if (uni.vibrateShort) {
					uni.vibrateShort({
						type: 'light'
					});
				}
				
				// 添加音效反馈（模拟）
				this.playVoteSound(type, clickCount);
			},
			
			// 触发视觉特效
			triggerVisualEffect(side) {
				// 使用Vue的$nextTick确保DOM更新
				this.$nextTick(() => {
					const buttonClass = side === 'left' ? '.left-btn' : '.right-btn';
					// 这里可以通过添加/移除CSS类来触发特效
					// 由于uni-app的限制，我们使用数据绑定来控制特效
					this.triggerEffect = {
						side: side,
						timestamp: Date.now()
					};
					
					// 清除特效状态
					setTimeout(() => {
						this.triggerEffect = null;
					}, 1000);
				});
			},
			
			// 播放投票音效（模拟）
			playVoteSound(type, clickCount) {
				// 这里可以添加真实的音效播放逻辑
				// 目前只是模拟不同的音效类型
				console.log(`播放音效: ${type}, 点击次数: ${clickCount}`);
			},

			// 触发分割线被击中效果
			triggerDividerHit() {
				this.dividerHit = true;
				// 0.6秒后重置状态，以便下一次触发
				setTimeout(() => {
					this.dividerHit = false;
				}, 600);
			},

			// 创建投票特效（优化版本）
			createVoteEffects(side) {
				// 限制同时存在的特效数量，避免性能问题
				if (this.voteEffects.length >= 8) {
					return;
				}
				
				// 定义不同侧的特效符号（减少符号数量）
				const leftSymbols = ['⚔️', '💪', '🔥', '⭐'];
				const rightSymbols = ['🛡️', '💙', '❄️', '✨'];
				
				const symbols = side === 'left' ? leftSymbols : rightSymbols;
				
				// 减少特效数量：1-2个
				const effectCount = Math.floor(Math.random() * 2) + 1;
				
				for (let i = 0; i < effectCount; i++) {
					this.effectIdCounter++;
					
					// 随机选择符号
					const symbol = symbols[Math.floor(Math.random() * symbols.length)];
					
					// 计算起始位置（按钮两边边缘）
					const startX = side === 'left' ? '12%' : '88%';
					const startY = '85%';
					
					// 简化偏移计算
					const offsetX = side === 'left' ? -20 : 20;
					const offsetY = (Math.random() - 0.5) * 20;
					
					// 固定动画参数，减少计算
					const delay = i * 0.1;
					const duration = 2.5;
					
					const effect = {
						id: this.effectIdCounter,
						symbol: symbol,
						class: `effect-${side}`,
						style: {
							left: `calc(${startX} + ${offsetX}rpx)`,
							top: `calc(${startY} + ${offsetY}rpx)`,
							animationDelay: `${delay}s`,
							animationDuration: `${duration}s`
						}
					};
					
					this.voteEffects.push(effect);
					
					// 动画结束后移除特效
					setTimeout(() => {
						this.removeVoteEffect(effect.id);
					}, (delay + duration) * 1000);
				}
			},
			
			// 移除投票特效
			removeVoteEffect(effectId) {
				const index = this.voteEffects.findIndex(effect => effect.id === effectId);
				if (index > -1) {
					this.voteEffects.splice(index, 1);
				}
			},
			
			// 预设观点滑块变化处理
			onPresetChange(e) {
				if (!this.isLiveStarted) {
					this.presetOpinion = e.detail.value;
					// 根据预设观点调整初始票数
					this.updateInitialVotes();
					// 更新预设观点对抗条显示
					this.updatePresetBattleBar();
				}
			},
			
			// 根据预设观点更新初始票数
			updateInitialVotes() {
				// 直播开始前，票数始终为0
				this.initialLeftVotes = 0;
				this.initialRightVotes = 0;
				
				// 如果直播还没开始，更新显示票数
				if (!this.isLiveStarted) {
					this.leftVotes = 0;
					this.rightVotes = 0;
					this.topLeftVotes = 0;
					this.topRightVotes = 0;
				}
			},
			
			// 更新预设观点对抗条显示
			updatePresetBattleBar() {
				// 根据预设观点倾向计算票数（用于显示，不影响实际投票）
				const baseVotes = 1000; // 基础票数
				this.presetLeftVotes = Math.round((this.presetOpinion / 100) * baseVotes);
				this.presetRightVotes = baseVotes - this.presetLeftVotes;
			},
			
			// 获取预设观点描述
			getPresetDescription() {
				if (this.presetOpinion < 30) {
					return '强烈支持反方';
				} else if (this.presetOpinion < 45) {
					return '偏向反方';
				} else if (this.presetOpinion < 55) {
					return '保持中立';
				} else if (this.presetOpinion < 70) {
					return '偏向正方';
				} else {
					return '强烈支持正方';
				}
			},
			
			// 手动开始直播
			startLive() {
				// 启动B站视频播放
				this.bilibiliUrl = 'https://player.bilibili.com/player.html?bvid=BV1sP4qz8Eyv&autoplay=1';

				this.isLiveStarted = true;
				this.showPresetSlider = false;

				// 根据预设观点设置初始票数
				const baseVotes = 1000;
				this.leftVotes = Math.round((this.presetOpinion / 100) * baseVotes);
				this.rightVotes = baseVotes - this.leftVotes;

				// 重置顶部实时对抗条（这个不受用户操作影响）
				this.topLeftVotes = 0;
				this.topRightVotes = 0;

				// 获取服务器AI内容（初始加载）
				this.fetchAIContent(true);

				// 启动AI内容实时更新
				this.startAIContentRealTimeUpdate();

				// 启动顶部对抗条实时更新
				this.startTopBarRealTimeUpdate();

				uni.showToast({
					title: '🎬 直播已开始',
					icon: 'success',
					duration: 2000
				});

				console.log('直播开始，初始票数:', this.leftVotes, this.rightVotes);
			},




			// 显示百分数变化
			showPercentageChange(side) {
				// 使用底部对抗条的百分比数据
				const currentLeftPercent = this.leftPercentage;
				const currentRightPercent = this.rightPercentage;
				
				// 在控制台显示变化（用于调试）
				console.log(`投票后 - 正方: ${currentLeftPercent}%, 反方: ${currentRightPercent}%`);
				
				// 显示百分数变化提示
				const sideName = side === 'left' ? '正方' : '反方';
				const sidePercent = side === 'left' ? currentLeftPercent : currentRightPercent;
				
				this.percentageTipText = `${sideName} ${sidePercent}%`;
				this.percentageTipClass = side === 'left' ? 'tip-left' : 'tip-right';
				this.showPercentageTip = true;
				
				// 2秒后隐藏提示
				setTimeout(() => {
					this.showPercentageTip = false;
				}, 2000);
			},
			
			// AI语音识别相关方法（现在从服务器获取数据）
			
			// 添加AI消息到对话列表
			addAIMessage(dialogueData) {
				this.messageIdCounter++;
				const newMessage = {
					id: this.messageIdCounter,
					serverId: dialogueData.id, // 保存服务器ID用于去重
					text: dialogueData.text,
					side: dialogueData.side,
					comments: [...dialogueData.comments],
					likes: dialogueData.likes,
					isLiked: false,
					timestamp: new Date().getTime()
				};
				
				this.aiMessages.push(newMessage);
				
				// 滚动到底部
				this.$nextTick(() => {
					this.scrollToBottom();
				});
			},
			
			// 滚动到底部
			scrollToBottom() {
				this.$nextTick(() => {
					this.scrollTop = this.aiMessages.length * 120;
				});
			},
			
			// 停止AI识别（实际项目中用于停止语音识别服务）
			stopRecognition() {
				if (this.recognitionTimer) {
					clearInterval(this.recognitionTimer);
					this.recognitionTimer = null;
					this.isListening = false;
				}
			},
			
			// 处理消息点击事件
			handleMessageClick(message) {
				// 显示该条消息的评论详情
				this.showMessageComments(message);
			},
			
			// 显示消息的评论详情
			showMessageComments(message) {
				// 设置当前选中的消息
				this.selectedMessage = message;
				// 显示弹窗
				this.showModal = true;
			},
			
			// 关闭弹窗
			closeModal() {
				this.showModal = false;
				this.selectedMessage = null;
			},
			
			// 为消息添加评论
			addCommentToMessage(message) {
				this.currentCommentMessage = message;
				this.commentText = '';
				this.showCommentModal = true;
			},
			
			// 关闭评论弹窗
			closeCommentModal() {
				this.showCommentModal = false;
				this.commentText = '';
				this.currentCommentMessage = null;
			},
			
			// 提交评论
			async submitComment() {
				if (!this.commentText.trim()) {
					uni.showToast({
						title: '请输入评论内容',
						icon: 'none',
						duration: 1500
					});
					return;
				}
				
				if (!this.currentCommentMessage) {
					uni.showToast({
						title: '评论失败，请重试',
						icon: 'error',
						duration: 2000
					});
					return;
				}
				
				try {
					// 发送到服务器
					const serverComment = await this.addCommentToServer(
						this.currentCommentMessage.id, 
						'我', 
						this.commentText.trim(), 
						'👤'
					);
					
					if (serverComment) {
						// 添加新评论到本地
						const newComment = {
							user: '我',
							text: this.commentText.trim(),
							time: '刚刚',
							avatar: '👤',
							likes: 0
						};
						this.currentCommentMessage.comments.unshift(newComment);
						
						// 关闭弹窗
						this.closeCommentModal();
						
						uni.showToast({
							title: '评论发表成功！',
							icon: 'success',
							duration: 2000
						});
					} else {
						uni.showToast({
							title: '评论发表失败，请重试',
							icon: 'error',
							duration: 2000
						});
					}
				} catch (error) {
					console.error('提交评论失败:', error);
					uni.showToast({
						title: '网络错误，请重试',
						icon: 'error',
						duration: 2000
					});
				}
			},
			
			// 评论输入事件
			onCommentInput(e) {
				this.commentText = e.detail.value;
			},
			
			// 评论输入框获得焦点
			onCommentFocus() {
				// 可以添加一些焦点效果
			},
			
			// 评论输入框失去焦点
			onCommentBlur() {
				// 可以添加一些失焦效果
			},
			
			// 处理消息评论点击
			handleMessageComment(message) {
				this.addCommentToMessage(message);
			},
			
			// 处理消息点赞点击
			async handleMessageLike(message) {
				if (message.isLiked) {
					message.likes--;
					message.isLiked = false;
					uni.showToast({
						title: '取消点赞',
						icon: 'none'
					});
				} else {
					// 发送到服务器
					const result = await this.likeContent(message.id);
					if (result) {
						message.likes = result.likes;
						message.isLiked = true;
						uni.showToast({
							title: '点赞成功！',
							icon: 'success'
						});
					}
				}
			},
			
			// 导航栏切换方法
			switchTab(tab) {
				this.currentTab = tab;
				
				switch(tab) {
					case 'home':
						// 首页 - 当前页面，无需跳转
						break;
					case 'activity':
						// 活动页面
						uni.redirectTo({
							url: '/pages/activity/activity'
						});
						break;
					case 'message':
						// 消息页面
						uni.redirectTo({
							url: '/pages/message/message'
						});
						break;
					case 'profile':
						// 我的页面
						uni.redirectTo({
							url: '/pages/profile/profile'
						});
						break;
				}
			}
		}
	}
</script>

<style>
	.home-container {
		min-height: 100vh;
		/* 高级深色背景配合动态渐变光线效果 */
		background:
			radial-gradient(circle at 30% 15%, rgba(0, 180, 220, 0.4) 0%, transparent 35%),
			radial-gradient(circle at 70% 35%, rgba(255, 100, 130, 0.3) 0%, transparent 40%),
			radial-gradient(circle at 50% 85%, rgba(255, 140, 20, 0.25) 0%, transparent 45%),
			linear-gradient(135deg, #0a1628 0%, #1a2a4a 30%, #2a1a3a 60%, #1a1a2a 100%);
		padding: 20rpx;
		padding-top: 120rpx;
		padding-bottom: 40rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
		/* 微妙的动画背景 */
		animation: subtleBackgroundShift 20s ease-in-out infinite;
	}

	@keyframes subtleBackgroundShift {
		0% {
			background:
				radial-gradient(circle at 30% 15%, rgba(0, 180, 220, 0.4) 0%, transparent 35%),
				radial-gradient(circle at 70% 35%, rgba(255, 100, 130, 0.3) 0%, transparent 40%),
				radial-gradient(circle at 50% 85%, rgba(255, 140, 20, 0.25) 0%, transparent 45%),
				linear-gradient(135deg, #0a1628 0%, #1a2a4a 30%, #2a1a3a 60%, #1a1a2a 100%);
		}
		50% {
			background:
				radial-gradient(circle at 35% 20%, rgba(0, 200, 240, 0.35) 0%, transparent 40%),
				radial-gradient(circle at 65% 30%, rgba(255, 120, 150, 0.25) 0%, transparent 38%),
				radial-gradient(circle at 50% 80%, rgba(255, 160, 40, 0.2) 0%, transparent 48%),
				linear-gradient(135deg, #0f1a2e 0%, #1f3a5a 30%, #2f2a4a 60%, #1f1f3a 100%);
		}
		100% {
			background:
				radial-gradient(circle at 30% 15%, rgba(0, 180, 220, 0.4) 0%, transparent 35%),
				radial-gradient(circle at 70% 35%, rgba(255, 100, 130, 0.3) 0%, transparent 40%),
				radial-gradient(circle at 50% 85%, rgba(255, 140, 20, 0.25) 0%, transparent 45%),
				linear-gradient(135deg, #0a1628 0%, #1a2a4a 30%, #2a1a3a 60%, #1a1a2a 100%);
		}
	}
	
	.home-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		/* 高级光线层效果 */
		background:
			radial-gradient(ellipse 600rpx 400rpx at 60% 15%, rgba(100, 220, 255, 0.15) 0%, transparent 35%),
			radial-gradient(ellipse 500rpx 500rpx at 20% 70%, rgba(255, 100, 150, 0.08) 0%, transparent 45%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%, rgba(0, 0, 0, 0.1) 100%);
		pointer-events: none;
		z-index: 0;
		animation: lightShimmer 8s ease-in-out infinite;
	}

	@keyframes lightShimmer {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	/* 票数进度条容器 - 玻璃态高级设计 */
	.vote-progress-container {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%);
		backdrop-filter: blur(20rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.25);
		border-radius: 24rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow:
			0 0 40rpx rgba(0, 180, 220, 0.2),
			0 8rpx 32rpx rgba(0, 0, 0, 0.3),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
		position: relative;
		z-index: 1;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		animation: cardFloating 6s ease-in-out infinite;
	}

	@keyframes cardFloating {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4rpx);
		}
	}

	.vote-progress-container:hover {
		box-shadow:
			0 0 50rpx rgba(0, 180, 220, 0.3),
			0 12rpx 40rpx rgba(0, 0, 0, 0.35),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(25rpx);
	}

	/* 票数进度条浮动覆盖层 */
	.vote-progress-overlay {
		position: absolute;
		top: 15rpx;
		left: 20rpx;
		right: 20rpx;
		z-index: 9999; /* 提高层级，确保在B站播放器之上 */
		pointer-events: none; /* 允许点击穿透到下层 */
	}

	/* 直播区域 - 高级玻璃态 + 电影质感 */
	.live-section {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.11) 0%, rgba(200, 220, 255, 0.06) 100%);
		backdrop-filter: blur(18rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.22);
		border-radius: 28rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			0 0 50rpx rgba(255, 100, 150, 0.15),
			0 10rpx 40rpx rgba(0, 0, 0, 0.35),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.18);
		position: relative;
		z-index: 1;
		animation: cardGlow 8s ease-in-out infinite;
	}

	@keyframes cardGlow {
		0%, 100% {
			box-shadow:
				0 0 50rpx rgba(255, 100, 150, 0.15),
				0 10rpx 40rpx rgba(0, 0, 0, 0.35),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.18);
		}
		50% {
			box-shadow:
				0 0 60rpx rgba(0, 180, 220, 0.2),
				0 12rpx 48rpx rgba(0, 0, 0, 0.4),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.22);
		}
	}

	.live-section:hover {
		backdrop-filter: blur(22rpx);
		box-shadow:
			0 0 70rpx rgba(255, 100, 150, 0.25),
			0 15rpx 50rpx rgba(0, 0, 0, 0.4),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.25);
		transform: translateY(-6rpx);
	}

	.live-section.collapsed {
		height: 120rpx;
	}

	/* 收起时隐藏但保留DOM - 视频继续在后台播放（关键优化）*/
	.live-section.collapsed-hide {
		position: absolute;
		left: -9999rpx;
		width: 100%;
		height: 100%;
		visibility: hidden;
		pointer-events: none;
		opacity: 0;
		z-index: -1;
		/* 保持视频播放但不显示 */
		display: flex;
		flex-direction: column;
	}

	/* 直播视频容器 */
	.live-video-container {
		position: relative;
		height: 400rpx;
		background-color: #000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.live-video {
		width: 100%;
		height: 100%;
		position: relative;
		background-color: #000;
		overflow: hidden;
	}

	/* B站播放器iframe样式 */
	.bilibili-player {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		border: none;
		background-color: #000;
	}

	/* 播放按钮 - 左下角 */
	.play-button {
		position: absolute;
		bottom: 20rpx;
		left: 20rpx;
		width: 80rpx;
		height: 80rpx;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%);
		border: 3rpx solid rgba(255, 255, 255, 0.5);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.3),
		            0 0 0 1rpx rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		backdrop-filter: blur(10rpx);
		z-index: 20;
	}
	
	.play-button:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4),
		            0 0 0 1rpx rgba(255, 255, 255, 0.3);
	}
	
	.play-button:hover {
		transform: scale(1.05);
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.4),
		            0 0 0 2rpx rgba(255, 255, 255, 0.3);
	}
	
	.play-icon {
		font-size: 32rpx;
		color: #333;
		text-shadow: 0 1rpx 2rpx rgba(255, 255, 255, 0.8);
		transition: transform 0.3s ease;
		margin-left: 4rpx; /* 让播放图标稍微向右偏移，看起来更居中 */
	}
	
	.play-button:active .play-icon {
		transform: scale(0.9);
	}

	.live-status-overlay {
		position: absolute;
		top: 20rpx;
		left: 20rpx;
		background: rgba(0, 0, 0, 0.7);
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		backdrop-filter: blur(10rpx);
	}

	.live-ended-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #FFFFFF;
	}

	.manual-controls {
		margin-top: 30rpx;
		display: flex;
		justify-content: center;
	}

	.live-controls {
		position: absolute;
		top: 20rpx;
		right: 20rpx;
		display: flex;
		gap: 10rpx;
	}

	.control-btn {
		padding: 12rpx 24rpx;
		border-radius: 25rpx;
		backdrop-filter: blur(10rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}

	.start-btn {
		background: rgba(0, 255, 0, 0.3);
	}

	.stop-btn {
		background: rgba(255, 0, 0, 0.3);
	}


	.btn-text {
		font-size: 24rpx;
		color: #FFFFFF;
		font-weight: bold;
	}

	.collapsed-live-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		padding: 15rpx 25rpx;
		background: #FF8C00;
		border: 3rpx solid #000;
		border-radius: 25rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.3);
	}

	.live-dot {
		font-size: 24rpx;
		animation: pulse 2s infinite;
	}

	.live-text {
		font-size: 28rpx;
		color: #FFFFFF;
		font-weight: bold;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.3);
	}

	.ended-icon {
		font-size: 80rpx;
		margin-bottom: 20rpx;
	}

	.ended-text {
		font-size: 48rpx;
		font-weight: bold;
		margin-bottom: 10rpx;
	}

	.ended-subtitle {
		font-size: 28rpx;
		color: #CCCCCC;
	}

	.video-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #FFFFFF;
		background: 
			radial-gradient(circle at 30% 30%, rgba(120, 119, 198, 0.8) 0%, transparent 50%),
			radial-gradient(circle at 70% 70%, rgba(120, 219, 255, 0.6) 0%, transparent 50%),
			linear-gradient(135deg, rgba(15, 12, 41, 0.9), rgba(48, 43, 99, 0.8));
		position: relative;
		overflow: hidden;
	}
	
	.video-placeholder::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 30%);
		pointer-events: none;
	}
	
	.placeholder-icon {
		font-size: 80rpx;
		margin-bottom: 20rpx;
		opacity: 0.9;
		text-shadow: 0 0 20rpx rgba(255, 255, 255, 0.3);
		position: relative;
		z-index: 1;
	}
	
	.placeholder-text {
		font-size: 32rpx;
		font-weight: bold;
		opacity: 0.9;
		text-shadow: 
			0 0 20rpx rgba(255, 255, 255, 0.3),
			0 2rpx 4rpx rgba(0, 0, 0, 0.3);
		position: relative;
		z-index: 1;
	}

	.live-indicator {
		font-size: 32rpx;
		margin-bottom: 20rpx;
		animation: pulse 2s infinite;
	}

	.video-text {
		font-size: 28rpx;
		color: #CCCCCC;
	}

	@keyframes pulse {
		0%, 100% { 
			opacity: 1; 
			transform: translateZ(0); /* GPU加速 */
		}
		50% { 
			opacity: 0.5; 
			transform: translateZ(0); /* GPU加速 */
		}
	}

	/* 浮动收起按钮 - 右下角 */
	.collapse-btn-floating {
		position: absolute;
		bottom: 15rpx;
		right: 15rpx;
		width: 60rpx;
		height: 60rpx;
		background: 
			radial-gradient(circle at 30% 30%, rgba(120, 119, 198, 0.9) 0%, transparent 50%),
			linear-gradient(135deg, rgba(120, 119, 198, 0.7), rgba(255, 119, 198, 0.5));
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 
			0 8rpx 24rpx rgba(0, 0, 0, 0.3),
			0 0 0 1rpx rgba(255, 255, 255, 0.2),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		backdrop-filter: blur(10rpx);
		z-index: 30;
	}

	/* 切换视频源按钮 - 右上角 */
	.switch-video-btn {
		position: absolute;
		top: 15rpx;
		right: 15rpx;
		width: 60rpx;
		height: 60rpx;
		background: 
			radial-gradient(circle at 70% 30%, rgba(120, 219, 255, 0.9) 0%, transparent 50%),
			linear-gradient(135deg, rgba(255, 119, 198, 0.7), rgba(120, 219, 255, 0.5));
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 
			0 8rpx 24rpx rgba(0, 0, 0, 0.3),
			0 0 0 1rpx rgba(255, 255, 255, 0.2),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
		backdrop-filter: blur(10rpx);
		z-index: 30;
	}

	.switch-video-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(255, 20, 147, 0.3),
		            0 0 0 1rpx rgba(255, 255, 255, 0.2);
	}

	.switch-video-btn:hover {
		transform: scale(1.05);
		box-shadow: 0 6rpx 20rpx rgba(255, 20, 147, 0.5),
		            0 0 0 2rpx rgba(255, 255, 255, 0.2);
	}

	.switch-icon {
		font-size: 24rpx;
		color: #FFFFFF;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease;
	}

	.switch-video-btn:active .switch-icon {
		transform: scale(0.9);
	}

	.collapse-btn-floating:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3),
		            0 0 0 1rpx rgba(255, 255, 255, 0.2);
	}

	.collapse-btn-floating:hover {
		transform: scale(1.05);
		box-shadow: 0 6rpx 20rpx rgba(102, 126, 234, 0.5),
		            0 0 0 2rpx rgba(255, 255, 255, 0.2);
	}

	.collapse-btn-floating .collapse-icon {
		font-size: 24rpx;
		color: #FFFFFF;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease;
	}

	.collapse-btn-floating:active .collapse-icon {
		transform: scale(0.9);
	}

	/* 票数进度条样式 */
	.progress-bar {
		height: 35rpx;
		background: 
			linear-gradient(90deg, 
				#FF1493 0%, 
				#FF8C00 25%, 
				#32CD32 50%, 
				#FF8C00 75%, 
				#FF1493 100%);
		background-size: 200% 200%;
		border: 3rpx solid #000;
		border-radius: 18rpx;
		position: relative;
		overflow: hidden;
		display: flex;
		animation: gradientShift 4s ease infinite;
		box-shadow: 
			0 6rpx 20rpx rgba(0, 0, 0, 0.3),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.4);
	}

	@keyframes gradientShift {
		0% { 
			background-position: 0% 50%; 
			transform: translateZ(0); /* GPU加速 */
		}
		50% { 
			background-position: 100% 50%; 
			transform: translateZ(0); /* GPU加速 */
		}
		100% { 
			background-position: 0% 50%; 
			transform: translateZ(0); /* GPU加速 */
		}
	}

	/* 浮动覆盖层的进度条样式 */
	.vote-progress-overlay .progress-bar {
		background: 
			linear-gradient(90deg, 
				#FF1493 0%, 
				#FF8C00 25%, 
				#32CD32 50%, 
				#FF8C00 75%, 
				#FF1493 100%);
		background-size: 200% 200%;
		backdrop-filter: blur(20rpx);
		box-shadow: 
			0 6rpx 20rpx rgba(0, 0, 0, 0.3),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.4);
	}

	.progress-fill {
		height: 100%;
		position: relative;
		transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.left-fill {
		background: 
			radial-gradient(circle at 30% 30%, rgba(120, 119, 198, 0.9) 0%, transparent 50%),
			linear-gradient(135deg, rgba(120, 119, 198, 0.8), rgba(255, 119, 198, 0.6));
		background-size: 300% 300%, 100% 100%;
		animation: leftPopBounce 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		box-shadow: 
			inset 0 0 20rpx rgba(255, 255, 255, 0.4),
			0 0 20rpx rgba(120, 119, 198, 0.6),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	}

	.right-fill {
		background: 
			radial-gradient(circle at 70% 30%, rgba(120, 219, 255, 0.9) 0%, transparent 50%),
			linear-gradient(135deg, rgba(255, 119, 198, 0.8), rgba(120, 219, 255, 0.6));
		background-size: 300% 300%, 100% 100%;
		animation: rightPopBounce 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		box-shadow: 
			inset 0 0 20rpx rgba(255, 255, 255, 0.4),
			0 0 20rpx rgba(120, 219, 255, 0.6),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	}

	@keyframes leftPopBounce {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	@keyframes rightPopBounce {
		0%, 100% { background-position: 100% 50%; }
		50% { background-position: 0% 50%; }
	}

	/* 浮动覆盖层的进度条填充样式 */
	.vote-progress-overlay .left-fill {
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
		background-size: 200% 200%;
	}

	.vote-progress-overlay .right-fill {
		background: linear-gradient(135deg, rgba(240, 147, 251, 0.9), rgba(245, 87, 108, 0.9));
		background-size: 200% 200%;
	}

	.progress-text {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 0 15rpx;
		gap: 8rpx;
	}

	.left-text {
		text-align: center;
	}

	.right-text {
		text-align: center;
	}

	.debater-name {
		font-size: 16rpx;
		font-weight: bold;
		color: #FFFFFF;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.7);
	}

	.vote-count {
		font-size: 18rpx;
		font-weight: bold;
		color: #FFFFFF;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.7);
		animation: countPulse 2s ease-in-out infinite;
	}

	@keyframes countPulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}


	/* 动态火焰分界线 - 单一大火焰团与跳动离子粒子 */
	.flame-divider {
		position: absolute;
		top: 30%;
		transform: translateX(-50%) translateY(-50%);
		width: 140rpx;
		height: 180rpx;
		transition: left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
		z-index: 20;
		pointer-events: none;
		animation: dividerPulse 0.8s ease-in-out infinite;
		overflow: visible;
	}

	@keyframes dividerPulse {
		0%, 100% {
			filter: drop-shadow(0 0 10rpx rgba(255, 0, 255, 0.6))
			        drop-shadow(0 0 15rpx rgba(255, 69, 0, 0.3));
		}
		25% {
			filter: drop-shadow(0 0 18rpx rgba(255, 0, 255, 0.8))
			        drop-shadow(0 0 28rpx rgba(255, 69, 0, 0.5))
			        drop-shadow(0 0 40rpx rgba(255, 100, 0, 0.3));
		}
		50% {
			filter: drop-shadow(0 0 25rpx rgba(255, 0, 255, 1))
			        drop-shadow(0 0 40rpx rgba(255, 69, 0, 0.8))
			        drop-shadow(0 0 60rpx rgba(255, 100, 0, 0.5))
			        drop-shadow(0 0 80rpx rgba(255, 200, 0, 0.3));
		}
		75% {
			filter: drop-shadow(0 0 20rpx rgba(255, 0, 255, 0.85))
			        drop-shadow(0 0 32rpx rgba(255, 69, 0, 0.6))
			        drop-shadow(0 0 45rpx rgba(255, 100, 0, 0.4));
		}
	}

	/* 分割线被击中的爆炸效果 */
	.flame-divider.divider-hit {
		animation: dividerExplosion 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
	}

	@keyframes dividerExplosion {
		0% {
			filter: drop-shadow(0 0 12rpx rgba(255, 0, 255, 0.6))
			        drop-shadow(0 0 18rpx rgba(255, 69, 0, 0.3));
			transform: translateX(-50%) scale(1);
		}
		15% {
			filter: drop-shadow(0 0 30rpx rgba(255, 0, 255, 0.95))
			        drop-shadow(0 0 45rpx rgba(255, 69, 0, 0.85))
			        drop-shadow(0 0 60rpx rgba(255, 100, 0, 0.6));
			transform: translateX(-50%) scale(1.2);
		}
		35% {
			filter: drop-shadow(0 0 40rpx rgba(255, 0, 255, 1))
			        drop-shadow(0 0 60rpx rgba(255, 69, 0, 0.95))
			        drop-shadow(0 0 80rpx rgba(255, 100, 0, 0.8))
			        drop-shadow(0 0 100rpx rgba(255, 200, 0, 0.5));
			transform: translateX(-50%) scale(1.35);
		}
		50% {
			filter: drop-shadow(0 0 50rpx rgba(255, 0, 255, 1))
			        drop-shadow(0 0 70rpx rgba(255, 69, 0, 1))
			        drop-shadow(0 0 100rpx rgba(255, 100, 0, 0.9))
			        drop-shadow(0 0 130rpx rgba(255, 200, 0, 0.6))
			        drop-shadow(0 0 150rpx rgba(255, 150, 0, 0.3));
			transform: translateX(-50%) scale(1.45);
		}
		75% {
			filter: drop-shadow(0 0 35rpx rgba(255, 0, 255, 0.9))
			        drop-shadow(0 0 50rpx rgba(255, 69, 0, 0.8))
			        drop-shadow(0 0 70rpx rgba(255, 100, 0, 0.6));
			transform: translateX(-50%) scale(1.2);
		}
		100% {
			filter: drop-shadow(0 0 10rpx rgba(255, 0, 255, 0.6))
			        drop-shadow(0 0 15rpx rgba(255, 69, 0, 0.3));
			transform: translateX(-50%) scale(1);
		}
	}

	.flame-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-around;
		animation: containerBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}

	@keyframes containerBounce {
		0%, 100% {
			transform: scaleX(1) scaleY(0.95);
		}
		50% {
			transform: scaleX(1.15) scaleY(1.1);
		}
	}

	.flame {
		font-size: 28rpx;
		animation: flamePopBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		filter: drop-shadow(0 0 15rpx rgba(255, 0, 255, 0.9))
		        drop-shadow(0 0 25rpx rgba(255, 69, 0, 0.7))
		        drop-shadow(0 0 35rpx rgba(255, 100, 0, 0.5));
		text-shadow: 0 0 12rpx rgba(255, 255, 0, 0.8);
		z-index: 2;
	}

	.flame-1 { animation-delay: 0s; }
	.flame-2 { animation-delay: 0.2s; }
	.flame-3 { animation-delay: 0.4s; }
	.flame-4 { animation-delay: 0.1s; }
	.flame-5 { animation-delay: 0.3s; }
	
	/* 侧边火焰样式 */
	.flame-side {
		position: absolute;
		font-size: 18rpx;
		animation: flameSideBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		filter: drop-shadow(0 0 12rpx rgba(255, 0, 255, 0.8))
		        drop-shadow(0 0 20rpx rgba(255, 69, 0, 0.6));
		text-shadow: 0 0 10rpx rgba(255, 255, 0, 0.7);
	}
	
	.flame-left {
		left: -15rpx;
		top: 30%;
		animation-delay: 0.15s;
	}
	
	.flame-right {
		right: -15rpx;
		top: 60%;
		animation-delay: 0.35s;
	}
	
	@keyframes flameSideBounce {
		0%, 100% {
			opacity: 0.7;
			transform: scale(0.8) rotate(-10deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.2) rotate(10deg);
		}
	}

	@keyframes flamePopBounce {
		0%, 100% {
			opacity: 0.8;
			transform: scale(0.9) rotate(-5deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.3) rotate(5deg);
		}
	}

	.flame-glow {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		animation: flamePopGlow 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}
	
	.flame-glow-1 {
		width: 50rpx;
		height: 80rpx;
		background: radial-gradient(ellipse, rgba(255, 0, 255, 0.9) 0%, rgba(255, 69, 0, 0.6) 35%, transparent 75%);
		box-shadow: 0 0 25rpx rgba(255, 0, 255, 1),
		            0 0 50rpx rgba(255, 69, 0, 0.8),
		            0 0 75rpx rgba(255, 100, 0, 0.6);
		animation-delay: 0s;
	}
	
	.flame-glow-2 {
		width: 35rpx;
		height: 60rpx;
		background: radial-gradient(ellipse, rgba(255, 100, 0, 0.8) 0%, rgba(255, 200, 0, 0.5) 40%, transparent 80%);
		box-shadow: 0 0 20rpx rgba(255, 100, 0, 0.9),
		            0 0 40rpx rgba(255, 200, 0, 0.7);
		animation-delay: 0.2s;
	}
	
	.flame-glow-3 {
		width: 25rpx;
		height: 45rpx;
		background: radial-gradient(ellipse, rgba(255, 255, 0, 0.7) 0%, rgba(255, 150, 0, 0.4) 50%, transparent 85%);
		box-shadow: 0 0 15rpx rgba(255, 255, 0, 0.8),
		            0 0 30rpx rgba(255, 150, 0, 0.6);
		animation-delay: 0.4s;
	}

	@keyframes flamePopGlow {
		0%, 100% {
			opacity: 0.5;
			transform: translate(-50%, -50%) scale(0.7);
		}
		50% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.4);
		}
	}

	.flame-sparks {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.spark {
		position: absolute;
		font-size: 14rpx;
		animation: sparkExplosion 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		filter: drop-shadow(0 0 6rpx rgba(255, 0, 255, 0.8));
	}

	.spark-1 {
		top: 20%;
		left: 50%;
		animation-delay: 0s;
	}

	.spark-2 {
		top: 40%;
		left: 30%;
		animation-delay: 0.2s;
	}
	
	.spark-3 {
		top: 60%;
		left: 70%;
		animation-delay: 0.4s;
	}
	
	.spark-4 {
		top: 80%;
		left: 50%;
		animation-delay: 0.1s;
	}
	
	.spark-5 {
		top: 30%;
		left: 70%;
		animation-delay: 0.3s;
	}
	
	.spark-6 {
		top: 70%;
		left: 30%;
		animation-delay: 0.5s;
	}

	@keyframes sparkExplosion {
		0%, 100% {
			opacity: 0;
			transform: translate(0, 0) scale(0);
		}
		30% {
			opacity: 1;
			transform: translate(0, -8rpx) scale(1.1);
		}
		60% {
			opacity: 0.8;
			transform: translate(0, -16rpx) scale(0.9);
		}
		100% {
			opacity: 0;
			transform: translate(0, -24rpx) scale(0);
		}
	}
	
	/* 中心大火焰团容器 - 单一集中火焰 - 全新设计 */
	.main-flame-container {
		position: absolute;
		top: 45%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100rpx;
		height: 100rpx;
		display: block;
		animation: mainFlameBounce 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		z-index: 10;
		pointer-events: none;
	}

	@keyframes mainFlameBounce {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1) rotate(0deg);
		}
		25% {
			transform: translate(-50%, -50%) scale(1.15) rotate(-2deg);
		}
		50% {
			transform: translate(-50%, -50%) scale(1.3) rotate(1deg);
		}
		75% {
			transform: translate(-50%, -50%) scale(1.1) rotate(-1deg);
		}
	}

	/* 中心大火焰 - 完全堆叠的单一火焰团 */
	.main-flame {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 48rpx;
		animation: mainFlameFlicker 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		filter: drop-shadow(0 0 8rpx rgba(255, 0, 255, 0.9))
		        drop-shadow(0 0 15rpx rgba(255, 69, 0, 0.7))
		        drop-shadow(0 0 25rpx rgba(255, 100, 0, 0.5));
		text-shadow: 0 0 8rpx rgba(255, 255, 0, 0.8),
		            0 0 15rpx rgba(255, 150, 0, 0.6),
		            0 0 22rpx rgba(255, 69, 0, 0.4);
		z-index: 5;
		line-height: 1;
	}

	/* 火焰堆叠 - 都在中心点，通过透明度和缩放变化创造融合感 */
	.main-flame-1 {
		animation-delay: 0s;
		opacity: 0.85;
		transform: translate(-50%, -50%) scale(1);
	}
	.main-flame-2 {
		animation-delay: 0.08s;
		opacity: 0.9;
		transform: translate(-50%, -50%) scale(1.05);
	}
	.main-flame-3 {
		animation-delay: 0.16s;
		opacity: 0.95;
		transform: translate(-50%, -50%) scale(1.1);
	}
	.main-flame-4 {
		animation-delay: 0.24s;
		opacity: 0.88;
		transform: translate(-50%, -50%) scale(0.95);
	}
	.main-flame-5 {
		animation-delay: 0.32s;
		opacity: 0.92;
		transform: translate(-50%, -50%) scale(1.08);
	}
	.main-flame-6 {
		animation-delay: 0.4s;
		opacity: 0.87;
		transform: translate(-50%, -50%) scale(1.02);
	}

	@keyframes mainFlameFlicker {
		0%, 100% {
			opacity: 0.85;
			transform: scale(1) rotate(-3deg);
		}
		15% {
			opacity: 1;
			transform: scale(1.08) rotate(1.5deg);
		}
		30% {
			opacity: 0.95;
			transform: scale(1.15) rotate(-2deg);
		}
		45% {
			opacity: 1;
			transform: scale(1.22) rotate(2.5deg);
		}
		60% {
			opacity: 0.9;
			transform: scale(1.1) rotate(-1.5deg);
		}
		75% {
			opacity: 0.98;
			transform: scale(1.18) rotate(3deg);
		}
	}
	
	/* 大火焰发光效果 - 增强型 */
	.main-flame-glow {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		animation: mainFlameGlow 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}

	.main-glow-1 {
		width: 60rpx;
		height: 70rpx;
		background: radial-gradient(ellipse, rgba(255, 0, 255, 0.8) 0%, rgba(255, 69, 0, 0.6) 30%, rgba(255, 100, 0, 0.3) 60%, transparent 80%);
		box-shadow: 0 0 15rpx rgba(255, 0, 255, 0.8),
		            0 0 25rpx rgba(255, 69, 0, 0.6),
		            0 0 35rpx rgba(255, 100, 0, 0.4);
		animation-delay: 0s;
	}

	.main-glow-2 {
		width: 45rpx;
		height: 55rpx;
		background: radial-gradient(ellipse, rgba(255, 100, 0, 0.7) 0%, rgba(255, 200, 0, 0.5) 40%, transparent 80%);
		box-shadow: 0 0 12rpx rgba(255, 100, 0, 0.8),
		            0 0 20rpx rgba(255, 200, 0, 0.6),
		            0 0 28rpx rgba(255, 150, 0, 0.4);
		animation-delay: 0.15s;
	}

	.main-glow-3 {
		width: 35rpx;
		height: 45rpx;
		background: radial-gradient(ellipse, rgba(255, 255, 0, 0.6) 0%, rgba(255, 150, 0, 0.4) 50%, transparent 85%);
		box-shadow: 0 0 10rpx rgba(255, 255, 0, 0.7),
		            0 0 18rpx rgba(255, 150, 0, 0.5),
		            0 0 25rpx rgba(255, 100, 0, 0.3);
		animation-delay: 0.3s;
	}

	@keyframes mainFlameGlow {
		0%, 100% {
			opacity: 0.5;
			transform: translate(-50%, -50%) scale(0.85);
		}
		25% {
			opacity: 0.75;
			transform: translate(-50%, -50%) scale(1.05);
		}
		50% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.4);
		}
		75% {
			opacity: 0.8;
			transform: translate(-50%, -50%) scale(1.15);
		}
	}
	
	/* 周围跳动的小火焰离子 */
	.flame-ions {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		overflow: visible;
	}
	
	.ion {
		position: absolute;
		font-size: 18rpx;
		animation: ionBounce 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		filter: drop-shadow(0 0 10rpx rgba(255, 0, 255, 0.95))
		        drop-shadow(0 0 18rpx rgba(255, 69, 0, 0.8))
		        drop-shadow(0 0 25rpx rgba(255, 100, 0, 0.5));
		text-shadow: 0 0 8rpx rgba(255, 255, 0, 0.9),
		            0 0 15rpx rgba(255, 150, 0, 0.6);
	}
	
	/* 离子位置分布 - 完美圆形环绕，离中心较近 */
	/* 上方 */
	.ion-1 { top: 8%; left: 50%; animation-delay: 0s; }
	/* 右上 */
	.ion-2 { top: 15%; right: 15%; animation-delay: 0.15s; }
	/* 右上方 */
	.ion-3 { top: 22%; right: 8%; animation-delay: 0.3s; }
	/* 右方 */
	.ion-4 { top: 50%; right: 5%; animation-delay: 0.45s; }
	/* 右下方 */
	.ion-5 { top: 72%; right: 8%; animation-delay: 0.6s; }
	/* 右下 */
	.ion-6 { top: 80%; right: 15%; animation-delay: 0.75s; }
	/* 下方 */
	.ion-7 { top: 88%; left: 50%; animation-delay: 0.9s; }
	/* 左下 */
	.ion-8 { top: 80%; left: 15%; animation-delay: 0.2s; }
	/* 左下方 */
	.ion-9 { top: 72%; left: 8%; animation-delay: 0.35s; }
	/* 左方 */
	.ion-10 { top: 50%; left: 5%; animation-delay: 0.5s; }
	/* 左上方 */
	.ion-11 { top: 22%; left: 8%; animation-delay: 0.65s; }
	/* 左上 */
	.ion-12 { top: 15%; left: 15%; animation-delay: 0.8s; }
	/* 额外粒子 - 在间隙位置 */
	.ion-13 { top: 12%; left: 35%; animation-delay: 0.25s; }
	.ion-14 { top: 12%; right: 35%; animation-delay: 0.4s; }
	.ion-15 { top: 30%; right: 20%; animation-delay: 0.55s; }
	.ion-16 { top: 68%; right: 20%; animation-delay: 0.7s; }
	.ion-17 { top: 84%; left: 35%; animation-delay: 0.1s; }
	.ion-18 { top: 84%; right: 35%; animation-delay: 0.85s; }
	.ion-19 { top: 30%; left: 20%; animation-delay: 0.32s; }
	.ion-20 { top: 68%; left: 20%; animation-delay: 0.62s; }

	@keyframes ionBounce {
		0%, 100% {
			opacity: 0.4;
			transform: translate(0, 0) scale(0.6) rotate(0deg);
		}
		25% {
			opacity: 0.8;
			transform: translate(-10rpx, -15rpx) scale(0.9) rotate(90deg);
		}
		50% {
			opacity: 1;
			transform: translate(10rpx, -25rpx) scale(1.15) rotate(180deg);
		}
		75% {
			opacity: 0.75;
			transform: translate(-8rpx, -35rpx) scale(0.85) rotate(270deg);
		}
	}


	/* 展开按钮 */
	.expand-btn {
		background: linear-gradient(135deg, #00FFFF, #00BFFF);
		border: 2rpx solid #000;
		border-radius: 15rpx;
		padding: 8rpx 20rpx;
		margin: 15rpx auto 20rpx auto;
		width: fit-content;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 255, 255, 0.3);
		transition: all 0.3s ease;
	}

	.expand-btn:active {
		transform: scale(0.95);
		box-shadow: 0 1rpx 4rpx rgba(0, 255, 255, 0.5);
	}

	.expand-icon {
		font-size: 18rpx;
		color: #FFFFFF;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.5);
	}

	.expand-text {
		font-size: 22rpx;
		font-weight: bold;
		color: #FFFFFF;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.5);
	}

	/* 主要内容区域 */
	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		transition: all 0.3s ease;
	}

	.main-content.expanded {
		/* 当直播收起时，内容区域放大 */
		margin-top: 0;
	}

	/* AI对话区域 */
	.ai-chat-container {
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border: 4rpx solid #e9ecef;
		border-radius: 32rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.08), 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
		height: 500rpx;
		display: flex;
		flex-direction: column;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		box-sizing: border-box;
		width: 100%;
		position: relative;
	}
	
	.ai-chat-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
		pointer-events: none;
	}

	/* AI对话区域展开状态 - 简单增加高度 */
	.main-content.expanded .ai-chat-container {
		height: 800rpx; /* 增加高度，提供更多空间 */
	}

	.chat-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
		padding: 28rpx 32rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 3rpx solid rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
	}
	
	.chat-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		animation: headerShimmer 3s infinite;
	}
	
	@keyframes headerShimmer {
		0% { left: -100%; }
		100% { left: 100%; }
	}

	.ai-icon {
		display: flex;
		align-items: center;
	}

	.ai-emoji {
		font-size: 40rpx;
		margin-right: 18rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.2));
		position: relative;
		z-index: 1;
	}

	.chat-title {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: 34rpx;
		font-weight: 700;
		color: #FFFFFF;
		flex: 1;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
		letter-spacing: 0.5rpx;
		position: relative;
		z-index: 1;
	}

	.status-indicator {
		width: 24rpx;
		height: 24rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #e0e0e0, #bdbdbd);
		position: relative;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		z-index: 1;
	}

	.status-indicator.active {
		background: linear-gradient(135deg, #4CAF50, #2E7D32);
		animation: pulse 2s infinite;
		box-shadow: 0 0 12rpx rgba(76, 175, 80, 0.4);
	}

	.status-dot {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background-color: inherit;
	}

	@keyframes pulse {
		0% { opacity: 1; }
		50% { opacity: 0.5; }
		100% { opacity: 1; }
	}

	.chat-messages {
		flex: 1;
		padding: 24rpx;
		overflow-y: auto;
		box-sizing: border-box;
		width: 100%;
		background: linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%);
		position: relative;
		z-index: 1;
	}

	.message-item {
		margin-bottom: 20rpx;
		display: flex;
		width: 100%;
		box-sizing: border-box;
		animation: messageSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes messageSlideIn {
		0% {
			opacity: 0;
			transform: translateY(20rpx);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.message-item.left {
		justify-content: flex-start;
	}

	.message-item.right {
		justify-content: flex-end;
	}

	.message-bubble {
		max-width: 85%;
		padding: 24rpx 28rpx;
		border-radius: 28rpx;
		border: 2rpx solid rgba(0, 0, 0, 0.08);
		position: relative;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		box-sizing: border-box;
		width: fit-content;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
		backdrop-filter: blur(10rpx);
	}

	.message-item.left .message-bubble {
		background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
		border-bottom-left-radius: 12rpx;
		border-color: rgba(33, 150, 243, 0.2);
	}

	.message-item.right .message-bubble {
		background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
		border-bottom-right-radius: 12rpx;
		border-color: rgba(156, 39, 176, 0.2);
	}

	.message-bubble:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
	}

	.message-bubble:active {
		transform: scale(0.98) translateY(0);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
	}

	.message-text {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', sans-serif;
		font-size: 30rpx;
		line-height: 1.6;
		color: #2c3e50;
		display: block;
		margin-bottom: 18rpx;
		word-wrap: break-word;
		font-weight: 400;
		letter-spacing: 0.3rpx;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.02);
	}

	.message-actions {
		display: flex;
		justify-content: flex-end;
		gap: 15rpx;
	}

	.action-item {
		display: flex;
		align-items: center;
		padding: 10rpx 16rpx;
		border-radius: 18rpx;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9));
		border: 2rpx solid rgba(0, 0, 0, 0.06);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(8rpx);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}

	.action-item:active {
		transform: scale(0.95);
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.08);
	}

	.action-item.liked {
		background: linear-gradient(135deg, #ffcdd2, #ffb3ba);
		border-color: rgba(244, 67, 54, 0.3);
		box-shadow: 0 2rpx 12rpx rgba(244, 67, 54, 0.2);
	}

	.action-icon {
		font-size: 22rpx;
		margin-right: 8rpx;
		filter: drop-shadow(0 1rpx 2rpx rgba(0, 0, 0, 0.1));
	}

	.action-count {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: 24rpx;
		font-weight: 600;
		color: #495057;
		letter-spacing: 0.2rpx;
	}

	.placeholder-message {
		text-align: center;
		color: #6c757d;
		padding: 80rpx 24rpx;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 249, 250, 0.8));
		border-radius: 24rpx;
		margin: 20rpx;
		backdrop-filter: blur(8rpx);
		border: 2rpx solid rgba(0, 0, 0, 0.04);
	}

	.placeholder-icon {
		font-size: 72rpx;
		display: block;
		margin-bottom: 24rpx;
		animation: bounce 2s infinite;
		filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-12rpx); }
		60% { transform: translateY(-6rpx); }
	}

	.placeholder-content {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: 34rpx;
		font-weight: 600;
		color: #495057;
		display: block;
		margin-bottom: 12rpx;
		letter-spacing: 0.3rpx;
	}

	.placeholder-subtitle {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: 28rpx;
		color: #6c757d;
		display: block;
		font-weight: 400;
		letter-spacing: 0.2rpx;
		line-height: 1.5;
	}

	/* 对抗条和投票区域 */
	.battle-section {
		background-color: #FFFFFF;
		border: 6rpx solid #000;
		border-radius: 30rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
	}

	/* 对抗条 */
	.battle-bar {
		height: 80rpx;
		background: linear-gradient(135deg, #FF00FF, #00FFFF, #FFD700, #FF1493);
		background-size: 300% 300%, 100% 100%;
		border: 6rpx dashed #000;
		border-radius: 50rpx;
		position: relative;
		overflow: hidden;
		display: flex;
		animation: popGradientShift 5s ease infinite;
		box-shadow: 0 0 20rpx rgba(255, 0, 255, 0.6),
		            0 8rpx 20rpx rgba(0, 0, 0, 0.3);
		margin-bottom: 30rpx;
	}

	@keyframes popGradientShift {
		0% { background-position: 0% 50%; transform: scale(1); }
		50% { background-position: 100% 50%; transform: scale(1.02); }
		100% { background-position: 0% 50%; transform: scale(1); }
	}

	.battle-fill {
		height: 100%;
		position: relative;
		transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.left-fill {
		background: 
			radial-gradient(circle at 30% 30%, rgba(120, 119, 198, 0.9) 0%, transparent 50%),
			linear-gradient(135deg, rgba(120, 119, 198, 0.8), rgba(255, 119, 198, 0.6));
		background-size: 300% 300%, 100% 100%;
		animation: leftPopBounce 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		box-shadow: 
			inset 0 0 20rpx rgba(255, 255, 255, 0.4),
			0 0 20rpx rgba(120, 119, 198, 0.6),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	}

	.right-fill {
		background: 
			radial-gradient(circle at 70% 30%, rgba(120, 219, 255, 0.9) 0%, transparent 50%),
			linear-gradient(135deg, rgba(255, 119, 198, 0.8), rgba(120, 219, 255, 0.6));
		background-size: 300% 300%, 100% 100%;
		animation: rightPopBounce 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		box-shadow: 
			inset 0 0 20rpx rgba(255, 255, 255, 0.4),
			0 0 20rpx rgba(120, 219, 255, 0.6),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	}

	@keyframes leftPopBounce {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}

	@keyframes rightPopBounce {
		0%, 100% { background-position: 100% 50%; }
		50% { background-position: 0% 50%; }
	}

	.battle-text {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 0 20rpx;
		gap: 10rpx;
	}

	.left-text {
		text-align: center;
	}

	.right-text {
		text-align: center;
	}

	.battle-label {
		font-size: 24rpx;
		font-weight: 900;
		color: #FFFFFF;
		text-shadow: 2rpx 2rpx 0 #000,
		             -2rpx -2rpx 0 #000,
		             2rpx -2rpx 0 #000,
		             -2rpx 2rpx 0 #000;
		letter-spacing: 2rpx;
		animation: popJump 0.6s ease-in-out infinite;
	}

	@keyframes popJump {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4rpx); }
	}

	.battle-count {
		font-size: 24rpx;
		font-weight: bold;
		color: #FFFFFF;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.7);
		animation: countPulse 2s ease-in-out infinite;
	}

	@keyframes countPulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}

	/* 动态闪电分界线 */
	.lightning-divider {
		position: absolute;
		top: 50%;
		transform: translateX(-50%) translateY(-50%);
		width: 40rpx;
		height: 60rpx;
		transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 20;
		pointer-events: none;
		animation: lightningPulse 1s ease-in-out infinite;
	}
	
	@keyframes lightningPulse {
		0%, 100% {
			filter: drop-shadow(0 0 8rpx rgba(255, 255, 0, 0.8))
			        drop-shadow(0 0 15rpx rgba(255, 255, 255, 0.6));
		}
		50% {
			filter: drop-shadow(0 0 15rpx rgba(255, 255, 0, 1))
			        drop-shadow(0 0 25rpx rgba(255, 255, 255, 0.8))
			        drop-shadow(0 0 35rpx rgba(0, 255, 255, 0.6));
		}
	}
	
	.lightning-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: lightningBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}
	
	@keyframes lightningBounce {
		0%, 100% {
			transform: scale(1) rotate(0deg);
		}
		25% {
			transform: scale(1.1) rotate(-2deg);
		}
		50% {
			transform: scale(1.2) rotate(2deg);
		}
		75% {
			transform: scale(1.05) rotate(-1deg);
		}
	}
	
	.lightning {
		font-size: 36rpx;
		animation: lightningFlicker 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		filter: drop-shadow(0 0 10rpx rgba(255, 255, 0, 1))
		        drop-shadow(0 0 20rpx rgba(255, 255, 255, 0.8))
		        drop-shadow(0 0 30rpx rgba(0, 255, 255, 0.6));
		text-shadow: 0 0 12rpx rgba(255, 255, 0, 1),
		            0 0 20rpx rgba(255, 255, 255, 0.8),
		            0 0 30rpx rgba(0, 255, 255, 0.6);
		z-index: 5;
	}
	
	@keyframes lightningFlicker {
		0%, 100% {
			opacity: 0.9;
			transform: scale(1) rotate(0deg);
		}
		20% {
			opacity: 1;
			transform: scale(1.1) rotate(-1deg);
		}
		40% {
			opacity: 0.8;
			transform: scale(1.2) rotate(1deg);
		}
		60% {
			opacity: 1;
			transform: scale(1.15) rotate(-0.5deg);
		}
		80% {
			opacity: 0.95;
			transform: scale(1.05) rotate(0.5deg);
		}
	}
	
	.lightning-glow {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 50rpx;
		height: 70rpx;
		background: radial-gradient(ellipse, rgba(255, 255, 0, 0.8) 0%, rgba(255, 255, 255, 0.6) 30%, rgba(0, 255, 255, 0.4) 60%, transparent 80%);
		border-radius: 50%;
		animation: lightningGlow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		box-shadow: 0 0 20rpx rgba(255, 255, 0, 0.9),
		            0 0 40rpx rgba(255, 255, 255, 0.7),
		            0 0 60rpx rgba(0, 255, 255, 0.5);
	}
	
	@keyframes lightningGlow {
		0%, 100% {
			opacity: 0.6;
			transform: translate(-50%, -50%) scale(0.8);
		}
		50% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.3);
		}
	}
	
	.lightning-sparks {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		overflow: visible;
	}
	
	.lightning-sparks .spark {
		position: absolute;
		font-size: 12rpx;
		animation: lightningSpark 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
		filter: drop-shadow(0 0 6rpx rgba(255, 255, 0, 0.9))
		        drop-shadow(0 0 12rpx rgba(255, 255, 255, 0.7));
		text-shadow: 0 0 8rpx rgba(255, 255, 0, 0.8);
	}
	
	.lightning-sparks .spark-1 {
		top: 20%;
		left: 50%;
		animation-delay: 0s;
	}
	
	.lightning-sparks .spark-2 {
		top: 50%;
		left: 30%;
		animation-delay: 0.4s;
	}
	
	.lightning-sparks .spark-3 {
		top: 80%;
		left: 70%;
		animation-delay: 0.8s;
	}
	
	@keyframes lightningSpark {
		0%, 100% {
			opacity: 0;
			transform: translate(0, 0) scale(0);
		}
		30% {
			opacity: 1;
			transform: translate(-5rpx, -8rpx) scale(1.1);
		}
		60% {
			opacity: 0.8;
			transform: translate(5rpx, -15rpx) scale(0.9);
		}
		100% {
			opacity: 0;
			transform: translate(0, -25rpx) scale(0);
		}
	}

	.flame-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-around;
		animation: containerBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
	}

	@keyframes containerBounce {
		0%, 100% {
			transform: scaleX(1) scaleY(0.95);
		}
		50% {
			transform: scaleX(1.15) scaleY(1.1);
		}
	}

	.flame {
		font-size: 12rpx;
		animation: flameFlicker 1s ease-in-out infinite alternate;
		filter: drop-shadow(0 0 3rpx rgba(255, 69, 0, 0.6));
	}

	.flame-1 { animation-delay: 0s; }
	.flame-2 { animation-delay: 0.3s; }
	.flame-3 { animation-delay: 0.6s; }

	@keyframes flamePopBounce {
		0%, 100% {
			opacity: 0.8;
			transform: scale(0.9) rotate(-5deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.3) rotate(5deg);
		}
	}

	.flame-glow {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 18rpx;
		height: 36rpx;
		background: radial-gradient(ellipse, rgba(255, 69, 0, 0.4) 0%, transparent 70%);
		animation: flameGlow 1.5s ease-in-out infinite alternate;
		border-radius: 50%;
	}

	@keyframes flameGlow {
		0% { 
			opacity: 0.4; 
			transform: translate(-50%, -50%) scale(1); 
		}
		100% { 
			opacity: 0.8; 
			transform: translate(-50%, -50%) scale(1.1); 
		}
	}

	.flame-sparks {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.spark {
		position: absolute;
		font-size: 8rpx;
		animation: sparkFloat 2.5s ease-in-out infinite;
	}

	.spark-1 {
		top: 30%;
		left: 50%;
		animation-delay: 0s;
	}

	.spark-2 {
		top: 70%;
		left: 30%;
		animation-delay: 1.2s;
	}

	@keyframes sparkExplosion {
		0%, 100% {
			opacity: 0;
			transform: translate(0, 0) scale(0);
		}
		30% {
			opacity: 1;
			transform: translate(0, -8rpx) scale(1.1);
		}
		60% {
			opacity: 0.8;
			transform: translate(0, -16rpx) scale(0.9);
		}
		100% {
			opacity: 0;
			transform: translate(0, -24rpx) scale(0);
		}
	}

	/* 投票按钮 */
	.vote-buttons {
		display: flex;
		gap: 20rpx;
	}

	.vote-btn {
		flex: 1;
		height: 100rpx;
		border: 3rpx solid #000;
		border-radius: 25rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15rpx;
		transition: all 0.3s ease;
		box-shadow: 
			0 6rpx 16rpx rgba(0, 0, 0, 0.4),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.3);
		transform: translateZ(0); /* GPU加速 */
		will-change: transform, box-shadow; /* 提示浏览器优化 */
		position: relative;
		overflow: hidden;
	}

	.left-btn {
		background: #FF1493;
	}

	.right-btn {
		background: #00FFFF;
	}

	.vote-btn.voted {
		background: linear-gradient(135deg, #FFD700, #FFA500);
		transform: scale(1.05);
		box-shadow: 0 6rpx 16rpx rgba(255, 215, 0, 0.4);
	}

	.vote-btn:active {
		transform: scale(0.95);
		animation: voteClick 0.3s ease;
	}

	.vote-btn.disabled {
		opacity: 0.5;
		pointer-events: none;
		background: linear-gradient(135deg, #ccc, #999);
		cursor: not-allowed;
	}

	.vote-btn.disabled:active {
		transform: none;
		animation: none;
	}

	@keyframes voteClick {
		0% { 
			transform: scale(1) translateZ(0); /* GPU加速 */
		}
		50% { 
			transform: scale(0.9) translateZ(0); /* GPU加速 */
		}
		100% { 
			transform: scale(1) translateZ(0); /* GPU加速 */
		}
	}

	/* 投票按钮特效 */
	.vote-btn.click-effect {
		animation: voteEffect 0.6s ease;
	}

	@keyframes voteEffect {
		0% { 
			transform: scale(1);
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
		}
		25% { 
			transform: scale(1.1);
			box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.3);
		}
		50% { 
			transform: scale(1.05);
			box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.4);
		}
		75% { 
			transform: scale(1.08);
			box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.3);
		}
		100% { 
			transform: scale(1);
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
		}
	}

	/* 正方按钮特殊特效 */
	.left-btn.click-effect {
		background: linear-gradient(135deg, #667eea, #764ba2, #a8a8ff);
		background-size: 200% 200%;
		animation: leftVoteEffect 0.8s ease, gradientShift 2s ease infinite;
	}

	@keyframes leftVoteEffect {
		0% { 
			transform: scale(1) rotate(0deg);
			filter: brightness(1);
		}
		25% { 
			transform: scale(1.05) rotate(-0.5deg);
			filter: brightness(1.1);
		}
		50% { 
			transform: scale(1.03) rotate(0.5deg);
			filter: brightness(1.15);
		}
		75% { 
			transform: scale(1.04) rotate(-0.3deg);
			filter: brightness(1.1);
		}
		100% { 
			transform: scale(1) rotate(0deg);
			filter: brightness(1);
		}
	}

	/* 反方按钮特殊特效 */
	.right-btn.click-effect {
		background: linear-gradient(135deg, #f093fb, #f5576c, #ffb3d1);
		background-size: 200% 200%;
		animation: rightVoteEffect 0.8s ease, gradientShift 2s ease infinite;
	}

	@keyframes rightVoteEffect {
		0% { 
			transform: scale(1) rotate(0deg);
			filter: brightness(1);
		}
		25% { 
			transform: scale(1.05) rotate(0.5deg);
			filter: brightness(1.1);
		}
		50% { 
			transform: scale(1.03) rotate(-0.5deg);
			filter: brightness(1.15);
		}
		75% { 
			transform: scale(1.04) rotate(0.3deg);
			filter: brightness(1.1);
		}
		100% { 
			transform: scale(1) rotate(0deg);
			filter: brightness(1);
		}
	}

	/* 已投票按钮的特殊效果 */
	.vote-btn.voted.click-effect {
		background: linear-gradient(135deg, #FFD700, #FFA500, #FF8C00);
		background-size: 200% 200%;
		animation: votedEffect 1s ease, gradientShift 1.5s ease infinite;
		box-shadow: 0 8rpx 20rpx rgba(255, 215, 0, 0.4);
	}

	@keyframes votedEffect {
		0% { 
			transform: scale(1);
			box-shadow: 0 8rpx 20rpx rgba(255, 215, 0, 0.4);
		}
		20% { 
			transform: scale(1.08) rotate(-1deg);
			box-shadow: 0 10rpx 25rpx rgba(255, 215, 0, 0.5);
		}
		40% { 
			transform: scale(1.06) rotate(1deg);
			box-shadow: 0 12rpx 30rpx rgba(255, 215, 0, 0.6);
		}
		60% { 
			transform: scale(1.07) rotate(-0.5deg);
			box-shadow: 0 10rpx 25rpx rgba(255, 215, 0, 0.5);
		}
		80% { 
			transform: scale(1.04) rotate(0.3deg);
			box-shadow: 0 9rpx 22rpx rgba(255, 215, 0, 0.45);
		}
		100% { 
			transform: scale(1);
			box-shadow: 0 8rpx 20rpx rgba(255, 215, 0, 0.4);
		}
	}

	.vote-btn-icon {
		font-size: 40rpx;
	}

	.vote-btn-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #000;
		text-shadow: 1rpx 1rpx 2rpx rgba(255, 255, 255, 0.5);
	}

	/* 底部导航栏 */
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 120rpx;
		background-color: #FFFFFF;
		border-top: 4rpx solid #000;
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding: 10rpx 0;
		box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		height: 100%;
		transition: all 0.3s ease;
		border-radius: 15rpx;
		margin: 0 5rpx;
	}

	.nav-item:active {
		transform: scale(0.95);
	}

	.nav-item.active {
		background-color: #f0f0f0;
		transform: scale(1.05);
	}

	.nav-icon {
		width: 50rpx;
		height: 50rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8rpx;
		border-radius: 50%;
		transition: all 0.3s ease;
	}

	.nav-item.active .nav-icon {
		background-color: #FF1493;
		transform: scale(1.1);
	}

	.icon {
		font-size: 32rpx;
		transition: all 0.3s ease;
	}

	.nav-item.active .icon {
		filter: brightness(1.2);
	}

	.nav-text {
		font-size: 22rpx;
		color: #666;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.nav-item.active .nav-text {
		color: #FF1493;
		font-weight: bold;
	}

	/* 为主容器添加底部间距，避免被导航栏遮挡 */
	.home-container {
		padding-bottom: 140rpx;
	}

	/* 自定义弹窗样式 */
	.custom-modal-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40rpx;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.custom-modal {
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border: 4rpx solid #e9ecef;
		border-radius: 32rpx;
		width: 100%;
		max-width: 640rpx;
		max-height: 85vh;
		overflow: hidden;
		box-shadow: 0 25rpx 50rpx rgba(0, 0, 0, 0.15), 0 0 0 1rpx rgba(255, 255, 255, 0.1);
		animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(10rpx);
	}

	@keyframes slideUp {
		from { 
			opacity: 0;
			transform: translateY(100rpx) scale(0.9);
		}
		to { 
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.modal-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #FF1493 100%);
		padding: 35rpx 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-bottom: 3rpx solid rgba(255, 255, 255, 0.2);
		position: relative;
		overflow: hidden;
	}

	.modal-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
		animation: shimmer 3s infinite;
	}

	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	.modal-title {
		font-size: 38rpx;
		font-weight: 700;
		color: #FFFFFF;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
		letter-spacing: 0.5rpx;
		position: relative;
		z-index: 1;
	}


	.modal-content {
		max-height: 60vh;
		padding: 40rpx 30rpx;
		background-color: #fafbfc;
		box-sizing: border-box;
		width: 100%;
	}

	.summary-section {
		margin-bottom: 40rpx;
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 25rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		box-sizing: border-box;
		width: 100%;
	}

	.comments-section {
		margin-bottom: 30rpx;
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 25rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		box-sizing: border-box;
	}

	.section-title {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
		padding-bottom: 15rpx;
		border-bottom: 2rpx solid #f0f0f0;
	}

	.title-icon {
		font-size: 36rpx;
		margin-right: 12rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}

	.title-text {
		font-size: 30rpx;
		font-weight: 600;
		color: #2c3e50;
		letter-spacing: 0.5rpx;
	}

	.summary-content {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border: 2rpx solid #dee2e6;
		border-radius: 18rpx;
		padding: 25rpx;
		position: relative;
		box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.06);
	}

	.summary-content::before {
		content: '';
		position: absolute;
		top: -2rpx;
		left: -2rpx;
		right: -2rpx;
		bottom: -2rpx;
		background: linear-gradient(135deg, #667eea, #764ba2, #FF1493, #FF69B4);
		border-radius: 18rpx;
		z-index: -1;
		opacity: 0.3;
	}

	.summary-text {
		font-size: 30rpx;
		line-height: 1.7;
		color: #2c3e50;
		display: block;
		font-weight: 500;
		letter-spacing: 0.3rpx;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		width: 100%;
		box-sizing: border-box;
	}

	.comment-item {
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border: 2rpx solid #e9ecef;
		border-radius: 18rpx;
		padding: 25rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		box-sizing: border-box;
		width: 100%;
		max-width: 100%;
	}

	.comment-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 4rpx;
		height: 100%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.comment-item:hover {
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.12);
		transform: translateY(-3rpx);
		border-color: #667eea;
	}

	.comment-item:hover::before {
		opacity: 1;
	}

	.comment-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 15rpx;
		padding-bottom: 10rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.user-info {
		display: flex;
		align-items: center;
	}

	.user-avatar {
		font-size: 32rpx;
		margin-right: 12rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}

	.user-name {
		font-size: 28rpx;
		font-weight: 600;
		color: #2c3e50;
		letter-spacing: 0.3rpx;
	}

	.comment-time {
		font-size: 24rpx;
		color: #95a5a6;
		font-weight: 500;
	}

	.comment-text {
		font-size: 28rpx;
		color: #34495e;
		line-height: 1.6;
		display: block;
		font-weight: 400;
		letter-spacing: 0.2rpx;
	}

	.empty-comments {
		text-align: center;
		padding: 50rpx 40rpx;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border: 2rpx dashed #bdc3c7;
		border-radius: 18rpx;
		position: relative;
	}

	.empty-comments::before {
		content: '💭';
		display: block;
		font-size: 48rpx;
		margin-bottom: 15rpx;
		opacity: 0.6;
	}

	.empty-text {
		font-size: 28rpx;
		color: #7f8c8d;
		font-weight: 500;
		letter-spacing: 0.3rpx;
	}

	.modal-footer {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		padding: 30rpx;
		border-top: 2rpx solid #dee2e6;
		display: flex;
		gap: 25rpx;
		box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
	}

	.footer-btn {
		flex: 1;
		height: 88rpx;
		border: 3rpx solid transparent;
		border-radius: 22rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		font-weight: 600;
		letter-spacing: 0.5rpx;
	}

	.footer-btn:active {
		transform: scale(0.96);
	}

	.cancel-btn {
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border-color: #dee2e6;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	}

	.cancel-btn:hover {
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		border-color: #adb5bd;
		box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.12);
	}

	.cancel-btn .btn-text {
		color: #495057;
		font-size: 30rpx;
	}

	.confirm-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #FF1493 100%);
		box-shadow: 0 6rpx 16rpx rgba(102, 126, 234, 0.4);
		position: relative;
		overflow: hidden;
	}

	.confirm-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transition: left 0.6s ease;
	}

	.confirm-btn:hover::before {
		left: 100%;
	}

	.confirm-btn:hover {
		box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.5);
		transform: translateY(-2rpx);
	}

	.confirm-btn .btn-text {
		color: #ffffff;
		font-size: 30rpx;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
	}

	.confirm-btn:active::before {
		left: 100%;
	}

	.btn-text {
		font-size: 28rpx;
		font-weight: bold;
		color: #000;
		position: relative;
		z-index: 1;
	}

	.confirm-btn .btn-text {
		color: #FFFFFF;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.3);
	}

	/* 投票特效容器 */
	.vote-effects-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 9998;
		overflow: hidden;
	}

	/* 特效符号 */
	.effect-symbol {
		position: absolute;
		font-size: 40rpx;
		pointer-events: none;
		z-index: 9999;
		animation: floatUp 4s ease-out forwards;
	}

	.symbol-text {
		display: block;
		text-shadow: 0 0 10rpx rgba(255, 255, 255, 0.8);
		filter: drop-shadow(0 0 5rpx rgba(0, 0, 0, 0.3));
	}

	/* 正方特效样式 */
	.effect-left {
		color: #FF1493;
		animation-name: floatUpLeft;
	}

	/* 反方特效样式 */
	.effect-right {
		color: #00BFFF;
		animation-name: floatUpRight;
	}

	/* 向上飘动动画 - 正方（从左边飘出） */
	@keyframes floatUpLeft {
		0% {
			opacity: 1;
			transform: translateY(0) translateX(0) scale(0.8) rotate(0deg);
		}
		15% {
			opacity: 1;
			transform: translateY(-40rpx) translateX(-10rpx) scale(1) rotate(-5deg);
		}
		35% {
			opacity: 0.9;
			transform: translateY(-120rpx) translateX(-20rpx) scale(1.1) rotate(5deg);
		}
		60% {
			opacity: 0.7;
			transform: translateY(-220rpx) translateX(-30rpx) scale(1) rotate(-3deg);
		}
		80% {
			opacity: 0.4;
			transform: translateY(-350rpx) translateX(-40rpx) scale(0.8) rotate(2deg);
		}
		100% {
			opacity: 0;
			transform: translateY(-500rpx) translateX(-50rpx) scale(0.5) rotate(0deg);
		}
	}

	/* 向上飘动动画 - 反方（从右边飘出） */
	@keyframes floatUpRight {
		0% {
			opacity: 1;
			transform: translateY(0) translateX(0) scale(0.8) rotate(0deg);
		}
		15% {
			opacity: 1;
			transform: translateY(-40rpx) translateX(10rpx) scale(1) rotate(5deg);
		}
		35% {
			opacity: 0.9;
			transform: translateY(-120rpx) translateX(20rpx) scale(1.1) rotate(-5deg);
		}
		60% {
			opacity: 0.7;
			transform: translateY(-220rpx) translateX(30rpx) scale(1) rotate(3deg);
		}
		80% {
			opacity: 0.4;
			transform: translateY(-350rpx) translateX(40rpx) scale(0.8) rotate(-2deg);
		}
		100% {
			opacity: 0;
			transform: translateY(-500rpx) translateX(50rpx) scale(0.5) rotate(0deg);
		}
	}

	/* 通用向上飘动动画 */
	@keyframes floatUp {
		0% {
			opacity: 1;
			transform: translateY(0) scale(0.8);
		}
		15% {
			opacity: 1;
			transform: translateY(-40rpx) scale(1);
		}
		35% {
			opacity: 0.9;
			transform: translateY(-120rpx) scale(1.1);
		}
		60% {
			opacity: 0.7;
			transform: translateY(-220rpx) scale(1);
		}
		80% {
			opacity: 0.4;
			transform: translateY(-350rpx) scale(0.8);
		}
		100% {
			opacity: 0;
			transform: translateY(-500rpx) scale(0.5);
		}
	}

	/* 增强特效符号的视觉效果 */
	.effect-symbol::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 60rpx;
		height: 60rpx;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
		animation: glowPulse 4s ease-out forwards;
		pointer-events: none;
	}

	@keyframes glowPulse {
		0% {
			opacity: 0.8;
			transform: translate(-50%, -50%) scale(0.5);
		}
		50% {
			opacity: 0.6;
			transform: translate(-50%, -50%) scale(1.2);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(2);
		}
	}

	/* 正方特效发光效果 */
	.effect-left::before {
		background: radial-gradient(circle, rgba(255, 20, 147, 0.4) 0%, transparent 70%);
	}

	/* 反方特效发光效果 */
	.effect-right::before {
		background: radial-gradient(circle, rgba(0, 191, 255, 0.4) 0%, transparent 70%);
	}

	/* 预设观点滑块样式 */
	.preset-section {
		background-color: #FFFFFF;
		border: 6rpx solid #000;
		border-radius: 30rpx;
		padding: 25rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
	}

	.preset-header {
		text-align: center;
		margin-bottom: 25rpx;
	}

	.preset-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}

	.preset-subtitle {
		font-size: 24rpx;
		color: #666;
		display: block;
		line-height: 1.5;
		padding: 0 10rpx;
	}

	.preset-slider-container {
		margin-bottom: 20rpx;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		margin-bottom: 20rpx;
	}

	.slider-label {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
	}

	.left-label {
		color: #FF1493;
	}

	.right-label {
		color: #00BFFF;
	}

	.slider-wrapper {
		margin: 20rpx 0;
		padding: 0 20rpx;
	}

	.preset-slider {
		width: 100%;
	}

	.preset-info {
		text-align: center;
		margin-top: 15rpx;
	}

	.preset-info-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
	}

	.preset-percentage {
		font-size: 40rpx;
		font-weight: bold;
		color: #FF1493;
		display: inline-block;
	}

	.preset-desc {
		font-size: 26rpx;
		color: #666;
		display: inline-block;
	}

	.start-live-btn {
		background: linear-gradient(135deg, #FF1493, #FF69B4);
		border: 4rpx solid #000;
		border-radius: 25rpx;
		padding: 20rpx;
		text-align: center;
		box-shadow: 0 6rpx 16rpx rgba(255, 20, 147, 0.3);
		transition: all 0.3s ease;
	}

	.start-live-btn:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 12rpx rgba(255, 20, 147, 0.4);
	}

	.start-btn-text {
		font-size: 32rpx;
		font-weight: bold;
		color: #FFFFFF;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.3);
	}



	/* 对抗条百分数样式 */
	.battle-percentage {
		font-size: 26rpx;
		font-weight: 900;
		color: #FFFFFF;
		text-shadow: 2rpx 2rpx 0 #000,
		             -2rpx -2rpx 0 #000,
		             2rpx -2rpx 0 #000,
		             -2rpx 2rpx 0 #000;
		margin: 0 8rpx;
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2));
		padding: 4rpx 10rpx;
		border-radius: 15rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.5);
		animation: percentageFlash 1.5s ease-in-out infinite;
	}

	@keyframes percentageFlash {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}

	/* 评论弹窗样式 */
	.comment-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(8rpx);
		animation: commentModalFadeIn 0.3s ease-out;
	}

	@keyframes commentModalFadeIn {
		0% {
			opacity: 0;
			backdrop-filter: blur(0rpx);
		}
		100% {
			opacity: 1;
			backdrop-filter: blur(8rpx);
		}
	}

	.comment-modal {
		width: 90%;
		max-width: 600rpx;
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border-radius: 32rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15), 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
		overflow: hidden;
		animation: commentModalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	@keyframes commentModalSlideIn {
		0% {
			opacity: 0;
			transform: translateY(60rpx) scale(0.9);
		}
		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.comment-modal::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
		pointer-events: none;
	}

	.comment-modal-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
		padding: 32rpx 36rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
		overflow: hidden;
	}

	.comment-modal-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		animation: commentHeaderShimmer 3s infinite;
	}

	@keyframes commentHeaderShimmer {
		0% { left: -100%; }
		100% { left: 100%; }
	}

	.comment-modal-title {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: 36rpx;
		font-weight: 700;
		color: #FFFFFF;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
		letter-spacing: 0.5rpx;
		position: relative;
		z-index: 1;
	}

	.comment-close-btn {
		width: 48rpx;
		height: 48rpx;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		backdrop-filter: blur(10rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		position: relative;
		z-index: 1;
	}

	.comment-close-btn:active {
		transform: scale(0.9);
		background: rgba(255, 255, 255, 0.3);
	}

	.comment-close-icon {
		font-size: 24rpx;
		color: #FFFFFF;
		font-weight: bold;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.3);
	}

	.comment-modal-content {
		padding: 36rpx;
		background: linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%);
		position: relative;
		z-index: 1;
	}

	.comment-input-container {
		position: relative;
	}

	.comment-textarea {
		width: 100%;
		min-height: 200rpx;
		padding: 24rpx 28rpx;
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border: 3rpx solid rgba(102, 126, 234, 0.1);
		border-radius: 24rpx;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: 30rpx;
		line-height: 1.6;
		color: #2c3e50;
		box-sizing: border-box;
		transition: all 0.3s ease;
		backdrop-filter: blur(8rpx);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
		resize: none;
	}

	.comment-textarea:focus {
		border-color: rgba(102, 126, 234, 0.3);
		box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.1);
		outline: none;
	}

	.comment-textarea::placeholder {
		color: #adb5bd;
		font-weight: 400;
	}

	.comment-char-count {
		position: absolute;
		bottom: 16rpx;
		right: 20rpx;
		background: rgba(255, 255, 255, 0.9);
		padding: 8rpx 12rpx;
		border-radius: 12rpx;
		backdrop-filter: blur(8rpx);
		border: 1rpx solid rgba(0, 0, 0, 0.06);
	}

	.char-count-text {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: 22rpx;
		color: #6c757d;
		font-weight: 500;
	}

	.comment-modal-footer {
		padding: 24rpx 36rpx 36rpx;
		display: flex;
		gap: 20rpx;
		background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
		position: relative;
		z-index: 1;
	}

	.comment-footer-btn {
		flex: 1;
		height: 88rpx;
		border-radius: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(8rpx);
	}

	.comment-cancel-btn {
		background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
		border: 2rpx solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}

	.comment-cancel-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
	}

	.comment-confirm-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: 2rpx solid rgba(102, 126, 234, 0.3);
		box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.2);
	}

	.comment-confirm-btn:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.3);
	}

	.comment-confirm-btn.disabled {
		background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
		border-color: rgba(0, 0, 0, 0.1);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		opacity: 0.6;
	}

	.comment-confirm-btn.disabled:active {
		transform: none;
	}

	.comment-confirm-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s ease;
	}

	.comment-confirm-btn:not(.disabled):active::before {
		left: 100%;
	}

	.comment-btn-text {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-size: 32rpx;
		font-weight: 600;
		letter-spacing: 0.3rpx;
		position: relative;
		z-index: 1;
	}

	.comment-cancel-btn .comment-btn-text {
		color: #495057;
	}

	.comment-confirm-btn .comment-btn-text {
		color: #FFFFFF;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
	}

	.comment-confirm-btn.disabled .comment-btn-text {
		color: #6c757d;
		text-shadow: none;
	}

	/* 调整对抗条文字布局 */
	.battle-text {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 0 15rpx;
		gap: 8rpx;
		flex-wrap: wrap;
	}

	.left-text {
		text-align: center;
	}

	.right-text {
		text-align: center;
	}

	/* 直播状态指示器 */
	.live-status-indicator {
		position: absolute;
		top: 10rpx;
		right: 10rpx;
		background-color: rgba(255, 0, 0, 0.8);
		color: #FFFFFF;
		padding: 5rpx 10rpx;
		border-radius: 10rpx;
		font-size: 20rpx;
		font-weight: bold;
		z-index: 10;
	}

	.live-status-indicator.live {
		background-color: rgba(0, 255, 0, 0.8);
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% { opacity: 1; }
		50% { opacity: 0.5; }
		100% { opacity: 1; }
	}

	/* 百分数变化提示样式 */
	.percentage-change-tip {
		position: absolute;
		top: -60rpx;
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.8);
		color: #FFFFFF;
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		font-size: 24rpx;
		font-weight: bold;
		z-index: 100;
		animation: tipFadeInOut 2s ease-in-out;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
	}

	.tip-left {
		background-color: rgba(255, 20, 147, 0.9);
		border: 2rpx solid #FF1493;
	}

	.tip-right {
		background-color: rgba(0, 191, 255, 0.9);
		border: 2rpx solid #00BFFF;
	}

	.tip-text {
		display: block;
		text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.5);
	}

	@keyframes tipFadeInOut {
		0% {
			opacity: 0;
			transform: translateX(-50%) translateY(10rpx) scale(0.8);
		}
		20% {
			opacity: 1;
			transform: translateX(-50%) translateY(0) scale(1);
		}
		80% {
			opacity: 1;
			transform: translateX(-50%) translateY(0) scale(1);
		}
		100% {
			opacity: 0;
			transform: translateX(-50%) translateY(-10rpx) scale(0.8);
		}
	}

	/* ===== 搞怪装饰元素 - 不是AI生成的感觉 ===== */

	/* 浮动的趣味装饰元素 */
	.playful-decoration {
		position: absolute;
		font-size: 80rpx;
		opacity: 0.15;
		pointer-events: none;
		z-index: 0;
		animation: playfulBounce 4s ease-in-out infinite;
		filter: drop-shadow(0 4rpx 12rpx rgba(255, 100, 150, 0.2));
	}

	.decoration-1 {
		top: 5%;
		right: 10%;
		animation-delay: 0s;
		animation-duration: 5s;
	}

	.decoration-2 {
		top: 25%;
		left: 5%;
		animation-delay: 1s;
		animation-duration: 6s;
	}

	.decoration-3 {
		bottom: 15%;
		right: 15%;
		animation-delay: 2s;
		animation-duration: 4.5s;
	}

	.decoration-4 {
		bottom: 30%;
		left: 10%;
		animation-delay: 1.5s;
		animation-duration: 5.5s;
	}

	@keyframes playfulBounce {
		0%, 100% {
			transform: translateY(0) rotate(0deg) scale(1);
		}
		25% {
			transform: translateY(-20rpx) rotate(5deg) scale(1.08);
		}
		50% {
			transform: translateY(-35rpx) rotate(-3deg) scale(0.95);
		}
		75% {
			transform: translateY(-15rpx) rotate(4deg) scale(1.05);
		}
	}

	/* 不规则的纹理背景装饰 */
	.texture-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image:
			repeating-linear-gradient(
				45deg,
				transparent,
				transparent 100rpx,
				rgba(255, 255, 255, 0.02) 100rpx,
				rgba(255, 255, 255, 0.02) 101rpx
			),
			repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 80rpx,
				rgba(0, 0, 0, 0.01) 80rpx,
				rgba(0, 0, 0, 0.01) 81rpx
			);
		pointer-events: none;
		z-index: 0;
	}

	/* 搞怪的不规则动画框 */
	.quirky-frame {
		position: relative;
		border: 3rpx dashed rgba(255, 100, 150, 0.3);
		border-radius: 20rpx;
		padding: 2rpx;
		animation: quirkyTilt 6s ease-in-out infinite;
	}

	@keyframes quirkyTilt {
		0% {
			transform: rotate(-0.5deg);
			border-color: rgba(255, 100, 150, 0.3);
		}
		25% {
			transform: rotate(0.3deg);
			border-color: rgba(0, 180, 220, 0.25);
		}
		50% {
			transform: rotate(-0.2deg);
			border-color: rgba(255, 100, 150, 0.35);
		}
		75% {
			transform: rotate(0.4deg);
			border-color: rgba(100, 200, 255, 0.2);
		}
		100% {
			transform: rotate(-0.5deg);
			border-color: rgba(255, 100, 150, 0.3);
		}
	}

	/* 闪烁的光点装饰 */
	.glitch-sparkle {
		position: absolute;
		width: 2rpx;
		height: 2rpx;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.8), rgba(255, 100, 150, 0.3));
		border-radius: 50%;
		pointer-events: none;
		animation: sparkleFlash 2s infinite;
	}

	.sparkle-1 {
		top: 15%;
		right: 20%;
		animation-delay: 0s;
	}

	.sparkle-2 {
		top: 45%;
		left: 15%;
		animation-delay: 0.5s;
	}

	.sparkle-3 {
		bottom: 20%;
		right: 25%;
		animation-delay: 1s;
	}

	@keyframes sparkleFlash {
		0%, 100% {
			opacity: 0;
			transform: scale(0);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* 波浪纹理效果 - 增加有机感 */
	.wave-texture {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		background:
			radial-gradient(ellipse 200rpx 150rpx at 20% 50%, rgba(255, 100, 150, 0.05), transparent),
			radial-gradient(ellipse 250rpx 200rpx at 80% 50%, rgba(0, 180, 220, 0.04), transparent);
		pointer-events: none;
		animation: waveShift 12s ease-in-out infinite;
	}

	@keyframes waveShift {
		0%, 100% {
			filter: blur(2rpx);
		}
		50% {
			filter: blur(3rpx);
		}
	}

	/* 卡片的不规则边框效果 */
	.irregular-border {
		position: relative;
		border-radius: 32rpx 12rpx 28rpx 18rpx;
		overflow: hidden;
		animation: borderShift 8s ease-in-out infinite;
	}

	@keyframes borderShift {
		0% {
			border-radius: 32rpx 12rpx 28rpx 18rpx;
		}
		25% {
			border-radius: 28rpx 14rpx 32rpx 20rpx;
		}
		50% {
			border-radius: 30rpx 16rpx 26rpx 22rpx;
		}
		75% {
			border-radius: 26rpx 18rpx 30rpx 16rpx;
		}
		100% {
			border-radius: 32rpx 12rpx 28rpx 18rpx;
		}
	}

	/* 微妙的抖动效果 - 更生动 */
	.subtle-wiggle {
		animation: subtleWiggle 0.4s ease-in-out infinite;
	}

	@keyframes subtleWiggle {
		0%, 100% {
			transform: translateX(0) rotate(0deg);
		}
		25% {
			transform: translateX(1rpx) rotate(0.2deg);
		}
		50% {
			transform: translateX(-1rpx) rotate(-0.2deg);
		}
		75% {
			transform: translateX(0.5rpx) rotate(0.1deg);
		}
	}

	/* 脉冲发光效果 - 视觉引导 */
	.pulse-glow {
		animation: pulseGlowEffect 3s ease-in-out infinite;
	}

	@keyframes pulseGlowEffect {
		0%, 100% {
			box-shadow: 0 0 20rpx rgba(255, 100, 150, 0.3);
		}
		50% {
			box-shadow: 0 0 40rpx rgba(0, 180, 220, 0.4);
		}
	}

	/* 随机动画错误感（故意的） */
	.glitchy-text {
		animation: glitchyShake 0.15s infinite;
	}

	@keyframes glitchyShake {
		0% {
			text-shadow: -2rpx 0 #FF1493, 2rpx 0 #00BFFF;
			transform: translateX(0);
		}
		20% {
			text-shadow: -2rpx 0 #FF1493, 2rpx 0 #00BFFF;
			transform: translateX(-1rpx);
		}
		40% {
			text-shadow: 2rpx 0 #FF1493, -2rpx 0 #00BFFF;
			transform: translateX(1rpx);
		}
		60% {
			text-shadow: -2rpx 0 #00BFFF, 2rpx 0 #FF1493;
			transform: translateX(-1rpx);
		}
		80% {
			text-shadow: 2rpx 0 #00BFFF, -2rpx 0 #FF1493;
			transform: translateX(1rpx);
		}
		100% {
			text-shadow: -2rpx 0 #FF1493, 2rpx 0 #00BFFF;
			transform: translateX(0);
		}
	}

	/* 3D 透视变换 - 增加空间感 */
	.perspective-tilt {
		perspective: 1000rpx;
		animation: perspectiveTilt 6s ease-in-out infinite;
	}

	@keyframes perspectiveTilt {
		0%, 100% {
			transform: rotateX(0deg) rotateY(0deg);
		}
		25% {
			transform: rotateX(2deg) rotateY(-3deg);
		}
		50% {
			transform: rotateX(-2deg) rotateY(3deg);
		}
		75% {
			transform: rotateX(1deg) rotateY(-2deg);
		}
	}
</style>

