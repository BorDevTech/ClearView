# Lint Automation System Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deploy Next.js Workflow                      │
│                         (Triggers on push)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ (workflow_run on completed)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Lint Automation Workflow                       │
├─────────────────────────────────────────────────────────────────┤
│  1. Checkout Code                                               │
│  2. Install Dependencies                                        │
│  3. Run Lint Analysis ─────────────────────────┐                │
│     ├─ ESLint Check                           │                │
│     └─ TypeScript Compiler Check               │                │
│                                                 ▼                │
│                                    ┌───────────────────────┐    │
│                                    │   lint-analyzer.ts    │    │
│                                    │  ─────────────────    │    │
│                                    │  • Parse ESLint       │    │
│                                    │  • Parse TSC output   │    │
│                                    │  • Analyze issues     │    │
│                                    │  • Generate reports   │    │
│                                    └───────────┬───────────┘    │
│                                                │                │
│                                                ▼                │
│                                    ┌───────────────────────┐    │
│                                    │ lint-analysis-        │    │
│                                    │   report.json         │    │
│                                    └───────────┬───────────┘    │
│  4. Create/Update GitHub Issues                │                │
│                                                 ▼                │
│                                    ┌───────────────────────┐    │
│                                    │ github-issue-         │    │
│                                    │   creator.ts          │    │
│                                    │  ─────────────────    │    │
│                                    │  • Group by file      │    │
│                                    │  • Check existing     │    │
│                                    │  • Create/Update      │    │
│                                    │  • Close resolved     │    │
│                                    └───────────┬───────────┘    │
│                                                 │                │
└─────────────────────────────────────────────────┼────────────────┘
                                                  │
                ┌─────────────────────────────────┼──────────────┐
                │                                 │              │
                ▼                                 ▼              ▼
        ┌───────────────┐              ┌──────────────┐  ┌──────────────┐
        │  New Issues   │              │Update Issues │  │Close Issues  │
        │  Created      │              │with changes  │  │when resolved │
        └───────────────┘              └──────────────┘  └──────────────┘
```

## Component Details

### 1. lint-analyzer.ts

**Purpose**: Analyzes code and generates structured lint reports

**Key Methods**:
- `analyzeLintIssues()` - Main entry point
- `runLint()` - Executes ESLint
- `runTypeScriptCheck()` - Executes TSC
- `parseLintOutput()` - Parses ESLint output
- `parseTypeScriptOutput()` - Parses TSC output
- `analyzeIssue()` - Enriches issue with analysis

**Output**:
```json
{
  "summary": {
    "totalIssues": 10,
    "errorCount": 8,
    "warningCount": 2,
    "affectedFiles": 5,
    "commonPatterns": ["no-explicit-any (5)", "no-unused-vars (3)"]
  },
  "issues": [
    {
      "file": "./app/api/verify/missouri/logic.ts",
      "line": 44,
      "column": 27,
      "severity": "error",
      "message": "Unexpected any. Specify a different type.",
      "ruleId": "@typescript-eslint/no-explicit-any",
      "category": "Type Safety",
      "likelyCause": "...",
      "suggestedSolution": "...",
      "preventionTip": "...",
      "similarFiles": [],
      "patternAnalysis": "..."
    }
  ],
  "recommendations": {...}
}
```

### 2. github-issue-creator.ts

**Purpose**: Manages GitHub issues based on lint reports

**Key Methods**:

#### Issue Creation & Management
- `createIssuesFromReport()` - Main orchestrator
- `createIssue()` - Creates new GitHub issue
- `checkExistingFileIssue()` - Searches for existing file issues
- `groupIssuesForGitHub()` - Groups violations by file

#### Issue Updates (NEW in v2.0)
- `updateExistingFileIssue()` - Updates existing issues with changes
- `extractViolationsFromIssueBody()` - Parses current violations
- `markIssueAsUnread()` - Adds "unread-updates" label

#### Resolution & Sign-off (NEW in v2.0)
- `closeResolvedFileIssue()` - Closes fixed issues
- `generateSolutionSignOff()` - Creates @copilot sign-off
- `getSolutionDescription()` - Maps solutions to rule types

#### Helpers
- `generateFileIssueBody()` - Creates issue body content
- `generateCodeExample()` - Generates before/after code examples
- `generateEnhancedTitle()` - Adds regional context to titles

## Data Flow

### Issue Creation Flow

```
Lint Report
    │
    ├─ Group by File ────────────────┐
    │                                │
    ▼                                ▼
For each file:                  File: missouri/logic.ts
    │                           Issues: 3
    │                           Rules: 2
    ├─ Check existing issue
    │     │
    │     ├─ Exists? ──── Yes ──▶ updateExistingFileIssue()
    │     │                            │
    │     │                            ├─ Extract old violations
    │     │                            ├─ Extract new violations
    │     │                            ├─ Find differences
    │     │                            │   ├─ New errors?
    │     │                            │   │   └─▶ Add comment
    │     │                            │   │       Mark unread
    │     │                            │   └─ Resolved errors?
    │     │                            │       └─▶ Add comment
    │     │                            └─ Update issue body
    │     │
    │     └─ No ──────────▶ createIssue()
    │                            │
    │                            └─▶ New GitHub Issue
    │
    └─ Next file
