<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { proofread, createGrammarClient } from '../core/index.js'

const grammarClient = createGrammarClient()

const SAMPLE = `今天我迫不急待地去参加比赛，结果松驰下来后发挥失常。这件事首当其冲 , 让我一愁莫展。
按装软件时遇到问题，我扫瞄了说明书也没找到答案!!我决定渡假散心，顺便查查辞典。`

const text = ref(SAMPLE)
const issues = ref([])
const checked = ref(false)
const ignored = ref(new Set())
const activeId = ref(null)
const editing = ref(false)
const viewMode = ref('note')   // 'note' 批注视图 | 'list' 全部修改清单

const asideRef = ref(null)
const noteTops = ref({})       // id -> top(px)，批注绝对定位高度
const asideHeight = ref(0)

const charCount = computed(() => text.value.length)

const activeIssues = computed(() =>
  issues.value
    .filter(i => !ignored.value.has(i.id))
    .sort((a, b) => a.index - b.index)
)

const activeIndex = computed(() => activeIssues.value.findIndex(i => i.id === activeId.value))

const catMeta = {
  typo: { label: '错别字', dot: 'bg-red-500', wave: 'wave-red' },
  variant: { label: '异形词', dot: 'bg-amber-500', wave: 'wave-amber' },
  punctuation: { label: '标点符号', dot: 'bg-blue-500', wave: 'wave-blue' },
  grammar: { label: '病句/语法', dot: 'bg-violet-500', wave: 'wave-violet' }
}

const checking = ref(false)
const grammarError = ref('')
const grammarProgress = ref('')   // 分段进度提示文案

// 长文阈值：超过则分段（与后端 SEG_MAX 一致）
const LONG_THRESHOLD = 1500

async function runCheck() {
  if (checking.value) return
  const local = proofread(text.value)
  issues.value = local
  ignored.value = new Set()
  activeId.value = null
  checked.value = true
  editing.value = false
  grammarError.value = ''
  grammarProgress.value = text.value.length > LONG_THRESHOLD ? '文本较长，正在分段校对…' : '正在查病句…'
  scheduleLayout()

  checking.value = true
  await grammarClient.checkStream(text.value, {
    onPlan(segments) {
      grammarProgress.value = segments > 1
        ? `文本较长，共分 ${segments} 段校对…`
        : '正在查病句…'
    },
    onProgress(cur, total) {
      grammarProgress.value = total > 1 ? `正在校对第 ${cur}/${total} 段…` : '正在查病句…'
    },
    onSegment(segIssues) {
      // 逐段把病句追加进列表，实时可见
      issues.value = issues.value.concat(segIssues)
      scheduleLayout()
    },
    onDone(result) {
      if (!result.ok) grammarError.value = result.error || '病句校对失败'
      else issues.value = local.concat(result.issues || [])
      scheduleLayout()
    }
  })
  checking.value = false
  grammarProgress.value = ''
}

// 测量每处波浪线纵向位置，把批注对齐过去，重叠则向下避让
function relayout() {
  const aside = asideRef.value
  if (!aside) return
  const asideTop = aside.getBoundingClientRect().top
  const gap = 12
  let prevBottom = 0
  const tops = {}
  for (const it of activeIssues.value) {
    const mark = document.getElementById('mark-' + it.id)
    const note = document.getElementById('note-' + it.id)
    const noteH = note ? note.offsetHeight : 96
    const want = mark ? (mark.getBoundingClientRect().top - asideTop) : prevBottom
    const top = Math.max(want, prevBottom)
    tops[it.id] = top
    prevBottom = top + noteH + gap
  }
  noteTops.value = tops
  asideHeight.value = prevBottom
}

function scheduleLayout() {
  nextTick(() => requestAnimationFrame(() => requestAnimationFrame(relayout)))
}

