# Google Workspace — Usage Data Spec

**Last updated:** 2026-03-24
**Access method:** Admin SDK Reports API (REST)
**Official API:** ✅ Yes — Google Admin SDK Reports API v1
**Grafana integration:** Via Google Cloud Monitoring plugin or Infinity datasource

---

## Overview

Google Workspace exposes usage data through two complementary Admin SDK APIs:

1. **Reports API** — historical usage by user and application (Gmail, Drive, Meet, Chat,
   Calendar, Docs, Sheets, Slides, etc.), plus Gemini in Workspace activity
2. **Audit Log API** — admin and user activity events (login, file share, permission
   changes, etc.)

Access requires a **Workspace Admin account** — a standard user cannot call these APIs.
For a personal Google Workspace (single domain admin), you are both the admin and the
subject user.

---

## Authentication

Google Workspace Admin API requires OAuth 2.0 with **domain-wide delegation** for
service accounts, or standard OAuth for admin user credentials.

**Recommended setup for automated collection:**

1. Create a service account in GCP (`iam.googleapis.com`)
2. Enable domain-wide delegation on the service account
3. In Workspace Admin Console: Security → API Controls → Domain-wide delegation →
   Add the service account with the scopes below
4. The service account impersonates an admin user when calling the API

**Required OAuth scopes:**

| Scope                                                               | Purpose                    |
|---------------------------------------------------------------------|----------------------------|
| `https://www.googleapis.com/auth/admin.reports.usage.readonly`      | Usage reports              |
| `https://www.googleapis.com/auth/admin.reports.audit.readonly`      | Audit logs                 |

**Client library:**

```
pip install google-api-python-client google-auth
```

---

## API Endpoints

Base URL: `https://admin.googleapis.com/admin/reports/v1`

### Customer-Level Usage (aggregate across all users)

```
GET /usage/dates/{date}
  ?parameters=accounts:num_1day_actv_users,gmail:num_emails_sent,...
```

### User-Level Usage

```
GET /usage/users/{userKey}/dates/{date}
  ?parameters=gmail:num_emails_sent,drive:num_items_created,...
```

### Activity Reports (per-application events)

```
GET /activity/users/all/applications/{applicationName}
  ?startTime=2026-02-22T00:00:00Z
  &endTime=2026-03-24T00:00:00Z
```

Valid `applicationName` values: `gmail`, `drive`, `meet`, `chat`, `calendar`,
`admin`, `login`, `token`, `groups`, `gemini`

---

## Available Metrics by Application

### Accounts / Platform

| Parameter                          | Description                            |
|------------------------------------|----------------------------------------|
| `accounts:num_1day_actv_users`     | Users active in last 1 day             |
| `accounts:num_7day_actv_users`     | Users active in last 7 days            |
| `accounts:num_30day_actv_users`    | Users active in last 30 days           |
| `accounts:used_quota_in_mb`        | Storage quota used (MB)                |
| `accounts:total_quota_in_mb`       | Total storage quota (MB)               |

### Gmail

| Parameter                          | Description                            |
|------------------------------------|----------------------------------------|
| `gmail:num_emails_sent`            | Emails sent by user                    |
| `gmail:num_emails_received`        | Emails received                        |
| `gmail:num_spam_emails_received`   | Spam count                             |
| `gmail:used_quota_in_mb`           | Gmail storage used                     |
| `gmail:last_interaction_time`      | Last activity timestamp                |

### Google Drive

| Parameter                          | Description                            |
|------------------------------------|----------------------------------------|
| `drive:num_items_created`          | Files created                          |
| `drive:num_items_edited`           | Files edited                           |
| `drive:num_items_viewed`           | Files viewed                           |
| `drive:used_quota_in_bytes`        | Drive storage consumed                 |
| `drive:num_docs_created`           | Google Docs created specifically       |
| `drive:num_sheets_created`         | Google Sheets created specifically     |
| `drive:num_slides_created`         | Google Slides created specifically     |

