"""Source-derived, controlled fixture; not a deployed tools/list capture.

Usage: python3 scripts/capture-context-loader020.py <fixed-foundry-root> <output>
Requires Go. Executes the upstream pure schema builders with encoding/json in
place of Sonic, without booting services or importing plugin policy.
"""
import argparse
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('root', type=Path)
parser.add_argument('output', type=Path)
parser.add_argument('--release', choices=['v0.2.0'])
args = parser.parse_args()
COMMIT = "81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b" if args.release else "06c5a8786a81f3ef4601f00b1e3ba4f3b9f6988a"
root, output = args.root, args.output
relative = Path("adp/context-loader/agent-retrieval/server/driveradapters/mcp")
base = root / relative
EXPECTED_SHA256 = {'schemas.go': '77c46407fd7174a61643f7c8d0e82ef9524f3dd0b7599837b4caa0eef6afda47', 'compact_view.go': 'dfab30b571ea7001d67f2ec3bf3bd655ba2ec8221d56d5dff39e1b28e2c179a4', 'app.go': '7654f406c47253de7748fc81fb7aabf072f6bcaf3d26638f02fbe82b94603c7b', 'retired.go': '8fb87d8a593f4545592ff1d5a3ceca8b2a9f191f981d7f607dd8b48432acde8a', 'catalog.go': '899348acb8690bc9f09d3dbb0b10bc4917269f172455a0d68283ca65c2968614', 'schemas/tools_meta.json': '2052710885da52c3a8095da19ed694f33ee539833203255cc808a0da28d0657d'}
if args.release:
    EXPECTED_SHA256.update({
        'schemas.go': 'c6584421a66fd692f09788a43d18966558dc581198c53fb05f4f8b04d15d48aa',
        'compact_view.go': 'e5d42b5acb6a28c874db9af30ebb85551457b94f6b11c95f946b322daf72cf64',
        'lifecycle_adapter.go': '7b86d833ae790ad3cdd628e4b77da78f2e8985026f0a7182fa9cd77aa80ec34f',
        'session_guard.go': '30937d7d2518a6c7d7ae036026cad331b9a26bdb62c83de8682e9c8bc4039298',
    })
for name, expected in EXPECTED_SHA256.items():
    if hashlib.sha256((base / name).read_bytes()).hexdigest() != expected:
        raise SystemExit("Source does not match pinned snapshot: " + name)
