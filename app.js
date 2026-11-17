const NS = "http://www.w3.org/2000/svg";
const tooltip = document.getElementById("tooltip");
const palette = ["#7F74A7", "#9B93C9", "#BE6482", "#C799BC", "#9C9290", "#C6C1F0", "#9A6E96", "#DDB5D5", "#6F6F6F", "#B898BC"];
const femaleColor = "#BE6482", maleColor = "#7F74A7";
const industryShareColors = {
  "Manufacturing": "#7F74A7",
  "Import/export trade and wholesale": "#9B93C9",
  "Retail, accommodation and food services": "#BE6482",
  "Transportation, storage, postal and courier services, information and communications": "#9C9290",
  "Financing, insurance, real estate, professional and business services": "#9A6E96",
  "Public administration, social and personal services": "#B898BC",
  "Construction": "#DDB5D5",
  "Other industries": "#6F6F6F"
};
let data;
let activeChapter = "markets";
let selectedIndustryShare = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const fmt = (v, digits = 0) => Number(v).toLocaleString("en-HK", { maximumFractionDigits: digits, minimumFractionDigits: digits });
const compact = v => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function s(tag, attrs = {}, text = null) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== null) node.textContent = text;
  return node;
}

function makeSvg(selector) {
  const container = $(selector);
  container.replaceChildren();
  const width = container.clientWidth || 700;
  const height = Math.max(240, container.clientHeight || 340);
  const svg = s("svg", { viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true" });
  container.appendChild(svg);
  requestAnimationFrame(fitChartLabels);
  return { container, svg, width, height };
}

function linear([d0, d1], [r0, r1]) { const span = d1 - d0 || 1; return v => r0 + (v - d0) / span * (r1 - r0); }
function linePath(points) { return points.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" "); }
function areaPath(top, bottom) { return `${linePath(top)} ${bottom.slice().reverse().map(p => `L${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ")} Z`; }
function donutArc(cx,cy,r0,r1,a0,a1){const p=a=>[cx+Math.cos(a)*r1,cy+Math.sin(a)*r1],q=a=>[cx+Math.cos(a)*r0,cy+Math.sin(a)*r0],A=p(a0),B=p(a1),C=q(a1),D=q(a0),large=a1-a0>Math.PI?1:0;return `M${A[0]},${A[1]} A${r1},${r1} 0 ${large} 1 ${B[0]},${B[1]} L${C[0]},${C[1]} A${r0},${r0} 0 ${large} 0 ${D[0]},${D[1]} Z`;}

function showTip(event, html) { tooltip.innerHTML = html; tooltip.classList.add("visible"); moveTip(event); }
function moveTip(event) { tooltip.style.left = `${clamp(event.clientX + 12, 8, innerWidth - tooltip.offsetWidth - 8)}px`; tooltip.style.top = `${clamp(event.clientY + 12, 8, innerHeight - tooltip.offsetHeight - 8)}px`; }
function hideTip() { tooltip.classList.remove("visible"); }
function tip(node, html) { node.classList.add("chart-mark"); node.addEventListener("pointerenter", e => showTip(e, typeof html === "function" ? html() : html)); node.addEventListener("pointermove", moveTip); node.addEventListener("pointerleave", hideTip); }

function xAxis(svg, scale, ticks, y, format = String, title = "") {
  svg.appendChild(s("line", { x1: scale(ticks[0]), x2: scale(ticks.at(-1)), y1: y, y2: y, class: "axis-line" }));
  ticks.forEach(t => { svg.appendChild(s("line", { x1: scale(t), x2: scale(t), y1: y, y2: y + 5, class: "axis-line" })); svg.appendChild(s("text", { x: scale(t), y: y + 19, "text-anchor": "middle", class: "tick-label" }, format(t))); });
  if (title) {
    const center = (scale(ticks[0]) + scale(ticks.at(-1))) / 2;
    const label = s("text", { x: center, y: y + 38, "text-anchor": "middle", class: "axis-label" }, title);
    svg.appendChild(label);
    const halfLength = label.getComputedTextLength() / 2;
    label.setAttribute("x", clamp(center, halfLength + 4, svg.viewBox.baseVal.width - halfLength - 4));
  }
}
function yGrid(svg, scale, ticks, x1, x2, format = String, title = "") {
  ticks.forEach(t => { svg.appendChild(s("line", { x1, x2, y1: scale(t), y2: scale(t), class: "grid-line" })); svg.appendChild(s("text", { x: x1 - 8, y: scale(t) + 4, "text-anchor": "end", class: "tick-label" }, format(t))); });
  if (title) svg.appendChild(s("text", { x: 14, y: (scale(ticks[0]) + scale(ticks.at(-1))) / 2, transform: `rotate(-90 14 ${(scale(ticks[0]) + scale(ticks.at(-1))) / 2})`, "text-anchor": "middle", class: "axis-label" }, title));
}

function renderAge() {
  const { svg, width, height } = makeSvg("#age-chart");
  const m = { top: 30, right: 26, bottom: 44, left: 26 }, center = width / 2;
  const ages = [...new Set(data.ageComparison.map(d => d.age))];
  const max = Math.ceil(Math.max(...data.ageComparison.map(d => d.share)) / 5) * 5;
  const size = linear([0, max], [0, width / 2 - 88]);
  const rowH = (height - m.top - m.bottom) / ages.length;
  svg.appendChild(s("line", { x1: center, x2: center, y1: m.top - 8, y2: height - m.bottom, class: "axis-line" }));
  svg.appendChild(s("text", { x: center / 2, y: 16, "text-anchor": "middle", class: "direct-label" }, "Mainland China"));
  svg.appendChild(s("text", { x: center * 1.5, y: 16, "text-anchor": "middle", class: "direct-label" }, "Hong Kong"));
  ages.forEach((age, i) => {
    const left = data.ageComparison.find(d => d.age === age && d.region === "内地");
    const right = data.ageComparison.find(d => d.age === age && d.region === "香港");
    const y = m.top + i * rowH, h = Math.max(12, rowH * .56);
    const l = s("rect", { x: center - 54 - size(left.share), y, width: size(left.share), height: h, rx: 3, fill: "#7F74A7" });
    const r = s("rect", { x: center + 54, y, width: size(right.share), height: h, rx: 3, fill: "#BE6482" });
    tip(l, `<strong>Mainland China · ${age}</strong>${fmt(left.share, 1)}%`); tip(r, `<strong>Hong Kong · ${age}</strong>${fmt(right.share, 1)}%`);
    svg.append(l, r, s("text", { x: center, y: y + h / 2 + 4, "text-anchor": "middle", class: "tick-label" }, age));
  });
  svg.appendChild(s("text", { x: center, y: height - 8, "text-anchor": "middle", class: "axis-label" }, "Share of employed population (%)"));
}

function renderMiddleAge() {
  const { svg, width, height } = makeSvg("#middle-age-chart");
  const compactLegend = width < 440;
  const m = { top: compactLegend ? 44 : 26, right: 16, bottom: 54, left: 48 };
  const rows = data.middleAgeTrend;
  const x = linear([2010, 2022], [m.left, width - m.right - (compactLegend ? 0 : 100)]);
  const y = linear([55, 85], [height - m.bottom, m.top]);
  yGrid(svg, y, [60, 70, 80], m.left, width - m.right, v => `${v}%`, "Share (%)");
  xAxis(svg, x, [2010, 2014, 2018, 2022], height - m.bottom, String, "Year");
  [["内地", "Mainland China", maleColor], ["香港", "Hong Kong", femaleColor]].forEach(([key, label, color], index) => {
    const series = rows.filter(d => d.region === key);
    const line = s("path", { d: linePath(series.map(d => [x(d.year), y(d.share)])), fill: "none", stroke: color, "stroke-width": 3 });
    svg.appendChild(line);
    series.forEach(d => {
      const dot = s("circle", { cx: x(d.year), cy: y(d.share), r: 4, fill: color });
      tip(dot, `<strong>${label} · ${d.year}</strong>${fmt(d.share, 1)}%`);
      svg.appendChild(dot);
    });
    const last = series.at(-1);
    const legendX = m.left + index * 108;
    if (compactLegend) svg.appendChild(s("rect", { x: legendX, y: 10, width: 9, height: 9, rx: 2, fill: color }));
    svg.appendChild(s("text", {
      x: compactLegend ? legendX + 13 : width - m.right,
      y: compactLegend ? 19 : y(last.share) + 4,
      "text-anchor": compactLegend ? "start" : "end",
      fill: color,
      class: "direct-label"
    }, label));
  });
}

function renderUnder35() {
  const { svg, width, height } = makeSvg("#under35-chart"); const m={top:12,right:55,bottom:48,left:width<700?150:235};
  const industries=[...new Set(data.under35ByIndustry.map(d=>d.industry))]; const max=70; const x=linear([0,max],[m.left,width-m.right]); const rowH=(height-m.top-m.bottom)/industries.length;
  [0,20,40,60].forEach(t=>{svg.appendChild(s("line",{x1:x(t),x2:x(t),y1:m.top,y2:height-m.bottom,class:"grid-line"}));}); xAxis(svg,x,[0,20,40,60],height-m.bottom,v=>`${v}%`,"Workers under 35 within industry (%)");
  industries.forEach((industry,i)=>{const y=m.top+i*rowH; const a=data.under35ByIndustry.find(d=>d.industry===industry&&d.region==="内地"); const b=data.under35ByIndustry.find(d=>d.industry===industry&&d.region==="香港");
    svg.appendChild(s("text",{x:m.left-10,y:y+rowH/2+4,"text-anchor":"end",class:"bar-label"},industry.length>34?industry.slice(0,32)+"…":industry));
    [[a,"#7F74A7",-5,"Mainland China"],[b,"#BE6482",6,"Hong Kong"]].forEach(([d,color,offset,label])=>{const bar=s("line",{x1:x(0),x2:x(d.share),y1:y+rowH/2+offset,y2:y+rowH/2+offset,stroke:color,"stroke-width":6,"stroke-linecap":"round"});tip(bar,`<strong>${industry} · ${label}</strong>${fmt(d.share,1)}%`);svg.appendChild(bar);});
  });
}

function renderTotalEmployment() {
  const {svg,width,height}=makeSvg("#total-employment-chart"); const m={top:25,right:45,bottom:55,left:58}; const rows=data.totalEmployment;
  const x=linear([rows[0].year,rows.at(-1).year],[m.left,width-m.right]); const min=Math.floor(Math.min(...rows.map(d=>d.thousand))/100)*100; const max=Math.ceil(Math.max(...rows.map(d=>d.thousand))/100)*100; const y=linear([min,max],[height-m.bottom,m.top]);
  yGrid(svg,y,[min,(min+max)/2,max],m.left,width-m.right,v=>fmt(v,0),"Employed persons ('000)"); xAxis(svg,x,[2008,2012,2016,2020,2025],height-m.bottom,String,"Year");
  const area=areaPath(rows.map(d=>[x(d.year),y(d.thousand)]),rows.map(d=>[x(d.year),y(min)]));
  const gradient = s("linearGradient", { id: "employment-gradient", x1: "0%", x2: "0%", y1: "100%", y2: "0%" });
  gradient.append(s("stop", { offset: "0%", "stop-color": "#C6C1F0", "stop-opacity": .25 }), s("stop", { offset: "100%", "stop-color": "#7F74A7", "stop-opacity": .55 }));
  const defs = s("defs");
  defs.appendChild(gradient);
  svg.append(defs, s("path", { d: area, fill: "url(#employment-gradient)" }));
  svg.appendChild(s("path",{d:linePath(rows.map(d=>[x(d.year),y(d.thousand)])),fill:"none",stroke:maleColor,"stroke-width":3}));
  rows.forEach(d=>{const dot=s("circle",{cx:x(d.year),cy:y(d.thousand),r:3.5,fill:maleColor});tip(dot,`<strong>${d.year}</strong>${fmt(d.thousand,1)} thousand employed`);svg.appendChild(dot);});
}

function renderIndustryShare() {
  const selected=selectedIndustryShare; const {svg,width,height}=makeSvg("#industry-share-chart"); const columns = width < 480 ? 2 : 4; const m={top:columns === 2 ? 84 : 50,right:20,bottom:54,left:58};
  const industries=[...new Set(data.industryShares.map(d=>d.industry))], years=[...new Set(data.industryShares.map(d=>d.year))].sort((a,b)=>a-b); const x=linear([years[0],years.at(-1)],[m.left,width-m.right]);
  const short={"Manufacturing":"Manufacturing","Import/export trade and wholesale":"Trade & wholesale","Retail, accommodation and food services":"Retail & lodging","Transportation, storage, postal and courier services, information and communications":"Transport & ICT","Financing, insurance, real estate, professional and business services":"Finance & business","Public administration, social and personal services":"Public & social","Construction":"Construction","Other industries":"Other"};
  const legendWidth=(width - 16) / columns;
  industries.forEach((industry,i)=>{const lx=8+(i%columns)*legendWidth,ly=12+Math.floor(i/columns)*18;const item=s("g",{class:"chart-legend-item",tabindex:"0"});item.append(s("rect",{x:lx,y:ly,width:9,height:9,rx:2,fill:industryShareColors[industry]}),s("text",{x:lx+14,y:ly+9,class:"tick-label"},short[industry]));const select=()=>{selectedIndustryShare=industry;renderIndustryShare();}; item.addEventListener("click",select); item.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault(); select();}});svg.appendChild(item);});
  $("#industry-share-reset").hidden=!selected;
  if(selected){
    const rows=data.industryShares.filter(d=>d.industry===selected); const max=Math.ceil(Math.max(...rows.map(d=>d.share))/5)*5; const y=linear([0,max],[height-m.bottom,m.top]); yGrid(svg,y,[0,max/2,max],m.left,width-m.right,v=>`${fmt(v,0)}%`,"Employment share (%)"); xAxis(svg,x,[2008,2012,2016,2020,2025],height-m.bottom,String,"Year");
    const color=industryShareColors[selected],area=s("path",{d:areaPath(rows.map(d=>[x(d.year),y(d.share)]),rows.map(d=>[x(d.year),y(0)])),fill:color,opacity:.24,stroke:color,"stroke-width":3,class:"interactive-area"});
    tip(area,`<strong>${selected}</strong>Click again to return to all industries.`);area.addEventListener("click",()=>{selectedIndustryShare=null;renderIndustryShare();});svg.appendChild(area);rows.forEach(d=>{const dot=s("circle",{cx:x(d.year),cy:y(d.share),r:3.5,fill:color});tip(dot,`<strong>${selected} · ${d.year}</strong>${fmt(d.share,1)}%`);svg.appendChild(dot);}); return;
  }
  const y=linear([0,100],[height-m.bottom,m.top]); yGrid(svg,y,[0,25,50,75,100],m.left,width-m.right,v=>`${v}%`,"Employment share (%)"); xAxis(svg,x,[2008,2012,2016,2020,2025],height-m.bottom,String,"Year");
  const stacks=new Map(industries.map(i=>[i,[]])); years.forEach(year=>{let total=0;industries.forEach(industry=>{const value=data.industryShares.find(d=>d.year===year&&d.industry===industry)?.share||0;stacks.get(industry).push({year,value,y0:total,y1:total+value});total+=value;});});
  industries.forEach(industry=>{const rows=stacks.get(industry);const p=s("path",{d:areaPath(rows.map(d=>[x(d.year),y(d.y1)]),rows.map(d=>[x(d.year),y(d.y0)])),fill:industryShareColors[industry],opacity:.86,stroke:"#fff","stroke-width":.7,class:"interactive-area"});tip(p,`<strong>${industry}</strong>Click to isolate this industry.`);p.addEventListener("click",()=>{selectedIndustryShare=industry;renderIndustryShare();});svg.appendChild(p);});
}

