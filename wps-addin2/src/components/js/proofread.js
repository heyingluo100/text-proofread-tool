// 校对适配层：读 WPS 文档 → 调 core 内核 → 定位到文档中的错误
// core 内核在项目根 core/，vite 会把它打包进来，产物自包含。
import { proofread, createGrammarClient } from '../../../../core/index.js'

const grammarClient = createGrammarClient()

// 读取当前文档纯文本
function readDocText() {
  if (typeof window.Application === 'undefined' || !window.Application) {
    // 浏览器里 F12 调试用的兜底
    return '【调试模式】今天我迫不急待地去参加比赛，松驰下来后发挥失常。'
  }
  const doc = window.Application.ActiveDocument
  if (!doc) throw new Error('当前没有打开任何文档')
  return doc.Content ? doc.Content.Text : (doc.Range().Text || '')
}

// 本地规则校对（错别字/异形词/标点），同步秒出
function check() {
  const text = readDocText()
  return proofread(text)
}

// 病句校对（调后端大模型），异步（流式，带分段进度回调）
async function grammarCheck(text, cb) {
  const t = text != null ? text : readDocText()
  return grammarClient.checkStream(t, cb)
}

// 读文档文字（供病句校对传入）
function readText() {
  return readDocText()
}

// 在文档中选中定位某个错误（index/length 为纯文本偏移）
function locate(issue) {
  if (typeof window.Application === 'undefined' || !window.Application) return false
  const doc = window.Application.ActiveDocument
  if (!doc) throw new Error('当前没有打开任何文档')
  const start = doc.Content.Start + issue.index
  const target = doc.Range(start, start + issue.length)
  target.Select()
  return true
}

// 是否处于 ribbon 置的自动跑标记
function consumeAutorun() {
  try {
    if (window.Application && window.Application.PluginStorage.getItem('proofread_autorun')) {
      window.Application.PluginStorage.setItem('proofread_autorun', false)
      return true
    }
  } catch (e) {}
  return false
}

export default { check, grammarCheck, readText, locate, consumeAutorun }
