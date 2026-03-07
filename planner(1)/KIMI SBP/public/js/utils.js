// ============================================
// SMART BUDGET PLANNER - UTILS (Local Storage)
// ============================================

// Storage keys
const STORAGE_KEYS = {
    USERS: 'smart_budget_users',
    CURRENT_USER: 'smart_budget_current_user',
    EXPENSES: 'smart_budget_expenses',
    THEME: 'smart_budget_theme',
    SAVINGS_GOALS: 'smart_budget_savings_goals',
    CATEGORY_LIMITS: 'smart_budget_category_limits',
    FINANCIAL_TIP_DATE: 'smart_budget_tip_date'
};

// Get data from local storage
function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Save data to local storage
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ============================================
// USER MANAGEMENT (Local Storage)
// ============================================

// Get all users
function getUsers() {
    return getFromStorage(STORAGE_KEYS.USERS) || [];
}

// Save users
function saveUsers(users) {
    saveToStorage(STORAGE_KEYS.USERS, users);
}

// Register new user
function registerUser(username, email, password, monthlyIncome = 0) {
    const users = getUsers();
    
    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email already registered');
    }
    
    // Check if username already exists
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error('Username already taken');
    }
    
    // Create new user
    const newUser = {
        id: generateId(),
        username,
        email: email.toLowerCase(),
        password: hashPassword(password),
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

// Login user
function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
        throw new Error('User not found');
    }
    
    if (user.password !== hashPassword(password)) {
        throw new Error('Invalid password');
    }
    
    // Set current user
    const { password: _, ...userWithoutPassword } = user;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, userWithoutPassword);
    
    return userWithoutPassword;
}

// Logout user
function logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Get current user
function getCurrentUser() {
    return getFromStorage(STORAGE_KEYS.CURRENT_USER);
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Update user income
function updateUserIncome(userId, monthlyIncome) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        throw new Error('User not found');
    }
    
    users[userIndex].monthlyIncome = parseFloat(monthlyIncome);
    saveUsers(users);
    
    // Update current user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        currentUser.monthlyIncome = parseFloat(monthlyIncome);
        saveToStorage(STORAGE_KEYS.CURRENT_USER, currentUser);
    }
}

// ============================================
// EXPENSE MANAGEMENT (Local Storage)
// ============================================

// Get expenses for current user
function getExpenses() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    return allExpenses.filter(e => e.userId === user.id && !e.isDeleted);
}

// Get deleted expenses
function getDeletedExpenses() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    return allExpenses.filter(e => e.userId === user.id && e.isDeleted);
}

// Get all expenses (including deleted)
function getAllExpenses() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    return allExpenses.filter(e => e.userId === user.id);
}

// Add expense
function addExpense(category, amount, date, description = '') {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    
    // Check if expense with same category and date exists
    const existingExpense = allExpenses.find(
        e => e.userId === user.id && 
             e.category === category && 
             e.date === date && 
             !e.isDeleted
    );
    
    if (existingExpense) {
        // Update existing expense
        existingExpense.amount += parseFloat(amount);
        existingExpense.updatedAt = new Date().toISOString();
    } else {
        // Create new expense
        const newExpense = {
            id: generateId(),
            userId: user.id,
            category,
            amount: parseFloat(amount),
            date,
            description,
            budgetType: getBudgetType(category),
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        allExpenses.push(newExpense);
    }
    
    saveToStorage(STORAGE_KEYS.EXPENSES, allExpenses);
    return { aggregated: !!existingExpense };
}

// Delete expense (soft delete)
function deleteExpenseLocal(id) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    const expenseIndex = allExpenses.findIndex(e => e.id === id && e.userId === user.id);
    
    if (expenseIndex === -1) {
        throw new Error('Expense not found');
    }
    
    allExpenses[expenseIndex].isDeleted = true;
    allExpenses[expenseIndex].deletedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.EXPENSES, allExpenses);
}

// Restore expense
function restoreExpenseLocal(id) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    const expenseIndex = allExpenses.findIndex(e => e.id === id && e.userId === user.id);
    
    if (expenseIndex === -1) {
        throw new Error('Expense not found');
    }
    
    allExpenses[expenseIndex].isDeleted = false;
    allExpenses[expenseIndex].deletedAt = null;
    allExpenses[expenseIndex].updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.EXPENSES, allExpenses);
}

// ============================================
// SAVINGS GOALS
// ============================================

// Get savings goals
function getSavingsGoals() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
    return goals.filter(g => g.userId === user.id);
}

