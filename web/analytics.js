/* ALSARH — lightweight analytics, calculated exclusively from permission-filtered records. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ALSARH_ANALYTICS = api;
})(typeof window !== 'undefined' ? window : undefined, function () {
  'use strict';
  const number = value => Number.isFinite(Number(value)) ? Number(value) : NaN;
  const average = values => values.length ? values.reduce((a,b) => a+b,0)/values.length : null;
  const round = n => n == null ? null : Math.round(n*10)/10;
  const withinPeriod = (date, days, nowMs) => {
    if (days === 'all') return true;
    if (!date) return false;
    const stamp = Date.parse(String(date));
    const count = Number(days);
    return Number.isFinite(stamp) && stamp <= nowMs + 86400000 && stamp >= nowMs - count*86400000;
  };
  function grades(cache={}, opts={}) {
    const students = new Map((cache.students||[]).map(s=>[s.id,s]));
    const exams = new Map((cache.exams||[]).map(s=>[s.id,s]));
    const subjects = new Map((cache.subjects||[]).map(s=>[s.id,s]));
    const nowMs = opts.nowMs || Date.now(), cls=opts.classId || 'all', period=opts.period || 'all';
    const records = (cache.grades||[]).flatMap(g=>{
      const student=students.get(g.studentId), exam=exams.get(g.examId);
      // The requester must be allowed to see both the student and their exam.
      if(!student || !exam || (cls!=='all' && cls!==student.classId))return [];
      if(!withinPeriod(exam.date||g.createdAt,period,nowMs))return [];
      const max=number(exam.maxScore), score=number(g.score);
      const full=Number.isFinite(max)&&max>0?max:100;
      if(!Number.isFinite(score)||score<0||score>full)return [];
      return [{studentId:student.id,studentName:student.name,classId:student.classId||'',
        subjectId:exam.subjectId||'',subject:subjects.get(exam.subjectId)?.name||'مادة غير محددة',
        exam:exam.title||'اختبار',date:exam.date||g.createdAt||'',score,full,pct:100*score/full}];
    });
    const groupBy=(getKey,getLabel)=>{
      const groups=new Map();
      for(const item of records){const key=getKey(item);if(!groups.has(key))groups.set(key,{key,label:getLabel(item),values:[]});groups.get(key).values.push(item.pct);}
      return [...groups.values()].map(g=>({key:g.key,label:g.label,count:g.values.length,average:round(average(g.values))})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'ar'));
    };
    const classes=new Map((cache.classes||[]).map(c=>[c.id,c]));
    const values=records.map(x=>x.pct), avg=average(values);
    return {count:records.length,average:round(avg),highest:values.length?round(Math.max(...values)):null,
      lowest:values.length?round(Math.min(...values)):null,
      needsSupport:records.filter(x=>x.pct<60).length,
      rows:records,
      subjects:groupBy(x=>x.subjectId,x=>x.subject),
      students:groupBy(x=>x.studentId,x=>x.studentName),
      classes:groupBy(x=>x.classId,x=>classes.get(x.classId)?.name||'صف غير محدد')};
  }
  function behavior(cache={}, opts={}){
    const students=new Map((cache.students||[]).map(s=>[s.id,s]));
    const classes=new Map((cache.classes||[]).map(c=>[c.id,c]));
    const cls=opts.classId||'all',period=opts.period||'all',nowMs=opts.nowMs||Date.now();
    const rows=(cache.behavior||[]).flatMap(b=>{
      const s=students.get(b.studentId);if(!s||(cls!=='all'&&s.classId!==cls)||!withinPeriod(b.date||b.createdAt,period,nowMs))return [];
      return [{...b,classId:s.classId,studentName:s.name,kind:['positive','negative'].includes(b.kind)?b.kind:'neutral'}];
    });
    const positive=rows.filter(x=>x.kind==='positive').length;
    const negative=rows.filter(x=>x.kind==='negative').length;
    const neutral=rows.length-positive-negative;
    const group=new Map();
    for(const row of rows){if(!group.has(row.classId))group.set(row.classId,{id:row.classId,name:classes.get(row.classId)?.name||'صف غير محدد',positive:0,negative:0,neutral:0});group.get(row.classId)[row.kind]++;}
    return {count:rows.length,positive,negative,neutral,rows,
      classes:[...group.values()].sort((a,b)=>(b.positive+b.negative+b.neutral)-(a.positive+a.negative+a.neutral))};
  }
  return {grades,behavior,withinPeriod};
});