function compositionYear(){return +$("#composition-year").value;}
function renderStatus(){
  const {svg,width,height}=makeSvg("#status-chart"),rows=data.employmentStatus.filter(d=>d.year===compositionYear()),total=rows.reduce((a,d)=>a+d.employedThousand,0),cx=Math.min(width*.22,125),cy=height/2,r=Math.min(88,height*.36,width*.20),r0=r*.58;let angle=-Math.PI/2;
  rows.forEach((d,i)=>{const next=angle+d.employedThousand/total*Math.PI*2,color=palette[i];const arc=s("path",{d:donutArc(cx,cy,r0,r,angle,next),fill:color,stroke:"#fff","stroke-width":2});tip(arc,`<strong>${d.status}</strong>${fmt(d.employedThousand,1)} thousand<br>${fmt(d.employedThousand/total*100,1)}%`);svg.appendChild(arc);angle=next;});
  svg.append(s("text",{x:cx,y:cy-2,"text-anchor":"middle",class:"donut-value"},String(compositionYear())),s("text",{x:cx,y:cy+18,"text-anchor":"middle",class:"tick-label"},"employment status"));
  rows.forEach((d,i)=>{const y=44+i*43,x=Math.round(width*.45);svg.append(s("rect",{x,y:y-9,width:10,height:10,rx:2,fill:palette[i]}),s("text",{x:x+17,y,class:"bar-label"},d.status),s("text",{x:x+17,y:y+17,class:"tick-label"},`${fmt(d.employedThousand,1)}k · ${fmt(d.employedThousand/total*100,1)}%`));});
}
function occupationTiles(rows, x, y, width, height, total) {
  if (rows.length === 1) return [{ occupation: rows[0], x, y, width, height }];

  // Split the longer side using the two groups' shares of total employment.
  let split = 1;
  let firstTotal = rows[0].employedThousand;
  while (split < rows.length - 1 &&
    Math.abs(total / 2 - firstTotal - rows[split].employedThousand) < Math.abs(total / 2 - firstTotal)) {
    firstTotal += rows[split].employedThousand;
    split++;
  }
  const share = firstTotal / total;
  const first = rows.slice(0, split);
  const second = rows.slice(split);
  if (width >= height) {
    const cut = width * share;
    return [
      ...occupationTiles(first, x, y, cut, height, firstTotal),
      ...occupationTiles(second, x + cut, y, width - cut, height, total - firstTotal)
    ];
  }
  const cut = height * share;
  return [
    ...occupationTiles(first, x, y, width, cut, firstTotal),
    ...occupationTiles(second, x, y + cut, width, height - cut, total - firstTotal)
  ];
}

