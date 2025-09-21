#!/usr/bin/env tsx
/**
 * GitHub Issue Creator
 * 
 * This script creates GitHub issues based on lint analysis reports.
 * It uses the GitHub REST API to create detailed issues with proper formatting.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { IssueReport, AnalyzedIssue } from './lint-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../');

interface GitHubIssueOptions {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

class GitHubIssueCreator {
  private token: string;
  private owner: string;
  private repo: string;
  private apiBase = 'https://api.github.com';

  constructor(token?: string, owner?: string, repo?: string) {
    this.token = token || process.env.GITHUB_TOKEN || '';
    this.owner = owner || process.env.GITHUB_REPOSITORY_OWNER || 'BorDevTech';
    this.repo = repo || process.env.GITHUB_REPOSITORY_NAME || 'ClearView';

    if (!this.token) {
      console.warn('⚠️ No GitHub token provided. Set GITHUB_TOKEN environment variable.');
    }
  }

  async createIssue(options: GitHubIssueOptions): Promise<{ number: number; url: string } | null> {
    if (!this.token) {
      console.log('🔍 Would create issue:', options.title);
      return null;
    }

    try {
      const response = await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ClearView-Lint-Automation'
        },
        body: JSON.stringify({
          title: options.title,
          body: options.body,
          labels: options.labels || [],
          assignees: options.assignees || []
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error: ${response.status} ${error}`);
      }

      const issue = await response.json();
      return {
        number: issue.number,
        url: issue.html_url
      };
    } catch (error) {
      console.error('❌ Failed to create GitHub issue:', error);
      return null;
    }
  }

  async checkExistingIssues(searchTerm: string): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(
        `${this.apiBase}/search/issues?q=repo:${this.owner}/${this.repo}+is:issue+is:open+"${searchTerm}"`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ClearView-Lint-Automation'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.total_count > 0;
      }
    } catch (error) {
      console.warn('⚠️ Could not check existing issues:', error);
    }

    return false;
  }

  async createIssuesFromReport(report: IssueReport): Promise<void> {
    console.log('📝 Creating GitHub issues from lint report...');

    // Create a summary issue if there are multiple issues
    if (report.summary.totalIssues > 5) {
      await this.createSummaryIssue(report);
    }

    // Group issues by category and file for more manageable issues
    const issueGroups = this.groupIssuesForGitHub(report.issues);

    for (const group of issueGroups) {
      const searchTerm = `lint-issue-${group.category.toLowerCase().replace(/\s+/g, '-')}`;
      const existingIssue = await this.checkExistingIssues(searchTerm);

      if (existingIssue) {
        console.log(`⏭️ Skipping ${group.category} - issue already exists`);
        continue;
      }

      const issue = await this.createIssue({
        title: group.title,
        body: group.body,
        labels: group.labels
      });

      if (issue) {
        console.log(`✅ Created issue #${issue.number}: ${group.title}`);
        console.log(`   🔗 ${issue.url}`);
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async createSummaryIssue(report: IssueReport): Promise<void> {
    const existingSummary = await this.checkExistingIssues('lint-issues-summary');
    if (existingSummary) {
      console.log('⏭️ Skipping summary issue - already exists');
      return;
    }

    const title = `🔧 Lint Issues Summary - ${report.summary.totalIssues} issues found`;
    const body = this.generateSummaryIssueBody(report);

    const issue = await this.createIssue({
      title,
      body,
      labels: ['lint', 'code-quality', 'maintenance', 'summary']
    });

    if (issue) {
      console.log(`✅ Created summary issue #${issue.number}`);
    }
  }

  private groupIssuesForGitHub(issues: AnalyzedIssue[]): Array<{
    category: string;
    title: string;
    body: string;
    labels: string[];
  }> {
    const groups: Array<{
      category: string;
      title: string;
      body: string;
      labels: string[];
    }> = [];

    // Group by rule ID for better organization
    const ruleGroups = issues.reduce((acc, issue) => {
      if (!acc[issue.ruleId]) acc[issue.ruleId] = [];
      acc[issue.ruleId].push(issue);
      return acc;
    }, {} as Record<string, AnalyzedIssue[]>);

    for (const [ruleId, ruleIssues] of Object.entries(ruleGroups)) {
      if (ruleIssues.length === 0) continue;

      const category = ruleIssues[0].category;
      const severity = ruleIssues[0].severity;
      
      groups.push({
        category,
        title: `🔧 Fix ${ruleId} violations (${ruleIssues.length} instances)`,
        body: this.generateRuleIssueBody(ruleId, ruleIssues),
        labels: [
          'lint',
          'code-quality',
          category.toLowerCase().replace(/\s+/g, '-'),
          severity === 'error' ? 'bug' : 'enhancement',
          'automated'
        ]
      });
    }

    return groups;
  }

  private generateSummaryIssueBody(report: IssueReport): string {
    let body = `## 📊 Lint Analysis Summary\n\n`;
    
    body += `**Automated analysis found ${report.summary.totalIssues} lint issues that need attention.**\n\n`;
    
    body += `### 📈 Statistics\n`;
    body += `- **Total Issues:** ${report.summary.totalIssues}\n`;
    body += `- **Errors:** ${report.summary.errorCount}\n`;
    body += `- **Warnings:** ${report.summary.warningCount}\n`;
    body += `- **Affected Files:** ${report.summary.affectedFiles}\n\n`;

    if (report.summary.commonPatterns.length > 0) {
      body += `### 🔍 Most Common Issues\n`;
      report.summary.commonPatterns.forEach(pattern => {
        body += `- ${pattern}\n`;
      });
      body += `\n`;
    }

    body += `### 🎯 Immediate Actions Required\n`;
    if (report.recommendations.immediate.length > 0) {
      report.recommendations.immediate.forEach(rec => {
        body += `- [ ] ${rec}\n`;
      });
    } else {
      body += `- [ ] Review and fix individual lint issues\n`;
    }
    body += `\n`;

    body += `### 🔮 Long-term Improvements\n`;
    if (report.recommendations.longTerm.length > 0) {
      report.recommendations.longTerm.forEach(rec => {
        body += `- [ ] ${rec}\n`;
      });
    } else {
      body += `- [ ] Consider implementing stricter linting rules\n`;
      body += `- [ ] Set up pre-commit hooks for code quality\n`;
    }
    body += `\n`;

    if (report.recommendations.patterns.length > 0) {
      body += `### 🧩 Pattern Analysis\n`;
      report.recommendations.patterns.forEach(rec => {
        body += `- ${rec}\n`;
      });
      body += `\n`;
    }

    body += `### 🤖 About This Issue\n`;
    body += `This issue was automatically created by the lint analysis system. `;
    body += `Individual issues for each rule violation will be created separately for easier tracking and resolution.\n\n`;
    
    body += `**Generated:** ${new Date().toISOString()}\n`;
    body += `**Analyzer:** ClearView Lint Automation v1.0\n`;

    return body;
  }

  private generateRuleIssueBody(ruleId: string, issues: AnalyzedIssue[]): string {
    const firstIssue = issues[0];
    let body = `## 🔧 ESLint Rule Violation: \`${ruleId}\`\n\n`;
    
    body += `**${issues.length} instance(s) of this rule violation found across the codebase.**\n\n`;

    // Analysis section
    body += `### 🔍 Analysis\n\n`;
    body += `**Likely Cause:** ${firstIssue.likelyCause}\n\n`;
    body += `**Suggested Solution:** ${firstIssue.suggestedSolution}\n\n`;
    body += `**Prevention:** ${firstIssue.preventionTip}\n\n`;

    // Affected files
    body += `### 📁 Affected Files\n\n`;
    issues.forEach(issue => {
      body += `- \`${issue.file}:${issue.line}:${issue.column}\` - ${issue.message}\n`;
    });
    body += `\n`;

    // Pattern analysis if multiple files
    if (issues.length > 1) {
      body += `### 🧩 Pattern Analysis\n\n`;
      const fileGroups = issues.reduce((acc, issue) => {
        const dir = dirname(issue.file);
        if (!acc[dir]) acc[dir] = [];
        acc[dir].push(issue);
        return acc;
      }, {} as Record<string, AnalyzedIssue[]>);

      for (const [dir, dirIssues] of Object.entries(fileGroups)) {
        if (dirIssues.length > 1) {
          body += `**Directory \`${dir}\`** has ${dirIssues.length} instances of this issue. `;
          body += `Consider applying a consistent fix pattern across this module.\n\n`;
        }
      }

      // Check for similar files pattern
      const hasPattern = issues.some(issue => issue.similarFiles.length > 0);
      if (hasPattern) {
        body += `**Similar File Pattern Detected:** This issue appears in files with similar naming patterns. `;
        body += `Consider reviewing the template or base implementation that these files might share.\n\n`;
      }
    }

    // Fix instructions
    body += `### 🛠️ How to Fix\n\n`;
    body += `1. **Review each affected file** listed above\n`;
    body += `2. **Apply the suggested solution** for each instance\n`;
    body += `3. **Test the changes** to ensure functionality is preserved\n`;
    body += `4. **Run \`npm run lint\`** to verify the fixes\n\n`;

    if (issues.length > 3) {
      body += `**Tip:** Since this affects multiple files, consider using find-and-replace tools or IDE refactoring features for consistent fixes.\n\n`;
    }

    // Additional context for specific rules
    body += this.getAdditionalRuleContext(ruleId);

    body += `### 🤖 Issue Details\n\n`;
    body += `- **Rule:** \`${ruleId}\`\n`;
    body += `- **Category:** ${firstIssue.category}\n`;
    body += `- **Severity:** ${firstIssue.severity}\n`;
    body += `- **Auto-generated:** ${new Date().toISOString()}\n`;

    return body;
  }

  private getAdditionalRuleContext(ruleId: string): string {
    const contexts: Record<string, string> = {
      '@typescript-eslint/no-unused-vars': `
### 📚 Additional Resources

- [ESLint Rule Documentation](https://typescript-eslint.io/rules/no-unused-vars/)
- **Quick Fix:** Remove unused variables or prefix with underscore if intentionally unused
- **IDE Setup:** Configure your editor to highlight unused variables automatically

`,
      '@typescript-eslint/no-explicit-any': `
### 📚 Additional Resources

- [ESLint Rule Documentation](https://typescript-eslint.io/rules/no-explicit-any/)
- [TypeScript Best Practices](https://typescript-eslint.io/docs/linting/troubleshooting/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined)
- **Quick Fix:** Replace \`any\` with proper types, \`unknown\`, or union types
- **For External APIs:** Create interface definitions instead of using \`any\`

`,
      '@typescript-eslint/no-unused-imports': `
### 📚 Additional Resources

- [ESLint Rule Documentation](https://typescript-eslint.io/rules/no-unused-imports/)
- **Quick Fix:** Remove unused import statements
- **IDE Setup:** Enable "Organize Imports" on save to automatically remove unused imports

`
    };

    return contexts[ruleId] || `
### 📚 Additional Resources

- [ESLint Documentation](https://eslint.org/docs/latest/rules/)
- Check the specific rule documentation for detailed guidance

`;
  }
}

// Main execution function
async function main() {
  const reportPath = join(projectRoot, 'lint-analysis-report.json');
  
  try {
    const reportContent = readFileSync(reportPath, 'utf8');
    const report: IssueReport = JSON.parse(reportContent);
    
    const issueCreator = new GitHubIssueCreator();
    await issueCreator.createIssuesFromReport(report);
    
    console.log('✅ GitHub issue creation complete!');
  } catch (error) {
    console.error('❌ Failed to create GitHub issues:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { GitHubIssueCreator };