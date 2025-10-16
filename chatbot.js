const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs").promises; // use async fs
const fetch = global.fetch || ((...args) => import("node-fetch").then(({default: f}) => f(...args)));

dotenv.config();

const app = express();
app.use(express.json());

// ---------------- Config ----------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY missing in .env");
  process.exit(1);
}
const GEMINI_API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`; 

// Folder for JSON knowledge files
const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge_json");

// ---------------- CORS ----------------


app.use(
  cors()
); 

// ---------------- Helpers ----------------
// async function loadAllKnowledge() {
//   const kfs = [];
//   try {
//     const entries = await fs.readdir(KNOWLEDGE_DIR);
//     for (const fname of entries) {
//       if (fname.endsWith(".json")) {
//         const fullPath = path.join(KNOWLEDGE_DIR, fname);
//         const raw = await fs.readFile(fullPath, "utf-8");
//         const data = JSON.parse(raw);
//         kfs.push({ name: fname, text: JSON.stringify(data) });
//       }
//     }
//   } catch (_) {
//     // directory may not exist; return empty list
//   }
//   return kfs;
// } 


async function loadAllKnowledge() {
  const filePath = path.join(KNOWLEDGE_DIR, "data.json");

   
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    return [{ name: "data.json", text: JSON.stringify(data) }];
  
}

function getFullContext(knowledgeFiles, maxChars = 14000) {
  const allText = knowledgeFiles.map((kf) => kf.text).join("\n");
  return allText.slice(0, maxChars);
}

async function callGeminiAPI(question, context) {
  const promptText = `
You are an AI assistant. Use the context below to answer the question. 
Answer accurately, using information from the context if available.
Answer like you are a krishna and give current life example.
keep it shorter.

Context (JSON format):
${context}

Question:
${question}

Answer:
`.trim();

  const body = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
      thinkingConfig: { thinkingBudget: 0 },
    },
    safetySettings: [
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    ],
  };

  const resp = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }); 

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini API error: ${resp.status} ${errText}`);
  }

  const respJson = await resp.json();
  const candidates = respJson?.candidates ?? [];
  const output = candidates[0]?.content?.parts?.[0]?.text ?? "";
  return String(output).trim();
} 

// ---------------- Routes ----------------
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body || {};
    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ detail: "Invalid body: { question: string } expected" });
    }

    const kfs = await loadAllKnowledge();
    if (!kfs.length) {
      return res
        .status(400)
        .json({ detail: "No knowledge loaded. Add JSON files in ./knowledge_json/ first." });
    }

    const context = getFullContext(kfs);
    const answer = await callGeminiAPI(question, context);
    return res.json({ question, answer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ detail: err?.message || "Internal Server Error" });
  }
});

// ---------------- Run ----------------
const PORT = Number(process.env.PORT || 8000);
app.listen(PORT, () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});