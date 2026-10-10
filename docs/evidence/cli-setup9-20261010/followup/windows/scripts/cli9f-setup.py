import os
src = r'C:/bkn-verify/cli9'
dst = r'C:/bkn-verify/cli9f'
for d in ['evidence/scripts', 'fixtures/bin', 'npm/CLI Prefix', 'npm/private', 'desktop/CLI Prefix']:
    os.makedirs(os.path.join(dst, d), exist_ok=True)
old_w = 'C:' + '\\' + 'bkn-verify' + '\\' + 'cli9' + '\\'
new_w = 'C:' + '\\' + 'bkn-verify' + '\\' + 'cli9f' + '\\'
for sub in ['evidence/scripts', 'fixtures/bin']:
    for f in os.listdir(os.path.join(src, sub)):
        b = open(os.path.join(src, sub, f), 'rb').read()
        b = b.replace(old_w.encode(), new_w.encode()).replace(b'C:/bkn-verify/cli9/', b'C:/bkn-verify/cli9f/')
        open(os.path.join(dst, sub, f), 'wb').write(b)
for m, v in [('npm-mode.txt', 'real'), ('node-mode.txt', 'real'), ('delay-seconds.txt', '60')]:
    open(os.path.join(dst, 'fixtures', m), 'w').write(v)
open(os.path.join(dst, 'fixtures', 'calls.log'), 'w').close()
print('ok')
