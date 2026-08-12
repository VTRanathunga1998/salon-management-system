import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/constants/business";
import type { ExpenseReportData } from "@/lib/reports/expense";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#1f2937" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#6b7280", marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 6,
  },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  kpiBox: {
    width: "31%",
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 4,
    marginRight: "2%",
    marginBottom: 8,
  },
  kpiLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase" },
  kpiValue: { fontSize: 12, fontWeight: 700, marginTop: 2 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 4,
  },
  headerCell: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase" },
  colDate: { width: "15%" },
  colMain: { width: "35%" },
  colCat: { width: "20%" },
  colNum: { width: "15%", textAlign: "right" },
  emptyRow: { fontSize: 8, color: "#9ca3af", paddingVertical: 6 },
});

const money = (n: number) => `Rs. ${n.toFixed(2)}`;
const formatLabel = (v: string) =>
  v.charAt(0) + v.slice(1).toLowerCase().replace("_", " ");

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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          {BUSINESS_INFO.name} — Expense Report
          {categoryLabel ? `: ${categoryLabel}` : ""}
        </Text>
        <Text style={styles.subtitle}>
          {from} to {to}
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Spent</Text>
            <Text style={styles.kpiValue}>{money(summary.totalAmount)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Expenses Logged</Text>
            <Text style={styles.kpiValue}>{summary.count}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Avg per Expense</Text>
            <Text style={styles.kpiValue}>
              {money(
                summary.count > 0 ? summary.totalAmount / summary.count : 0,
              )}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>By Category</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { width: "70%" }]}>Category</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Amount</Text>
        </View>
        {categoryBreakdown.length > 0 ? (
          categoryBreakdown.map((c, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "70%" }}>{formatLabel(c.category)}</Text>
              <Text style={styles.colNum}>{money(c.amount)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No expenses in this range.</Text>
        )}

        <Text style={styles.sectionTitle}>Paid Via</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { width: "70%" }]}>Method</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Amount</Text>
        </View>
        {methodBreakdown.length > 0 ? (
          methodBreakdown.map((m, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "70%" }}>{formatLabel(m.method)}</Text>
              <Text style={styles.colNum}>{money(m.amount)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No expenses in this range.</Text>
        )}

        <Text style={styles.sectionTitle}>Expenses</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colDate]}>Date</Text>
          <Text style={[styles.headerCell, styles.colMain]}>Title</Text>
          <Text style={[styles.headerCell, styles.colCat]}>Category</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Amount</Text>
        </View>
        {expenses.length > 0 ? (
          expenses.map((e, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDate}>
                {new Date(e.date).toLocaleDateString()}
              </Text>
              <Text style={styles.colMain}>{e.title}</Text>
              <Text style={styles.colCat}>{formatLabel(e.category)}</Text>
              <Text style={styles.colNum}>{money(e.amount)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No expenses in this range.</Text>
        )}
      </Page>
    </Document>
  );
};

export default ExpenseReportPdfDocument;
