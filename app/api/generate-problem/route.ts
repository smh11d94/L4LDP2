import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { subject, problemIdea } = await req.json();

    if (!subject || !problemIdea) {
      return NextResponse.json(
        { error: 'Subject and problem idea are required' },
        { status: 400 }
      );
    }

    // Access the API key from server environment
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Create a math problem in LaTeX format about ${subject}. Idea: ${problemIdea}. 
      
Format the output as clean LaTeX that can be directly rendered, without any document headers or extra text. For example:

Consider a random variable \\( X \\) with a probability density function. It is given that  
\\[\\Pr(X < 5) = 0.6\\]
and  
\\[\\Pr(X > 2) = 0.7\\]
Find  
\\[\\Pr(2 \\leq X \\leq 5).\\]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a mathematics problem creator. Create clear, well-formatted LaTeX problems without any additional text, document headers, or explanations. Just the clean LaTeX problem that can be directly rendered.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenAI API error:', errorData || response.statusText);
      return NextResponse.json(
        { error: 'Failed to generate problem with OpenAI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedProblem = data.choices[0].message.content.trim();

    return NextResponse.json({ problem: generatedProblem });
  } catch (error) {
    console.error('Error in problem generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 