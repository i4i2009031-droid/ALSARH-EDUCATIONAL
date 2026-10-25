'use strict';
const http = require('node:http');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../data');
const WEB_DIR = path.resolve(__dirname, '../web');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'alsarh.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
db.exec(`
CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, currency TEXT NOT NULL DEFAULT 'YER', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS memberships (user_id TEXT NOT NULL, org_id TEXT NOT NULL, role TEXT NOT NULL, student_id TEXT, PRIMARY KEY (user_id,org_id), FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(org_id) REFERENCES organizations(id));
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, org_id TEXT NOT NULL, expires_at INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, type TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_records_org_type ON records(org_id,type);
CREATE TABLE IF NOT EXISTS accounts (org_id TEXT NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, PRIMARY KEY(org_id,code));
CREATE TABLE IF NOT EXISTS journal (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, kind TEXT NOT NULL, ref_id TEXT NOT NULL, memo TEXT NOT NULL, entry_date TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS journal_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, journal_id TEXT NOT NULL, code TEXT NOT NULL, debit INTEGER NOT NULL DEFAULT 0, credit INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(journal_id) REFERENCES journal(id));
CREATE TABLE IF NOT EXISTS fee_invoices (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, student_id TEXT NOT NULL, description TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0), paid INTEGER NOT NULL DEFAULT 0 CHECK(paid >= 0), due_date TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, fee_id TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0), method TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(fee_id) REFERENCES fee_invoices(id));
CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0), method TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, user_id TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS idempotency (org_id TEXT NOT NULL, key TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(org_id,key));
`);

