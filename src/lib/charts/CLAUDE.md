# CLAUDE.md — src/lib/charts

Centralised Recharts palette + tooltip styles. See `/CLAUDE.md` "Charts" section for the canonical chart shape.

## What lives here

- `theme.ts` — every chart colour and tooltip helper used in the app.

Exports (use these, don't redefine):

| Export | Use for |
|---|---|
| `CHART_COLORS` | Categorical pies / bars with N segments |
| `CATEGORY_COLOR_MAP` | Per-expense-category colours (food, transport, …) — keyed by the `ExpenseCategory` string |
| `SOURCE_COLOR_MAP` | Per-income-source colours (salary, business, …) |
| `INCOME_COLOR`, `EXPENSE_COLOR` | The two canonical "income green" and "expense red" |
| `NET_COLOR` | Net savings / cash flow |
| `chartTooltipStyle()` | Inline-style for `<Tooltip contentStyle={...} />` — handles theme tokens correctly |

## Why this exists

Before this file existed, chart colours were hardcoded across 6+ files. They drifted out of sync — Food was peach on one chart and orange on another. **Never hardcode chart colours.** If you need a colour that isn't in the palette, add it here first.

## Adding a colour

1. Add the constant to `theme.ts`.
2. If it's category-keyed, add an entry to the relevant map.
3. Import where needed.

## Tailwind tokens in chart props

Recharts props accept inline CSS values, so `var(--color-muted-foreground)` works for axis tick fills, gridline strokes, etc. The palette tokens here are mostly hex/oklch for predictable colour-mixing in tooltips and gradients.

## Don't

- Don't pass a string literal like `"#a3e4d7"` to a `<Bar fill=...>` — import a named constant.
- Don't redefine `chartTooltipStyle()` inline; the helper handles the dark-mode token swap that hand-written copies forget.
- Don't change a category's colour without checking the chart files that consume it — the colour is a key the user has learned.
