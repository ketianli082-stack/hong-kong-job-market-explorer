# Collaboration workflow

## 叶同学 — Page 01

Start from the `page1-ye` branch and execute `docs/MODIFICATION_PLAN_ZH.md` first.

- Scope: `index.html`, `app.js`, and Page 01-specific styles.
- Begin with the shared font scale, Tableau pink-purple palette, spacing and card treatment because Page 02 will reuse that baseline.
- Complete all Page 01 acceptance checks before opening a pull request to `main`.
- If a shared `styles.css` rule must change, keep it clearly grouped and mention it in the pull request.

## 彭同学 — Page 02

Work from the `page2-peng` branch.

- Scope: `fit.html`, `fit.js`, and Page 02-specific styles.
- Preserve multi-select for both broad and detailed industries.
- Preserve comparison of any number of selected industries; do not add a three-industry limit.
- Reuse the shared visual baseline confirmed for Page 01.
- Complete all Page 02 acceptance checks before opening a pull request to `main`.

## Merge rules

- Keep each pull request limited to one page whenever possible.
- Do not replace `data/data.json` with invented or manually estimated values.
- Check desktop and mobile layouts before requesting review.
- Verify axes, units, year labels, hover values, dropdown text and overflow states.
- Resolve shared CSS conflicts together; do not silently overwrite the other page's styles.
