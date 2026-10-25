/* ALSARH Local Workspace: browser/Android/Windows offline API.
 * This is a single-device local database for evaluation and small drafts; it is not
 * a networked replacement for the audited server and must never be treated as a sync engine.
 */
(()=>{
'use strict';
const params=new URLSearchParams(location.search);
const enabled=location.hostname==='appassets.androidplatform.net'||location.protocol==='alsarh:'||location.protocol==='file:'||params.get('offline')==='1';
window.ALSARH_LOCAL_MODE=enabled;
if(!enabled)return;
const STORE='workspace', DBNAME='alsarh-local-workspace', VERSION=1;
const MODEL_TYPES=['students','teachers','classes','subjects','lessons','books','assignments','submissions','exams','grades','attendance','schedule','announcements','inventory','employees','curricula','reviews','questions','transport','meetings','behavior','libraryLoans','salaryPlans'];
const ROLES=['admin','principal','accountant','teacher','guardian','student'];
const ACCOUNT_SEED=[['1100','الصندوق','asset'],['1110','البنك','asset'],['1200','الذمم المدينة - الطلاب','asset'],['2100','الذمم الدائنة','liability'],['3100','رأس المال','equity'],['4100','إيرادات الرسوم الدراسية','revenue'],['4200','إيرادات أخرى','revenue'],['5100','المصروفات التشغيلية','expense']];
const READ={admin:MODEL_TYPES,principal:MODEL_TYPES,accountant:['students','teachers','classes','inventory','employees','announcements','salaryPlans'],teacher:['students','teachers','classes','subjects','lessons','books','assignments','submissions','exams','grades','attendance','schedule','announcements','curricula','reviews','questions','meetings','behavior','libraryLoans'],guardian:['students','classes','subjects','lessons','books','assignments','submissions','exams','grades','attendance','schedule','announcements','curricula','reviews','meetings','behavior','libraryLoans'],student:['students','classes','subjects','lessons','books','assignments','submissions','exams','grades','attendance','schedule','announcements','curricula','reviews','meetings','behavior','libraryLoans']};
const WRITE={admin:MODEL_TYPES,principal:MODEL_TYPES,accountant:['inventory','employees','salaryPlans'],teacher:['lessons','books','assignments','exams','grades','attendance','schedule','announcements','curricula','reviews','questions','meetings','behavior','libraryLoans'],guardian:[],student:['submissions']};
const REQUIRE={students:['name'],teachers:['name'],classes:['name'],subjects:['name'],lessons:['title'],books:['title'],assignments:['title'],submissions:['assignmentId','studentId'],exams:['title'],grades:['studentId','examId','score'],attendance:['studentId','date','status'],schedule:['classId','day','startTime'],announcements:['title','body'],inventory:['name'],employees:['name'],curricula:['title'],reviews:['title'],questions:['question'],transport:['name'],meetings:['title'],behavior:['studentId','date','description'],libraryLoans:['studentId','bookId','date'],salaryPlans:['employeeId','amount']};
const LONG_TEXT=['description','body','instructions','answer','notes','feedback','question','options','solution','content'];
const now=()=>new Date().toISOString(), uid=()=>crypto.randomUUID(), norm=x=>String(x??'').trim(), email=x=>norm(x).toLowerCase();
function fail(msg){throw new Error(msg);}
const initial=()=>({format:'alsarh.offline.v1',organization:null,users:[],currentUserId:null,records:[],feeInvoices:[],payments:[],expenses:[],accounts:[],journal:[],lines:[],audit:[],idempotency:{}});
let openPromise;
function dbOpen(){return openPromise||(openPromise=new Promise((resolve,reject)=>{const r=indexedDB.open(DBNAME,VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}));}
async function load(){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get('state');req.onsuccess=()=>resolve(req.result||initial());req.onerror=()=>reject(req.error);});}
async function save(state){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(state,'state');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
let pending=Promise.resolve();
function serialize(work){const next=pending.then(work);pending=next.catch(()=>{});return next;}
function ownUser(s){return s.users.find(x=>x.id===s.currentUserId)||null;}
function publicUser(s){const u=ownUser(s);return u?{id:u.id,orgId:s.organization.id,name:u.name,email:u.email,role:u.role,studentId:u.studentId||null,schoolName:s.organization.name,currency:s.organization.currency}:null;}
function authenticated(s){const u=ownUser(s);if(!u)fail('يجب تسجيل الدخول أولًا');return u;}
function ensureAdmin(u){if(u.role!=='admin')fail('هذه العملية متاحة لمدير النظام فقط');}
function hasRole(u,roles){if(!roles.includes(u.role))fail('لا تملك صلاحية هذه العملية');}
function lookup(s,type,id){return s.records.find(x=>x.type===type&&x.id===id)||null;}
function arr(s,type){return s.records.filter(x=>x.type===type).map(x=>({id:x.id,...x.data,createdAt:x.created_at,updatedAt:x.updated_at}));}
function scope(s,u){const classIds=arr(s,'classes').filter(x=>x.teacherUserId===u.id).map(x=>x.id);const studentIds=arr(s,'students').filter(x=>x.guardianUserId===u.id||(u.role==='student'&&x.id===u.studentId)).map(x=>x.id);const ownStudents=arr(s,'students').filter(x=>classIds.includes(x.classId)).map(x=>x.id);return {classIds,studentIds,ownStudents};}
function visible(s,u,type,x){if(['admin','principal','accountant'].includes(u.role))return true;const z=scope(s,u);if(u.role==='teacher'){
  if(['teachers','announcements','books','subjects','curricula','reviews','questions'].includes(type))return true;
  if(type==='classes')return z.classIds.includes(x.id);
  if(type==='students')return z.ownStudents.includes(x.id);
  if(['submissions','grades','attendance','behavior','libraryLoans'].includes(type))return z.ownStudents.includes(x.studentId);
  return z.classIds.includes(x.classId)||x.teacherUserId===u.id;
 }
 if(['student','guardian'].includes(u.role)){const ids=z.studentIds,cls=arr(s,'students').filter(t=>ids.includes(t.id)).map(t=>t.classId);if(type==='students')return ids.includes(x.id);if(['grades','attendance','submissions','behavior','libraryLoans'].includes(type))return ids.includes(x.studentId);if(type==='classes')return cls.includes(x.id);if(type==='announcements')return !x.classId||cls.includes(x.classId);if(type==='meetings')return !!x.classId&&cls.includes(x.classId);return cls.includes(x.classId);}
 return false;
}
function canWrite(s,u,type,x){if(['admin','principal'].includes(u.role))return true;if(u.role==='accountant')return ['inventory','employees','salaryPlans'].includes(type);if(u.role==='student')return type==='submissions'&&x.studentId===u.studentId;if(u.role==='teacher'){const z=scope(s,u);if(['grades','attendance','behavior','libraryLoans'].includes(type))return z.ownStudents.includes(x.studentId);return !!x.classId&&z.classIds.includes(x.classId);}return false;}
function validateData(s,type,data,existing={}){if(!data||typeof data!=='object'||Array.isArray(data))fail('بيانات النموذج غير صحيحة');const x={...existing};delete x.id;delete x.createdAt;delete x.updatedAt;for(const [k,v]of Object.entries(data)){if(!/^[a-z][\w]*$/.test(k))fail('اسم حقل غير مقبول');if(!['string','number'].includes(typeof v)&&v!==null)fail('قيمة غير صحيحة: '+k);if(typeof v==='number'&&!Number.isFinite(v))fail('قيمة رقمية غير صحيحة');x[k]=typeof v==='string'?v.trim().slice(0,LONG_TEXT.includes(k)?5000:300):v;}
 for(const k of REQUIRE[type]||[])if(x[k]===undefined||x[k]===null||x[k]==='')fail('حقل مطلوب: '+k);
 if(type==='attendance'&&!['present','absent','late','excused'].includes(x.status))fail('حالة حضور غير صحيحة');
 for(const k of ['score','amount','price','salary','maxScore','quantity'])if(x[k]!==undefined&&(!Number.isFinite(Number(x[k]))||Number(x[k])<0))fail('قيمة غير صالحة: '+k);
 return x;
}
function relations(s,type,x){for(const [field,k]of [['classId','classes'],['studentId','students'],['examId','exams'],['assignmentId','assignments'],['subjectId','subjects'],['bookId','books'],['employeeId','employees']])if(x[field]&&!lookup(s,k,x[field]))fail('السجل المرتبط غير موجود: '+field);
 if(x.guardianUserId&&!s.users.some(u=>u.id===x.guardianUserId&&u.role==='guardian'))fail('حساب ولي الأمر غير صحيح');
 if(x.teacherUserId&&!s.users.some(u=>u.id===x.teacherUserId&&['teacher','principal','admin'].includes(u.role)))fail('حساب المعلم غير صحيح');
 if(type==='grades'){const st=lookup(s,'students',x.studentId)?.data,exam=lookup(s,'exams',x.examId)?.data;if(exam?.classId&&st?.classId!==exam.classId)fail('الطالب ليس في صف الاختبار');if(Number(x.score)>Number(exam?.maxScore||100))fail('الدرجة أكبر من الدرجة النهائية');}
 if(type==='submissions'){const st=lookup(s,'students',x.studentId)?.data,a=lookup(s,'assignments',x.assignmentId)?.data;if(a?.classId&&st?.classId!==a.classId)fail('الطالب ليس في صف الواجب');if(x.score!==undefined&&Number(x.score)>Number(a?.maxScore||100))fail('الدرجة أكبر من الدرجة النهائية');}
 if(type==='attendance'&&!/^\d{4}-\d{2}-\d{2}$/.test(x.date))fail('تاريخ حضور غير صحيح');
 if(x.subjectId&&x.classId){const subject=lookup(s,'subjects',x.subjectId)?.data;if(subject?.classId&&subject.classId!==x.classId)fail('المادة لا تتبع الصف المختار');}
}
function guardDuplicates(s,type,data,id){if(['attendance','grades','submissions'].includes(type)){const match={attendance:['studentId','date'],grades:['studentId','examId'],submissions:['studentId','assignmentId']}[type];if(arr(s,type).some(x=>x.id!==id&&match.every(k=>x[k]===data[k])))fail('تم إدخال هذا السجل مسبقًا');}}
function audit(s,u,action,entity,id){s.audit.unshift({id:uid(),user_id:u.id,userName:u.name,action,entity,entity_id:id,created_at:now()});s.audit.length=Math.min(300,s.audit.length);}
const currencies=['YER','SAR','USD'];
async function hashPass(password,salt=uid()){const bytes=new TextEncoder().encode(password);const key=await crypto.subtle.importKey('raw',bytes,'PBKDF2',false,['deriveBits']);const result=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:150000,hash:'SHA-256'},key,256);return {salt,hash:Array.from(new Uint8Array(result)).map(x=>x.toString(16).padStart(2,'0')).join('')};}
const validMoney=v=>{const x=Number(v);if(!Number.isSafeInteger(x)||x<=0||x>1000000000000)fail('أدخل مبلغًا صحيحًا موجبًا');return x;};
function book(s,u,kind,ref,memo,lines){if(lines.length<2||lines.some(l=>l.debit<0||l.credit<0||l.debit&&l.credit)||lines.reduce((a,l)=>a+l.debit-l.credit,0)!==0)fail('القيد المحاسبي غير متوازن');const id=uid();s.journal.push({id,kind,ref_id:ref,memo,entry_date:now().slice(0,10),user_id:u.id,created_at:now()});for(const l of lines){if(!s.accounts.some(a=>a.code===l.code))fail('حساب مالي غير موجود');s.lines.push({journal_id:id,code:l.code,debit:l.debit,credit:l.credit});}}
function trial(s){return s.accounts.map(a=>{let debits=0,credits=0;for(const l of s.lines)if(l.code===a.code){debits+=l.debit;credits+=l.credit;}return {...a,debits,credits,debitBalance:Math.max(0,debits-credits),creditBalance:Math.max(0,credits-debits)};});}
function feeFor(s,id){const f=s.feeInvoices.find(x=>x.id===id);if(!f)fail('القسط غير موجود');return f;}
function feesFor(s,u){return s.feeInvoices.filter(x=>u.role!=='guardian'||visible(s,u,'students',{id:x.student_id}));}
function financeCanRead(u){hasRole(u,['admin','principal','accountant','guardian']);}
function financeCanWrite(u){hasRole(u,['admin','principal','accountant']);}
function snapshot(s){return {format:'alsarh.offline.v1',generatedAt:now(),organization:{...s.organization},users:s.users.map(x=>({...x})),records:s.records.map(x=>({...x})),feeInvoices:s.feeInvoices,payments:s.payments,expenses:s.expenses,accounts:s.accounts,journal:s.journal,lines:s.lines,audit:s.audit};}
function validateBackup(b){if(!b||b.format!=='alsarh.offline.v1'||!b.organization?.id||!b.organization?.name||!Array.isArray(b.users))fail('الملف ليس نسخة صالحة من الصرح التعليمي');for(const k of ['records','feeInvoices','payments','expenses','accounts','journal','lines'])if(!Array.isArray(b[k])||b[k].length>50000)fail('ملف النسخة غير مكتمل أو كبير جدًا: '+k);
 const distinct=(rows,key='id')=>rows.every(x=>typeof x[key]==='string'&&x[key].length<200)&&new Set(rows.map(x=>x[key])).size===rows.length;
 if(!distinct(b.users)||!distinct(b.records)||!distinct(b.feeInvoices)||!distinct(b.payments)||!distinct(b.expenses)||!distinct(b.journal))fail('الملف يحتوي معرّفات مكررة');
 if(b.records.some(r=>!MODEL_TYPES.includes(r.type)||typeof r.data!=='object'||!r.data||Array.isArray(r.data)))fail('الملف يحتوي سجلات غير معروفة');
 if(!b.users.some(x=>x.role==='admin'&&x.passwordHash&&x.passwordSalt))fail('النسخة لا تحتوي على حساب مدير صالح');
 const feeIds=new Set(b.feeInvoices.map(x=>x.id)),studentIds=new Set(b.records.filter(x=>x.type==='students').map(x=>x.id));
 if(b.feeInvoices.some(f=>!studentIds.has(f.student_id)||!Number.isSafeInteger(f.amount)||f.amount<=0)||b.payments.some(p=>!feeIds.has(p.fee_id)||!Number.isSafeInteger(p.amount)||p.amount<=0))fail('بيانات الأقساط غير متناسقة');
 if(b.feeInvoices.some(f=>b.payments.filter(p=>p.fee_id===f.id).reduce((n,p)=>n+p.amount,0)!==f.paid))fail('أرصدة الأقساط لا تطابق التحصيلات');
 if(b.journal.some(j=>{const lines=b.lines.filter(l=>l.journal_id===j.id);return lines.length<2||lines.reduce((n,l)=>n+Number(l.debit)-Number(l.credit),0)!==0;}))fail('الدفتر المالي غير متوازن');
 return true;
}
function demo(s,u){ensureAdmin(u);if(s.records.length||s.feeInvoices.length)fail('البيانات التجريبية متاحة فقط لمؤسسة فارغة');const make=(type,data)=>{const id=uid(),stamp=now();s.records.push({id,type,data,created_at:stamp,updated_at:stamp});return id;};
 const c1=make('classes',{name:'الصف الأول - أ',grade:'الأول',section:'أ',year:'2026/2027',status:'active'});
 const c2=make('classes',{name:'الصف الثاني - أ',grade:'الثاني',section:'أ',year:'2026/2027',status:'active'});
 const teacher=make('teachers',{name:'أحمد سالم',specialty:'الرياضيات',status:'active'});make('teachers',{name:'فاطمة حسن',specialty:'اللغة العربية',status:'active'});
 const sub=make('subjects',{name:'الرياضيات',classId:c1});const sub2=make('subjects',{name:'اللغة العربية',classId:c1});make('subjects',{name:'العلوم',classId:c2});
 const students=[['محمد عبدالله',c1],['سارة أحمد',c1],['علي خالد',c1],['رنا محمد',c2],['أحمد ناصر',c2],['ليان علي',c2]].map(([name,classId],i)=>make('students',{name,classId,code:`S-${String(i+1001)}`,guardianName:'ولي أمر تجريبي',guardianPhone:'',status:'active'}));
 make('lessons',{title:'مبادئ الجمع والطرح',classId:c1,subjectId:sub,date:now().slice(0,10),description:'درس تطبيقي تجريبي'});
 make('books',{title:'كتاب الرياضيات',classId:c1,subjectId:sub,author:'وزارة التربية والتعليم'});
 make('assignments',{title:'تدريبات الجمع',classId:c1,subjectId:sub,dueDate:now().slice(0,10),maxScore:10,status:'active'});
 const ex=make('exams',{title:'اختبار الوحدة الأولى',classId:c1,subjectId:sub2,date:now().slice(0,10),maxScore:20,status:'active'});
 for(let i=0;i<3;i++){make('grades',{studentId:students[i],examId:ex,score:16+i});make('attendance',{studentId:students[i],date:now().slice(0,10),status:i===2?'absent':'present'});}
 make('announcements',{title:'مرحبًا بكم في الصرح التعليمي',body:'هذه بيانات تجريبية للتعرف على واجهة المنظومة، وليست سجلات طلاب حقيقيين.',date:now().slice(0,10),audience:'all'});
 make('curricula',{title:'خطة الرياضيات للفصل الأول',classId:c1,subjectId:sub});make('reviews',{title:'مراجعة الجمع',classId:c1,subjectId:sub});
 const feeid=uid();s.feeInvoices.push({id:feeid,student_id:students[0],description:'قسط دراسي تجريبي',amount:120000,paid:30000,due_date:now().slice(0,10),created_at:now()});book(s,u,'fee',feeid,'قسط تجريبي',[{code:'1200',debit:120000,credit:0},{code:'4100',debit:0,credit:120000}]);
 const payid=uid();s.payments.push({id:payid,fee_id:feeid,amount:30000,method:'cash',created_at:now()});book(s,u,'payment',payid,'تحصيل تجريبي',[{code:'1100',debit:30000,credit:0},{code:'1200',debit:0,credit:30000}]);audit(s,u,'demo-seed','organization',s.organization.id);return {ok:true,students:students.length,teacher};
}
async function process(s,path,method,b){let modified=false;const set=()=>{modified=true;};const p=path.split('?')[0];const u=ownUser(s);let response;
 if(p==='/health'&&method==='GET')return {response:{ok:true,initialized:!!s.organization,offline:true,version:'0.2.0'},modified};
 if(p==='/setup'&&method==='POST'){if(s.organization)fail('تم إنشاء المؤسسة بالفعل');if(norm(b.schoolName).length<3||norm(b.name).length<2||!/^\S+@\S+\.\S+$/.test(email(b.email))||String(b.password||'').length<10)fail('أدخل بيانات مؤسسة صحيحة وكلمة مرور من 10 أحرف');const id=uid(),hash=await hashPass(String(b.password));s.organization={id:uid(),name:norm(b.schoolName),currency:currencies.includes(b.currency)?b.currency:'YER',created_at:now()};s.users=[{id,name:norm(b.name),email:email(b.email),role:'admin',passwordHash:hash.hash,passwordSalt:hash.salt,created_at:now()}];s.currentUserId=id;s.accounts=ACCOUNT_SEED.map(([code,name,category])=>({code,name,category}));set();return {response:{user:publicUser(s)},modified};}
 if(p==='/import-offline'&&method==='POST'&&!s.organization){validateBackup(b);const fresh=initial();for(const k of ['organization','users','records','feeInvoices','payments','expenses','accounts','journal','lines','audit'])fresh[k]=structuredClone(b[k]||fresh[k]);fresh.currentUserId=null;Object.assign(s,fresh);set();return {response:{ok:true,needsLogin:true},modified};}
 if(p==='/login'&&method==='POST'){const found=s.users.find(x=>x.email===email(b.email));if(!found)fail('البريد الإلكتروني أو كلمة المرور غير صحيحة');const hashed=await hashPass(String(b.password||''),found.passwordSalt);if(hashed.hash!==found.passwordHash)fail('البريد الإلكتروني أو كلمة المرور غير صحيحة');s.currentUserId=found.id;set();return {response:{user:publicUser(s)},modified};}
 if(p==='/logout'&&method==='POST'){s.currentUserId=null;set();return {response:{ok:true},modified};}
 if(p==='/me'&&method==='GET'){if(!u)fail('يجب تسجيل الدخول أولاً');return {response:{user:publicUser(s)},modified};}
 if(!u)fail('يجب تسجيل الدخول أولاً');
 if(p==='/users'&&method==='GET'){hasRole(u,['admin','principal','accountant']);response={items:s.users.map(x=>({id:x.id,name:x.name,email:x.email,role:x.role,studentId:x.studentId||null}))};}
 else if(p==='/users'&&method==='POST'){ensureAdmin(u);if(norm(b.name).length<2||!/^\S+@\S+\.\S+$/.test(email(b.email))||String(b.password||'').length<10||!ROLES.includes(b.role))fail('بيانات المستخدم غير صحيحة');if(s.users.some(x=>x.email===email(b.email)))fail('البريد مستخدم من قبل');if(b.role==='student'&&!lookup(s,'students',b.studentId))fail('اختر الطالب المرتبط بالحساب');const h=await hashPass(b.password),item={id:uid(),name:norm(b.name),email:email(b.email),role:b.role,studentId:b.role==='student'?b.studentId:null,passwordHash:h.hash,passwordSalt:h.salt,created_at:now()};s.users.push(item);audit(s,u,'create','users',item.id);set();response={item:{id:item.id,name:item.name,email:item.email,role:item.role}};}
 else if(p==='/change-password'&&method==='POST'){const h=await hashPass(String(b.currentPassword||''),u.passwordSalt);if(h.hash!==u.passwordHash)fail('كلمة المرور الحالية غير صحيحة');if(String(b.newPassword||'').length<10)fail('كلمة المرور الجديدة قصيرة');const n=await hashPass(b.newPassword);u.passwordHash=n.hash;u.passwordSalt=n.salt;s.currentUserId=null;set();response={ok:true};}
 else if(p.match(/^\/users\/[a-z0-9-]+\/password$/)&&method==='POST'){ensureAdmin(u);const target=s.users.find(x=>x.id===p.split('/')[2]);if(!target)fail('المستخدم غير موجود');if(String(b.password||'').length<10)fail('كلمة المرور قصيرة');const h=await hashPass(b.password);target.passwordHash=h.hash;target.passwordSalt=h.salt;audit(s,u,'password-reset','users',target.id);set();response={ok:true};}
 else if(p==='/demo-seed'&&method==='POST'){response=demo(s,u);set();}
 else if(p==='/export'&&method==='GET'){ensureAdmin(u);response=snapshot(s);}
 else if(p==='/import-offline'&&method==='POST'){ensureAdmin(u);validateBackup(b);if(s.records.length||s.feeInvoices.length)fail('استعادة البيانات تتطلب مؤسسة فارغة منعًا لفقد البيانات');if(s.organization.id!==b.organization.id)fail('نسخة الاستعادة تخص مؤسسة مختلفة');for(const k of ['users','records','feeInvoices','payments','expenses','accounts','journal','lines','audit'])s[k]=structuredClone(b[k]);s.currentUserId=null;set();response={ok:true,needsLogin:true};}
 else if(p==='/overview'&&method==='GET'){const counts={};for(const type of MODEL_TYPES)if(READ[u.role].includes(type))counts[type]=arr(s,type).filter(x=>visible(s,u,type,x)).length;const att=arr(s,'attendance').filter(x=>x.date===now().slice(0,10)&&visible(s,u,'attendance',x));let finance=null;if(['admin','principal','accountant','guardian'].includes(u.role)){const f=feesFor(s,u);finance={billed:f.reduce((a,x)=>a+x.amount,0),collected:f.reduce((a,x)=>a+x.paid,0),outstanding:f.reduce((a,x)=>a+x.amount-x.paid,0),expenses:u.role==='guardian'?null:s.expenses.reduce((a,x)=>a+x.amount,0)};}response={counts,attendanceToday:{present:att.filter(x=>x.status==='present').length,absent:att.filter(x=>x.status==='absent').length,late:att.filter(x=>x.status==='late').length},finance};}
 else if(p==='/audit'&&method==='GET'){ensureAdmin(u);response={items:s.audit.slice(0,200)};}
 else if(p.startsWith('/data/')){const parts=p.slice(6).split('/'),type=parts[0],id=parts[1];if(!MODEL_TYPES.includes(type))fail('القسم غير موجود');if(method==='GET'&&!id){if(!READ[u.role]?.includes(type))fail('لا تملك صلاحية العرض');response={items:arr(s,type).filter(x=>visible(s,u,type,x))};}
 else {if(!WRITE[u.role]?.includes(type))fail('لا تملك صلاحية التعديل');if(method==='POST'&&!id){const d=validateData(s,type,b.data);relations(s,type,d);guardDuplicates(s,type,d);if(!canWrite(s,u,type,d))fail('لا تملك صلاحية هذا السجل');const item={id:uid(),type,data:d,created_at:now(),updated_at:now()};s.records.push(item);audit(s,u,'create',type,item.id);set();response={item:{id:item.id,...item.data,createdAt:item.created_at,updatedAt:item.updated_at}};}
 else if(method==='PATCH'&&id){const rec=lookup(s,type,id);if(!rec)fail('السجل غير موجود');if(!canWrite(s,u,type,{id,...rec.data}))fail('لا تملك الصلاحية');const d=validateData(s,type,b.data,rec.data);relations(s,type,d);guardDuplicates(s,type,d,id);if(!canWrite(s,u,type,{id,...d}))fail('صلاحية غير كافية');rec.data=d;rec.updated_at=now();audit(s,u,'update',type,id);set();response={item:{id,...d}};}
 else if(method==='DELETE'&&id){const rec=lookup(s,type,id);if(!rec)fail('السجل غير موجود');if(!canWrite(s,u,type,{id,...rec.data}))fail('لا تملك الصلاحية');if(['students','classes','exams','subjects','assignments','books','employees'].includes(type))fail('الحماية تمنع حذف سجل مرتبط؛ غيّر حالته بدلًا من ذلك');s.records=s.records.filter(x=>x!==rec);audit(s,u,'delete',type,id);set();response={ok:true};}else fail('العملية غير مدعومة');}}
 else if(p.startsWith('/finance/')){const what=p.slice('/finance/'.length);if(method==='GET'){
 if(what==='fees'){financeCanRead(u);response={items:feesFor(s,u).map(x=>({...x,studentName:lookup(s,'students',x.student_id)?.data.name||'طالب غير معروف'})).reverse()};}
 else if(what==='payments'){financeCanRead(u);const fees=feesFor(s,u).map(f=>f.id);response={items:s.payments.filter(x=>fees.includes(x.fee_id)).slice().reverse()};}
 else if(what==='expenses'){financeCanWrite(u);response={items:s.expenses.slice().reverse()};}
 else if(what==='trial-balance'){financeCanWrite(u);const rows=trial(s);response={items:rows,balanced:rows.reduce((n,l)=>n+l.debits-l.credits,0)===0};}else fail('المسار غير موجود');}
 else if(method==='POST'){financeCanWrite(u);const key=norm(b.idempotencyKey).slice(0,80);if(key&&s.idempotency[key]){response=structuredClone(s.idempotency[key]);}
 else if(what==='fees'){const student=lookup(s,'students',b.studentId);if(!student)fail('الطالب غير موجود');const amount=validMoney(b.amount),description=norm(b.description)||'رسوم دراسية',id=uid(),created_at=now();const x={id,student_id:student.id,description,amount,paid:0,due_date:norm(b.dueDate)||null,created_at};s.feeInvoices.push(x);book(s,u,'fee',id,description,[{code:'1200',debit:amount,credit:0},{code:'4100',debit:0,credit:amount}]);audit(s,u,'create','fee',id);response={item:{...x,studentName:student.data.name}};set();}
 else if(what==='payments'){const f=feeFor(s,b.feeId),amount=validMoney(b.amount);if(f.paid+amount>f.amount)fail('المبلغ أكبر من المتبقي على الطالب');const method=['cash','bank'].includes(b.method)?b.method:'cash',id=uid(),created_at=now();const x={id,fee_id:f.id,amount,method,created_at};s.payments.push(x);f.paid+=amount;book(s,u,'payment',id,'سداد رسوم دراسية',[{code:method==='cash'?'1100':'1110',debit:amount,credit:0},{code:'1200',debit:0,credit:amount}]);audit(s,u,'create','payment',id);response={item:x};set();}
 else if(what==='expenses'){const amount=validMoney(b.amount),method=['cash','bank'].includes(b.method)?b.method:'cash',category=norm(b.category)||'عام',description=norm(b.description)||category,id=uid(),created_at=now();const x={id,category,description,amount,method,created_at};s.expenses.push(x);book(s,u,'expense',id,description,[{code:'5100',debit:amount,credit:0},{code:method==='cash'?'1100':'1110',debit:0,credit:amount}]);audit(s,u,'create','expense',id);set();response={item:x};} else fail('المسار غير موجود');
 if(key&&modified)s.idempotency[key]=structuredClone(response);}
 else fail('العملية غير مدعومة');}
 else fail('المسار غير موجود');
 return {response,modified};
}
window.ALSARH_LOCAL_API=async(path,options={})=>serialize(async()=>{const s=await load();const b=options.body?JSON.parse(options.body):{},method=options.method||'GET';const {response,modified}=await process(s,path,method,b);if(modified)await save(s);return structuredClone(response);});
window.ALSARH_LOCAL_INFO={mode:'offline',store:DBNAME,format:'alsarh.offline.v1'};
})();
