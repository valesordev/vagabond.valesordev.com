# Grafana Integration Strategy & Unified Data Model

**Last updated:** 2026-03-24
**Target:** Grafana Cloud (existing Vagabond observability stack)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Data Sources                            │
│                                                             │
│  Starlink        Raspberry Pi gRPC → Prometheus exporter    │
│  OpenAI          Daily cron → custom collector              │
│  Anthropic       Native Grafana Cloud integration           │
│  Google Gemini   GCP Cloud Monitoring datasource plugin     │
│  Google Workspace  Daily cron → custom collector            │
│  GitHub          Daily cron → custom collector              │
└──────────────────────────┬──────────────────────────────────┘
                           │
               ┌───────────▼────────────┐
               │   Collection Layer     │
               │                        │
               │  Prometheus metrics    │
               │  (push gateway or      │
               │   remote_write via     │
               │   Alloy agent)         │
               └───────────┬────────────┘
                           │
               ┌───────────▼────────────┐
               │    Grafana Cloud       │
               │                        │
               │  Prometheus (metrics)  │
               │  Native integrations   │
               │  (Anthropic, GCP)      │
               └────────────────────────┘
```

The Vagabond stack already has Grafana Alloy configured on the Raspberry Pi and uses
Grafana Cloud for the optional observability profile. The subscription monitoring pipeline
slots into the same infrastructure — it is not a separate system.

---

## Recommended Integration Method Per Service

| Service           | Integration method                                  | Effort     |
|-------------------|-----------------------------------------------------|------------|
| Starlink          | Prometheus exporter (danopstech/starlink) on Pi     | Low        |
| Anthropic/Claude  | Native Grafana Cloud integration                    | Very low   |
| Google Gemini     | GCP Cloud Monitoring datasource plugin              | Low        |
| Google Workspace  | Custom Python collector → Prometheus push gateway   | Medium     |
| OpenAI/ChatGPT    | Custom Python collector → Prometheus push gateway   | Medium     |
| GitHub            | Custom Python/shell collector → push gateway        | Medium     |

---

## Unified Label Schema

All metrics pushed to Prometheus should carry a consistent label set to enable
cross-service queries and comparisons on a single dashboard.

```
service         string   "starlink" | "anthropic" | "openai" | "gemini" |
                         "google_workspace" | "github"
