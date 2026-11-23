const NS = "http://www.w3.org/2000/svg";
const tooltip = document.getElementById("tooltip");
const palette = ["#7F74A7", "#9B93C9", "#BE6482", "#C799BC", "#9C9290", "#C6C1F0", "#9A6E96", "#DDB5D5", "#6F6F6F", "#B898BC"];
const femaleColor = "#BE6482", maleColor = "#7F74A7";
const mainlandColor = "#9A6E96", hongKongColor = "#9B93C9";
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
let industryEmploymentBySex;
let industryPayBySex;
let participationHistory;
let riskAgeHistory;
let riskEducationHistory;
let selectedRiskEducation = null;
let participationTimer;
let activeChapter = "structure";
let highlightedMarketRegion = "all";
let selectedMarketPeriod = "latest";
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

function desktopDashboard() {
  return matchMedia("(min-width: 900px) and (min-height: 600px)").matches;
}

function makeSvg(selector) {
  const container = $(selector);
  container.replaceChildren();
  const width = container.clientWidth || 700;
  const height = desktopDashboard() ? container.clientHeight : Math.max(240, container.clientHeight || 340);
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
function marketRegionMark(node, region) {
  node.dataset.marketRegion = region;
  node.style.cursor = "pointer";
  node.setAttribute("tabindex", "0");
  node.setAttribute("role", "button");
  node.setAttribute("aria-label", `Highlight ${region}`);
  const select = () => {
    highlightedMarketRegion = highlightedMarketRegion === region ? "all" : region;
    updateMarketHighlight();
  };
  node.addEventListener("click", select);
  node.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
  });
  node.style.opacity = highlightedMarketRegion === "all" || highlightedMarketRegion === region ? "1" : ".18";
}
function updateMarketHighlight() {
  $$("[data-market-region]").forEach(node => {
    const on = highlightedMarketRegion === "all" || node.dataset.marketRegion === highlightedMarketRegion;
    node.style.opacity = on ? "1" : ".18";
  });
}


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
    const l = s("rect", { x: center - 54 - size(left.share), y, width: size(left.share), height: h, rx: 3, fill: mainlandColor });
    const r = s("rect", { x: center + 54, y, width: size(right.share), height: h, rx: 3, fill: hongKongColor });
    marketRegionMark(l, "Mainland China"); marketRegionMark(r, "Hong Kong");
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
  [["内地", "Mainland China", mainlandColor], ["香港", "Hong Kong", hongKongColor]].forEach(([key, label, color], index) => {
    const series = rows.filter(d => d.region === key);
    const line = s("path", { d: linePath(series.map(d => [x(d.year), y(d.share)])), fill: "none", stroke: color, "stroke-width": 3 });
    marketRegionMark(line, label);
    svg.appendChild(line);
    series.forEach(d => {
      const dot = s("circle", { cx: x(d.year), cy: y(d.share), r: 4, fill: color });
      marketRegionMark(dot, label);
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
  const industryRows = selectedMarketPeriod === "early" ? data.under35ByIndustryEarly : data.under35ByIndustry;
  const industries=[...new Set(industryRows.map(d=>d.industry))]; const max=70; const x=linear([0,max],[m.left,width-m.right]); const rowH=(height-m.top-m.bottom)/industries.length;
  [0,20,40,60].forEach(t=>{svg.appendChild(s("line",{x1:x(t),x2:x(t),y1:m.top,y2:height-m.bottom,class:"grid-line"}));}); xAxis(svg,x,[0,20,40,60],height-m.bottom,v=>`${v}%`,"Workers under 35 within industry (%)");
  industries.forEach((industry,i)=>{const y=m.top+i*rowH; const a=industryRows.find(d=>d.industry===industry&&d.region==="内地"); const b=industryRows.find(d=>d.industry===industry&&d.region==="香港");
    svg.appendChild(s("text",{x:m.left-10,y:y+rowH/2+4,"text-anchor":"end",class:"bar-label"},industry.length>34?industry.slice(0,32)+"…":industry));
    [[a,mainlandColor,-5,"Mainland China"],[b,hongKongColor,6,"Hong Kong"]].forEach(([d,color,offset,label])=>{const bar=s("line",{x1:x(0),x2:x(d.share),y1:y+rowH/2+offset,y2:y+rowH/2+offset,stroke:color,"stroke-width":6,"stroke-linecap":"round"});marketRegionMark(bar,label);tip(bar,`<strong>${industry} · ${label}</strong>${fmt(d.share,1)}%`);svg.appendChild(bar);});
  });
}

function renderTotalEmployment() {
  const {svg,width,height}=makeSvg("#total-employment-chart"); const m={top:25,right:45,bottom:51,left:58}; const rows=data.totalEmployment;
  const x=linear([rows[0].year,rows.at(-1).year],[m.left,width-m.right]); const min=Math.floor(Math.min(...rows.map(d=>d.thousand))/100)*100; const max=Math.ceil(Math.max(...rows.map(d=>d.thousand))/100)*100; const y=linear([min,max],[height-m.bottom,m.top]);
  yGrid(svg,y,[min,(min+max)/2,max],m.left,width-m.right,v=>fmt(v,0),"Employed persons ('000)"); xAxis(svg,x,[2008,2012,2016,2020,2025],height-m.bottom,String,"Year");
  const area=areaPath(rows.map(d=>[x(d.year),y(d.thousand)]),rows.map(d=>[x(d.year),y(min)]));
  const gradient = s("linearGradient", { id: "employment-gradient", x1: "0%", x2: "0%", y1: "100%", y2: "0%" });
  gradient.append(s("stop", { offset: "0%", "stop-color": "#C6C1F0", "stop-opacity": .25 }), s("stop", { offset: "100%", "stop-color": "#7F74A7", "stop-opacity": .55 }));
  const defs = s("defs");
  defs.appendChild(gradient);
  svg.append(defs, s("path", { d: area, fill: "url(#employment-gradient)" }));
  svg.appendChild(s("path",{d:linePath(rows.map(d=>[x(d.year),y(d.thousand)])),fill:"none",stroke:maleColor,"stroke-width":3}));
  rows.forEach(d => {
    const selected = d.year === compositionYear();
    const available = data.employmentStatus.some(row => row.year === d.year) && data.occupationMix.some(row => row.year === d.year);
    const dot = s("circle", { cx: x(d.year), cy: y(d.thousand), r: selected ? 6 : 4,
      fill: maleColor, stroke: selected ? "#fff" : "none", "stroke-width": 2,
      tabindex: available ? "0" : "-1", role: "button", "aria-disabled": String(!available), "aria-label": available ? `Select ${d.year}` : `${d.year}: linked data unavailable`,
      "aria-pressed": String(selected), "data-year": d.year, style: available ? "cursor: pointer" : "cursor: default" });
    const select = () => {
      if (!available) return;
      $("#composition-year").value = d.year;
      renderers.structure();
    };
    dot.addEventListener("click", select);
    dot.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); }
    });
    tip(dot, `<strong>${d.year}</strong>${fmt(d.thousand,1)} thousand employed<br>${available ? "Click to explore this year" : "Linked data available from 2016"}`);
    svg.appendChild(dot);
  });
}

