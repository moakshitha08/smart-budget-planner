// ============================================
// SMART BUDGET PLANNER - DASHBOARD (Local Storage)
// ============================================

let budgetChart = null;
let categoryChart = null;
let trendChart = null;
let currentExpenses = [];
let deletedExpenses = [];
let budgetSummary = {};

// DOM Elements
const sections = document.querySelectorAll('.section');
const navItems = document.querySelectorAll('.nav-item');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobileOverlay');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeEventListeners();
    loadUserData();
    loadDashboardData();
    initializeTheme();
    initializeHamburgerMenu();
    document.getElementById('expenseDate').value = getTodayDate();
    document.getElementById('quickDate').value = getTodayDate();
    loadFinancialTip();
    renderSavingsGoals();
    renderCategoryLimits();
});

// Auth Check
function checkAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }
}

// Initialize Theme
function initializeTheme() {
    const theme = getTheme();
    applyTheme(theme);
    checkBudgetTheme();
}

// Load User Data
function loadUserData() {
    const user = getCurrentUser();
    if (user && user.username) {
        usernameDisplay.textContent = user.username;
    }
}

// Hamburger Menu
function initializeHamburgerMenu() {
    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        sidebar.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    });

    mobileOverlay.addEventListener('click', () => {
        hamburgerBtn.classList.remove('active');
        sidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
    });

    // Close menu on nav item click (mobile)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                hamburgerBtn.classList.remove('active');
                sidebar.classList.remove('active');
                mobileOverlay.classList.remove('active');
            }
        });
    });
}

// Event Listeners
function initializeEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Logout
    logoutBtn.addEventListener('click', () => {
        logoutUser();
        window.location.href = 'index.html';
    });
    
    // Add expense form
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
    
    // Export JSON buttons
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', handleExportJSON);
    }
    const exportJsonBtn2 = document.getElementById('exportJsonBtn2');
    if (exportJsonBtn2) {
        exportJsonBtn2.addEventListener('click', handleExportJSON);
    }
    
    // Import file inputs
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', handleImportJSON);
    }
    const importFile2 = document.getElementById('importFile2');
    if (importFile2) {
        importFile2.addEventListener('change', handleImportJSON2);
    }
    
    // Search
    document.getElementById('searchExpenses').addEventListener('input', debounce(handleSearch, 300));
    
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            toggleTheme();
        });
    }
    
    // Quick add buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            const quickAddModal = document.getElementById('quickAddModal');
            document.getElementById('quickCategory').value = category;
            quickAddModal.classList.remove('hidden');
        });
    });
    
    // Close quick add modal
    document.getElementById('closeQuickAdd').addEventListener('click', () => {
        document.getElementById('quickAddModal').classList.add('hidden');
    });
    
    // Quick add form
    document.getElementById('quickAddForm').addEventListener('submit', handleQuickAdd);
    
    // Savings goal form
    document.getElementById('savingsGoalForm').addEventListener('submit', handleSavingsGoal);
    
    // Save limits button
    document.getElementById('saveLimitsBtn').addEventListener('click', saveCategoryLimits);
}

// Section Switching
function switchSection(sectionName) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    const titles = {
        overview: 'Dashboard Overview',
        expenses: 'All Expenses',
        savings: 'Savings Goals',
        insights: 'Smart Insights',
        reports: 'Weekly Reports',
        add: 'Add New Expense',
        backup: 'Backup & Restore',
        deleted: 'Deleted Expenses'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
    
    if (sectionName === 'expenses') {
        renderExpensesTable(currentExpenses);
        checkCategoryLimits();
    } else if (sectionName === 'deleted') {
        loadDeletedExpenses();
    } else if (sectionName === 'overview') {
        updateCharts();
        renderHeatmap();
    } else if (sectionName === 'insights') {
        renderInsights();
    } else if (sectionName === 'reports') {
        renderWeeklyReport();
    }
}