function renderOccupation() {
  const { svg, width, height } = makeSvg("#occupation-chart");
  const all = data.occupationMix;
  const occupations = [...new Set(all.map(d => d.occupation))].sort();
  const rows = all.filter(d => d.year === compositionYear() && d.employedThousand > 0)
    .sort((a, b) => b.employedThousand - a.employedThousand);
  if (!rows.length) return;

  const shades = ["#B9B0D8", "#C6C1F0", "#A696C4", "#C799BC", "#DDB5D5", "#B898BC", "#9B93C9", "#CE9AB8", "#E3A9C8"];
  const short = {
    "Associate professionals": "Associate pros",
    "Clerical support workers": "Clerical support",
    "Craft and related trades workers": "Craft & trades",
    "Elementary occupations": "Elementary",
    "Managers": "Managers",
    "Other occupations": "Other",
    "Plant and machine operators and assemblers": "Machine operators",
    "Professionals": "Professionals",
    "Services and sales workers": "Services & sales"
  };
  const total = rows.reduce((sum, row) => sum + row.employedThousand, 0);
  for (const tile of occupationTiles(rows, 2, 2, width - 4, height - 4, total)) {
    const row = tile.occupation;
    const color = shades[occupations.indexOf(row.occupation) % shades.length];
    const rect = s("rect", { x: tile.x, y: tile.y, width: tile.width, height: tile.height, fill: color, stroke: "#F7F6FA", "stroke-width": 2 });
    tip(rect, `<strong>${row.occupation}</strong>${fmt(row.employedThousand, 1)} thousand employed<br>${fmt(row.employedThousand / total * 100, 1)}%`);
    svg.appendChild(rect);

    if (tile.height < 45) continue;
    const label = s("text", { x: tile.x + 8, y: tile.y + 18, class: "heat-label" }, short[row.occupation] ?? row.occupation);
    svg.appendChild(label);
    if (label.getComputedTextLength() > tile.width - 16) label.remove();
    else svg.appendChild(s("text", { x: tile.x + 8, y: tile.y + 35, class: "heat-value" }, `${fmt(row.employedThousand, 1)}k`));
  }
}

