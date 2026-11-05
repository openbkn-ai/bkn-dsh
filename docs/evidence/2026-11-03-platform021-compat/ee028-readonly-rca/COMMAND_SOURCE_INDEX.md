# Read-only command and source index

All raw Kubernetes/HTTP responses were captured in task-private process memory. Saved evidence contains selected metadata only; no artifact body, content_json, preview, DSN, token or private key was retained.

## Runtime reads

- Local ifconfig membership check for 192.168.50.28 (boolean only).
- kubectl config current-context / config view: selected server, CA presence and TLS-skip boolean only.
- kubectl --context kind-bkn-dev --request-timeout=20s -n openbkn get deployment/pod/ingress/service/endpoints: selected metadata only.
- kubectl ... logs agent-observability-744966dccb-7rkqr -c agent-observability --timestamps=true --since=5h --tail=10000 --limit-bytes=8000000: zero lines; raw output not retained.
- docker inspect bkn-dev-control-plane: selected published ports only.
- docker exec bkn-dev-control-plane ctr -n k8s.io content get <existing-manifest/config-digest>: existing cached OCI metadata only; selected labels, build time and entrypoint metadata. No pull or service executable invocation.

## OpenSearch

- Existing Kube service proxy: _stats/docs succeeded; _mapping/_settings/_resolve/index yielded generic Kube BadRequest. No change or retry through application code.
- Three owned localhost-only port-forwards to resource/service/opensearch-cluster-master:9200. Exact command, owner/launcher PID, create/close times are in stage3-port-forward-*.json.
- _resolve/index for the two configured evidence/artifact indices and configured projection alias.
- <index>/_settings with filter_path restricted to creation_date, uuid, version.created.
- <index>/_mapping: field names/types only saved.
- <artifact-index>/_search: exact target interaction_id keyword term, size25, track_total_hits=true; explicit _source metadata allowlist excluding content_json/content/hash.
- <projection-alias>/_search: exact interaction_id.keyword term; first size20 exposed 21 total, so necessary completion used size32. Source fields restricted to lifecycle/owner/ref metadata; returned ref values never saved.
- One _cat/indices/bkn-trace* and _cat/aliases/bkn-trace* metadata-only inventory; five indices, one alias, no additional artifact index candidate. No full business document scan.
- Full safe query shapes are embedded in stage3-target-metadata.json and stage3-projection-index-inventory.json; no sensitive ref/owner values appear there.

## Source interpretation (not deployed-source pin)

Core git object: 81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b under /Users/kalias/Documents/project/app/openBKN/bkn-foundry, read with git show/grep only.

- src/domain/service/evidencesvc/summary.go1432-1504,2118-2146: runtime summary aggregation.
- src/domain/valueobject/evidencevo/summary.go301-319,474-500,637-638: request/link-role matching and Interaction q/r ref generation.
- src/drivenadapter/httpaccess/opensearchevidencestore/artifact_store.go19,60: exact keyword mapping and artifact document ID.
- src/drivenadapter/httpaccess/opensearchevidencestore/projection_source.go365-368: authorized I artifact selection.
- src/drivenadapter/httpaccess/opensearchcoreprojection/source.go55-90,552-612: receipt authorization and same-store artifact fallback.
- src/conf/core.go129-134; src/boot/bootstrap.go736; src/drivenadapter/dbaccess/mariadb/sessionstore/capture_policy_control.go19-55: bootstrap-only initial capture state semantics.
- main.go36,62-74: log-level handling retains Go standard logger.

Paths above are relative to bkn-trace/agent-observability. Runtime image digest is a separate fact and has not been mapped to this source object.

## Independent local backup receipt

Integrated /root/platform021_mcp_delta's authorized private streaming receipt for /Users/kalias/Documents/project/app/openBKN/platform-local-recovery/backup-20261103-pre020/artifacts-015-backup.ndjson. Ops did not repeat that read. Only target metadata presence/type/lengths were retained in stage3-local-backup-metadata.json; no content, ref/owner values or source file hash was retained. Related historical operation record: /Users/kalias/Documents/project/app/openBKN/platform-local-recovery/README.md:116-127. This record is distinct from a live deployment audit chain; no documented recovery command was executed.
