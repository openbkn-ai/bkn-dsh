# Platform provenance conversation detail

This directory adapts actual OpenBKN Studio source from `release/0.2.0`, commit
`90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535`, not a parallel plugin design.
The upstream source is licensed under LicenseRef-OpenBKN; the full license is
preserved in `../../../licenses/openbkn-studio.txt`. Copyright/SPDX headers are
retained on copied components, styles, types, locale dictionaries and pure helpers.

Copied upstream paths below `src/modules/bkn-trace`: business-provenance scene,
record-missing details, call-scope and service field mappings; evidence-chain
BusinessProvenance016, CurrentExplanationPanel, EvidenceChainPanels, schema parser,
types and chain-layout; Chinese and English locale dictionaries. MarkdownText and
its styles originate in `src/framework/ui/common`. Scoped light-theme CSS variables and
AntD configuration originate in `src/styles/global.css` and `src/app/theme/theme.ts`
with the platform runtime defaults (`#1e3a8a`, square controls) resolved locally.

Adaptations are confined to the DSH current-conversation context: no global list or
back button, fixed Host transport and explicit clipboard/file actions, scoped
inline CSS, isolated locale/portal context, exact initial Interaction selection,
round pagination, distinct retry attempts and stale-request cancellation.
Platform-authored summaries, recorded values, invalid states/reasons and model text
retain their platform semantics. Opening/refreshing uses reads only. Explanation
generation and Agent analysis run solely after their respective explicit actions.

Two embedding safety differences are explicit: incomplete/truncated round pages
stop automatic location scans and retain the current interaction; the evidence
view exposes platform-recorded `status`, `validationStatus` and `reasonCode`
fields for question-pair, function and edge records in both reading and graph
modes. These fields are not recalculated and do not remove or rewrite records.

## Controlled browser harness

From the package directory:

```sh
node src/client/platform-provenance/harness/build.mjs
python3 -m http.server 43121 --bind 127.0.0.1 --directory ../../release/provenance-parity-harness
```

Open `http://127.0.0.1:43121/` or append `?mode=managed`. This bundles the actual
viewer and its real dependencies into an isolated page; only the transport uses
the independent `tests/fixtures/provenance-parity/conversation.json` synthetic
fixture. It does not authenticate, call the platform/model, install a plugin, or
write to a daily DSH profile. The Host style sentinel sits outside the scoped
viewer. The toolbar switches ordinary/retry and managed records, language and
not-generated explanation reads. It is controlled rendering evidence, not proof
of real DSH Host authorization, actual platform payloads or human acceptance.

Adapter regression command:

```sh
node --import tsx --test src/client/platform-provenance/adapter.test.ts
```

The upstream `src/framework/compat/clipboard.ts` compatibility helper is also
retained. Its selection-based fallback requires an explicit connected owned
container, restores focus/selection, and never inserts controls into an unrelated
Host surface. Nested evidence inspector Escape handling is local to that dialog,
with focus restored to its opener, so closing an inspector does not close the
outer DSH provenance window.

Additional clipboard regression command:

```sh
node --import tsx --test src/client/platform-provenance/clipboard.test.ts
```

## Round-list metadata and detail lifecycle

The selected Interaction ID owns the detail request lifecycle. Initial round
location, search results and page navigation update list metadata without
reloading that same Interaction, clearing its evidence view, or cancelling an
explicit explanation generation/Agent analysis already in progress. An existing
detail view stays mounted while the round list loads. Selecting another
Interaction cancels the previous detail/actions; the render also verifies the
projection ID to prevent an old record flashing under new round metadata.
Explicit Refresh reloads both the round list and current detail using reads;
it never starts explanation generation or analysis automatically.

Controlled regressions:

```sh
node --import tsx --test src/client/platform-provenance/scene-list-boundaries.test.ts
```

The two tests failed before this embedding correction and pass afterward: search
preserves an in-flight explicit generation, pagination preserves an in-flight
analysis without re-reading the same facts, and explicit Refresh performs the
expected detail read without another POST. This proves the controlled lifecycle;
real Host/platform behavior remains a separate acceptance step.
