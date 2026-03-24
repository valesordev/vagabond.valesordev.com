# Anthropic / Claude — Usage Data Spec

**Last updated:** 2026-03-24
**Access method:** REST API (Admin API key)
**Official API:** ✅ Yes — Usage & Cost Admin API
**Grafana integration:** ✅ Native Grafana Cloud integration exists

---

## Overview

Anthropic provides a first-class Usage & Cost Admin API with granular breakdowns by
workspace, API key, model, and service tier. Importantly, there is a **native Grafana
Cloud integration** (the Anthropic integration for Grafana Cloud) that handles data
ingestion without a custom exporter — this should be your first option.

As with OpenAI, there are two usage surfaces:
1. **Anthropic API (api.anthropic.com)** — fully programmable; this spec covers this
2. **Claude.ai web subscription** — consumer product; limited programmatic access
   (conversation counts not exposed via API as of 2026-03)

---

## Authentication

| Key type          | Prefix             | Where to generate                                 |
|-------------------|--------------------|---------------------------------------------------|
| Standard API key  | `sk-ant-api...`    | console.anthropic.com → API Keys                 |
| Admin API key     | `sk-ant-admin...`  | console.anthropic.com → Settings → Admin API Keys |

The usage and cost report endpoints **require an Admin API key**. Only organization
admins can create these. Store separately from standard API keys.

Request header: `x-api-key: <ADMIN_KEY>`

---

## API Endpoints

Base URL: `https://api.anthropic.com`

Anthropic-Version header: `anthropic-version: 2023-06-01`

### Usage Reports

| Endpoint                                               | Tracks                                         |
|--------------------------------------------------------|------------------------------------------------|
| `GET /v1/organizations/usage_report/messages`          | Token consumption per model/workspace/key      |
| `GET /v1/organizations/usage_report/claude_code`       | Claude Code sessions, dev productivity metrics |

### Cost Reports

| Endpoint                                    | Tracks                                      |
|---------------------------------------------|----------------------------------------------|
| `GET /v1/organizations/cost_report`         | USD spend by time range, workspace, model    |

---

## Query Parameters

```
start_date        string    ISO 8601 date — required (e.g. "2026-01-01")
end_date          string    ISO 8601 date — optional
workspace_id      string    Filter to specific workspace
api_key_id        string    Filter to specific API key
model             string    Filter to specific model (e.g. "claude-opus-4-6")
granularity       string    "daily" or "monthly" — default "daily"
limit             integer   Page size
next_page         string    Pagination cursor
```

**Example — daily token usage for the last 30 days:**

```bash
curl "https://api.anthropic.com/v1/organizations/usage_report/messages?start_date=2026-02-22&granularity=daily" \
  -H "x-api-key: $ANTHROPIC_ADMIN_KEY" \
  -H "anthropic-version: 2023-06-01" | jq .
```

---

## Response Shape (Messages Report)

```json
{
  "data": [
    {
      "date": "2026-03-23",
      "model": "claude-sonnet-4-6",
      "workspace_id": "wrkspc_abc123",
      "api_key_id": "apikey_xyz456",
      "input_tokens": 128450,
      "output_tokens": 34211,
      "cache_read_input_tokens": 52000,
      "cache_write_input_tokens": 15000,
      "num_requests": 412
    }
  ],
  "next_page": null,
  "has_more": false
}
```

Notable: cache read/write tokens are broken out separately — important for computing
true cost since cached tokens are billed at a reduced rate.

---

## Claude Code Analytics Response

```json
{
  "data": [
    {
      "date": "2026-03-23",
      "num_active_users": 1,
      "num_sessions": 14,
      "total_lines_of_code_generated": 847,
      "num_code_acceptances": 231,
      "acceptance_rate": 0.72,
      "total_input_tokens": 95000,
      "total_output_tokens": 28000
    }
  ]
}
```

---

## Available Metrics

| Metric                         | Type    | Unit    | Value dimension                       |
|--------------------------------|---------|---------|---------------------------------------|
| `input_tokens` per day         | counter | tokens  | Feature utilization, trend            |
| `output_tokens` per day        | counter | tokens  | Feature utilization, trend            |
| `cache_read_input_tokens`      | counter | tokens  | Cache efficiency (cost proxy)         |
| `num_requests` per day         | counter | count   | Utilization rate                      |
| USD cost per model per day     | gauge   | USD     | Cost trend                            |
| `num_sessions` (Claude Code)   | counter | count   | Developer productivity                |
| `acceptance_rate` (Claude Code)| gauge   | ratio   | Productivity signal (code quality)    |
| `lines_of_code_generated`      | counter | LOC     | Productivity output metric            |
| Model distribution             | derived | %       | Feature utilization by tier           |

### Value Analysis Dimensions

| Dimension           | Metric(s) to use                                                     |
|---------------------|----------------------------------------------------------------------|
| Feature utilization | `num_requests` by model; cache hit rate; Claude Code vs. direct API  |
| Trend over time     | 30-day rolling token volume + cost; acceptance rate trend            |
| Productivity impact | Claude Code: LOC generated, acceptance rate, sessions per day        |

---

## Data Freshness

- Usage and cost data typically available within **5 minutes** of request completion
- Occasional delays; do not assume real-time for SLA purposes
- Historical data: full retention for the lifetime of the organization

---

## Grafana Integration

### Option A: Native Grafana Cloud integration (recommended)

Anthropic publishes an official Grafana Cloud integration. This is the path of least
resistance given you already use Grafana Cloud in the Vagabond observability stack.

Setup:
1. In Grafana Cloud: `Connections → Add new connection → Search "Anthropic"`
2. Provide your Admin API key
3. Pre-built dashboards for token usage, cost trends, and model breakdown are provisioned
   automatically

Reference: [Grafana Labs blog post on the Anthropic integration](https://grafana.com/blog/how-to-monitor-claude-usage-and-costs-introducing-the-anthropic-integration-for-grafana-cloud/)

### Option B: Custom exporter

If you want to unify all AI service metrics into a single custom pipeline:

```python
# Pseudocode — daily cron
response = GET /v1/organizations/usage_report/messages?start_date=yesterday&granularity=daily
for row in response.data:
    push_to_prometheus({
        "ai_api_input_tokens_total": row.input_tokens,
        "ai_api_output_tokens_total": row.output_tokens,
        "ai_api_requests_total": row.num_requests,
        labels: {"service": "anthropic", "model": row.model}
    })
```

---

## Limitations & Gaps

**Claude.ai web subscription:**
- Consumer usage (claude.ai) is not reflected in the Admin API
- No API endpoint exposes conversation count, features used, or session activity
  for the web/desktop product
- Feature tracking is manual: note which capabilities you actually use
  (Projects, extended thinking, voice, artifacts, Cowork mode, etc.)

**API-specific:**
- Cost report and usage report are separate endpoints — you must join them client-side
  on (date, model, workspace_id) if you want cost-per-token derived metrics
- Cache token pricing varies by model; factor this into cost calculations

---

## References

- [Usage and Cost API docs](https://platform.claude.com/docs/en/build-with-claude/usage-cost-api)
- [Claude Code Analytics API](https://docs.anthropic.com/en/api/claude-code-analytics-api)
- [Anthropic Grafana Cloud integration blog](https://grafana.com/blog/how-to-monitor-claude-usage-and-costs-introducing-the-anthropic-integration-for-grafana-cloud/)
