import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, imageBase64 } = await req.json();
    
    // Either text or image must be provided
    if (!jobDescription && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Job description text or image is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting keywords, hasImage:', !!imageBase64, 'textLength:', jobDescription?.length || 0);

    const systemPrompt = `You are an expert HR keyword extraction assistant. Analyze the job description and extract keywords into exactly 5 categories. Return ONLY a valid JSON object with no additional text or markdown.

Categories:
1. mandatory: Required qualifications, certifications, degrees, years of experience
2. technical: Programming languages, frameworks, technical skills
3. tools: Software tools, platforms, technologies
4. soft: Soft skills, interpersonal abilities
5. role: Job titles, work arrangements, seniority levels

Return format:
{
  "mandatory": ["keyword1", "keyword2"],
  "technical": ["keyword1", "keyword2"],
  "tools": ["keyword1", "keyword2"],
  "soft": ["keyword1", "keyword2"],
  "role": ["keyword1", "keyword2"]
}

Rules:
- Each keyword should be 1-4 words
- Capitalize first letter of each keyword
- Remove duplicates
- Return empty arrays if no keywords found for a category`;

    // Build request based on whether we have an image
    let messages: any[];
    
    if (imageBase64) {
      // Use vision model for image OCR + extraction
      messages = [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { 
              type: 'text', 
              text: jobDescription 
                ? `First, extract all text from this job description image. Then, extract keywords from the combined text content below and from the image:\n\n${jobDescription}`
                : 'Extract all text from this job description image. Then analyze it and extract keywords into the required categories.'
            },
            { 
              type: 'image_url', 
              image_url: { url: imageBase64 }
            }
          ]
        }
      ];
    } else {
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract keywords from this job description:\n\n${jobDescription}` }
      ];
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageBase64 ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to extract keywords' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the response
    let keywords;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      keywords = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse keywords' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the response structure
    const validCategories = ['mandatory', 'technical', 'tools', 'soft', 'role'];
    const validatedKeywords: Record<string, string[]> = {};
    
    for (const cat of validCategories) {
      validatedKeywords[cat] = Array.isArray(keywords[cat]) ? keywords[cat] : [];
    }

    console.log('Successfully extracted keywords');
    return new Response(
      JSON.stringify({ keywords: validatedKeywords }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-keywords:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
