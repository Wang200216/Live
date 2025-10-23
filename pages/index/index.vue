<template>
	<view class="container">
		<!-- 装饰性动画元素组件 -->
		<PopDecoration />

		<!-- 顶部装饰圆圈 -->
		<view class="top-decoration">
			<view class="circle circle-left"></view>
			<view class="circle circle-middle">
				<text class="lightning-icon">⚡</text>
			</view>
			<view class="circle circle-right">
				<text class="sparkle-icon">✨</text>
			</view>
		</view>

		<!-- 主标题 -->
		<view class="title-section">
			<text class="main-title">辩论LIVE</text>
		</view>

		<!-- 描述栏 -->
		<view class="description-bar">
			<text class="emoji">😤</text>
			<text class="description-text">神仙打架·全民围观</text>
			<text class="emoji">🍿</text>
		</view>

		<!-- 主要功能框 -->
		<view class="feature-box">
			<view class="feature-button feature-button-top" @click="handleVoting">
				<view class="button-icon">
					<view class="icon-circle">
						<text class="lightning-icon">⚡</text>
					</view>
				</view>
				<text class="button-text">实时投票·手速battle</text>
			</view>
			
			<view class="feature-button feature-button-bottom" @click="handleDebate">
				<view class="button-icon">
					<view class="icon-circle">
						<text class="star-icon">⭐</text>
					</view>
				</view>
				<text class="button-text">观点碰撞·脑洞大开</text>
			</view>
		</view>

		<!-- 登录按钮 -->
		<view class="login-button" @click="handleLogin">
			<text class="login-icon">⚡️</text>
			<text class="login-text">一键闪电登录</text>
			<text class="login-icon">⚡️</text>
			<view class="floating-icon">
				<text class="thumb-icon">👍</text>
			</view>
		</view>


		<!-- 免责声明 -->
		<view class="disclaimer">
			<text class="disclaimer-icon">💡</text>
			<text class="disclaimer-text">登录=同意被辩论洗脑</text>
		</view>
	</view>
</template>

<script>
	import PopDecoration from '@/components/PopDecoration.vue'

	export default {
		components: {
			PopDecoration
		},
		data() {
			return {

			}
		},
		onLoad() {

		},
		methods: {
			handleVoting() {
				uni.showToast({
					title: '实时投票功能',
					icon: 'none'
				});
			},
			handleDebate() {
				uni.showToast({
					title: '观点碰撞功能',
					icon: 'none'
				});
			},
			handleLogin() {
				// 显示登录提示
				uni.showToast({
					title: '闪电登录中...',
					icon: 'loading',
					duration: 1500
				});
				
				// 延迟跳转到首页
				setTimeout(() => {
					uni.redirectTo({
						url: '/pages/home/home'
					});
				}, 1500);
			},
		}
	}
</script>