```

### Issue Resolution Flow

```
Check all open issues
    │
    ├─ Get current file issues from report
    │
    ▼
For each open issue:
    │
    ├─ File still has errors? ──── Yes ──▶ Skip
    │
    ├─ File has no errors? ────── Yes ──▶ closeResolvedFileIssue()
                                              │
                                              ├─ Extract resolved violations
                                              ├─ Group by rule type
                                              ├─ generateSolutionSignOff()
                                              │   ├─ List fixed violations
                                              │   ├─ Describe solutions
                                              │   └─ @copilot sign-off
                                              ├─ Add comment
                                              └─ Close issue
```

### Update Detection Logic

```
Existing Issue Body:
  - Line 10: no-unused-vars
  - Line 20: no-explicit-any
  - Line 30: no-explicit-any

New Lint Report:
  - Line 10: no-unused-vars
  - Line 20: no-explicit-any
  - Line 40: no-explicit-any  (NEW!)

Comparison:
  ├─ Unchanged: Line 10, 20
  ├─ Resolved: Line 30
  └─ New: Line 40

Result:
  ├─ Add update comment:
  │   "🆕 New: Line 40
  │    ✅ Fixed: Line 30"
  ├─ Update issue body
  └─ Add "unread-updates" label
```

## State Diagram

```
                    ┌──────────────┐
                    │  No Issues   │
                    └──────┬───────┘
                           │
                           │ Lint error detected
                           │
                           ▼
                    ┌──────────────┐
         ┌─────────▶│  Issue Open  │◀──────┐
         │          └──────┬───────┘       │
         │                 │               │
         │                 │               │
New      │                 │               │ More errors
errors   │                 │               │ detected
detected │                 ▼               │
         │          ┌──────────────┐       │
         │          │  Issue with  │───────┘
         │          │ "unread-     │
         │          │  updates"    │
         │          └──────┬───────┘
         │                 │
         │                 │ Errors partially fixed
         │                 │
         └─────────────────┤
                           │
                           │ All errors fixed
                           │
                           ▼
                    ┌──────────────┐
                    │ Issue Closed │
                    │ with @copilot│
                    │   sign-off   │
                    └──────────────┘
```

## Integration Points

### GitHub API Endpoints Used

1. **Issue Search**
   - `GET /search/issues` - Find existing issues
   - Query: `repo:owner/repo is:issue is:open label:lint`

2. **Issue Management**
   - `POST /repos/:owner/:repo/issues` - Create issue
   - `PATCH /repos/:owner/:repo/issues/:number` - Update issue
   - `POST /repos/:owner/:repo/issues/:number/comments` - Add comment

3. **Label Management**
   - `POST /repos/:owner/:repo/issues/:number/labels` - Add label
   - Labels used: `lint`, `automated`, `unread-updates`, etc.

### Workflow Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_run:
    workflows: ["Deploy Next.js site to Pages"]
    types: [completed]
    branches: [main]
  workflow_dispatch:
```

## Error Handling

### Graceful Degradation

1. **No GitHub Token**
   - Logs what would be done
   - Doesn't fail the workflow
   - Useful for local testing

2. **API Rate Limiting**
   - Delays between API calls (1.5s)
   - Catches rate limit errors
   - Continues with remaining issues

3. **Race Conditions**
   - Random delays before creation
   - Double-check before creating
   - Update if created by another process

4. **Parsing Errors**
   - Fallback to text parsing
   - Skip malformed issues
   - Log warnings, continue processing

## Performance Considerations

### Optimization Strategies

1. **Batching**: Process multiple issues in sequence
2. **Caching**: GitHub API responses cached during run
3. **Parallel Processing**: Could be added for large repos
4. **Rate Limiting**: 1.5s delay between API calls
5. **Conditional Execution**: Only run on main branch pushes

### Scalability

- **Small repos (<10 files)**: < 30 seconds
- **Medium repos (10-50 files)**: 1-2 minutes
- **Large repos (50+ files)**: 2-5 minutes

Each file issue takes ~2-3 seconds (API call + delay).

## Security

### Token Permissions Required

```yaml
permissions:
  contents: read      # Read repository
  issues: write       # Create/update/close issues
  pull-requests: write # Comment on PRs
```

### Security Measures

1. **Token Security**: Use GitHub secrets
2. **Input Validation**: Sanitize file paths
3. **Rate Limiting**: Prevent API abuse
4. **Error Handling**: No sensitive data in logs

## Future Enhancements

### Planned Features

1. **Auto-fix PRs**: Create PRs with fixes
2. **Priority Scoring**: Rank issues by impact
3. **Trend Analysis**: Track issue patterns over time
4. **Custom Rules**: Support project-specific lints
5. **Integration**: Slack/Discord notifications
6. **Metrics Dashboard**: Visualize code quality trends

### Architectural Improvements

1. **Caching Layer**: Redis for API responses
2. **Queue System**: Background processing
3. **Webhooks**: Real-time updates
4. **Plugin System**: Custom analyzers
5. **Multi-repo Support**: Organization-wide analysis
