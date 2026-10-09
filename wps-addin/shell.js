// WPS 适配层：探测能力 → 读文档文字 → 调 core 内核 → 渲染问题列表
// 本轮只做「读 + 显示」，写回文档（替换/原生批注）下一轮做。

import { proofread, CATEGORY_META } from '../core/index.js'

// ---- 能力探测：不写死版本，缺啥降级啥 ----
const caps = {
  hasWps: typeof wps !== 'undefined',
  getApp() {
    try { return wps.WpsApplication ? wps.WpsApplication() : (wps.Application || null) }
    catch (e) { return null }
  }
}

const dotClass = { typo: 'red', variant: 'amber', punctuation: 'blue' }

let currentIssues = []
let activeId = null

// ---- 读取当前文档纯文本 ----
function readDocumentText() {
  if (!caps.hasWps) {
    // 浏览器里直接打开 taskpane.html 调试用的兜底
    return '【调试模式】当前不在 WPS 中，使用示例文本：今天我迫不急待地去参加比赛，松驰下来后发挥失常。'
  }
  const app = caps.getApp()
  if (!app) throw new Error('无法获取 WPS Application 对象')
  const doc = app.ActiveDocument
  if (!doc) throw new Error('没有打开的文档')
  // Document.Content.Text 是整篇纯文本
  return doc.Content ? doc.Content.Text : (doc.Range().Text || '')
}

// ---- 跑校对 ----
function runCheck() {
  const statusEl = document.getElementById('status')
  try {
    const text = readDocumentText()
    currentIssues = proofread(text)
    activeId = null
    renderList()
    if (currentIssues.length === 0) {
      setStatus('✓ 未发现问题', 'ok')
    } else {
      setStatus('共发现 ' + currentIssues.length + ' 处问题', '')
    }
  } catch (e) {
    setStatus('校对失败：' + e.message, 'err')
    currentIssues = []
    renderList()
  }
}

function setStatus(msg, cls) {
  const el = document.getElementById('status')
  el.textContent = msg
  el.className = 'status ' + (cls || '')
}

// ---- 渲染问题列表 ----
function renderList() {
  const list = document.getElementById('list')
  list.innerHTML = ''
  for (const it of currentIssues) {
    const li = document.createElement('li')
    li.className = 'item' + (activeId === it.id ? ' active' : '')
    li.dataset.id = it.id

    const meta = CATEGORY_META[it.category] || { label: it.category }
    li.innerHTML =
      '<div class="item-head">' +
        '<i class="dot ' + (dotClass[it.category] || 'red') + '"></i>' +
        '<span class="cat">' + meta.label + '</span>' +
      '</div>' +
      '<div class="fix">' +
        '<span class="wrong">' + escapeHtml(it.wrong) + '</span>' +
        '<span class="arrow">→</span>' +
        '<span class="right">' + escapeHtml(it.right) + '</span>' +
      '</div>' +
      '<div class="actions">' +
        '<button class="btn btn-accept" data-act="accept">定位</button>' +
        '<button class="btn" data-act="ignore">忽略</button>' +
      '</div>'

    li.addEventListener('click', (e) => {
      const act = e.target && e.target.dataset ? e.target.dataset.act : null
      if (act === 'ignore') { ignoreIssue(it.id); return }
      locateIssue(it)   // 点卡片或「定位」都跳转
    })
    list.appendChild(li)
  }
}

function ignoreIssue(id) {
  currentIssues = currentIssues.filter(i => i.id !== id)
  renderList()
  setStatus('剩余 ' + currentIssues.length + ' 处问题', currentIssues.length ? '' : 'ok')
}

// 定位：在文档里选中该错误（本轮只定位高亮，不替换）
function locateIssue(it) {
  activeId = it.id
  renderList()
  if (!caps.hasWps) { setStatus('调试模式：无法在文档中定位', ''); return }
  try {
    const app = caps.getApp()
    const doc = app.ActiveDocument
    // 用 index/length 在整篇 Range 上收缩出目标区间并选中
    const full = doc.Content
    const start = full.Start + it.index
    const target = doc.Range(start, start + it.length)
    target.Select()
    setStatus('已定位：' + it.wrong + ' → ' + it.right, '')
  } catch (e) {
    setStatus('定位失败：' + e.message, 'err')
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

// ---- 绑定与消息 ----
document.getElementById('btn-check').addEventListener('click', runCheck)

// 来自 ribbon 按钮的 PostMessage
window.addEventListener('message', (e) => {
  if (e.data === 'run-check') runCheck()
})

// 窗格首次打开自动跑一次
window.addEventListener('DOMContentLoaded', runCheck)

