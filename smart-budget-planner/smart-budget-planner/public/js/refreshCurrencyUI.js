// Global Currency Refresh Function
window.refreshCurrencyUI = function() {
    // Refresh dashboard data (calls formatCurrency everywhere)
    if (typeof loadDashboardData === 'function') loadDashboardData();
    
    // Refresh current section
    const activeSection = document.querySelector('.section.active');
    if (activeSection) {
        const sectionId = activeSection.id;
        if (sectionId === 'expenses') {
            renderExpensesTable(getExpenses());
        } else if (sectionId === 'savings') {
            renderSavingsGoals();
        } else if (sectionId === 'insights') {
            renderInsights();
        } else if (sectionId === 'reports') {
            renderWeeklyReport();
        } else if (sectionId === 'backup') {
            loadExpenseNotepad();
        } else if (sectionId === 'overview') {
            updateCharts();
            renderHeatmap();
        }
    }
    
    // Force chart re-render (currency in labels)
    if (typeof updateCharts === 'function') {
        setTimeout(updateCharts, 100);
    }
    
    // Update category limits form
    if (typeof renderCategoryLimits === 'function') {
        renderCategoryLimits();
    }
    
    console.log('Currency UI refreshed for:', getCurrency());
};
