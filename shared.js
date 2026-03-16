// ═══════════════════════════════════════════
//  SHARED — constants, utilities, API helpers
// ═══════════════════════════════════════════

const DISCORD_CLIENT_ID = '1481633911917514853';
const DISCORD_REDIRECT  = 'https://saportbati.github.io/loadsite/';
const DISCORD_SCOPE     = 'identify email';
const WORKER_URL        = 'https://loadsite-api.grebenkinmatveyvyceslacovi2007.workers.dev';
const XOR_KEY           = 'SaportBati_SecretKey_2024';
const TRIAL_SECONDS     = 2 * 24 * 3600;
const TRIAL_PREFIX      = 'Пробная-подписка';
const TRIAL_COLOR       = '#7FFFD4';
const DEV_PREFIX        = 'Разработчик';
const EDIT_CD_SEC       = 24 * 3600;
const EDIT_LOCK_SEC     = 30;

// Секретный ключ для закрытых эндпоинтов воркера
const API_SECRET = 'LR_s3cr3t_K3y_2024_xZ9q';

// ── CP1251 ──
const CP1251_MAP=[0x0402,0x0403,0x201A,0x0453,0x201E,0x2026,0x2020,0x2021,0x20AC,0x2030,0x0409,0x2039,0x040A,0x040C,0x040B,0x040F,0x0452,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0x0000,0x2122,0x0459,0x203A,0x045A,0x045C,0x045B,0x045F,0x00A0,0x040E,0x045E,0x0408,0x00A4,0x0490,0x00A6,0x00A7,0x0401,0x00A9,0x0404,0x00AB,0x00AC,0x00AD,0x00AE,0x0407,0x00B0,0x00B1,0x0406,0x0456,0x0491,0x00B5,0x00B6,0x00B7,0x0451,0x2116,0x0454,0x00BB,0x0458,0x0405,0x0455,0x0457,0x0410,0x0411,0x0412,0x0413,0x0414,0x0415,0x0416,0x0417,0x0418,0x0419,0x041A,0x041B,0x041C,0x041D,0x041E,0x041F,0x0420,0x0421,0x0422,0x0423,0x0424,0x0425,0x0426,0x0427,0x0428,0x0429,0x042A,0x042B,0x042C,0x042D,0x042E,0x042F,0x0430,0x0431,0x0432,0x0433,0x0434,0x0435,0x0436,0x0437,0x0438,0x0439,0x043A,0x043B,0x043C,0x043D,0x043E,0x043F,0x0440,0x0441,0x0442,0x0443,0x0444,0x0445,0x0446,0x0447,0x0448,0x0449,0x044A,0x044B,0x044C,0x044D,0x044E,0x044F];
const unicodeToCp1251=new Map();for(let i=0;i<128;i++)unicodeToCp1251.set(i,i);CP1251_MAP.forEach((u,i)=>{if(u)unicodeToCp1251.set(u,0x80+i);});
const cp1251ToUnicode=new Array(256);for(let i=0;i<128;i++)cp1251ToUnicode[i]=i;CP1251_MAP.forEach((u,i)=>{cp1251ToUnicode[0x80+i]=u||0;});
function strToCP1251Bytes(str){const b=[];for(let i=0;i<str.length;i++){const c=str.charCodeAt(i),by=unicodeToCp1251.get(c);b.push(by!==undefined?by:0x3F);}return b;}
function cp1251BytesToStr(bytes){return bytes.map(b=>{const u=cp1251ToUnicode[b];return u!==undefined?String.fromCharCode(u):'?';}).join('');}

const B64='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64decodeBytes(str){str=str.replace(/\s/g,'');const out=[];for(let i=0;i<str.length;i+=4){const a=B64.indexOf(str[i]),b=B64.indexOf(str[i+1]),c=str[i+2]==='='?0:B64.indexOf(str[i+2]),d=str[i+3]==='='?0:B64.indexOf(str[i+3]);out.push(a*4+Math.floor(b/16));if(str[i+2]!=='=')out.push((b%16)*16+Math.floor(c/4));if(str[i+3]!=='=')out.push((c%4)*64+d);}return out;}
function b64encodeBytes(bytes){const chars=[];for(let i=0;i<bytes.length;i+=3){const b1=bytes[i],b2=bytes[i+1]??0,b3=bytes[i+2]??0,has2=i+1<bytes.length,has3=i+2<bytes.length,n=b1*65536+b2*256+b3;chars.push(B64[Math.floor(n/262144)]);chars.push(B64[Math.floor((n%262144)/4096)]);chars.push(has2?B64[Math.floor((n%4096)/64)]:'=');chars.push(has3?B64[n%64]:'=');}return chars.join('');}
function xorDecrypt(bytes,key){const k=strToCP1251Bytes(key);return bytes.map((b,i)=>b^k[i%k.length]);}
function xorEncrypt(str,key){const s=strToCP1251Bytes(str),k=strToCP1251Bytes(key);return s.map((b,i)=>b^k[i%k.length]);}

