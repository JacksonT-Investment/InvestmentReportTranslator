// 简化测试版本 - 不依赖外部包
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建简单的测试服务器
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else if (req.url === '/api/analyze' && req.method === 'POST') {
    // 模拟分析过程
    console.log('收到分析请求，模拟处理中...');
    
    // 模拟延迟
    setTimeout(() => {
      const mockResponse = {
        success: true,
        data: `【全文核心总结】
        这份测试研报的核心观点是：市场呈现积极态势。通过分析发现，市场指数上涨了15%，交易量达到1000亿元，显示投资者信心较强。

【原文】
本报告分析了当前市场情况。数据显示，市场指数上涨了15%，交易量达到1000亿元。

【解读（逐句还原段落版）】
这份报告在分析现在的市场情况。数据告诉我们，市场指数涨了15%，交易量达到了1000亿元。

【重点数据与逻辑提炼】
●[15%] - 市场指数涨幅，显示市场表现良好
●[1000亿元] - 交易量数据，反映市场活跃程度
●[积极态势] - 整体市场趋势判断
`,
        filename: 'test-report.txt'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mockResponse));
      console.log('✅ 分析完成，返回结果');
    }, 2000);
    
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log('🚀 测试服务器启动成功！');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📤 API测试: http://localhost:${PORT}/api/analyze`);
  console.log('');
  console.log('✅ 服务器已就绪，可以开始测试！');
  console.log('');
  console.log('下一步：');
  console.log('1. 打开 http://localhost:3001 查看前端页面');
  console.log('2. 上传测试文件');
  console.log('3. 观察API调用过程');
});