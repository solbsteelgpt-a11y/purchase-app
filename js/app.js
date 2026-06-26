const STATUS=["Waiting Procurement","Waiting Quotations","Waiting VES","Waiting PO","Waiting Payment","Waiting Delivery","Waiting GRN","Completed","Delayed"];
const PROG={"Waiting Procurement":15,"Waiting Quotations":30,"Waiting VES":50,"Waiting PO":65,"Waiting Payment":72,"Waiting Delivery":82,"Waiting GRN":92,"Completed":100,"Delayed":55};
const COLORS=["#c9002b","#f28c00","#f4b03d","#0b65a3","#23a0b5","#16a34a","#111827","#8f969b"];
const KEY="SOMS_SOLB_UPDATED_V1";
let activeCase=null;

function id(){return Math.random().toString(36).slice(2,10)}
function date(offset=0){let d=new Date();d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10)}
function datetime(offset=0){let d=new Date();d.setDate(d.getDate()+offset);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function demo(){
 const items=[
  {id:id(),code:"BRG-23124",desc:"Bearing SKF 23124",cat:"Bearing",unit:"pcs",stock:3,min:5,reorder:8},
  {id:id(),code:"ELEC-RP600",desc:"Graphite Electrode RP 600",cat:"Electrode",unit:"pcs",stock:8,min:10,reorder:15},
  {id:id(),code:"LIME-QL",desc:"Lime - Quick Lime",cat:"Raw Material",unit:"ton",stock:245,min:80,reorder:150},
  {id:id(),code:"HYD-OIL-68",desc:"Hydraulic Oil 68",cat:"Consumable",unit:"drum",stock:15,min:20,reorder:30},
  {id:id(),code:"REF-BRICK",desc:"Refractory Bricks - MgO",cat:"Refractory",unit:"ton",stock:6,min:10,reorder:20}
 ];
 return {
  items,
  cases:[
   {id:id(),pr:"PR-2025-041",po:"",item:items[0].id,status:"Waiting Procurement",priority:"High",supplier:"SKF Egypt",owner:"Mohammad",qty:10,due:date(-15),next:"Follow up with procurement for RFQ",desc:"Bearing replacement stock.",timeline:[{date:datetime(-16),type:"PR Created",person:"Mohammad",comment:"PR created and sent to procurement."}],docs:[]},
   {id:id(),pr:"PR-2025-038",po:"",item:items[4].id,status:"Waiting VES",priority:"High",supplier:"SMS Group",owner:"Mohammad",qty:12,due:date(-12),next:"Review and sign VES",desc:"Refractory bricks purchase.",timeline:[{date:datetime(-14),type:"Offers Received",person:"Procurement",comment:"Offers received and VES required."}],docs:[]},
   {id:id(),pr:"PR-2025-045",po:"PO-2025-079",item:items[3].id,status:"Waiting Delivery",priority:"Medium",supplier:"ExxonMobil",owner:"Mohammad",qty:20,due:date(-9),next:"Follow shipment",desc:"Hydraulic oil.",timeline:[{date:datetime(-10),type:"PO Issued",person:"Procurement",comment:"PO issued."}],docs:[]},
   {id:id(),pr:"PR-2025-037",po:"",item:items[1].id,status:"Waiting PO",priority:"High",supplier:"Resonac",owner:"Mohammad",qty:24,due:date(7),next:"Issue purchase order",desc:"Electrode replenishment.",timeline:[{date:datetime(-3),type:"VES Signed",person:"Mohammad",comment:"Technical approval completed."}],docs:[]},
   {id:id(),pr:"PR-2025-050",po:"",item:items[2].id,status:"Completed",priority:"Medium",supplier:"Saudi Lime",owner:"Mohammad",qty:245,due:date(2),next:"Closed",desc:"Quick lime.",timeline:[{date:datetime(-1),type:"Completed",person:"Warehouse",comment:"GRN completed."}],docs:[]}
  ],
  moves:[
    {id:id(),date:datetime(-1),item:items[2].id,type:"GRN",ref:"GRN-2025-0285",qty:245,balance:245,comment:"Saudi Lime received."},
    {id:id(),date:datetime(-2),item:items[1].id,type:"Issue Note",ref:"ISS-2025-0156",qty:-4,balance:8,comment:"Issued for EAF."}
  ]
 }
}
let data=JSON.parse(localStorage.getItem(KEY)||"null")||demo();
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function item(idv){return data.items.find(i=>i.id===idv)}
function itemName(idv){let i=item(idv);return i?`${i.code} - ${i.desc}`:""}
function isDelayed(c){return c.status!=="Completed" && c.due && new Date(c.due)<new Date(new Date().toISOString().slice(0,10))}
function stockState(i){if(+i.stock<=+i.min*.5)return ["Critical","red"];if(+i.stock<+i.min)return ["Low","orange"];if(+i.stock<=+i.reorder)return ["Near Reorder","orange"];return ["Safe","green"]}
function pill(text,color){return `<span class="pill ${color}">${text}</span>`}
function progress(c){return PROG[c.status]||0}
function bar(c){return `<div class="progress"><div style="width:${progress(c)}%"></div></div><small>${progress(c)}% complete</small>`}

document.addEventListener("DOMContentLoaded",()=>{
 STATUS.forEach(s=>{statusFilter.innerHTML+=`<option>${s}</option>`; cStatus.innerHTML+=`<option>${s}</option>`; tType.innerHTML+=`<option>${s}</option>`});
 document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
 cItem.addEventListener("change", handleNewItemFromCase);
 fillItems(); render();
});

function showPage(id){
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("show"));
 document.getElementById(id).classList.add("show");
 document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
 const titleMap={dashboard:["SOMS","Solb Operations Management System — Procurement & Inventory"],cases:["Purchase Cases","Track PR, VES, PO, Delivery and GRN/SRN."],inventory:["Inventory","Stock receiving and consumption."],items:["Item Master","Stock items and thresholds."],reports:["Reports","PDF and CSV reports."],backup:["Backup","Export and import local data."]};
 pageTitle.textContent=titleMap[id][0]; pageSubtitle.textContent=titleMap[id][1];
 render();
}

