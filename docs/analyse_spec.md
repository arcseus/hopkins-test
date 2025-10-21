# `/POST /api/analyse` Endpoint - Implementation Blueprint

## Overview

This document provides a granular implementation blueprint for the `/POST /api/analyse` endpoint, following GitHub flow methodology and referencing the main SPEC.md and TODO.md requirements.

## Architecture Overview

The endpoint implements a **Document Analysis Pipeline** with the following architectural layers:

1. **Input Layer**: Multipart file upload with validation
2. **Extraction Layer**: ZIP processing and text extraction from multiple formats
3. **Categorization Layer**: Heuristic document classification
4. **Analysis Layer**: LLM-powered fact and red flag extraction
5. **Aggregation Layer**: Results compilation and summary generation
6. **Output Layer**: Structured JSON response

## GitHub Flow Implementation Plan

### Phase 1: Foundation & Types (Branches 1-2)

#### Branch: `feat/types-and-contracts` ✅ **COMPLETED**
**Duration**: 1-2 hours  
**Dependencies**: None

**Changes**:
- `server/src/types/analysis.ts`: Core domain types ✅
- `server/src/validators/analysis.ts`: Zod schemas for runtime validation ✅
- `server/src/utils/aggregate.ts`: Aggregation logic with tests ✅
- `server/src/utils/constants.ts`: Business rules (file limits, text truncation) ✅

**Key Files**:
```typescript
// types/analysis.ts
export interface DocResult {
  doc: string;
  category: 'financial' | 'legal' | 'commercial' | 'operations' | 'other';
  facts: string[];
  red_flags: string[];
}

export interface AnalyseResponse {
  docs: DocResult[];
  aggregate: AggregateCounts;
  summaryText: string;
  errors: string[];
}
```

**Implementation Details**:
- **Types**: Clean domain types with proper TypeScript interfaces
- **Validators**: Zod schemas with business rule enforcement (max 5 items, 300 char limits)
- **Aggregation**: Simple, efficient aggregation logic with comprehensive tests
- **Constants**: Centralized business rules matching spec requirements

**Test Coverage**:
- ✅ Unit tests for aggregation logic (4 test cases)
- ✅ Unit tests for Zod validation (12 test cases) 
- ✅ Unit tests for constants validation (4 test cases)
- ✅ Total: 20 test cases, 100% coverage of implemented code

**Acceptance Criteria**:
- [x] All types compile without errors
- [x] Zod schemas validate against spec requirements
- [x] Unit tests for aggregation logic pass
- [x] Constants are centralized and documented

---

#### Branch: `feat/upload-skeleton`
**Duration**: 1 hour  
**Dependencies**: `feat/types-and-contracts`

**Changes**:
- `server/src/routes/analyse.ts`: Basic route handler
- `server/src/middleware/upload.ts`: Multipart validation
- `server/src/errors/validation.ts`: Custom error types

**Key Implementation**:
```typescript
// routes/analyse.ts
export async function analyseHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await request.file();
    
    // Validation
    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }
    
    if (data.file.size > 25 * 1024 * 1024) {
      return reply.code(400).send({ error: 'File too large' });
    }
    
    // TODO: Implement pipeline
    return { docs: [], aggregate: {}, summaryText: '', errors: [] };
  } catch (error) {
    return reply.code(500).send({ error: 'Internal server error' });
  }
}
```

**Acceptance Criteria**:
- [ ] Route accepts multipart uploads
- [ ] Validates file size (25MB limit)
- [ ] Returns 400 for invalid requests
- [ ] Basic error handling implemented

---

### Phase 2: Document Processing (Branches 3-5)

#### Branch: `feat/zip-extraction`
**Duration**: 2-3 hours  
**Dependencies**: `feat/upload-skeleton`

**Changes**:
- `server/src/extractors/zip.ts`: ZIP file processing
- `server/src/extractors/security.ts`: Path traversal protection
- `server/src/extractors/filters.ts`: File type filtering

