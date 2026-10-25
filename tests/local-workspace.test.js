'use strict';
// Run the actual bundled offline API in an isolated browser-like VM, with an
// asynchronous IndexedDB mock. No external packages, network or server needed.
const { test } = require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const { webcrypto }=require('node:crypto');

function environment(){
 const content=new Map();
 function asyncRequest(value){const req={result:undefined};queueMicrotask(()=>{req.result=value();req.onsuccess?.({target:req});});return req;}
 const db={objectStoreNames:{contains:()=>true},createObjectStore:()=>{},transaction(name,mode){const tx={oncomplete:null,onerror:null,onabort:null,objectStore(){return {get(key){return asyncRequest(()=>content.get(key));},put(value,key){content.set(key,structuredClone(value));queueMicrotask(()=>tx.oncomplete?.());}};}};return tx;}};
 const indexedDB={open(){return asyncRequest(()=>db);}};
 const window={}, location={hostname:'appassets.androidplatform.net',protocol:'https:',search:''};
 const context=vm.createContext({window,location,indexedDB,crypto:webcrypto,TextEncoder,queueMicrotask,structuredClone,console,URLSearchParams,Date,Promise,Map,Set,Number,Array,String,Object,Error});
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../web/offline.js'),'utf8'),context,{filename:'web/offline.js'});
 return window.ALSARH_LOCAL_API;
}

test('offline workspace: setup -> school -> grade -> payment -> persistence -> restore',async()=>{
 const local=environment(),call=(p,b,method='POST')=>local(p,{method,body:JSON.stringify(b)}),read=p=>local(p);
 assert.equal((await read('/health')).initialized,false);
 await call('/setup',{schoolName:'الصرح التجريبي',name:'مدير النظام',email:'admin@example.com',password:'TestingOffline2026!',currency:'YER'});
 assert.equal((await read('/me')).user.role,'admin');
 const cl=(await call('/data/classes',{data:{name:'الأول - أ'}})).item.id;
 const st=(await call('/data/students',{data:{name:'طالب تجريبي',classId:cl}})).item.id;
 const sj=(await call('/data/subjects',{data:{name:'الرياضيات',classId:cl}})).item.id;
 const e=(await call('/data/exams',{data:{title:'الاختبار الأول',classId:cl,subjectId:sj,maxScore:20}})).item.id;
 await assert.rejects(call('/data/grades',{data:{studentId:st,examId:e,score:21}}),/الدرجة أكبر/);
 await call('/data/grades',{data:{studentId:st,examId:e,score:18}});
 await assert.rejects(call('/data/grades',{data:{studentId:st,examId:e,score:16}}),/مسبقًا/);
 await call('/data/attendance',{data:{studentId:st,date:'2026-10-25',status:'present'}});
 await assert.rejects(call('/data/attendance',{data:{studentId:st,date:'2026-10-25',status:'absent'}}),/مسبقًا/);
 const invoice=(await call('/finance/fees',{studentId:st,amount:25000,description:'قسط أكتوبر',idempotencyKey:'inv-test-001'})).item.id;
 await call('/finance/payments',{feeId:invoice,amount:10000,method:'cash',idempotencyKey:'pay-test-001'});
 await assert.rejects(call('/finance/payments',{feeId:invoice,amount:18000,method:'cash'}),/أكبر من المتبقي/);
 await call('/finance/expenses',{category:'كهرباء',amount:2000,method:'cash',idempotencyKey:'exp-test-001'});
 const overview=await read('/overview');assert.equal(overview.finance.outstanding,15000);assert.equal(overview.finance.expenses,2000);
 const trial=await read('/finance/trial-balance');assert.equal(trial.balanced,true);assert.equal(trial.items.find(x=>x.code==='1100').debitBalance,8000);
 const snap=await read('/export');assert.equal(snap.format,'alsarh.offline.v1');assert.equal(snap.journal.length,3);assert.equal(snap.records.length,6);
 await call('/logout',{});assert.equal((await read('/health')).initialized,true);
 await assert.rejects(read('/me'),/الدخول/);
 await call('/login',{email:'admin@example.com',password:'TestingOffline2026!'});
 assert.equal((await read('/data/students')).items.length,1);
 await assert.rejects(call('/import-offline',snap),/فارغة/);
 assert.equal((await read('/finance/trial-balance')).balanced,true);
});

test('offline demo dataset is explicit, non-repeating, and builds balanced journal',async()=>{
 const local=environment(),call=(p,b,method='POST')=>local(p,{method,body:JSON.stringify(b)}),read=p=>local(p);
 await call('/setup',{schoolName:'الصرح التجريبي',name:'مدير',email:'a@school.com',password:'TestingOffline2026!'});
 await call('/demo-seed',{});
 const overview=await read('/overview');assert.equal(overview.counts.students,6);assert.equal(overview.counts.teachers,2);assert.equal(overview.finance.collected,30000);
 assert.equal((await read('/finance/trial-balance')).balanced,true);
 await assert.rejects(call('/demo-seed',{}),/فارغة/);
});
