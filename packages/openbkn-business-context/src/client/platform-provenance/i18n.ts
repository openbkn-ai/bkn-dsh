import { createInstance } from 'i18next'
import { bknTraceZhCN } from './locales/zh-CN.js'
import { bknTraceEnUS } from './locales/en-US.js'
const i18n = createInstance()
void i18n.init({lng:'zh-CN',fallbackLng:'en-US',initImmediate:false,resources:{'zh-CN':{translation:{...bknTraceZhCN,embedding:{recordedValidation:'平台记录的状态与原因',downloadFailed:'Markdown 下载失败，请重试。'},common:{partial:'当前轮次列表不完整；保留当前交互，不自动切换。'}}},'en-US':{translation:{...bknTraceEnUS,embedding:{recordedValidation:'Platform-recorded status and reasons',downloadFailed:'Markdown download failed. Please try again.'},common:{partial:'The round list is incomplete. The current interaction remains selected.'}}}},interpolation:{escapeValue:false}})
export default i18n
