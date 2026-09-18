/// <reference types="vite/client" />

/** 环境变量清单；新增一个就要在这里登记，避免到处是隐式的 any。 */
interface ImportMetaEnv {
  /** 浏览器标题后缀 */
  readonly VITE_APP_TITLE?: string
  /** 浏览器存储前缀 */
  readonly VITE_APP_STORAGE_PREFIX?: string
  /** 接口基地址 */
  readonly VITE_APP_API_BASEURL?: string
  /** 平台 / 官网地址：终端横幅、控制台品牌输出与侧栏外链 */
  readonly VITE_APP_PLATFORM_WEB_BASEURL?: string
  /** 是否禁用浏览器开发者工具（`'true'` 生效） */
  readonly VITE_APP_DISABLE_DEVTOOL?: string
  /** 构建是否产出 sourcemap（字符串 'true' 生效） */
  readonly VITE_BUILD_SOURCEMAP?: string
  /** 构建预压缩格式，逗号分隔：`gzip` / `brotli` */
  readonly VITE_BUILD_COMPRESS?: string
}
