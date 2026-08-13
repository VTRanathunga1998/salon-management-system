import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/settings";
import type { ExpenseReportData } from "@/lib/reports/expense";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },

  // ─────────────────────────────────────
  // Header
  // ─────────────────────────────────────

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  businessName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 3,
  },

  businessInfo: {
    fontSize: 7.5,
    color: "#6b7280",
    marginBottom: 2,
  },

  reportLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "right",
    marginBottom: 3,
  },

  reportTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    textAlign: "right",
  },

  // ─────────────────────────────────────
  // Period
  // ─────────────────────────────────────

  periodBox: {
    marginTop: 14,
    padding: 9,
    backgroundColor: "#f8fafc",
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  periodLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 2,
  },

  periodValue: {
    fontSize: 9,
    fontWeight: 700,
    color: "#374151",
  },

  // ─────────────────────────────────────
  // Sections
  // ─────────────────────────────────────

  section: {
    marginTop: 18,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 7,
  },

  sectionSubtitle: {
    fontSize: 7.5,
    color: "#9ca3af",
    marginTop: -4,
    marginBottom: 7,
  },

  // ─────────────────────────────────────
  // KPI
  // ─────────────────────────────────────

  kpiRow: {
    flexDirection: "row",
    gap: 7,
  },

  kpiBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#eef2f7",
    borderRadius: 5,
    padding: 9,
  },

  kpiLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  kpiValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111827",
    marginTop: 4,
  },

  kpiHint: {
    fontSize: 6.5,
    color: "#9ca3af",
    marginTop: 2,
  },

  // ─────────────────────────────────────
  // Tables
  // ─────────────────────────────────────

  table: {
    width: "100%",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 5,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eef2f7",
    paddingVertical: 6,
    paddingHorizontal: 5,
  },

  tableRowAlt: {
    backgroundColor: "#fcfcfd",
  },

  headerCell: {
    fontSize: 6.5,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
  },

  cell: {
    fontSize: 7.5,
    color: "#374151",
  },

  cellStrong: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#111827",
  },

  right: {
    textAlign: "right",
  },

  // Category / payment tables
  colBreakdownName: {
    width: "52%",
  },

  colBreakdownAmount: {
    width: "25%",
    textAlign: "right",
  },

  colBreakdownShare: {
    width: "23%",
    textAlign: "right",
  },

  // Expense details
  colDate: {
    width: "14%",
  },

  colTitle: {
    width: "34%",
  },

  colCategory: {
    width: "25%",
  },

  colAmount: {
    width: "27%",
    textAlign: "right",
  },

  // Empty
  empty: {
    padding: 10,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerText: {
    fontSize: 6.5,
    color: "#9ca3af",
  },
});

const money = (n: number) => `AED ${n.toFixed(2)}`;

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).format(new Date(date));
};

