'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'../web');
const {grades,behavior,withinPeriod}=require('../web/analytics.js');
const makeCache=()=>({
 classes:[{id:'A',name:'أول أ'},{id:'B',name:'ثاني ب'}],
 students:[{id:'s1',name:'طالب ١',classId:'A'},{id:'s2',name:'طالب ٢',classId:'A'},{id:'s3',name:'طالب ٣',classId:'B'}],
 subjects:[{id:'math',name:'رياضيات'}],
 exams:[{id:'e1',title:'اختبار أول',subjectId:'math',date:'2026-10-20',maxScore:20},{id:'e2',title:'اختبار ثانٍ',subjectId:'math',date:'2026-10-22',maxScore:40}],
 grades:[{studentId:'s1',examId:'e1',score:18},{studentId:'s2',examId:'e1',score:10},{studentId:'s3',examId:'e2',score:20}],
 behavior:[{studentId:'s1',date:'2026-10-20',kind:'positive',description:'تعاون'},{studentId:'s2',date:'2026-10-20',kind:'negative',description:'تأخر'},{studentId:'s3',date:'2026-10-20',description:'ملاحظة قديمة'}]
});

test('grades calculate weighted percentages per exam maximum without mixing points',()=>{
 const r=grades(makeCache());
 assert.equal(r.count,3);
 assert.equal(r.average,63.3);
 assert.equal(r.highest,90);
 assert.equal(r.needsSupport,2);
 assert.equal(r.subjects[0].average,63.3);
 const a=grades(makeCache(),{classId:'A'});
 assert.equal(a.count,2);assert.equal(a.average,70);
});

test('grade and behavior analytics use only permission-scoped records and exclude unknown students',()=>{
 const cache=makeCache();cache.students=cache.students.filter(x=>x.id==='s1');
 assert.equal(grades(cache).count,1);
 assert.equal(behavior(cache).count,1);
 assert.equal(behavior(cache).positive,1);
 const b=behavior(makeCache());
 assert.equal(b.neutral,1);assert.equal(b.negative,1);assert.equal(b.positive,1);
});

test('date windows are explicit, stable, and exclude unknown dates',()=>{
 const c=makeCache(),nowMs=Date.parse('2026-10-25T12:00:00Z');
 assert.equal(grades(c,{period:'30',nowMs}).count,3);
 assert.equal(grades(c,{period:'2',nowMs}).count,0);
 assert.equal(withinPeriod(null,'30',nowMs),false);
});

test('layout reserves native Android system insets and mobile web safe areas',()=>{
 const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
 const java=fs.readFileSync(path.join(__dirname,'../android/app/src/main/java/com/alsarh/educational/MainActivity.java'),'utf8');
 assert.match(css,/safe-area-inset-top/);assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/100dvh/);assert.match(css,/bottom-nav.*safe-bottom/s);
 assert.match(css,/sheet-overlay.*safe-top/s);
 assert.match(java,/WindowInsets\.Type\.systemBars/);assert.match(java,/WindowInsets\.Type\.displayCutout/);
 assert.match(java,/WindowInsets\.Type\.ime/);assert.match(java,/Math\.max\(bars\.bottom, keyboard\.bottom\)/);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/analytics\.js/);
});