function fillItems(){
 const opts=data.items.map(i=>`<option value="${i.id}">${i.code} - ${i.desc}</option>`).join("");
 const addNewOpt = `<option value="__new_item__">➕ Add New Item...</option>`;
 cItem.innerHTML = opts + addNewOpt;
 mItem.innerHTML = opts;
}


function handleNewItemFromCase(){
 if(cItem.value !== "__new_item__") return;

 const code = prompt("Enter new item code:");
 if(!code){
   cItem.value = data.items[0]?.id || "";
   return;
 }

 const desc = prompt("Enter item description:") || code;
 const cat = prompt("Enter category:", "Spare Parts") || "Spare Parts";
 const unit = prompt("Enter unit:", "pcs") || "pcs";
 const stock = Number(prompt("Enter current stock:", "0") || 0);
 const min = Number(prompt("Enter minimum stock:", "0") || 0);
 const reorder = Number(prompt("Enter reorder point:", String(min || 0)) || min || 0);

 const newItem = {id:id(), code, desc, cat, unit, stock, min, reorder};
 data.items.push(newItem);
 save();
 fillItems();
 cItem.value = newItem.id;
 render();
}

function render(){
 save(); fillItems();
 const total=data.cases.length;
 const completed=data.cases.filter(c=>c.status==="Completed").length;
 const delayed=data.cases.filter(isDelayed).length;
 const incoming=data.cases.filter(c=>c.status==="Waiting Delivery").length;
 const low=data.items.filter(i=>stockState(i)[0]!=="Safe").length;
 kTotal.textContent=total; kCompleted.textContent=completed; kDelayed.textContent=delayed; kIncoming.textContent=incoming; kLow.textContent=low;
 rTotal.textContent=total; rCompleted.textContent=completed; rDelayed.textContent=delayed; rLow.textContent=low; donutTotal.textContent=total;

 renderDonut(); renderDashboardLists(); renderCases(); renderItems(); renderMoves(); renderReports();
}

