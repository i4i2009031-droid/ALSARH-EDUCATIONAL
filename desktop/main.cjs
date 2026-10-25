'use strict';
const { app, BrowserWindow, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
let mainWindow;
const configPath = () => path.join(app.getPath('userData'),'settings.json');
function readURL(){try{const x=JSON.parse(fs.readFileSync(configPath(),'utf8')).url;return /^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(x)?x:null;}catch{return null;}}
function makeWindow(){mainWindow=new BrowserWindow({width:1200,height:820,minWidth:375,minHeight:620,autoHideMenuBar:true,title:'الصرح التعليمي',backgroundColor:'#f3f6fb',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,preload:undefined}});
 mainWindow.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//i.test(url))shell.openExternal(url);return {action:'deny'};});
 mainWindow.webContents.on('will-navigate',(event,url)=>{if(url.startsWith('alsarh-config://')){event.preventDefault();let chosen='';try{chosen=decodeURIComponent(url.substring('alsarh-config://'.length));}catch{return;}if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(chosen))return;const parsed=new URL(chosen);if(parsed.username||parsed.password||parsed.hostname==='example.com')return;fs.writeFileSync(configPath(),JSON.stringify({url:parsed.origin}),{mode:0o600});mainWindow.loadURL(parsed.origin);return;}const current=readURL();if(current && new URL(url).origin!==new URL(current).origin)event.preventDefault();});
 const url=readURL();if(url)mainWindow.loadURL(url);else mainWindow.loadFile(path.join(__dirname,'launcher.html'));
}
app.whenReady().then(()=>{makeWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)makeWindow();});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
