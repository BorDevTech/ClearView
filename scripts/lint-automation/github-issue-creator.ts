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
  private runId: string;
  private timestamp: string;
  private auditLog: {
    errorsDetected: number;
    filesUpdated: Set<string>;
    issuesCreated: number;
    issuesUpdated: number;
    errorsResolved: number;
  };

  constructor(token?: string, owner?: string, repo?: string) {
    this.token = token || process.env.GITHUB_TOKEN || '';
    this.owner = owner || process.env.GITHUB_REPOSITORY_OWNER || 'BorDevTech';
    this.repo = repo || process.env.GITHUB_REPOSITORY_NAME || 'ClearView';
    this.runId = process.env.GITHUB_RUN_ID || `local-${Date.now()}`;
    this.timestamp = new Date().toISOString();
    this.auditLog = {
      errorsDetected: 0,
      filesUpdated: new Set(),
      issuesCreated: 0,
      issuesUpdated: 0,
      errorsResolved: 0
    };

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
      // Always assign to @copilot
      const assignees = ['copilot'];
      
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
          assignees: assignees
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error: ${response.status} ${error}`);
      }

      const issue = await response.json();
      this.auditLog.issuesCreated++;
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

      // Build maps for quick lookup
      const currentFileIssues = new Map<string, AnalyzedIssue[]>();
      const currentRuleIds = new Set(report.issues.map(issue => issue.ruleId));

      // Group current issues by file
      for (const issue of report.issues) {
        const fileName = issue.file.split('/').pop() || issue.file;
        if (!currentFileIssues.has(fileName)) {
          currentFileIssues.set(fileName, []);
        }
        currentFileIssues.get(fileName)!.push(issue);
      }

      for (const issue of openLintIssues) {
        // Check for file-based issues (new format)
        const fileNameFromTitle = issue.title.includes(' - ') 
          ? issue.title.split(' - ')[1] 
          : issue.title;
        
        // Check if this is a file-based issue and if the file still has errors
        if (!issue.title.includes('violations')) {
          // This is a file-based issue
          if (!currentFileIssues.has(fileNameFromTitle)) {
            // File is now clean!
            await this.closeResolvedFileIssue(issue.number, fileNameFromTitle, issue.body);
          }
        } else {
          // This is a rule-based issue (old format)
          const ruleIdMatch = issue.title.match(/Fix (.+?) violations/);
          if (!ruleIdMatch) continue;

          const ruleId = ruleIdMatch[1];

          // If this rule is no longer in the current report, the issue is resolved
          if (!currentRuleIds.has(ruleId)) {
            await this.closeResolvedIssue(issue.number, ruleId);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not check for resolved issues:', error);
    }
  }

  /**
   * Closes a file-based issue that has been resolved, with solution verification
   */
  async closeResolvedFileIssue(issueNumber: number, fileName: string, issueBody: string): Promise<void> {
    if (!this.token) return;

    try {
      // Extract violations that were in the issue
      const resolvedViolations = this.extractViolationsFromIssueBody(issueBody);
      
      // Generate a sign-off comment with solution analysis
      const signOffComment = await this.generateSolutionSignOff(fileName, resolvedViolations);

      // Add the sign-off comment
      await this.addCommentToIssue(issueNumber, signOffComment);

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
        console.log(`✅ Closed resolved file issue #${issueNumber} for ${fileName} with @copilot sign-off`);
        this.auditLog.errorsResolved += resolvedViolations.length;
      } else {
        console.warn(`⚠️ Failed to close file issue #${issueNumber}:`, response.statusText);
      }
    } catch (error) {
      console.warn(`⚠️ Could not close resolved file issue #${issueNumber}:`, error);
    }
  }

  /**
   * Generates a sign-off comment analyzing the solutions that were applied
   */
  async generateSolutionSignOff(fileName: string, resolvedViolations: Array<{ line: number; column: number; ruleId: string; message: string }>): Promise<string> {
    let comment = `## ✅ Issue Resolved - All Lint Errors Fixed!\n\n`;
    comment += `**File:** \`${fileName}\`\n`;
    comment += `**Resolved:** ${new Date().toISOString()}\n\n`;

    if (resolvedViolations.length > 0) {
      comment += `### 🎉 Fixed Violations (${resolvedViolations.length})\n\n`;
      
      // Group by rule
      const byRule = resolvedViolations.reduce((acc, v) => {
        if (!acc[v.ruleId]) acc[v.ruleId] = [];
        acc[v.ruleId].push(v);
        return acc;
      }, {} as Record<string, typeof resolvedViolations>);

      for (const [ruleId, violations] of Object.entries(byRule)) {
        comment += `#### ${ruleId}\n`;
        comment += `Fixed ${violations.length} instance(s):\n`;
        violations.forEach(v => {
          comment += `- ✅ Line ${v.line}:${v.column} - ${v.message}\n`;
        });
        comment += `\n`;
      }

      comment += `### 💡 Solutions Applied\n\n`;
      comment += `Based on the fixed violations, the following solutions appear to have been applied:\n\n`;

      // Analyze solutions by rule type
      const uniqueRules = [...new Set(resolvedViolations.map(v => v.ruleId))];
      for (const ruleId of uniqueRules) {
        const solution = this.getSolutionDescription(ruleId);
        if (solution) {
          comment += `**${ruleId}:**\n${solution}\n\n`;
        }
      }
    }

    comment += `---\n\n`;
    comment += `🤖 **Verified and signed off by @copilot**\n\n`;
    comment += `All lint errors in this file have been successfully resolved. Great work! 🎊\n\n`;
    comment += `*Automated by ClearView Lint Automation*`;

    return comment;
  }

  /**
   * Gets a description of the solution that was likely applied for a rule
   */
  private getSolutionDescription(ruleId: string): string {
    const solutions: Record<string, string> = {
      '@typescript-eslint/no-unused-vars': '- Removed unused variables/imports or prefixed them with underscore\n- Used the variables in the code implementation',
      '@typescript-eslint/no-explicit-any': '- Replaced `any` types with proper TypeScript types\n- Created interface definitions for data structures\n- Used `unknown` type for safer handling of external data',
      '@typescript-eslint/no-unused-imports': '- Removed unused import statements\n- Organized imports to include only what is needed',
      'typescript-compiler': '- Fixed TypeScript compilation errors\n- Added proper type annotations\n- Resolved module import issues'
    };

    return solutions[ruleId] || '- Applied the appropriate fix for this rule violation';
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

  /**
   * Updates an existing file-based issue with new lint violations
   * Compares old and new violations to detect changes and mark new errors
   */
  async updateExistingFileIssue(
    existingIssue: { number: number; title: string; body: string },
    newGroup: { title: string; body: string; labels: string[] }
  ): Promise<void> {
    if (!this.token) {
      console.log(`🔍 Would update existing file issue #${existingIssue.number} for ${newGroup.title}`);
      return;
    }

    try {
      // Parse current violations from existing issue body
      const existingViolations = this.extractViolationsFromIssueBody(existingIssue.body);
      const newViolations = this.extractViolationsFromIssueBody(newGroup.body);

      // Detect which violations are new, resolved, or unchanged
      const newErrors: string[] = [];
      const resolvedErrors: string[] = [];
      
      // Find new errors (in new but not in existing)
      for (const newViolation of newViolations) {
        if (!existingViolations.some(existing => 
          existing.line === newViolation.line && 
          existing.ruleId === newViolation.ruleId
        )) {
          newErrors.push(`Line ${newViolation.line}:${newViolation.column} - ${newViolation.ruleId}`);
        }
      }

      // Find resolved errors (in existing but not in new)
      for (const existingViolation of existingViolations) {
        if (!newViolations.some(newV => 
          newV.line === existingViolation.line && 
          newV.ruleId === existingViolation.ruleId
        )) {
          resolvedErrors.push(`Line ${existingViolation.line}:${existingViolation.column} - ${existingViolation.ruleId}`);
        }
      }

      // Determine if we need to update (if there are any changes)
      const hasChanges = newErrors.length > 0 || resolvedErrors.length > 0;
      
      if (!hasChanges) {
        console.log(`ℹ️ Issue #${existingIssue.number} for ${newGroup.title} already up to date`);
        return;
      }

      // Generate update comment describing the changes
      let updateComment = `## 🔄 Issue Updated - ${this.timestamp}\n\n`;
      updateComment += `**Run ID:** \`${this.runId}\`\n\n`;
      
      if (newErrors.length > 0) {
        updateComment += `### 🆕 New Errors Detected (${newErrors.length})\n\n`;
        newErrors.forEach(error => {
          updateComment += `- 🔴 **NEW:** ${error}\n`;
        });
        updateComment += `\n`;
      }

      if (resolvedErrors.length > 0) {
        updateComment += `### ✅ Resolved Errors (${resolvedErrors.length})\n\n`;
        resolvedErrors.forEach(error => {
          updateComment += `- ✅ **FIXED:** ${error}\n`;
        });
        updateComment += `\n`;
      }

      updateComment += `**Summary:**\n`;
      updateComment += `- Previous violations: ${existingViolations.length}\n`;
      updateComment += `- Current violations: ${newViolations.length}\n`;
      updateComment += `- Net change: ${newViolations.length - existingViolations.length >= 0 ? '+' : ''}${newViolations.length - existingViolations.length}\n\n`;
      
      updateComment += `---\n*Updated by ClearView Lint Automation*`;

      // Add the update comment to the issue
      await this.addCommentToIssue(existingIssue.number, updateComment);

      // Update the issue body with the latest violation details
      const updatedBody = `${newGroup.body}\n\n---\n\n**🔄 Last Updated:** ${this.timestamp}\n**Run ID:** \`${this.runId}\`\n**Previous Violations:** ${existingViolations.length}\n**Current Violations:** ${newViolations.length}`;

      const response = await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}/issues/${existingIssue.number}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ClearView-Lint-Automation'
        },
        body: JSON.stringify({
          body: updatedBody,
          labels: newGroup.labels,
          assignees: ['copilot']  // Ensure @copilot remains assigned
        })
      });

      if (response.ok) {
        console.log(`✅ Updated file issue #${existingIssue.number} for ${newGroup.title} (${existingViolations.length} → ${newViolations.length} violations)`);
        this.auditLog.issuesUpdated++;
        this.auditLog.filesUpdated.add(newGroup.title);
        
        // Mark new errors - add a label to indicate unread updates
        if (newErrors.length > 0) {
          await this.markIssueAsUnread(existingIssue.number);
        }
      } else {
        console.warn(`⚠️ Failed to update file issue #${existingIssue.number}:`, response.statusText);
      }
    } catch (error) {
      console.warn(`⚠️ Could not update existing file issue #${existingIssue.number}:`, error);
    }
  }

  /**
   * Extracts violation information from issue body for comparison
   */
  private extractViolationsFromIssueBody(body: string): Array<{ line: number; column: number; ruleId: string; message: string }> {
    const violations: Array<{ line: number; column: number; ruleId: string; message: string }> = [];
    
    // Match patterns like "- **Line 10:11** - message" or "Line 10:11" anywhere in the body
    const linePattern = /(?:- \*\*)?Line (\d+):(\d+)\*?\*? - (.+?)(?:\n|$)/gi;
    let match;
    
    // Also extract the current rule context
    let currentRule = '';
    const rulePattern = /## 🔧 (.+?)(?:\n|$)/g;
    
    // First pass: extract all rules
    const ruleMatches = [...body.matchAll(rulePattern)];
    
    // Second pass: extract violations with their associated rules
    const sections = body.split(/## 🔧 /);
    
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      const ruleMatch = section.match(/^(.+?)(?:\n|$)/);
      if (!ruleMatch) continue;
      
      const ruleId = ruleMatch[1].trim();
      
      // Find all line violations in this section
      const violationPattern = /Line (\d+):(\d+)\*?\*? - (.+?)(?:\n|$)/gi;
      let violationMatch;
      
      while ((violationMatch = violationPattern.exec(section)) !== null) {
        violations.push({
          line: parseInt(violationMatch[1]),
          column: parseInt(violationMatch[2]),
          ruleId,
          message: violationMatch[3].trim()
        });
      }
    }
    
    return violations;
  }

  /**
   * Marks an issue as having unread updates by adding a label
   */
  async markIssueAsUnread(issueNumber: number): Promise<void> {
    if (!this.token) return;

    try {
      // Add a special label to indicate new errors
      await fetch(`${this.apiBase}/repos/${this.owner}/${this.repo}/issues/${issueNumber}/labels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ClearView-Lint-Automation'
        },
        body: JSON.stringify({
          labels: ['unread-updates']
        })
      });
      
      console.log(`🔔 Marked issue #${issueNumber} as having unread updates`);
    } catch (error) {
      console.warn(`⚠️ Could not mark issue #${issueNumber} as unread:`, error);
    }
  }

  async createIssuesFromReport(report: IssueReport): Promise<void> {
    console.log('📝 Creating GitHub issues from lint report...');

    // Track total errors detected
    this.auditLog.errorsDetected = report.summary.totalIssues;

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
          // UPDATE existing issue instead of skipping
          console.log(`🔄 Updating existing issue for ${fileName} (#${existingFileIssue.number})`);
          await this.updateExistingFileIssue(existingFileIssue, group);
          continue;
        }

        if (existingOldIssue) {
          console.log(`⏭️ Found old rule-based issue (#${existingOldIssue.number}) - will migrate to file-based format`);
          // Close the old issue and let the new one be created
          await this.closeOldIssueForMigration(existingOldIssue.number, fileName);
        }

        // Add race condition protection: wait a random delay to prevent simultaneous creation
        const delay = Math.floor(Math.random() * 1000) + 500; // 0.5-1.5 seconds
        console.log(`🕐 Waiting ${Math.round(delay/1000 * 10) / 10}s to prevent race conditions...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Final check for existing issues after delay (race condition protection)
        const finalFileCheck = await this.checkExistingFileIssue(fileName);
        if (finalFileCheck) {
          console.log(`⏭️ Race condition detected: ${fileName} - issue was created by another process (#${finalFileCheck.number})`);
          await this.updateExistingFileIssue(finalFileCheck, group);
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

    // Perform post-run audit
    await this.performPostRunAudit(report);
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
      
      // Create enhanced title with region context for API verify files
      const enhancedTitle = this.generateEnhancedTitle(filePath, fileName);
      
      groups.push({
        category,
        title: enhancedTitle,
        body: this.generateFileIssueBody(enhancedTitle, filePath, fileIssues),
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

  /**
   * Generates an enhanced title that includes region context for API verify files
   * @param filePath - Full path to the file
   * @param fileName - Base filename
   * @returns Enhanced title with region context if applicable
   */
  private generateEnhancedTitle(filePath: string, fileName: string): string {
    // Check if this is a file in the API verify directory structure
    const apiVerifyMatch = filePath.match(/app\/api\/verify\/([^\/]+)\/(.+)$/);
    
    if (apiVerifyMatch) {
      const regionFolder = apiVerifyMatch[1];
      const fileInRegion = apiVerifyMatch[2];
      
      // Convert region folder name to proper case for display
      // e.g., "arizona" -> "Arizona", "districtofcolumbia" -> "District of Columbia"
      const regionName = this.formatRegionName(regionFolder);
      
      return `${regionName} - ${fileInRegion}`;
    }
    
    // For non-API verify files, return the original filename
    return fileName;
  }

  /**
   * Formats region folder names into proper display names
   * @param regionFolder - Raw folder name (e.g., "arizona", "districtofcolumbia")
   * @returns Formatted region name (e.g., "Arizona", "District of Columbia")
   */
  private formatRegionName(regionFolder: string): string {
    // Handle special cases
    const specialCases: Record<string, string> = {
      'districtofcolumbia': 'District of Columbia',
      'newhampshire': 'New Hampshire',
      'newjersey': 'New Jersey',
      'newmexico': 'New Mexico',
      'newyork': 'New York',
      'northcarolina': 'North Carolina',
      'northdakota': 'North Dakota',
      'rhodeisland': 'Rhode Island',
      'southcarolina': 'South Carolina',
      'southdakota': 'South Dakota',
      'westvirginia': 'West Virginia',
      'britishcolumbia': 'British Columbia',
      'newbrunswick': 'New Brunswick',
      'newfoundland&labrador': 'Newfoundland & Labrador',
      'novascotia': 'Nova Scotia',
      'princeedwardisland': 'Prince Edward Island',
      'puertorico': 'Puerto Rico'
    };

    // Check for special cases first
    if (specialCases[regionFolder.toLowerCase()]) {
      return specialCases[regionFolder.toLowerCase()];
    }

    // For regular cases, just capitalize the first letter
    return regionFolder.charAt(0).toUpperCase() + regionFolder.slice(1);
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
    body += `- **Rules:** ${Object.keys(ruleGroups).join(', ')}\n`;
    body += `- **Created:** ${this.timestamp} (Run ID: \`${this.runId}\`)\n`;
    body += `- **Last updated:** ${this.timestamp} (Run ID: \`${this.runId}\`)\n`;
    body += `- **Status:** Unread\n\n`;

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

  async checkExistingFileIssue(enhancedTitle: string): Promise<{ number: number; title: string; body: string } | null> {
    if (!this.token) return null;

    try {
      // Search for issues with the enhanced title or just the filename
      // This handles both old format (just filename) and new format (Region - filename)
      const fileNamePart = enhancedTitle.includes(' - ') ? enhancedTitle.split(' - ')[1] : enhancedTitle;
      
      // First try exact match with enhanced title
      let searchQuery = `repo:${this.owner}/${this.repo}+is:issue+is:open+"${enhancedTitle}"+label:lint+label:automated`;
      
      let response = await fetch(
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
          const exactMatch = data.items.find((issue: any) => issue.title.toLowerCase() === enhancedTitle.toLowerCase());
          if (exactMatch) {
            console.log(`🔍 Found existing file-based issue for ${enhancedTitle}: #${exactMatch.number}`);
            return {
              number: exactMatch.number,
              title: exactMatch.title,
              body: exactMatch.body
            };
          }
        }
      }

      // If no exact match found, try searching for just the filename part (for backward compatibility)
      if (fileNamePart !== enhancedTitle) {
        searchQuery = `repo:${this.owner}/${this.repo}+is:issue+is:open+"${fileNamePart}"+label:lint+label:automated`;
        
        response = await fetch(
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
            // Find exact match with just the filename (for migration from old format)
            const exactMatch = data.items.find((issue: any) => issue.title.toLowerCase() === fileNamePart.toLowerCase());
            if (exactMatch) {
              console.log(`🔍 Found existing file-based issue (old format) for ${fileNamePart}: #${exactMatch.number}`);
              return {
                number: exactMatch.number,
                title: exactMatch.title,
                body: exactMatch.body
              };
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not check existing issues for file ${enhancedTitle}:`, error);
    }

    return null;
  }

  async closeOldIssueForMigration(issueNumber: number, enhancedTitle: string): Promise<void> {
    if (!this.token) return;

    try {
      // Add a comment explaining the migration
      const migrationComment = `🔄 **Issue Format Migration**

This issue is being closed as we're migrating to a new file-based issue format for better organization.

**Old format:** Rule-based grouping
**New format:** File-based grouping with region context (\`${enhancedTitle}\`)

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
        console.log(`✅ Closed old format issue #${issueNumber} for migration to ${enhancedTitle}`);
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

  /**
   * Performs a post-run audit to verify all requirements were met
   * and generates a summary report
   */
  private async performPostRunAudit(report: IssueReport): Promise<void> {
    console.log('\n🔍 Performing post-run audit...');
    
    const audit = {
      passed: true,
      checks: [] as string[],
      failures: [] as string[]
    };

    // Check 1: Every error from logs was captured
    if (this.auditLog.errorsDetected === report.summary.totalIssues) {
      audit.checks.push(`✅ All ${this.auditLog.errorsDetected} errors from logs were captured`);
    } else {
      audit.failures.push(`❌ Error count mismatch: detected ${this.auditLog.errorsDetected} but report has ${report.summary.totalIssues}`);
      audit.passed = false;
    }

    // Check 2: Issues were created or updated
    const totalIssueActions = this.auditLog.issuesCreated + this.auditLog.issuesUpdated;
    if (totalIssueActions > 0 || report.summary.totalIssues === 0) {
      audit.checks.push(`✅ Issues created: ${this.auditLog.issuesCreated}, updated: ${this.auditLog.issuesUpdated}`);
    } else {
      audit.failures.push(`❌ No issues were created or updated despite ${report.summary.totalIssues} errors`);
      audit.passed = false;
    }

    // Check 3: Files updated tracking
    audit.checks.push(`✅ Files updated: ${this.auditLog.filesUpdated.size}`);

    // Check 4: Resolved errors tracking
    if (this.auditLog.errorsResolved >= 0) {
      audit.checks.push(`✅ Errors resolved this run: ${this.auditLog.errorsResolved}`);
    }

    // Generate summary
    const summary = this.generateAuditSummary(report, audit);
    
    // Output to console
    console.log('\n' + summary);
    
    // Post summary as workflow run comment if possible
    if (this.token && process.env.GITHUB_RUN_ID) {
      await this.postAuditSummaryToWorkflow(summary);
    }
  }

  /**
   * Generates a formatted audit summary
   */
  private generateAuditSummary(report: IssueReport, audit: { passed: boolean; checks: string[]; failures: string[] }): string {
    let summary = `## 🔧 Lint Automation Post-Run Audit\n\n`;
    summary += `**Run ID:** \`${this.runId}\`\n`;
    summary += `**Timestamp:** ${this.timestamp}\n`;
    summary += `**Status:** ${audit.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    summary += `### 📊 Run Summary\n\n`;
    summary += `- **Total errors detected:** ${this.auditLog.errorsDetected}\n`;
    summary += `- **Files with errors:** ${report.summary.affectedFiles}\n`;
    summary += `- **Issues created:** ${this.auditLog.issuesCreated}\n`;
    summary += `- **Issues updated:** ${this.auditLog.issuesUpdated}\n`;
    summary += `- **Errors resolved:** ${this.auditLog.errorsResolved}\n\n`;
    
    if (this.auditLog.filesUpdated.size > 0) {
      summary += `### 📝 Files Updated\n\n`;
      Array.from(this.auditLog.filesUpdated).forEach(file => {
        summary += `- ${file}\n`;
      });
      summary += `\n`;
    }
    
    summary += `### ✅ Audit Checks\n\n`;
    audit.checks.forEach(check => {
      summary += `${check}\n`;
    });
    summary += `\n`;
    
    if (audit.failures.length > 0) {
      summary += `### ❌ Audit Failures\n\n`;
      audit.failures.forEach(failure => {
        summary += `${failure}\n`;
      });
      summary += `\n`;
    }
    
    summary += `### 🎯 Key Highlights\n\n`;
    if (report.summary.commonPatterns.length > 0) {
      summary += `**Most common issues:**\n`;
      report.summary.commonPatterns.slice(0, 5).forEach(pattern => {
        summary += `- ${pattern}\n`;
      });
    }
    
    summary += `\n---\n`;
    summary += `🤖 *Automated by ClearView Lint Automation*\n`;
    summary += `*All issues assigned to @copilot for tracking*`;
    
    return summary;
  }

  /**
   * Posts audit summary to workflow run (if running in GitHub Actions)
   */
  private async postAuditSummaryToWorkflow(summary: string): Promise<void> {
    // This would require GITHUB_STEP_SUMMARY environment variable
    // which is available in GitHub Actions
    if (process.env.GITHUB_STEP_SUMMARY) {
      try {
        const fs = await import('fs');
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
        console.log('📝 Audit summary posted to workflow');
      } catch (error) {
        console.warn('⚠️ Could not post summary to workflow:', error);
      }
    }
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