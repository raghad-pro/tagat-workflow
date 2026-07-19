import { NextResponse } from 'next/server';
import knowledgeData from '@/modules/landing/ai_chatbot/knowledge.json';

const { KB, FALLBACK, DEFAULT_SUGGESTIONS, GREETING } = knowledgeData as any;

const BY_ID = KB.reduce((acc: any, entry: any) => {
  acc[entry.id] = entry;
  return acc;
}, {});

function normalize(text: string) {
  if (!text) return '';
  let str = text.toLowerCase().normalize('NFKC');
  str = str.replace(/[ً-ْٰـ]/g, ''); // Remove Arabic diacritics
  str = str
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
  str = str.replace(/[^\p{L}\p{N}\s]/gu, ' '); // Keep unicode letters and numbers, replace punctuation with space
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

function scoreEntry(msg: string, entry: any) {
  let score = 0.0;
  const padded = ` ${msg} `;
  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (!k) continue;
    if (padded.includes(` ${k} `)) {
      score += 1.0 + 0.6 * (k.split(' ').length - 1);
    } else if (k.length >= 5 && msg.includes(k)) {
      score += 0.6;
    }
  }
  return score;
}

function retrieve(message: string, topN = 3) {
  const msg = normalize(message);
  if (!msg) return [];
  
  const scored = KB.map((entry: any) => ({
    score: scoreEntry(msg, entry),
    entry,
  })).filter((item: any) => item.score > 0);
  
  scored.sort((a: any, b: any) => b.score - a.score);
  return scored.slice(0, topN);
}

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

function localAnswer(message: string, lang: string) {
  const validLang = lang === 'ar' ? 'ar' : 'en';
  const hits = retrieve(message);
  
  if (hits.length === 0 || hits[0].score < 1.0) {
    return {
      answer: FALLBACK[validLang],
      suggestions: getSuggestionsFor(DEFAULT_SUGGESTIONS, validLang),
      source: 'local',
    };
  }
  
  const best = hits[0].entry;
  const related = best.related || DEFAULT_SUGGESTIONS;
  return {
    answer: best.a[validLang],
    suggestions: getSuggestionsFor(related, validLang),
    source: 'local',
  };
}

async function openaiAnswer(message: string, lang: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  
  try {
    const hits = retrieve(message, 3);
    const context = hits.map((h: any) => h.entry.a.en).join('\n\n') || "General Workflow platform knowledge.";
    const language = lang === 'ar' ? 'Arabic' : 'English';
    
    const systemPrompt = `You are the official assistant of 'Workflow', a multi-tenant SaaS platform for company, project and financial management. Answer ONLY questions about Workflow using the reference notes provided. If the question is not about Workflow, politely say you can only help with Workflow topics. Answer in ${language}. Keep answers short, friendly and factual.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        max_tokens: 350,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: `Reference notes about Workflow:\n${context}` },
          { role: 'user', content: message },
        ],
      }),
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return null;
    
    const related = (hits.length > 0 ? hits[0].entry.related : null) || DEFAULT_SUGGESTIONS;
    return {
      answer,
      suggestions: getSuggestionsFor(related, lang === 'ar' ? 'ar' : 'en'),
      source: 'openai',
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message?.trim();
    const lang = body.lang === 'ar' ? 'ar' : 'en';
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    let result = await openaiAnswer(message, lang);
    if (!result) {
      result = localAnswer(message, lang);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
