// 异形词规范（依据《第一批异形词整理表》等公开发布的国家语言规范）
// 每条: { wrong, right, source }
//   wrong = 非推荐词形（命中后提示改为推荐词形）
//   right = 推荐词形
// 数据来源为政府公开发布的语言规范，可自由使用。
const SRC = '《第一批异形词整理表》'
export const variants = [
  { wrong: '笔划', right: '笔画', source: SRC },
  { wrong: '参预', right: '参与', source: SRC },
  { wrong: '订于', right: '定于', source: SRC },
  { wrong: '辈份', right: '辈分', source: SRC },
  { wrong: '本份', right: '本分', source: SRC },
  { wrong: '成份', right: '成分', source: SRC },
  { wrong: '蹧蹋', right: '糟蹋', source: SRC },
  { wrong: '账薄', right: '账簿', source: SRC },
  { wrong: '希罕', right: '稀罕', source: SRC },
  { wrong: '希奇', right: '稀奇', source: SRC }
]
