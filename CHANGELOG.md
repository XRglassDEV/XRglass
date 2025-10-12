# Changelog

## v0.3.0 – HTTP RPC + StatusBadge auto-refresh + AnalyticsBar + Watchlist v2

- Merge "Fix types for RPC helper and verdict normalization" to stabilize the HTTP RPC flow.
- Normalize logged verdict values to the known set before storing history.
- Tighten RPC helper typings to surface success metadata (node, latency) or explicit failure markers.