function drawIndustryShare() {
  const selected=selectedIndustryShare; const {svg,width,height}=makeSvg("#industry-share-chart"); const m={top:12,right:20,bottom:50,left:58};
  const industries=[...new Set(data.industryShares.map(d=>d.industry))], years=[...new Set(data.industryShares.map(d=>d.year))].sort((a,b)=>a-b); const x=linear([years[0],years.at(-1)],[m.left,width-m.right]);
  const plot = {svg,x,top:m.top,bottom:height-m.bottom};
  const short={"Manufacturing":"Manufacturing","Import/export trade and wholesale":"Trade & wholesale","Retail, accommodation and food services":"Retail & lodging","Transportation, storage, postal and courier services, information and communications":"Transport & ICT","Financing, insurance, real estate, professional and business services":"Finance & business","Public administration, social and personal services":"Public & social","Construction":"Construction","Other industries":"Other"};
  $("#industry-share-legend").replaceChildren(...industries.map(industry => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = short[industry];
    button.title = industry;
    button.style.setProperty("--industry-color", industryShareColors[industry]);
    button.setAttribute("aria-pressed", String(selected === industry));
    button.addEventListener("click", () => {
      selectedIndustryShare = selectedIndustryShare === industry ? null : industry;
      renderIndustryShare();
    });
    return button;
  }));
  $("#industry-share-reset").hidden=!selected;
  if(selected){
    const rows=data.industryShares.filter(d=>d.industry===selected); const max=Math.ceil(Math.max(...rows.map(d=>d.share))/5)*5; const y=linear([0,max],[height-m.bottom,m.top]); yGrid(svg,y,[0,max/2,max],m.left,width-m.right,v=>`${fmt(v,0)}%`,"Employment share (%)"); xAxis(svg,x,[2008,2012,2016,2020,2025],height-m.bottom,String,"Year");
    const color=industryShareColors[selected],area=s("path",{d:areaPath(rows.map(d=>[x(d.year),y(d.share)]),rows.map(d=>[x(d.year),y(0)])),fill:color,opacity:.24,stroke:color,"stroke-width":3,class:"interactive-area"});
    tip(area,`<strong>${selected}</strong>Click again to return to all industries.`);area.addEventListener("click",()=>{selectedIndustryShare=null;renderIndustryShare();});svg.appendChild(area);rows.forEach(d => {
      const available = d.year >= 2016;
      const dot = s("circle", { cx: x(d.year), cy: y(d.share),
        r: d.year === compositionYear() ? 5 : 3.5, fill: color,
        "data-year": d.year, tabindex: available ? "0" : "-1",
        role: "button", "aria-disabled": String(!available),
        "aria-pressed": String(d.year === compositionYear()),
        "aria-label": `Select ${d.year}`, style: available ? "cursor: pointer" : "cursor: default" });
      const selectYear = () => {
        if (!available) return;
        $("#composition-year").value = d.year;
        hideTip();
        renderers.structure();
      };
      dot.addEventListener("click", selectYear);
      dot.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectYear(); }
      });
      tip(dot, `<strong>${selected} · ${d.year}</strong>${fmt(d.share,1)}%<br>${available ? "Click to explore this year" : "Linked data available from 2016"}`);
      svg.appendChild(dot);
    }); return plot;
  }
  const y=linear([0,100],[height-m.bottom,m.top]); yGrid(svg,y,[0,25,50,75,100],m.left,width-m.right,v=>`${v}%`,"Employment share (%)"); xAxis(svg,x,[2008,2012,2016,2020,2025],height-m.bottom,String,"Year");
  const stacks=new Map(industries.map(i=>[i,[]])); years.forEach(year=>{let total=0;industries.forEach(industry=>{const value=data.industryShares.find(d=>d.year===year&&d.industry===industry)?.share||0;stacks.get(industry).push({year,value,y0:total,y1:total+value});total+=value;});});
  industries.forEach(industry=>{const rows=stacks.get(industry);const p=s("path",{d:areaPath(rows.map(d=>[x(d.year),y(d.y1)]),rows.map(d=>[x(d.year),y(d.y0)])),fill:industryShareColors[industry],opacity:.86,stroke:"#fff","stroke-width":.7,class:"interactive-area"});tip(p,`<strong>${industry}</strong>Click to isolate this industry.`);p.addEventListener("click",()=>{selectedIndustryShare=industry;renderIndustryShare();});svg.appendChild(p);});
  return plot;
}

function renderIndustryShare() {
  const {svg,x:yearScale,top,bottom} = drawIndustryShare();
  const year = compositionYear();
  const x = yearScale(year);
  const labelY = bottom+19;
  const rows = data.industryShares.filter(row => row.year === year &&
    (!selectedIndustryShare || row.industry === selectedIndustryShare));
  svg.appendChild(s("line", { x1: x, x2: x, y1: top, y2: bottom,
    stroke: "#857C96", "stroke-width": .75, "stroke-dasharray": "3 3", "pointer-events": "none" }));
  let yearLabel;
  for (const label of svg.querySelectorAll(".tick-label")) {
    if (+label.getAttribute("y") !== labelY) continue;
    if (label.textContent === String(year)) yearLabel = label;
    else if (Math.abs(+label.getAttribute("x") - x) < 30) label.remove();
  }
  if (yearLabel) {
    yearLabel.classList.add("direct-label");
  } else {
    svg.append(
      s("line",{x1:x,x2:x,y1:bottom,y2:bottom+5,class:"axis-line"}),
      s("text",{x,y:labelY,"text-anchor":"middle",class:"direct-label"},String(year))
    );
  }
  const marker = s("rect", { x: x - 7, y: top, width: 14, height: bottom - top, fill: "transparent" });
  tip(marker, `<strong>${year} · Employment share</strong>` +
    rows.map(row => `${row.industry}: ${fmt(row.share, 1)}%`).join("<br>"));
  if (selectedIndustryShare) marker.setAttribute("pointer-events", "none");
  svg.appendChild(marker);
}

function showCompositionUnavailable(svg, width, height) {
  svg.appendChild(s("text", { x: width / 2, y: height / 2, "text-anchor": "middle",
    class: "tick-label" }, `No data available for ${compositionYear()} (available: 2016–2025)`));
}

