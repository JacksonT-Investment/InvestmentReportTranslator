# 研报解读助手 - 真实Kimi API版本

## 🎯 项目简介

这是一个专为散户投资者设计的券商研究报告解读工具，**集成了真实的Kimi API**。用户上传研报文件后，系统会调用Kimi的moonshot-v1-8k模型进行深度解读，将专业的金融术语转化为通俗易懂的语言。

## 🚀 快速开始

### 1. 获取Kimi API Key
访问 https://platform.moonshot.cn/ 获取您的API Key

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入您的Kimi API Key
# 示例：
KIMI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. 安装依赖
```bash
npm install
```

### 4. 启动服务
```bash
# 使用启动脚本
./start.sh

# 或直接启动
npm start
# 或
node server.js
```

### 5. 访问网站
```
http://localhost:3000
```

## 📁 文件结构

### 前端文件（用户界面）
- `index.html` - 主页，包含文件上传功能
- `result.html` - 结果页，展示分析结果
- `about.html` - 关于页，使用说明
- `main.js` - 前端交互逻辑

### 后端文件（服务器逻辑）
- `server.js` - Express服务器，处理文件上传和调用Kimi API
- `package.json` - 项目依赖配置
- `.env.example` - 环境变量模板
- `start.sh` - 启动脚本

### 文档文件
- `README.md` - 项目说明
- `PROJECT-INFO.md` - 项目详细信息
- `DEPLOYMENT.md` - 部署文档

### 配置信息
- 使用模型：**moonshot-v1-8k**
- 支持格式：PDF、Word、图片
- 文件大小限制：50MB

## ✏️ 如何编辑

### 修改颜色主题
在CSS中修改变量：
```css
:root {
  --primary-color: #1a365d;      /* 主色调 */
  --accent-color: #d69e2e;       /* 强调色 */
  --bg-gradient-start: #1a365d;  /* 渐变起始 */
  --bg-gradient-end: #3182ce;    /* 渐变结束 */
}
```

### 修改文字内容
直接编辑HTML文件中的文字：
```html
<h1 class="hero-title">让专业研报变得通俗易懂</h1>
<p>上传券商研究报告，AI帮您翻译...</p>
```

### 修改布局
编辑Tailwind CSS类名：
```html
<div class="grid md:grid-cols-2 gap-6">
  <!-- 修改为其他布局 -->
</div>
```

### 修改功能逻辑
编辑JavaScript文件：
```javascript
// 修改上传处理
async handleFileUpload(file) {
  // 自定义逻辑
}
```

### 修改API配置
编辑server.js文件：
```javascript
// 修改API端点
app.post('/api/analyze', upload.single('report'), async (req, res) => {
  // 自定义处理逻辑
});
```

## 🎨 自定义建议

### 颜色修改
- 主色调：修改 `--primary-color`
- 强调色：修改 `--accent-color`
- 文字色：修改 `--text-color`

### 布局修改
- 使用Tailwind CSS的网格系统
- 调整间距和边距
- 修改响应式断点

### 功能增强
- 添加新的文件格式支持
- 增加用户认证功能
- 添加数据可视化
- 集成真实的AI API

## 🔄 更新部署

1. 编辑文件
2. 保存更改
3. 重启服务器：
   ```bash
   npm restart
   # 或
   node server.js
   ```
4. 查看效果

## 📋 检查清单

编辑完成后，请检查：
- [ ] 所有页面链接正常
- [ ] 文件上传功能正常
- [ ] 样式正确显示
- [ ] 移动端适配良好
- [ ] 错误处理完善

## 🚀 部署到生产环境

### 使用PM2
```bash
npm install -g pm2
pm2 start server.js --name "yanbao-assistant"
```

### 使用Docker
```dockerfile
FROM node:16
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
```

### 使用Nginx反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 💡 扩展功能建议

### 前端扩展
- 添加用户登录系统
- 实现历史记录功能
- 添加收藏功能
- 增加分享功能

### 后端扩展
- 添加数据库支持
- 实现用户管理
- 添加支付功能
- 集成真实的AI API

### 性能优化
- 添加文件缓存
- 实现CDN加速
- 添加压缩功能
- 优化图片处理

## 🐛 常见问题

### Q: 修改后不生效？
A: 需要重启服务器，清除浏览器缓存

### Q: 样式显示异常？
A: 检查CSS语法是否正确，类名是否拼写正确

### Q: 功能无法正常工作？
A: 检查浏览器控制台错误信息，查看网络请求

### Q: 如何配置真实AI API？
A: 需要获取Kimi API Key，修改server.js中的分析逻辑

## 📚 学习资源

- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [JavaScript教程](https://javascript.info/)
- [Node.js文档](https://nodejs.org/docs)
- [Express.js文档](https://expressjs.com/)

## 📞 技术支持

如有问题，请检查：
- 环境变量是否正确配置
- 依赖是否完整安装
- 端口是否被占用
- 防火墙是否阻止请求

---

**开始编辑您的研报解读助手吧！** 🚀

所有文件都是可编辑的，您可以根据需求自由修改。有任何问题随时告诉我！