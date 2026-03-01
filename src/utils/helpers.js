/* ============================================
   Helper utilities for Balance
   ============================================ */

/**
 * Format amount as Indian Rupee currency
 */
export function formatCurrency(amount) {
    const absAmount = Math.abs(amount);
    const formatted = absAmount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
    return `${amount < 0 ? '-' : ''}₹${formatted}`;
}

/**
 * Get current month/year as { month, year }
 */
export function getCurrentMonthYear() {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
}

/**
 * Format month/year for display
 */
export function formatMonthYear(month, year) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[month]} ${year}`;
}

/**
 * Format date string to readable format
 */
export function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[date.getMonth()]}`;
}

/**
 * Format date string to full readable format
 */
export function formatDateFull(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Filter transactions for a specific month/year
 */
export function filterTransactionsByMonth(transactions, month, year) {
    return transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
    });
}

/**
 * Calculate totals for a list of transactions (excludes transfers)
 */
export function calculateTotals(transactions) {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
        if (t.type === 'transfer') continue; // transfers don't count as income/expense
        if (t.type === 'income') {
            income += t.amount;
        } else {
            expense += t.amount;
        }
    }

    return { income, expense, net: income - expense };
}

/**
 * Group transactions by category with totals (excludes transfers)
 */
export function groupByCategory(transactions) {
    const groups = {};
    for (const t of transactions) {
        if (t.type === 'transfer') continue;
        if (!groups[t.category]) {
            groups[t.category] = { total: 0, count: 0 };
        }
        groups[t.category].total += t.amount;
        groups[t.category].count += 1;
    }

    return Object.entries(groups)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.total - a.total);
}

/**
 * Group transactions by account with totals
 */
export function groupByAccount(transactions, accounts) {
    const groups = {};
    for (const t of transactions) {
        if (t.type === 'transfer') {
            // Track transfer out from source
            if (!groups[t.accountId]) {
                groups[t.accountId] = { income: 0, expense: 0, transferIn: 0, transferOut: 0 };
            }
            groups[t.accountId].transferOut += t.amount;
            // Track transfer in to destination
            if (!groups[t.toAccountId]) {
                groups[t.toAccountId] = { income: 0, expense: 0, transferIn: 0, transferOut: 0 };
            }
            groups[t.toAccountId].transferIn += t.amount;
        } else {
            if (!groups[t.accountId]) {
                groups[t.accountId] = { income: 0, expense: 0, transferIn: 0, transferOut: 0 };
            }
            if (t.type === 'income') {
                groups[t.accountId].income += t.amount;
            } else {
                groups[t.accountId].expense += t.amount;
            }
        }
    }

    return accounts.map((acc) => ({
        account: acc,
        income: groups[acc.id]?.income || 0,
        expense: groups[acc.id]?.expense || 0,
        transferIn: groups[acc.id]?.transferIn || 0,
        transferOut: groups[acc.id]?.transferOut || 0,
    }));
}
