# ADR002: Analysis ID in Response

**Date**: 2024-01-20  
**Status**: Accepted  
**Context**: Original spec returns only `{docs, aggregate, summaryText, errors}` but need session management.

## Decision

Add `analysisId` to response. Response becomes `{analysisId, docs, aggregate, summaryText, errors}`.

## Rationale

- **Session Management**: Avoids mocking authentication for assessment purposes
- **Simpler Flow**: Client gets ID immediately, no separate retrieval needed
- **Production Ready**: In production, would use proper auth tokens instead of analysis IDs
- **Cleaner API**: Removes unnecessary GET endpoint that duplicates data
- **Security**: Analysis IDs are UUIDs, not easily guessable

## Consequences

- Client must store `analysisId` for export functionality
- Export endpoint uses `POST /api/export/:analysisId`
- Response structure slightly differs from original spec but for prototyping it makes sense to avoid mocking an auth layer
- To prepare for prod, we would simply remove analysis_id from the /analysis response payload and replace getting the id from URL with getting it from auth layer
