# Hong Kong Job Market Explorer 修改方案

## 1. 修改目标

将两个页面从偏叙事型长页面，调整为更紧凑、更专业的数据看板：

- 标题保留在页面上方，但显著压缩首屏高度。
- 删除装饰性指标和重复信息，把空间优先留给图表与筛选器。
- 桌面端的主要内容尽量控制在约 1–2 屏内；允许轻微滚动，不再形成连续长页面。
- 统一章节、图卡、筛选器、坐标轴、间距和配色规则。
- 所有数据仍从原 TWBX 工作簿提取，不补造数值；年份选择仅显示工作簿实际存在的数据年份。

## 2. 两个页面共同修改

### 2.1 顶部区域

- 保留顶部导航和页面标题。
- 删除 Page 01 的以下三组信息：
  - `1985–2026 / Market coverage`
  - `10 / Broad industries`
  - `18 / Career groups`
- 删除 Page 02 的以下信息：
  - `18 / Career groups`
  - `2016–2025 / Pay and hours`
  - `2026 Q2 / Hiring demand`
- 标题区高度由当前约 210–230px 压缩至约 96–120px。
- 页面标题桌面端控制在 40–48px，移动端控制在 32–38px，不再占据半个首屏。

### 2.2 页面宽度与留白

- 主内容最大宽度统一为约 1440px，并在大屏居中。
- 页面左右边距统一为 28–40px；图卡间距统一为 12–16px。
- 图卡内边距由当前 20px 左右压缩至 14–18px。
- 常规图表高度控制在 240–300px，仅在确实需要更多类别标签时增加高度。
- 删除每页底部：
  - `Hong Kong Job Market Explorer`
  - `Tableau workbook data`
- 移除底部为 footer 预留的空白。

### 2.3 标题层级

- 章节标题改成上下结构，不再让大标题与说明文字左右分栏。
- 统一结构：

  ```text
  02  EMPLOYMENT STRUCTURE
  Where Hong Kong Works
  From total employment to industry and occupation structure.
  ```

- 章节编号和类别为小号辅助文字，主标题在下，说明文字紧接主标题。
- Page 02 的各模块标题也采用相同的上下结构，避免标题、统计数字和筛选器挤在同一行。

## 3. Page 01 — Explore

### 3.1 章节重新组织

当前 `03 Opportunities` 与 Page 02 的工资、工时、行业机会和职位选择功能重复，因此删除该章节。

修改后的 Page 01 只保留四个章节：

1. `01 Two Markets`
2. `02 Employment Structure`
3. `03 Gender & Pay`
4. `04 Risk & Resilience`

原 `04 Gender & Pay` 和 `05 Risk` 顺次改为 `03`、`04`。章节导航仍然使用切换方式，因此用户不会连续向下滚动四个完整章节。

章节切换栏压缩至约 48–52px 高；编号在上、文字在下或采用两行紧凑排列。

### 3.2 01 Two Markets

- 保留现有三组分析：
  - Employment by age
  - Middle-age workforce share
  - Workers under 35 by industry
- 桌面端采用紧凑的两行布局：
  - 第一行：年龄结构图与中年劳动力趋势图。
  - 第二行：35 岁以下行业结构图。
- 减少图上重复年份说明，将年份放入图卡右上角或统一筛选器。
- 图高缩短，但保留完整坐标、图例和悬浮提示。

### 3.3 02 Employment Structure

#### Total employment

- 保留总就业趋势图。
- 删除图中右端单独标注的 `3.67m`，避免无上下文的大数字干扰阅读。
- 数值仅在悬浮提示中显示，纵轴继续使用 `Employed persons ('000)`。

#### Employment share by industry

