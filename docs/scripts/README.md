# npm 发布辅助脚本

`python3 docs/scripts/publish-admin-ui.py` 从 macOS 隐藏输入读取 npm Token，先验证身份，再进入 npm 浏览器确认流程。仅在已审查、受信的本组件库源码上运行；npm 及其生命周期子进程会继承 Token 环境变量。

临时 npmrc 仅写 `${NPM_TOKEN}` 占位符；脚本退出时清理临时配置和自身环境引用。引用释放不等同密码学内存擦除；npm 自身日志和浏览器行为由 npm 管理。脚本抑制认证终端回显，不保存口令或 Token。认证窗口可取消；发布失败或结果不明时先检查 npm 精确版本，不自动重发。

2026-10-05：已按用户明确授权发布 `@runlume/admin-ui@0.3.2`，随后公共 registry 精确版本读取返回 HTTP 200 / 0.3.2。源码提交 `401ae6d`，组件库检查 81 测试通过，发布包 smoke 通过；CMS 的正式 npm 依赖接入在 CMS 仓库独立提交。未推送 Git 或创建 Tag。
