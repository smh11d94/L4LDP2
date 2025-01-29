import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: body.messages,
    });
    return Response.json({ message: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('OpenAI Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}