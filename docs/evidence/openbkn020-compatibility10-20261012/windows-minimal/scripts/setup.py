import os
src = r'C:/bkn-verify/cli9f/evidence/scripts'
dst = r'C:/bkn-verify/compat10-minimal/scripts'
bs = chr(92)
def w(*parts):
    return bs.join(parts).encode()
pairs = [
    (w('C:', 'bkn-verify', 'cli9f', 'evidence'), w('C:', 'bkn-verify', 'compat10-minimal', 'evidence')),
    (w('C:', 'bkn-verify', 'cli9f', ''), w('C:', 'bkn-verify', 'compat10-minimal', '')),
    (w('C:', 'bkn-verify', 'unified7-c91fe09-authentication-recovery', 'windows-kit', 'certificates', 'openbkn-dev-ca.pem'),
     w('C:', 'bkn-verify', 'compat10-wt', 'docs', 'handoff', '2026-10-12-compatibility10-minimal-windows', 'openbkn-dev-ca.pem')),
]
for f in ['daily-snapshot.ps1', 'env-npm.ps1', 'start-npm-host.ps1', 'start-desktop-host.ps1', 'dsh-plugin.ps1', 'prefix-fingerprint.sh', 'f97-run.ps1']:
    b = open(os.path.join(src, f), 'rb').read()
    for o, n in pairs:
        b = b.replace(o, n)
    open(os.path.join(dst, f), 'wb').write(b)
print('ok')
