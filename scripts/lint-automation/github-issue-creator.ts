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

  async checkExistingRuleIssue(ruleId: string): Promise<{ number: number; title: string; body: string } | null> {
    if (!this.token) return null;

    try {
      // Search for issues with the specific rule ID using multiple strategies
      const searchQueries = [
        `repo:${this.owner}/${this.repo}+is:issue+is:open+"Fix ${ruleId} violations"`,
        `repo:${this.owner}/${this.repo}+is:issue+is:open+"${ruleId}"+label:lint+label:automated`,
        `repo:${this.owner}/${this.repo}+is:issue+is:open+in:body+"Rule: ${ruleId}"`
      ];

      for (const searchQuery of searchQueries) {
        const response = await fetch(
          `${this.apiBase}/search/issues?q=${encodeURIComponent(searchQuery)}`,
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
          if (data.total_count > 0) {
            // Find the most recent issue for this rule
            const ruleIssues = data.items.filter((issue: any) => 
              issue.title.includes(ruleId) ||
              issue.body.includes(`**Rule:** \`${ruleId}\``) ||
              issue.body.includes(`## 🔧 ${ruleId}`)
            );
            
            if (ruleIssues.length > 0) {
              const issue = ruleIssues[0]; // Most recent
              console.log(`🔍 Found existing issue for ${ruleId}: #${issue.number} - ${issue.title}`);
              return {
                number: issue.number,
                title: issue.title,
                body: issue.body
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not check existing issues for rule ${ruleId}:`, error);
    }

    return null;
  }

  async closeResolvedIssues(report: IssueReport): Promise<void> {
    if (!this.token) {
      console.log('🔍 Would check for resolved lint issues to close');
      return;
    }

    try {
      // Get all open lint issues created by automation
      const response = await fetch(
        `${this.apiBase}/search/issues?q=repo:${this.owner}/${this.repo}+is:issue+is:open+label:automated+label:lint`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ClearView-Lint-Automation'
          }
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const openLintIssues = data.items || [];

      // Get current rule IDs from the report
      const currentRuleIds = new Set(report.issues.map(issue => issue.ruleId));

      for (const issue of openLintIssues) {
        // Extract rule ID from issue title
        const ruleIdMatch = issue.title.match(/Fix (.+?) violations/);
        if (!ruleIdMatch) continue;

        const ruleId = ruleIdMatch[1];

        // If this rule is no longer in the current report, the issue is resolved
        if (!currentRuleIds.has(ruleId)) {
          await this.closeResolvedIssue(issue.number, ruleId);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check for resolved issues:', error);
    }
  }

  async closeResolvedIssue(issueNumber: number, ruleId: string): Promise<void> {
    if (!this.token) return;

    try {
      const response = await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ClearView-Lint-Automation'
        },
        body: JSON.stringify({
          state: 'closed',
          state_reason: 'completed'
        })
      });

      if (response.ok) {
        // Add a comment explaining the closure
        const resolvedComment = this.generateResolvedIssueComment(ruleId);
        await this.addCommentToIssue(issueNumber, resolvedComment);
        console.log(`✅ Closed resolved issue #${issueNumber} for rule ${ruleId}`);
      } else {
        console.warn(`⚠️ Failed to close issue #${issueNumber}:`, response.statusText);
      }
    } catch (error) {
      console.warn(`⚠️ Could not close resolved issue #${issueNumber}:`, error);
    }
  }

  async addCommentToIssue(issueNumber: number, comment: string): Promise<void> {
    if (!this.token) return;

    try {
      await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ClearView-Lint-Automation'
        },
        body: JSON.stringify({ body: comment })
      });
    } catch (error) {
      console.warn(`⚠️ Could not add comment to issue #${issueNumber}:`, error);
    }
  }

  async updateExistingIssue(existingIssue: { number: number; title: string; body: string }, newGroup: { title: string; body: string }, ruleId: string): Promise<void> {
    if (!this.token) {
      console.log(`🔍 Would update existing issue #${existingIssue.number} for rule ${ruleId}`);
      return;
    }

    try {
      // Extract current instance count from existing title
      const currentCountMatch = existingIssue.title.match(/\((\d+) instances?\)/);
      const currentCount = currentCountMatch ? parseInt(currentCountMatch[1]) : 0;
      
      // Extract new instance count from new group title
      const newCountMatch = newGroup.title.match(/\((\d+) instances?\)/);
      const newCount = newCountMatch ? parseInt(newCountMatch[1]) : 0;

      // Only update if the count has changed (indicating new violations or fixes)
      if (newCount !== currentCount) {
        const updatedTitle = `🔧 Fix ${ruleId} violations (${newCount} instances)`;
        const updatedBody = this.generateUpdatedIssueBody(newGroup.body, currentCount, newCount);

        const response = await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}/issues/${existingIssue.number}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ClearView-Lint-Automation'
          },
          body: JSON.stringify({
            title: updatedTitle,
            body: updatedBody
          })
        });

        if (response.ok) {
          console.log(`✅ Updated existing issue #${existingIssue.number} for ${ruleId} (${currentCount} → ${newCount} instances)`);
        } else {
          console.warn(`⚠️ Failed to update issue #${existingIssue.number}:`, response.statusText);
        }
      } else {
        console.log(`ℹ️ Issue #${existingIssue.number} for ${ruleId} already up to date (${newCount} instances)`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not update existing issue #${existingIssue.number}:`, error);
    }
  }

  async createIssuesFromReport(report: IssueReport): Promise<void> {
    console.log('📝 Creating GitHub issues from lint report...');

    // Check for resolved issues and close them
    await this.closeResolvedIssues(report);

    // Create a summary issue if there are multiple issues
    if (report.summary.totalIssues > 5) {
      await this.createSummaryIssue(report);
    }

    // Group issues by category and file for more manageable issues
    const issueGroups = this.groupIssuesForGitHub(report.issues);

    for (const group of issueGroups) {
      try {
        // With new file-based format, the title is now the filename
        const fileName = group.title;
        
        // Check for existing rule-based issues (for backward compatibility)
        // Extract rule IDs from the body to check old format issues
        const ruleIdMatches = group.body.match(/## 🔧 ([^\n]+)/g);
        let existingOldIssue = null;
        
        if (ruleIdMatches) {
          for (const match of ruleIdMatches) {
            const ruleId = match.replace('## 🔧 ', '').trim();
            const existing = await this.checkExistingRuleIssue(ruleId);
            if (existing) {
              existingOldIssue = existing;
              console.log(`🔍 Found existing rule-based issue for ${ruleId}: #${existing.number}`);
              break;
            }
          }
        }

        // Also check for filename-based issues (new format)
        const existingFileIssue = await this.checkExistingFileIssue(fileName);
        
        if (existingFileIssue) {
          console.log(`⏭️ Skipping ${fileName} - file-based issue already exists (#${existingFileIssue.number})`);
          continue;
        }

        if (existingOldIssue) {
          console.log(`⏭️ Found old rule-based issue (#${existingOldIssue.number}) - will migrate to file-based format`);
          // Close the old issue and let the new one be created
          await this.closeOldIssueForMigration(existingOldIssue.number, fileName);
        }

        // Add race condition protection: wait a random delay to prevent simultaneous creation
        const delay = Math.floor(Math.random() * 3000) + 1000; // 1-4 seconds
        console.log(`🕐 Waiting ${Math.round(delay/1000)}s to prevent race conditions...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Final check for existing issues after delay (race condition protection)
        const finalFileCheck = await this.checkExistingFileIssue(fileName);
        if (finalFileCheck) {
          console.log(`⏭️ Race condition detected: ${fileName} - issue was created by another process (#${finalFileCheck.number})`);
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

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.warn(`⚠️ Failed to process group for ${group.title}:`, error);
        // Continue with next group instead of failing completely
        continue;
      }
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

  /**
   * Generates a standardized comment for when lint issues are automatically resolved.
   * @param ruleId - The ESLint rule ID that was resolved
   * @returns Formatted comment explaining the automatic closure
   */
  private generateResolvedIssueComment(ruleId: string): string {
    return `🎉 **Issue Resolved!**

All instances of \`${ruleId}\` violations have been fixed. This issue is now automatically closed.

*Closed by ClearView Lint Automation on ${new Date().toISOString()}*`;
  }

  /**
   * Generates an updated issue body with metadata about the change.
   * @param newGroupBody - The new issue body content
   * @param currentCount - Previous number of violations
   * @param newCount - Current number of violations
   * @returns Updated issue body with change metadata
   */
  private generateUpdatedIssueBody(newGroupBody: string, currentCount: number, newCount: number): string {
    return `${newGroupBody}

---

**🔄 Issue Updated:** ${new Date().toISOString()}
**Previous Count:** ${currentCount} instances
**Current Count:** ${newCount} instances`;
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

    // Group by file instead of rule (as requested by user)
    const fileGroups = issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, AnalyzedIssue[]>);

    for (const [filePath, fileIssues] of Object.entries(fileGroups)) {
      if (fileIssues.length === 0) continue;

      const fileName = filePath.split('/').pop() || filePath;
      const category = fileIssues[0].category;
      const severity = fileIssues.some(issue => issue.severity === 'error') ? 'error' : 'warning';
      
      // Create title using filename as requested by user
      groups.push({
        category,
        title: fileName,
        body: this.generateFileIssueBody(fileName, filePath, fileIssues),
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

    // Fix instructions with code examples
    body += `### 🛠️ How to Fix\n\n`;
    
    // Add specific code examples for this rule
    const codeExample = this.generateCodeExample(ruleId, issues[0]);
    if (codeExample) {
      body += codeExample;
    }
    
    body += `#### Step-by-Step Instructions:\n`;
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

  private generateFileIssueBody(fileName: string, filePath: string, issues: AnalyzedIssue[]): string {
    // Group issues by rule in this file
    const ruleGroups = issues.reduce((acc, issue) => {
      if (!acc[issue.ruleId]) acc[issue.ruleId] = [];
      acc[issue.ruleId].push(issue);
      return acc;
    }, {} as Record<string, AnalyzedIssue[]>);

    const ruleCount = Object.keys(ruleGroups).length;
    const totalIssues = issues.length;
    
    let body = `# ${fileName}\n\n`;
    body += `**${totalIssues} lint issue(s) found in this file across ${ruleCount} rule(s).**\n\n`;

    // File info
    body += `### 📁 File Details\n\n`;
    body += `- **File:** \`${filePath}\`\n`;
    body += `- **Issues:** ${totalIssues}\n`;
    body += `- **Rules:** ${Object.keys(ruleGroups).join(', ')}\n\n`;

    // List each rule violation with the problem as a header
    for (const [ruleId, ruleIssues] of Object.entries(ruleGroups)) {
      const firstIssue = ruleIssues[0];
      body += `## 🔧 ${ruleId}\n\n`;
      body += `**${ruleIssues.length} instance(s) of this rule violation.**\n\n`;
      
      // Analysis for this rule
      body += `### 🔍 Analysis\n\n`;
      body += `**Likely Cause:** ${firstIssue.likelyCause}\n\n`;
      body += `**Suggested Solution:** ${firstIssue.suggestedSolution}\n\n`;
      body += `**Prevention:** ${firstIssue.preventionTip}\n\n`;

      // Specific violations in this file
      body += `### 📍 Violations\n\n`;
      ruleIssues.forEach(issue => {
        body += `- **Line ${issue.line}:${issue.column}** - ${issue.message}\n`;
      });
      body += `\n`;

      // Add specific code examples for this rule
      const codeExample = this.generateCodeExample(ruleId, ruleIssues[0]);
      if (codeExample) {
        body += codeExample;
      }

      // Additional context for specific rules
      body += this.getAdditionalRuleContext(ruleId);
    }

    // Fix instructions
    body += `### 🛠️ How to Fix\n\n`;
    body += `#### Step-by-Step Instructions:\n`;
    body += `1. **Open the file** \`${filePath}\`\n`;
    body += `2. **Review each violation** listed above\n`;
    body += `3. **Apply the suggested solution** for each rule\n`;
    body += `4. **Test the changes** to ensure functionality is preserved\n`;
    body += `5. **Run \`npm run lint\`** to verify the fixes\n\n`;

    if (totalIssues > 1) {
      body += `**Tip:** This file has multiple lint issues. Consider fixing them all at once for consistency.\n\n`;
    }

    body += `### 🤖 Issue Details\n\n`;
    body += `- **File:** \`${filePath}\`\n`;
    body += `- **Total Issues:** ${totalIssues}\n`;
    body += `- **Rules:** ${Object.keys(ruleGroups).map(rule => `\`${rule}\``).join(', ')}\n`;
    body += `- **Auto-generated:** ${new Date().toISOString()}\n`;

    return body;
  }

  async checkExistingFileIssue(fileName: string): Promise<{ number: number; title: string; body: string } | null> {
    if (!this.token) return null;

    try {
      // Search for issues with the filename as title
      const searchQuery = `repo:${this.owner}/${this.repo}+is:issue+is:open+"${fileName}"+label:lint+label:automated`;
      
      const response = await fetch(
        `${this.apiBase}/search/issues?q=${encodeURIComponent(searchQuery)}`,
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
        if (data.total_count > 0) {
          // Find exact title match (case-insensitive)
          const exactMatch = data.items.find((issue: any) => issue.title.toLowerCase() === fileName.toLowerCase());
          if (exactMatch) {
            console.log(`🔍 Found existing file-based issue for ${fileName}: #${exactMatch.number}`);
            return {
              number: exactMatch.number,
              title: exactMatch.title,
              body: exactMatch.body
            };
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not check existing issues for file ${fileName}:`, error);
    }

    return null;
  }

  async closeOldIssueForMigration(issueNumber: number, fileName: string): Promise<void> {
    if (!this.token) return;

    try {
      // Add a comment explaining the migration
      const migrationComment = `🔄 **Issue Format Migration**

This issue is being closed as we're migrating to a new file-based issue format for better organization.

**Old format:** Rule-based grouping
**New format:** File-based grouping (\`${fileName}\`)

A new issue will be created with the updated format to track the same lint violations.

*Migrated by ClearView Lint Automation on ${new Date().toISOString()}*`;

      await this.addCommentToIssue(issueNumber, migrationComment);

      // Close the issue
      const response = await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ClearView-Lint-Automation'
        },
        body: JSON.stringify({
          state: 'closed',
          state_reason: 'completed'
        })
      });

      if (response.ok) {
        console.log(`✅ Closed old format issue #${issueNumber} for migration to file-based format`);
      } else {
        console.warn(`⚠️ Failed to close old format issue #${issueNumber}:`, response.statusText);
      }
    } catch (error) {
      console.warn(`⚠️ Could not close old format issue #${issueNumber}:`, error);
    }
  }

  private generateCodeExample(ruleId: string, issue: AnalyzedIssue): string {
    // Configuration-based mapping for code examples
    type ExampleConfig = {
      ruleId: string;
      identifierPattern?: RegExp;
      contextPatterns?: {
        pattern: RegExp;
        exampleType: string;
      }[];
      exampleGenerator: (issue: AnalyzedIssue, identifier?: string, context?: string) => string;
    };

    const exampleConfigs: ExampleConfig[] = [
      {
        ruleId: '@typescript-eslint/no-unused-vars',
        // Regex to extract the unused variable/interface name from the message
        identifierPattern: /'([^']+)' is (defined but never used|assigned a value but never used)/,
        // Context patterns to determine the type of example to show
        contextPatterns: [
          { pattern: /interface\s+\w+/i, exampleType: 'interface' },
          { pattern: /const\s+{\s*\w+\s*}\s*=.*URL/i, exampleType: 'url-destructuring' },
          { pattern: /const\s+\w+\s*=.*["']\w+["']/i, exampleType: 'string-constant' },
          { pattern: /function\s+\w+\s*\(/i, exampleType: 'function-param' },
          { pattern: /=>\s*{/i, exampleType: 'arrow-function' }
        ],
        exampleGenerator: (issue, identifier, context) => {
          const unusedName = identifier || 'UnusedIdentifier';
          
          // Determine context from file path and source code patterns
          const isInterface = context === 'interface' || issue.message.includes('interface') || /^[A-Z]/.test(unusedName);
          const isURLParams = context === 'url-destructuring' || unusedName.toLowerCase().includes('param');
          const isConstant = context === 'string-constant' || unusedName === 'key';
          
          if (isInterface) {
            return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
interface ${unusedName} {  // ← This interface is defined but never used
  first_name: string;
  last_name: string;
  // ... other properties
}

export async function verify() {
  // Implementation without using ${unusedName}
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
// Option 1: Remove the unused interface entirely
export async function verify() {
  // Implementation 
}

// Option 2: If you plan to use it later, prefix with underscore
interface _${unusedName} {  // ← Prefixed to indicate intentionally unused
  first_name: string;
  last_name: string;
  // ... other properties
}

// Option 3: Use the interface in your code
interface ${unusedName} {
  first_name: string;
  last_name: string;
}

export async function verify(): Promise<${unusedName}[]> {
  // Use the interface as return type or parameter
  return [];
}
\`\`\`

`;
          } else if (isURLParams) {
            return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
export async function GET(request: NextRequest) {
  const { ${unusedName} } = new URL(request.url);  // ← Assigned but never used
  
  const key = "state-name";
  // ... rest of implementation
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
export async function GET(request: NextRequest) {
  // Option 1: Remove if truly not needed
  const key = "state-name";
  // ... rest of implementation

  // Option 2: Use the URL parameters
  const { ${unusedName} } = new URL(request.url);
  const firstName = ${unusedName}.get("firstname") || "";
  const lastName = ${unusedName}.get("lastname") || "";
  
  // ... use parameters in implementation
}
\`\`\`

`;
          } else if (isConstant) {
            return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
export async function GET(request: NextRequest) {
  const ${unusedName} = "some-value";  // ← Assigned but never used
  
  // Implementation without using the ${unusedName} variable
  const response = await fetch(someUrl);
  return response;
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
export async function GET(request: NextRequest) {
  // Option 1: Remove if not needed
  const response = await fetch(someUrl);
  return response;

  // Option 2: Use the variable in implementation
  const ${unusedName} = "some-value";
  const response = await fetch(\`/api/verify/\${${unusedName}}\`);
  return response;
}
\`\`\`

`;
          }
          
          // Generic unused variable example for other cases
          return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
function example() {
  const ${unusedName} = "some value";  // ← Variable defined but never used
  return "result";
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
function example() {
  // Option 1: Remove unused variable
  return "result";

  // Option 2: Use the variable
  const ${unusedName} = "some value";
  return ${unusedName};

  // Option 3: Prefix with underscore if intentionally unused
  const _${unusedName} = "some value";
  return "result";
}
\`\`\`

`;
        }
      },
      {
        ruleId: '@typescript-eslint/no-explicit-any',
        identifierPattern: /Unexpected any\./,
        contextPatterns: [
          { pattern: /function\s+\w+\s*\([^)]*:\s*any/i, exampleType: 'function-param' },
          { pattern: /:\s*any\s*\)/i, exampleType: 'return-type' },
          { pattern: /const\s+\w+\s*:\s*any/i, exampleType: 'variable-type' }
        ],
        exampleGenerator: (issue, identifier, context) => {
          // Try to extract function name or variable name from the issue context
          const functionMatch = issue.source?.match(/function\s+(\w+)/i);
          const variableMatch = issue.source?.match(/(?:const|let|var)\s+(\w+)/i);
          const paramMatch = issue.source?.match(/(\w+)\s*:\s*any/i);
          
          const functionName = functionMatch?.[1] || 'processData';
          const variableName = variableMatch?.[1] || paramMatch?.[1] || 'data';
          
          return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
function ${functionName}(${variableName}: any) {  // ← Using 'any' defeats type safety
  return ${variableName}.someProperty;
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
// Option 1: Define proper interface for known structure
interface DataStructure {
  someProperty: string;
  // ... other known properties
}

function ${functionName}(${variableName}: DataStructure) {
  return ${variableName}.someProperty;
}

// Option 2: Use generic type for flexible typing
function ${functionName}<T extends { someProperty: string }>(${variableName}: T) {
  return ${variableName}.someProperty;
}

// Option 3: Use 'unknown' for safer handling of external data
function ${functionName}(${variableName}: unknown) {
  if (typeof ${variableName} === 'object' && ${variableName} !== null && 'someProperty' in ${variableName}) {
    return (${variableName} as { someProperty: string }).someProperty;
  }
  throw new Error('Invalid data structure');
}

// Option 4: For array/object union types (like API responses)
type ApiResponse = SomeType[] | { data: SomeType[] };
function ${functionName}(${variableName}: ApiResponse) {
  return Array.isArray(${variableName}) ? ${variableName} : ${variableName}.data;
}
\`\`\`

`;
        }
      },
      {
        ruleId: '@typescript-eslint/no-unused-imports',
        identifierPattern: /'([^']+)' is defined but never used/,
        exampleGenerator: (issue, identifier) => {
          const importName = identifier || 'UnusedImport';
          
          return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
import { ${importName}, SomeOtherType } from './types';  // ← ${importName} is imported but never used

export function example(): SomeOtherType {
  // Implementation using only SomeOtherType
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
import { SomeOtherType } from './types';  // ← Removed unused import

export function example(): SomeOtherType {
  // Implementation using only SomeOtherType
}

// Alternative: Use the import if it's actually needed
import { ${importName}, SomeOtherType } from './types';

export function example(): SomeOtherType {
  // Use ${importName} in your implementation
  const processed: ${importName} = processData();
  return processed as SomeOtherType;
}
\`\`\`

`;
        }
      }
      // Add more rule configurations here as needed
    ];

    // Find a matching config for the ruleId
    const config = exampleConfigs.find(cfg => cfg.ruleId === ruleId);
    if (config) {
      let identifier: string | undefined = undefined;
      let context: string | undefined = undefined;
      
      // Extract identifier from the error message using regex
      if (config.identifierPattern) {
        const match = issue.message.match(config.identifierPattern);
        if (match && match[1]) {
          identifier = match[1];
        }
      }
      
      // Determine context based on source code patterns
      if (config.contextPatterns && issue.source) {
        for (const contextPattern of config.contextPatterns) {
          if (contextPattern.pattern.test(issue.source)) {
            context = contextPattern.exampleType;
            break;
          }
        }
      }
      
      return config.exampleGenerator(issue, identifier, context);
    }
    
    // Default: no example available
    return '';
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