// 异形词规范（依据《第一批异形词整理表》等公开规范）
// 每条: { wrong, right, source }
//   wrong = 非推荐词形（命中后提示改为推荐词形）
//   right = 推荐词形
export const variants = [
  { wrong: '笔划', right: '笔画', source: '《第一批异形词整理表》' },
  { wrong: '参预', right: '参与', source: '《第一批异形词整理表》' },
  { wrong: '定婚', right: '订婚', source: '《第一批异形词整理表》' },
  { wrong: '订于', right: '定于', source: '《第一批异形词整理表》' },
  { wrong: '连迭', right: '连叠', source: '《第一批异形词整理表》' }
]
