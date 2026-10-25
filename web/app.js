const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
const e = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t = v => String(v??'').trim();
const fm = (v)=>Number(v||0).toLocaleString('ar-YE');
const date = v => v?new Date(v).toLocaleDateString('ar-YE'):'—';
const today = ()=>new Date().toISOString().slice(0,10);
const names={admin:'مدير النظام',principal:'مدير المدرسة',accountant:'المحاسب',teacher:'المعلم',guardian:'ولي الأمر',student:'الطالب'};
const icons={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
 users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 school:'<path d="M4 21V8l8-5 8 5v13M9 21v-8h6v8M2 21h20M9 9h.01M15 9h.01"/>',
 cap:'<path d="m2 10 10-6 10 6-10 6Z"/><path d="M6 12v5c3 3 9 3 12 0v-5M22 10v7"/>',
 teacher:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M9 21h6M12 17v4M7 9h10M7 12h7"/>',
 guardian:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2M12 2v1"/>',
 book:'<path d="M12 7c-3-3-7-3-10-2v14c4-1 8-1 10 2 2-3 6-3 10-2V5c-3-1-7-1-10 2v14"/>',
 check:'<rect x="5" y="3" width="14" height="19" rx="2"/><path d="M9 3v3h6V3M9 14l2 2 4-4"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h.01M13 15h.01"/>',
 wallet:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M16 12h5M3 9h18M7 5V3h11"/>',
 calculator:'<rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4" rx="1"/><path d="M8 13h1M15 13h1M8 17h1M15 17h1"/>',
 chart:'<path d="M4 21V9M10 21V3M16 21v-7M22 21v-11M2 21h22"/>',
 inventory:'<path d="m3 7 9-4 9 4-9 4Z M3 7v10l9 4 9-4V7M12 11v10"/>',
 report:'<path d="M5 3h11l4 4v14H5Z M16 3v5h4M9 17v-4M12 17v-7M15 17v-3"/>',
 exam:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h3M15 15l1 1 2-2"/>',
 clipboard:'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 2h6v4H9ZM9 12h6M9 16h4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13a7 7 0 0 0 0-2l2-2-2-3-3 1a7 7 0 0 0-2-1l-1-3h-4L8 6a7 7 0 0 0-2 1L3 6 1 9l2 2a7 7 0 0 0 0 2l-2 2 2 3 3-1a7 7 0 0 0 2 1l1 3h4l1-3a7 7 0 0 0 2-1l3 1 2-3Z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 edit:'<path d="m4 20 4-.8L20 7l-3-3L5 16Z M14 7l3 3"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
 close:'<path d="M5 5 19 19M19 5 5 19"/>',
 exit:'<path d="M10 17l5-5-5-5M15 12H3M12 3h8v18h-8"/>',
 arrow:'<path d="m15 18-6-6 6-6"/>',
 download:'<path d="M12 3v13m0 0 5-5m-5 5-5-5M4 19h16"/>',
 printer:'<path d="M6 9V3h12v6M6 18H4V9h16v9h-2M6 14h12v7H6Z"/>',
 shield:'<path d="m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6Z M9 12l2 2 4-4"/>',
 money:'<circle cx="12" cy="12" r="9"/><path d="M15 9c-1-2-6-2-6 1s6 1 6 4-5 3-6 1M12 6v12"/>',
 note:'<path d="M4 3h16v18H4Z M8 8h8M8 12h8M8 16h5"/>',
 logout:'<path d="M9 3H4v18h5M12 8l4 4-4 4m4-4H7"/>',
 more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
 link:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
};
const ic = (name,cl='')=>`<svg class="icon ${cl}" viewBox="0 0 24 24" aria-hidden="true">${icons[name]||icons.note}</svg>`;
const logo = (cls='')=>`<img class="brand-logo ${cls}" src="${window.ALSARH_LOCAL_MODE?'logo.svg':'/logo.svg'}" alt="شعار الصرح التعليمي">`;
const LOCAL=!!window.ALSARH_LOCAL_MODE;
const modules={
 students:{title:'الطلاب',icon:'cap',color:'t-purple',sub:'السجلات الأكاديمية وبيانات أولياء الأمور',fields:['name','code','classId','guardianName','guardianPhone','guardianUserId','birthDate','status','notes'],primary:'name'},
 teachers:{title:'المعلمون والمعلمات',icon:'teacher',color:'t-blue',sub:'ملفات الكادر التعليمي وتخصصاته',fields:['name','specialty','phone','email','userId','status'],primary:'name'},
 classes:{title:'الصفوف والشعب',icon:'school',color:'t-green',sub:'تنظيم المراحل والفصول الدراسية',fields:['name','grade','section','room','year','teacherUserId','status'],primary:'name'},
 subjects:{title:'المواد الدراسية',icon:'book',color:'t-rose',sub:'مقررات المدرسة وربط المواد بالصفوف',fields:['name','code','classId','teacherUserId','description'],primary:'name'},
 lessons:{title:'الدروس والتحضير',icon:'book',color:'t-pink',sub:'خطط الدروس والشروحات وروابط المراجع',fields:['title','classId','subjectId','teacherUserId','date','description','url','status'],primary:'title'},
 books:{title:'الكتب والمكتبة',icon:'book',color:'t-orange',sub:'كتب ومراجع رقمية لكل صف ومادة',fields:['title','author','classId','subjectId','url','description'],primary:'title'},
 assignments:{title:'الواجبات',icon:'clipboard',color:'t-cyan',sub:'التكاليف ومواعيد التسليم والتقييم',fields:['title','classId','subjectId','teacherUserId','dueDate','instructions','maxScore','status'],primary:'title'},
 submissions:{title:'تسليم الواجبات',icon:'check',color:'t-mint',sub:'إجابات الطلبة وملاحظات التصحيح',fields:['assignmentId','studentId','answer','url','score','feedback'],primary:'assignmentId'},
 exams:{title:'الاختبارات',icon:'exam',color:'t-yellow',sub:'إدارة الاختبارات ومواعيدها ودرجاتها',fields:['title','classId','subjectId','date','maxScore','status'],primary:'title'},
 grades:{title:'الدرجات والتقييم',icon:'report',color:'t-indigo',sub:'رصد درجات الطلاب بعد الاختبارات',fields:['studentId','examId','score','notes'],primary:'studentId'},
 attendance:{title:'الحضور والغياب',icon:'calendar',color:'t-green',sub:'متابعة حالة حضور الطلبة يوميًا',fields:['studentId','date','status','notes'],primary:'studentId'},
 schedule:{title:'الجدول الدراسي',icon:'clock',color:'t-purple',sub:'مواعيد المواد والحصص وقاعات الدراسة',fields:['classId','subjectId','teacherUserId','day','startTime','endTime','room'],primary:'classId'},
 announcements:{title:'الإعلانات والتعاميم',icon:'bell',color:'t-rose',sub:'إعلانات المدرسة لجميع المستخدمين',fields:['title','body','classId','date','audience'],primary:'title'},
 inventory:{title:'المخزون والمستلزمات',icon:'inventory',color:'t-cyan',sub:'الكتب والزي والمواد والموجودات',fields:['name','sku','quantity','unit','price','notes'],primary:'name'},
 employees:{title:'الموظفون والرواتب',icon:'users',color:'t-slate',sub:'سجل الموظفين والرواتب الأساسية',fields:['name','jobTitle','phone','salary','status','notes'],primary:'name'},
 curricula:{title:'المناهج والخطط',icon:'book',color:'t-blue',sub:'توزيع المناهج على الصفوف والمواد',fields:['title','classId','subjectId','year','description','status'],primary:'title'},
 reviews:{title:'المراجعات الدراسية',icon:'check',color:'t-mint',sub:'مراجعات واختبارات قصيرة وروابط شرح',fields:['title','classId','subjectId','date','description','url','status'],primary:'title'},
 questions:{title:'بنك الأسئلة',icon:'exam',color:'t-indigo',sub:'أسئلة وتصنيفها بحسب المادة والصف',fields:['question','classId','subjectId','options','solution','maxScore','difficulty','status'],primary:'question'},
 transport:{title:'النقل المدرسي',icon:'school',color:'t-cyan',sub:'الحافلات والمسارات والسائقون',fields:['name','driverName','phone','capacity','route','status'],primary:'name'},
 meetings:{title:'الاجتماعات',icon:'calendar',color:'t-orange',sub:'اللقاءات مع أولياء الأمور والكادر',fields:['title','classId','date','startTime','location','description','audience'],primary:'title'},
 behavior:{title:'السلوك والانضباط',icon:'shield',color:'t-rose',sub:'سجل الملاحظات والتوجيه الطلابي',fields:['studentId','date','description','action','status'],primary:'studentId'},
 libraryLoans:{title:'إعارة الكتب',icon:'book',color:'t-purple',sub:'تسجيل الكتب المستعارة وإعادتها',fields:['studentId','bookId','date','dueDate','status','notes'],primary:'studentId'},
 salaryPlans:{title:'خطط الرواتب',icon:'wallet',color:'t-yellow',sub:'تخطيط رواتب الموظفين (غير مرحّلة محاسبيًا)',fields:['employeeId','amount','startDate','status','notes'],primary:'employeeId'},
};
const fields={
 name:['الاسم','text',true],code:['الرقم / الرمز','text'],classId:['الصف','select:classes'],guardianName:['اسم ولي الأمر','text'],guardianPhone:['رقم ولي الأمر','tel'],guardianUserId:['حساب ولي الأمر','users:guardian'],birthDate:['تاريخ الميلاد','date'],status:['الحالة','select:status'],notes:['ملاحظات','textarea'],
 specialty:['التخصص','text'],phone:['رقم الهاتف','tel'],email:['البريد الإلكتروني','email'],userId:['الحساب المرتبط','users:teacher'],grade:['المرحلة','text'],section:['الشعبة','text'],room:['القاعة','text'],year:['العام الدراسي','text'],teacherUserId:['المعلم المسؤول','users:teacher'],
 description:['الوصف','textarea'],subjectId:['المادة','select:subjects'],title:['العنوان','text',true],date:['التاريخ','date'],url:['رابط المادة / الملف','url'],dueDate:['آخر موعد','date'],instructions:['التعليمات','textarea'],maxScore:['الدرجة النهائية','number'],
 assignmentId:['الواجب','select:assignments'],studentId:['الطالب','select:students'],answer:['إجابة الطالب','textarea'],score:['الدرجة','number'],feedback:['ملاحظات التصحيح','textarea'],
 day:['اليوم','select:days'],startTime:['بداية الحصة','time'],endTime:['نهاية الحصة','time'],body:['التعميم','textarea'],audience:['الفئة المستهدفة','select:audience'],author:['المؤلف','text'],
 sku:['رمز الصنف','text'],quantity:['الكمية','number'],unit:['الوحدة','text'],price:['سعر الوحدة','number'],jobTitle:['الوظيفة','text'],salary:['الراتب','number'],
 amount:['المبلغ','number',true],feeId:['فاتورة القسط','select:fees',true],method:['طريقة الدفع','select:method'],category:['التصنيف','text'],due_date:['تاريخ الاستحقاق','date'],password:['كلمة المرور','password',true],role:['الصلاحية','select:roles',true],schoolName:['اسم المؤسسة','text',true], currency:['العملة','select:currency'],question:['نص السؤال','textarea',true],options:['الخيارات','textarea'],solution:['الحل المقترح','textarea'],difficulty:['المستوى','select:difficulty'],driverName:['اسم السائق','text'],capacity:['السعة','number'],route:['المسار','text'],location:['المكان','text'],action:['الإجراء المتخذ','textarea'],bookId:['الكتاب','select:books'],employeeId:['الموظف','select:employees'],startDate:['تاريخ البداية','date']
};
const palette=['t-rose','t-blue','t-green','t-orange','t-purple','t-cyan','t-yellow','t-indigo','t-mint','t-pink','t-slate','t-teal'];
const labels={present:'حاضر',absent:'غائب',late:'متأخر',excused:'بعذر',active:'نشط',inactive:'موقوف',cash:'نقدًا',bank:'البنك'};
const options={status:[['active','نشط'],['inactive','موقوف'],['present','حاضر'],['absent','غائب'],['late','متأخر'],['excused','بعذر']],days:[['الأحد','الأحد'],['الإثنين','الإثنين'],['الثلاثاء','الثلاثاء'],['الأربعاء','الأربعاء'],['الخميس','الخميس'],['الجمعة','الجمعة'],['السبت','السبت']],audience:[['all','الجميع'],['teachers','المعلمون'],['parents','أولياء الأمور'],['students','الطلاب']],method:[['cash','نقدي'],['bank','بنك']],roles:[['admin','مدير النظام'],['principal','مدير المدرسة'],['accountant','محاسب'],['teacher','معلم / معلمة'],['guardian','ولي أمر'],['student','طالب']],currency:[['YER','ريال يمني'],['SAR','ريال سعودي'],['USD','دولار أمريكي']],difficulty:[['easy','سهل'],['medium','متوسط'],['hard','متقدم']]};
const navItems=[['home','الرئيسية','home'],['students','الطلاب','cap'],['teachers','المعلمون','teacher'],['lessons','الدروس','book'],['assignments','الواجبات','clipboard'],['finance','الحسابات','calculator'],['reports','التقارير','chart'],['users','المستخدمون','users'],['settings','الإعدادات','settings']];
let state={user:null,page:'home',cache:{},users:[],overview:{counts:{}},search:'',sheet:null,financeTab:'fees',loading:false,first:false};
let toastTimer=0;
function toast(message,bad=false){const x=$('#toast');x.textContent=message;x.className='visible'+(bad?' bad':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.className='',3500);}
async function api(path,opts={}){
  if(LOCAL)return window.ALSARH_LOCAL_API(path,opts);
  const res=await fetch('/api'+path,{credentials:'same-origin',...opts,headers:{...(opts.body?{'Content-Type':'application/json'}:{}),...(opts.headers||{})}});
  const obj=await res.json().catch(()=>({error:'فشل الاتصال بالخادم'}));
  if(!res.ok)throw new Error(obj.error||`حدث خطأ (${res.status})`);return obj;
}
function post(path,obj,method='POST'){return api(path,{method,body:JSON.stringify(obj)});}
async function initialize(){
  try {const h=await api('/health');if(!h.initialized){state.first=true;renderAuth();return;}
    const r=await api('/me').catch(()=>null);if(!r){renderAuth();return;}state.user=r.user;await refresh();}
  catch(err){$('#root').innerHTML=`<div class="login-form-side"><div class="login-panel"><h2>تعذر الاتصال بالخادم</h2><p>${e(err.message)}</p><button class="primary-btn" data-action="reload">إعادة المحاولة</button></div></div>`;}
}
function renderAuth(){
 $('#root').innerHTML=`<div class="login-shell"><div class="login-aside">${logo()}<h1>الصرح التعليمي</h1><p>المنظومة المتكاملة للتعليم والإدارة والحسابات</p><span class="small-tag">ALSARH EDUCATIONAL SYSTEM</span></div>
 <div class="login-form-side"><div class="login-panel"><div class="logo-login-mobile">${logo()}</div><div class="eyebrow">ALSARH EDUCATIONAL SYSTEM</div>
 <h2>${state.first?'تهيئة مؤسسة جديدة':'مرحبًا بعودتك'}</h2><p>${state.first?'أنشئ حساب المدير الأول لضبط المدرسة وربط جميع الأقسام.':'سجّل دخولك للوصول إلى مدرستك وبياناتك بصلاحيات آمنة.'}</p>
 <form id="auth-form" class="stack">${state.first?`${fieldHTML('schoolName',{required:true})}${fieldHTML('name',{required:true,customLabel:'اسم مدير النظام'})}`:''}${fieldHTML('email',{required:true})}${fieldHTML('password',{required:true})}${state.first?fieldHTML('currency',{value:'YER'}):''}
 <button class="primary-btn wide" type="submit">${state.first?'إنشاء المؤسسة والبدء':'تسجيل الدخول'} ${ic('arrow')}</button></form>${LOCAL?`<div class="offline-note">${ic('shield')} تجربة محلية تعمل دون إنترنت؛ السجلات محفوظة على هذا الجهاز فقط.</div>${state.first?`<button class="secondary-btn wide" data-action="import-pick">${ic('download')} استعادة نسخة احتياطية سابقة</button>`:''}`:''}
 <p class="foot-note">الصرح التعليمي © ${new Date().getFullYear()} · تصميم عربي متجاوب للمدرسة والطلاب وأولياء الأمور</p></div></div></div>`;
}
function permitted(page){
 const role=state.user?.role;
 if(!role)return false;
 if(page==='home'||page==='settings'||page==='more'||page==='reports')return true;
 if(page==='guardians')return ['admin','principal','accountant'].includes(role);
 if(page==='finance')return ['admin','principal','accountant','guardian'].includes(role);
 if(page==='users')return ['admin','principal','accountant'].includes(role);
 if(page==='audit')return role==='admin';
 if(page==='profile')return true;
 if(modules[page]){
  if(['admin','principal'].includes(role))return true;
  if(role==='accountant')return ['students','teachers','classes','inventory','employees','announcements','salaryPlans'].includes(page);
  if(role==='teacher')return !['inventory','employees','transport','salaryPlans'].includes(page);
  if(role==='guardian'||role==='student')return !['teachers','inventory','employees','transport','salaryPlans','questions'].includes(page);
 }
 return false;
}
function features(){
 const order=['students','teachers','guardians','lessons','exams','assignments','attendance','schedule','finance','inventory','reports','books','classes','subjects','grades','submissions','announcements','curricula','reviews','questions','behavior','libraryLoans','meetings','transport','employees','salaryPlans'];
 return order.map(x=>x==='guardians'?{key:'guardians',title:'أولياء الأمور',icon:'guardian',color:'t-green'}:x==='finance'?{key:'finance',title:'الحسابات المالية',icon:'calculator',color:'t-yellow'}:x==='reports'?{key:'reports',title:'التقارير',icon:'chart',color:'t-purple'}:{key:x,...modules[x]}).filter(x=>x?.title&&permitted(x.key));
}
function renderShell(){const u=state.user;const role=names[u.role]||u.role;
 $('#root').innerHTML=`<div class="app"><aside class="sidebar"><div class="side-head">${logo()}<div><strong>الصرح التعليمي</strong><span>ALSARH EDUCATIONAL</span></div></div><nav class="side-nav">${navItems.filter(x=>permitted(x[0])).map(([id,title,icon])=>`<button data-page="${id}" class="${state.page===id?'active':''}">${ic(icon)} ${title}</button>`).join('')}<button data-page="more">${ic('more')} جميع الأقسام</button></nav><div class="side-foot"><div class="user-pill"><div class="avatar">${e(u.name.slice(0,1))}</div><div><strong>${e(u.name)}</strong><span>${e(role)}</span></div></div><button class="secondary-btn wide" style="margin-top:10px" data-action="logout">${ic('logout')} تسجيل الخروج</button></div></aside>
 <div class="main"><header class="topbar"><div class="title">${logo()}<div>الصرح التعليمي<small>${e(u.schoolName)}</small></div></div>${LOCAL?'<span class="offline-pill">● تجربة محلية</span>':''}<div class="top-actions"><button aria-label="الرسائل والتعاميم" data-page="announcements">${ic('bell')}</button><button aria-label="الإعدادات" data-page="settings">${ic('settings')}</button></div></header><main class="main-content" id="content"></main></div>
 <nav class="bottom-nav">${[['home','الرئيسية','home'],['students','الطلاب','cap'],['lessons','الدروس','book'],['reports','التقارير','chart'],['more','المزيد','more']].filter(x=>permitted(x[0])).map(([id,label,icon])=>`<button data-page="${id}" class="${state.page===id?'active':''}">${ic(icon)}<span>${label}</span></button>`).join('')}</nav></div><div id="sheet-mount"></div>`;
 renderPage();
}
function renderPage(){if(!state.user)return;const target=$('#content');if(!target)return;
 if(state.page==='home')target.innerHTML=homeHTML();
 else if(state.page==='more')target.innerHTML=moreHTML();
 else if(state.page==='guardians')target.innerHTML=guardiansHTML();
 else if(state.page==='finance')target.innerHTML=financeHTML();
 else if(state.page==='reports')target.innerHTML=reportsHTML();
 else if(state.page==='users')target.innerHTML=usersHTML();
 else if(state.page==='settings')target.innerHTML=settingsHTML();
 else if(state.page==='audit')target.innerHTML=auditHTML();
 else if(state.page==='profile')target.innerHTML=profileHTML();
 else if(modules[state.page])target.innerHTML=moduleHTML(state.page);
 else target.innerHTML=homeHTML();
 $$('.side-nav [data-page],.bottom-nav [data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));
 if(state.sheet)renderSheet();
}
function stat(value,label,icon,color){return `<div class="stat"><div class="stat-icon ${color}">${ic(icon)}</div><div class="stat-number">${e(value)}</div><div class="stat-label">${e(label)}</div></div>`;}
function card(x){return `<button class="feature-card" data-page="${e(x.key)}"><span class="feature-icon ${e(x.color)}">${ic(x.icon)}</span><span>${e(x.title)}</span></button>`;}
function homeHTML(){const counts=state.overview.counts||{},f=state.overview.finance,financeOK=f!==null&&f!==undefined;
 const stats=[stat(fm(counts.students||0),'إجمالي الطلاب','users','t-rose'),stat(fm(counts.teachers||0),'المعلمون','teacher','t-blue'),stat(fm(counts.assignments||0),'الواجبات','clipboard','t-green'),stat(fm(counts.exams||0),'الاختبارات','exam','t-orange')];
 const announcement=(state.cache.announcements||[]).slice(0,3);
 return `<div class="hero"><div><span class="hero-tag">مرحبًا ${e(state.user.name)} ✦</span><h2>إدارة أذكى، وتعليم أفضل</h2><p>كل ما تحتاجه من شؤون الطلاب والدروس والواجبات والحسابات في منصة واحدة، متكاملة وآمنة.</p></div><div class="hero-graphic">${logo()}</div></div>
 <div class="stat-grid">${stats.join('')}</div><div class="quick-section"><h3>أقسام المنظومة</h3><span>اختر القسم المطلوب</span></div><div class="feature-grid">${features().slice(0,12).map(card).join('')}</div>
 <div class="cols2"><section class="panel"><h3>${ic('bell')} أحدث التعاميم</h3>${announcement.length?`<div class="panel-list">${announcement.map(a=>`<div class="panel-item"><div><strong>${e(a.title)}</strong><br><span>${e(a.body?.slice(0,110))}</span></div></div>`).join('')}</div>`:'<p>لا توجد تعاميم منشورة حاليًا.</p>'}<button class="secondary-btn" style="margin-top:16px" data-page="announcements">عرض التعاميم ${ic('arrow')}</button></section>
 <section class="panel"><h3>${ic('chart')} ملخص المتابعة</h3><div class="panel-list"><div class="panel-item"><strong>الحاضرون اليوم</strong><span>${fm(state.overview.attendanceToday?.present||0)} طالب</span></div><div class="panel-item"><strong>الغائبون اليوم</strong><span>${fm(state.overview.attendanceToday?.absent||0)} طالب</span></div>${financeOK?`<div class="panel-item"><strong>الرسوم المحصلة</strong><span>${fm(f.collected)} ${e(state.user.currency)}</span></div>`:''}</div></section></div>`;
}
function guardiansHTML(){const guardians=state.users.filter(u=>u.role==='guardian');return `${titleBar('أولياء الأمور','حسابات أولياء الأمور والأبناء المرتبطون بها',state.user.role==='admin'?`<button class="primary-btn" data-add="users">${ic('plus')} إضافة حساب</button>`:'')}<div class="data-list">${guardians.length?guardians.map(u=>{const children=(state.cache.students||[]).filter(s=>s.guardianUserId===u.id);return `<div class="data-item"><div><strong>${e(u.name)}</strong><div class="record-sub">${e(u.email)} · الأبناء: ${children.map(s=>e(s.name)).join('، ')||'لا يوجد ارتباط بعد'}</div></div><span class="badge">${children.length} أبناء</span></div>`;}).join(''):emptyText('أضف حساب ولي الأمر من قسم المستخدمين، ثم اربطه بالطالب من ملفه')}</div>`;}
function moreHTML(){return `<div class="heading-row"><div><h2 class="section-title">القائمة الرئيسية</h2><p class="section-sub">جميع أقسام المنظومة بحسب صلاحية الحساب</p></div></div><div class="feature-grid">${features().map(card).join('')}${permitted('users')?card({key:'users',title:'حسابات المستخدمين',icon:'users',color:'t-slate'}):''}${permitted('audit')?card({key:'audit',title:'سجل العمليات',icon:'shield',color:'t-slate'}):''}${card({key:'settings',title:'الإعدادات',icon:'settings',color:'t-slate'})}</div>`;}
function titleBar(title,subtitle,action=''){return `<div class="heading-row"><div><h2 class="section-title">${e(title)}</h2><p class="section-sub">${e(subtitle||'')}</p></div>${action}</div>`;}
function moduleHTML(type){const m=modules[type],items=(state.cache[type]||[]).filter(x=>JSON.stringify(x).toLowerCase().includes(state.search.toLowerCase()));const add=canWrite(type);
 return `${titleBar(m.title,m.sub,add?`<button class="primary-btn" data-add="${type}">${ic('plus')} إضافة جديد</button>`:'')}
 <div class="toolbar"><div class="search-wrap">${ic('search')}<input aria-label="بحث في السجلات" data-search placeholder="ابحث في ${e(m.title)} ..." value="${e(state.search)}"></div><button class="secondary-btn" data-action="refresh">${ic('report')} تحديث</button></div>
 <div class="data-list" id="records-list">${renderRecords(type,items)}</div><p class="foot-note">${fm(items.length)} سجل${state.search?' نتيجة بحث':''} · ${LOCAL?'حفظ محلي على الجهاز دون الحاجة للإنترنت':'يتم حفظ البيانات في خادم المؤسسة'}</p>`;
}
function lookup(type,id){if(!id)return '—';if(type==='users')return state.users.find(x=>x.id===id)?.name||id;return (state.cache[type]||[]).find(x=>x.id===id)?.name||(state.cache[type]||[]).find(x=>x.id===id)?.title||'غير معروف';}
function showField(key,value){if(value===undefined||value===null||value==='')return '';if(key==='classId')return `الصف: ${lookup('classes',value)}`;if(key==='subjectId')return `المادة: ${lookup('subjects',value)}`;if(key==='studentId')return `الطالب: ${lookup('students',value)}`;if(key==='bookId')return `الكتاب: ${lookup('books',value)}`;if(key==='employeeId')return `الموظف: ${lookup('employees',value)}`;if(key==='examId')return `الاختبار: ${lookup('exams',value)}`;if(key==='assignmentId')return `الواجب: ${lookup('assignments',value)}`;if(key==='guardianUserId'||key==='teacherUserId')return lookup('users',value);if(key==='date'||key==='dueDate')return date(value);return String(value).slice(0,85);}
function renderRecords(type,items){if(!items.length)return `<div class="empty">${ic(modules[type].icon)}<h3>لا توجد بيانات بعد</h3><p>ابدأ بإضافة أول سجل لهذا القسم، أو جرّب بحثًا آخر.</p></div>`;
 return items.map(x=>{const primary=showField(modules[type].primary,x[modules[type].primary])||'سجل بدون اسم';const sub=modules[type].fields.filter(k=>k!==modules[type].primary&&x[k]&&k!=='notes'&&k!=='description'&&k!=='body'&&k!=='instructions').slice(0,3).map(k=>showField(k,x[k])).join(' · ');
 return `<div class="data-item"><div class="metric-row"><div class="avatar">${e(primary.slice(0,1))}</div><div><div class="record-title">${e(primary)}</div><div class="record-sub">${e(sub)}</div></div></div><div class="action-btns">${type==='students'?`<button class="icon-btn" title="ملف الطالب" data-profile="${e(x.id)}">${ic('eye')}</button>`:''}${canWrite(type)?`<button class="icon-btn" title="تعديل" data-edit="${type}:${e(x.id)}">${ic('edit')}</button>`:''}</div></div>`;}).join('');}
function canWrite(type){const r=state.user?.role;if(['admin','principal'].includes(r))return true;if(r==='accountant')return ['inventory','employees','salaryPlans'].includes(type);if(r==='teacher')return ['lessons','books','assignments','exams','grades','attendance','schedule','announcements','curricula','reviews','questions','meetings','behavior','libraryLoans'].includes(type);return r==='student'&&type==='submissions';}
function financeHTML(){const role=state.user.role,allowed=['admin','principal','accountant'].includes(role),tab=state.financeTab;const fees=state.cache.fees||[],payments=state.cache.payments||[],expenses=state.cache.expenses||[],f=state.overview.finance||{};
 const tabs=[['fees','الأقساط'],['payments','التحصيلات'],...(allowed?[['expenses','المصروفات'],['trial','ميزان المراجعة']]:[])];
 return `${titleBar('الحسابات المالية','رسوم الطلاب، التحصيل، المصروفات والقيود المحاسبية')}
 <div class="finance-cards">${stat(fm(f.collected||0),'المحصل','wallet','t-green')}${stat(fm(f.outstanding||0),'المتبقي','money','t-orange')}${stat(fm(f.billed||0),'إجمالي الرسوم','calculator','t-blue')}</div>
 <div class="tabs">${tabs.map(([id,name])=>`<button data-finance="${id}" class="${id===tab?'active':''}">${name}</button>`).join('')}</div>
 ${tab==='fees'?`<div class="toolbar">${allowed?`<button class="primary-btn" data-fin-add="fee">${ic('plus')} إصدار قسط</button>`:''}</div><div class="data-list">${fees.length?fees.map(x=>`<div class="data-item"><div><div class="record-title">${e(x.studentName||lookup('students',x.student_id))} · ${e(x.description)}</div><div class="record-sub">إجمالي ${fm(x.amount)} | المسدد ${fm(x.paid)} | المتبقي ${fm(x.amount-x.paid)} ${e(state.user.currency)}</div></div>${x.paid===x.amount?'<span class="badge">مسدد</span>':'<span class="badge warning">متبقي</span>'}</div>`).join(''):emptyText('لا توجد أقساط مسجلة')}</div>`:''}
 ${tab==='payments'?`<div class="toolbar">${allowed?`<button class="primary-btn" data-fin-add="payment">${ic('plus')} تحصيل مبلغ</button>`:''}</div><div class="data-list">${payments.length?payments.map(x=>`<div class="data-item"><div><div class="record-title">إيصال تحصيل · ${fm(x.amount)} ${e(state.user.currency)}</div><div class="record-sub">${date(x.created_at)} · ${e(x.method==='bank'?'البنك':'نقدي')} · فاتورة ${e(x.fee_id.slice(0,8))}</div></div><button class="icon-btn" title="طباعة الإيصال" data-print="${e(x.id)}">${ic('printer')}</button></div>`).join(''):emptyText('لا توجد عمليات تحصيل')}</div>`:''}
 ${tab==='expenses'&&allowed?`<div class="toolbar"><button class="primary-btn" data-fin-add="expense">${ic('plus')} تسجيل مصروف</button></div><div class="data-list">${expenses.length?expenses.map(x=>`<div class="data-item"><div><div class="record-title">${e(x.category)} · ${e(x.description)}</div><div class="record-sub">${date(x.created_at)} · ${e(x.method==='bank'?'البنك':'نقدي')}</div></div><strong>${fm(x.amount)} ${e(state.user.currency)}</strong></div>`).join(''):emptyText('لا توجد مصروفات')}</div>`:''}
 ${tab==='trial'&&allowed?trialHTML():''}
 <p class="foot-note">المبالغ بعملة المؤسسة: ${e(state.user.currency)} · جميع التحصيلات والمصروفات تُرحّل بقيود مزدوجة.</p>`;
}
function emptyText(txt){return `<div class="empty">${ic('note')}<h3>${e(txt)}</h3></div>`;}
function trialHTML(){const rows=state.cache.trial||[];if(!rows.length)return '<div class="notice">جارِ تحميل الحسابات... انقر تحديث.</div>';
 return `<div class="panel"><h3>ميزان المراجعة</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>رمز الحساب</th><th>الحساب</th><th>رصيد مدين</th><th>رصيد دائن</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${e(x.code)}</td><td>${e(x.name)}</td><td>${fm(x.debitBalance)}</td><td>${fm(x.creditBalance)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2">الإجمالي</td><td>${fm(rows.reduce((s,x)=>s+x.debitBalance,0))}</td><td>${fm(rows.reduce((s,x)=>s+x.creditBalance,0))}</td></tr></tfoot></table></div><p>حالة القيود: ${state.cache.balanced?'متوازنة ✓':'تحتاج مراجعة'}</p></div>`;
}
function reportsHTML(){const counts=state.overview.counts||{},classItems=(state.cache.classes||[]),students=(state.cache.students||[]),att=(state.cache.attendance||[]),f=state.overview.finance;
 return `${titleBar('التقارير والإحصائيات','مؤشرات تعليمية وإدارية لحظية بحسب الصلاحيات','<button class="secondary-btn no-print" data-action="print">'+ic('printer')+' طباعة</button>')}
 <div class="stat-grid">${stat(fm(counts.students||0),'الطلاب','cap','t-purple')}${stat(fm(counts.classes||0),'الصفوف','school','t-blue')}${stat(fm(counts.lessons||0),'الدروس','book','t-green')}${stat(fm(counts.attendance||0),'سجلات الحضور','calendar','t-orange')}</div>
 <div class="cols2"><div class="panel"><h3>توزيع الطلاب على الصفوف</h3>${classItems.length?classItems.map(c=>{const n=students.filter(x=>x.classId===c.id).length,max=Math.max(students.length,1);return `<div class="metric-row" style="margin:14px 0"><span class="metric-label">${e(c.name)}</span><div class="bar"><i style="width:${100*n/max}%"></i></div><span>${fm(n)}</span></div>`;}).join(''):'<p>أضف صفوفًا وطلابًا لعرض التوزيع.</p>'}</div>
 <div class="panel"><h3>ملخص الحضور</h3>${[['present','حاضر'],['absent','غائب'],['late','متأخر'],['excused','بعذر']].map(([key,label])=>{const n=att.filter(a=>a.status===key).length;return `<div class="metric-row" style="margin:14px 0"><span class="metric-label">${label}</span><div class="bar"><i style="width:${att.length?100*n/att.length:0}%"></i></div><span>${fm(n)}</span></div>`;}).join('')}</div></div>
 ${f?`<div class="panel"><h3>الملخص المالي</h3><div class="finance-cards">${stat(fm(f.billed),'رسوم مستحقة','calculator','t-blue')}${stat(fm(f.collected),'محصل','wallet','t-green')}${stat(fm(f.outstanding),'رصيد متبقٍ','money','t-yellow')}</div>${f.expenses!==null?`<p>مصروفات التشغيل المسجلة: <strong>${fm(f.expenses)} ${e(state.user.currency)}</strong></p>`:''}</div>`:''}
 <p class="help">التقارير تتضمن فقط السجلات المسموح لك برؤيتها. يتم الاحتفاظ بجميع العمليات في قاعدة بيانات المؤسسة.</p>`;
}
function usersHTML(){return `${titleBar('إدارة المستخدمين','صلاحيات مستقلة للمدير والمعلم والمحاسب وولي الأمر والطالب',state.user.role==='admin'?`<button class="primary-btn" data-add="users">${ic('plus')} إنشاء حساب</button>`:'')}
 <div class="data-list">${state.users.map(u=>`<div class="data-item"><div class="metric-row"><div class="avatar">${e(u.name.slice(0,1))}</div><div><div class="record-title">${e(u.name)}</div><div class="record-sub">${e(u.email)}</div></div></div><div class="action-btns"><span class="badge">${e(names[u.role]||u.role)}</span>${state.user.role==='admin'&&u.id!==state.user.id?`<button title="تعيين كلمة مرور" class="icon-btn" data-reset-password="${e(u.id)}">${ic('settings')}</button>`:''}</div></div>`).join('')||emptyText('لا يوجد مستخدمون')}</div><p class="help">لا تُشارك بيانات دخول الإدارة. أنشئ حسابًا منفصلًا لكل مستخدم، وحدد صلاحياته.</p>`;}
function settingsHTML(){return `${titleBar('إعدادات الحساب','إدارة المؤسسة وحماية البيانات وتجهيز نسخة Hostinger')}
 <section class="panel"><h3>${ic('school')} المؤسسة</h3><div class="panel-item"><strong>اسم المؤسسة</strong><span>${e(state.user.schoolName)}</span></div><div class="panel-item" style="margin-top:9px"><strong>عملة النظام</strong><span>${e(state.user.currency)}</span></div><div class="panel-item" style="margin-top:9px"><strong>مستوى الصلاحية</strong><span>${e(names[state.user.role]||state.user.role)}</span></div></section>
 ${LOCAL?`<section class="panel"><h3>${ic('shield')} وضع التجربة المحلي</h3><p>يعمل التطبيق الآن دون خادم أو إنترنت. بيانات هذه المؤسسة محفوظة على هذا الجهاز فقط؛ إذا حذفت التطبيق أو مسحت بياناته فقد تفقدها. صدّر نسخة احتياطية بانتظام ولا تستخدم بيانات طلاب حقيقية أثناء التطوير.</p>${state.user.role==='admin'?`<button class="secondary-btn" data-action="demo-seed">${ic('plus')} إضافة بيانات نموذجية لمؤسسة فارغة</button>`:''}<div class="offline-note">عند الانتهاء من التطوير، ننقل الملفات إلى Hostinger ثم نستورد نسخة البيانات داخل الخادم. حسابات المستخدمين المنقولة ستحتاج كلمة مرور جديدة.</div>${window.ALSARH_NATIVE?`<button class="secondary-btn" data-action="connect-server">${ic('link')} ربط خادم HTTPS لاحقًا</button>`:location.protocol==='alsarh:'?`<div class="field"><label for="alsarh-server-url">رابط خادم HTTPS بعد نشر النظام</label><input id="alsarh-server-url" placeholder="https://school.yourdomain.com" type="url" dir="ltr"></div><button class="secondary-btn" data-action="connect-server">${ic('link')} ربط الخادم لاحقًا</button>`:''}</section>`:''}
 <section class="panel"><h3>${ic('shield')} أمان الحساب</h3><p>تغيير كلمة المرور الحالية، وإنشاء كلمة مرور مستقلة لكل شخص لديه صلاحية.</p><button class="secondary-btn" data-add="password">${ic('settings')} تغيير كلمة المرور</button></section>
 ${state.user.role==='admin'?`<section class="panel"><h3>${ic('download')} النسخ الاحتياطي ونقل البيانات</h3><p>${LOCAL?'احفظ ملفًا مستقلًا من معلوماتك الأكاديمية والحسابات والقيود المالية وسجلات المستخدمين. احفظه بمكان آمن؛ يتضمن معلومات حساسة ولا يتضمن كلمات المرور بصيغتها الأصلية.':'يمكن استيراد نسخة جهاز التجربة إلى خادم جديد وفارغ. عملية الاستيراد تتطلب مدير نظام وتحفظ سجلات الحسابات.'}</p><div class="action-row"><button class="primary-btn" data-action="backup">${ic('download')} تصدير نسخة JSON</button><button class="secondary-btn" data-action="import-pick">${ic('plus')} ${LOCAL?'استعادة نسخة سابقة':'استيراد نسخة الجهاز'}</button></div><input id="alsarh-backup-file" type="file" accept=".json,application/json" hidden></section>`:''}
 ${!LOCAL&&window.ALSARH_NATIVE?`<section class="panel"><h3>تجربة دون إنترنت</h3><p>يمكنك العودة للوضع المحلي دون حذف بيانات الخادم.</p><button class="secondary-btn" data-action="use-offline">العودة للوضع المحلي</button></section>`:''}
 <section class="panel"><h3>عن المنظومة</h3><p>الصرح التعليمي · ALSARH EDUCATIONAL SYSTEM<br>المنظومة المتكاملة للتعليم والإدارة والحسابات<br>الإصدار 0.2.0 · ${LOCAL?'وضع محلي تجريبي':'خادم المؤسسة'}</p><button class="danger-btn" data-action="logout">${ic('exit')} تسجيل الخروج</button></section>`;}
function auditHTML(){return `${titleBar('سجل التدقيق','آخر التعديلات على بيانات المؤسسة')}<div class="data-list">${(state.cache.audit||[]).map(x=>`<div class="data-item"><div><div class="record-title">${e(x.userName)} · ${e(x.action)}</div><div class="record-sub">${e(x.entity)} · ${e(x.entity_id.slice(0,8))}</div></div><span class="record-sub">${date(x.created_at)}</span></div>`).join('')||emptyText('لا توجد عمليات مسجلة')}</div>`;}
function profileHTML(){const id=state.profileId,x=(state.cache.students||[]).find(s=>s.id===id);if(!x)return emptyText('لم يتم العثور على الطالب');
 const attend=(state.cache.attendance||[]).filter(r=>r.studentId===id),grades=(state.cache.grades||[]).filter(r=>r.studentId===id),fees=(state.cache.fees||[]).filter(r=>r.student_id===id);
 return `${titleBar('ملف الطالب','السجل التعليمي والمالي للطالب','<button class="secondary-btn" data-page="students">'+ic('arrow')+' رجوع</button>')}
 <section class="panel"><div class="metric-row"><div class="avatar" style="width:65px;height:65px;font-size:22px">${e(x.name.slice(0,1))}</div><div><h2 style="margin:0;font-size:19px">${e(x.name)}</h2><p style="margin:5px 0">${e(x.code||'لا يوجد رقم')} · ${e(lookup('classes',x.classId))}</p></div></div><div class="divider"></div><div class="panel-item"><strong>ولي الأمر</strong><span>${e(x.guardianName||'—')}</span></div><div class="panel-item" style="margin-top:7px"><strong>التواصل</strong><span>${e(x.guardianPhone||'—')}</span></div></section>
 <div class="stat-grid">${stat(fm(att.length),'سجلات حضور','calendar','t-green')}${stat(fm(grades.length),'الدرجات','report','t-purple')}${stat(fm((state.cache.assignments||[]).filter(a=>a.classId===x.classId).length),'الواجبات','clipboard','t-rose')}${stat(fm(fees.reduce((s,f)=>s+f.amount-f.paid,0)),'رسوم متبقية','calculator','t-yellow')}</div>
 <div class="cols2"><div class="panel"><h3>آخر الحضور والغياب</h3>${att.slice(0,6).map(a=>`<div class="panel-item"><strong>${date(a.date)}</strong><span>${e(labels[a.status]||a.status)}</span></div>`).join('')||'<p>لا توجد سجلات.</p>'}</div><div class="panel"><h3>نتائج التقييم</h3>${grades.slice(0,6).map(g=>`<div class="panel-item"><strong>${e(lookup('exams',g.examId))}</strong><span>${e(g.score)}</span></div>`).join('')||'<p>لا توجد درجات.</p>'}</div></div>`;
}
function selectValues(key){if(key.startsWith('select:')){
  const k=key.slice(7);if(options[k])return options[k];if(k==='fees')return (state.cache.fees||[]).filter(f=>f.paid<f.amount).map(f=>[f.id,`${f.studentName||lookup('students',f.student_id)} | ${fm(f.amount-f.paid)} ${state.user.currency}`]);return (state.cache[k]||[]).map(x=>[x.id,x.name||x.title||x.id.slice(0,7)]);
 }if(key.startsWith('users:')){const role=key.slice(6);return state.users.filter(x=>x.role===role||role==='teacher'&&['admin','principal'].includes(x.role)).map(x=>[x.id,x.name]);}return [];
}
function fieldHTML(id,opts={}){
 const [label,kind,req]=fields[id]||[id,'text'];const required=opts.required??req??false;const value=opts.value??'';
 const requirement=required?' required':'';const fieldName=opts.customLabel||label;
 if(kind.startsWith('select:')||kind.startsWith('users:')){
  const vals=selectValues(kind);return `<div class="field ${opts.wide?'wide-field':''}"><label for="f-${id}">${e(fieldName)}${required?' *':''}</label><select name="${id}" id="f-${id}"${requirement}><option value="">اختر...</option>${vals.map(([v,n])=>`<option value="${e(v)}" ${v===value?'selected':''}>${e(n)}</option>`).join('')}</select></div>`;
 }
 const control=kind==='textarea'?`<textarea id="f-${id}" name="${id}"${requirement}>${e(value)}</textarea>`:`<input id="f-${id}" name="${id}" type="${kind}" value="${e(value)}"${requirement} ${kind==='number'?'step="1" min="0"':''} ${id==='password'?'minlength="10" autocomplete="new-password"':''}>`;
 return `<div class="field ${opts.wide?'wide-field':''}"><label for="f-${id}">${e(fieldName)}${required?' *':''}</label>${control}</div>`;
}
function renderSheet(){const m=$('#sheet-mount');if(!m)return;const s=state.sheet;if(!s){m.innerHTML='';return;}
 const isEdit=!!s.id;let content='',title='';
 if(s.type==='reset-password'){title='تعيين كلمة مرور جديدة';content=`<div class="field"><label>كلمة المرور الجديدة (10 أحرف على الأقل)</label><input type="password" name="password" minlength="10" autocomplete="new-password" required></div>`;}
 else if(s.type==='users'){title='إنشاء حساب مستخدم';content=['name','email','password','role','studentId'].map(k=>fieldHTML(k,{required:k!=='studentId'})).join('');}
 else if(s.type==='password'){title='تغيير كلمة المرور';content=`${fieldHTML('password',{customLabel:'كلمة المرور الحالية'})}<div class="field"><label>كلمة المرور الجديدة *</label><input type="password" name="newPassword" minlength="10" required autocomplete="new-password"></div>`;}
 else if(['fee','payment','expense'].includes(s.type)){
   title=s.type==='fee'?'إصدار قسط دراسي':s.type==='payment'?'سداد قسط': 'تسجيل مصروف';
   const fs=s.type==='fee'?['studentId','description','amount','dueDate']:s.type==='payment'?['feeId','amount','method']:['category','description','amount','method'];
   content=fs.map(k=>fieldHTML(k,{required:['amount','studentId','feeId'].includes(k),value:k==='method'?'cash':(k==='studentId'&&s.extra)||''})).join('');
 }else {
   title=(isEdit?'تعديل ':'إضافة ')+(modules[s.type]?.title||'سجل');
   const entry=(state.cache[s.type]||[]).find(x=>x.id===s.id)||{};
   content=(modules[s.type]?.fields||[]).filter(x=>!['score','feedback'].includes(x)||s.type!=='submissions'||state.user.role!=='student').map(k=>fieldHTML(k,{value:entry[k]??(k==='date'?today():k==='status'?'active':k==='studentId'&&state.user.role==='student'?state.user.studentId:''),wide:['description','notes','body','instructions','answer'].includes(k)})).join('');
 }
 m.innerHTML=`<div class="sheet-overlay" data-action="close-sheet"><div class="sheet" role="dialog" aria-modal="true" aria-label="${e(title)}"><div class="sheet-head"><h3>${e(title)}</h3><button class="icon-btn" data-action="close-sheet" aria-label="إغلاق">${ic('close')}</button></div><form id="edit-form" class="sheet-body"><div class="form-grid">${content}</div><div class="sheet-actions"><button class="primary-btn" type="submit">${ic('check')} حفظ البيانات</button><button type="button" class="secondary-btn" data-action="close-sheet">إلغاء</button></div></form></div></div>`;
}
async function refresh(){
 const roles=state.user.role;state.loading=true;
 try {
  const list=new Set(features().map(x=>x.key).filter(k=>modules[k]));['classes','students','announcements','attendance','grades','exams','assignments','subjects','books','employees'].forEach(x=>list.add(x));
  await Promise.all([...list].map(async type=>{if(!permitted(type))return;try{const r=await api('/data/'+type);state.cache[type]=r.items;}catch{state.cache[type]=[];}}));
  if(['admin','principal','accountant'].includes(roles)){try{state.users=(await api('/users')).items;}catch{state.users=[];}}
  if(permitted('finance'))await refreshFinance();
  state.overview=await api('/overview');
  if(roles==='admin'){try{state.cache.audit=(await api('/audit')).items;}catch{state.cache.audit=[];}}
 }finally {state.loading=false;renderShell();}
}
async function refreshFinance(){const allowed=['admin','principal','accountant'].includes(state.user.role);
 const tasks=['fees','payments',...(allowed?['expenses','trial-balance']:[])];await Promise.all(tasks.map(async name=>{
  try{const r=await api('/finance/'+name);state.cache[name==='trial-balance'?'trial':name]=r.items;if(name==='trial-balance')state.cache.balanced=r.balanced;}catch{state.cache[name==='trial-balance'?'trial':name]=[];}
 }));
}
async function navigate(page){if(!permitted(page)){toast('هذا القسم غير متاح لصلاحية حسابك',true);return;}state.page=page;state.search='';if(page==='finance')await refreshFinance();if(page==='reports')state.overview=await api('/overview');renderPage();window.scrollTo({top:0,behavior:'instant'});}
async function reloadData(){await refresh();toast('تم تحديث البيانات');}
function printReceipt(id){const p=(state.cache.payments||[]).find(x=>x.id===id);if(!p)return;const f=(state.cache.fees||[]).find(x=>x.id===p.fee_id),s=f?.studentName||'—';const doc=`<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>سند قبض ${e(id.slice(0,8))}</title><style>body{font-family:Tahoma,Arial;padding:25px;color:#092e62}header{text-align:center;border-bottom:2px solid #d5a544;padding:12px}main{padding:30px}p{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px}footer{text-align:center;margin-top:30px}</style><header><h2>الصرح التعليمي</h2><div>${e(state.user.schoolName)}</div><h3>سند قبض رسوم دراسية</h3></header><main><p><b>رقم السند</b><span>${e(id.slice(0,8).toUpperCase())}</span></p><p><b>الطالب</b><span>${e(s)}</span></p><p><b>التاريخ</b><span>${date(p.created_at)}</span></p><p><b>المبلغ</b><strong>${fm(p.amount)} ${e(state.user.currency)}</strong></p><p><b>طريقة الدفع</b><span>${e(p.method==='bank'?'بنك':'نقدي')}</span></p></main><footer>إيصال صادر من منظومة الصرح التعليمي</footer><script>window.onload=()=>window.print()<\/script></html>`;const win=window.open('','_blank','width=720,height=850');if(win){win.document.write(doc);win.document.close();}else toast('اسمح بفتح نافذة الطباعة',true);}
async function submitSheet(form){const s=state.sheet;if(!s)return;const btn=form.querySelector('[type=submit]');btn.disabled=true;const values=Object.fromEntries(new FormData(form).entries());
 for(const [k,v]of Object.entries(values)){if(v==='')delete values[k];else if(['amount','score','quantity','price','salary','maxScore','capacity'].includes(k))values[k]=Number(v);}
 try{
  if(s.type==='reset-password'){await post('/users/'+s.id+'/password',{password:values.password});}
  else if(s.type==='users') {if(values.role==='student'&&!values.studentId)throw new Error('اختر الطالب المرتبط بهذا الحساب');await post('/users',values);}
  else if(s.type==='password'){await post('/change-password',{currentPassword:values.password,newPassword:values.newPassword});state.sheet=null;state.user=null;state.first=false;renderAuth();toast('تم تغيير كلمة المرور. سجّل دخولك مجددًا');return;}
  else if(['fee','payment','expense'].includes(s.type)){const target=s.type==='fee'?'fees':s.type==='payment'?'payments':'expenses';await post('/finance/'+target,{...values,idempotencyKey:crypto.randomUUID()});}
  else{await post('/data/'+s.type+(s.id?'/'+s.id:''),{data:values},s.id?'PATCH':'POST');}
  state.sheet=null;await refresh();toast(s.id?'تم تحديث السجل بنجاح':'تم حفظ البيانات بنجاح');
 }catch(err){btn.disabled=false;toast(err.message,true);}
}
async function submitAuth(form){const values=Object.fromEntries(new FormData(form).entries());const btn=form.querySelector('[type=submit]');btn.disabled=true;try{const r=await post(state.first?'/setup':'/login',values);state.user=(await api('/me')).user;state.first=false;await refresh();toast('أهلاً بك في الصرح التعليمي');}catch(err){toast(err.message,true);btn.disabled=false;}}
function handleSearch(value){state.search=value;const page=state.page;const m=modules[page];if(!m)return;const items=(state.cache[page]||[]).filter(x=>JSON.stringify(x).toLowerCase().includes(value.toLowerCase()));$('#records-list').innerHTML=renderRecords(page,items);}
async function handleAction(el){
 const page=el.closest('[data-page]')?.dataset.page;if(page){await navigate(page);return;}
 const add=el.closest('[data-add]')?.dataset.add;if(add){state.sheet={type:add};renderSheet();return;}
 const edit=el.closest('[data-edit]')?.dataset.edit;if(edit){const [type,id]=edit.split(':');state.sheet={type,id};renderSheet();return;}
 const finance=el.closest('[data-finance]')?.dataset.finance;if(finance){state.financeTab=finance;renderPage();return;}
 const finAdd=el.closest('[data-fin-add]')?.dataset.finAdd;if(finAdd){state.sheet={type:finAdd};renderSheet();return;}
 const profile=el.closest('[data-profile]')?.dataset.profile;if(profile){state.page='profile';state.profileId=profile;renderPage();return;}
 const printable=el.closest('[data-print]')?.dataset.print;if(printable){printReceipt(printable);return;}
 const action=el.closest('[data-action]')?.dataset.action;
 if(action==='close-sheet'){if(el.closest('.sheet')&&!el.closest('[data-action="close-sheet"]:not(.sheet-overlay)'))return;state.sheet=null;renderSheet();return;}
 if(action==='logout'){await post('/logout',{}).catch(()=>{});state.user=null;state.cache={};state.first=false;renderAuth();return;}
 if(action==='refresh'){await reloadData();return;}
 if(action==='reload'){location.reload();return;}
 if(action==='print'){window.print();return;}
 if(action==='backup'){try{const data=await api('/export');const str=JSON.stringify(data,null,2);if(LOCAL&&window.ALSARH_NATIVE?.exportBackup){window.ALSARH_NATIVE.exportBackup(str);toast('اختر مكان حفظ النسخة الاحتياطية');}else{const blob=new Blob([str],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='alsarh-'+(LOCAL?'offline':'server')+'-backup-'+today()+'.json';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);toast('تم تجهيز ملف النسخة الاحتياطية');}}catch(err){toast(err.message,true);}return;}
 if(action==='import-pick'){const field=$('#alsarh-backup-file');if(field){field.value='';field.click();}else {const f=document.createElement('input');f.type='file';f.accept='.json,application/json';f.id='alsarh-backup-file';f.hidden=true;document.body.append(f);f.click();}return;}
 if(action==='demo-seed'){if(!LOCAL)return;if(!confirm('ستضاف بيانات مدرسية نموذجية للعرض، ولا تصلح كسجلات حقيقية. المتابعة؟'))return;try{await post('/demo-seed',{});await refresh();toast('أُضيفت البيانات النموذجية بنجاح');}catch(err){toast(err.message,true);}return;}
 if(action==='connect-server'){if(window.ALSARH_NATIVE?.chooseServer){window.ALSARH_NATIVE.chooseServer();}else if(location.protocol==='alsarh:'){const url=($('#alsarh-server-url')?.value||'').trim();if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(url)){toast('أدخل رابط HTTPS صحيحًا',true);return;}location.href='alsarh-config://'+encodeURIComponent(url);}else toast('الربط متاح من تطبيق أندرويد أو ويندوز');return;}
 if(action==='use-offline'){if(window.ALSARH_NATIVE?.useOffline)window.ALSARH_NATIVE.useOffline();else if(location.protocol==='https:')location.href='alsarh-offline://home';return;}
}
document.addEventListener('click',evt=>{const el=evt.target.closest('button,[data-action].sheet-overlay');if(el?.classList.contains('sheet-overlay')&&evt.target!==el)return;if(el)handleAction(el).catch(err=>toast(err.message,true));});
document.addEventListener('submit',evt=>{if(evt.target.id==='auth-form'){evt.preventDefault();submitAuth(evt.target);}if(evt.target.id==='edit-form'){evt.preventDefault();submitSheet(evt.target);}});
async function handleBackupFile(file){if(!file)return;try{if(file.size>10*1024*1024)throw Error('حجم ملف النسخة يتجاوز 10 ميجابايت');const b=JSON.parse(await file.text());if(b.format!=='alsarh.offline.v1')throw Error('هذا الملف ليس نسخة تجريبية معتمدة');if(state.user&&!confirm('استيراد البيانات سيغيّر سجلات المؤسسة. يجب استخدام مؤسسة جديدة فارغة. هل تريد المتابعة؟'))return;const r=await post('/import-offline',b);state.user=null;state.cache={};state.first=false;toast(r.needsLogin?'تمت الاستعادة، سجّل دخولك':'تم نقل البيانات');await initialize();}catch(err){toast(err.message||'تعذر قراءة الملف',true);}}
window.ALSARH_IMPORT_FILE=async raw=>{try{const b=JSON.parse(raw);if(b.format!=='alsarh.offline.v1')throw Error('نسخة غير صحيحة');await post('/import-offline',b);await initialize();}catch(ex){toast(ex.message,true);}};
document.addEventListener('change',evt=>{if(evt.target.id==='alsarh-backup-file')handleBackupFile(evt.target.files?.[0]);});
document.addEventListener('input',evt=>{if(evt.target.matches('[data-search]'))handleSearch(evt.target.value);});
if(!LOCAL&&'serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('/sw.js').catch(()=>{});
initialize();
