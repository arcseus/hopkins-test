# ADR004: Prompt Context Design

## Status
Accepted

## Context
The document analysis system requires structured JSON responses with specific schemas and heuristics. The question arose whether to place this context in the system prompt or user prompt.

## Decision
Keep detailed context (JSON schema, heuristics, output format requirements) in the user prompt rather than the system prompt. This is solely because of the spec I received. Normally, I would add everything besides request specific data in the system prompt for best practice and to leverage caching.


