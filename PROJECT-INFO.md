# 研报解读助手 - 可编辑项目

## 📁 项目结构

```
研报解读助手/
├── 📄 index.html              # 主页 - 文件上传功能
├── 📄 result.html             # 结果页 - 分析结果展示
├── 📄 about.html              # 关于页 - 使用说明
├── 📄 main.js                 # 前端JavaScript逻辑
├── 📄 app.js                  # 后端Express服务器
├── 📄 package.json            # 项目依赖配置
├── 📄 .env.example            # 环境变量模板
├── 📄 README.md               # 项目说明文档
└── 📁 uploads/                # 文件上传目录
```

## 🎯 核心文件说明

### 前端文件（用户界面）

#### `index.html` - 主页
- **功能**: 文件上传、功能介绍、用户引导
- **可编辑部分**:
  - 页面标题和描述
  - 上传区域样式
  - 功能特色内容
  - 颜色和布局

#### `result.html` - 结果页
- **功能**: 显示分析结果、原文对照、重点提炼
- **可编辑部分**:
  - 结果展示格式
  - 导航结构
  - 样式和布局
  - 导出功能

#### `about.html` - 关于页
- **功能**: 使用说明、常见问题、联系方式
- **可编辑部分**:
  - 功能介绍文案
  - FAQ内容
  - 联系信息

#### `main.js` - 前端逻辑
- **功能**: 文件上传、API调用、页面交互
- **可编辑部分**:
  - 上传逻辑
  - 错误处理
  - 动画效果
  - API配置

### 后端文件（服务器逻辑）

#### `app.js` - Express服务器
- **功能**: 文件接收、API路由、静态文件服务
- **可编辑部分**:
  - API端点
  - 文件处理逻辑
  - 错误处理
  - 中间件配置

#### `package.json` - 项目配置
- **功能**: 依赖管理、脚本配置
- **可编辑部分**:
  - 项目名称和版本
  - 依赖包版本
  - 脚本命令

## ✏️ 如何编辑

### 编辑HTML文件
打开 `.html` 文件，可以修改：
- 文字内容
- 颜色样式
- 布局结构
- 图片和图标

### 编辑JavaScript文件
打开 `.js` 文件，可以修改：
- 功能逻辑
- API配置
- 动画效果
- 错误处理

### 编辑CSS样式
样式内嵌在HTML文件中，可以直接修改：
- 颜色变量
- 字体设置
- 布局参数
- 动画效果

## 🚀 快速开始

### 1. 本地运行
```bash
# 使用Node.js启动服务器
node app.js

# 或使用简单版本
node simple-server.js
```

### 2. 访问网站
```
http://localhost:3000 或 http://localhost:8081
```

### 3. 测试功能
- 上传PDF文件
- 查看分析结果
- 测试各种功能

## 🎨 自定义建议

### 修改颜色主题
在HTML文件的 `<style>` 标签中修改：
```css
:root {
  --primary-color: #1a365d;    /* 主色调 */
  --accent-color: #d69e2e;     /* 强调色 */
  --text-color: #2d3748;       /* 文字颜色 */
}
```

### 修改布局
在HTML文件中修改Tailwind CSS类：
```html
<div class="grid md:grid-cols-2 gap-6">
  <!-- 修改为其他布局 -->
</div>
```

### 修改功能
在JavaScript文件中修改功能逻辑：
```javascript
// 修改上传处理
async handleFileUpload(file) {
  // 自定义逻辑
}
```

## 🔄 更新部署

### 修改后重新部署
1. 编辑文件
2. 保存更改
3. 重新启动服务器
4. 查看效果

### 部署到生产环境
```bash
# 使用PM2进程管理
pm2 start app.js --name "yanbao-assistant"

# 或使用 forever
forever start app.js
```

## 📋 检查清单

编辑完成后，请检查：
- [ ] 所有链接是否正常
- [ ] 文件上传功能是否正常
- [ ] 样式是否正确显示
- [ ] 移动端是否适配
- [ ] 错误处理是否完善

## 💡 常见问题

### Q: 修改后不生效？
A: 需要重启服务器，清除浏览器缓存

### Q: 样式显示异常？
A: 检查CSS语法是否正确，类名是否拼写正确

### Q: 功能无法正常工作？
A: 检查浏览器控制台错误信息，查看网络请求

## 🎮 开发建议

### 推荐工具
- **VS Code**: 代码编辑器
- **Chrome DevTools**: 调试工具
- **Postman**: API测试工具

### 学习资源
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [JavaScript教程](https://javascript.info/)
- [Node.js文档](https://nodejs.org/docs)

---

**开始编辑您的研报解读助手吧！** 🚀

所有文件都是可编辑的，您可以根据需求自由修改。有任何问题随时告诉我！