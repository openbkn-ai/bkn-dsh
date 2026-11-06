#!/usr/bin/env python3
"""One-release promotion of immutable CI6 bytes; never builds or runs product tests."""
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import time
import urllib.error
import urllib.request
import zipfile

REPO = 'openbkn-ai/bkn-dsh'
SOURCE = 'f01b316fbfb6be681af81e2267a7b3341e659efd'
RUN = 41596006291
ARTIFACT = 13212518096
VERSION = '0.2.1-rc.3-openbkn.0.2.1-3'
NAME = '@openbkn/dsh-business-context'
SHA = '4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046'
FILENAME = 'openbkn-dsh-business-context-' + VERSION + '.tgz'
OUT = Path('release/accepted-ci6')
RECEIPT = Path('docs/evidence/2026-11-03-platform021-compat/FORMAL-RELEASE-ACCEPTANCE.json')
REGISTRY = 'https://registry.npmjs.org'


def command(*args):
    return subprocess.check_output(args).decode().strip()


def gh(path):
    return json.loads(command('gh', 'api', 'repos/' + REPO + '/' + path))


def require(ok, message):
    if not ok:
        raise ValueError(message)


def validate_receipt(d):
    require(d.get('status') == 'PASS', 'Formal acceptance is not PASS')
    require(d.get('candidate_sha256') == SHA and d.get('candidate_source') == SOURCE,
            'Receipt refers to a different candidate')
    require(d.get('platform') == '0.2.1' and d.get('cli') == '0.2.1', 'Formal versions required')
    require(d.get('host_version') == '0.2.1-rc.5', 'Native Host acceptance must use official rc.5')
    require(d.get('mac_native') is True and d.get('windows_native') is True,
            'Both affected native forms must be accepted')
    require(d.get('platform_origin') == 'https://192.168.50.129', 'Wrong acceptance platform')
    require(bool(d.get('evidence_files')), 'Missing acceptance evidence')


def validate_origin(run, artifact):
    require(run.get('id') == RUN and run.get('status') == 'completed'
            and run.get('conclusion') == 'success' and run.get('event') == 'workflow_dispatch'
            and run.get('head_sha') == SOURCE
            and run.get('head_repository', {}).get('full_name') == REPO
            and run.get('path') == '.github/workflows/release-plugin.yml', 'Untrusted build run')
    require(artifact.get('id') == ARTIFACT and artifact.get('name') == 'plugin-tarball'
            and artifact.get('expired') is False
            and artifact.get('workflow_run', {}).get('id') == RUN
            and artifact.get('workflow_run', {}).get('head_sha') == SOURCE,
            'Untrusted or expired artifact')


def validate_archive(raw):
    require(len(raw) == 877732 and hashlib.sha256(raw).hexdigest() == SHA, 'Candidate byte mismatch')
    with tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz') as archive:
        files = [m for m in archive if m.isfile()]
        require(len(files) == 126, 'Candidate member mismatch')
        pkg = json.load(archive.extractfile('package/package.json'))
        require(pkg.get('name') == NAME and pkg.get('version') == VERSION, 'Package identity mismatch')


def validate_source_changes(paths):
    allowed = {'CLAUDE.md', 'README.md', 'README.zh.md', 'CHANGELOG.md', '.github/workflows/release-plugin.yml',
               'scripts/publish-accepted-ci6.py', 'tests/test_publish_accepted_ci6.py'}
    require(all(p in allowed or p.startswith('docs/') for p in paths),
            'Files outside reviewed release plumbing/documentation changed')


def metadata():
    url = REGISTRY + '/%40openbkn%2Fdsh-business-context/' + VERSION
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def registry_archive():
    # Do not follow an arbitrary dist.tarball returned by registry metadata.
    url = REGISTRY + '/@openbkn/dsh-business-context/-/dsh-business-context-' + VERSION + '.tgz'
    with urllib.request.urlopen(url, timeout=60) as response:
        raw = response.read(2_000_000)
    validate_archive(raw)
    return raw


