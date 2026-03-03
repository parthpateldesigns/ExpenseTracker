import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
    formatCurrency, formatMonthYear, filterTransactionsByMonth,
    calculateTotals, groupByCategory,
} from '../utils/helpers';
import { IconChevronLeft, IconChevronRight } from '../components/Icons';

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05 } },
};

// Curated color palette for charts
const CHART_COLORS = [
    '#638cff', '#4ade80', '#f87171', '#fbbf24', '#a78bfa',
    '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#e879f9',
    '#22d3ee', '#facc15',
];

// Custom tooltip for the charts
function CustomTooltip({ active, payload, label, isCurrency = true }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            boxShadow: 'var(--shadow-md)',
            fontSize: '0.8125rem',
        }}>
            {label && <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px', fontSize: '0.75rem' }}>{label}</div>}
            {payload.map((entry, i) => (
                <div key={i} style={{ color: entry.color, fontWeight: 600 }}>
                    {entry.name}: {isCurrency ? formatCurrency(entry.value) : entry.value}
                </div>
            ))}
        </div>
    );
}

// Custom pie label
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x} y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="0.6875rem"
            fontWeight="600"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

export default function Charts() {
    const { transactions, accounts, selectedMonth, setSelectedMonth } = useApp();

    const [activeChart, setActiveChart] = useState('pie');

    const monthTxns = useMemo(
        () => filterTransactionsByMonth(transactions, selectedMonth.month, selectedMonth.year),
        [transactions, selectedMonth],
    );

    const totals = useMemo(() => calculateTotals(monthTxns), [monthTxns]);

    const expenseTxns = useMemo(() => monthTxns.filter((t) => t.type === 'expense'), [monthTxns]);
    const categoryData = useMemo(() => {
        const grouped = groupByCategory(expenseTxns);
        return grouped.map((cat, i) => ({
            name: cat.category,
            value: cat.total,
            color: CHART_COLORS[i % CHART_COLORS.length],
        }));
    }, [expenseTxns]);

    // Daily spending data
    const dailyData = useMemo(() => {
        const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();
        const daily = {};
        for (let d = 1; d <= daysInMonth; d++) daily[d] = { income: 0, expense: 0 };
        for (const t of monthTxns) {
            if (t.type === 'transfer') continue;
            const day = new Date(t.date).getDate();
            if (daily[day]) {
                if (t.type === 'income') daily[day].income += t.amount;
                else daily[day].expense += t.amount;
            }
        }
        return Object.entries(daily).map(([day, vals]) => ({
            day: `${day}`,
            income: vals.income,
            expense: vals.expense,
        }));
    }, [monthTxns, selectedMonth]);

    // Income vs Expense comparison data
    const comparisonData = useMemo(() => [
        { name: 'Income', value: totals.income, fill: '#4ade80' },
        { name: 'Expenses', value: totals.expense, fill: '#f87171' },
        { name: 'Net', value: Math.abs(totals.net), fill: totals.net >= 0 ? '#4ade80' : '#f87171' },
    ], [totals]);

    const prevMonth = () => {
        setSelectedMonth((prev) => {
            const m = prev.month === 0 ? 11 : prev.month - 1;
            const y = prev.month === 0 ? prev.year - 1 : prev.year;
            return { month: m, year: y };
        });
    };

    const nextMonth = () => {
        setSelectedMonth((prev) => {
            const m = prev.month === 11 ? 0 : prev.month + 1;
            const y = prev.month === 11 ? prev.year + 1 : prev.year;
            return { month: m, year: y };
        });
    };

    const chartTabs = [
        { id: 'pie', label: 'Categories' },
        { id: 'daily', label: 'Daily' },
        { id: 'compare', label: 'Overview' },
    ];

    const hasData = monthTxns.length > 0;

    return (
        <div className="page">
            <div className="container">
                <motion.div variants={stagger} initial="hidden" animate="show">
                    {/* Month Selector */}
                    <motion.div variants={fadeUp} className="month-selector" style={{ marginBottom: '20px' }}>
                        <button onClick={prevMonth} id="charts-prev-month">
                            <IconChevronLeft />
                        </button>
                        <span className="month-label">
                            {formatMonthYear(selectedMonth.month, selectedMonth.year)}
                        </span>
                        <button onClick={nextMonth} id="charts-next-month">
                            <IconChevronRight />
                        </button>
                    </motion.div>

                    {/* Chart Type Tabs */}
                    <motion.div variants={fadeUp} style={{ marginBottom: '20px' }}>
                        <div className="chart-tabs">
                            {chartTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`chart-tab ${activeChart === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveChart(tab.id)}
                                    id={`chart-tab-${tab.id}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {!hasData ? (
                        <motion.div variants={fadeUp}>
                            <div className="empty-state">
                                <div className="empty-state-title">No data to chart</div>
                                <div className="empty-state-text">
                                    Add some transactions for {formatMonthYear(selectedMonth.month, selectedMonth.year)} to see charts
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeChart}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            >
                                {/* PIE CHART: Category Breakdown */}
                                {activeChart === 'pie' && (
                                    <div>
                                        <div className="card" style={{ padding: '20px' }}>
                                            <span className="text-label" style={{ display: 'block', marginBottom: '16px' }}>
                                                Expense by Category
                                            </span>
                                            {categoryData.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                                                    No expense transactions this month
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ width: '100%', height: 260 }}>
                                                        <ResponsiveContainer>
                                                            <PieChart>
                                                                <Pie
                                                                    data={categoryData}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={55}
                                                                    outerRadius={100}
                                                                    dataKey="value"
                                                                    labelLine={false}
                                                                    label={renderPieLabel}
                                                                    stroke="var(--bg-card)"
                                                                    strokeWidth={2}
                                                                >
                                                                    {categoryData.map((entry, i) => (
                                                                        <Cell key={i} fill={entry.color} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip content={<CustomTooltip />} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    {/* Legend */}
                                                    <div style={{
                                                        display: 'flex', flexWrap: 'wrap', gap: '8px 16px',
                                                        marginTop: '16px', justifyContent: 'center',
                                                    }}>
                                                        {categoryData.map((cat, i) => (
                                                            <div key={i} style={{
                                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                                fontSize: '0.75rem', color: 'var(--text-secondary)',
                                                            }}>
                                                                <div style={{
                                                                    width: 8, height: 8, borderRadius: '50%',
                                                                    background: cat.color, flexShrink: 0,
                                                                }} />
                                                                <span>{cat.name}</span>
                                                                <span style={{ color: 'var(--text-tertiary)' }}>
                                                                    {formatCurrency(cat.value)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* BAR CHART: Daily Spending */}
                                {activeChart === 'daily' && (
                                    <div>
                                        <div className="card" style={{ padding: '20px' }}>
                                            <span className="text-label" style={{ display: 'block', marginBottom: '16px' }}>
                                                Daily Income vs Expenses
                                            </span>
                                            <div style={{ width: '100%', height: 280 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={dailyData} barGap={1} barSize={8}>
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            stroke="var(--border-subtle)"
                                                            vertical={false}
                                                        />
                                                        <XAxis
                                                            dataKey="day"
                                                            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                                                            axisLine={{ stroke: 'var(--border-subtle)' }}
                                                            tickLine={false}
                                                            interval={Math.floor(dailyData.length / 8)}
                                                        />
                                                        <YAxis
                                                            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                                        />
                                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border-subtle)' }} />
                                                        <Bar dataKey="income" fill="#4ade80" radius={[3, 3, 0, 0]} name="Income" />
                                                        <Bar dataKey="expense" fill="#f87171" radius={[3, 3, 0, 0]} name="Expenses" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* OVERVIEW: Income vs Expense comparison */}
                                {activeChart === 'compare' && (
                                    <div>
                                        <div className="card" style={{ padding: '20px' }}>
                                            <span className="text-label" style={{ display: 'block', marginBottom: '16px' }}>
                                                Monthly Summary
                                            </span>

                                            {/* Summary cards */}
                                            <div style={{
                                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '10px', marginBottom: '24px',
                                            }}>
                                                <div style={{
                                                    background: 'var(--income-muted)', borderRadius: 'var(--radius-md)',
                                                    padding: '14px', textAlign: 'center',
                                                }}>
                                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                                        Income
                                                    </div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--income)', fontVariantNumeric: 'tabular-nums' }}>
                                                        {formatCurrency(totals.income)}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    background: 'var(--expense-muted)', borderRadius: 'var(--radius-md)',
                                                    padding: '14px', textAlign: 'center',
                                                }}>
                                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                                        Expenses
                                                    </div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--expense)', fontVariantNumeric: 'tabular-nums' }}>
                                                        {formatCurrency(totals.expense)}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    background: 'var(--accent-muted)', borderRadius: 'var(--radius-md)',
                                                    padding: '14px', textAlign: 'center',
                                                }}>
                                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                                                        Net
                                                    </div>
                                                    <div style={{
                                                        fontSize: '1rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                                                        color: totals.net >= 0 ? 'var(--income)' : 'var(--expense)',
                                                    }}>
                                                        {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bar comparison */}
                                            <div style={{ width: '100%', height: 220 }}>
                                                <ResponsiveContainer>
                                                    <BarChart data={comparisonData} barSize={50}>
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            stroke="var(--border-subtle)"
                                                            vertical={false}
                                                        />
                                                        <XAxis
                                                            dataKey="name"
                                                            tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 500 }}
                                                            axisLine={{ stroke: 'var(--border-subtle)' }}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                                                        />
                                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border-subtle)' }} />
                                                        <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Amount">
                                                            {comparisonData.map((entry, i) => (
                                                                <Cell key={i} fill={entry.fill} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
