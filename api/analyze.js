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

function splitIntoParagraphs(rawText) {
  // 统一换行
  let t = String(rawText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // pdf-parse 常见问题：每行都换行。我们用“空行”来判断段落。
  // 先把连续 3+ 换行压缩成 2 个
  t = t.replace(/\n{3,}/g, "\n\n");

  // 按空行切段
  let blocks = t.split(/\n\s*\n/g).map(s => s.trim()).filter(Boolean);

  // 如果 blocks 太少（说明没有空行分段），就按“单换行”做兜底合并
  if (blocks.length <= 3) {
    const lines = t.split("\n").map(s => s.trim());
    const merged = [];
    let buf = [];
    for (const line of lines) {
      if (!line) {
        if (buf.length) {
          merged.push(buf.join(" "));
          buf = [];
        }
        continue;
      }
      buf.push(line);
    }
    if (buf.length) merged.push(buf.join(" "));
    blocks = merged.filter(Boolean);
  }

  return blocks;
}

function buildPrompt(textContent) {
  return `
研报解读工具 V3

【角色设定】
你是一位顶级投行宏观策略专家，同时也是一位极其擅长大众科普的财经作家。
你的任务是：把下面这份研报，用普通散户也能完全听懂的方式讲清楚。
你的说话方式不是分析师写报告，
而是一个长期看这个行业、已经想明白了的人，
在咖啡馆里给朋友讲清楚这份研报值不值得看。


【核心要求（非常重要）】
1. 先给【全文核心总结】（200 字以内）
   - 像在给朋友解释：这份报告“本质在说什么”
   - 不要复述原文，不要像研报摘要
   - 你必须明确回答：这份研报“真正想告诉读者的一句话是什么”


2. 然后给【全文详细解读】
   - 按原文逻辑顺序讲清楚每一部分在干什么
   - 用生活化比喻、因果解释、白话拆解
   - 重点讲清楚：为什么重要、在担心什么、在赌什么

3. 解读目标
   - 高中生能听懂
   - 没学过金融也能理解
   - 看完能说清“这份研报到底在讲啥”

【严格禁止】
- 不要复述原文
- 不要逐句翻译
- 不要用研报腔
- 不要使用没解释的金融黑话
- 严禁使用“本报告认为 / 本文指出 / 该报告讨论”等研报式句型
- 如果你的表达像券商摘要页，说明你失败了


【输出格式（必须严格遵守）】
请只输出 JSON，不要 Markdown，不要多余文字：

{
  "summary": "全文核心总结（200字以内）",
  "analysis": "完整的人话版研报解读（多段文字）"
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
  max_tokens: 12000,
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

const paragraphs = splitIntoParagraphs(textContent);

// 控制一下段落数量，避免超长（先保守 80 段，你后面可以再调大）
const limitedParas = paragraphs.slice(0, 80);

// 关键：把“段落数组”作为输入，让模型严格对齐输出 paragraphs 数量
const prompt = buildPrompt(textContent);

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
