/**
 * 统一API服务层
 * 封装所有后端接口调用，支持环境切换和错误处理
 * 
 * 💡 快速切换提示：
 * 要在模拟服务器和真实服务器之间切换，请修改 config/server-mode.js 文件中的 USE_MOCK_SERVER 配置
 */

import apiInterceptor from './api-interceptor.js';

// 从配置文件获取当前服务器地址
// 注意：这里使用固定地址，因为 uni-app 可能不支持动态 require
// 如需切换，请修改 config/server-mode.js 后重新编译
const currentUrl = 'http://192.168.31.249:8000'; // 将由构建工具替换

// 内联配置，避免导入问题
const API_CONFIG = {
  development: {
    local: currentUrl,
    original: currentUrl,
    swagger: currentUrl,
    ngrok: currentUrl,
    backend: currentUrl,
    current: currentUrl
  },
  testing: {
    local: currentUrl,
    ngrok: currentUrl,
    backend: currentUrl,
    current: currentUrl
  },
  production: {
    local: currentUrl,
    ngrok: currentUrl,
    backend: currentUrl,
    current: currentUrl
  }
};

const getCurrentEnv = () => {
  return process.env.NODE_ENV || 'development';
};

const getCurrentConfig = () => {
  const env = getCurrentEnv();
  return API_CONFIG[env] || API_CONFIG.development;
};

class ApiService {
  constructor() {
    this.config = getCurrentConfig();
    this.baseURL = this.config.current;
    this.timeout = 10000; // 10秒超时
  }

  /**
   * 更新API配置
   * @param {string} serverUrl - 新的服务器地址
   */
  updateConfig(serverUrl) {
    this.baseURL = serverUrl;
  }

