# Finance CRM Codebase Analysis - Runtime Issues & Data Relationship Problems

**Analysis Date:** March 26, 2026  
**Scope:** Server actions, page components, data relationships, type safety

---

## Executive Summary

The codebase has **6 CRITICAL** issues that will cause runtime errors, **8 HIGH** severity type mismatches or unsafe data access patterns, and **4 MEDIUM** severity issues with decimal handling and null checks.

---

## CRITICAL ISSUES (Will Cause Runtime Failures)

### 1. **CRITICAL: `getEmployees()` Returns Null Brand - Will Crash Employee Pages**

**Location:** [src/actions/employees.ts](src/actions/employees.ts#L110-L114)

**Issue:**
```typescript
return empList.map((emp) => ({
  ...emp,
  salaryAmount: Number(emp.salaryAmount),
  brand: null as any,  // ❌ Setting brand to null!
})) as EmployeeWithRelations[];
```

**Impact:**
- Components accessing `employee.brand.id` or `employee.brand.name` will throw: `Cannot read property 'id' of null`
- **Affected Components:**
  - [src/app/(dashboard)/dashboard/employees/employee-form.tsx](src/app/(dashboard)/dashboard/employees/employee-form.tsx#L65): `setValue("brandId", employee.brand.id)` - **CRASH**
  - [src/app/(dashboard)/dashboard/employees/employees-table.tsx](src/app/(dashboard)/dashboard/employees/employees-table.tsx#L309): `{employee.brand.name}` - **CRASH**

**Severity:** 🔴 **CRITICAL** - App will crash when editing employees

**Fix:** Fetch and join with brands table in the query:
```typescript
export async function getEmployees(brandId?: string): Promise<EmployeeWithRelations[]> {
  const session = await getSession();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_EXECUTIVE")) {
    return [];
  }

  const empList = await db
    .select({
      id: employees.id,
      userId: employees.userId,
      brandId: employees.brandId,
      name: employees.name,
      email: employees.email,
      position: employees.position,
      department: employees.department,
      salaryAmount: employees.salaryAmount,
      salaryCurrency: employees.salaryCurrency,
      paymentDay: employees.paymentDay,
      joinDate: employees.joinDate,
      terminationDate: employees.terminationDate,
      isActive: employees.isActive,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
      brandId_: brands.id,
      brandName: brands.name,
    })
    .from(employees)
    .innerJoin(brands, eq(employees.brandId, brands.id))
    .where(and(eq(employees.isActive, true), brandId ? eq(employees.brandId, brandId) : undefined))
    .orderBy(employees.name);

  return empList.map((emp) => ({
    ...emp,
    salaryAmount: Number(emp.salaryAmount),
    brand: {
      id: emp.brandId_,
      name: emp.brandName,
    },
  })) as EmployeeWithRelations[];
}
```

---

### 2. **CRITICAL: Dashboard Recent Transactions - Null Brand/User Joins**

**Location:** [src/actions/dashboard.ts](src/actions/dashboard.ts#L75-L80)

**Issue:**
The `recentTransactions` query uses `leftJoin` for brands, projects, and users, which can result in `null` values, but the component tries to access `.name` directly without null checks:
```typescript
brand: { id: brands.id, name: brands.name }, // ❌ Can be null from leftJoin
project: { id: projects.id, name: projects.name }, // ❌ Can be null
createdBy: { id: users.id, name: users.name }, // ❌ Can be null
```

**Impact:**
- [src/components/dashboard/recent-transactions.tsx](src/components/dashboard/recent-transactions.tsx#L43): `transaction.brand.name` will be **null**
- Line 55: `{transaction.brand.name || ...}` has optional chaining but the structure doesn't match DB result

**Severity:** 🔴 **CRITICAL** - Dashboard will display null values or crash

**Fix:** Use `innerJoin` instead of `leftJoin` OR handle null values:
```typescript
const recentTransactions = await db
  .select({
    // ... other fields
    brand: { id: brands.id, name: brands.name },
    project: { id: projects.id, name: projects.name },
    createdBy: { id: users.id, name: users.name },
  })
  .from(transactions)
  .innerJoin(brands, eq(transactions.brandId, brands.id))  // ✅ innerJoin - brand required
  .leftJoin(projects, eq(transactions.projectId, projects.id))  // ✅ leftJoin - optional
  .leftJoin(users, eq(transactions.createdById, users.id))
  .limit(10);
```

---

### 3. **CRITICAL: Transactions - Field Type Mismatch in Cast**

**Location:** [src/actions/transactions.ts](src/actions/transactions.ts#L193-L213)

**Issue:**
```typescript
const formattedData = txList.map((tx) => ({
  ...tx,
  originalAmount: Number(tx.originalAmount),  // ❌ Converting string/decimal to number after join
  conversionRate: Number(tx.conversionRate),
  usdValue: Number(tx.usdValue),
  brand: {
    id: tx.brandId_,
    name: tx.brandName || "Unknown",  // ❌ brandName could be undefined/null
  },
  createdBy: {
    id: tx.createdById_,
    name: tx.createdByName || "Unknown",  // ❌ createdByName could be undefined
  },
})) as unknown as TransactionWithRelations[];
```

**Drizzle Issue:** The query structure flattens nested objects incorrectly. When joining, the returned types don't properly reflect the null possibility.

**Impact:**
- When a transaction's brand is deleted but transaction still references it, `brandName` will be `null`, defaulting to "Unknown"
- When `createdById` user is deleted, `createdByName` will be `null`
- Cast `as unknown` hides type errors

**Severity:** 🔴 **CRITICAL** - Data integrity issues masked by unsafe cast

**Fix:** Use proper NULL coalescing:
```typescript
const formattedData = txList.map((tx) => ({
  ...tx,
  originalAmount: Number(tx.originalAmount),
  conversionRate: Number(tx.conversionRate),
  usdValue: Number(tx.usdValue),
  brand: {
    id: tx.brandId_ || "UNKNOWN",
    name: tx.brandName || "Deleted Brand",
  },
  project: tx.projectId_
    ? {
        id: tx.projectId_,
        name: tx.projectName || "Deleted Project",
      }
    : null,
  createdBy: {
    id: tx.createdById_ || "UNKNOWN",
    name: tx.createdByName || "Deleted User",
  },
}));
```

---

### 4. **CRITICAL: Partners Earnings Calculation - Missing Null Check**

**Location:** [src/actions/partners.ts](src/actions/partners.ts#L165-L176)

**Issue:**
```typescript
const partnerList = await db
  .select({
    // ...
    user: {
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
    },
    brand: {
      id: brands.id,
      name: brands.name,
    },
  })
  .from(partners)
  .leftJoin(usersTable, eq(partners.userId, usersTable.id))  // ❌ Can be null
  .leftJoin(brands, eq(partners.brandId, brands.id))      // ❌ Can be null
  .where(where);
```

**Impact:**
- `user` data can be null (if user deleted), but component expects it to exist
- `brand` data can be null (if brand deleted), but component expects it to exist
- Will crash when rendering partner info

**Severity:** 🔴 **CRITICAL** - Partners page will crash if related data is deleted

**Fix:** Use `innerJoin` for required relationships or handle nulls in the return type

---

### 5. **CRITICAL: Async/Await Missing - getTransaction() Returns Promise Unchecked**

**Location:** [src/actions/transactions.ts](src/actions/transactions.ts#L223-L247)

**Issue:**
```typescript
export async function getTransaction(id: string): Promise<TransactionWithRelations | null> {
  const session = await getSession();
  if (!session) return null;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  if (!result.length) {
    return null;
  }

  return toSerializableTransaction(result[0]) as unknown as TransactionWithRelations;
}
```

**Problem:** The function returns raw database values without fetching related data (brand, project, user). The return type promises `TransactionWithRelations` but returns incomplete data.

**Impact:**
- Components expecting brand/project/user data will get `undefined` or have to handle incomplete data
- Type safety is broken with `as unknown as`

**Severity:** 🔴 **CRITICAL** - Incomplete data returned for single transaction queries

**Fix:** Fetch with joins like in `getTransactions()` or update the return type

---

### 6. **CRITICAL: Dashboard Stats - Future Dates Can Fail Null Checks**

**Location:** [src/actions/dashboard.ts](src/actions/dashboard.ts#L88-L180)

**Issue:**
Several operations assume data exists without null checks:
```typescript
const currentMonthTransactions = await db
  .select()
  .from(transactions)
  .where(and(...));  // ❌ Could be empty array

// Then:
const currentRevenue = currentMonthTransactions
  .filter((t) => t.type === "INCOME")
  .reduce((sum, t) => sum + Number(t.usdValue), 0);  // Empty array = 0, fine
```

But more critically:
```typescript
const revenueChange = previousRevenue > 0
  ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
  : currentRevenue > 0
    ? 100
    : 0;  // ❌ Could return NaN or Infinity if not careful
```

**Impact:**
- Division by zero could produce `Infinity` or `NaN`
- Charts and stats display: `NaN%` instead of proper values

**Severity:** 🔴 **CRITICAL** - Dashboard stats could display `NaN` values

**Fix:** Add proper validation:
```typescript
const safeRevenueChange = Number.isFinite(revenueChange) ? revenueChange : 0;
```

---

## HIGH SEVERITY ISSUES

### 7. **HIGH: Brands Query Missing Owner Relationship Check**

**Location:** [src/actions/brands.ts](src/actions/brands.ts#L101-L110)

**Issue:**
```typescript
const brandList = await db
  .select({ /* fields */ })
  .from(brands)
  .innerJoin(users, eq(brands.ownerId, users.id))  // ✅ Good with innerJoin
  .where(eq(brands.isActive, true));
```

But `getBrand()` (single brand):
```typescript
const brandData = await db
  .select({ /* fields */ })
  .from(brands)
  .innerJoin(users, eq(brands.ownerId, users.id))
  .where(eq(brands.id, id))
  .limit(1);

if (!brandData || brandData.length === 0) return null;
```

**Problem:** If owner user is deleted, the `innerJoin` will fail and no brand data returned, even though the brand still exists in DB (orphaned).

**Severity:** 🟠 **HIGH** - Orphaned brands become inaccessible

**Fix:** Use `leftJoin` and handle null owner, or enforce cascade delete in schema

---

### 8. **HIGH: Employees Page Type Casting Issues**

**Location:** [src/app/(dashboard)/dashboard/employees/employees-table.tsx](src/app/(dashboard)/dashboard/employees/employees-table.tsx#L307-L311)

**Issue:**
```typescript
<Badge variant="outline">{employee.brand.name}</Badge>
```

Since `employee.brand` is `null`, this will crash with: `Cannot read property 'name' of null`

**Severity:** 🟠 **HIGH** - Employees table will crash when rendering

---

### 9. **HIGH: Invites Table - Optional Chaining Used Inconsistently**

**Location:** [src/app/(dashboard)/dashboard/invites/invites-table.tsx](src/app/(dashboard)/dashboard/invites/invites-table.tsx#L240)

**Issue:**
```typescript
<TableCell>{invite.brand?.name || "-"}</TableCell>  // ✅ Handles null
<TableCell>{invite.invitedBy.name}</TableCell>       // ❌ No null check!
```

**Problem:** `invitedBy` relationship is required in schema, but if user is deleted:
- `invitedBy` could be null
- Will crash with: `Cannot read property 'name' of null`

**Severity:** 🟠 **HIGH** - Invites page crashes if inviter user deleted

**Fix:** Add optional chaining: `{invite.invitedBy?.name || "Unknown"}`

---

### 10. **HIGH: Login Page Uses Cookies() - Dynamic Server Error**

**Location:** [src/lib/auth.ts](src/lib/auth.ts#L96-L99) and [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx)

**Issue:**
```typescript
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();  // ❌ Dynamic server call
```

**Problem:** The terminal output shows:
```
error: Dynamic server usage: Route /login couldn't be rendered statically because it used `cookies`.
```

This prevents static rendering of the login page.

**Severity:** 🟠 **HIGH** - Login page cannot be statically rendered, performance impact

**Fix:** Mark login page as `dynamic`:
```typescript
export const dynamic = 'force-dynamic';
```

---

### 11. **HIGH: Salary Payments - Decimal String Conversion Missing Type Check**

**Location:** [src/actions/employees.ts](src/actions/employees.ts#L28-L30)

**Issue:**
```typescript
function toSerializableSalaryPayment(payment: any) {
  return {
    ...payment,
    amount: Number(payment.amount),  // ❌ No validation if amount is null
    conversionRate: Number(payment.conversionRate),
    usdValue: Number(payment.usdValue),
  };
}
```

**Problem:** If any decimal field is `null`, `Number(null)` returns `0`, masking data corruption

**Severity:** 🟠 **HIGH** - Silent data loss for null decimal fields

**Fix:** Add explicit null checks:
```typescript
function toSerializableSalaryPayment(payment: any) {
  return {
    ...payment,
    amount: payment.amount ? Number(payment.amount) : 0,
    conversionRate: payment.conversionRate ? Number(payment.conversionRate) : 0,
    usdValue: payment.usdValue ? Number(payment.usdValue) : 0,
  };
}
```

---

### 12. **HIGH: getPartners() Return Type Mismatch**

**Location:** [src/actions/partners.ts](src/actions/partners.ts#L183-L246)

**Issue:**
The return type is `PartnerWithRelations[]` but:
1. `user` and `brand` fields can be null from leftJoin
2. Type definition expects them to be required objects
3. Function continues to process null objects without guards:

```typescript
const partnersWithEarnings = await Promise.all(
  partnerList.map(async (partner) => {
    // ❌ Uses partner.brandId without null check
    const transactionsList = await db
      .select({ usdValue: transactions.usdValue })
      .from(transactions)
      .where(and(
        eq(transactions.brandId, partner.brandId),  // Could fail if brand is null
        eq(transactions.type, "INCOME")
      ));
```

**Severity:** 🟠 **HIGH** - Type mismatch could cause runtime errors

---

### 13. **HIGH: Missing Null Check in toSerializableTransaction()**

**Location:** [src/actions/transactions.ts](src/actions/transactions.ts#L17-L25)

**Issue:**
```typescript
function toSerializableTransaction<T extends {
  originalAmount: string | number;
  conversionRate: string | number;
  usdValue: string | number;
}>(transaction: T) {
  return {
    ...transaction,
    originalAmount: Number(transaction.originalAmount),
    conversionRate: Number(transaction.conversionRate),
    usdValue: Number(transaction.usdValue),
  };
}
```

**Problem:** No validation if fields are undefined or null. `Number(undefined)` = `NaN`, `Number(null)` = `0`

**Severity:** 🟠 **HIGH** - Can introduce NaN values into financial calculations

---

## MEDIUM SEVERITY ISSUES

### 14. **MEDIUM: Subscription Cost Not Converted to Number Consistently**

**Location:** [src/actions/subscriptions.ts](src/actions/subscriptions.ts#L81)

**Issue:**
```typescript
export async function getSubscriptions(): Promise<SubscriptionWithDue[]> {
  // ...
  return subs.map((sub) => {
    // ...
    return {
      // ...
      cost: Number(sub.cost),  // ✅ Convert to number
      // ...
    };
  });
}
```

But in `updateSubscription()`:
```typescript
if (input.cost !== undefined) updateData.cost = input.cost;  // ❌ Stored as string
```

**Problem:** Cost stored as string in DB (decimal field converted), but not consistently converted back to number in all functions

**Severity:** 🟡 **MEDIUM** - Potential calculation errors

---

### 15. **MEDIUM: Employee Salary Amount Not Updated After Conversion**

**Location:** [src/actions/employees.ts](src/actions/employees.ts#L146-L154)

**Issue:**
```typescript
const updateData: Record<string, any> = {};
if (input.salaryAmount !== undefined) updateData.salaryAmount = input.salaryAmount;
```

But input has already been validated and converted by Zod. Need to ensure string conversion:
```typescript
if (input.salaryAmount !== undefined) updateData.salaryAmount = String(input.salaryAmount);  // ✅ Required
```

**Current:** No explicit `String()` wrapper when storing, relying on Drizzle to convert

**Severity:** 🟡 **MEDIUM** - Type coercion could cause precision loss

---

### 16. **MEDIUM: Dashboard Brand Revenue Map Not Cleared Between Calls**

**Location:** [src/actions/dashboard.ts](src/actions/dashboard.ts#L52-L60)

**Issue:**
```typescript
const brandTransactionsMap = new Map<string, typeof currentMonthTransactions>();
for (const brand of activeBrands) {
  const brandTxns = await db
    .select()
    .from(transactions)
    .where(and(
      eq(transactions.brandId, brand.id),
      gte(transactions.transactionDate, currentMonthStart),
    ));  // ❌ Missing lte for end date
  brandTransactionsMap.set(brand.id, brandTxns);
}
```

**Problems:**
1. Missing `lte(transactions.transactionDate, currentMonthEnd)` - includes transactions beyond month
2. Multiple DB calls in loop instead of single batch query (N+1 problem)

**Severity:** 🟡 **MEDIUM** - Performance issue + incorrect calculations

**Fix:**
```typescript
const brandTransactions = await db
  .select({
    brandId: transactions.brandId,
    // select transaction fields
  })
  .from(transactions)
  .where(and(
    gte(transactions.transactionDate, currentMonthStart),
    lte(transactions.transactionDate, currentMonthEnd)
  ));

// Group in application
const brandTransactionsMap = new Map<string, typeof brandTransactions>();
for (const tx of brandTransactions) {
  if (!brandTransactionsMap.has(tx.brandId)) {
    brandTransactionsMap.set(tx.brandId, []);
  }
  brandTransactionsMap.get(tx.brandId)!.push(tx);
}
```

---

### 17. **MEDIUM: Partner Withdrawal Amount Type Inconsistency**

**Location:** [src/db/schema.ts](src/db/schema.ts#L289-L305) and [src/actions/partners.ts](src/actions/partners.ts#L201)

**Issue:**
```typescript
// In schema - decimal field
amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),

// In getPartners - not converted
const pendingWithdrawalsResult = await db
  .select({ total: sum(withdrawals.amount) })  // ❌ Returns string, not converted
```

**Problem:** The `sum()` aggregation returns string from decimal field, but `Number()` conversion missing

**Severity:** 🟡 **MEDIUM** - Withdrawal calculations could be string comparisons

---

## LOW SEVERITY ISSUES

### 18. **LOW: Error Handling - Generic Error Messages Hide Issues**

**Location:** Multiple action files

**Example:**
```typescript
catch (error) {
  console.error("Create transaction error:", error);
  return { success: false, error: "Failed to create transaction" };  // Generic message
}
```

**Issue:** Users don't get specific error information, making debugging difficult

---

### 19. **LOW: Missing Pagination Error Handling**

**Location:** [src/actions/transactions.ts](src/actions/transactions.ts#L120-L180)

**Issue:**
No validation that page/pageSize are valid positive integers. Could cause:
- Negative offsets
- Excessive memory usage with huge pageSize

---

## SUMMARY TABLE

| # | Issue | File | Severity | Type | Impact |
|---|-------|------|----------|------|--------|
| 1 | Employee getEmployees() brand: null | employees.ts:110 | CRITICAL | Null Reference | ❌ Crash on edit |
| 2 | Dashboard transactions leftJoin | dashboard.ts:75 | CRITICAL | Null Reference | ❌ Null values |
| 3 | Transactions field type mismatch | transactions.ts:193 | CRITICAL | Type Mismatch | ❌ Crash on render |
| 4 | Partners leftJoin nulls | partners.ts:165 | CRITICAL | Null Reference | ❌ Crash partners page |
| 5 | getTransaction() incomplete | transactions.ts:223 | CRITICAL | Missing Data | ❌ Incomplete relations |
| 6 | Dashboard NaN stats | dashboard.ts:88 | CRITICAL | Math Error | ❌ NaN in UI |
| 7 | Brands orphaned owner | brands.ts:101 | HIGH | DB Integrity | ⚠️ Data loss |
| 8 | Employees brand.name crash | employees-table.tsx:307 | HIGH | Null Reference | ❌ Crash table |
| 9 | Invites invitedBy nullable | invites-table.tsx:242 | HIGH | Null Reference | ❌ Crash table |
| 10 | Login cookies dynamic | auth.ts:96 | HIGH | Performance | ⚠️ No static render |
| 11 | Salary null decimals | employees.ts:28 | HIGH | Type Coercion | ⚠️ Silent 0 values |
| 12 | getPartners type mismatch | partners.ts:183 | HIGH | Type Mismatch | ⚠️ Runtime errors |
| 13 | toSerializableTransaction NaN | transactions.ts:17 | HIGH | Math Error | ⚠️ NaN in calc |
| 14 | Subscription cost string | subscriptions.ts:81 | MEDIUM | Type Inconsistency | ⚠️ Calc errors |
| 15 | Employee salary string | employees.ts:146 | MEDIUM | Type Coercion | ⚠️ Precision loss |
| 16 | Dashboard brand map | dashboard.ts:52 | MEDIUM | N+1 / Logic Error | ⚠️ Slow + wrong data |
| 17 | Partner withdrawal sum | partners.ts:201 | MEDIUM | Type Inconsistency | ⚠️ String comparison |
| 18 | Generic error messages | Multiple | LOW | UX Issue | ℹ️ Hard to debug |
| 19 | Pagination validation | transactions.ts:120 | LOW | Input Validation | ℹ️ Potential abuse |

---

## RECOMMENDED FIXES (Priority Order)

### Phase 1: Critical Fixes (Do First - Prevents Crashes)
1. **Fix employees.ts getEmployees()** - Join with brands instead of returning null
2. **Fix dashboard.ts recentTransactions** - Use innerJoin for required data
3. **Fix transactions.ts getTransaction()** - Fetch with relations or update type
4. **Fix partners.ts getPartners()** - Handle null user/brand data
5. **Fix dashboard stats** - Add NaN validation

### Phase 2: High Priority (Do Next - Type Safety)
6. Fix Employees table component null access
7. Fix Invites table invitedBy null access  
8. Add proper null checks to serialization functions
9. Mark login page as dynamic

### Phase 3: Medium Priority (Do After)
10. Consolidate decimal number conversion
11. Fix dashboard N+1 query
12. Validate pagination inputs

---

## Testing Recommendations

1. **Unit Test:** Test all action functions with null/missing related data
2. **Integration Test:** Test dashboard with deleted brands/users
3. **Component Test:** Employee/partner/transaction components with missing relations
4. **Type Check:** Run strict TypeScript type checking to catch `as unknown` casts
5. **Load Test:** Dashboard stats calculation with large transaction volumes
