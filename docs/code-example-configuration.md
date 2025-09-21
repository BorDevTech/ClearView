# Code Example Generation Configuration

This document explains how to extend the robust code example generation system in the lint automation.

## Overview

The system replaced fragile string matching with a configuration-based approach that:
- Uses regex patterns to extract identifiers from ESLint error messages
- Generates personalized code examples using extracted variable/interface names
- Provides better resilience against ESLint message format changes
- Maintains backward compatibility with legacy examples

## Adding Support for New Rules

To add support for a new ESLint rule, follow these steps:

### 1. Add Configuration

In `scripts/lint-automation/github-issue-creator.ts`, add a new `ExampleConfig` object to the `getExampleConfigs()` method:

```typescript
{
  ruleId: 'your-eslint-rule-name',
  identifierPattern: /regex-to-extract-identifier/,
  exampleGenerator: (issue, identifier) => {
    // Generate your code example here
    return `#### 💡 Code Example\n\n**❌ Before:**\n...`;
  }
}
```

### 2. Define Pattern Regex

The `identifierPattern` should extract relevant identifiers from error messages:

```typescript
// Example patterns:
/'([^']+)' is defined but never used/           // Extracts quoted identifiers
/Parameter '([^']+)' implicitly has/           // Extracts parameter names
/'([^']+)' is never reassigned/               // Extracts variable names
```

### 3. Implement Example Generator

The `exampleGenerator` function receives:
- `issue`: The full AnalyzedIssue object
- `identifier`: The extracted identifier (or undefined if pattern didn't match)

```typescript
exampleGenerator: (issue, identifier) => {
  const varName = identifier || 'defaultName';
  
  return `#### 💡 Code Example

**❌ Before (causes lint error):**
\`\`\`typescript
// Bad code using ${varName}
\`\`\`

**✅ After (fixed):**
\`\`\`typescript
// Fixed code using ${varName}
\`\`\`
`;
}
```

## Examples

### Current Configurations

1. **@typescript-eslint/no-unused-vars**
   - Pattern: `/'([^']+)' is (?:defined|declared) but never used|(\w+) is (?:defined|declared) but never used/`
   - Extracts variable/interface names
   - Provides different examples for interfaces vs variables

2. **@typescript-eslint/no-explicit-any**
   - Pattern: `/Parameter '([^']+)' implicitly has an 'any' type|Unexpected any\. Specify a different type/`
   - Extracts parameter names
   - Includes legacy parseBlob-specific handling

3. **@typescript-eslint/no-unused-imports**
   - Pattern: `/'([^']+)' is defined but never used/`
   - Extracts import names
   - Shows before/after import cleanup

4. **prefer-const**
   - Pattern: `/'([^']+)' is never reassigned/`
   - Extracts variable names
   - Shows let → const conversion

## Testing

Test your configuration with:

```bash
# Run the comprehensive test suite
npx tsx /tmp/test-comprehensive.ts

# Run integration tests
npx tsx /tmp/test-integration.ts
```

## Migration from Legacy

The system maintains backward compatibility through the `legacyExamples` fallback. When ready, migrate legacy string-based examples to the new configuration system for better maintainability.

## Benefits

- **Resilient**: Regex patterns are more robust than string matching
- **Personalized**: Examples use actual variable names from errors
- **Extensible**: Easy to add new rules via configuration
- **Maintainable**: Centralized configuration vs scattered string checks