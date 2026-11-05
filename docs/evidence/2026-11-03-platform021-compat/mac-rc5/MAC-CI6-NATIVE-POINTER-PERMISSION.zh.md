# Mac CI6：原生鼠标权限与真实移动回执

结论：输入前提已解决。用户授权后，固定任务helper的辅助功能开关为on，实际postEventAccess/accessibilityTrusted均true；真实无按键mouseMoved、坐标与原生hover反馈已核，指针随后还原。此结果仅是系统设置中的输入路径校准，DSH的S1/S2/S3因平台尚未披露原文仍OPEN/NOT_RUN，S2不是几何SKIP。

## 固定身份与执行时确认

CI6保持源f01b316fbfb6be681af81e2267a7b3341e659efd/run41596006291/artifact13212518096，TGZ877732bytes/SHA4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046。官方Macrc.5、企业28正式020与独立CLI020配对范围不变，本轮未启动Host、请求平台或调用CLI。正式CLI021安装继续待验，不重查registry。

任务程序为`org.openbkn.ci6.pointer-helper`，相对路径`release/ci-41596006291/rca-native-input-20261103/native-input/OpenBKN CI6 Pointer Helper.app`，可执行文件OpenBKNPointer；SHA256 ff855610cc1134060693977f5911eb39bd47e45cf149479b8e91f81b355a680e，源SHA a3dde6f8e3a68b73c1d1abf78ce3d005d32617e030a7f47bea493ae880b77926。本机自建ad-hoc签名，无TeamIdentifier，不冒用受信app；CodeDirectoryHash3e267ad4e3cd44bc4a69bad1e0ac090116a7c97a，strict验证exit0，授权后未改二进制。

用户在本会话回复“鼠标已授权”，主会话随后也转交了具名确认。准确的用户点击/确认时刻未由消息元数据提供，记UNKNOWN；收到答复后首次许可probe的UTC见JSON。代理没有点击权限开关，也未索取/输入电脑密码。代理未看见身份验证对话框，用户操作期间是否显示过密码/TouchID仍UNKNOWN，不能写成没有发生。

## 各主体的权限边界

旧一次性Swift解释器preflight=false保留历史，其准确PID未记，不能用于断言所有原生输入均不可用。固定helper初次直接启动（PID26097/父2523）和LaunchServices启动（PID26124/父1）均false；官方请求（PID26150/父1）返回false后，在设置中列出本任务程序。

用户授权后的LaunchServices probe PID26842/父1报告双true、0至31鼠标键全部抬起。后续move/restore实际进程也逐次记录了自身bundle/父PID/双权限、指针与按键状态，完整值见JSON。使用独立helper自己的身份，不给整个SSH、终端或代理服务授权；未读写TCC数据库或关闭安全保护。所有实际动作无自动审批拒绝，无重复授权问题。

## 原生坐标、移动和可见反馈

初次普通Raise/titlebar准备未证明前台，元数据仍为Codex，故当时没有发helper移动。通过macOS标准`open -a System Settings`后，再在同一操作中核到系统设置前台PID26153；前后都保持该前台。

当前窗口Quartz边界x212/y30/723×840，截图也为723×840。主屏1920×1080、实际像素1920×1080、缩放1。因此屏内已观察到的返回箭头局部(250,26)映射为全局(462,56)。这一映射仅针对系统设置，不外推DSH窗口位置。

2026-11-03T15:28:57.369Z发起、15:28:57.569Z完成helper动作（台北时间23:28:57），准确内核post瞬间未单独插桩。事件为CGEventType.mouseMoved→cghidEventTap；CGEvent(source:nil).location由(1096.5079345703125,1065.4053955078125)变为(462,56)，位置匹配。前后32个鼠标键均抬起。原生截图对照可见返回箭头新增圆形hover背景，目标没有被点击、没有导航动作。截图中的指针图标不被用于位置证明；独立可见OS光标glyph移动未另行采集，实际位置以CoreGraphics测量为准。

随后先probe确认指针仍在本轮目标且32键抬起，才用第二个mouseMoved还原到原位置，实测匹配；没有覆盖用户新的指针位置。helper共发两个mouseMoved（含恢复），没有mouseDown/Up/drag，也没有DOM/CDP派发替代。此前常规CUA界面准备点击不计入helper事件证明。

## 保全和剩余项

全部已知helper进程已退出；未启动网络服务，未做全机端口扫描。系统设置窗口保留在用户当前授权视图，不回滚已授权权限。用户接管前后还观察到一个非目标应用开关状态变化，归属未观察；具体仅留私有证据。代理没有操作或回退该开关，因此不声称全机权限状态完全不变。

原绑定、原Session、任务Session、官方Host EXE/ASAR、已装business/client七项摘要均保持，候选TGZ、源HEAD和干净checkout保持。旧报告与原件均不覆盖，helper与恢复资料保留；不推送、不跑CI、不发布/latest。

S1正文hover/Escape留驻、S2真实padding/arrow几何、S3键盘Escape后首次hover均仍NOT_RUN。收到平台可读真实原文前提后，再核DSH实际前台和窗口坐标，仅执行这三项；当前校准不转记业务UI或整体发布通过。
