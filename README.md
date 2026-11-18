# 香港就业市场探索器

这是一个基于 Tableau 工作簿数据制作的英文交互式就业市场网站。

- [在线预览](https://hong-kong-job-market-explorer.ketianli082.chatgpt.site)
- Page 01 — Explore：香港就业市场数据故事
- Page 02 — Find Your Fit：求职选择与行业比较工具

## 分工

- **叶同学先执行完整修改方案**：负责 Page 01，并一起修复方案中指定的 Page 02 行业下拉框问题。
- **彭同学随后负责 Page 02**：在叶同学的修改合并后继续工作，其余设计和修改方式自行发挥。

## 对应分支

- 叶同学：`page1-ye`
- 彭同学：`page2-peng`
- 叶同学先提交并合并修改；彭同学从更新后的 `main` 开始 Page 02 工作。


## 叶同学本轮更新（2026-11-18）

修改已提交至 `page1-ye`。本节记录该分支的功能，在线预览的发布状态需另行确认。

### Page 01 — Explore

章节顺序统一为 `00 Two Markets → 01 Employment Structure → 02 Risk & Resilience → 03 Gender & Pay`。标题使用 Manrope，正文与图表使用 Inter，统一卡片、字体层级和粉紫灰视觉，并调整桌面与手机布局。

#### 00 · Two Markets

- 三张地区对比图统一使用灰梅紫表示 Mainland China、薰衣草紫表示 Hong Kong。
- 点击地区数据，三个图同步突出该地区、淡化另一地区；再次点击恢复两地对比。
- 行业 35 岁以下就业占比支持 Early / Latest 按钮切换，分别对应内地 2010／香港 2011、内地 2020／香港 2021。早期数据从原 Tableau 工作簿提取。
- 修复 Middle-age workforce share 的末端标签越界。

#### 01 · Employment Structure

- Occupation mix 改为按就业人数决定面积的 treemap，年份变化时重新计算面积，悬停显示完整职业名称、人数与占比。
- 点击 Total employment 中 2016–2025 年的圆点，同步更新 Employment status、Occupation mix 和行业占比图的年份标记。
- 在行业占比图中选中具体行业后，其 2016–2025 年圆点同样支持年份联动，并保留当前行业。
- 2008–2015 年的总就业与行业占比数据继续展示；因职业和就业身份数据从 2016 年开始，这些早期年份禁用联动选择。

#### 02 · Risk & Resilience

保留四张核心图，并以年份和年龄组联动。

- Annual unemployment rate 使用谷底粉色、峰顶深紫的渐变，支持选择年份及点击危机标记。
- Unemployment by education 同时展示九个教育组的历史折线，点击图例突出某组，再次点击恢复；点击年份联动其他图表。
- Unemployment by age 展示所选年份各年龄组失业率，横轴按当年数据自适应；点击条形选择年龄组。
- Unemployment by age and year 使用热力图，颜色越深表示失业率越高；点击单元格同时选择年龄与年份。
- 年龄和教育历史数据来自原 Tableau 提取文件，缺失记录保留为空缺。

#### 03 · Gender & Pay

- Participation by age and sex 提供 Selected year 与 Three-year comparison 两种模式。三年对比展示 1985、2005、2025 年，悬停年份图例时淡化其他年份。
- Selected year 模式接入年份联动，Play / Pause 可播放 2008–2025 年；横轴标为 Age (years)。
- Median pay over time 增加男女曲线之间的差额填色、最新年份摘要及末端金额。悬停显示同一年男女月薪和差额，点击可固定弹窗。
- 点击薪酬趋势中 2008–2025 年的位置，联动劳动参与率单年视图、行业性别就业比例和行业月薪图；共享 Year 下拉框也可切换年份。
- Median monthly pay by industry 取消排序，使用固定行业顺序和年份选择；男女端点外侧标出月薪金额，并增加 10k、20k 辅助线。
- Employment by industry and sex 使用行业别名，条形上直接标注男女比例；窄色段的数值显示在条形上方。
- 上排为两张薪酬图，下排为参与率与行业就业比例图。男女图例位于行业月薪图中。

### Page 02 — Find Your Fit

修复 Broad industry 与 Detailed industry 多选菜单，包含完整行业文字、长名称换行、Select all / Clear、选择摘要和移动端定位。Broad industry 变化时，Detailed industry 自动移除超出范围的选择。

### 数据补充

- `data/industry-employment-by-sex.json` 保存 2008–2025 年按行业及性别的就业人数。[香港政府统计处表 210-06305](https://www.censtatd.gov.hk/en/web_table.html?id=210-06305)
- `data/industry-pay-by-sex.json` 保存 2008–2025 年按行业及性别的月薪中位数，2025 年数值已与原包核对一致。[香港政府统计处表 210-06316](https://www.censtatd.gov.hk/en/web_table.html?id=210-06316)
- `data/participation-by-year.json` 保存 1985–2025 年按年龄及性别的劳动参与率，联动播放范围为 2008–2025 年。[香港政府统计处表 210-06201](https://www.censtatd.gov.hk/en/web_table.html?id=210-06201)
- `data/risk-age-history.json` 与 `data/risk-education-history.json` 保存原 Tableau 提取的年龄和教育失业率历史数据。
- `data/data.json` 补入原 Tableau 的早期行业 35 岁以下就业占比。

### 验证记录

已进行 JavaScript 语法、JSON 解析及 Git 空白检查，并通过本地浏览器验证主要年份／群体联动、模式切换、播放暂停和多种屏幕宽度下的布局。后续修改可按上述交互步骤回归检查。

## 一屏布局与导航更新（2026-11-18）

- 电脑内容区至少 900×600 时，仪表盘使用随窗口调整高度的一屏布局；已在 1440×900、1366×768 等窗口验证。较小窗口及手机使用纵向布局。
- 左侧章节导航默认收起，通过边缘箭头按钮展开；选择章节后自动收起，图表重新适配可用宽度。
- 移除重复页面主标题，压缩章节标题行及顶部留白，增加图表展示面积。
- 图表标题增加左右 8px、顶部 4px 内边距。
- Employment share by industry 图例移至标题右侧，支持点击突出行业、再次点击恢复。行业内年份点继续联动职业构成、就业身份及总就业图。

## 本地运行

项目不需要安装或构建。在仓库根目录运行：

```bash
python3 -m http.server 8000
```

然后打开 `http://localhost:8000`。

## 文件结构

- `index.html` / `app.js`：Page 01
- `fit.html` / `fit.js`：Page 02
- `styles.css`：网站样式
- `data/data.json`：网站使用的数据
- `docs/MODIFICATION_PLAN_ZH.md`：叶同学优先执行的完整修改方案
- `downloads/hong-kong-job-market-explorer-source.zip`：源码压缩包

原始 `.twbx` 文件不上传到本仓库；网站使用的提取数据及历史序列保存在 `data/` 目录中。
