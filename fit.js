(() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const tooltip = document.getElementById("tooltip");
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const fmt = (value, digits = 0) => Number(value).toLocaleString("en-HK", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
  const number = value => Number.isFinite(value)
    ? Number(value).toLocaleString("en-HK", { maximumFractionDigits: 1 })
    : "—";
  const percent = value => Number.isFinite(value) ? `${fmt(value, 1)}%` : "—";
  const money = value => Number.isFinite(value) ? `HK$${fmt(value)}` : "—";
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);

  const palette = ["#62568C", "#8A67C7", "#D7647D", "#4F9DA6", "#D9824B", "#65758B", "#4E8B63", "#C58A3B", "#3E79B7", "#A184B3"];
  const occupationOrder = [
    "Managers",
    "Professionals",
    "Associate professionals",
    "Clerical support workers",
    "Services and sales workers",
    "Skilled agricultural and fishery workers",
    "Craft and related trades workers",
    "Plant and machine operators and assemblers",
    "Elementary occupations",
  ];
  const defaultPreferences = { targetPay: 15000, maxHours: 54, payYear: 2025 };
  const state = {
    ...defaultPreferences,
    selected: [],
    focus: null,
    adjustment: "",
    quarterIndex: 41,
    startYear: 2016,
    expansionYear: 2016,
    offer: 25000,
    rent: 10000,
    living: 6500,
    deduct: 2000,
  };

  let fitData = null;

  function prepare(json) {
    const demand = json.demand2026Q2.map(row => ({
      id: row.industry,
      name: row.industry,
      rate: row.vacancyRate,
      yoy: row.employmentYoY,
      openings: row.vacancies,
      employment: row.employment,
    }));
    const occupations = json.occupations2026Q2.map(row => ({
      id: row.industry,
      name: row.occupation,
      count: row.vacancies,
      share: row.share,
    }));
    const pay = json.careerPay.map(row => ({
      id: row.broadIndustry,
      name: row.industry,
      year: row.year,
      pay25: row.payP25,
      pay50: row.payP50,
      pay75: row.payP75,
      hours25: row.hoursP25,
      hours50: row.hoursP50,
      hours75: row.hoursP75,
      mapping: row.mappingNote,
    }));
    const history = [];
    demand.forEach(industry => {
      const rows = json.demandTrend
        .filter(row => row.industry === industry.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      const base = rows[0]?.employment || 1;
      rows.forEach(row => {
        history.push({ id: industry.id, period: row.period, value: row.employment / base * 100 });
      });
    });

    const vacancyHistory = json.demandTrend.map(row => ({
      id: row.industry, name: row.industry, period: row.period,
      rate: row.vacancyRate, yoy: row.employmentYoY,
      openings: row.vacancies, employment: row.employment
    }));
    const quarters = [...new Set(vacancyHistory.map(row => row.period))].sort();
    return { demand, occupations, pay, history, vacancyHistory, quarters };
  }

  function list(names) {
    if (!names.length) return "";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  }

  function candidate(row) {
    const outgoings = state.rent + state.living + state.deduct;
    const surplus = Number.isFinite(row.pay50) ? row.pay50 - outgoings : null;
    const missing = ![row.pay50, row.hours50, surplus].every(Number.isFinite);
    const issues = [
      Number.isFinite(row.pay50) && row.pay50 < state.targetPay ? "Pay below target" : null,
      Number.isFinite(row.hours50) && row.hours50 > state.maxHours ? "Hours above limit" : null,
      missing ? "Pay or hours data missing" : null,
    ].filter(Boolean);
    return {
      ...row,
      surplus,
      issues,
      match: !issues.length,
      missing,
      demand: fitData.demand.find(item => item.id === row.id),
    };
  }


  function validYearRows() {
    return fitData.pay.filter(row => row.year === state.payYear &&
      Number.isFinite(row.pay50) && Number.isFinite(row.hours50));
  }

  function matches(row) {
    return row.pay50 >= state.targetPay - .001 &&
      row.hours50 <= state.maxHours + .001;
  }
  function expensesTotal() { return state.rent + state.living + state.deduct; }

  function fitContext() {
    const matched = validYearRows().filter(matches).map(candidate)
      .sort((a, b) => (b.pay50 - a.pay50) || a.name.localeCompare(b.name));
    if (!validYearRows().some(row => row.name === state.focus)) state.focus = null;
    const feature = validYearRows().map(candidate).find(row => row.name === state.focus) || matched[0] || null;
    const broad = new Set(state.focus && feature ? [feature.id] : matched.map(row => row.id));
    const chosen = fitData.demand.filter(row => broad.has(row.id));
    return { chosen, rows: matched, matched, featured: feature,
      budget: feature ? feature.pay50 - expensesTotal() : 0 };
  }

  function reconcileConstraints() {
    if (validYearRows().some(matches)) return;
    const rows = validYearRows();
    if (!rows.length) return;
    const desired = {pay: state.targetPay, hours: state.maxHours};
    const nearest = rows.slice().sort((a,b) => {
      const penalty = row =>
        Math.max(0, desired.pay - row.pay50) / 10000 +
        Math.max(0, row.hours50 - desired.hours) / 10;
      return penalty(a) - penalty(b);
    })[0];
    state.targetPay = Math.min(state.targetPay, Math.floor(nearest.pay50 / 100) * 100);
    state.maxHours = Math.max(state.maxHours, Math.ceil(nearest.hours50 * 10) / 10);
    state.adjustment = "Criteria adjusted to keep at least one matching industry.";
  }

  function sliderLimits(key) {
    const rows = validYearRows();
    if (key === "targetPay") {
      const eligible = rows.filter(row => row.hours50 <= state.maxHours + .001);
      return {
        min: Math.floor(Math.min(...rows.map(row => row.pay50)) / 100) * 100,
        max: Math.floor(Math.max(...eligible.map(row => row.pay50)) / 100) * 100,
        step: 100
      };
    }
    if (key === "maxHours") {
      const eligible = rows.filter(row => row.pay50 >= state.targetPay - .001);
      return {
        min: Math.ceil(Math.min(...eligible.map(row => row.hours50)) * 10) / 10,
        max: Math.ceil(Math.max(...rows.map(row => row.hours50)) * 10) / 10,
        step: .1
      };
    }
    const years = [...new Set(fitData.pay.map(row=>row.year))].sort((a,b)=>a-b);
    return {min:years[0],max:years.at(-1),step:1};
  }

  function formatValue(key, value) {
    if (key === "maxHours") return `${Number(value).toFixed(1)} h`;
    if (key === "payYear") return String(value);
    return money(Number(value));
  }

  function filterSlider(key, heading) {
    const lim = sliderLimits(key);
    const val = state[key];
    return `<label class="ff-slider-item">
      <span class="ff-slider-head"><span>${heading}</span><output for="filter-${key}" data-output="${key}">${formatValue(key, val)}</output></span>
      <input id="filter-${key}" type="range" data-control="${key}" min="${lim.min}" max="${lim.max}" step="${lim.step}" value="${val}" aria-label="${heading}">
      <span class="ff-slider-ends"><span data-min="${key}">${formatValue(key, lim.min)}</span><span data-max="${key}">${formatValue(key, lim.max)}</span></span>
    </label>`;
  }


  function paintRange(input) {
    if (!input || input.type !== "range") return;
    const a = Number(input.min), b = Number(input.max), v = Number(input.value);
    const percent = b > a ? Math.max(0, Math.min(100, (v - a) / (b - a) * 100)) : 100;
    input.style.setProperty("--range-progress", percent + "%");
  }
  function quarterLabel(period) {
    return period ? period.replace(/^(\d{4})Q([1-4])$/, "$1 Q$2") : "—";
  }
  function updateQuarterUI() {
    const slider = $("#quarter-slider");
    if (!slider) return;
    if (!slider) return;
    slider.min = 0; slider.max = fitData.quarters.length - 1;
    slider.value = state.quarterIndex;
    paintRange(slider);
    $("#quarter-value").textContent = quarterLabel(fitData.quarters[state.quarterIndex]);
    $("#quarter-start").textContent = quarterLabel(fitData.quarters[0]);
    $("#quarter-end").textContent = quarterLabel(fitData.quarters.at(-1));
  }
  function updateSliderLimits() {
    ["targetPay", "maxHours", "payYear"].forEach(key => {
      const lim = sliderLimits(key);
      const slider = document.getElementById("filter-" + key);
      if (!slider) return;
      slider.min = lim.min; slider.max = lim.max; slider.step = lim.step;
      slider.value = state[key];
      paintRange(slider);
      const out = document.querySelector('[data-output="' + key + '"]');
      const min = document.querySelector('[data-min="' + key + '"]');
      const max = document.querySelector('[data-max="' + key + '"]');
      if (out) out.textContent = formatValue(key, state[key]);
      if (min) min.textContent = formatValue(key, lim.min);
      if (max) max.textContent = formatValue(key, lim.max);
    });
    updateQuarterUI();
    ["rent", "living", "deduct"].forEach(key => {
      const inp = document.querySelector('[data-control="' + key + '"]');
      if (inp) { inp.value = state[key]; paintRange(inp); }
      const out = document.querySelector('[data-output="' + key + '"]');
      if (out) out.textContent = money(state[key]);
    });
  }
  const legend = entries => `<div class="ff-legend">${entries.map(([name, color]) =>
    `<span><i style="background:${color}"></i>${esc(name)}</span>`).join("")}</div>`;

  const chip = (action, value, title, pressed) =>
    `<button type="button" class="ff-chip" data-action="${action}" data-value="${esc(value)}"${pressed === undefined ? "" : ` aria-pressed="${pressed}"`}>${esc(title)}</button>`;

  const selectControl = (id, title, choices, render = value => value) =>
    `<label class="ff-field">${title}<select id="${id}" data-control="${id}">${choices.map(value =>
      `<option value="${esc(value)}"${String(state[id]) === String(value) ? " selected" : ""}>${esc(render(value))}</option>`).join("")}</select></label>`;

  const numberField = (id, title, value, step) =>
    `<label class="ff-field">${title}<input id="${id}" type="number" min="0" max="${id === "maxHours" ? 168 : 10000000}" step="${step}" value="${value}" data-control="${id}"></label>`;

  function figure({ id, title, unit, body, note, control = "", key = "", full = false }) {
    return `<figure class="ff-card${full ? " ff-full" : ""}" id="${id}">
      <div class="ff-card-head"><div><h3>${title}</h3><p class="ff-unit">${unit}</p></div>${control}</div>
      ${key}<div class="ff-viz">${body}</div><figcaption>${note}</figcaption></figure>`;
  }

  function heatTable(occupations, industries) {
    return `<div class="ff-table-scroll" tabindex="0" aria-label="Occupation shares within each industry, scrolls horizontally">
      <table class="ff-heat"><thead><tr><th scope="col">Occupation</th>${industries.map(row =>
        `<th scope="col">${esc(row.name)}</th>`).join("")}</tr></thead><tbody>${occupations.map(occupation => {
          const values = industries.map(industry => {
            const row = fitData.occupations.find(item => item.id === industry.id && item.name === occupation);
            const share = row?.share;
            if (!Number.isFinite(share)) return `<td>—</td>`;
            const opacity = .12 + .66 * Math.sqrt(share);
            const text = percent(share * 100);
            const tip = `${occupation} · ${industry.name} · ${text}`;
            return `<td><button type="button" data-action="vacancyIndustry" data-value="${esc(industry.id)}" data-tip="${esc(tip)}" aria-label="${esc(tip)}" aria-pressed="${selectedVacancyIndustry === industry.id}" style="background:color-mix(in srgb,#783b74 ${opacity*100}%,#f8d7ed);color:${opacity > .62 ? "white" : "#282D33"}">${text}</button></td>`;
          }).join("");
          return `<tr><th scope="row">${esc(occupation)}</th>${values}</tr>`;
        }).join("")}</tbody></table></div>`;
  }

  function intervals(rows, type) {
    const median = type === "pay" ? "pay50" : "hours50";
    const ordered = rows.slice();
    const isPay = type === "pay";
    const target = isPay ? state.targetPay : state.maxHours;
    const step = isPay ? 10000 : 10;
    const upper = Math.max(isPay ? 50000 : 60, target, ...rows.map(row => row[`${type}75`] ?? 0));
    const upperTick = Math.ceil(upper / step) * step;
    const low = isPay ? 0 : Math.min(30, target, ...rows.map(row => row.hours25 ?? 30));
    const high = upperTick === low ? upperTick + step : upperTick;
    const position = value => (value - low) / (high - low) * 100;
    const targetText = isPay ? money(target) : `${number(target)} hours`;
    const targetName = isPay ? "Target monthly pay" : "Weekly hours limit";
    return `<div class="ff-legend"><span><i style="background:#CDB5DE"></i>P25–P75</span><span><i style="background:#D7647D"></i>P50</span><span>Dashed line · ${targetName} ${targetText}</span></div>
      ${ordered.map(row => {
        const a = row[`${type}25`], m = row[median], b = row[`${type}75`];
        const unit = isPay ? "HKD/month" : "hours/week";
        const tip = [row.name, "25th percentile: " + number(a) + " " + unit,
          "Median: " + number(m) + " " + unit,
          "75th percentile: " + number(b) + " " + unit].join("\n");
        return `<div class="ff-range-lane"><button type="button" class="ff-range-name" data-action="focusIndustry" data-value="${esc(row.name)}" aria-pressed="${state.focus === row.name}">${esc(row.name)}</button><div class="ff-range-track">
          <span class="ff-range-ref" style="left:${position(target)}%"></span>
          ${[a, b].every(Number.isFinite) ? `<span class="ff-range-band" style="left:${position(a)}%;width:${position(b) - position(a)}%" data-tip="${esc(tip)}"></span>` : ""}
          ${Number.isFinite(m) ? `<button type="button" class="ff-range-point" style="left:${position(m)}%" data-tip="${esc(tip)}" aria-label="${esc(tip + (isPay ? " · Use in budget" : ""))}"${isPay ? ` data-action="focusIndustry" data-value="${esc(row.name)}"` : ""}></button>
            <span class="ff-range-value${position(m) > 68 ? " left" : ""}" style="left:${position(m)}%">${number(m)}</span>` : `<span class="ff-range-value">No data</span>`}
        </div></div>`;
      }).join("")}
      <div class="ff-range-axis">${Array.from({ length: 5 }, (_, index) => `<span>${number(low + (high - low) * index / 4)}</span>`).join("")}</div>`;
  }

  function axes(w, h, options) {
    const left = options.left ?? 47, right = w - (options.right ?? 18);
    const top = options.top ?? 16, bottom = h - (options.bottom ?? 31);
    const x = scale(options.x[0], options.x[1], left, right);
    const y = scale(options.y[0], options.y[1], bottom, top);
    const yTicks = options.yTicks ?? ticks(options.y[0], options.y[1]);
    const xTicks = options.xTicks ?? ticks(options.x[0], options.x[1]);
    const grid = yTicks.map(value => line(left, y(value), right, y(value)) + text(left - 7, y(value) + 4, (options.yFormat ?? number)(value), "end")).join("");
    const time = xTicks.map(value => text(x(value), bottom + 19, (options.xFormat ?? number)(value))).join("");
    return { left, right, top, bottom, x, y, grid: grid + time };
  }

  function scale(a, b, c, d) {
    return value => c + (value - a) / (b - a || 1) * (d - c);
  }

  function ticks(min, max, count = 4) {
    return Array.from({ length: count + 1 }, (_, index) => min + (max - min) * index / count);
  }

  function line(x1, y1, x2, y2, cls = "ff-gridline") {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
  }

  function text(x, y, label, anchor = "middle") {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(label)}</text>`;
  }

  function svg(w, h, label, content) {
    return `<svg viewBox="0 0 ${w} ${h}" aria-label="${esc(label)}">${content}</svg>`;
  }


  function bubbles(width, availableHeight, values) {
    if (!values.length) return '<p class="ff-empty">No vacancy data for this period.</p>';
    // Match the actual available chart height so the bottom axis never gets cropped.
    const w = Math.max(310, Math.round(width || 490));
    const height = Math.max(125, Math.round(availableHeight || 270));
    const rateValues = values.map(row => row.rate * 100).filter(Number.isFinite);
    const growthValues = values.map(row => row.yoy * 100).filter(Number.isFinite);
    const allQuarterRows = fitData.vacancyHistory.filter(row => row.period === fitData.quarters[state.quarterIndex]);
    const totalEmployment = allQuarterRows.reduce((sum, row) => sum + row.employment, 0);
    const totalVacancies = allQuarterRows.reduce((sum, row) => sum + row.openings, 0);
    const benchmark = totalEmployment + totalVacancies ? totalVacancies / (totalEmployment + totalVacancies) * 100 : 0;
    const rateMin = Math.max(0, Math.floor((Math.min(0, benchmark, ...rateValues) - .3) * 2) / 2);
    const rateMax = Math.max(rateMin + 1, Math.ceil((Math.max(benchmark, ...rateValues) + .45) * 2) / 2);
    const yoyMin = Math.min(-1, Math.floor(Math.min(0,...growthValues) - 1));
    const yoyMax = Math.max(1, Math.ceil(Math.max(0,...growthValues) + 1));
    const axis = axes(w, height, {
      x: [rateMin, rateMax], y: [yoyMin, yoyMax],
      xTicks: ticks(rateMin, rateMax, 4), yTicks: ticks(yoyMin, yoyMax, 4),
      xFormat: v => Number(v).toFixed(1) + "%",
      yFormat: v => Number(v).toFixed(1) + "%",
      left: 47, right: 18, bottom: 48, top: 25
    });
    let content = axis.grid
      + line(axis.left, axis.y(0), axis.right, axis.y(0), "ff-refline")
      + line(axis.x(benchmark), axis.top, axis.x(benchmark), axis.bottom, "ff-refline")
      + text(axis.right, height - 9, "Vacancy rate", "end");
    const max = Math.max(1, ...values.map(row => row.openings));
    values.slice().sort((a,b) => b.openings - a.openings).forEach(row => {
      const current = fitContext();
      const selected = !state.focus || current.featured?.id === row.id;
      const tip = [row.name, "Quarter: " + quarterLabel(row.period),
        "Vacancy rate: " + percent(row.rate * 100),
        "Vacancies: " + number(row.openings),
        "Employment YoY: " + percent(row.yoy * 100)].join("\n");
      const radius = Math.max(4, Math.sqrt(Math.max(0,row.openings) / max) * 19);
      content += `<circle cx="${axis.x(row.rate*100)}" cy="${axis.y(row.yoy*100)}" r="${radius}" fill="${row.yoy >= 0 ? "#62568C" : "#D7647D"}"
        opacity="${selected ? .86 : .22}" class="ff-bubble" data-tip="${esc(tip)}" data-action="bubble"
        data-value="${esc(row.id)}" role="button" tabindex="0" aria-label="${esc(tip)}" aria-pressed="${Boolean(state.focus && selected)}"/>`;
    });
    return svg(w, height, "Vacancy rate and employment year-on-year growth, " + quarterLabel(fitData.quarters[state.quarterIndex]), content);
  }


  // Responsive five-step waterfall. The SVG's viewBox follows the visible
  // chart box, instead of squeezing a hard-coded 234px chart into a short row.

  // Five-step waterfall, full card width and compact vertical scale.
  function waterfall(width, height, amounts) {
    const w = Math.max(300, Math.round(width || 960));
    const h = Math.max(125, Math.round(height || 164));
    const values = [amounts.offer, -amounts.rent, -amounts.living, -amounts.deduct];
    const labels = ["Monthly pay", "Rent", "Living", "Set-aside", "Surplus"];
    let running = 0;
    const steps = values.map((value, index) => {
      const from = running;
      running += value;
      return {label: labels[index], value, from, to: running};
    });
    steps.push({label: labels[4], value: running, from:0, to:running});
    const minValue = Math.min(0, ...steps.flatMap(step=>[step.from,step.to]));
    const maxValue = Math.max(1000, ...steps.flatMap(step=>[step.from,step.to]));
    const span = Math.max(1000, maxValue - minValue);
    const top=20, bottom=h-30;
    const upper = maxValue + span*.13;
    const lower = minValue - span*.05;
    const y = value=>bottom-(value-lower)/(upper-lower)*(bottom-top);
    const left=Math.max(26,w*.025), right=w-Math.max(26,w*.025);
    const slot=(right-left)/5;
    const x = index => left+slot*(index+.5);
    const bw=Math.max(18,Math.min(112,slot*.50));
    const labelSize=w<480?10:11;
    const fmtShort = value => (value<0?"−":"")+fmt(Math.abs(value)/1000,1)+"k";
    let content=`<line x1="${left}" y1="${y(0)}" x2="${right}" y2="${y(0)}" stroke="#E6DFEC" stroke-width="1" stroke-dasharray="4 4"/>`;
    steps.forEach((step,index)=>{
      const cx=x(index);
      const topY=Math.min(y(step.from),y(step.to));
      const bottomY=Math.max(y(step.from),y(step.to));
      const bh=Math.max(2,bottomY-topY);
      const fill=index===0?"#685B92":index===4?(running>=0?"#8074A8":"#B95C73"):"#D2ACCA";
      const desc=step.label+"\n"+money(step.value);
      content+=`<rect x="${cx-bw/2}" y="${topY}" width="${bw}" height="${bh}" rx="4" fill="${fill}" data-tip="${esc(desc)}" aria-label="${esc(desc)}"/>`;
      if(index<3)content+=`<line x1="${cx+bw/2}" y1="${y(step.to)}" x2="${x(index+1)-bw/2}" y2="${y(step.to)}" stroke="#B7ADC2" stroke-width="1.2" stroke-dasharray="4 4"/>`;
      const numberY=Math.max(14,topY-6);
      content+=`<text x="${cx}" y="${numberY}" text-anchor="middle" font-size="${labelSize}" font-weight="750" fill="#514468">${esc(fmtShort(step.value))}</text>`;
      content+=`<text x="${cx}" y="${h-8}" text-anchor="middle" font-size="${labelSize-1}" fill="#756B7F">${esc(step.label)}</text>`;
    });
    return svg(w,h,"Monthly budget forecast waterfall chart",content);
  }

  function series(w, sets, options) {
    const height = options.height ?? 238;
    const visible = sets.flatMap(set => set.points.filter(point => Number.isFinite(point[1])));
    if (!visible.length) return `<p class="ff-empty">No data for this selection.</p>`;
    const xs = visible.map(point => point[0]);
    const ys = visible.map(point => point[1]);
    const xDomain = options.x ?? [Math.min(...xs), Math.max(...xs)];
    const yDomain = options.y ?? [Math.min(0, ...ys), Math.ceil(Math.max(...ys) / 5) * 5];
    const axis = axes(w, height, { ...options, x: xDomain, y: yDomain });
    let content = axis.grid;
    if (Number.isFinite(options.refY)) content += line(axis.left, axis.y(options.refY), axis.right, axis.y(options.refY), "ff-refline");
    sets.forEach(set => {
      let path = "", pen = false;
      for (const [x, y] of set.points) {
        if (!Number.isFinite(y)) { pen = false; continue; }
        path += `${pen ? "L" : "M"}${axis.x(x)},${axis.y(y)} `;
        pen = true;
      }
      content += `<path d="${path}" fill="none" stroke="${set.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
      for (const [x, y, tip] of set.points) {
        if (!Number.isFinite(y)) continue;
        content += `<circle cx="${axis.x(x)}" cy="${axis.y(y)}" r="${set.points.length > 55 ? 2.1 : 3.1}" fill="${set.color}" data-tip="${esc(tip ?? `${set.name} · ${(options.xFormat ?? number)(x)} · ${(options.yFormat ?? number)(y)}`)}"/>`;
      }
    });
    return svg(w, height, options.label ?? "Line chart", content);
  }

  function shortlist(ranked) {
    if (!ranked.length) return `<p class="ff-empty">Pay and hours data are unavailable for the selected industries and year.</p>`;
    return `<div class="ff-table-scroll" tabindex="0" aria-label="Shortlist comparison, scrolls horizontally"><table class="ff-compact-table"><thead><tr>
      <th scope="col">Industry segment</th><th scope="col">Median monthly pay<br>HKD</th><th scope="col">Median weekly hours</th>
      <th scope="col">Monthly surplus<br>HKD</th><th scope="col">Vacancy rate<br>Broad industry</th>
      <th scope="col">Employment YoY<br>Broad industry</th><th scope="col" class="ff-status-cell">Fit with criteria</th>
    </tr></thead><tbody>${ranked.map(row => `<tr>
      <th scope="row">${esc(row.name)}<span class="ff-subcell" data-tip="${esc(row.mapping || row.demand?.name || "")}">${esc(row.demand?.name ?? row.id)}</span></th>
      <td>${number(row.pay50)}</td><td>${number(row.hours50)}</td><td>${number(row.surplus)}</td>
      <td>${percent((row.demand?.rate ?? 0) * 100)}</td><td>${percent((row.demand?.yoy ?? 0) * 100)}</td>
      <td class="ff-status-cell"><strong class="${row.match ? "ff-good" : "ff-check"}">${row.match ? "Meets criteria" : row.missing ? "Data needed" : "Below criteria"}</strong>
      <span class="ff-subcell">${row.match ? "Verify offer and actual hours" : row.issues.join(" · ")}</span></td>
    </tr>`).join("")}</tbody></table></div>`;
  }

  function historySets(chosen) {
    const end = Math.max(...fitData.history.map(row => historyX(row.period)));
    return {
      end,
      sets: chosen.map((item, index) => ({
        name: item.name,
        color: palette[index % palette.length],
        points: fitData.history
          .filter(row => row.id === item.id && historyX(row.period) >= state.startYear)
          .map(row => [historyX(row.period), row.value, `${item.name} · ${row.period} · Index ${number(row.value)}`])
          .sort((a, b) => a[0] - b[0]),
      })),
    };
  }

  function historyX(period) {
    return Number(period.slice(0, 4)) + (Number(period.slice(-1)) - 1) / 4;
  }


  function budgetSettings() {
    const config = [
      ["rent", "Monthly rent", 3000, 22000, 500],
      ["living", "Living and transport", 2000, 16000, 500],
      ["deduct", "Set-aside for deductions", 0, 6000, 500],
    ];
    return `<div class="ff-budget-settings" id="budget-settings" hidden>
      ${config.map(([key, title, min, max, step]) => `<label class="ff-slider-item">
        <span class="ff-slider-head"><span>${title}</span><output data-output="${key}">${money(state[key])}</output></span>
        <input type="range" data-control="${key}" min="${min}" max="${max}" step="${step}" value="${state[key]}">
        <span class="ff-slider-ends"><span>${money(min)}</span><span>${money(max)}</span></span>
      </label>`).join("")}
      <p>Budget assumptions only; actual deductions depend on your contract.</p>
    </div>`;
  }


  function render() {
    const context = fitContext();
    $("#fit-app").innerHTML = `
      <div class="ff-topline">
        <div><span class="ff-eyebrow">FIND YOUR FIT · CAREER DECISION DASHBOARD</span>
          <h1>Which options fit you?</h1></div>
        <div class="ff-match-total"><strong id="match-total">${context.matched.length}</strong><span>matching industries</span></div>
      </div>
      <section class="ff-preferences" aria-label="Your Career Preferences">
        <header class="ff-preferences-head"><h2>Your Career Preferences</h2>
          <button type="button" class="ff-action" data-action="reset">Reset</button></header>
        <div class="ff-slider-grid">
          ${filterSlider("targetPay", "Minimum monthly pay")}
          ${filterSlider("maxHours", "Maximum weekly hours")}
          ${filterSlider("payYear", "Pay reference year")}
        </div>
        <span class="ff-sr-only" id="ff-adjustment" role="status" aria-live="polite"></span>
      </section>
      <div class="ff-dashboard-charts">
        <figure class="ff-card ff-chart-scatter">
          <div class="ff-card-head"><h3>Industry income & working hours</h3><span data-year-label>${state.payYear}</span></div>
          <p class="ff-footnote"><span>Tableau industry groups · Bubble size: employment · Click to filter vacancy flows</span> · <span id="pay-hours-criteria"></span></p>
          <div id="pay-hours-viz" class="ff-scatter-viz"></div>
        </figure>
        <figure class="ff-card ff-industry-history"><div class="ff-card-head"><h3>Industry employment trend</h3></div><div class="ff-map-holder" id="industry-history"></div><p class="ff-footnote">Employment index · 2016 Q1 = 100</p></figure>
        <figure class="ff-card ff-expansion">
          <div class="ff-card-head"><h3>Where is employment growing?</h3><label>Start year <select id="expansion-year">${[...new Set(fitData.quarters.map(period=>period.slice(0,4)))].map(year=>`<option>${year}</option>`).join("")}</select></label></div>
          <div class="ff-expansion-rows" id="expansion-rows"></div>
          <p class="ff-footnote"><span>Employment change from the first quarter of the selected year</span><br>
            <span>Highlighted industries have at least one segment whose median pay and hours meet both limits in the selected pay year.</span></p>
        </figure>
        <figure class="ff-card ff-chart-hiring">
          <div class="ff-card-head"><h3>Industry × Occupation Vacancy Counts</h3><span>2026 Q2</span></div>
          <div class="ff-map-holder" id="map-viz"></div>
        </figure>
        <figure class="ff-card ff-opportunities">
          <div class="ff-card-head"><h3>Occupation Share Within Industry Heatmap</h3><span>2026 Q2</span></div>
          <div id="opportunities-viz"></div>
        </figure>
      </div>
    `;
    $("#expansion-year").value = state.expansionYear;
    drawExpansion();
    updateDashboard();
  }

  function drawExpansion() {
    const rows = fitData.demand.map(industry => {
      const points = fitData.history.filter(row => row.id === industry.id && historyX(row.period) >= state.expansionYear);
      const values = points.map(row => row.value).filter(Number.isFinite);
      const base = values[0];
      if (!base) return null;
      return { id: industry.id, name: industry.name, values, change: (values.at(-1) / base - 1) * 100 };
    }).filter(Boolean).sort((a,b) => b.change - a.change);
    const max = Math.max(1, ...rows.map(row => Math.abs(row.change)));
    $("#expansion-rows").innerHTML = rows.map(({id,name,values,change}) => {
      const min = Math.min(...values), range = Math.max(...values) - min || 1;
      const points = values.map((value,i) => `${i * 62 / Math.max(1,values.length-1)},${12 - 10*(value-min)/range}`).join(" ");
      const direction = change >= 0 ? "gain" : "loss";
      const label = change > 0 ? "+" + percent(change) : percent(change);
      return `<div class="ff-expansion-row" data-expansion-industry="${esc(id)}">
        <span title="${esc(name)}">${esc(name)}<span class="ff-sr-only" hidden> · Meets pay and hours criteria</span></span>
        <svg viewBox="0 0 62 14" aria-hidden="true"><polyline points="${points}" fill="none" stroke="#8376aa" stroke-width="1.4"/></svg>
        <span class="ff-expansion-bar"><i class="${direction}" style="width:${Math.abs(change)/max*50}%"></i></span>
        <strong class="${direction}">${label}</strong></div>`;
    }).join("");
  }

  function highlightExpansion(matched) {
    const industryIds = new Set(matched.map(row => row.id));
    $$("#expansion-rows [data-expansion-industry]").forEach(row => {
      const highlighted = industryIds.has(row.dataset.expansionIndustry);
      row.classList.toggle("ff-expansion-match", highlighted);
      row.querySelector(".ff-sr-only").hidden = !highlighted;
    });
  }

  function updateDashboard() {
    const ctx = fitContext();
    const { matched, chosen } = ctx;

    updateSliderLimits();
    $("#match-total").textContent = String(matched.length);
    $("#ff-adjustment").textContent = state.adjustment;
    document.querySelector(".ff-dashboard-charts")?.style.setProperty("--fit-list-min-height", Math.max(370, matched.length * 26 + 98) + "px");
    drawPayHours();
    highlightExpansion(matched);
    document.querySelectorAll("[data-year-label]").forEach(element => element.textContent = state.payYear);
    drawMap(selectedTableauIndustry ? fitData.demand : chosen);

  }

  const broadGroup = {
    "Manufacturing":"Manufacturing","Construction":"Construction",
    "Trade & wholesale":"Import/export & wholesale",
    "Retail":"Retail & accommodation","Food & lodging":"Retail & accommodation",
    "Transport & post":"Transportation & information","Information & communications":"Transportation & information",
    "Finance & insurance":"Finance & professional","Real estate":"Finance & professional","Business services":"Finance & professional",
    "Social & personal services":"Public & social services"
  };
  let selectedTableauIndustry = null;
  let selectedVacancyIndustry = null;
  function drawPayHours() {
    const container=$("#pay-hours-viz");
    const rows=window.tableauIncomeHours.filter(row=>+row[0]===state.payYear);
    const matchingRows = new Set(rows.filter(([, , , pay, hours]) =>
      pay >= state.targetPay && hours <= state.maxHours));
    $("#pay-hours-criteria").textContent = matchingRows.size
      ? "Bubbles meeting both limits are highlighted."
      : "No industries meet both limits.";
    const w=Math.max(360,container.clientWidth),h=Math.max(220,container.clientHeight||320);
    const minPay=Math.floor((Math.min(...rows.map(r=>r[3]))-700)/1000)*1000;
    const maxPay=Math.ceil((Math.max(...rows.map(r=>r[3]))+700)/1000)*1000;
    const minHours=Math.floor((Math.min(...rows.map(r=>r[4]))-3)/5)*5;
    const maxHours=Math.ceil((Math.max(...rows.map(r=>r[4]))+3)/5)*5;
    const a=axes(w,h,{x:[minPay,maxPay],y:[minHours,maxHours],left:57,right:32,bottom:48,
      xTicks:ticks(minPay,maxPay,4),yTicks:ticks(minHours,maxHours,4),xFormat:v=>fmt(v/1000,1)+"k",yFormat:v=>fmt(v)});
    let content=a.grid;
    ticks(minPay,maxPay,4).forEach(v=>content+=line(a.x(v),a.top,a.x(v),a.bottom));
    const colors=["#BE6482","#7F74A7","#F498B6","#C5BFBE","#9B93C9","#C6C1F0","#9C9290"];
    const maxEmployment=Math.max(...rows.map(r=>r[5]));
    rows.forEach((row,i)=>{
      const [year,industry,name,pay,hours,employment]=row,cx=a.x(pay),cy=a.y(hours);
      const r=5+Math.sqrt(employment/maxEmployment)*9;
      const tip=name+" · "+year+" · Median pay "+money(pay)+" · Weekly hours "+fmt(hours,1)+" · Employed "+fmt(employment,1)+" thousand";
      const meetsCriteria = matchingRows.has(row);
      const selected = selectedTableauIndustry === industry;
      const opacity = meetsCriteria ? (selectedTableauIndustry && !selected ? .65 : .95) : .2;
      content+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors[i]}" fill-opacity="${opacity}" stroke="${selected?"#51436E":"#fff"}" stroke-width="2" data-action="tableauIndustry" data-value="${esc(industry)}" data-tip="${esc(tip)}" tabindex="0" role="button" aria-label="${esc(tip)}" style="cursor:pointer"/>`;
      content+=`<text x="0" y="0" class="income-label" pointer-events="none">${esc(name)}</text>`;
    });
    content+=text((a.left+a.right)/2,h-6,"Monthly Median Earnings (HK$)");
    content+=`<text transform="translate(14,${(a.top+a.bottom)/2}) rotate(-90)" text-anchor="middle">Median Weekly Hours</text>`;
    container.innerHTML=svg(w,h,"Tableau industry income and weekly hours",content);
    const plot=container.querySelector("svg"), labels=plot.querySelectorAll(".income-label");
    labelScatter(plot,Array.from(plot.querySelectorAll("circle"),(dot,i)=>({x:+dot.getAttribute("cx"),y:+dot.getAttribute("cy"),r:+dot.getAttribute("r"),label:labels[i]})),{left:a.left+2,right:w-3,top:2,bottom:a.bottom-2});
  }

  function vacancyFlow(chosen, width, height) {
    const ids = new Set(chosen.filter(row=>!selectedTableauIndustry||broadGroup[row.id]===selectedTableauIndustry).map(row => row.id));
    const rows = fitData.occupations.filter(row => ids.has(row.id) && row.count > 0);
    if (!rows.length) return '<p class="ff-empty">No matching vacancies.</p>';
    const sum = list => list.reduce((total,row)=>total+row.count,0);
    const left = [...new Set(rows.map(row=>row.id))].map(id=>({name:id,total:sum(rows.filter(row=>row.id===id))})).sort((a,b)=>b.total-a.total);
    const right = [...new Set(rows.map(row=>row.name))].map(name=>({name,total:sum(rows.filter(row=>row.name===name))})).sort((a,b)=>b.total-a.total);
    const w=Math.max(340,width),h=Math.max(194,height);
    const top=22,bottom=12,gap=5,nodeWidth=7;
    const lx=Math.min(137,w*.33),rx=w-lx-nodeWidth;
    const bend=(lx+nodeWidth+rx)/2;
    const total=sum(rows),scale=Math.min((h-top-bottom-gap*(left.length-1))/total,(h-top-bottom-gap*(right.length-1))/total);
    const colors=["#78578F","#B780AD","#65958D","#C48C50","#9F86B8","#7E86A2","#C28C9B","#908874","#B5A4BE","#78578F"];
    const layout=nodes=>{let y=top;nodes.forEach(node=>{node.y=y;node.offset=0;node.height=node.total*scale;y+=node.height+gap;});};
    layout(left);layout(right);
    let content='<text x="'+lx+'" y="15" class="tick-label">Industry</text><text x="'+(rx+15)+'" y="15" class="tick-label">Occupation</text>';
    left.forEach((node,i)=>{
      const color=colors[i%colors.length];
      rows.filter(row=>row.id===node.name).forEach(row=>{
        const target=right.find(n=>n.name===row.name),thickness=row.count*scale;
        const y1=node.y+node.offset,y2=target.y+target.offset;
        node.offset+=thickness;target.offset+=thickness;
        const tip=node.name+" → "+row.name+": "+fmt(row.count)+" vacancies (2026 Q2)";
        content+=`<path d="M${lx+nodeWidth},${y1} C${bend},${y1} ${bend},${y2} ${rx},${y2} L${rx},${y2+thickness} C${bend},${y2+thickness} ${bend},${y1+thickness} ${lx+nodeWidth},${y1+thickness} Z" fill="${color}" opacity=".26" data-tip="${esc(tip)}" class="ff-vacancy-flow"><title>${esc(tip)}</title></path>`;
      });
    });
    const short={"Social & personal services":"Social & personal","Information & communications":"Info & communications","Services and sales workers":"Services & sales","Plant and machine operators and assemblers":"Machine operators","Craft and related trades workers":"Craft & trades","Clerical support workers":"Clerical support","Skilled agricultural and fishery workers":"Agriculture & fishery"};
    const nodes=(items,x,isLeft)=>{
      const spacing=14;
      let previous=top-spacing;
      return items.map((node,i)=>{
        const center=node.y+node.height/2;
        const labelY=Math.min(h-bottom-(items.length-1-i)*spacing,Math.max(center,previous+spacing));
        previous=labelY;
        const edge=isLeft?x:x+nodeWidth;
        const tx=edge+(isLeft?-7:7);
        const label=short[node.name]||node.name;
        return `<g><title>${esc(node.name)} · ${fmt(node.total)}</title>
          <rect x="${x}" y="${node.y}" width="${nodeWidth}" height="${node.height}" fill="${isLeft?colors[i%colors.length]:"#78578F"}"/>
          <line x1="${edge}" y1="${center}" x2="${tx}" y2="${labelY}" stroke="#b2a6b9"/>
          <text class="ff-flow-label" x="${tx}" y="${labelY}" dominant-baseline="central" text-anchor="${isLeft?"end":"start"}">${esc(label)} · ${fmt(node.total)}</text></g>`;
      }).join("");
    };
    return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Industry to occupation vacancy flows in 2026 Q2">${content}${nodes(left,lx,true)}${nodes(right,rx,false)}</svg>`;
  }

  function drawMap(chosen) {
    const container = $("#map-viz");
    if (!container) return;
    const industries=chosen.filter(row=>!selectedTableauIndustry||broadGroup[row.id]===selectedTableauIndustry);
    const focused=selectedVacancyIndustry?industries.filter(row=>row.id===selectedVacancyIndustry):industries;
    container.innerHTML=vacancyFlow(focused, container.clientWidth, container.clientHeight);
    const map=$("#opportunities-viz"),history=$("#industry-history");
    map.innerHTML=industries.length ? heatTable(occupationOrder, industries) : '<p class="ff-empty">No matching vacancies.</p>';
    const { sets, end } = historySets(focused);
    const indices = sets.flatMap(set => set.points.map(point => point[1])).filter(Number.isFinite);
    const lower = Math.floor((Math.min(100, ...indices) - 2) / 5) * 5;
    const upper = Math.ceil((Math.max(100, ...indices) + 2) / 5) * 5;
    const step = upper - lower > 30 ? 10 : 5;
    const yTicks = Array.from({ length: Math.floor((upper - lower) / step) + 1 }, (_, i) => lower + i * step);
    history.innerHTML = series(history.clientWidth, sets, {
      height: history.clientHeight,
      x: [state.startYear, end],
      xTicks: [2016, 2020, 2024].filter(year => year >= state.startYear && year <= end),
      xFormat: String,
      y: [lower, upper],
      yTicks,
      refY: 100,
      label: "Industry employment trend"
    });

  }

  function drawBudget(featured) {
    const container = $("#budget-viz");
    if (!container) return;
    if (!featured) { container.innerHTML = '<p class="ff-empty">No industries meet both targets. Adjust pay or hours to explore options.</p>'; return; }
    const values = { offer: featured.pay50, rent: state.rent, living: state.living, deduct: state.deduct };
    const width = container.clientWidth || 720;
    const height = container.clientHeight || 164;
    container.innerHTML = waterfall(width, height, values);
  }

  function drawHistory(chosen, end, histMin, histMax, histYears) {
    const container = $("#history-viz");
    if (!container) return;
    const sets = historySets(chosen).sets;
    container.innerHTML = series(container.clientWidth || 900, sets, {
      x: [state.startYear, end],
      xTicks: histYears,
      y: [histMin, histMax],
      refY: 100,
      xFormat: String,
      label: "Quarterly employment index for selected industries",
      height: 238,
      right: 30,
    });
  }


  function showTip(element, event) {
    if (!element?.dataset.tip) return;
    tooltip.textContent = element.dataset.tip.replace(/\s*·\s*/g, "\n");
    tooltip.classList.add("visible");
    tooltip.style.left = Math.max(8, Math.min((event?.clientX ?? 0) + 12, innerWidth - tooltip.offsetWidth - 8)) + "px";
    tooltip.style.top = Math.max(8, Math.min((event?.clientY ?? 0) + 12, innerHeight - tooltip.offsetHeight - 8)) + "px";
  }
  function hideTip() { tooltip.classList.remove("visible"); }
  function bindEvents() {
    const app = $("#fit-app");
    app.addEventListener("change", event => {
      if (event.target.id !== "expansion-year") return;
      state.expansionYear = Number(event.target.value);
      drawExpansion();
      highlightExpansion(validYearRows().filter(matches));
    });
    app.addEventListener("click", event => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      const action = target.dataset.action;
      if (action === "tableauIndustry") { selectedVacancyIndustry=null; selectedTableauIndustry = selectedTableauIndustry===target.dataset.value?null:target.dataset.value; updateDashboard(); return; }
      if (action === "reset") {
        selectedTableauIndustry=null; selectedVacancyIndustry=null;
        Object.assign(state, defaultPreferences, {
          focus: null, rent: 10000, living: 6500, deduct: 2000, adjustment: "", quarterIndex: fitData.quarters.length - 1 });
        render(); return;
      }
      if (action === "focusIndustry") {
        state.focus = state.focus === target.dataset.value ? null : target.dataset.value;
        updateDashboard(); return;
      }
      if (action === "vacancyIndustry") {
        selectedVacancyIndustry = selectedVacancyIndustry === target.dataset.value ? null : target.dataset.value;
        updateDashboard();
        return;
      }
      if (action === "bubble") {
        const match = fitContext().matched.find(row=>row.id===target.dataset.value);
        if (match) state.focus=match.name;
        selectedTableauIndustry=null;
        selectedVacancyIndustry=target.dataset.value;
        updateDashboard(); return;
      }
      if (action === "expenses") {
        const panel = $("#budget-settings");
        panel.hidden = !panel.hidden;
        target.setAttribute("aria-expanded", String(!panel.hidden));
        $(".ff-chart-budget")?.classList.toggle("ff-budget-editing", !panel.hidden);
        if (!panel.hidden) panel.querySelector('input[type="range"]')?.focus({ preventScroll: true });
        return;
      }
    });
    app.addEventListener("input", event => {
      const input = event.target.closest('input[type="range"][data-control]');
      if (!input) return;
      const key = input.dataset.control;
      if (key === "quarterIndex") {
        state.quarterIndex = Number(input.value);
        updateDashboard();
        return;
      }
      selectedVacancyIndustry=null;
      state[key] = Number(input.value);
      state.adjustment = "";
      if (key === "payYear" || ["rent", "living", "deduct"].includes(key)) {
        if (key !== "payYear") reconcileConstraints();
      }
      updateDashboard();
    });
    app.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        const panel = $("#budget-settings");
        if (panel && !panel.hidden) {
          panel.hidden = true;
          const toggle = $('[data-action="expenses"]');
          toggle?.setAttribute("aria-expanded", "false");
          $(".ff-chart-budget")?.classList.remove("ff-budget-editing");
          toggle?.focus({ preventScroll: true });
          return;
        }
      }

      const target = event.target.closest('[data-action="bubble"]');
      if (target && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault(); target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
    });
    app.addEventListener("pointermove", event => {
      const target = event.target.closest("[data-tip]");
      if (target) showTip(target, event); else hideTip();
    });
    app.addEventListener("pointerleave", hideTip);
    app.addEventListener("focusin", event => {
      const target = event.target.closest("[data-tip]");
      if (target) showTip(target);
    });
    app.addEventListener("focusout", hideTip);
    let timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => updateDashboard(), 160);
    });
  }

  fetch("data/data.json")
    .then(response => response.json())
    .then(json => {
      fitData = prepare(json);
      state.quarterIndex = fitData.quarters.length - 1;
      bindEvents();
      render();
    })
    .catch(error => {
      console.error(error);
      $("#fit-app").innerHTML = `<p class="ff-empty">Data could not be loaded.</p>`;
    });
})();
