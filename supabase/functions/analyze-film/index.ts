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
      position, 
      teamName, 
      playerName, 
      age, 
      jerseyNumber, 
      startTime, 
      descriptors, 
      analysisType,
      customPrompt 
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
        { "title": "Challenge Title", "grade": "NEEDS CONSISTENCY", "description": "What went wrong", "timestamps": "MM:SS", "recommendation": "How to fix" }
      ],
      "wins": [
        { "title": "Win Title", "grade": "ELITE", "description": "What went well", "timestamps": "MM:SS", "buildOn": "How to double down" }
      ],
      "overallGrade": "B",
      "gradeLabel": "DEVELOPING",
      "assessment": "Detailed game assessment narrative",
      "matchupNotes": "Notes about player vs player matchups",
      "playCalling": {
        "offense": { "runPassRatio": "60/40", "tendencies": "Heavy run on 1st down", "redZoneGrade": "B", "thirdDownGrade": "C", "predictabilityScore": "High", "wrongCalls": "2 specific plays", "recommendations": "Use more play action" },
        "defense": { "coverageSchemes": "Mostly Cover 3", "blitzRate": "25% with 10% success", "halftimeAdjustments": "Moved to man-to-man", "vulnerabilities": "Deep seams" }
      },
      "topPerformers": [
        { "name": "Player Name", "position": "QB", "grade": "A", "highlights": "3 TDs, 0 INTs" }
      ]
    }`;

    const selectedSchema = isCoachAnalysis ? coachSchema : playerSchema;
    const systemInstructions = isCoachAnalysis 
      ? `You are Coach Prime. Analyze this full football game film for the head coach. Focus on team strategy, play calling, and 3 specific challenges/wins. Provide deep tactical insights.`
      : `Analyze this football film for a specific player profile. Focus on the player's individual performance, technique, and areas for growth.`;

    // Using gemini-3-flash-preview as requested
    const model = "gemini-3-flash-preview";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Call Gemini API with retry logic for 'High Demand' (503) errors
    let response;
    let result;
    const maxRetries = 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemInstructions}\n\n${customPrompt || ''}\n\nFilm URL: ${videoUrl || 'No URL provided'}\n\nIMPORTANT: You MUST return a valid JSON object only. Do not include any markdown formatting like \`\`\`json. 
                
                The JSON structure MUST be:
                ${selectedSchema}`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            }
          })
        });

        result = await response.json();

        if (response.status === 503 || response.status === 429 || (result.error && result.error.message?.includes('high demand'))) {
          console.log(`Attempt ${attempt + 1} failed due to high demand. Retrying...`);
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
        }
        break;
      } catch (e) {
        console.error(`Attempt ${attempt + 1} network error:`, e);
        if (attempt < maxRetries - 1) continue;
        throw e;
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
    
    // Clean JSON string - remove markdown code blocks if present
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let analysisData;
    try {
      analysisData = JSON.parse(jsonString);
    } catch (e) {
      console.error('JSON Parse Error. Raw string:', jsonString);
      throw new Error('AI returned an invalid data format. Please try again.');
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
