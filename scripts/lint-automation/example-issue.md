# Example: File-Based Lint Issue (New Format v2.0)

# Missouri - logic.ts

**3 lint issue(s) found in this file across 2 rule(s).**

### 📁 File Details

- **File:** `./app/api/verify/missouri/logic.ts`
- **Issues:** 3
- **Rules:** @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any

## 🔧 @typescript-eslint/no-unused-vars

**1 instance(s) of this rule violation.**

### 🔍 Analysis

**Likely Cause:** Variable is declared but never used in the code. This often happens during development when code is partially implemented or when refactoring removes usage.

**Suggested Solution:** Remove the unused variable or prefix it with underscore (_) if it's intentionally unused. For function parameters that must exist for interface compliance, use underscore prefix.

**Prevention:** Use IDE features to highlight unused code. Consider enabling "Remove unused imports" on save. Review code before committing to catch unused declarations.

### 📍 Violations

- **Line 3:11** - 'VetRecord' is defined but never used.

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

// Option 3: Use the interface in your code
interface VetRecord {
  first_name: string;
  last_name: string;
}

export async function verify(): Promise<VetRecord[]> {
  // Use the interface as return type or parameter
  return [];
}
```

### 📚 Additional Resources

- [ESLint Rule Documentation](https://typescript-eslint.io/rules/no-unused-vars/)
- **Quick Fix:** Remove unused variables or prefix with underscore if intentionally unused
- **IDE Setup:** Configure your editor to highlight unused variables automatically

## 🔧 @typescript-eslint/no-explicit-any

**2 instance(s) of this rule violation.**

### 🔍 Analysis

**Likely Cause:** Using "any" type defeats TypeScript's type checking benefits. This often happens when dealing with external APIs, complex objects, or when migrating from JavaScript.

**Suggested Solution:** Define proper types or interfaces. Use union types, generics, or "unknown" type for safer alternatives. For external APIs, create interface definitions.

**Prevention:** Establish coding standards that discourage "any" usage. Use strict TypeScript configuration. Create type definitions for external dependencies.

### 📍 Violations

- **Line 44:27** - Unexpected any. Specify a different type.

#### 💡 Code Example

**❌ Before (causes lint error):**
```typescript
function processData(data: any) {  // ← Using 'any' defeats type safety
  return data.someProperty;
}
```

**✅ After (fixed):**
```typescript
// Option 1: Define proper interface for known structure
interface DataStructure {
  someProperty: string;
  // ... other known properties
}

function processData(data: DataStructure) {
  return data.someProperty;
}

// Option 2: Use 'unknown' for safer handling of external data
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'someProperty' in data) {
    return (data as { someProperty: string }).someProperty;
  }
  throw new Error('Invalid data structure');
}
```

### 📚 Additional Resources

- [ESLint Rule Documentation](https://typescript-eslint.io/rules/no-explicit-any/)
- **Quick Fix:** Replace `any` with proper types, `unknown`, or union types
- **For External APIs:** Create interface definitions instead of using `any`

### 🛠️ How to Fix

#### Step-by-Step Instructions:
1. **Open the file** `./app/api/verify/missouri/logic.ts`
2. **Review each violation** listed above
3. **Apply the suggested solution** for each rule
4. **Test the changes** to ensure functionality is preserved
5. **Run `npm run lint`** to verify the fixes

**Tip:** This file has multiple lint issues. Consider fixing them all at once for consistency.

### 🤖 Issue Details

- **File:** `./app/api/verify/missouri/logic.ts`
- **Total Issues:** 3
- **Rules:** `@typescript-eslint/no-unused-vars`, `@typescript-eslint/no-explicit-any`
- **Auto-generated:** 2025-01-01T12:00:00.000Z

---

## Example Update Comment (when new errors are detected)

### 🔄 Issue Updated - 2025-01-01T14:30:00.000Z

### 🆕 New Errors Detected (1)

- ⚠️ **NEW:** Line 50:15 - @typescript-eslint/no-explicit-any

### ✅ Resolved Errors (0)

**Summary:**
- Previous violations: 3
- Current violations: 4
- Net change: +1

---
*Updated by ClearView Lint Automation*

[Issue labeled with: `unread-updates`]

---

## Example Resolution Comment (@copilot sign-off)

### ✅ Issue Resolved - All Lint Errors Fixed!

**File:** `logic.ts`  
**Resolved:** 2025-01-01T16:00:00.000Z

### 🎉 Fixed Violations (4)

#### @typescript-eslint/no-unused-vars
Fixed 1 instance(s):
- ✅ Line 3:11 - 'VetRecord' is defined but never used.

#### @typescript-eslint/no-explicit-any
Fixed 3 instance(s):
- ✅ Line 44:27 - Unexpected any. Specify a different type.
- ✅ Line 50:15 - Unexpected any. Specify a different type.

### 💡 Solutions Applied

Based on the fixed violations, the following solutions appear to have been applied:

**@typescript-eslint/no-unused-vars:**
- Removed unused variables/imports or prefixed them with underscore
- Used the variables in the code implementation

**@typescript-eslint/no-explicit-any:**
- Replaced `any` types with proper TypeScript types
- Created interface definitions for data structures
- Used `unknown` type for safer handling of external data

---

🤖 **Verified and signed off by @copilot**

All lint errors in this file have been successfully resolved. Great work! 🎊

*Automated by ClearView Lint Automation*

[Issue closed]

---

## Key Features Demonstrated

### ✨ Version 2.0 Improvements

1. **📁 File-Based Issues** - One issue per file, not per rule
2. **🌍 Regional Context** - "Missouri - logic.ts" shows the state/region
3. **🔄 Smart Updates** - Detects new errors and resolved errors
4. **🆕 Unread Marking** - Labels issues when new errors appear
5. **✅ Solution Verification** - @copilot signs off when all fixed
6. **🚫 No Duplicates** - Updates existing issues instead of creating new ones
7. **📊 Progress Tracking** - See net changes in violation counts

### Benefits

- ✅ **No Duplicate Issues** - Smart detection ensures one issue per file
- ✅ **Track Progress** - See violations decrease over time  
- ✅ **Prioritize Work** - "unread-updates" label shows what needs attention
- ✅ **Learn Solutions** - See what worked when issues are resolved
- ✅ **Automation** - Less manual issue management, more coding

---

**Labels:** `lint`, `code-quality`, `type-safety`, `bug`, `automated`

This issue was automatically created by the ClearView Lint Automation system to help maintain code quality standards.