function focusIndustry(){return $("#opportunity-industry-select").value;}
function industryColor(name){const selected=focusIndustry();return selected==="all"||selected===name?"#7F74A7":"#dfe2e8";}
function renderDemandBars(selector,key,titleFormat,axisTitle){
  const {svg,width,height}=makeSvg(selector);const rows=data.demand2026Q2.slice().sort((a,b)=>b.employment-a.employment);const m={top:10,right:55,bottom:50,left:width<540?135:170};const max=Math.max(...rows.map(d=>d[key]));const x=linear([0,max*1.08],[m.left,width-m.right]);const rowH=(height-m.top-m.bottom)/rows.length;
  xAxis(svg,x,[0,max/2,max],height-m.bottom,titleFormat,axisTitle);
  rows.forEach((d,i)=>{const y=m.top+i*rowH+4;const bar=s("rect",{x:m.left,y,width:x(d[key])-m.left,height:Math.max(11,rowH-8),rx:3,fill:industryColor(d.industry)});tip(bar,`<strong>${d.industry}</strong>${key==="employment"?`${fmt(d.employment)} employed`:`${fmt(d.vacancyRate*100,1)}% vacancy rate`}<br>${d.employmentYoY>=0?"+":""}${fmt(d.employmentYoY*100,1)}% employment YoY`);svg.append(bar,s("text",{x:m.left-9,y:y+(rowH-8)/2+4,"text-anchor":"end",class:"bar-label"},d.industry.length>24?d.industry.slice(0,22)+"…":d.industry));});
}
function renderOpportunity(){renderDemandBars("#employment-scale-chart","employment",v=>compact(v),"Employed persons");renderDemandBars("#vacancy-chart","vacancyRate",v=>`${fmt(v*100,1)}%`,"Vacancy rate (%)");renderConditions();}
function conditionMatch(name,selected){const map={"Manufacturing":["Manufacturing"],"Trade & wholesale":["Import/export & wholesale"],"Retail":["Retail & accommodation"],"Food & lodging":["Retail & accommodation"],"Transport & post":["Transportation & information"],"Information & communications":["Transportation & information"],"Finance & insurance":["Finance & professional"],"Real estate":["Finance & professional"],"Business services":["Finance & professional"],"Social & personal services":["Public & social services"]};return selected==="all"||(map[selected]||[]).includes(name);}
function renderConditions(){const {svg,width,height}=makeSvg("#conditions-chart");const rows=data.jobConditions2025;const m={top:20,right:90,bottom:58,left:64};const x=linear([15000,26000],[m.left,width-m.right]);const y=linear([46,38],[height-m.bottom,m.top]);yGrid(svg,y,[38,40,42,44,46],m.left,width-m.right,v=>`${v} h`,"Median weekly hours");xAxis(svg,x,[15000,20000,25000],height-m.bottom,v=>`${fmt(v/1000,0)}k`,"Median monthly earnings (HKD)");
  rows.forEach((d,i)=>{const active=conditionMatch(d.industry,focusIndustry());const dot=s("circle",{cx:x(d.medianPay),cy:y(d.medianHours),r:active?7:5,fill:active?palette[i%palette.length]:"#dfe2e8",stroke:"#fff","stroke-width":2});tip(dot,`<strong>${d.industry}</strong>HK$${fmt(d.medianPay)} per month<br>${fmt(d.medianHours,1)} hours per week`);svg.append(dot,s("text",{x:x(d.medianPay)+9,y:y(d.medianHours)+4,class:"tick-label",fill:active?"#20232a":"#a7adb7"},d.industry));});}

