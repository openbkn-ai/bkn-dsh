import argparse
import hashlib
import json
import pathlib
import tarfile


def inspect(path):
    path = pathlib.Path(path)
    files = {}
    with tarfile.open(path, 'r:gz') as archive:
        for entry in archive.getmembers():
            if entry.isdir():
                continue
            name = entry.name
            if not entry.isfile() or not name.startswith('package/'):
                raise ValueError(f'Unexpected archive entry: {name}')
            name = name.removeprefix('package/')
            if '..' in pathlib.PurePosixPath(name).parts or name in files:
                raise ValueError(f'Unsafe or duplicate archive entry: {name}')
            files[name] = archive.extractfile(entry).read()
    lines = ''.join(f'{hashlib.sha256(files[name]).hexdigest()}  {name}\n' for name in sorted(files))
    raw = path.read_bytes()
    return files, {
        'file': path.name,
        'bytes': len(raw),
        'sha256': hashlib.sha256(raw).hexdigest(),
        'sha512': hashlib.sha512(raw).hexdigest(),
        'files': len(files),
        'treeHash': hashlib.sha256(lines.encode()).hexdigest(),
    }


parser = argparse.ArgumentParser()
parser.add_argument('candidate')
parser.add_argument('other')
parser.add_argument('--package-json-key-order', action='store_true')
args = parser.parse_args()
left, left_info = inspect(args.candidate)
right, right_info = inspect(args.other)
changed = sorted(name for name in left.keys() & right.keys() if left[name] != right[name])
allowed = []
if args.package_json_key_order and 'package.json' in changed:
    canonical = lambda data: json.dumps(json.loads(data), sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    if canonical(left['package.json']) == canonical(right['package.json']):
        changed.remove('package.json')
        allowed.append('package.json: key order/format only; parsed contents identical')
result = {
    'candidate': left_info,
    'compared': right_info,
    'added': sorted(right.keys() - left.keys()),
    'removed': sorted(left.keys() - right.keys()),
    'changed': changed,
    'allowed': allowed,
}
result['pass'] = len(left) == len(right) == 52 and not result['added'] and not result['removed'] and not changed
print(json.dumps(result, indent=2))
raise SystemExit(0 if result['pass'] else 1)
