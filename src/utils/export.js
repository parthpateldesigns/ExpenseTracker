/* ============================================
   Export utilities for Balance
   CSV, Excel (xlsx), and PDF export
   ============================================ */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Get account name by ID
 */
function getAccountName(accounts, id) {
    return accounts.find((a) => a.id === id)?.name || 'Unknown';
}

/**
 * Format date for export
 */
function formatExportDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Prepare rows from transactions
 */
function prepareRows(transactions, accounts) {
    return transactions.map((t) => {
        const isTransfer = t.type === 'transfer';
        return {
            Date: formatExportDate(t.date),
            Type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
            Category: isTransfer ? 'Self Transfer' : (t.category || ''),
            Account: getAccountName(accounts, t.accountId),
            ToAccount: isTransfer ? getAccountName(accounts, t.toAccountId) : '',
            Amount: t.amount,
            Notes: t.notes || '',
        };
    });
}

/**
 * Export to CSV and trigger download
 */
export function exportToCSV(transactions, accounts, monthLabel) {
    const rows = prepareRows(transactions, accounts);
    const headers = ['Date', 'Type', 'Category', 'Account', 'To Account', 'Amount', 'Notes'];
    const csvRows = [
        headers.join(','),
        ...rows.map((r) =>
            [r.Date, r.Type, `"${r.Category}"`, `"${r.Account}"`, `"${r.ToAccount}"`, r.Amount, `"${r.Notes}"`].join(',')
        ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `Transactions_${monthLabel.replace(' ', '_')}.csv`);
}

/**
 * Export to Excel (.xlsx)
 */
export function exportToExcel(transactions, accounts, monthLabel) {
    const rows = prepareRows(transactions, accounts);
    const wsData = [
        ['Date', 'Type', 'Category', 'Account', 'To Account', 'Amount', 'Notes'],
        ...rows.map((r) => [r.Date, r.Type, r.Category, r.Account, r.ToAccount, r.Amount, r.Notes]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 14 },
        { wch: 14 }, { wch: 12 }, { wch: 24 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, monthLabel);
    XLSX.writeFile(wb, `Transactions_${monthLabel.replace(' ', '_')}.xlsx`);
}

/**
 * Export to PDF with summary table
 */
export function exportToPDF(transactions, accounts, monthLabel, totals) {
    const doc = new jsPDF();
    const rows = prepareRows(transactions, accounts);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Expense Report — ${monthLabel}`, 14, 18);

    // Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(`Income: Rs.${totals.income.toLocaleString('en-IN')}    Expenses: Rs.${totals.expense.toLocaleString('en-IN')}    Net: Rs.${totals.net.toLocaleString('en-IN')}`, 14, 26);

    // Table
    autoTable(doc, {
        startY: 32,
        head: [['Date', 'Type', 'Category', 'Account', 'To Account', 'Amount', 'Notes']],
        body: rows.map((r) => [r.Date, r.Type, r.Category, r.Account, r.ToAccount, `Rs.${r.Amount.toLocaleString('en-IN')}`, r.Notes]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [99, 140, 255], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 250] },
        columnStyles: {
            0: { cellWidth: 22 },
            1: { cellWidth: 18 },
            2: { cellWidth: 28 },
            3: { cellWidth: 24 },
            4: { cellWidth: 24 },
            5: { halign: 'right', cellWidth: 26 },
            6: { cellWidth: 'auto' },
        },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
    }

    doc.save(`Transactions_${monthLabel.replace(' ', '_')}.pdf`);
}

/**
 * Helper to trigger blob download
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
