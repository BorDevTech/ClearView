# Example: Automated GitHub Issue

## 🔧 ESLint Rule Violation: `@typescript-eslint/no-unused-vars`

**6 instance(s) of this rule violation found across the codebase.**

### 🔍 Analysis

**Likely Cause:** Variable is declared but never used in the code. This often happens during development when code is partially implemented or when refactoring removes usage.

**Suggested Solution:** Remove the unused variable or prefix it with underscore (_) if it's intentionally unused. For function parameters that must exist for interface compliance, use underscore prefix.

**Prevention:** Use IDE features to highlight unused code. Consider enabling "Remove unused imports" on save. Review code before committing to catch unused declarations.

### 📁 Affected Files

- `./app/api/verify/alabama/route.ts:10:11` - 'searchParams' is assigned a value but never used.
- `./app/api/verify/arkansas/logic.ts:3:11` - 'VetRecord' is defined but never used.
- `./app/api/verify/colorado/logic.ts:3:11` - 'VetRecord' is defined but never used.
- `./app/api/verify/connecticut/logic.ts:3:11` - 'VetRecord' is defined but never used.
- `./app/api/verify/florida/route.ts:17:9` - 'key' is assigned a value but never used.
- `./app/api/verify/missouri/logic.ts:3:11` - 'VetRecord' is defined but never used.

### 🧩 Pattern Analysis

**Directory `./app/api/verify`** has 6 instances of this issue. Consider applying a consistent fix pattern across this module.

**Similar File Pattern Detected:** This issue appears in files with similar naming patterns. Consider reviewing the template or base implementation that these files might share.

### 🛠️ How to Fix

#### 💡 Code Example

**❌ Before (causes lint error):**
```typescript
import { VetResult } from "@/app/types/vet-result";

interface VetRecord {  // ← This interface is defined but never used
  first_name: string;
  last_name: string;
  // ... other properties
}

export async function verify() {
  // Implementation without using VetRecord
}
```

**✅ After (fixed):**
```typescript
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
```

#### Step-by-Step Instructions:
1. **Review each affected file** listed above
2. **Apply the suggested solution** for each instance
3. **Test the changes** to ensure functionality is preserved
4. **Run `npm run lint`** to verify the fixes

**Tip:** Since this affects multiple files, consider using find-and-replace tools or IDE refactoring features for consistent fixes.

### 📚 Additional Resources

- [ESLint Rule Documentation](https://typescript-eslint.io/rules/no-unused-vars/)
- **Quick Fix:** Remove unused variables or prefix with underscore if intentionally unused
- **IDE Setup:** Configure your editor to highlight unused variables automatically

### 🤖 Issue Details

- **Rule:** `@typescript-eslint/no-unused-vars`
- **Category:** Code Quality
- **Severity:** error
- **Auto-generated:** 2024-12-21T21:30:00.000Z

---

**Labels:** `lint`, `code-quality`, `bug`, `automated`

This issue was automatically created by the ClearView Lint Automation system to help maintain code quality standards.