<style>
	.container {
		min-height: 100vh;
		/* 鲜艳活泼的彩虹渐变背景 + 高级光线效果 */
		background:
			radial-gradient(circle at 20% 15%, rgba(255, 100, 150, 0.5) 0%, transparent 38%),
			radial-gradient(circle at 80% 25%, rgba(0, 180, 220, 0.4) 0%, transparent 42%),
			radial-gradient(circle at 50% 75%, rgba(100, 220, 50, 0.45) 0%, transparent 48%),
			linear-gradient(180deg, #FF69B4 0%, #FF8C00 25%, #FFD700 50%, #32CD32 100%);
		padding: 120rpx 30rpx 40rpx 30rpx;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-sizing: border-box;
		animation: indexVibrancyShift 20s ease-in-out infinite;
	}

	@keyframes indexVibrancyShift {
		0% {
			background:
				radial-gradient(circle at 20% 15%, rgba(255, 100, 150, 0.5) 0%, transparent 38%),
				radial-gradient(circle at 80% 25%, rgba(0, 180, 220, 0.4) 0%, transparent 42%),
				radial-gradient(circle at 50% 75%, rgba(100, 220, 50, 0.45) 0%, transparent 48%),
				linear-gradient(180deg, #FF69B4 0%, #FF8C00 25%, #FFD700 50%, #32CD32 100%);
		}
		50% {
			background:
				radial-gradient(circle at 25% 20%, rgba(255, 120, 170, 0.45) 0%, transparent 40%),
				radial-gradient(circle at 75% 30%, rgba(0, 200, 240, 0.35) 0%, transparent 44%),
				radial-gradient(circle at 50% 70%, rgba(120, 240, 70, 0.4) 0%, transparent 50%),
				linear-gradient(180deg, #FF69B4 0%, #FF8C00 25%, #FFD700 50%, #32CD32 100%);
		}
		100% {
			background:
				radial-gradient(circle at 20% 15%, rgba(255, 100, 150, 0.5) 0%, transparent 38%),
				radial-gradient(circle at 80% 25%, rgba(0, 180, 220, 0.4) 0%, transparent 42%),
				radial-gradient(circle at 50% 75%, rgba(100, 220, 50, 0.45) 0%, transparent 48%),
				linear-gradient(180deg, #FF69B4 0%, #FF8C00 25%, #FFD700 50%, #32CD32 100%);
		}
	}

	/* 顶部装饰圆圈 */
	.top-decoration {
		width: 100%;
		height: 120rpx;
		position: relative;
		margin-bottom: 40rpx;
	}

	.circle {
		position: absolute;
		border-radius: 50%;
		border: 3rpx solid rgba(255, 255, 255, 0.4);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		animation: circleGlow 4s ease-in-out infinite;
		backdrop-filter: blur(10rpx);
	}

	@keyframes circleGlow {
		0%, 100% {
			box-shadow: 0 0 20rpx rgba(255, 100, 150, 0.3), inset 0 0 10rpx rgba(255, 255, 255, 0.1);
		}
		50% {
			box-shadow: 0 0 40rpx rgba(0, 180, 220, 0.4), inset 0 0 15rpx rgba(255, 255, 255, 0.15);
		}
	}

	.circle-left {
		width: 100rpx;
		height: 100rpx;
		background: linear-gradient(135deg, rgba(255, 20, 147, 0.8), rgba(255, 100, 150, 0.6));
		left: 0;
		top: 0;
		animation-delay: 0s;
		animation-duration: 5s;
	}

	.circle-left:hover {
		transform: scale(1.1);
		box-shadow: 0 0 50rpx rgba(255, 100, 150, 0.6), inset 0 0 15rpx rgba(255, 255, 255, 0.2);
	}

	.circle-middle {
		width: 80rpx;
		height: 80rpx;
		background: linear-gradient(135deg, rgba(255, 20, 147, 0.75), rgba(255, 120, 150, 0.55));
		left: 50%;
		top: 20rpx;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		justify-content: center;
		animation-delay: 0.5s;
		animation-duration: 6s;
	}

	.circle-middle:hover {
		transform: translateX(-50%) scale(1.15);
		box-shadow: 0 0 60rpx rgba(255, 150, 100, 0.7), inset 0 0 20rpx rgba(255, 255, 255, 0.25);
	}

	.circle-right {
		width: 60rpx;
		height: 60rpx;
		background: linear-gradient(135deg, rgba(255, 215, 0, 0.7), rgba(255, 240, 100, 0.5));
		right: 0;
		top: 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		animation-delay: 1s;
		animation-duration: 4.5s;
	}

	.circle-right:hover {
		transform: scale(1.12) rotate(15deg);
		box-shadow: 0 0 45rpx rgba(255, 215, 100, 0.6), inset 0 0 12rpx rgba(255, 255, 255, 0.2);
	}

	.lightning-icon, .sparkle-icon {
		font-size: 32rpx;
		color: #FFD700;
	}

	/* 主标题 */
	.title-section {
		margin-bottom: 40rpx;
	}

	.main-title {
		font-size: 72rpx;
		font-weight: bold;
		background: linear-gradient(90deg, #FF1493, #FF8C00, #FFD700, #00FFFF);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		letter-spacing: 4rpx;
		animation: titleGradientShift 4s ease-in-out infinite;
		text-shadow: 0 4rpx 20rpx rgba(255, 100, 150, 0.3);
		filter: drop-shadow(0 0 10rpx rgba(0, 180, 220, 0.2));
	}

	@keyframes titleGradientShift {
		0%, 100% {
			background-position: 0% center;
		}
		50% {
			background-position: 100% center;
		}
	}

	/* 描述栏 - 玻璃态高级设计 */
	.description-bar {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 215, 0, 0.1) 100%);
		backdrop-filter: blur(18rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		border-radius: 30rpx;
		padding: 20rpx 30rpx;
		margin-bottom: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
		box-shadow:
			0 0 30rpx rgba(255, 215, 0, 0.2),
			0 8rpx 24rpx rgba(0, 0, 0, 0.25),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		animation: barPulse 3s ease-in-out infinite;
	}

	@keyframes barPulse {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3rpx);
		}
	}

	.description-bar:hover {
		backdrop-filter: blur(22rpx);
		box-shadow:
			0 0 40rpx rgba(255, 215, 0, 0.3),
			0 12rpx 32rpx rgba(0, 0, 0, 0.3),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.25);
	}

	.description-text {
		font-size: 32rpx;
		font-weight: bold;
		background: linear-gradient(90deg, #FFD700, #FF8C00, #FF1493);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: textShimmer 4s ease-in-out infinite;
	}

	@keyframes textShimmer {
		0%, 100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.2);
		}
	}

	.emoji {
		font-size: 36rpx;
	}

	/* 主要功能框 - 玻璃态设计 */
	.feature-box {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%);
		backdrop-filter: blur(20rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.25);
		border-radius: 32rpx;
		padding: 30rpx;
		margin-bottom: 40rpx;
		width: 100%;
		max-width: 600rpx;
		box-shadow:
			0 0 40rpx rgba(255, 100, 150, 0.15),
			0 10rpx 32rpx rgba(0, 0, 0, 0.3),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.18);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		animation: featureBoxFloat 6s ease-in-out infinite;
	}

	@keyframes featureBoxFloat {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4rpx);
		}
	}

	.feature-box:hover {
		backdrop-filter: blur(25rpx);
		box-shadow:
			0 0 50rpx rgba(0, 180, 220, 0.2),
			0 15rpx 40rpx rgba(0, 0, 0, 0.35),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.25);
	}

	.feature-button {
		display: flex;
		align-items: center;
		padding: 25rpx;
		border-radius: 22rpx;
		margin-bottom: 20rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		backdrop-filter: blur(12rpx);
	}

	.feature-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.6s ease;
		z-index: 0;
	}

	.feature-button:hover::before {
		left: 100%;
	}

	.feature-button:last-child {
		margin-bottom: 0;
	}

	.feature-button-top {
		background: linear-gradient(135deg, rgba(255, 20, 147, 0.7) 0%, rgba(255, 100, 150, 0.5) 100%);
		box-shadow: 0 0 25rpx rgba(255, 100, 150, 0.3), inset 0 0 15rpx rgba(255, 255, 255, 0.1);
		animation: buttonPulseLeft 5s ease-in-out infinite;
	}

	@keyframes buttonPulseLeft {
		0%, 100% {
			box-shadow: 0 0 25rpx rgba(255, 100, 150, 0.3), inset 0 0 15rpx rgba(255, 255, 255, 0.1);
		}
		50% {
			box-shadow: 0 0 35rpx rgba(255, 100, 150, 0.45), inset 0 0 20rpx rgba(255, 255, 255, 0.15);
		}
	}

	.feature-button-top:hover {
		transform: translateY(-4rpx);
		box-shadow: 0 0 45rpx rgba(255, 150, 100, 0.5), inset 0 0 20rpx rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15rpx);
	}

	.feature-button-bottom {
		background: linear-gradient(135deg, rgba(0, 255, 255, 0.6) 0%, rgba(0, 200, 220, 0.45) 100%);
		box-shadow: 0 0 25rpx rgba(0, 200, 220, 0.3), inset 0 0 15rpx rgba(255, 255, 255, 0.1);
		animation: buttonPulseRight 5.5s ease-in-out infinite;
	}

	@keyframes buttonPulseRight {
		0%, 100% {
			box-shadow: 0 0 25rpx rgba(0, 200, 220, 0.3), inset 0 0 15rpx rgba(255, 255, 255, 0.1);
		}
		50% {
			box-shadow: 0 0 35rpx rgba(0, 220, 240, 0.45), inset 0 0 20rpx rgba(255, 255, 255, 0.15);
		}
	}

	.feature-button-bottom:hover {
		transform: translateY(-4rpx);
		box-shadow: 0 0 45rpx rgba(0, 220, 240, 0.5), inset 0 0 20rpx rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(15rpx);
	}

	.button-icon {
		margin-right: 20rpx;
	}

	.icon-circle {
		width: 60rpx;
		height: 60rpx;
		background: linear-gradient(135deg, rgba(255, 215, 0, 0.8), rgba(255, 240, 100, 0.6));
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 15rpx rgba(255, 215, 0, 0.4), inset 0 0 8rpx rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		animation: iconPulse 3s ease-in-out infinite;
	}

	@keyframes iconPulse {
		0%, 100% {
			box-shadow: 0 0 15rpx rgba(255, 215, 0, 0.4), inset 0 0 8rpx rgba(255, 255, 255, 0.2);
		}
		50% {
			box-shadow: 0 0 25rpx rgba(255, 215, 0, 0.6), inset 0 0 12rpx rgba(255, 255, 255, 0.3);
		}
	}

	.icon-circle:hover {
		transform: scale(1.1);
		box-shadow: 0 0 30rpx rgba(255, 215, 0, 0.7), inset 0 0 15rpx rgba(255, 255, 255, 0.3);
	}

	.star-icon {
		font-size: 28rpx;
		background: linear-gradient(90deg, #FF1493, #FF8C00, #FFFFFF);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: starShine 2s ease-in-out infinite;
	}

	@keyframes starShine {
		0%, 100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.3);
		}
	}

	.button-text {
		font-size: 32rpx;
		font-weight: bold;
		background: linear-gradient(90deg, #FFFFFF, #FFD700, #FFFFFF);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		position: relative;
		z-index: 1;
		animation: buttonTextGlow 3s ease-in-out infinite;
	}

	@keyframes buttonTextGlow {
		0%, 100% {
			filter: brightness(1) drop-shadow(0 0 2rpx rgba(255, 255, 255, 0.3));
		}
		50% {
			filter: brightness(1.15) drop-shadow(0 0 5rpx rgba(255, 215, 0, 0.5));
		}
	}

	/* 登录按钮 - 高级玻璃态 + 动画 */
	.login-button {
		background: linear-gradient(135deg, rgba(255, 20, 147, 0.65) 0%, rgba(255, 100, 150, 0.45) 100%);
		backdrop-filter: blur(16rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		border-radius: 32rpx;
		padding: 25rpx 40rpx;
		margin-bottom: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15rpx;
		position: relative;
		width: 100%;
		max-width: 500rpx;
		box-shadow:
			0 0 35rpx rgba(255, 100, 150, 0.35),
			0 12rpx 28rpx rgba(0, 0, 0, 0.3),
			inset 0 0 15rpx rgba(255, 255, 255, 0.15);
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		animation: loginGlitch 5s ease-in-out infinite;
	}

	@keyframes loginGlitch {
		0%, 100% {
			box-shadow:
				0 0 35rpx rgba(255, 100, 150, 0.35),
				0 12rpx 28rpx rgba(0, 0, 0, 0.3),
				inset 0 0 15rpx rgba(255, 255, 255, 0.15);
		}
		50% {
			box-shadow:
				0 0 45rpx rgba(255, 150, 100, 0.45),
				0 15rpx 35rpx rgba(0, 0, 0, 0.35),
				inset 0 0 20rpx rgba(255, 255, 255, 0.2);
		}
	}

	.login-button:hover {
		transform: translateY(-5rpx);
		box-shadow:
			0 0 50rpx rgba(255, 100, 150, 0.5),
			0 20rpx 40rpx rgba(0, 0, 0, 0.4),
			inset 0 0 25rpx rgba(255, 255, 255, 0.25);
		backdrop-filter: blur(20rpx);
	}

	.login-text {
		font-size: 36rpx;
		font-weight: bold;
		background: linear-gradient(90deg, #FFFFFF, #FFD700, #FFFFFF);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: loginTextFlash 3s ease-in-out infinite;
		position: relative;
		z-index: 1;
	}

	@keyframes loginTextFlash {
		0%, 100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.3);
		}
	}

	.login-icon {
		font-size: 32rpx;
		color: #FFD700;
		animation: iconFlicker 0.5s ease-in-out infinite;
		position: relative;
		z-index: 1;
	}

	@keyframes iconFlicker {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.7;
			transform: scale(0.95);
		}
	}

	.floating-icon {
		position: absolute;
		top: -15rpx;
		right: -15rpx;
		width: 50rpx;
		height: 50rpx;
		background: linear-gradient(135deg, rgba(0, 255, 255, 0.7), rgba(0, 200, 220, 0.5));
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 0 20rpx rgba(0, 200, 220, 0.4), inset 0 0 8rpx rgba(255, 255, 255, 0.15);
		animation: floatingBounce 2s ease-in-out infinite;
	}

	@keyframes floatingBounce {
		0%, 100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-8rpx) rotate(10deg);
		}
	}

	.thumb-icon {
		font-size: 24rpx;
		color: #FFD700;
	}

	/* 免责声明 - 高级深色玻璃态 */
	.disclaimer {
		background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%);
		backdrop-filter: blur(14rpx);
		border: 2rpx solid rgba(255, 215, 0, 0.4);
		border-radius: 24rpx;
		padding: 20rpx 30rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 15rpx;
		width: 100%;
		max-width: 500rpx;
		box-shadow:
			0 0 25rpx rgba(255, 215, 0, 0.15),
			0 8rpx 20rpx rgba(0, 0, 0, 0.4),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		animation: disclaimerHint 4s ease-in-out infinite;
	}

	@keyframes disclaimerHint {
		0%, 100% {
			border-color: rgba(255, 215, 0, 0.3);
		}
		50% {
			border-color: rgba(255, 215, 0, 0.5);
		}
	}

	.disclaimer:hover {
		backdrop-filter: blur(18rpx);
		box-shadow:
			0 0 35rpx rgba(255, 215, 0, 0.25),
			0 12rpx 28rpx rgba(0, 0, 0, 0.45),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.15);
	}

	.disclaimer-text {
		font-size: 28rpx;
		background: linear-gradient(90deg, #FFD700, #FF8C00, #FFD700);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		font-weight: 500;
		animation: disclaimerGlow 3s ease-in-out infinite;
	}

	@keyframes disclaimerGlow {
		0%, 100% {
			filter: brightness(1) blur(0);
		}
		50% {
			filter: brightness(1.1) blur(0.5px);
		}
	}

	.disclaimer-icon {
		font-size: 32rpx;
		animation: lightbulbFlash 1.5s ease-in-out infinite;
	}

	@keyframes lightbulbFlash {
		0%, 100% {
			opacity: 1;
			filter: brightness(1);
		}
		50% {
			opacity: 0.6;
			filter: brightness(0.8);
		}
	}

</style>