// ── FETCH HELPERS ──
function fetchWithTimeout(url,options={},ms=8000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);return fetch(url,{...options,signal:c.signal}).finally(()=>clearTimeout(t));}

// ── WORKER DB (закрытые — с ключом) ──
async function readDB(){
  try{
    const r=await fetchWithTimeout(WORKER_URL,{headers:{'X-API-Key':API_SECRET}},5000);
    if(!r.ok)throw new Error('Worker '+r.status);
    return await r.json();
  }catch(e){return{users:[],sha:null};}
}
async function writeDB(users,sha){
  const r=await fetch(WORKER_URL,{
    method:'PUT',
    headers:{'Content-Type':'application/json','X-API-Key':API_SECRET},
    body:JSON.stringify({users,sha})
  });
  if(!r.ok){const e=await r.json();throw new Error(e.error||'Write failed');}
}

// ── GITHUB SUBS (закрытые — с ключом) ──
async function githubFetch(){
  const r=await fetchWithTimeout(WORKER_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-API-Key':API_SECRET},
    body:JSON.stringify({action:'fetchSubs'})
  },10000);
  if(!r.ok)throw new Error('Worker fetchSubs '+r.status);
  const d=await r.json();if(d.error)throw new Error(d.error);
  const fileRaw=atob(d.content.replace(/\s/g,''));
  const entries=[];
  for(const line of fileRaw.split(/\r?\n/)){const t=line.trim();if(!t)continue;try{const dec=cp1251BytesToStr(xorDecrypt(b64decodeBytes(t),XOR_KEY));if(dec.includes('|'))entries.push(dec);}catch(e){}}
  return{sha:d.sha,entries};
}
async function githubPush(sha,entries,message){
  const encLines=entries.map(e=>b64encodeBytes(xorEncrypt(e,XOR_KEY)));
  const fileContent=encLines.join('\n')+'\n';
  const fileBytes=Array.from(fileContent).map(c=>c.charCodeAt(0));
  const raw=b64encodeBytes(fileBytes);
  const lined=[];for(let j=0;j<raw.length;j+=60)lined.push(raw.slice(j,j+60));
  const fileB64=lined.join('\n')+'\n';
  const r=await fetchWithTimeout(WORKER_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-API-Key':API_SECRET},
    body:JSON.stringify({action:'pushSubs',sha,content:fileB64,message})
  },10000);
  if(!r.ok)throw new Error('Worker pushSubs '+r.status);
  const res=await r.json();if(res.error)throw new Error(res.error);
}

// GET /subs-api — открытый, без ключа
async function fetchSubscriptions(){
  const r=await fetch(WORKER_URL+'/subs-api?t='+Date.now());
  if(!r.ok)throw new Error('Worker error: '+r.status);
  const fileRaw=await r.text();
  if(fileRaw.startsWith('ERROR:'))throw new Error(fileRaw);
  const entries=[];
  for(const line of fileRaw.split(/\r?\n/)){const t=line.trim();if(!t)continue;try{const dec=cp1251BytesToStr(xorDecrypt(b64decodeBytes(t),XOR_KEY));if(dec.includes('|'))entries.push(dec);}catch(e){}}
  return entries;
}

// GET /stats — открытый, без ключа
async function fetchPlayerStats(nick){
  try{
    const safeNick=nick.replace(/[^a-zA-Z0-9_.\-]/g,'_');
    const r=await fetchWithTimeout(WORKER_URL+'/stats?nick='+encodeURIComponent(safeNick)+'&t='+Date.now(),{},8000);
    if(!r.ok)return null;
    const d=await r.json();
    if(d&&typeof d==='object'){
      if('total_caught' in d||'avg_ping' in d)return d;
      if(d.found&&d.data)return d.data;
    }
    return null;
  }catch(e){return null;}
}