function compositionYear(){return +$("#composition-year").value;}
function renderStatus(){
  const {svg,width,height}=makeSvg("#status-chart"),rows=data.employmentStatus.filter(d=>d.year===compositionYear()),total=rows.reduce((a,d)=>a+d.employedThousand,0),cx=Math.min(width*.22,125),cy=height/2,r=Math.min(88,height*.36,width*.20),r0=r*.58;let angle=-Math.PI/2;
  if (!rows.length) { showCompositionUnavailable(svg, width, height); return; }
  rows.forEach((d,i)=>{const next=angle+d.employedThousand/total*Math.PI*2,color=palette[i];const arc=s("path",{d:donutArc(cx,cy,r0,r,angle,next),fill:color,stroke:"#fff","stroke-width":2});tip(arc,`<strong>${d.status}</strong>${fmt(d.employedThousand,1)} thousand<br>${fmt(d.employedThousand/total*100,1)}%`);svg.appendChild(arc);angle=next;});
  svg.append(s("text",{x:cx,y:cy-2,"text-anchor":"middle",class:"donut-value"},String(compositionYear())),s("text",{x:cx,y:cy+18,"text-anchor":"middle",class:"tick-label donut-caption"},"employment status"));
  const baselineYear = Math.min(...data.employmentStatus.map(row=>row.year));
  const baseline = data.employmentStatus.filter(row=>row.year===baselineYear);
  const baselineTotal = baseline.reduce((sum,row)=>sum+row.employedThousand,0);
  const baseShares = new Map(baseline.map(row=>[row.status,row.employedThousand/baselineTotal*100]));
  const totals = new Map();
  for(const row of data.employmentStatus) totals.set(row.year,(totals.get(row.year) ?? 0)+row.employedThousand);
  const limit = Math.max(1,Math.ceil(Math.max(...data.employmentStatus.map(row=>
    Math.abs(row.employedThousand/totals.get(row.year)*100-(baseShares.get(row.status) ?? 0))))));
  const x = Math.round(width*.45), right = width-8;
  const half = Math.max(0,(right-x-57)/2), zero = x+half;
  const step = Math.min(55,(height-30)/rows.length);
  const firstY = Math.max(12,(height-rows.length*step)/2);
  const zh = window.HKJobI18n?.getLanguage()==="zh";
  const heading = zh ? `较 ${baselineYear} 年变化（百分点）` : `Change since ${baselineYear} (pp)`;
  rows.forEach((d,i)=>{
    const y=firstY+i*step, share=d.employedThousand/total*100;
    const change=share-(baseShares.get(d.status) ?? 0);
    const rounded=Number(change.toFixed(2));
    const signed=`${rounded>0?"+":""}${fmt(rounded,2)}`;
    const barY=y+27, length=Math.abs(change)/limit*half;
    svg.append(
      s("rect",{x,y:y-9,width:9,height:9,rx:2,fill:palette[i]}),
      s("text",{x:x+13,y,class:"bar-label"},d.status),
      s("text",{x:x+13,y:y+13,class:"tick-label"},`${fmt(d.employedThousand,1)}k · ${fmt(share,1)}%`),
      s("line",{x1:x,x2:x+2*half,y1:barY,y2:barY,stroke:"#E5E0EB","stroke-width":4}),
      s("rect",{x:change<0?zero-length:zero,y:barY-3,width:length,height:6,rx:1,fill:palette[i]}),
      s("line",{x1:zero,x2:zero,y1:barY-5,y2:barY+5,stroke:"#62568C"}),
      s("text",{x:right,y:barY+3,"text-anchor":"end",class:"tick-label"},signed)
    );
  });
  svg.append(s("text",{x:right,y:height-6,"text-anchor":"end",class:"tick-label"},heading));
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
  if (!rows.length) { showCompositionUnavailable(svg, width, height); return; }

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

    if (rows.indexOf(row) >= rows.length - 2) continue;
    const inset = Math.min(7, tile.width * 0.08, tile.height * 0.08);
    const label = s("foreignObject", {
      x: tile.x + inset, y: tile.y + inset,
      width: tile.width - 2 * inset, height: tile.height - 2 * inset,
      "pointer-events": "none"
    });
    const text = document.createElement("div");
    text.className = "occupation-tile-label";
    const name = document.createElement("strong");
    name.textContent = short[row.occupation] ?? row.occupation;
    const share = document.createElement("span");
    share.textContent = `${fmt(row.employedThousand / total * 100, 1)}%`;
    text.append(name, share);
    label.append(text);
    svg.appendChild(label);
    const maxHeight = tile.height - 2 * inset;
    for (let size = 12; text.scrollHeight > maxHeight && size > 6; size--) {
      text.style.fontSize = `${size - 1}px`;
    }
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

function renderParticipation() {
  const { svg, width } = makeSvg("#participation-chart");
  const linked = $("#participation-mode").value === "linked";
  const selectedYear = +$("#gender-employment-year").value;
  const rows = linked ? participationHistory.filter(row => row.year === selectedYear) : data.participationByAgeSex;
  $("#participation-selected-year").textContent = linked ? selectedYear : "1985 · 2005 · 2025";
  $("#participation-play").disabled = !linked || !participationHistory.length;
  $("#participation-chart").setAttribute("aria-label", linked ? `Participation by age and sex in ${selectedYear}` : "Participation in 1985, 2005 and 2025");
  const ages = [...new Set(rows.map(row => row.age))];
  const years = linked ? [{ year: selectedYear, color: maleColor }] : [
    { year: 1985, color: "#7F74A7" },
    { year: 2005, color: "#BE6482" },
    { year: 2025, color: "#DDB5D5" }
  ];
  $("#participation-legend").hidden = linked;
  $("#participation-legend").replaceChildren(...years.map(({ year, color }) => {
    const item = document.createElement("li");
    item.style.setProperty("--year-color", color);
    item.dataset.year = year;
    item.tabIndex = 0;
    item.textContent = year;
    return item;
  }));

  const stacked = matchMedia("(max-width: 760px)").matches && width < 520;
  const peer = $("#gender-employment-chart");
  const chartTop = $("#participation-chart").getBoundingClientRect().top;
  const peerAxis = peer.getBoundingClientRect().top + peer.clientHeight - 44;
  const panelHeight = desktopDashboard() ? $("#participation-chart").clientHeight : stacked ? 200 : Math.max(170, Math.round(peerAxis - chartTop + 43));
  const left = 41, right = 9, gap = 20;
  const panelWidth = (width - left - right - (stacked ? 0 : gap)) / (stacked ? 1 : 2);
  const height = stacked ? panelHeight * 2 + 12 : panelHeight;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.height = desktopDashboard() ? "100%" : `${height}px`;
  const ticks = [0, 20, 40, 60, 80, 100];

  if (!stacked) svg.appendChild(s("line", {
    x1: left + panelWidth + gap / 2, x2: left + panelWidth + gap / 2,
    y1: 5, y2: panelHeight - 21, class: "grid-line"
  }));

  ["Male", "Female"].forEach((sex, index) => {
    const start = left + (stacked ? 0 : index * (panelWidth + gap));
    const top = stacked ? index * (panelHeight + 12) : 0;
    const baseline = top + panelHeight - 70;
    const y = linear([0, 100], [baseline, top + 34]);
    const column = panelWidth / ages.length;
    const x = i => start + (i + .5) * column;
    const dotRadius = Math.min(5, column * .24);
    svg.appendChild(s("text", { x: start + panelWidth / 2, y: top + 17, "text-anchor": "middle", class: "direct-label" }, sex));

    ticks.forEach(tick => {
      svg.appendChild(s("line", { x1: start, x2: start + panelWidth, y1: y(tick), y2: y(tick), class: "grid-line" }));
      if (!index || stacked) svg.appendChild(s("text", {
        x: start - 6, y: y(tick) + 4, "text-anchor": "end", class: "tick-label"
      }, `${tick}%`));
    });

    ages.forEach((age, i) => {
      const labelX = x(i), labelY = baseline + 10;
      svg.appendChild(s("text", {
        x: labelX, y: labelY, "text-anchor": "end", class: "tick-label",
        style: `font-size: ${Math.min(11.5, column - 1)}px`,
        transform: `rotate(-90 ${labelX} ${labelY})`
      }, age));
    });

    svg.appendChild(s("text", {
      x: start + panelWidth / 2, y: top + panelHeight - 5,
      "text-anchor": "middle", class: "axis-label"
    }, "Age (years)"));

    if (linked) {
      const points = ages.flatMap((age, i) => {
        const row = rows.find(row => row.sex === sex && row.age === age);
        return row ? [[x(i), y(row.rate)]] : [];
      });
      if (points.length) {
        const color = sex === "Male" ? maleColor : femaleColor;
        const curve = linePath(points);
        const gradientId = `participation-area-${index}`;
        const gradient = s("linearGradient", { id: gradientId, x2: "0%", y2: "100%" });
        gradient.append(s("stop", { offset: "0%", "stop-color": color, "stop-opacity": .29 }),
          s("stop", { offset: "100%", "stop-color": color, "stop-opacity": .03 }));
        svg.append(gradient,
          s("path", { d: `${curve} L${points.at(-1)[0]},${baseline} L${points[0][0]},${baseline} Z`, fill: `url(#${gradientId})`, "pointer-events": "none" }),
          s("path", { d: curve, fill: "none", stroke: color, "stroke-width": 2.4 }));
      }
    }
    rows.filter(row => row.sex === sex).forEach(row => {
      const yearIndex = years.findIndex(item => item.year === row.year);
      if (yearIndex < 0) return;
      const dot = s("circle", {
        cx: x(ages.indexOf(row.age)),
        cy: y(row.rate), r: dotRadius, fill: linked ? (sex === "Male" ? maleColor : femaleColor) : years[yearIndex].color,
        "data-year": row.year, "data-sex": sex, "data-age": row.age
      });
      tip(dot, `<strong>${sex} · ${row.age} · ${row.year}</strong>${fmt(row.rate, 1)}% participation`);
      svg.appendChild(dot);
    });
  });
}

function genderGroups(){const map=new Map();data.genderPay2025.forEach(d=>{if(!map.has(d.industry))map.set(d.industry,{industry:d.industry});map.get(d.industry)[d.sex.toLowerCase()]={pay:d.medianPay,employment:d.employedThousand};});return [...map.values()];}
const industryEmploymentAliases = {
  "Construction": "Construction",
  "Financing, insurance, real estate, professional and business services": "Finance & business",
  "Import/export trade and wholesale": "Trade & wholesale",
  "Manufacturing": "Manufacturing",
  "Public administration, social and personal services": "Public & social",
  "Retail, accommodation and food services": "Retail & lodging",
  "Transportation, storage, postal and courier services, information and communications": "Transport & IT",
  "Other industries": "Other"
};

let selectedPayIndustry = null;
function renderSexLegend(svg, width) {
  [["Male", maleColor], ["Female", femaleColor]].forEach(([name, color], i) => {
    const legendX = width - 124 + i * 60;
    svg.append(s("circle", { cx: legendX + 4, cy: 9, r: 4, fill: color }),
      s("text", { x: legendX + 12, y: 13, class: "tick-label" }, name));
  });
}
function renderGenderEmployment() {
  renderRepresentationGap();
  const { svg, width, height } = makeSvg("#gender-employment-chart");
  const year = $("#gender-employment-year").value;
  $("#gender-employment-year-label").textContent = year;
  $("#pay-trend-year").textContent = year;
  const employment = industryEmploymentBySex[year];
  const industries = Object.entries(industryEmploymentAliases);
  const m = { top: 24, right: 19, bottom: 44, left: Math.min(126, Math.round(width * .47)) };
  const x = linear([0, 100], [m.left, width - m.right]);
  const baseline = height - m.bottom;
  const rowHeight = (baseline - m.top) / industries.length;

  xAxis(svg, x, width < 320 ? [0, 50, 100] : [0, 25, 50, 75, 100], baseline,
    value => `${value}%`, "Share of industry employment (%)");

  industries.forEach(([industry, alias], index) => {
    const [male, female] = employment[industry];
    const total = male + female;
    const femaleShare = female / total * 100;
    const maleShare = 100 - femaleShare;
    const center = m.top + (index + .5) * rowHeight;
    const segments = [
      { sex: "Male", start: 0, end: maleShare, share: maleShare, color: maleColor },
      { sex: "Female", start: maleShare, end: 100, share: femaleShare, color: femaleColor }
    ];
    svg.appendChild(s("text", { x: m.left - 8, y: center + 4, "text-anchor": "end", class: "bar-label" }, alias));

    const labels = segments.map(({ start, end, share, color, sex }) => {
      const startX = x(start), endX = x(end);
      const percentage = `${fmt(share, 2)}%`;
      const label = s("text", { x: (startX + endX) / 2, "text-anchor": "middle", "font-size": 9, "font-weight": 400, "pointer-events": "none" }, percentage);
      svg.appendChild(label);
      return { startX, endX, label, labelWidth: label.getComputedTextLength(), percentage, color, sex };
    });
    const barHeight = 13;
    const barTop = center - barHeight / 2;
    const clipId = `gender-employment-bar-${index}`;
    const clip = s("clipPath", { id: clipId });
    clip.appendChild(s("rect", {
      x: x(0), y: barTop, width: x(100) - x(0), height: barHeight, rx: barHeight / 2
    }));
    svg.appendChild(clip);
    for (const { startX, endX, label, labelWidth, percentage, color, sex } of labels) {
      const bar = s("rect", { x: startX, y: barTop, width: endX - startX, height: barHeight, fill: color, "clip-path": `url(#${clipId})` });
      tip(bar, `<strong>${industry} · ${sex} · ${year}</strong>${percentage}`);
      svg.insertBefore(bar, label);
      if (index === 0 && sex === "Female") {
        label.setAttribute("fill", "#51436E");
        label.setAttribute("x", endX);
        label.setAttribute("text-anchor", "end");
        label.setAttribute("y", barTop - 4);
        continue;
      }
      const available = endX - startX - 3;
      const size = clamp(9 * available / labelWidth, 7, 9);
      label.setAttribute("font-size", size);
      if (label.getComputedTextLength() > available) {
        label.textContent = `${fmt(Number(percentage.replace("%", "")), 0)}%`;
      }
      const textWidth = label.getComputedTextLength();
      const fitsInside = textWidth <= available;
      label.setAttribute("fill", fitsInside ? "#fff" : "#282D33");
      label.setAttribute("y", fitsInside ? center + size * .34 : barTop - 2);
      if (!fitsInside) label.setAttribute("x", clamp((startX + endX) / 2, x(0) + textWidth / 2, x(100) - textWidth / 2));
    }
  });
}
function renderPayGap() {
  const year = $("#gender-employment-year").value;
  $("#industry-pay-year-label").textContent = year;
  const { svg, width, height } = makeSvg("#pay-gap-chart");
  const industries = Object.entries(industryEmploymentAliases);
  const m = { top: 28, right: 48, bottom: 52, left: Math.min(126, Math.round(width * .47)) + 33 };
  const highestPay = Math.max(...Object.values(industryPayBySex)
    .flatMap(industries => Object.values(industries).flat()));
  const max = Math.ceil(highestPay / 10000) * 10000;
  const baseline = height - m.bottom;
  const x = linear([0, max], [m.left, width - m.right]);
  const rowHeight = (baseline - m.top) / industries.length;
  const ticks = Array.from({ length: max / 10000 + 1 }, (_, i) => i * 10000);
  ticks.slice(1, -1).forEach(value => {
    svg.appendChild(s("line", { x1: x(value), x2: x(value), y1: m.top, y2: baseline, class: "grid-line" }));
  });
  renderSexLegend(svg, width);
  xAxis(svg, x, ticks, baseline, value => `${fmt(value / 1000, 0)}k`, "Median monthly earnings (HKD)");

  industries.forEach(([industry, alias], index) => {
    const firstMark = svg.children.length;
    const [male, female] = industryPayBySex[year][industry];
    const gap = male - female;
    const y = m.top + (index + .5) * rowHeight;
    const gradientId = `industry-pay-gradient-${index}`;
    const gradient = s("linearGradient", {
      id: gradientId, gradientUnits: "userSpaceOnUse", x1: x(male), x2: x(female), y1: y, y2: y
    });
    gradient.append(
      s("stop", { offset: "0%", "stop-color": maleColor }),
      s("stop", { offset: "100%", "stop-color": femaleColor })
    );
    svg.append(gradient);
    const line = s("line", {
      x1: x(female), x2: x(male), y1: y, y2: y,
      stroke: `url(#${gradientId})`, "stroke-width": 2, "stroke-opacity": .8
    });
    const femaleDot = s("circle", { cx: x(female), cy: y, r: 6, fill: femaleColor, "fill-opacity": .62, stroke: "#973e5e", "stroke-width": 1.2 });
    const maleDot = s("circle", { cx: x(male), cy: y, r: 6, fill: maleColor, "fill-opacity": .62, stroke: "#5c507e", "stroke-width": 1.2 });
    tip(femaleDot, `<strong>${industry} · Female · ${year}</strong>HK$${fmt(female)}`);
    tip(maleDot, `<strong>${industry} · Male · ${year}</strong>HK$${fmt(male)}<br>Gap HK$${fmt(gap)}`);
    svg.append(line, femaleDot, maleDot,
      s("text", { x: m.left - 41, y: y + 4, "text-anchor": "end", class: "bar-label" }, alias));
    // Face the labels outward so equal or close pay values remain readable.
    const endpoints = [female, male].sort((a, b) => a - b);
    endpoints.forEach((pay, i) => {
      svg.appendChild(s("text", {
        x: x(pay) + (i === 0 ? -8 : 8), y: y + 3,
        "text-anchor": i === 0 ? "end" : "start", class: "tick-label",
        style: "font-size: 9px", "pointer-events": "none"
      }, fmt(pay)));
    });
    if (selectedPayIndustry && selectedPayIndustry !== industry) Array.from(svg.children).slice(firstMark).forEach(mark=>mark.setAttribute("opacity",".24"));
  });
}

function renderRepresentationGap() {
  const {svg,width,height} = makeSvg("#representation-chart");
  const year = $("#gender-employment-year").value;
  $("#representation-chart-label").textContent=year;
  const rows = Object.keys(industryEmploymentAliases).map(industry => {
    const [men,women] = industryEmploymentBySex[year][industry];
    const [malePay,femalePay] = industryPayBySex[year][industry];
    return {industry, employment:men+women, share:100*women/(women+men), gap:malePay-femalePay};
  });
  const x = linear([0,100],[65,width-22]);
  // Leave space above the highest labeled tick for observed gaps up to HK$17,000.
  const y = linear([-5000,19000],[height-49,18]);
  const ticks = [-5000,0,5000,10000,15000];
  const colorStops = [[-1500,[222,145,92]],[0,[224,211,221]],[15000,[143,76,132]]];
  function gapColor(gap) {
    const [[min,start],[max,end]] = gap < 0 ? colorStops.slice(0,2) : colorStops.slice(1);
    const ratio = clamp((gap-min)/(max-min),0,1);
    return `rgb(${start.map((value,i)=>Math.round(value+(end[i]-value)*ratio)).join(",")})`;
  }
  yGrid(svg,y,ticks,x(0),x(100),v=>v/1000+"k","Male − female pay (HKD)");
  xAxis(svg,x,[0,25,50,75,100],height-49,v=>v+"%","Women’s employment share");
  svg.append(s("line",{x1:x(50),x2:x(50),y1:6,y2:height-49,stroke:"#cd7596","stroke-dasharray":"3 3"}),s("line",{x1:x(0),x2:x(100),y1:y(0),y2:y(0),stroke:"#999","stroke-dasharray":"3 3"}));
  const marks=[], max=Math.max(...rows.map(d=>d.employment));
  rows.sort((a,b)=>b.employment-a.employment).forEach(({industry,share,gap,employment}) => {
    const radius=Math.sqrt(employment/max)*Math.min(21,height/11);
    const dot=s("circle",{cx:x(share),cy:y(gap),r:radius,fill:gapColor(gap),"fill-opacity":.8,stroke:"white",tabindex:0,role:"button","aria-label":industry,opacity:!selectedPayIndustry||selectedPayIndustry===industry?1:.25});
    tip(dot,`<strong>${industryEmploymentAliases[industry]} · ${year}</strong>${fmt(share,1)}% · HK$${fmt(gap)}`);
    const choose=()=>{selectedPayIndustry=selectedPayIndustry===industry?null:industry;hideTip();renderGenderEmployment();renderPayGap();};
    dot.onclick=choose;
    dot.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose();}};
    const label=s("text",{x:0,y:0,"font-size":10,"pointer-events":"none"},industryEmploymentAliases[industry]);
    svg.append(dot,label);
    marks.push({x:x(share),y:y(gap),r:radius,label});
  });
  labelScatter(svg,marks,{left:x(0)+2,right:width-4,top:2,bottom:height-51});
}

