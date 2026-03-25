import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Per-route rate limit: 10 moderation requests per minute per IP
const modRateMap = new Map<string, { count: number; resetAt: number }>();
const MOD_LIMIT = 10;
const MOD_WINDOW = 60_000;

export async function POST(req: Request) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const entry = modRateMap.get(ip);
    if (entry && now < entry.resetAt) {
      entry.count++;
      if (entry.count > MOD_LIMIT) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
    } else {
      modRateMap.set(ip, { count: 1, resetAt: now + MOD_WINDOW });
    }

    // Validate payload size
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > 2048) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Sanitize: cap at 600 chars
    const sanitizedText = text.slice(0, 600);

    // 1. Fetch blocked words from Supabase (with fallback)
    let bannedWords: string[] = [];
    try {
      const { data, error } = await getSupabaseAdmin().from('blocked_words').select('word');
      if (!error && data && data.length > 0) {
        bannedWords = data.map((w) => w.word);
      }
    } catch {
      // Table might not exist yet
    }

    if (bannedWords.length === 0) {
      bannedWords = [
        'benchod', 'madarchod', 'bsdk', 'lawde', 'lodo', 'boshdino',
        'chutmarino', 'rand', 'maachodi', 'machodi', 'bhadwa', 'bhadwo',
        'lasan', 'randi', 'randika bacha', 'chutiyo'
      ];
    }

    const normalizeText = (t: string) => {
      let n = t.toLowerCase();
      n = n.replace(/([a-z])[\.\-_\s](?=[a-z])/gi, '$1');
      const leetMap: Record<string, string> = { '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '7': 't' };
      n = n.replace(/[431057]/g, (c) => leetMap[c] || c);
      n = n.replace(/(.)\1{2,}/g, '$1');
      return n;
    };

    const normalizedText = normalizeText(sanitizedText);

    const containsBannedWord = bannedWords.some(word => {
      const normalizedWord = normalizeText(word);
      try {
        const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i');
        return regex.test(normalizedText);
      } catch {
        return normalizedText.includes(normalizedWord);
      }
    });

    if (containsBannedWord) {
      return NextResponse.json({
        flagged: true,
        reason: 'Severe profanity detected',
        banUser: true,
      });
    }

    // 2. Check OpenAI toggle
    let openAiEnabled = true;
    try {
      const { data } = await getSupabaseAdmin()
        .from('platform_settings')
        .select('value')
        .eq('key', 'openai_moderation_enabled')
        .single();
      if (data) openAiEnabled = data.value === 'true';
    } catch {}

    // 3. OpenAI Moderation
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (openAiApiKey && openAiEnabled) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({ input: sanitizedText }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          const result = data.results[0];

          if (result.flagged) {
            const flaggedCategories = Object.entries(result.categories)
              .filter(([_, isFlagged]) => isFlagged)
              .map(([category]) => category);

            return NextResponse.json({
              flagged: true,
              reason: `Violates policies: ${flaggedCategories.join(', ')}`,
              banUser: false,
              categories: flaggedCategories,
            });
          }
        }
      } catch {
        // OpenAI unavailable — fall through to allow post with local filter only
      }
    }

    return NextResponse.json({ flagged: false, reason: '', banUser: false });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json({ error: 'Moderation failed' }, { status: 500 });
  }
}
