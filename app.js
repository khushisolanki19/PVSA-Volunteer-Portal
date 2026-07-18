const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQKz6Ril58G76jzZvk-O9KsxplQTDn-V8P_uNvZKr1WBvFIhBKCoEahSDOG45EHoeH/exec";

const state = {
  userId: null,
  coordinatorUnlocked: false,
  users: [
    { id:"y1", name:"Riana Jain", role:"Youth", age:15, hours:42, goal:100, email:"riana.jain@example.org", accessCode:"riana2026" },
    { id:"y2", name:"Khushi Solanki", role:"Youth", age:16, adultId:"a1", hours:31, goal:250, email:"khushi.solanki@example.org", accessCode:"khushi2026" },
    { id:"a1", name:"Rashi Solanki", role:"Adult", youthIds:["y2"], familyId:"solanki", leadProjects:["p1"], hours:18, goal:52, email:"rashi.solanki@example.org", accessCode:"rashi2026" },
    { id:"c1", name:"Prassana Jain", role:"Coordinator", hours:0, goal:100, email:"coordinator@example.org", accessCode:"jcnc2026" }
  ],
  projects: [
    { id:"p1", title:"Second Harvest Food Bank", type:"Hunger Relief", date:"2026-08-02", time:"9:00 AM–1:00 PM", location:"Second Harvest Warehouse", slots:12, status:"Open", hours:4, leadId:"a1", description:"Sort and pack nutritious groceries for local families through Second Harvest.", signups:["y1","y2","a1"], waitlist:[], checkedIn:[] },
    { id:"p2", title:"Habitat for Humanity", type:"Community Building", date:"2026-08-16", time:"8:30 AM–11:30 AM", location:"Fremont Build Site", slots:8, status:"Open", hours:3, leadId:"a1", description:"Support a Habitat for Humanity build and help prepare materials for volunteers.", signups:["y2","a1"], waitlist:[], checkedIn:[] },
    { id:"p3", title:"Community Donation Drive", type:"Donation Drive", date:"2026-09-05", time:"10:00 AM–2:00 PM", location:"JCNC Main Hall", slots:20, status:"Upcoming", signupDate:"2026-08-20", hours:4, leadId:"a1", description:"Collect, sort, and prepare donated essentials for neighbors in need.", signups:[], waitlist:[], checkedIn:[] },
    { id:"p4", title:"Second Harvest Volunteer Shift", type:"Hunger Relief", date:"2026-07-12", time:"1:00 PM–4:00 PM", location:"Second Harvest Warehouse", slots:6, status:"Completed", hours:3, leadId:"a1", description:"Pack food boxes and prepare pantry orders for distribution.", signups:["y1","a1"], waitlist:[], checkedIn:["y1","a1"], attendance:{y1:{lateMinutes:20,note:"Parent let us know Riana arrived late because of a school event."},a1:{lateMinutes:0,note:""}} }
  ],
  logs: [
    { id:"h1", userId:"y1", projectId:"p4", date:"2026-07-12", hours:3, status:"Pending", label:"Completed assigned tech-help station." },
    { id:"h2", userId:"a1", projectId:"p2", date:"2026-07-01", hours:2.5, status:"Approved", label:"Planning & supplies" },
    { id:"h3", userId:"y2", projectId:"p1", date:"2026-07-16", hours:1.5, status:"Pending", label:"Project preparation" }
  ]
};

const $ = (s) => document.querySelector(s);
const currentUser = () => state.users.find(u => u.id === state.userId);
const project = id => state.projects.find(p => p.id === id);
const user = id => state.users.find(u => u.id === id);
const fmtDate = value => new Intl.DateTimeFormat("en-US", {month:"short",day:"numeric",year:"numeric"}).format(new Date(value + "T12:00:00"));
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".bottom-nav button").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));
  syncExistingHours();
});

function renderAll() { renderHome(); renderProjects(); renderHours(); renderManage(); }