function renderPayTrend() {
  const { container, svg, width, height } = makeSvg("#pay-trend-chart");
  const rows = data.overallPayTrend;
  const years = [...new Set(rows.map(row => row.year))].sort((a, b) => a - b);
  const byYear = years.map(year => ({
    year,
    male: rows.find(row => row.year === year && row.sex === "Male").medianPay,
    female: rows.find(row => row.year === year && row.sex === "Female").medianPay
  }));
  const latest = byYear.at(-1);
  const gap = latest.male - latest.female;
  const m = { top: 49, right: 49, bottom: 51, left: 47 };
  const bottom = height - m.bottom;
  const right = width - m.right;
  const x = linear([years[0], latest.year], [m.left, right]);
  const max = Math.ceil(Math.max(...rows.map(row => row.medianPay)) / 5000) * 5000;
  const y = linear([0, max], [bottom, m.top]);
  const yTicks = Array.from({ length: max / 5000 + 1 }, (_, i) => i * 5000);
  const xTicks = years.filter(year => (year - years[0]) % (width >= 500 ? 5 : 10) === 0);
  svg.removeAttribute("aria-hidden");
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "Median monthly pay and gap over time");

  yGrid(svg, y, yTicks, m.left, right, value => `${value / 1000}k`, "Monthly pay (HKD)");
  xTicks.forEach(year => {
    svg.appendChild(s("line", { x1: x(year), x2: x(year), y1: m.top, y2: bottom, class: "grid-line" }));
  });
  xAxis(svg, x, xTicks, bottom, String, "Year");
  const malePoints = byYear.map(row => [x(row.year), y(row.male)]);
  const femalePoints = byYear.map(row => [x(row.year), y(row.female)]);
  svg.append(
    s("path", { d: areaPath(malePoints, femalePoints), fill: "#C5BFBE", opacity: .52 }),
    s("path", { d: linePath(malePoints), fill: "none", stroke: maleColor, "stroke-width": 3, "stroke-linejoin": "round" }),
    s("path", { d: linePath(femalePoints), fill: "none", stroke: femaleColor, "stroke-width": 3, "stroke-linejoin": "round" })
  );

  const summary = s("text", { x: width / 2, y: 15, "text-anchor": "middle", class: "pay-trend-summary" });
  summary.append(
    s("tspan", { x: width / 2 }, `Monthly pay gap in ${latest.year}: HK$${fmt(gap)}`),
    s("tspan", { x: width / 2, dy: 15 }, `Women earned ${fmt(gap / latest.male * 100, 1)}% less`)
  );
  svg.appendChild(summary);
  [["Male", latest.male, maleColor], ["Female", latest.female, femaleColor]].forEach(([sex, pay, color]) => {
    const label = s("text", { x: right + 6, y: y(pay) - 1, fill: color, class: "pay-trend-end" });
    label.append(s("tspan", { x: right + 6 }, sex), s("tspan", { x: right + 6, dy: 13 }, fmt(pay)));
    svg.appendChild(label);
  });

  const selection = s("g", { "aria-hidden": "true", visibility: "hidden" });
  const guide = s("line", { y1: m.top, y2: bottom, class: "pay-trend-guide" });
  const dots = [maleColor, femaleColor].map(color => s("circle", { r: 4, fill: color, stroke: "#fff" }));
  selection.append(guide, ...dots);
  const target = s("rect", {
    x: m.left, y: m.top - 5, width: right - m.left, height: bottom - m.top + 5,
    fill: "transparent", tabindex: "0", "aria-label": "Explore pay by year with the left and right arrow keys"
  });
  svg.append(selection, target);

  const popup = document.createElement("div");
  popup.className = "pay-trend-popup";
  popup.hidden = true;
  container.appendChild(popup);
  let pinnedIndex = null;
  let activeIndex = Math.max(0, years.indexOf(Number($("#gender-employment-year").value)));

  function showYear(index) {
    activeIndex = index;
    const { year, male, female } = byYear[index];
    const position = x(year);
    guide.setAttribute("x1", position);
    guide.setAttribute("x2", position);
    dots.forEach((dot, i) => {
      dot.setAttribute("cx", position);
      dot.setAttribute("cy", y(i === 0 ? male : female));
    });
    selection.setAttribute("visibility", "visible");
    popup.innerHTML = `<dl><dt>Year</dt><dd>${year}</dd>
      <dt>Men’s monthly pay</dt><dd>HK$${fmt(male)}</dd>
      <dt>Women’s monthly pay</dt><dd>HK$${fmt(female)}</dd>
      <dt>Monthly pay gap</dt><dd>HK$${fmt(male - female)}</dd></dl>`;
    popup.hidden = false;
    const preferred = position + 10 + popup.offsetWidth <= width ? position + 10 : position - popup.offsetWidth - 10;
    popup.style.left = `${clamp(preferred, 4, width - popup.offsetWidth - 4)}px`;
    popup.style.top = `${clamp(y(female) + 8, m.top, bottom - popup.offsetHeight - 3)}px`;
  }

  function clearYear() {
    selection.setAttribute("visibility", "hidden");
    popup.hidden = true;
  }

  function indexAt(event) {
    const bounds = svg.getBoundingClientRect();
    const position = (event.clientX - bounds.left) * width / bounds.width;
    return clamp(Math.round((position - m.left) / (right - m.left) * (years.length - 1)), 0, years.length - 1);
  }

  container.onYearSelected = year => {
    const index = years.indexOf(year);
    if (index < 0) return;
    if (activeChapter !== "equity") return;
    pinnedIndex = index;
    showYear(index);
  };
  target.addEventListener("pointermove", event => {
    if (pinnedIndex === null) showYear(indexAt(event));
  });
  target.addEventListener("pointerleave", () => {
    if (pinnedIndex === null) clearYear();
  });
  function syncIndustryYear(index) {
    const year = years[index];
    if (!Object.hasOwn(industryEmploymentBySex, year) || !Object.hasOwn(industryPayBySex, year)) return;
    const select = $("#gender-employment-year");
    select.value = year;
    select.dispatchEvent(new Event("change"));
  }

  target.addEventListener("click", event => {
    const index = indexAt(event);
    pinnedIndex = pinnedIndex === index ? null : index;
    if (pinnedIndex === null) clearYear();
    else {
      syncIndustryYear(index);
      showYear(index);
    }
  });
  target.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      pinnedIndex = null;
      clearYear();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const step = event.key === "ArrowLeft" ? -1 : 1;
      pinnedIndex = clamp(activeIndex + step, 0, years.length - 1);
      showYear(pinnedIndex);
      syncIndustryYear(pinnedIndex);
    }
  });
  target.addEventListener("blur", () => {
    pinnedIndex = null;
    clearYear();
  });
}