**Key Implementation**:
```typescript
// extractors/zip.ts
export async function extractZipFiles(buffer: Buffer): Promise<ExtractedFile[]> {
  const zip = new StreamZip.async({ file: buffer });
  const entries = await zip.entries();
  
  const files: ExtractedFile[] = [];
  let fileCount = 0;
  
  for (const entry of Object.values(entries)) {
    if (fileCount >= 50) break; // Limit to 50 files
    
    if (isValidFileType(entry.name) && !isPathTraversal(entry.name)) {
      const content = await zip.entryData(entry);
      files.push({
        filename: path.basename(entry.name),
        extension: path.extname(entry.name).toLowerCase(),
        buffer: content,
        size: content.length
      });
      fileCount++;
    }
  }
  
  await zip.close();
  return files;
}
```

**Acceptance Criteria**:
- [ ] Extracts files from ZIP archives
- [ ] Protects against path traversal attacks
- [ ] Filters to supported file types only
- [ ] Limits to 50 files maximum
- [ ] Handles corrupted ZIP files gracefully

---

#### Branch: `feat/text-extractors`
**Duration**: 3-4 hours  
**Dependencies**: `feat/zip-extraction`

**Changes**:
- `server/src/extractors/pdf.ts`: PDF text extraction
- `server/src/extractors/docx.ts`: DOCX text extraction
- `server/src/extractors/spreadsheet.ts`: XLSX/CSV extraction
- `server/src/extractors/text.ts`: Plain text handling
- `server/src/extractors/dispatcher.ts`: Format routing

**Key Implementation**:
```typescript
// extractors/dispatcher.ts
export async function extractText(file: ExtractedFile): Promise<ExtractionResult> {
  try {
    let text: string;
    
    switch (file.extension) {
      case '.pdf':
        text = await extractFromPDF(file.buffer);
        break;
      case '.docx':
        text = await extractFromDOCX(file.buffer);
        break;
      case '.xlsx':
        text = await extractFromXLSX(file.buffer);
        break;
      case '.csv':
        text = await extractFromCSV(file.buffer);
        break;
      case '.txt':
        text = file.buffer.toString('utf-8');
        break;
      default:
        throw new Error(`Unsupported file type: ${file.extension}`);
    }
    
    return {
      success: true,
      text: truncateText(text, 15000),
      metadata: { originalSize: file.size, extractedLength: text.length }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      text: ''
    };
  }
}
```

**Acceptance Criteria**:
- [ ] PDF extraction works with basic documents
- [ ] DOCX extraction preserves paragraph structure
- [ ] XLSX/CSV limited to 200 rows, flattened
- [ ] Text truncation to 15,000 characters
- [ ] Error handling for corrupted files
- [ ] Unit tests for each extractor

---

#### Branch: `feat/document-categorization`
**Duration**: 1-2 hours  
**Dependencies**: `feat/text-extractors`

**Changes**:
- `server/src/categorizers/heuristic.ts`: Keyword-based categorization
- `server/src/categorizers/keywords.ts`: Category keyword mappings

**Key Implementation**:
```typescript
// categorizers/heuristic.ts
export function categorizeDocument(filename: string, text: string): DocumentCategory {
  const input = `${filename} ${text.substring(0, 300)}`.toLowerCase();
  
  const scores = {
    financial: countKeywords(input, FINANCIAL_KEYWORDS),
    legal: countKeywords(input, LEGAL_KEYWORDS),
    commercial: countKeywords(input, COMMERCIAL_KEYWORDS),
    operations: countKeywords(input, OPERATIONS_KEYWORDS)
  };
  
  const maxScore = Math.max(...Object.values(scores));
  
  if (maxScore === 0) return 'other';
  
  return Object.entries(scores)
    .find(([_, score]) => score === maxScore)?.[0] as DocumentCategory || 'other';
}
```

**Acceptance Criteria**:
- [ ] Categorizes documents based on filename + first 300 chars
- [ ] Keyword mappings are comprehensive
- [ ] Defaults to 'other' when no keywords match
- [ ] Unit tests with various document types