function renderDonut(){
 const counts=STATUS.map((s,i)=>({s,c:data.cases.filter(x=>x.status===s).length,color:COLORS[i]})).filter(x=>x.c>0);
 const total=Math.max(1,counts.reduce((a,b)=>a+b.c,0));
 let start=0, parts=[];
 counts.forEach(x=>{let deg=x.c/total*360; parts.push(`${x.color} ${start}deg ${start+deg}deg`); start+=deg;});
 donut.style.background=`conic-gradient(${parts.join(",")})`;
 legend.innerHTML=counts.map(x=>`<div class="legend-row"><span class="dot" style="background:${x.color}"></span><span>${x.s}</span><b>${x.c}</b></div>`).join("");
}

function renderDashboardLists(){
 const priority=data.cases.filter(c=>c.status!=="Completed").sort((a,b)=>(isDelayed(b)?1:0)-(isDelayed(a)?1:0)).slice(0,5);
 priorityCases.innerHTML=priority.map(c=>`<div class="list-item" onclick="openCase('${c.id}')"><div><b>${c.pr}</b><small>${itemName(c.item)} • ${isDelayed(c)?Math.abs(Math.round((new Date()-new Date(c.due))/86400000))+" days overdue":c.due}</small></div>${pill(c.priority,c.priority==="High"||c.priority==="Critical"?"red":"orange")}</div>`).join("");
 recentCases.innerHTML=data.cases.slice(0,5).map(c=>`<div class="list-item" onclick="openCase('${c.id}')"><div><b>${c.pr}</b><small>${itemName(c.item)}</small></div>${pill(c.status,c.status==="Completed"?"green":isDelayed(c)?"red":"gray")}</div>`).join("");
 recentMoves.innerHTML=data.moves.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(m=>`<div class="list-item"><div><b>${m.ref}</b><small>${itemName(m.item)} • ${m.date.replace("T"," ")}</small></div><b>${m.qty}</b></div>`).join("");
 todayActions.innerHTML=priority.map(c=>`<div class="task" onclick="openCase('${c.id}')"><div><b>☐ ${c.next||"Update required"}</b><small>${itemName(c.item)}</small></div><span>${c.pr}</span></div>`).join("");
 lowStockTable.innerHTML=data.items.filter(i=>stockState(i)[0]!=="Safe").map(i=>`<tr><td>${i.desc}</td><td>${i.stock}</td><td>${i.min}</td><td>${pill(stockState(i)[0],stockState(i)[1])}</td></tr>`).join("");
}

function renderCases(){
 const q=(caseSearch?.value||"").toLowerCase(), f=statusFilter?.value||"";
 const rows=data.cases.filter(c=>(!f||c.status===f)&&[c.pr,c.po,itemName(c.item),c.status,c.supplier,c.next].join(" ").toLowerCase().includes(q));
 caseCards.innerHTML=rows.map(c=>`<div class="case-card ${isDelayed(c)?"delayed":""}" onclick="openCase('${c.id}')"><h3>${c.pr}</h3><div class="item">${itemName(c.item)}</div><p class="meta">Supplier: ${c.supplier||"-"} • Due: ${c.due||"-"}</p>${pill(isDelayed(c)?"Overdue":c.status,isDelayed(c)?"red":c.status==="Completed"?"green":"gray")} ${pill(c.priority,c.priority==="Critical"||c.priority==="High"?"red":"orange")}${bar(c)}<p class="meta"><b>Next Action:</b> ${c.next||"-"}</p></div>`).join("");
}

