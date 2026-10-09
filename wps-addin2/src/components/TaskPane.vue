<template>
  <div class="pr-wrap">
    <header class="pr-bar">
      <span class="pr-title">文本校对</span>
    </header>

    <div class="pr-status" :class="statusCls">{{ status }}</div>

    <ul class="pr-list">
      <li v-for="it in issues" :key="it.id"
          class="pr-item" :class="{ active: activeId === it.id }"
          @click="locate(it)">
        <div class="pr-head">
          <i class="pr-dot" :class="dotClass[it.category]"></i>
          <span class="pr-cat">{{ it.categoryLabel }}</span>
        </div>
        <div class="pr-fix">
          <span class="pr-wrong">{{ it.wrong }}</span>
          <span class="pr-arrow">→</span>
          <span class="pr-right">{{ it.right }}</span>
        </div>
        <div class="pr-actions">
          <button class="pr-btn pr-locate" @click.stop="locate(it)">定位</button>
          <button class="pr-btn" @click.stop="ignore(it)">忽略</button>
        </div>
      </li>
    </ul>

    <footer class="pr-foot">
      <div class="pr-legend">
        <span class="lg"><i class="pr-dot red"></i>错别字</span>
        <span class="lg"><i class="pr-dot amber"></i>异形词</span>
        <span class="lg"><i class="pr-dot blue"></i>标点</span>
      </div>
      <button class="pr-btn pr-primary pr-check" @click="runCheck">校对当前文档</button>
    </footer>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import proofread from './js/proofread.js'

export default {
  name: 'TaskPane',
  setup() {
    const issues = ref([])
    const activeId = ref(null)
    const status = ref('点击上方按钮开始校对')
    const statusCls = ref('')
    const dotClass = { typo: 'red', variant: 'amber', punctuation: 'blue' }

    function setStatus(msg, cls) {
      status.value = msg
      statusCls.value = cls || ''
    }

    function runCheck() {
      try {
        issues.value = proofread.check()
        activeId.value = null
        if (issues.value.length === 0) setStatus('✓ 未发现问题', 'ok')
        else setStatus('共发现 ' + issues.value.length + ' 处问题', '')
      } catch (e) {
        issues.value = []
        setStatus('校对失败：' + e.message, 'err')
      }
    }

    function locate(it) {
      activeId.value = it.id
      try {
        const ok = proofread.locate(it)
        setStatus(ok ? '已定位：' + it.wrong + ' → ' + it.right : '调试模式：无法定位', ok ? '' : '')
      } catch (e) {
        setStatus('定位失败：' + e.message, 'err')
      }
    }

    function ignore(it) {
      issues.value = issues.value.filter(i => i.id !== it.id)
      setStatus('剩余 ' + issues.value.length + ' 处问题', issues.value.length ? '' : 'ok')
    }

    onMounted(() => {
      if (proofread.consumeAutorun()) runCheck()
    })

    return { issues, activeId, status, statusCls, dotClass, runCheck, locate, ignore }
  }
}
</script>

<style scoped>
.pr-wrap { display: flex; flex-direction: column; height: 100vh;
  font-family: "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  font-size: 13px; color: #1a1a2e; background: #f7f8fa; }
.pr-bar { display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  background: #fff; border-bottom: 1px solid #e5e7eb; }
.pr-title { font-weight: 600; font-size: 14px; margin-right: auto; }
.pr-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid #d1d5db;
  background: #fff; cursor: pointer; font-size: 13px; }
.pr-btn:hover { background: #f3f4f6; }
.pr-primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
.pr-primary:hover { background: #4338ca; }
.pr-status { padding: 8px 12px; color: #6b7280; font-size: 12px; }
.pr-status.ok { color: #059669; }
.pr-status.err { color: #dc2626; }
.pr-list { flex: 1; overflow-y: auto; list-style: none; padding: 4px 8px; margin: 0; }
.pr-item { background: #fff; border: 1px solid #e5e7eb; border-radius: 6px;
  padding: 8px 10px; margin-bottom: 6px; cursor: pointer; }
.pr-item:hover { border-color: #c7d2fe; }
.pr-item.active { border-color: #818cf8; box-shadow: 0 0 0 1px #c7d2fe; }
.pr-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.pr-cat { font-size: 11px; color: #6b7280; }
.pr-fix { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.pr-wrong { text-decoration: line-through; color: #9ca3af; }
.pr-arrow { color: #d1d5db; }
.pr-right { font-weight: 600; color: #047857; }
.pr-actions { display: flex; gap: 6px; margin-top: 8px; }
.pr-actions .pr-btn { padding: 4px 10px; font-size: 12px; flex: 1; }
.pr-locate { background: #059669; color: #fff; border-color: #059669; }
.pr-locate:hover { background: #047857; }
.pr-foot { display: flex; flex-direction: column; gap: 8px; padding: 8px 12px; background: #fff;
  border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
.pr-legend { display: flex; gap: 12px; }
.pr-check { width: 100%; padding: 9px; font-size: 14px; }
.lg { display: flex; align-items: center; gap: 4px; }
.pr-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.pr-dot.red { background: #ef4444; }
.pr-dot.amber { background: #f59e0b; }
.pr-dot.blue { background: #3b82f6; }
</style>