def prepare():
    require(os.environ.get('GITHUB_REPOSITORY') == REPO
            and os.environ.get('GITHUB_REF') == 'refs/heads/main', 'Promotion is main-only')
    require(command('git', 'rev-parse', 'HEAD') == os.environ.get('GITHUB_SHA'), 'Checkout mismatch')
    require(gh('git/ref/heads/main')['object']['sha'] == os.environ['GITHUB_SHA'], 'Main moved')
    receipt = json.loads(RECEIPT.read_text())
    validate_receipt(receipt)
    for row in receipt['evidence_files']:
        p = Path(row['path'])
        require(str(p).startswith('docs/evidence/') and '..' not in p.parts, 'Invalid evidence path')
        require(hashlib.sha256(p.read_bytes()).hexdigest() == row['sha256'], 'Evidence byte mismatch')
    validate_origin(gh('actions/runs/' + str(RUN)), gh('actions/artifacts/' + str(ARTIFACT)))
    validate_source_changes(command('git', 'diff', '--name-only', SOURCE, 'HEAD').splitlines())
    # Release plumbing/documentation may differ; all compilation inputs must match.
    inputs = ['packages', 'compat', 'runtime', 'package.json', 'pnpm-lock.yaml',
              'pnpm-workspace.yaml', 'tsconfig.json', 'tsconfig.base.json']
    require(not command('git', 'diff', '--name-only', SOURCE, 'HEAD', '--', *inputs),
            'Accepted production/build inputs changed')
    script_changes = command('git', 'diff', '--name-only', SOURCE, 'HEAD', '--', 'scripts').splitlines()
    require(all(p == 'scripts/publish-accepted-ci6.py' for p in script_changes), 'Build scripts changed')
    pkg = json.loads(Path('packages/openbkn-business-context/package.json').read_text())
    manifest = json.loads(Path('runtime/openbkn-dsh-runtime.manifest.json').read_text())
    require(pkg['version'] == VERSION and manifest['plugin']['version'] == VERSION, 'Version mismatch')
    OUT.mkdir(parents=True, exist_ok=True)
    data = subprocess.check_output(['gh', 'api', 'repos/' + REPO + '/actions/artifacts/' + str(ARTIFACT) + '/zip'])
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        require(archive.namelist() == [FILENAME], 'Unexpected artifact ZIP members')
        require(archive.getinfo(FILENAME).file_size == 877732, 'Unexpected archive size')
        raw = archive.read(FILENAME)
    validate_archive(raw)
    (OUT / FILENAME).write_bytes(raw)
    print('Verified exact accepted artifact and formal acceptance receipts; no rebuild or test replay.')


def publish():
    # Reruns can resume only if the immutable registry version is identical.
    validate_archive((OUT / FILENAME).read_bytes())
    if metadata() is not None:
        registry_archive()
        print('Exact version already published and byte-identical; resuming release.')
        return
    subprocess.run(['npm', 'publish', str(OUT / FILENAME), '--registry', REGISTRY,
                    '--access', 'public', '--provenance', '--tag', 'rc'], check=True)


def release():
    for attempt in range(12):
        if metadata() is not None:
            break
        require(attempt < 11, 'Published version did not become visible')
        time.sleep(10)
    raw = registry_archive()
    (OUT / (FILENAME + '.sha256')).write_text(SHA + '  ' + FILENAME + '\n')
    # The runner token's tag creation does not recursively trigger tag CI.
    tag = 'v' + VERSION
    ref = subprocess.run(['gh', 'api', 'repos/' + REPO + '/git/ref/tags/' + tag], capture_output=True)
    if ref.returncode == 0:
        require(json.loads(ref.stdout)['object']['sha'] == os.environ['GITHUB_SHA'], 'Existing tag differs')
    else:
        # Creation itself fails closed for auth/network errors or existing refs.
        subprocess.run(['gh', 'api', '--method', 'POST', 'repos/' + REPO + '/git/refs',
                        '-f', 'ref=refs/tags/' + tag, '-f', 'sha=' + os.environ['GITHUB_SHA']], check=True)
    receipt = json.loads(RECEIPT.read_text())
    validate_receipt(receipt)
    host = receipt['host_version']
    notes = command('node', 'scripts/plugin-release-notes.mjs', '--version', VERSION,
                    '--package', NAME, '--dsh-tag', 'dsh-v' + host, '--ref', tag)
    (OUT / 'notes.md').write_text(notes + '\n')
    exists = subprocess.run(['gh', 'release', 'view', tag], capture_output=True).returncode == 0
    if not exists:
        subprocess.run(['gh', 'release', 'create', tag, '--verify-tag', '--latest=false',
                        '--title', 'bkn-dsh plugin ' + VERSION, '--notes-file', str(OUT / 'notes.md'),
                        str(OUT / FILENAME), str(OUT / (FILENAME + '.sha256')),
                        *map(str, sorted(Path('compat/mcp-profile-backport').glob('*.tgz'))),
                        *map(str, sorted(Path('compat/mcp-profile-backport').glob('*.json'))),
                        'compat/mcp-profile-backport/README.md'], check=True)
    check_dir = OUT / 'release-readback'
    check_dir.mkdir(exist_ok=True)
    subprocess.run(['gh', 'release', 'download', tag, '--pattern', FILENAME,
                    '--dir', str(check_dir), '--clobber'], check=True)
    validate_archive((check_dir / FILENAME).read_bytes())
    # npm OIDC is used for publish; latest promotion is a separate credentialed step.
    print('Published accepted bytes under rc; GitHub Release verified. Promote latest only after final registry verification.')


if __name__ == '__main__':
    {'prepare': prepare, 'publish': publish, 'release': release}[sys.argv[1]]()
