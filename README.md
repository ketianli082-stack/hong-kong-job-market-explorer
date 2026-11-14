# 香港就业市场探索器

这是一个基于已上传 Tableau 工作簿数据制作的英文交互式就业市场看板。

- [在线预览](https://hong-kong-job-market-explorer.ketianli082.chatgpt.site)
- Page 01 — Explore：市场结构、行业分布、性别与收入、就业风险与韧性
- Page 02 — Find Your Fit：求职优先条件、多行业筛选、行业比较与月度预算

## 协作顺序

1. **叶同学先开始修改**：使用 `page1-ye` 分支，按照已确认的修改方案完成 Page 01。
2. **彭同学修改 Page 02**：使用 `page2-peng` 分支，在 Page 01 的字体、颜色和公共视觉样式确认后继续修改。
3. 两个页面完成后分别通过 Pull Request 合并到 `main`，不要把未完成的修改直接提交到 `main`。

完整修改要求见 [`docs/MODIFICATION_PLAN_ZH.md`](docs/MODIFICATION_PLAN_ZH.md)。

## 页面分工

| 页面或内容 | 负责人 | 主要文件 |
|---|---|---|
| Page 01 — Explore | 叶同学 | `index.html`、`app.js`、`styles.css` 中的 Page 01 样式 |
| Page 02 — Find Your Fit | 彭同学 | `fit.html`、`fit.js`、`styles.css` 中的 Page 02 样式 |
| 公共数据与视觉系统 | 修改前共同确认 | `data/data.json`、`styles.css` 中的公共样式 |

## 本地运行

项目不需要安装或构建。在仓库根目录启动一个本地网页服务：

```bash
python3 -m http.server 8000
```

然后在浏览器打开 `http://localhost:8000`。

## 文件结构

- `index.html` / `app.js`：Page 01
- `fit.html` / `fit.js`：Page 02
- `styles.css`：两个页面共用的视觉样式与响应式布局
- `data/data.json`：两个页面使用的工作簿提取数据
- `assets/mark.svg`：网站图形资源
- `docs/MODIFICATION_PLAN_ZH.md`：完整修改方案与验收标准
- `downloads/hong-kong-job-market-explorer-source.zip`：可下载的源码压缩包

## 修改注意事项

- 不得补造或手动估算数据；图表只能使用 `data/data.json` 中已有的实际数据。
- 叶同学应先确定公共字体、Tableau 粉紫灰配色、间距和图卡样式，彭同学在 Page 02 中延续同一套视觉系统。
- Broad industry 与 Detailed industry 必须保留多选能力。
- Compare Industries 不设置三个行业的数量上限。
- 修改完成后需要检查桌面端和移动端的排版、坐标轴、单位、年份、悬浮提示、下拉菜单文字和内容溢出。

原始 `.twbx` 文件不上传到本仓库；网站运行所使用的已提取数据保存在 `data/data.json` 中。