function setRiskYear(year) {
  $("#risk-year").value = year;
  syncYearOutput("#risk-year");
  renderUnemployment();
  renderRiskGroup(); renderRiskHeatmap();
  renderEducationRisk();
}
function riskYear() { return +$("#risk-year").value; }
function crisisYear(name) { return +(name.match(/(2003|2008|2020)/)?.[0] || 0); }

function renderUnemployment() {
  const { svg, width, height } = makeSvg("#unemployment-chart");
  const rows = data.unemploymentAnnual;
  const m = { top: 30, right: 20, bottom: 52, left: 50 };
  const x = linear([1985, 2025], [m.left, width-m.right]);
  const y = linear([0, 9], [height-m.bottom, m.top]);
  yGrid(svg,y,[0,2,4,6,8],m.left,width-m.right,v=>v+"%","Unemployment (%)");
  xAxis(svg,x,width<400?[1985,2005,2025]:[1985,1995,2005,2015,2025],height-m.bottom,String,"Year");
  const gradient = s("linearGradient", { id: "unemployment-rate-gradient", gradientUnits: "userSpaceOnUse",
    x1: 0, x2: 0, y1: y(0), y2: y(9) });
  gradient.append(s("stop", { offset: "0%", "stop-color": "#E3A9C8" }),
    s("stop", { offset: "100%", "stop-color": "#51406F" }));
  const defs = s("defs");
  defs.appendChild(gradient);
  svg.append(defs, s("path",{d:linePath(rows.map(d=>[x(d.year),y(d.rate)])),fill:"none",stroke:"url(#unemployment-rate-gradient)","stroke-width":2.5}));
  const rateColor = rate => {
    const light = [227,169,200], dark = [81,64,111];
    return `rgb(${light.map((value,i)=>Math.round(value+(dark[i]-value)*rate/9)).join(",")})`;
  };
  [...new Set(data.crisisRecovery.map(d=>d.crisis))].forEach((name,i)=>{
    const year=crisisYear(name), selected=year===riskYear();
    const label=s("text",{x:x(year),y:12+(i%2)*13,"text-anchor":"middle",class:"tick-label",style:"cursor:pointer",tabindex:"0",role:"button","aria-label":name},year===2003?"SARS":year===2008?"GFC":"COVID-19");
    const choose=()=>setRiskYear(year);
    label.addEventListener("click",choose);
    label.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose();}});
    svg.append(s("line",{x1:x(year),x2:x(year),y1:m.top,y2:height-m.bottom,stroke:palette[i],"stroke-dasharray":"3 3",opacity:selected?1:.45}),label);
  });
  rows.forEach(d=>{
    const dot=s("circle",{cx:x(d.year),cy:y(d.rate),r:d.year===riskYear()?5:3,fill:rateColor(d.rate),"data-year":d.year,tabindex:"0",role:"button","aria-label":`Select ${d.year}`,style:"cursor:pointer"});
    const choose=()=>{hideTip();setRiskYear(d.year);};
    dot.addEventListener("click",choose);
    dot.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose();}});
    tip(dot,`<strong>${d.year}</strong>${fmt(d.rate,1)}% unemployment<br>Click to compare age groups`);
    svg.appendChild(dot);
  });
}