// Add savings goal
function addSavingsGoal(name, targetAmount, deadline) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
    
    const newGoal = {
        id: generateId(),
        userId: user.id,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        deadline,
        createdAt: new Date().toISOString()
    };
    
    goals.push(newGoal);
    saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, goals);
    return newGoal;
}

// Update savings goal progress
function updateSavingsGoal(id, amount) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
    const goalIndex = goals.findIndex(g => g.id === id && g.userId === user.id);
    
    if (goalIndex === -1) {
        throw new Error('Goal not found');
    }
    
    goals[goalIndex].currentAmount += parseFloat(amount);
    saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, goals);
}

// Delete savings goal
function deleteSavingsGoal(id) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
    const filteredGoals = goals.filter(g => !(g.id === id && g.userId === user.id));
    saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, filteredGoals);
}

// ============================================
// CATEGORY BUDGET LIMITS
// ============================================

// Get category limits
function getCategoryLimits() {
    const user = getCurrentUser();
    if (!user) return {};
    
    const limits = getFromStorage(STORAGE_KEYS.CATEGORY_LIMITS) || {};
    return limits[user.id] || {};
}

// Set category limit
function setCategoryLimit(category, limit) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const limits = getFromStorage(STORAGE_KEYS.CATEGORY_LIMITS) || {};
    if (!limits[user.id]) {
        limits[user.id] = {};
    }
    limits[user.id][category] = parseFloat(limit);
    saveToStorage(STORAGE_KEYS.CATEGORY_LIMITS, limits);
}

// Set multiple category limits
function setCategoryLimits(limitsObj) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const limits = getFromStorage(STORAGE_KEYS.CATEGORY_LIMITS) || {};
    limits[user.id] = limitsObj;
    saveToStorage(STORAGE_KEYS.CATEGORY_LIMITS, limits);
}

// ============================================
// BUDGET CALCULATIONS
// ============================================

// Calculate budget summary
function calculateBudgetSummary() {
    const user = getCurrentUser();
    if (!user) return null;
    
    const expenses = getExpenses();
    const monthlyIncome = user.monthlyIncome || 0;
    
    // Calculate totals by budget type
    let needs = 0;
    let wants = 0;
    let savings = 0;
    const categories = {};
    
    expenses.forEach(expense => {
        const type = expense.budgetType;
        const amount = expense.amount;
        
        if (type === 'Needs') {
            needs += amount;
        } else if (type === 'Wants') {
            wants += amount;
        } else {
            savings += amount;
        }
        
        // Category totals
        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }
        categories[expense.category] += amount;
    });
    
    const total = needs + wants + savings;
    const remainingBalance = Math.max(0, monthlyIncome - total);
    
    // Calculate percentages
    const needsPercentage = monthlyIncome > 0 ? (needs / (monthlyIncome * 0.5)) * 100 : 0;
    const wantsPercentage = monthlyIncome > 0 ? (wants / (monthlyIncome * 0.3)) * 100 : 0;
    const savingsPercentage = monthlyIncome > 0 ? (savings / (monthlyIncome * 0.2)) * 100 : 0;
    
    // Budget alert at 90% of total income
    const budgetAlert = monthlyIncome > 0 && total >= (monthlyIncome * 0.9);
    
    // Calculate budget health score
    const healthScore = calculateBudgetHealthScore(needsPercentage, wantsPercentage, savingsPercentage);
    
    return {
        needs,
        wants,
        savings,
        total,
        monthlyIncome,
        remainingBalance,
        categories,
        needsPercentage: Math.min(needsPercentage, 100),
        wantsPercentage: Math.min(wantsPercentage, 100),
        savingsPercentage: Math.min(savingsPercentage, 100),
        budgetAlert,
        healthScore
    };
}

