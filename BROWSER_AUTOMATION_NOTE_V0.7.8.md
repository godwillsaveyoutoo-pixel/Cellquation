# Browser automation note — v0.7.8 RC

The container's Chromium policy blocks both localhost and `file://` navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`), so this RC could not honestly claim a fresh end-to-end Chromium run inside this sandbox.

The release audit therefore uses syntax, dependency, asset, content, state-wiring and source-invariant checks. The final acceptance gate remains a real browser/device smoke test, especially on the low-end Android targets.
