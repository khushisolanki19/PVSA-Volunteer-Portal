const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQKz6Ril58G76jzZvk-O9KsxplQTDn-V8P_uNvZKr1WBvFIhBKCoEahSDOG45EHoeH/exec";

const state = {
  userId: "y1",
  coordinatorUnlocked: false,
  users: [
    { id:"y1", name:"Aarav Shah", role:"Youth", age:15, adultId:"a1", hours:42, goal:100, email:"aarav@example.org" },
    { id:"a1", name:"Neha Shah", role:"Adult", youthIds:["y1"], hours:18, goal:100, email:"neha@example.org" },
    { id:"l1", name:"Maya Mehta", role:"Adult", leadProjects:["p1"], hours:26, goal:100, email:"maya@example.org" },
    { id:"c1", name:"Prassana Jain", role:"Coordinator", hours:0, goal:100, email:"coordinator@example.org" }
  ],
  projects: [
    { id:"p1", title:"Community Food Drive", type:"Direct Service", date:"2026-08-02", time:"9:00 AM–1:00 PM", location:"JCNC Main Hall", slots:12, status:"Open", hours:4, leadId:"l1", description:"Sort and pack pantry staples for local families.", signups:["y1","a1","l1"], waitlist:[], checkedIn:[] },
    { id:"p2", title:"Temple Garden Cleanup", type:"Environmental", date:"2026-08-16", time:"8:30 AM–11:30 AM", location:"JCNC Garden", slots:8, status:"Open", hours:3, leadId:"a1", description:"Refresh garden beds and prepare the grounds for fall.", signups:["l1","a1"], waitlist:[], checkedIn:[] },
    { id:"p3", title:"Back-to-School Kit Assembly", type:"Community", date:"2026-09-05", time:"10:00 AM–2:00 PM", location:"Youth Center", slots:20, status:"Upcoming", signupDate:"2026-08-20", hours:4, leadId:"l1", description:"Assemble supply kits for students in our community.", signups:[], waitlist:[], checkedIn:[] },
    { id:"p4", title:"Senior Center Tech Help", type:"Direct Service", date:"2026-07-12", time:"1:00 PM–4:00 PM", location:"Fremont Senior Center", slots:6, status:"Completed", hours:3, leadId:"l1", description:"Help seniors learn everyday phone and tablet skills.", signups:["y1","l1"], waitlist:[], checkedIn:["y1","l1"], attendance:{y1:{lateMinutes:20,note:"Parent let us know Aarav arrived late because of a school event."},l1:{lateMinutes:0,note:""}} }
  ],
  logs: [
    { id:"h1", userId:"y1", projectId:"p4", date:"2026-07-12", hours:3, status:"Pending", label:"Completed assigned tech-help station." },
    { id:"h2", userId:"a1", projectId:"p2", date:"2026-07-01", hours:2.5, status:"Approved", label:"Planning & supplies" },
    { id:"h3", userId:"l1", projectId:"p1", date:"2026-07-16", hours:1.5, status:"Pending", label:"Project preparation" }
  ]
};

const $ = (s) => document.querySelector(s);
const currentUser = () => state.users.find(u => u.id === state.userId);
const project = id => state.projects.find(p => p.id === id);
const user = id => state.users.find(u => u.id === id);
const fmtDate = value => new Intl.DateTimeFormat("en-US", {month:"short",day:"numeric",year:"numeric"}).format(new Date(value + "T12:00:00"));
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

window.addEventListener("DOMContentLoaded", () => {
  $("#active-user").innerHTML = state.users.map(u => `<option value="${u.id}">${escapeHtml(u.name)} · ${u.role}</option>`).join("");
  $("#active-user").value = state.userId;
  $("#active-user").addEventListener("change", e => selectUser(e.target.value));
  document.querySelectorAll(".bottom-nav button").forEach(b => b.addEventListener("click", () => showView(b.dataset.view)));
  renderAll();
  syncExistingHours();
});

function renderAll() { renderHome(); renderProjects(); renderHours(); renderManage(); }

function selectUser(id) {
  const requested = user(id);
  if (requested?.role === "Coordinator" && !state.coordinatorUnlocked) {
    const password = prompt("Enter Coordinator Password:");
    if (password !== "jcnc2026") {
      $("#active-user").value = state.userId;
      if (password !== null) toast("Incorrect coordinator password.");
      return;
    }
    state.coordinatorUnlocked = true;
  }
  state.userId = id;
  renderAll();
  showView("home");
}

