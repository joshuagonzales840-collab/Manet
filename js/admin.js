const me=S(),ask=(m,d='')=>prompt(m,d),ID=(p,l)=>p+'-'+String(l.length+1).padStart(2,'0');
DB.settings=DB.settings||{maintenance:0,autoNotify:1,maxQty:4};
const B=(a,id,t,c='')=>`<button class="btn sm ${c}" data-a="${a}" data-id="${id}">${t}</button>`;
shell({role:'admin',menu:[['Dashboard','🏠'],['Users','👥'],['Staff','🧑‍💼'],['Companies','🏢'],['Concerts','🎤'],['Tickets','🎫'],['Ticket Stock','📦'],['Transactions','💳'],['Requests','📝'],['Reports','📊'],['Audit Logs','🕵️'],['System Settings','⚙️']],
panel(p){const R=DB.requests,n=s=>R.filter(r=>r.status==s).length,cm=`<div class="card">`,ce='</div>';
if(p=='Dashboard')return grid([['Total Users',DB.users.length],['Total Staff',DB.staff.length],['Active Concerts',DB.concerts.filter(c=>c.pub).length],['Available Tickets',DB.concerts.reduce((s,c)=>s+left(c),0)],['Pending Requests',n('Pending')],['Transactions',R.length],['Released Tickets',n('Released')],['Cancelled Tickets',n('Cancelled')]]);
if(p=='Users')return cm+tbl(['User ID','Name','Email','Status','Verification','Registered','Actions'],DB.users.map(u=>[u.id,u.name,u.email,tag(u.active?'Active':'Inactive'),tag(u.idOk&&u.faceOk?'Verified':'Pending'),u.date,B('uv',u.id,'View')+B('ue',u.id,'Edit')+B('ut',u.id,u.active?'Deactivate':'Activate','bad')]))+ce;
if(p=='Staff')return`<p style="margin-bottom:12px">${B('sa','','+ Add Staff')} <span class="muted">Only Admin can create staff accounts.</span></p>`+cm+tbl(['ID','Name','Email','Status','Actions'],DB.staff.map(s=>[s.id,s.name,s.email,tag(s.active?'Active':'Inactive'),B('se',s.id,'Edit')+B('st',s.id,s.active?'Deactivate':'Activate','bad')+B('sp',s.id,'Reset Password','out')]))+ce;
if(p=='Companies')return`<p style="margin-bottom:12px">${B('ca','','+ Add Company')}</p>`+cm+tbl(['ID','Company','Contact','Actions'],DB.companies.map(c=>[c.id,c.name,c.contact,B('cd',c.id,'Delete','bad')]))+ce;
if(p=='Concerts')return`<p style="margin-bottom:12px">${B('coa','','+ Add Concert')}</p>`+cm+tbl(['Artist','Concert','Date','Time','Venue','Categories / Prices','Published','Actions'],DB.concerts.map(c=>[c.artist,c.name,c.date,c.time,c.venue,c.cats.map(k=>k.n+' '+P(k.p)).join(', '),tag(c.pub?'Active':'Inactive'),B('coe',c.id,'Edit')+B('cop',c.id,c.pub?'Unpublish':'Publish','out')+B('cod',c.id,'Delete','bad')]))+ce;
if(p=='Tickets'||p=='Ticket Stock')return cm+tbl(['Concert','Category','Price','Total','Held','Released','Remaining','Usage'],DB.concerts.flatMap(c=>c.cats.map(k=>[c.name,k.n,P(k.p),k.t,k.h,k.r,rem(k),bar(k.h+k.r,k.t)])))+ce;
if(p=='Transactions')return cm+tbl(['Transaction ID','Customer','Concert','Ticket','Amount','Status','Date','Staff','Actions'],R.map(r=>['T-'+r.id.slice(2),r.name,con(r.cid).name,r.cat+' ×'+r.qty,P(price(r)),tag(r.status),r.date,'Staff Demo',B('tv',r.id,'View')]))+ce;
if(p=='Requests')return cm+tbl(['Request','Customer','Concert','Category','Qty','Status'],R.map(r=>[r.id,r.name,con(r.cid).name,r.cat,r.qty,tag(r.status)]))+ce;
if(p=='Reports'){const rows=[['Ticket Requests',R.length],['Transactions',R.length],['Released Tickets',n('Released')],['Cancelled Tickets',n('Cancelled')],['User Activity',DB.logs.filter(l=>l[1]=='User').length],['Staff Activity',DB.logs.filter(l=>l[1]=='Staff').length],['Ticket Stock Remaining',DB.concerts.reduce((s,c)=>s+left(c),0)]];return grid(rows.slice(0,6))+'<h2>Overview</h2>'+cm+rows.map(r=>`<p>${r[0]} <b>${r[1]}</b></p>${bar(r[1],Math.max(...rows.slice(0,6).map(x=>x[1]))||1)}<br>`).join('')+ce}
if(p=='Audit Logs')return cm+tbl(['Date / Time','User / Staff / Admin','Action','Module','Description'],DB.logs)+ce;
const s=DB.settings;return cm+`<p>Maintenance mode: ${B('set','maintenance',s.maintenance?'ON':'OFF','out')}</p><br><p>Auto-notify customers: ${B('set','autoNotify',s.autoNotify?'ON':'OFF','out')}</p><br><p>Max tickets per request: <b>${s.maxQty}</b> ${B('set','maxQty','Change')}</p><br>${B('reset','','Reset Demo Data','bad')}`+ce},
act(a,id){const A=(x,m,d)=>log('Admin',x,m,d),f=(l,i)=>l.find(x=>x.id==i);
if(a=='uv'){const u=f(DB.users,id);modal(`<h3>${u.name}</h3><p>${u.email}<br>ID: ${u.idOk?'✓':'✗'} · Face: ${u.faceOk?'✓':'✗'} · Policy: ${u.policy?'✓':'✗'}</p>`)}
if(a=='ue'){const u=f(DB.users,id),n=ask('Full name',u.name);if(n){u.name=n;A('Edited User','User Management',id)}}
if(a=='ut'){const u=f(DB.users,id);u.active=u.active?0:1;A(u.active?'Activated User':'Deactivated User','User Management',id)}
if(a=='sa'){const n=ask('Staff name'),e=ask('Staff email');if(n&&e){DB.staff.push({id:ID('S',DB.staff),name:n,email:e,pw:'staff123',active:1});A('Added Staff','Staff Management',e)}}
if(a=='se'){const s=f(DB.staff,id),n=ask('Name',s.name);if(n){s.name=n;A('Edited Staff','Staff Management',id)}}
if(a=='st'){const s=f(DB.staff,id);s.active=s.active?0:1;A('Toggled Staff','Staff Management',id)}
if(a=='sp'){f(DB.staff,id).pw='staff123';A('Reset Staff Password','Staff Management',id);toast('Password reset to staff123 (demo)')}
if(a=='ca'){const n=ask('Company name'),c=ask('Contact email');if(n){DB.companies.push({id:ID('C',DB.companies),name:n,contact:c||''});A('Added Company','Companies',n)}}
if(a=='cd'){DB.companies=DB.companies.filter(c=>c.id!=id);A('Deleted Company','Companies',id)}
if(a=='coa'){const ar=ask('Artist'),nm=ask('Concert name'),d=ask('Date (YYYY-MM-DD)'),t=ask('Time (HH:MM)','19:00'),v=ask('Venue'),pr=+ask('Ticket price (PHP)','3000'),st=+ask('Ticket stock','500'),an=ask('Announcement');if(ar&&nm&&d)DB.concerts.push({id:Date.now()%1e6,artist:ar,name:nm,date:d,time:t,venue:v||'TBA',pub:1,g:['#7c3aed','#f472b6'],desc:'New concert.',why:'Fan event.',ann:an||'New concert announced.',cats:[{n:'General Admission',p:pr||3000,t:st||500,h:0,r:0}]}),A('Added Concert','Concert Management',nm)}
if(a=='coe'){const c=con(id),n=ask('Concert name',c.name),v=ask('Venue',c.venue);if(n){c.name=n;c.venue=v||c.venue;A('Edited Concert','Concert Management',n)}}
if(a=='cop'){const c=con(id);c.pub=c.pub?0:1;A(c.pub?'Published Concert':'Unpublished Concert','Concert Management',c.name)}
if(a=='cod'&&confirm('Delete this concert?')){DB.concerts=DB.concerts.filter(c=>c.id!=id);A('Deleted Concert','Concert Management',id)}
if(a=='tv'){const r=DB.requests.find(x=>x.id==id);modal(`<h3>T-${id.slice(2)}</h3><p>${r.name}<br>${con(r.cid).name}<br>${P(price(r))} ${tag(r.status)}</p>`)}
if(a=='set'){if(id=='maxQty'){const v=+ask('Max tickets per request',DB.settings.maxQty);if(v>0)DB.settings.maxQty=v}else DB.settings[id]=DB.settings[id]?0:1;A('Changed Setting','System Settings',id)}
if(a=='reset'&&confirm('Reset all demo data?')){DB=seed();DB.admins=[...DB.admins];save();location.reload()}}});
