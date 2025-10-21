# ADR005: Simple LLM Call Implementation

## Status
Accepted

## Context
The current LLM service uses a straightforward client singleton without request-specific decorators.

## Decision
Keep the LLM call simple for development speed. Before production deployment, wrap the singleton client in request-specific decorators with rate limiting, and circuit breakers. This allows rapid iteration now while maintaining a clear path to production-grade resilience.

## Consequences
- Fast development velocity
- Clear separation between current implementation and production requirements
- Easy to add production features without changing core logic
