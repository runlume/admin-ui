/**
 * 品牌信息的唯一来源：终端启动横幅、浏览器控制台输出都从这里取文案。
 * 业务系统改名字与站点只改这一处，不要在横幅和控制台里各写一份。
 */
export const brandInfo = {
  name: 'Runlume',
  /** 终端横幅与浏览器控制台里的产品标识。 */
  product: 'admin-design',
  /** 控制台英文分支里的产品标识。 */
  productEn: 'admin-design',
  site: 'https://runlume.app',
  /** 模板自身的开源仓库：顶栏、登录页与「关于」都从这里取 */
  repository: 'https://github.com/runlume/admin-design',
  /** 三个对外站点：宣传页、文档站、在线演示（同一份代码的三个部署面） */
  sites: {
    design: 'https://adesign.runlume.app',
    docs: 'https://adoc.runlume.app',
    demo: 'https://ago.runlume.app',
  },
  edition: '标准版',
  warning: '请勿在此粘贴任何来源不明的代码，以免账号与数据泄露。',
} as const
