import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'

const root = new URL('../dist-package/', import.meta.url).pathname

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? files(join(directory, entry.name)) : join(directory, entry.name),
      ),
    )
  ).flat()
}

for (const file of await files(root)) {
  if (!file.endsWith('.d.ts')) continue
  const source = await readFile(file, 'utf8')
  const rewritten = source.replace(/(['"])@\/([^'"]+)\1/g, (_match, quote, target) => {
    let path = relative(dirname(file), join(root, target)).split(sep).join('/')
    if (!path.startsWith('.')) path = `./${path}`
    return `${quote}${path}${quote}`
  })
  if (rewritten !== source) await writeFile(file, rewritten)
}
