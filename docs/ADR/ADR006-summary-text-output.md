# ADR006: Summary Text Output Instead of JSON

## Status
Accepted

## Context
The document analysis system generates executive summaries for Investment Committee reports. The summary generation uses an LLM call with a system prompt that explicitly requests plain text output.

The system prompt states: "You summarize for an Investment Committee. Group by category. Be concise and professional. 300–400 words."

## Decision
We will return plain text from the summary LLM call instead of JSON format, even though this deviates from our standard pattern of using JSON mode for structured outputs. Normally I would also use JSON mode here (it cannot be enabled unless JSON is mentioned in the system prompt). I am aware structured output can be requested without JSON mode on, but since this is an assessment I believe showcasing both ways of requesting an LLM also holds some value.

