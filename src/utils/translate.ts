const CACHE_PREFIX = 'tr_cache_';

const JAPANESE_RE =
  /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;

export function containsJapanese(text: string): boolean {
  return JAPANESE_RE.test(text);
}

export async function translateToFrench(text: string): Promise<string> {
  if (!containsJapanese(text)) return text;

  const cacheKey = `${CACHE_PREFIX}${text}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached !== null) return cached;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ja|fr`;
  try {
    const response = await fetch(url);
    if (!response.ok) return text;
    const data = (await response.json()) as {
      responseData?: { translatedText?: string };
    };
    const translated = data.responseData?.translatedText ?? text;
    sessionStorage.setItem(cacheKey, translated);
    return translated;
  } catch {
    return text;
  }
}
