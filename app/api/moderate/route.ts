import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. Custom Banned Words Check
    const bannedWords = [
      'benchod', 'madarchod', 'bsdk', 'lawde', 'lodo', 'boshdino', 
      'chutmarino', 'rand', 'maachodi', 'machodi', 'bhadwa', 'bhadwo', 
      'lasan', 'randi', 'randika bacha', 'chutiyo'
    ];

    const lowerText = text.toLowerCase();
    
    // Use regex with word boundaries to avoid matching "random" or "brand" for "rand"
    const containsBannedWord = bannedWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });

    if (containsBannedWord) {
      return NextResponse.json({
        flagged: true,
        reason: 'Severe profanity detected',
        banUser: true
      });
    }

    // 2. OpenAI Moderation Check
    const openAiApiKey = process.env.OPENAI_API_KEY || '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';

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('OpenAI Moderation API failed');
    }

    const data = await response.json();
    const result = data.results[0];

    let reason = '';
    if (result.flagged) {
      // Find which categories were flagged to provide a reason
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, isFlagged]) => isFlagged)
        .map(([category]) => category);
      
      reason = `Violates policies: ${flaggedCategories.join(', ')}`;
    }

    return NextResponse.json({
      flagged: result.flagged,
      reason: reason,
      banUser: false
    });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json({ error: 'Moderation failed' }, { status: 500 });
  }
}