function select(id) {
  activeId.value = id
  nextTick(() => {
    document.getElementById('mark-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function goPrev() {
  const list = activeIssues.value
  if (!list.length) return
  const i = activeIndex.value
  select(list[i <= 0 ? list.length - 1 : i - 1].id)
}
function goNext() {
  const list = activeIssues.value
  if (!list.length) return
  const i = activeIndex.value
  select(list[i >= list.length - 1 ? 0 : i + 1].id)
}

// 采纳本地问题：替换后只重跑本地规则（不重调大模型，避免每次采纳都等一次模型）
function accept(issue) {
  if (issue.index < 0) return   // AI 判定但未在原文定位到的，无法自动替换，交给用户手改
  const t = text.value
  text.value = t.slice(0, issue.index) + issue.right + t.slice(issue.index + issue.length)
  const local = proofread(text.value)
  // 保留仍有效的 AI 病句（原文未被破坏的），位置重算失败的直接丢弃
  const keptAI = issues.value.filter(i => i.byAI && i.index >= 0 && text.value.indexOf(i.wrong) >= 0)
  issues.value = local.concat(keptAI)
  ignored.value = new Set()
  activeId.value = null
  scheduleLayout()
}
function ignore(issue) {
  ignored.value = new Set([...ignored.value, issue.id])
  if (activeId.value === issue.id) activeId.value = null
  scheduleLayout()
}
function acceptAll() {
  // 只批量采纳能在原文定位到的问题（跳过 index<0 的 AI 项，避免错替换）
  const items = activeIssues.value.filter(i => i.index >= 0).sort((a, b) => b.index - a.index)
  let t = text.value
  for (const it of items) t = t.slice(0, it.index) + it.right + t.slice(it.index + it.length)
  text.value = t
  issues.value = proofread(text.value)
  ignored.value = new Set()
  activeId.value = null
  scheduleLayout()
}

async function copyText() {
  await navigator.clipboard.writeText(text.value)
  alert('已复制纠正后的文本')
}
function exportReport() {
  const lines = ['# 校对报告', '', `原文字数：${charCount.value}`, `发现问题：${activeIssues.value.length} 处`, '']
  for (const it of activeIssues.value) {
    lines.push(`- [${it.categoryLabel}] \`${it.wrong}\` → \`${it.right}\`　依据：${it.source}${it.byAI ? '（AI 判定）' : ''}`)
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = '校对报告.md'
  a.click()
}

const docParts = computed(() => {
  const t = text.value
  const parts = []
  let cursor = 0
  for (const it of activeIssues.value) {
    if (it.index < cursor) continue
    if (it.index > cursor) parts.push({ text: t.slice(cursor, it.index), issue: null })
    parts.push({ text: t.slice(it.index, it.index + it.length), issue: it })
    cursor = it.index + it.length
  }
  if (cursor < t.length) parts.push({ text: t.slice(cursor), issue: null })
  return parts
})

watch(activeId, scheduleLayout)
let ro
onMounted(() => {
  window.addEventListener('resize', scheduleLayout)
  ro = new ResizeObserver(scheduleLayout)
  if (asideRef.value) ro.observe(document.body)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleLayout)
  ro?.disconnect()
})
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- 顶部栏 -->
    <header class="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
      <h1 class="text-lg font-semibold">文本校对工具</h1>
      <span class="text-sm text-gray-400 hidden sm:inline">对标现代汉语规范体系</span>
      <div class="ml-auto flex items-center gap-2">
        <span v-if="checking" class="text-sm text-violet-600">{{ grammarProgress || '正在查病句…' }}</span>
        <span v-else-if="grammarError" class="text-sm text-red-500" :title="grammarError">AI 病句未校对</span>
        <span class="text-sm text-gray-500 mr-1">字数 {{ charCount }}</span>
        <button class="px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
          @click="editing = !editing">{{ editing ? '退出编辑' : '编辑原文' }}</button>
        <button class="px-4 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
          :disabled="checking" @click="runCheck">{{ checking ? '校对中…' : '开始校对' }}</button>
      </div>
    </header>

    <!-- 校对导航条 -->
    <div v-if="checked && activeIssues.length"
      class="flex items-center gap-3 px-6 py-2 bg-white border-b border-gray-200">
      <span class="text-sm text-gray-600">共 <b class="text-red-600">{{ activeIssues.length }}</b> 处问题</span>
      <div class="flex items-center gap-1 ml-2">
        <button class="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50" @click="goPrev">↑</button>
        <button class="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:bg-gray-50" @click="goNext">↓</button>
      </div>
      <span v-if="activeIndex >= 0" class="text-xs text-gray-400">第 {{ activeIndex + 1 }} / {{ activeIssues.length }} 处</span>

      <!-- 视图切换 -->
      <div class="flex items-center rounded-md border border-gray-300 overflow-hidden text-xs ml-3">
        <button class="px-3 py-1" :class="viewMode === 'note' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'"
          @click="viewMode = 'note'">批注</button>
        <button class="px-3 py-1 border-l border-gray-300" :class="viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'"
          @click="viewMode = 'list'">全部修改</button>
      </div>

      <div class="ml-auto flex items-center gap-4 text-xs text-gray-400">
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span>错别字</span>
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span>异形词</span>
        <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span>标点</span>
      </div>
    </div>

    <!-- 主体：文档纸 + 对齐批注栏 -->
    <main class="flex-1 overflow-auto">
      <div class="relative mx-auto my-6 flex max-w-[1180px] px-4 items-start">
        <!-- 文档纸 -->
        <div class="flex-1 bg-white rounded-md shadow-sm border border-gray-200 min-h-[70vh]">
          <textarea v-if="editing || !checked" v-model="text"
            class="w-full h-[70vh] p-10 resize-none outline-none text-[16px] leading-9 rounded-md"
            placeholder="在此粘贴或输入要校对的文本…"></textarea>
          <div v-else class="p-10 text-[16px] leading-9 whitespace-pre-wrap">
            <template v-for="(part, i) in docParts" :key="i">
              <span v-if="part.issue"
                :id="'mark-' + part.issue.id"
                :class="[catMeta[part.issue.category].wave, activeId === part.issue.id ? 'mark-active' : '']"
                class="cursor-pointer rounded-sm transition-colors"
                @click="select(part.issue.id)">{{ part.text }}</span>
              <span v-else>{{ part.text }}</span>
            </template>
          </div>
        </div>

        <!-- 对齐缝隙（装订线） -->
        <div class="w-6 shrink-0"></div>

        <!-- 批注视图：绝对定位对齐正文行 -->
        <aside v-show="viewMode === 'note'" ref="asideRef" class="w-[300px] shrink-0 relative" :style="{ height: asideHeight + 'px' }">
          <div v-if="!checked" class="text-sm text-gray-400 px-2 py-4 text-center">点击"开始校对"生成批注</div>
          <div v-else-if="activeIssues.length === 0"
            class="bg-white rounded-md border border-green-200 p-4 text-sm text-green-600 text-center">✓ 未发现问题</div>

          <div v-for="it in activeIssues" :key="it.id"
            :id="'note-' + it.id"
            class="note-card absolute left-0 w-full bg-white rounded-md border p-3 cursor-pointer"
            :class="activeId === it.id ? 'border-indigo-400 shadow-lg ring-1 ring-indigo-200 z-10' : 'border-gray-200 hover:border-gray-300 shadow-sm'"
            :style="{ top: (noteTops[it.id] || 0) + 'px' }"
            @click="select(it.id)">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="w-2 h-2 rounded-full" :class="catMeta[it.category].dot"></span>
              <span class="text-xs font-medium text-gray-600">{{ it.categoryLabel }}</span>
              <span v-if="it.byAI" class="text-[10px] px-1 rounded bg-purple-100 text-purple-600">AI 判定</span>
            </div>
            <div class="flex items-center gap-2 text-[15px]">
              <span class="line-through text-gray-400">{{ it.wrong }}</span>
              <span class="text-gray-300">→</span>
              <span class="font-semibold text-green-700">{{ it.right }}</span>
            </div>
            <div class="mt-2.5 flex gap-2">
              <button class="flex-1 py-1.5 rounded bg-green-600 text-white text-xs font-medium hover:bg-green-700"
                @click.stop="accept(it)">采纳替换</button>
              <button class="flex-1 py-1.5 rounded border border-gray-300 text-gray-500 text-xs hover:bg-gray-100"
                @click.stop="ignore(it)">忽略</button>
            </div>
          </div>
        </aside>

        <!-- 全部修改清单视图：平铺一行行，保证全部可见 -->
        <aside v-show="viewMode === 'list'" class="w-[320px] shrink-0">
          <div class="bg-white rounded-md border border-gray-200 overflow-hidden">
            <div class="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <span class="text-sm font-semibold">全部修改 <span class="text-gray-400">{{ activeIssues.length }}</span></span>
              <button v-if="activeIssues.length" class="text-xs text-indigo-600 hover:underline" @click="acceptAll">全部采纳</button>
            </div>
            <div v-if="activeIssues.length === 0" class="p-4 text-sm text-green-600 text-center">✓ 未发现问题</div>
            <ul v-else class="max-h-[65vh] overflow-auto">
              <li v-for="(it, i) in activeIssues" :key="it.id"
                class="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer"
                :class="activeId === it.id ? 'bg-indigo-50' : 'hover:bg-gray-50'"
                @click="select(it.id)">
                <span class="text-xs text-gray-300 w-5 shrink-0">{{ i + 1 }}</span>
                <span class="w-2 h-2 rounded-full shrink-0" :class="catMeta[it.category].dot"></span>
                <span class="flex items-center gap-1.5 text-sm min-w-0 flex-1">
                  <span class="line-through text-gray-400 truncate">{{ it.wrong }}</span>
                  <span class="text-gray-300">→</span>
                  <span class="font-semibold text-green-700 truncate">{{ it.right }}</span>
                </span>
                <button class="shrink-0 px-2 py-0.5 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                  @click.stop="accept(it)">采纳</button>
                <button class="shrink-0 px-1.5 py-0.5 rounded border border-gray-300 text-gray-400 text-xs hover:bg-gray-100"
                  @click.stop="ignore(it)">×</button>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>

    <!-- 底部操作栏 -->
    <footer v-if="checked" class="flex items-center gap-3 px-6 py-3 bg-white border-t border-gray-200">
      <button v-if="activeIssues.length"
        class="px-4 py-1.5 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        @click="acceptAll">全部采纳</button>
      <button class="px-4 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50" @click="copyText">复制纠正后文本</button>
      <button class="px-4 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50" @click="exportReport">导出报告</button>
    </footer>
  </div>
</template>

<style scoped>
/* WPS 式波浪下划线 */
.wave-red   { text-decoration: underline wavy #ef4444; text-underline-offset: 3px; text-decoration-thickness: 1.5px; }
.wave-amber { text-decoration: underline wavy #f59e0b; text-underline-offset: 3px; text-decoration-thickness: 1.5px; }
.wave-blue  { text-decoration: underline wavy #3b82f6; text-underline-offset: 3px; text-decoration-thickness: 1.5px; }
.wave-violet { text-decoration: underline wavy #8b5cf6; text-underline-offset: 3px; text-decoration-thickness: 1.5px; }

/* 选中的正文错误：黄色底突出 */
.mark-active { background: #fde68a; border-radius: 3px; }

/* 批注卡位置平滑过渡，避让时不突兀 */
.note-card { transition: top .25s ease, box-shadow .15s ease, border-color .15s ease; }
</style>
