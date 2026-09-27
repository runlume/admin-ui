// 把主题层源码 CSS 复制到 dist-package，供宿主的 Tailwind 流水线直接 @import。
// theme.css 内部以相对路径引入 palettes / custom-palettes / accessibility，四份文件必须一起复制。
import { copyFile, mkdir } from 'node:fs/promises'

const source = new URL('../src/', import.meta.url)
const target = new URL('../dist-package/', import.meta.url)
const files = [
  'theme.css',
  'palettes.css',
  'custom-palettes.css',
  'accessibility.css',
  'components.css',
]

await mkdir(target, { recursive: true })
for (const file of files) {
  await copyFile(new URL(file, source), new URL(file, target))
}
// 写到 stderr：npm pack --json 只解析 stdout，生命周期日志不能混进去。
console.error(`copied theme css: ${files.join(', ')}`)