---

### Phase 3: LLM Integration (Branches 6-8)

#### Branch: `feat/llm-client`
**Duration**: 2-3 hours  
**Dependencies**: `feat/document-categorization`

**Changes**:
- `server/src/llm/client.ts`: OpenAI client wrapper
- `server/src/llm/prompts.ts`: Prompt templates
- `server/src/llm/retry.ts`: Retry logic with JSON validation

**Key Implementation**:
```typescript
// llm/client.ts
export class LLMClient {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }
  
  async analyzeDocument(
    filename: string, 
    category: string, 
    text: string
  ): Promise<DocResult> {
    const prompt = buildDocumentPrompt(filename, category, text);
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        max_tokens: 700
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response content');
      
      return this.parseAndValidateResponse(content, filename, category);
    } catch (error) {
      throw new Error(`LLM analysis failed: ${error.message}`);
    }
  }
  
  private parseAndValidateResponse(
    content: string, 
    filename: string, 
    category: string
  ): DocResult {
    try {
      const parsed = JSON.parse(content);
      return DocResultSchema.parse(parsed);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${error.message}`);
    }
  }
}
```

**Acceptance Criteria**:
- [ ] OpenAI client configured with proper settings
- [ ] Prompt templates match spec exactly
- [ ] JSON validation with Zod schemas
- [ ] Error handling for API failures
- [ ] Unit tests with mocked responses

---

#### Branch: `feat/llm-parallel-processing`
**Duration**: 2-3 hours  
**Dependencies**: `feat/llm-client`

**Changes**:
- `server/src/llm/processor.ts`: Parallel document processing
- `server/src/llm/retry.ts`: Retry logic for failed analyses
- `server/src/llm/errors.ts`: Error handling and fallbacks

**Key Implementation**:
```typescript
// llm/processor.ts
export async function processDocuments(
  documents: ProcessedDocument[],
  llmClient: LLMClient
): Promise<ProcessingResult> {
  const concurrency = Math.min(os.cpus().length, 6);
  const limit = pLimit(concurrency);
  
  const results: DocResult[] = [];
  const errors: string[] = [];
  
  const promises = documents.map(doc => 
    limit(async () => {
      try {
        const result = await analyzeWithRetry(doc, llmClient);
        results.push(result);
      } catch (error) {
        errors.push(doc.filename);
        results.push(createStubResult(doc.filename, doc.category));
      }
    })
  );
  
  await Promise.all(promises);
  
  return { results, errors };
}