- 删除目前图卡右上角的行业下拉框。
- 默认显示所有行业的堆叠面积图。
- 每个行业使用固定行业颜色，并增加清晰图例。
- 用户直接点击图中的某个行业面积，进入单行业模式：
  - 只显示被点击行业。
  - 保持该行业在总图中的原颜色。
  - 使用从 0 基线填充的面积图，不再显示单独折线。
  - 纵轴自动调整到该行业的合理范围，但仍明确标注百分比。
- 再次点击当前行业、点击图例中的 `All industries`，或点击轻量返回按钮，即恢复总堆叠面积图。
- 悬浮提示显示行业、年份和就业占比。

#### Employment status + Occupation mix

- 恢复原 Tableau 中的雇员构成饼图，放在左侧。
- 将当前条形版 `Occupation mix` 恢复为原 Tableau 的热力图，放在右侧。
- 两张图使用同一个紧凑年份选择器，年份变化时同步更新：
  - 左：Employment status 饼图。
  - 右：Occupation mix 热力图。
- 年份列表只使用工作簿中实际存在的年份。
- 饼图的类别颜色固定；热力图使用同一色相的深浅表示数量，不用多个无意义的类别色。
- 两张图在桌面端左右排列，在窄屏端自动上下排列。

### 3.4 删除原 03 Opportunities

删除以下内容：

- Employment scale
- Vacancy rate
- Pay and working hours
- Focus industry 筛选器

这些内容已由 Page 02 的筛选、行业匹配、行业详情和预算工具覆盖。Page 01 只承担“理解市场”的任务，Page 02 承担“做求职选择”的任务，避免功能重复。

### 3.5 03 Gender & Pay

- 保留四张图，但压缩为紧凑的 2×2 看板。
- Participation、employment share、pay gap、pay trend 使用一致的卡片尺寸和轴标签位置。
- 男性固定使用靛蓝色，女性固定使用玫红色；同一含义在所有相关图表中不换色。
- 年份和排序控件置于图卡右上角，不与章节标题并排。
- 图例只保留一套，不在每张图中重复占用空间。

### 3.6 04 Risk & Resilience

- 修复当前原 05 章节的错位、宽窄不齐和卡片高度不一致问题。
- 推荐布局：
  - 第一行：Annual unemployment rate，全宽但降低高度。
  - 第二行：Recovery after crises 与 Unemployment exposure 等宽并列。
- Crisis 和 Group 筛选器都收进对应图卡右上角。
- 危机事件标签采用统一避让规则，避免 SARS、GFC 等文字互相覆盖。
- 删除底部占空间较大的 `Pay / Hours / Demand / Stability` 横条，只保留一个紧凑的 `Find Your Fit →` 主按钮。

## 4. Page 02 — Find Your Fit

### 4.1 整体结构

继续保持用户此前确定的“上下结构”，不恢复左侧筛选栏。

页面顺序调整为：

1. Page title
2. Your Priorities
3. Industry Matches
4. Compare / Industry Detail
5. Monthly Budget

通过缩短模块高度、限制表格高度和折叠次要内容，把桌面端主要操作控制在约 1.5–2 屏内。

### 4.2 Your Priorities

- 删除页面顶部的三组说明性指标。
- 三个核心滑杆放在第一行：
  - Target monthly pay
  - Maximum weekly hours
  - Minimum monthly surplus
- 年份、Broad industry、Detailed industry 放在第二行。
- Broad industry 和 Detailed industry 均使用带复选框的多选下拉；空选择代表全部，按钮显示已选数量。
- Monthly cost assumptions 默认折叠，避免首屏被输入框占满。
- `industries meet all targets` 放在筛选区底部作为紧凑结果提示，不与模块标题抢空间。
- 缩短滑杆上下留白，统一标签与数值的对齐方式。

### 4.3 Industry Matches

- 修复表格列宽、表头和空白区域错位问题。
- 表格设置约 300–360px 的最大可视高度，表头固定，数据区内部滚动。
- 优先显示关键列：Industry、Median pay、Weekly hours、Surplus、Vacancy rate、Status、Compare。
- Broad industry 作为次要信息合并到行业名称下方，减少一列。
- Employment YoY 保留，但在较窄屏幕中进入展开详情，不强行挤压全部列。
- All / Matches / Below targets 和 Sort 放在同一条紧凑工具栏中。

