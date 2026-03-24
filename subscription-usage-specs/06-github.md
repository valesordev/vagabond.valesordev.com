# GitHub — Usage Data Spec

**Last updated:** 2026-03-24
**Access method:** GitHub REST API v3 + GraphQL API v4
**Official API:** ✅ Yes — Copilot Metrics API (GA Feb 2026), billing/actions endpoints
**Grafana integration:** Via Infinity datasource or custom exporter

---

## Overview

GitHub exposes usage data across several distinct domains:

1. **Copilot usage metrics** — code suggestions, acceptance rate, active users (GA as of
   Feb 27, 2026; old endpoints deprecated Apr 2, 2026)
2. **GitHub Actions billing** — compute minutes consumed per month
3. **Repository activity** — commits, PRs, code frequency, contributor stats
4. **Packages / LFS / Storage** — artifact and LFS storage billing

This spec focuses on the metrics most relevant to value analysis: Copilot productivity
signal and Actions compute consumption.

**⚠ Deprecation notice:** The legacy Copilot metrics endpoints
(`/orgs/{org}/copilot/usage` v1) are being retired **April 2, 2026**. Migrate to the
new endpoints documented below.

---

## Authentication

| Method                  | Recommended for                                          |
|-------------------------|----------------------------------------------------------|
| Personal Access Token   | Personal accounts and single-org access                  |
| Fine-grained PAT        | Preferred — scope to specific resources + expiry date    |
| GitHub App installation | Multi-org or automated pipelines                         |

**Required scopes for a fine-grained PAT:**

| Scope                                | Purpose                                        |
|--------------------------------------|------------------------------------------------|
| `read:org` (or `manage_billing:org`) | Billing and Actions usage                      |
| `copilot` (read)                     | Copilot seats and metrics                      |
| `repo` (read)                        | Repository activity stats                      |

Request header: `Authorization: Bearer <PAT>`
API version header: `X-GitHub-Api-Version: 2022-11-28`

---

## API Endpoints

Base URL: `https://api.github.com`

### Copilot Metrics (new GA endpoints)

| Endpoint                                            | Description                           |
|-----------------------------------------------------|---------------------------------------|
| `GET /orgs/{org}/copilot/metrics`                   | Org-level Copilot usage metrics       |
| `GET /enterprises/{enterprise}/copilot/metrics`     | Enterprise-level rollup               |
| `GET /orgs/{org}/teams/{team_slug}/copilot/metrics` | Team-level breakdown                  |

**Query parameters:**

```
since        string    ISO 8601 datetime — start of range (max 28 days)
until        string    ISO 8601 datetime — end of range
page         integer   Pagination
per_page     integer   Max 100
```

**Response shape:**

```json
[
  {
    "date": "2026-03-23",
    "total_active_users": 1,
    "total_engaged_users": 1,
    "copilot_ide_code_completions": {
      "total_engaged_users": 1,
      "total_code_suggestions": 148,
      "total_code_acceptances": 89,
      "total_code_lines_suggested": 412,
      "total_code_lines_accepted": 267,
      "editors": [
        {
          "name": "vscode",
          "total_engaged_users": 1,
          "models": [
            {
              "name": "gpt-4o-copilot",
              "total_code_suggestions": 148,
              "total_code_acceptances": 89,
              "total_code_lines_suggested": 412,
              "total_code_lines_accepted": 267,
              "languages": [
                { "name": "rust", "total_code_suggestions": 88, "total_code_acceptances": 67 },
                { "name": "typescript", "total_code_suggestions": 60, "total_code_acceptances": 22 }
              ]
            }
          ]
        }
      ]
    },
    "copilot_ide_chat": {
      "total_engaged_users": 1,
      "total_chats": 34,
      "total_chat_insertion_events": 12,
      "total_chat_copy_events": 8
    },
    "copilot_dotcom_chat": {
      "total_engaged_users": 0,
      "total_chats": 0
    },
    "copilot_dotcom_pull_requests": {
      "total_engaged_users": 0,
      "total_pr_summaries_created": 0
    }
  }
]
```

### Copilot Seat Management

```
GET /orgs/{org}/copilot/billing
GET /orgs/{org}/copilot/billing/seats
```

Returns: seat count, assigned users, last activity timestamps per seat.

### GitHub Actions Billing

```
GET /orgs/{org}/settings/billing/actions
```

**Response:**

```json
{
  "total_minutes_used": 847,
  "total_paid_minutes_used": 0,
  "included_minutes": 2000,
  "minutes_used_breakdown": {
    "UBUNTU": 712,
    "MACOS": 0,
    "WINDOWS": 135
  }
}
```

For individual repositories:

```
GET /repos/{owner}/{repo}/actions/cache/usage
GET /repos/{owner}/{repo}/stats/code_frequency
GET /repos/{owner}/{repo}/stats/commit_activity
GET /repos/{owner}/{repo}/stats/participation
```

