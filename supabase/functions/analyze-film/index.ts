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
    const { videoUrl, prompt, positionGroup, playerInfo } = await req.json()
    // @ts-ignore: Deno is available in Supabase Edge Functions
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${prompt}\n\nAnalyze this football film: ${videoUrl}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    })

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message || 'Gemini API Error')
    }

    const text = data.candidates[0].content.parts[0].text

    // Extract structure from AI response (we assume the AI follows the coach persona prompt)
    // We try to find a grade and structured points
    const overallGrade = text.includes('ELITE') ? 'ELITE' : text.includes('DEVELOPING') ? 'DEVELOPING' : 'NEEDS CONSISTENCY'
    const letterGradeMatch = text.match(/Grade:\s*([A-F][+-]?)/i)
    const letterGrade = letterGradeMatch ? letterGradeMatch[1].toUpperCase() : 'B'

    return new Response(
      JSON.stringify({
        analysis: text,
        overallGrade,
        letterGrade,
        data: {
          overview: text,
          overallGrade,
          letterGrade,
          suggestedStats: {} // AI can suggest stats if prompted
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