function renderEducationRisk() {
  const {svg,width,height}=makeSvg("#education-chart");
  const groups=[...new Set(riskEducationHistory.map(row=>row.education))];
  const colors=["#7F74A7","#7C7270","#9B93C9","#DDB5D5","#9C9290","#C5BFBE","#F498B6","#BE6482","#C6C1F0"];
  const legend=$("#education-legend");
  legend.replaceChildren(...groups.map((education,i)=>{
    const item=document.createElement("li"),button=document.createElement("button");
    button.type="button";
    button.textContent=education;
    button.style.setProperty("--education-color",colors[i]);
    button.setAttribute("aria-pressed",String(selectedRiskEducation===education));
    button.addEventListener("click",()=>{
      selectedRiskEducation=selectedRiskEducation===education?null:education;
      renderEducationRisk();
    });
    item.appendChild(button);
    return item;
  }));
  const m={top:18,right:20,bottom:52,left:48};
  const max=Math.ceil(Math.max(...riskEducationHistory.map(row=>row.rate))/2)*2;
  const x=linear([1985,2025],[m.left,width-m.right]);
  const y=linear([0,max],[height-m.bottom,m.top]);
  yGrid(svg,y,Array.from({length:max/2+1},(_,i)=>i*2),m.left,width-m.right,v=>v+"%","Unemployment (%)");
  xAxis(svg,x,width<400?[1985,2005,2025]:[1985,1995,2005,2015,2025],height-m.bottom,String,"Year");
  groups.sort((a,b)=>Number(a===selectedRiskEducation)-Number(b===selectedRiskEducation)).forEach((education)=>{
    const index=[...new Set(riskEducationHistory.map(row=>row.education))].indexOf(education);
    const rows=riskEducationHistory.filter(row=>row.education===education).sort((a,b)=>a.year-b.year);
    const group=s("g",{"data-education":education,opacity:selectedRiskEducation&&selectedRiskEducation!==education?.16:1});
    rows.forEach((row,i)=>{
      const previous=rows[i-1];
      if(previous&&row.year===previous.year+1)group.appendChild(s("line",{x1:x(previous.year),x2:x(row.year),y1:y(previous.rate),y2:y(row.rate),stroke:colors[index],"stroke-width":selectedRiskEducation===education?3:2}));
      const dot=s("circle",{cx:x(row.year),cy:y(row.rate),r:row.year===riskYear()?4:3,fill:colors[index],"data-year":row.year,role:"button",tabindex:"0","aria-label":`${education}, ${row.year}`,style:"cursor:pointer"});
      const choose=()=>{hideTip();setRiskYear(row.year);};
      dot.addEventListener("click",choose);
      dot.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();choose();}});
      tip(dot,`<strong>${education}</strong>Year: ${row.year}<br>Unemployment rate: ${fmt(row.rate,1)}%`);
      group.appendChild(dot);
    });
    svg.appendChild(group);
  });
  svg.appendChild(s("line",{x1:x(riskYear()),x2:x(riskYear()),y1:m.top,y2:height-m.bottom,stroke:"#857C96","stroke-width":.75,"stroke-dasharray":"3 3","pointer-events":"none"}));
}

