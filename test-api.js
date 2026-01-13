const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试API是否正常工作的脚本

async function testAPI() {
    console.log('🧪 测试研报解读助手API');
    console.log('==========================================');
    
    try {
        // 1. 测试健康检查
        console.log('1. 测试健康检查...');
        const healthResponse = await axios.get('http://localhost:3001/api/health');
        console.log('✅ 健康检查通过:', healthResponse.data);
        
        // 2. 测试文件上传（需要准备一个测试文件）
        console.log('\n2. 测试文件上传...');
        
        // 创建一个简单的测试文本文件
        const testContent = `
        测试研报标题
        
        本报告分析了当前市场情况。数据显示，市场指数上涨了15%，交易量达到1000亿元。
        
        我们认为，未来市场将继续保持增长态势。主要基于以下原因：
        1. 经济数据持续向好
        2. 政策支持力度加大
        3. 市场情绪积极
        
        建议投资者关注科技股和金融股的投资机会。
        `;
        
        fs.writeFileSync('test-report.txt', testContent);
        
        const formData = new FormData();
        formData.append('report', fs.createReadStream('test-report.txt'));
        
        try {
            const uploadResponse = await axios.post('http://localhost:3001/api/analyze', formData, {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 60000 // 60秒超时
            });
            
            console.log('✅ 文件上传成功');
            console.log('📄 文件名:', uploadResponse.data.filename);
            console.log('📊 分析结果长度:', uploadResponse.data.data.length, '字符');
            
            // 清理测试文件
            fs.unlinkSync('test-report.txt');
            
        } catch (uploadError) {
            if (uploadError.response) {
                console.log('❌ 上传失败:', uploadError.response.data);
            } else if (uploadError.code === 'ECONNREFUSED') {
                console.log('❌ 无法连接到服务器，请确保服务已启动');
            } else {
                console.log('❌ 上传失败:', uploadError.message);
            }
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log('❌ 无法连接到服务器');
            console.log('💡 请确保服务已启动: node server.js');
        } else {
            console.log('❌ 测试失败:', error.message);
        }
    }
}

// 运行测试
if (require.main === module) {
    testAPI();
}

module.exports = { testAPI };