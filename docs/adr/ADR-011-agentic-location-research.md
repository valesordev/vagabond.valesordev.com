# ADR-011: Agentic Location Research Pipeline

**Status**: Proposed — Deferred to v0.4  
**Date**: 2026-04-15  
**Deciders**: Brian (initial)

## Context

The story map identified automated, AI-assisted location enrichment as a v0.4 feature:
given a seed (a geographic region, a land management unit, or an imported location stub),
an agentic workflow researches and enriches the Location catalog with conditions, access
notes, jurisdiction details, seasonal information, and points of interest — reducing the
manual research burden for trip planning.

This ADR captures the design intent and defers the implementation decision until the
Location catalog (ADR-006, v0.2) is stable.

## Deferred Pending

This ADR will be revised to "Accepted" when:
1. The Location catalog domain (ADR-006) is implemented and stable
2. The set of enrichment fields is known from real usage
3. The cost/quality tradeoff of available LLM APIs for this task has been evaluated

## Preliminary Design Intent

**What the pipeline does:**
Given a `Location` record with minimal data (name, coordinates, jurisdiction), the pipeline:
1. Queries public sources (NPS, BLM, USFS, iOverlander, recreation.gov) for structured data
2. Uses an LLM to synthesize unstructured information (trip reports, forum posts) into
   structured `LocationNote` records
3. Flags enriched fields as `source: Scraped` with a confidence score and timestamp
4. Queues enrichment jobs as background Tokio tasks; results are applied asynchronously

**Integration point:**
The pipeline is a capability of `vagabond-locations` (ADR-006) — a new `Enricher` trait
with implementations per data source. The HTTP API exposes a trigger endpoint:
`POST /api/v1/locations/{id}/enrich`

**LLM integration:**
Anthropic Claude API (via the Rust SDK or HTTP) is the assumed LLM. The enrichment
prompt is structured to extract specific fields (conditions, access notes, seasonal
closures) rather than generate free-form text. Prompt caching should be applied to
the system prompt and source document context to reduce cost on batch enrichment jobs.

**User control:**
- Enrichment is always opt-in per location or per batch
- AI-generated notes are visually distinguished from user-authored notes in the UI
- Users can accept, edit, or reject any enriched field

## Consequences (Preliminary)

**Positive**
- Dramatically reduces manual research time for trip planning
- Enriched location data compounds over time — the catalog becomes more valuable with use
- Agentic pipeline is isolated in `vagabond-locations` — no impact on trip planning domain

**Negative**
- LLM API costs at scale (large catalog enrichment runs)
- AI-generated notes may be confidently wrong about access conditions or rules —
  user verification remains essential for safety-critical information
- Public source scraping may conflict with ToS of some sites; must evaluate per source

## Alternatives Considered

*(To be evaluated before ADR is accepted)*
- **Manual-only enrichment**: sufficient for personal use but doesn't scale
- **Structured data imports only (no LLM)**: iOverlander, recreation.gov have structured
  data APIs; this is the safer v0.2 approach and should be built before the LLM layer
- **Self-hosted LLM (Ollama, etc.)**: maintains offline-first and no API cost; quality
  significantly below hosted models for research synthesis tasks; worth evaluating