const ExpenseReportPdfDocument = ({
  report,
  from,
  to,
  categoryLabel,
}: {
  report: ExpenseReportData;
  from: string;
  to: string;
  categoryLabel?: string;
}) => {
  const { summary, categoryBreakdown, methodBreakdown, expenses } = report;

  const totalAmount = summary.totalAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ═══════════════════════════════════
            HEADER
        ═══════════════════════════════════ */}

        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{BUSINESS_INFO.name}</Text>

            <Text style={styles.businessInfo}>{BUSINESS_INFO.address}</Text>

            <Text style={styles.businessInfo}>
              {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
            </Text>
          </View>

          <View>
            <Text style={styles.reportLabel}>Financial Report</Text>

            <Text style={styles.reportTitle}>Expense Report</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════
            REPORT PERIOD
        ═══════════════════════════════════ */}

        <View style={styles.periodBox}>
          <View>
            <Text style={styles.periodLabel}>Reporting Period</Text>

            <Text style={styles.periodValue}>
              {from} — {to}
            </Text>
          </View>

          <View>
            <Text style={[styles.periodLabel, { textAlign: "right" }]}>
              Category
            </Text>

            <Text style={[styles.periodValue, { textAlign: "right" }]}>
              {categoryLabel || "All Categories"}
            </Text>
          </View>
        </View>

        {/* ═══════════════════════════════════
            OVERVIEW
        ═══════════════════════════════════ */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Overview</Text>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Total Spent</Text>

              <Text style={styles.kpiValue}>{money(totalAmount)}</Text>

              <Text style={styles.kpiHint}>Total recorded expenses</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Expenses</Text>

              <Text style={styles.kpiValue}>{summary.count}</Text>

              <Text style={styles.kpiHint}>Transactions recorded</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Average Expense</Text>

              <Text style={styles.kpiValue}>
                {money(summary.count > 0 ? totalAmount / summary.count : 0)}
              </Text>

              <Text style={styles.kpiHint}>Average per transaction</Text>
            </View>
          </View>
        </View>

        {/* ═══════════════════════════════════
            CATEGORY BREAKDOWN
        ═══════════════════════════════════ */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>

          <Text style={styles.sectionSubtitle}>
            How the salon's expenses were distributed
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colBreakdownName]}>
                Category
              </Text>

              <Text style={[styles.headerCell, styles.colBreakdownAmount]}>
                Amount
              </Text>

              <Text style={[styles.headerCell, styles.colBreakdownShare]}>
                Share
              </Text>
            </View>

            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map((category, i) => {
                const share =
                  totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0;

                return (
                  <View
                    key={i}
                    style={[
                      styles.tableRow,
                      i % 2 === 1 ? styles.tableRowAlt : {},
                    ]}
                  >
                    <Text style={[styles.cellStrong, styles.colBreakdownName]}>
                      {formatLabel(category.category)}
                    </Text>

                    <Text style={[styles.cell, styles.colBreakdownAmount]}>
                      {money(category.amount)}
                    </Text>

                    <Text style={[styles.cell, styles.colBreakdownShare]}>
                      {share.toFixed(1)}%
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.empty}>
                No expenses recorded in this period.
              </Text>
            )}
          </View>
        </View>

        {/* ═══════════════════════════════════
            PAYMENT METHOD
        ═══════════════════════════════════ */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>

          <Text style={styles.sectionSubtitle}>
            Breakdown of how expenses were paid
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colBreakdownName]}>
                Method
              </Text>

              <Text style={[styles.headerCell, styles.colBreakdownAmount]}>
                Amount
              </Text>

              <Text style={[styles.headerCell, styles.colBreakdownShare]}>
                Share
              </Text>
            </View>

            {methodBreakdown.length > 0 ? (
              methodBreakdown.map((method, i) => {
                const share =
                  totalAmount > 0 ? (method.amount / totalAmount) * 100 : 0;

                return (
                  <View
                    key={i}
                    style={[
                      styles.tableRow,
                      i % 2 === 1 ? styles.tableRowAlt : {},
                    ]}
                  >
                    <Text style={[styles.cellStrong, styles.colBreakdownName]}>
                      {formatLabel(method.method)}
                    </Text>

                    <Text style={[styles.cell, styles.colBreakdownAmount]}>
                      {money(method.amount)}
                    </Text>

                    <Text style={[styles.cell, styles.colBreakdownShare]}>
                      {share.toFixed(1)}%
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.empty}>No payment data in this period.</Text>
            )}
          </View>
        </View>

        {/* ═══════════════════════════════════
            EXPENSE DETAILS
        ═══════════════════════════════════ */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Details</Text>

          <Text style={styles.sectionSubtitle}>
            Detailed record of expenses during the selected period
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colDate]}>Date</Text>

              <Text style={[styles.headerCell, styles.colTitle]}>Title</Text>

              <Text style={[styles.headerCell, styles.colCategory]}>
                Category
              </Text>

              <Text style={[styles.headerCell, styles.colAmount]}>Amount</Text>
            </View>

            {expenses.length > 0 ? (
              expenses.map((expense, i) => (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    i % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.cell, styles.colDate]}>
                    {formatDate(expense.date)}
                  </Text>

                  <Text style={[styles.cellStrong, styles.colTitle]}>
                    {expense.title}
                  </Text>

                  <Text style={[styles.cell, styles.colCategory]}>
                    {formatLabel(expense.category)}
                  </Text>

                  <Text style={[styles.cellStrong, styles.colAmount]}>
                    {money(expense.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>
                No expenses recorded in this period.
              </Text>
            )}
          </View>
        </View>

        {/* ═══════════════════════════════════
            FOOTER
        ═══════════════════════════════════ */}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {BUSINESS_INFO.name} · Expense Report
          </Text>

          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default ExpenseReportPdfDocument;