function renderParticipation(){const year=+$("#participation-year").value;const {svg,width,height}=makeSvg("#participation-chart");const rows=data.participationByAgeSex.filter(d=>d.year===year);const ages=[...new Set(rows.map(d=>d.age))];const m={top:20,right:60,bottom:70,left:55};const x=linear([0,ages.length-1],[m.left,width-m.right]);const y=linear([0,100],[height-m.bottom,m.top]);yGrid(svg,y,[0,25,50,75,100],m.left,width-m.right,v=>`${v}%`,"Participation rate (%)");
  ages.forEach((age,i)=>svg.appendChild(s("text",{x:x(i),y:height-m.bottom+18,"text-anchor":"end",transform:`rotate(-40 ${x(i)} ${height-m.bottom+18})`,class:"tick-label"},age)));
  [["Female","#BE6482"],["Male","#7F74A7"]].forEach(([sex,color])=>{const series=rows.filter(d=>d.sex===sex);svg.appendChild(s("path",{d:linePath(series.map((d,i)=>[x(i),y(d.rate)])),fill:"none",stroke:color,"stroke-width":3}));series.forEach((d,i)=>{const dot=s("circle",{cx:x(i),cy:y(d.rate),r:3.5,fill:color});tip(dot,`<strong>${sex} · age ${d.age}</strong>${fmt(d.rate,1)}% participation`);svg.appendChild(dot);});const last=series.at(-1);svg.appendChild(s("text",{x:x(ages.length-1)+8,y:y(last.rate)+4,fill:color,class:"direct-label"},sex));});}

