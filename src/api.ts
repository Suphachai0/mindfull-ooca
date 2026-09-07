import { createClient } from '@supabase/supabase-js';
import type { EmotionId, ReviewStar, Star, User } from './domain';
import { sampleStars, validateMessage } from './domain';
import { previewSeeds } from './seeds';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
export const previewMode = !configured && (import.meta.env.DEV || import.meta.env.VITE_PREVIEW_MODE === 'true');
export const authEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';
export const localJarMode = configured && !authEnabled;
export const requiresCaptcha = configured;
export const supabase = configured ? createClient(url, key, { auth: { flowType: 'pkce', detectSessionInUrl: true } }) : null;
const PREVIEW_USER = { id: 'preview-owner', email: 'บัญชีทดลองในเครื่อง' };
const previewUserKey = 'ooca.preview.user';
const localKey = 'ooca.preview.data.v1';
const jarKey = 'ooca.local.jar.v1';
type LocalData = { stars: Star[]; saves: Record<string, string>; own: string[]; requests: Record<string, string>; reports: { id: string; reason: string }[] };
type JarData = Record<string, { star: Star; saved_at: string }>;
function local(): LocalData { try { return JSON.parse(localStorage.getItem(localKey) || 'null') || { stars: [], saves: {}, own: [], requests: {}, reports: [] }; } catch { throw new Error('เปิดข้อมูลทดลองไม่ได้ ลองเช็กว่าเบราว์เซอร์อนุญาตให้เว็บเก็บข้อมูลหรือเปล่า'); } }
function writeLocal(data: LocalData) { localStorage.setItem(localKey, JSON.stringify(data)); }
function localJar(): JarData { try { return JSON.parse(localStorage.getItem(jarKey) || '{}'); } catch { throw new Error('เปิดโถดาวในเครื่องนี้ไม่ได้ ลองเช็กการตั้งค่าเบราว์เซอร์'); } }
function writeJar(data: JarData) { localStorage.setItem(jarKey, JSON.stringify(data)); }
function requirePreview() { if (!previewMode) throw new Error('ตอนนี้เว็บยังใช้งานไม่ได้ ลองใหม่ภายหลังนะ'); }
function allStars(data: LocalData): Star[] { return [...previewSeeds.filter(s => !data.stars.some(v => v.id === s.id)), ...data.stars.map(s => { const seed = previewSeeds.find(v => v.id === s.id && s.source === 'team'); return seed ? { ...s, content: seed.content } : s; })]; }
async function request<T>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error('ตอนนี้เว็บยังใช้งานไม่ได้ ลองใหม่ภายหลังนะ');
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${url}/functions/v1/star-api`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify({ action, ...body }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(result.error || 'ตอนนี้เชื่อมต่อไม่ได้ ลองอีกครั้งนะ'), { status: response.status });
  return result as T;
}
export async function currentUser(): Promise<User | null> {
  if (supabase && authEnabled) { const { data, error } = await supabase.auth.getUser(); if (error) return null; return data.user; }
  return previewMode && sessionStorage.getItem(previewUserKey) ? PREVIEW_USER : null;
}
export async function signIn() {
  if (supabase && authEnabled) { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } }); if (error) throw error; }
  else if (supabase) throw new Error('ตอนนี้ยังลงชื่อเข้าใช้ไม่ได้');
  else { requirePreview(); sessionStorage.setItem(previewUserKey, '1'); }
}
export async function signOut() {
  if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
  sessionStorage.removeItem(previewUserKey);
}
export async function getPool(emotion: EmotionId): Promise<Star[]> {
  if (supabase) return request('pool', { emotion });
  requirePreview(); return sampleStars(allStars(local()), emotion);
}
export async function submit(content: string, emotion: EmotionId, requestId: string, captcha: string): Promise<Star> {
  const validation = validateMessage(content, emotion); if (validation) throw new Error(validation);
  if (supabase) return request('submit', { content, emotion, requestId, captcha });
  requirePreview(); const data = local(); const existing = data.stars.find(s => s.id === data.requests[requestId]); if (existing) { if (existing.content !== content || existing.emotion !== emotion) throw new Error('ส่งข้อความนี้ไม่ได้ ลองกลับไปหน้าเขียนแล้วส่งอีกครั้ง'); return existing; }
  const star: Star = { id: crypto.randomUUID(), content, emotion, source: 'community', created_at: new Date().toISOString(), status: 'pending' };
  data.stars.unshift(star); data.requests[requestId] = star.id; if (sessionStorage.getItem(previewUserKey)) data.own.unshift(star.id); writeLocal(data); return star;
}
export async function saveStar(id: string): Promise<{ added: boolean }> {
  if (localJarMode) { const jar = localJar(); if (jar[id]) return { added: false }; const star = await getStar(id); jar[id] = { star, saved_at: new Date().toISOString() }; writeJar(jar); return { added: true }; }
  if (supabase) return request('save', { id });
  requirePreview(); if (!await currentUser()) throw new Error('ลงชื่อเข้าใช้ก่อน แล้วค่อยเก็บดาวไว้ในโถ');
  const data = local(); const star = allStars(data).find(s => s.id === id && s.status === 'approved'); if (!star) throw new Error('ดาวดวงนี้เปิดอ่านไม่ได้แล้ว');
  if (data.saves[id]) return { added: false }; data.saves[id] = new Date().toISOString(); writeLocal(data); return { added: true };
}
export async function getSaved(): Promise<Star[]> {
  if (localJarMode) { const jar = localJar(); return (await Promise.all(Object.values(jar).map(async item => { try { return { ...await getStar(item.star.id), saved_at: item.saved_at }; } catch (error) { if ((error as {status?:number}).status === 404) return { ...item.star, content: '', unavailable: true, saved_at: item.saved_at }; throw error; } }))).sort((a,b)=>b.saved_at.localeCompare(a.saved_at)); }
  if (supabase) return request('saved');
  requirePreview(); if (!await currentUser()) return []; const data = local();
  return allStars(data).filter(s => data.saves[s.id]).map(s => ({ ...s, saved_at: data.saves[s.id], unavailable: s.status !== 'approved', content: s.status === 'approved' ? s.content : '' })).sort((a, b) => b.saved_at.localeCompare(a.saved_at));
}
export async function getHistory(): Promise<Star[]> {
  if (!authEnabled && supabase) return [];
  if (supabase) return request('history');
  requirePreview(); if (!await currentUser()) return []; const data = local(); return data.stars.filter(s => data.own.includes(s.id)).map(s => ({ ...s, content: ['hidden','rejected'].includes(s.status!) ? '' : s.content, unavailable: ['hidden','rejected'].includes(s.status!) }));
}
export async function reportStar(id: string, reason: string, captcha: string) {
  if (supabase) return request('report', { id, reason, captcha });
  requirePreview(); const data = local(); if (!data.reports.some(r => r.id === id && r.reason === reason)) data.reports.push({ id, reason }); writeLocal(data);
}
export async function isModerator(): Promise<boolean> { if (supabase && !authEnabled) return false; if (supabase) return request('moderator'); return previewMode && Boolean(await currentUser()); }
export async function getQueue(): Promise<{ stars: ReviewStar[]; reports: { id: string; message_id: string; reason: string; created_at: string }[] }> {
  if (supabase) return request('queue');
  requirePreview(); if (!await isModerator()) throw new Error('ส่วนนี้ใช้ได้เฉพาะบัญชีผู้ดูแล'); const data = local(); return { stars: allStars(data) as ReviewStar[], reports: data.reports.map((r, i) => ({ id: String(i), message_id: r.id, reason: r.reason, created_at: new Date().toISOString() })) };
}
export async function moderate(id: string, status: 'approved' | 'rejected' | 'hidden', reason: string) {
  if (supabase) return request('moderate', { id, status, reason });
  requirePreview(); if (!await isModerator()) throw new Error('ส่วนนี้ใช้ได้เฉพาะบัญชีผู้ดูแล'); if (!reason.trim()) throw new Error('เลือกผลการตรวจและเขียนเหตุผลให้ครบ'); const data = local(); const star = allStars(data).find(s => s.id === id); if (!star) throw new Error('หาดาวดวงนี้ไม่เจอ'); data.stars = [...data.stars.filter(s => s.id !== id), { ...star, status }]; data.reports = data.reports.filter(r => r.id !== id); writeLocal(data);
}

export async function getStar(id: string): Promise<Star> { if (supabase) return request('star', {id}); requirePreview(); const star = allStars(local()).find(s => s.id === id && s.status === 'approved'); if (!star) throw new Error('ดาวดวงนี้เปิดอ่านไม่ได้แล้ว'); return star; }
