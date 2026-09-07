export const emotions = [
  { id: 'tired', label: 'เหนื่อยมาก', checkLabel: 'เหนื่อยมาก', art: '01-exhausted', color: '#ff9d98' },
  { id: 'gloomy', label: 'หม่น ๆ', checkLabel: 'หม่น ๆ', art: '02-gloomy', color: '#bea9ee' },
  { id: 'lonely', label: 'เหงา', checkLabel: 'เหงา', art: '03-lonely', color: '#a7d7f4' },
  { id: 'heavy', label: 'หนักใจ', checkLabel: 'หนักใจ', art: '04-overwhelmed', color: '#acdacc' },
  { id: 'unsure', label: 'บอกไม่ถูก', checkLabel: 'บอกไม่ถูก', art: '05-unsure', color: '#f5d67e' },
  { id: 'okay', label: 'โอเคอยู่', checkLabel: 'โอเคอยู่', art: '06-okay', color: '#f6acd0' },
] as const;
export type EmotionId = typeof emotions[number]['id'];
export type StarStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export interface Star { id: string; content: string; emotion: EmotionId; source: 'team' | 'community'; created_at: string; status?: StarStatus; saved_at?: string; unavailable?: boolean; }
export interface ReviewStar extends Star { status: StarStatus; flags?: string[]; }
export interface User { id: string; email?: string; }
export const emotionById = (id: EmotionId) => emotions.find(e => e.id === id)!;
export const codePointLength = (text: string) => Array.from(text).length;
export const limitText = (text: string) => Array.from(text).slice(0, 120).join('');
export function validateMessage(text: string, emotion: string): string | null {
  if (!emotions.some(e => e.id === emotion)) return 'เลือกความรู้สึกให้ดาวดวงนี้ก่อน';
  if (!text.trim()) return 'ลองเขียนสักข้อความก่อนส่งดาว';
  if (codePointLength(text) > 120) return 'ข้อความยาวไปนิด เขียนได้ไม่เกิน 120 ตัวอักษร';
  return null;
}
export function sampleStars(stars: Star[], emotion: EmotionId, count = 6, random = Math.random): Star[] {
  const candidates = [...new Map(stars.filter(s => s.emotion === emotion && s.status === 'approved' && !s.unavailable).map(s => [s.id, s])).values()];
  for (let i = candidates.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [candidates[i], candidates[j]] = [candidates[j], candidates[i]]; }
  return candidates.slice(0, count);
}
export const motionTiming = { fold: 6, send: 12, highlight: 6, jarDrop: 1.8, jarSettle: .25, unfold: 3 };
export const starAsset = (emotion: EmotionId, step = 0) => `/assets/star-${emotion}-${step}.png`;
export function relativeDate(iso: string) {
  const date = new Date(iso); const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  return days < 1 ? 'วันนี้' : days === 1 ? 'เมื่อวาน' : new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}
