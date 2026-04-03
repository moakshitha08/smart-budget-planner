# Smart Budget Planner - New Features Implementation
## Priority 1: Fix Currency + 4 New Features

**Status:** Plan approved - Ready to implement

## 🔍 Problem Analysis
Currency symbols update but some hardcoded "₹"/INR remain in:
- Toast messages (handleAddExpense, handleQuickAdd)
- HTML data-prefix="₹" (summary cards)
- Backup exports (getExpensesAsText, Word doc)

## 📋 Implementation Plan

### ✅ Step 1: Complete Currency Fix [PENDING FINAL]
```
dashboard.js: Replace 4 toast "₹" → formatCurrency()
HTML: data-prefix="" (CSS handles)
exports: Hardcoded "Rs." → formatCurrency()
```

### Step 2: Edit Expenses Feature [PENDING]
```
1. Expenses table Actions: Add ✏️ pencil onclick="editExpense(id)"
2. HTML: #editExpenseModal + form (category, amount, date, type dropdown)
3. utils.js: updateExpense(id, data)
4. dashboard.js: editExpenseModal handlers → save → refreshCurrencyUI()
5. CSS: Modal styling (reuse quickAddModal style)
```

### Step 3: Dashboard Cards [PENDING]
```
HTML (overview section): 
1. Add Total Expenses card (summary-card expenses-spent)
2. Rename "Remaining Balance" → show Income - Total Expenses
3. JavaScript: updateDashboardStats() → populate both cards
```

### Step 4: Enhanced Backup [PENDING]
```
utils.js exportData():
- Add totalExpenses, remainingBalance, currency: getCurrency()
- getExpensesAsText(): Use formatCurrency() everywhere
- Word export: Dynamic currency headers/values
```

### Step 5: Test & Polish [PENDING]
```
Currency: Settings USD → ALL $ instantly ✓
Edit: Modify expense → totals/charts refresh ✓  
Cards: Income-Expenses calculation ✓
Backup: JSON includes balance/currency ✓
No layout changes ✓
```

### Step 6: Completion
```
attempt_completion()
```

**Benefits:**
✏️ **Edit** existing expenses with full refresh
💳 **Total Spent** + **Remaining Balance** cards
📤 **Enhanced backup** with summaries/currency
🔄 **Global currency** perfected
