from pathlib import Path
import hashlib, json, re, socket, tarfile

root = Path('/home/felixzhao/.zai/profiles/anonymous/worktrees/D2H5TextGame-human-worktree-2')
out = root / 'docs/plans/evidence/fixtures/sorceress-direct-lightning'
p = Path('/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-sorceress-direct-lightning-82n4jvpj')
assert p.resolve(strict=True) == p and p.is_dir() and not p.is_symlink()
packet = json.loads((out / 'packet.json').read_text())
assert hashlib.sha256((out / packet['archive']).read_bytes()).hexdigest() == packet['archiveSha256']
with tarfile.open(out / packet['archive'], 'r:gz') as tar:
    members = tar.getmembers()
    assert len(members) == len(packet['members'])
    for member, row in zip(members, packet['members'], strict=True):
        assert member.isfile() and member.name == row['path'] and member.size == row['bytes']
        handle = tar.extractfile(member)
        assert handle is not None and hashlib.sha256(handle.read()).hexdigest() == row['sha256']
frozen = json.loads((p / 'frozen.json').read_text())
inventory = {row['path']: row['sha256'] for row in packet['members']}
inventory.update({'build/' + name: value for name, value in frozen['build'].items()})
record = json.loads((p / 'recorded-processes.json').read_text())
present = []
for row in record['processes']:
    proc = Path('/proc') / str(row['pid'])
    if proc.exists():
        fields = (proc / 'stat').read_text().rsplit(')', 1)[1].split()
        if row.get('startTicks') is None or row['startTicks'] == fields[19]:
            present.append(row['pid'])
assert not present, present
profiles = sorted(set(name for row in record['processes'] for name in re.findall(r'--user-data-dir=([^ ]+)', row.get('command', ''))))
assert all(not Path(name).exists() for name in profiles), profiles
sock = socket.socket()
sock.settimeout(.2)
closed = sock.connect_ex(('127.0.0.1', 4513)) != 0
sock.close()
assert closed
current = []
dirs = []
for file in sorted(p.rglob('*')):
    assert not file.is_symlink() and file.resolve().is_relative_to(p), str(file)
    if file.is_dir():
        dirs.append(file)
    elif file.is_file():
        name = str(file.relative_to(p))
        assert name in inventory and hashlib.sha256(file.read_bytes()).hexdigest() == inventory[name], name
        current.append(file)
    else:
        raise AssertionError(str(file))
assert {str(file.relative_to(p)) for file in current} == set(inventory)
removed = []
failures = []
for file in current:
    try:
        file.unlink()
        removed.append(str(file.relative_to(p)))
    except OSError as error:
        failures.append({'path': str(file), 'error': str(error)})
for directory in sorted(dirs, key=lambda directory: len(directory.parts), reverse=True):
    try:
        directory.rmdir()
    except OSError as error:
        failures.append({'path': str(directory), 'error': str(error)})
try:
    p.rmdir()
except OSError as error:
    failures.append({'path': str(p), 'error': str(error)})
remaining = [str(file) for file in p.rglob('*')] if p.exists() else []
receipt = {'scratch': str(p), 'archiveMembersVerified': len(packet['members']),
           'buildFilesVerified': len(frozen['build']), 'removedFiles': len(removed), 'removedPaths': removed,
           'recordedPids': len(record['processes']), 'presentOwnedPids': present,
           'recordedProfiles': profiles, 'profilesAbsent': True, 'port4513Closed': closed,
           'scratchAbsent': not p.exists(), 'remaining': remaining, 'failures': failures,
           'preserved': ['source/history', 'shared caches/tools', 'retained evidence', 'umbrella worktree/branch/claim']}
(out / 'cleanup.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({key: value for key, value in receipt.items() if key not in ['removedPaths', 'recordedProfiles']}))
assert not failures and not remaining and not p.exists()