function genderGroups(){const map=new Map();data.genderPay2025.forEach(d=>{if(!map.has(d.industry))map.set(d.industry,{industry:d.industry});map.get(d.industry)[d.sex.toLowerCase()]={pay:d.medianPay,employment:d.employedThousand};});return [...map.values()];}
function renderGenderEmployment(){const {svg,width,height}=makeSvg("#gender-employment-chart");const rows=genderGroups();const m={top:10,right:45,bottom:52,left:width<600?145:220};const x=linear([0,100],[m.left,width-m.right]);const rowH=(height-m.top-m.bottom)/rows.length;xAxis(svg,x,[0,25,50,75,100],height-m.bottom,v=>`${v}%`,"Share of industry employment (%)");rows.forEach((d,i)=>{const total=d.female.employment+d.male.employment,f=d.female.employment/total*100,y=m.top+i*rowH+7,h=Math.max(12,rowH-14);const a=s("rect",{x:m.left,y,width:x(f)-m.left,height:h,fill:"#BE6482"});const b=s("rect",{x:x(f),y,width:x(100)-x(f),height:h,fill:"#7F74A7"});tip(a,`<strong>${d.industry} · Female</strong>${fmt(f,1)}%`);tip(b,`<strong>${d.industry} · Male</strong>${fmt(100-f,1)}%`);svg.append(a,b,s("text",{x:m.left-9,y:y+h/2+4,"text-anchor":"end",class:"bar-label"},d.industry.length>30?d.industry.slice(0,28)+"…":d.industry));});}
function renderPayGap(){const sort=$("#pay-sort").value;const {svg,width,height}=makeSvg("#pay-gap-chart");const rows=genderGroups().map(d=>({...d,gap:d.male.pay-d.female.pay})).sort((a,b)=>sort==="gap"?b.gap-a.gap:b[sort].pay-a[sort].pay);const m={top:12,right:70,bottom:52,left:width<600?150:230};const max=Math.ceil(Math.max(...rows.map(d=>d.male.pay))/10000)*10000;const x=linear([0,max],[m.left,width-m.right]);const rowH=(height-m.top-m.bottom)/rows.length;xAxis(svg,x,[0,10000,20000,30000].filter(v=>v<=max),height-m.bottom,v=>`${v/1000}k`,"Median monthly earnings (HKD)");rows.forEach((d,i)=>{const y=m.top+i*rowH+rowH/2;svg.appendChild(s("line",{x1:x(d.female.pay),x2:x(d.male.pay),y1:y,y2:y,stroke:"#C5BFBE","stroke-width":3}));const f=s("circle",{cx:x(d.female.pay),cy:y,r:6,fill:"#BE6482"}),mDot=s("circle",{cx:x(d.male.pay),cy:y,r:6,fill:"#7F74A7"});tip(f,`<strong>${d.industry} · Female</strong>HK$${fmt(d.female.pay)}`);tip(mDot,`<strong>${d.industry} · Male</strong>HK$${fmt(d.male.pay)}<br>Gap HK$${fmt(d.gap)}`);svg.append(f,mDot,s("text",{x:m.left-9,y:y+4,"text-anchor":"end",class:"bar-label"},d.industry.length>30?d.industry.slice(0,28)+"…":d.industry),s("text",{x:x(d.male.pay)+9,y:y+4,class:"tick-label"},`${fmt(d.gap/1000,1)}k gap`));});}
function renderPayTrend(){const {svg,width,height}=makeSvg("#pay-trend-chart");const rows=data.overallPayTrend;const years=[...new Set(rows.map(d=>d.year))];const m={top:20,right:60,bottom:55,left:62};const x=linear([years[0],years.at(-1)],[m.left,width-m.right]);const max=Math.ceil(Math.max(...rows.map(d=>d.medianPay))/5000)*5000;const y=linear([0,max],[height-m.bottom,m.top]);yGrid(svg,y,[0,10000,20000,30000].filter(v=>v<=max),m.left,width-m.right,v=>`${v/1000}k`,"Median monthly earnings (HKD)");xAxis(svg,x,[1985,1995,2005,2015,2025],height-m.bottom,String,"Year");[["Female","#BE6482"],["Male","#7F74A7"]].forEach(([sex,color])=>{const series=rows.filter(d=>d.sex===sex);svg.appendChild(s("path",{d:linePath(series.map(d=>[x(d.year),y(d.medianPay)])),fill:"none",stroke:color,"stroke-width":3}));const last=series.at(-1);svg.appendChild(s("text",{x:x(last.year)+8,y:y(last.medianPay)+4,fill:color,class:"direct-label"},sex));series.filter((_,i)=>i%5===0||i===series.length-1).forEach(d=>{const dot=s("circle",{cx:x(d.year),cy:y(d.medianPay),r:3.5,fill:color});tip(dot,`<strong>${sex} · ${d.year}</strong>HK$${fmt(d.medianPay)}`);svg.appendChild(dot);});});}

