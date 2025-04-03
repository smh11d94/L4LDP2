import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { problem, hintLevel } = await req.json();

    if (!problem || !hintLevel) {
      return NextResponse.json(
        { error: 'Problem and hint level are required' },
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

    // Configure prompt based on hint level
    let hintInstructions = '';
    
    switch (hintLevel) {
      case 'subtle':
        hintInstructions = 'Create a very subtle hint that just nudges the student in the right direction without revealing the approach. This should be a gentle reminder of a concept or a question that makes them think about the right approach.';
        break;
      case 'medium':
        hintInstructions = 'Create a medium-level hint that points to the specific approach or equations needed, without solving any steps. Include relevant formulas or concepts that should be applied.';
        break;
      case 'detailed':
        hintInstructions = 'Create a detailed hint that outlines the solution approach with specific steps to take, but without giving the full solution. Include the key equations and the specific transformations or techniques needed.';
        break;
      default:
        hintInstructions = 'Create a helpful hint that guides the student in the right direction without giving away the full solution.';
    }

    const prompt = `${hintInstructions}

Problem: ${problem}

Format the output as clean LaTeX that can be directly rendered, without any document headers or extra text. For example:

Consider applying the probability addition rule: \\(P(A \\cup B) = P(A) + P(B) - P(A \\cap B)\\)`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a mathematics tutor providing helpful hints. Create clear, well-formatted LaTeX hints without any additional text, document headers, or explanations. Just the clean LaTeX hint that can be directly rendered.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenAI API error:', errorData || response.statusText);
      return NextResponse.json(
        { error: 'Failed to generate hint with OpenAI' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedHint = data.choices[0].message.content.trim();

    return NextResponse.json({ hint: generatedHint });
  } catch (error) {
    console.error('Error in hint generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 