function showView(name) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $(`#${name}-view`).classList.remove("hidden");
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderHome() {
  const u = currentUser();
  const approved = state.logs.filter(l => l.userId === u.id && l.status === "Approved").reduce((n,l) => n + l.hours, u.hours || 0);
  const pct = Math.min(100, Math.round(approved / u.goal * 100));
  const joined = state.projects.filter(p => p.signups.includes(u.id) && p.status !== "Completed");
  $("#home-view").innerHTML = `
    <div class="hero"><div><p class="eyebrow">2026–27 program</p><h1>Hello, ${escapeHtml(u.name.split(" ")[0])}</h1><p>${u.role === "Coordinator" ? "Here’s what needs your attention today." : "Every hour makes a difference."}</p></div><span class="avatar">${u.name.split(" ").map(x=>x[0]).join("")}</span></div>
    <div class="stats-grid">
      <article class="card progress-card"><div class="card-head"><div><p class="label">Approved service</p><h2>${approved} <small>hours</small></h2></div><span class="award">${pct >= 100 ? "★" : "↗"}</span></div><div class="progress"><i style="width:${pct}%"></i></div><div class="progress-meta"><span>${pct}% of ${u.goal} hour goal</span><b>${Math.max(0,u.goal-approved)} to go</b></div></article>
      <article class="mini-card"><b>${joined.length}</b><span>Upcoming signups</span></article><article class="mini-card"><b>${state.logs.filter(l=>l.userId===u.id&&l.status==='Pending').length}</b><span>Hours pending</span></article>
    </div>
    ${u.youthIds?.length ? `<section><div class="section-title"><h2>Family</h2></div>${u.youthIds.map(id => { const y=user(id); return `<button class="family-card" onclick="switchUser('${id}')"><span class="avatar small">${y.name.split(' ').map(x=>x[0]).join('')}</span><span><b>${y.name}</b><small>Youth volunteer · ${y.hours} hours</small></span><strong>›</strong></button>`}).join('')}</section>` : ""}
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
  const p=project(id), u=currentUser(), signed=p.signups.includes(u.id), wait=p.waitlist.includes(u.id), full=p.signups.length>=p.slots;
  const canAttend = p.leadId===u.id || u.role==='Coordinator';
  openDialog(`<p class="eyebrow">${escapeHtml(p.type)}</p><h2>${escapeHtml(p.title)}</h2><p class="dialog-lead">${escapeHtml(p.description)}</p><dl class="details"><div><dt>Date & time</dt><dd>${fmtDate(p.date)}<br>${p.time}</dd></div><div><dt>Location</dt><dd>${escapeHtml(p.location)}</dd></div><div><dt>Project lead</dt><dd>${escapeHtml(user(p.leadId)?.name || 'To be assigned')}</dd></div><div><dt>Service credit</dt><dd>${p.hours} hours</dd></div></dl><div class="capacity"><span><b>${p.signups.length}/${p.slots}</b> spots filled</span><div class="progress"><i style="width:${Math.min(100,p.signups.length/p.slots*100)}%"></i></div></div>${p.status==='Open' ? `<button class="primary wide" onclick="toggleSignup('${p.id}')">${signed?'Cancel signup':wait?'Leave waitlist':full?'Join waitlist':'Sign up'}</button>` : `<button class="secondary wide" disabled>${p.status==='Upcoming'?'Signup opens '+fmtDate(p.signupDate):p.status}</button>`}${canAttend && (p.status==='Open'||p.status==='Active') ? `<button class="secondary wide" onclick="attendance('${p.id}')">Take attendance</button>`:''}`);
}

function toggleSignup(id) {
  const p=project(id), uid=state.userId;
  if (p.signups.includes(uid)) { p.signups=p.signups.filter(x=>x!==uid); if(p.waitlist.length) p.signups.push(p.waitlist.shift()); toast("Signup cancelled. The first waitlisted volunteer was promoted."); }
  else if (p.waitlist.includes(uid)) { p.waitlist=p.waitlist.filter(x=>x!==uid); toast("You left the waitlist."); }
  else if (p.signups.length>=p.slots) { p.waitlist.push(uid); toast("You’re on the waitlist."); }
  else { p.signups.push(uid); toast("You’re signed up!"); }
  closeDialog(); renderAll();
}

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
function memberDirectory(){openDialog(`<p class="eyebrow">Private · Coordinators only</p><h2>Member directory</h2><div class="member-list">${state.users.map(u=>`<div><span class="avatar small">${u.name.split(' ').map(x=>x[0]).join('')}</span><span><b>${u.name}</b><small>${u.role} · ${u.email}</small></span></div>`).join('')}</div>`)}
function exportReport(){const rows=['Volunteer,Role,Approved Hours',...state.users.map(u=>`${u.name},${u.role},${state.logs.filter(l=>l.userId===u.id&&l.status==='Approved').reduce((n,l)=>n+l.hours,u.hours||0)}`)];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv'}));a.download='jcnc-pvsa-hours.csv';a.click();URL.revokeObjectURL(a.href);toast('PVSA hours report exported.');}

function openDialog(html){$("#dialog-body").innerHTML=html;$("#app-dialog").showModal();}
function closeDialog(){$("#app-dialog").close();}
function toast(message){const t=$("#toast");t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);}
function switchUser(id){selectUser(id);$("#active-user").value=state.userId;}

async function syncExistingHours(){try{const res=await fetch(APPS_SCRIPT_URL+'?action=getAllData');if(!res.ok)return;const rows=await res.json();if(!Array.isArray(rows))return;/* Existing Sheet data remains readable; expanded project actions need matching Apps Script endpoints. */}catch(_){/* Demo remains usable if the Sheet bridge is unavailable. */}}