async function analyzeWithRetry(
  doc: ProcessedDocument, 
  client: LLMClient
): Promise<DocResult> {
  try {
    return await client.analyzeDocument(doc.filename, doc.category, doc.text);
  } catch (error) {
    // Retry once with guard prompt
    const retryPrompt = buildRetryPrompt(doc);
    return await client.analyzeWithCustomPrompt(doc, retryPrompt);
  }
}
```

**Acceptance Criteria**:
- [ ] Processes documents in parallel (max 6 concurrent)
- [ ] Retry logic for failed JSON parsing
- [ ] Fallback to stub results on complete failure
- [ ] Error tracking for failed documents
- [ ] Performance monitoring

---

#### Branch: `feat/llm-summary-generation`
**Duration**: 1-2 hours  
**Dependencies**: `feat/llm-parallel-processing`

**Changes**:
- `server/src/llm/summary.ts`: Final narrative generation
- `server/src/llm/aggregation.ts`: Results aggregation logic

**Key Implementation**:
```typescript
// llm/summary.ts
export async function generateSummary(
  results: DocResult[],
  llmClient: LLMClient
): Promise<string> {
  const aggregate = aggregateResults(results);
  const prompt = buildSummaryPrompt(results, aggregate);
  
  try {
    const response = await llmClient.generateSummary(prompt);
    return response.trim();
  } catch (error) {
    // Fallback to basic summary
    return generateFallbackSummary(aggregate);
  }
}
```

**Acceptance Criteria**:
- [ ] Generates 300-400 word summary
- [ ] Groups results by category
- [ ] Highlights red flags prominently
- [ ] Fallback summary on LLM failure
- [ ] Unit tests for aggregation logic

---

### Phase 4: End-to-End Integration (Branches 9-10)

#### Branch: `feat/analyse-endpoint-complete`
**Duration**: 2-3 hours  
**Dependencies**: `feat/llm-summary-generation`

**Changes**:
- `server/src/routes/analyse.ts`: Complete endpoint implementation
- `server/src/pipeline/analysis.ts`: Main processing pipeline
- `server/src/middleware/timeout.ts`: Request timeout handling

**Key Implementation**:
```typescript
// routes/analyse.ts
export async function analyseHandler(request: FastifyRequest, reply: FastifyReply) {
  const startTime = Date.now();
  
  try {
    // 1. Validate upload
    const file = await validateUpload(request);
    
    // 2. Extract ZIP
    const extractedFiles = await extractZipFiles(file.buffer);
    
    // 3. Extract text from each file
    const processedDocs = await extractTextFromFiles(extractedFiles);
    
    // 4. Categorize documents
    const categorizedDocs = await categorizeDocuments(processedDocs);
    
    // 5. Analyze with LLM (parallel)
    const analysisResults = await processDocuments(categorizedDocs, llmClient);
    
    // 6. Generate summary
    const summary = await generateSummary(analysisResults.results, llmClient);
    
    // 7. Aggregate results
    const aggregate = aggregateResults(analysisResults.results);
    
    // 8. Return response
    const response: AnalyseResponse = {
      docs: analysisResults.results,
      aggregate,
      summaryText: summary,
      errors: analysisResults.errors
    };
    
    return reply.send(response);
    
  } catch (error) {
    logger.error('Analysis failed', { error: error.message });
    return reply.code(500).send({ 
      error: 'Analysis failed', 
      message: error.message 
    });
  }
}
```

**Acceptance Criteria**:
- [ ] Complete end-to-end processing
- [ ] Handles all file types from spec
- [ ] Returns proper JSON response format
- [ ] Error handling for each pipeline stage
- [ ] Performance within 2-3 minutes for 10-20 docs
- [ ] E2E tests with sample ZIP files

---

#### Branch: `feat/performance-optimization`
**Duration**: 1-2 hours  
**Dependencies**: `feat/analyse-endpoint-complete`

**Changes**:
- `server/src/middleware/timeout.ts`: Request timeouts
- `server/src/config/limits.ts`: Processing limits
- `server/src/monitoring/performance.ts`: Performance tracking

**Key Implementation**:
```typescript
// middleware/timeout.ts
export const analysisTimeout = {
  perDocument: 30000,    // 30 seconds per document
  summary: 20000,         // 20 seconds for summary
  total: 180000          // 3 minutes total
};

