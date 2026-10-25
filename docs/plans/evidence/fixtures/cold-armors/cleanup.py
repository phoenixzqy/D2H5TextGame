"""Remove only the exact, hash-verified disposable files in this task plan."""
from pathlib import Path
import hashlib
import json

here = Path(__file__).resolve().parent
root = Path("/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-sorceress-cold-armors-peejkniz")
plan = json.loads((here / "cleanup-plan.json").read_text())
assert plan["root"] == str(root)
assert root.is_dir() and not root.is_symlink() and root.resolve() == root
expected = plan["files"]
entries = list(root.rglob("*"))
assert not any(p.is_symlink() for p in entries), "Unexpected symlink; no deletion authorized"
actual = {str(p.relative_to(root)) for p in entries if p.is_file()}
assert actual == set(expected), "Task file set changed; no deletion authorized"
for relative, digest in expected.items():
    p = Path(relative)
    assert not p.is_absolute() and ".." not in p.parts
    target = root / p
    assert target.resolve().is_relative_to(root)
    assert hashlib.sha256(target.read_bytes()).hexdigest() == digest, relative
failures = []
removed = 0
for relative in expected:
    try:
        (root / relative).unlink()
        removed += 1
    except OSError as error:
        failures.append({"path": relative, "error": str(error)})
for directory in sorted((p for p in entries if p.is_dir()), key=lambda p: len(p.parts), reverse=True):
    try:
        directory.rmdir()
    except OSError as error:
        failures.append({"path": str(directory), "error": str(error)})
try:
    root.rmdir()
except OSError as error:
    failures.append({"path": str(root), "error": str(error)})
remaining = [str(p) for p in root.rglob("*")] if root.exists() else []
result = {"root": str(root), "removedFiles": removed, "rootAbsent": not root.exists(),
          "remaining": remaining, "failures": failures}
(here / "cleanup.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps({"removedFiles": removed, "rootAbsent": not root.exists(), "remaining": remaining, "failures": failures}))
assert not remaining and not failures and not root.exists()