const ALLOWED = {
  students: ['name','code','classId','guardianName','guardianPhone','guardianUserId','status','birthDate','address','notes'],
  teachers: ['name','specialty','phone','email','userId','status'],
  classes: ['name','grade','section','room','teacherUserId','year','status'],
  subjects: ['name','code','classId','teacherUserId','description'],
  lessons: ['title','classId','subjectId','teacherUserId','date','description','url','status'],
  books: ['title','subjectId','classId','author','url','description','status'],
  assignments: ['title','classId','subjectId','teacherUserId','dueDate','instructions','maxScore','status'],
  submissions: ['assignmentId','studentId','answer','url','submittedAt','score','feedback'],
  exams: ['title','classId','subjectId','date','maxScore','status','description'],
  grades: ['studentId','examId','score','notes'],
  attendance: ['studentId','date','status','notes'],
  schedule: ['classId','subjectId','teacherUserId','day','startTime','endTime','room'],
  announcements: ['title','body','classId','date','audience'],
  inventory: ['name','sku','quantity','unit','price','notes'],
  employees: ['name','jobTitle','phone','salary','status','notes'],
};
const READ = {
  admin: Object.keys(ALLOWED), principal: Object.keys(ALLOWED),
  accountant: ['students','teachers','classes','inventory','employees','announcements'],
  teacher: ['students','teachers','classes','subjects','lessons','books','assignments','submissions','exams','grades','attendance','schedule','announcements'],
  guardian: ['students','classes','subjects','lessons','books','assignments','submissions','exams','grades','attendance','schedule','announcements'],
  student: ['students','classes','subjects','lessons','books','assignments','submissions','exams','grades','attendance','schedule','announcements'],
};
const WRITE = {
  admin: Object.keys(ALLOWED), principal: Object.keys(ALLOWED),
  accountant: ['inventory','employees'],
  teacher: ['lessons','books','assignments','exams','grades','attendance','schedule','announcements'],
  guardian: [], student: ['submissions'],
};
const ACCOUNT_SEED = [
  ['1100','الصندوق','asset'],['1110','البنك','asset'],['1200','الذمم المدينة - الطلاب','asset'],
  ['2100','الذمم الدائنة','liability'],['3100','رأس المال','equity'],
  ['4100','إيرادات الرسوم الدراسية','revenue'],['4200','إيرادات أخرى','revenue'],
  ['5100','المصروفات التشغيلية','expense'],
];
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const normEmail = x => String(x || '').trim().toLowerCase();
const text = (x,max=200) => String(x ?? '').trim().slice(0,max);
function passwordHash(password,salt=crypto.randomBytes(16).toString('hex')) {
  return `scrypt$${salt}$${crypto.scryptSync(password,salt,64).toString('hex')}`;
}
function passwordCheck(password,hash) {
  try {
    const [alg,salt,expected] = hash.split('$');
    if (alg!=='scrypt') return false;
    const actual=crypto.scryptSync(password,salt,64);
    return crypto.timingSafeEqual(actual,Buffer.from(expected,'hex'));
  } catch { return false; }
}
function tx(fn){ db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;} }
function error(status,message) {const e=new Error(message);e.status=status;throw e;}
function recordById(orgId,type,id){const r=db.prepare('SELECT * FROM records WHERE id=? AND org_id=? AND type=?').get(id,orgId,type);return r?present(r):null;}
function present(row){return {id:row.id,...JSON.parse(row.data),createdAt:row.created_at,updatedAt:row.updated_at};}
function allRecords(org,type){return db.prepare('SELECT * FROM records WHERE org_id=? AND type=? ORDER BY created_at DESC').all(org,type).map(present);}
function audit(user,action,entity,id) {db.prepare('INSERT INTO audit VALUES (?,?,?,?,?,?,?)').run(uid(),user.orgId,user.id,action,entity,id,now());}
function json(res,status,body,extra={}){
  const data=Buffer.from(JSON.stringify(body));
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});res.end(data);
}
function cookie(req, name){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||'';}
function secure(req) {return !!(req.socket.encrypted || (process.env.TRUST_PROXY==='1' && req.headers['x-forwarded-proto']==='https'));}
function makeCookie(req,token,maxAge=60*60*24*7){return `alsarh_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure(req)?'; Secure':''}`;}
function who(req){
  const token=cookie(req,'alsarh_session');
  if(!/^[0-9a-f]{64}$/.test(token))return null;
  const hashed=crypto.createHash('sha256').update(token).digest('hex');
  const s=db.prepare(`SELECT s.user_id as id, s.org_id as orgId, u.name, u.email, m.role, m.student_id as studentId, o.name as schoolName, o.currency
    FROM sessions s JOIN users u ON u.id=s.user_id JOIN memberships m ON m.user_id=s.user_id AND m.org_id=s.org_id
    JOIN organizations o ON o.id=s.org_id WHERE s.token_hash=? AND s.expires_at>?`).get(hashed,Date.now());
  return s || null;
}
function session(req,res,user){
  const token=crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(crypto.createHash('sha256').update(token).digest('hex'),user.id,user.orgId,Date.now()+7*86400000);
  res.setHeader('Set-Cookie',makeCookie(req,token));
}
function requireAuth(req){const user=who(req);if(!user)error(401,'يجب تسجيل الدخول أولاً');return user;}
function bodyFrom(req){return new Promise((resolve,reject)=>{
  let data='';req.on('data',chunk=>{data+=chunk;if(data.length>512000){reject(Object.assign(new Error('حجم الطلب كبير'),{status:413}));req.destroy();}});
  req.on('end',()=>{try{resolve(data?JSON.parse(data):{});}catch{reject(Object.assign(new Error('البيانات غير صالحة'),{status:400}));}});req.on('error',reject);
});}
const attempts=new Map();
function limitLogin(ip){const v=attempts.get(ip)||{count:0,until:Date.now()+600000};if(Date.now()>v.until){v.count=0;v.until=Date.now()+600000;}v.count++;attempts.set(ip,v);if(v.count>12) error(429,'محاولات كثيرة. حاول لاحقاً');}
function checkOrigin(req){
  if(!['POST','PATCH','DELETE','PUT'].includes(req.method))return;
  if(req.headers['sec-fetch-site']==='cross-site')error(403,'طلب غير موثوق');
  const origin=req.headers.origin; if(origin){let host;try{host=new URL(origin).host;}catch{error(403,'مصدر غير صالح');}if(host!==req.headers.host)error(403,'مصدر غير مسموح');}
}
function seedAccounts(org){const q=db.prepare('INSERT INTO accounts VALUES (?,?,?,?)');for(const a of ACCOUNT_SEED)q.run(org,...a);}
function getScope(user){
  const classIds=allRecords(user.orgId,'classes').filter(x=>x.teacherUserId===user.id).map(x=>x.id);
  const studentIds=allRecords(user.orgId,'students').filter(x=> x.guardianUserId===user.id || (user.role==='student' && x.id===user.studentId)).map(x=>x.id);
  const ownStudents=allRecords(user.orgId,'students').filter(x=>classIds.includes(x.classId)).map(x=>x.id);
  return {classIds,studentIds,ownStudents};
}
function visible(user,type,record){
  if(['admin','principal','accountant'].includes(user.role)) return true;
  const scope=getScope(user);
  if(user.role==='teacher') {
    if(type==='teachers'||type==='announcements'||type==='books'||type==='subjects') return true;
    if(type==='classes')return scope.classIds.includes(record.id);
    if(type==='students')return scope.ownStudents.includes(record.id);
    if(type==='submissions')return scope.ownStudents.includes(record.studentId);
    if(type==='grades'||type==='attendance')return scope.ownStudents.includes(record.studentId);
    return scope.classIds.includes(record.classId)||record.teacherUserId===user.id;
  }
  if(user.role==='guardian'||user.role==='student') {
    const ids=scope.studentIds;
    const classIds=allRecords(user.orgId,'students').filter(x=>ids.includes(x.id)).map(x=>x.classId);
    if(type==='students')return ids.includes(record.id);
    if(type==='grades'||type==='attendance'||type==='submissions')return ids.includes(record.studentId);
    if(type==='classes')return classIds.includes(record.id);
    if(type==='announcements')return !record.classId || classIds.includes(record.classId);
    return classIds.includes(record.classId);
  }
  return false;
}
function canWriteRecord(user,type,record){
  if(['admin','principal','accountant'].includes(user.role))return true;
  if(user.role==='student')return type==='submissions' && record.studentId===user.studentId;
  if(user.role==='teacher') {
    const s=getScope(user);
    if(type==='grades'||type==='attendance')return s.ownStudents.includes(record.studentId);
    if(type==='announcements')return !!record.classId && s.classIds.includes(record.classId);
    return !!record.classId && s.classIds.includes(record.classId);
  }
  return false;
}
function validateData(type,data,existing={}){
  if(!data || typeof data!=='object'||Array.isArray(data))error(400,'بيانات النموذج غير صحيحة');
  const out={};for(const k of ALLOWED[type])if(data[k]!==undefined){
    const value=data[k];if(typeof value!=='string' && typeof value!=='number' && value!==null)error(400,'قيمة غير صحيحة: '+k);
    out[k]= typeof value==='string'?value.trim().slice(0,k==='description'||k==='body'||k==='instructions'||k==='answer'||k==='notes'?5000:300):value;
  }
  const merged={...Object.fromEntries(ALLOWED[type].filter(k=>existing[k]!==undefined).map(k=>[k,existing[k]])),...out};
  const required={students:['name'],teachers:['name'],classes:['name'],subjects:['name'],lessons:['title'],books:['title'],assignments:['title'],submissions:['assignmentId','studentId'],exams:['title'],grades:['studentId','examId','score'],attendance:['studentId','date','status'],schedule:['classId','day','startTime'],announcements:['title','body'],inventory:['name'],employees:['name']};
  for(const k of required[type]||[])if(merged[k]===undefined||merged[k]===null||merged[k]==='')error(400,'حقل مطلوب: '+k);
  if(type==='attendance'&&!['present','absent','late','excused'].includes(merged.status))error(400,'حالة حضور غير صحيحة');
  if(['grades','submissions'].includes(type) && merged.score!==undefined && merged.score!==''){
    const score=Number(merged.score);if(!Number.isFinite(score)||score<0||score>100000)error(400,'درجة غير صحيحة');merged.score=score;
  }
  return merged;
}
function validateRelations(user,type,rec){
  const org=user.orgId;
  if(rec.classId && !recordById(org,'classes',rec.classId))error(400,'الصف المختار غير موجود');
  if(rec.studentId && !recordById(org,'students',rec.studentId))error(400,'الطالب غير موجود');
  if(rec.examId && !recordById(org,'exams',rec.examId))error(400,'الاختبار غير موجود');
  if(rec.assignmentId && !recordById(org,'assignments',rec.assignmentId))error(400,'الواجب غير موجود');
  if(rec.subjectId && !recordById(org,'subjects',rec.subjectId))error(400,'المادة غير موجودة');
  if(rec.guardianUserId){const m=db.prepare('SELECT role FROM memberships WHERE user_id=? AND org_id=?').get(rec.guardianUserId,org);if(!m||m.role!=='guardian')error(400,'ولي الأمر غير صالح');}
  if(rec.teacherUserId){const m=db.prepare('SELECT role FROM memberships WHERE user_id=? AND org_id=?').get(rec.teacherUserId,org);if(!m||!['teacher','admin','principal'].includes(m.role))error(400,'المعلم غير صالح');}
  if(type==='grades'){const st=recordById(org,'students',rec.studentId),exam=recordById(org,'exams',rec.examId);if(exam.classId && st.classId!==exam.classId)error(400,'الاختبار والطالب ليسا في الصف نفسه');}
  if(type==='attendance'){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(rec.date))error(400,'تاريخ الحضور غير صحيح');
  }
}
function cents(value){const x=Number(value);if(!Number.isSafeInteger(x)||x<=0||x>1000000000000)error(400,'المبلغ يجب أن يكون عددًا صحيحًا موجبًا');return x;}
function journal(user,kind,refId,memo,date,lines){
  const d=lines.reduce((s,l)=>s+l.debit-l.credit,0);
  if(d!==0||lines.length<2||lines.some(x=>x.debit<0||x.credit<0||x.debit&&x.credit))error(500,'القيد المحاسبي غير متوازن');
  const id=uid();db.prepare('INSERT INTO journal VALUES (?,?,?,?,?,?,?,?)').run(id,user.orgId,kind,refId,memo,date,user.id,now());
  const q=db.prepare('INSERT INTO journal_lines(journal_id,code,debit,credit) VALUES (?,?,?,?)');
  for(const l of lines){if(!db.prepare('SELECT 1 FROM accounts WHERE org_id=? AND code=?').get(user.orgId,l.code))error(500,'الحساب غير معروف');q.run(id,l.code,l.debit,l.credit);}
}
const financialRead = user => ['admin','principal','accountant','guardian'].includes(user.role);
const financialWrite = user => ['admin','principal','accountant'].includes(user.role);
function feeFor(user,id){const f=db.prepare('SELECT * FROM fee_invoices WHERE id=? AND org_id=?').get(id,user.orgId);if(!f)error(404,'الفاتورة غير موجودة');return f;}
function maySeeFee(user,fee){return ['admin','principal','accountant'].includes(user.role) || (user.role==='guardian' && visible(user,'students',recordById(user.orgId,'students',fee.student_id)));}
function idem(user,key,fn){
  const id=text(key||'',80); if(!id) return tx(fn);
  if(!/^[\w-]{8,80}$/.test(id))error(400,'معرف العملية غير صالح');
  return tx(()=>{const existing=db.prepare('SELECT response FROM idempotency WHERE org_id=? AND key=?').get(user.orgId,id);if(existing)return JSON.parse(existing.response);const value=fn();db.prepare('INSERT INTO idempotency VALUES (?,?,?)').run(user.orgId,id,JSON.stringify(value));return value;});
}
function serveStatic(req,res,pathname){
  let filename=pathname==='/'?'/index.html':pathname;
  if(!['/','/index.html','/app.js','/styles.css','/sw.js','/manifest.webmanifest','/logo.svg','/icon.svg'].includes(filename)) filename='/index.html';
  const file=path.join(WEB_DIR,filename.replace(/^\//,''));
  if(!fs.existsSync(file)){res.writeHead(404);return res.end('Not found');}
  const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'}[path.extname(file)]||'application/octet-stream';
  const binary=fs.readFileSync(file);res.writeHead(200,{'Content-Type':mime,'Content-Length':binary.length,'Cache-Control':filename==='/sw.js'?'no-cache':'public, max-age=180','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'});res.end(binary);
}
async function route(req,res){
  const u=new URL(req.url,'http://localhost');const p=u.pathname;
  if(!p.startsWith('/api/'))return serveStatic(req,res,p);
  checkOrigin(req);
  if(p==='/api/health'&&req.method==='GET')return json(res,200,{ok:true,initialized:!!db.prepare('SELECT 1 FROM organizations LIMIT 1').get(),version:'0.1.0'});
  const b=['POST','PATCH','PUT'].includes(req.method)?await bodyFrom(req):{};
  if(p==='/api/setup'&&req.method==='POST'){
    if(db.prepare('SELECT 1 FROM organizations LIMIT 1').get())error(409,'تم إنشاء المؤسسة بالفعل');
    const schoolName=text(b.schoolName,150),name=text(b.name,100),email=normEmail(b.email),password=String(b.password||'');
    if(schoolName.length<3||name.length<2||!/^\S+@\S+\.\S+$/.test(email)||password.length<10)error(400,'أدخل اسم المؤسسة والاسم والبريد وكلمة مرور من 10 أحرف على الأقل');
    const user=tx(()=>{if(db.prepare('SELECT 1 FROM organizations LIMIT 1').get())error(409,'المؤسسة مُهيأة');const orgId=uid(),id=uid();db.prepare('INSERT INTO organizations VALUES (?,?,?,?)').run(orgId,schoolName,['YER','SAR','USD'].includes(b.currency)?b.currency:'YER',now());db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(id,name,email,passwordHash(password),now());db.prepare('INSERT INTO memberships VALUES (?,?,?,NULL)').run(id,orgId,'admin');seedAccounts(orgId);return {id,orgId,name,email,role:'admin',schoolName};});
    session(req,res,user);return json(res,201,{user:{name:user.name,email:user.email,role:user.role,schoolName}});
  }
  if(p==='/api/login'&&req.method==='POST'){
    limitLogin(req.socket.remoteAddress||'unknown');const email=normEmail(b.email),password=String(b.password||'');
    const row=db.prepare('SELECT u.*,m.org_id as orgId,m.role,o.name as schoolName FROM users u JOIN memberships m ON m.user_id=u.id JOIN organizations o ON o.id=m.org_id WHERE u.email=? LIMIT 1').get(email);
    if(!row || !passwordCheck(password,row.password_hash))error(401,'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    session(req,res,row);return json(res,200,{user:{name:row.name,email:row.email,role:row.role,schoolName:row.schoolName}});
  }
  if(p==='/api/logout'&&req.method==='POST'){
    const token=cookie(req,'alsarh_session');if(token)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(crypto.createHash('sha256').update(token).digest('hex'));
    res.setHeader('Set-Cookie',makeCookie(req,'',0));return json(res,200,{ok:true});
  }
  const user=requireAuth(req);
  if(p==='/api/me'&&req.method==='GET')return json(res,200,{user});
  if(p==='/api/users'&&req.method==='GET'){
    if(!['admin','principal','accountant'].includes(user.role))error(403,'لا تملك الصلاحية');
    const rows=db.prepare(`SELECT u.id,u.name,u.email,m.role,m.student_id as studentId FROM users u JOIN memberships m ON m.user_id=u.id WHERE m.org_id=? ORDER BY u.name`).all(user.orgId);
    return json(res,200,{items:rows});
  }
  if(p==='/api/users'&&req.method==='POST'){
    if(user.role!=='admin')error(403,'هذه العملية للمدير فقط');
    const name=text(b.name,100),email=normEmail(b.email),role=text(b.role),password=String(b.password||'');
    if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||password.length<10||!['admin','principal','accountant','teacher','guardian','student'].includes(role))error(400,'بيانات المستخدم غير صحيحة');
    if(role==='student'&&!recordById(user.orgId,'students',b.studentId))error(400,'حدد الطالب المرتبط بهذا الحساب');
    const item=tx(()=>{const old=db.prepare('SELECT id FROM users WHERE email=?').get(email);if(old)error(409,'البريد مسجل مسبقًا');const id=uid();db.prepare('INSERT INTO users VALUES (?,?,?,?,?)').run(id,name,email,passwordHash(password),now());db.prepare('INSERT INTO memberships VALUES (?,?,?,?)').run(id,user.orgId,role,role==='student'?b.studentId:null);audit(user,'create','users',id);return {id,name,email,role};});return json(res,201,{item});
  }
  if(p==='/api/change-password'&&req.method==='POST'){
    if(String(b.newPassword||'').length<10)error(400,'كلمة المرور الجديدة قصيرة');
    const row=db.prepare('SELECT password_hash FROM users WHERE id=?').get(user.id);
    if(!passwordCheck(String(b.currentPassword||''),row.password_hash))error(403,'كلمة المرور الحالية خاطئة');
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(passwordHash(b.newPassword),user.id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);
    res.setHeader('Set-Cookie',makeCookie(req,'',0));return json(res,200,{ok:true});
  }
  const match=p.match(/^\/api\/data\/([a-z]+)(?:\/([a-z0-9-]+))?$/);
  if(match){const type=match[1],id=match[2];if(!ALLOWED[type])error(404,'القسم غير موجود');
    if(req.method==='GET'&&!id){if(!READ[user.role]?.includes(type))error(403,'لا تملك الصلاحية');return json(res,200,{items:allRecords(user.orgId,type).filter(rec=>visible(user,type,rec))});}
    if(!WRITE[user.role]?.includes(type))error(403,'لا تملك صلاحية التعديل');
    if(req.method==='POST'&&!id){const data=validateData(type,b.data);validateRelations(user,type,data);if(!canWriteRecord(user,type,data))error(403,'لا تملك صلاحية هذا السجل');
      const row=tx(()=>{if(type==='attendance'&&allRecords(user.orgId,'attendance').some(x=>x.studentId===data.studentId&&x.date===data.date))error(409,'سُجل حضور هذا الطالب مسبقًا');const rid=uid(),createdAt=now();db.prepare('INSERT INTO records VALUES (?,?,?,?,?,?)').run(rid,user.orgId,type,JSON.stringify(data),createdAt,createdAt);audit(user,'create',type,rid);return {id:rid,...data,createdAt,updatedAt:createdAt};});return json(res,201,{item:row});}
    if(req.method==='PATCH'&&id){const old=recordById(user.orgId,type,id);if(!old)error(404,'السجل غير موجود');if(!canWriteRecord(user,type,old))error(403,'لا تملك صلاحية هذا السجل');const data=validateData(type,b.data,old);validateRelations(user,type,data);if(!canWriteRecord(user,type,data))error(403,'صلاحية غير كافية');const row=tx(()=>{db.prepare('UPDATE records SET data=?,updated_at=? WHERE id=? AND org_id=?').run(JSON.stringify(data),now(),id,user.orgId);audit(user,'update',type,id);return {id,...data};});return json(res,200,{item:row});}
    if(req.method==='DELETE'&&id){const old=recordById(user.orgId,type,id);if(!old)error(404,'السجل غير موجود');if(!canWriteRecord(user,type,old))error(403,'لا تملك الصلاحية');if(['students','classes','exams'].includes(type))error(409,'حماية السجلات المرتبطة: استخدم تعديل الحالة بدلاً من الحذف');tx(()=>{db.prepare('DELETE FROM records WHERE id=? AND org_id=?').run(id,user.orgId);audit(user,'delete',type,id);});return json(res,200,{ok:true});}
  }
  if(p==='/api/finance/fees'&&req.method==='GET'){
    if(!financialRead(user))error(403,'لا تملك الصلاحية');
    const fees=db.prepare('SELECT * FROM fee_invoices WHERE org_id=? ORDER BY created_at DESC').all(user.orgId).filter(f=>maySeeFee(user,f)).map(f=>({...f,studentName:recordById(user.orgId,'students',f.student_id)?.name||'طالب غير معروف'}));
    return json(res,200,{items:fees});
  }
  if(p==='/api/finance/fees'&&req.method==='POST'){
    if(!financialWrite(user))error(403,'لا تملك الصلاحية');
    const student=recordById(user.orgId,'students',text(b.studentId));if(!student)error(400,'الطالب غير موجود');
    const amount=cents(b.amount),description=text(b.description,250)||'رسوم دراسية',dueDate=text(b.dueDate,10)||null;
    const item=idem(user,b.idempotencyKey,()=>{const id=uid(),createdAt=now();db.prepare('INSERT INTO fee_invoices VALUES (?,?,?,?,?,?,?,?)').run(id,user.orgId,student.id,description,amount,0,dueDate,createdAt);
      journal(user,'fee',id,description,createdAt.slice(0,10),[{code:'1200',debit:amount,credit:0},{code:'4100',debit:0,credit:amount}]);audit(user,'create','fee',id);return {id,studentName:student.name,amount,paid:0,description,dueDate,createdAt};});return json(res,201,{item});
  }
  if(p==='/api/finance/payments'&&req.method==='GET'){
    if(!financialRead(user))error(403,'لا تملك الصلاحية');const items=db.prepare('SELECT * FROM payments WHERE org_id=? ORDER BY created_at DESC').all(user.orgId).filter(x=>maySeeFee(user,feeFor(user,x.fee_id)));
    return json(res,200,{items});
  }
  if(p==='/api/finance/payments'&&req.method==='POST'){
    if(!financialWrite(user))error(403,'لا تملك الصلاحية');const amount=cents(b.amount),method=['cash','bank'].includes(b.method)?b.method:'cash';
    const item=idem(user,b.idempotencyKey,()=>{const f=feeFor(user,text(b.feeId));if(f.paid+amount>f.amount)error(409,'المبلغ أكبر من المتبقي على الطالب');
      const id=uid(),createdAt=now();db.prepare('INSERT INTO payments VALUES (?,?,?,?,?,?)').run(id,user.orgId,f.id,amount,method,createdAt);db.prepare('UPDATE fee_invoices SET paid=paid+? WHERE id=? AND org_id=?').run(amount,f.id,user.orgId);
      journal(user,'payment',id,'تحصيل رسوم: '+f.description,createdAt.slice(0,10),[{code:method==='bank'?'1110':'1100',debit:amount,credit:0},{code:'1200',debit:0,credit:amount}]);audit(user,'create','payment',id);return {id,fee_id:f.id,amount,method,created_at:createdAt};});return json(res,201,{item});
  }
  if(p==='/api/finance/expenses'&&req.method==='GET'){
    if(!financialWrite(user))error(403,'لا تملك الصلاحية');return json(res,200,{items:db.prepare('SELECT * FROM expenses WHERE org_id=? ORDER BY created_at DESC').all(user.orgId)});
  }
  if(p==='/api/finance/expenses'&&req.method==='POST'){
    if(!financialWrite(user))error(403,'لا تملك الصلاحية');const amount=cents(b.amount),category=text(b.category,100)||'عام',description=text(b.description,250)||category,method=['cash','bank'].includes(b.method)?b.method:'cash';
    const item=idem(user,b.idempotencyKey,()=>{const id=uid(),createdAt=now();db.prepare('INSERT INTO expenses VALUES (?,?,?,?,?,?,?)').run(id,user.orgId,category,description,amount,method,createdAt);
      journal(user,'expense',id,description,createdAt.slice(0,10),[{code:'5100',debit:amount,credit:0},{code:method==='bank'?'1110':'1100',debit:0,credit:amount}]);audit(user,'create','expense',id);return {id,category,description,amount,method,created_at:createdAt};});return json(res,201,{item});
  }
  if(p==='/api/finance/trial-balance'&&req.method==='GET'){
    if(!financialWrite(user))error(403,'لا تملك الصلاحية');
    const rows=db.prepare(`SELECT a.code,a.name,a.category,COALESCE(SUM(l.debit),0) AS debits,COALESCE(SUM(l.credit),0) AS credits
      FROM accounts a LEFT JOIN journal j ON j.org_id=a.org_id LEFT JOIN journal_lines l ON l.journal_id=j.id AND l.code=a.code
      WHERE a.org_id=? GROUP BY a.code ORDER BY a.code`).all(user.orgId).map(r=>({...r,debitBalance:Math.max(0,r.debits-r.credits),creditBalance:Math.max(0,r.credits-r.debits)}));
    return json(res,200,{items:rows,balanced:rows.reduce((s,x)=>s+x.debits-x.credits,0)===0});
  }
  if(p==='/api/overview'&&req.method==='GET'){
    const counts={};for(const type of Object.keys(ALLOWED)){if(READ[user.role]?.includes(type)) counts[type]=allRecords(user.orgId,type).filter(x=>visible(user,type,x)).length;}
    const today=now().slice(0,10),att=READ[user.role]?.includes('attendance')?allRecords(user.orgId,'attendance').filter(x=>x.date===today&&visible(user,'attendance',x)):[];
    let finance=null;if(financialRead(user)){
      const fees=db.prepare('SELECT * FROM fee_invoices WHERE org_id=?').all(user.orgId).filter(x=>maySeeFee(user,x));const expenses=financialWrite(user)?db.prepare('SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE org_id=?').get(user.orgId).total:null;
      finance={billed:fees.reduce((s,x)=>s+x.amount,0),collected:fees.reduce((s,x)=>s+x.paid,0),outstanding:fees.reduce((s,x)=>s+x.amount-x.paid,0),expenses};
    }
    return json(res,200,{counts,attendanceToday:{present:att.filter(x=>x.status==='present').length,absent:att.filter(x=>x.status==='absent').length,late:att.filter(x=>x.status==='late').length},finance});
  }
  if(p==='/api/audit'&&req.method==='GET'){
    if(user.role!=='admin')error(403,'لا تملك الصلاحية');return json(res,200,{items:db.prepare('SELECT a.*,u.name as userName FROM audit a JOIN users u ON u.id=a.user_id WHERE a.org_id=? ORDER BY a.created_at DESC LIMIT 200').all(user.orgId)});
  }
  if(p==='/api/export'&&req.method==='GET'){
    if(user.role!=='admin')error(403,'لا تملك الصلاحية');const snapshot={generatedAt:now(),organization:db.prepare('SELECT * FROM organizations WHERE id=?').get(user.orgId),records:db.prepare('SELECT * FROM records WHERE org_id=?').all(user.orgId),feeInvoices:db.prepare('SELECT * FROM fee_invoices WHERE org_id=?').all(user.orgId),payments:db.prepare('SELECT * FROM payments WHERE org_id=?').all(user.orgId),expenses:db.prepare('SELECT * FROM expenses WHERE org_id=?').all(user.orgId),accounts:db.prepare('SELECT * FROM accounts WHERE org_id=?').all(user.orgId),journal:db.prepare('SELECT * FROM journal WHERE org_id=?').all(user.orgId),lines:db.prepare('SELECT l.* FROM journal_lines l JOIN journal j ON j.id=l.journal_id WHERE j.org_id=?').all(user.orgId)};
    return json(res,200,snapshot,{'Content-Disposition':'attachment; filename="alsarh-backup.json"'});
  }
  error(404,'المسار غير موجود');
}
const server=http.createServer((req,res)=>{route(req,res).catch(e=>{console.error('REQUEST',req.method,req.url,e.message);if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'حدث خطأ في الخادم'});else res.end();});});
if(require.main===module)server.listen(PORT,HOST,()=>console.log(`ALSARH running on http://${HOST}:${PORT}`));
module.exports={server,db};
