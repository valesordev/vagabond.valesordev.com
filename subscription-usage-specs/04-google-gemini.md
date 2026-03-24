# Google Gemini — Usage Data Spec

**Last updated:** 2026-03-24
**Access method:** Google Cloud Monitoring API (Stackdriver) + AI Studio Dashboard
**Official API:** ✅ Yes — via Google Cloud Monitoring API v3
**Grafana integration:** Via Google Cloud Monitoring datasource plugin

---

## Overview

Gemini API usage data flows through **Google Cloud Monitoring** (formerly Stackdriver),
the same observability layer used by all Google Cloud services. If you access Gemini
through **Google AI Studio** (the consumer/developer tier), your project is a standard
GCP project and your usage metrics are available in Cloud Monitoring.

There are two entry points for Gemini:
1. **Google AI Studio (ai.google.dev)** — developer/consumer access; free tier + pay-as-you-go
2. **Vertex AI (cloud.google.com/vertex-ai)** — enterprise access with stricter SLAs

This spec covers the AI Studio path (most likely your setup). Vertex AI is architecturally
similar but uses different metric namespaces.

---

## Authentication

Cloud Monitoring API uses standard Google Cloud auth:

| Method              | Use case                                           |
|---------------------|----------------------------------------------------|
| Service account key | Automated collection (recommended for exporters)   |
| ADC (gcloud auth)   | Local development / one-off queries                |
| OAuth 2.0           | User-delegated (less useful for dashboards)         |

**Required IAM roles:**
- `roles/monitoring.viewer` — read Cloud Monitoring metrics
- `roles/serviceusage.serviceUsageConsumer` — read API usage data

**Required API to enable in GCP:**
- `monitoring.googleapis.com`
- `cloudresourcemanager.googleapis.com`

---

## API Endpoints

Base URL: `https://monitoring.googleapis.com/v3`

### Metric Descriptor — what to query

| Metric type (full path)                                         | Description                          |
|-----------------------------------------------------------------|--------------------------------------|
| `aiplatform.googleapis.com/publisher/model/request_count`       | Total API requests                   |
| `aiplatform.googleapis.com/publisher/model/token_count`         | Tokens (input + output, labeled)     |
| `aiplatform.googleapis.com/publisher/online_serving/request_count` | Serving-layer request count       |
| `aiplatform.googleapis.com/publisher/online_serving/token_count`  | Serving-layer token count          |

For AI Studio projects (not Vertex), metrics may appear under:
- `generativelanguage.googleapis.com/api_usage` — API call counts

**List available metrics for your project:**

```bash
gcloud auth application-default login
curl "https://monitoring.googleapis.com/v3/projects/${PROJECT_ID}/metricDescriptors" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" | jq '.metricDescriptors[].type' | grep -i ai
```

### Time Series Query (main endpoint)

```
GET /v3/projects/{project_id}/timeSeries
  ?filter=metric.type="aiplatform.googleapis.com/publisher/model/token_count"
  &interval.startTime=2026-02-22T00:00:00Z
  &interval.endTime=2026-03-24T00:00:00Z
  &aggregation.alignmentPeriod=86400s
  &aggregation.perSeriesAligner=ALIGN_SUM
  &aggregation.crossSeriesReducer=REDUCE_SUM
  &aggregation.groupByFields=metric.labels.model_id
```

---

## Available Metrics

| Metric                     | Type    | Unit    | Labels available                      |
|----------------------------|---------|---------|---------------------------------------|
| Request count              | counter | count   | model_id, status                      |
| Input token count          | counter | tokens  | model_id                              |
| Output token count         | counter | tokens  | model_id                              |
| Error count                | counter | count   | model_id, error_code                  |
| Latency (p50/p95/p99)      | dist.   | ms      | model_id                              |

**Rate limit tracking (from AI Studio dashboard):**
- Requests Per Minute (RPM)
- Tokens Per Minute (TPM)
- Requests Per Day (RPD)

These are visible in the AI Studio dashboard UI but not directly queryable via
Cloud Monitoring as of 2026-03. Check the quota API for rate limit burn:

```bash
curl "https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/generativelanguage.googleapis.com/consumerQuotaMetrics" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"
```

---

## AI Studio Dashboard (Manual Reference)

For features not yet in the API:
- **URL:** `https://aistudio.google.com/` → Dashboard → Usage
- Shows: request counts, error rates, token usage, cost per model, rate limit gauge
- As of March 2026, the dashboard shows cost breakdown by model and per-project
  views across imported projects
- No CSV export as of 2026-03; API is the only programmatic path

---

## Value Analysis Dimensions

| Dimension           | Metric(s) to use                                                  |
|---------------------|-------------------------------------------------------------------|
| Feature utilization | Request count by model_id; which Gemini model tiers are used      |
| Trend over time     | 30-day token trend by model; cost per 1K tokens trend             |
| Productivity impact | Latency percentiles (high latency = friction); error rate trend   |

---

## Data Freshness

- Cloud Monitoring metrics have a **3–5 minute** ingestion delay
- Time series data is retained for 6 weeks by default for custom metrics;
  `aiplatform.*` system metrics are retained longer (check your GCP tier)
- For historical analysis beyond 6 weeks: export to BigQuery via log sinks

---

## Grafana Integration

### Option A: Google Cloud Monitoring datasource plugin (recommended)

Grafana has a first-party plugin for Google Cloud Monitoring:

1. In Grafana Cloud: `Connections → Data Sources → Add → Google Cloud Monitoring`
2. Auth: upload service account JSON or use Workload Identity
3. Query builder supports metric type selection and label-based grouping
4. Pre-built dashboard: `Grafana Dashboards → Google Cloud Monitoring` library

**Plugin ID:** `grafana-googlecloud-monitoring-datasource`

This is the cleanest path — no custom exporter needed.

### Option B: Custom exporter pushing to Prometheus

```python
from google.cloud import monitoring_v3
# Query time series, convert to Prometheus format, push to push gateway
# Label as: service="gemini", model="gemini-2.0-flash"
```

---

## Limitations & Gaps

- **Free tier (no billing account):** Metrics may not appear in Cloud Monitoring.
  A billing account must be linked to the GCP project to get full metric visibility.
- **AI Studio consumer tier vs. Vertex AI:** Metric namespace differs. If you switch
  between AI Studio and Vertex AI, update the metric type paths.
- **Gemini in Google Workspace (Workspace add-on):** Tracked separately via the
  Google Workspace Admin SDK Reports API — see spec `05-google-workspace.md`.
  Do not conflate with Gemini API usage.
- **Cost data:** Billing data flows through Google Cloud Billing API
  (`cloudbilling.googleapis.com`) not Cloud Monitoring. Separate integration needed.

---

## References

- [Google Cloud Monitoring API docs](https://docs.cloud.google.com/apis/docs/monitoring)
- [Gemini API billing](https://ai.google.dev/gemini-api/docs/billing)
- [Firebase AI Logic monitoring](https://firebase.google.com/docs/ai-logic/monitoring)
- [Google Cloud Monitoring Grafana plugin](https://grafana.com/grafana/plugins/grafana-googlecloud-monitoring-datasource/)