function emailSignIn(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const email = formData.get('email').trim().toLowerCase();
  const accessCode = formData.get('accessCode');
  const account = state.users.find(u => u.email.toLowerCase() === email);
  const error = $('#login-error');
  if (!account) { error.textContent='No invited volunteer account uses that email. Ask a coordinator to add you.'; error.classList.remove('hidden'); return; }
  if (account.accessCode !== accessCode) { error.textContent='That access code is incorrect. Codes are case-sensitive.'; error.classList.remove('hidden'); return; }
  error.classList.add('hidden');
  if (account.role === 'Coordinator') state.coordinatorUnlocked = true;
  state.userId = account.id;
  $('#login-screen').classList.add('hidden');
  $('#account-area').innerHTML = `<div class="signed-account"><span>${escapeHtml(account.name)}<small>${account.role}</small></span><button onclick="signOut()">Sign out</button></div>`;
  renderAll(); showView('home');
}
function signOut(){state.userId=null;state.coordinatorUnlocked=false;$('#login-screen').classList.remove('hidden');$('#account-area').innerHTML='';document.querySelectorAll('.view').forEach(v=>v.innerHTML='');}

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $(`#${name}-view`).classList.remove("hidden");
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderHome() {
  const u = currentUser();
  const poolIds = u.role === 'Adult' && u.familyId ? state.users.filter(member=>member.role==='Adult'&&member.familyId===u.familyId).map(member=>member.id) : [u.id];
  const approved = state.logs.filter(l => poolIds.includes(l.userId) && l.status === "Approved").reduce((n,l) => n + l.hours, poolIds.reduce((n,id)=>n+(user(id)?.hours||0),0));
  const pct = Math.min(100, Math.round(approved / u.goal * 100));
  const joined = state.projects.filter(p => p.signups.includes(u.id) && p.status !== "Completed");
  $("#home-view").innerHTML = `
    <div class="hero"><div><p class="eyebrow">2026–27 program</p><h1>Hello, ${escapeHtml(u.name.split(" ")[0])}</h1><p>${u.role === "Coordinator" ? "Here’s what needs your attention today." : "Every hour makes a difference."}</p></div><span class="avatar">${u.name.split(" ").map(x=>x[0]).join("")}</span></div>
    <div class="stats-grid">
      <article class="card progress-card"><div class="card-head"><div><p class="label">${u.role==='Adult'?'Combined parent service':'Approved service'}</p><h2>${approved} <small>hours</small></h2></div><span class="award">${pct >= 100 ? "★" : "↗"}</span></div><div class="progress"><i style="width:${pct}%"></i></div><div class="progress-meta"><span>${pct}% of ${u.goal} hour goal${u.role==='Adult'?' shared between parents':''}</span><b>${Math.max(0,u.goal-approved)} to go</b></div></article>
      <article class="mini-card"><b>${joined.length}</b><span>Upcoming signups</span></article><article class="mini-card"><b>${state.logs.filter(l=>l.userId===u.id&&l.status==='Pending').length}</b><span>Hours pending</span></article>
    </div>
    ${calendarSection()}
    ${u.youthIds?.length ? `<section><div class="section-title"><h2>Linked family</h2></div>${u.youthIds.map(id => { const y=user(id); return `<div class="family-card"><span class="avatar small">${y.name.split(' ').map(x=>x[0]).join('')}</span><span><b>${y.name}</b><small>You can sign ${y.name.split(' ')[0]} up from each project page</small></span></div>`}).join('')}</section>` : ""}
    <section><div class="section-title"><h2>Your next projects</h2><button onclick="showView('projects')">View all</button></div>${joined.length ? joined.slice(0,2).map(projectCard).join("") : `<div class="empty"><span>◇</span><b>No upcoming signups</b><p>Explore projects and choose a way to help.</p><button class="primary" onclick="showView('projects')">Browse projects</button></div>`}</section>`;
}

function renderProjects(filter="all") {
  const projects = filter === "all" ? state.projects : state.projects.filter(p => p.status === filter);
  $("#projects-view").innerHTML = `<div class="page-title"><div><p class="eyebrow">Discover</p><h1>Volunteer projects</h1></div></div><div class="filters">${["all","Open","Upcoming","Completed"].map(f=>`<button class="${filter===f?'selected':''}" onclick="renderProjects('${f}')">${f==='all'?'All':f}</button>`).join('')}</div><div class="project-list">${projects.map(projectCard).join('') || '<div class="empty">No projects here yet.</div>'}</div>`;
}

