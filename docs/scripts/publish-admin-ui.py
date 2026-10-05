#!/usr/bin/env python3
"""Publish the checked standard UI package using native secret input and npm web auth."""
import os
import pathlib
import shutil
import subprocess
import tempfile

root = pathlib.Path(__file__).resolve().parents[2]
if not shutil.which('expect'):
    raise SystemExit('expect is required for npm web authentication')
token = subprocess.check_output(['osascript', '-e', 'text returned of (display dialog "请输入 npm Granular Access Token（Read and write，授权 @runlume）" default answer "" with hidden answer buttons {"取消", "继续"} default button "继续" with title "发布 admin-ui")'], text=True).strip()
if not token:
    raise SystemExit('No token provided; nothing published')
env = os.environ.copy()
env['NPM_TOKEN'] = token
del token
# This file contains only an environment placeholder, never the entered secret.
with tempfile.TemporaryDirectory(prefix='admin-ui-publish-') as temporary:
    config = pathlib.Path(temporary) / 'npmrc'
    config.write_text('@runlume:registry=https://registry.npmjs.org/\n//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n')
    config.chmod(0o600)
    try:
        identity = subprocess.run(['npm', 'whoami', '--registry=https://registry.npmjs.org/', '--userconfig', str(config)], cwd=root, env=env, capture_output=True)
        if identity.returncode:
            raise SystemExit('npm identity validation failed; nothing published')
        print('npm identity validated; starting publication and browser confirmation', flush=True)
        script = '''log_user 0
set timeout -1
set config [lindex $argv 0]
spawn -noecho npm publish --auth-type=web --registry=https://registry.npmjs.org/ --userconfig $config
expect {
  -re {Press ENTER to open.*browser} {send "\\r"; puts "Complete npm browser confirmation"; exp_continue}
  -re {EOTP} {puts "npm requires additional authentication"; exp_continue}
  eof
}
set result [wait]
exit [lindex $result 3]
'''
        result = subprocess.run(['expect', '-f', '-', '--', str(config)], input=script, text=True, env=env, cwd=root)
        if result.returncode:
            raise SystemExit('npm publication did not succeed; verify registry state before retrying')
        print('npm publication returned success; verify the public registry version', flush=True)
    finally:
        env.pop('NPM_TOKEN', None)