### 4.4 Compare Industries 与 Industry Detail

- 保持纵向流程，但不再让两个模块各占一个大段落。
- 当用户未选择比较行业时，不展示大面积空状态，只显示一行提示。
- 选择任意数量的行业后，直接展开紧凑比较区域；遵循原 Tableau `SelectedIndustries` 集合逻辑，不设置三个行业上限。
- 修复当前选择两个行业后出现的卡片留空、内容宽度异常、图表错位和标签拥挤问题。
- 比较区域根据实际选择数量切换布局，不再始终套用三列模板：
  - 选择 1 个行业：单张卡片使用完整宽度，但限制最大宽度，避免被横向拉得过长。
  - 选择 2 个行业：严格使用两列等宽布局，各占 50%，不保留第三列空位。
  - 选择 3 个行业：使用三列等宽布局。
  - 选择 4 个行业：大屏使用四列等宽布局。
  - 选择 5 个或以上：使用固定宽度网格自动换行。
  - 平板和手机端统一变为单列纵向排列。
- 两个行业名称较长时允许自然换行；两张卡片的标题区、指标行和底部边界保持对齐。
- 每张比较卡固定使用四个相同位置的指标：Median pay、Weekly hours、Vacancy rate、Employment YoY，避免因文字长短产生高度差。
- 工资范围图和工时范围图分别使用统一的共享坐标尺度，两个行业的点线不能各自缩放后造成误判。
- 工资和工时图卡保持固定可视高度；行业较多时仅在图表内部滚动，不拉长整个页面。
- 完整行业名称与 P25、P50、P75 数值通过悬浮提示显示，避免标签覆盖。
- 两个被比较行业使用各自固定的行业颜色；图例、卡片标识、区间线和数据点保持同色。
- 比较图左侧预留统一的行业名称宽度，避免长名称覆盖坐标轴或进入绘图区。
- 选择或取消第二个行业时只更新比较区域，不改变页面滚动位置，也不让版面突然跳动。
- 点击表格行后，在下方展开该行业详情；不再长期占用一个完整的大模块高度。
- Industry Detail 的两张图缩短高度，并统一标题、轴线和筛选器位置。

### 4.5 Monthly Budget

- 修复瀑布图与结果卡在不同屏宽下的错位。
- 预算模块默认显示紧凑摘要：Offer pay、Total costs、Estimated balance。
- 点击后再展开详细成本构成。
- 收入使用主色，支出使用暖色，余额根据正负使用绿色或红色。
- 删除重复的说明文字，仅保留必要的 `Before tax and MPF`。

## 5. 统一色彩系统

### 5.1 行业固定颜色

十个 broad industries 建立唯一且固定的颜色映射；同一行业在所有图表中始终使用同一颜色：

| Broad industry | Color |
|---|---|
| Manufacturing | `#5B4BDB` |
| Trade & wholesale | `#3E79B7` |
| Retail | `#D7647D` |
| Food & lodging | `#D9824B` |
| Transport & post | `#2D8C84` |
| Information & communications | `#4F9DA6` |
| Finance & insurance | `#8A67C7` |
| Real estate | `#C58A3B` |
| Business services | `#65758B` |
| Social & personal services | `#4E8B63` |

### 5.2 语义颜色

| Meaning | Color |
|---|---|
| Male | `#5B4BDB` |
| Female | `#D7647D` |
| Positive / meets target | `#3F8060` |
| Negative / below target | `#B65360` |
| Neutral comparison | `#65758B` |
| Grid lines | `#E4E7EC` |
| Primary text | `#20232A` |
| Secondary text | `#667085` |

规则：

