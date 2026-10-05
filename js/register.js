$('#rf').onsubmit=e=>{e.preventDefault();const v=i=>$('#'+i).value.trim(),er=m=>$('#er').textContent=m;
if(['fn','un','em','mb','db','ad','p1'].some(i=>!v(i)))return er('Please fill in all fields.');
if(!/^\S+@\S+\.\S+$/.test(v('em')))return er('Enter a valid email.');if(!/^[0-9+\- ]{7,15}$/.test(v('mb')))return er('Enter a valid mobile number.');
if($('#p1').value.length<8)return er('Password must be at least 8 characters.');if($('#p1').value!=$('#p2').value)return er('Passwords do not match.');
if(DB.users.some(u=>u.username==v('un').toLowerCase()||u.email==v('em').toLowerCase()))return er('Username or email already exists.');
DB.users.push({id:'U-00'+(DB.users.length+1),username:v('un').toLowerCase(),name:v('fn'),email:v('em').toLowerCase(),pw:$('#p1').value,active:1,idOk:0,faceOk:0,policy:0,date:now().slice(0,10)});save();log('User','Registered','Authentication',v('un'));setS({role:'user',username:v('un').toLowerCase(),name:v('fn')});location.href='id-verification.html'};
