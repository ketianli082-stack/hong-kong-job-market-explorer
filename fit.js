const NS="http://www.w3.org/2000/svg",tooltip=document.getElementById("tooltip");let data,statusFilter="all",compared=[],selectedIndustry=null,selectedBroad=[],selectedDetails=[];
const industryColors={"Manufacturing":"#5B4BDB","Trade & wholesale":"#3E79B7","Retail":"#D7647D","Food & lodging":"#D9824B","Transport & post":"#2D8C84","Information & communications":"#4F9DA6","Finance & insurance":"#8A67C7","Real estate":"#C58A3B","Business services":"#65758B","Social & personal services":"#4E8B63"};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],fmt=(v,d=0)=>Number(v).toLocaleString("en-HK",{maximumFractionDigits:d,minimumFractionDigits:d}),hkd=v=>`HK$${fmt(v)}`,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function s(tag,a={},t=null){const n=document.createElementNS(NS,tag);Object.entries(a).forEach(([k,v])=>n.setAttribute(k,v));if(t!==null)n.textContent=t;return n;}
function makeSvg(selector){const c=$(selector);c.replaceChildren();const width=Math.max(280,c.clientWidth||700),height=Math.max(240,c.clientHeight||340),svg=s("svg",{viewBox:`0 0 ${width} ${height}`,"aria-hidden":"true"});c.appendChild(svg);return{c,svg,width,height};}
function linear([d0,d1],[r0,r1]){const span=d1-d0||1;return v=>r0+(v-d0)/span*(r1-r0);}
function path(points){return points.map((p,i)=>`${i?"L":"M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");}
function showTip(e,html){tooltip.innerHTML=html;tooltip.classList.add("visible");moveTip(e);}function moveTip(e){tooltip.style.left=`${clamp(e.clientX+12,8,innerWidth-tooltip.offsetWidth-8)}px`;tooltip.style.top=`${clamp(e.clientY+12,8,innerHeight-tooltip.offsetHeight-8)}px`;}function hideTip(){tooltip.classList.remove("visible");}function tip(n,h){n.addEventListener("pointerenter",e=>showTip(e,typeof h==="function"?h():h));n.addEventListener("pointermove",moveTip);n.addEventListener("pointerleave",hideTip);}
function xAxis(svg,scale,ticks,y,format,title){svg.appendChild(s("line",{x1:scale(ticks[0]),x2:scale(ticks.at(-1)),y1:y,y2:y,class:"axis-line"}));ticks.forEach(t=>{svg.append(s("line",{x1:scale(t),x2:scale(t),y1:y,y2:y+5,class:"axis-line"}),s("text",{x:scale(t),y:y+19,"text-anchor":"middle",class:"tick-label"},format(t)));});svg.appendChild(s("text",{x:(scale(ticks[0])+scale(ticks.at(-1)))/2,y:y+38,"text-anchor":"middle",class:"axis-label"},title));}
function yGrid(svg,scale,ticks,x1,x2,format,title){ticks.forEach(t=>{svg.append(s("line",{x1,x2,y1:scale(t),y2:scale(t),class:"grid-line"}),s("text",{x:x1-8,y:scale(t)+4,"text-anchor":"end",class:"tick-label"},format(t)));});svg.appendChild(s("text",{x:14,y:(scale(ticks[0])+scale(ticks.at(-1)))/2,transform:`rotate(-90 14 ${(scale(ticks[0])+scale(ticks.at(-1)))/2})`,"text-anchor":"middle",class:"axis-label"},title));}
function values(){return{year:+$("#pay-year").value,targetPay:+$("#target-pay").value,hoursCap:+$("#hours-cap").value,surplusTarget:+$("#surplus-target").value,rent:+$("#rent").value||0,living:+$("#living").value||0,deductions:+$("#deductions").value||0};}
function demandFor(broad){return data.demand2026Q2.find(d=>d.industry===broad);}
function currentRows(){const v=values();return data.careerPay.filter(d=>d.year===v.year).map(row=>{const surplus=row.payP50-v.rent-v.living-v.deductions,reasons=[];if(row.payP50<v.targetPay)reasons.push("Pay below target");if(row.hoursP50>v.hoursCap)reasons.push("Hours above cap");if(surplus<v.surplusTarget)reasons.push("Surplus below target");return{...row,surplus,reasons,status:reasons.length?"below":"match",demand:demandFor(row.broadIndustry)};});}
function updateOutputs(){[["#target-pay","#target-pay-output",hkd],["#hours-cap","#hours-cap-output",v=>`${v} hrs`],["#surplus-target","#surplus-target-output",hkd]].forEach(([i,o,f])=>{const input=$(i);$(o).textContent=f(+input.value);input.style.setProperty("--range-progress",`${(+input.value-+input.min)/(+input.max-+input.min)*100}%`);});}
function filteredRows(){let rows=currentRows();if(selectedBroad.length)rows=rows.filter(d=>selectedBroad.includes(d.broadIndustry));if(selectedDetails.length)rows=rows.filter(d=>selectedDetails.includes(d.industry));if(statusFilter!=="all")rows=rows.filter(d=>d.status===statusFilter);const sort=$("#result-sort").value;rows.sort((a,b)=>sort==="pay"?b.payP50-a.payP50:sort==="hours"?a.hoursP50-b.hoursP50:sort==="vacancy"?b.demand.vacancyRate-a.demand.vacancyRate:(a.status===b.status?b.payP50-a.payP50:a.status==="match"?-1:1));return rows;}
function setToggleText(id, selected, allLabel) {
  $(id).textContent = selected.length > 2 ? `${selected.length} industries selected` : selected.join(", ") || allLabel;
}
function buildMultiMenu(menuSelector, items, selected, onChange) {
  const menu = $(menuSelector);
  const actions = document.createElement("div");
  actions.className = "multi-actions";
  const options = items.map(value => {
    const label = document.createElement("label");
    label.className = "multi-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = selected.includes(value);
    input.addEventListener("change", () => {
      if (input.checked) selected.push(value);
      else selected.splice(selected.indexOf(value), 1);
      onChange();
    });
    const name = document.createElement("span");
    name.textContent = value;
    label.append(input, name);
    return label;
  });
  for (const [label, values] of [["Select all", items], ["Clear", []]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.addEventListener("click", () => {
      selected.splice(0, selected.length, ...values);
      options.forEach((option, index) => {
        $("input", option).checked = selected.includes(items[index]);
      });
      onChange();
    });
    actions.appendChild(button);
  }
  menu.replaceChildren(actions, ...options);
}
function availableDetails() {
  return [...new Set(data.careerPay.filter(d => !selectedBroad.length || selectedBroad.includes(d.broadIndustry)).map(d => d.industry))].sort();
}
function refreshDetailedMenu() {
  const details = availableDetails();
  selectedDetails = selectedDetails.filter(value => details.includes(value));
  const updateLabel = () => setToggleText("#priority-industry-toggle", selectedDetails, "All detailed industries");
  buildMultiMenu("#priority-industry-menu", details, selectedDetails, () => {
    updateLabel();
    renderResults();
  });
  updateLabel();
}
function refreshIndustryMenus() {
  const broad = [...new Set(data.careerPay.map(d => d.broadIndustry))].sort();
  const updateLabel = () => setToggleText("#broad-industry-toggle", selectedBroad, "All broad industries");
  buildMultiMenu("#broad-industry-menu", broad, selectedBroad, () => {
    updateLabel();
    refreshDetailedMenu();
    renderResults();
  });
  updateLabel();
  refreshDetailedMenu();
}
function renderResults(){updateOutputs();const scoped=currentRows().filter(d=>(!selectedBroad.length||selectedBroad.includes(d.broadIndustry))&&(!selectedDetails.length||selectedDetails.includes(d.industry))),matches=scoped.filter(d=>d.status==="match").length;$("#match-count").textContent=matches;const body=$("#results-body");body.replaceChildren();filteredRows().forEach(row=>{const tr=document.createElement("tr"),checked=compared.includes(row.industry);tr.innerHTML=`<td class="industry-name">${row.industry}<small>${row.broadIndustry}</small></td><td>${hkd(row.payP50)}</td><td>${fmt(row.hoursP50,1)}</td><td class="${row.surplus<0?"negative-value":""}">${row.surplus<0?"−":""}${hkd(Math.abs(row.surplus))}</td><td>${fmt(row.demand.vacancyRate*100,1)}%</td><td><span class="status-mark ${row.status}" title="${row.reasons.join("; ")}">${row.status==="match"?"Meets targets":"Below targets"}</span></td><td><input class="compare-check" type="checkbox" aria-label="Compare ${row.industry}" ${checked?"checked":""}></td>`;tr.addEventListener("click",()=>selectDetail(row.industry,true));const check=$(".compare-check",tr);check.addEventListener("click",e=>e.stopPropagation());check.addEventListener("change",()=>{if(check.checked&&!compared.includes(row.industry))compared.push(row.industry);else if(!check.checked)compared=compared.filter(d=>d!==row.industry);renderComparison();});body.appendChild(tr);});renderBudget();}
function rowFor(industry){return currentRows().find(d=>d.industry===industry);}
function detailColor(industry){const all=[...new Set(data.careerPay.map(d=>d.industry))].sort(),i=Math.max(0,all.indexOf(industry));return `hsl(${Math.round(i*137.5)%360} 56% 47%)`;}
function renderComparison(){const rows=compared.map(rowFor).filter(Boolean);$("#comparison-empty").hidden=rows.length>0;$("#comparison-content").hidden=!rows.length;$("#compare-hint").textContent=rows.length?`${rows.length} selected`:"Select industries to compare";if(!rows.length)return;const cards=$("#comparison-cards");cards.dataset.count=rows.length;cards.replaceChildren(...rows.map(row=>{const el=document.createElement("article");el.className="comparison-card";el.style.setProperty("--industry-color",detailColor(row.industry));el.innerHTML=`<h3>${row.industry}</h3><dl><div><dt>Median pay</dt><dd>${hkd(row.payP50)}</dd></div><div><dt>Weekly hours</dt><dd>${fmt(row.hoursP50,1)}</dd></div><div><dt>Vacancy rate</dt><dd>${fmt(row.demand.vacancyRate*100,1)}%</dd></div><div><dt>Employment YoY</dt><dd>${row.demand.employmentYoY>=0?"+":""}${fmt(row.demand.employmentYoY*100,1)}%</dd></div></dl>`;return el;}));renderRange("#compare-pay-chart",rows,"payP25","payP50","payP75",hkd,"Monthly pay (HKD)");renderRange("#compare-hours-chart",rows,"hoursP25","hoursP50","hoursP75",v=>`${fmt(v,1)} h`,"Weekly hours");}
function renderRange(selector,rows,low,mid,high,format,title){const{c,svg,width}=makeSvg(selector),height=Math.max(260,rows.length*42+68);svg.setAttribute("viewBox",`0 0 ${width} ${height}`);svg.style.height=`${height}px`;c.style.height=`${height}px`;const m={top:16,right:42,bottom:52,left:width<520?42:64},min=Math.min(...rows.map(d=>d[low]))*.95,max=Math.max(...rows.map(d=>d[high]))*1.04,x=linear([min,max],[m.left,width-m.right]),rowH=(height-m.top-m.bottom)/rows.length;xAxis(svg,x,[min,(min+max)/2,max],height-m.bottom,v=>format(v),title);rows.forEach((d,i)=>{const y=m.top+i*rowH+rowH/2,color=detailColor(d.industry),range=s("line",{x1:x(d[low]),x2:x(d[high]),y1:y,y2:y,stroke:color,"stroke-opacity":.35,"stroke-width":8,"stroke-linecap":"round"}),dot=s("circle",{cx:x(d[mid]),cy:y,r:7,fill:color});tip(range,`<strong>${d.industry}</strong>P25 ${format(d[low])}<br>Median ${format(d[mid])}<br>P75 ${format(d[high])}`);tip(dot,`<strong>${d.industry}</strong>P25 ${format(d[low])}<br>Median ${format(d[mid])}<br>P75 ${format(d[high])}`);svg.append(range,dot);});}
function selectDetail(industry,scroll=false){selectedIndustry=industry;$("#detail-industry").value=industry;$("#detail-title").textContent=industry;const row=rowFor(industry);if(row)$("#offer-pay").value=row.payP50;renderDetail();renderBudget();if(scroll)$("#detail-section").scrollIntoView({behavior:"smooth",block:"start"});}
function renderDetail(){const row=rowFor(selectedIndustry);if(!row)return;renderTrend(row.broadIndustry);renderOccupations(row.broadIndustry);}
function renderTrend(broad){const rows=data.demandTrend.filter(d=>d.industry===broad),{svg,width,height}=makeSvg("#detail-trend-chart"),m={top:20,right:30,bottom:56,left:68},vals=rows.map(d=>d.employment),min=Math.floor(Math.min(...vals)/10000)*10000,max=Math.ceil(Math.max(...vals)/10000)*10000,x=linear([0,rows.length-1],[m.left,width-m.right]),y=linear([min,max],[height-m.bottom,m.top]);yGrid(svg,y,[min,(min+max)/2,max],m.left,width-m.right,v=>`${fmt(v/1000,0)}k`,"Employed persons");xAxis(svg,x,[0,Math.floor((rows.length-1)/2),rows.length-1],height-m.bottom,i=>rows[i].period,"Quarter");svg.appendChild(s("path",{d:path(rows.map((d,i)=>[x(i),y(d.employment)])),fill:"none",stroke:"#5B4BDB","stroke-width":3}));rows.forEach((d,i)=>{const dot=s("circle",{cx:x(i),cy:y(d.employment),r:6,fill:"transparent"});tip(dot,`<strong>${broad} · ${d.period}</strong>${fmt(d.employment)} employed<br>${fmt(d.vacancies)} vacancies<br>${fmt(d.vacancyRate*100,1)}% vacancy rate`);svg.appendChild(dot);});}
function renderOccupations(broad){const rows=data.occupations2026Q2.filter(d=>d.industry===broad).slice(0,7),{svg,width,height}=makeSvg("#detail-occupation-chart"),m={top:10,right:45,bottom:52,left:width<500?135:175},max=Math.ceil(Math.max(...rows.map(d=>d.vacancies))/500)*500,x=linear([0,max],[m.left,width-m.right]),rowH=(height-m.top-m.bottom)/rows.length;xAxis(svg,x,[0,max/2,max],height-m.bottom,v=>fmt(v),"Number of vacancies");rows.forEach((d,i)=>{const y=m.top+i*rowH+5,bar=s("rect",{x:m.left,y,width:x(d.vacancies)-m.left,height:Math.max(12,rowH-10),rx:3,fill:i<2?"#5B4BDB":"#A9A1E8"});tip(bar,`<strong>${d.occupation}</strong>${fmt(d.vacancies)} vacancies<br>${fmt(d.share*100,1)}% of broad-industry vacancies`);svg.append(bar,s("text",{x:m.left-9,y:y+(rowH-10)/2+4,"text-anchor":"end",class:"bar-label"},d.occupation.length>26?d.occupation.slice(0,24)+"…":d.occupation));});}
function renderBudget(){const v=values(),offer=+$("#offer-pay").value||0,items=[{label:"Offer pay",value:offer,type:"income"},{label:"Rent",value:v.rent,type:"cost"},{label:"Living & transport",value:v.living,type:"cost"},{label:"Other deductions",value:v.deductions,type:"cost"}],max=Math.max(offer,...items.map(d=>d.value),1),root=$("#budget-waterfall");root.replaceChildren(...items.map(item=>{const el=document.createElement("div");el.className=`budget-step ${item.type}`;el.innerHTML=`<strong>${item.type==="cost"?"−":""}${hkd(item.value)}</strong><div class="budget-bar" style="height:${Math.max(5,item.value/max*190)}px"></div><span>${item.label}</span>`;return el;}));const balance=offer-v.rent-v.living-v.deductions,out=$("#budget-balance");out.textContent=`${balance<0?"−":""}${hkd(Math.abs(balance))}`;out.style.color=balance>=0?"#3F8060":"#B65360";}
function closeIndustryMenus() {
  $$(".multi-select-menu").forEach(menu => { menu.hidden = true; });
  $$(".multi-select-toggle").forEach(toggle => toggle.setAttribute("aria-expanded", "false"));
}
function positionIndustryMenu(toggle, menu) {
  const bounds = toggle.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const width = Math.min(Math.max(bounds.width, 320), viewportWidth - 24);
  const left = clamp(bounds.left, 12, viewportWidth - width - 12);
  menu.style.width = `${width}px`;
  menu.style.left = `${left - bounds.left}px`;
}
function setupMulti(toggleSelector, menuSelector) {
  const toggle = $(toggleSelector), menu = $(menuSelector);
  toggle.setAttribute("aria-controls", menu.id);
  toggle.addEventListener("click", event => {
    event.stopPropagation();
    const open = menu.hidden;
    closeIndustryMenus();
    if (open) positionIndustryMenu(toggle, menu);
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", event => event.stopPropagation());
  toggle.parentElement.addEventListener("keydown", event => {
    if (event.key === "Escape" && !menu.hidden) {
      closeIndustryMenus();
      toggle.focus();
    }
  });
  addEventListener("resize", () => {
    if (!menu.hidden) positionIndustryMenu(toggle, menu);
  });
}
function setup(){const years=[...new Set(data.careerPay.map(d=>d.year))].sort((a,b)=>b-a),year=$("#pay-year");years.forEach(v=>year.add(new Option(v,v)));year.value=data.meta.defaultPayYear;refreshIndustryMenus();setupMulti("#broad-industry-toggle","#broad-industry-menu");setupMulti("#priority-industry-toggle","#priority-industry-menu");document.addEventListener("click",closeIndustryMenus);const industries=[...new Set(data.careerPay.map(d=>d.industry))].sort(),detail=$("#detail-industry");industries.forEach(v=>detail.add(new Option(v,v)));selectedIndustry=industries[0];updateOutputs();renderResults();renderComparison();selectDetail(selectedIndustry);
  ["#pay-year","#target-pay","#hours-cap","#surplus-target","#rent","#living","#deductions"].forEach(sel=>$(sel).addEventListener("input",()=>{renderResults();renderComparison();renderDetail();}));$("#offer-pay").addEventListener("input",renderBudget);$("#result-sort").addEventListener("change",renderResults);$$('[data-status]').forEach(b=>b.addEventListener("click",()=>{statusFilter=b.dataset.status;$$('[data-status]').forEach(x=>x.classList.toggle("active",x===b));renderResults();}));$("#detail-industry").addEventListener("change",e=>selectDetail(e.target.value));$("#reset-filters").addEventListener("click",()=>{$("#pay-year").value=2025;$("#target-pay").value=25000;$("#hours-cap").value=42;$("#surplus-target").value=6000;$("#rent").value=10000;$("#living").value=6500;$("#deductions").value=2000;selectedBroad=[];selectedDetails=[];refreshIndustryMenus();statusFilter="all";$$('[data-status]').forEach(x=>x.classList.toggle("active",x.dataset.status==="all"));renderResults();renderComparison();renderDetail();});let timer;addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(()=>{renderComparison();renderDetail();},160);});}
fetch("data/data.json").then(r=>r.json()).then(json=>{data=json;setup();}).catch(error=>{console.error(error);document.body.insertAdjacentHTML("beforeend",'<p style="padding:40px">Data could not be loaded.</p>');});
