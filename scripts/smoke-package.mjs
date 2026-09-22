import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('../', import.meta.url).pathname
const work = mkdtempSync(join(tmpdir(), 'admin-ui-package-'))
const pack = join(work, 'pack')
const consumer = join(work, 'consumer')

mkdirSync(pack)
mkdirSync(consumer)
execFileSync('npm', ['pack', '--pack-destination', pack], { cwd: root, stdio: 'inherit' })
const filename = readdirSync(pack)[0]
if (!filename) throw new Error('npm pack did not create a tarball')
const tarball = join(pack, filename)
execFileSync(
  'npm',
  [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    tarball,
    'react@18.2.0',
    'react-dom@18.2.0',
  ],
  { cwd: consumer, stdio: 'inherit' },
)

const esm =
  "import('@runlume/admin-ui').then(m=>{if(!m.DataTable||!m.Transfer||!m.Calendar)process.exit(1)})"
const cjs = `
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const m = require('@runlume/admin-ui')
if (!m.DataTable || !m.Transfer || !m.Calendar) process.exit(1)
if (!renderToStaticMarkup(React.createElement(m.EmptyState)).includes('暂无数据')) process.exit(1)
`
execFileSync('node', ['--input-type=module', '-e', esm], { cwd: consumer, stdio: 'inherit' })
execFileSync('node', ['-e', cjs], { cwd: consumer, stdio: 'inherit' })
execFileSync(
  'node',
  ['--input-type=module', '-e', "import('@runlume/admin-ui/components/data-table')"],
  {
    cwd: consumer,
    stdio: 'inherit',
  },
)
execFileSync('node', ['-e', "require('@runlume/admin-ui/ui/button')"], {
  cwd: consumer,
  stdio: 'inherit',
})
execFileSync('node', ['-e', "require.resolve('@runlume/admin-ui/styles.css')"], {
  cwd: consumer,
  stdio: 'inherit',
})
console.log('package smoke passed')
