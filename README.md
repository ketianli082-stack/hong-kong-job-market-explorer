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

原始 `.twbx` 文件不上传到本仓库；网站使用的提取数据保存在 `data/data.json` 中。
