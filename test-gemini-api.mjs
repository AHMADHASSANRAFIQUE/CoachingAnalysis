/**
 * Gemini API Test Script
 * Usage: GEMINI_API_KEY=your_key node test-gemini-api.mjs
 */

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("ERROR: Set GEMINI_API_KEY environment variable first.");
  console.error("Usage: GEMINI_API_KEY=your_key node test-gemini-api.mjs");
  process.exit(1);
}

const VIDEO_URL = process.env.TEST_VIDEO_URL || "https://www.youtube.com/watch?v=6k9UqACx1Cs";
const MODEL = "gemini-3.5-flash";

async function runTest() {
  console.log(`🏈 Gemini API Test — Model: ${MODEL}`);
  console.log(`Video: ${VIDEO_URL}\n`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const body = {
    system_instruction: { parts: [{ text: "You are a football analyst. Analyze this video and return JSON." }] },
    contents: [{ parts: [
      { file_data: { file_uri: VIDEO_URL, mime_type: "video/mp4" } },
      { text: 'Return JSON: {"status":"ok","overallGrade":"B","assessment":"Test passed"}' }
    ]}],
    generationConfig: { temperature: 0.5, topP: 0.95, maxOutputTokens: 1024, responseMimeType: "application/json" }
  };

  const t = Date.now();
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await res.json();
  console.log(`Status: ${res.status}, Time: ${((Date.now()-t)/1000).toFixed(1)}s`);
  if (result.error) { console.log("ERROR:", result.error.message); }
  else { console.log("SUCCESS:", result.candidates?.[0]?.content?.parts?.[0]?.text); }
}

runTest();
