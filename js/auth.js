const cfg={user:['USER / FAN LOGIN','Email Address / Username','fan@ktix.com / fan123 (verified) — or sign up'],staff:['STAFF LOGIN','Staff ID / Email','Demo: staff@ktix.com / staff123 (accounts are created by Admin only)'],admin:['ADMIN LOGIN','Admin Email / Username','Demo: admin@ktix.com / admin123']};
const ff=$('#ff');if(ff)ff.onsubmit=e=>{e.preventDefault();if(!$('#fe').value.trim())return $('#er').textContent='Enter your email or username.';ff.innerHTML='<p style="color:var(--ok);font-weight:600">Password reset instructions have been sent.</p><a href="login.html" style="color:var(--pri)">Back to login</a>'};
if($('#lf')){let role='user';const saved=JSON.parse(localStorage.rem||'null');
function pick(r){role=r;$$('.role').forEach(x=>x.classList.toggle('on',x.dataset.r==r));$('#lt').textContent=cfg[r][0];$('#ll').textContent=cfg[r][1];$('#demo').textContent=cfg[r][2];$('#su').hidden=r!='user';$('#er').textContent='';if(saved&&saved.role==r){$('#id').value=saved.id;$('#rm').checked=1}else{$('#id').value='';$('#rm').checked=0}}
$$('.role').forEach(x=>x.onclick=()=>pick(x.dataset.r));pick(saved?saved.role:'user');
$('#eye').onclick=()=>{const p=$('#pw');p.type=p.type=='password'?'text':'password';$('#eye').setAttribute('aria-label',p.type=='password'?'Show password':'Hide password')};
$('#lf').onsubmit=e=>{e.preventDefault();const id=$('#id').value.trim().toLowerCase(),pw=$('#pw').value;if(!id||!pw)return $('#er').textContent='Please fill in all fields.';
if($('#rm').checked)localStorage.rem=JSON.stringify({role,id});else localStorage.removeItem('rem');
if(role=='user'){const u=DB.users.find(u=>(u.username==id||u.email==id)&&u.pw==pw);if(!u)return $('#er').textContent='Invalid credentials.';if(!u.active)return $('#er').textContent='Account deactivated.';setS({role,username:u.username,name:u.name});
location.href=!u.idOk?'id-verification.html':!u.faceOk?'face-verification.html':!u.policy?'privacy-policy.html':'user-dashboard.html'}
else{const l=role=='staff'?DB.staff:DB.admins,u=l.find(u=>u.email==id&&u.pw==pw&&u.active!==0);if(!u)return $('#er').textContent='Invalid credentials or inactive account.';setS({role,name:u.name});log(role=='staff'?'Staff':'Admin','Login','Authentication',u.email);location.href=role+'-dashboard.html'}}}
if($('#lf')&&sessionStorage.msg){toast(sessionStorage.msg);sessionStorage.removeItem('msg')}
