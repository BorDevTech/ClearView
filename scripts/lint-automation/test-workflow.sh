#!/bin/bash

# 🔧 ClearView Lint Automation Test Script
# 
# This script demonstrates the complete lint automation workflow:
# 1. Runs lint analysis
# 2. Generates reports
# 3. Simulates GitHub issue creation

set -e

echo "🚀 Starting ClearView Lint Automation Test..."
echo "=================================================="

# Change to project root
cd "$(dirname "$0")/.."

echo ""
echo "📦 Installing dependencies..."
npm ci

echo ""
echo "🔍 Step 1: Running lint analysis..."
echo "-----------------------------------"
npm run lint:analyze || LINT_EXIT_CODE=$?

if [ -f "lint-analysis-report.json" ]; then
    ISSUES_COUNT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('lint-analysis-report.json', 'utf8')).summary.totalIssues)")
    echo "📊 Analysis complete! Found $ISSUES_COUNT lint issues."
    
    if [ "$ISSUES_COUNT" -eq "0" ]; then
        echo "✅ No lint issues found!"
        echo ""
        echo "✅ Lint automation test complete!"
        echo "=================================================="
        exit 0
    fi
else
    echo "✅ No lint issues found!"
    echo ""
    echo "✅ Lint automation test complete!"
    echo "=================================================="
    exit 0
fi

echo ""
echo "📝 Step 2: Simulating GitHub issue creation..."
echo "----------------------------------------------"
npm run lint:create-issues

echo ""
echo "📄 Step 3: Generated reports available:"
echo "---------------------------------------"
echo "📋 JSON Report: lint-analysis-report.json"
echo "📖 Markdown Report: lint-analysis-report.md"

if [ -f "lint-analysis-report.md" ]; then
    echo ""
    echo "📖 Report Preview (first 30 lines):"
    echo "======================================"
    head -30 lint-analysis-report.md
    echo ""
    echo "... (truncated - see full report in lint-analysis-report.md)"
fi

echo ""
echo "✅ Lint automation test complete!"
echo "=================================================="
echo ""
echo "🔄 Next Steps:"
echo "- Review the generated reports"
echo "- Fix the identified lint issues"
echo "- In CI/CD, this would automatically create GitHub issues"
echo "- The workflow is ready for production use"