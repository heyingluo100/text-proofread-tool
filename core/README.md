# 校对引擎内核（core）

纯 JavaScript 校对引擎，**零 UI、零浏览器依赖**。网页版、WPS 加载项、Word 加载项三端共享同一份内核，各外壳只负责「读文字 → 调内核 → 把结果写回」。

## 对外接口

```js
import { proofread, groupByCategory, CATEGORY_META } from './index.js'

const issues = proofread('今天我迫不急待地去参加比赛')
// issues: [{ id, category, categoryLabel, index, length, wrong, right, note, source, byAI }, ...]
```

- `proofread(text)` → 问题数组，已排序 + 去重叠。`index/length` 是在**原始文本**里的字符偏移。
- `groupByCategory(issues)` → 按类别分组，供列表渲染。
- `CATEGORY_META` → 分类的中文名和建议色，外壳可自取或自定义。

## issue 字段说明

| 字段 | 含义 |
|------|------|
| `index` / `length` | 错误在原文中的起始偏移与长度 |
| `wrong` / `right` | 原词 / 建议替换词 |
| `category` | `typo`(错别字) / `variant`(异形词) / `punctuation`(标点) |
| `source` | 规范依据来源（界面可选显示） |
| `byAI` | 是否 AI 判定（规则库命中恒为 false，预留大模型层） |

## 外壳如何对接（以 WPS 为例）

内核不关心文字从哪来。外壳只做三件事：

1. **读**：从宿主取当前文档/选区纯文本 → `const text = ...`
2. **校对**：`const issues = proofread(text)`
3. **写回**：遍历 issues，用宿主 API 定位 `index/length` 做替换，或插入原生批注

```
WPS 外壳                     core 内核                WPS 外壳
文档API取文本  ──text──►   proofread(text)  ──issues──►  按 index 替换 / 插原生批注
```

> ⚠️ `index` 是「纯文本字符偏移」。宿主文档含表格、图片、换行等富结构时，外壳需自己维护「纯文本偏移 ↔ 文档 Range」的映射，再据此定位替换。

## 词库说明

当前 `typos.js / variants.js / punctuation.js` 是**演示集**（手写样例，对标公开国标规范：异形词整理表、GB/T 15834 等），用于验证流程。生产使用需替换为完整的公开国标词表数据。

> 本工具「对标」现代汉语规范体系，**不内嵌任何受版权保护的词典词条数据**。
