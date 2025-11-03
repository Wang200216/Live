#!/bin/bash
# Nginx 快速启动脚本 (macOS)

echo "🚀 Nginx 快速配置和启动脚本"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查是否安装 Nginx
echo ""
echo "步骤 1: 检查 Nginx 安装状态..."
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx 未安装${NC}"
    echo "正在使用 Homebrew 安装..."
    
    # 检查 Homebrew
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}❌ Homebrew 未安装，请先安装 Homebrew${NC}"
        echo "访问: https://brew.sh"
        exit 1
    fi
    
    brew install nginx
else
    echo -e "${GREEN}✅ Nginx 已安装${NC}"
    nginx -v
fi

# 2. 停止现有的 Nginx 进程
echo ""
echo "步骤 2: 停止现有的 Nginx 进程..."
sudo nginx -s stop 2>/dev/null || true
sudo brew services stop nginx 2>/dev/null || true
echo -e "${GREEN}✅ 已停止现有进程${NC}"

# 3. 创建必要的目录
echo ""
echo "步骤 3: 创建配置目录..."
sudo mkdir -p /usr/local/etc/nginx/sites-available
sudo mkdir -p /usr/local/etc/nginx/sites-enabled
sudo mkdir -p /var/log/nginx
sudo chmod 755 /var/log/nginx
echo -e "${GREEN}✅ 目录创建完成${NC}"

# 4. 备份原配置
echo ""
echo "步骤 4: 备份原有配置..."
if [ -f /usr/local/etc/nginx/nginx.conf ]; then
    sudo cp /usr/local/etc/nginx/nginx.conf /usr/local/etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ 已备份原配置${NC}"
fi

# 5. 复制配置文件
echo ""
echo "步骤 5: 部署配置文件..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
sudo cp "$SCRIPT_DIR/nginx.conf" /usr/local/etc/nginx/sites-available/miniprogram.conf

# 创建软链接
sudo ln -sf /usr/local/etc/nginx/sites-available/miniprogram.conf /usr/local/etc/nginx/sites-enabled/
echo -e "${GREEN}✅ 配置文件部署完成${NC}"

# 6. 修改主配置文件
echo ""
echo "步骤 6: 更新主配置文件..."
MAIN_CONF="/usr/local/etc/nginx/nginx.conf"

# 检查是否已包含 sites-enabled
if ! grep -q "sites-enabled" $MAIN_CONF; then
    echo "正在修改主配置文件..."
    # 备份
    sudo cp $MAIN_CONF ${MAIN_CONF}.pre-setup
    
    # 添加 include 指令（在 http 块的末尾）
    sudo sed -i '' '/^http {/,/^}/ s/^}$/    include \/usr\/local\/etc\/nginx\/sites-enabled\/*;\n}/' $MAIN_CONF 2>/dev/null || {
        echo -e "${YELLOW}⚠️  请手动编辑 $MAIN_CONF${NC}"
        echo "在 http {} 块中添加："
        echo "    include /usr/local/etc/nginx/sites-enabled/*;"
    }
fi
echo -e "${GREEN}✅ 主配置更新完成${NC}"

# 7. 测试配置
echo ""
echo "步骤 7: 测试配置文件..."
if sudo nginx -t; then
    echo -e "${GREEN}✅ 配置文件语法正确${NC}"
else
    echo -e "${RED}❌ 配置文件有错误，请检查${NC}"
    exit 1
fi

# 8. 启动 Nginx
echo ""
echo "步骤 8: 启动 Nginx..."
sudo nginx

# 检查是否启动成功
sleep 1
if pgrep -x nginx > /dev/null; then
    echo -e "${GREEN}✅ Nginx 启动成功！${NC}"
else
    echo -e "${RED}❌ Nginx 启动失败${NC}"
    exit 1
fi

# 9. 显示状态信息
echo ""
echo "================================"
echo -e "${GREEN}🎉 Nginx 配置完成！${NC}"
echo "================================"
echo ""
echo "📊 服务状态："
echo "   Nginx 进程: $(pgrep -x nginx | wc -l | tr -d ' ') 个"
echo "   监听端口: 80"
echo ""
echo "🔗 访问地址："
echo "   健康检查: http://localhost/health"
echo "   API 测试: http://localhost/api/v1/admin/ai-content/list?page=1&pageSize=2"
echo ""
echo "📝 日志文件："
echo "   访问日志: /var/log/nginx/miniprogram_access.log"
echo "   错误日志: /var/log/nginx/miniprogram_error.log"
echo ""
echo "🔧 常用命令："
echo "   重启: sudo nginx -s reload"
echo "   停止: sudo nginx -s stop"
echo "   查看日志: tail -f /var/log/nginx/miniprogram_access.log"
echo ""
echo "⚠️  下一步："
echo "   1. 测试 Nginx 是否正常工作"
echo "   2. 修改小程序配置指向 Nginx (config/server-mode.js)"
echo "   3. 重新编译小程序"
echo ""

# 10. 快速测试
echo "正在进行快速测试..."
echo ""
echo "测试 1: 健康检查"
HEALTH_CHECK=$(curl -s http://localhost/health)
if [ "$HEALTH_CHECK" = "healthy" ]; then
    echo -e "   ${GREEN}✅ 健康检查通过${NC}"
else
    echo -e "   ${RED}❌ 健康检查失败${NC}"
fi

echo ""
echo "测试 2: API 代理"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/api/v1/admin/ai-content/list?page=1&pageSize=1")
if [ "$API_STATUS" = "200" ]; then
    echo -e "   ${GREEN}✅ API 代理正常 (HTTP $API_STATUS)${NC}"
else
    echo -e "   ${YELLOW}⚠️  API 返回状态码: $API_STATUS${NC}"
    echo "   请确保后端服务器 (192.168.31.189:8000) 正在运行"
fi

echo ""
echo "================================"
echo "✨ 设置完成！"
echo "================================"