- 同一图中不同系列不得使用相同颜色。
- 相同语义跨图保持同色。
- 面积图使用对应系列颜色并降低填充透明度，边线使用同色较深版本。
- 非选中元素降低透明度，不随意改成另一个类别色。
- 热力图使用单色连续色阶，不使用分类色板。

## 6. 响应式与排版修复

- 1440px 以上：内容居中，不继续无限拉宽。
- 1024–1439px：保持双列图表，适当缩短轴标签。
- 768–1023px：双列按内容自动转为单列或 60/40 布局。
- 767px 以下：图表单列，章节标签允许横向滑动，表格内部横向滚动。
- 所有卡片使用相同边框、圆角、阴影强度和标题间距。
- 修复当前 Risk 章节、Industry Matches 表格、Compare 区域和 Budget 区域的溢出与错位。
- 长行业名称不强制截断到无法理解；优先换行，必要时在悬浮提示中显示全名。

## 7. 验收标准

- 两个页面顶部不再出现 Market coverage、Broad industries、Career groups 等统计块。
- 两页底部不再出现 `Hong Kong Job Market Explorer / Tableau workbook data`。
- Page 01 只保留四个章节，原 Opportunities 已删除。
- 章节大标题与说明文字为上下结构。
- Total employment 图中不再显示 `3.67m`。
- Industry share 可直接点击面积选择行业；单行业仍为同色填充面积图。
- Employment status 饼图在左，Occupation mix 热力图在右，并可按实际年份切换。
- Risk 章节和 Page 02 不再出现卡片重叠、空白异常或列宽错位。
- Compare Industries 在选择两个行业时显示为两列等宽布局，没有第三列空位、文字覆盖或图表错位。
- Page 02 保持筛选在上、结果在下的纵向逻辑，并显著缩短页面。
- 颜色映射跨图一致，同一图中不同含义不会使用相同颜色。
- 所有图表保留清晰的横纵轴名称、单位、年份和悬浮数值。

## 8. 第二轮视觉修正

### 8.1 章节眉题字号

- `01 · TWO MARKETS`、`02 · EMPLOYMENT STRUCTURE` 等章节眉题从当前约 11px 提升至 13–14px。
- 字重调整至 700–750，字距控制在约 0.05em，仍作为辅助层级，但不再难以阅读。
- Page 01 四个章节与 Page 02 五个模块全部使用同一字号和上下间距。

### 8.2 Middle-age workforce share 标签溢出

- 增加绘图区右侧安全边距，确保终点标签不会超出卡片。
- 终点标签改为在 SVG 内部右对齐，而不是继续向图外延伸。
- 桌面端保留 `Mainland China` 与 `Hong Kong` 完整名称。
- 窄屏空间不足时，改用图内上方图例；完整名称和数值继续通过悬浮提示显示。
- 为折线、标签和图卡边缘保留统一的 12–16px 安全距离。

### 8.3 Occupation mix 改回面积表达

- 取消目前九个等尺寸色块的热力图方式。
- 恢复为 treemap：每个职业方块的面积按 `occupation_employment_thousand` 成比例变化。
- 大职业类别占更大面积，小职业类别占更小面积，视觉重点由“大小”而不是单纯颜色深浅决定。
- 继续保留 2016–2025 年份选择；切换年份时重新计算 treemap 面积。
- 方块内只在空间足够时显示短名称和数值；空间不足的方块不强塞文字，完整职业名称、就业人数和占比通过悬浮提示显示。

### 8.4 统一使用 Tableau 粉紫色板

- 删除网页自行定义的蓝、绿、橙等行业色。
- 所有图表统一使用 TWBX 中的 `purple_pink_gray_10_0` 与 `muted_purple_pink_gray_10_0` 体系。
- 固定使用以下 20 个工作簿粉紫灰颜色：