function renderRiskGroup() {
  const {svg,width,height}=makeSvg("#risk-group-chart");
  $("#risk-age-year").textContent=riskYear();
  const rows=riskAgeHistory.filter(d=>d.year===riskYear()).sort((a,b)=>b.rate-a.rate);
  const m={top:8,right:36,bottom:48,left:64};
  const max=Math.max(2, Math.ceil(Math.max(...rows.map(d=>d.rate)) * 1.1 / 2) * 2);
  const x=linear([0,max],[m.left,width-m.right]);
  const rowHeight=(height-m.top-m.bottom)/rows.length;
  xAxis(svg,x,[0,max/2,max],height-m.bottom,v=>v+"%","Unemployment rate (%)");
  rows.forEach((d,i)=>{
    const center=m.top+(i+.5)*rowHeight;
    const bar=s("rect",{x:m.left,y:center-7,width:x(d.rate)-m.left,height:14,rx:2,fill:d.age===$("#risk-age").value?"#824A7E":"#EDB1D4",tabindex:"0",role:"button","aria-label":d.age,"data-age":d.age,style:"cursor:pointer"});
    const choose=()=>{$("#risk-age").value=d.age;hideTip();renderRiskGroup(); renderRiskHeatmap();};
    bar.addEventListener("click",choose);
    bar.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose();}});
    tip(bar,`<strong>${d.age} · ${d.year}</strong>${fmt(d.rate,1)}% unemployment`);
    svg.append(bar,s("text",{x:m.left-7,y:center+4,"text-anchor":"end",class:"bar-label"},d.age),
      s("text",{x:x(d.rate)+5,y:center+4,class:"tick-label"},fmt(d.rate,1)));
  });
}

function renderCrisisRecovery() {
  const {svg,width,height}=makeSvg("#crisis-recovery");
  const rows=data.crisisRecovery;
  const left=47, right=width-14, bottom=height-44;
  const x=linear([-8,16],[left,right]);
  const y=linear([-4,5],[bottom,10]);
  yGrid(svg,y,[-4,-2,0,2,4],left,right,v=>v>0?"+"+v:v,"Change in unemployment (pp)");
  xAxis(svg,x,[-8,-4,0,4,8,12,16],bottom,String,"Quarters since crisis began");
  svg.append(
    s("line",{x1:left,x2:right,y1:y(0),y2:y(0),stroke:"#776a85","stroke-dasharray":"3 3"}),
    s("line",{x1:x(0),x2:x(0),y1:10,y2:bottom,stroke:"#aaa","stroke-dasharray":"3 3"})
  );
  const colors={2003:"#b95079",2008:"#9574cc",2020:"#62558c"};
  for(const crisis of new Set(rows.map(row=>row.crisis))){
    const points=rows.filter(row=>row.crisis===crisis).sort((a,b)=>a.relativeQuarter-b.relativeQuarter);
    const color=colors[crisisYear(crisis)];
    svg.append(s("path",{d:linePath(points.map(row=>[x(row.relativeQuarter),y(row.changePp)])),fill:"none",stroke:color,"stroke-width":2}));
    for(const row of points){
      const dot=s("circle",{cx:x(row.relativeQuarter),cy:y(row.changePp),r:3,fill:color});
      tip(dot,`<strong>${crisis}</strong>Q ${row.relativeQuarter} · ${fmt(row.changePp,1)} pp`);
      svg.append(dot);
    }
  }
}

function renderRiskHeatmap() {
  const {svg,width,height}=makeSvg("#risk-heatmap");
  const ages=[...new Set(riskAgeHistory.map(d=>d.age))];
  const years=[...new Set(riskAgeHistory.map(d=>d.year))].sort((a,b)=>a-b);
  const m={top:25,right:10,bottom:45,left:61};
  const cellWidth=(width-m.left-m.right)/years.length;
  const cellHeight=(height-m.top-m.bottom)/ages.length;
  const max=Math.max(...riskAgeHistory.map(d=>d.rate));
  const shade=rate=>{
    const amount=rate/max;
    const light=[242,235,246],dark=[112,65,119];
    return `rgb(${light.map((v,i)=>Math.round(v+(dark[i]-v)*amount)).join(",")})`;
  };
  const gradient=s("linearGradient",{id:"risk-heat-scale"});
  gradient.append(s("stop",{offset:"0%","stop-color":shade(0)}),s("stop",{offset:"100%","stop-color":shade(max)}));
  const defs=s("defs");defs.appendChild(gradient);svg.appendChild(defs);
  svg.append(s("rect",{x:m.left,y:5,width:75,height:7,fill:"url(#risk-heat-scale)"}),
    s("text",{x:m.left+80,y:12,class:"tick-label"},`0–${fmt(max,1)}% unemployment`));
  ages.forEach((age,i)=>{
    svg.appendChild(s("text",{x:m.left-7,y:m.top+(i+.5)*cellHeight+4,"text-anchor":"end",class:"bar-label"},age));
    years.forEach((year,j)=>{
      const row=riskAgeHistory.find(d=>d.age===age&&d.year===year);
      if(!row)return;
      const selected=year===riskYear()&&age===$("#risk-age").value;
      const cell=s("rect",{x:m.left+j*cellWidth+.4,y:m.top+i*cellHeight+.4,
        width:Math.max(.5,cellWidth-.8),height:cellHeight-.8,fill:shade(row.rate),
        stroke:year===riskYear()?"#51436E":"none","stroke-width":selected?2:1,
        tabindex:"0",role:"button","aria-label":`${age}, ${year}, ${fmt(row.rate,1)}%`,
        "data-year":year,"data-age":age,style:"cursor:pointer"});
      const choose=()=>{$("#risk-age").value=age;hideTip();setRiskYear(year);};
      cell.addEventListener("click",choose);
      cell.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();choose();}});
      tip(cell,`<strong>${age} · ${year}</strong>${fmt(row.rate,1)}% unemployment`);
      svg.appendChild(cell);
    });
  });
  [1985,1995,2005,2015,2025].forEach(year=>svg.appendChild(s("text",{
    x:m.left+(years.indexOf(year)+.5)*cellWidth,y:height-m.bottom+17,
    "text-anchor":"middle",class:"tick-label"},String(year))));
  svg.appendChild(s("text",{x:(m.left+width-m.right)/2,y:height-7,"text-anchor":"middle",class:"axis-label"},"Year"));
}

function fitChartLabels() {
  $$(".chapter-panel.active .chart svg").forEach(svg => {
    svg.querySelectorAll('.bar-label[text-anchor="end"]').forEach(label => {
      if (label.childElementCount) return;
      const availableWidth = Number(label.getAttribute("x")) - 4;
      const original = label.textContent;
      let length = original.length;
      while (length > 2 && label.getComputedTextLength() > availableWidth) {
        label.textContent = original.slice(0, --length).trimEnd() + "…";
      }
    });
  });
}


