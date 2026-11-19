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
  const state = {
    selected: [],
    focus: null,
    adjustment: "",
    vacancyMode: "count",
    payYear: 2025,
    startYear: 2016,
    targetPay: 25000,
    maxHours: 42,
    targetSurplus: 6000,
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
    return { demand, occupations, pay, history };
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
      Number.isFinite(surplus) && surplus < state.targetSurplus ? "Surplus below target" : null,
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
      row.hours50 <= state.maxHours + .001 &&
      row.pay50 - expensesTotal() >= state.targetSurplus - .001;
  }
  function expensesTotal() { return state.rent + state.living + state.deduct; }

  function fitContext() {
    const matched = validYearRows().filter(matches).map(candidate)
      .sort((a, b) => (b.pay50 - a.pay50) || a.name.localeCompare(b.name));
    if (!matched.some(row => row.name === state.focus)) state.focus = null;
    const feature = matched.find(row => row.name === state.focus) || matched[0] || null;
    const broad = new Set(matched.map(row => row.id));
    const chosen = fitData.demand.filter(row => broad.has(row.id));
    return { chosen, rows: matched, matched, featured: feature,
      budget: feature ? feature.pay50 - expensesTotal() : 0 };
  }

  function reconcileConstraints() {
    if (validYearRows().some(matches)) return;
    const rows = validYearRows();
    if (!rows.length) return;
    const desired = { pay: state.targetPay, hours: state.maxHours, surplus: state.targetSurplus };
    const best = rows.slice().sort((a, b) => {
      const penalty = row =>
        Math.max(0, desired.pay - row.pay50) / 10000 +
        Math.max(0, row.hours50 - desired.hours) / 10 +
        Math.max(0, desired.surplus - (row.pay50 - expensesTotal())) / 10000;
      return penalty(a) - penalty(b);
    })[0];
    state.targetPay = Math.min(state.targetPay, Math.floor(best.pay50 / 100) * 100);
    state.maxHours = Math.max(state.maxHours, Math.ceil(best.hours50 * 10) / 10);
    state.targetSurplus = Math.min(state.targetSurplus, Math.floor((best.pay50 - expensesTotal()) / 100) * 100);
    state.adjustment = "Criteria adjusted to keep at least one matching industry.";
  }

  function sliderLimits(key) {
    const rows = validYearRows();
    const cost = expensesTotal();
    if (key === "targetPay") {
      const eligible = rows.filter(row => row.hours50 <= state.maxHours + .001 && row.pay50 - cost >= state.targetSurplus - .001);
      return { min: Math.floor(Math.min(...rows.map(r => r.pay50)) / 100) * 100,
        max: Math.floor(Math.max(...eligible.map(r => r.pay50)) / 100) * 100, step: 100 };
    }
    if (key === "maxHours") {
      const eligible = rows.filter(row => row.pay50 >= state.targetPay - .001 && row.pay50 - cost >= state.targetSurplus - .001);
      return { min: Math.ceil(Math.min(...eligible.map(r => r.hours50)) * 10) / 10,
        max: Math.ceil(Math.max(...rows.map(r => r.hours50)) * 10) / 10, step: .1 };
    }
    if (key === "targetSurplus") {
      const eligible = rows.filter(row => row.pay50 >= state.targetPay - .001 && row.hours50 <= state.maxHours + .001);
      const max = Math.floor(Math.max(...eligible.map(r => r.pay50 - cost)) / 100) * 100;
      return { min: Math.min(0, max), max, step: 100 };
    }
    const years = [...new Set(fitData.pay.map(row => row.year))].sort((a, b) => a - b);
    return { min: years[0], max: years.at(-1), step: 1 };
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

  function updateSliderLimits() {
    ["targetPay", "maxHours", "targetSurplus", "payYear"].forEach(key => {
      const lim = sliderLimits(key);
      const slider = document.getElementById("filter-" + key);
      if (!slider) return;
      slider.min = lim.min; slider.max = lim.max; slider.step = lim.step;
      slider.value = state[key];
      const out = document.querySelector('[data-output="' + key + '"]');
      const min = document.querySelector('[data-min="' + key + '"]');
      const max = document.querySelector('[data-max="' + key + '"]');
      if (out) out.textContent = formatValue(key, state[key]);
      if (min) min.textContent = formatValue(key, lim.min);
      if (max) max.textContent = formatValue(key, lim.max);
    });
    ["rent", "living", "deduct"].forEach(key => {
      const inp = document.querySelector('[data-control="' + key + '"]');
      if (inp) inp.value = state[key];
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
    const isCount = state.vacancyMode === "count";
    const max = Math.max(1, ...fitData.occupations.map(row => row.count ?? 0));
    return `<div class="ff-table-scroll" tabindex="0" aria-label="Vacancy heatmap by occupation and industry, scrolls horizontally">
      <table class="ff-heat"><thead><tr><th scope="col">Occupation</th>${industries.map(row =>
        `<th scope="col">${esc(row.name)}</th>`).join("")}</tr></thead><tbody>${occupations.map(occupation => {
          const values = industries.map(industry => {
            const row = fitData.occupations.find(item => item.id === industry.id && item.name === occupation);
            if (!row) return `<td>—</td>`;
            const value = isCount ? row.count : row.share;
            if (!Number.isFinite(value)) return `<td>—</td>`;
            const opacity = .12 + .66 * Math.sqrt(value / (isCount ? max : 1));
            const text = isCount ? number(value) : percent(value * 100);
            const tip = `${occupation} · ${industry.name} · ${text}`;
            return `<td><button type="button" data-action="selectIndustry" data-value="${esc(industry.id)}" data-tip="${esc(tip)}" aria-label="${esc(tip)}" aria-pressed="${state.selected.includes(industry.id)}" style="background:rgba(98,86,140,${opacity});color:${opacity > .62 ? "white" : "#282D33"}">${text}</button></td>`;
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
        const tip = `${row.name} · ${[a, m, b].map(number).join(" / ")} · ${isPay ? "HKD/month" : "hours/week"}`;
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

  function bubbles(w, values) {
    const height = 254;
    const axis = axes(w, height, {
      x: [.5, 2.8],
      y: [-3, 4],
      xTicks: [.5, 1, 1.5, 2, 2.5],
      yTicks: [-2, 0, 2, 4],
      xFormat: percent,
      yFormat: percent,
      right: 21,
      bottom: 44,
    });
    let content = axis.grid
      + line(axis.left, axis.y(0), axis.right, axis.y(0), "ff-refline")
      + line(axis.x(1.7), axis.top, axis.x(1.7), axis.bottom, "ff-refline")
      + text(axis.right, 250, "Vacancy rate", "end")
      + text(axis.x(1.7) + 5, axis.top + 7, "Overall 1.7%", "start");
    const max = Math.max(...values.map(row => row.openings));
    values.slice().sort((a, b) => b.openings - a.openings).forEach(row => {
      const current = fitContext();
      const selected = !state.focus || current.featured?.id === row.id;
      const tip = `${row.name}\nVacancy rate ${percent(row.rate * 100)} · ${number(row.openings)} vacancies\nEmployment YoY ${percent(row.yoy * 100)}`;
      content += `<circle cx="${axis.x(row.rate * 100)}" cy="${axis.y(row.yoy * 100)}" r="${Math.sqrt(row.openings / max) * 22}" fill="${row.yoy >= 0 ? "#62568C" : "#D7647D"}" opacity="${selected ? .86 : .22}" class="ff-bubble" data-tip="${esc(tip)}" data-action="bubble" data-value="${esc(row.id)}" aria-label="${esc(tip)}" aria-pressed="${Boolean(state.focus && selected)}"/>`;
    });
    return svg(w, height, "Hiring opportunities. X: vacancy rate. Y: year-on-year employment change.", content);
  }

  function waterfall(w, amounts) {
    const data = [amounts.offer, -amounts.rent, -amounts.living, -amounts.deduct];
    const labels = ["Offer", "Rent", "Living", "Set-aside"];
    let acc = 0;
    const rows = data.map((value, index) => {
      const step = { label: labels[index], value, from: acc, to: acc + value };
      acc += value;
      return step;
    });
    rows.push({ label: "Surplus", value: acc, from: 0, to: acc });
    const values = rows.flatMap(row => [row.from, row.to]);
    const h = 234;
    const min = Math.min(...values), max = Math.max(...values, 1);
    const delta = Math.max(max - min, 1000);
    const axis = axes(w, h, {
      x: [-.6, 4.6],
      y: [Math.min(0, min) - delta * .12, max + delta * .17],
      xTicks: [],
      yTicks: [min, (min + max) / 2, max].filter((value, index, all) => !index || value !== all[index - 1]),
      yFormat: value => `${number(value / 1000)}k`,
      bottom: 36,
      left: 40,
    });
    let content = axis.grid + line(axis.left, axis.y(0), axis.right, axis.y(0), "ff-refline");
    const barWidth = Math.min(47, (axis.right - axis.left) / 8);
    rows.forEach((row, index) => {
      const x = axis.x(index);
      const high = Math.min(axis.y(row.from), axis.y(row.to));
      const low = Math.max(axis.y(row.from), axis.y(row.to));
      const tip = `${row.label} ${money(row.value)}`;
      content += `<rect x="${x - barWidth / 2}" y="${high}" width="${barWidth}" height="${Math.max(low - high, 1)}" fill="${index === 0 || index === 4 ? "#62568C" : "#BFA4CE"}" rx="3" data-tip="${esc(tip)}"/>`;
      if (index < 3) content += line(x + barWidth / 2, axis.y(row.to), axis.x(index + 1) - barWidth / 2, axis.y(row.to));
      content += text(x, high - 5, `${number(row.value / 1000)}k`) + text(x, axis.bottom + 23, row.label);
    });
    return svg(w, h, "Monthly budget waterfall chart", content);
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
    const count = context.matched.length;
    $("#fit-app").innerHTML = `
      <div class="ff-topline">
        <div><span class="ff-eyebrow">FIND YOUR FIT · CAREER DECISION DASHBOARD</span>
          <h1>Which options fit you?</h1></div>
        <div class="ff-match-total"><strong id="match-total">${count}</strong><span>matching industries</span></div>
      </div>
      <section class="ff-preferences" aria-label="Your Career Preferences">
        <header class="ff-preferences-head"><h2>Your Career Preferences</h2><button type="button" class="ff-action" data-action="reset">Reset</button></header>
        <div class="ff-slider-grid">
          ${filterSlider("targetPay", "Minimum monthly pay")}
          ${filterSlider("maxHours", "Maximum weekly hours")}
          ${filterSlider("targetSurplus", "Target monthly surplus")}
          ${filterSlider("payYear", "Pay reference year")}
        </div>
        <div class="ff-filter-note"><span id="ff-match-explain">Only matching industries appear below.</span><span id="ff-adjustment" role="status">${esc(state.adjustment)}</span></div>
      </section>
      <div class="ff-dashboard-charts">
        <figure class="ff-card ff-chart-pay">
          <div class="ff-card-head"><div><h3>Monthly Pay Range</h3><p>25th–75th percentile · median · HKD/month</p></div><span class="ff-data-year" data-year-label>${state.payYear}</span></div>
          <div class="ff-interval-container" id="pay-range-viz"></div>
        </figure>
        <figure class="ff-card ff-chart-hours">
          <div class="ff-card-head"><div><h3>Weekly Hours Range</h3><p>25th–75th percentile · median · hours/week</p></div><span class="ff-data-year" data-year-label>${state.payYear}</span></div>
          <div class="ff-interval-container" id="hours-range-viz"></div>
        </figure>
        <figure class="ff-card ff-chart-hiring">
          <div class="ff-card-head"><div><h3>Hiring Opportunities</h3><p>2026 Q2 · vacancy rate vs. employment YoY</p></div></div>
          <div class="ff-map-holder" id="map-viz"></div>
          <p class="ff-footnote">Bubble size = vacancies. Select to focus an industry.</p>
        </figure>
        <figure class="ff-card ff-chart-occupation">
          <div class="ff-card-head"><div><h3>Occupation Demand</h3><p>2026 Q2 · parent-industry vacancy counts</p></div></div>
          <div class="ff-occupation-list" id="occupation-viz"></div>
        </figure>
        <figure class="ff-card ff-chart-budget">
          <div class="ff-card-head"><div><h3>Monthly Budget Forecast</h3><p>Median pay minus estimated expenses · HKD</p></div>
            <button type="button" class="ff-action" data-action="expenses" aria-controls="budget-settings" aria-expanded="false">Edit expenses</button></div>
          <div class="ff-budget-summary"><span id="budget-industry"></span><strong id="budget-surplus"></strong></div>
          <div class="ff-budget-viz" id="budget-viz"></div>
          ${budgetSettings()}
        </figure>
      </div>
    `;
    updateDashboard();
  }

  function updateDashboard() {
    const ctx = fitContext();
    const { matched, featured, chosen } = ctx;
    if (!matched.length) { reconcileConstraints(); return updateDashboard(); }
    updateSliderLimits();
    $("#match-total").textContent = String(matched.length);
    $("#ff-adjustment").textContent = state.adjustment;
    $("#pay-range-viz").innerHTML = intervals(matched, "pay");
    $("#hours-range-viz").innerHTML = intervals(matched, "hours");
    document.querySelectorAll("[data-year-label]").forEach(element => element.textContent = state.payYear);
    $("#budget-industry").textContent = featured?.name || "";
    $("#budget-surplus").textContent = money(featured?.surplus ?? 0) + " surplus";
    drawMap(chosen);
    drawOccupation(chosen);
    drawBudget(featured);
  }

  function drawMap(chosen) {
    const container = $("#map-viz");
    if (!container) return;
    container.innerHTML = bubbles(container.clientWidth || 550, chosen);
  }

  function drawOccupation(chosen) {
    const container = $("#occupation-viz");
    if (!container) return;
    const current = fitContext();
    const broad = new Set(state.focus && current.featured
      ? [current.featured.id] : chosen.map(row => row.id));
    const totals = new Map();
    fitData.occupations.filter(row => broad.has(row.id)).forEach(row =>
      totals.set(row.name, (totals.get(row.name) || 0) + (row.count || 0)));
    const ordered = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...ordered.map(row => row[1]));
    container.innerHTML = ordered.map(([name, count]) => `
      <div class="ff-occupation-row" data-tip="${esc(name + " · " + number(count) + " vacancies")}">
        <span class="ff-occupation-label">${esc(name)}</span>
        <div class="ff-occupation-track"><span style="width:${count / max * 100}%"></span></div>
        <strong>${number(count)}</strong>
      </div>`).join("");
  }

  function drawBudget(featured) {
    const container = $("#budget-viz");
    if (!container || !featured) return;
    const values = { offer: featured.pay50, rent: state.rent, living: state.living, deduct: state.deduct };
    container.innerHTML = waterfall(container.clientWidth || 450, values);
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
    tooltip.textContent = element.dataset.tip;
    tooltip.classList.add("visible");
    tooltip.style.left = Math.max(8, Math.min((event?.clientX ?? 0) + 12, innerWidth - tooltip.offsetWidth - 8)) + "px";
    tooltip.style.top = Math.max(8, Math.min((event?.clientY ?? 0) + 12, innerHeight - tooltip.offsetHeight - 8)) + "px";
  }
  function hideTip() { tooltip.classList.remove("visible"); }
  function bindEvents() {
    const app = $("#fit-app");
    app.addEventListener("click", event => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      const action = target.dataset.action;
      if (action === "reset") {
        Object.assign(state, { targetPay: 25000, maxHours: 42, targetSurplus: 6000, payYear: 2025,
          focus: null, rent: 10000, living: 6500, deduct: 2000, adjustment: "" });
        render(); return;
      }
      if (action === "focusIndustry") {
        state.focus = state.focus === target.dataset.value ? null : target.dataset.value;
        updateDashboard(); return;
      }
      if (action === "bubble") {
        const ctx = fitContext();
        const match = ctx.matched.find(row => row.id === target.dataset.value);
        if (match) state.focus = state.focus === match.name ? null : match.name;
        updateDashboard(); return;
      }
      if (action === "expenses") {
        const panel = $("#budget-settings");
        panel.hidden = !panel.hidden;
        target.setAttribute("aria-expanded", String(!panel.hidden));
      }
    });
    app.addEventListener("input", event => {
      const input = event.target.closest('input[type="range"][data-control]');
      if (!input) return;
      const key = input.dataset.control;
      state[key] = Number(input.value);
      state.adjustment = "";
      if (key === "payYear" || ["rent", "living", "deduct"].includes(key)) {
        reconcileConstraints();
      }
      updateDashboard();
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
      bindEvents();
      render();
    })
    .catch(error => {
      console.error(error);
      $("#fit-app").innerHTML = `<p class="ff-empty">Data could not be loaded.</p>`;
    });
})();
