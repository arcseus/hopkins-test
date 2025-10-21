# VDR Lite + LLM — 5-Hour Task

## What to Build

A minimal app where users upload a `.zip` containing 10–20 documents. The backend extracts text, uses an LLM to extract per-document **Facts** and **Red Flags** in strict JSON. Results are aggregated, rendered in a clean UI, and exportable as Markdown.

---

## Minimal Flow

1. **Upload + Unzip**  
   - Accept `.zip` files up to **25MB**.

2. **Text Extraction**  
   - **PDF:** Extract basic text  
   - **DOCX:** Extract paragraphs  
   - **XLSX/CSV:** Extract first sheet, up to first 200 rows, flattened  
   - **TXT:** Use as-is  
   - _Truncate each doc to **15,000** characters_

3. **Categorize Each Document**  
   - Use the filename + first 300 chars.
   - Tiny keyword map:  
     - `financial`
     - `legal`
     - `commercial`
     - `operations`
     - or `other`

4. **Per-Document LLM Call**  
   - **One call per doc**
   - `temperature = 0`
   - Enforce JSON schema for structure

5. **Aggregate Results**  
   - Count by category

6. **LLM Final Narrative**  
   - Single call with merged JSON results
   - Returns a **300–400 word** IC-style red-flag summary

7. **UI**  
   - Show summary cards  
   - Show an expandable results table

8. **Export**  
   - Markdown file: `vdr_summary.md`

---

## LLM Prompts

<details>
<summary><strong>Per-document Extraction</strong></summary>

**System:**  
> You are a private-equity diligence analyst. Be concise, literal, and conservative. If unsure, say ‘Unknown’. Output valid JSON only that matches the schema.

**User (template):**  
> Return JSON for this document.  
> **Document meta:**  
> - filename: {{filename}}  
> - category: {{category}}  
>
> **JSON schema:**  
> ```json
> {
>   "doc": "string",           // filename
>   "category": "financial|legal|commercial|operations|other",
>   "facts": ["string", ...],  // 1-5 bullets, short, objective
>   "red_flags": ["string", ...] // 0-5 bullets, short, concrete risk statements
> }
> ```
>
> **Heuristics:**  
> - Prefer explicit numbers, terms, durations, thresholds, parties, and dates.  
> - Red flags include: missing statements, exclusivity, unilateral termination, indemnities, breaches, going concern, overdue/arrears, covenants, related parties, churn, key-customer risk, safety/compliance issues, expired docs.
>
> **Document text (truncated):**  
> {{text}}

</details>

---

<details>
<summary><strong>Final Narrative</strong></summary>

**System:**  
> You summarize for an Investment Committee. Group by category. Be concise and professional. 300–400 words.

**User:**  
> Input is a JSON array of per-document results:  
> {{json_array}}
>
> Write a single 300–400 word summary focusing on red flags first. Group by Financial, Legal, Operations, Commercial. Where helpful, reference counts (e.g., “3 red flags across two contracts”).

</details>

---

## API Usage & Cost Control

- Use your preferred LLM API  
- `temperature = 0`  
- Max tokens: **~700** for doc calls, **~500** for the final narrative  
- Truncate doc text to **15k** chars  
- Only **1 call per doc + 1 final call**  

---

## Interfaces

### `POST /api/analyse`  
Returns:
```json
{
  "docs": [{ "doc": "...", "category": "...", "facts": [...], "red_flags": [...] }],
  "aggregate": {
    "financial": {"facts": X, "red_flags": Y},
    "legal": {...},
    "operations": {...},
    "commercial": {...},
    "other": {...}
  },
  "summaryText": "300–400 word narrative",
  "errors": ["unreadable file names..."]
}
```

### `POST /api/export`  
Returns the markdown file (`vdr_summary.md`).

---

## UI (Single Page)

- **Upload box** with progress:  
  _“Analysing N of N…”_

- **Four summary cards** (with counts)

- **Expandable table:**  
  - Document | Category | Key Facts | Red Flags

- **Download Markdown** button

---

## Definition of Done

- Upload zip  
- Show progress  
- Return results within **2–3 minutes** for 10–20 small docs
- Strict JSON parse per doc; docs with errors appear under "Needs review" and do not halt the rest
- Summary cards and table render  
- Markdown export works

---

## JSON Guard (Server-side)

- After LLM response, **parse JSON with a strict validator**
- If invalid:  
  - **Retry once** with the message:  
    > "Your last output was invalid JSON. Return only valid JSON matching the schema, no prose."