function paintRange(input) {
  if (!input || input.type !== "range") return;
  const min = Number(input.min), max = Number(input.max), value = Number(input.value);
  const percent = max > min ? Math.max(0, Math.min(100, (value - min) / (max - min) * 100)) : 100;
  input.style.setProperty("--range-progress", percent + "%");
}
function syncYearOutput(id) {
  const input = $(id);
  const output = input?.nextElementSibling;
  if (output && output.tagName === "OUTPUT") output.textContent = input.value;
  paintRange(input);
}
const renderers = {
  markets: () => {},
  structure: () => { syncYearOutput("#composition-year"); renderTotalEmployment(); renderIndustryShare(); renderStatus(); renderOccupation(); },
  risk: () => { syncYearOutput("#risk-year"); renderEducationRisk(); renderUnemployment(); renderRiskGroup(); renderRiskHeatmap(); renderCrisisRecovery(); },
  equity: () => { syncYearOutput("#gender-employment-year"); renderParticipation(); renderGenderEmployment(); renderPayTrend(); renderPayGap(); }
};

function switchChapter(name, scroll=false, preserveHash=false) {
  if (!Object.hasOwn(renderers, name)) name = "structure";
  activeChapter = name;
  const review = ["markets", "equity"].includes(name);
  $$("[data-section]").forEach(link => link.classList.toggle("active", link.dataset.section === (review ? "review" : "explore")));
  $$("[data-chapter]").forEach(tab => tab.hidden = ["markets", "equity"].includes(tab.dataset.chapter) !== review);
  $$('[data-chapter]').forEach(b => {
    const on = b.dataset.chapter === name;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", String(on));
  });
  $$('[data-panel]').forEach(p => {
    const on = p.dataset.panel === name;
    p.hidden = !on;
    p.classList.toggle("active", on);
  });
  if (!preserveHash) history.replaceState(null, "", "#" + name);
  requestAnimationFrame(() => renderers[name]());
  if (scroll) window.scrollTo(0, 0);
}
function populateSelects(){const years=[...new Set(data.totalEmployment.map(d=>d.year))].filter(v=>data.employmentStatus.some(row=>row.year===v)&&data.occupationMix.some(row=>row.year===v)).sort((a,b)=>a-b);const year=$("#composition-year");year.min=years[0];year.max=years.at(-1);year.value=years.at(-1);syncYearOutput("#composition-year");}
function setupIndustryYear() {
  const select = $("#gender-employment-year");
  const years = Object.keys(industryEmploymentBySex)
    .filter(year => Object.hasOwn(industryPayBySex, year))
    .sort((a, b) => b - a);
  select.min = Math.min(...years.map(Number)); select.max = Math.max(...years.map(Number)); select.value = select.max; syncYearOutput("#gender-employment-year");
  select.addEventListener("change", () => {
    syncYearOutput("#gender-employment-year");
    renderGenderEmployment();
    renderPayGap();
    renderParticipation();
    $("#pay-trend-chart").dispatchEvent(new CustomEvent("yearselected", { detail: +select.value }));
  });
}

function setupParticipationControls() {
  const play = $("#participation-play");
  const stop = () => {
    clearInterval(participationTimer);
    participationTimer = null;
    play.textContent = "Play";
  };
  $("#participation-mode").addEventListener("change", () => { stop(); renderParticipation(); });
  play.addEventListener("click", () => {
    if (participationTimer) { stop(); return; }
    const select = $("#gender-employment-year");
    const years = Array.from({ length: Number(select.max) - Number(select.min) + 1 }, (_, index) => Number(select.min) + index);
    const advance = () => {
      const index = years.indexOf(+select.value);
      if (index === years.length - 1) { stop(); return; }
      select.value = years[index + 1];
      select.dispatchEvent(new Event("change"));
    };
    if (+select.value === years.at(-1)) {
      select.value = years[0];
      select.dispatchEvent(new Event("change"));
    }
    play.textContent = "Pause";
    participationTimer = setInterval(advance, 1000);
  });
  $("#pay-trend-chart").addEventListener("yearselected", event => {
    $("#pay-trend-chart").onYearSelected?.(event.detail);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  $$("[data-chapter]").forEach(button => button.addEventListener("click", stop));
}

function setupRiskControls() {
  const years = [...new Set(riskAgeHistory.map(d => d.year))].sort((a, b) => a - b);
  const year = $("#risk-year");
  year.min = years[0]; year.max = years.at(-1); year.value = years.at(-1);
  syncYearOutput("#risk-year");
}

function setup() {
  setupRiskControls();
  populateSelects();
  setupIndustryYear();
  setupParticipationControls();
  $$("[data-chapter]").forEach(button => button.addEventListener("click", () => switchChapter(button.dataset.chapter)));
  const begin = $("#start-exploring");
  begin.addEventListener("click", event => {
    event.preventDefault();
    document.body.classList.remove("is-landing");
    switchChapter("markets");
    window.scrollTo(0, 0);
  });
  $("#industry-share-reset").addEventListener("click", () => { selectedIndustryShare = null; renderIndustryShare(); });
  $("#composition-year").addEventListener("input", () => renderers.structure());
  $("#risk-year").addEventListener("input", () => setRiskYear(riskYear()));
  $("#gender-employment-year").addEventListener("input", event => event.target.dispatchEvent(new Event("change")));
  const hash = location.hash.replace("#", "");
  if (Object.hasOwn(renderers, hash)) {
    document.body.classList.remove("is-landing");
    switchChapter(hash, false, true);
  } else {
    document.body.classList.add("is-landing");
  }
  window.addEventListener("hashchange", () => {
    const next = location.hash.slice(1);
    if (Object.hasOwn(renderers,next)) {
      document.body.classList.remove("is-landing");
      switchChapter(next, false, true);
      window.scrollTo(0, 0);
    } else if (next === "landing") {
      document.body.classList.add("is-landing");
      window.scrollTo(0, 0);
    }
  });
  let timer;
  addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(() => renderers[activeChapter](), 160); });
}

const industryEmploymentRequest = fetch("data/industry-employment-by-sex.json")
  .then(response => response.json())
  .then(json => json.years)
  .catch(error => {
    console.warn("Industry employment history could not be loaded.", error);
    return null;
  });

const industryPayRequest = fetch("data/industry-pay-by-sex.json")
  .then(response => response.json())
  .then(json => json.years)
  .catch(error => {
    console.warn("Industry pay history could not be loaded.", error);
    return null;
  });

Promise.all([fetch("data/data.json?v=2").then(response => response.json()), industryEmploymentRequest, industryPayRequest, fetch("data/participation-by-year.json").then(response => response.json()).then(json => json.rows).catch(() => []), fetch("data/risk-age-history.json").then(response => response.json()), fetch("data/risk-education-history.json").then(response => response.json())])
  .then(([dashboardData, employmentHistory, payHistory, participationRows, riskRows, educationRows]) => {
    riskEducationHistory = educationRows;
    riskAgeHistory = riskRows;
    participationHistory = participationRows.length ? participationRows : dashboardData.participationByAgeSex;
    data = dashboardData;
    industryEmploymentBySex = employmentHistory ?? {
      2025: Object.fromEntries(genderGroups().map(row => [row.industry, [row.male.employment, row.female.employment]]))
    };
    industryPayBySex = payHistory ?? {
      2025: Object.fromEntries(genderGroups().map(row => [row.industry, [row.male.pay, row.female.pay]]))
    };
    setup();
  }).catch(error=>{console.error(error);document.body.insertAdjacentHTML("beforeend",'<p style="padding:40px">Data could not be loaded.</p>');});
