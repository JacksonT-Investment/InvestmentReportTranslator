// api/analyze.js
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

// Node 18+ on Vercel supports global fetch. If your environment doesn't, uncomment next line:
// const fetch = require("node-fetch");

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// IMPORTANT: Disable Vercel's default bodyParser so multer can handle multipart/form-data
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

// Use memoryStorage for serverless (no reliance on local disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB (you can adjust)
  },
});

async function extractTextFromUploadedFile(file) {
  const name = (file.originalname || "").toLowerCase();
  const mime = (file.mimetype || "").toLowerCase();
  const buf = file.buffer;

  // PDF
  if (mime.includes("pdf") || name.endsWith(".pdf")) {
    const data = await pdfParse(buf);
    return (data.text || "").trim();
  }

  // DOCX
  if (
    mime.includes("word") ||
    mime.includes("officedocument.wordprocessingml.document") ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: buf });
    return (result.value || "").trim();
  }

  // TXT / Markdown
  if (
    mime.includes("text/plain") ||
    mime.includes("text/markdown") ||
    name.endsWith(".txt") ||
    name.endsWith(".md")
  ) {
    return buf.toString("utf8").trim();
  }

  // Images (placeholder)
  if (
    mime.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  ) {
    return "【提示】你上传的是图片，但当前版本尚未接入 OCR，无法从图片中提取文字。请上传 PDF 或 DOCX 版本研报。";
  }

  return `【提示】暂不支持的文件类型：${file.mimetype || file.originalname || "unknown"}`;
}