// Calculate budget health score
function calculateBudgetHealthScore(needsPct, wantsPct, savingsPct) {
    let score = 100;
    
    // Deduct points for exceeding 50% on needs
    if (needsPct > 50) {
        score -= (needsPct - 50) * 2;
    }
    
    // Deduct points for exceeding 30% on wants
    if (wantsPct > 30) {
        score -= (wantsPct - 30) * 3;
    }
    
    // Add bonus for good savings
    if (savingsPct >= 20) {
        score += (savingsPct - 20);
    } else if (savingsPct < 10) {
        score -= 20;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

// Get health status
function getHealthStatus(score) {
    if (score >= 80) return { status: 'Excellent', class: '' };
    if (score >= 60) return { status: 'Good', class: 'warning' };
    return { status: 'Needs Improvement', class: 'danger' };
}

// ============================================
// SPENDING PERSONALITY
// ============================================

// Analyze spending personality
function analyzeSpendingPersonality() {
    const summary = calculateBudgetSummary();
    if (!summary || summary.total === 0) {
        return {
            type: 'Analyzer',
            icon: 'fa-user-clock',
            description: 'Start adding expenses to discover your spending pattern.'
        };
    }
    
    const savingsRate = summary.monthlyIncome > 0 ? 
        (summary.savings / summary.monthlyIncome) * 100 : 0;
    const wantsRate = summary.monthlyIncome > 0 ? 
        (summary.wants / summary.monthlyIncome) * 100 : 0;
    
    if (savingsRate >= 20 && wantsRate <= 20) {
        return {
            type: 'Saver',
            icon: 'fa-hand-holding-usd',
            description: 'Great job! You are saving well and keeping wants in check.'
        };
    } else if (savingsRate >= 10 && wantsRate <= 30) {
        return {
            type: 'Balanced Spender',
            icon: 'fa-balance-scale',
            description: 'You have a good balance between saving and spending.'
        };
    } else if (wantsRate > 40) {
        return {
            type: 'High Spender',
            icon: 'fa-shopping-cart',
            description: 'You might want to reduce wants expenses to build savings.'
        };
    } else {
        return {
            type: 'Moderate Spender',
            icon: 'fa-sliders-h',
            description: 'Your spending is moderate. Consider increasing savings.'
        };
    }
}

// ============================================
// INSIGHTS
// ============================================

// Get spending insights
function getSpendingInsights() {
    const summary = calculateBudgetSummary();
    if (!summary) return {};
    
    const categories = summary.categories;
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    
    const highest = sorted[0] || ['-', 0];
    const lowest = sorted[sorted.length - 1] || ['-', 0];
    
    const savingsRate = summary.monthlyIncome > 0 ?
        ((summary.savings / summary.monthlyIncome) * 100).toFixed(1) : 0;
    
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const avgDaily = summary.total > 0 ? (summary.total / dayOfMonth).toFixed(0) : 0;
    
    return {
        highestCategory: highest[0],
        highestAmount: highest[1],
        lowestCategory: lowest[0],
        lowestAmount: lowest[1],
        savingsRate,
        avgDaily
    };
}

// Get suggestions
function getSuggestions() {
    const summary = calculateBudgetSummary();
    const insights = getSpendingInsights();
    const suggestions = [];
    
    if (!summary || summary.monthlyIncome === 0) {
        suggestions.push({
            icon: 'fa-money-bill-wave',
            text: 'Set your monthly income in your profile to enable budget tracking.'
        });
        return suggestions;
    }
    
    if (insights.savingsRate < 20) {
        suggestions.push({
            icon: 'fa-piggy-bank',
            text: 'Try to save at least 20% of your income for financial security.'
        });
    }
    
    if (summary.wantsPercentage > 30) {
        suggestions.push({
            icon: 'fa-cut',
            text: 'Your wants expenses are high. Consider reducing dining out and entertainment.'
        });
    }
    
    if (summary.needsPercentage > 50) {
        suggestions.push({
            icon: 'fa-search-dollar',
            text: 'Your needs are exceeding 50%. Look for ways to reduce fixed expenses.'
        });
    }
    
    if (insights.highestCategory && insights.highestAmount > summary.monthlyIncome * 0.3) {
        suggestions.push({
            icon: 'fa-exclamation-circle',
            text: `${insights.highestCategory} is your biggest expense. Look for alternatives.`
        });
    }
    
    if (suggestions.length === 0) {
        suggestions.push({
            icon: 'fa-star',
            text: 'Great job! Your budget is well balanced. Keep it up!'
        });
    }
    
    return suggestions;
}

// ============================================
// WEEKLY REPORT
// ============================================

// Get weekly spending report
function getWeeklyReport() {
    const expenses = getExpenses();
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= weekAgo);
    
    let total = 0;
    const byCategory = {};
    
    weeklyExpenses.forEach(expense => {
        total += expense.amount;
        if (!byCategory[expense.category]) {
            byCategory[expense.category] = 0;
        }
        byCategory[expense.category] += expense.amount;
    });
    
    // Group by budget type
    const byType = { needs: 0, wants: 0, savings: 0 };
    weeklyExpenses.forEach(expense => {
        const type = expense.budgetType.toLowerCase();
        if (byType[type] !== undefined) {
            byType[type] += expense.amount;
        }
    });
    
    return {
        total,
        byCategory,
        byType,
        count: weeklyExpenses.length,
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
    };
}

// ============================================
// MONTHLY TRENDS
// ============================================

// Get monthly spending trends
function getMonthlyTrends(months = 6) {
    const expenses = getExpenses();
    const trends = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthExpenses = expenses.filter(e => {
            const expDate = new Date(e.date);
            return expDate.getMonth() === date.getMonth() && 
                   expDate.getFullYear() === date.getFullYear();
        });
        
        const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        trends.push({
            month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            total,
            needs: monthExpenses.filter(e => e.budgetType === 'Needs').reduce((s, e) => s + e.amount, 0),
            wants: monthExpenses.filter(e => e.budgetType === 'Wants').reduce((s, e) => s + e.amount, 0),
            savings: monthExpenses.filter(e => e.budgetType === 'Savings').reduce((s, e) => s + e.amount, 0)
        });
    }
    
    return trends;
}

