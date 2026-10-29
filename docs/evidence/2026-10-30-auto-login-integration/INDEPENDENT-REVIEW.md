# Independent automatic-login source review

Scope: the automatic-login increment over main dd4b774 and the bounded credential-generation correction. This local independent review accepts the maintainer's explicit automatic private-platform trust policy; it does not substitute for the repository's non-author PR approval.

## Confirmed finding and correction

P1: an older MCP fiber retained a literal Authorization header while its fetch referenced mutable PrivatePlatformAccess. After identity replacement was authorized but before credential synchronization refreshed the fiber, a reconnect/request could send the older credential through the replacement connection. A loopback TLS rotation with the actual manager's captured configuration reproduced the crossing. This was a plugin credential-isolation defect, not a claim about a live account/platform incident.

The correction snapshots one authorized transport before resolving a token in MCP startup and each native reader. The bound fetch checks the returned generation and currently selected generation immediately before dispatch. It retains the original pin/redirect/date policies, official CLI/OAuth, UI and browser ownership; no token registry, polling, business arbitration or Host patch is added.

Three new source regressions fail before the fix and pass afterward. The same three regressions pass against the actual compiled classes, with only private exports added to a test-owned bundle copy. Context is a stand-in and TLS is loopback; this is not new native Host, Windows, browser, CLI authentication or live-platform acceptance.

The independent follow-up review approves the bounded correction and establishes no additional actionable defect in the three production-file edits. Repository-required non-author approval, CodeQL and final merge are recorded on the integration PR. Unknown original five-minute UI-stall causality and Windows exit-code/timing limits remain unchanged.
