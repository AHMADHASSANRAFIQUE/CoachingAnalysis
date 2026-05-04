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

    // Call Gemini API - Using gemini-3-flash-preview as requested
    // We enforce JSON output to match the frontend expectations
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${customPrompt || 'Analyze this football film.'}\n\nFilm URL: ${videoUrl || 'No URL provided'}\n\nIMPORTANT: You MUST return a valid JSON object. Do not include any markdown formatting like \`\`\`json or \`\`\`. 
            
            The JSON structure MUST be:
            {
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
            }`
          }]
        }],
        generationConfig: {
          temperature: 0.1, // High consistency for JSON
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        }
      })
    })

    const result = await response.json()

    if (result.error) {
      throw new Error(result.error.message || 'Gemini API Error')
    }

    const jsonString = result.candidates[0].content.parts[0].text
    const analysisData = JSON.parse(jsonString)

    return new Response(
      JSON.stringify({
        data: analysisData,
        analysis: analysisData.overview, // Fallback
        overallGrade: analysisData.overallGrade,
        letterGrade: analysisData.letterGrade
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