category        string   "connectivity" | "ai_api" | "productivity" | "devtools"
model           string   Model name where applicable (e.g. "claude-sonnet-4-6")
feature         string   Specific feature (e.g. "code_completion" | "chat" | "gmail")
```

---

## Unified Metric Namespace

Use a consistent prefix for all custom subscription metrics: `sub_`

### Connectivity (Starlink)

```
sub_starlink_throughput_down_bps          gauge
sub_starlink_throughput_up_bps            gauge
sub_starlink_throughput_down_bytes_total  counter
sub_starlink_throughput_up_bytes_total    counter
sub_starlink_latency_ms                   gauge
sub_starlink_packet_loss_ratio            gauge    # 0.0–1.0
sub_starlink_obstruction_ratio            gauge    # 0.0–1.0
sub_starlink_uptime_seconds_total         counter
sub_starlink_connected                    gauge    # 0 or 1 (boolean)
```

### AI API Usage (Anthropic, OpenAI, Gemini)

```
sub_ai_input_tokens_total        counter   labels: service, model
sub_ai_output_tokens_total       counter   labels: service, model
sub_ai_requests_total            counter   labels: service, model
sub_ai_cost_usd_total            counter   labels: service, model
sub_ai_cache_hit_tokens_total    counter   labels: service, model   # Anthropic only
sub_ai_error_total               counter   labels: service, model, error_code
sub_ai_latency_ms                histogram labels: service, model   # p50/p95/p99
```

### AI Developer Tools (GitHub Copilot, Claude Code)

```
sub_devai_suggestions_total       counter   labels: service, feature, language, editor
sub_devai_acceptances_total       counter   labels: service, feature, language, editor
sub_devai_lines_suggested_total   counter   labels: service, language
sub_devai_lines_accepted_total    counter   labels: service, language
sub_devai_sessions_total          counter   labels: service, feature
sub_devai_chats_total             counter   labels: service, editor
sub_devai_acceptance_ratio        gauge     labels: service, language   # derived: accept/suggest
```

### Productivity Suite (Google Workspace)

```
sub_workspace_active_users          gauge     labels: service, app
sub_workspace_emails_sent_total     counter   labels: app="gmail"
sub_workspace_files_created_total   counter   labels: app, file_type
sub_workspace_meet_minutes_total    counter   labels: app="meet"
sub_workspace_storage_used_bytes    gauge     labels: service, app
sub_workspace_gemini_events_total   counter   labels: app   # Gemini in Workspace
```

### DevOps (GitHub Actions)

```
sub_github_actions_minutes_used    gauge    labels: runner_os
sub_github_actions_minutes_quota   gauge    labels: runner_os
sub_github_commits_total           counter  labels: repo
sub_github_pr_merged_total         counter  labels: repo
```

---

## Collection Script Architecture

A single Python script (or small Rust binary) acts as the unified collector for the
services that don't have native integrations. Suggested structure:

```
subscription-collector/
├── collector.py           # main entrypoint; runs all collectors on schedule
├── collectors/
│   ├── openai.py          # hits OpenAI usage + cost APIs
│   ├── workspace.py       # hits Admin SDK Reports API
│   └── github.py          # hits GitHub Copilot + billing APIs
├── prometheus_push.py     # pushes metrics to Prometheus push gateway
├── config.yaml            # API keys, org IDs, project IDs, schedule
└── Dockerfile             # for running on Raspberry Pi or as sidecar
```

**Schedule:** Daily at 02:00 UTC (all APIs have at minimum 1-day granularity; no need
for sub-hourly polling except Starlink which is handled by the on-Pi exporter).

**Push destination:**

```yaml
# config.yaml
prometheus_push_gateway: "https://<user>:<api_key>@prometheus-prod-XX.grafana.net/api/prom/push"
```

This is the same remote_write endpoint already used by the Vagabond Alloy agent —
no new infrastructure required.

---

## Value Analysis Dashboard Design

### Dashboard: "Subscription ROI"

**Row 1 — AI Spend & Utilization**
- Panel: Monthly AI API cost by service (stacked bar: Anthropic, OpenAI, Gemini)
- Panel: Token volume trend 30d by service (line chart)
- Panel: Cost per 1K output tokens by model (bar — efficiency signal)
- Panel: AI requests per day by service (bar)

**Row 2 — Developer Productivity (AI-assisted)**
- Panel: Copilot acceptance rate trend 28d (line)
- Panel: Copilot lines accepted per day (area chart)
- Panel: Claude Code sessions per day (bar)
- Panel: Claude Code acceptance rate trend (line)
- Panel: Language breakdown for accepted suggestions (pie)

**Row 3 — Connectivity (Starlink)**
- Panel: Daily data consumption (up + down, stacked area)
- Panel: Average latency trend (line)
- Panel: Uptime % per calendar day (stat panel)
- Panel: Packet loss heatmap by hour

**Row 4 — Google Workspace Activity**
- Panel: Gemini interactions per app per week (stacked bar)
- Panel: Meet minutes per week (bar)
- Panel: Drive files created per day (line)
- Panel: Gmail sent/received per day (line)

**Row 5 — GitHub DevOps**
- Panel: Actions minutes used vs. quota this month (gauge)
- Panel: Commits per week across repos (bar)
- Panel: PRs merged per week (bar)

**Row 6 — Cross-service Value Summary**
- Panel: Monthly subscription cost (flat rates, manual input) vs. API usage cost (table)
- Panel: Feature utilization score per service (custom derived, 0–100%) — see below

---

## Feature Utilization Score

A derived metric that answers "what % of the features I'm paying for am I actually using?"

**Per service heuristic:**

```
anthropic:    (models_used / models_available) * weight_requests_per_day
openai:       (resource_types_used / 7) * weight_volume   # 7 resource endpoint types
github:       (copilot_engaged_days / billing_days) * acceptance_rate
workspace:    (apps_with_activity / apps_licensed) * activity_density
gemini:       requests_per_day > 0 ? 1.0 : 0.0   # binary for AI Studio free tier
starlink:     connected_hours / total_hours_in_service_period
```

These are intentionally simple — the goal is a directional signal for the "is this
subscription earning its keep?" question, not a precise ROI model.

---

## Secrets Management

All API keys and tokens should be stored in a single secrets file, not in the collector
config, and never committed to the Vagabond repo:

```
~/.subscription-collector/secrets.env
  ANTHROPIC_ADMIN_KEY=sk-ant-admin...
  OPENAI_ADMIN_KEY=sk-admin-...
  GITHUB_PAT=github_pat_...
  GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/sa.json
  GCP_PROJECT_ID=my-project-123
  PROMETHEUS_PUSH_URL=https://...
```

On the Raspberry Pi, these can be injected as Docker secrets or environment variables
in the systemd unit.

---

## Implementation Priority Order

Given that native integrations reduce effort most:

1. **Anthropic** — enable native Grafana Cloud integration today (zero code)
2. **Gemini** — add Google Cloud Monitoring datasource in Grafana Cloud (15min)
3. **Starlink** — deploy `danopstech/starlink` sidecar on Raspberry Pi (30min)
4. **GitHub** — write simple daily cron calling Copilot metrics API (2–3hr)
5. **OpenAI** — extend the same cron collector with OpenAI endpoints (1–2hr)
6. **Google Workspace** — requires service account + domain-wide delegation setup (2–3hr)
