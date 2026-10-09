import importlib.util
import json
import re
import sys

spec = importlib.util.spec_from_file_location('existing_redactor', sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
safe = module.redact(json.load(sys.stdin))
encoded = json.dumps(safe, ensure_ascii=False, indent=2)
if re.search(r'\b(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9_.-]{12,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.)', encoded):
    raise SystemExit('Possible credential-shaped value; output withheld')
sys.stdout.write(encoded + '\n')
