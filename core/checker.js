// 校对引擎：遍历规则库，返回统一结构的问题列表
// 问题结构:
// {
//   id,            唯一标识
//   category,      'typo' | 'variant' | 'punctuation'
//   categoryLabel, 中文类别名
//   index,         在原文中的起始位置
//   length,        匹配长度
//   wrong,         原文片段
//   right,         建议替换
//   note,          说明
//   source,        规范依据来源（硬依据）
//   byAI           是否 AI 判定（规则库命中恒为 false）
// }

import { typos } from './typos.js'
import { variants } from './variants.js'
import { punctuationRules } from './punctuation.js'

const CATEGORY_LABEL = {
  typo: '错别字',
  variant: '异形词',
  punctuation: '标点符号'
}

let uid = 0
function nextId() {
  uid += 1
  return `p${uid}`
}

// 在 text 中查找所有 word 的出现位置（不重叠）
function findAll(text, word) {
  const positions = []
  if (!word) return positions
  let from = 0
  while (true) {
    const i = text.indexOf(word, from)
    if (i === -1) break
    positions.push(i)
    from = i + word.length
  }
  return positions
}

function scanDict(text, list, category) {
  const issues = []
  for (const item of list) {
    const positions = findAll(text, item.wrong)
    for (const index of positions) {
      issues.push({
        id: nextId(),
        category,
        categoryLabel: CATEGORY_LABEL[category],
        index,
        length: item.wrong.length,
        wrong: item.wrong,
        right: item.right,
        note: item.note || `建议改为"${item.right}"`,
        source: item.source || '规范词形（对标《现代汉语规范词典》）',
        byAI: false
      })
    }
  }
  return issues
}

function scanPunctuation(text) {
  const issues = []
  for (const rule of punctuationRules) {
    const hits = rule.test(text)
    for (const h of hits) {
      issues.push({
        id: nextId(),
        category: 'punctuation',
        categoryLabel: CATEGORY_LABEL.punctuation,
        index: h.index,
        length: h.length,
        wrong: h.wrong,
        right: h.right,
        note: h.note,
        source: rule.source,
        byAI: false
      })
    }
  }
  return issues
}

// 主入口：对文本做本地规则校对
export function proofread(text) {
  uid = 0
  if (!text) return []

  const issues = [
    ...scanDict(text, typos, 'typo'),
    ...scanDict(text, variants, 'variant'),
    ...scanPunctuation(text)
  ]

  // 按位置排序；位置相同按长度降序（长匹配优先）
  issues.sort((a, b) => a.index - b.index || b.length - a.length)

  // 去重叠：同一区间被多条命中时，保留第一条（排序后更优先的）
  const result = []
  let lastEnd = -1
  for (const it of issues) {
    if (it.index >= lastEnd) {
      result.push(it)
      lastEnd = it.index + it.length
    }
  }
  return result
}

// 按类别分组，供 UI 渲染
export function groupByCategory(issues) {
  const groups = {}
  for (const it of issues) {
    if (!groups[it.category]) {
      groups[it.category] = {
        category: it.category,
        label: it.categoryLabel,
        items: []
      }
    }
    groups[it.category].items.push(it)
  }
  return Object.values(groups)
}