// ── PARSE / FORMAT ──
function parseEntry(e){const p=e.split('|');return{nick:p[0]||'',ts:parseInt(p[1])||0,prefix:(p[2]&&p[2]!=='')?p[2]:null,color:(p[3]&&p[3]!=='')?p[3]:null};}
function stripBracketPrefix(n){return n.replace(/^\[\d+\]/,'');}
function isExpired(ts){return ts!==0&&Math.floor(Date.now()/1000)>ts;}
function formatDate(ts){if(ts===0)return'∞ Безлимит';const d=new Date(ts*1000),p=n=>String(n).padStart(2,'0');return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function formatTimeLeft(ts){if(ts===0)return null;const diff=ts-Math.floor(Date.now()/1000);if(diff<=0)return null;const d=Math.floor(diff/86400),h=Math.floor((diff%86400)/3600),m=Math.floor((diff%3600)/60);if(d>0)return d+'д '+h+'ч';if(h>0)return h+'ч '+m+'м';return m+'м';}
function computeStats(data){if(!data)return{avgPing:null,totalCaught:null,chance:null};const avgPing=(data.avg_ping&&data.avg_ping>0)?Math.round(data.avg_ping):null;const totalCaught=(data.total_caught!=null)?data.total_caught:null;const totalMissed=(data.total_missed!=null)?data.total_missed:0;const total=(totalCaught!=null)?totalCaught+totalMissed:0;const chance=total>0?Math.round((totalCaught/total)*100):null;return{avgPing,totalCaught,chance};}
function formatHuntTime(secs){if(!secs||secs<=0)return null;const d=Math.floor(secs/86400),h=Math.floor((secs%86400)/3600),m=Math.floor((secs%3600)/60),s=secs%60;return{d,h,m,s};}

// ── SESSION ──
function saveSession(u){
  localStorage.setItem('lr_user',JSON.stringify(u));
  if(u && u.themeColor) applyThemeColor(u.themeColor);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {r: 59, g: 130, b: 246};
}

function applyThemeColor(hex) {
  if(!hex) hex = '#3b82f6';
  const rgb = hexToRgb(hex);
  const root = document.documentElement;
  
  // Base accent
  root.style.setProperty('--theme-color', hex);
  root.style.setProperty('--theme-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  
  // Backgrounds (Very dark version of theme color)
  root.style.setProperty('--bg', `rgb(${Math.floor(rgb.r * 0.04)}, ${Math.floor(rgb.g * 0.05)}, ${Math.floor(rgb.b * 0.08)})`);
  root.style.setProperty('--bg2', `rgb(${Math.floor(rgb.r * 0.06)}, ${Math.floor(rgb.g * 0.08)}, ${Math.floor(rgb.b * 0.12)})`);
  
  // Surface & Borders
  root.style.setProperty('--surf', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`);
  root.style.setProperty('--border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
  root.style.setProperty('--theme-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
  
  // Text & Accents
  root.style.setProperty('--text', `rgb(${Math.min(255, 200 + rgb.r * 0.2)}, ${Math.min(255, 210 + rgb.g * 0.2)}, ${Math.min(255, 230 + rgb.b * 0.1)})`);
  root.style.setProperty('--muted', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
}

// Apply theme on load if session exists
(function(){
  const u = loadSession();
  if(u && u.themeColor) applyThemeColor(u.themeColor);
  else applyThemeColor('#3b82f6');
})();
function loadSession(){try{return JSON.parse(localStorage.getItem('lr_user'));}catch{return null;}}
function clearSession(){localStorage.removeItem('lr_user');}
function getCdLeft(user){if(!user||!user.editCooldown)return 0;const diff=EDIT_CD_SEC-(Math.floor(Date.now()/1000)-(user.editCooldown.lastEdit||0));return diff>0?diff:0;}
function fmtCd(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h>0?h+'ч '+m+'м':m+'м '+Math.floor(s%60)+'с';}
function checkBanStatus(user){if(!user.banned)return false;if(user.bannedUntil===0)return true;return Math.floor(Date.now()/1000)<user.bannedUntil;}

// ── NAVIGATION ──
function goLogin(){window.location.href='index.html';}
function goMyProfile(){window.location.href='profile.html';}
function goUserProfile(nick){window.location.href='profile.html?user='+encodeURIComponent(nick);}
function logout(){clearSession();goLogin();}
