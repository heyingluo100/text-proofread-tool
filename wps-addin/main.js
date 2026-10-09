// WPS 加载项主入口（WPS 启动时加载）
// 职责：响应 ribbon 按钮回调、打开/切换任务窗格。
// 真正的校对逻辑在任务窗格的 shell.js 里，调用 core/ 内核。

var tsId = null  // 任务窗格 id

// WPS 规定的加载项生命周期入口
function OnAddinLoad(ribbonUI) {
  if (typeof wps !== 'undefined' && wps.ribbonUI === undefined) {
    wps.ribbonUI = ribbonUI
  }
  if (typeof wps !== 'undefined' && wps.PluginStorage) {
    wps.PluginStorage.setItem('loaded', 'true')
  }
  return true
}

function ribbonOnLoad(ribbonUI) {
  wps.ribbonUI = ribbonUI
}

// 返回按钮图标（无图标时返回空，WPS 用默认）
function getBtnImage(control) {
  return 'images/icon.svg'
}

// 打开/定位任务窗格
function ensureTaskPane() {
  if (tsId) {
    var exist = wps.GetTaskPane(tsId)
    if (exist) return exist
  }
  var url = GetUrlPath() + 'taskpane.html'
  var tp = wps.CreateTaskPane(url)
  tsId = tp.ID
  return tp
}

// 按钮：开始校对 —— 打开窗格并显示，窗格 onload 会自动跑一次校对
function onProofreadClick() {
  var tp = ensureTaskPane()
  tp.Visible = true
  // 通知窗格立即校对当前文档
  if (tp.Visible) {
    try { tp.PostMessage && tp.PostMessage('run-check') } catch (e) {}
  }
  return true
}

// 按钮：切换面板显隐
function onToggleTaskPane() {
  var tp = ensureTaskPane()
  tp.Visible = !tp.Visible
  return true
}

// 取加载项部署根路径
function GetUrlPath() {
  var path = window.location.href
  var idx = path.lastIndexOf('/')
  return path.substring(0, idx + 1)
}
