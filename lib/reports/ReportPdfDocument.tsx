import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/settings";
import type { ReportData } from "@/lib/reports/actions";

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
  colMain: { width: "50%" },
  colNum: { width: "25%", textAlign: "right" },
  emptyRow: { fontSize: 8, color: "#9ca3af", paddingVertical: 6 },
});

const money = (n: number) => `Rs. ${n.toFixed(2)}`;

const ReportPdfDocument = ({
  report,
  from,
  to,
}: {
  report: ReportData;
  from: string;
  to: string;
}) => {
  const {
    summary,
    employeeStats,
    serviceStats,
    topCustomers,
    methodBreakdown,
  } = report;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{BUSINESS_INFO.name} — Business Report</Text>
        <Text style={styles.subtitle}>
          {from} to {to}
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Revenue Collected</Text>
            <Text style={styles.kpiValue}>{money(summary.totalRevenue)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Invoiced</Text>
            <Text style={styles.kpiValue}>{money(summary.invoicedTotal)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Outstanding</Text>
            <Text style={styles.kpiValue}>{money(summary.outstanding)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Invoices</Text>
            <Text style={styles.kpiValue}>{summary.invoiceCount}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Customers Served</Text>
            <Text style={styles.kpiValue}>{summary.customersServed}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>New Customers</Text>
            <Text style={styles.kpiValue}>{summary.newCustomers}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Employee Performance</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colMain]}>Employee</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Services</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Revenue</Text>
        </View>
        {employeeStats.length > 0 ? (
          employeeStats.map((e, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colMain}>{e.name}</Text>
              <Text style={styles.colNum}>{e.servicesCount}</Text>
              <Text style={styles.colNum}>{money(e.revenue)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No data in this range.</Text>
        )}

        <Text style={styles.sectionTitle}>Services Breakdown</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colMain]}>Service</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Times</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Revenue</Text>
        </View>
        {serviceStats.length > 0 ? (
          serviceStats.map((s, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colMain}>{s.name}</Text>
              <Text style={styles.colNum}>{s.timesPerformed}</Text>
              <Text style={styles.colNum}>{money(s.revenue)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No data in this range.</Text>
        )}

        <Text style={styles.sectionTitle}>Top Customers</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colMain]}>Customer</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Invoices</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Spend</Text>
        </View>
        {topCustomers.length > 0 ? (
          topCustomers.map((c, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colMain}>{c.name}</Text>
              <Text style={styles.colNum}>{c.invoiceCount}</Text>
              <Text style={styles.colNum}>{money(c.spend)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No data in this range.</Text>
        )}

        <Text style={styles.sectionTitle}>Payments by Method</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colMain]}>Method</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Amount</Text>
        </View>
        {methodBreakdown.length > 0 ? (
          methodBreakdown.map((m, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colMain}>{m.method}</Text>
              <Text style={styles.colNum}>{money(m.amount)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No payments in this range.</Text>
        )}
      </Page>
    </Document>
  );
};

export default ReportPdfDocument;
