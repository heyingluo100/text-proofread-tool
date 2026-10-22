# 文本校对工具（Text Proofreader）

一款**中文文本校对工具**：网页版 + WPS 加载项双前端，共享同一套校对内核。覆盖错别字、异形词、标点、病句四类问题，支持批注式高亮、一键修改、长文本自动分段校对。

![技术栈](https://img.shields.io/badge/FastAPI-Vue3-WPS%20Add--in-blue)

## 功能特性

| 校对类型 | 实现方式 | 说明 |
|---------|---------|------|
| 🔴 错别字 | 本地词库（公开规范整理，128 条高频） | 毫秒级，离线可用 |
| 🟡 异形词 | 《第一批异形词整理表》等公开规范 | 毫秒级，离线可用 |
| 🔵 标点 | GB/T 15834 规则引擎 | 毫秒级，离线可用 |
| 🟣 病句 | LLM 语义判定（OpenAI 兼容接口） | 标注「AI 判定，建议人工复核」 |

- **双前端共享内核**：`core/` 纯 JS 校对内核被网页版与 WPS 加载项复用，规则一次维护两端生效
- **批注式交互**：高亮定位 + 逐条/全部采纳 + 修改清单 + 导出报告
- **长文本分段校对**：超过 1500 字自动按段落切块，后端 **SSE 流式推送**「第 i/N 段」真实进度
- **同源托管**：后端单进程同时托管前端 dist 与校对 API，免 CORS、单端口部署
- **WPS 加载项**：基于官方 wpsjs 工具链，文档内容读取 → 校对 → 点击结果定位回文档

## 架构

```
┌─────────────┐   ┌──────────────┐
│  网页版 (Vue3) │   │ WPS 加载项     │
└──────┬──────┘   └──────┬───────┘
       │    共享校对内核    │
       └───────┬─────────┘
        core/（错别字/异形词/标点 + API 客户端）
               │
        FastAPI 后端（分段调度 + SSE 流式）
               │
        LLM 服务（OpenAI 兼容接口，环境变量接入）
```

## 快速开始

### 网页版

```bash
npm install
npm run dev          # http://localhost:5173
```

### 后端（病句校对）

```bash
pip install -r backend/requirements.txt

export LLM_BASE_URL=https://api.openai.com/v1   # 任意 OpenAI 兼容服务
export LLM_API_KEY=sk-xxxx
export LLM_MODEL=gpt-4o-mini

python -m uvicorn main:app --host 0.0.0.0 --port 8787   # 在 backend/ 下执行
```

生产部署：`npm run build` 后由 FastAPI 同源托管 `dist/`，单进程单端口即可运行。

## 目录结构

```
├── core/            共享校对内核（typos / variants / punctuation / checker）
├── src/             网页版（Vue 3 + Vite，批注式视图 + 修改清单）
├── backend/         病句后端（FastAPI：分段 → LLM → SSE 流式返回）
├── wps-addin2/      WPS 加载项（官方 wpsjs 工具链）
└── 使用指南.md       部署与使用说明
```

## 设计说明

- **本地规则 + AI 语义分层**：能离线查的（错别字/异形词/标点）不消耗模型额度，只有病句走 LLM，成本可控
- **词库合规**：错别字库全部来自公开发布的国家语言规范，未内嵌任何受版权保护的词典数据
- **密钥安全**：API key 仅存后端环境变量，前端零密钥

---

个人作品集项目，展示 **B 端工具类产品从需求到交付的完整实现**：双前端架构设计、共享内核抽取、流式交互、LLM 接入与合规处理。
