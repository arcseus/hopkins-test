# ADR003: File Content Truncation Strategy

## Status
Accepted

## Context
The analysis pipeline needs to process documents of varying sizes while staying within processing limits. Very long documents can exceed token limits and cause analysis failures.

## Decision
Implement content-aware truncation for all supported file types:
- **Text truncation**: 15,000 characters with word boundary preservation
- **Spreadsheet limits**: 200 rows for XLSX/CSV files
- **Format preservation**: Maintain structure where possible (paragraphs, sheets)

## Rationale
- **Early version constraint**: Simple truncation is sufficient for MVP
- **File size limits**: 25MB ZIP limit already constrains input size
- **Content loss trade-off**: Better to process partial content than fail completely
- **Future optimization**: Can implement smart tokenization and context maximization later

## Consequences
- **Positive**: Reliable processing within limits, consistent behavior
- **Negative**: Potential content loss for very long documents
- **Mitigation**: Clear truncation indicators in metadata, future smart chunking
