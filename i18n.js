/* Shared, non-destructive English / Simplified Chinese interface translations.
   Data IDs, chart values and interaction state always remain in English. */
(() => {
  "use strict";

  const storageKey = "hkjm-language";
  const full = {
    "Hong Kong Job Market Explorer": "香港就业市场探索",
    "Find Your Fit · Hong Kong Job Market Explorer": "职业匹配 · 香港就业市场探索",
    "Explore": "探索市场",
    "Find Your Fit": "职业匹配",
    "Primary navigation": "主导航",
    "Story chapters": "分析章节",
    "Hong Kong job market story": "香港就业市场分析",
    "Expand chapter navigation": "展开章节导航",
    "Collapse chapter navigation": "收起章节导航",
    "Two Markets": "双城市场",
    "Employment Structure": "就业结构",
    "Risk & Resilience": "风险与韧性",
    "Gender & Pay": "性别与薪酬",
    "00 · TWO MARKETS": "00 · 两地就业市场",
    "01 · EMPLOYMENT STRUCTURE": "01 · 就业结构",
    "02 · RISK & RESILIENCE": "02 · 风险与韧性",
    "03 · GENDER & PAY": "03 · 性别与薪酬",
    "Different Workforce Profiles": "两地劳动力结构有何不同？",
    "A direct comparison before the analysis focuses on Hong Kong.": "先比较内地与香港，再深入分析香港就业市场。",
    "Employment by age": "就业人口年龄结构",
    "Share of employed population (%)": "就业人口占比（%）",
    "Middle-age workforce share": "中年就业人口占比",
    "Workers under 35 by industry": "各行业35岁以下就业人口",
    "Share of industry employment (%)": "占该行业就业人数比例（%）",
    "Early · Mainland 2010 / HK 2011": "早期 · 内地2010年 / 香港2011年",
    "Latest · Mainland 2020 / HK 2021": "最新 · 内地2020年 / 香港2021年",
    "Where Hong Kong Works": "香港的就业岗位分布在哪些行业？",
    "Employment scale, industry composition and the occupations behind the market.": "从就业规模、行业结构和职业构成理解香港劳动力市场。",
    "Total employment": "总就业人数",
    "Employed persons ('000)": "就业人数（千人）",
    "Employment share by industry": "各行业就业占比",
    "Click an area to isolate an industry": "点击区域查看单个行业",
    "All industries": "全部行业",
    "Employment status and occupation mix": "就业身份与职业构成",
    "Employment status": "就业身份",
    "Share of employed persons": "占就业人口比例",
    "Occupation mix": "职业构成",
    "Area represents employment": "面积代表就业人数",
    "How Secure Is Employment?": "香港就业有多稳定？",
    "Long-term unemployment, crisis recovery and group-level exposure show where employment is most vulnerable.": "结合长期失业、危机恢复和不同人群的风险，识别就业脆弱性。",
    "Annual unemployment rate": "年度失业率",
    "Unemployment rate (%)": "失业率（%）",
    "Unemployment by education": "不同教育程度的失业率",
    "Click a year to compare age groups": "点击年份比较各年龄组",
    "Unemployment by age": "不同年龄组的失业率",
    "Click an age group to explore its history": "点击年龄组查看历史趋势",
    "Unemployment by age and year": "各年龄组历年失业率",
    "Click a cell to select age and year": "点击单元格选择年龄与年份",
    "Who Benefits from the Market": "谁从香港就业市场中获益？",
    "Participation, representation and pay reveal different dimensions of inequality.": "从劳动参与、行业性别分布和薪酬差异观察不平等。",
    "Median pay over time": "月薪中位数变化趋势",
    "Median monthly pay by industry": "各行业月薪中位数",
    "HKD per month": "港元／月",
    "Participation by age and sex": "不同年龄与性别的劳动参与率",
    "Labour-force participation rate (%)": "劳动人口参与率（%）",
    "Selected year": "选定年份",
    "Three-year comparison": "三年对比",
    "Employment by industry and sex": "各行业就业性别结构",
    "Share within each industry (%)": "行业内占比（%）",
    "Turn market evidence into a personal shortlist.": "把市场数据转化为个人职业候选清单。",
    "Find Your Fit →": "开始职业匹配 →",
    "Play": "播放",
    "Pause": "暂停",
    "Year": "年份",
    "Years": "年份",
    "Age": "年龄",
    "View": "视图",
    "Period": "时期",
    "Industries": "行业",
    "Industry": "行业",
    "Share (%)": "占比（%）",
    "Employment share (%)": "就业占比（%）",
    "Workers under 35 within industry (%)": "行业内35岁以下就业人口（%）",
    "employment status": "就业身份",
    "Male": "男性",
    "Female": "女性",
    "Mainland China": "中国内地",
    "Hong Kong": "香港",
    "04 / EXPLORE JOB OPTIONS": "04 / 探索职业选择",
    "Which options fit you?": "哪些就业选择适合你？",
    "Check where the vacancies are, then test your pay, hours and budget assumptions. Change one condition to see what enters the shortlist and what still needs checking.": "先查看招聘需求，再结合期望薪酬、工作时长和个人预算筛选。调整任一条件，即可看到候选行业如何变化，以及还需核实什么。",
    "Industry segments in view": "当前展示的行业细分",
    "Meet pay, hours and surplus criteria": "同时满足薪酬、工时及结余要求",
    "Monthly surplus with the current offer": "当前薪酬方案下的每月结余",
    "No options meet all three criteria.": "目前没有同时满足三项条件的选择。",
    "Load example": "载入示例",
    "Show all industries": "显示全部行业",
    "Where are the vacancies?": "哪些行业正在招聘？",
    "Select one industry": "选择一个行业",
    "Multiple industries selected": "已选择多个行业",
    "Select multiple industries": "多选行业",
    "Hiring opportunities": "招聘机会分布",
    "2026 Q2 · Vacancy rate (x) · Employment change year on year (y)": "2026年第二季度 · 横轴：职位空缺率 · 纵轴：就业同比变化",
    "Bubble area shows vacancy count. The horizontal line marks zero growth. The vertical line marks the survey-wide vacancy rate of 1.7%. Select a bubble, or Ctrl/Cmd-click to add industries. The linked charts and shortlist follow your selection.": "气泡面积代表职位空缺数量。横线表示就业零增长，竖线表示调查整体空缺率1.7%。点击气泡选择行业，按住 Ctrl/Cmd 可多选；关联图表和候选清单将同步更新。",
    "Employment up": "就业增长",
    "Employment down": "就业下降",
    "Vacancies by industry and occupation": "行业与职业职位空缺分布",
    "2026 Q2 · Broad industries and nine occupation groups": "2026年第二季度 · 行业大类与九大职业类别",
    "Show in cells": "单元格显示",
    "Vacancy count": "空缺数量",
    "Share within industry": "行业内占比",
    "Count shows how many vacancies there are. Share shows the mix of vacancies within an industry. Select a cell to filter by its industry.": "数量视图显示空缺职位数，占比视图显示行业内职业需求结构。点击单元格即可筛选对应行业。",
    "Would the pay and hours work for me?": "薪酬与工作时长是否符合我的期望？",
    "Pay reference year": "薪酬数据年份",
    "Target monthly pay (HKD)": "期望月薪（港元）",
    "Weekly hours limit": "每周工时上限",
    "Target monthly surplus (HKD)": "期望每月结余（港元）",
    "Apply criteria": "应用筛选条件",
    "Monthly pay range": "月薪分布区间",
    "Weekly hours range": "每周工时分布区间",
    "The pale band runs from the 25th to the 75th percentile, covering the middle half. The dot is the median. Select it to use that value in the budget.": "浅色区间为第25至75百分位，涵盖中间50%的样本；圆点表示中位数。点击圆点可将该薪资带入预算。",
    "The dashed line marks your weekly hours limit. Read the full range to decide whether to ask about overtime, even if the median fits.": "虚线标示每周工时上限。即使中位数符合要求，也应关注完整工时范围，判断是否需要了解加班情况。",
    "Monthly budget": "每月预算测算",
    "Editable scenario · HKD per month": "可调整情景 · 港元／月",
    "Monthly offer": "月薪报价",
    "Monthly rent": "每月房租",
    "Living and transport": "生活及交通开支",
    "Set-aside for deductions": "预留扣除款",
    "Apply budget": "更新预算",
    "The budget subtracts three expenses from the assumed offer. Enter your own allowance for items such as tax and MPF. Actual deductions depend on the applicable rules and contract.": "预算以输入的月薪为基础，扣除三类支出。可自行预留税款和强积金等费用；实际扣除额以适用法规及雇佣合约为准。",
    "Which options should I investigate first?": "我应该优先研究哪些就业选择？",
    "Employment trends by industry": "各行业就业趋势",
    "History start year": "趋势起始年份",
    "The index divides employment in each quarter by that industry's 2016 Q1 count and multiplies by 100. Changing the start year changes only the viewing window. The lines describe industry employment levels.": "就业指数以各行业2016年第一季度人数为基期100。调整起始年份只改变显示区间，不改变指数基期；曲线反映行业就业水平变化。",
    "Shortlist comparison": "候选行业对比",
    "Options that meet all three criteria appear first": "同时满足三项要求的选项优先显示",
    "Verify actual pay, hours, work eligibility and terms. Vacancy rate is vacancies ÷ (employment + vacancies). Employment YoY is employment this quarter ÷ employment in the same quarter last year − 1. Both are shown as percentages.": "请进一步核实实际薪酬、工时、工作资格及雇佣条款。空缺率＝空缺职位÷（就业人数＋空缺职位）；就业同比＝本季就业人数÷上年同季就业人数－1，均以百分比表示。",
    "Industry segment": "行业细分",
    "Median monthly pay": "月薪中位数",
    "Median weekly hours": "每周工时中位数",
    "Monthly surplus": "每月结余",
    "Vacancy rate": "职位空缺率",
    "Employment YoY": "就业同比",
    "Broad industry": "所属行业大类",
    "Fit with criteria": "条件匹配情况",
    "Meets criteria": "符合条件",
    "Data needed": "数据待补充",
    "Below criteria": "未完全符合",
    "Verify offer and actual hours": "请核实薪酬报价与实际工时",
    "Pay and hours data are unavailable for the selected industries and year.": "所选行业及年份缺少薪酬或工时数据。",
    "No data for this selection.": "当前筛选条件下无数据。",
    "No data": "暂无数据",
    "Data could not be loaded.": "数据加载失败。",
    "Loading job options…": "正在加载职业选择…",
    "Interactive exploration of Hong Kong employment, pay and labour-market risk.": "交互式探索香港就业、薪酬与劳动力市场风险。",
    "Occupation": "职业",
    "P25–P75": "第25–75百分位",
    "P50": "中位数",
    "Offer": "薪资",
    "Rent": "房租",
    "Living": "生活开支",
    "Set-aside": "预留扣款",
    "Surplus": "结余",
    "Target monthly pay": "期望月薪",
    "No data available": "暂无可用数据",
    "Click to explore this year": "点击查看该年份",
    "Linked data available from 2016": "关联数据自2016年起提供",
    "Click to compare age groups": "点击比较年龄组",
    "Click to isolate this industry.": "点击只查看该行业。",
    "Click again to return to all industries.": "再次点击返回全部行业。",
    "Lower secondary": "初中",
    "Upper secondary": "高中",
    "Primary and below": "小学及以下",
    "Post-secondary - sub-degree": "专上教育（副学位）",
    "Post-secondary - diploma/certificate": "专上教育（文凭／证书）",
    "Post-secondary - degree": "专上教育（学位）"
  };

  const terms = {
    "Financing, insurance, real estate, professional and business services": "金融、保险、地产及专业商业服务",
    "Transportation, storage, postal and courier services, information and communications": "运输、仓储、邮政快递及资讯通讯",
    "Public administration, social and personal services": "公共行政、社会及个人服务",
    "Retail, accommodation and food services": "零售、住宿及餐饮服务",
    "Import/export trade and wholesale": "进出口贸易及批发",
    "Trade, retail & import/export": "贸易、零售及进出口",
    "Public, education, health & social services": "公共、教育、医疗及社会服务",
    "Finance, real estate & business": "金融、地产及商业服务",
    "Transport, storage & post": "运输、仓储及邮政",
    "Information & communications": "资讯及通讯",
    "Finance & professional": "金融及专业服务",
    "Import/export & wholesale": "进出口及批发",
    "Public & social services": "公共及社会服务",
    "Retail & accommodation": "零售及住宿",
    "Transportation & information": "运输及资讯",
    "Education & non-government administration": "教育及非政府行政",
    "Manufacturing (excl. food)": "制造业（不含食品）",
    "Real estate (excl. upkeep)": "地产（不含物业维护）",
    "Skilled agricultural and fishery workers": "农业及渔业技术工人",
    "Plant and machine operators and assemblers": "机械设备操作员及装配员",
    "Craft and related trades workers": "工艺及相关技术工人",
    "Associate professionals": "辅助专业人员",
    "Clerical support workers": "文书支持人员",
    "Services and sales workers": "服务及销售人员",
    "Elementary occupations": "非技术职业",
    "Other occupations": "其他职业",
    "Manufacturing": "制造业",
    "Construction": "建筑业",
    "Trade & wholesale": "贸易及批发",
    "Transport & post": "运输及邮政",
    "Food & lodging": "餐饮及住宿",
    "Finance & insurance": "金融及保险",
    "Business services": "商业服务",
    "Social & personal services": "社会及个人服务",
    "Real estate": "房地产业",
    "Professional & technical": "专业及技术服务",
    "Other transport & post": "其他运输及邮政",
    "Health & beauty": "医疗健康及美容",
    "Elderly homes": "安老院舍",
    "Wholesale": "批发",
    "Local courier": "本地速递",
    "Hair & personal services": "美发及个人服务",
    "Administration & support": "行政及支援服务",
    "Import & export": "进出口贸易",
    "Land transport": "陆路运输",
    "Food services": "餐饮服务",
    "Retail": "零售",
    "Accommodation & food": "住宿及餐饮",
    "Accommodation": "住宿",
    "Other industries": "其他行业",
    "Trade & wholesale": "贸易及批发",
    "Trade & wholesale": "贸易及批发",
    "Transport & ICT": "运输及信息通讯",
    "Finance & business": "金融及商业服务",
    "Public & social": "公共及社会服务",
    "Retail & lodging": "零售及住宿",
    "Other": "其他",
    "Managers": "经理及行政人员",
    "Professionals": "专业人员",
    "Associate pros": "辅助专业人员",
    "Clerical support": "文书支持人员",
    "Craft & trades": "工艺及技术工人",
    "Machine operators": "机械操作人员",
    "Services & sales": "服务及销售人员",
    "Elementary": "非技术工人",
    "Employees": "雇员",
    "Employers": "雇主",
    "Self-employed": "自雇人士",
    "Unpaid family workers": "无酬家庭从业员",
    "Male": "男性",
    "Female": "女性",
    "Men’s monthly pay": "男性月薪",
    "Women’s monthly pay": "女性月薪",
    "Monthly pay gap in": "月薪差距",
    "Women earned": "女性薪酬低",
    "less": "",
    "Labour-force": "劳动人口",
    "Participation": "参与率",
    "Employment share": "就业占比",
    "employment share": "就业占比",
    "thousand employed": "千名就业人口",
    "thousand": "千",
    "Unemployment rate": "失业率",
    "unemployment": "失业率",
    "participation": "参与率",
    "Median monthly pay and gap over time": "月薪中位数及性别薪酬差距趋势",
    "Year:": "年份：",
    "Click to explore this year": "点击查看该年",
    "Click to compare age groups": "点击比较年龄组",
    "Linked data available from": "关联数据自",
    "No data available for": "暂无数据：",
    "available:": "可用年份：",
    "No data for this selection.": "当前筛选无数据。",
    "Show all industries": "显示全部行业",
    "Investigate first:": "建议优先了解：",
    "Showing:": "当前显示：",
    "Shortlist estimates use each industry's median pay. The budget chart uses the offer you enter.": "候选清单按各行业月薪中位数估算；预算图则使用你自行输入的薪酬报价。",
    "HKD": "港元",
    "Q1": "第一季度",
    "Q2": "第二季度",
    "Q3": "第三季度",
    "Q4": "第四季度",
    "All": "全部",
    "broad industries": "个行业大类",
    "Pay below target": "薪酬低于目标",
    "Hours above limit": "工时超过上限",
    "Surplus below target": "结余低于目标",
    "Pay or hours data missing": "缺少薪酬或工时数据",
    "Vacancy heatmap by occupation and industry, scrolls horizontally": "职位空缺热力表，可横向滚动",
    "Shortlist comparison, scrolls horizontally": "候选行业对比表，可横向滚动",
    "Quarterly employment index for selected industries": "所选行业的季度就业指数",
    "Hiring opportunities. X: vacancy rate. Y: year-on-year employment change.": "招聘机会：横轴为空缺率，纵轴为就业同比变化。",
    "Monthly budget waterfall chart": "每月预算瀑布图",
    "Vacancy rate": "空缺率",
    "Employment YoY": "就业同比",
    "Overall": "总体",
    "vacancies": "个空缺职位",
    "vacancy": "空缺职位",
    "Selected year": "选定年份",
    "Three-year comparison": "三年对比",
    "Quarterly index": "季度指数",
    "Index": "指数",
    "Target monthly pay": "期望月薪",
    "Weekly hours limit": "每周工时上限",
    "Hours/week": "小时／周",
    "hours/week": "小时／周",
    "hours": "小时",
    "HKD/month": "港元／月",
    "HKD per month": "港元／月",
    "Full-time employees": "全职雇员",
    "May–June": "5–6月",
    "Dashed line": "虚线",
    "Use in budget": "用于预算",
    "to": "至",
    "and": "和",
    "Share": "占比",
    "Year": "年份",
    "Select": "选择",
    "Highlight": "高亮",
    "Gap": "差距",
    "Pay": "薪酬",
    "Age": "年龄"
  };

  const entries = Object.entries(terms).sort((a, b) => b[0].length - a[0].length);
  const escaped = value => value.replace(/[.*+?^$()|[\]{}\\]/g, "\\$&");
  const patterns = entries.map(([english, chinese]) => {
    return [new RegExp("(^|[^A-Za-z])" + escaped(english) + "(?=$|[^A-Za-z])", "g"), chinese];
  });

  function translate(value) {
    if (!value || !/[A-Za-z]/.test(value)) return value;
    const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(value);
    if (!match) return value;
    const source = match[2];
    let result = full[source];
    if (result === undefined) {
      result = source
        .replace(/Monthly pay gap in (\d{4}):/g, "$1年男女月薪差距：")
        .replace(/Women earned ([\d.,]+)% less/g, "女性月薪低 $1%")
        .replace(/No data available for (\d{4}) \(available: (\d{4}–\d{4})\)/g, "$1年暂无数据（可用年份：$2）");
      for (const [pattern, chinese] of patterns) result = result.replace(pattern, (_, prefix) => prefix + chinese);
    }
    return match[1] + result + match[3];
  }

  const originals = new WeakMap();
  const attributeOriginals = new WeakMap();
  const supportedAttributes = ["aria-label", "title", "placeholder", "alt", "data-tip"];
  let language = "en";
  try {
    const selected = new URLSearchParams(location.search).get("lang");
    language = selected === "zh" || selected === "en" ? selected : (localStorage.getItem(storageKey) === "zh" ? "zh" : "en");
  } catch (_) { /* Language selection remains usable without storage. */ }

  function skip(node) {
    const parent = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return !parent || !!parent.closest("script, style, noscript, .language-toggle");
  }

  function localizeText(node) {
    if (skip(node)) return;
    const current = node.nodeValue;
    let source = originals.get(node);
    if (!source || source.last !== current) source = { english: current, last: current };
    const desired = language === "zh" ? translate(source.english) : source.english;
    originals.set(node, { english: source.english, last: desired });
    if (current !== desired) node.nodeValue = desired;
  }

  function localizeAttrs(element) {
    if (skip(element) || element.nodeType !== Node.ELEMENT_NODE) return;
    let cache = attributeOriginals.get(element) || {};
    for (const name of supportedAttributes) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      let source = cache[name];
      if (!source || source.last !== current) source = { english: current, last: current };
      const desired = language === "zh" ? translate(source.english) : source.english;
      cache[name] = { english: source.english, last: desired };
      if (current !== desired) element.setAttribute(name, desired);
    }
    attributeOriginals.set(element, cache);
  }

  function localizeTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { localizeText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && skip(root)) return;
    if (root.nodeType === Node.ELEMENT_NODE) localizeAttrs(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let item;
    while ((item = walker.nextNode())) {
      if (item.nodeType === Node.TEXT_NODE) localizeText(item);
      else localizeAttrs(item);
    }
  }

  function updateSelection() {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.querySelectorAll(".language-toggle button[data-lang]").forEach(button => {
      const active = button.dataset.lang === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const title = document.body.classList.contains("fit-page")
      ? "Find Your Fit · Hong Kong Job Market Explorer"
      : "Hong Kong Job Market Explorer";
    document.title = language === "zh" ? full[title] : title;
  }

  function setLanguage(next, persist = true) {
    if (next !== "zh" && next !== "en") return;
    language = next;
    if (persist) {
      try { localStorage.setItem(storageKey, next); } catch (_) { /* Ignore blocked storage. */ }
    }
    updateSelection();
    localizeTree(document.body);
    if (persist) window.dispatchEvent(new Event("resize"));
  }

  document.addEventListener("click", event => {
    const button = event.target.closest(".language-toggle button[data-lang]");
    if (button) setLanguage(button.dataset.lang);
  });

  const observer = new MutationObserver(records => {
    if (language !== "zh") return;
    for (const record of records) {
      if (record.type === "characterData") localizeText(record.target);
      if (record.type === "attributes") localizeAttrs(record.target);
      if (record.type === "childList") for (const node of record.addedNodes) localizeTree(node);
    }
  });
  observer.observe(document.documentElement, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: supportedAttributes
  });
  window.HKJobI18n = Object.freeze({ setLanguage, getLanguage: () => language });
  setLanguage(language, false);
})();