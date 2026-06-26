const STATUS=["PR Created","Sent to Procurement","Waiting Offers","VES Review","VES Signed","PO Issued","Waiting Delivery","Received","GRN/SRN Done","Completed","Delayed"];
const PROG={"PR Created":10,"Sent to Procurement":20,"Waiting Offers":35,"VES Review":50,"VES Signed":65,"PO Issued":75,"Waiting Delivery":85,"Received":92,"GRN/SRN Done":98,"Completed":100,"Delayed":60};
let activeOrder=null;
const KEY="SOMS_SOLB_THEME_V3";

function demo(){
 return {
  items:[
    {id:id(),code:"BRG-22220",desc:"Bearing SKF 22220",cat:"Bearing",unit:"pcs",stock:3,min:2,reorder:4},
    {id:id(),code:"LIME-001",desc:"Quick Lime",cat:"Raw Material",unit:"ton",stock:120,min:80,reorder:150},
    {id:id(),code:"ELEC-600",desc:"Graphite Electrode 600 mm",cat:"Electrode",unit:"pcs",stock:8,min:12,reorder:18}
  ],
  orders:[],
  moves:[]
 }
}
let data=JSON.parse(localStorage.getItem(KEY)||"null")||demo();
if(!data.orders.length){
 data.orders=[
  {id:id(),pr:"PR-26001",po:"",item:data.items[0].id,status:"VES Signed",type:"Spare Parts",priority:"High",supplier:"SKF Supplier",owner:"Mohammad",qty:6,due:days(8),next:"Procurement to issue PO",desc:"Urgent bearing for EAF auxiliary equipment.",timeline:[{date:dateTime(-10),type:"PR Created",person:"Mohammad",comment:"PR created."},{date:dateTime(-7),type:"Waiting Offers",person:"Procurement",comment:"RFQ sent to suppliers."},{date:dateTime(-2),type:"VES Signed",person:"Mohammad",comment:"Technical acceptance completed."}],docs:[]},
  {id:id(),pr:"PR-26002",po:"PO-8841",item:data.items[2].id,status:"Waiting Delivery",type:"Consumables",priority:"Critical",supplier:"Electrode Supplier",owner:"Mohammad",qty:24,due:days(-2),next:"Follow delayed delivery",desc:"Graphite electrode stock replenishment.",timeline:[{date:dateTime(-20),type:"PR Created",person:"Mohammad",comment:"Minimum stock breached."},{date:dateTime(-12),type:"PO Issued",person:"Procurement",comment:"PO issued."}],docs:[]}
 ]; save();
}
function id(){return Math.random().toString(36).slice(2,10)}
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function days(n=0){let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function dateTime(offset=0){let d=new Date();d.setDate(d.getDate()+offset);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function item(idv){return data.items.find(x=>x.id===idv)}
function itemName(idv){let i=item(idv);return i?`${i.code} - ${i.desc}`:""}
function delayed(o){return o.status!=="Completed"&&o.due&&new Date(o.due)<new Date(new Date().toISOString().slice(0,10))}
function stockStatus(i){if(+i.stock<=+i.min*.5)return ["Critical","red"];if(+i.stock<+i.min)return ["Low","orange"];if(+i.stock<=+i.reorder)return ["Reorder","orange"];return ["Safe","green"]}
function badge(t,c){return `<span class="badge ${c}">${t}</span>`}
function bar(p){return `<div class="progress"><div style="width:${p}%"></div></div><small>${p}% complete</small>`}

document.querySelectorAll(".nav button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".nav button").forEach(x=>x.classList.remove("active"));
 b.classList.add("active");
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("show"));
 document.getElementById(b.dataset.page).classList.add("show");
 const titles={
  dashboard:["Dashboard","Clear follow-up for PR → Offers → VES → PO → Delivery → GRN/SRN → Stock."],
  orders:["Purchase Cases","Open any PR card to update details, timeline, comments and documents."],
  items:["Item Master","Manage item codes, minimum stock and reorder point."],
  stock:["Stock Movement","Register GRN/SRN receiving and Issue Note consumption."],
  reports:["Reports","Generate PDF-style report and export CSV."],
  backup:["Backup","Export and import your local data."]
 };
 pageTitle.textContent=titles[b.dataset.page][0];
 pageSubtitle.textContent=titles[b.dataset.page][1];
 render();
});
statusFilter.innerHTML='<option value="">All Status</option>'+STATUS.map(s=>`<option>${s}</option>`).join("");
oStatus.innerHTML=STATUS.map(s=>`<option>${s}</option>`).join("");
tType.innerHTML=STATUS.map(s=>`<option>${s}</option>`).join("");
function fillItems(){let opts=data.items.map(i=>`<option value="${i.id}">${i.code} - ${i.desc}</option>`).join("");oItem.innerHTML=opts;mItem.innerHTML=opts}
fillItems(); render();

