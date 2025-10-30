/**
 * 直播配置文件
 * 用于配置直播流地址和相关参数
 */

export default {
	// 直播流地址配置
	// 支持的协议格式：
	// - RTMP: rtmp://your-server.com/live/stream
	// - HLS (推荐): https://your-server.com/live/stream.m3u8
	// - FLV: https://your-server.com/live/stream.flv
	
	// ==================== 测试直播流地址 ====================
	// 以下是可用的免费测试直播流，可以直接使用
	
	// 方案1：Big Buck Bunny 测试流（推荐 - HTTPS协议，稳定可靠）
	liveStreamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
	
	// 方案2：Apple 官方演示流（HTTPS，非常稳定）
	// liveStreamUrl: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
	
	// 方案3：Sintel 测试流（HTTPS，高质量）
	// liveStreamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
	
	// 方案4：CCTV-1 (HTTP - 可能在某些环境不可用)
	// liveStreamUrl: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226231/index.m3u8',
	
	// 备用直播流地址
	backupStreamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
	
	// 直播配置
	config: {
		// 是否自动播放
		autoplay: true,
		
		// 是否默认静音
		muted: false,
		
		// 播放模式：live(直播) | RTC(实时通话，延迟更低)
		mode: 'live',
		
		// 画面填充模式：contain(包含) | fillCrop(裁剪)
		objectFit: 'contain',
		
		// 最小缓冲区，单位s
		minCache: 1,
		
		// 最大缓冲区，单位s
		maxCache: 3
	},
	
	// ==================== 更多测试直播流 ====================
	testStreams: {
		// 央视频道
		cctv: {
			cctv1: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226231/index.m3u8',
			cctv2: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226195/index.m3u8',
			cctv3: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226397/index.m3u8',
			cctv4: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226191/index.m3u8',
			cctv5: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226395/index.m3u8',
			cctv6: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226393/index.m3u8',
			cctv13: 'http://39.134.24.166/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226233/index.m3u8'
		},
		
		// 卫视频道
		satellite: {
			hunan: 'http://39.134.24.161/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226211/index.m3u8',
			zhejiang: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226199/index.m3u8',
			jiangsu: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226200/index.m3u8',
			beijing: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226222/index.m3u8',
			dongfang: 'http://39.134.24.162/dbiptv.sn.chinamobile.com/PLTV/88888890/224/3221226217/index.m3u8'
		},
		
		// 国际测试流
		international: {
			bigBuckBunny: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
			sintel: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
			appleDemo: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8'
		}
	},
	
	// 常用直播平台推流地址示例
	examples: {
		// 腾讯云直播
		tencent: {
			// RTMP: rtmp://live-push.myqcloud.com/live/streamname?txSecret=xxx&txTime=xxx
			// HLS: https://live-play.myqcloud.com/live/streamname.m3u8
			// FLV: https://live-play.myqcloud.com/live/streamname.flv
		},
		
		// 阿里云直播
		aliyun: {
			// RTMP: rtmp://video-center.alivecdn.com/AppName/StreamName?auth_key=xxx
			// HLS: https://video-center.alivecdn.com/AppName/StreamName.m3u8
			// FLV: https://video-center.alivecdn.com/AppName/StreamName.flv
		},
		
		// 七牛云直播
		qiniu: {
			// RTMP: rtmp://pili-publish.xxx.com/AppName/StreamName
			// HLS: https://pili-live-hls.xxx.com/AppName/StreamName.m3u8
			// FLV: https://pili-live-hdl.xxx.com/AppName/StreamName.flv
		}
	}
}

