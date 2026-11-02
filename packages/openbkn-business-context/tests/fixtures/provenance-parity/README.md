# Controlled provenance parity fixtures

All data in this directory is synthetic. It is not an exported live platform record, model execution, DSH Host acceptance or user acceptance.

- `conversation.json`: 73 newest-first Interaction rounds; trusted answer is round 7 outside the first 50. Contains ordinary retry attempts, a managed parent/failed child, exact source text and payloads, missing facts, saved invalid reasons, Markdown and analysis history.
- `shared-input-explanation.json`: two server-described query branches share an input. Graph relations are explicit persisted edges. An equal-valued unrelated node has no edge; the test must not invent one. Highlighting follows the selected platform component's connected-component behavior.
- `legacy-graph-explanation.json`: saved explanation without `questionPairs`, exercising the original generic evidence graph, its controls and nested Inspector.
- `protected-source-files.json`: task-specific SHA-256 snapshot of pre-existing unrelated plugin source. It is consumed by the independent evidence scope check, not by the permanent default test suite. Future authorized changes to other modules are not prohibited by this snapshot.

Presentation and normalization expectations use the selected platform contract (`openbkn-ai/bkn-studio` release/0.2.0, commit `90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535`). Fixture labels and business values are synthetic test markers, not production facts.