function render(){
 save(); fillItems();
 let total=data.orders.length, open=data.orders.filter(o=>o.status!=="Completed").length, del=data.orders.filter(delayed).length, low=data.items.filter(i=>stockStatus(i)[0]!="Safe").length;
 kTotal.textContent=total;kOpen.textContent=open;kDelayed.textContent=del;kLow.textContent=low;rTotal.textContent=total;rOpen.textContent=open;rDelayed.textContent=del;rLow.textContent=low;
 let counts=STATUS.map(s=>[s,data.orders.filter(o=>o.status===s).length]).filter(x=>x[1]);let max=Math.max(1,...counts.map(x=>x[1]));
 statusBars.innerHTML=counts.map(x=>`<div class="bar" style="height:${40+x[1]/max*175}px"><b>${x[1]}</b><span>${x[0].replaceAll(" ","<br>")}</span></div>`).join("")||"<p>No cases yet.</p>";
 let needs=data.orders.filter(o=>o.status!=="Completed").sort((a,b)=>(delayed(b)?1:0)-(delayed(a)?1:0)).slice(0,5);
 attention.innerHTML=needs.map(o=>`<div class="action-card" onclick="openOrder('${o.id}')"><b>${delayed(o)?"🔴 Delayed":"🟡 Open"} — ${o.pr}</b><span>${o.next||"Update required"}</span><br><small>${itemName(o.item)} • Due: ${o.due||"-"} • ${o.supplier||"-"}</small></div>`).join("")||"<p>No actions.</p>";
 let events=[];data.orders.forEach(o=>(o.timeline||[]).forEach(t=>events.push({...t,pr:o.pr,oid:o.id,item:itemName(o.item)})));events.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 latestUpdates.innerHTML=events.slice(0,6).map(e=>`<div class="update-card" onclick="openOrder('${e.oid}')"><b>${e.type} — ${e.pr}</b><small>${e.date.replace("T"," ")} • ${e.person||""}</small><p>${e.comment||""}</p></div>`).join("");
 let alerts=data.items.filter(i=>stockStatus(i)[0]!="Safe");
 stockAlerts.innerHTML=alerts.map(i=>`<div class="stock-card ${stockStatus(i)[1]}"><b>${i.code} — ${stockStatus(i)[0]}</b><span>${i.desc}</span><br><small>Stock: ${i.stock} ${i.unit} • Min: ${i.min} • Reorder: ${i.reorder}</small></div>`).join("")||"<p>No stock alerts.</p>";
 renderOrders();renderItems();renderMoves();renderReport();
}
function renderOrders(){
 let q=(orderSearch?.value||"").toLowerCase(), f=statusFilter?.value||"";
 let rows=data.orders.filter(o=>(!f||o.status===f)&&[o.pr,o.po,itemName(o.item),o.supplier,o.status,o.priority,o.next].join(" ").toLowerCase().includes(q));
 orderCards.innerHTML=rows.map(o=>`<div class="order-card ${delayed(o)?"delayed":""}" onclick="openOrder('${o.id}')"><h3>${o.pr}</h3><div class="item">${itemName(o.item)}</div><p class="meta">Supplier: ${o.supplier||"-"} • Due: ${o.due||"-"}</p>${badge(delayed(o)?"Delayed":o.status,delayed(o)?"red":"blue")} ${badge(o.priority,o.priority==="Critical"?"red":o.priority==="High"?"orange":"gray")}${bar(PROG[o.status]||0)}<p class="meta"><b>Next Action:</b> ${o.next||"-"}</p></div>`).join("");
}
function renderItems(){
 let q=(itemSearch?.value||"").toLowerCase();
 itemsTable.innerHTML=data.items.filter(i=>[i.code,i.desc,i.cat].join(" ").toLowerCase().includes(q)).map(i=>`<tr><td><b>${i.code}</b></td><td>${i.desc}</td><td>${i.cat}</td><td>${i.unit}</td><td>${i.stock}</td><td>${i.min}</td><td>${badge(stockStatus(i)[0],stockStatus(i)[1])}</td><td><button class="btn light" onclick="event.stopPropagation();openItem('${i.id}')">Edit</button></td></tr>`).join("");
}
function renderMoves(){movesTable.innerHTML=data.moves.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(m=>`<tr><td>${m.date.replace("T"," ")}</td><td>${itemName(m.item)}</td><td>${m.type}</td><td>${m.ref||""}</td><td>${m.qty}</td><td>${m.balance}</td><td>${m.comment||""}</td></tr>`).join("")}
function renderReport(){
 reportDate.textContent="Generated: "+new Date().toLocaleString();
 reportCases.innerHTML=data.orders.filter(o=>o.status!=="Completed").map(o=>`<tr><td>${o.pr}</td><td>${itemName(o.item)}</td><td>${delayed(o)?"Delayed":o.status}</td><td>${PROG[o.status]||0}%</td><td>${o.next||""}</td></tr>`).join("");
 reportStock.innerHTML=data.items.filter(i=>stockStatus(i)[0]!="Safe").map(i=>`<tr><td>${i.code}</td><td>${i.desc}</td><td>${i.stock}</td><td>${i.min}</td><td>${stockStatus(i)[0]}</td></tr>`).join("");
}

