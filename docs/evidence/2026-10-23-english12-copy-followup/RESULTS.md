# English candidate 12: Chinese explanation follow-up

Source-only correction after the accepted -12 artifact. No npm publication, dist-tag change, replacement review tarball or new Windows acceptance run is part of this follow-up.

## Defect and scope

The Windows delta return (SHA-256 `0c40edb38d985ef66f37025ef4ae0e321e9fa430b212f6222731b097d6b0ad6e`) contains the Chinese provenance explanation with English Request / Trace / Receipt names. The reported screenshot and `src/client/locales.ts` agree. Replace that owned explanation with Chinese request/trace/receipt terms; leave the English resource, actual IDs, tool names, raw statuses, model answers and all Host behavior unchanged. No version, dependency, generator or compatibility pin changed.

## Validation

Using Node 22.22.3 and the pinned pnpm 11.7.0:

- All 10 existing locale-rendering tests passed.
- Client TypeScript/build passed; the bundle contains the corrected Chinese sentence and no old Chinese sentence.
- Byte comparison against accepted CI 39791127284 shows that the local client bundle is exactly the old bundle with this one sentence replaced. All six Host/Remote JavaScript files remain byte-identical.
- Package-content audit passed (74 files). No full Windows suite, repeated authorization, cold-start matrix or G6 batch was run.

The first local invocation used the shell's pnpm 10.33.0; it did not install dependencies or modify the lockfile. Validation was then repeated using explicit pnpm 11.7.0; the pinned run is the verification result above.

The accepted package is still source `5519645d58a8537c27c73626bc2dae7d90ddc242`, SHA-256 `30a94300994296513b8d391acda69933acf1f4a77440e9da53486a0de5bd1a44`. Its ZIP remains SHA-256 `43abbacd0018763057c540ad823bf229abc33e79e0e0aa0c77ecdad8b34996c0`. Neither was rewritten. The local follow-up build is not a replacement accepted artifact or evidence of a new real-host run; a later candidate must include and verify the changed copy before publication.

The same-session upstream review on 2026-10-23 checked DSH's latest available dsh-v0.2.1-rc.2 while retaining the supported/tested 0.2.0-rc.2 pin, OpenBKN v0.2.0, the CA-verified live 25-tool full-schema catalogue (canonical SHA-256 `a679358f8b9a45948ac9f5a11f1044899922fe32487d887bc10c94c76a995be6`) and current core 0.2.0 deployment images. This copy-only change neither expands compatibility nor changes the managed contract.

## Retained issues and next evidence

Per the maintainer's 2026-10-23 instruction, keep Windows carrier lifetime and Ctrl+C behavior as known issues. Do not modify the authentication or shutdown implementation. Missing real count/nonempty-graph coverage remains explicit.

For A7, request only the original npm turn's failed second start/continue call and its paired result, plus minimal lifecycle correlation. Use [the Windows handoff](../../handoff/2026-10-23-english12-a7/WINDOWS-A7-MINIMAL.zh.md). A missing raw event stays missing: no new model question, authorization, Host restart or full-suite rerun is requested. The return should use a local share/private link and must not be automatically attached to the public review release.

Expected npm tags remain rc=-11 and latest=-10. No production tag, merge, publish or promotion was performed.