function projectCard(p) {
  const signed = p.signups.includes(state.userId), wait = p.waitlist.includes(state.userId), left = Math.max(0,p.slots-p.signups.length);
  return `<article class="project-card" onclick="openProject('${p.id}')"><div class="date-tile"><b>${new Date(p.date+'T12:00:00').toLocaleString('en',{month:'short'})}</b><strong>${new Date(p.date+'T12:00:00').getDate()}</strong></div><div class="project-info"><div class="badge-row"><span class="badge ${p.status.toLowerCase()}">${p.status}</span><span>${escapeHtml(p.type)}</span></div><h3>${escapeHtml(p.title)}</h3><p>${p.time} · ${escapeHtml(p.location)}</p><div class="slot-row"><span>${signed?'✓ You’re signed up':wait?'Waitlist':p.status==='Open'?`${left} of ${p.slots} spots left`:`${p.signups.length} volunteers`}</span><span>›</span></div></div></article>`;
}

function openProject(id) {
  const p=project(id), u=currentUser();
  const canAttend = p.leadId===u.id || u.role==='Coordinator';
  const eligible = linkedSignupAccounts(u);
  openDialog(`<p class="eyebrow">${escapeHtml(p.type)}</p><h2>${escapeHtml(p.title)}</h2><p class="dialog-lead">${escapeHtml(p.description)}</p><dl class="details"><div><dt>Date & time</dt><dd>${fmtDate(p.date)}<br>${p.time}</dd></div><div><dt>Location</dt><dd>${escapeHtml(p.location)}</dd></div><div><dt>Project lead</dt><dd>${escapeHtml(user(p.leadId)?.name || 'To be assigned')}</dd></div><div><dt>Service credit</dt><dd>${p.hours} hours</dd></div></dl><div class="capacity"><span><b>${p.signups.length}/${p.slots}</b> spots filled</span><div class="progress"><i style="width:${Math.min(100,p.signups.length/p.slots*100)}%"></i></div></div>${p.status==='Open' ? `<div class="signup-family"><b>Who are you signing up?</b>${eligible.map(person=>signupControl(p,person)).join('')}</div>` : `<button class="secondary wide" disabled>${p.status==='Upcoming'?'Signup opens '+fmtDate(p.signupDate):p.status}</button>`}${canAttend && (p.status==='Open'||p.status==='Active') ? `<button class="secondary wide" onclick="attendance('${p.id}')">Take attendance</button>`:''}`);
}

function linkedSignupAccounts(u){const ids=[u.id,...(u.youthIds||[]),...(u.adultId?[u.adultId]:[])];return [...new Set(ids)].map(user).filter(Boolean);}
function signupControl(p,person){const signed=p.signups.includes(person.id),wait=p.waitlist.includes(person.id),full=p.signups.length>=p.slots;return `<div><span><b>${escapeHtml(person.name)}</b><small>${person.id===state.userId?'Your account':person.role==='Youth'?'Linked child':'Linked parent'}</small></span><button class="${signed||wait?'secondary':'primary'}" onclick="toggleSignup('${p.id}','${person.id}')">${signed?'Cancel':wait?'Leave waitlist':full?'Join waitlist':'Sign up'}</button></div>`;}

function toggleSignup(id,uid=state.userId) {
  if(!linkedSignupAccounts(currentUser()).some(u=>u.id===uid)) return toast('You can only sign up yourself or a linked family member.');
  const p=project(id);
  if (p.signups.includes(uid)) { p.signups=p.signups.filter(x=>x!==uid); if(p.waitlist.length) p.signups.push(p.waitlist.shift()); toast("Signup cancelled. The first waitlisted volunteer was promoted."); }
  else if (p.waitlist.includes(uid)) { p.waitlist=p.waitlist.filter(x=>x!==uid); toast("You left the waitlist."); }
  else if (p.signups.length>=p.slots) { p.waitlist.push(uid); toast("You’re on the waitlist."); }
  else { p.signups.push(uid); toast("You’re signed up!"); }
  closeDialog(); renderAll();
}

