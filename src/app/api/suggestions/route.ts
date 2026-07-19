import { NextResponse } from 'next/server';
import knowledgeData from '@/modules/landing/ai_chatbot/knowledge.json';

const { KB, DEFAULT_SUGGESTIONS, GREETING } = knowledgeData as any;

const BY_ID = KB.reduce((acc: any, entry: any) => {
  acc[entry.id] = entry;
  return acc;
}, {});

function getSuggestionsFor(ids: string[], lang: string) {
  const out = [];
  for (const id of ids) {
    const e = BY_ID[id];
    if (e && e.q[lang]) {
      out.push({ id: e.id, text: e.q[lang] });
    }
  }
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const langParam = searchParams.get('lang') || 'en';
  const lang = langParam === 'ar' ? 'ar' : 'en';
  
  return NextResponse.json({
    greeting: GREETING[lang],
    suggestions: getSuggestionsFor(DEFAULT_SUGGESTIONS, lang),
  });
}