### Storage Billing

```
GET /orgs/{org}/settings/billing/packages
GET /orgs/{org}/settings/billing/shared-storage
```

### Advanced Security (if licensed)

```
GET /orgs/{org}/settings/billing/advanced-security
```

---

## Available Metrics

| Metric                              | Type    | Unit    | Value dimension                       |
|-------------------------------------|---------|---------|---------------------------------------|
| `total_code_suggestions` per day    | counter | count   | Feature utilization                   |
| `total_code_acceptances` per day    | counter | count   | Productivity output                   |
| Acceptance rate (accept/suggest)    | gauge   | ratio   | Code quality / productivity signal    |
| `total_code_lines_accepted` per day | counter | LOC     | Productivity output                   |
| Language breakdown                  | counter | count   | Feature utilization by context        |
| Editor breakdown                    | counter | count   | Tool utilization                      |
| `total_chats` per day               | counter | count   | IDE chat feature utilization          |
| `total_minutes_used` per month      | gauge   | minutes | Actions compute utilization           |
| `included_minutes` vs used          | derived | %       | Actions budget utilization %          |
| Commit frequency per week           | gauge   | count   | Development activity trend            |

### Value Analysis Dimensions

| Dimension           | Metric(s) to use                                                        |
|---------------------|-------------------------------------------------------------------------|
| Feature utilization | Acceptance rate; editor + language breakdown; chat vs. completion ratio |
| Trend over time     | 28-day acceptance rate trend; lines accepted per week; chat volume      |
| Productivity impact | LOC accepted per day; insert events from chat; PR summaries created     |

---

## Data Freshness

- Copilot metrics: **daily** — data for a given day available within a few hours of midnight UTC
- Actions billing: **near-real-time** within the billing month
- Repository stats (commit_activity, etc.): computed on-demand; may be 0 if cache is cold
  (retry after 60s if first response returns 202 Accepted)

---

## Grafana Integration

### Option A: Grafana Infinity datasource

The Copilot metrics endpoint returns clean daily JSON arrays — well-suited for Infinity.
Configure:
- URL: `https://api.github.com/orgs/{org}/copilot/metrics?since=...`
- Auth: Bearer token (PAT in Grafana datasource secrets)
- Parser: JSON, JSONPath for nested fields (`$.copilot_ide_code_completions.total_code_acceptances`)

### Option B: Custom exporter (recommended for time-series retention)

GitHub only returns 28 days of history from the Copilot metrics endpoint. To build a
longer retention dataset, you need a daily collector that appends to a time-series store:

```bash
# Cron daily: fetch yesterday's metrics, push to Prometheus push gateway
DATE=$(date -d yesterday +%Y-%m-%dT00:00:00Z)
curl "https://api.github.com/orgs/${ORG}/copilot/metrics?since=${DATE}&until=$(date +%Y-%m-%dT00:00:00Z)" \
  -H "Authorization: Bearer $GH_PAT" \
  -H "X-GitHub-Api-Version: 2022-11-28" | ./push-to-prometheus.sh
```

**Pre-built tool:** The `github-copilot-resources/copilot-metrics-viewer` project
provides a reference visualization you can adapt.

---

## Limitations & Gaps

- **28-day history limit:** The Copilot metrics API only returns up to 28 days of data
  per request. Historical analysis requires your own time-series store.
- **Personal account vs. org:** Some endpoints require an org context. If you use Copilot
  under a personal account (not an org), seat-level billing endpoints return errors.
  The metrics endpoint works for personal accounts.
- **Copilot model identity:** The `model` field in the response reflects the underlying
  model Copilot is using (e.g., `gpt-4o-copilot`), but this is GitHub-controlled and
  may not map directly to OpenAI model SKUs for cost comparison.
- **No direct $ cost API:** Actions billing shows minutes but not dollar amount — you
  must apply the per-minute rate manually for your runner OS type.
- **Rate limits:** GitHub REST API: 5,000 requests/hour for authenticated PATs.
  Copilot metrics endpoints do not count against this limit separately.

---

## References

- [GitHub Copilot usage metrics concepts](https://docs.github.com/en/copilot/concepts/copilot-usage-metrics/copilot-metrics)
- [REST API: Copilot metrics endpoints](https://docs.github.com/en/rest/copilot/copilot-metrics?apiVersion=2022-11-28)
- [Copilot metrics GA announcement (Feb 2026)](https://github.blog/changelog/2026-02-27-copilot-metrics-is-now-generally-available/)
- [copilot-metrics-viewer](https://github.com/github-copilot-resources/copilot-metrics-viewer)
- [microsoft/copilot-metrics-dashboard](https://github.com/microsoft/copilot-metrics-dashboard)
