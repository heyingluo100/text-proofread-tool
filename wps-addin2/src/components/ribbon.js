import Util from './js/util.js'

// 整个 wps 加载项中第一个执行的函数
function OnAddinLoad(ribbonUI) {
  if (typeof window.Application.ribbonUI != 'object') {
    window.Application.ribbonUI = ribbonUI
  }
  if (typeof window.Application.Enum != 'object') {
    window.Application.Enum = Util.WPS_Enum
  }
  return true
}

// 打开/定位校对任务窗格；返回窗格对象
function ensureTaskPane() {
  let tsId = window.Application.PluginStorage.getItem('proofread_taskpane_id')
  let tskpane
  if (!tsId) {
    tskpane = window.Application.CreateTaskPane(Util.GetUrlPath() + Util.GetRouterHash() + '/taskpane')
    window.Application.PluginStorage.setItem('proofread_taskpane_id', tskpane.ID)
  } else {
    tskpane = window.Application.GetTaskPane(tsId)
  }
  return tskpane
}

function OnAction(control) {
  const eleId = control.Id
  switch (eleId) {
    case 'btnProofread': {
      // 打开面板并显示，置标记让面板打开后自动跑一次校对
      const tp = ensureTaskPane()
      tp.Visible = true
      window.Application.PluginStorage.setItem('proofread_autorun', true)
      break
    }
    case 'btnTogglePane': {
      const tp = ensureTaskPane()
      tp.Visible = !tp.Visible
      break
    }
    default:
      break
  }
  return true
}

function GetImage() {
  return 'images/icon.svg'
}

function OnGetEnabled() {
  return true
}
function OnGetVisible() {
  return true
}
function OnGetLabel() {
  return ''
}

export default {
  OnAddinLoad,
  OnAction,
  GetImage,
  OnGetEnabled,
  OnGetVisible,
  OnGetLabel
}
