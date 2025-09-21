#!/usr/bin/env tsx
/**
 * Lint Issue Analyzer
 * 
 * This script analyzes ESLint output and generates structured data for automated issue creation.
 * It provides intelligent analysis of lint errors including:
 * - Root cause identification
 * - Suggested solutions
 * - Prevention recommendations
 * - Pattern analysis across similar files
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../');

interface LintIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
  ruleId: string;
  source?: string;
}

interface AnalyzedIssue extends LintIssue {
  category: string;
  likelyCause: string;
  suggestedSolution: string;
  preventionTip: string;
  similarFiles: string[];
  patternAnalysis: string;
}

interface IssueReport {
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    affectedFiles: number;
    commonPatterns: string[];
  };
  issues: AnalyzedIssue[];
  recommendations: {
    immediate: string[];
    longTerm: string[];
    patterns: string[];
  };
}

class LintAnalyzer {
  private projectFiles: string[] = [];
  
  constructor() {
    this.loadProjectFiles();
  }

  private loadProjectFiles(): void {
    try {
      // Get all TypeScript files in the project
      const output = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next', 
        { cwd: projectRoot, encoding: 'utf8' });
      this.projectFiles = output.trim().split('\n').filter(f => f.length > 0);
    } catch (error) {
      console.warn('Could not load project files:', error);
      this.projectFiles = [];
    }
  }

  async analyzeLintIssues(): Promise<IssueReport> {
    console.log('🔍 Running ESLint analysis...');
    
    const lintOutput = this.runLint();
    const issues = this.parseLintOutput(lintOutput);
    const analyzedIssues = issues.map(issue => this.analyzeIssue(issue));
    
    const report: IssueReport = {
      summary: this.generateSummary(analyzedIssues),
      issues: analyzedIssues,
      recommendations: this.generateRecommendations(analyzedIssues)
    };

    return report;
  }

  private runLint(): string {
    try {
      // Run ESLint with JSON output format
      execSync('npm run lint -- --format json --output-file lint-output.json', 
        { cwd: projectRoot, stdio: 'pipe' });
      return '';
    } catch (error) {
      // ESLint exits with non-zero when issues are found
      try {
        const output = readFileSync(join(projectRoot, 'lint-output.json'), 'utf8');
        return output;
      } catch {
        // Fallback: run lint and capture output directly
        try {
          return execSync('npm run lint', { cwd: projectRoot, encoding: 'utf8' });
        } catch (lintError: any) {
          return lintError.stdout || lintError.message || '';
        }
      }
    }
  }

  private parseLintOutput(output: string): LintIssue[] {
    const issues: LintIssue[] = [];

    try {
      // Try parsing JSON output first
      const jsonOutput = JSON.parse(output);
      if (Array.isArray(jsonOutput)) {
        jsonOutput.forEach(fileResult => {
          if (fileResult.messages) {
            fileResult.messages.forEach((msg: any) => {
              issues.push({
                file: fileResult.filePath || '',
                line: msg.line || 0,
                column: msg.column || 0,
                severity: msg.severity === 2 ? 'error' : 'warning',
                message: msg.message || '',
                ruleId: msg.ruleId || '',
                source: msg.source
              });
            });
          }
        });
      }
    } catch {
      // Parse text output as fallback
      const lines = output.split('\n');
      let currentFile = '';
      
      for (const line of lines) {
        // Match file paths
        if (line.startsWith('./')) {
          currentFile = line.trim();
          continue;
        }
        
        // Match lint issues (format: "line:col  Error: message  rule-id")
        const match = line.match(/^(\d+):(\d+)\s+(Error|Warning):\s+(.+?)\s+(@[\w-]+\/[\w-]+|[\w-]+)$/);
        if (match && currentFile) {
          issues.push({
            file: currentFile,
            line: parseInt(match[1]),
            column: parseInt(match[2]),
            severity: match[3].toLowerCase() as 'error' | 'warning',
            message: match[4],
            ruleId: match[5]
          });
        }
      }
    }

    return issues;
  }

  private analyzeIssue(issue: LintIssue): AnalyzedIssue {
    const category = this.categorizeIssue(issue);
    const analysis = this.getIssueAnalysis(issue);
    const similarFiles = this.findSimilarFiles(issue.file);
    const patternAnalysis = this.analyzePattern(issue, similarFiles);

    return {
      ...issue,
      category,
      likelyCause: analysis.cause,
      suggestedSolution: analysis.solution,
      preventionTip: analysis.prevention,
      similarFiles,
      patternAnalysis
    };
  }

  private categorizeIssue(issue: LintIssue): string {
    const ruleCategories: Record<string, string> = {
      '@typescript-eslint/no-unused-vars': 'Code Quality',
      '@typescript-eslint/no-explicit-any': 'Type Safety',
      '@typescript-eslint/no-unused-imports': 'Code Quality',
      'prefer-const': 'Code Quality',
      'no-console': 'Code Quality',
      '@typescript-eslint/prefer-nullish-coalescing': 'Type Safety'
    };

    return ruleCategories[issue.ruleId] || 'General';
  }

  private getIssueAnalysis(issue: LintIssue): { cause: string; solution: string; prevention: string } {
    const analyses: Record<string, { cause: string; solution: string; prevention: string }> = {
      '@typescript-eslint/no-unused-vars': {
        cause: 'Variable is declared but never used in the code. This often happens during development when code is partially implemented or when refactoring removes usage.',
        solution: 'Remove the unused variable or prefix it with underscore (_) if it\'s intentionally unused. For function parameters that must exist for interface compliance, use underscore prefix.',
        prevention: 'Use IDE features to highlight unused code. Consider enabling "Remove unused imports" on save. Review code before committing to catch unused declarations.'
      },
      '@typescript-eslint/no-explicit-any': {
        cause: 'Using "any" type defeats TypeScript\'s type checking benefits. This often happens when dealing with external APIs, complex objects, or when migrating from JavaScript.',
        solution: 'Define proper types or interfaces. Use union types, generics, or "unknown" type for safer alternatives. For external APIs, create interface definitions.',
        prevention: 'Establish coding standards that discourage "any" usage. Use strict TypeScript configuration. Create type definitions for external dependencies.'
      },
      '@typescript-eslint/no-unused-imports': {
        cause: 'Import statements that are not used in the file. Common during refactoring or when removing functionality.',
        solution: 'Remove the unused import statements. Most IDEs can do this automatically.',
        prevention: 'Enable auto-remove unused imports in IDE settings. Use import organization tools. Review imports during code review.'
      }
    };

    return analyses[issue.ruleId] || {
      cause: 'This is a code quality or style issue that violates the project\'s linting rules.',
      solution: 'Follow the specific rule guidance. Check ESLint documentation for detailed fix instructions.',
      prevention: 'Configure IDE to show linting errors in real-time. Run lint checks before committing code.'
    };
  }

  private findSimilarFiles(filePath: string): string[] {
    const fileName = filePath.split('/').pop() || '';
    const directory = dirname(filePath);
    
    // Find files with similar names or in same directory
    return this.projectFiles.filter(f => {
      if (f === filePath) return false;
      
      const otherFileName = f.split('/').pop() || '';
      const otherDirectory = dirname(f);
      
      // Same directory
      if (otherDirectory === directory) return true;
      
      // Similar name patterns (logic.ts, route.ts, etc.)
      if (fileName.includes('logic') && otherFileName.includes('logic')) return true;
      if (fileName.includes('route') && otherFileName.includes('route')) return true;
      if (fileName.includes('convert') && otherFileName.includes('convert')) return true;
      
      return false;
    }).slice(0, 5); // Limit to 5 similar files
  }

  private analyzePattern(issue: LintIssue, similarFiles: string[]): string {
    // Check if similar files have the same issue
    let patternCount = 0;
    const sampleFiles: string[] = [];
    
    for (const file of similarFiles) {
      try {
        const content = readFileSync(join(projectRoot, file), 'utf8');
        
        // Simple pattern detection based on rule type
        let hasPattern = false;
        if (issue.ruleId === '@typescript-eslint/no-explicit-any' && content.includes(': any')) {
          hasPattern = true;
        } else if (issue.ruleId === '@typescript-eslint/no-unused-vars' && content.match(/^\s*(const|let|var)\s+\w+.*=.*$/m)) {
          hasPattern = true;
        }
        
        if (hasPattern) {
          patternCount++;
          sampleFiles.push(file);
        }
      } catch {
        // Skip files that can't be read
      }
    }
    
    if (patternCount > 0) {
      return `This issue appears in ${patternCount} similar files (${sampleFiles.slice(0, 3).join(', ')}${sampleFiles.length > 3 ? '...' : ''}). Consider applying the same fix pattern across all affected files.`;
    }
    
    return 'This appears to be an isolated issue in this file.';
  }

  private generateSummary(issues: AnalyzedIssue[]): IssueReport['summary'] {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const affectedFiles = new Set(issues.map(i => i.file)).size;
    
    const ruleCounts = issues.reduce((acc, issue) => {
      acc[issue.ruleId] = (acc[issue.ruleId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonPatterns = Object.entries(ruleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([rule, count]) => `${rule} (${count} occurrences)`);

    return {
      totalIssues: issues.length,
      errorCount,
      warningCount,
      affectedFiles,
      commonPatterns
    };
  }

  private generateRecommendations(issues: AnalyzedIssue[]): IssueReport['recommendations'] {
    const immediate: string[] = [];
    const longTerm: string[] = [];
    const patterns: string[] = [];

    // Analyze common issues for recommendations
    const ruleGroups = issues.reduce((acc, issue) => {
      if (!acc[issue.ruleId]) acc[issue.ruleId] = [];
      acc[issue.ruleId].push(issue);
      return acc;
    }, {} as Record<string, AnalyzedIssue[]>);

    for (const [ruleId, ruleIssues] of Object.entries(ruleGroups)) {
      if (ruleIssues.length > 1) {
        immediate.push(`Fix all ${ruleIssues.length} instances of ${ruleId} across the codebase`);
      }
    }

    // General recommendations
    if (issues.some(i => i.ruleId === '@typescript-eslint/no-explicit-any')) {
      longTerm.push('Implement stricter TypeScript configuration to prevent "any" usage');
      longTerm.push('Create type definitions for external APIs and data structures');
    }

    if (issues.some(i => i.ruleId === '@typescript-eslint/no-unused-vars')) {
      longTerm.push('Configure IDE to highlight unused variables automatically');
      longTerm.push('Add pre-commit hooks to catch unused code before commits');
    }

    // Pattern-based recommendations
    const fileGroups = issues.reduce((acc, issue) => {
      const dir = dirname(issue.file);
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(issue);
      return acc;
    }, {} as Record<string, AnalyzedIssue[]>);

    for (const [dir, dirIssues] of Object.entries(fileGroups)) {
      if (dirIssues.length > 2) {
        patterns.push(`Directory ${dir} has ${dirIssues.length} lint issues - consider refactoring this module`);
      }
    }

    return { immediate, longTerm, patterns };
  }

  async saveReport(report: IssueReport, outputPath: string): Promise<void> {
    writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to ${outputPath}`);
  }

  async generateMarkdownReport(report: IssueReport): Promise<string> {
    let markdown = `# Lint Analysis Report\n\n`;
    
    // Summary
    markdown += `## Summary\n\n`;
    markdown += `- **Total Issues:** ${report.summary.totalIssues}\n`;
    markdown += `- **Errors:** ${report.summary.errorCount}\n`;
    markdown += `- **Warnings:** ${report.summary.warningCount}\n`;
    markdown += `- **Affected Files:** ${report.summary.affectedFiles}\n\n`;
    
    if (report.summary.commonPatterns.length > 0) {
      markdown += `### Most Common Issues\n`;
      report.summary.commonPatterns.forEach(pattern => {
        markdown += `- ${pattern}\n`;
      });
      markdown += `\n`;
    }

    // Issues by category
    const issuesByCategory = report.issues.reduce((acc, issue) => {
      if (!acc[issue.category]) acc[issue.category] = [];
      acc[issue.category].push(issue);
      return acc;
    }, {} as Record<string, AnalyzedIssue[]>);

    for (const [category, categoryIssues] of Object.entries(issuesByCategory)) {
      markdown += `## ${category} Issues (${categoryIssues.length})\n\n`;
      
      for (const issue of categoryIssues) {
        markdown += `### ${issue.file}:${issue.line}:${issue.column}\n\n`;
        markdown += `**Rule:** \`${issue.ruleId}\`\n`;
        markdown += `**Message:** ${issue.message}\n\n`;
        markdown += `**Likely Cause:** ${issue.likelyCause}\n\n`;
        markdown += `**Suggested Solution:** ${issue.suggestedSolution}\n\n`;
        markdown += `**Prevention:** ${issue.preventionTip}\n\n`;
        
        if (issue.similarFiles.length > 0) {
          markdown += `**Similar Files:** ${issue.similarFiles.join(', ')}\n\n`;
        }
        
        markdown += `**Pattern Analysis:** ${issue.patternAnalysis}\n\n`;
        markdown += `---\n\n`;
      }
    }

    // Recommendations
    markdown += `## Recommendations\n\n`;
    
    if (report.recommendations.immediate.length > 0) {
      markdown += `### Immediate Actions\n`;
      report.recommendations.immediate.forEach(rec => {
        markdown += `- [ ] ${rec}\n`;
      });
      markdown += `\n`;
    }

    if (report.recommendations.longTerm.length > 0) {
      markdown += `### Long-term Improvements\n`;
      report.recommendations.longTerm.forEach(rec => {
        markdown += `- [ ] ${rec}\n`;
      });
      markdown += `\n`;
    }

    if (report.recommendations.patterns.length > 0) {
      markdown += `### Pattern-based Recommendations\n`;
      report.recommendations.patterns.forEach(rec => {
        markdown += `- [ ] ${rec}\n`;
      });
      markdown += `\n`;
    }

    return markdown;
  }
}

// Main execution
async function main() {
  const analyzer = new LintAnalyzer();
  const report = await analyzer.analyzeLintIssues();
  
  // Save JSON report
  const jsonPath = join(projectRoot, 'lint-analysis-report.json');
  await analyzer.saveReport(report, jsonPath);
  
  // Generate and save markdown report
  const markdown = await analyzer.generateMarkdownReport(report);
  const markdownPath = join(projectRoot, 'lint-analysis-report.md');
  writeFileSync(markdownPath, markdown);
  
  console.log('✅ Lint analysis complete!');
  console.log(`📊 Found ${report.summary.totalIssues} issues in ${report.summary.affectedFiles} files`);
  console.log(`📄 Reports saved to:`);
  console.log(`   - ${relative(process.cwd(), jsonPath)}`);
  console.log(`   - ${relative(process.cwd(), markdownPath)}`);
  
  // Exit with error code if there are errors (for CI)
  if (report.summary.errorCount > 0) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LintAnalyzer, type IssueReport, type AnalyzedIssue };