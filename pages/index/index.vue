<template>
	<view class="container">
		<!-- 全屏 Lottie 背景动画 -->
		<view class="fullscreen-lottie-bg">
			<!-- #ifdef MP-WEIXIN -->
			<!-- 微信小程序使用 canvas 渲染 -->
			<canvas
				type="2d"
				id="bg-lottie-canvas"
				class="bg-lottie-canvas"
				canvas-id="bg-lottie-canvas"
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

		<!-- 主横幅区域 -->
		<view class="banner-section">
			<view class="banner-decoration banner-deco-left"></view>
			<view class="banner-decoration banner-deco-right"></view>
			<view class="banner-content">
				<view class="banner-top-text">
					<text class="banner-slogan">RHODES ISLAND CHAMPS</text>
					<text class="banner-subtitle">不止看辩论，更是你的思辨训练场。</text>
				</view>
			</view>
		</view>

		<!-- Sword Battle 动画 -->
		<view class="sword-battle-section">
			<!-- #ifdef MP-WEIXIN -->
			<canvas 
				type="2d" 
				id="sword-battle-canvas" 
				class="sword-battle-canvas"
				canvas-id="sword-battle-canvas"
			></canvas>
			<!-- #endif -->
			<!-- #ifndef MP-WEIXIN -->
			<DotLottieVue 
				:src="'/static/animations/Sword Battle.json'"
				:autoplay="true"
				:loop="true"
				:background="'transparent'"
				:speed="1"
				:direction="1"
				:playMode="'normal'"
				style="width: 300rpx; height: 300rpx;"
			/>
			<!-- #endif -->
		</view>

		<!-- 功能区域 -->
		<view class="cards-section">
			<!-- Glitch 标题 -->
			<view class="glitch-container">
				<view class="glitch-wrapper">
					<text class="glitch-text" data-text="辩论LIVE">辩论LIVE</text>
					<text class="glitch-text glitch-clone-1" data-text="辩论LIVE">辩论LIVE</text>
					<text class="glitch-text glitch-clone-2" data-text="辩论LIVE">辩论LIVE</text>
				</view>
			</view>
			

			<!-- 副标题 -->
			<view class="tagline">
				<text class="tagline-text">思维竞技场 · 观点碰撞</text>
					</view>

			<!-- 登录按钮 -->
			<view class="login-button-container">
				<view class="lightning-icon">⚡</view>
				<view class="login-button" @click="handleLogin">
					<text class="login-button-text">一键闪电登录</text>
					<view class="button-shine"></view>
				</view>
				<view class="lightning-icon-right">⚡</view>
			</view>

			<!-- 底部提示 -->
			<view class="footer-hint">
				<text class="hint-text">登录即同意参与思维竞技</text>
			</view>
		</view>

		<!-- 飘浮粒子层 -->
		<view class="particles-container">
			<view class="particle" v-for="i in 12" :key="i"></view>
		</view>
		
		<!-- Loading 动画遮罩 -->
		<view class="loading-overlay" v-if="isLoading">
			<view class="loading-animation-container">
				<!-- #ifdef MP-WEIXIN -->
				<canvas 
					type="2d" 
					id="loading-lottie-canvas" 
					class="loading-lottie-canvas"
					canvas-id="loading-lottie-canvas"
				></canvas>
				<!-- #endif -->
				<!-- #ifndef MP-WEIXIN -->
				<DotLottieVue 
					:src="'/static/animations/loading.json'"
					:autoplay="true"
					:loop="true"
					:background="'transparent'"
					:speed="1"
					:direction="1"
					:playMode="'normal'"
					style="width: 200rpx; height: 200rpx;"
				/>
				<!-- #endif -->
				<text class="loading-text">闪电登录中...</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { DotLottieVue } from '@lottiefiles/dotlottie-vue'
	// #ifdef MP-WEIXIN
	import lottie from 'lottie-miniprogram'
	import bgAnimationData from '@/static/animations/lcBg-01.json'
	import loadingAnimationData from '@/static/animations/loading.json'
	import swordBattleAnimationData from '@/static/animations/Sword Battle.json'
	// #endif
	// #ifndef MP-WEIXIN
	import lottieWeb from 'lottie-web'
	// #endif
	import { API_BASE_URL } from '@/config/server-mode.js'
	export default {
		components: {
			DotLottieVue
		},
		data() {
			return {
				isLoading: false,
				userInfo: null,
				hasUserInfo: false
			}
		},
		onLoad() {
			// 页面加载完成，检查登录状态
			this.checkLoginStatus()
		},
		onReady() {
			// 页面渲染完成，延迟初始化 Lottie 动画
			console.log('页面 onReady 触发')
			setTimeout(() => {
				console.log('开始初始化 Lottie 动画')
				this.initBackgroundLottie()
				this.initSwordBattleLottie()
			}, 500)
		},
		onUnload() {
			// 页面卸载
		},
		methods: {
			initBackgroundLottie() {
			// #ifdef MP-WEIXIN
			console.log('开始初始化全屏背景 Lottie 动画...')

			// 获取系统信息
			const systemInfo = uni.getSystemInfoSync()
			const dpr = systemInfo.pixelRatio || 1
			const screenWidth = systemInfo.screenWidth
			const screenHeight = systemInfo.screenHeight

			// 获取 canvas 实例
			const query = uni.createSelectorQuery().in(this)
			query.select('#bg-lottie-canvas')
				.fields({ node: true, size: true })
				.exec(res => {
					console.log('背景 Canvas 查询结果:', res)

					if (res[0] && res[0].node) {
						const canvas = res[0].node
						console.log('背景 Canvas 实例:', canvas)

						try {
							// 设置 Canvas 为全屏尺寸
							canvas.width = screenWidth * dpr
							canvas.height = screenHeight * dpr

							const context = canvas.getContext('2d')
							context.scale(dpr, dpr)

							console.log('背景 Canvas 全屏尺寸:', canvas.width, canvas.height)
							console.log('背景 Canvas 上下文:', context)

							// 让 lottie 绑定 canvas
							lottie.setup(canvas)
							console.log('背景 Lottie setup 完成')

							// ✅ 直接使用本地导入的 JSON 对象（背景使用 lcBg-01.json）
							const animation = lottie.loadAnimation({
								loop: true,
								autoplay: true,
								animationData: bgAnimationData,
								rendererSettings: {
									context,
									preserveAspectRatio: 'xMidYMid slice'
								}
							})

							console.log('背景动画实例:', animation)

							// 监听动画事件
							animation.addEventListener('DOMLoaded', () => {
								console.log('✅ 背景动画 DOM 加载完成')
								console.log('Canvas 尺寸:', canvas.width, 'x', canvas.height)
								console.log('Canvas 位置: z-index 应该为 0')
							})

							animation.addEventListener('complete', () => {
								console.log('背景动画播放完成')
							})

							animation.addEventListener('error', (error) => {
								console.error('❌ 背景动画加载错误:', error)
							})
							
							// 立即播放
							animation.play()
							console.log('✅ 背景动画已启动播放')

						} catch (error) {
							console.error('背景 Canvas 初始化错误:', error)
						}
					} else {
						console.error('背景 Canvas 实例获取失败:', res)
					}
				})
			// #endif
		},

		async handleLogin() {
			try {
				// ✅ 总是执行登录流程，发送请求到服务器
				console.log('开始登录流程，发送请求到服务器')
				
				// 显示 Loading 动画
				this.isLoading = true
				
				// 初始化 Loading 动画
				this.$nextTick(() => {
					this.initLoadingLottie()
				})

				// 先获取用户信息（必须在用户点击时立即调用）
				const userInfoRes = await this.getUserProfile()
				console.log('用户信息获取成功:', userInfoRes)
				
				// 然后执行完整的登录流程
				await this.performWechatLogin(userInfoRes)
			} catch (error) {
				console.error('登录处理失败:', error)
				this.isLoading = false
				uni.showToast({
					title: error.message || '登录失败',
					icon: 'none',
					duration: 2000
				})
			}
		},
		
		// 检查登录状态
		checkLoginStatus() {
			// 检查本地存储的用户信息
			const userInfo = uni.getStorageSync('userInfo')
			if (userInfo) {
				this.userInfo = userInfo
				this.hasUserInfo = true
				console.log('已登录用户:', userInfo)
			}
		},
		
		// 执行微信登录
		async performWechatLogin(userInfoRes) {
			try {
				console.log('开始微信登录流程...')
				console.log('运行环境:', this.getPlatform())
				
				let serverRes
				let loginCode
				let currentUserInfo
				
				// 检测运行环境
				const platform = this.getPlatform()
				
			// #ifdef MP-WEIXIN
			// 微信小程序环境：使用完整的微信登录流程
			// 1. 静默登录获取 code
			const loginRes = await this.wxLogin()
			console.log('微信登录结果:', loginRes)
			
			// 📋 打印获取到的 Code
			console.log('%c═══════════════════════════════════════', 'color: #4CAF50; font-weight: bold; font-size: 14px;')
			console.log('%c 微信登录凭证 CODE 已获取 ', 'background: #4CAF50; color: white; font-weight: bold; padding: 5px 10px; border-radius: 3px;')
			console.log('%c═══════════════════════════════════════', 'color: #4CAF50; font-weight: bold; font-size: 14px;')
				console.log('%c Code:', 'color: #FF6B9D; font-weight: bold; font-size: 14px;', loginRes.code)
				console.log('%c 请立即复制此 Code 进行测试:', 'color: #FF0000; font-weight: bold; font-size: 16px;')
				console.log('%c', 'color: #FF0000; font-weight: bold; font-size: 14px;', loginRes.code)
			console.log('%c 完整 Code:', 'color: #2196F3; font-weight: bold; font-size: 12px;', loginRes.code)
			console.log('%c═══════════════════════════════════════', 'color: #4CAF50; font-weight: bold; font-size: 14px;')
			
			if (!loginRes.code) {
				throw new Error('获取微信登录 code 失败')
			}
			
			console.log('用户信息:', userInfoRes)
				
				// 2. 发送到服务器验证
				serverRes = await this.sendToServer({
					code: loginRes.code,
					userInfo: userInfoRes.userInfo,
					encryptedData: userInfoRes.encryptedData,
					iv: userInfoRes.iv
				})
				
				// 3. 保存登录信息
				loginCode = loginRes.code
				currentUserInfo = userInfoRes.userInfo
				
				console.log('登录成功:', userInfoRes.userInfo)
				
				// #endif
			
			// 保存用户信息到本地（仅微信小程序环境）
			// #ifdef MP-WEIXIN
			this.userInfo = currentUserInfo
			this.hasUserInfo = true
			uni.setStorageSync('userInfo', currentUserInfo)
			uni.setStorageSync('loginCode', loginCode)
			
			// 保存 token 和用户信息
			if (serverRes?.data?.token) {
				uni.setStorageSync('authToken', serverRes.data.token);
			}
			if (serverRes?.data?.user) {
				uni.setStorageSync('currentUser', serverRes.data.user);
			}
			
			console.log('登录成功，用户信息已保存')
			console.log('✅ Token:', serverRes?.data?.token ? '已保存' : '未找到')
			
			// 5. 跳转到直播选择页
			setTimeout(() => {
				this.isLoading = false
				uni.redirectTo({
					url: '/pages/live-select/live-select'
				})
			}, 1000)
			// #endif
			
			// #ifndef MP-WEIXIN
			// H5或其他环境：无法获取真实微信 code，提示用户
			console.error('⚠️  当前不在微信小程序环境，无法获取真实的微信登录 code')
			
			this.isLoading = false
			uni.showToast({
				title: '微信登录功能仅在微信小程序环境中可用，请在微信小程序中打开此应用',
				icon: 'none',
				duration: 3000
			})
			// #endif
				
			} catch (error) {
				console.error('微信登录失败:', error)
				this.isLoading = false
				
				// 显示错误提示
				uni.showToast({
					title: error.message || '登录失败，请重试',
					icon: 'none',
					duration: 2000
				})
			}
		},
		
		// 获取运行平台
		getPlatform() {
			// #ifdef MP-WEIXIN
			return 'mp-weixin'
			// #endif
			
			// #ifdef H5
			return 'h5'
			// #endif
			
			// #ifdef APP-PLUS
			return 'app'
			// #endif
			
			return 'unknown'
		},
		
		// 微信静默登录
		wxLogin() {
			return new Promise((resolve, reject) => {
				uni.login({
					provider: 'weixin',
					success: (res) => {
						console.log('微信登录成功:', res)
						resolve(res)
					},
					fail: (err) => {
						console.error('微信登录失败:', err)
						reject(new Error('微信登录失败'))
					}
				})
			})
		},
		
		// 获取用户信息（需要用户授权）
		getUserProfile() {
			return new Promise((resolve, reject) => {
				// #ifdef MP-WEIXIN
				// 微信小程序环境：调用真实的授权接口
				uni.getUserProfile({
					desc: '用于完善个人辩论档案',
					success: (res) => {
						console.log('获取用户信息成功:', res)
						resolve(res)
					},
					fail: (err) => {
						console.error('获取用户信息失败:', err)
						// 如果用户拒绝授权，使用默认信息
						if (err.errMsg.includes('deny')) {
							resolve({
								userInfo: {
									nickName: '微信用户',
									avatarUrl: '/static/logo.png'
								},
								encryptedData: '',
								iv: ''
							})
						} else {
							reject(new Error('获取用户信息失败'))
						}
					}
				})
				// #endif
				
				// #ifndef MP-WEIXIN
				// H5或其他环境：直接返回默认信息（不需要授权）
				console.log('当前不在微信小程序环境，使用默认用户信息')
				resolve({
					userInfo: {
						nickName: '用户' + Math.floor(Math.random() * 1000),
						avatarUrl: '/static/logo.png'
					},
					encryptedData: '',
					iv: ''
				})
				// #endif
			})
		},
		
		// 发送登录信息到服务器
		async sendToServer(loginData) {
			try {
				console.log('发送登录数据到服务器')
				console.log('Code (前15位):', loginData.code?.substring(0, 15) + '...')
				console.log('UserInfo:', loginData.userInfo?.nickName)
				
			// 使用配置的API地址（强制使用本地服务器）
			const apiBaseURL = API_BASE_URL || 'http://localhost:8000';
			
			// 调试日志：显示使用的服务器地址
			console.log('📡 API_BASE_URL 值:', API_BASE_URL);
			console.log('📡 实际使用的服务器地址:', apiBaseURL);
			console.log('📡 完整请求URL:', `${apiBaseURL}/api/wechat-login`);
				
				const response = await uni.request({
					url: `${apiBaseURL}/api/wechat-login`,
					method: 'POST',
					data: loginData,
					header: {
						'Content-Type': 'application/json'
					},
					timeout: 10000
				})
				
				console.log('服务器响应状态:', response.statusCode)
				console.log('服务器响应数据:', response.data)
				
				if (response.statusCode === 200 && response.data && response.data.success) {
					// 保存 token 到本地存储
					const token = response.data.data?.token;
					if (token) {
						uni.setStorageSync('authToken', token);
						console.log('✅ Token 已保存到本地存储');
					}
					return response.data
				} else {
					// 提取错误信息
					const errorMsg = response.data?.message || '服务器验证失败'
					throw new Error(errorMsg)
				}
				
			} catch (error) {
				console.error('服务器验证失败:', error)
				
				// 如果是网络错误，提供备用方案
				if (error.errMsg && error.errMsg.includes('timeout')) {
					throw new Error('网络超时，请检查网络连接')
				} else if (error.errMsg && error.errMsg.includes('fail')) {
					throw new Error('网络连接失败，请检查网络设置')
				} else {
					throw new Error(error.message || '服务器验证失败')
				}
			}
		},
		
		// 退出登录
		logout() {
			uni.showModal({
				title: '确认退出',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						// 清除本地存储
						uni.removeStorageSync('userInfo')
						uni.removeStorageSync('loginCode')
						
						// 重置状态
						this.userInfo = null
						this.hasUserInfo = false
						
						uni.showToast({
							title: '已退出登录',
							icon: 'success'
						})
					}
				}
			})
		},
		
		initLoadingLottie() {
			// #ifdef MP-WEIXIN
			console.log('开始初始化 Loading Lottie 动画...')
			
			const query = uni.createSelectorQuery().in(this)
			query.select('#loading-lottie-canvas')
				.fields({ node: true, size: true })
				.exec(res => {
					console.log('Loading Canvas 查询结果:', res)
					
					if (res[0] && res[0].node) {
						const canvas = res[0].node
						const context = canvas.getContext('2d')
						
						// 设置 Canvas 尺寸 (200rpx x 200rpx)
						const dpr = uni.getSystemInfoSync().pixelRatio || 1
						canvas.width = 200 * dpr
						canvas.height = 200 * dpr
						context.scale(dpr, dpr)
						
						// 让 lottie 绑定 canvas
						lottie.setup(canvas)
						
						// 加载 Loading 动画
						const animation = lottie.loadAnimation({
							loop: true,
							autoplay: true,
							animationData: loadingAnimationData,
							rendererSettings: {
								context,
								preserveAspectRatio: 'xMidYMid meet'
							}
						})
						
						console.log('✅ Loading 动画实例:', animation)
						
					} else {
						console.error('Loading Canvas 实例获取失败:', res)
					}
				})
			// #endif
		},
		
		initSwordBattleLottie() {
			// #ifdef MP-WEIXIN
			console.log('开始初始化 Sword Battle Lottie 动画...')
			
			const query = uni.createSelectorQuery().in(this)
			query.select('#sword-battle-canvas')
				.fields({ node: true, size: true })
				.exec(res => {
					console.log('Sword Battle Canvas 查询结果:', res)
					
					if (res[0] && res[0].node) {
						const canvas = res[0].node
						const context = canvas.getContext('2d')
						
						// 设置 Canvas 尺寸 (300rpx x 300rpx)
						const dpr = uni.getSystemInfoSync().pixelRatio || 1
						canvas.width = 300 * dpr
						canvas.height = 300 * dpr
						context.scale(dpr, dpr)
						
						// 让 lottie 绑定 canvas
						lottie.setup(canvas)
						
						// 加载 Sword Battle 动画
						const animation = lottie.loadAnimation({
							loop: true,
							autoplay: true,
							animationData: swordBattleAnimationData,
							rendererSettings: {
								context,
								preserveAspectRatio: 'xMidYMid meet'
							}
						})
						
						console.log('✅ Sword Battle 动画实例:', animation)
						
					} else {
						console.error('Sword Battle Canvas 实例获取失败:', res)
					}
				})
			// #endif
		}
		}
	}
