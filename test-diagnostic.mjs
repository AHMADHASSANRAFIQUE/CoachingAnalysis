/**
 * Diagnostic test — requires GEMINI_API_KEY and SUPABASE_ANON_KEY env vars
 * Usage: GEMINI_API_KEY=your_key SUPABASE_ANON_KEY=your_key node test-diagnostic.mjs
 */

const API_KEY = process.env.GEMINI_API_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_URL = "https://gmfnoxhpucymoofkdlyn.supabase.co";

if (!API_KEY || !ANON_KEY) {
  console.error("Set GEMINI_API_KEY and SUPABASE_ANON_KEY environment variables.");
  process.exit(1);
}

async function testEdgeFunction() {
  console.log("Calling Supabase Edge Function...");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-film`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
    body: JSON.stringify({ youtubeUrl: "https://www.youtube.com/watch?v=6k9UqACx1Cs", teamName: "USA", opponent: "Senegal", analysisType: "coach-game" }),
  });
  console.log(`Status: ${res.status}`);
  console.log(await res.text());
}

testEdgeFunction();