function calendarSection(){const u=currentUser();const events=u.role==='Coordinator'?state.projects:state.projects.filter(p=>p.signups.includes(u.id));return `<section><div class="section-title calendar-title"><div><p class="eyebrow">August 2026</p><h2>${u.role==='Coordinator'?'All-events calendar':'My calendar'}</h2></div><span>${events.length} events</span></div><div class="calendar"><div class="calendar-week">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<b>${d}</b>`).join('')}</div><div class="calendar-grid">${calendarDays(2026,7,events)}</div></div></section>`;}
function calendarDays(year,month,events){const first=new Date(year,month,1).getDay(),count=new Date(year,month+1,0).getDate();let html=Array(first).fill('<span class="blank"></span>').join('');for(let day=1;day<=count;day++){const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,matches=events.filter(p=>p.date===date);html+=`<button class="calendar-day ${matches.length?'has-event':''}" ${matches.length?`onclick="openProject('${matches[0].id}')"`:''}><b>${day}</b>${matches.map(p=>`<i title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</i>`).join('')}</button>`;}return html;}

function attendance(id) {
  const p=project(id);
  p.attendance ||= {};
  openDialog(`<p class="eyebrow">Project lead / Parent notes</p><h2>Attendance</h2><p class="dialog-lead">${escapeHtml(p.title)} · ${fmtDate(p.date)}</p><div class="attendance-list">${p.signups.map(uid=>{const u=user(uid),a=p.attendance[uid]||{};return `<div class="attendance-entry"><label><span class="avatar small">${u.name.split(' ').map(x=>x[0]).join('')}</span><span><b>${u.name}</b><small>${u.role}</small></span><input type="checkbox" ${p.checkedIn.includes(uid)?'checked':''} onchange="checkIn('${id}','${uid}',this.checked)"></label><div class="attendance-fields"><label>Minutes late<input type="number" min="0" step="5" value="${a.lateMinutes||0}" onchange="setAttendanceDetail('${id}','${uid}','lateMinutes',this.value)"></label><label>Lead / parent note<textarea placeholder="Reason for lateness, early pickup, or other note" onchange="setAttendanceDetail('${id}','${uid}','note',this.value)">${escapeHtml(a.note||'')}</textarea></label></div></div>`}).join('')}</div><button class="primary wide" onclick="closeDialog();toast('Attendance and notes saved to the project record.')">Save attendance</button>`);
}

function checkIn(pid,uid,checked) { const p=project(pid); p.checkedIn=checked?[...new Set([...p.checkedIn,uid])]:p.checkedIn.filter(x=>x!==uid); }
function setAttendanceDetail(pid,uid,key,value) { const p=project(pid); p.attendance ||= {}; p.attendance[uid] ||= {}; p.attendance[uid][key] = key === 'lateMinutes' ? Math.max(0,Number(value)||0) : value; }

function renderHours() {
  const u=currentUser(), logs=state.logs.filter(l=>u.role==='Coordinator'||l.userId===u.id);
  $("#hours-view").innerHTML=`<div class="page-title"><div><p class="eyebrow">Service record</p><h1>${u.role==='Coordinator'?'Validate volunteer hours':'My hours'}</h1></div>${u.role==='Coordinator'?'':'<button class="primary compact" onclick="hourForm()">+ Add</button>'}</div>${u.role==='Coordinator'?'<p class="review-help">Compare each request with the project signup and attendance sheet. Open Review to adjust credit for lateness or notes before validating.</p>':''}<div class="summary-strip"><div><b>${logs.filter(l=>l.status==='Approved').reduce((n,l)=>n+l.hours,0)}</b><span>Approved</span></div><div><b>${logs.filter(l=>l.status==='Pending').reduce((n,l)=>n+l.hours,0)}</b><span>Pending</span></div></div><div class="log-list">${logs.map(l=>{const p=project(l.projectId);return `<article class="log-card"><div><b>${escapeHtml(p?.title||l.label||'Volunteer service')}</b><span>${fmtDate(l.date)}${u.role==='Coordinator'?' · '+user(l.userId)?.name:''}</span></div><strong>${l.hours}h</strong><span class="status ${l.status.toLowerCase()}">${l.status}</span>${u.role==='Coordinator'&&l.status==='Pending'?`<button onclick="reviewLog('${l.id}')">Review</button>`:''}</article>`}).join('')||'<div class="empty">No hours recorded yet.</div>'}</div>`;
}

function hourForm() { openDialog(`<p class="eyebrow">Service record</p><h2>Submit volunteer hours</h2><form onsubmit="submitHours(event)"><label>Project<select name="projectId" required>${state.projects.map(p=>`<option value="${p.id}">${escapeHtml(p.title)}</option>`).join('')}</select></label><label>Date<input type="date" name="date" required value="${new Date().toISOString().slice(0,10)}"></label><label>Hours<input type="number" name="hours" min="0.5" max="24" step="0.5" required></label><label>Note<textarea name="label" placeholder="What did you work on?"></textarea></label><button class="primary wide" type="submit">Submit for approval</button></form>`); }
function submitHours(e) { e.preventDefault(); const d=new FormData(e.target); state.logs.unshift({id:'h'+Date.now(),userId:state.userId,projectId:d.get('projectId'),date:d.get('date'),hours:Number(d.get('hours')),label:d.get('label'),status:'Pending'}); closeDialog();renderAll();toast('Hours submitted for coordinator approval.'); }
function reviewLog(id) {
  const l=state.logs.find(x=>x.id===id), p=project(l.projectId), volunteer=user(l.userId);
  const signed=p?.signups.includes(l.userId), checked=p?.checkedIn.includes(l.userId), detail=p?.attendance?.[l.userId]||{};
  openDialog(`<p class="eyebrow">Coordinator validation</p><h2>${escapeHtml(volunteer?.name)}</h2><p class="dialog-lead">${escapeHtml(p?.title||'Volunteer service')} · ${fmtDate(l.date)}</p><div class="verification-grid"><div><span>Signup sheet</span><b class="${signed?'good':'warning'}">${signed?'✓ Signed up':'Not listed'}</b></div><div><span>Attendance</span><b class="${checked?'good':'warning'}">${checked?'✓ Checked in':'Not checked in'}</b></div><div><span>Project hours</span><b>${p?.hours||'—'} hours</b></div><div><span>Submitted</span><b>${l.hours} hours</b></div></div>${detail.lateMinutes?`<div class="review-alert"><b>${detail.lateMinutes} minutes late</b><span>Consider reducing the credited hours.</span></div>`:''}<div class="review-note"><b>Lead / parent note</b><p>${escapeHtml(detail.note||'No note was recorded.')}</p></div>${l.label?`<div class="review-note"><b>Volunteer note</b><p>${escapeHtml(l.label)}</p></div>`:''}<form onsubmit="validateHours(event,'${l.id}')"><label>Final credited hours<input name="hours" type="number" min="0" max="${Math.max(l.hours,p?.hours||0)}" step="0.25" value="${l.hours}" required><small>Decrease this if the volunteer arrived late or left early.</small></label><label>Coordinator note<textarea name="coordinatorNote" placeholder="Why were the hours adjusted?">${escapeHtml(l.coordinatorNote||'')}</textarea></label><button class="primary wide" type="submit">Validate hours</button></form>`);
}
function validateHours(e,id) { e.preventDefault();const d=new FormData(e.target),l=state.logs.find(x=>x.id===id);l.submittedHours??=l.hours;l.hours=Number(d.get('hours'));l.coordinatorNote=d.get('coordinatorNote');l.status='Approved';closeDialog();renderAll();toast(`Validated ${l.hours} volunteer hours.`); }

function renderManage() {
  const u=currentUser(), allowed=u.role==='Coordinator';
  $("#manage-tab").classList.toggle("hidden",!allowed);
  if(!allowed){$("#manage-view").innerHTML='';return;}
  const pending=state.logs.filter(l=>l.status==='Pending').length;
  $("#manage-view").innerHTML=`<div class="page-title"><div><p class="eyebrow">Coordinator</p><h1>Program management</h1></div></div><div class="admin-grid"><button onclick="projectForm()"><span>＋</span><b>Create project</b><small>Dates, slots and lead</small></button><button onclick="showView('hours')"><span>✓</span><b>Hour approvals</b><small>${pending} waiting</small></button><button onclick="memberDirectory()"><span>♙</span><b>Members</b><small>${state.users.length} enrolled</small></button><button onclick="exportReport()"><span>⇩</span><b>Export report</b><small>PVSA-ready CSV</small></button></div><section><div class="section-title"><h2>Project overview</h2></div>${state.projects.map(p=>`<article class="manage-row"><span class="badge ${p.status.toLowerCase()}">${p.status}</span><div><b>${escapeHtml(p.title)}</b><small>${fmtDate(p.date)} · ${p.signups.length}/${p.slots} signed up</small></div><button onclick="openProject('${p.id}')">View</button></article>`).join('')}</section>`;
}

function projectForm(){openDialog(`<p class="eyebrow">Coordinator</p><h2>Create a project</h2><form onsubmit="createProject(event)"><label>Project name<input name="title" required></label><div class="form-row"><label>Date<input name="date" type="date" required></label><label>Slots<input name="slots" type="number" min="1" value="10" required></label></div><label>Location<input name="location" required></label><label>Description<textarea name="description" required></textarea></label><button class="primary wide" type="submit">Create project</button></form>`)}
function createProject(e){e.preventDefault();const d=new FormData(e.target);state.projects.unshift({id:'p'+Date.now(),title:d.get('title'),type:'Community',date:d.get('date'),time:'Time TBD',location:d.get('location'),slots:Number(d.get('slots')),status:'Upcoming',hours:0,leadId:'',description:d.get('description'),signups:[],waitlist:[],checkedIn:[]});closeDialog();renderAll();toast('Project created as Upcoming.');}
function memberDirectory(){openDialog(`<p class="eyebrow">Private · Coordinators only</p><h2>Member directory</h2><p class="dialog-lead">Invite new members and manage linked families.</p><button class="primary wide" onclick="addMemberForm()">+ Add a new member</button><div class="member-list">${state.users.map(u=>`<div><span class="avatar small">${u.name.split(' ').map(x=>x[0]).join('')}</span><span><b>${u.name}</b><small>${u.role} · ${u.email}${u.goal?` · ${u.goal}h goal`:''}</small></span></div>`).join('')}</div>`)}
function addMemberForm(){const adults=state.users.filter(u=>u.role==='Adult');openDialog(`<p class="eyebrow">Coordinator enrollment</p><h2>Add a member</h2><form onsubmit="addMember(event)"><label>Full name<input name="name" required autocomplete="name"></label><div class="form-row"><label>Account type<select name="role" required onchange="toggleYouthFields(this.value)"><option value="Youth">Youth</option><option value="Adult">Adult</option></select></label><label>Date of birth<input name="dob" type="date" required></label></div><label>Email address<input name="email" type="email" required autocomplete="email"></label><label>Temporary private access code<input name="accessCode" minlength="8" required placeholder="At least 8 characters"><small>Share this privately. The member uses it with their email.</small></label><label id="parent-link-field">Linked parent or guardian<select name="adultId"><option value="">Select a parent</option>${adults.map(a=>`<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('')}</select></label><button class="primary wide" type="submit">Add member and send to Sheet</button></form>`)}
function toggleYouthFields(role){$('#parent-link-field')?.classList.toggle('hidden',role!=='Youth');}
function addMember(e){e.preventDefault();const d=new FormData(e.target),email=d.get('email').trim().toLowerCase();if(state.users.some(u=>u.email.toLowerCase()===email))return toast('A member already uses that email.');const dob=d.get('dob'),age=calculateAge(dob),role=d.get('role'),adultId=role==='Youth'?d.get('adultId'):'';if(role==='Youth'&&!adultId)return toast('Every Youth must have a linked parent or guardian.');const id=(role==='Youth'?'y':'a')+Date.now(),member={id,name:d.get('name').trim(),role,dob,age,email,accessCode:d.get('accessCode'),hours:0,goal:role==='Adult'?52:age>=16?250:100};if(adultId){member.adultId=adultId;const adult=user(adultId);adult.youthIds=[...new Set([...(adult.youthIds||[]),id])];member.familyId=adult.familyId||`family-${adult.id}`;adult.familyId=member.familyId;}if(role==='Adult'){member.youthIds=[];member.familyId=`family-${id}`;}state.users.push(member);fetch(APPS_SCRIPT_URL,{method:'POST',mode:'no-cors',body:JSON.stringify({action:'addMember',member})}).catch(()=>{});closeDialog();renderAll();toast(`${member.name} was added and can now sign in.`);}
function calculateAge(dob){const today=new Date(),birth=new Date(dob+'T12:00:00');let age=today.getFullYear()-birth.getFullYear();if(today.getMonth()<birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()<birth.getDate()))age--;return age;}
function exportReport(){const rows=['Volunteer,Role,Approved Hours',...state.users.map(u=>`${u.name},${u.role},${state.logs.filter(l=>l.userId===u.id&&l.status==='Approved').reduce((n,l)=>n+l.hours,u.hours||0)}`)];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download='jcnc-pvsa-hours.csv';a.click();URL.revokeObjectURL(a.href);toast('PVSA hours report exported.');}

function openDialog(html){$("#dialog-body").innerHTML=html;$("#app-dialog").showModal();}
function closeDialog(){$("#app-dialog").close();}
function toast(message){const t=$("#toast");t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);}

async function syncExistingHours(){try{const res=await fetch(APPS_SCRIPT_URL+'?action=getAllData');if(!res.ok)return;const rows=await res.json();if(!Array.isArray(rows))return;/* Existing Sheet data remains readable; expanded project actions need matching Apps Script endpoints. */}catch(_){/* Demo remains usable if the Sheet bridge is unavailable. */}}
