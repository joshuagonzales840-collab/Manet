const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],P=n=>'₱'+Number(n).toLocaleString();
const C=(id,a,n,d,t,v,g,cats,desc,why,ann)=>({id,artist:a,name:n,date:d,time:t,venue:v,pub:1,g,cats,desc,why,ann});
const seed=()=>({concerts:[
C(1,'NOVA-9','Neon Horizon World Tour','2026-12-05','19:00','Philippine Arena, Bulacan',['#7c3aed','#f472b6'],[{n:'VIP',p:9500,t:200,h:40,r:60},{n:'Lower Box',p:6500,t:500,h:80,r:120},{n:'General Admission',p:3200,t:1200,h:150,r:300}],'NOVA-9 brings their world tour to Manila with a full-stage production.','Celebrating the group\'s 5th anniversary with fans.','Ticket requests close Nov 20.'),
C(2,'LUNARIS','Moonlit Fanmeet','2027-01-16','17:00','SM Mall of Asia Arena',['#4c1d95','#60a5fa'],[{n:'Fanmeet Pass',p:7800,t:300,h:60,r:90},{n:'Upper Box',p:2800,t:800,h:100,r:200}],'An intimate fanmeet with games, mini-set and photo moments.','Thank-you event for Asian fans.','Limited stock: verified accounts only.'),
C(3,'ATLAS BOYS','Rise Again Live','2027-02-21','18:30','Araneta Coliseum',['#be185d','#7c3aed'],[{n:'Front Row',p:8800,t:150,h:20,r:130},{n:'General Admission',p:2500,t:1500,h:300,r:400}],'High-energy comeback concert with new album stages.','Comeback celebration after a 2-year hiatus.','Presale for verified fans opens Dec 1.')],
requests:[['R-1001','fan','Fan Demo',1,'VIP',2,'Pending'],['R-1002','fan','Fan Demo',2,'Upper Box',1,'Under Review'],['R-1003','jisoo','Jisoo Lee',1,'General Admission',4,'Verified'],['R-1004','fan','Fan Demo',3,'General Admission',2,'Released'],['R-1005','mina','Mina Cruz',3,'Front Row',1,'Cancelled']].map(a=>({id:a[0],user:a[1],name:a[2],cid:a[3],cat:a[4],qty:a[5],status:a[6],date:'2026-09-2'+a[5]})),
users:[{id:'U-001',username:'fan',name:'Fan Demo',email:'fan@ktix.com',pw:'fan123',active:1,idOk:1,faceOk:1,policy:1,date:'2026-08-01'},{id:'U-002',username:'jisoo',name:'Jisoo Lee',email:'jisoo@mail.com',pw:'x',active:1,idOk:1,faceOk:1,policy:1,date:'2026-08-14'}],
staff:[{id:'S-01',name:'Staff Demo',email:'staff@ktix.com',pw:'staff123',active:1}],admins:[{email:'admin@ktix.com',pw:'admin123',name:'Admin Manager'}],
companies:[{id:'C-1',name:'StarWave Entertainment',contact:'ops@starwave.com'},{id:'C-2',name:'Hallyu Live PH',contact:'hello@hallyulive.ph'}],
logs:[['2026-09-27 09:12','Admin','Added Concert','Concert Management','Published NOVA-9 tour'],['2026-09-27 10:30','User','Submitted Request','Ticket Request','R-1001 submitted']],
notes:['Your request R-1004 was released.','Concert announcement: ATLAS BOYS presale Dec 1.']});
let DB=JSON.parse(localStorage.ktix||'null')||seed();const save=()=>localStorage.ktix=JSON.stringify(DB);
const S=()=>JSON.parse(sessionStorage.ses||'null'),setS=s=>sessionStorage.ses=JSON.stringify(s);
const now=()=>new Date().toISOString().slice(0,16).replace('T',' ');
const log=(w,a,m,d)=>{DB.logs.unshift([now(),w,a,m,d]);save()};
const rem=c=>c.t-c.h-c.r,left=c=>c.cats.reduce((s,k)=>s+rem(k),0);
const avail=c=>{const n=left(c);return n>300?'Available':n>0?'Limited':'Sold out'};
const tag=s=>`<span class="tag ${s.split(' ')[0]}">${s}</span>`,con=id=>DB.concerts.find(c=>c.id==id);
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),2600)}
function modal(h){closeM();const m=document.createElement('div');m.className='modal';m.id='mod';m.innerHTML=`<div class="card">${h}<button class="btn out sm" onclick="closeM()" style="margin-top:12px;color:var(--pri)">Close</button></div>`;document.body.append(m)}
const closeM=()=>$('#mod')?.remove();
function pubNav(){const n=$('#nav');if(!n)return;const s=S();n.className='nav';n.innerHTML=`<div class="wrap"><a class="logo" href="index.html">K-Tix <b>Assist</b></a><button id="burger" class="ghost">☰</button><nav class="links" id="lk"><a href="index.html">Home</a><a href="index.html#concerts">Concerts</a><a href="index.html#news">Announcements</a><a href="index.html#how">How It Works</a><a href="index.html#about">About</a><a class="btn sm" href="${s?s.role+'-dashboard.html':'login.html'}">${s?'Dashboard':'Login'}</a></nav></div>`;$('#burger').onclick=()=>$('#lk').classList.toggle('show')}
function ccard(c){return`<div class="card"><div class="cimg" style="background:linear-gradient(135deg,${c.g})">${c.artist}</div><h3>${c.name}</h3><p class="muted">${c.date} · ${c.time}<br>${c.venue}</p><p style="margin:8px 0"><b>From ${P(Math.min(...c.cats.map(k=>k.p)))}</b> · ${c.cats.map(k=>k.n).join(', ')}<br>${tag(avail(c))} ${left(c)} left</p><button class="btn sm out" style="color:var(--pri)" data-view="${c.id}">View Details</button> <button class="btn sm" data-get="${c.id}">Get Ticket</button></div>`}
function getTicket(id){sessionStorage.intent=id;const s=S();location.href=s&&s.role=='user'?'user-dashboard.html':'login.html'}
document.addEventListener('click',e=>{const v=e.target.closest('[data-view]'),g=e.target.closest('[data-get]');if(v)location.href='concert-details.html?id='+v.dataset.view;if(g)getTicket(g.dataset.get)});
function guard(role){const s=S();if(!s||s.role!=role){location.replace('login.html');throw 0}}
function tbl(h,rows){return`<div class="tbl"><table><tr>${h.map(x=>`<th>${x}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')||'<tr><td>No records</td></tr>'}</table></div>`}
const stat=(l,n)=>`<div class="card stat"><span class="muted">${l}</span><b>${n}</b></div>`,grid=a=>`<div class="grid sm">${a.map(x=>stat(...x)).join('')}</div>`;
const bar=(v,t)=>`<div class="bar"><i style="width:${t?Math.round(v/t*100):0}%"></i></div>`;
const price=r=>{const k=con(r.cid)?.cats.find(k=>k.n==r.cat);return k?k.p*r.qty:0};
function shell(cfg){guard(cfg.role);let cur=cfg.menu[0][0];const s=S();
function draw(){$('#app').innerHTML=`<aside class="side" id="side"><a class="logo" href="index.html">K-Tix <b>Assist</b></a>${cfg.menu.map(([k,i])=>`<a href="#" data-p="${k}" class="${k==cur?'on':''}">${i} ${k}</a>`).join('')}<a href="#" data-p="Logout">⎋ Logout</a></aside><div class="main"><header class="top"><button id="tg" class="ghost">☰</button><input class="search" placeholder="Search..."><div class="dd"><button class="ghost" data-dd="n">🔔 <span class="dot">${DB.notes.length}</span></button><div class="menu" id="n">${DB.notes.map(n=>`<p>${n}</p>`).join('')}</div></div><div class="dd"><button class="ghost" data-dd="u">👤 ${s.name}</button><div class="menu" id="u"><a href="#" data-p="Profile">Profile</a><a href="#" data-p="Logout">Logout</a></div></div></header><main class="body"><h2 style="margin-top:0">${cur}</h2>${cfg.panel(cur)}</main></div>`}
draw();window.redraw=draw;
document.addEventListener('click',e=>{const p=e.target.closest('[data-p]'),d=e.target.closest('[data-dd]'),a=e.target.closest('[data-a]');
if(e.target.closest('#tg'))return $('#side').classList.toggle('open');
if(d){e.preventDefault();const m=$('#'+d.dataset.dd),o=m.classList.contains('show');$$('.menu').forEach(x=>x.classList.remove('show'));if(!o)m.classList.add('show');return}
if(!e.target.closest('.menu'))$$('.menu').forEach(x=>x.classList.remove('show'));
if(p){e.preventDefault();if(p.dataset.p=='Logout'){sessionStorage.removeItem('ses');return location.href='login.html'}cur=p.dataset.p;draw()}
if(a){cfg.act(a.dataset.a,a.dataset.id,a);save();draw()}});
window.goto=n=>{cur=n;draw()};if(cfg.init)cfg.init()}
