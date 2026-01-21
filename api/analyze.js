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
研报解读工具 V4（教学型强约束版）

【角色设定】
你是一位顶级投行宏观研究员，同时也是一位极擅长给零基础读者“搭认知模型”的老师。
你的目标不是“解释研报”，而是让普通散户真正理解：这件事在现实世界里是怎么运作的。
你的表达方式像在咖啡馆聊天：直白、具体、有画面感，但逻辑非常严谨。

【根本目标（极其重要）】
读完你的解读后，读者必须能回答这 3 个问题：
1）这份研报在担心什么 / 押注什么？
2）作者认为“事情为什么会这样发展”？（关键因果链）
3）如果用生活中的例子，这套逻辑长什么样？

如果任何一段读完后，这 3 个问题答不上来，说明你没有完成任务。

【强制写作规则（决定质量）】

✅ 规则1：所有抽象概念必须“落地三连”
只要原文出现抽象概念或宏观表述（例如：贸易中心/平衡中心/枢纽/定价权/调峰/储备/灵活性/需求放缓但地位提升等），你必须强制执行三步：
(1) 一句话翻译：用一句大白话说清楚“它到底在讲什么”
(2) 生活类比（必须具体）：用现实生活场景解释（仓库/囤货/冷库/菜市场批发/二手倒卖/高峰限价/备货应急等）
(3) 对照解释：明确指出“原文哪句话”对应“生活类比哪一步”，并推导出“会导致什么结果”
——三步缺任何一步都不合格。

✅ 规则2：禁止“只下结论，不跑机制”
禁止只写“这意味着/因此/反映出”这种总结句，除非你已经写清楚：
A 发生了什么 → B 怎么反应 → C 为什么会改变价格/利润/行业格局/风险。

✅ 规则3：把作者脑子里的“流程图”画出来
你要假设作者在脑子里画了一张机制流程图，你的任务是把流程图用文字画出来，而不是只说结论。

✅ 规则4：每一段至少给一个“画面”
每段详细解读里至少出现一个具体画面或比喻，让读者能“想象出来”。
（例：像开餐馆的人有冷库，能低价囤货，高价卖出；没有冷库只能现买现卖，被动挨打。）

【语言风格】
- 绝对不要研报腔，不要“本报告认为/本文指出/该报告讨论”
- 不要堆术语；必须用高中生懂的常识推导：成本、库存、现金流、供需、谈判、风险、代价
- 可以直说：谁赚/谁亏/谁更有主动权/谁最怕什么

【输出要求】
你必须输出两部分：
1）全文核心总结（200字以内）：用一句话点破“研报真正想告诉你什么”，再用一两句补足关键机制。必须通俗、具体、有画面，禁止抽象空话。
2）全文详细解读：多段文字，按原文顺序推进，但要把机制讲透。重点讲清楚：在担心什么、在赌什么、为什么。

【严格禁止】
- 不要复述原文
- 不要逐句翻译
- 不要写成研报摘要
- 不要只把专业词换成普通词（那叫“机械去术语”，不叫解读）
- 不要输出 Markdown，只能输出 JSON

【输出格式（必须严格遵守）】
只输出 JSON：

{
  "summary": "全文核心总结（200字以内）",
  "analysis": "完整的人话版研报解读（多段文字，必须大量使用生活类比与机制拆解）"
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
