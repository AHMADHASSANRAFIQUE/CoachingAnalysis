// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { 
      youtubeUrl, 
      teamName, 
      playerName, 
      age, 
      jerseyNumber, 
      startTime, 
      descriptors, 
      analysisType,
      opponent,
      jerseyColor,
      roster,
      customPrompt,
      position,
      coachNotes,
    } = body

    const videoUrl = youtubeUrl || body.videoUrl
    
    // @ts-ignore: Deno is available in Supabase Edge Functions
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const isCoachAnalysis = analysisType === 'coach-game';
    
    const playerSchema = `{
      "overallGrade": "ELITE | DEVELOPING | NEEDS CONSISTENCY",
      "letterGrade": "A+ | A | B | etc.",
      "overview": "Detailed narrative summary",
      "categories": [
        { "name": "Skill Name", "grade": "ELITE | DEVELOPING | NEEDS CONSISTENCY", "feedback": "Detailed feedback" }
      ],
      "plays": [
        { "play": "Play 1", "time": "MM:SS", "action": "Action description", "grade": "ELITE | DEVELOPING | NEEDS CONSISTENCY", "notes": "Coaching notes" }
      ],
      "areasForGrowth": [
        { "area": "Technique Name", "currentLevel": "DEVELOPING", "recommendation": "Drill description" }
      ],
      "suggestedStats": {
        "passingYards": 0, "rushingYards": 0, "completions": 0, "attempts": 0, "touchdowns": 0, "interceptions": 0
      }
    }`;

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
          "position": "QB",
          "grade": "A",
          "summary": "Concise summary of what this position group did well and what needs work",
          "keyPlays": [
            { "timestamp": "MM:SS", "description": "What happened on this play and why it was notable", "playerTag": "" }
          ]
        },
        {
          "position": "WR",
          "grade": "B",
          "summary": "Summary for this position group",
          "keyPlays": [
            { "timestamp": "MM:SS", "description": "Play description", "playerTag": "" }
          ]
        }
      ]
    }`;

    const selectedSchema = isCoachAnalysis ? coachSchema : playerSchema;
    const systemInstructions = isCoachAnalysis 
      ? `You are Coach Legend. Analyze this full football game film for the head coach. Focus on team strategy, play calling, and 3 specific challenges/wins. Provide deep tactical insights. 
         IMPORTANT: NEVER reference NFL players or external teams like Duncanville, Desoto, or others. 
         The ONLY two teams in this game are: ${teamName} (Your Team, wearing ${jerseyColor || 'N/A'} jerseys) vs ${opponent || 'the Opponent'}.
         CRITICAL - OFFENSE vs DEFENSE: You MUST correctly identify which team is on offense and which is on defense on each play by visually observing the film. Only evaluate ${teamName}'s players when ${teamName} is on the field. Do NOT report offensive stats or plays for ${teamName} when the defense is on the field, and vice versa.
         CRITICAL - POSITION SPOTLIGHT: Analyze each position group (QB, WR, RB, OL, DL, LB, DB) based ONLY on what you can directly observe in the film. For each position group, provide exactly 1-2 key play timestamps with specific descriptions of what happened. Keep descriptions extremely concise to ensure the output fits completely without getting truncated. The playerTag field should be left empty ("") — coaches will fill that in manually. Do NOT invent player names. Only include positions that were clearly visible and active in the film.
         CRITICAL - CONSISTENCY: For any given film URL, your evaluation MUST be highly consistent and reproducible. Base all feedback strictly on observable film evidence. Do not speculate or fabricate plays.`
      : `Analyze this football film for a specific player profile. Focus on the player's individual performance, technique, and areas for growth.
         IMPORTANT: DO NOT hallucinate NFL data or professional player names. This is amateur/youth football. 
         The game is: ${teamName} vs ${opponent || 'the Opponent'}.
         CRITICAL INSTRUCTION FOR CONSISTENCY & PLAYER IDENTIFICATION: For any given film URL, your evaluation MUST be highly consistent and reproducible. Focus strictly on the player identified at the provided Highlight Timestamps (${startTime || 'Throughout film'}). Use ONLY the provided descriptors (${descriptors || 'None'}), Jersey Color (${jerseyColor || 'N/A'}), and Roster context:
         Roster:
         ${roster || 'Not provided'}
         
         Visually track the player wearing Jersey #${jerseyNumber || 'N/A'} (Name: ${playerName || 'N/A'}) who matches these descriptors. Evaluate ONLY their play execution at the designated timestamps. Do NOT attribute or credit plays from other players. Use the video track to visually verify their execution.`;

    // Using gemini-2.5-flash for stable production visual analysis
    const model = "gemini-2.5-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Call Gemini API with direct visual mode first, falling back to text-only mode on failure
    let response;
    let result;
    const maxRetries = 3;
    let fallbackToTextOnly = false;
    
    // Level 1: Direct YouTube Visual Mode
    if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
      console.log("Attempting direct YouTube visual analysis...");
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const parts = [
            {
              file_data: {
                file_uri: videoUrl,
                mime_type: "video/mp4"
              }
            },
            {
              text: `${systemInstructions}\n\n${customPrompt || ''}\n\nIMPORTANT: You MUST return a valid JSON object only. Be concise to ensure the response is not truncated. Do not include any markdown formatting like \`\`\`json. 
              
              The JSON structure MUST be:
              ${selectedSchema}`
            }
          ];

          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.0,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
              }
            })
          });

          result = await response.json();

          // Catch 403 (Embedding Disabled) or 400 (Cannot Fetch Content) and trigger Text-Only Fallback
          if (
            response.status === 403 || 
            response.status === 400 || 
            (result.error && (result.error.message?.includes('permission') || result.error.message?.includes('fetch') || result.error.message?.includes('fetch content')))
          ) {
            console.log("YouTube visual access restricted (403/400). Automatically falling back to Text-Only Grounded Mode...");
            fallbackToTextOnly = true;
            break;
          }

          if (response.status === 503 || response.status === 429 || (result.error && result.error.message?.includes('high demand'))) {
            console.log(`Visual Attempt ${attempt + 1} failed due to high demand. Retrying...`);
            if (attempt < maxRetries - 1) {
              await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
              continue;
            }
          }
          break;
        } catch (e) {
          console.error(`Visual Attempt ${attempt + 1} error:`, e);
          fallbackToTextOnly = true;
          break;
        }
      }
    } else {
      fallbackToTextOnly = true;
    }

    // Level 2: Fallback to Text-Only Grounded Mode
    if (fallbackToTextOnly) {
      console.log("Running in Text-Only Grounded Mode...");
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const parts = [
            {
              text: `${systemInstructions}
              
              [NOTE: Direct visual access to the YouTube video was restricted by the creator's privacy/embedding settings. 
              ${isCoachAnalysis 
                ? `You must evaluate the game and populate all plays, wins, challenges, and position spotlight timestamps based strictly on the coach's custom notes:
                   Coach Notes:
                   "${coachNotes || 'No custom notes provided'}"
                   Extract and use the exact timestamps and play descriptions mentioned in these coach notes (e.g. 05:10, 12:45). If no specific timestamps are found in the coach notes, use standard estimations, but do not invent unrelated plays. If coachNotes is empty, state clearly in the assessment that visual access is restricted and no coach notes were provided.`
                : `You must evaluate the game based strictly on the provided highlight timestamps (${startTime || 'None'}), team roster, descriptors, and jersey colors as absolute ground-truth facts.`
              }
              Do not make up plays not supported by these inputs.]
              
              ${customPrompt || ''}
              Film URL: ${videoUrl || 'No URL provided'}
              
              IMPORTANT: You MUST return a valid JSON object only. Be concise to ensure the response is not truncated. Do not include any markdown formatting like \`\`\`json. 
              
              The JSON structure MUST be:
              ${selectedSchema}`
            }
          ];

          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.0,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
              }
            })
          });

          result = await response.json();

          if (response.status === 503 || response.status === 429 || (result.error && result.error.message?.includes('high demand'))) {
            console.log(`Text Attempt ${attempt + 1} failed due to high demand. Retrying...`);
            if (attempt < maxRetries - 1) {
              await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
              continue;
            }
          }
          break;
        } catch (e) {
          console.error(`Text Attempt ${attempt + 1} error:`, e);
          if (attempt < maxRetries - 1) continue;
          throw e;
        }
      }
    }

    if (!response || !response.ok || result.error) {
      const errorMsg = result.error?.message || `Gemini API Error (Status ${response?.status})`;
      console.error('Gemini API Error:', result.error);
      throw new Error(errorMsg);
    }

    if (!result.candidates || !result.candidates[0]) {
      throw new Error('AI failed to generate a response. Please try again.');
    }

    let jsonString = result.candidates[0].content.parts[0].text;
    
    // Bulletproof JSON extraction: extract from the first '{' to the end of the text
    const firstBrace = jsonString.indexOf('{');
    if (firstBrace !== -1) {
      jsonString = jsonString.substring(firstBrace);
    }
    
    // Helper function to repair truncated or incomplete JSON
    const repairTruncatedJson = (str: string): string => {
      let cleanStr = str.trim();
      
      // Close unclosed string literal if truncated inside a string
      let inString = false;
      for (let i = 0; i < cleanStr.length; i++) {
        if (cleanStr[i] === '"' && (i === 0 || cleanStr[i-1] !== '\\')) {
          inString = !inString;
        }
      }
      if (inString) {
        cleanStr += '"';
      }
      
      // Track open brackets and braces
      const stack: string[] = [];
      inString = false;
      for (let i = 0; i < cleanStr.length; i++) {
        const char = cleanStr[i];
        if (char === '"' && (i === 0 || cleanStr[i-1] !== '\\')) {
          inString = !inString;
        }
        if (!inString) {
          if (char === '{' || char === '[') {
            stack.push(char);
          } else if (char === '}' || char === ']') {
            stack.pop();
          }
        }
      }
      
      // Append closing brackets in reverse order to repair syntax
      while (stack.length > 0) {
        const lastOpened = stack.pop();
        if (lastOpened === '{') {
          cleanStr += '}';
        } else if (lastOpened === '[') {
          cleanStr += ']';
        }
      }
      
      return cleanStr;
    };

    let analysisData;
    try {
      const repairedJson = repairTruncatedJson(jsonString);
      analysisData = JSON.parse(repairedJson);
    } catch (e) {
      console.log('JSON parsing and repair failed, falling back to raw text response.', e);
      analysisData = {
        overallGrade: "N/A",
        letterGrade: "N/A",
        gradeLabel: "ANALYSIS COMPLETE",
        overview: jsonString,
        assessment: jsonString,
        categories: [],
        plays: [],
        challenges: [],
        wins: [],
        areasForGrowth: [],
        suggestedStats: {}
      };
    }

    return new Response(
      JSON.stringify({
        data: analysisData,
        analysis: analysisData.overview || analysisData.assessment || "Analysis complete",
        overallGrade: analysisData.overallGrade,
        letterGrade: analysisData.letterGrade || analysisData.gradeLabel
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal Server Error',
        details: error.stack || 'No details available'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
