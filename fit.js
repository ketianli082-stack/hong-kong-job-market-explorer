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

  function fitContext() {
    const chosen = fitData.demand.filter(row => !state.selected.length || state.selected.includes(row.id));
    const active = new Set(chosen.map(row => row.id));
    const rows = fitData.pay
      .filter(row => row.year === state.payYear && active.has(row.id))
      .map(candidate);
    const ranked = rows.slice().sort((a, b) =>
      Number(b.match) - Number(a.match)
      || Number(a.missing) - Number(b.missing)
      || a.issues.length - b.issues.length
      || (b.surplus ?? -Infinity) - (a.surplus ?? -Infinity)
      || a.name.localeCompare(b.name, "en"));
    return {
      chosen,
      rows,
      ranked,
      matched: ranked.filter(row => row.match),
      budget: state.offer - state.rent - state.living - state.deduct,
    };
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
    const ordered = rows.slice().sort((a, b) => (b[median] ?? -Infinity) - (a[median] ?? -Infinity));
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
        return `<div class="ff-range-lane"><span class="ff-range-name">${esc(row.name)}</span><div class="ff-range-track">
          <span class="ff-range-ref" style="left:${position(target)}%"></span>
          ${[a, b].every(Number.isFinite) ? `<span class="ff-range-band" style="left:${position(a)}%;width:${position(b) - position(a)}%" data-tip="${esc(tip)}"></span>` : ""}
          ${Number.isFinite(m) ? `<button type="button" class="ff-range-point" style="left:${position(m)}%" data-tip="${esc(tip)}" aria-label="${esc(tip + (isPay ? " · Use in budget" : ""))}"${isPay ? ` data-action="offerMedian" data-value="${m}"` : ""}></button>
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
      const selected = state.selected.includes(row.id);
      const tip = `${row.name}\nVacancy rate ${percent(row.rate * 100)} · ${number(row.openings)} vacancies\nEmployment YoY ${percent(row.yoy * 100)}`;
      content += `<circle cx="${axis.x(row.rate * 100)}" cy="${axis.y(row.yoy * 100)}" r="${Math.sqrt(row.openings / max) * 22}" fill="${row.yoy >= 0 ? "#62568C" : "#D7647D"}" opacity="${state.selected.length && !selected ? .31 : .86}" class="ff-bubble" data-tip="${esc(tip)}" data-action="bubble" data-value="${esc(row.id)}" aria-label="${esc(tip)}" aria-pressed="${selected}"/>`;
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

  function render() {
    const context = fitContext();
    const { chosen, rows, ranked, matched, budget } = context;
    const status = matched.length
      ? `Investigate first: ${list(matched.map(row => row.name))}`
      : "No options meet all three criteria.";
    const selection = chosen.length === fitData.demand.length
      ? `All ${fitData.demand.length} broad industries`
      : list(chosen.map(row => row.name));
    const { end, sets } = historySets(chosen);
    const histValues = sets.flatMap(set => set.points.map(point => point[1])).filter(Number.isFinite);
    const histMin = Math.floor(Math.min(100, ...histValues) / 10) * 10;
    const histMax = Math.ceil(Math.max(110, ...histValues) / 10) * 10;
    const histYears = Array.from({ length: Math.floor(end) - state.startYear + 1 }, (_, index) => state.startYear + index)
      .filter((year, index, all) => all.length <= 6 || index % 2 === 0 || index === all.length - 1);
    const industryOptions = fitData.demand.map(row =>
      `<option value="${esc(row.id)}"${state.selected.length === 1 && state.selected[0] === row.id ? " selected" : ""}>${esc(row.name)}</option>`).join("");

    $("#fit-app").innerHTML = `<header class="ff-chapter">
      <div class="ff-eyebrow">04 / EXPLORE JOB OPTIONS</div>
      <h1>Which options fit you?</h1>
      <p>Check where the vacancies are, then test your pay, hours and budget assumptions. Change one condition to see what enters the shortlist and what still needs checking.</p>
    </header>
    <div class="ff-stats">
      <div class="ff-stat"><strong>${rows.length}</strong><span>Industry segments in view</span></div>
      <div class="ff-stat"><strong>${matched.length}</strong><span>Meet pay, hours and surplus criteria</span></div>
      <div class="ff-stat"><strong>${money(budget)}</strong><span>Monthly surplus with the current offer</span></div>
    </div>
    <div class="ff-decision" aria-live="polite"><strong>${esc(status)}</strong>
      <p>Showing: ${esc(selection)}. Shortlist estimates use each industry's median pay. The budget chart uses the offer you enter.</p>
      <div class="ff-chip-row">${chip("case", "example", "Load example")}${chip("resetIndustries", "all", "Show all industries")}</div>
    </div>
    <section class="ff-section" aria-labelledby="find-heading">
      <header class="ff-subhead"><h2 id="find-heading">Where are the vacancies?</h2></header>
      <div class="ff-controls">
        <label class="ff-field">Select one industry<select id="industry" data-control="industry">
          <option value="all"${!state.selected.length ? " selected" : ""}>All industries</option>
          ${state.selected.length > 1 ? `<option selected disabled>Multiple industries selected</option>` : ""}
          ${industryOptions}
        </select></label>
        <div class="ff-chip-row" role="group" aria-label="Select multiple industries">${fitData.demand.map(row => chip("toggleIndustry", row.id, row.name, state.selected.includes(row.id))).join("")}</div>
      </div>
      <div class="ff-grid">
        ${figure({
          id: "map",
          title: "Hiring opportunities",
          unit: "2026 Q2 · Vacancy rate (x) · Employment change year on year (y)",
          body: `<div id="map-viz"></div>`,
          note: "Bubble area shows vacancy count. The horizontal line marks zero growth. The vertical line marks the survey-wide vacancy rate of 1.7%. Select a bubble, or Ctrl/Cmd-click to add industries. The linked charts and shortlist follow your selection.",
          key: legend([["Employment up", "#62568C"], ["Employment down", "#D7647D"]]),
        })}
        ${figure({
          id: "vacancies",
          title: "Vacancies by industry and occupation",
          unit: "2026 Q2 · Broad industries and nine occupation groups",
          control: `<label class="ff-field ff-inline-field">Show in cells<select id="vacancyMode" data-control="vacancyMode"><option value="count"${state.vacancyMode === "count" ? " selected" : ""}>Vacancy count</option><option value="share"${state.vacancyMode === "share" ? " selected" : ""}>Share within industry</option></select></label>`,
          body: heatTable(occupationOrder, chosen),
          note: "Count shows how many vacancies there are. Share shows the mix of vacancies within an industry. Select a cell to filter by its industry.",
        })}
      </div>
    </section>
    <section class="ff-section" aria-labelledby="conditions-heading">
      <header class="ff-subhead"><h2 id="conditions-heading">Would the pay and hours work for me?</h2></header>
      <form class="ff-controls" id="targets-form">
        ${selectControl("payYear", "Pay reference year", Array.from({ length: 10 }, (_, index) => 2025 - index))}
        ${numberField("targetPay", "Target monthly pay (HKD)", state.targetPay, 500)}
        ${numberField("maxHours", "Weekly hours limit", state.maxHours, 1)}
        ${numberField("targetSurplus", "Target monthly surplus (HKD)", state.targetSurplus, 500)}
        <button class="ff-chip ff-apply" type="submit">Apply criteria</button>
      </form>
      <div class="ff-grid">
        ${figure({
          id: "pay-range",
          title: "Monthly pay range",
          unit: `May–June ${state.payYear} · Full-time employees · HKD/month`,
          body: intervals(rows, "pay"),
          note: "The pale band runs from the 25th to the 75th percentile, covering the middle half. The dot is the median. Select it to use that value in the budget.",
        })}
        ${figure({
          id: "hours-range",
          title: "Weekly hours range",
          unit: `May–June ${state.payYear} · Full-time employees · Hours/week`,
          body: intervals(rows, "hours"),
          note: "The dashed line marks your weekly hours limit. Read the full range to decide whether to ask about overtime, even if the median fits.",
        })}
      </div>
      ${figure({
        id: "budget",
        title: "Monthly budget",
        unit: "Editable scenario · HKD per month",
        body: `<form class="ff-controls ff-budget-form" id="budget-form">
          ${numberField("offer", "Monthly offer", state.offer, 500)}
          ${numberField("rent", "Monthly rent", state.rent, 500)}
          ${numberField("living", "Living and transport", state.living, 500)}
          ${numberField("deduct", "Set-aside for deductions", state.deduct, 500)}
          <button class="ff-chip ff-apply" type="submit">Apply budget</button>
        </form><div id="budget-viz"></div>`,
        note: "The budget subtracts three expenses from the assumed offer. Enter your own allowance for items such as tax and MPF. Actual deductions depend on the applicable rules and contract.",
        full: true,
      })}
    </section>
    <section class="ff-section" aria-labelledby="shortlist-heading">
      <header class="ff-subhead"><h2 id="shortlist-heading">Which options should I investigate first?</h2></header>
      ${figure({
        id: "history",
        title: "Employment trends by industry",
        unit: `Quarterly index · ${state.startYear} to ${Math.floor(end)}`,
        control: selectControl("startYear", "History start year", Array.from({ length: 10 }, (_, index) => 2016 + index)),
        body: `<div id="history-viz"></div>`,
        note: "The index divides employment in each quarter by that industry's 2016 Q1 count and multiplies by 100. Changing the start year changes only the viewing window. The lines describe industry employment levels.",
        key: legend(sets.map(set => [set.name, set.color])),
        full: true,
      })}
      ${figure({
        id: "candidates",
        title: "Shortlist comparison",
        unit: "Options that meet all three criteria appear first",
        body: shortlist(ranked),
        note: "Verify actual pay, hours, work eligibility and terms. Vacancy rate is vacancies ÷ (employment + vacancies). Employment YoY is employment this quarter ÷ employment in the same quarter last year − 1. Both are shown as percentages.",
        full: true,
      })}
    </section>`;

    drawMap();
    drawBudget();
    drawHistory(chosen, end, histMin, histMax, histYears);
  }

  function drawMap() {
    const container = $("#map-viz");
    if (!container) return;
    container.innerHTML = bubbles(container.clientWidth || 700, fitData.demand);
  }

  function drawBudget() {
    const container = $("#budget-viz");
    if (!container) return;
    container.innerHTML = waterfall(container.clientWidth || 700, state);
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

  function choose(id, multiple) {
    state.selected = multiple
      ? state.selected.includes(id) ? state.selected.filter(value => value !== id) : [...state.selected, id]
      : state.selected.length === 1 && state.selected[0] === id ? [] : [id];
  }

  function loadExample() {
    Object.assign(state, {
      selected: ["Finance & insurance", "Business services", "Food & lodging", "Real estate"],
      payYear: 2025,
      startYear: 2016,
      vacancyMode: "count",
      targetPay: 25000,
      maxHours: 42,
      targetSurplus: 6000,
      offer: 25000,
      rent: 10000,
      living: 6500,
      deduct: 2000,
    });
  }

  function showTip(element, event) {
    if (!element) return;
    const tip = element.dataset.tip;
    if (!tip) return;
    tooltip.textContent = tip;
    tooltip.classList.add("visible");
    tooltip.style.left = `${Math.max(8, Math.min((event?.clientX ?? 0) + 12, innerWidth - tooltip.offsetWidth - 8))}px`;
    tooltip.style.top = `${Math.max(8, Math.min((event?.clientY ?? 0) + 12, innerHeight - tooltip.offsetHeight - 8))}px`;
  }

  function hideTip() {
    tooltip.classList.remove("visible");
  }

  function bindEvents() {
    const app = $("#fit-app");
    app.addEventListener("click", event => {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      const action = target.dataset.action;
      if (action === "bubble" || action === "selectIndustry") choose(target.dataset.value, event.ctrlKey || event.metaKey);
      if (action === "toggleIndustry") choose(target.dataset.value, true);
      if (action === "offerMedian") state.offer = Number(target.dataset.value);
      if (action === "resetIndustries") state.selected = [];
      if (action === "case") loadExample();
      render();
    });
    app.addEventListener("change", event => {
      const key = event.target.dataset.control;
      if (!key || event.target.tagName !== "SELECT") return;
      if (key === "industry") state.selected = event.target.value === "all" ? [] : [event.target.value];
      else state[key] = Number.isNaN(Number(event.target.value)) ? event.target.value : Number(event.target.value);
      render();
    });
    app.addEventListener("submit", event => {
      event.preventDefault();
      if (event.target.id === "targets-form") {
        state.targetPay = Number($("#targetPay").value);
        state.maxHours = Number($("#maxHours").value);
        state.targetSurplus = Number($("#targetSurplus").value);
      }
      if (event.target.id === "budget-form") {
        state.offer = Number($("#offer").value);
        state.rent = Number($("#rent").value);
        state.living = Number($("#living").value);
        state.deduct = Number($("#deduct").value);
      }
      render();
    });
    app.addEventListener("pointermove", event => {
      const target = event.target.closest("[data-tip]");
      if (target) showTip(target, event);
      else hideTip();
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
      timer = setTimeout(() => {
        drawMap();
        drawBudget();
        const context = fitContext();
        const { end, sets } = historySets(context.chosen);
        const values = sets.flatMap(set => set.points.map(point => point[1])).filter(Number.isFinite);
        const histMin = Math.floor(Math.min(100, ...values) / 10) * 10;
        const histMax = Math.ceil(Math.max(110, ...values) / 10) * 10;
        const histYears = Array.from({ length: Math.floor(end) - state.startYear + 1 }, (_, index) => state.startYear + index)
          .filter((year, index, all) => all.length <= 6 || index % 2 === 0 || index === all.length - 1);
        drawHistory(context.chosen, end, histMin, histMax, histYears);
      }, 160);
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