// Load Dashboard Data
function loadDashboardData() {
    try {
        currentExpenses = getExpenses();
        budgetSummary = calculateBudgetSummary();
        
        updateDashboardStats();
        updateCharts();
        checkBudgetAlert();
        updateSpendingPersonality();
    } catch (error) {
        showToast('Failed to load dashboard data', 'error');
    }
}

// Update Dashboard Stats with Animation
function updateDashboardStats() {
    const user = getCurrentUser();
    const monthlyIncome = user?.monthlyIncome || 0;
    
    // Animate summary cards
    animateSummaryCard('.summary-card.income .summary-value', monthlyIncome);
    animateSummaryCard('.summary-card.expenses .summary-value', budgetSummary.total || 0);
    animateSummaryCard('.summary-card.savings .summary-value', budgetSummary.savings || 0);
    animateSummaryCard('.summary-card.balance .summary-value', budgetSummary.remainingBalance || 0);
    
    // Update health score
    const healthScoreEl = document.querySelector('.summary-card.health .summary-value');
    if (healthScoreEl) {
        const score = budgetSummary.healthScore || 0;
        healthScoreEl.dataset.target = score;
        animateCounter(healthScoreEl, score, '', '%');
        
        const healthStatus = getHealthStatus(score);
        const healthStatusEl = document.getElementById('healthStatus');
        if (healthStatusEl) {
            healthStatusEl.textContent = healthStatus.status;
            healthStatusEl.className = 'health-status ' + healthStatus.class;
        }
    }
    
    // Update budget progress bars
    updateBudgetProgress();
}

function animateSummaryCard(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.dataset.target = value;
        animateCounter(element, value, '₹', '');
    }
}

// Update Budget Progress Bars
function updateBudgetProgress() {
    const monthlyIncome = budgetSummary.monthlyIncome || 0;
    const needs = budgetSummary.needs || 0;
    const wants = budgetSummary.wants || 0;
    const savings = budgetSummary.savings || 0;
    
    const needsTarget = monthlyIncome * 0.5;
    const wantsTarget = monthlyIncome * 0.3;
    const savingsTarget = monthlyIncome * 0.2;
    
    // Update progress bars
    document.getElementById('needsProgressBar').style.width = 
        monthlyIncome > 0 ? Math.min((needs / needsTarget) * 100, 100) + '%' : '0%';
    document.getElementById('wantsProgressBar').style.width = 
        monthlyIncome > 0 ? Math.min((wants / wantsTarget) * 100, 100) + '%' : '0%';
    document.getElementById('savingsProgressBar').style.width = 
        monthlyIncome > 0 ? Math.min((savings / savingsTarget) * 100, 100) + '%' : '0%';
    
    // Update text
    document.getElementById('needsProgressText').textContent = 
        `${formatCurrency(needs)} / ${formatCurrency(needsTarget)}`;
    document.getElementById('wantsProgressText').textContent = 
        `${formatCurrency(wants)} / ${formatCurrency(wantsTarget)}`;
    document.getElementById('savingsProgressText').textContent = 
        `${formatCurrency(savings)} / ${formatCurrency(savingsTarget)}`;
}

// Check Budget Alert
function checkBudgetAlert() {
    const alert = document.getElementById('budgetAlert');
    if (budgetSummary.budgetAlert) {
        alert.classList.remove('hidden');
        document.documentElement.setAttribute('data-budget', 'danger');
    } else {
        alert.classList.add('hidden');
        document.documentElement.removeAttribute('data-budget');
    }
}

// Update Charts
function updateCharts() {
    updateBudgetChart();
    updateCategoryChart();
    updateTrendChart();
}

// Budget Chart (Doughnut)
function updateBudgetChart() {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    if (budgetChart) {
        budgetChart.destroy();
    }
    
    const data = [
        budgetSummary.needs || 0,
        budgetSummary.wants || 0,
        budgetSummary.savings || 0
    ];
    
    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'],
            datasets: [{
                data: data,
                backgroundColor: ['#3b82f6', '#ec4899', '#10b981'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { family: 'Outfit', size: 12 }
                    }
                }
            }
        }
    });
}