function renderItems(){
 const q=(itemSearch?.value||"").toLowerCase();
 itemsTable.innerHTML=data.items.filter(i=>[i.code,i.desc,i.cat].join(" ").toLowerCase().includes(q)).map(i=>`<tr><td><b>${i.code}</b></td><td>${i.desc}</td><td>${i.cat}</td><td>${i.unit}</td><td>${i.stock}</td><td>${i.min}</td><td>${i.reorder}</td><td>${pill(stockState(i)[0],stockState(i)[1])}</td><td><button class="btn ghost" onclick="event.stopPropagation();openItem('${i.id}')">Edit</button></td></tr>`).join("");
}

function renderMoves(){
 movesTable.innerHTML=data.moves.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(m=>`<tr><td>${m.date.replace("T"," ")}</td><td>${itemName(m.item)}</td><td>${m.type}</td><td>${m.ref||""}</td><td>${m.qty}</td><td>${m.balance}</td><td>${m.comment||""}</td></tr>`).join("");
}

function renderReports(){
 reportDate.textContent="Generated: "+new Date().toLocaleString();
 reportCases.innerHTML=data.cases.filter(c=>c.status!=="Completed").map(c=>`<tr><td>${c.pr}</td><td>${itemName(c.item)}</td><td>${isDelayed(c)?"Overdue":c.status}</td><td>${progress(c)}%</td><td>${c.next||""}</td></tr>`).join("");
 reportStock.innerHTML=data.items.filter(i=>stockState(i)[0]!=="Safe").map(i=>`<tr><td>${i.code}</td><td>${i.desc}</td><td>${i.stock}</td><td>${i.min}</td><td>${stockState(i)[0]}</td></tr>`).join("");
}

function openCase(idv=null){
 activeCase=idv;
 const c=idv?data.cases.find(x=>x.id===idv):{id:"",pr:"",po:"",item:data.items[0]?.id,status:"Waiting Procurement",type:"Spare Parts",priority:"Medium",supplier:"",owner:"Mohammad",qty:0,due:"",next:"",desc:"",timeline:[],docs:[]};
 caseModalTitle.textContent=idv?`Purchase Case — ${c.pr}`:"New Purchase Case";
 cId.value=c.id;cPr.value=c.pr;cPo.value=c.po;cItem.value=c.item;cType.value=c.type;cStatus.value=c.status;cPriority.value=c.priority;cSupplier.value=c.supplier;cOwner.value=c.owner;cQty.value=c.qty;cDue.value=c.due;cNext.value=c.next;cDesc.value=c.desc;
 tDate.value=datetime();tPerson.value="Mohammad";tComment.value="";
 renderTimeline(c);renderDocs(c);
 caseModal.classList.add("show");
}

function saveCase(){

 if(cItem.value === "__new_item__"){
   handleNewItemFromCase();
   if(cItem.value === "__new_item__") return;
 }

 const idv=cId.value||id(); let c=data.cases.find(x=>x.id===idv);
 const obj={id:idv,pr:cPr.value,po:cPo.value,item:cItem.value,type:cType.value,status:cStatus.value,priority:cPriority.value,supplier:cSupplier.value,owner:cOwner.value,qty:+cQty.value||0,due:cDue.value,next:cNext.value,desc:cDesc.value,timeline:c?.timeline||[],docs:c?.docs||[]};
 if(!c){obj.timeline.push({date:datetime(),type:"Waiting Procurement",person:cOwner.value||"Mohammad",comment:"Case created."});data.cases.push(obj)}else Object.assign(c,obj);
 activeCase=idv; save(); render(); openCase(idv);
}

