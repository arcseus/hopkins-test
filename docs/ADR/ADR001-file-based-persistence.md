# ADR001: File-Based Persistence Layer

**Date**: 2024-01-20  
**Status**: Accepted  
**Context**: Need persistent storage for analysis results between `/api/analyse` and `/api/export` endpoints.

## Decision

Use file-based JSON storage in `mock_doc_storage/` directory with clean abstraction interface.

## Rationale

- **Simple**: No database setup required for MVP
- **Persistent**: Survives server restarts unlike in-memory storage
- **Debuggable**: Easy to inspect stored JSON files
- **Future-proof**: Clean `AnalysisStorage` interface enables seamless migration to database
- **MVP-friendly**: Perfect for single-user sessions without authentication complexity

## Consequences

- Analysis results stored as `{analysisId}.json` files
- 24-hour TTL with automatic cleanup
- Zero code changes needed for future database migration
- Directory must be created if not exists