function renderUnemployment(){const {svg,width,height}=makeSvg("#unemployment-chart");const rows=data.unemploymentAnnual;const m={top:20,right:32,bottom:55,left:55};const x=linear([rows[0].year,rows.at(-1).year],[m.left,width-m.right]);const max=Math.ceil(Math.max(...rows.map(d=>d.rate)));const y=linear([0,max],[height-m.bottom,m.top]);yGrid(svg,y,[0,2,4,6,8].filter(v=>v<=max),m.left,width-m.right,v=>`${v}%`,"Unemployment rate (%)");xAxis(svg,x,[1985,1995,2005,2015,2025],height-m.bottom,String,"Year");const area=areaPath(rows.map(d=>[x(d.year),y(d.rate)]),rows.map(d=>[x(d.year),y(0)]));svg.appendChild(s("path",{d:area,fill:"rgba(127,116,167,.13)"}));svg.appendChild(s("path",{d:linePath(rows.map(d=>[x(d.year),y(d.rate)])),fill:"none",stroke:"#7F74A7","stroke-width":3}));[{year:2003,label:"SARS"},{year:2008,label:"GFC",offset:width<440?13:0},{year:2020,label:"COVID-19"}].forEach(e=>{svg.appendChild(s("line",{x1:x(e.year),x2:x(e.year),y1:m.top,y2:height-m.bottom,stroke:"#BE6482","stroke-dasharray":"3 4"}));svg.appendChild(s("text",{x:x(e.year),y:m.top+13+(e.offset||0),"text-anchor":"middle",fill:"#9A6E96",class:"tick-label"},e.label));});rows.forEach(d=>{const dot=s("circle",{cx:x(d.year),cy:y(d.rate),r:7,fill:"transparent"});tip(dot,`<strong>${d.year}</strong>${fmt(d.rate,1)}% unemployment`);svg.appendChild(dot);});}
function renderCrisis(){const selected=$("#crisis-select").value;const {svg,width,height}=makeSvg("#crisis-chart");const all=data.crisisRecovery,crises=[...new Set(all.map(d=>d.crisis))];const rows=selected==="all"?all:all.filter(d=>d.crisis===selected);const m={top:42,right:22,bottom:55,left:60};const x=linear([-8,16],[m.left,width-m.right]);const min=Math.floor(Math.min(...all.map(d=>d.changePp))),max=Math.ceil(Math.max(...all.map(d=>d.changePp)));const y=linear([min,max],[height-m.bottom,m.top]);yGrid(svg,y,[min,0,max],m.left,width-m.right,v=>`${v>0?"+":""}${v} pp`,"Change (pp)");xAxis(svg,x,[-8,-4,0,4,8,12,16],height-m.bottom,v=>v>0?`+${v}`:v,"Quarters from event onset");svg.appendChild(s("line",{x1:x(0),x2:x(0),y1:m.top,y2:height-m.bottom,stroke:"#7C7270","stroke-width":1.5}));crises.forEach((crisis,i)=>{const series=rows.filter(d=>d.crisis===crisis);if(!series.length)return;const color=palette[i];svg.appendChild(s("path",{d:linePath(series.map(d=>[x(d.relativeQuarter),y(d.changePp)])),fill:"none",stroke:color,"stroke-width":3}));const legendX=8+i*(width-16)/crises.length; svg.append(s("rect",{x:legendX,y:9,width:9,height:9,rx:2,fill:color}),s("text",{x:legendX+13,y:18,class:"tick-label"},crisis.startsWith("Global") ? "GFC" : crisis.split(" ")[0]));series.forEach(d=>{const dot=s("circle",{cx:x(d.relativeQuarter),cy:y(d.changePp),r:5,fill:"transparent"});tip(dot,`<strong>${crisis}</strong>Quarter ${d.relativeQuarter>=0?"+":""}${d.relativeQuarter}<br>${d.changePp>=0?"+":""}${fmt(d.changePp,1)} pp`);svg.appendChild(dot);});});}
function renderRiskGroup(){const group=$("#risk-group").value;const rows=(group==="age"?data.unemploymentAge2025.map(d=>({label:d.age,value:d.rate})):data.unemploymentEducation2025.map(d=>({label:d.education,value:d.rate}))).sort((a,b)=>b.value-a.value);const {svg,width,height}=makeSvg("#risk-group-chart");const m={top:12,right:45,bottom:50,left:width<520?130:185};const max=Math.ceil(Math.max(...rows.map(d=>d.value)));const x=linear([0,max],[m.left,width-m.right]);const rowH=(height-m.top-m.bottom)/rows.length;xAxis(svg,x,[0,Math.ceil(max/2),max],height-m.bottom,v=>`${v}%`,"Unemployment rate (%)");rows.forEach((d,i)=>{const y=m.top+i*rowH+5;const bar=s("rect",{x:m.left,y,width:x(d.value)-m.left,height:Math.max(12,rowH-10),rx:3,fill:palette[i % palette.length]});tip(bar,`<strong>${d.label}</strong>${fmt(d.value,1)}%`);svg.append(bar,s("text",{x:m.left-9,y:y+(rowH-10)/2+4,"text-anchor":"end",class:"bar-label"},d.label.length>29?d.label.slice(0,27)+"…":d.label),s("text",{x:x(d.value)+7,y:y+(rowH-10)/2+4,class:"tick-label"},`${fmt(d.value,1)}%`));});}

