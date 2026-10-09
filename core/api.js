// 调后端的病句校对接口（纯 fetch，无框架依赖，网页/WPS 外壳共用）
// 后端地址可配置：默认本地 8787。

const DEFAULT_BASE = 'http://localhost:8787'

export function createGrammarClient(baseUrl = DEFAULT_BASE) {
  return {
    /**
     * 请求病句校对。
     * @param {string} text 待校对文本
     * @returns {Promise<Array>} issue 列表（与规则库同构，byAI=true）
     */
    async check(text) {
      try {
        const resp = await fetch(baseUrl + '/api/grammar-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })
        const data = await resp.json()
        if (!data.ok) {
          return { ok: false, error: data.error || '病句校对失败', issues: [] }
        }
        return { ok: true, error: null, issues: data.issues || [] }
      } catch (e) {
        return { ok: false, error: '无法连接校对后端：' + e.message, issues: [] }
      }
    }
  }
}
