// 校对引擎内核入口（纯 JS，零 UI / 零浏览器依赖）
// 三端共享：网页版、WPS 加载项、Word 加载项都从这里引入。
//
// 用法：
//   import { proofread, groupByCategory, CATEGORY_META } from '../core/index.js'
//   const issues = proofread('待校对文本')
//
// 返回的 issue 结构见 checker.js 顶部注释。

export { proofread, groupByCategory } from './checker.js'
export { createGrammarClient } from './api.js'

// 分类元数据：各外壳自行决定如何渲染（颜色/图标由外壳定）
export const CATEGORY_META = {
  typo: { label: '错别字', color: '#ef4444' },
  variant: { label: '异形词', color: '#f59e0b' },
  punctuation: { label: '标点符号', color: '#3b82f6' },
  grammar: { label: '病句/语法', color: '#8b5cf6' }
}
