# OpenAI / ChatGPT — Usage Data Spec

**Last updated:** 2026-03-24
**Access method:** REST API (admin key required for org-level data)
**Official API:** ✅ Yes — OpenAI Usage API + Cost API
**Grafana integration:** Via Infinity datasource or custom exporter

---

## Overview

OpenAI exposes two separate data surfaces depending on how you use the product:

1. **API usage (platform.openai.com)** — fully programmable via the Usage and Cost APIs.
   This covers all requests made through the OpenAI API: completions, images, embeddings,
   audio, etc. Granular, queryable, well-documented.

2. **ChatGPT Plus subscription (chat.openai.com)** — consumer product. **No API for
   usage data.** The only visibility is through the web UI or manual CSV export. If your
   primary use is the ChatGPT Plus web app rather than the API, usage telemetry is
   a manual process.

This spec covers the API surface. For ChatGPT Plus consumer tracking, see the Gaps section.

---

## Authentication

Two different key types are relevant:

| Key type              | Prefix           | Used for                              |
|-----------------------|------------------|---------------------------------------|
| Standard API key      | `sk-...`         | Making API calls (inference)          |
| Admin / org-level key | `sk-admin-...`   | Reading org-wide usage and billing    |

For Grafana integration, you need an **admin key** scoped to your organization. Generate
at: `platform.openai.com → Settings → API Keys → Create admin key`.

---

## API Endpoints

Base URL: `https://api.openai.com/v1`

All requests: `Authorization: Bearer <OPENAI_ADMIN_KEY>`

### Usage — Per-resource endpoints

| Endpoint                                                      | Tracks                              |
|---------------------------------------------------------------|-------------------------------------|
| `GET /organization/usage/completions`                         | Chat/completion tokens (input + output) |
| `GET /organization/usage/images`                              | Image generation (DALL-E)           |
| `GET /organization/usage/audio`                               | Whisper + TTS                       |
| `GET /organization/usage/embeddings`                          | text-embedding-* calls              |
| `GET /organization/usage/moderations`                         | Moderation API calls                |
| `GET /organization/usage/vector_stores`                       | Vector store storage (GB-days)      |
| `GET /organization/usage/code_interpreter_sessions`           | Code Interpreter compute sessions   |

### Cost

| Endpoint                        | Tracks                                      |
|---------------------------------|----------------------------------------------|
| `GET /organization/costs`       | Aggregate spend, daily granularity           |

### Billing (legacy — still works)

| Endpoint                                   | Tracks                             |
|--------------------------------------------|-------------------------------------|
| `GET /dashboard/billing/subscription`      | Plan, billing cycle, usage limits  |
| `GET /dashboard/billing/credit_grants`     | Remaining credits / prepaid balance |

---

## Query Parameters (Usage endpoints)

```
start_time    integer   Unix timestamp — required
end_time      integer   Unix timestamp — optional (defaults to now)
interval      string    "1d" (daily) or "1h" (hourly) — default "1d"
group_by[]    string[]  "model", "api_key_id", "project_id", "user_id"
limit         integer   Pagination page size
page          string    Pagination cursor
```

**Example — daily completions usage for the last 30 days:**

```bash
START=$(date -d "30 days ago" +%s)
curl "https://api.openai.com/v1/organization/usage/completions?start_time=${START}&interval=1d" \
  -H "Authorization: Bearer $OPENAI_ADMIN_KEY" | jq .
```

---

## Response Shape

```json
{
  "object": "list",
  "data": [
    {
      "aggregation_timestamp": 1710720000,
      "results": [
        {
          "input_tokens": 45231,
          "output_tokens": 12847,
          "num_model_requests": 183,
          "model_id": "gpt-4o",
          "project_id": "proj_abc123",
          "api_key_id": null,
          "cost_in_dollars": null
        }
      ]
    }
  ],
  "has_more": false,
  "next_page": null
}
```

Cost values appear in the `/organization/costs` endpoint (in USD, not cents).

---

## Available Metrics

| Metric                       | Type    | Unit    | Value dimension                    |
|------------------------------|---------|---------|------------------------------------|
| `input_tokens` per day       | counter | tokens  | Feature utilization, trend         |
| `output_tokens` per day      | counter | tokens  | Feature utilization, trend         |
| `num_model_requests` per day | counter | count   | Utilization rate                   |
| Cost per model per day       | gauge   | USD     | Cost/efficiency trend              |
| `code_interpreter_sessions`  | counter | count   | Productivity (agentic use)         |
| `vector_store` GB-days       | gauge   | GB-days | Infrastructure utilization         |
| Model distribution           | derived | %       | Feature utilization by model tier  |

### Value Analysis Dimensions

| Dimension           | Metric(s) to use                                               |
|---------------------|----------------------------------------------------------------|
| Feature utilization | Requests by model; which resource types are called             |
| Trend over time     | 30-day rolling token volume + cost trend by model              |
| Productivity impact | Code Interpreter sessions per week; output token volume        |

---

## Rate Limits (on the Usage API itself)

- No published rate limits on the admin reporting endpoints
- Daily granularity means you only need to poll once per day per endpoint
- Safe polling: once per hour if you want near-real-time; once per day for dashboards

---

## Data Freshness

- Usage data is available within **a few minutes** of API calls completing
- Cost data may lag up to **24 hours** for full accuracy
- Historical data available for the duration of your account (no rolling window)

---

## Grafana Integration

**Option A: Grafana Infinity datasource** (no-code, read-only)

Configure an Infinity datasource pointed at the usage endpoints with your admin key as
a bearer token header. Use JSONPath to extract the `data[].results[]` fields.

**Option B: Custom exporter script** (recommended for production)

A Python/Rust script that polls all usage endpoints daily, computes derived metrics
(cost per 1K tokens by model, request rate trends), and pushes to Prometheus push gateway
or Grafana Cloud via OTLP.

**Suggested Grafana dashboard panels:**
- Daily token consumption (stacked by model): area chart
- Monthly cost trend: line chart with 7d moving avg
- Model utilization breakdown: pie chart
- Cost per 1K tokens by model: bar chart (efficiency signal)
- Code Interpreter sessions per week: bar chart (productivity signal)

---

## Limitations & Gaps

**ChatGPT Plus (consumer subscription):**
- The `chat.openai.com` web interface has no API for usage data
- The only usable signal is conversation count (manual) and Projects feature
- Manual CSV export available but no programmatic access
- Workaround: treat ChatGPT Plus as a flat-rate subscription — value analysis
  is qualitative (features used: canvas, code execution, search, vision) rather
  than quantitative

**API-specific:**
- `group_by=user_id` only works in org accounts (multi-user); personal org shows single user
- Cost endpoint only shows API costs, not ChatGPT Plus subscription fee
- Historical export is limited to 1 year in some account tiers

---

## References

- [OpenAI Usage API Cookbook](https://cookbook.openai.com/examples/completions_usage_api)
- [Usage Dashboard (Legacy)](https://help.openai.com/en/articles/8554956-usage-dashboard-legacy)
- [Understanding Billing and Usage](https://help.openai.com/en/collections/3675945-understanding-openai-api-billing-and-usage)
