# WPS 文本校对加载项 · 侧载说明

本加载项是「嵌在 WPS 文字里的网页」。本地跑起来分两步：**起服务** → **让 WPS 认到它**。

> 适用：WPS 个人版（PC）。不同版本个别 API 可能缺失，加载项已做能力探测与降级，缺啥会在面板里提示，不会崩。

---

## 一、起本地服务

在项目根目录执行（会从**项目根**起 http 服务，端口 3889，这样加载项里 `../core` 内核能被正确加载）：

```bash
npm run serve-addin
```

看到 `Accepting connections at http://localhost:3889` 即成功。保持这个窗口开着。

验证：浏览器打开 `http://localhost:3889/wps-addin/taskpane.html`，能看到校对面板（非 WPS 环境会显示"调试模式"示例文本）。

---

## 二、让 WPS 认到加载项

1. 找到 WPS 的加载项目录（没有就手动建）：
   ```
   %appdata%\kingsoft\wps\jsaddons\
   ```
   在文件资源管理器地址栏粘贴 `%appdata%\kingsoft\wps\jsaddons` 回车即可到达。

2. 把本项目 `wps-addin/publish.xml` **复制一份**到该 `jsaddons` 目录。
   - 该文件已配好指向 `http://localhost:3889/wps-addin/`
   - 若你改了服务端口，同步改 publish.xml 里的 `online` 地址

3. 完全退出 WPS（任务栏托盘也退出），重新打开 WPS 文字。

4. 顶部应出现「**文本校对**」选项卡 → 「开始校对」按钮。

---

## 三、使用

1. 在 WPS 里打开/新建一篇有文字的文档
2. 点「文本校对」→「开始校对」
3. 右侧任务窗格列出所有问题（错别字/异形词/标点），点某条 → 文档里会**选中定位**到那个词

> 本轮为骨架版：只做「读文档 + 校对 + 定位」。**一键替换 / 写成 WPS 原生批注**在下一轮做。

---

## 四、调试与排错

| 现象 | 排查 |
|------|------|
| WPS 里没有「文本校对」选项卡 | 确认 publish.xml 已放进 `jsaddons`，且 WPS 已**完全重启** |
| 面板空白/报错 | 确认 `npm run serve-addin` 还开着；浏览器直开 taskpane.html 看是否正常 |
| 面板提示"无法获取 Application" | 当前 WPS 版本 API 名不同，把具体报错发我，我在适配层加兼容分支 |
| 改了代码不生效 | 刷新面板（关掉再点「校对面板」重开）；改 ribbon.xml 需重启 WPS |

---

## 文件结构

```
wps-addin/
  publish.xml      ← 复制到 jsaddons/，WPS 据此找到加载项
  ribbon.xml       ← 工具栏「文本校对」选项卡和按钮
  main.js          ← 加载项入口：按钮回调、开关任务窗格
  taskpane.html    ← 任务窗格页面
  taskpane.css     ← 窗格样式
  shell.js         ← 适配层：探测能力 + 读文档 + 调 ../core 内核 + 渲染
  images/icon.svg  ← 按钮图标
../core/           ← 共享校对引擎（网页版 / WPS / Word 三端复用）
```
