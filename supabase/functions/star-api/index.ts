import { createClient } from 'npm:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(x=>x.trim()).filter(Boolean);
const captchaSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
const rateSalt = Deno.env.get('RATE_LIMIT_SALT');
const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const emotions = ['tired','gloomy','lonely','heavy','unsure','okay'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const anyUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const columns = 'id,content,emotion,source,created_at,status';
function publicStar(s: Record<string, unknown>) { return { id:s.id,content:s.content,emotion:s.emotion,source:s.source,created_at:s.created_at,status:s.status }; }
class ApiError extends Error { constructor(public status:number, message:string) { super(message); } }
const check = (result: {error: unknown}) => { if(result.error) throw new ApiError(500,'มีบางอย่างขัดข้อง ลองอีกครั้งนะ'); };
async function hash(value:string) { const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)); return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join(''); }
async function captcha(token:unknown, action:string) {
  if(!captchaSecret) throw new ApiError(503,'ตอนนี้ยังส่งข้อความไม่ได้ ลองใหม่ภายหลังนะ');
  if(typeof token!=='string'||token.length>4096||!token) throw new ApiError(400,'ช่วยยืนยันว่าไม่ใช่โปรแกรมอัตโนมัติก่อน');
  const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:captchaSecret,response:token})});
  const body=await res.json();
  const hosts=allowedOrigins.map(o=>new URL(o).hostname);
  if(!body.success||body.action!==action||!hosts.includes(body.hostname)) throw new ApiError(400,'การยืนยันหมดอายุแล้ว ยืนยันอีกครั้งนะ');
}
Deno.serve(async req=>{
  const origin=req.headers.get('origin')||'';
  const headers={ 'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',...(allowedOrigins.includes(origin)?{'Access-Control-Allow-Origin':origin}:{}) };
  const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
  if(!allowedOrigins.includes(origin)) return reply(403,{error:'เปิดใช้งานจากเว็บไซต์นี้ไม่ได้'});
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'}});
  if(req.method!=='POST') return reply(405,{error:'ทำรายการนี้ไม่ได้'});
  try {
    if(!rateSalt) throw new ApiError(503,'ตอนนี้เว็บยังใช้งานไม่ได้ ลองใหม่ภายหลังนะ');
    // Do not retain raw network identifiers or message text in logs.
    const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const networkKey=await hash(`${rateSalt}:${ip}`);
    const rate=await db.rpc('consume_rate',{p_key:`all:${networkKey}`,p_limit:120,p_seconds:60}); check(rate);
    if(!rate.data) throw new ApiError(429,'ตอนนี้ใช้งานถี่ไปนิด รอสักครู่แล้วลองใหม่');
    const raw=await req.text(); if(new TextEncoder().encode(raw).length>8192) throw new ApiError(413,'ข้อมูลที่ส่งมายาวเกินไป');
    let b; try {b=JSON.parse(raw);}catch{throw new ApiError(400,'ข้อมูลที่ส่งมาไม่ถูกต้อง ลองอีกครั้งนะ');}
    if(!b||typeof b!=='object'||Array.isArray(b)) throw new ApiError(400,'ข้อมูลที่ส่งมาไม่ถูกต้อง ลองอีกครั้งนะ');
    const auth=req.headers.get('authorization'); let userId:string|null=null;
    if(auth){const {data,error}=await db.auth.getUser(auth.replace(/^Bearer /i,''));if(error||!data.user)throw new ApiError(401,'ลงชื่อเข้าใช้อีกครั้งนะ');userId=data.user.id;}
    const requireUser=()=>{if(!userId)throw new ApiError(401,'ลงชื่อเข้าใช้ก่อน แล้วค่อยเก็บดาวไว้ในโถ');return userId;};
    const requireMod=async()=>{const id=requireUser();const result=await db.from('moderators').select('user_id').eq('user_id',id).maybeSingle();check(result);if(!result.data)throw new ApiError(403,'ส่วนนี้ใช้ได้เฉพาะบัญชีผู้ดูแล');return id;};
    const validId=()=>{if(typeof b.id!=='string'||!anyUuid.test(b.id))throw new ApiError(400,'หาดาวดวงนี้ไม่เจอ');};
    switch(b.action){
      case 'pool':{
        if(!emotions.includes(b.emotion))throw new ApiError(400,'เลือกความรู้สึกให้ดาวดวงนี้ก่อน');
        const result=await db.rpc('sample_stars',{p_emotion:b.emotion});check(result);return reply(200,result.data);
      }
      case 'star':{validId();const r=await db.from('stars').select(columns).eq('id',b.id).eq('status','approved').maybeSingle();check(r);if(!r.data)throw new ApiError(404,'ดาวดวงนี้เปิดอ่านไม่ได้แล้ว');return reply(200,publicStar(r.data));}
      case 'submit':{
        if(typeof b.content!=='string'||!b.content.trim()||Array.from(b.content).length>120||!emotions.includes(b.emotion)||typeof b.requestId!=='string'||!uuid.test(b.requestId))throw new ApiError(400,'ลองเช็กข้อความและความรู้สึกที่เลือกอีกครั้ง');
        await captcha(b.captcha,'submit');
        const r=await db.rpc('consume_rate',{p_key:`submit:${networkKey}`,p_limit:10,p_seconds:3600});check(r);if(!r.data)throw new ApiError(429,'ช่วงนี้ส่งดาวหลายดวงแล้ว เว้นสักพักแล้วค่อยส่งอีกครั้ง');
        const result=await db.rpc('submit_star',{p_content:b.content,p_emotion:b.emotion,p_author:userId,p_request:b.requestId});
        if(result.error?.message?.includes('REQUEST_CONFLICT'))throw new ApiError(409,'ส่งข้อความนี้ไม่ได้ ลองกลับไปหน้าเขียนแล้วส่งอีกครั้ง');check(result);
        return reply(200,publicStar(result.data[0]));
      }
      case 'save':{validId();const r=await db.rpc('save_star',{p_user:requireUser(),p_star:b.id});if(r.error?.message?.includes('STAR_UNAVAILABLE'))throw new ApiError(404,'ดาวดวงนี้เปิดอ่านไม่ได้แล้ว');check(r);return reply(200,{added:r.data});}
      case 'saved':{
        const r=await db.from('saved_stars').select(`saved_at,stars(${columns})`).eq('user_id',requireUser()).order('saved_at',{ascending:false});check(r);
        return reply(200,r.data!.map((row:any)=>{const s=row.stars;return {...publicStar(s),saved_at:row.saved_at,content:s.status==='approved'?s.content:'',unavailable:s.status!=='approved'};}));
      }
      case 'history':{
        const r=await db.from('stars').select(columns).eq('author_id',requireUser()).order('created_at',{ascending:false});check(r);
        return reply(200,r.data!.map(s=>({...publicStar(s),content:['hidden','rejected'].includes(s.status)?'':s.content,unavailable:['hidden','rejected'].includes(s.status)})));
      }
      case 'report':{
        validId();if(!['hurtful','personal','spam','other'].includes(b.reason))throw new ApiError(400,'เลือกเหตุผลที่อยากรายงานก่อน');await captcha(b.captcha,'report');
        const s=await db.from('stars').select('id').eq('id',b.id).eq('status','approved').maybeSingle();check(s);if(!s.data)throw new ApiError(404,'ดาวดวงนี้เปิดอ่านไม่ได้แล้ว');
        const reporter=userId?await hash(`${rateSalt}:user:${userId}`):networkKey;
        const r=await db.from('reports').upsert({message_id:b.id,reporter_key:reporter,reason:b.reason},{onConflict:'message_id,reporter_key,reason',ignoreDuplicates:true});check(r);return reply(200,{ok:true});
      }
      case 'moderator':{
        if(!userId)return reply(200,false);const r=await db.from('moderators').select('user_id').eq('user_id',userId).maybeSingle();check(r);return reply(200,Boolean(r.data));
      }
      case 'queue':{
        await requireMod();const [stars,reports]=await Promise.all([db.from('stars').select(columns).order('created_at',{ascending:false}).limit(500),db.from('reports').select('id,message_id,reason,created_at').is('resolved_at',null).order('created_at',{ascending:false}).limit(500)]);check(stars);check(reports);return reply(200,{stars:stars.data,reports:reports.data});
      }
      case 'moderate':{
        const actor=await requireMod();validId();if(!['approved','rejected','hidden'].includes(b.status)||typeof b.reason!=='string'||!b.reason.trim()||b.reason.length>1000)throw new ApiError(400,'เลือกผลการตรวจและเขียนเหตุผลให้ครบ');
        const r=await db.rpc('review_star',{p_actor:actor,p_star:b.id,p_status:b.status,p_reason:b.reason.trim()});check(r);return reply(200,{ok:true});
      }
      default:throw new ApiError(400,'ทำรายการนี้ไม่ได้');
    }
  }catch(error){return reply(error instanceof ApiError?error.status:500,{error:error instanceof ApiError?error.message:'มีบางอย่างขัดข้อง ลองอีกครั้งนะ'});}
});
