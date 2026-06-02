/**
 * Gemini API Test v3 — Matches exact backend structure after fix
 * Tests the updated index.ts configuration against a real video
 */

const API_KEY = "AIzaSyAhU67qToj_GebreL-5oleOaWD313oJ-jE";
const VIDEO_URL = "https://www.youtube.com/watch?v=6k9UqACx1Cs";
const MODEL = "gemini-3.5-flash";

// Exact same system prompt as our backend (coach analysis mode)
const systemInstructions = `You are Coach Legend. Analyze this full football game film for the head coach. Focus on team strategy, play calling, and 3 specific challenges/wins. Provide deep tactical insights. 
IMPORTANT: NEVER reference NFL players or external teams like Duncanville, Desoto, or others. 
The ONLY two teams in this game are: USA (Your Team, wearing white jerseys) vs Senegal.
CRITICAL - OFFENSE vs DEFENSE: You MUST correctly identify which team is on offense and which is on defense on each play by visually observing the film. Only evaluate USA's players when USA is on the field. Do NOT report offensive stats or plays for USA when the defense is on the field, and vice versa.
CRITICAL - POSITION SPOTLIGHT: Analyze each position group (QB, WR, RB, OL, DL, LB, DB) based ONLY on what you can directly observe in the film. For each position group, provide exactly 1-2 key play timestamps with specific descriptions of what happened. Keep descriptions extremely concise to ensure the output fits completely without getting truncated. The playerTag field should be left empty ("") — coaches will fill that in manually. Do NOT invent player names. Only include positions that were clearly visible and active in the film.
CRITICAL - ZERO HALLUCINATION RULE: Base all feedback strictly on the actual visual events, actions, team colors, and timings that are directly visible in the video track. You MUST NOT speculate, assume, or fabricate any plays, scores, or activities that do not occur in the video. If an action is not clearly visible at a timestamp, do not grade it. Ground every single play description in precise visual evidence from the film.`;

// Full coach schema (same as backend)
const coachSchema = `{
  "challenges": [
    { "title": "Challenge Title", "grade": "NEEDS CONSISTENCY", "description": "What went wrong", "timestamps": "MM:SS, MM:SS", "recommendation": "How to fix" }
  ],
  "wins": [
    { "title": "Win Title", "grade": "ELITE", "description": "What went well", "timestamps": "MM:SS, MM:SS", "buildOn": "How to double down" }
  ],
  "overallGrade": "B",
  "gradeLabel": "DEVELOPING",
  "assessment": "Detailed game assessment narrative",
  "matchupNotes": "Notes about key matchups observed",
  "playCalling": {
    "offense": { "runPassRatio": "60/40", "tendencies": "Heavy run on 1st down", "redZoneGrade": "B", "thirdDownGrade": "C", "predictabilityScore": "High", "wrongCalls": "2 specific plays", "recommendations": "Use more play action" },
    "defense": { "coverageSchemes": "Mostly Cover 3", "blitzRate": "25% with 10% success", "halftimeAdjustments": "Moved to man-to-man", "vulnerabilities": "Deep seams" }
  },
  "positionSpotlight": [
    {
      "position": "FW",
      "grade": "A",
      "summary": "Summary of what this position group did",
      "keyPlays": [
        { "timestamp": "MM:SS", "description": "What happened on this play", "playerTag": "" }
      ]
    }
  ]
}`;

async function runTest() {
  console.log("🏈 Gemini API Test v3 — Exact Backend Match");
  console.log(`Video: ${VIDEO_URL}`);
  console.log(`Model: ${MODEL}`);
  console.log("Config: system_instruction + temp=0.5 + maxTokens=32768 + responseMimeType=json\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const parts = [
    {
      file_data: {
        file_uri: VIDEO_URL,
        mime_type: "video/mp4"
      }
    },
    {
      text: `Analyze this game film thoroughly. Provide deep tactical insights on every play you observe.

Return your analysis as JSON matching this structure:
${coachSchema}`
    }
  ];

  const body = {
    system_instruction: {
      parts: [{ text: systemInstructions }]
    },
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.5,
      topP: 0.95,
      maxOutputTokens: 32768,
      responseMimeType: "application/json",
    }
  };

  console.log("Sending request...");
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n✅ HTTP Status: ${response.status}`);
    console.log(`⏱️  Time: ${elapsed}s`);

    if (result.error) {
      console.log(`❌ ERROR: ${JSON.stringify(result.error, null, 2)}`);
      return;
    }

    if (result.candidates && result.candidates[0]) {
      const text = result.candidates[0].content.parts[0].text;
      const finishReason = result.candidates[0].finishReason;
      console.log(`📋 Finish Reason: ${finishReason}`);
      console.log(`📏 Output Length: ${text.length} chars`);

      try {
        const parsed = JSON.parse(text);
        console.log(`\n✅ JSON Parsed Successfully!`);
        console.log(`\n--- FULL ANALYSIS ---\n`);
        console.log(JSON.stringify(parsed, null, 2));

        // Quick quality check
        console.log(`\n--- QUALITY CHECK ---`);
        console.log(`Challenges: ${parsed.challenges?.length || 0}`);
        console.log(`Wins: ${parsed.wins?.length || 0}`);
        console.log(`Overall Grade: ${parsed.overallGrade}`);
        console.log(`Grade Label: ${parsed.gradeLabel}`);
        console.log(`Assessment length: ${parsed.assessment?.length || 0} chars`);
        console.log(`Matchup Notes: ${parsed.matchupNotes ? 'YES' : 'MISSING'}`);
        console.log(`Play Calling: ${parsed.playCalling ? 'YES' : 'MISSING'}`);
        console.log(`Position Spotlight: ${parsed.positionSpotlight?.length || 0} positions`);
      } catch (e) {
        console.log(`❌ JSON Parse Failed: ${e.message}`);
        console.log(`Raw text:\n${text}`);
      }
    } else {
      console.log("❌ No candidates returned.");
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (e) {
    console.log(`❌ FETCH ERROR: ${e.message}`);
  }
}

runTest();
