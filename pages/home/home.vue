<template>
	<view class="home-container">
		<!-- 全屏 Lottie 背景动画 -->
		<view class="fullscreen-lottie-bg">
			<!-- #ifdef MP-WEIXIN -->
			<!-- 微信小程序使用 canvas 渲染 -->
			<canvas
				type="2d"
				id="home-bg-lottie-canvas"
				class="bg-lottie-canvas"
				canvas-id="home-bg-lottie-canvas"
			></canvas>
			<!-- #endif -->
			<!-- #ifndef MP-WEIXIN -->
			<DotLottieVue
				:src="'/static/animations/lcBg-01.json'"
				:autoplay="true"
				:loop="true"
				:background="'transparent'"
				:speed="1"
				:direction="1"
				:playMode="'normal'"
				style="width: 100%; height: 100%;"
			/>
			<!-- #endif -->
		</view>
		
		<!-- 装饰性动画元素组件 -->
		<PopDecoration />

		<!-- 直播画面区域 - 优化：改用CSS隐藏而非v-if卸载，保证视频后台播放 -->
		<view class="live-section" :class="{ 'collapsed-hide': isLiveCollapsed }">
			<!-- 直播视频区域 -->
			<view class="live-video-container">
				<!-- 收起按钮 - 浮动在右上角 -->
				<view class="collapse-btn-floating" @click="toggleLiveCollapse">
					<image src="/static/iconfont/shouqi.png" class="collapse-icon-img" mode="aspectFit"></image>
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
					<!-- #ifdef MP-WEIXIN -->
					<!-- 微信小程序直播播放器 - 支持 FLV/RTMP/HLS -->
					<live-player
						v-if="isLiveStarted && liveStreamUrl"
						:key="liveStreamUrl"
						:src="liveStreamUrl"
						class="live-player"
						:mode="getPlayerMode()"
						autoplay
						:muted="isMuted"
						object-fit="contain"
						:min-cache="getPlayerMinCache()"
						:max-cache="getPlayerMaxCache()"
						:background-mute="false"
						:enable-auto-rotation="false"
						:orientation="hlsConfig.orientation"
						:picture-in-picture-mode="hlsConfig.pipMode"
						:sound-mode="hlsConfig.soundMode"
						@statechange="handleLiveStateChange"
						@error="handleLiveError"
						@netstatus="handleNetStatus"
						@fullscreenchange="handleFullScreenChange"
						@audiovolumenotify="handleAudioVolumeNotify">
					</live-player>
					<!-- HLS 连接状态指示器 -->
					<view class="hls-status-indicator" v-if="hlsStatus.show">
						<text class="hls-status-text" :class="hlsStatus.type">{{ hlsStatus.message }}</text>
					</view>
					<!-- #endif -->
					
					<!-- #ifndef MP-WEIXIN -->
					<!-- H5环境使用video标签 -->
					<video
						v-if="isLiveStarted && liveStreamUrl"
						:key="liveStreamUrl"
						:src="liveStreamUrl"
						class="live-player"
						autoplay
						:muted="isMuted"
						controls
						@error="handleLiveError">
					</video>
					<!-- #endif -->

					<!-- 直播开始前显示占位内容 -->
					<view v-if="!isLiveStarted" class="video-placeholder">
						<text class="placeholder-icon">🎬</text>
						<text class="placeholder-text">直播未开始</text>
					</view>

					<!-- 播放按钮 - 左下角 -->
					<view class="play-button" v-if="!isLiveStarted" @click="startLive">
						<image src="/static/iconfont/bofang.png" class="play-icon-img" mode="aspectFit"></image>
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
			<image src="/static/iconfont/zhankai.png" class="expand-icon-img" mode="aspectFit"></image>
			<text class="expand-text">展开画面</text>
		</view>

		<!-- 主要内容区域 -->
		<view class="main-content" :class="{ 'expanded': isLiveCollapsed }">
			<!-- AI对话区域 -->
		<view class="ai-chat-container">
			<scroll-view class="chat-messages" scroll-y="true" :scroll-top="scrollTop">
					<view class="message-item" v-for="message in aiMessages" :key="message.id"
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
				<!-- 预设观点滑块（直播前显示，直播开始后可通过按钮控制显示） -->
				<view class="preset-section" v-if="showPresetSlider && (!isLiveStarted || (isLiveStarted && showPresetPanel))">
					<view class="preset-header">
						<text class="preset-title">🎯 预设观点倾向</text>
						<!-- 直播开始后的关闭按钮 -->
						<view class="preset-close-btn" v-if="isLiveStarted" @click="togglePresetPanel">
							<text class="close-icon">✕</text>
						</view>
					</view>
					<!-- 辩题显示 -->
					<view class="preset-debate-topic">
						<text class="debate-topic-text">{{ debateTitle }}</text>
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
								block-size="14"
								block-color="#FF1493"
								active-color="#FF8C00"
								background-color="#E0E0E0"
								:show-value="true"
							/>
						</view>
						<!-- 确定按钮（圆形，放在进度条下方） -->
						<view class="preset-confirm-btn-wrapper" v-if="(!isLiveStarted && !initialVotesSubmitted) || (isLiveStarted && votesChanged)">
							<view class="preset-confirm-btn-circle" @click="confirmPresetVotes">
								<text class="confirm-btn-text">✓</text>
							</view>
						</view>
					<view class="preset-info">
						<view class="preset-info-row">
							<text class="preset-percentage">{{ presetOpinion }}%</text>
							<text class="preset-desc">{{ getPresetDescription() }}</text>
						</view>
					</view>
				</view>
				</view>
				
				<!-- 直播开始后的预设观点缩小按钮 -->
				<view class="preset-mini-row" v-if="isLiveStarted && !showPresetPanel">
					<text class="vote-message-text"> 选择你的心中所想</text>
					<view class="preset-mini-button" @click="togglePresetPanel" :class="{'value-changing': isValueChanging}">
						<text class="mini-button-value" :class="{'value-animate': isValueChanging}">{{ presetOpinion }}%</text>
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
					
				<!-- 动态火焰分界线 - 使用 Lottie 动画 -->
				<view class="flame-divider" :class="{ 'divider-hit': dividerHit }" :style="{ left: currentLeftPercentage + '%' }">
						<!-- Lottie 火焰动画 -->
						<view class="lottie-fire-container">
							<!-- #ifdef MP-WEIXIN -->
							<canvas
								type="2d"
								id="lottie-fire"
								canvas-id="lottie-fire"
								class="lottie-fire-canvas"
								:style="{ width: '200rpx', height: '200rpx' }"
							></canvas>
							<!-- #endif -->
							<!-- #ifndef MP-WEIXIN -->
							<div 
								id="lottie-fire"
								class="lottie-fire-wrapper" 
								:style="{ width: '200rpx', height: '200rpx' }">
							</div>
							<!-- #endif -->
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
					<!-- 正方按钮 -->
					<view class="lottie-button-container left-button" @click="voteLeft" 
						  :class="{ 
							  'voted': userVote === 'left',
							  'disabled': !isLiveStarted
						  }">
						<!-- 动画外框 -->
						<view class="animation-frame left-frame">
							<!-- #ifdef MP-WEIXIN -->
							<canvas
								type="2d"
								:id="'lottie-button-left'"
								:canvas-id="'lottie-button-left'"
								class="lottie-button-canvas"
								:style="{ width: '200rpx', height: '120rpx' }"
							></canvas>
							<!-- #endif -->
							<!-- #ifndef MP-WEIXIN -->
							<div 
								:id="'lottie-button-left'"
								class="lottie-button-wrapper" 
								:style="{ width: '200rpx', height: '120rpx' }">
							</div>
							<!-- #endif -->
						</view>
					</view>
					
					<!-- 反方按钮 -->
					<view class="lottie-button-container right-button" @click="voteRight" 
						  :class="{ 
							  'voted': userVote === 'right',
							  'disabled': !isLiveStarted
						  }">
						<!-- 动画外框 -->
						<view class="animation-frame right-frame">
							<!-- #ifdef MP-WEIXIN -->
							<canvas
								type="2d"
								:id="'lottie-button-right'"
								:canvas-id="'lottie-button-right'"
								class="lottie-button-canvas"
								:style="{ width: '200rpx', height: '120rpx' }"
							></canvas>
							<!-- #endif -->
							<!-- #ifndef MP-WEIXIN -->
							<div 
								:id="'lottie-button-right'"
								class="lottie-button-wrapper" 
								:style="{ width: '200rpx', height: '120rpx' }">
							</div>
							<!-- #endif -->
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 底部导航栏 -->
		<view class="bottom-nav">
			<view class="nav-item" :class="{ 'active': currentTab === 'home' }" @click="switchTab('home')">
				<view class="nav-icon">
					<image v-if="currentTab === 'home'" src="/static/iconfont/dibu_zhuye_yixuanzhongzhuangtai.png" class="nav-icon-img" mode="aspectFit"></image>
					<image v-else src="/static/iconfont/dibu_zhuye_weixuanzhongzhuangtai.png" class="nav-icon-img" mode="aspectFit"></image>
				</view>
				<text class="nav-text">首页</text>
			</view>

			<view class="nav-item" :class="{ 'active': currentTab === 'profile' }" @click="switchTab('profile')">
				<view class="nav-icon">
					<image v-if="currentTab === 'profile'" src="/static/iconfont/wodexuanzhong.png" class="nav-icon-img" mode="aspectFit"></image>
					<image v-else src="/static/iconfont/wode.png" class="nav-icon-img" mode="aspectFit"></image>
				</view>
				<text class="nav-text">我的</text>
			</view>
		</view>
		
		<!-- 投票特效容器 -->
		<view class="vote-effects-container">
			<!-- Lottie 爱心动画特效 -->
			<view class="lottie-effect"
				  v-for="effect in voteEffects"
				  :key="effect.id"
				  :class="effect.class"
				  :style="effect.style">
				<!-- #ifdef MP-WEIXIN -->
				<canvas
					type="2d"
					:id="'lottie-heart-' + effect.id"
					:canvas-id="'lottie-heart-' + effect.id"
					class="lottie-heart-canvas"
					:style="{ width: '150rpx', height: '320rpx' }"
				></canvas>
				<!-- #endif -->
				<!-- #ifndef MP-WEIXIN -->
				<div 
					:id="'lottie-heart-' + effect.id"
					class="lottie-heart-wrapper" 
					:style="{ width: '150rpx', height: '320rpx' }">
					<!-- H5/浏览器环境下的 Lottie 容器 -->
				</div>
				<!-- #endif -->
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
						<view class="comment-item" v-for="(comment, index) in selectedMessage.comments" :key="comment.id || index">
							<view class="comment-header">
								<view class="user-info">
									<text class="user-avatar">{{ comment.avatar }}</text>
									<text class="user-name">{{ comment.user }}</text>
								</view>
								<view class="comment-header-right">
									<text class="comment-time">{{ comment.time }}</text>
									<view class="comment-delete-btn" v-if="comment.user === '我'" @click.stop="deleteComment(selectedMessage, index)">
										<text class="delete-icon">🗑️</text>
									</view>
								</view>
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
	import PopDecoration from '@/components/PopDecoration.vue'
	import apiService from '@/utils/api-service.js'
	import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
	// #ifdef MP-WEIXIN
	import lottie from 'lottie-miniprogram'
	import bgAnimationData from '@/static/animations/lcBg-01.json'
	import heartAnimationData from '@/static/animations/Hearts feedback.json'
	import circleMorphingData from '@/static/animations/Circle Shape Morphing animation.json'
	import buttonYesData from '@/static/animations/button YES.json'
	import fireAnimationData from '@/static/animations/fire.json'
	// #endif
	// #ifndef MP-WEIXIN
	import lottie from 'lottie-web'
	import heartAnimationData from '@/static/animations/Hearts feedback.json'
	import circleMorphingData from '@/static/animations/Circle Shape Morphing animation.json'
	import buttonYesData from '@/static/animations/button YES.json'
	import fireAnimationData from '@/static/animations/fire.json'
	// #endif
	
	// 导入直播配置
	import liveConfig from '@/config/live-config.js'
	import { API_BASE_URL } from '@/config/server-mode.js';

	export default {
		components: {
			PopDecoration,
			DotLottieVue
		},
		data() {
			return {
				statusBarHeight: 0,
				isLiveCollapsed: false,

				// 多直播支持 - 当前直播间ID
				streamId: null, // 当前直播间的ID，从URL参数获取
				
				// 直播流地址 - 需要配置真实的直播推流地址
				liveStreamUrl: '', // rtmp://xxx 或 https://xxx.m3u8
				isMuted: false, // 是否静音
				liveStatus: '', // 直播状态

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
				voteEffects: [], // 投票特效数组（现在存储 Lottie 动画实例）
				effectIdCounter: 0, // 特效ID计数器
				dividerHit: false, // 分割线被击中状态
				currentTab: 'home', // 当前选中的导航栏
				heartAnimationData: heartAnimationData, // 爱心动画数据
				circleMorphingData: circleMorphingData, // 圆形变形动画数据
				buttonYesData: buttonYesData, // YES按钮动画数据
				fireAnimationData: fireAnimationData, // 火焰动画数据
				lottieHeartInstances: {}, // 存储 Lottie 动画实例
				lottieButtonInstances: {}, // 存储按钮动画实例
				lottieFireInstance: null, // 存储火焰动画实例
				
				// 直播状态和预设观点相关
				isLiveStarted: false, // 直播是否已开始
				presetOpinion: 100, // 预设观点倾向 (0-100, 初始100表示100票全投正方)
				showPresetSlider: true, // 是否显示预设滑块
				showPresetPanel: true, // 是否显示预设观点面板（直播开始后可通过按钮控制）
				isValueChanging: false, // 数值变化动画状态
				initialLeftVotes: 0, // 初始正方票数
				initialRightVotes: 0, // 初始反方票数
				initialVotesSubmitted: false, // 是否已提交初始100票
				initialVotesTotal: 100, // 初始总票数（100票）
				presetSliderChanged: false, // 预设滑块是否有变化（直播开始后拖动时使用）
				votesChanged: false, // 票数是否有变化（无论是拖动进度条还是点击投票按钮）
				debateTitle: '', // 辩题标题--始终为空，后端动态取
				currentDebateTopic: '', // 当前辩题--始终为空，后端动态取
				debateDescription: '', // 描述

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
				liveStatusPollingTimer: null, // 直播状态轮询定时器
				
				// 服务器配置
				// API配置相关
				serverUrl: '', // 当前使用的服务器地址（由API服务层管理）
				apiServerInfo: null, // 当前API服务器信息
				availableServers: [], // 可用的服务器列表
				topBarUpdateTimer: null, // 顶部对抗条更新定时器
				
				// 性能优化相关
				isVoting: false, // 是否正在处理投票（防抖）
				voteQueue: [], // 投票队列
				lastVoteTime: 0, // 上次投票时间
				lastLeftVoteTime: 0, // 上次左侧投票时间
				lastRightVoteTime: 0, // 上次右侧投票时间
				isDividerHitInProgress: false, // 分割线特效是否在进行中
				isEffectCreating: false, // 特效是否在创建中
				isToastShowing: false, // Toast是否显示中
				updatePresetOpinionTimeout: null, // 预设观点更新定时器
				effectTimeouts: [], // 特效超时ID列表
				fetchVoteDataTimeout: null, // 获取票数数据的防抖定时器

				// 性能监控
				performanceStats: {
					voteCount: 0,
					avgResponseTime: 0,
					lastResponseTime: 0
				},
				
				// 特效性能优化
				maxConcurrentEffects: 30, // 最大同时特效数量
				effectCleanupInterval: null, // 特效清理定时器
				lastEffectCleanup: 0, // 上次清理时间
				
				// WebSocket 连接
				socketTask: null, // WebSocket连接实例
				wsReconnectTimer: null, // WebSocket重连定时器
				wsHeartbeatTimer: null, // WebSocket心跳定时器
				wsReconnectAttempts: 0, // WebSocket重连次数
				wsMaxReconnectAttempts: 5, // WebSocket最大重连次数
				
				// ==================== HLS 播放器配置 ====================
				hlsConfig: {
					// 缓冲区配置（单位：秒）
					minCache: 1,      // 最小缓冲区，减少延迟
					maxCache: 3,      // 最大缓冲区，保证流畅
					// 画面方向 (vertical: 竖屏, horizontal: 横屏)
					orientation: 'vertical',
					// 画中画模式 ([] 表示禁用)
					pipMode: [],
					// 声音输出方式 (speaker: 扬声器, ear: 听筒)
					soundMode: 'speaker'
				},
				
				// HLS 播放状态
				hlsStatus: {
					show: false,           // 是否显示状态提示
					message: '',           // 状态消息
					type: 'info',         // 状态类型: info / success / warning / error
					code: 0,              // 状态码
					connectTime: 0        // 连接时间
				},
				
				// HLS 网络质量监控
				hlsNetQuality: {
					videoBitrate: 0,      // 视频码率 (kbps)
					audioBitrate: 0,      // 音频码率 (kbps)
					videoFPS: 0,          // 视频帧率
					videoGOP: 0,          // 视频GOP
					netSpeed: 0,          // 网络速度 (kbps)
					netJitter: 0,         // 网络抖动 (ms)
					videoWidth: 0,        // 视频宽度
					videoHeight: 0        // 视频高度
				},
				
				// HLS 自动重连配置
				hlsReconnect: {
					enabled: true,        // 是否启用自动重连
					attempts: 0,          // 当前重连次数
					maxAttempts: 3,       // 最大重连次数
					delay: 3000,          // 重连延迟 (ms)
					timer: null,          // 重连定时器
					exponentialBackoff: true  // 是否使用指数退避
				},
				
				// HLS 质量统计
				hlsStats: {
					totalPlayTime: 0,     // 总播放时长 (秒)
					bufferingCount: 0,    // 卡顿次数
					bufferingTime: 0,     // 卡顿总时长 (秒)
					errorCount: 0,        // 错误次数
					lastErrorTime: 0,     // 最后错误时间
					startTime: 0          // 开始播放时间
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
		onLoad(options) {
			// 接收 streamId 参数（从直播选择页传递）
			if (options && options.streamId) {
				this.streamId = options.streamId;
				console.log('📺 当前直播间 ID:', this.streamId);
			} else {
				console.warn('⚠️ 未指定直播间 ID，将使用默认直播流');
			}
			
			// 初始化API服务
			this.initApiService();

			// 获取系统信息，适配安全区域
			this.getSystemInfo();
			// 初始化预设观点
			if (typeof this.updateInitialVotes === 'function') this.updateInitialVotes();
			// 初始化预设观点对抗条
			this.updatePresetBattleBar();
			// 启动特效性能优化
			this.startEffectCleanup();

			// 页面一进入就获取辩题（关键修正）
			this.fetchDebateTopic();

			// ================= 初始化直播流地址（从数据库获取） =================
			// 如果没有流地址，尝试从服务器获取直播流
			if (!this.liveStreamUrl) {
				// 异步获取，不阻塞页面加载
				setTimeout(async () => {
					try {
						const service = this.apiService || apiService;
						if (service) {
							// 如果指定了 streamId，获取该直播流的信息
							if (this.streamId) {
								console.log('🔍 获取指定直播流信息:', this.streamId);
								try {
									// 通过 streams 接口获取指定直播流
									const streams = await service.getStreamsList();
									const targetStream = streams.find(s => s.id === this.streamId);
									
								if (targetStream) {
									// ✅ 优先使用 playUrls.hls，如果没有则使用 url（向后兼容）
									const streamUrl = targetStream.playUrls?.hls || targetStream.url;
									// 使用智能转换方法设置HLS流地址
									await this.setLiveStreamUrlWithHls(streamUrl, targetStream.name);
									console.log('🎬 从streams接口初始化直播流地址:', this.liveStreamUrl);
									console.log('📺 直播间名称:', targetStream.name);
									if (targetStream.playUrls?.hls) {
										console.log('📺 使用 playUrls.hls 播放地址');
									} else {
										console.log('📺 使用 url 播放地址（兼容模式）');
									}
								} else {
									console.warn('⚠️ 未找到指定的直播流:', this.streamId);
								}
								} catch (error) {
									console.error('❌ 获取指定直播流失败:', error);
								}
							} else {
								// 未指定 streamId，使用默认逻辑
								// 优先使用 dashboard 接口
							try {
								const dashboardData = await service.getDashboard();
								if (dashboardData) {
									// 优先使用正在使用的流地址，否则使用启用的流地址
									const streamUrl = dashboardData.liveStreamUrl || dashboardData.activeStreamUrl;
									if (streamUrl) {
										// 使用智能转换方法设置HLS流地址
										await this.setLiveStreamUrlWithHls(streamUrl, dashboardData.activeStreamName);
										console.log('🎬 从dashboard初始化直播流地址:', this.liveStreamUrl);
										if (dashboardData.activeStreamName) {
											console.log('📺 流名称:', dashboardData.activeStreamName);
										}
									} else {
										console.warn('⚠️ dashboard接口返回数据中未找到直播流地址');
									}
								}
							} catch (dashboardError) {
								console.warn('⚠️ dashboard接口获取失败，尝试streams接口:', dashboardError.message);
								// 最后尝试通过 streams 接口获取
								try {
									const streamUrl = await this.fetchActiveStreamFromServerAlternative();
									if (streamUrl) {
										// 使用智能转换方法设置HLS流地址
										await this.setLiveStreamUrlWithHls(streamUrl);
										console.log('🎬 从streams接口初始化直播流地址:', this.liveStreamUrl);
									}
								} catch (streamsError) {
									console.warn('⚠️ 所有接口都获取失败，无法初始化直播流地址');
								}
							}
							}
						}
					} catch (error) {
						console.warn('⚠️ 获取数据库直播流失败:', error.message);
						// 不再使用配置文件默认值，完全依赖接口数据
					}
				}, 500); // 延迟500ms，确保API服务已初始化
			}

			// ================= 自助自动拉取直播状态 =================
			// 初始化时获取直播状态
			this.fetchLiveStatus();
			
			// 启动定时轮询（作为WebSocket的备用方案）
			this.startLiveStatusPolling();
			
			// 建立WebSocket连接（用于接收实时更新）
			this.connectWebSocket();
		},
		onShow() {
			// 页面显示时，确保导航栏选中状态正确
			this.currentTab = 'home';
			// 再次确保切回可见时也是最新辩题
			this.fetchDebateTopic();

			// ================= 自助自动拉取直播状态 =================
			// 页面显示时获取直播状态
			this.fetchLiveStatus();
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
				// 清理直播状态轮询定时器
				if (this.liveStatusPollingTimer) {
					clearInterval(this.liveStatusPollingTimer);
					this.liveStatusPollingTimer = null;
				}
				// 停止特效清理
				this.stopEffectCleanup();
				// 清理所有特效定时器
				if (this.effectTimeouts) {
					this.effectTimeouts.forEach(timeoutId => {
						clearTimeout(timeoutId);
					});
					this.effectTimeouts = [];
				}
				// 断开WebSocket连接
				this.disconnectWebSocket();
				// 清理防抖定时器
				if (this.fetchVoteDataTimeout) {
					clearTimeout(this.fetchVoteDataTimeout);
					this.fetchVoteDataTimeout = null;
				}
			},
		onReady() {
			// 页面渲染完成后设置安全区域
			this.setSafeArea();
			
			// 延迟初始化 Lottie 背景动画
			setTimeout(() => {
				this.initBackgroundLottie();
			}, 500);
			
			// 延迟初始化按钮动画
			setTimeout(() => {
				this.initButtonAnimations();
			}, 1000);
			
			// 延迟初始化火焰动画
			setTimeout(() => {
				this.initFireAnimation();
			}, 1500);
		},
		methods: {
			// ==================== 播放器配置方法 ====================

			/**
			 * 根据流格式获取播放器模式
			 * - RTMP 格式：使用 "live" 模式
			 * - FLV 格式：使用 "RTC" 模式（重要！）
			 * - HLS 格式：使用 "RTC" 模式
			 */
			getPlayerMode() {
				if (this.liveStreamUrl) {
					if (this.liveStreamUrl.includes('.flv')) {
						console.log('🎬 [播放器模式] FLV 格式，使用 RTC 模式');
						return 'RTC'; // FLV 需要使用 RTC 模式
					} else if (this.liveStreamUrl.includes('rtmp://')) {
						console.log('🎬 [播放器模式] RTMP 格式，使用 live 模式');
						return 'live'; // RTMP 使用 live 模式
					} else if (this.liveStreamUrl.includes('.m3u8')) {
						console.log('🎬 [播放器模式] HLS 格式，使用 RTC 模式');
						return 'RTC'; // HLS 使用 RTC 模式
					}
				}
				return 'RTC'; // 默认使用 RTC 模式（更兼容）
			},

			/**
			 * 根据流格式获取最小缓冲时间
			 * FLV 格式延迟较小（推荐1-2秒）
			 * HLS 格式延迟较大（推荐2-3秒）
			 */
			getPlayerMinCache() {
				if (this.liveStreamUrl && this.liveStreamUrl.includes('.flv')) {
					return 1; // FLV 最小缓冲1秒
				}
				return 2; // HLS/RTMP 最小缓冲2秒
			},

			/**
			 * 根据流格式获取最大缓冲时间
			 */
			getPlayerMaxCache() {
				if (this.liveStreamUrl && this.liveStreamUrl.includes('.flv')) {
					return 3; // FLV 最大缓冲3秒
				}
				return 5; // HLS/RTMP 最大缓冲5秒
			},

			// 初始化API服务
			async initApiService() {
				try {
					// 将导入的 apiService 赋值给 this.apiService，方便在方法中使用
					this.apiService = apiService;
					
					// 从配置文件获取当前服务器地址
					const configUrl = API_BASE_URL || 'http://192.168.31.249:8081';
					
					// 更新API服务配置为本地服务器
					apiService.updateConfig(configUrl);
					
					// 获取当前服务器信息
					this.apiServerInfo = apiService.getCurrentServerInfo();
					this.serverUrl = configUrl; // 使用配置的地址
					this.availableServers = this.apiServerInfo.available;
					
					// 确保 this.apiService 也使用正确的地址
					this.apiService = apiService;
					
					console.log('✅ API服务初始化完成');
					console.log('📡 当前服务器地址:', configUrl);
					console.log('📡 apiService.baseURL:', apiService.baseURL);
					
					// 测试API连接
					const isConnected = await apiService.testConnection();
					if (isConnected) {
						console.log('✅ API连接测试成功');
					} else {
						console.warn('⚠️ API连接测试失败，请检查服务器是否运行');
					}
				} catch (error) {
					console.error('❌ API服务初始化失败:', error);
				}
			},
			
			// ==================== HLS转换辅助方法 ====================
			
			/**
			 * 智能设置流地址（自动转换为HLS格式）
			 * @param {string} streamUrl - 原始流地址
			 * @param {string} streamName - 流名称（可选，用于提取房间名）
			 * @returns {Promise<boolean>} 是否成功设置流地址
			 */
			async setLiveStreamUrlWithHls(streamUrl, streamName = null) {
				if (!streamUrl) {
					console.warn('⚠️ 流地址为空，无法设置');
					return false;
				}
				
			try {
				const service = this.apiService || apiService;
				
				// 如果已经是HLS格式，直接使用（但需要修正 localhost 和房间名）
				if (streamUrl.includes('.m3u8')) {
					let hlsUrl = streamUrl;
					
					// 1. 修正 localhost 为真实服务器 IP
					if (hlsUrl.includes('localhost')) {
						// 从当前 API_BASE_URL 提取服务器 IP
						const apiBaseUrl = service.baseURL || API_BASE_URL;
						const serverIpMatch = apiBaseUrl.match(/https?:\/\/([^:\/]+)/);
						const serverIp = serverIpMatch ? serverIpMatch[1] : '192.168.31.189';
						
						// 替换 localhost 为真实 IP
						hlsUrl = hlsUrl.replace('localhost', serverIp);
						console.log('🔄 已修正 HLS 地址中的 localhost:', {
							原地址: streamUrl,
							新地址: hlsUrl
						});
					}
					
					// 2. 修正房间名（如果提供了 streamName 且与 URL 中的房间名不匹配）
					if (streamName && hlsUrl.includes('.m3u8')) {
						const urlParts = hlsUrl.split('/');
						const currentFileName = urlParts[urlParts.length - 1]; // 例如: test.m3u8
						const correctFileName = `${streamName}.m3u8`; // 例如: test2.m3u8
						
						// 如果文件名不一致，替换为正确的房间名
						if (currentFileName !== correctFileName) {
							const oldUrl = hlsUrl;
							hlsUrl = hlsUrl.replace(currentFileName, correctFileName);
							console.log('🔄 已修正 HLS 地址中的房间名:', {
								原地址: oldUrl,
								原文件名: currentFileName,
								新文件名: correctFileName,
								新地址: hlsUrl
							});
							
							uni.showToast({
								title: `已自动修正为 ${streamName} 流`,
								icon: 'success',
								duration: 2000
							});
						}
					}
					
					// 3. 使用中间层代理地址（开发环境）
					// 将 SRS 服务器地址改为通过中间层代理访问
					if (hlsUrl.includes('192.168.31.189:8086')) {
						const middlewareServerUrl = 'http://192.168.31.249:8081';
						const originalUrl = hlsUrl;
						hlsUrl = hlsUrl.replace('http://192.168.31.189:8086', middlewareServerUrl);
						console.log('🔄 已改为通过中间层代理:', {
							原地址: originalUrl,
							代理地址: hlsUrl
						});
					}
					
					this.liveStreamUrl = hlsUrl;
					console.log('✅ 流地址已设置为:', hlsUrl);
					return true;
				}
					
					// 如果是RTMP或FLV格式，需要转换为HLS
					if (streamUrl.startsWith('rtmp://') || streamUrl.includes('.flv')) {
						console.log('🔄 检测到非HLS格式流，正在转换为HLS...');
						console.log('📺 原始流地址:', streamUrl);
						
						try {
							// 使用API服务的智能转换方法
							const hlsUrl = await service.convertToHlsIfNeeded(streamUrl, streamName);
							
						if (hlsUrl) {
							this.liveStreamUrl = hlsUrl;
							console.log('✅ 成功转换为HLS格式:', hlsUrl);
							console.log('🎬 [播放器状态检查]', {
								isLiveStarted: this.isLiveStarted,
								liveStreamUrl: this.liveStreamUrl,
								播放器条件: this.isLiveStarted && this.liveStreamUrl ? '✅ 满足' : '❌ 不满足'
							});
							
							uni.showToast({
								title: '已自动转换为HLS格式',
								icon: 'success',
								duration: 2000
							});
							
							// 如果直播未开始，但已有流地址，尝试开始播放
							if (!this.isLiveStarted && this.liveStreamUrl) {
								console.log('💡 流地址已设置，但直播未开始，尝试开始播放...');
								// 这里不自动开始，等待服务器通知或用户操作
							}
							
							return true;
							} else {
								console.error('❌ HLS转换失败，使用原始地址');
								this.liveStreamUrl = streamUrl;
								return false;
							}
						} catch (conversionError) {
							console.error('❌ HLS转换出错:', conversionError);
							
							uni.showToast({
								title: 'HLS转换失败: ' + (conversionError.message || '未知错误'),
								icon: 'none',
								duration: 3000
							});
							
							// 转换失败，仍然使用原始地址（虽然可能无法播放）
							this.liveStreamUrl = streamUrl;
							return false;
						}
					}
					
					// 其他格式，直接使用
					this.liveStreamUrl = streamUrl;
					console.log('📺 使用流地址:', streamUrl);
					return true;
					
				} catch (error) {
					console.error('❌ 设置流地址失败:', error);
					return false;
				}
			},
			
			// 获取直播状态（通过 dashboard 接口）
			async fetchLiveStatus() {
				try {
					const service = this.apiService || apiService;
					if (!service) {
						console.warn('⚠️ API服务未初始化，无法获取直播状态');
						return;
					}
					
					console.log('📡 正在获取直播状态（dashboard接口）...');
					const dashboardData = await service.getDashboard();
					
					if (dashboardData) {
						console.log('📊 Dashboard数据:', dashboardData);
						
					// 更新直播状态
					if (dashboardData.isLive !== undefined) {
						const wasLive = this.isLiveStarted;
						const nowLive = dashboardData.isLive;
						
					// 更新流地址（优先使用当前使用的流地址，否则使用启用的流地址）
					const streamUrl = dashboardData.liveStreamUrl || dashboardData.activeStreamUrl;
					if (streamUrl) {
						// 使用智能转换方法设置HLS流地址
						await this.setLiveStreamUrlWithHls(streamUrl, dashboardData.activeStreamName);
						console.log('📺 更新直播流地址（从dashboard）:', this.liveStreamUrl);
					}
						
						// ⚠️ 重要：如果服务器显示直播已开始，但客户端状态未同步，强制同步
						if (nowLive && !wasLive) {
							// 直播从停止变为开始
							console.log('✅ Dashboard显示直播已开始，更新UI');
							
							// 确保流地址存在
							if (!this.liveStreamUrl && dashboardData.liveStreamUrl) {
								this.liveStreamUrl = dashboardData.liveStreamUrl;
							}
							
							// 如果还是没有流地址，尝试从数据库获取
							if (!this.liveStreamUrl) {
								await this.fetchActiveStreamFromServer();
							}
							
							// 更新播放状态（即使流地址是 RTMP，也先更新状态）
							this.$nextTick(async () => {
								// ⚠️ 检查流地址格式：小程序 live-player 只支持 HLS，不支持 RTMP
								if (this.liveStreamUrl && this.liveStreamUrl.startsWith('rtmp://')) {
									console.warn('⚠️ 检测到 RTMP 流地址，小程序 live-player 不支持 RTMP，需要转换为 HLS 格式');
									console.warn('⚠️ 当前流地址:', this.liveStreamUrl);
									// 尝试查找对应的 HLS 流（如果数据库中有）
									// 或者提示用户需要配置 HLS 流
									uni.showToast({
										title: 'RTMP流需要转换为HLS格式',
										icon: 'none',
										duration: 3000
									});
									// 即使不支持，也更新状态，让用户知道直播已开始
									this.isLiveStarted = true;
								} else if (this.liveStreamUrl) {
									// HLS 或其他支持的格式
									this.isLiveStarted = true;
									console.log('✅ 直播状态已更新为"直播已开始"');
									console.log('📺 使用的流地址:', this.liveStreamUrl);
									console.log('🎬 isLiveStarted:', this.isLiveStarted);
									console.log('🎬 liveStreamUrl:', this.liveStreamUrl);
									
									uni.showToast({
										title: '直播已开始',
										icon: 'success',
										duration: 2000
									});
									
									// 直播开始后，自动启动AI内容获取
									setTimeout(() => {
										this.startAIContentAfterLiveStart();
									}, 1000);
								} else {
									console.warn('⚠️ Dashboard显示直播已开始，但缺少流地址');
									// 即使没有流地址，如果服务器明确说直播已开始，也更新状态
									this.isLiveStarted = true;
								}
							});
						} else if (nowLive && wasLive) {
						// 直播已经在进行中，确保状态同步
						console.log('🔄 直播进行中，确保状态同步');
						if (!this.isLiveStarted) {
							this.isLiveStarted = true;
							console.log('✅ 同步直播状态为"已开始"');
						}
						// 确保流地址存在
						if (!this.liveStreamUrl && streamUrl) {
							await this.setLiveStreamUrlWithHls(streamUrl, dashboardData.activeStreamName);
							console.log('📺 更新直播流地址:', this.liveStreamUrl);
						}
						} else if (!nowLive && wasLive) {
								// 直播从开始变为停止
								console.log('🛑 Dashboard显示直播已停止，更新UI');
								this.isLiveStarted = false;
								
								uni.showToast({
									title: '直播已结束',
									icon: 'none',
									duration: 2000
								});
							} else {
								// 状态没有变化，但确保状态同步
								if (nowLive !== wasLive) {
									this.isLiveStarted = nowLive;
									console.log(`🔄 同步直播状态: ${nowLive ? '已开始' : '未开始'}`);
									
									// 如果直播已开始，但还未启动AI内容获取，则启动
									if (nowLive && typeof this.startAIContentAfterLiveStart === 'function') {
										setTimeout(() => {
											this.startAIContentAfterLiveStart();
										}, 1000);
									}
								}
								
								// 如果当前直播已开始，确保有流地址并启动AI内容获取
								if (nowLive && this.isLiveStarted && this.liveStreamUrl) {
									console.log('✅ 直播进行中，检查AI内容获取状态');
									console.log('🎬 isLiveStarted:', this.isLiveStarted);
									console.log('🎬 liveStreamUrl:', this.liveStreamUrl);
									console.log('🤖 recognitionTimer:', this.recognitionTimer ? '已启动' : '未启动');
									
									if (!this.recognitionTimer && typeof this.startAIContentRealTimeUpdate === 'function') {
										setTimeout(() => {
											this.startAIContentAfterLiveStart();
										}, 1000);
									}
								}
							}
						}
					}
				} catch (error) {
					console.warn('⚠️ 获取直播状态失败:', error.message);
					// 不抛出错误，避免影响页面加载
				}
			},
			
			// 启动直播状态轮询（作为WebSocket的备用方案）
			startLiveStatusPolling() {
				// 清除已有的定时器
				if (this.liveStatusPollingTimer) {
					clearInterval(this.liveStatusPollingTimer);
				}
				
				// 每5秒轮询一次直播状态
				this.liveStatusPollingTimer = setInterval(() => {
					this.fetchLiveStatus();
				}, 5000);
				
				console.log('🔄 已启动直播状态轮询（每5秒）');
			},
			
			// 停止直播状态轮询
			stopLiveStatusPolling() {
				if (this.liveStatusPollingTimer) {
					clearInterval(this.liveStatusPollingTimer);
					this.liveStatusPollingTimer = null;
					console.log('⏹️ 已停止直播状态轮询');
				}
			},

			// 从服务器获取启用的直播流地址（优先使用 dashboard 接口）
			async fetchActiveStreamFromServer() {
				try {
					const service = this.apiService || apiService;
					if (!service) {
						console.warn('⚠️ API服务未初始化，无法获取数据库直播流');
						return null;
					}
					
					// 优先使用 dashboard 接口（已包含 activeStreamUrl）
					try {
						const dashboardData = await service.getDashboard();
						if (dashboardData) {
							// 优先使用正在使用的流地址，否则使用启用的流地址
							const streamUrl = dashboardData.liveStreamUrl || dashboardData.activeStreamUrl;
							if (streamUrl) {
								// 使用智能转换方法设置HLS流地址
								await this.setLiveStreamUrlWithHls(streamUrl, dashboardData.activeStreamName);
								console.log('🎬 从dashboard获取到直播流:', this.liveStreamUrl);
								if (dashboardData.activeStreamName) {
									console.log('📺 流名称:', dashboardData.activeStreamName);
								}
								return this.liveStreamUrl;
							}
						}
					} catch (dashboardError) {
						console.warn('⚠️ dashboard接口获取失败，尝试status接口:', dashboardError.message);
						// 如果 dashboard 接口失败，尝试使用 status 接口（兼容旧版本）
						const statusResponse = await service.getLiveStatus();
						if (statusResponse) {
							const streamUrl = statusResponse.streamUrl || statusResponse.activeStreamUrl;
							if (streamUrl) {
								// 使用智能转换方法设置HLS流地址
								await this.setLiveStreamUrlWithHls(streamUrl, statusResponse.activeStreamName);
								console.log('🎬 从status接口获取到启用直播流:', this.liveStreamUrl);
								if (statusResponse.activeStreamName) {
									console.log('📺 流名称:', statusResponse.activeStreamName);
								}
								return this.liveStreamUrl;
							}
						}
					}
				} catch (error) {
					console.warn('⚠️ 获取数据库直播流失败:', error.message);
					// 如果接口不存在，尝试备用方案
					if (error.message && error.message.includes('404')) {
						return await this.fetchActiveStreamFromServerAlternative();
					}
				}
				return null;
			},
			
			// 备用方案：通过直播流列表接口获取启用直播流（如果 /api/admin/live/status 不存在）
			async fetchActiveStreamFromServerAlternative() {
				try {
					const service = this.apiService || apiService;
					if (!service) {
						return null;
					}
					
					// 尝试通过直播流列表接口获取启用的流
					console.log('💡 尝试通过直播流列表接口获取启用直播流...');
					
					const streamsResponse = await service.request({ 
						url: '/api/admin/streams', 
						method: 'GET' 
					});
					
					// 处理返回数据：可能是数组，也可能是包装格式 {success: true, data: {streams: [...]}}
					let streams = [];
					if (streamsResponse && streamsResponse.success && streamsResponse.data) {
						if (Array.isArray(streamsResponse.data.streams)) {
							streams = streamsResponse.data.streams;
						} else if (Array.isArray(streamsResponse.data)) {
							streams = streamsResponse.data;
						}
					} else if (Array.isArray(streamsResponse)) {
						streams = streamsResponse;
					} else {
						console.warn('⚠️ 直播流列表接口返回格式不正确:', streamsResponse);
						return null;
					}
					
				// 查找启用的直播流
				const activeStream = streams.find(s => s.enabled === true);
				if (activeStream) {
					// ✅ 优先使用 playUrls.hls，如果没有则使用 url（向后兼容）
					const streamUrl = activeStream.playUrls?.hls || activeStream.url;
					if (streamUrl) {
						// 使用智能转换方法设置HLS流地址
						await this.setLiveStreamUrlWithHls(streamUrl, activeStream.name);
						console.log('✅ 通过备用接口获取到启用直播流:', this.liveStreamUrl);
						if (activeStream.playUrls?.hls) {
							console.log('📺 使用 playUrls.hls 播放地址');
						} else {
							console.log('📺 使用 url 播放地址（兼容模式）');
						}
						console.log('📺 流名称:', activeStream.name || '未知');
						return this.liveStreamUrl;
					}
				} else {
					console.warn('⚠️ 没有找到启用的直播流');
				}
					
					return null;
				} catch (error) {
					console.warn('⚠️ 备用方案也失败:', error.message);
					return null;
				}
			},
			
			// 切换API服务器
			async switchApiServer(serverType) {
				try {
					const newUrl = apiService.switchApiServer(serverType);
					if (newUrl) {
						this.serverUrl = newUrl;
						apiService.updateConfig(newUrl);
						
						// 重新获取服务器信息
						this.apiServerInfo = apiService.getCurrentServerInfo();
						
						console.log(`API服务器已切换到: ${serverType} (${newUrl})`);
						
						// 测试新服务器连接
						const isConnected = await apiService.testConnection();
						if (isConnected) {
							uni.showToast({
								title: `已切换到${serverType}服务器`,
								icon: 'success'
							});
						} else {
							uni.showToast({
								title: '服务器连接失败',
								icon: 'error'
							});
						}
					}
				} catch (error) {
					console.error('切换API服务器失败:', error);
					uni.showToast({
						title: '切换服务器失败',
						icon: 'error'
					});
				}
			},

		// 获取服务器 URL（兼容旧代码）
		getServerUrl() {
			return this.serverUrl || API_BASE_URL;
		},

		// ==================== HLS 播放器事件处理（优化版） ====================
		
		// 处理直播状态变化
		handleLiveStateChange(e) {
			const code = e.detail.code;
			const message = e.detail.message || '';
			
			console.log(`📺 [HLS状态] Code: ${code}, Message: ${message}`);
			console.log(`📺 [播放器状态] 当前流地址: ${this.liveStreamUrl}, 播放状态: ${this.isLiveStarted}`);
			
			// 微信小程序 live-player 状态码说明：
			// 连接阶段
			// 2001: 已经连接服务器
			// 2002: 已经连接服务器,开始拉流
			// 2003: 网络接收到首个视频数据包(IDR)
			// 2004: 视频播放开始
			// 2005: 视频播放进度
			// 2006: 视频播放结束
			// 2007: 视频播放Loading
			// 2008: 解码器启动
			// 2009: 视频编码器启动
			
			// 错误码
			// -2301: 网络断连,且经多次重连抢救无效
			// -2302: 获取加速拉流地址失败
			// -2303: 播放地址无效
			// -2304: 播放格式不支持
			// -2305: 播放器内部错误
			// -2306: 播放解码失败
			
			// 清除之前的重连定时器
			if (this.hlsReconnect.timer) {
				clearTimeout(this.hlsReconnect.timer);
				this.hlsReconnect.timer = null;
			}
			
			switch (code) {
				case 2001:
					this.liveStatus = 'connecting';
					this.showHlsStatus('正在连接直播服务器...', 'info');
					break;
					
				case 2002:
					this.liveStatus = 'pulling';
					this.showHlsStatus('开始拉取直播流...', 'info');
					break;
					
				case 2003:
					this.liveStatus = 'buffering';
					this.showHlsStatus('接收视频数据中...', 'info');
					this.hlsStats.startTime = Date.now();
					break;
					
				case 2004:
					this.liveStatus = 'playing';
					this.showHlsStatus('直播连接成功 ✓', 'success', 2000);
					// 重置重连计数
					this.hlsReconnect.attempts = 0;
					// 记录连接时间
					const connectTime = Date.now() - (this.hlsStats.startTime || Date.now());
					this.hlsStatus.connectTime = connectTime;
					console.log(`✅ [HLS] 直播连接成功，耗时: ${connectTime}ms`);
					break;
					
				case 2007:
					this.liveStatus = 'loading';
					this.showHlsStatus('视频加载中...', 'warning');
					this.hlsStats.bufferingCount++;
					break;
					
				case 2008:
					this.liveStatus = 'decoding';
					console.log('🎬 [HLS] 解码器已启动');
					break;
					
				case -2301:
					// 网络断连
					this.liveStatus = 'disconnected';
					this.hlsStats.errorCount++;
					console.error('❌ [HLS] 网络断连');
					this.showHlsStatus('网络连接已断开', 'error', 3000);
					this.tryHlsReconnect();
					break;
					
				case -2302:
					// 获取拉流地址失败
					this.liveStatus = 'error';
					this.hlsStats.errorCount++;
					console.error('❌ [HLS] 获取拉流地址失败');
					this.showHlsStatus('无法获取直播地址', 'error', 3000);
					this.tryHlsReconnect();
					break;
					
				case -2303:
					// 播放地址无效
					this.liveStatus = 'error';
					this.hlsStats.errorCount++;
					console.error('❌ [HLS] 播放地址无效:', this.liveStreamUrl);
					this.showHlsStatus('直播地址无效，请检查配置', 'error', 5000);
					break;
					
				case -2304:
					// 播放格式不支持
					this.liveStatus = 'error';
					this.hlsStats.errorCount++;
					console.error('❌ [HLS] 播放格式不支持');
					this.showHlsStatus('不支持此直播格式', 'error', 5000);
					break;
					
				case -2305:
					// 播放器内部错误
					this.liveStatus = 'error';
					this.hlsStats.errorCount++;
					console.error('❌ [HLS] 播放器内部错误');
					this.showHlsStatus('播放器出错', 'error', 3000);
					this.tryHlsReconnect();
					break;
					
				case -2306:
					// 解码失败
					this.liveStatus = 'error';
					this.hlsStats.errorCount++;
					console.error('❌ [HLS] 视频解码失败');
					this.showHlsStatus('视频解码失败', 'error', 3000);
					this.tryHlsReconnect();
					break;
					
				default:
					console.log(`📺 [HLS] 未处理的状态码: ${code}`);
					this.hlsStatus.code = code;
			}
		},

		// 处理直播错误
		handleLiveError(e) {
			const errCode = e.detail.errCode;
			const errMsg = e.detail.errMsg || '';
			
			console.error(`❌ [HLS错误] Code: ${errCode}, Message: ${errMsg}`);
			
			this.liveStatus = 'error';
			this.hlsStats.errorCount++;
			this.hlsStats.lastErrorTime = Date.now();
			
			// 检查是否是权限错误
			if (errMsg && errMsg.includes('jsapi has no permission')) {
				// 检测是否在真机上运行
				// #ifdef MP-WEIXIN
				try {
					const systemInfo = uni.getSystemInfoSync();
					// 如果在真机上（非开发者工具），说明是真正的权限问题
					const isRealDevice = systemInfo.platform !== 'devtools';
					
					if (isRealDevice) {
						// 真机上的权限错误：需要配置微信公众平台
						console.error('❌ [权限错误] live-player 组件在真机上仍然无法使用');
						console.error('❌ 这是微信公众平台的权限配置问题！');
						console.error('✅ 解决方法（配置微信公众平台）：');
						console.error('   1. 登录微信公众平台 (https://mp.weixin.qq.com)');
						console.error('   2. 进入"开发" -> "开发管理" -> "开发设置"');
						console.error('   3. 在"服务器域名"中添加直播流域名：');
						console.error('      - request合法域名: http://192.168.31.249:8081');
						console.error('      - downloadFile合法域名: http://192.168.31.249:8081');
						console.error('   4. 检查"服务类目"是否包含"视频"或"直播"类目');
						console.error('   5. 确保小程序主体类型支持直播功能');
						
						uni.showModal({
							title: '⚠️ 权限配置问题',
							content: 'live-player 组件需要配置微信公众平台权限。\n\n✅ 请登录微信公众平台：\n1. 开发 -> 开发管理 -> 开发设置\n2. 添加服务器域名：http://192.168.31.249:8081\n3. 检查服务类目是否包含"视频"或"直播"\n\n如果仍然无法使用，可能需要升级小程序主体类型（个人 -> 企业）。',
							showCancel: false,
							confirmText: '我知道了'
						});
					} else {
						// 开发者工具中的权限错误：这是已知限制
						console.error('❌ [权限错误] live-player 组件在开发者工具中无法正常工作');
						console.error('❌ 这是微信开发者工具的已知限制，不是代码问题！');
						console.error('✅ 解决方法（必须使用真机）：');
						console.error('   1. 点击微信开发者工具的"预览"按钮');
						console.error('   2. 用微信扫码在真机上测试');
						console.error('   3. 真机上的 live-player 组件可以正常工作');
						console.error('   注意：开发者工具中的 live-player 组件经常无法正常工作，这是正常现象');
						
						uni.showModal({
							title: '⚠️ 开发者工具限制',
							content: 'live-player 组件在开发者工具中无法正常工作，这是微信的已知限制。\n\n✅ 请使用"预览"功能，用微信扫码在真机上测试，真机上的播放器可以正常工作。',
							showCancel: false,
							confirmText: '我知道了'
						});
					}
				} catch (error) {
					// 如果无法获取系统信息，默认认为是开发者工具
					console.error('❌ [权限错误] live-player 组件权限问题');
					console.error('❌ 无法确定运行环境，建议使用真机测试');
					
					uni.showModal({
						title: '⚠️ 权限问题',
						content: 'live-player 组件出现权限错误。\n\n✅ 请使用"预览"功能在真机上测试，并确保在微信公众平台配置了正确的服务器域名和服务类目。',
						showCancel: false,
						confirmText: '我知道了'
					});
				}
				// #endif
				
				// #ifndef MP-WEIXIN
				// 非微信小程序环境
				console.error('❌ [权限错误] live-player 组件权限问题');
				uni.showModal({
					title: '⚠️ 权限问题',
					content: 'live-player 组件出现权限错误，请检查配置。',
					showCancel: false,
					confirmText: '我知道了'
				});
				// #endif
				
				// 权限错误不进行重连
				return;
			}
			
			// 显示错误提示
			let errorMessage = '直播播放出错';
			if (errMsg) {
				errorMessage = errMsg;
			}
			
			this.showHlsStatus(errorMessage, 'error', 3000);
			
			// 尝试自动重连（权限错误除外）
			if (this.hlsReconnect.enabled && !errMsg.includes('jsapi has no permission')) {
				this.tryHlsReconnect();
			}
		},

		// 处理网络状态（HLS 质量监控）
		handleNetStatus(e) {
			if (!e.detail || !e.detail.info) {
				return;
			}
			
			const info = e.detail.info;
			
			// 更新网络质量数据
			this.hlsNetQuality = {
				videoBitrate: info.videoBitrate || 0,      // 视频码率 (kbps)
				audioBitrate: info.audioBitrate || 0,      // 音频码率 (kbps)
				videoFPS: info.videoFPS || 0,              // 视频帧率
				videoGOP: info.videoGOP || 0,              // 视频GOP
				netSpeed: info.netSpeed || 0,              // 网络速度 (kbps)
				netJitter: info.netJitter || 0,            // 网络抖动 (ms)
				videoWidth: info.videoWidth || 0,          // 视频宽度
				videoHeight: info.videoHeight || 0         // 视频高度
			};
			
			// 更新播放时长
			if (this.hlsStats.startTime > 0) {
				this.hlsStats.totalPlayTime = Math.floor((Date.now() - this.hlsStats.startTime) / 1000);
			}
			
			// 检测网络质量问题
			this.checkNetworkQuality();
			
			// 每10秒打印一次质量日志（降低日志频率）
			if (Date.now() % 10000 < 1000) {
				console.log('📊 [HLS质量]', {
					'视频码率': `${info.videoBitrate || 0} kbps`,
					'音频码率': `${info.audioBitrate || 0} kbps`,
					'帧率': `${info.videoFPS || 0} fps`,
					'分辨率': `${info.videoWidth || 0}x${info.videoHeight || 0}`,
					'网络速度': `${info.netSpeed || 0} kbps`
				});
			}
		},
		
		// 处理全屏变化
		handleFullScreenChange(e) {
			const fullScreen = e.detail.fullScreen;
			console.log(`📺 [HLS] 全屏状态: ${fullScreen ? '全屏' : '退出全屏'}`);
		},
		
		// 处理音量通知
		handleAudioVolumeNotify(e) {
			// 音频音量通知（WebRTC 模式下有效）
			console.log('🔊 [HLS] 音量:', e.detail);
		},
		
		// ==================== HLS 辅助方法 ====================
		
		// 显示 HLS 状态提示
		showHlsStatus(message, type = 'info', duration = 0) {
			this.hlsStatus = {
				show: true,
				message: message,
				type: type,
				code: this.hlsStatus.code
			};
			
			// 如果设置了duration，自动隐藏
			if (duration > 0) {
				setTimeout(() => {
					this.hlsStatus.show = false;
				}, duration);
			}
		},
		
		// 隐藏 HLS 状态提示
		hideHlsStatus() {
			this.hlsStatus.show = false;
		},
		
		// HLS 自动重连
		tryHlsReconnect() {
			if (!this.hlsReconnect.enabled) {
				console.log('⚠️ [HLS] 自动重连已禁用');
				return;
			}
			
			if (this.hlsReconnect.attempts >= this.hlsReconnect.maxAttempts) {
				console.error('❌ [HLS] 重连次数已达上限，停止重连');
				this.showHlsStatus(`重连失败，已尝试${this.hlsReconnect.maxAttempts}次`, 'error', 5000);
				return;
			}
			
			// 清除之前的重连定时器
			if (this.hlsReconnect.timer) {
				clearTimeout(this.hlsReconnect.timer);
			}
			
			// 计算重连延迟（指数退避）
			let delay = this.hlsReconnect.delay;
			if (this.hlsReconnect.exponentialBackoff) {
				delay = this.hlsReconnect.delay * Math.pow(2, this.hlsReconnect.attempts);
			}
			
			this.hlsReconnect.attempts++;
			
			console.log(`🔄 [HLS] 准备重连... (第${this.hlsReconnect.attempts}次，延迟${delay}ms)`);
			this.showHlsStatus(`正在重连... (${this.hlsReconnect.attempts}/${this.hlsReconnect.maxAttempts})`, 'warning');
			
			// 延迟后重连
			this.hlsReconnect.timer = setTimeout(() => {
				console.log(`🔄 [HLS] 开始重连 (第${this.hlsReconnect.attempts}次)`);
				
				// 重新加载直播流（通过切换 isLiveStarted 触发重载）
				this.isLiveStarted = false;
				this.$nextTick(() => {
					this.isLiveStarted = true;
					this.showHlsStatus('重新连接中...', 'info');
				});
			}, delay);
		},
		
		// 检测网络质量
		checkNetworkQuality() {
			const quality = this.hlsNetQuality;
			
			// 检测码率异常（太低）
			if (quality.videoBitrate > 0 && quality.videoBitrate < 100) {
				console.warn('⚠️ [HLS] 视频码率过低:', quality.videoBitrate, 'kbps');
			}
			
			// 检测帧率异常（太低）
			if (quality.videoFPS > 0 && quality.videoFPS < 15) {
				console.warn('⚠️ [HLS] 视频帧率过低:', quality.videoFPS, 'fps');
			}
			
			// 检测网络抖动
			if (quality.netJitter > 200) {
				console.warn('⚠️ [HLS] 网络抖动较大:', quality.netJitter, 'ms');
			}
		},
		
		// 重置 HLS 统计数据
		resetHlsStats() {
			this.hlsStats = {
				totalPlayTime: 0,
				bufferingCount: 0,
				bufferingTime: 0,
				errorCount: 0,
				lastErrorTime: 0,
				startTime: 0
			};
			this.hlsReconnect.attempts = 0;
			console.log('🔄 [HLS] 统计数据已重置');
		},
		
		// 获取 HLS 播放质量报告
		getHlsQualityReport() {
			return {
				status: this.liveStatus,
				playTime: this.hlsStats.totalPlayTime,
				bufferingCount: this.hlsStats.bufferingCount,
				errorCount: this.hlsStats.errorCount,
				reconnectAttempts: this.hlsReconnect.attempts,
			currentQuality: {
				videoBitrate: this.hlsNetQuality.videoBitrate,
				audioBitrate: this.hlsNetQuality.audioBitrate,
				videoFPS: this.hlsNetQuality.videoFPS,
				resolution: `${this.hlsNetQuality.videoWidth}x${this.hlsNetQuality.videoHeight}`
			},
				connectTime: this.hlsStatus.connectTime
			};
		},

			// API调用方法
			async fetchDebateTopic() {
				try {
					// 传递 streamId 参数（如果存在）
					const response = await apiService.getDebateTopic(this.streamId);
					if (response.success) {
						const data = response.data;
						this.debateTitle = data.title;
						this.debateDescription = data.description;
						this.currentDebateTopic = data.title;
					}
				} catch (error) {
					uni.showToast({
						title: '获取辩题失败',
						icon: 'error'
					});
				}
			},

			async fetchTopBarVotes() {
				try {
					// 确保使用正确的 apiService（优先使用 this.apiService，如果没有则使用导入的）
					const service = this.apiService || apiService;
					
					// 调试日志：检查当前使用的服务器地址
					console.log('📊 获取票数 - 使用服务器:', service.baseURL || service.getCurrentConfig?.()?.baseURL || '未设置');
					
					// 传递 streamId 参数（如果存在）
					const response = await service.getVotes(this.streamId);
					if (response.success) {
						const data = response.data;
						this.topLeftVotes = data.leftVotes;
						this.topRightVotes = data.rightVotes;
						console.log('✅ 票数更新成功:', data);
					} else {
						console.warn('⚠️ 获取票数失败:', response);
					}
				} catch (error) {
					console.error('❌ 获取票数失败:', error);
					uni.showToast({
						title: '获取票数失败: ' + (error.message || '网络错误'),
						icon: 'error',
						duration: 3000
					});
				}
			},

			async fetchAIContent(isInitialLoad = false) {
				try {
					// 确保使用正确的 apiService（优先使用 this.apiService，如果没有则使用导入的）
					const service = this.apiService || apiService;
					
					if (!service) {
						console.warn('⚠️ API服务未初始化，无法获取AI内容');
						return;
					}
					
					// 调试日志：检查当前使用的服务器地址
					console.log('🤖 获取AI内容 - 使用服务器:', service.baseURL || service.getCurrentConfig?.()?.baseURL || '未设置');
					
					// 传递 streamId 参数（如果存在）
					const response = await service.getAiContent(this.streamId);
					
					console.log('🤖 AI内容接口响应:', response);
					
					if (response && response.success) {
						// 如果是初始加载，清空原有数据
						if (isInitialLoad) {
							this.aiMessages = [];
							this.messageIdCounter = 0;
							console.log('🤖 清空AI消息列表，准备加载新数据');
						}
						
						// 检查是否有新内容
						const serverMessages = response.data || [];
						
						console.log('🤖 服务器返回AI内容数量:', serverMessages.length);

						// 添加新的服务器数据
						let addedCount = 0;
						serverMessages.forEach((content) => {
							// 检查是否已存在（通过服务器ID或内容匹配）
							const exists = this.aiMessages.some(msg =>
								msg.serverId === content.id ||
								(msg.text === content.text && msg.side === content.side)
							);

							if (!exists) {
								this.addAIMessage(content);
								addedCount++;
							}
						});
						
						if (addedCount > 0) {
							console.log(`✅ 新增 ${addedCount} 条AI内容`);
						} else {
							console.log('💡 没有新的AI内容');
						}
					} else {
						console.warn('⚠️ AI内容接口返回失败:', response);
					}
				} catch (error) {
					console.error('❌ 获取AI内容失败:', error.message);
					console.error('❌ 错误详情:', error);
				}
			},
			
			async sendUserVote(side, votes = 10) {
				const startTime = Date.now();
				
				try {
					console.log('📤 发送投票请求:', { side, votes, streamId: this.streamId });
					console.log('📡 API服务器地址:', this.apiService?.baseURL || '未设置');
					
					// 传递 streamId 参数（如果存在）
					const response = await apiService.userVote(side, votes, this.streamId);
					
					// 详细记录响应信息
					console.log('📥 投票接口响应:', {
						response: response,
						responseType: typeof response,
						hasSuccess: 'success' in (response || {}),
						successValue: response?.success,
						responseString: JSON.stringify(response, null, 2)
					});
					
					const responseTime = Date.now() - startTime;
					
					// 更新性能统计
					this.updatePerformanceStats(responseTime);
					
					// 判断请求是否成功：
					// 1. 如果响应有 success 字段，检查其值
					// 2. 如果没有 success 字段，但也没有抛出异常，说明接口调用成功（HTTP 200）
					// 3. 接口返回成功（没有抛出异常），就认为投票成功
					const isSuccess = response?.success === true || 
					                 (response?.success === undefined && response !== undefined);
					
					if (isSuccess) {
						console.log('✅ 投票成功:', response?.data || response);
						// 延迟1秒后获取最新的票数统计（防抖处理）
						this.debouncedFetchVoteData();
						return { success: true, data: response?.data || response };
					} else {
						// 如果响应明确表示失败，抛出错误
						console.warn('⚠️ 投票响应表示失败:', response);
						const error = new Error(response?.message || '投票失败');
						error.response = response;
						throw error;
					}
				} catch (error) {
					console.error('❌ 投票失败:', error);
					console.error('❌ 错误详情:', {
						statusCode: error.statusCode,
						message: error.message,
						url: error.url,
						response: error.response
					});
					
					// 根据错误类型显示不同的提示
					let errorMessage = '投票失败';
					if (error.statusCode === 400) {
						// 400 错误可能是参数验证失败
						const serverMessage = error.response?.message || error.message || '参数错误';
						errorMessage = `请求参数错误：${serverMessage}`;
						console.error('📋 服务器返回的详细错误信息:', error.response);
					} else if (error.statusCode === 403) {
						errorMessage = '服务器拒绝请求（403），请检查服务器CORS配置';
					} else if (error.statusCode === 401) {
						errorMessage = '未授权（401），请先登录';
					} else if (error.statusCode === 404) {
						errorMessage = '接口不存在（404）';
					} else if (error.statusCode === 500) {
						errorMessage = '服务器内部错误（500）';
					} else if (error.message) {
						errorMessage = apiService.handleError(error);
					}
					
					uni.showToast({
						title: errorMessage,
						icon: 'error',
						duration: 3000
					});
				}
			},
			
			// 防抖获取票数数据 - 延迟1秒后获取最新票数统计
			debouncedFetchVoteData() {
				// 清除之前的定时器
				if (this.fetchVoteDataTimeout) {
					clearTimeout(this.fetchVoteDataTimeout);
				}
				
				// 设置新的定时器，1秒后获取数据
				this.fetchVoteDataTimeout = setTimeout(() => {
					this.fetchTopBarVotes();
					this.fetchVoteDataTimeout = null;
				}, 1000);
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
					// 投票性能统计
				}
			},
			
			// 异步投票方法，不阻塞UI
			async sendUserVoteAsync(side, votes = 10) {
				// 添加到投票队列（防抖已在checkVoteRateLimit中处理）
				const now = Date.now();
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
					// 处理投票队列失败
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
			
			async addCommentToServer(contentId, text, user = '匿名用户', avatar = '👤') {
				try {
					console.log('📤 调用 addComment API:', { contentId, text, user, avatar });
					const response = await apiService.addComment(contentId, text, user, avatar);
					
					// 详细记录响应信息
					console.log('📥 评论接口响应:', {
						response: response,
						responseType: typeof response,
						hasSuccess: 'success' in (response || {}),
						successValue: response?.success,
						responseString: JSON.stringify(response, null, 2)
					});
					
					// 判断请求是否成功：
					// 1. 如果响应有 success 字段，检查其值
					// 2. 如果没有 success 字段，但也没有抛出异常，说明接口调用成功（HTTP 200）
					const isSuccess = response?.success === true || 
					                 (response?.success === undefined && response !== undefined);
					
					if (isSuccess) {
						console.log('✅ 评论成功:', response?.data || response);
						return response?.data || response;
					} else {
						// 如果响应明确表示失败，抛出错误
						console.warn('⚠️ 评论响应表示失败:', response);
						const error = new Error(response?.message || '评论失败');
						error.response = response;
						throw error;
					}
				} catch (error) {
					console.error('❌ 添加评论失败:', error);
					console.error('❌ 错误详情:', {
						statusCode: error.statusCode,
						message: error.message,
						response: error.response
					});
					
					// 根据错误类型显示不同的提示
					let errorMessage = '添加评论失败';
					if (error.statusCode === 400) {
						const serverMessage = error.response?.message || error.message || '参数错误';
						errorMessage = `请求参数错误：${serverMessage}`;
					} else if (error.statusCode === 403) {
						errorMessage = '服务器拒绝请求（403）';
					} else if (error.statusCode === 401) {
						errorMessage = '未授权（401），请先登录';
					} else if (error.statusCode === 404) {
						errorMessage = '接口不存在（404）';
					} else if (error.statusCode === 500) {
						errorMessage = '服务器内部错误（500）';
					} else if (error.message) {
						errorMessage = error.message;
					}
					
					uni.showToast({
						title: errorMessage,
						icon: 'error',
						duration: 3000
					});
					
					// 抛出错误，让调用方知道失败了
					throw error;
				}
			},
			
			async likeContent(contentId, commentId = null) {
				try {
					console.log('📤 调用 like API:', { contentId, commentId });
					const response = await apiService.like(contentId, commentId);
					
					// 详细记录响应信息
					console.log('📥 点赞接口响应:', {
						response: response,
						responseType: typeof response,
						hasSuccess: 'success' in (response || {}),
						successValue: response?.success,
						responseString: JSON.stringify(response, null, 2)
					});
					
					// 判断请求是否成功：
					// 1. 如果响应有 success 字段，检查其值
					// 2. 如果没有 success 字段，但也没有抛出异常，说明接口调用成功（HTTP 200）
					const isSuccess = response?.success === true || 
					                 (response?.success === undefined && response !== undefined);
					
					if (isSuccess) {
						console.log('✅ 点赞成功:', response?.data || response);
						return response?.data || response;
					} else {
						// 如果响应明确表示失败，抛出错误
						console.warn('⚠️ 点赞响应表示失败:', response);
						const error = new Error(response?.message || '点赞失败');
						error.response = response;
						throw error;
					}
				} catch (error) {
					console.error('❌ 点赞失败:', error);
					console.error('❌ 错误详情:', {
						statusCode: error.statusCode,
						message: error.message,
						response: error.response
					});
					
					// 根据错误类型显示不同的提示
					let errorMessage = '点赞失败';
					if (error.statusCode === 400) {
						const serverMessage = error.response?.message || error.message || '参数错误';
						errorMessage = `请求参数错误：${serverMessage}`;
					} else if (error.statusCode === 403) {
						errorMessage = '服务器拒绝请求（403）';
					} else if (error.statusCode === 401) {
						errorMessage = '未授权（401），请先登录';
					} else if (error.statusCode === 404) {
						errorMessage = error.response?.message || '内容不存在（404）';
					} else if (error.statusCode === 500) {
						errorMessage = '服务器内部错误（500）';
					} else if (error.message) {
						errorMessage = error.message;
					}
					
					uni.showToast({
						title: errorMessage,
						icon: 'error',
						duration: 3000
					});
					
					// 抛出错误，让调用方知道失败了
					throw error;
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
				this.fetchAIContent(true);
				
				// 每4秒更新一次AI内容（减少频率）
				if (this.recognitionTimer) {
					clearInterval(this.recognitionTimer);
				}
				this.recognitionTimer = setInterval(() => {
					this.fetchAIContent();
				}, 4000);
				
				console.log('🤖 AI内容实时更新已启动（每4秒刷新）');
			},
			
			// 直播开始后自动启动AI内容获取
			async startAIContentAfterLiveStart() {
				try {
					console.log('🤖 ========== 开始检查AI识别状态 ==========');
					console.log('🤖 当前直播状态 - isLiveStarted:', this.isLiveStarted);
					console.log('🤖 当前直播流地址 - liveStreamUrl:', this.liveStreamUrl);
					
					// 检查AI状态
					const service = this.apiService || apiService;
					if (!service) {
						console.error('❌ API服务未初始化，无法检查AI状态');
						return;
					}
					
					console.log('🤖 正在获取Dashboard数据...');
					const dashboardData = await service.getDashboard();
					
					if (dashboardData) {
						console.log('🤖 Dashboard数据:', dashboardData);
						
						if (dashboardData.aiStatus !== undefined) {
							console.log('🤖 AI识别状态:', dashboardData.aiStatus);
							
							if (dashboardData.aiStatus === 'running') {
								// AI正在运行，启动内容获取
								console.log('✅ AI识别正在运行，开始获取AI内容...');
								
								// 立即获取一次AI内容
								if (typeof this.fetchAIContent === 'function') {
									console.log('🤖 调用 fetchAIContent(true) 进行初始加载...');
									await this.fetchAIContent(true); // 初始加载
								} else {
									console.error('❌ fetchAIContent 方法不存在');
								}
								
								// 启动定时更新
								if (typeof this.startAIContentRealTimeUpdate === 'function') {
									console.log('🤖 调用 startAIContentRealTimeUpdate() 启动定时更新...');
									this.startAIContentRealTimeUpdate();
								} else {
									console.error('❌ startAIContentRealTimeUpdate 方法不存在');
								}
								
								console.log('✅ AI内容获取已启动');
							} else {
								console.warn('⚠️ AI识别未启动，当前状态:', dashboardData.aiStatus);
								console.warn('💡 提示：如需AI识别功能，请在后台管理系统启动AI识别');
								
								// 即使AI未启动，也尝试获取一次内容（可能服务器刚启动，状态还未更新）
								console.log('🤖 尝试获取AI内容（即使AI状态显示未运行）...');
								if (typeof this.fetchAIContent === 'function') {
									this.fetchAIContent(true);
								}
							}
						} else {
							console.warn('⚠️ Dashboard数据中未找到 aiStatus 字段');
							console.log('🤖 Dashboard数据完整内容:', JSON.stringify(dashboardData, null, 2));
							
							// 即使没有aiStatus，也尝试获取AI内容
							console.log('🤖 尝试获取AI内容（即使没有AI状态信息）...');
							if (typeof this.fetchAIContent === 'function') {
								this.fetchAIContent(true);
							}
						}
					} else {
						console.error('❌ Dashboard数据为空');
					}
					
					console.log('🤖 ========== AI识别状态检查完成 ==========');
				} catch (error) {
					console.error('❌ 检查AI状态失败:', error);
					console.error('❌ 错误堆栈:', error.stack);
					
					// 即使检查失败，也尝试获取AI内容
					console.log('🤖 尝试直接获取AI内容（忽略状态检查）...');
					try {
						if (typeof this.fetchAIContent === 'function') {
							await this.fetchAIContent(true);
						}
						if (typeof this.startAIContentRealTimeUpdate === 'function') {
							this.startAIContentRealTimeUpdate();
						}
					} catch (fetchError) {
						console.error('❌ 直接获取AI内容也失败:', fetchError);
					}
				}
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
					// 微信小程序不支持 document API，使用 uni-app 的方式
					// #ifndef MP-WEIXIN
					if (typeof document !== 'undefined') {
						document.documentElement.style.setProperty('--status-bar-height', safeAreaTop + 'px');
					}
					// #endif
				}
			}).exec();
			},
			toggleLiveCollapse() {
				this.isLiveCollapsed = !this.isLiveCollapsed;
			},
			
			voteLeft() {
				// 如果直播未开始或正在快速连击，直接返回
				if (!this.isLiveStarted || !this.checkVoteRateLimit('left')) {
					return;
				}

				this.handleVote('left');
			},
			voteRight() {
				// 如果直播未开始或正在快速连击，直接返回
				if (!this.isLiveStarted || !this.checkVoteRateLimit('right')) {
					return;
				}

				this.handleVote('right');
			},

			// 检查投票速率限制（200ms最小间隔）
			checkVoteRateLimit(side) {
				const now = Date.now();
				// 对每一方单独进行速率限制，最少间隔200ms
				const lastTime = side === 'left' ? this.lastLeftVoteTime : this.lastRightVoteTime;

				if (now - lastTime < 200) {
					// 快速连击被限制，不进行任何操作
					return false;
				}

				if (side === 'left') {
					this.lastLeftVoteTime = now;
				} else {
					this.lastRightVoteTime = now;
				}

				return true;
			},

			// 统一的投票处理逻辑（增强版本 - 包含丰富的交互反馈）
			handleVote(side) {
				// 更新点击计数
				if (side === 'left') {
					this.leftClickCount++;
				} else {
					this.rightClickCount++;
				}

				// 立即更新UI，提供即时反馈（同步更新票数）
				if (side === 'left') {
					this.leftVotes += 10;
				} else {
					this.rightVotes += 10;
				}
				this.userVote = side;

				// 触发按钮点击特效
				this.triggerButtonEffect(side);

				// 批量更新UI（减少DOM操作）：将所有动画效果合并
				this.$nextTick(() => {
					// 触发分割线特效（轻量级）
					if (!this.isDividerHitInProgress) {
						this.triggerDividerHit();
					}

					// 创建特效（增强版本 - 大量表情符号飘动）
					// 移除了特效创建限制，允许快速连续创建
					this.createVoteEffects(side);

					// 更新百分数（异步防抖，避免频繁计算）
					this.debouncedUpdatePresetOpinion();

					// 直播开始后，只更新前端，不发送到服务器
				// 只有通过拖动进度条并点击确定，才会发送到服务器
				if (!this.isLiveStarted) {
					// 直播开始前不执行投票操作
					return;
				}
				// 直播开始后，点击投票按钮只更新前端显示，不发送数据库
				// 标记票数已改变，需要点击确认按钮提交
				if (this.isLiveStarted) {
					this.votesChanged = true;
				}
				});

				// 显示投票提示（优化版本）
				this.showVoteToastOptimized(side);
				
				// 触觉反馈和音效
				this.triggerVibrationFeedback(side);
			},
			
			// 触发按钮点击特效
			triggerButtonEffect(side) {
				// 设置按钮特效状态
				this.triggerEffect = { side: side, timestamp: Date.now() };
				
				// 1.2秒后清除特效状态
				setTimeout(() => {
					this.triggerEffect = null;
				}, 1200);
			},
			
			// 触觉反馈 - 根据点击次数产生不同强度的振动（超级增强版）
			triggerVibrationFeedback(side) {
				const clickCount = side === 'left' ? this.leftClickCount : this.rightClickCount;
				
				// 根据点击次数产生不同强度的振动模式
				let vibrationPattern = [];
				
				if (clickCount <= 3) {
					// 轻微振动
					vibrationPattern = [50];
				} else if (clickCount <= 10) {
					// 中等振动
					vibrationPattern = [100, 50, 100];
				} else if (clickCount <= 20) {
					// 强烈振动
					vibrationPattern = [150, 100, 150, 100, 150];
				} else if (clickCount <= 50) {
					// 超强振动
					vibrationPattern = [200, 150, 200, 150, 200, 150, 200];
				} else {
					// 终极振动
					vibrationPattern = [300, 200, 300, 200, 300, 200, 300, 200, 300];
				}
				
				// 执行振动
				// #ifdef APP-PLUS
				uni.vibrate({
					duration: vibrationPattern[0] || 100
				});
				// #endif
				
				// #ifdef H5
				// H5环境下的振动反馈
				if (navigator.vibrate) {
					navigator.vibrate(vibrationPattern);
				}
				// #endif
				
				// 添加音效反馈（如果支持）
				this.playVoteSound(clickCount);
			},
			
			// 播放投票音效
			playVoteSound(clickCount) {
				// 根据点击次数播放不同的音效
				let soundType = 'normal';
				
				if (clickCount <= 3) {
					soundType = 'light';
				} else if (clickCount <= 10) {
					soundType = 'medium';
				} else if (clickCount <= 20) {
					soundType = 'strong';
				} else if (clickCount <= 50) {
					soundType = 'epic';
				} else {
					soundType = 'legendary';
				}
				
				// 这里可以集成音效库，目前使用系统提示音
				// #ifdef APP-PLUS
				uni.showToast({
					title: `🎵 ${soundType}音效`,
					icon: 'none',
					duration: 100
				});
				// #endif
			},

			// 防抖的预设观点更新
			debouncedUpdatePresetOpinion() {
				clearTimeout(this.updatePresetOpinionTimeout);
				this.updatePresetOpinionTimeout = setTimeout(() => {
					this.updatePresetOpinionFromVotes();
				}, 100);
			},

			// 优化版本的投票提示（防止Toast堆积）
			showVoteToastOptimized(side) {
				// 如果已经有Toast显示，不再显示新的
				if (this.isToastShowing) {
					return;
				}

				const clickCount = side === 'left' ? this.leftClickCount : this.rightClickCount;
				const sideName = side === 'left' ? '正方' : '反方';

				let title = '';

				// 根据点击次数显示不同的提示（简化逻辑）
				if (clickCount === 1) {
					title = `🎉 支持${sideName}！`;
				} else if (clickCount <= 3) {
					title = `💪 ${sideName}加油！`;
				} else if (clickCount <= 5) {
					title = `🔥 ${sideName}必胜！`;
				} else if (clickCount <= 10) {
					title = `⚡ ${sideName}无敌！`;
				} else if (clickCount <= 20) {
					title = `🚀 ${sideName}超神！`;
				} else if (clickCount <= 50) {
					title = `💎 ${sideName}传奇！`;
				} else {
					title = `👑 ${sideName}王者！`;
				}

				this.isToastShowing = true;
				uni.showToast({
					title: title,
					icon: 'none',
					duration: 800
				});

				// 800ms后允许显示下一个Toast
				setTimeout(() => {
					this.isToastShowing = false;
				}, 800);
			},
			

			// 触发分割线被击中效果（优化：避免频繁触发）
			triggerDividerHit() {
				if (this.isDividerHitInProgress) {
					return; // 如果已经在处理中，跳过
				}

				this.isDividerHitInProgress = true;
				this.dividerHit = true;

				// 300ms后重置状态，允许下一次触发（减少频率）
				setTimeout(() => {
					this.dividerHit = false;
					this.isDividerHitInProgress = false;
				}, 300);
			},

		// 创建投票特效（Lottie 爱心动画版本 - 从按钮两端飘出爱心）
		createVoteEffects(side) {
			// 移除了特效数量限制，允许无限制创建动画

			// 每次点击创建 2-3 个爱心动画
			const effectCount = Math.floor(Math.random() * 2) + 2;

				for (let i = 0; i < effectCount; i++) {
					// 计算起始位置（按钮的两端）
					let startX, startY;
					if (side === 'left') {
						// 正方按钮：从左端飘出
						startX = '10%'; // 按钮左端
						startY = '78%'; // 按钮中心高度
					} else {
						// 反方按钮：从右端飘出
						startX = '82%'; // 按钮右端
						startY = '78%'; // 按钮中心高度
					}

					// 添加随机偏移，让动画更自然
					const randomOffsetX = (Math.random() - 0.5) * 100; // -50 到 50 rpx
					const randomOffsetY = (Math.random() - 0.5) * 50; // -25 到 25 rpx

					// 动画参数
					const duration = 3 + Math.random() * 1; // 3-4秒
					const delay = (i * 100) / 1000; // 100ms 间隔

					this.effectIdCounter++;
					const effectId = this.effectIdCounter;

					const effect = {
						id: effectId,
						side: side,
						class: `lottie-effect-${side}`,
						createTime: Date.now(),
						isLottie: true, // 标记为 Lottie 动画
						style: {
							left: `calc(${startX} + ${randomOffsetX}rpx)`,
							top: `calc(${startY} + ${randomOffsetY}rpx)`,
							animationDuration: `${duration}s`,
							animationDelay: `${delay}s`,
							opacity: 1
						}
					};

			this.voteEffects.push(effect);

		// 延迟初始化 Lottie 动画，等待 DOM 渲染
		this.$nextTick(() => {
			setTimeout(() => {
				this.initLottieHeartAnimation(effectId, delay * 1000);
			}, 10); // 减少延迟时间到 10ms
		});

					// 动画结束后移除特效
					const totalTime = (delay + duration) * 1000;
					const timeoutId = setTimeout(() => {
						this.removeVoteEffect(effectId);
					}, totalTime + 500);

					// 防止内存泄漏
					if (!this.effectTimeouts) {
						this.effectTimeouts = [];
					}
					this.effectTimeouts.push(timeoutId);

					// 清理过期的timeout ID
					if (this.effectTimeouts.length > 50) {
						this.effectTimeouts.shift();
					}
				}

				// 特效创建完成（移除了延迟标志，允许立即创建下一批特效）
		},
		
		// 初始化按钮动画
		initButtonAnimations() {
				
				// #ifdef MP-WEIXIN
				// 微信小程序环境
				this.initWeixinButtonAnimations();
				// #endif
				
				// #ifndef MP-WEIXIN
				// H5/浏览器环境
				this.initWebButtonAnimations();
				// #endif
			},
			
			// 微信小程序环境下的按钮动画初始化
			initWeixinButtonAnimations() {
				try {
					// 初始化正方按钮
					this.initWeixinButton('lottie-button-left', this.circleMorphingData);
					// 初始化反方按钮
					this.initWeixinButton('lottie-button-right', this.buttonYesData);
				} catch (error) {
					console.error('❌ 微信小程序按钮动画初始化失败:', error);
				}
			},
			
			// H5/浏览器环境下的按钮动画初始化
			initWebButtonAnimations() {
				try {
					// 初始化正方按钮
					this.initWebButton('lottie-button-left', this.circleMorphingData);
					// 初始化反方按钮
					this.initWebButton('lottie-button-right', this.buttonYesData);
				} catch (error) {
					console.error('❌ H5按钮动画初始化失败:', error);
				}
			},
			
			// 微信小程序按钮动画初始化
			initWeixinButton(canvasId, animationData) {
				uni.createSelectorQuery()
					.in(this)
					.select(`#${canvasId}`)
					.node((res) => {
						if (res && res.node) {
							const canvas = res.node;
							const context = canvas.getContext('2d');
							
							// 设置画布尺寸
							const dpr = uni.getSystemInfoSync().pixelRatio || 1;
							canvas.width = 200 * dpr;
							canvas.height = 120 * dpr;
							context.scale(dpr, dpr);
							
						// 初始化 Lottie 动画
						lottie.setup(canvas);
						const lottieInstance = lottie.loadAnimation({
							loop: true,
							autoplay: true,
							animationData: animationData,
							rendererSettings: {
								context: context,
								clearCanvas: true
							}
						});
							
							// 保存实例
							this.lottieButtonInstances[canvasId] = lottieInstance;
						}
					})
					.exec();
			},
			
			// H5/浏览器按钮动画初始化
			initWebButton(containerId, animationData) {
				const container = document.getElementById(containerId);
				if (container && typeof lottie !== 'undefined' && lottie.loadAnimation) {
					const lottieInstance = lottie.loadAnimation({
						container: container,
						renderer: 'svg',
						loop: true,
						autoplay: true,
						animationData: animationData
					});
					
						// 保存实例
						this.lottieButtonInstances[containerId] = lottieInstance;
				} else {
					console.error('❌ H5按钮容器未找到或lottie未加载:', containerId);
				}
			},
			
		// 初始化火焰动画
		initFireAnimation() {
				
				// #ifdef MP-WEIXIN
				// 微信小程序环境
				this.initWeixinFireAnimation();
				// #endif
				
				// #ifndef MP-WEIXIN
				// H5/浏览器环境
				this.initWebFireAnimation();
				// #endif
			},
			
			// 微信小程序环境下的火焰动画初始化
			initWeixinFireAnimation() {
				try {
					uni.createSelectorQuery()
						.in(this)
						.select('#lottie-fire')
						.node((res) => {
							if (res && res.node) {
								const canvas = res.node;
								const context = canvas.getContext('2d');
								
								// 设置画布尺寸
								const dpr = uni.getSystemInfoSync().pixelRatio || 1;
								canvas.width = 200 * dpr;
								canvas.height = 200 * dpr;
								context.scale(dpr, dpr);
								
							// 初始化 Lottie 动画
							lottie.setup(canvas);
							const lottieInstance = lottie.loadAnimation({
								loop: true,
								autoplay: true,
								animationData: this.fireAnimationData,
								rendererSettings: {
									context: context,
									clearCanvas: true
								}
							});
								
							// 保存实例
							this.lottieFireInstance = lottieInstance;
							}
						})
						.exec();
				} catch (error) {
					console.error('❌ 微信小程序火焰动画初始化失败:', error);
				}
			},
			
			// H5/浏览器环境下的火焰动画初始化
			initWebFireAnimation() {
				try {
					const container = document.getElementById('lottie-fire');
					if (container && typeof lottie !== 'undefined' && lottie.loadAnimation) {
						const lottieInstance = lottie.loadAnimation({
							container: container,
							renderer: 'svg',
							loop: true,
							autoplay: true,
							animationData: this.fireAnimationData
						});
						
					// 保存实例
					this.lottieFireInstance = lottieInstance;
					} else {
						console.error('❌ H5火焰容器未找到或lottie未加载');
					}
				} catch (error) {
					console.error('❌ H5火焰动画初始化失败:', error);
				}
			},
		// 初始化 Lottie 爱心动画
		initLottieHeartAnimation(effectId, delay = 0) {
			// #ifdef MP-WEIXIN
			try {
				const canvasId = `lottie-heart-${effectId}`;
				
				// 增加延迟确保 DOM 已渲染
				setTimeout(() => {
					const query = uni.createSelectorQuery().in(this);
					
					// 使用与背景动画相同的方式查询
					query.select(`#${canvasId}`)
						.fields({ node: true, size: true })
						.exec((res) => {
							if (res[0] && res[0].node) {
								const canvas = res[0].node;
								const systemInfo = uni.getSystemInfoSync();
								const dpr = systemInfo.pixelRatio || 1;
								
								try {
									// 爱心动画原始尺寸是 390x844，按比例缩小到容器大小
									// 放大容器尺寸，让动画更清晰
									const logicalWidth = 200;  // 从 150 增加到 200
									const logicalHeight = 400; // 从 320 增加到 400
									canvas.width = logicalWidth * dpr;
									canvas.height = logicalHeight * dpr;
									
									const context = canvas.getContext('2d');
									context.scale(dpr, dpr);
									
									// 直接 loadAnimation，不再调用 setup（避免卡顿）
									// lottie-miniprogram 会自动处理 canvas 绑定
									const animation = lottie.loadAnimation({
										loop: false,
										autoplay: true,
										animationData: this.heartAnimationData,
										rendererSettings: {
											context,
											preserveAspectRatio: 'xMidYMid meet',
											clearCanvas: true
										}
									});
									
									this.lottieHeartInstances[effectId] = animation;
									
									// 监听动画事件
									animation.addEventListener('complete', () => {
										if (this.lottieHeartInstances[effectId]) {
											this.lottieHeartInstances[effectId].destroy();
											delete this.lottieHeartInstances[effectId];
										}
									});
									
									// 立即播放
									animation.play();
									
								} catch (error) {
									// Canvas 初始化错误
								}
							}
						});
				}, delay + 50); // 减少延迟时间到 50ms
			} catch (error) {
				// 初始化失败
			}
			// #endif
				
			// #ifndef MP-WEIXIN
			// 非微信小程序环境：使用 lottie-web 库在浏览器中渲染
			setTimeout(() => {
				try {
					const containerId = `lottie-heart-${effectId}`;
					const container = document.getElementById(containerId);
					
					if (container) {
						// 使用 lottie-web 渲染（如果已安装）
						if (typeof lottie !== 'undefined' && lottie.loadAnimation) {
							const lottieInstance = lottie.loadAnimation({
								container: container,
								renderer: 'svg',
								loop: false,
								autoplay: true,
								animationData: this.heartAnimationData
							});
							
							this.lottieHeartInstances[effectId] = lottieInstance;
							
							lottieInstance.addEventListener('complete', () => {
								if (this.lottieHeartInstances[effectId]) {
									this.lottieHeartInstances[effectId].destroy();
									delete this.lottieHeartInstances[effectId];
								}
							});
						} else {
							// 备用方案：使用简单的 emoji 动画
							this.createBackupEmojiEffect(effectId, container);
						}
					}
				} catch (error) {
					console.error('初始化 Web Lottie 失败:', error);
				}
			}, delay + 50);
			// #endif
			},
			
		// 备用方案：创建简单的 emoji 爱心动画
		createBackupEmojiEffect(effectId, container) {
			if (!container) return;
				
				// 创建多个爱心 emoji
				const hearts = ['💖', '❤️', '💕', '💗', '💓'];
				const heartCount = Math.floor(Math.random() * 3) + 3; // 3-5个爱心
				
				for (let i = 0; i < heartCount; i++) {
					const heart = document.createElement('div');
					heart.className = 'emoji-heart';
					heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
					heart.style.cssText = `
						position: absolute;
						font-size: ${30 + Math.random() * 20}px;
						left: ${Math.random() * 100}%;
						top: ${Math.random() * 100}%;
						animation: floatUpHeart ${2 + Math.random()}s ease-out forwards;
						animation-delay: ${i * 0.1}s;
						pointer-events: none;
					`;
					container.appendChild(heart);
				}
				
				// 3秒后清理
				setTimeout(() => {
					if (container && container.parentNode) {
						while (container.firstChild) {
							container.removeChild(container.firstChild);
						}
					}
				}, 3000);
			},
			
			// 移除投票特效
			removeVoteEffect(effectId) {
				const index = this.voteEffects.findIndex(effect => effect.id === effectId);
				if (index > -1) {
					// 清理 Lottie 实例
					if (this.lottieHeartInstances[effectId]) {
						try {
							this.lottieHeartInstances[effectId].destroy();
						} catch (error) {
							console.error('清理 Lottie 实例失败:', error);
						}
						delete this.lottieHeartInstances[effectId];
					}
					this.voteEffects.splice(index, 1);
				}
			},
			
			// 特效性能优化 - 定期清理过期特效
			startEffectCleanup() {
				if (this.effectCleanupInterval) {
					return; // 已经启动
				}
				
				this.effectCleanupInterval = setInterval(() => {
					const now = Date.now();
					
					// 每5秒清理一次，避免频繁清理影响性能
					if (now - this.lastEffectCleanup < 5000) {
						return;
					}
					
					this.lastEffectCleanup = now;
					
					// 清理过期的特效
					const initialCount = this.voteEffects.length;
					this.voteEffects = this.voteEffects.filter(effect => {
						// 保留最近创建的特效，清理超过10秒的特效
						return (now - effect.createTime) < 10000;
					});
					
					// 清理过期的timeout
					if (this.effectTimeouts.length > 50) {
						// 清理前一半的timeout
						const toRemove = this.effectTimeouts.splice(0, 25);
						toRemove.forEach(timeoutId => {
							clearTimeout(timeoutId);
						});
					}
					
					// 在开发环境下输出清理信息
					if (process.env.NODE_ENV === 'development' && initialCount !== this.voteEffects.length) {
						// 特效清理完成
					}
				}, 2000); // 每2秒检查一次
			},
			
			// 停止特效清理
			stopEffectCleanup() {
				if (this.effectCleanupInterval) {
					clearInterval(this.effectCleanupInterval);
					this.effectCleanupInterval = null;
				}
			},
			
			// 预设观点滑块变化处理
			onPresetChange(e) {
				this.presetOpinion = e.detail.value;
				
				if (!this.isLiveStarted) {
					// 直播开始前：只更新显示，不发送到数据库
					// 更新预设观点对抗条显示
					this.updatePresetBattleBar();
				} else {
					// 直播开始后：根据预设观点倾向重新计算前端的投票数据显示
					// 保持总票数不变，只调整比例
					const currentTotal = this.leftVotes + this.rightVotes;
					if (currentTotal > 0) {
						this.leftVotes = Math.round((this.presetOpinion / 100) * currentTotal);
						this.rightVotes = currentTotal - this.leftVotes;
					} else {
						// 如果当前没有票数，使用基础票数
						const baseVotes = 100;
						this.leftVotes = Math.round((this.presetOpinion / 100) * baseVotes);
						this.rightVotes = baseVotes - this.leftVotes;
					}
					// 标记票数已改变，需要点击确定按钮才能提交到数据库
					this.presetSliderChanged = true;
					this.votesChanged = true;
				}
			},
			
				// 提交预设观点投票（初始100票或直播后拖动后的票数）
			async confirmPresetVotes() {
				if (!this.isLiveStarted) {
					// 直播开始前：提交初始100票
					const leftVotes = Math.round((this.presetOpinion / 100) * this.initialVotesTotal);
					const rightVotes = this.initialVotesTotal - leftVotes;
					
					// 发送到数据库
					// 服务器要求：leftVotes + rightVotes 必须等于 100
					// 只需要发送一次请求，包含双方的票数
					try {
						// 确保总和为 100（初始票数应该已经是 100）
						let finalLeftVotes = leftVotes;
						let finalRightVotes = rightVotes;
						const total = finalLeftVotes + finalRightVotes;
						if (total !== 100) {
							// 如果总和不是 100，按比例调整
							const scale = 100 / total;
							finalLeftVotes = Math.round(finalLeftVotes * scale);
							finalRightVotes = 100 - finalLeftVotes; // 确保总和为 100
						}
						
						// 发送一次请求，根据哪一方票数更多，决定以哪一方为主
						let voteResult;
						if (finalLeftVotes >= finalRightVotes) {
							voteResult = await this.sendUserVote('left', finalLeftVotes);
						} else {
							voteResult = await this.sendUserVote('right', finalRightVotes);
						}
						
						// 检查投票结果
						if (voteResult && voteResult.success !== false) {
							// 标记已提交
							this.initialVotesSubmitted = true;
							// 清除票数变化标记
							this.votesChanged = false;
							// 如果直播还没开始，隐藏预设观点面板，且不可再打开
							// 如果直播已开始，面板可以继续显示（因为可能还需要拖动调整）
							if (!this.isLiveStarted) {
								this.showPresetSlider = false;
								this.showPresetPanel = false;
							}
							
							// 更新本地显示的票数
							this.leftVotes = finalLeftVotes;
							this.rightVotes = finalRightVotes;
							
							uni.showToast({
								title: '✅ 初始投票已提交',
								icon: 'success',
								duration: 2000
							});
						} else {
							// 如果 sendUserVote 返回失败，错误提示已在 sendUserVote 中显示
							console.warn('⚠️ 初始投票提交失败:', voteResult);
						}
					} catch (error) {
						console.error('提交初始投票失败:', error);
						uni.showToast({
							title: '提交失败，请重试',
							icon: 'error'
						});
					}
				} else {
					// 直播开始后：提交拖动进度条后的票数变化
					const currentTotal = this.leftVotes + this.rightVotes;
					if (currentTotal === 0) {
						uni.showToast({
							title: '没有可提交的票数',
							icon: 'none'
						});
						return;
					}
					
					// 计算需要发送的票数变化
					let leftVotes = this.leftVotes;
					let rightVotes = this.rightVotes;
					
					// 服务器要求：leftVotes + rightVotes 必须等于 100
					// 只需要发送一次请求，包含双方的票数
					try {
						// 确保总和为 100
						const total = leftVotes + rightVotes;
						if (total !== 100) {
							// 如果总和不是 100，按比例调整
							const scale = 100 / total;
							leftVotes = Math.round(leftVotes * scale);
							rightVotes = 100 - leftVotes; // 确保总和为 100
						}
						
					// 发送一次请求，包含双方的票数（总和为100）
					// 根据哪一方票数更多，决定以哪一方为主
					let voteResult;
					if (leftVotes >= rightVotes) {
						voteResult = await this.sendUserVote('left', leftVotes);
					} else {
						voteResult = await this.sendUserVote('right', rightVotes);
					}
					
					// 检查投票结果
					if (voteResult && voteResult.success !== false) {
						// 清除变化标记
						this.presetSliderChanged = false;
						this.votesChanged = false;
						
						uni.showToast({
							title: '✅ 投票已更新',
							icon: 'success',
							duration: 2000
						});
					} else {
						// 如果 sendUserVote 返回失败，错误提示已在 sendUserVote 中显示
						console.warn('⚠️ 投票提交失败:', voteResult);
					}
					} catch (error) {
						console.error('提交投票失败:', error);
						uni.showToast({
							title: '提交失败，请重试',
							icon: 'error'
						});
					}
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
			
			// 切换预设观点面板显示/隐藏
			togglePresetPanel() {
				// 如果初始投票已提交且直播未开始，不允许打开
				if (this.initialVotesSubmitted && !this.isLiveStarted) {
					return;
				}
				
				// 展开面板时，确保 showPresetSlider 也为 true
				if (!this.showPresetPanel) {
					this.showPresetSlider = true;
					this.showPresetPanel = true;
					
					// 显示提示信息
					uni.showToast({
						title: '🎯 观点倾向面板已展开',
						icon: 'success',
						duration: 1500
					});
				} else {
					this.showPresetPanel = false;
					
					// 显示提示信息
					uni.showToast({
						title: '🎯 观点倾向面板已收起',
						icon: 'none',
						duration: 1500
					});
				}
			},
			
			// 根据当前投票比例更新预设观点倾向
			updatePresetOpinionFromVotes() {
				if (this.totalVotes > 0) {
					const newValue = Math.round(this.leftPercentage);
					if (newValue !== this.presetOpinion) {
						// 触发数值变化动画
						this.triggerValueChangeAnimation();
						// 根据当前投票比例计算预设观点倾向
						this.presetOpinion = newValue;
					}
				}
			},
			
			// 触发数值变化动画
			triggerValueChangeAnimation() {
				this.isValueChanging = true;
				// 动画持续0.6秒
				setTimeout(() => {
					this.isValueChanging = false;
				}, 600);
			},
			
		// 手动开始直播（优先从服务器获取直播流地址）
		async startLive() {
			try {
				// 如果已经开始了，直接返回
				if (this.isLiveStarted) {
					uni.showToast({ 
						title: '直播已在进行中', 
						icon: 'none',
						duration: 2000
					});
					return;
				}
				
				// 确保 apiService 已初始化
				if (!this.apiService) {
					await this.initApiService();
					if (!this.apiService) {
						this.apiService = apiService;
					}
				}
				
				console.log('🎬 开始获取直播流地址...');
				
				// ==================== 第一步：从服务器获取直播状态和流地址 ====================
				let serverStreamUrl = null;
				let isServerLive = false;
				let activeStreamUrl = null; // 从数据库获取的启用直播流地址
				
				try {
					const service = this.apiService || apiService;
					
					// 优先使用 dashboard 接口获取直播状态
					try {
						const dashboardData = await service.getDashboard();
						
						console.log('📡 Dashboard数据:', dashboardData);
						
						if (dashboardData && dashboardData.isLive) {
							// 服务器端直播正在进行
							isServerLive = true;
							
							if (dashboardData.liveStreamUrl) {
								serverStreamUrl = dashboardData.liveStreamUrl;
								console.log('✅ 从dashboard获取到直播流地址（直播中）:', serverStreamUrl);
							}
						} else if (dashboardData && dashboardData.liveStreamUrl && !dashboardData.isLive) {
							// 服务器有流地址但未开始，也可以使用
							serverStreamUrl = dashboardData.liveStreamUrl;
							console.log('⚠️ 服务器有流地址但未开始直播，使用该地址');
						}
						
						// 获取数据库中启用的直播流（即使直播未开始）
						if (dashboardData && dashboardData.activeStreamUrl) {
							activeStreamUrl = dashboardData.activeStreamUrl;
							console.log('✅ 从dashboard获取到启用直播流:', activeStreamUrl);
							console.log('📺 流名称:', dashboardData.activeStreamName || '未知');
						}
					} catch (dashboardError) {
						console.warn('⚠️ dashboard接口获取失败，尝试status接口:', dashboardError.message);
						// 兼容旧版本：如果 dashboard 接口不存在，尝试使用 status 接口
						const statusResponse = await service.getLiveStatus();
						
						console.log('📡 服务器直播状态（status接口）:', statusResponse);
						
						if (statusResponse && statusResponse.isLive) {
							isServerLive = true;
							
							if (statusResponse.streamUrl) {
								serverStreamUrl = statusResponse.streamUrl;
								console.log('✅ 从status接口获取到直播流地址（直播中）:', serverStreamUrl);
							}
						} else if (statusResponse && statusResponse.streamUrl && !statusResponse.isLive) {
							serverStreamUrl = statusResponse.streamUrl;
							console.log('⚠️ 服务器有流地址但未开始直播，使用该地址');
						}
						
						if (statusResponse && statusResponse.activeStreamUrl) {
							activeStreamUrl = statusResponse.activeStreamUrl;
							console.log('✅ 从status接口获取到启用直播流:', activeStreamUrl);
							console.log('📺 流名称:', statusResponse.activeStreamName || '未知');
						}
					}
				} catch (error) {
					console.warn('⚠️ 获取服务器直播状态失败:', error.message);
					// 如果接口不存在（404），尝试直接获取直播流列表
					if (error.message && error.message.includes('404')) {
						console.log('💡 接口不存在，尝试直接获取启用直播流列表...');
						try {
							// 尝试通过其他方式获取，或者使用备用方案
							await this.fetchActiveStreamFromServerAlternative();
						} catch (altError) {
							console.warn('⚠️ 备用方案也失败，将使用配置文件的测试流');
						}
					}
					// 继续使用备用地址
				}
				
				// ==================== 第二步：确定使用的直播流地址 ====================
				let finalStreamUrl = null;
				
				// 优先级：服务器正在使用的流地址 > 数据库中启用的流地址 > 已有流地址
				// 完全使用接口数据，不再使用配置文件默认值
				if (serverStreamUrl) {
					finalStreamUrl = serverStreamUrl;
					console.log('✅ 使用服务器返回的直播流地址（直播中）');
				} else if (activeStreamUrl) {
					finalStreamUrl = activeStreamUrl;
					console.log('✅ 使用数据库中启用的直播流地址');
				} else if (this.liveStreamUrl) {
					finalStreamUrl = this.liveStreamUrl;
					console.log('✅ 使用已有的直播流地址');
				} else {
					// 如果所有接口都无法获取流地址，尝试通过 streams 接口获取
					console.warn('⚠️ 无法从接口获取直播流地址，尝试通过streams接口获取...');
					try {
						const streamUrl = await this.fetchActiveStreamFromServerAlternative();
						if (streamUrl) {
							finalStreamUrl = streamUrl;
							console.log('✅ 通过streams接口获取到直播流地址');
						} else {
							console.warn('⚠️ streams接口也无法获取到启用的直播流');
						}
					} catch (streamsError) {
						console.warn('⚠️ streams接口获取失败:', streamsError.message);
					}
				}
				
				// 确保流地址有效（在设置状态之前）
				if (!finalStreamUrl) {
					console.error('❌ 无法从接口获取直播流地址，请先在后台管理系统配置直播流');
					uni.showToast({
						title: '未找到可用的直播流，请先配置',
						icon: 'none',
						duration: 3000
					});
					return; // 如果没有流地址，直接返回，不开始播放
				}
				
				// 先设置直播流地址
				this.liveStreamUrl = finalStreamUrl;
				
				console.log('✅ 准备开始播放');
				console.log('📺 使用的直播流地址:', this.liveStreamUrl);
				console.log('🌐 服务器端直播状态:', isServerLive ? '进行中' : '未开始');
				
				// 使用 $nextTick 确保 DOM 更新后再设置播放状态
				await this.$nextTick();
				
				// 开始播放
				this.isLiveStarted = true;
				
				console.log('✅ 直播已开始，播放器应该开始渲染');
				
				uni.showToast({ 
					title: isServerLive ? '已连接到服务器直播' : '开始播放直播流', 
					icon: 'success',
					duration: 2000
				});
				
				// 开始后，启动其他服务的实时更新（票数、AI内容）
				setTimeout(() => {
					// 获取票数（访问本地服务器）
					if (typeof this.fetchTopBarVotes === 'function') {
						this.fetchTopBarVotes();
						// 启动票数实时更新
						if (typeof this.startTopBarRealTimeUpdate === 'function') {
							this.startTopBarRealTimeUpdate();
						}
					}
					
					// 获取AI内容（访问本地服务器）
					if (typeof this.fetchAIContent === 'function') {
						this.fetchAIContent(true); // 初始加载
						// 启动AI内容实时更新
						if (typeof this.startAIContentRealTimeUpdate === 'function') {
							this.startAIContentRealTimeUpdate();
						}
					}
					
					// 获取票数数据（如果方法存在）
					if (typeof this.fetchVotes === 'function') {
						this.fetchVotes();
					}
				}, 500);
				
			} catch (error) {
				console.error('❌ 启动直播失败:', error);
				uni.showToast({ 
					title: '启动直播失败: ' + (error.message || '请稍后重试'), 
					icon: 'none',
					duration: 3000
				});
			}
		},




			
			// AI语音识别相关方法（现在从服务器获取数据）
			
		// 添加AI消息到对话列表
		addAIMessage(dialogueData) {
			this.messageIdCounter++;
			// 确保评论都有 id
			const comments = (dialogueData.comments || []).map((comment, index) => ({
				...comment,
				id: comment.id || Date.now() + index // 如果服务器没有提供 id，生成一个
			}));
			
			const newMessage = {
				id: this.messageIdCounter,
				serverId: dialogueData.id, // 保存服务器ID用于去重
				debate_id: dialogueData.debate_id || null, // 保存辩题ID，标识该观点属于哪个辩题
				text: dialogueData.text,
				side: dialogueData.side,
				comments: comments,
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
			// 关闭评论详情弹窗（如果打开的话），确保评论发表弹窗显示在最上层
			this.showModal = false;
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
				// 使用 serverId（服务器的 UUID），如果没有则使用本地 id
				const contentId = this.currentCommentMessage.serverId || this.currentCommentMessage.id;
				console.log('📤 提交评论:', {
					contentId: contentId,
					text: this.commentText.trim(),
					localId: this.currentCommentMessage.id,
					serverId: this.currentCommentMessage.serverId
				});
				
				const serverComment = await this.addCommentToServer(
					contentId,
					this.commentText.trim(), // text
					'我', // user
					'👤' // avatar
				);
				
				// 如果 addCommentToServer 成功返回，说明评论已添加
				// 添加新评论到本地
				const newComment = {
					id: serverComment?.id || Date.now(), // 使用服务器返回的 id 或生成临时 id
					user: '我',
					text: this.commentText.trim(),
					time: '刚刚',
					avatar: '👤',
					likes: 0
				};
				this.currentCommentMessage.comments.unshift(newComment);
				
				// 关闭评论发表弹窗
				this.closeCommentModal();
				
				// 重新打开评论详情弹窗，让用户看到刚刚发表的评论
				if (this.currentCommentMessage) {
					this.showMessageComments(this.currentCommentMessage);
				}
				
				uni.showToast({
					title: '评论发表成功！',
					icon: 'success',
					duration: 2000
				});
			} catch (error) {
				// 提交评论失败
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
		
		// 删除评论
		async deleteComment(message, commentIndex) {
			const comment = message.comments[commentIndex];
			
			if (!comment) {
				return;
			}
			
			// 临时关闭自定义弹窗，确保确认对话框显示在最上层
			const wasModalOpen = this.showModal;
			if (wasModalOpen) {
				this.showModal = false;
			}
			
			// 等待一小段时间，确保弹窗关闭动画完成
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// 显示确认对话框
			const res = await uni.showModal({
				title: '确认删除',
				content: '确定要删除这条评论吗？',
				confirmText: '删除',
				cancelText: '取消',
				confirmColor: '#ff4757'
			});
			
			// 如果用户取消了删除，重新打开弹窗
			if (!res.confirm) {
				if (wasModalOpen) {
					this.showModal = true;
				}
				return;
			}
			
			try {
				// 如果评论有 id，发送到服务器
				if (comment.id) {
					// 使用 serverId（服务器的 UUID），如果没有则使用本地 id
					const contentId = message.serverId || message.id;
					console.log('📤 删除评论:', { contentId, commentId: comment.id });
					const response = await apiService.deleteComment(contentId, comment.id);
					
					// 详细记录响应信息
					console.log('📥 删除评论接口响应:', {
						response: response,
						responseType: typeof response,
						hasSuccess: 'success' in (response || {}),
						successValue: response?.success,
						responseString: JSON.stringify(response, null, 2)
					});
					
					// 判断请求是否成功：
					// 1. 如果响应有 success 字段，检查其值
					// 2. 如果没有 success 字段，但也没有抛出异常，说明接口调用成功（HTTP 200）
					const isSuccess = response?.success === true || 
					                 (response?.success === undefined && response !== undefined);
					
					if (!isSuccess) {
						const errorMessage = response?.message || '删除失败';
						console.warn('⚠️ 删除评论响应表示失败:', response);
						throw new Error(errorMessage);
					}
					
					console.log('✅ 删除评论成功:', response?.data || response);
				}
				
				// 从本地删除评论
				message.comments.splice(commentIndex, 1);
				
				// 重新打开弹窗（如果之前是打开的）
				if (wasModalOpen) {
					this.showModal = true;
				}
				
				// 显示成功提示
				uni.showToast({
					title: '评论已删除',
					icon: 'success',
					duration: 1500
				});
			} catch (error) {
				// 删除失败，重新打开弹窗
				if (wasModalOpen) {
					this.showModal = true;
				}
				
				// 删除失败提示
				uni.showToast({
					title: '删除失败，请重试',
					icon: 'error',
					duration: 2000
				});
			}
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
					// 使用 serverId（服务器的 UUID），如果没有则使用本地 id
					const contentId = message.serverId || message.id;
					console.log('📝 点赞内容 ID:', { 
						localId: message.id, 
						serverId: message.serverId,
						useId: contentId 
					});
					
					// 发送到服务器
					const result = await this.likeContent(contentId);
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
				switch(tab) {
					case 'home':
						// 首页 - 当前页面，确保选中状态正确
						this.currentTab = 'home';
						break;
					case 'profile':
						// 我的页面 - 使用 navigateTo 保留首页在页面栈中
						// currentTab 会在 profile 页面的 onShow 中设置为 'profile'
						// 这里不改变 currentTab，避免首页导航栏显示错误
						uni.navigateTo({
							url: '/pages/profile/profile'
						});
						break;
				}
			},
			
			// ==================== WebSocket 连接与消息处理 ====================
			
			// 建立WebSocket连接
			connectWebSocket() {
			try {
				// 获取服务器地址
				const serverUrl = this.getServerUrl() || API_BASE_URL;
				// 将 http/https 替换为 ws/wss，并添加 /ws 路径
				const wsUrl = serverUrl.replace(/^http/, 'ws') + '/ws';
				
				console.log('🔌 正在连接WebSocket:', wsUrl);
					
					// 创建WebSocket连接
					this.socketTask = uni.connectSocket({
						url: wsUrl,
						success: () => {
							console.log('✅ WebSocket连接请求已发送');
						},
						fail: (err) => {
							console.error('❌ WebSocket连接请求失败:', err);
							this.scheduleWSReconnect();
						}
					});
					
					// 监听连接打开
					this.socketTask.onOpen(() => {
						console.log('✅ WebSocket连接已建立');
						this.wsReconnectAttempts = 0;
						
						// 启动心跳
						this.startWSHeartbeat();
						
						// 发送初始消息（可选）
						this.sendWSMessage({
							type: 'register',
							clientType: 'miniprogram',
							userId: uni.getStorageSync('userId') || 'guest'
						});
					});
					
					// 监听消息接收
					this.socketTask.onMessage((res) => {
						try {
							const data = JSON.parse(res.data);
							this.handleWSMessage(data);
						} catch (error) {
							console.error('❌ WebSocket消息解析失败:', error);
						}
					});
					
					// 监听连接关闭
					this.socketTask.onClose(() => {
						console.warn('⚠️ WebSocket连接已关闭');
						this.stopWSHeartbeat();
						this.scheduleWSReconnect();
					});
					
					// 监听连接错误
					this.socketTask.onError((err) => {
						console.error('❌ WebSocket连接错误:', err);
						this.stopWSHeartbeat();
						this.scheduleWSReconnect();
					});
					
				} catch (error) {
					console.error('❌ WebSocket连接失败:', error);
					this.scheduleWSReconnect();
				}
			},
			
		// 处理WebSocket消息
		handleWSMessage(data) {
			console.log('📩 收到WebSocket消息:', data);
			
			// 🔍 多直播支持：过滤消息，只处理当前直播间的消息
			if (this.streamId && data.streamId && data.streamId !== this.streamId) {
				console.log('⏩ 消息不属于当前直播间，忽略:', data.streamId, '当前直播间:', this.streamId);
				return;
			}
			
			switch (data.type) {
				case 'liveStatus':
				case 'live-status-changed':
					// 更新直播状态（兼容两种消息类型）
					// live-status-changed 的数据结构可能不同，需要适配
					let liveData = data.data;
					
					// 适配 live-status-changed 的消息格式
					if (data.type === 'live-status-changed') {
						liveData = {
							isLive: data.data.status === 'started',
							streamUrl: data.data.streamUrl,
							liveId: data.data.liveId,
							startTime: data.data.startTime
						};
					}
					
					this.handleLiveStatusUpdate(liveData);
					break;
						
					case 'aiStatus':
						// 更新AI状态
						this.handleAIStatusUpdate(data.data);
						break;
						
					case 'votesUpdate':
						// 更新票数
						this.handleVotesUpdate(data.data);
						break;
						
					case 'newAIContent':
						// 新增AI内容
						this.handleNewAIContent(data.data);
						break;
						
					case 'aiContentDeleted':
						// AI内容被删除
						this.handleAIContentDeleted(data.data);
						break;
						
					case 'pong':
						// 心跳响应
						console.log('💓 WebSocket心跳响应');
						break;
						
					default:
						console.log('📩 未知消息类型:', data.type);
				}
			},
			
		// 处理直播状态更新（WebSocket推送）
		async handleLiveStatusUpdate(data) {
			console.log('🎬 直播状态更新（WebSocket）:', data);
			
			// ✅ 优先接收并设置直播流URL（使用智能转换方法）
			if (data.streamUrl) {
				// 使用智能转换方法设置HLS流地址
				await this.setLiveStreamUrlWithHls(data.streamUrl, data.streamName);
				console.log('📺 更新直播流地址（从WebSocket）:', this.liveStreamUrl);
			} else if (!this.liveStreamUrl) {
				// 如果没有流地址，尝试从服务器获取启用的直播流
				await this.fetchActiveStreamFromServer();
			}
			
			// 更新直播状态
			if (data.isLive !== undefined) {
				const wasLive = this.isLiveStarted;
				
				if (data.isLive && !wasLive) {
					// 直播从停止变为开始
					console.log('✅ 服务器开始直播，自动开始播放');
					
					// 确保流地址存在
					if (!this.liveStreamUrl) {
						// 如果还没有流地址，尝试从dashboard获取
						console.log('💡 没有流地址，尝试从dashboard获取...');
						await this.fetchLiveStatus();
						// 如果仍然没有流地址，尝试通过其他接口获取
						if (!this.liveStreamUrl) {
							await this.fetchActiveStreamFromServer();
						}
						// 如果还是没有流地址，提示用户
						if (!this.liveStreamUrl) {
							console.error('❌ 无法从接口获取直播流地址');
							uni.showToast({
								title: '未找到可用的直播流，请先配置',
								icon: 'none',
								duration: 3000
							});
							return; // 没有流地址，不开始播放
						}
					}
					
					// 先设置流地址，再等待 DOM 更新
					this.$nextTick(async () => {
						// 确保流地址已设置
						if (this.liveStreamUrl) {
							// 更新播放状态
							this.isLiveStarted = true;
							
							console.log('✅ 直播已开始，播放器应该自动播放');
							console.log('📺 使用的流地址:', this.liveStreamUrl);
							console.log('🎬 isLiveStarted:', this.isLiveStarted);
							console.log('🎬 liveStreamUrl:', this.liveStreamUrl);
							
							// 显示成功提示
							uni.showToast({
								title: '直播已开始',
								icon: 'success',
								duration: 2000
							});
							
							// 直播开始后，自动启动AI内容获取
							setTimeout(() => {
								this.startAIContentAfterLiveStart();
							}, 1000);
						} else {
							// 没有流地址，提示用户
							console.warn('⚠️ 收到直播开始信号，但缺少流地址');
							uni.showToast({
								title: '收到直播开始信号，但缺少流地址',
								icon: 'none',
								duration: 3000
							});
						}
					});
				} else if (!data.isLive && wasLive) {
					// 直播从开始变为停止
					console.log('🛑 服务器停止直播');
					this.isLiveStarted = false;
					
					// 显示提示
					uni.showToast({
						title: '直播已结束',
						icon: 'none',
						duration: 2000
					});
					
					// 保留liveStreamUrl，下次可以继续使用
				} else if (data.isLive === wasLive) {
					// 状态没有变化，只更新流地址（如果有）
					// 这里不做任何操作，避免重复触发
				}
			} else {
				// 如果没有 isLive 字段，但有流地址，可能只是更新流地址
				if (data.streamUrl) {
					console.log('📺 更新直播流地址:', data.streamUrl);
					// 使用智能转换方法设置HLS流地址
					await this.setLiveStreamUrlWithHls(data.streamUrl, data.streamName);
					// 如果当前没有开始直播，但收到了流地址，可以考虑自动开始（用于测试）
					if (!this.isLiveStarted) {
						console.log('💡 收到流地址但直播未开始，可以通过点击播放按钮观看测试流');
					}
				}
			}
		},
			
			// 处理AI状态更新
			handleAIStatusUpdate(data) {
				console.log('🤖 AI状态更新:', data);
				if (data.status) {
					this.isListening = (data.status === 'running');
					
					// 根据AI状态变化，更新AI内容
					if (data.status === 'running') {
						// AI开始运行，启动定时刷新
						if (this.recognitionTimer) {
							clearInterval(this.recognitionTimer);
						}
						this.recognitionTimer = setInterval(() => {
							this.fetchAIContent();
						}, 5000);
					} else if (data.status === 'stopped') {
						// AI停止，清除定时器
						if (this.recognitionTimer) {
							clearInterval(this.recognitionTimer);
							this.recognitionTimer = null;
						}
					}
				}
			},
			
			// 处理票数更新
			handleVotesUpdate(data) {
				console.log('📊 票数更新:', data);
				
				// 更新顶部对抗条的票数
				if (data.leftVotes !== undefined) {
					this.topLeftVotes = data.leftVotes;
				}
				if (data.rightVotes !== undefined) {
					this.topRightVotes = data.rightVotes;
				}
				
				// 更新百分比
				if (data.leftPercentage !== undefined) {
					this.leftPercentage = data.leftPercentage;
				}
				if (data.rightPercentage !== undefined) {
					this.rightPercentage = data.rightPercentage;
				}
			},
			
			// 处理新增AI内容
			handleNewAIContent(data) {
				console.log('➕ 新增AI内容:', data);
				// 检查是否已存在
				const exists = this.aiMessages.some(msg => msg.serverId === data.id);
				if (!exists) {
					this.addAIMessage(data);
				}
			},
			
			// 处理AI内容删除
			handleAIContentDeleted(data) {
				console.log('🗑️ AI内容删除:', data);
				const contentId = data.contentId;
				// 从列表中移除
				this.aiMessages = this.aiMessages.filter(msg => msg.serverId !== contentId);
			},
			
			// 发送WebSocket消息
			sendWSMessage(data) {
				if (this.socketTask) {
					this.socketTask.send({
						data: JSON.stringify(data),
						success: () => {
							console.log('✅ WebSocket消息已发送:', data);
						},
						fail: (err) => {
							console.error('❌ WebSocket消息发送失败:', err);
						}
					});
				}
			},
			
			// 启动心跳
			startWSHeartbeat() {
				this.stopWSHeartbeat();
				this.wsHeartbeatTimer = setInterval(() => {
					this.sendWSMessage({ type: 'ping' });
				}, 30000); // 每30秒发送一次心跳
			},
			
			// 停止心跳
			stopWSHeartbeat() {
				if (this.wsHeartbeatTimer) {
					clearInterval(this.wsHeartbeatTimer);
					this.wsHeartbeatTimer = null;
				}
			},
			
			// 计划重连
			scheduleWSReconnect() {
				// 清除之前的重连计划
				if (this.wsReconnectTimer) {
					clearTimeout(this.wsReconnectTimer);
					this.wsReconnectTimer = null;
				}
				
				// 检查是否达到最大重连次数
				if (this.wsReconnectAttempts >= this.wsMaxReconnectAttempts) {
					console.warn('⚠️ WebSocket已达到最大重连次数，停止重连');
					return;
				}
				
				this.wsReconnectAttempts++;
				const delay = Math.min(1000 * Math.pow(2, this.wsReconnectAttempts), 30000); // 指数退避，最大30秒
				
				console.log(`🔄 将在 ${delay}ms 后尝试重连WebSocket (第${this.wsReconnectAttempts}次)`);
				
				this.wsReconnectTimer = setTimeout(() => {
					this.connectWebSocket();
				}, delay);
			},
			
			// 断开WebSocket连接
			disconnectWebSocket() {
				if (this.socketTask) {
					this.socketTask.close({
						success: () => {
							console.log('✅ WebSocket连接已断开');
						}
					});
					this.socketTask = null;
				}
				
				this.stopWSHeartbeat();
				
				if (this.wsReconnectTimer) {
					clearTimeout(this.wsReconnectTimer);
					this.wsReconnectTimer = null;
				}
			},
			
			// 初始化背景 Lottie 动画
			initBackgroundLottie() {
				// #ifdef MP-WEIXIN
				console.log('开始初始化 Home 页面背景 Lottie 动画...')

				// 获取系统信息
				const systemInfo = uni.getSystemInfoSync()
				const dpr = systemInfo.pixelRatio || 1
				const screenWidth = systemInfo.screenWidth
				const screenHeight = systemInfo.screenHeight

				// 获取 canvas 实例
				const query = uni.createSelectorQuery().in(this)
				query.select('#home-bg-lottie-canvas')
					.fields({ node: true, size: true })
					.exec(res => {
						console.log('Home 背景 Canvas 查询结果:', res)

						if (res[0] && res[0].node) {
							const canvas = res[0].node
							console.log('Home 背景 Canvas 实例:', canvas)

							try {
								// 设置 Canvas 为全屏尺寸
								canvas.width = screenWidth * dpr
								canvas.height = screenHeight * dpr

								const context = canvas.getContext('2d')
								context.scale(dpr, dpr)

								console.log('Home 背景 Canvas 全屏尺寸:', canvas.width, canvas.height)

								// 让 lottie 绑定 canvas
								lottie.setup(canvas)
								console.log('Home 背景 Lottie setup 完成')

								// 直接使用本地导入的 JSON 对象
								const animation = lottie.loadAnimation({
									loop: true,
									autoplay: true,
									animationData: bgAnimationData,
									rendererSettings: {
										context,
										preserveAspectRatio: 'xMidYMid slice'
									}
								})

								console.log('Home 背景动画实例:', animation)

								// 监听动画事件
								animation.addEventListener('DOMLoaded', () => {
									console.log('✅ Home 背景动画 DOM 加载完成')
								})

								animation.addEventListener('error', (error) => {
									console.error('❌ Home 背景动画加载错误:', error)
								})
								
								// 立即播放
								animation.play()
								console.log('✅ Home 背景动画已启动播放')

							} catch (error) {
								console.error('Home 背景 Canvas 初始化错误:', error)
							}
						} else {
							console.error('Home 背景 Canvas 实例获取失败:', res)
						}
					})
				// #endif
			}
		}
	}
</script>
<style>
	.home-container {
		min-height: 100vh;
		/* 波普风格渐变背景 */
		background: linear-gradient(135deg, #FFE5F0 0%, #E5F3FF 50%, #FFF5E5 100%);
		padding: 20rpx;
		padding-top: 120rpx;
		padding-bottom: 40rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow: hidden;
	}
	
	/* 全屏 Lottie 背景动画 */
	.fullscreen-lottie-bg {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;
		overflow: hidden;
		opacity: 0.4;
		mix-blend-mode: multiply;
	}

	/* 背景 Canvas 样式 */
	.bg-lottie-canvas {
		position: absolute;
		top: 0;
		left: 0;
		display: block;
		width: 100% !important;
		height: 100% !important;
		pointer-events: none;
	}
	
	.home-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		/* 波普风格光线层效果 */
		background:
			radial-gradient(ellipse 600rpx 400rpx at 60% 15%, rgba(255, 217, 61, 0.1) 0%, transparent 35%),
			radial-gradient(ellipse 500rpx 500rpx at 20% 70%, rgba(255, 107, 157, 0.08) 0%, transparent 45%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 50%, rgba(78, 205, 196, 0.05) 100%);
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

	/* 直播播放器样式 */
	.live-player {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
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
	
	.play-icon-img {
		width: 60rpx;
		height: 60rpx;
		transition: transform 0.3s ease;
	}
	
	.play-button:active .play-icon-img {
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
	
	/* ==================== HLS 状态指示器样式 ==================== */
	.hls-status-indicator {
		position: absolute;
		bottom: 100rpx;
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		animation: hlsStatusSlideIn 0.3s ease-out;
	}
	
	@keyframes hlsStatusSlideIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(20rpx);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
	
	.hls-status-text {
		padding: 16rpx 32rpx;
		border-radius: 40rpx;
		font-size: 28rpx;
		color: #fff;
		backdrop-filter: blur(20rpx);
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
		white-space: nowrap;
		font-weight: 500;
		letter-spacing: 1rpx;
	}
	
	.hls-status-text.info {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
		border: 2rpx solid rgba(147, 197, 253, 0.5);
	}
	
	.hls-status-text.success {
		background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9));
		border: 2rpx solid rgba(134, 239, 172, 0.5);
	}
	
	.hls-status-text.warning {
		background: linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9));
		border: 2rpx solid rgba(253, 224, 71, 0.5);
	}
	
	.hls-status-text.error {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
		border: 2rpx solid rgba(252, 165, 165, 0.5);
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
		color: #333333;
		background: 
			linear-gradient(135deg, 
				#FFD4E5 0%, 
				#E5D4FF 35%, 
				#D4E5FF 70%, 
				#D4FFF5 100%);
		position: relative;
		overflow: hidden;
		border: 3rpx solid #999999;
		box-shadow: 
			0 6rpx 16rpx rgba(0, 0, 0, 0.08),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.5);
	}
	
	.video-placeholder::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: 
			radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
			radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
		pointer-events: none;
		animation: shimmer 3s ease-in-out infinite;
	}
	
	.placeholder-icon {
		font-size: 80rpx;
		margin-bottom: 20rpx;
		opacity: 0.85;
		text-shadow: 
			2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1),
			0 0 20rpx rgba(255, 255, 255, 0.3);
		position: relative;
		z-index: 1;
		animation: popBounce 2s ease-in-out infinite;
	}
	
	.placeholder-text {
		font-size: 32rpx;
		font-weight: bold;
		opacity: 0.9;
		color: #666666;
		text-shadow: 
			1rpx 1rpx 2rpx rgba(0, 0, 0, 0.1),
			0 0 10rpx rgba(255, 255, 255, 0.5);
		position: relative;
		z-index: 1;
		letter-spacing: 3rpx;
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

	.collapse-icon-img {
		width: 40rpx;
		height: 40rpx;
		transition: transform 0.3s ease;
	}

	.collapse-btn-floating:active .collapse-icon-img {
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


	/* 动态火焰分界线 - Lottie 动画 */
	.flame-divider {
		position: absolute;
		top: 50%;
		width: 200rpx;
		height: 200rpx;
		transition: left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
		z-index: 20;
		pointer-events: none;
		overflow: visible;
		will-change: left;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		transform: translate3d(-50%, -50%, 0);
		-webkit-transform: translate3d(-50%, -50%, 0);
		transform-origin: center center;
	}
	/* Lottie 火焰容器 */
	.lottie-fire-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		will-change: auto;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		-webkit-perspective: 1000;
		perspective: 1000;
	}
	
	.lottie-fire-canvas,
	.lottie-fire-wrapper {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		overflow: hidden;
		position: relative;
		z-index: 1;
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
		will-change: transform;
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
	
	.flame-divider.divider-hit .lottie-fire-container {
		animation: fireShake 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	
	@keyframes fireShake {
		0%, 100% { 
			transform: translateZ(0) scale(1);
		}
		10%, 30%, 50%, 70%, 90% { 
			transform: translateZ(0) scale(1.15) rotate(-2deg);
		}
		20%, 40%, 60%, 80% { 
			transform: translateZ(0) scale(1.15) rotate(2deg);
		}
	}

	@keyframes dividerExplosion {
		0% {
			filter: drop-shadow(0 0 12rpx rgba(255, 0, 255, 0.6))
			        drop-shadow(0 0 18rpx rgba(255, 69, 0, 0.3));
			transform: translate3d(-50%, -50%, 0) scale(1);
		}
		15% {
			filter: drop-shadow(0 0 30rpx rgba(255, 0, 255, 0.95))
			        drop-shadow(0 0 45rpx rgba(255, 69, 0, 0.85))
			        drop-shadow(0 0 60rpx rgba(255, 100, 0, 0.6));
			transform: translate3d(-50%, -50%, 0) scale(1.2);
		}
		35% {
			filter: drop-shadow(0 0 40rpx rgba(255, 0, 255, 1))
			        drop-shadow(0 0 60rpx rgba(255, 69, 0, 0.95))
			        drop-shadow(0 0 80rpx rgba(255, 100, 0, 0.8))
			        drop-shadow(0 0 100rpx rgba(255, 200, 0, 0.5));
			transform: translate3d(-50%, -50%, 0) scale(1.35);
		}
		50% {
			filter: drop-shadow(0 0 50rpx rgba(255, 0, 255, 1))
			        drop-shadow(0 0 70rpx rgba(255, 69, 0, 1))
			        drop-shadow(0 0 100rpx rgba(255, 100, 0, 0.9))
			        drop-shadow(0 0 130rpx rgba(255, 200, 0, 0.6))
			        drop-shadow(0 0 150rpx rgba(255, 150, 0, 0.3));
			transform: translate3d(-50%, -50%, 0) scale(1.45);
		}
		75% {
			filter: drop-shadow(0 0 35rpx rgba(255, 0, 255, 0.9))
			        drop-shadow(0 0 50rpx rgba(255, 69, 0, 0.8))
			        drop-shadow(0 0 70rpx rgba(255, 100, 0, 0.6));
			transform: translate3d(-50%, -50%, 0) scale(1.2);
		}
		100% {
			filter: drop-shadow(0 0 10rpx rgba(255, 0, 255, 0.6))
			        drop-shadow(0 0 15rpx rgba(255, 69, 0, 0.3));
			transform: translate3d(-50%, -50%, 0) scale(1);
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

	.expand-icon-img {
		width: 32rpx;
		height: 32rpx;
		margin-right: 8rpx;
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
		background: linear-gradient(135deg, #fff9f5 0%, #ffeef0 100%);
		border: 3rpx solid #ffb3d1;
		border-radius: 30rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(255, 179, 209, 0.3), 
		            0 4rpx 12rpx rgba(255, 107, 157, 0.2),
		            inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
		height: 600rpx;
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
		background: linear-gradient(135deg, rgba(255, 179, 209, 0.15) 0%, rgba(255, 107, 157, 0.1) 100%);
		pointer-events: none;
	}

	/* AI对话区域展开状态 - 简单增加高度 */
	.main-content.expanded .ai-chat-container {
		height: 900rpx; /* 增加高度，提供更多空间 */
	}

	.chat-header {
		background: linear-gradient(135deg, #FF6B9D 0%, #FF1493 50%, #FFB6C1 100%);
		padding: 20rpx 24rpx;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 2rpx solid rgba(255, 255, 255, 0.3);
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 157, 0.3);
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
		font-size: 44rpx;
		margin-right: 16rpx;
		filter: drop-shadow(0 3rpx 6rpx rgba(255, 107, 157, 0.3));
		position: relative;
		z-index: 1;
		animation: aiFloat 3s ease-in-out infinite;
	}
	
	@keyframes aiFloat {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4rpx); }
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
		background: linear-gradient(135deg, #FF1493, #FF6B9D);
		animation: pulse 2s infinite;
		box-shadow: 0 0 12rpx rgba(255, 107, 157, 0.5);
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
		padding: 28rpx 24rpx;
		overflow-y: auto;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #fff5f9 0%, #ffeef0 100%);
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
		background: linear-gradient(135deg, #ffe5f0 0%, #ffb6d6 100%);
		border-bottom-left-radius: 12rpx;
		border-color: rgba(255, 107, 157, 0.25);
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 157, 0.15);
	}

	.message-item.right .message-bubble {
		background: linear-gradient(135deg, #e5f3ff 0%, #b3e0ff 100%);
		border-bottom-right-radius: 12rpx;
		border-color: rgba(0, 191, 255, 0.25);
		box-shadow: 0 4rpx 12rpx rgba(0, 191, 255, 0.15);
	}

	.message-bubble:hover {
		transform: translateY(-2rpx);
		box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.12);
	}

	.message-bubble:active {
		transform: scale(0.98) translateY(0);
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
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
		background-color: #FFFFFF !important;
		background: #FFFFFF !important;
		border: 6rpx solid #000;
		border-radius: 30rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		display: flex;
		flex-direction: column;
		opacity: 1 !important;
		position: relative;
		z-index: 10;
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
		justify-content: center;
		align-items: center;
	}

	.lottie-button-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.3s ease;
		position: relative;
		width: 100%;
	}

	.lottie-button-container:hover {
		transform: scale(1.05);
	}

	.lottie-button-container:active {
		transform: scale(0.95);
	}

	.lottie-button-container.disabled {
		opacity: 0.5;
		pointer-events: none;
		cursor: not-allowed;
	}

	.lottie-button-container.voted {
		transform: scale(1.1);
	}

	/* 动画外框 - 直接包裹动画 */
	.animation-frame {
		display: inline-block;
		border-radius: 20rpx;
		padding: 8rpx;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* 正方按钮外框 */
	.left-frame {
		background: linear-gradient(135deg, 
			rgba(255, 105, 180, 0.15) 0%, 
			rgba(255, 20, 147, 0.25) 50%, 
			rgba(255, 182, 193, 0.15) 100%);
		border: 2rpx solid rgba(255, 20, 147, 0.4);
		box-shadow: 
			0 4rpx 15rpx rgba(255, 20, 147, 0.25),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	}

	/* 反方按钮外框 */
	.right-frame {
		background: linear-gradient(135deg, 
			rgba(0, 191, 255, 0.15) 0%, 
			rgba(135, 206, 235, 0.25) 50%, 
			rgba(176, 224, 230, 0.15) 100%);
		border: 2rpx solid rgba(0, 191, 255, 0.4);
		box-shadow: 
			0 4rpx 15rpx rgba(0, 191, 255, 0.25),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	}



	/* 悬停效果 */
	.lottie-button-container:hover .animation-frame {
		transform: translateY(-2rpx) scale(1.05);
	}

	.lottie-button-container:hover .left-frame {
		box-shadow: 
			0 6rpx 20rpx rgba(255, 20, 147, 0.4),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.4);
	}

	.lottie-button-container:hover .right-frame {
		box-shadow: 
			0 6rpx 20rpx rgba(0, 191, 255, 0.4),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.4);
	}

	/* 已投票状态 */
	.lottie-button-container.voted .animation-frame {
		background: linear-gradient(135deg, 
			rgba(255, 215, 0, 0.25) 0%, 
			rgba(255, 165, 0, 0.35) 50%, 
			rgba(255, 140, 0, 0.25) 100%);
		border-color: rgba(255, 215, 0, 0.5);
		box-shadow: 
			0 4rpx 15rpx rgba(255, 215, 0, 0.4),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.4);
		animation: votedGlow 2s ease-in-out infinite alternate;
	}

	@keyframes votedGlow {
		0% {
			box-shadow: 
				0 4rpx 15rpx rgba(255, 215, 0, 0.4),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.4);
		}
		100% {
			box-shadow: 
				0 6rpx 20rpx rgba(255, 215, 0, 0.6),
				inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
		}
	}

	/* 禁用状态 */
	.lottie-button-container.disabled .animation-frame {
		background: linear-gradient(135deg, 
			rgba(200, 200, 200, 0.15) 0%, 
			rgba(150, 150, 150, 0.25) 50%, 
			rgba(100, 100, 100, 0.15) 100%);
		border-color: rgba(150, 150, 150, 0.4);
		box-shadow: 
			0 2rpx 10rpx rgba(0, 0, 0, 0.15),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
	}















	/* 正方按钮特殊特效（超级强化东倒西歪效果） */
	.left-btn.click-effect {
		background: linear-gradient(135deg, #FF1493, #FF69B4, #FFB6C1, #FF1493);
		background-size: 300% 300%;
		animation: superLeftVoteEffect 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55), 
				   superGradientShift 2.5s ease infinite,
				   buttonShake 0.8s ease-in-out;
		box-shadow: 
			0 0 20rpx rgba(255, 20, 147, 0.6),
			0 0 40rpx rgba(255, 20, 147, 0.4),
			0 0 60rpx rgba(255, 20, 147, 0.2),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.3);
		transform: translateZ(0);
		position: relative;
		overflow: hidden;
	}

	/* 反方按钮特殊特效（超级强化东倒西歪效果） */
	.right-btn.click-effect {
		background: linear-gradient(135deg, #00BFFF, #87CEEB, #B0E0E6, #00BFFF);
		background-size: 300% 300%;
		animation: superRightVoteEffect 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55), 
				   superGradientShift 2.5s ease infinite,
				   buttonShake 0.8s ease-in-out;
		box-shadow: 
			0 0 20rpx rgba(0, 191, 255, 0.6),
			0 0 40rpx rgba(0, 191, 255, 0.4),
			0 0 60rpx rgba(0, 191, 255, 0.2),
			inset 0 2rpx 0 rgba(255, 255, 255, 0.3);
		transform: translateZ(0);
		position: relative;
		overflow: hidden;
	}

	/* 超级按钮摇晃动画 */
	@keyframes buttonShake {
		0%, 100% { transform: translateX(0) rotate(0deg); }
		10% { transform: translateX(-2rpx) rotate(-1deg); }
		20% { transform: translateX(2rpx) rotate(1deg); }
		30% { transform: translateX(-3rpx) rotate(-1.5deg); }
		40% { transform: translateX(3rpx) rotate(1.5deg); }
		50% { transform: translateX(-2rpx) rotate(-1deg); }
		60% { transform: translateX(2rpx) rotate(1deg); }
		70% { transform: translateX(-1rpx) rotate(-0.5deg); }
		80% { transform: translateX(1rpx) rotate(0.5deg); }
		90% { transform: translateX(-0.5rpx) rotate(-0.25deg); }
	}

	/* 超级渐变移动动画 */
	@keyframes superGradientShift {
		0% { background-position: 0% 50%; }
		25% { background-position: 100% 50%; }
		50% { background-position: 100% 100%; }
		75% { background-position: 0% 100%; }
		100% { background-position: 0% 50%; }
	}

	/* 超级正方按钮特效动画 */
	@keyframes superLeftVoteEffect {
		0% {
			transform: scale(1) rotate(0deg) skewY(0deg) translateZ(0);
			filter: brightness(1) saturate(1) hue-rotate(0deg);
			box-shadow: 
				0 0 20rpx rgba(255, 20, 147, 0.6),
				0 0 40rpx rgba(255, 20, 147, 0.4),
				0 0 60rpx rgba(255, 20, 147, 0.2);
		}
		15% {
			transform: scale(1.15) rotate(-8deg) skewY(-3deg) translateZ(0);
			filter: brightness(1.3) saturate(1.5) hue-rotate(10deg);
			box-shadow: 
				0 0 30rpx rgba(255, 20, 147, 0.8),
				0 0 60rpx rgba(255, 20, 147, 0.6),
				0 0 90rpx rgba(255, 20, 147, 0.4);
		}
		30% {
			transform: scale(1.2) rotate(10deg) skewY(4deg) translateZ(0);
			filter: brightness(1.4) saturate(1.8) hue-rotate(-15deg);
			box-shadow: 
				0 0 40rpx rgba(255, 20, 147, 1),
				0 0 80rpx rgba(255, 20, 147, 0.8),
				0 0 120rpx rgba(255, 20, 147, 0.6);
		}
		45% {
			transform: scale(1.1) rotate(-6deg) skewY(-2deg) translateZ(0);
			filter: brightness(1.2) saturate(1.3) hue-rotate(8deg);
			box-shadow: 
				0 0 25rpx rgba(255, 20, 147, 0.7),
				0 0 50rpx rgba(255, 20, 147, 0.5),
				0 0 75rpx rgba(255, 20, 147, 0.3);
		}
		60% {
			transform: scale(1.05) rotate(4deg) skewY(1.5deg) translateZ(0);
			filter: brightness(1.1) saturate(1.1) hue-rotate(-5deg);
			box-shadow: 
				0 0 20rpx rgba(255, 20, 147, 0.6),
				0 0 40rpx rgba(255, 20, 147, 0.4),
				0 0 60rpx rgba(255, 20, 147, 0.2);
		}
		75% {
			transform: scale(1.02) rotate(-2deg) skewY(-0.5deg) translateZ(0);
			filter: brightness(1.05) saturate(1.05) hue-rotate(2deg);
			box-shadow: 
				0 0 15rpx rgba(255, 20, 147, 0.5),
				0 0 30rpx rgba(255, 20, 147, 0.3),
				0 0 45rpx rgba(255, 20, 147, 0.1);
		}
		100% {
			transform: scale(1) rotate(0deg) skewY(0deg) translateZ(0);
			filter: brightness(1) saturate(1) hue-rotate(0deg);
			box-shadow: 
				0 0 20rpx rgba(255, 20, 147, 0.6),
				0 0 40rpx rgba(255, 20, 147, 0.4),
				0 0 60rpx rgba(255, 20, 147, 0.2);
		}
	}
	/* 超级反方按钮特效动画 */
	@keyframes superRightVoteEffect {
		0% {
			transform: scale(1) rotate(0deg) skewY(0deg) translateZ(0);
			filter: brightness(1) saturate(1) hue-rotate(0deg);
			box-shadow: 
				0 0 20rpx rgba(0, 191, 255, 0.6),
				0 0 40rpx rgba(0, 191, 255, 0.4),
				0 0 60rpx rgba(0, 191, 255, 0.2);
		}
		15% {
			transform: scale(1.15) rotate(8deg) skewY(3deg) translateZ(0);
			filter: brightness(1.3) saturate(1.5) hue-rotate(-10deg);
			box-shadow: 
				0 0 30rpx rgba(0, 191, 255, 0.8),
				0 0 60rpx rgba(0, 191, 255, 0.6),
				0 0 90rpx rgba(0, 191, 255, 0.4);
		}
		30% {
			transform: scale(1.2) rotate(-10deg) skewY(-4deg) translateZ(0);
			filter: brightness(1.4) saturate(1.8) hue-rotate(15deg);
			box-shadow: 
				0 0 40rpx rgba(0, 191, 255, 1),
				0 0 80rpx rgba(0, 191, 255, 0.8),
				0 0 120rpx rgba(0, 191, 255, 0.6);
		}
		45% {
			transform: scale(1.1) rotate(6deg) skewY(2deg) translateZ(0);
			filter: brightness(1.2) saturate(1.3) hue-rotate(-8deg);
			box-shadow: 
				0 0 25rpx rgba(0, 191, 255, 0.7),
				0 0 50rpx rgba(0, 191, 255, 0.5),
				0 0 75rpx rgba(0, 191, 255, 0.3);
		}
		60% {
			transform: scale(1.05) rotate(-4deg) skewY(-1.5deg) translateZ(0);
			filter: brightness(1.1) saturate(1.1) hue-rotate(5deg);
			box-shadow: 
				0 0 20rpx rgba(0, 191, 255, 0.6),
				0 0 40rpx rgba(0, 191, 255, 0.4),
				0 0 60rpx rgba(0, 191, 255, 0.2);
		}
		75% {
			transform: scale(1.02) rotate(2deg) skewY(0.5deg) translateZ(0);
			filter: brightness(1.05) saturate(1.05) hue-rotate(-2deg);
			box-shadow: 
				0 0 15rpx rgba(0, 191, 255, 0.5),
				0 0 30rpx rgba(0, 191, 255, 0.3),
				0 0 45rpx rgba(0, 191, 255, 0.1);
		}
		100% {
			transform: scale(1) rotate(0deg) skewY(0deg) translateZ(0);
			filter: brightness(1) saturate(1) hue-rotate(0deg);
			box-shadow: 
				0 0 20rpx rgba(0, 191, 255, 0.6),
				0 0 40rpx rgba(0, 191, 255, 0.4),
				0 0 60rpx rgba(0, 191, 255, 0.2);
		}
	}

	@keyframes leftVoteEffectPro {
		0% {
			transform: scale(1) rotate(0deg) skewY(0deg);
			filter: brightness(1) saturate(1);
			box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.4);
		}
		10% {
			transform: scale(1.15) rotate(-8deg) skewY(-2deg);
			filter: brightness(1.3) saturate(1.4);
			box-shadow: 0 12rpx 30rpx rgba(102, 126, 234, 0.6);
		}
		25% {
			transform: scale(1.2) rotate(6deg) skewY(3deg);
			filter: brightness(1.4) saturate(1.5);
			box-shadow: 0 16rpx 40rpx rgba(102, 126, 234, 0.8);
		}
		40% {
			transform: scale(1.12) rotate(-5deg) skewY(-2deg);
			filter: brightness(1.25) saturate(1.3);
			box-shadow: 0 12rpx 30rpx rgba(102, 126, 234, 0.6);
		}
		55% {
			transform: scale(1.08) rotate(4deg) skewY(1.5deg);
			filter: brightness(1.15) saturate(1.2);
			box-shadow: 0 10rpx 24rpx rgba(102, 126, 234, 0.5);
		}
		70% {
			transform: scale(1.04) rotate(-2deg) skewY(-1deg);
			filter: brightness(1.08) saturate(1.1);
			box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.4);
		}
		85% {
			transform: scale(1.02) rotate(1deg) skewY(0.5deg);
			filter: brightness(1.02) saturate(1.05);
			box-shadow: 0 6rpx 16rpx rgba(102, 126, 234, 0.3);
		}
		100% {
			transform: scale(1) rotate(0deg) skewY(0deg);
			filter: brightness(1) saturate(1);
			box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.4);
		}
	}

	/* 反方按钮特殊特效（强化东倒西歪效果） */
	.right-btn.click-effect {
		background: linear-gradient(135deg, #f093fb, #f5576c, #ffb3d1);
		background-size: 200% 200%;
		animation: rightVoteEffectPro 1s cubic-bezier(0.68, -0.55, 0.265, 1.55), gradientShift 2s ease infinite;
	}
	@keyframes rightVoteEffectPro {
		0% {
			transform: scale(1) rotate(0deg) skewY(0deg);
			filter: brightness(1) saturate(1);
			box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.4);
		}
		10% {
			transform: scale(1.15) rotate(8deg) skewY(2deg);
			filter: brightness(1.3) saturate(1.4);
			box-shadow: 0 12rpx 30rpx rgba(240, 147, 251, 0.6);
		}
		25% {
			transform: scale(1.2) rotate(-6deg) skewY(-3deg);
			filter: brightness(1.4) saturate(1.5);
			box-shadow: 0 16rpx 40rpx rgba(240, 147, 251, 0.8);
		}
		40% {
			transform: scale(1.12) rotate(5deg) skewY(2deg);
			filter: brightness(1.25) saturate(1.3);
			box-shadow: 0 12rpx 30rpx rgba(240, 147, 251, 0.6);
		}
		55% {
			transform: scale(1.08) rotate(-4deg) skewY(-1.5deg);
			filter: brightness(1.15) saturate(1.2);
			box-shadow: 0 10rpx 24rpx rgba(240, 147, 251, 0.5);
		}
		70% {
			transform: scale(1.04) rotate(2deg) skewY(1deg);
			filter: brightness(1.08) saturate(1.1);
			box-shadow: 0 8rpx 20rpx rgba(240, 147, 251, 0.4);
		}
		85% {
			transform: scale(1.02) rotate(-1deg) skewY(-0.5deg);
			filter: brightness(1.02) saturate(1.05);
			box-shadow: 0 6rpx 16rpx rgba(240, 147, 251, 0.3);
		}
		100% {
			transform: scale(1) rotate(0deg) skewY(0deg);
			filter: brightness(1) saturate(1);
			box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.4);
		}
	}
	/* 已投票按钮的特殊效果（强化版） */
	.vote-btn.voted.click-effect {
		background: linear-gradient(135deg, #FFD700, #FFA500, #FF8C00);
		background-size: 200% 200%;
		animation: votedEffectPro 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55), gradientShift 1.5s ease infinite;
		box-shadow: 0 8rpx 20rpx rgba(255, 215, 0, 0.4);
	}

	@keyframes votedEffectPro {
		0% {
			transform: scale(1) rotate(0deg) skewY(0deg);
			box-shadow: 0 8rpx 20rpx rgba(255, 215, 0, 0.4);
			filter: brightness(1) drop-shadow(0 0 0px rgba(255, 215, 0, 0));
		}
		12% {
			transform: scale(1.12) rotate(-6deg) skewY(-2deg);
			box-shadow: 0 14rpx 28rpx rgba(255, 215, 0, 0.6);
			filter: brightness(1.2) drop-shadow(0 0 15rpx rgba(255, 215, 0, 0.6));
		}
		25% {
			transform: scale(1.15) rotate(7deg) skewY(3deg);
			box-shadow: 0 18rpx 36rpx rgba(255, 215, 0, 0.7);
			filter: brightness(1.3) drop-shadow(0 0 20rpx rgba(255, 215, 0, 0.8));
		}
		40% {
			transform: scale(1.1) rotate(-4deg) skewY(-2deg);
			box-shadow: 0 14rpx 28rpx rgba(255, 215, 0, 0.6);
			filter: brightness(1.2) drop-shadow(0 0 15rpx rgba(255, 215, 0, 0.6));
		}
		55% {
			transform: scale(1.08) rotate(3deg) skewY(1.5deg);
			box-shadow: 0 12rpx 24rpx rgba(255, 215, 0, 0.5);
			filter: brightness(1.1) drop-shadow(0 0 10rpx rgba(255, 215, 0, 0.4));
		}
		70% {
			transform: scale(1.04) rotate(-2deg) skewY(-1deg);
			box-shadow: 0 10rpx 20rpx rgba(255, 215, 0, 0.45);
			filter: brightness(1.05) drop-shadow(0 0 5rpx rgba(255, 215, 0, 0.3));
		}
		85% {
			transform: scale(1.02) rotate(1deg) skewY(0.5deg);
			box-shadow: 0 9rpx 22rpx rgba(255, 215, 0, 0.4);
			filter: brightness(1.02) drop-shadow(0 0 3rpx rgba(255, 215, 0, 0.2));
		}
		100% {
			transform: scale(1) rotate(0deg) skewY(0deg);
			box-shadow: 0 8rpx 20rpx rgba(255, 215, 0, 0.4);
			filter: brightness(1) drop-shadow(0 0 0px rgba(255, 215, 0, 0));
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
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8rpx;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.nav-icon-img {
		width: 48rpx;
		height: 48rpx;
		transition: all 0.3s ease;
	}

	.nav-item.active .nav-icon {
		transform: scale(1.15);
	}

	.nav-item.active .nav-icon-img {
		transform: scale(1.1);
		filter: drop-shadow(0 2rpx 6rpx rgba(255, 107, 157, 0.4));
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
		z-index: 9998;
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
		background: linear-gradient(135deg, #fff9f5 0%, #ffeef0 100%);
		border: 3rpx solid #ffb3d1;
		border-radius: 28rpx;
		width: 100%;
		max-width: 640rpx;
		max-height: 85vh;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(255, 179, 209, 0.3), 
		            0 4rpx 12rpx rgba(255, 107, 157, 0.2),
		            inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
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
		background: linear-gradient(135deg, #FF6B9D 0%, #FF1493 50%, #FFB6C1 100%);
		padding: 32rpx 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-bottom: 2rpx solid rgba(255, 255, 255, 0.3);
		position: relative;
		overflow: hidden;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 157, 0.3);
	}
	
	.modal-header::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%);
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
		padding: 30rpx 24rpx;
		background: #fafafa;
		box-sizing: border-box;
		width: 100%;
	}

	.summary-section {
		margin-bottom: 28rpx;
		background: #ffffff;
		border: 2rpx solid #f0f0f0;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
		box-sizing: border-box;
		width: 100%;
	}

	.comments-section {
		margin-bottom: 0;
		background: #ffffff;
		border: 2rpx solid #f0f0f0;
		border-radius: 16rpx;
		padding: 20rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
		box-sizing: border-box;
	}

	.section-title {
		display: flex;
		align-items: center;
		margin-bottom: 16rpx;
		padding-bottom: 12rpx;
		border-bottom: 1rpx solid #e5e5e5;
	}

	.title-icon {
		font-size: 32rpx;
		margin-right: 10rpx;
	}

	.title-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #333;
		letter-spacing: 0.2rpx;
	}

	.summary-content {
		background: #f8f9fa;
		border: 1rpx solid #e0e0e0;
		border-radius: 12rpx;
		padding: 18rpx;
		position: relative;
	}

	.summary-text {
		font-size: 28rpx;
		line-height: 1.6;
		color: #333;
		display: block;
		font-weight: 400;
		letter-spacing: 0.2rpx;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		width: 100%;
		box-sizing: border-box;
	}

	.comment-item {
		background: #f9f9f9;
		border: 1rpx solid #e5e5e5;
		border-radius: 12rpx;
		padding: 18rpx;
		transition: all 0.2s ease;
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
		width: 3rpx;
		height: 100%;
		background: #667eea;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.comment-item:hover {
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
		border-color: #d0d0d0;
	}

	.comment-item:hover::before {
		opacity: 1;
	}

	.comment-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12rpx;
		padding-bottom: 8rpx;
		border-bottom: 1rpx solid #e0e0e0;
	}

	.user-info {
		display: flex;
		align-items: center;
	}

	.user-avatar {
		font-size: 28rpx;
		margin-right: 10rpx;
	}

	.user-name {
		font-size: 26rpx;
		font-weight: 600;
		color: #333;
		letter-spacing: 0.2rpx;
	}

	.comment-time {
		font-size: 22rpx;
		color: #999;
		font-weight: 400;
	}

	.comment-header-right {
		display: flex;
		align-items: center;
		gap: 16rpx;
	}

	.comment-delete-btn {
		padding: 6rpx 12rpx;
		border-radius: 8rpx;
		background: rgba(255, 71, 87, 0.1);
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.comment-delete-btn:active {
		background: rgba(255, 71, 87, 0.2);
		transform: scale(0.95);
	}

	.delete-icon {
		font-size: 24rpx;
		opacity: 0.8;
	}

	.comment-text {
		font-size: 26rpx;
		color: #555;
		line-height: 1.5;
		display: block;
		font-weight: 400;
		letter-spacing: 0.1rpx;
	}

	.empty-comments {
		text-align: center;
		padding: 40rpx 32rpx;
		background: #f9f9f9;
		border: 1rpx dashed #d0d0d0;
		border-radius: 12rpx;
		position: relative;
	}

	.empty-comments::before {
		content: '💭';
		display: block;
		font-size: 40rpx;
		margin-bottom: 12rpx;
		opacity: 0.5;
	}

	.empty-text {
		font-size: 26rpx;
		color: #999;
		font-weight: 400;
		letter-spacing: 0.2rpx;
	}

	.modal-footer {
		background: #fafafa;
		padding: 20rpx 24rpx;
		border-top: 1rpx solid #e0e0e0;
		display: flex;
		gap: 20rpx;
	}

	.footer-btn {
		flex: 1;
		height: 80rpx;
		border: 2rpx solid transparent;
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
		font-weight: 500;
		letter-spacing: 0.3rpx;
	}

	.footer-btn:active {
		transform: scale(0.98);
	}

	.cancel-btn {
		background: #ffffff;
		border-color: #d0d0d0;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
	}

	.cancel-btn:hover {
		background: #f5f5f5;
		border-color: #bbb;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	}

	.cancel-btn .btn-text {
		color: #333;
		font-size: 28rpx;
	}

	.confirm-btn {
		background: linear-gradient(135deg, #FF6B9D 0%, #FF1493 100%);
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 157, 0.3);
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
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s ease;
	}

	.confirm-btn:hover::before {
		left: 100%;
	}

	.confirm-btn:hover {
		box-shadow: 0 6rpx 16rpx rgba(255, 107, 157, 0.4);
		transform: translateY(-1rpx);
	}

	.confirm-btn .btn-text {
		color: #ffffff;
		font-size: 28rpx;
		text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.15);
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
		z-index: 99999;  /* 提高到最高层级 */
		overflow: visible;  /* 改为 visible，不裁剪子元素 */
	}

	/* Lottie 特效容器 */
	.lottie-effect {
		position: fixed;
		width: 200rpx;  /* 从 150rpx 增加到 200rpx */
		height: 400rpx; /* 从 320rpx 增加到 400rpx */
		pointer-events: none;
		z-index: 9999;
		will-change: transform, opacity;
		transform: translateZ(0);
	}

	/* Lottie Canvas 样式 */
	.lottie-heart-canvas {
		width: 100%;
		height: 100%;
		display: block;
		background: transparent;
		visibility: visible;
		opacity: 1;
	}

	/* Lottie Wrapper 样式（非微信环境） */
	.lottie-heart-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
	}

	/* 左侧 Lottie 特效样式（正方） */
	.lottie-effect-left {
		animation: lottieFloatUpLeft var(--duration, 3s) cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
		animation-delay: var(--delay, 0s);
	}

	/* 右侧 Lottie 特效样式（反方） */
	.lottie-effect-right {
		animation: lottieFloatUpRight var(--duration, 3s) cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
		animation-delay: var(--delay, 0s);
	}

	/* Lottie 爱心动画 - 左侧向上飘动 */
	@keyframes lottieFloatUpLeft {
		0% {
			opacity: 1;
			transform: translate(0, 0) scale(1);
		}
		20% {
			opacity: 1;
			transform: translate(-20rpx, -150rpx) scale(1.05);
		}
		40% {
			opacity: 0.9;
			transform: translate(-30rpx, -300rpx) scale(1.1);
		}
		60% {
			opacity: 0.7;
			transform: translate(-20rpx, -450rpx) scale(1.05);
		}
		80% {
			opacity: 0.4;
			transform: translate(-10rpx, -600rpx) scale(1);
		}
		100% {
			opacity: 0;
			transform: translate(0, -750rpx) scale(0.9);
		}
	}

	/* Lottie 爱心动画 - 右侧向上飘动 */
	@keyframes lottieFloatUpRight {
		0% {
			opacity: 1;
			transform: translate(0, 0) scale(1);
		}
		20% {
			opacity: 1;
			transform: translate(20rpx, -150rpx) scale(1.05);
		}
		40% {
			opacity: 0.9;
			transform: translate(30rpx, -300rpx) scale(1.1);
		}
		60% {
			opacity: 0.7;
			transform: translate(20rpx, -450rpx) scale(1.05);
		}
		80% {
			opacity: 0.4;
			transform: translate(10rpx, -600rpx) scale(1);
		}
		100% {
			opacity: 0;
			transform: translate(0, -750rpx) scale(0.9);
		}
	}
	/* 备用 emoji 爱心动画 */
	@keyframes floatUpHeart {
		0% {
			opacity: 1;
			transform: translateY(0) scale(0.5) rotate(0deg);
		}
		20% {
			opacity: 1;
			transform: translateY(-100px) scale(1) rotate(10deg);
		}
		40% {
			opacity: 0.9;
			transform: translateY(-200px) scale(1.2) rotate(-5deg);
		}
		60% {
			opacity: 0.7;
			transform: translateY(-300px) scale(1.1) rotate(8deg);
		}
		80% {
			opacity: 0.4;
			transform: translateY(-400px) scale(1) rotate(-3deg);
		}
		100% {
			opacity: 0;
			transform: translateY(-500px) scale(0.8) rotate(0deg);
		}
	}
	
	/* emoji 爱心样式 */
	.emoji-heart {
		position: absolute;
		pointer-events: none;
		z-index: 10000;
		text-shadow: 0 0 10px rgba(255, 105, 180, 0.8);
		will-change: transform, opacity;
	}

	/* 增强的向上飘动动画 - 左侧（带复杂的路径和旋转） */
	@keyframes floatUpWithWobbleLeft {
		0% {
			opacity: 1;
			transform:
				translate(0, 0)
				scale(0)
				rotate(0deg)
				perspective(1000px)
				rotateX(0deg)
				rotateY(0deg);
			filter: blur(0px) brightness(1.2);
		}
		5% {
			opacity: 1;
			transform:
				translate(var(--spread-x, 0), calc(var(--spread-y, 0) * 0.5))
				scale(1.2)
				rotate(calc(var(--rotation, 0deg) * 0.1))
				perspective(1000px)
				rotateX(5deg)
				rotateY(5deg);
			filter: blur(0px) brightness(1.3);
		}
		20% {
			opacity: 1;
			transform:
				translate(calc(var(--spread-x, 0) * 0.8), calc(var(--spread-y, 0) * 0.6))
				scale(1.1)
				rotate(calc(var(--rotation, 0deg) * 0.3))
				perspective(1000px)
				rotateX(8deg)
				rotateY(8deg);
			filter: blur(0px) brightness(1.2);
		}
		40% {
			opacity: 0.95;
			transform:
				translate(calc(var(--spread-x, 0) * 0.5), calc(var(--spread-y, 0) * 0.2))
				scale(1.05)
				rotate(calc(var(--rotation, 0deg) * 0.6))
				perspective(1000px)
				rotateX(10deg)
				rotateY(-5deg);
			filter: blur(0px) brightness(1.1);
		}
		60% {
			opacity: 0.7;
			transform:
				translate(calc(var(--spread-x, 0) * 0.2), calc(var(--spread-y, 0) * -0.3))
				scale(1)
				rotate(calc(var(--rotation, 0deg) * 0.9))
				perspective(1000px)
				rotateX(12deg)
				rotateY(3deg);
			filter: blur(1px) brightness(1);
		}
		80% {
			opacity: 0.3;
			transform:
				translate(calc(var(--spread-x, 0) * -0.2), calc(var(--spread-y, 0) * -0.8))
				scale(0.8)
				rotate(var(--rotation, 0deg))
				perspective(1000px)
				rotateX(15deg)
				rotateY(10deg);
			filter: blur(2px) brightness(0.9);
		}
		100% {
			opacity: 0;
			transform:
				translate(calc(var(--spread-x, 0) * -0.5), calc(var(--spread-y, 0) * -1.5))
				scale(0.2)
				rotate(calc(var(--rotation, 0deg) * 1.2))
				perspective(1000px)
				rotateX(20deg)
				rotateY(15deg);
			filter: blur(3px) brightness(0.5);
		}
	}
	/* 增强的向上飘动动画 - 右侧（带相反的旋转） */
	@keyframes floatUpWithWobbleRight {
		0% {
			opacity: 1;
			transform:
				translate(0, 0)
				scale(0)
				rotate(0deg)
				perspective(1000px)
				rotateX(0deg)
				rotateY(0deg);
			filter: blur(0px) brightness(1.2);
		}
		5% {
			opacity: 1;
			transform:
				translate(var(--spread-x, 0), calc(var(--spread-y, 0) * 0.5))
				scale(1.2)
				rotate(calc(var(--rotation, 0deg) * 0.1))
				perspective(1000px)
				rotateX(5deg)
				rotateY(-5deg);
			filter: blur(0px) brightness(1.3);
		}
		20% {
			opacity: 1;
			transform:
				translate(calc(var(--spread-x, 0) * 0.8), calc(var(--spread-y, 0) * 0.6))
				scale(1.1)
				rotate(calc(var(--rotation, 0deg) * 0.3))
				perspective(1000px)
				rotateX(8deg)
				rotateY(-8deg);
			filter: blur(0px) brightness(1.2);
		}
		40% {
			opacity: 0.95;
			transform:
				translate(calc(var(--spread-x, 0) * 0.5), calc(var(--spread-y, 0) * 0.2))
				scale(1.05)
				rotate(calc(var(--rotation, 0deg) * 0.6))
				perspective(1000px)
				rotateX(10deg)
				rotateY(5deg);
			filter: blur(0px) brightness(1.1);
		}
		60% {
			opacity: 0.7;
			transform:
				translate(calc(var(--spread-x, 0) * 0.2), calc(var(--spread-y, 0) * -0.3))
				scale(1)
				rotate(calc(var(--rotation, 0deg) * 0.9))
				perspective(1000px)
				rotateX(12deg)
				rotateY(-3deg);
			filter: blur(1px) brightness(1);
		}
		80% {
			opacity: 0.3;
			transform:
				translate(calc(var(--spread-x, 0) * -0.2), calc(var(--spread-y, 0) * -0.8))
				scale(0.8)
				rotate(var(--rotation, 0deg))
				perspective(1000px)
				rotateX(15deg)
				rotateY(-10deg);
			filter: blur(2px) brightness(0.9);
		}
		100% {
			opacity: 0;
			transform:
				translate(calc(var(--spread-x, 0) * -0.5), calc(var(--spread-y, 0) * -1.5))
				scale(0.2)
				rotate(calc(var(--rotation, 0deg) * 1.2))
				perspective(1000px)
				rotateX(20deg)
				rotateY(-15deg);
			filter: blur(3px) brightness(0.5);
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

	/* 预设观点显示 - 紧凑版本 */
	.preset-section {
		background-color: #FFFFFF !important;
		background: #FFFFFF !important;
		border: 3rpx solid #000;
		border-radius: 12rpx;
		padding: 10rpx 12rpx;
		margin-bottom: 8rpx;
		box-shadow: 0 3rpx 10rpx rgba(0, 0, 0, 0.1);
		opacity: 1 !important;
		position: relative;
		z-index: 10;
	}

	.preset-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8rpx;
		position: relative;
	}

	.preset-title {
		font-size: 22rpx;
		font-weight: bold;
		color: #333;
		display: flex;
		align-items: center;
		gap: 4rpx;
	}

	.preset-subtitle {
		font-size: 18rpx;
		color: #666;
		display: block;
		line-height: 1.3;
		margin-bottom: 6rpx;
	}
	
	/* 辩题显示 - 紧凑版本 */
	.preset-debate-topic {
		margin-bottom: 8rpx;
		padding: 6rpx 8rpx;
		background: linear-gradient(135deg, rgba(255, 20, 147, 0.08) 0%, rgba(255, 140, 0, 0.08) 100%);
		border-radius: 6rpx;
		border: 1rpx solid rgba(255, 20, 147, 0.2);
	}
	
	.debate-topic-text {
		font-size: 20rpx;
		color: #333;
		font-weight: 600;
		line-height: 1.4;
		display: block;
		text-align: center;
	}

	.preset-slider-container {
		margin-bottom: 8rpx;
	}

	.slider-labels {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6rpx;
	}

	.slider-label {
		font-size: 18rpx;
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
		margin: 6rpx 0;
		padding: 0 8rpx;
	}

	.preset-slider {
		width: 100%;
	}

	.preset-info {
		text-align: center;
		margin-top: 6rpx;
	}

	.preset-info-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
	}

	.preset-percentage {
		font-size: 26rpx;
		font-weight: bold;
		color: #FF1493;
		display: inline-block;
	}

	.preset-desc {
		font-size: 18rpx;
		color: #666;
		display: inline-block;
	}
	
	/* 预设观点面板关闭按钮样式 */
	.preset-close-btn {
		width: 32rpx;
		height: 32rpx;
		background-color: #FF6B6B;
		border: 2rpx solid #000;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2rpx 6rpx rgba(255, 107, 107, 0.3);
		transition: all 0.3s ease;
		flex-shrink: 0;
	}
	
	.preset-close-btn:active {
		transform: scale(0.95);
		background-color: #FF5252;
	}
	
	.close-icon {
		font-size: 16rpx;
		color: #FFFFFF;
		font-weight: bold;
	}
	
	/* 预设观点票数信息显示 */
	.preset-votes-info {
		margin-top: 6rpx;
		padding: 6rpx 8rpx;
		background: linear-gradient(135deg, rgba(255, 214, 61, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%);
		border-radius: 6rpx;
		border: 1rpx solid #FFD93D;
	}
	
	.preset-votes-text {
		font-size: 18rpx;
		font-weight: bold;
		color: #FF1493;
		display: block;
		margin-bottom: 3rpx;
	}
	
	.preset-votes-detail {
		font-size: 16rpx;
		color: #666;
		display: block;
		line-height: 1.3;
	}
	
	/* 预设观点确定按钮容器 - 圆形按钮版本 */
	.preset-confirm-btn-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 8rpx 0;
	}
	
	.preset-confirm-btn-circle {
		width: 56rpx;
		height: 56rpx;
		background: linear-gradient(135deg, #FF1493 0%, #FF8C00 100%);
		border: 3rpx solid #000;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4rpx 0 rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
	}
	
	.preset-confirm-btn-circle:active {
		transform: translateY(2rpx) scale(0.95);
		box-shadow: 0 2rpx 0 rgba(0, 0, 0, 0.2);
	}
	
	.confirm-btn-text {
		font-size: 32rpx;
		font-weight: 900;
		color: #FFFFFF;
		text-shadow: 1rpx 1rpx 0 rgba(0, 0, 0, 0.3);
		line-height: 1;
	}
	
	/* 预设观点缩小按钮行 */
	.preset-mini-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rpx 2rpx;
		margin: 1rpx 0;
	}

	/* 激励标语样式 */
	.vote-message-text {
		font-size: 26rpx;
		font-weight: 500;
		color: #555;
		letter-spacing: 1rpx;
		flex: 1;
		text-align: left;
		position: relative;
		padding-left: 10rpx;
		border-left: 3rpx solid rgba(255, 107, 157, 0.6);
	}

	/* 预设观点缩小按钮样式 */
	.preset-mini-button {
		background: linear-gradient(135deg, #FF1493 0%, #FF69B4 50%, #FFB6C1 100%);
		border: 3rpx solid #000;
		border-radius: 50%;
		width: 70rpx;
		height: 70rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 20rpx;
		box-shadow: 0 6rpx 16rpx rgba(255, 20, 147, 0.4), 
		            0 3rpx 6rpx rgba(255, 20, 147, 0.2),
		            inset 0 1rpx 3rpx rgba(255, 255, 255, 0.3);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		align-self: flex-end;
		margin-left: auto;
		margin-right: 0;
	}
	
	.preset-mini-button::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
		transform: rotate(45deg);
		transition: all 0.6s ease;
		opacity: 0;
	}
	
	.preset-mini-button:hover::before {
		opacity: 1;
		animation: shimmer 1.5s ease-in-out;
	}
	
	@keyframes shimmer {
		0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
		100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
	}
	
	.preset-mini-button:active {
		transform: scale(0.92);
		box-shadow: 0 4rpx 12rpx rgba(255, 20, 147, 0.5), 
		            0 2rpx 4rpx rgba(255, 20, 147, 0.3),
		            inset 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
	}
	
	.mini-button-value {
		font-size: 22rpx;
		font-weight: 900;
		color: #FFFFFF;
		text-align: center;
		text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.3);
		letter-spacing: 0.5rpx;
		position: relative;
		z-index: 1;
		transition: all 0.3s ease;
	}
	
	/* 数值变化时的炫酷动画效果 */
	.preset-mini-button.value-changing {
		transform: scale(1.2) rotate(5deg);
		box-shadow: 0 8rpx 25rpx rgba(255, 20, 147, 0.6), 
		            0 4rpx 12rpx rgba(255, 20, 147, 0.4),
		            inset 0 2rpx 6rpx rgba(255, 255, 255, 0.4);
		animation: buttonPulse 0.6s ease-in-out;
	}
	
	.mini-button-value.value-animate {
		animation: valueShake 0.6s ease-in-out;
		color: #FFD700;
		text-shadow: 0 0 10rpx rgba(255, 215, 0, 0.8), 
		             0 2rpx 4rpx rgba(0, 0, 0, 0.5);
		transform: scale(1.1);
	}
	
	@keyframes buttonPulse {
		0% { 
			transform: scale(1) rotate(0deg);
			box-shadow: 0 6rpx 16rpx rgba(255, 20, 147, 0.4), 
			            0 3rpx 6rpx rgba(255, 20, 147, 0.2),
			            inset 0 1rpx 3rpx rgba(255, 255, 255, 0.3);
		}
		25% { 
			transform: scale(1.15) rotate(2deg);
			box-shadow: 0 10rpx 30rpx rgba(255, 20, 147, 0.7), 
			            0 5rpx 15rpx rgba(255, 20, 147, 0.5),
			            inset 0 2rpx 8rpx rgba(255, 255, 255, 0.5);
		}
		50% { 
			transform: scale(1.2) rotate(5deg);
			box-shadow: 0 12rpx 35rpx rgba(255, 20, 147, 0.8), 
			            0 6rpx 18rpx rgba(255, 20, 147, 0.6),
			            inset 0 3rpx 10rpx rgba(255, 255, 255, 0.6);
		}
		75% { 
			transform: scale(1.1) rotate(3deg);
			box-shadow: 0 8rpx 25rpx rgba(255, 20, 147, 0.6), 
			            0 4rpx 12rpx rgba(255, 20, 147, 0.4),
			            inset 0 2rpx 6rpx rgba(255, 255, 255, 0.4);
		}
		100% { 
			transform: scale(1) rotate(0deg);
			box-shadow: 0 6rpx 16rpx rgba(255, 20, 147, 0.4), 
			            0 3rpx 6rpx rgba(255, 20, 147, 0.2),
			            inset 0 1rpx 3rpx rgba(255, 255, 255, 0.3);
		}
	}
	
	@keyframes valueShake {
		0% { 
			transform: scale(1) translateX(0);
			color: #FFFFFF;
			text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.3);
		}
		10% { 
			transform: scale(1.1) translateX(-2rpx);
			color: #FFD700;
			text-shadow: 0 0 8rpx rgba(255, 215, 0, 0.6);
		}
		20% { 
			transform: scale(1.15) translateX(2rpx);
			color: #FFA500;
			text-shadow: 0 0 12rpx rgba(255, 165, 0, 0.8);
		}
		30% { 
			transform: scale(1.2) translateX(-1rpx);
			color: #FFD700;
			text-shadow: 0 0 15rpx rgba(255, 215, 0, 1);
		}
		40% { 
			transform: scale(1.15) translateX(1rpx);
			color: #FFA500;
			text-shadow: 0 0 12rpx rgba(255, 165, 0, 0.8);
		}
		50% { 
			transform: scale(1.1) translateX(0);
			color: #FFD700;
			text-shadow: 0 0 10rpx rgba(255, 215, 0, 0.8);
		}
		60% { 
			transform: scale(1.05) translateX(-1rpx);
			color: #FFA500;
			text-shadow: 0 0 8rpx rgba(255, 165, 0, 0.6);
		}
		70% { 
			transform: scale(1.02) translateX(1rpx);
			color: #FFD700;
			text-shadow: 0 0 6rpx rgba(255, 215, 0, 0.4);
		}
		80% { 
			transform: scale(1.01) translateX(0);
			color: #FFA500;
			text-shadow: 0 0 4rpx rgba(255, 165, 0, 0.3);
		}
		90% { 
			transform: scale(1.005) translateX(0);
			color: #FFD700;
			text-shadow: 0 0 2rpx rgba(255, 215, 0, 0.2);
		}
		100% { 
			transform: scale(1) translateX(0);
			color: #FFFFFF;
			text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.3);
		}
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
		z-index: 10000;
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