// 调后端的病句校对接口（纯 fetch，无框架依赖，网页/WPS 外壳共用）
// 后端地址解析优先级：
//   1) 运行时覆盖：localStorage 的 proofreadApiBase（换设备时不必重新打包，改一次即可）
//   2) 构建期注入：VITE_GRAMMAR_API_BASE 环境变量
//   3) 默认本地：http://localhost:8787

const DEFAULT_BASE = 'http://localhost:8787'

function resolveBase(explicit) {
  if (explicit) return explicit
  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem('proofreadApiBase')
      if (v) return v.replace(/\/$/, '')
    }
  } catch (e) {}
  try {
    // 构建期注入（vite 会把 import.meta.env 静态替换）
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GRAMMAR_API_BASE) {
      return import.meta.env.VITE_GRAMMAR_API_BASE
    }
  } catch (e) {}
  return DEFAULT_BASE
}

export function createGrammarClient(baseUrl) {
  const BASE = resolveBase(baseUrl)
  return {
    /**
     * 请求病句校对（非流式，兼容用）。
     * @returns {Promise<{ok,error,issues,segments}>}
     */
    async check(text) {
      try {
        const resp = await fetch(BASE + '/api/grammar-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        const data = await resp.json()
        if (!data.ok) {
          return { ok: false, error: data.error || '病句校对失败', issues: data.issues || [], segments: data.segments || 0 }
        }
        return { ok: true, error: null, issues: data.issues || [], segments: data.segments || 0 }
      } catch (e) {
        return { ok: false, error: '无法连接校对后端：' + e.message, issues: [], segments: 0 }
      }
    },

    /**
     * 流式分段校对。逐段回调，前端可显示「第 i/N 段」。
     * @param {string} text
     * @param {object} cb { onPlan(segments,chars), onProgress(cur,total), onSegment(issues), onDone(result) }
     */
    async checkStream(text, cb = {}) {
      try {
        const resp = await fetch(BASE + '/api/grammar-check-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        if (!resp.ok || !resp.body) {
          return { ok: false, error: '后端无响应（HTTP ' + resp.status + '）', issues: [], segments: 0 }
        }
        const reader = resp.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buf = ''
        let result = { ok: true, error: null, issues: [], segments: 0 }
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          // 按 SSE 事件块（空行分隔）切分
          const blocks = buf.split('\n\n')
          buf = blocks.pop()
          for (const block of blocks) {
            const ev = parseSSE(block)
            if (!ev) continue
            if (ev.event === 'plan' && cb.onPlan) cb.onPlan(ev.data.segments, ev.data.chars)
            else if (ev.event === 'progress' && cb.onProgress) cb.onProgress(ev.data.current, ev.data.total)
            else if (ev.event === 'segment' && cb.onSegment) cb.onSegment(ev.data.issues || [], ev.data.current, ev.data.total)
            else if (ev.event === 'error') result = { ...result, ok: false, error: '第 ' + ev.data.current + '/' + ev.data.total + ' 段失败：' + ev.data.error }
            else if (ev.event === 'done') {
              result = { ok: ev.data.ok !== false && result.ok, error: result.error, issues: ev.data.issues || [], segments: ev.data.segments || 0 }
            }
          }
        }
        if (cb.onDone) cb.onDone(result)
        return result
      } catch (e) {
        return { ok: false, error: '无法连接校对后端：' + e.message, issues: [], segments: 0 }
      }
    }
  }
}

// 解析单个 SSE 事件块 -> { event, data }
function parseSSE(block) {
  let event = 'message'
  let dataStr = ''
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataStr += line.slice(5).trim()
  }
  if (!dataStr) return null
  try {
    return { event, data: JSON.parse(dataStr) }
  } catch (e) {
    return null
  }
}