  /**
   * 通用请求方法
   * @param {Object} options - 请求配置
   * @returns {Promise} 请求结果
   */
  async request(options) {
    const {
      url,
      method = 'GET',
      data = null,
      headers = {},
      timeout = this.timeout
    } = options;

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;

    // 默认请求头
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    // 构建请求配置
    const requestConfig = {
      url: fullUrl,
      method: method.toUpperCase(),
      data,
      header: defaultHeaders,
      timeout
    };

    // 使用拦截器处理请求
    return await apiInterceptor.requestWithRetry(async (config) => {
      const response = await uni.request(config);

      // 检查响应状态
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return response.data;
      } else {
        const error = new Error(`HTTP ${response.statusCode}: ${response.data?.message || '请求失败'}`);
        error.statusCode = response.statusCode;
        error.response = response.data;
        throw error;
      }
    }, requestConfig);
  }

  /**
   * 错误处理
   * @param {Error} error - 错误对象
   * @returns {string} 错误信息
   */
  handleError(error) {
    if (error.message.includes('timeout')) {
      return '请求超时，请检查网络连接';
    } else if (error.message.includes('network')) {
      return '网络连接失败，请检查网络设置';
    } else if (error.message.includes('404')) {
      return '接口不存在，请检查API地址';
    } else if (error.message.includes('500')) {
      return '服务器内部错误，请稍后重试';
    } else {
      return error.message || '请求失败，请稍后重试';
    }
  }

  // ==================== 投票系统接口 ====================

  /**
   * 获取票数统计
   * @returns {Promise<Object>} 票数数据
   */
  async getVotes() {
    return await this.request({
      url: '/api/votes',
      method: 'GET'
    });
  }

  /**
   * 用户投票
   * @param {string} side - 投票方 ('left' 或 'right')
   * @param {number} votes - 投票数量，默认10
   * @returns {Promise<Object>} 投票结果
   */
  async userVote(side, votes = 10) {
    if (!side || !['left', 'right'].includes(side)) {
      throw new Error('投票方必须是 "left" 或 "right"');
    }

    return await this.request({
      url: '/api/user-vote',
      method: 'POST',
      data: {
        side,
        votes: parseInt(votes) || 10
      }
    });
  }

  // ==================== AI内容接口 ====================

  /**
   * 获取AI识别内容
   * @returns {Promise<Object>} AI内容列表
   */
  async getAiContent() {
    return await this.request({
      url: '/api/ai-content',
      method: 'GET'
    });
  }

  // ==================== 评论系统接口 ====================

  /**
   * 添加评论
   * @param {string} contentId - 内容ID（UUID字符串）
   * @param {string} text - 评论内容
   * @param {string} user - 用户名，默认"匿名用户"
   * @param {string} avatar - 用户头像，默认"👤"
   * @returns {Promise<Object>} 评论结果
   */
  async addComment(contentId, text, user = '匿名用户', avatar = '👤') {
    if (!contentId || !text) {
      throw new Error('内容ID和评论内容不能为空');
    }

    return await this.request({
      url: '/api/comment',
      method: 'POST',
      data: {
        contentId: String(contentId), // 确保是字符串
        text: text.trim(),
        user: user.trim() || '匿名用户',
        avatar: avatar || '👤'
      }
    });
  }

  /**
   * 点赞功能
   * @param {string} contentId - 内容ID（UUID字符串）
   * @param {string} commentId - 评论ID（UUID字符串，可选，不传则点赞内容）
   * @returns {Promise<Object>} 点赞结果
   */
  async like(contentId, commentId = null) {
    if (!contentId) {
      throw new Error('内容ID不能为空');
    }

    const data = {
      contentId: String(contentId) // 确保是字符串
    };

    if (commentId !== null && commentId !== undefined) {
      data.commentId = String(commentId); // 确保是字符串
    }

    return await this.request({
      url: '/api/like',
      method: 'POST',
      data
    });
  }

  /**
   * 删除评论
   * @param {string} contentId - 内容ID（UUID字符串）
   * @param {string} commentId - 评论ID（UUID字符串）
   * @returns {Promise<Object>} 删除结果
   */
  async deleteComment(contentId, commentId) {
    if (!contentId || !commentId) {
      throw new Error('内容ID和评论ID不能为空');
    }

    return await this.request({
      url: `/api/comment/${commentId}`,
      method: 'DELETE',
      data: {
        contentId: String(contentId) // 确保是字符串
      }
    });
  }

  // ==================== 辩题管理接口 ====================

  /**
   * 获取辩题信息
   * @returns {Promise<Object>} 辩题数据
   */
  async getDebateTopic() {
    return await this.request({
      url: '/api/debate-topic',
      method: 'GET'
    });
  }

  // ==================== 工具方法 ====================

  /**
   * 测试API连接
   * @returns {Promise<boolean>} 连接是否成功
   */
  async testConnection() {
    try {
      await this.getVotes();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取当前配置信息
   * @returns {Object} 当前配置
   */
  getCurrentConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      config: this.config
    };
  }

  /**
   * 切换API服务器
   * @param {string} serverType - 服务器类型
   * @returns {string|null} 新的服务器地址
   */
  switchApiServer(serverType) {
    const env = getCurrentEnv();
    const config = API_CONFIG[env];
    
    if (config && config[serverType]) {
      config.current = config[serverType];
      this.baseURL = config[serverType];
      return config[serverType];
    } else {
      return null;
    }
  }

  /**
   * 获取当前服务器信息
   * @returns {Object} 服务器信息
   */
  getCurrentServerInfo() {
    const config = getCurrentConfig();
    const availableServers = Object.keys(config).filter(key => key !== 'current');
    
    return {
      current: config.current,
      environment: getCurrentEnv(),
      available: availableServers.map(type => ({
        type,
        url: config[type]
      }))
    };
  }

  /**
   * 获取当前直播状态
   * @returns {Promise<Object>} { isLive, streamUrl, ... }
   */
  async getLiveStatus() {
    return this.request({ url: '/api/admin/live/status', method: 'GET' });
  }
}

// 创建单例实例
const apiService = new ApiService();

export default apiService;