| Group | Colors |
|---|---|
| Deep purple / gray | `#6F6F6F` `#7C7270` `#7F74A7` `#8074A8` `#9A6E96` |
| Mid purple | `#9B93C9` `#9C9290` `#A696C4` `#B173A0` `#B898BC` |
| Light purple | `#B9B0D8` `#C5BFBE` `#C6C1F0` `#C799BC` `#CE9AB8` |
| Pink | `#BE6482` `#C46487` `#DDB5D5` `#E3A9C8` `#F498B6` |

- 男性固定使用 Tableau 紫色，女性固定使用 Tableau 粉色。
- 同一图中的不同类别依次使用不同的粉紫灰颜色，不出现两个不同系列使用同一颜色。
- 同一类别跨图保持相同颜色；非选中状态只降低透明度，不替换颜色。
- 连续数值图使用该色板的浅紫到深紫渐变，不再使用蓝绿渐变。

### 8.5 Page 02 多选下拉文字修复

- 修复 Broad industry 与 Detailed industry 多选菜单中文字缺失、颜色继承错误和长名称被裁切的问题。
- 下拉菜单正文统一为 13–14px、`#20232A`，行高不低于 1.35。
- 菜单设置白色实底、明确边框和足够层级，不被后面的表格或图卡覆盖。
- 菜单最小宽度约 300–340px，长行业名称允许换行，不使用不可读的省略号。
- 收起状态显示：
  - 未选择：`All broad industries` / `All detailed industries`
  - 选择 1–2 个：直接显示所选名称
  - 选择 3 个及以上：显示 `N industries selected`
- 增加 `Select all` 与 `Clear` 操作，便于恢复全部行业。
- 复选框、文字和点击区域整行可点，悬浮与选中状态使用 Tableau 浅紫背景。

### 8.6 本轮验收标准

- 所有章节眉题在桌面和移动端都清晰可读。
- Middle-age workforce share 的两个终点标签不越出图卡。
- Occupation mix 的方块面积能真实反映就业人数大小。
- 全站不再混用自定义蓝绿橙色板，统一为 TWBX 粉紫灰体系。
- Page 02 两个多选下拉框展开后所有行业文字完整可读、可换行、可勾选。

## 9. 整体视觉升级

### 9.1 设计方向

整体从“规整但偏死板的白色卡片看板”，调整为具有编辑感的专业数据产品。视觉关键词：

- Editorial data atlas
- Calm and premium
- Chart-first
- Light, precise and spacious

不再让每个模块都像独立表格框，而是通过字体层级、留白、底色和对齐关系组织内容。保留专业性，但增加节奏和视觉呼吸感。

### 9.2 字体系统

- 页面标题与章节大标题使用 `Manrope`：字形现代、清晰，适合较大的英文标题。
- 正文、筛选器、图表标题和坐标轴使用 `Inter`：阅读稳定，数字辨识度高。
- 数值启用 tabular numerals，使工资、百分比和年份纵向对齐。
- 字重不使用过多层级，只保留：
  - 750：页面标题
  - 650：章节标题和图表标题
  - 500：筛选器与正文
  - 400：坐标轴和辅助文字
- 避免标题过粗、正文过小。桌面端建议：
  - Page title：40–44px
  - Chapter title：28–32px
  - Chart title：16–17px
  - UI / body：13–15px
  - Axis / annotation：11.5–12.5px
- 移动端使用独立字号比例，不直接把桌面尺寸机械缩小。

### 9.3 页面背景与表面层级

- 主背景由纯灰改为带轻微紫色倾向的暖灰：`#F7F6FA`。
- 主要内容表面使用 `#FFFFFF`，辅助区域使用 `#F0EEF6` 或 `#F3F1F8`。
- 不再为每个图卡使用同样明显的深边框。
- 核心图卡使用非常浅的 1px 边线与柔和阴影；次要图表可以直接放在背景上，只用留白分隔。
- 阴影控制在低对比范围，例如 `0 8px 28px rgba(58, 45, 92, 0.06)`，避免悬浮卡片感过重。
- 圆角统一为 10–12px，不混用多个小圆角。