### Google Meet

| Parameter                           | Description                           |
|-------------------------------------|---------------------------------------|
| `meet:video_call_count`             | Number of video calls initiated       |
| `meet:total_call_minutes`           | Total call duration (minutes)         |
| `meet:calls_with_external_count`    | Calls with users outside domain       |

### Google Chat

| Parameter                           | Description                           |
|-------------------------------------|---------------------------------------|
| `chat:num_messages_sent`            | Messages sent                         |
| `chat:num_groups_with_posts`        | Active group conversations            |

### Gemini in Workspace (as of 2025)

Available via the `gemini` application activity report:

| Event type                          | Description                           |
|-------------------------------------|---------------------------------------|
| `gemini_app_used`                   | Gemini app standalone interaction     |
| `gemini_for_gmail_used`             | Gemini-assisted Gmail interaction     |
| `gemini_for_docs_used`              | Gemini-assisted Docs interaction      |
| `gemini_for_sheets_used`            | Gemini-assisted Sheets interaction    |
| `gemini_for_slides_used`            | Gemini-assisted Slides interaction    |
| `gemini_for_meet_used`              | Gemini-assisted Meet interaction      |

---

## Value Analysis Dimensions

| Dimension           | Metric(s) to use                                                      |
|---------------------|-----------------------------------------------------------------------|
| Feature utilization | Active apps per day; Gemini feature touchpoints; storage utilization % |
| Trend over time     | 30-day active user trend; Drive growth; Meet minutes/week             |
| Productivity impact | Docs/Sheets/Slides created; Meet total minutes; Gemini interactions   |

---

## Data Freshness

- Usage reports are available for the **previous day** only — data is not real-time
- `date` parameter format: `YYYY-MM-DD`; yesterday's data available by ~noon the
  following day
- Activity reports have a **1–3 day** ingestion delay
- Historical data retention: 6 months (rolling window); no configurable extension
  without exporting to BigQuery

---

## Grafana Integration

The Reports API returns JSON with non-standard structure (nested parameter arrays),
so the Infinity datasource requires JSONPath transformation.

**Recommended approach for Workspace:**

1. **Custom Python collector** that hits the Reports API daily, flattens the response
   into Prometheus gauges/counters, and pushes to Grafana Cloud via OTLP or push gateway
2. Alternatively: export daily to BigQuery (built-in Workspace BigQuery export) and
   use Grafana's BigQuery datasource

**BigQuery export path (best for long-term retention):**
- Workspace Admin Console → Reports → BigQuery Export
- Creates a dataset in your GCP project with daily usage snapshots
- Grafana BigQuery datasource can query directly
- Retention unlimited (billed at BigQuery storage rates)

---

## Limitations & Gaps

- **Single-user workspace:** If you're a solo admin, `users/{userKey}` and customer-level
  reports both show the same person. Still useful for trend tracking.
- **6-month retention limit:** Without BigQuery export, historical data older than
  6 months is gone. If you want year-over-year comparison, set up the export now.
- **No per-document metrics:** The API shows aggregate counts (files created, etc.) but
  not which specific files were touched — privacy by design.
- **Gemini events are activity logs, not usage counts:** Unlike Gmail's `num_emails_sent`,
  Gemini data is event-based. You'll need to aggregate event counts yourself.
- **Pricing data:** Workspace billing is flat-rate (per seat/tier). No API exposes
  per-feature cost allocation.

---

## References

- [Admin SDK Reports API overview](https://developers.google.com/workspace/admin/reports/v1/overview)
- [User Usage parameters](https://developers.google.com/workspace/admin/reports/v1/appendix/usage/user)
- [Gemini Audit logs via Reporting API (2025)](https://workspaceupdates.googleblog.com/2025/07/gemini-audit-logs-reporting-api-audit-and-security-invesitgation-tools.html)
- [Audit log API enhancements (2025)](https://workspaceupdates.googleblog.com/2025/12/google-workspace-audit-log-api.html)
