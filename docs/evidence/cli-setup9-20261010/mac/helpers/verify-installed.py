"""Independent disk/CLI verification; never initiates authentication or installation."""
import datetime, hashlib, json, os, pathlib, subprocess

base = pathlib.Path(__file__).resolve().parents[2]
expected = json.loads((base / 'candidate-files.json').read_text())
names = {row['path'] for row in expected}
for form, profile in [('npm', 'web'), ('desktop', 'desktop')]:
    root = pathlib.Path('/private/tmp/bkn-cli9-mac') / form
    pkg = root / 'home/profiles' / profile / 'node_modules/@openbkn/dsh-business-context'
    missing, different = [], []
    for row in expected:
        f = pkg / row['path']
        if not f.is_file(): missing.append(row['path'])
        elif hashlib.sha256(f.read_bytes()).hexdigest() != row['sha256']: different.append(row['path'])
    extras = [str(f.relative_to(pkg)) for f in pkg.rglob('*')
              if f.is_file() and 'node_modules' not in f.relative_to(pkg).parts
              and str(f.relative_to(pkg)) not in names]
    result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'packagePath': str(pkg), 'version': json.loads((pkg / 'package.json').read_text())['version'],
              'expected': len(expected), 'matched': len(expected) - len(missing) - len(different),
              'missing': missing, 'different': different, 'extra': extras}
    (base / 'mac' / (form + '-final-installed-identity.json')).write_text(json.dumps(result, indent=2) + '\n')
    assert not missing and not different and not extras, result
    env = os.environ.copy()
    env.update(PATH=str(root / 'bin') + ':/usr/bin:/bin:/usr/sbin:/sbin',
               BKN_CONFIG_DIR=str(root / 'bkn-config'))
    for key in ['BKN_TOKEN', 'BKN_BASE_URL']: env.pop(key, None)
    command = [str(root / 'sdk-prefix-final/bin/openbkn'), '--version']
    version = subprocess.run(command, env=env, capture_output=True, text=True)
    invocations = [json.loads(line) for line in (root / 'npm-install-invocations.jsonl').read_text().splitlines()]
    final_invocations = [row for row in invocations if str(root / 'sdk-prefix-final') in row['args']]
    sdk = root / 'sdk-prefix-final/lib/node_modules/@openbkn/bkn-sdk/package.json'
    verification = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    'command': command, 'exitCode': version.returncode,
                    'stdout': version.stdout, 'stderr': version.stderr,
                    'sdkPackage': str(sdk), 'sdkVersion': json.loads(sdk.read_text())['version'],
                    'sdkPackageSha256': hashlib.sha256(sdk.read_bytes()).hexdigest(),
                    'bknConfigFiles': sorted(str(f.relative_to(root / 'bkn-config'))
                        for f in (root / 'bkn-config').rglob('*') if f.is_file()),
                    'finalInstallInvocations': final_invocations}
    (base / 'mac' / (form + '-final-cli-verification.json')).write_text(json.dumps(verification, indent=2) + '\n')
    assert version.returncode == 0 and version.stdout.strip() == '0.1.5'
    assert len(final_invocations) == 1
    print(json.dumps({'form': form, 'matched': result['matched'],
                      'cliVersion': version.stdout.strip(), 'finalInstallCount': len(final_invocations)}))