### 9.4 页面标题区

- 标题仍位于页面上方，但不再形成一块空旷的大横幅。
- 标题区控制在约 84–96px 高。
- 页面标题左对齐，与下方章节导航和图表网格使用同一条基准线。
- 标题旁不再放 Market coverage 等指标。
- 可以在标题下加入一条极细的粉紫渐变线，作为品牌识别，不添加副标题。

### 9.5 章节导航

- 当前四等分大方格改为更轻的 segmented navigation。
- 导航背景使用半透明浅色，整体圆角约 10px。
- 未选章节不再被明显边框分割，只显示淡色编号与标题。
- 当前章节使用浅紫底、深紫文字和短下划线，不使用整块厚重白色框。
- 鼠标悬浮时只做轻微底色和文字变化，过渡时间约 160–200ms。

### 9.6 图表卡片

- 图表不再全部等权重装进相同白框。
- 每章设置一个视觉主图，其余图表作为辅助图：
  - 01：Employment by age 为主图。
  - 02：Employment share by industry 为主图。
  - 03：Median monthly pay by industry 为主图。
  - 04：Annual unemployment rate 为主图。
- 主图可以使用更宽的比例和轻微紫色底层；辅助图使用更轻的表面。
- 图表标题、单位、年份和筛选器统一对齐，避免每张卡片标题区高度不同。
- 坐标网格线进一步变淡，轴线减少，只保留阅读所需的刻度。
- 悬浮时只高亮当前数据系列，其余系列降低透明度，增强交互反馈。

### 9.7 留白与节奏

- 使用 8px 基础间距系统：8、12、16、24、32。
- 页面左右安全边距：桌面 32–40px，平板 24px，手机 16px。
- 章节标题到图表的距离约 18–22px。
- 图表之间的距离约 14–16px。
- 删除无意义的大面积空白，也避免图表和文字过度贴近。
- 同一屏内形成“标题—主图—辅助图”的阅读节奏，不再像连续排列的表格单元格。

### 9.8 Page 02 视觉升级

- Your Priorities 作为一个完整的浅色控制面板，不拆成多个零散边框。
- 三个滑杆使用细轨道和圆形紫色控制点；当前数值采用中等字重，不使用过大的数字。
- Broad industry 与 Detailed industry 多选框使用一致的高度、图标和展开动画。
- Industry Matches 表格弱化竖向分隔线，使用轻微行底色变化和悬浮高亮。
- Meets targets / Below targets 改为紧凑状态胶囊，但颜色仍来自 Tableau 粉紫体系，不额外引入绿色和红色。
- Compare Industries 卡片用顶部色条区分行业，卡片本身减少边框。
- 工资和工时区间图采用相同的视觉语法，悬浮时显示完整数据。
- Budget 区域使用简洁的水平瀑布或余额条，不再出现视觉重量过大的柱形墙。

### 9.9 动效与交互反馈

- 章节切换、下拉展开、图表筛选采用 160–220ms 的柔和过渡。
- 避免大幅移动、缩放和弹跳效果。
- 图表悬浮只改变透明度、描边或轻微阴影。
- 点击 Employment share 行业后，其他面积逐渐淡出，目标行业平滑过渡到单行业面积图。
- 尊重 `prefers-reduced-motion`，用户关闭动效时直接切换。

### 9.10 整体视觉验收标准

- 第一眼应更接近专业数据产品或编辑型研究报告，而不是后台管理系统。
- 页面不再由大量同样粗重的白色方框组成。
- 字号、字重和数字对齐在两个页面保持一致。
- Tableau 粉紫灰色板成为唯一主要图表色系。
- 图表仍是页面最醒目的内容，装饰元素不抢夺注意力。
- 两个页面风格统一，但 Explore 更偏数据叙事，Find Your Fit 更偏工具操作。