function fitChartLabels() {
  $$(".chapter-panel.active .chart svg").forEach(svg => {
    svg.querySelectorAll('.bar-label[text-anchor="end"]').forEach(label => {
      const availableWidth = Number(label.getAttribute("x")) - 4;
      const original = label.textContent;
      let length = original.length;
      while (length > 2 && label.getComputedTextLength() > availableWidth) {
        label.textContent = original.slice(0, --length).trimEnd() + "…";
      }
    });
  });
}

const renderers={markets:()=>{renderAge();renderMiddleAge();renderUnder35();},structure:()=>{renderTotalEmployment();renderIndustryShare();renderStatus();renderOccupation();},risk:()=>{renderUnemployment();renderCrisis();renderRiskGroup();},equity:()=>{renderParticipation();renderGenderEmployment();renderPayGap();renderPayTrend();}};
function switchChapter(name,scroll=false){activeChapter=name;$$('[data-chapter]').forEach(b=>{const on=b.dataset.chapter===name;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));});$$('[data-panel]').forEach(p=>{const on=p.dataset.panel===name;p.hidden=!on;p.classList.toggle("active",on);});history.replaceState(null,"",`#${name}`);requestAnimationFrame(()=>renderers[name]());if(scroll)$(".chapter-tabs").scrollIntoView({block:"start"});}
function populateSelects(){const years=[...new Set(data.employmentStatus.map(d=>d.year))].sort((a,b)=>b-a),year=$("#composition-year");years.forEach(v=>year.add(new Option(v,v)));year.value=years[0];const crises=[...new Set(data.crisisRecovery.map(d=>d.crisis))];crises.forEach(v=>$("#crisis-select").add(new Option(v,v)));}
function setup(){populateSelects();$$('[data-chapter]').forEach(b=>b.addEventListener("click",()=>switchChapter(b.dataset.chapter)));$("#industry-share-reset").addEventListener("click",()=>{selectedIndustryShare=null;renderIndustryShare();});$("#composition-year").addEventListener("change",()=>{renderStatus();renderOccupation();});$("#participation-year").addEventListener("change",renderParticipation);$("#pay-sort").addEventListener("change",renderPayGap);$("#crisis-select").addEventListener("change",renderCrisis);$("#risk-group").addEventListener("change",renderRiskGroup);const hash=location.hash.replace("#","");if(Object.hasOwn(renderers,hash))activeChapter=hash;switchChapter(activeChapter);let timer;addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(()=>renderers[activeChapter](),160);});}

fetch("data/data.json").then(r=>r.json()).then(json=>{data=json;setup();}).catch(error=>{console.error(error);document.body.insertAdjacentHTML("beforeend",'<p style="padding:40px">Data could not be loaded.</p>');});