function renderTimeline(c){
 timelineList.innerHTML=(c.timeline||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).map((t,i)=>`<div class="event"><b>${t.type}</b><small>${t.date.replace("T"," ")} • ${t.person||""}</small><p>${t.comment||""}</p><button class="btn danger" onclick="deleteTimeline(${i})">Delete</button></div>`).join("")||"<p class='muted'>No updates yet.</p>";
}
function addTimeline(){
 const c=data.cases.find(x=>x.id===activeCase); if(!c){alert("Save case first");return}
 c.timeline.push({date:tDate.value||datetime(),type:tType.value,person:tPerson.value,comment:tComment.value});
 c.status=tType.value; save(); render(); openCase(c.id);
}
function deleteTimeline(i){
 const c=data.cases.find(x=>x.id===activeCase); c.timeline.splice(i,1); save(); render(); openCase(c.id);
}
function renderDocs(c){
 docsList.innerHTML=(c.docs||[]).map((d,i)=>`<div class="doc"><b>📄 ${d.type}</b><br><small>${d.file||"No file selected"}</small><p>${d.comment||""}</p><button class="btn danger" onclick="deleteDoc(${i})">Delete</button></div>`).join("")||"<p class='muted'>No documents yet.</p>";
}
function addDoc(){
 const c=data.cases.find(x=>x.id===activeCase); if(!c){alert("Save case first");return}
 c.docs.push({type:dType.value,file:dFile.files[0]?.name||"",comment:dComment.value,date:datetime()});
 dFile.value="";dComment.value=""; save(); render(); openCase(c.id);
}
function deleteDoc(i){const c=data.cases.find(x=>x.id===activeCase);c.docs.splice(i,1);save();render();openCase(c.id);}

function openItem(idv=null){
 const i=idv?data.items.find(x=>x.id===idv):{id:"",code:"",desc:"",cat:"",unit:"pcs",stock:0,min:0,reorder:0};
 iId.value=i.id;iCode.value=i.code;iDesc.value=i.desc;iCat.value=i.cat;iUnit.value=i.unit;iStock.value=i.stock;iMin.value=i.min;iReorder.value=i.reorder;
 itemModal.classList.add("show");
}
function saveItem(){
 const idv=iId.value||id(); let i=data.items.find(x=>x.id===idv);
 const obj={id:idv,code:iCode.value,desc:iDesc.value,cat:iCat.value,unit:iUnit.value,stock:+iStock.value||0,min:+iMin.value||0,reorder:+iReorder.value||0};
 if(i)Object.assign(i,obj);else data.items.push(obj);
 closeModal(); render();
}
function openMove(type=""){
 fillItems(); mDate.value=datetime(); mType.value=type||"GRN"; mQty.value="";mRef.value="";mComment.value=""; moveModal.classList.add("show");
}
function saveMove(){
 const i=item(mItem.value); let qty=+mQty.value||0;
 if(mType.value==="Issue Note")qty=-Math.abs(qty); else if(mType.value!=="Manual Adjustment")qty=Math.abs(qty);
 i.stock=(+i.stock||0)+qty;
 data.moves.push({id:id(),date:mDate.value||datetime(),item:i.id,type:mType.value,ref:mRef.value,qty,balance:i.stock,comment:mComment.value});
 closeModal(); render();
}
function switchTab(idv,btn){
 document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
 btn.classList.add("active");
 document.querySelectorAll(".tabpage").forEach(p=>p.classList.remove("show"));
 document.getElementById(idv).classList.add("show");
}
function closeModal(){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("show"))}
function downloadBackup(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="SOMS_backup.json";a.click()}
function importBackup(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{data=JSON.parse(r.result);save();render()};r.readAsText(f)}
function resetData(){if(confirm("Reset all demo data?")){localStorage.removeItem(KEY);location.reload()}}
function exportCSV(){const rows=[["PR","PO","Item","Status","Priority","Supplier","Due","Next Action"]];data.cases.forEach(c=>rows.push([c.pr,c.po,itemName(c.item),c.status,c.priority,c.supplier,c.due,c.next]));const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="SOMS_purchase_cases.csv";a.click()}
