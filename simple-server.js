const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
  // 解析URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 路由处理
  if (pathname === '/' || pathname === '/index.html') {
    serveFile(res, 'app.html', 'text/html');
  } else if (pathname === '/result' || pathname === '/app-result.html') {
    serveFile(res, 'app-result.html', 'text/html');
  } else if (pathname === '/api/analyze' && req.method === 'POST') {
    handleFileUpload(req, res);
  } else if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    // 静态文件服务
    const filePath = pathname.substring(1);
    const ext = path.extname(filePath);
    const contentType = getContentType(ext);
    serveFile(res, filePath, contentType);
  }
});

function serveFile(res, filePath, contentType) {
  const fullPath = path.join(__dirname, filePath);
  
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function getContentType(ext) {
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return contentTypes[ext] || 'text/plain';
}

function handleFileUpload(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    console.log('收到文件上传请求');
    
    // 模拟处理延迟
    setTimeout(() => {
      const mockResult = {
        success: true,
        data: {
          title: '测试研报',
          summary: '这是模拟的分析结果。在完整版本中，这里将显示基于上传文件的AI分析，包括核心观点、关键数据和投资建议。当前版本用于演示完整功能流程。',
          sections: [
            {
              original: "原文：本报告分析了当前市场情况。数据显示，市场指数上涨了15%，交易量达到1000亿元。投资者情绪积极，未来预期乐观。",
              interpretation: "解读：这份报告在分析现在的市场情况。数据告诉我们，市场指数涨了15%，交易量达到了1000亿元。投资者的情绪很好，对未来的预期也很乐观。",
              keyPoints: ["市场指数上涨15%", "交易量达1000亿元", "投资者情绪积极"]
            },
            {
              original: "原文：基于技术分析和基本面研究，我们认为科技股和金融股具有较好的投资机会。建议关注龙头企业，控制投资风险。",
              interpretation: "解读：通过技术分析和基本面研究，我们认为科技股和金融股有很好的投资机会。建议大家关注行业里的龙头公司，同时要注意控制投资风险。",
              keyPoints: ["科技股投资机会", "金融股值得关注", "关注龙头企业"]
            }
          ]
        },
        filename: 'test-file.pdf'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockResult));
      console.log('✅ 分析完成，返回结果');
    }, 2000);
  });
}

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log('🚀 研报解读助手启动成功！');
  console.log(`📡 访问地址: http://localhost:${PORT}`);
  console.log(`📝 主页: http://localhost:${PORT}/`);
  console.log(`📊 结果页: http://localhost:${PORT}/result`);
  console.log(`🔍 API: http://localhost:${PORT}/api/analyze`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('✅ 服务器已就绪！');
  console.log('📖 使用步骤：');
  console.log('1. 打开浏览器访问 http://localhost:3000');
  console.log('2. 上传一个PDF、Word或图片文件');
  console.log('3. 等待2秒模拟处理时间');
  console.log('4. 查看完整的分析结果');
  console.log('');
  console.log('💡 这是一个功能完整的演示版本');
  console.log('   如需真实的AI分析，请联系开发者配置Kimi API');
});