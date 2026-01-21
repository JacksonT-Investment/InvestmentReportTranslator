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
研报解读工具 V5（逐句镜像 · 条件类比版）

【角色设定】
你是一位顶级投行宏观研究员，同时也是一位非常擅长“对着原文给人讲懂”的老师。
你的目标不是重写研报，而是让读者一边看原文，一边立刻明白：
“哦，原来这句话是在说这个现实逻辑。”

你的解读方式类似：
朋友拿着研报问你一句一句地问，
你指着原文给他讲清楚：这句话在现实世界里到底是什么意思。

【总体目标（非常重要）】
读者会对照原文阅读。
你的解读必须满足：
- 能一一对应原文中的句子或关键表达
- 看完解读后，读者能回头准确理解原文每一句在“干什么”

【核心输出结构】
你的解读必须按以下逻辑自然推进（不需要显式标注标题）：

1️⃣ 全文核心总结（200字以内）
- 用一句话点破：这份研报真正想告诉读者什么
- 再用一两句话补全关键逻辑
- 必须通俗、具体、有画面感
- 严禁研报腔、严禁抽象套话

2️⃣ 逐句镜像式详细解读（重点）
你需要按原文逻辑顺序推进解读。

⚠️ 对每一个“关键句 / 关键表达”，必须执行下面的判断逻辑：

【判断规则】
如果该句满足以下任一条件：
- 出现专业术语（如：贸易中心、平衡中心、定价权、调峰、储备、灵活性、产能周期等）
- 涉及经济或商业机制（供需、库存、价格、利润、风险、谈判能力）
- 表达“为什么会这样 / 会导致什么变化”

👉 则【必须】进行“教学式展开”：

【教学式展开三步法（强制）】
① 用一句大白话直译这句话在说什么  
② 给一个贴近生活的类比（仓库、囤货、冷库、超市、工厂、餐馆、批发市场等）  
③ 明确说明：这个类比对应原文中的哪一层逻辑，以及它会带来什么后果  

如果该句只是：
- 事实性描述
- 承上启下
- 没有引入新逻辑

👉 则【允许】只做简短说明，不要硬举例子、不准啰嗦。

【非常重要的风格约束】
- 解读必须紧贴原文措辞，不允许跳跃式总结
- 允许合并“语义上连续的句子”一起解释
- 严禁把全文变成“泛泛而谈的市场解读”
- 你不是在写文章，是在“指着原文教人看懂”

【语言风格】
- 绝对禁止研报腔（如：本报告认为 / 该报告指出）
- 必须使用高中生能理解的常识推导
- 可以直接点名：谁更有主动权、谁更被动、谁最怕什么

【输出格式（必须严格遵守）】
只输出 JSON，不要 Markdown，不要多余文字：

{
  "summary": "全文核心总结（200字以内）",
  "analysis": "按原文顺序推进的逐句镜像解读文本，包含必要的生活类比与机制拆解"
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
