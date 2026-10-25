'use strict';
const { app, BrowserWindow, shell, protocol, net, Menu } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Secure standard origin makes IndexedDB stable across Windows restarts.
protocol.registerSchemesAsPrivileged([{scheme:'alsarh',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let mainWindow;
const configPath=()=>path.join(app.getPath('userData'),'settings.json');
const webPath=()=>app.isPackaged?path.join(process.resourcesPath,'web'):path.join(__dirname,'..','web');
function readURL(){try{const x=JSON.parse(fs.readFileSync(configPath(),'utf8')).url;return /^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(x)?x:null;}catch{return null;}}
function local(){mainWindow.loadURL('alsarh://app/index.html');}
function makeWindow(){
 mainWindow=new BrowserWindow({width:1200,height:820,minWidth:375,minHeight:620,autoHideMenuBar:true,title:'الصرح التعليمي',backgroundColor:'#f3f6fb',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 mainWindow.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//i.test(url))shell.openExternal(url);return {action:'deny'};});
 mainWindow.webContents.on('will-navigate',(event,url)=>{
  if(url.startsWith('alsarh-config://')){
   event.preventDefault();let chosen='';try{chosen=decodeURIComponent(url.slice('alsarh-config://'.length));}catch{return;}
   if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(chosen))return;
   const u=new URL(chosen);if(u.username||u.password||u.hostname==='example.com')return;
   fs.writeFileSync(configPath(),JSON.stringify({url:u.origin}),{mode:0o600});mainWindow.loadURL(u.origin);return;
  }
  if(url.startsWith('alsarh-offline://')){event.preventDefault();try{fs.unlinkSync(configPath());}catch{} local();return;}
  const target=readURL();if(target){if(new URL(url).origin!==target)event.preventDefault();}
  else if(!url.startsWith('alsarh://app/'))event.preventDefault();
 });
 const target=readURL();if(target)mainWindow.loadURL(target);else local();
}
app.whenReady().then(()=>{
 protocol.handle('alsarh',request=>{
  const url=new URL(request.url);
  if(url.host!=='app')return new Response('Forbidden',{status:403});
  let pathname=decodeURIComponent(url.pathname);
  if(pathname==='/')pathname='/index.html';
  if(!['/index.html','/app.js','/analytics.js','/offline.js','/styles.css','/logo.svg','/icon.svg','/manifest.webmanifest'].includes(pathname))return new Response('Not found',{status:404});
  return net.fetch(pathToFileURL(path.join(webPath(),pathname.slice(1))).toString());
 });
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'الصرح التعليمي',submenu:[{label:'التجربة المحلية (دون إنترنت)',click:()=>{try{fs.unlinkSync(configPath());}catch{}local();}},{role:'quit',label:'إغلاق'}]}]));
 makeWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)makeWindow();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