function buildPrompt(textContent) {
  return `
研报解读工具 V3

【角色设定】
你是一位顶级投行宏观策略专家，同时也是一位极其擅长大众科普的财经作家。你的任务是将专业的研报内容，翻译成高中生及零金融基础的散户也能完全听懂的深度解读。

【核心规则】
1. 全文核心总结（置顶输出）：在开始具体段落解读前，必须先用一个段落（200字以内）概括整篇研报的核心结论。
2. 全文覆盖与原文镜像：
   a. 必须包含全文所有内容，严禁概括、严禁省略、严禁跳段。
   b. 【原文】模块必须做到一字不差的镜像摘录，严禁对原文做任何删减、改动或逻辑重组。
3. 结构对齐：必须严格遵循原文的自然段落结构。每一段落必须按以下格式输出：
   a.【原文】：镜像摘录该段落的完整原始文字。
   b.【解读（逐句还原段落版）】：针对该段落的每一句话进行大白话转化，严禁漏掉任何逻辑转折和数据，最后汇总成一个完整的段落。
   c.【重点数据与逻辑提炼】：使用[关键点]格式列出核心数据、年份或逻辑，并进行深度解释（每段至少列3-5个）。
4. 颗粒度要求：解读部分必须做到“地毯式还原”，原文中的每一个数字、每一个年份、每一个括号内的备注、每一个逻辑转折都必须在解读中体现。
5. 语言风格：
   a. 严禁“爹味”说教，严禁使用未解释的金融黑话。
   b. 用高中生熟悉的常识做推导。
   c. 客观、专业但易懂。

【针对《黄金定价》研报第一段落的演示执行】
【全文核心总结】 这份报告的核心观点是：黄金已经变天了。以前大家都觉得黄金值钱是因为它稀缺或者能防涨价，但现在的真相是，黄金正变成全球“分家”后的保险。虽然巴菲特这类大佬觉得黄金不能生钱没啥用，但那些不信任美元的国家（特别是亚洲国家）正在疯狂买入。这种“去美元化”的动力已经踢飞了以前的旧规矩，让黄金在利息很高的时候依然猛涨。
【原文】黄金内在价值存在争议：稀缺投资品还是“博傻”游戏？黄金作为一种贵金属资源，自古以来承载着货币和商品双重属性。正如马克思所说，“金银天然不是货币，但货币天然是金银”。黄金作为交换媒介的功能源远流长，在最高峰时发展成金本位制。1970年代布雷顿森林体系瓦解，信用货币体系取代金汇兑本位制，美元发行不再挂钩黄金，但黄金的货币属性仍深入人心。除了货币属性，黄金还具有商品属性。但是相比一般的工业金属，黄金重且柔软，工业用途相对受限。事实上，工业需求在黄金的占比自2010年以来持续下降，截至2023年占比不足7%（图表1）。在现代金融体系之中，黄金逐渐被视作一类特殊的金融资产，它既可以作为抵御通货膨胀的对冲工具，也是将价值储存在金融体系之外的“避风港”。
【解读（逐句还原段落版）】 大家对于黄金到底值不值钱这件事一直有很多争论：它到底是稀有的投资好东西，还是一场“看谁比我傻”的接盘游戏？黄金这种贵金属，打从古时候起就同时有“当钱花”和“当货卖”这两种身份。就像马克思曾说过的，金子和银子生下来不一定非得是钱，但钱最合适的形式天生就是金银。黄金拿来当买卖中介的历史非常久，最厉害的时候演变成了全世界都认的“金本位”制度。到了1970年代，老规矩崩了，靠国家名誉发行的钱取代了能换金子的制度，美元发行不再和黄金挂钩了，但大家心里还是觉得金子才是真钱。除了当钱，金子也有当货物的身份，但跟铜铁这些工业金属比，金子又重又软，在工厂里能干的活儿非常有限。实际上，工厂买金子的比例从2010年开始就一直在掉，到2023年连7%都不到（大家可以看图表1）。在现在的金融世界里，黄金被看成一种很特别的资产，它既能拿来抵抗物价上涨带来的贬值，也是一个能把财富存在整个银行系统外面的安全避难所。
【重点数据与逻辑提炼】
●[不足7%]：这是全段最硬的数据。它告诉散户黄金不是一种普通的“工业原材料”，因为93%的需求都与工厂生产无关，它是纯粹的金融资产。
●[金本位制]：指以前印钱必须有金子撑腰的制度。虽然现在这个制度没了，但原文强调黄金的“货币属性”依然刻在大家脑子里。
●[信用货币体系]：指现在这种靠国家名誉印的纸币。原文通过这个词暗示了纸币如果不值钱了，黄金的价值就会凸显。
●[金融体系之外]：这是一个极关键的逻辑点。意思是如果银行系统、美元系统出问题了，黄金依然有效，因为它不依赖于任何国家的承诺。


【输出格式要求（必须严格遵守）】
请只输出 JSON（不要输出任何多余文字、不要用 Markdown），结构如下：
{
  "summary": "200字以内的全文核心总结",
  "paragraphs": [
    {
      "original": "（该段原文，一字不差）",
      "interpretation": "（逐句还原后的白话整段）",
      "keyPoints": ["[关键点] ...", "[关键点] ...", "[关键点] ..."]
    }
  ]
}

【研报原文】
${textContent}
  `.trim();
}

async function callKimi(prompt) {
  const apiKey =
    process.env.MOONSHOT_API_KEY ||
    process.env.KIMI_API_KEY ||
    process.env.MOONSHOT_KEY;

  if (!apiKey) {
    throw new Error(
      "缺少 API Key：请在 Vercel 项目 Settings → Environment Variables 里设置 MOONSHOT_API_KEY（或 KIMI_API_KEY）"
    );
  }

  const model = process.env.KIMI_MODEL || "moonshot-v1-8k";

  const resp = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "你是专业研报解读助手，输出要清晰、结构化、面向普通投资者。",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Kimi API 调用失败：HTTP ${resp.status} ${t}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return content;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    // Accept ANY field name, pick the first file
    await runMiddleware(req, res, upload.any());

    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({
        success: false,
        error:
          "没有收到文件。请确认前端使用 multipart/form-data 上传，并且确实选择了文件。",
      });
    }

    const file = files[0];

    const textContent = await extractTextFromUploadedFile(file);
    if (!textContent || textContent.length < 20) {
      return res.status(400).json({
        success: false,
        error:
          "提取到的文本太少，可能是扫描版 PDF 或图片。请换可复制文字的 PDF/DOCX。",
      });
    }

    // Avoid super long input for now (you can upgrade to chunking later)
    const clipped = textContent.slice(0, 12000);

    const prompt = buildPrompt(clipped);
    const analysis = await callKimi(prompt);

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Server error",
    });
  }
};
