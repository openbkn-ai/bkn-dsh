#!/usr/bin/env python3
"""Package test tooling with the immutable, already-published npm artifact."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tarfile
import zipfile

BASE = Path(__file__).resolve().parent


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def build(package, references, output):
    pin = json.loads((BASE / 'kit/pins.json').read_text())
    if digest(package) != pin['plugin']['sha256']:
        raise ValueError('Use the actual published npm/GitHub -11 tarball')
    output.mkdir(parents=True, exist_ok=False)
    stage = output / pin['kitVersion']
    shutil.copytree(BASE / 'kit', stage)
    target = stage / pin['plugin']['file']
    target.parent.mkdir()
    shutil.copyfile(package, target)
    file_rows = []
    with tarfile.open(package, 'r:gz') as archive:
        for member in archive.getmembers():
            if not member.isfile():
                raise ValueError(f'Unexpected tar member: {member.name}')
            name = member.name.removeprefix('package/')
            if not member.name.startswith('package/') or '..' in Path(name).parts:
                raise ValueError('Unsafe package path')
            data = archive.extractfile(member).read()
            file_rows.append({'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
    if len(file_rows) != 74 or len(set(row['path'] for row in file_rows)) != 74:
        raise ValueError('Published file inventory differs')
    write_json(stage / 'package-files.json', {'files': sorted(file_rows, key=lambda row: row['path'])})
    (stage / 'reference').mkdir()
    for name in ['ENGLISH-RELEASE-VERIFICATION.md', 'english11-package-verification.json', 'english11-release-verification.json', 'english11-provenance-verification.json']:
        source = references / name
        if source.is_symlink() or not source.is_file():
            raise ValueError(f'Missing reference: {name}')
        shutil.copyfile(source, stage / 'reference' / name)
    source_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=BASE, text=True).strip()
    source_tree_dirty = bool(subprocess.check_output(['git', 'status', '--porcelain', '--', str(BASE)], cwd=BASE, text=True).strip())
    write_json(stage / 'SOURCE.json', {'kitSourceCommit': source_commit, 'kitSourceDirty': source_tree_dirty,
        'kitSourcePath': 'docs/handoff/2026-10-22-english11-windows/kit',
        'pluginSourceCommit': pin['plugin']['sourceCommit'], 'pluginWasRebuilt': False,
        'windowsNativeAcceptance': 'PENDING', 'npmLatestWasChanged': False})
    rows = [{'path': path.relative_to(stage).as_posix(), 'bytes': path.stat().st_size, 'sha256': digest(path)}
            for path in sorted(stage.rglob('*')) if path.is_file()]
    write_json(stage / 'kit-files.json', {'files': rows})
    zip_path = output / (pin['kitVersion'] + '.zip')
    with zipfile.ZipFile(zip_path, 'x', compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(stage.rglob('*')):
            if path.is_file():
                info = zipfile.ZipInfo(path.relative_to(output).as_posix(), (2026, 10, 22, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.create_system = 0
                archive.writestr(info, path.read_bytes())
    (output / (zip_path.name + '.sha256')).write_text(f'{digest(zip_path)}  {zip_path.name}\n')
    print(json.dumps({'zip': str(zip_path), 'bytes': zip_path.stat().st_size, 'sha256': digest(zip_path),
                      'files': len(rows) + 1, 'sourceDirty': source_tree_dirty}))
    return stage


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--package', required=True, type=Path)
    parser.add_argument('--references', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    build(args.package, args.references, args.output)