// Category Chart (Bar)
function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const categories = budgetSummary.categories || {};
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    
    const sorted = labels.map((label, i) => ({ label, value: data[i] }))
                         .sort((a, b) => b.value - a.value)
                         .slice(0, 8);
    
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(item => item.label),
            datasets: [{
                label: 'Amount (INR)',
                data: sorted.map(item => item.value),
                backgroundColor: sorted.map(item => {
                    const type = getBudgetType(item.label);
                    return type === 'Needs' ? '#3b82f6' : 
                           type === 'Wants' ? '#ec4899' : '#10b981';
                }),
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        },
                        font: { family: 'Outfit', size: 11 }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: {
                        font: { family: 'Outfit', size: 11 },
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

// Trend Chart (Line)
function updateTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    if (trendChart) {
        trendChart.destroy();
    }
    
    const trends = getMonthlyTrends(6);
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trends.map(t => t.month),
            datasets: [
                {
                    label: 'Total',
                    data: trends.map(t => t.total),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Needs',
                    data: trends.map(t => t.needs),
                    borderColor: '#3b82f6',
                    backgroundColor: 'transparent',
                    tension: 0.4
                },
                {
                    label: 'Wants',
                    data: trends.map(t => t.wants),
                    borderColor: '#ec4899',
                    backgroundColor: 'transparent',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { family: 'Outfit', size: 12 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        },
                        font: { family: 'Outfit', size: 11 }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    ticks: {
                        font: { family: 'Outfit', size: 11 }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

// Render Heatmap
function renderHeatmap() {
    const container = document.getElementById('expenseHeatmap');
    if (!container) return;
    
    const heatmapData = getHeatmapData();
    const today = new Date();
    const daysToShow = 35; // 5 weeks
    
    let html = '';
    
    for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const amount = heatmapData[dateStr] || 0;
        
        // Determine level
        const maxAmount = Math.max(...Object.values(heatmapData), 1);
        let level = 0;
        if (amount > 0) {
            const ratio = amount / maxAmount;
            if (ratio <= 0.2) level = 1;
            else if (ratio <= 0.4) level = 2;
            else if (ratio <= 0.6) level = 3;
            else if (ratio <= 0.8) level = 4;
            else level = 5;
        }
        
        html += `<div class="heatmap-day level-${level}" title="${formatDate(dateStr)}: ${formatCurrency(amount)}">${date.getDate()}</div>`;
    }
    
    container.innerHTML = html;
}

// Add Expense Handler
function handleAddExpense(e) {
    e.preventDefault();
    
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    const description = document.getElementById('expenseDescription').value;
    
    if (!category || !amount || amount <= 0) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    try {
        const result = addExpense(category, amount, date, description);
        
        if (result.aggregated) {
            showToast('Expense updated (amount added to existing)');
        } else {
            showToast('Expense added successfully');
        }
        
        document.getElementById('addExpenseForm').reset();
        document.getElementById('expenseDate').value = getTodayDate();
        
        loadDashboardData();
        
        setTimeout(() => {
            document.querySelector('[data-section="overview"]').click();
        }, 500);
        
    } catch (error) {
        showToast(error.message || 'Failed to add expense', 'error');
    }
}

// Quick Add Handler
function handleQuickAdd(e) {
    e.preventDefault();
    
    const category = document.getElementById('quickCategory').value;
    const amount = parseFloat(document.getElementById('quickAmount').value);
    const date = document.getElementById('quickDate').value;
    
    if (!amount || amount <= 0) {
        showToast('Please enter an amount', 'error');
        return;
    }
    
    try {
        addExpense(category, amount, date, '');
        showToast('Quick expense added!');
        document.getElementById('quickAddForm').reset();
        document.getElementById('quickDate').value = getTodayDate();
        document.getElementById('quickCategory').value = category;
        document.getElementById('quickAddModal').classList.add('hidden');
        loadDashboardData();
    } catch (error) {
        showToast(error.message || 'Failed to add expense', 'error');
    }
}

// Render Expenses Table
function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expensesTableBody');
    const noExpenses = document.getElementById('noExpenses');
    const table = document.getElementById('expensesTable');
    
    if (expenses.length === 0) {
        table.classList.add('hidden');
        noExpenses.classList.remove('hidden');
        return;
    }
    
    table.classList.remove('hidden');
    noExpenses.classList.add('hidden');
    
    // Sort by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    tbody.innerHTML = sortedExpenses.map(expense => `
        <tr>
            <td><strong>${expense.category}</strong></td>
            <td><span class="badge ${getCategoryBadgeClass(expense.category)}">${expense.budgetType}</span></td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>${formatDate(expense.date)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-danger btn-sm" onclick="deleteExpenseAction('${expense.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Delete Expense Action
function deleteExpenseAction(id) {
    confirmDialog('Are you sure you want to delete this expense?').then(confirmed => {
        if (!confirmed) return;
        
        try {
            deleteExpenseLocal(id);
            showToast('Expense deleted successfully');
            loadDashboardData();
            renderExpensesTable(currentExpenses);
        } catch (error) {
            showToast('Failed to delete expense', 'error');
        }
    });
}

// Load Deleted Expenses
function loadDeletedExpenses() {
    try {
        deletedExpenses = getDeletedExpenses();
        renderDeletedTable();
    } catch (error) {
        showToast('Failed to load deleted expenses', 'error');
    }
}

// Render Deleted Table
function renderDeletedTable() {
    const tbody = document.getElementById('deletedTableBody');
    const noDeleted = document.getElementById('noDeleted');
    const table = document.getElementById('deletedTable');
    
    if (deletedExpenses.length === 0) {
        table.classList.add('hidden');
        noDeleted.classList.remove('hidden');
        return;
    }
    
    table.classList.remove('hidden');
    noDeleted.classList.add('hidden');
    
    tbody.innerHTML = deletedExpenses.map(expense => `
        <tr>
            <td>${expense.category}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>${formatDate(expense.deletedAt)}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="restoreExpenseAction('${expense.id}')">
                    <i class="fas fa-undo"></i> Restore
                </button>
            </td>
        </tr>
    `).join('');
}

// Restore Expense Action
function restoreExpenseAction(id) {
    try {
        restoreExpenseLocal(id);
        showToast('Expense restored successfully');
        loadDeletedExpenses();
        loadDashboardData();
    } catch (error) {
        showToast('Failed to restore expense', 'error');
    }
}

// Search Handler
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const filtered = currentExpenses.filter(expense => 
        expense.category.toLowerCase().includes(query) ||
        (expense.description && expense.description.toLowerCase().includes(query))
    );
    renderExpensesTable(filtered);
}

// Export CSV Handler
function handleExportCSV() {
    try {
        const csvContent = exportToCSV();
        const timestamp = new Date().toISOString().split('T')[0];
        downloadCSV(csvContent, `expenses_${timestamp}.csv`);
        showToast('CSV exported successfully');
    } catch (error) {
        showToast(error.message || 'Failed to export CSV', 'error');
    }
}

// Export JSON Handler
function handleExportJSON() {
    try {
        const jsonContent = exportData();
        const timestamp = new Date().toISOString().split('T')[0];
        downloadJSON(jsonContent, `smart_budget_backup_${timestamp}.json`);
        showToast('Data exported successfully!');
    } catch (error) {
        showToast(error.message || 'Failed to export data', 'error');
    }
}

// Import JSON Handler
function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    document.getElementById('importFileName').textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            importData(event.target.result);
            showToast('Data imported successfully!');
            loadDashboardData();
            e.target.value = ''; // Reset input
            document.getElementById('importFileName').textContent = 'No file chosen';
        } catch (error) {
            showToast(error.message || 'Failed to import data', 'error');
        }
    };
    reader.readAsText(file);
}

// Import JSON Handler 2
function handleImportJSON2(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            importData(event.target.result);
            showToast('Data imported successfully!');
            loadDashboardData();
            e.target.value = ''; // Reset input
        } catch (error) {
            showToast(error.message || 'Failed to import data', 'error');
        }
    };
    reader.readAsText(file);
}

