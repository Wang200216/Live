/**
 * 服务器模式配置
 * 快速切换模拟服务器和真实服务器
 * 
 * 使用方法：
 * 1. 修改 USE_MOCK_SERVER 为 true 或 false
 * 2. 修改 REAL_SERVER_URL 为您的真实服务器地址
 * 3. 重启服务器即可
 */

// ==================== 配置区域 ====================

/**
 * 是否使用模拟服务器
 * true: 使用本地模拟服务器 (开发测试用)
 * false: 使用真实后端服务器 (生产环境)
 */
const USE_MOCK_SERVER = true;

/**
 * 真实服务器地址
 * 当 USE_MOCK_SERVER = false 时使用
 */
const REAL_SERVER_URL = 'http://192.168.31.189:8000';

/**
 * 真实服务器端口（如果需要）
 */
const REAL_SERVER_PORT = 8000;

/**
 * 真实微信小程序配置
 */
const REAL_WECHAT_CONFIG = {
    appid: 'wx94289b0d2ca7a802',
    secret: '10409c1193a326a7b328f675b1776195'
};

// ==================== 自动计算配置 ====================

/**
 * 获取本机IP地址（用于局域网访问）
 */
const getLocalIP = () => {
    // 默认值，也可以手动修改为固定IP
    return '192.168.31.249';
};

/**
 * 模拟服务器配置
 */
const MOCK_SERVER_CONFIG = {
    host: getLocalIP(),
    port: 8000,
    url: `http://${getLocalIP()}:8000`
};

/**
 * 获取当前服务器配置
 */
const getCurrentServerConfig = () => {
    if (USE_MOCK_SERVER) {
        return {
            mode: 'mock',
            url: MOCK_SERVER_CONFIG.url,
            host: MOCK_SERVER_CONFIG.host,
            port: MOCK_SERVER_CONFIG.port,
            wechat: {
                useMock: true,
                appid: 'wx94289b0d2ca7a802',
                secret: '10409c1193a326a7b328f675b1776195'
            }
        };
    } else {
        return {
            mode: 'real',
            url: REAL_SERVER_URL,
            port: REAL_SERVER_PORT,
            wechat: {
                useMock: false,
                appid: REAL_WECHAT_CONFIG.appid,
                secret: REAL_WECHAT_CONFIG.secret
            }
        };
    }
};

/**
 * 打印当前配置信息
 */
const printConfig = () => {
    const config = getCurrentServerConfig();
    console.log('═══════════════════════════════════════');
    console.log('📋 服务器配置信息');
    console.log('═══════════════════════════════════════');
    console.log(`模式: ${config.mode === 'mock' ? '🧪 模拟服务器' : '🌐 真实服务器'}`);
    console.log(`地址: ${config.url}`);
    if (config.mode === 'mock') {
        console.log(`本地访问: http://localhost:${config.port}`);
        console.log(`局域网访问: ${config.url}`);
    }
    console.log(`微信登录: ${config.wechat.useMock ? '模拟模式' : '真实模式'}`);
    console.log('═══════════════════════════════════════');
};

// ==================== 导出配置 ====================

module.exports = {
    USE_MOCK_SERVER,
    MOCK_SERVER_CONFIG,
    REAL_SERVER_URL,
    REAL_SERVER_PORT,
    REAL_WECHAT_CONFIG,
    getCurrentServerConfig,
    printConfig
};