</script>

<style>
	.container {
		height: 100vh;
		background: linear-gradient(135deg, #FFE5F0 0%, #E5F3FF 50%, #FFF5E5 100%);
		padding: 0;
		position: relative;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		color: #FF6B9D;
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
	
	/* 调试信息 */
	.debug-info {
		position: fixed;
		top: 100rpx;
		left: 20rpx;
		z-index: 999;
		background: rgba(255, 255, 255, 0.9);
		padding: 10rpx 20rpx;
		border-radius: 10rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	}

	/* 波普风格装饰圆形 */
	.banner-decoration {
		position: absolute;
		border-radius: 50%;
		opacity: 0.6;
		border: 6rpx solid;
		z-index: 5;
		box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.15);
	}

	.banner-deco-left {
		width: 180rpx;
		height: 180rpx;
		left: 30rpx;
		top: 50%;
		transform: translateY(-50%) rotate(0deg);
		animation: popRotate 15s ease-in-out infinite;
		background: linear-gradient(135deg, #FFD93D 0%, #FF6B9D 100%);
		border-color: #4ECDC4;
	}

	.banner-deco-right {
		width: 140rpx;
		height: 140rpx;
		right: 30rpx;
		top: 40%;
		transform: translateY(-50%) rotate(45deg);
		animation: popRotate 20s ease-in-out infinite reverse;
		background: linear-gradient(135deg, #A8E6CF 0%, #FFD93D 100%);
		border-color: #FF6B9D;
	}

	@keyframes popRotate {
		0% { transform: translateY(-50%) rotate(0deg) scale(1); }
		50% { transform: translateY(-50%) rotate(180deg) scale(1.1); }
		100% { transform: translateY(-50%) rotate(360deg) scale(1); }
	}

	/* 主横幅区域 - 波普风格 */
	.banner-section {
		position: relative;
		height: 280rpx;
		margin: 0;
		padding: 40rpx 20rpx 30rpx;
		border-radius: 0;
		overflow: hidden;
		flex-shrink: 0;
		background: transparent;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.banner-content {
		position: relative;
		z-index: 11;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		width: 100%;
	}

	.banner-top-text {
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		margin-bottom: 20rpx;
		background: rgba(255, 255, 255, 0.7);
		padding: 20rpx 40rpx;
		border-radius: 50rpx;
		border: 5rpx solid #FF6B9D;
		box-shadow: 8rpx 8rpx 0 rgba(255, 107, 157, 0.3);
	}

	.banner-slogan {
		font-size: 38rpx;
		font-weight: 900;
		color: #FF6B9D;
		letter-spacing: 3rpx;
		text-shadow: 3rpx 3rpx 0 #FFD93D, 6rpx 6rpx 0 #4ECDC4;
		animation: popBounce 2s ease-in-out infinite;
	}

	@keyframes popBounce {
		0%, 100% { transform: translateY(0) scale(1); }
		50% { transform: translateY(-5rpx) scale(1.05); }
	}

	.banner-subtitle {
		font-size: 24rpx;
		color: #4ECDC4;
		letter-spacing: 2rpx;
		font-weight: 800;
		text-shadow: 2rpx 2rpx 0 rgba(255, 217, 61, 0.6);
	}

	/* Sword Battle 动画区域 - 波普风格 */
	.sword-battle-section {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 30rpx 0;
		position: relative;
		z-index: 10;
		background: transparent;
	}
	
	.sword-battle-canvas {
		width: 300rpx;
		height: 300rpx;
		display: block;
	}
	
	/* 功能区域 - 波普风格 */
	.cards-section {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40rpx 20rpx;
		position: relative;
		z-index: 10;
		gap: 30rpx;
		background: transparent;
	}
	
	/* Glitch 故障艺术标题 */
	.glitch-container {
		position: relative;
		width: 40%;
		display: flex;
		justify-content: center;
		margin-bottom: 20rpx;
		z-index: 15;
		background: rgba(255, 255, 255, 0.4);
		padding: 20rpx 0;
		border: 1px solid rgba(0, 212, 255, 0.3);
		box-shadow: 0 0 20rpx rgba(0, 212, 255, 0.2);
	}

	.glitch-wrapper {
		position: relative;
		display: inline-block;
		height: 100rpx;
		z-index: 15;
	}

	.glitch-text {
		position: absolute;
		font-size: 72rpx;
		font-weight: 900;
		letter-spacing: 2rpx;
		white-space: nowrap;
		color: #00d4ff;
		top: 0;
		left: 0;
		z-index: 1;
		animation: glitchShift 2.5s ease-in-out infinite;
		text-shadow: 0 0 10rpx rgba(0, 212, 255, 0.8), 0 0 20rpx rgba(0, 212, 255, 0.5);
	}

	.glitch-clone-1 {
		color: rgba(255, 70, 100, 0.7);
		z-index: 2;
		animation: glitchShift1 2.5s ease-in-out infinite;
		clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
	}

	.glitch-clone-2 {
		color: rgba(0, 255, 200, 0.7);
		z-index: 2;
		animation: glitchShift2 2.5s ease-in-out infinite;
		clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
	}

	@keyframes glitchShift {
		0%, 100% { transform: translate(0, 0); }
		20% { transform: translate(2rpx, 0); }
		40% { transform: translate(-2rpx, 0); }
		60% { transform: translate(1rpx, 0); }
		80% { transform: translate(-1rpx, 0); }
	}

	@keyframes glitchShift1 {
		0%, 100% { transform: translate(0, 0); }
		20% { transform: translate(-3rpx, -2rpx); }
		40% { transform: translate(2rpx, 2rpx); }
		60% { transform: translate(-2rpx, 1rpx); }
		80% { transform: translate(3rpx, -1rpx); }
	}

	@keyframes glitchShift2 {
		0%, 100% { transform: translate(0, 0); }
		20% { transform: translate(3rpx, 2rpx); }
		40% { transform: translate(-2rpx, -2rpx); }
		60% { transform: translate(2rpx, -1rpx); }
		80% { transform: translate(-3rpx, 1rpx); }
	}

	/* Lottie 动画区域 */
	.lottie-section {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 20rpx 0;
		padding: 20rpx;
		border-radius: 20rpx;
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10rpx);
		border: 1rpx solid rgba(255, 255, 255, 0.1);
	}

	/* 副标题 - 波普风格 */
	.tagline {
		text-align: center;
		margin-bottom: 20rpx;
		position: relative;
		z-index: 15;
		background: rgba(255, 255, 255, 0.8);
		padding: 15rpx 30rpx;
		border-radius: 40rpx;
		border: 4rpx solid #FFD93D;
		box-shadow: 6rpx 6rpx 0 rgba(78, 205, 196, 0.4);
	}

	.tagline-text {
		font-size: 28rpx;
		color: #FF6B9D;
		font-weight: 700;
		letter-spacing: 2rpx;
		text-shadow: 2rpx 2rpx 0 rgba(255, 217, 61, 0.5);
	}

	/* 登录按钮容器 */
	.login-button-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
		margin: 20rpx 0;
		position: relative;
		z-index: 15;
	}

	.lightning-icon,
	.lightning-icon-right {
		font-size: 32rpx;
		animation: lightningFlash 1.5s ease-in-out infinite;
	}

	.lightning-icon-right {
		animation-delay: 0.75s;
	}

	@keyframes lightningFlash {
		0%, 100% { opacity: 0.3; transform: scale(0.9); }
		50% { opacity: 1; transform: scale(1.1); }
	}

	/* 用户信息容器 */
	.user-info-container {
		display: flex;
		align-items: center;
		gap: 20rpx;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.8) 100%);
		border: 3rpx solid rgba(255, 100, 120, 0.8);
		border-radius: 35rpx;
		padding: 20rpx 30rpx;
		box-shadow: 0 10rpx 30rpx rgba(255, 70, 100, 0.3), inset 0 0 20rpx rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
	}
	
	.user-info-container:active {
		transform: scale(0.95);
		box-shadow: 0 6rpx 20rpx rgba(255, 70, 100, 0.4), inset 0 0 10rpx rgba(255, 255, 255, 0.2);
	}

	.user-avatar {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		border: 3rpx solid #FF6B9D;
		box-shadow: 0 4rpx 12rpx rgba(255, 107, 157, 0.3);
	}

	.user-details {
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		flex: 1;
	}

	.user-name {
		font-size: 28rpx;
		color: #FF6B9D;
		font-weight: 700;
		letter-spacing: 1rpx;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	.logout-button {
		background: linear-gradient(135deg, rgba(255, 100, 120, 0.1) 0%, rgba(220, 50, 80, 0.1) 100%);
		border: 2rpx solid rgba(255, 100, 120, 0.3);
		border-radius: 20rpx;
		padding: 8rpx 20rpx;
		align-self: flex-start;
		transition: all 0.3s ease;
	}

	.logout-button:active {
		transform: scale(0.95);
		background: linear-gradient(135deg, rgba(255, 100, 120, 0.2) 0%, rgba(220, 50, 80, 0.2) 100%);
	}

	.logout-text {
		font-size: 22rpx;
		color: #FF6B9D;
		font-weight: 600;
		letter-spacing: 0.5rpx;
	}

	/* 登录按钮 */
	.login-button {
		background: linear-gradient(135deg, rgba(255, 70, 100, 0.9) 0%, rgba(220, 50, 80, 0.8) 100%);
		border: 3rpx solid rgba(255, 100, 120, 0.8);
		border-radius: 35rpx;
		padding: 20rpx 50rpx;
		position: relative;
		overflow: hidden;
		box-shadow: 0 10rpx 30rpx rgba(255, 70, 100, 0.5), inset 0 0 20rpx rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.login-button:active {
		transform: scale(0.95);
		box-shadow: 0 6rpx 20rpx rgba(255, 70, 100, 0.4), inset 0 0 10rpx rgba(255, 255, 255, 0.2);
	}

	.login-button:hover {
		transform: scale(1.05);
		box-shadow: 0 15rpx 40rpx rgba(255, 70, 100, 0.7), inset 0 0 25rpx rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 100, 120, 1);
	}

	.login-button-text {
		font-size: 32rpx;
		color: #ffffff;
		font-weight: 900;
		letter-spacing: 1rpx;
		position: relative;
		z-index: 1;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
	}

	.button-shine {
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		animation: shine 3s infinite;
	}

	@keyframes shine {
		0% { left: -100%; }
		50% { left: 100%; }
		100% { left: 100%; }
	}

	.footer-hint {
		text-align: center;
		margin-top: 20rpx;
		position: relative;
		z-index: 15;
		background: rgba(255, 255, 255, 0.6);
		padding: 10rpx 25rpx;
		border-radius: 30rpx;
		border: 3rpx solid #A8E6CF;
	}

	.hint-text {
		font-size: 20rpx;
		color: #4ECDC4;
		font-weight: 600;
		letter-spacing: 1rpx;
		text-shadow: 1rpx 1rpx 0 rgba(255, 217, 61, 0.3);
	}

	/* Loading 动画遮罩 */
	.loading-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.95);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.loading-animation-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 30rpx;
	}

	.loading-lottie-canvas {
		width: 200rpx;
		height: 200rpx;
		display: block;
	}

	.loading-text {
		font-size: 28rpx;
		font-weight: 600;
		color: #0c76f1;
		letter-spacing: 2rpx;
		animation: loadingPulse 1.5s ease-in-out infinite;
	}

	@keyframes loadingPulse {
		0%, 100% { 
			opacity: 0.6;
			transform: scale(1);
		}
		50% { 
			opacity: 1;
			transform: scale(1.05);
		}
	}

	/* 波普风格飘浮粒子 */
	.particles-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 5;
	}

	.particle {
		position: absolute;
		width: 20rpx;
		height: 20rpx;
		background: radial-gradient(circle at 30% 30%, #FFD93D, #FF6B9D);
		border-radius: 50%;
		opacity: 0.7;
		animation: float linear infinite;
		box-shadow: 0 0 10rpx rgba(255, 107, 157, 0.5);
		border: 2rpx solid #4ECDC4;
	}

	.particle:nth-child(1) { left: 10%; animation-duration: 15s; animation-delay: 0s; }
	.particle:nth-child(2) { left: 20%; animation-duration: 20s; animation-delay: 2s; }
	.particle:nth-child(3) { left: 30%; animation-duration: 25s; animation-delay: 4s; }
	.particle:nth-child(4) { left: 40%; animation-duration: 18s; animation-delay: 1s; }
	.particle:nth-child(5) { left: 50%; animation-duration: 22s; animation-delay: 3s; }
	.particle:nth-child(6) { left: 60%; animation-duration: 16s; animation-delay: 5s; }
	.particle:nth-child(7) { left: 70%; animation-duration: 24s; animation-delay: 2s; }
	.particle:nth-child(8) { left: 80%; animation-duration: 20s; animation-delay: 0s; }
	.particle:nth-child(9) { left: 15%; animation-duration: 18s; animation-delay: 4s; }
	.particle:nth-child(10) { left: 35%; animation-duration: 26s; animation-delay: 1s; }
	.particle:nth-child(11) { left: 55%; animation-duration: 21s; animation-delay: 3s; }
	.particle:nth-child(12) { left: 75%; animation-duration: 19s; animation-delay: 2s; }

	@keyframes float {
		0% {
			bottom: -20rpx;
			opacity: 0;
		}
		10% {
			opacity: 0.6;
		}
		90% {
			opacity: 0.6;
		}
		100% {
			bottom: 110%;
			opacity: 0;
		}
	}
</style>
