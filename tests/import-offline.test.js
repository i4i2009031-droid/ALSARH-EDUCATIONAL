'use strict';
const {before,after,test}=require('node:test');
const assert=require('node:assert/strict');
const os=require('node:os'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto');
const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'alsarh-migration-'));
process.env.DATA_DIR=dataDir;
const {server,db}=require('../server/index.js');
let base,cookie;
const makeId=()=>crypto.randomUUID();
const call=async (route,method='GET',payload,cookieOverride=cookie)=>{
 const r=await fetch(base+'/api'+route,{method,headers:{...(payload?{'Content-Type':'application/json'}:{}),...(cookieOverride?{Cookie:cookieOverride}:{})},body:payload?JSON.stringify(payload):undefined});
 return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
};
before(async()=>{await new Promise(ok=>server.listen(0,'127.0.0.1',ok));base='http://127.0.0.1:'+server.address().port;});
after(async()=>{await new Promise(ok=>server.close(ok));db.close();fs.rmSync(dataDir,{force:true,recursive:true});});
test('fresh Hostinger server imports offline academic records and balanced fees; admins can reset migrated credentials',async()=>{
 const oldAdmin=makeId(),schoolId=makeId(),teacherId=makeId(),parentId=makeId(),cl=makeId(),st=makeId(),sj=makeId(),feeId=makeId(),pmtId=makeId(),jFee=makeId(),jPmt=makeId();
 const stamp='2026-10-25T11:00:00.000Z',roles=[
  {id:oldAdmin,name:'مدير محلي',email:'oldadmin@example.com',role:'admin',passwordHash:'hashed',passwordSalt:'salt'},
  {id:teacherId,name:'معلم الصف',email:'teacher@example.com',role:'teacher',passwordHash:'hashed',passwordSalt:'salt'},
  {id:parentId,name:'ولي الطالب',email:'guardian@example.com',role:'guardian',passwordHash:'hashed',passwordSalt:'salt'},
 ];
 const rec=(id,type,data)=>({id,type,data,created_at:stamp,updated_at:stamp});
 const backup={format:'alsarh.offline.v1',organization:{id:schoolId,name:'مدرسة تجريبية',currency:'YER'},users:roles,
  records:[rec(cl,'classes',{name:'الأول',teacherUserId:teacherId}),rec(st,'students',{name:'محمد علي',classId:cl,guardianUserId:parentId}),rec(sj,'subjects',{name:'الرياضيات',classId:cl})],
  feeInvoices:[{id:feeId,student_id:st,amount:1000,paid:250,description:'قسط أكتوبر',created_at:stamp,due_date:'2026-10-25'}],payments:[{id:pmtId,fee_id:feeId,amount:250,method:'cash',created_at:stamp}],expenses:[],accounts:[],
  journal:[{id:jFee,kind:'fee',ref_id:feeId,memo:'قسط',entry_date:'2026-10-25',user_id:oldAdmin,created_at:stamp},{id:jPmt,kind:'payment',ref_id:pmtId,memo:'سداد',entry_date:'2026-10-25',user_id:oldAdmin,created_at:stamp}],
  lines:[{journal_id:jFee,code:'1200',debit:1000,credit:0},{journal_id:jFee,code:'4100',debit:0,credit:1000},{journal_id:jPmt,code:'1100',debit:250,credit:0},{journal_id:jPmt,code:'1200',debit:0,credit:250}],audit:[]};
 let r=await call('/setup','POST',{schoolName:'مدرسة تجريبية',name:'مدير خادم هوستنجر',email:'admin@server.example',password:'NewPassword2026!'});assert.equal(r.status,201);cookie=r.cookie;
 const fake=structuredClone(backup);fake.lines[0].credit=1;
 r=await call('/import-offline','POST',fake);assert.equal(r.status,400); // atomic rollback
 assert.equal((await call('/data/students')).body.items.length,0);
 r=await call('/import-offline','POST',backup);assert.equal(r.status,201,JSON.stringify(r.body));assert.equal(r.body.imported.records,3);
 r=await call('/import-offline','POST',backup);assert.equal(r.status,409);
 r=await call('/finance/trial-balance');assert.equal(r.body.balanced,true);
 assert.equal(r.body.items.find(a=>a.code==='1200').debitBalance,750);
 r=await call('/finance/fees');assert.equal(r.body.items[0].paid,250);
 r=await call('/data/students');assert.equal(r.body.items[0].guardianUserId,parentId);
 r=await call('/users/'+teacherId+'/password','POST',{password:'TeacherNewPass2026!'});assert.equal(r.status,200,JSON.stringify(r.body));
 r=await call('/login','POST',{email:'teacher@example.com',password:'TeacherNewPass2026!'});assert.equal(r.status,200);
 const teacherCookie=r.cookie;
 r=await call('/data/students','GET',undefined,teacherCookie);assert.equal(r.body.items.length,1);
 r=await call('/finance/fees','GET',undefined,teacherCookie);assert.equal(r.status,403);
});
