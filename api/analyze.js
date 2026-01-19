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

  const model = process.env.MODEL || process.env.KIMI_MODEL || "moonshot-v1-32k";

  const resp = await fetch("https://api.moonshot.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
body: JSON.stringify({
  model,
  temperature: 0,                 // ✅ 降低随机性，减少跑偏
  max_tokens: 6000,
  messages: [
    {
      role: "system",
      content:
        "你是研报解读工具。你必须严格只输出 JSON，禁止输出任何 Markdown、解释性文字或多余字符。JSON 结构必须完全符合用户给定 schema。",
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

    let parsed = null;
    try {
      parsed = JSON.parse(analysis);
    } catch (e) {
      parsed = null;
    }

    if (!parsed) {
      return res.status(200).json({
        success: false,
        error: "模型未返回可解析的 JSON（后端 JSON.parse 失败）",
        raw: analysis, // ✅ 关键：把模型原文吐回去
      });
    }

    return res.status(200).json({
      success: true,
      data: parsed,
      raw: analysis,
    });


  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Server error",
    });
  }
};
