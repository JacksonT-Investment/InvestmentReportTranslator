# 研报解读助手 - 完整版本部署说明

## 系统架构

```
用户上传文件 → 后端API → 文本提取 → Kimi API → 结果返回 → 前端展示
```

## 部署要求

### 必需条件
1. **Node.js** (v16或更高版本)
2. **Kimi API Key** - 需要从Moonshot AI获取
3. **服务器** - 支持文件上传和API调用

### 可选条件
- **PM2** - 用于生产环境进程管理
- **Nginx** - 用于反向代理和SSL

## 安装步骤

### 1. 克隆项目
```bash
git clone [项目地址]
cd yanbao-assistant
```

### 2. 安装依赖
```bash
# 安装后端依赖
npm install

# 安装PM2（可选，用于生产环境）
npm install -g pm2
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入您的配置：
```env
# 必需：Kimi API Key
KIMI_API_KEY=your_kimi_api_key_here

# 可选：服务器端口（默认3001）
PORT=3001

# 可选：Node环境
NODE_ENV=production
```

**如何获取Kimi API Key：**
1. 访问 https://platform.moonshot.cn/
2. 注册/登录账号
3. 创建API Key
4. 将Key填入 `.env` 文件

### 4. 启动服务

#### 开发环境
```bash
npm run dev
```

#### 生产环境
```bash
# 使用PM2启动
pm2 start server.js --name "yanbao-assistant"

# 查看日志
pm2 logs yanbao-assistant

# 重启服务
pm2 restart yanbao-assistant

# 停止服务
pm2 stop yanbao-assistant
```

### 5. 前端配置

前端代码需要修改API地址：

编辑 `main.js`，将 `http://localhost:3001/api/analyze` 改为实际的后端地址：
```javascript
const response = await fetch('http://your-backend-domain.com/api/analyze', {
    method: 'POST',
    body: formData
});
```

### 6. 使用Nginx反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/your/frontend;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 增加超时时间（文件处理可能需要较长时间）
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

## 文件处理说明

### 支持的文件格式
- **PDF** (.pdf) - 直接文本提取
- **Word文档** (.doc, .docx) - 使用mammoth库解析
- **图片** (.jpg, .png, .jpeg) - 使用Tesseract.js OCR

### 文件大小限制
- 默认最大50MB
- 可在 `server.js` 中修改 `MAX_FILE_SIZE`

### 文本提取策略
1. **PDF** - 保留原始格式和段落结构
2. **Word** - 提取纯文本，保持段落
3. **图片** - OCR识别，可能有一定误差

## Kimi API配置

### 模型选择
当前使用 `kimi-long-128k` 模型，支持长文本处理。

### Token限制
- 输入：最大128K tokens
- 输出：最大4K tokens
- 如果研报超过限制，会自动分段处理

### 费用考虑
- Kimi API按token计费
- 建议设置单用户每日调用次数限制
- 可添加用户认证系统控制使用量

## 生产环境优化

### 性能优化
1. **文件缓存** - 相同文件避免重复处理
2. **异步处理** - 大文件使用队列处理
3. **CDN加速** - 前端资源使用CDN

### 安全优化
1. **文件类型验证** - 严格检查上传文件类型
2. **文件大小限制** - 防止恶意大文件上传
3. **速率限制** - 防止API滥用
4. **CORS配置** - 限制跨域请求

### 监控和日志
1. **PM2监控** - 使用PM2监控服务状态
2. **日志记录** - 记录API调用和错误
3. **健康检查** - 定期检测服务状态

## 故障排除

### 常见问题

**1. API调用失败**
- 检查Kimi API Key是否正确
- 检查网络连接
- 查看控制台错误日志

**2. 文件上传失败**
- 检查文件格式是否支持
- 检查文件大小是否超过限制
- 检查服务器磁盘空间

**3. 文本提取失败**
- PDF文件可能加密或损坏
- 图片分辨率太低影响OCR
- Word文件格式不兼容

### 日志查看
```bash
# PM2日志
pm2 logs yanbao-assistant

# 应用日志
tail -f /path/to/your/app/logs/error.log
```

## 扩展功能建议

### 未来可添加的功能
1. **用户系统** - 注册登录、历史记录
2. **支付系统** - 按次付费或订阅制
3. **高级分析** - 多研报对比分析
4. **数据可视化** - 图表展示分析结果
5. **批量处理** - 支持多个文件同时上传

### API文档
启动服务后访问：`http://localhost:3001/api/health` 查看服务状态

## 技术支持

如有问题，请检查：
1. 环境变量是否正确配置
2. 依赖是否完整安装
3. 端口是否被占用
4. 防火墙是否阻止了请求

---

**部署完成后，您的研报解读助手将能够：**
- ✅ 真正处理用户上传的文件
- ✅ 调用Kimi API进行智能解读
- ✅ 按照您提供的prompt格式生成分析
- ✅ 支持PDF、Word、图片等多种格式
- ✅ 实时返回分析结果

祝部署顺利！