// config/limits.ts
export const PROCESSING_LIMITS = {
  maxFiles: 20,           // Process only first 20 files
  maxFileSize: 25 * 1024 * 1024,  // 25MB
  maxTextLength: 15000,   // 15k chars per document
  maxConcurrentLLMCalls: 6
};
```

**Acceptance Criteria**:
- [ ] Timeout handling for each processing stage
- [ ] Limits enforced (20 files max)
- [ ] Performance monitoring
- [ ] Graceful degradation on timeouts
- [ ] Load testing with realistic data

---

### Phase 5: Testing & Hardening (Branches 11-12)

#### Branch: `feat/comprehensive-testing`
**Duration**: 3-4 hours  
**Dependencies**: `feat/performance-optimization`

**Changes**:
- `server/tests/unit/`: Unit tests for all modules
- `server/tests/integration/`: Integration tests
- `server/tests/e2e/`: End-to-end tests
- `server/tests/fixtures/`: Test data and mocks

**Test Coverage**:
```typescript
// tests/e2e/analyse.test.ts
describe('POST /api/analyse', () => {
  it('should process a valid ZIP file', async () => {
    const response = await request(app)
      .post('/api/analyse')
      .attach('file', 'test-fixtures/sample-docs.zip');
    
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      docs: expect.arrayContaining([
        expect.objectContaining({
          doc: expect.any(String),
          category: expect.any(String),
          facts: expect.any(Array),
          red_flags: expect.any(Array)
        })
      ]),
      aggregate: expect.any(Object),
      summaryText: expect.any(String),
      errors: expect.any(Array)
    });
  });
  
  it('should handle corrupted files gracefully', async () => {
    // Test implementation
  });
  
  it('should respect file size limits', async () => {
    // Test implementation
  });
});
```

**Acceptance Criteria**:
- [ ] Unit tests for all modules (>90% coverage)
- [ ] Integration tests for pipeline stages
- [ ] E2E tests with various ZIP files
- [ ] Error scenario testing
- [ ] Performance benchmarks

---

#### Branch: `feat/production-hardening`
**Duration**: 2-3 hours  
**Dependencies**: `feat/comprehensive-testing`

**Changes**:
- `server/src/middleware/security.ts`: Security headers
- `server/src/middleware/rate-limiting.ts`: Rate limiting
- `server/src/logging/structured.ts`: Structured logging
- `server/src/health/checks.ts`: Health check endpoints

**Key Implementation**:
```typescript
// middleware/security.ts
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000'
};

// logging/structured.ts
export function logAnalysisRequest(requestId: string, metadata: any) {
  logger.info('Analysis request started', {
    requestId,
    fileSize: metadata.fileSize,
    fileCount: metadata.fileCount,
    timestamp: new Date().toISOString()
  });
}
```

**Acceptance Criteria**:
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] Structured logging throughout
- [ ] Health check endpoints
- [ ] Error monitoring setup
- [ ] Production configuration

---

## Implementation Timeline

| Phase | Duration | Branches | Key Deliverables |
|-------|----------|----------|------------------|
| 1 | 2-3 hours | 2 branches | Types, validation, basic routing |
| 2 | 6-9 hours | 3 branches | Document processing pipeline |
| 3 | 5-8 hours | 3 branches | LLM integration and processing |
| 4 | 3-5 hours | 2 branches | End-to-end integration |
| 5 | 5-7 hours | 2 branches | Testing and hardening |
| **Total** | **21-32 hours** | **12 branches** | **Production-ready endpoint** |

## Risk Mitigation

### Technical Risks
- **LLM API failures**: Implement retry logic and fallback responses
- **Memory issues**: Stream processing for large files
- **Timeout issues**: Progressive timeouts and graceful degradation
- **JSON parsing failures**: Strict validation with retry mechanisms

### Performance Risks
- **Concurrent processing**: Limit concurrent LLM calls
- **Memory usage**: Process files in batches
- **Response time**: Implement progressive responses

### Security Risks
- **File upload attacks**: Path traversal protection, file type validation
- **Memory exhaustion**: File size limits, processing limits
- **Injection attacks**: Input validation, output sanitization

## Success Metrics

- [ ] **Functionality**: All spec requirements met
- [ ] **Performance**: <3 minutes for 20 documents
- [ ] **Reliability**: >95% success rate for valid inputs
- [ ] **Security**: No vulnerabilities in file processing
- [ ] **Maintainability**: >90% test coverage, clear architecture
- [ ] **Scalability**: Handles concurrent requests efficiently

## Next Steps

1. **Start with Phase 1**: Create types and basic routing
2. **Iterate quickly**: Focus on working end-to-end before optimization
3. **Test continuously**: Unit tests for each component
4. **Monitor performance**: Track processing times and memory usage
5. **Document decisions**: Architectural choices and trade-offs

This blueprint provides a clear path to implementing the `/POST /api/analyse` endpoint following GitHub flow best practices, with proper separation of concerns and comprehensive testing.