function openOrder(oid){
 activeOrder=oid||null; fillItems();
 let o=oid?data.orders.find(x=>x.id===oid):{id:"",pr:"",po:"",item:data.items[0]?.id,status:"PR Created",type:"Spare Parts",priority:"Medium",supplier:"",owner:"Mohammad",qty:0,due:"",next:"",desc:"",timeline:[],docs:[]};
 orderTitle.textContent=oid?`Purchase Case — ${o.pr}`:"New Purchase Case";
 oId.value=o.id;oPr.value=o.pr;oPo.value=o.po;oItem.value=o.item;oStatus.value=o.status;oType.value=o.type;oPriority.value=o.priority;oSupplier.value=o.supplier;oOwner.value=o.owner;oQty.value=o.qty;oDue.value=o.due;oNext.value=o.next;oDesc.value=o.desc;
 tDate.value=dateTime();tPerson.value="Mohammad";tComment.value="";renderTimeline(o);renderDocs(o);
 document.getElementById("orderModal").classList.add("show");
}
function saveOrder(){
 let oid=oId.value||id(); let o=data.orders.find(x=>x.id===oid);
 let obj={id:oid,pr:oPr.value,po:oPo.value,item:oItem.value,status:oStatus.value,type:oType.value,priority:oPriority.value,supplier:oSupplier.value,owner:oOwner.value,qty:+oQty.value||0,due:oDue.value,next:oNext.value,desc:oDesc.value,timeline:o?.timeline||[],docs:o?.docs||[]};
 if(!o){obj.timeline.push({date:dateTime(),type:"PR Created",person:oOwner.value||"Mohammad",comment:"Case created."});data.orders.push(obj)}else Object.assign(o,obj);
 activeOrder=oid;save();render();openOrder(oid);
}
function renderTimeline(o){timelineList.innerHTML=(o.timeline||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map((t,i)=>`<div class="event"><b>${t.type}</b><small>${t.date.replace("T"," ")} • ${t.person||""}</small><p>${t.comment||""}</p><button class="btn danger" onclick="deleteTl(${i})">Delete</button></div>`).join("")||"<p>No updates yet.</p>"}
function addTimeline(){
 let o=data.orders.find(x=>x.id===activeOrder); if(!o){alert("Save case first");return}
 o.timeline.push({date:tDate.value||dateTime(),type:tType.value,person:tPerson.value,comment:tComment.value});o.status=tType.value;save();render();openOrder(o.id)
}
function deleteTl(i){let o=data.orders.find(x=>x.id===activeOrder);o.timeline.splice(i,1);save();render();openOrder(o.id)}
function renderDocs(o){docsList.innerHTML=(o.docs||[]).map((d,i)=>`<div class="doc"><b>📄 ${d.type}</b><br><small>${d.file||"No file"}</small><p>${d.comment||""}</p><button class="btn danger" onclick="deleteDoc(${i})">Delete</button></div>`).join("")||"<p>No documents yet.</p>"}
function addDoc(){let o=data.orders.find(x=>x.id===activeOrder);if(!o){alert("Save case first");return}o.docs.push({type:dType.value,file:dFile.files[0]?.name||"",comment:dComment.value,date:dateTime()});dFile.value="";dComment.value="";save();render();openOrder(o.id)}
function deleteDoc(i){let o=data.orders.find(x=>x.id===activeOrder);o.docs.splice(i,1);save();render();openOrder(o.id)}

function openItem(iid){let i=iid?data.items.find(x=>x.id===iid):{id:"",code:"",desc:"",cat:"",unit:"pcs",stock:0,min:0,reorder:0};iId.value=i.id;iCode.value=i.code;iDesc.value=i.desc;iCat.value=i.cat;iUnit.value=i.unit;iStock.value=i.stock;iMin.value=i.min;iReorder.value=i.reorder;document.getElementById("itemModal").classList.add("show")}
function saveItem(){let iid=iId.value||id();let i=data.items.find(x=>x.id===iid);let obj={id:iid,code:iCode.value,desc:iDesc.value,cat:iCat.value,unit:iUnit.value,stock:+iStock.value||0,min:+iMin.value||0,reorder:+iReorder.value||0};if(i)Object.assign(i,obj);else data.items.push(obj);closeModal();render()}
function openMove(){fillItems();mDate.value=dateTime();mQty.value="";mRef.value="";mComment.value="";document.getElementById("moveModal").classList.add("show")}
function saveMove(){let i=item(mItem.value);let q=+mQty.value||0;if(mType.value==="Issue Note")q=-Math.abs(q);else if(mType.value!=="Manual Adjustment")q=Math.abs(q);i.stock=(+i.stock||0)+q;data.moves.push({date:mDate.value||dateTime(),item:i.id,type:mType.value,ref:mRef.value,qty:q,balance:i.stock,comment:mComment.value});closeModal();render()}
function tab(idv,b){document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".tabpage").forEach(x=>x.classList.remove("show"));document.getElementById(idv).classList.add("show")}
function closeModal(){document.querySelectorAll(".modal").forEach(m=>m.classList.remove("show"))}
function downloadBackup(){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="SOMS_backup.json";a.click()}
function importBackup(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{data=JSON.parse(r.result);save();render()};r.readAsText(f)}
function resetData(){if(confirm("Reset all data?")){localStorage.removeItem(KEY);location.reload()}}
function exportCSV(){let rows=[["PR","PO","Item","Status","Priority","Supplier","Due","Next Action"]];data.orders.forEach(o=>rows.push([o.pr,o.po,itemName(o.item),o.status,o.priority,o.supplier,o.due,o.next]));let csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="purchase_cases.csv";a.click()}
