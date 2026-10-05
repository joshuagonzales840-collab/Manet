const me=S(),reqs=()=>DB.requests,usr=r=>DB.users.find(x=>x.username==r.user)||{},cat=r=>con(r.cid)?.cats.find(k=>k.n==r.cat);
const acts=r=>['Released','Cancelled'].includes(r.status)?'—':`<button class="btn sm out" style="color:var(--pri)" data-a="v" data-id="${r.id}">View</button><button class="btn sm" data-a="vf" data-id="${r.id}">Verify</button><button class="btn sm ok" data-a="ap" data-id="${r.id}">Approve</button>${r.status=='Approved'?`<button class="btn sm" data-a="rl" data-id="${r.id}">Release</button>`:''}<button class="btn sm bad" data-a="cx" data-id="${r.id}">Cancel</button>`;
const T=(list,ac)=>`<div class="card">${tbl(['Request ID','Customer','Concert','Category','Qty','Verification','Transaction','Status','Action'],list.map(r=>[r.id,r.name,con(r.cid).name,r.cat,r.qty,usr(r).idOk&&usr(r).faceOk?tag('Verified'):tag('Pending'),P(price(r)),tag(r.status),ac?acts(r):'—']))}</div>`;
shell({role:'staff',menu:[['Dashboard','🏠'],['Pending Requests','⏳'],['Customer Verification','🪪'],['Transactions','💳'],['Ticket Stock','📦'],['Released Tickets','🎫'],['Cancelled Tickets','✖'],['Messages','✉️'],['Notifications','🔔'],['Transaction Records','🧾'],['Profile','👤']],
panel(p){const by=s=>reqs().filter(r=>s.includes(r.status)),open=by(['Pending','Under Review','Verified','Approved']);
if(p=='Dashboard')return grid([['Pending Requests',by(['Pending']).length],['Customers to Verify',by(['Pending','Under Review']).length],['Transactions Today',reqs().length],['Available Tickets',DB.concerts.reduce((s,c)=>s+left(c),0)],['Released Tickets',by(['Released']).length],['Cancelled Tickets',by(['Cancelled']).length]]);
if(p=='Pending Requests')return T(open,1);
if(p=='Customer Verification')return`<div class="grid">${by(['Pending','Under Review','Verified']).map(r=>{const x=usr(r);return`<div class="card"><h3>${r.name}</h3><p class="muted">${x.email||'—'}</p><p>Valid ID: ${x.idOk?'✓':'✗'} · Face: ${x.faceOk?'✓':'✗'}<br>Request: ${r.id} · ${r.cat} × ${r.qty}<br>${tag(r.status)}</p><button class="btn sm ok" data-a="vf" data-id="${r.id}">Verify Customer</button><button class="btn sm bad" data-a="cx" data-id="${r.id}">Reject</button><button class="btn sm" data-a="ap" data-id="${r.id}">Approve Request</button></div>`}).join('')||'<p class="muted">Nothing to verify.</p>'}</div>`;
if(p=='Transactions'||p=='Transaction Records')return T(reqs(),0);
if(p=='Ticket Stock')return`<div class="card">${tbl(['Concert','Category','Total','Held','Released','Remaining','Usage'],DB.concerts.flatMap(c=>c.cats.map(k=>[c.name,k.n,k.t,k.h,k.r,rem(k),bar(k.h+k.r,k.t)])))}</div>`;
if(p=='Released Tickets')return T(by(['Released']),0);if(p=='Cancelled Tickets')return T(by(['Cancelled']),0);
if(p=='Profile')return`<div class="card"><b>${me.name}</b><p class="muted">Staff accounts are managed by Admin.</p></div>`;
return`<div class="card">${DB.notes.map(n=>`<p style="padding:8px 0;border-bottom:1px solid #eee">${n}</p>`).join('')}</div>`},
act(a,id){const r=reqs().find(x=>x.id==id),k=cat(r),note=m=>{DB.notes.unshift(m);log('Staff',m,'Ticket Processing',id)};
if(a=='v')modal(`<h3>${r.id}</h3><p>${r.name}<br>${con(r.cid).name} — ${r.cat} × ${r.qty}<br>${P(price(r))} ${tag(r.status)}</p>`);
if(a=='vf'){r.status='Verified';note(`Request ${id} verified`)}
if(a=='ap'){if(r.status=='Approved')return;if(rem(k)<r.qty)return toast('Insufficient stock.');k.h+=r.qty;r.status='Approved';note(`Request ${id} approved`)}
if(a=='rl'){k.h-=r.qty;k.r+=r.qty;r.status='Released';note(`Ticket for ${id} released to customer`)}
if(a=='cx'){if(r.status=='Approved')k.h-=r.qty;r.status='Cancelled';note(`Request ${id} cancelled`)}}});
