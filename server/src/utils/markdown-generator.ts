import { AnalyseResponse, DocResult, Aggregate } from '../types/analysis';

/**
 * Markdown generator for VDR analysis reports.
 */
export class MarkdownGenerator {
  /**
   * Generates a complete VDR summary markdown report from analysis data.
   * 
   * @param analysisData - Complete analysis response from persistence layer
   * @returns Formatted markdown string ready for file output
   */
  static generateVDRSummary(analysisData: AnalyseResponse): string {
    const sections = [
      this.generateHeader(),
      this.generateSummary(analysisData.summaryText),
      this.generateAggregateTable(analysisData.aggregate),
      this.generateDocumentsSection(analysisData.docs),
      this.generateNeedsReviewSection(analysisData.errors)
    ];

    return sections.join('\n\n');
  }

  /**
   * Generates the report header with current date.
   */
  private static generateHeader(): string {
    const date = new Date().toISOString().split('T')[0];
    return `# VDR Lite — Diligence Summary\n_Date: ${date}_`;
  }

  /**
   * Generates the summary section with word count validation.
   */
  private static generateSummary(summaryText: string): string {
    const wordCount = summaryText.trim().split(/\s+/).length;
    const truncatedSummary = wordCount > 400 
      ? summaryText.trim().split(/\s+/).slice(0, 550).join(' ')
      : summaryText.trim();

    return `## Summary\n\n${truncatedSummary}`;
  }

  /**
   * Generates the aggregate statistics table.
   */
  private static generateAggregateTable(aggregate: Aggregate): string {
    const tableRows = [
      '| Category    | Facts | Red flags |',
      '|-------------|------:|----------:|',
      `| Financial   |    ${aggregate.financial.facts} |         ${aggregate.financial.red_flags} |`,
      `| Legal       |     ${aggregate.legal.facts} |         ${aggregate.legal.red_flags} |`,
      `| Operations  |     ${aggregate.operations.facts} |         ${aggregate.operations.red_flags} |`,
      `| Commercial  |     ${aggregate.commercial.facts} |         ${aggregate.commercial.red_flags} |`,
      `| Other       |     ${aggregate.other.facts} |         ${aggregate.other.red_flags} |`
    ];

    return `## Aggregate\n\n${tableRows.join('\n')}`;
  }

  /**
   * Generates the documents section with facts and red flags.
   */
  private static generateDocumentsSection(docs: DocResult[]): string {
    if (docs.length === 0) {
      return '## Documents\n\n_No documents analyzed._';
    }

    const documentSections = docs.map((doc, index) => {
      const factsList = doc.facts.length > 0 
        ? doc.facts.map(fact => `- ${fact}`).join('\n')
        : '_No facts identified._';
      
      const redFlagsList = doc.red_flags.length > 0
        ? doc.red_flags.map(flag => `- ${flag}`).join('\n')
        : '_No red flags identified._';

      return `### ${index + 1}) ${doc.doc}  _(${doc.category})_\n**Facts**\n${factsList}\n\n**Red flags**\n${redFlagsList}`;
    });

    return `## Documents\n\n${documentSections.join('\n\n')}`;
  }

  /**
   * Generates the needs review section for processing errors.
   */
  private static generateNeedsReviewSection(errors: string[]): string {
    if (errors.length === 0) {
      return '## Needs review\n\n_All documents processed successfully._';
    }

    const errorList = errors.map(error => `- ${error}`).join('\n');
    return `## Needs review\n\n${errorList}`;
  }
}
