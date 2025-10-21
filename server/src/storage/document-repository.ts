/**
 * Document repository interface for dependency inversion
 * Allows different storage implementations (local, S3, database, etc.)
 */
export interface DocumentRepository {
  saveAnalysis(analysisId: string, data: any): Promise<void>;
  getAnalysis(analysisId: string): Promise<any>;
  saveMarkdown(analysisId: string, markdown: string): Promise<void>;
  getMarkdown(analysisId: string): Promise<string | null>;
  markdownExists(analysisId: string): Promise<boolean>;
}

/**
 * Local file system implementation of DocumentRepository
 * Stores analysis results in /output/analysis_id.json and markdown in /output/analysis_id.md
 */
export class LocalDocumentRepository implements DocumentRepository {
  private readonly outputDir = './output';

  async saveAnalysis(analysisId: string, data: any): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Save analysis to file
    const filePath = path.join(this.outputDir, `${analysisId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async getAnalysis(analysisId: string): Promise<any> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(this.outputDir, `${analysisId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  }

  async saveMarkdown(analysisId: string, markdown: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Save markdown to file
    const filePath = path.join(this.outputDir, `${analysisId}.md`);
    await fs.writeFile(filePath, markdown, 'utf-8');
  }

  async getMarkdown(analysisId: string): Promise<string | null> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const filePath = path.join(this.outputDir, `${analysisId}.md`);
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  async markdownExists(analysisId: string): Promise<boolean> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const filePath = path.join(this.outputDir, `${analysisId}.md`);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}
