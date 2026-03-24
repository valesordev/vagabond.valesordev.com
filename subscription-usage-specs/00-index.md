# Subscription Usage Monitoring — Spec Index

**Created:** 2026-03-24
**Purpose:** Technical specifications for ingesting usage data from subscription services
into Grafana Cloud for utilization tracking and value analysis.

**Value dimensions tracked:** feature utilization, usage trends over time, productivity impact

---

## Specs

| File                        | Service              | API available? | Grafana path               | Effort |
|-----------------------------|----------------------|----------------|----------------------------|--------|
| `01-starlink.md`            | Starlink             | ✅ (unofficial) | Prometheus exporter on Pi  | Low    |
| `02-openai-chatgpt.md`      | OpenAI / ChatGPT     | ✅ (API tier)   | Custom collector           | Medium |
| `03-anthropic-claude.md`    | Anthropic / Claude   | ✅              | Native Grafana integration | Low    |
| `04-google-gemini.md`       | Google Gemini        | ✅              | GCP Monitoring plugin      | Low    |
| `05-google-workspace.md`    | Google Workspace     | ✅              | Custom collector           | Medium |
| `06-github.md`              | GitHub               | ✅              | Custom collector           | Medium |
| `07-grafana-strategy.md`    | All services         | —              | Unified data model + arch  | —      |

---

## Quick Start (priority order)

1. Enable the **Anthropic native Grafana Cloud integration** — zero code, highest signal
2. Add **Google Cloud Monitoring datasource** for Gemini
3. Deploy **danopstech/starlink** exporter on the Raspberry Pi (alongside existing Alloy)
4. Write the **unified Python collector** for OpenAI + GitHub + Google Workspace
   using the metric namespace defined in `07-grafana-strategy.md`

---

## Key Design Decisions

**All metrics pushed to Grafana Cloud via Prometheus remote_write** — same endpoint
already used by the Vagabond Alloy agent. No new infrastructure required.

**Unified label schema** (`service`, `category`, `model`, `feature`) enables
cross-service queries on a single dashboard. See `07-grafana-strategy.md`.

**28-day Copilot history limit** — GitHub's API only returns 28 days. Requires a
daily collector to build longer retention. Start collecting now if you want trends.

**Google Workspace 6-month retention limit** — Set up BigQuery export immediately
if year-over-year comparisons matter to you.

**ChatGPT Plus (consumer) has no API** — usage analysis for the web app is qualitative.
Track which features you use (canvas, voice, code execution, search) in a separate
qualitative log.

---

## Services Not Yet Specced

You mentioned "a few other subscription services" — candidates to add specs for:

- **1Password** — no usage API (flat rate; qualitative only)
- **Notion** — no usage API; track via workspace audit log if on Team plan
- **Tailscale** — has a management API with device/network stats
- **Cloudflare** — has a GraphQL Analytics API (DNS queries, Workers usage, etc.)
- **Linear** — has a GraphQL API with issue/cycle activity data
- **Cursor / Windsurf** — no public usage API as of 2026-03
- **AWS / GCP / Azure** — Cost Explorer / Cloud Billing APIs; significant scope

Let me know which additional services to spec out.