// ============================================
// HEATMAP DATA
// ============================================

// Get expense heatmap data
function getHeatmapData() {
    const expenses = getExpenses();
    const heatmap = {};
    
    expenses.forEach(expense => {
        const date = expense.date;
        if (!heatmap[date]) {
            heatmap[date] = 0;
        }
        heatmap[date] += expense.amount;
    });
    
    return heatmap;
}

// ============================================
// FINANCIAL TIPS
// ============================================

const FINANCIAL_TIPS = [
    "Start paying yourself first - set aside savings before spending on anything else.",
    "The 50-30-20 rule: 50% for needs, 30% for wants, 20% for savings.",
    "Track every expense for a month to understand where your money goes.",
    "Automate your savings to make saving effortless.",
    "Avoid impulse purchases by waiting 24 hours before buying.",
    "Cook at home more often - it's healthier and cheaper.",
    "Cancel subscriptions you don't use regularly.",
    "Use the envelope budgeting system for cash-based categories.",
    "Review your insurance rates annually to ensure you're getting the best deal.",
    "Set specific financial goals with deadlines.",
    "Build an emergency fund covering 3-6 months of expenses.",
    "Pay off high-interest debt first.",
    "Avoid lifestyle inflation when you get a raise.",
    "Review your credit report annually for free.",
    "Use cashback and reward programs wisely.",
    "Plan your meals for the week to reduce grocery waste.",
    "Buy generic brands - they're often the same quality.",
    "Use public transportation or carpool to save on transport costs.",
    "Set up bill reminders to avoid late fees.",
    "Review your subscription services quarterly.",
    "Make a shopping list and stick to it.",
    "Use the 24-hour rule for non-essential purchases.",
    "Start investing early - compound interest is powerful.",
    "Separate your needs from wants.",
    "Practice mindful spending - ask yourself if you really need it."
];

// Get financial tip of the day
function getFinancialTip() {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = getFromStorage(STORAGE_KEYS.FINANCIAL_TIP_DATE);
    
    let tip;
    if (savedDate === today) {
        // Same day, get from a deterministic random based on date
        const dayNum = new Date(today).getDate();
        tip = FINANCIAL_TIPS[dayNum % FINANCIAL_TIPS.length];
    } else {
        // New day, pick random tip
        tip = FINANCIAL_TIPS[Math.floor(Math.random() * FINANCIAL_TIPS.length)];
        saveToStorage(STORAGE_KEYS.FINANCIAL_TIP_DATE, today);
    }
    
    return tip;
}

// ============================================
// THEME MANAGEMENT
// ============================================

// Get saved theme
function getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

// Save theme
function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// Apply theme to document
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
}

// Toggle theme
function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    return newTheme;
}

// Check and apply budget danger theme
function checkBudgetTheme() {
    const summary = calculateBudgetSummary();
    if (summary && summary.budgetAlert) {
        document.documentElement.setAttribute('data-budget', 'danger');
    } else {
        document.documentElement.removeAttribute('budget');
    }
}

// ============================================
// EXPORT/IMPORT FUNCTIONS
// ============================================