// ============================================
// SAVINGS GOALS
// ============================================

function handleSavingsGoal(e) {
    e.preventDefault();
    
    const name = document.getElementById('goalName').value;
    const amount = document.getElementById('goalAmount').value;
    const deadline = document.getElementById('goalDeadline').value;
    
    if (!name || !amount) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        addSavingsGoal(name, amount, deadline);
        showToast('Savings goal created!');
        document.getElementById('savingsGoalForm').reset();
        renderSavingsGoals();
    } catch (error) {
        showToast(error.message || 'Failed to create goal', 'error');
    }
}

function renderSavingsGoals() {
    const goals = getSavingsGoals();
    const container = document.getElementById('goalsList');
    
    if (goals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bullseye"></i>
                <p>No savings goals yet. Create your first goal!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = goals.map(goal => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        const deadline = goal.deadline ? formatDate(goal.deadline) : 'No deadline';
        
        return `
            <div class="goal-card">
                <div class="goal-header">
                    <div>
                        <div class="goal-name">${goal.name}</div>
                        <div class="goal-target">${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}</div>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="deleteGoal('${goal.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="goal-progress">
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <div class="goal-progress-text">
                        <span>${progress.toFixed(1)}% saved</span>
                        <span>${formatCurrency(goal.targetAmount - goal.currentAmount)} remaining</span>
                    </div>
                </div>
                <div class="goal-deadline">
                    <i class="fas fa-calendar"></i> Target: ${deadline}
                </div>
                <div class="goal-actions">
                    <button class="btn btn-primary btn-sm" onclick="addToGoal('${goal.id}')">
                        <i class="fas fa-plus"></i> Add Savings
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteGoal(id) {
    confirmDialog('Are you sure you want to delete this goal?').then(confirmed => {
        if (confirmed) {
            deleteSavingsGoal(id);
            renderSavingsGoals();
            showToast('Goal deleted');
        }
    });
}

function addToGoal(id) {
    const amount = prompt('Enter amount to add to savings:');
    if (amount && parseFloat(amount) > 0) {
        updateSavingsGoal(id, parseFloat(amount));
        renderSavingsGoals();
        showToast('Savings added to goal!');
        
        // Also add as expense
        const goals = getSavingsGoals();
        const goal = goals.find(g => g.id === id);
        if (goal) {
            addExpense('Other Savings', parseFloat(amount), getTodayDate(), `Savings for: ${goal.name}`);
            loadDashboardData();
        }
    }
}

// ============================================
// CATEGORY LIMITS
// ============================================

function renderCategoryLimits() {
    const limits = getCategoryLimits();
    const container = document.getElementById('limitInputs');
    
    const categories = [
        { name: 'Groceries', icon: 'fa-shopping-basket' },
        { name: 'Dining Out', icon: 'fa-utensils' },
        { name: 'Entertainment', icon: 'fa-film' },
        { name: 'Shopping', icon: 'fa-shopping-bag' },
        { name: 'Transport', icon: 'fa-bus' },
        { name: 'Subscriptions', icon: 'fa-play-circle' },
        { name: 'Coffee', icon: 'fa-coffee' },
        { name: 'Personal Care', icon: 'fa-spa' }
    ];
    
    container.innerHTML = categories.map(cat => `
        <div class="limit-input-group">
            <i class="fas ${cat.icon}"></i>
            <input type="number" placeholder="Limit for ${cat.name}" 
                   data-category="${cat.name}" value="${limits[cat.name] || ''}" min="0">
        </div>
    `).join('');
}

function saveCategoryLimits() {
    const inputs = document.querySelectorAll('#limitInputs input');
    const limits = {};
    
    inputs.forEach(input => {
        if (input.value && parseFloat(input.value) > 0) {
            limits[input.dataset.category] = parseFloat(input.value);
        }
    });
    
    setCategoryLimits(limits);
    showToast('Category limits saved!');
    checkCategoryLimits();
}

function checkCategoryLimits() {
    const exceeded = getExceededCategories();
    const container = document.querySelector('.category-limits-form');
    
    // Remove existing warnings
    const existingWarning = document.querySelector('.limit-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    if (exceeded.length > 0) {
        const warning = document.createElement('div');
        warning.className = 'limit-warning';
        warning.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>Warning: You have exceeded limits for: ${exceeded.join(', ')}</span>
        `;
        container.appendChild(warning);
    }
}

// ============================================
// INSIGHTS
// ============================================

function renderInsights() {
    const insights = getSpendingInsights();
    
    document.getElementById('highestSpending').textContent = insights.highestCategory || '-';
    document.getElementById('highestAmount').textContent = formatCurrency(insights.highestAmount || 0);
    document.getElementById('lowestSpending').textContent = insights.lowestCategory || '-';
    document.getElementById('lowestAmount').textContent = formatCurrency(insights.lowestAmount || 0);
    document.getElementById('savingsRate').textContent = (insights.savingsRate || 0) + '%';
    document.getElementById('avgDaily').textContent = formatCurrency(insights.avgDaily || 0);
    
    // Render suggestions
    const suggestions = getSuggestions();
    const suggestionsContainer = document.getElementById('suggestionsList');
    suggestionsContainer.innerHTML = suggestions.map(s => `
        <div class="suggestion-item">
            <i class="fas ${s.icon}"></i>
            <p>${s.text}</p>
        </div>
    `).join('');
}

// ============================================
// REPORTS
// ============================================

function renderWeeklyReport() {
    const report = getWeeklyReport();
    const container = document.getElementById('weeklyReport');
    
    container.innerHTML = `
        <div class="weekly-summary">
            <div class="weekly-stat">
                <div class="weekly-stat-label">Total This Week</div>
                <div class="weekly-stat-value">${formatCurrency(report.total)}</div>
            </div>
            <div class="weekly-stat">
                <div class="weekly-stat-label">Transactions</div>
                <div class="weekly-stat-value">${report.count}</div>
            </div>
            <div class="weekly-stat">
                <div class="weekly-stat-label">Needs</div>
                <div class="weekly-stat-value">${formatCurrency(report.byType.needs)}</div>
            </div>
            <div class="weekly-stat">
                <div class="weekly-stat-label">Wants</div>
                <div class="weekly-stat-value">${formatCurrency(report.byType.wants)}</div>
            </div>
        </div>
        <div class="weekly-categories">
            <h4>Spending by Category</h4>
            ${Object.entries(report.byCategory).length > 0 ? 
                Object.entries(report.byCategory).map(([cat, amt]) => `
                    <div class="category-row">
                        <span><i class="fas ${getCategoryIcon(cat)}"></i> ${cat}</span>
                        <strong>${formatCurrency(amt)}</strong>
                    </div>
                `).join('') : '<p class="text-muted">No expenses this week</p>'
            }
        </div>
    `;
}

// ============================================
// SPENDING PERSONALITY
// ============================================

function updateSpendingPersonality() {
    const personality = analyzeSpendingPersonality();
    
    document.getElementById('personalityType').textContent = personality.type;
    document.getElementById('personalityDesc').textContent = personality.description;
    document.getElementById('personalityIcon').innerHTML = `<i class="fas ${personality.icon}"></i>`;
}

// ============================================
// FINANCIAL TIP
// ============================================

function loadFinancialTip() {
    const tip = getFinancialTip();
    document.getElementById('tipText').textContent = tip;
}

// Make functions globally available
window.deleteExpenseAction = deleteExpenseAction;
window.restoreExpenseAction = restoreExpenseAction;
window.deleteGoal = deleteGoal;
window.addToGoal = addToGoal;

