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
      // Search for issues with the specific rule ID in the title
      const searchQuery = `repo:${this.owner}/${this.repo}+is:issue+is:open+"Fix ${ruleId} violations"`;
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
          const issue = data.items[0];
          return {
            number: issue.number,
            title: issue.title,
            body: issue.body
          };
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
        await this.addCommentToIssue(issueNumber, `🎉 **Issue Resolved!**\n\nAll instances of \`${ruleId}\` violations have been fixed. This issue is now automatically closed.\n\n*Closed by ClearView Lint Automation on ${new Date().toISOString()}*`);
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

  async updateExistingIssue(existingIssue: { number: number; title: string; body: string }, newGroup: any, ruleId: string): Promise<void> {
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
      // Extract the rule ID from the title for more specific duplicate checking
      const ruleIdMatch = group.title.match(/Fix (.+?) violations/);
      const ruleId = ruleIdMatch ? ruleIdMatch[1] : group.category;
      
      const existingIssue = await this.checkExistingRuleIssue(ruleId);

      if (existingIssue) {
        console.log(`⏭️ Skipping ${ruleId} - issue already exists (#${existingIssue.number})`);
        // Optionally update the existing issue with new information
        await this.updateExistingIssue(existingIssue, group, ruleId);
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

  private generateCodeExample(ruleId: string, issue: AnalyzedIssue): string {
    const examples: Record<string, (issue: AnalyzedIssue) => string> = {
      '@typescript-eslint/no-unused-vars': (issue) => {
        const fileName = issue.file.split('/').pop() || 'file';
        
        if (issue.message.includes('VetRecord')) {
          return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
import { VetResult } from "@/app/types/vet-result";

interface VetRecord {  // ← This interface is defined but never used
  first_name: string;
  last_name: string;
  // ... other properties
}

export async function verify() {
  // Implementation without using VetRecord
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
import { VetResult } from "@/app/types/vet-result";

// Option 1: Remove the unused interface entirely
export async function verify() {
  // Implementation 
}

// Option 2: If you plan to use it later, prefix with underscore
interface _VetRecord {  // ← Prefixed to indicate intentionally unused
  first_name: string;
  last_name: string;
  // ... other properties
}
\`\`\`

`;
        } else if (issue.message.includes('searchParams')) {
          return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);  // ← Assigned but never used
  // const firstName = searchParams.get("firstname") || "";
  // const lastName = searchParams.get("lastname") || "";
  
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

  // Option 2: If you need it later, use it immediately
  const { searchParams } = new URL(request.url);
  const firstName = searchParams.get("firstname") || "";
  const lastName = searchParams.get("lastname") || "";
  
  // ... use firstName, lastName in implementation
}
\`\`\`

`;
        } else if (issue.message.includes('key')) {
          return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
export async function GET(request: NextRequest) {
  const key = "florida";  // ← Assigned but never used
  
  // Implementation without using key variable
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

  // Option 2: Use the key variable in implementation
  const key = "florida";
  const response = await fetch(\`/api/verify/\${key}\`);
  return response;
}
\`\`\`

`;
        }
        
        // Generic unused variable example
        return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
function example() {
  const unusedVariable = "some value";  // ← Never used
  return "result";
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
function example() {
  // Option 1: Remove unused variable
  return "result";

  // Option 2: Use the variable
  const usedVariable = "some value";
  return usedVariable;

  // Option 3: Prefix with underscore if intentionally unused
  const _unusedVariable = "some value";
  return "result";
}
\`\`\`

`;
      },

      '@typescript-eslint/no-explicit-any': (issue) => {
        if (issue.message.includes('parseBlob')) {
          return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
function parseBlob(raw: any): RawVetEntry[] {  // ← Using 'any' type
  return Array.isArray(raw) ? raw : raw.blob ?? [];
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
// Option 1: Define a proper interface for the raw data
interface ApiResponse {
  blob?: RawVetEntry[];
}

function parseBlob(raw: ApiResponse | RawVetEntry[]): RawVetEntry[] {
  return Array.isArray(raw) ? raw : raw.blob ?? [];
}

// Option 2: Use 'unknown' for safer type handling
function parseBlob(raw: unknown): RawVetEntry[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object' && raw !== null && 'blob' in raw) {
    return (raw as { blob?: RawVetEntry[] }).blob ?? [];
  }
  return [];
}
\`\`\`

`;
        }
        
        return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
function processData(data: any) {  // ← Using 'any' defeats type safety
  return data.someProperty;
}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
// Option 1: Define proper interface
interface DataStructure {
  someProperty: string;
  // ... other known properties
}

function processData(data: DataStructure) {
  return data.someProperty;
}

// Option 2: Use generic type
function processData<T extends { someProperty: string }>(data: T) {
  return data.someProperty;
}

// Option 3: Use 'unknown' for external APIs
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as { someProperty: string }).someProperty;
  }
  throw new Error('Invalid data structure');
}
\`\`\`

`;
      }
    };

    const generator = examples[ruleId];
    return generator ? generator(issue) : '';
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

  private generateUpdatedIssueBody(newGroupBody: string, currentCount: number, newCount: number): string {
    return `${newGroupBody}\n\n---\n\n**🔄 Issue Updated:** ${new Date().toISOString()}\n**Previous Count:** ${currentCount} instances\n**Current Count:** ${newCount} instances`;
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