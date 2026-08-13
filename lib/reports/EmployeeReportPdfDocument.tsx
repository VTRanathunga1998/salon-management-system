import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/settings";
import type { EmployeeReportData } from "@/lib/reports/employee";

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
  colDate: { width: "14%" },
  colMain: { width: "22%" },
  colService: { width: "24%" },
  colNum: { width: "14%", textAlign: "right" },
  emptyRow: { fontSize: 8, color: "#9ca3af", paddingVertical: 6 },
});

const money = (n: number) => `AED ${n.toFixed(2)}`;

const EmployeeReportPdfDocument = ({
  report,
  from,
  to,
  employeeName,
}: {
  report: EmployeeReportData;
  from: string;
  to: string;
  employeeName?: string;
}) => {
  const { summary, employeeStats, log } = report;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          {BUSINESS_INFO.name} — Employee Report
          {employeeName ? `: ${employeeName}` : ""}
        </Text>
        <Text style={styles.subtitle}>
          {from} to {to}
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Revenue</Text>
            <Text style={styles.kpiValue}>{money(summary.totalRevenue)}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Services Performed</Text>
            <Text style={styles.kpiValue}>{summary.totalServices}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Employees</Text>
            <Text style={styles.kpiValue}>{summary.employeeCount}</Text>
          </View>
        </View>

        {!employeeName && (
          <>
            <Text style={styles.sectionTitle}>By Employee</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: "50%" }]}>
                Employee
              </Text>
              <Text style={[styles.headerCell, styles.colNum]}>Services</Text>
              <Text style={[styles.headerCell, styles.colNum]}>Revenue</Text>
            </View>
            {employeeStats.length > 0 ? (
              employeeStats.map((e, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={{ width: "50%" }}>{e.name}</Text>
                  <Text style={styles.colNum}>{e.servicesCount}</Text>
                  <Text style={styles.colNum}>{money(e.revenue)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyRow}>No data in this range.</Text>
            )}
          </>
        )}

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colDate]}>Date</Text>
          <Text style={[styles.headerCell, styles.colMain]}>Employee</Text>
          <Text style={[styles.headerCell, styles.colService]}>Service</Text>
          <Text style={[styles.headerCell, styles.colMain]}>Customer</Text>
          <Text style={[styles.headerCell, styles.colNum]}>Amount</Text>
        </View>
        {log.length > 0 ? (
          log.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDate}>
                {new Date(row.date).toLocaleDateString()}
              </Text>
              <Text style={styles.colMain}>{row.employeeName}</Text>
              <Text style={styles.colService}>{row.serviceName}</Text>
              <Text style={styles.colMain}>{row.customerName}</Text>
              <Text style={styles.colNum}>{money(row.amount)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No services in this range.</Text>
        )}
      </Page>
    </Document>
  );
};

export default EmployeeReportPdfDocument;