schema_source = (base / "schemas.go").read_text()
view_source = (base / "compact_view.go").read_text()
adapter = (base / "lifecycle_adapter.go").read_text()
app = (base / "app.go").read_text()
retired = (base / "retired.go").read_text()
meta = json.loads((base / "schemas/tools_meta.json").read_text())
constants = dict(re.findall(r'(toolKey\w+)\s*=\s*"([\w_]+)"', app + adapter))
retired_keys = re.findall(r'\btoolKey\w+\b', retired[retired.index("var retiredTools"):])
retired_names = {constants[key] for key in retired_keys}
# These metadata entries register only on compact; never project them as full.
catalog = (base / 'catalog.go').read_text()
gateway_names = set(re.findall(r'toolKey\w+\s*=\s*"([\w_]+)"', catalog))
lifecycle_names = re.search(r'var lifecycleToolNames = map\[string\]struct\{\}\{.*?\n\}', adapter, re.S).group()
outcomes = re.search(r'var finishInteractionOutcomes = .*', schema_source).group()
builders = schema_source[schema_source.index("func lifecycleToolSchemas"):]
builders = builders.replace("sonic.ConfigStd.Marshal", "json.Marshal").replace("sonic.Unmarshal", "json.Unmarshal")
view = view_source[view_source.index("func publishedInputSchema"):view_source.index("// compactInfoView")]
projection = ''
examples = ''
if args.release:
    projection = adapter[adapter.index('func agentLifecycleView'):adapter.index('func ensureLifecycleIdempotency')]
    projection = projection.replace('bkntrace.Interaction', 'Interaction').replace('bkntrace.CaptureDisabled()', 'false')
    projection = '''type Interaction struct {
 InteractionID, ConversationID, ExecutionStatus, EvidenceStatus string
 CaptureEnabled *bool
}\n''' + projection
    examples = '''
 disabled := false
 result["_lifecycleExamples"] = map[string]any{
  "captureDisabledStart": agentLifecycleView(toolKeyStartInteraction, &Interaction{InteractionID:"int-real", ConversationID:"conv-committed", ExecutionStatus:"active", CaptureEnabled:&disabled}),
  "captureDisabledFinish": agentLifecycleView(toolKeyFinishInteraction, &Interaction{InteractionID:"int-real", ConversationID:"conv-committed", ExecutionStatus:"completed", EvidenceStatus:"complete", CaptureEnabled:&disabled}),
 }
'''
program = '''package main
import ("encoding/json"; "bytes"; "log"; "slices"; "os")
const toolKeyStartInteraction = "bkn_start_interaction"
const toolKeyFinishInteraction = "bkn_finish_interaction"
''' + lifecycle_names + '\n' + outcomes + '\n' + builders + '\n' + view + projection + '''
func main() {
 var inputs map[string]json.RawMessage
 if err := json.NewDecoder(os.Stdin).Decode(&inputs); err != nil { panic(err) }
 result := map[string]any{}
 for name, raw := range inputs {
  in, out, lifecycle := lifecycleToolSchemas(name)
  if !lifecycle { in = publishedInputSchema(name, offerBKNContext(raw), nil) }
  result[name] = map[string]any{"inputSchema": in, "outputSchema": out}
 }
''' + examples + '''
 if err := json.NewEncoder(os.Stdout).Encode(result); err != nil { panic(err) }
}
'''
inputs, outputs, records = {}, {}, {}
for key in sorted(meta):
    if key in retired_names or key in gateway_names:
        continue
    path = base / "schemas" / (key + ".json")
    raw = json.loads(path.read_text()) if path.exists() else None
    if raw is not None or key in ("bkn_start_interaction", "bkn_finish_interaction"):
        inputs[key] = raw["input_schema"] if raw else {}
        outputs[key] = raw.get("output_schema") if raw else None
    else:
        # Inline PTC declarations have no merged JSON in this directory.
        records[key] = {"knId": "unknown", "note": "Inline PTC schema is not represented here; not a fabricated empty schema."}
with tempfile.TemporaryDirectory(prefix="bkn-schema-") as temporary:
    go = Path(temporary) / "main.go"
    go.write_text(program)
    built = json.loads(subprocess.check_output(["go", "run", str(go)], input=json.dumps(inputs).encode()))
lifecycle_examples = built.pop('_lifecycleExamples', None)

def structural(value):
    if isinstance(value, dict):
        return {k: structural(v) for k, v in value.items() if k not in ("description", "title", "examples", "$comment")}
    if isinstance(value, list):
        return [structural(v) for v in value]
    return value

for key, item in built.items():
    schema = item["inputSchema"]
    properties = schema.get("properties", {})
    records[key] = {
        "knId": "required" if "kn_id" in schema.get("required", []) else "optional" if "kn_id" in properties else "absent",
        "inputSchema": structural(schema),
        "outputSchema": structural(item["outputSchema"] if item["outputSchema"] is not None else outputs[key]),
    }
paths = ["app.go", "assemble.go", "retired.go", "catalog.go", "profile.go", "schemas.go", "compact_view.go", "lifecycle_adapter.go", "schemas/tools_meta.json"]
if args.release:
    paths += ['session_guard.go', 'capture_admission_test.go', 'lifecycle_schema_test.go']
paths += ["schemas/" + name + ".json" for name in sorted(inputs) if (base / "schemas" / (name + ".json")).exists()]
fixture = {
    "source": {
        "repository": "openbkn-ai/bkn-foundry", "commit": COMMIT, "captured": "2026-10-19" if args.release else "2026-10-12",
        **({'tag': args.release} if args.release else {}),
        "profile": "/api/agent-retrieval/v1/mcp", "condition": "Community source; skill.executeEnabled=true; EE extras absent",
        "method": "Source projection of full-profile metadata minus retiredTools and compact-only gateways, with pure Go lifecycle/offerBKNContext/publishedInputSchema builders executed via encoding/json. Descriptions omitted. Not a live tools/list.",
        "inputsSha256": {str(relative / path): hashlib.sha256((base / path).read_bytes()).hexdigest() for path in paths},
    },
    "tools": dict(sorted(records.items())),
    **({'lifecycleExamples': lifecycle_examples} if lifecycle_examples else {}),
}
output.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"output": str(output), "tools": len(records), "schemaTools": len(built), "retired": sorted(retired_names)}))
