#!/bin/bash

# 研报解读助手启动脚本 - 真实Kimi API版本

echo "=========================================="
echo "  研报解读助手 - 真实Kimi API版本"
echo "=========================================="
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装Node.js"
    echo "请先安装Node.js (v16或更高版本)"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js版本: $(node --version)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未安装npm"
    exit 1
fi

echo "✅ npm版本: $(npm --version)"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "❌ 错误: 未找到.env文件"
    echo "请复制 .env.example 为 .env 并配置您的Kimi API Key"
    echo ""
    echo "步骤:"
    echo "1. cp .env.example .env"
    echo "2. 编辑 .env 文件，填入您的Kimi API Key"
    echo "3. 重新运行此脚本"
    exit 1
fi

# 检查Kimi API Key
if ! grep -q "KIMI_API_KEY=" .env | grep -v "your_kimi_api_key_here"; then
    echo "❌ 错误: Kimi API Key 未配置"
    echo "请在 .env 文件中设置您的Kimi API Key"
    echo ""
    echo "示例: KIMI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

echo "✅ Kimi API Key 已配置"

# 检查并安装依赖
if [ ! -d "node_modules" ]; then
    echo ""
    echo "=========================================="
    echo "  安装依赖"
    echo "=========================================="
    echo "正在安装依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# 创建上传目录
mkdir -p uploads

# 启动服务
echo ""
echo "=========================================="
echo "  启动服务"
echo "=========================================="

echo "正在启动研报解读助手..."
echo ""
echo "服务地址: http://localhost:3000"
echo "API地址: http://localhost:3000/api/analyze"
echo "健康检查: http://localhost:3000/api/health"
echo ""
echo "使用模型: moonshot-v1-8k"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动Node.js服务
node server.js