// Export expenses to CSV
function exportToCSV() {
    const expenses = getExpenses();
    if (expenses.length === 0) {
        throw new Error('No expenses to export');
    }
    
    const headers = ['Category', 'Budget Type', 'Amount', 'Date', 'Description'];
    const rows = expenses.map(e => [
        e.category,
        e.budgetType,
        e.amount,
        e.date,
        e.description || ''
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    return csvContent;
}

// Export all data as JSON
function exportData() {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    return JSON.stringify({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            monthlyIncome: user.monthlyIncome
        },
        expenses: getExpenses(),
        deletedExpenses: getDeletedExpenses(),
        savingsGoals: getSavingsGoals(),
        categoryLimits: getCategoryLimits(),
        exportDate: new Date().toISOString()
    }, null, 2);
}

// Import data from JSON
function importData(jsonData) {
    const data = JSON.parse(jsonData);
    const user = getCurrentUser();
    
    if (!user) throw new Error('User not logged in');
    if (data.user && data.user.id !== user.id) {
        // Allow import even if user ID differs - just import expenses without userId link
    }
    
    // Import expenses
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    
    // Remove existing expenses for this user
    const otherExpenses = allExpenses.filter(e => e.userId !== user.id);
    
    // Add imported expenses
    if (data.expenses) {
        const importedExpenses = data.expenses.map(e => ({
            ...e,
            id: generateId(),
            userId: user.id
        }));
        saveToStorage(STORAGE_KEYS.EXPENSES, [...otherExpenses, ...importedExpenses]);
    }
    
    // Import savings goals
    if (data.savingsGoals) {
        const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
        const otherGoals = goals.filter(g => g.userId !== user.id);
        const importedGoals = data.savingsGoals.map(g => ({
            ...g,
            id: generateId(),
            userId: user.id
        }));
        saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, [...otherGoals, ...importedGoals]);
    }
    
    // Import category limits
    if (data.categoryLimits) {
        const limits = getFromStorage(STORAGE_KEYS.CATEGORY_LIMITS) || {};
        limits[user.id] = data.categoryLimits;
        saveToStorage(STORAGE_KEYS.CATEGORY_LIMITS, limits);
    }
    
    // Update user income
    if (data.user && data.user.monthlyIncome) {
        updateUserIncome(user.id, data.user.monthlyIncome);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Simple hash function (for demo purposes)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get today's date
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Get budget type for category
function getBudgetType(category) {
    const needs = ['Rent/Mortgage', 'Utilities', 'Groceries', 'Insurance', 'Healthcare', 'Transportation', 'Debt Payments', 'Phone/Internet'];
    const wants = ['Dining Out', 'Entertainment', 'Shopping', 'Hobbies', 'Travel', 'Subscriptions', 'Personal Care', 'Coffee'];
    
    if (needs.includes(category)) return 'Needs';
    if (wants.includes(category)) return 'Wants';
    return 'Savings';
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'Rent/Mortgage': 'fa-home',
        'Utilities': 'fa-lightbulb',
        'Groceries': 'fa-shopping-basket',
        'Insurance': 'fa-shield-alt',
        'Healthcare': 'fa-hospital',
        'Transportation': 'fa-bus',
        'Debt Payments': 'fa-credit-card',
        'Phone/Internet': 'fa-mobile-alt',
        'Dining Out': 'fa-utensils',
        'Entertainment': 'fa-film',
        'Shopping': 'fa-shopping-bag',
        'Hobbies': 'fa-palette',
        'Travel': 'fa-plane',
        'Subscriptions': 'fa-play-circle',
        'Personal Care': 'fa-spa',
        'Coffee': 'fa-coffee',
        'Emergency Fund': 'fa-umbrella',
        'Retirement': 'fa-sun',
        'Investments': 'fa-chart-line',
        'Education': 'fa-graduation-cap',
        'Major Purchases': 'fa-trophy'
    };
    return icons[category] || 'fa-tag';
}

// Get category badge class
function getCategoryBadgeClass(category) {
    const type = getBudgetType(category);
    if (type === 'Needs') return 'badge-needs';
    if (type === 'Wants') return 'badge-wants';
    return 'badge-savings';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 
                     type === 'error' ? 'fas fa-exclamation-circle' : 
                     'fas fa-info-circle';
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Confirm dialog
function confirmDialog(message) {
    return new Promise((resolve) => {
        const result = confirm(message);
        resolve(result);
    });
}

// Download CSV file
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download JSON file
function downloadJSON(jsonContent, filename) {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Animate counter
function animateCounter(element, target, prefix = '₹', suffix = '') {
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * easeOut);
        
        element.textContent = prefix + current.toLocaleString('en-IN') + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Check category limit exceeded
function checkCategoryLimitExceeded(category) {
    const limits = getCategoryLimits();
    if (!limits[category]) return false;
    
    const expenses = getExpenses();
    const total = expenses
        .filter(e => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);
    
    return total > limits[category];
}

// Get exceeded categories
function getExceededCategories() {
    const limits = getCategoryLimits();
    const exceeded = [];
    
    Object.keys(limits).forEach(category => {
        if (checkCategoryLimitExceeded(category)) {
            exceeded.push(category);
        }
    });
    
    return exceeded;
}

