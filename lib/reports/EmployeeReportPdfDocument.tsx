import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/settings";
import type { EmployeeReportData } from "@/lib/reports/employee";

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
  // Section
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

  center: {
    textAlign: "center",
  },

  colEmployee: {
    width: "36%",
  },

  colServices: {
    width: "16%",
  },

  colRevenue: {
    width: "25%",
  },

  colShare: {
    width: "23%",
  },

  colDate: {
    width: "13%",
  },

  colMain: {
    width: "20%",
  },

  colService: {
    width: "25%",
  },

  colCustomer: {
    width: "27%",
  },

  colAmount: {
    width: "15%",
  },

  // ─────────────────────────────────────
  // Empty
  // ─────────────────────────────────────

  empty: {
    padding: 10,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },

  // ─────────────────────────────────────
  // Footer
  // ─────────────────────────────────────

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

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).format(new Date(date));
};

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

  const revenue = summary.totalRevenue;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{BUSINESS_INFO.name}</Text>

            <Text style={styles.businessInfo}>{BUSINESS_INFO.address}</Text>

            <Text style={styles.businessInfo}>
              {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
            </Text>
          </View>

          <View>
            <Text style={styles.reportLabel}>Employee Performance</Text>

            <Text style={styles.reportTitle}>Employee Report</Text>
          </View>
        </View>

        {/* PERIOD */}
        <View style={styles.periodBox}>
          <View>
            <Text style={styles.periodLabel}>Reporting Period</Text>
            <Text style={styles.periodValue}>
              {from} — {to}
            </Text>
          </View>

          <View>
            <Text style={[styles.periodLabel, { textAlign: "right" }]}>
              Employee
            </Text>

            <Text style={[styles.periodValue, { textAlign: "right" }]}>
              {employeeName || "All Employees"}
            </Text>
          </View>
        </View>

        {/* OVERVIEW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Revenue</Text>

              <Text style={styles.kpiValue}>{money(revenue)}</Text>

              <Text style={styles.kpiHint}>Total service revenue</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Services Performed</Text>

              <Text style={styles.kpiValue}>{summary.totalServices}</Text>

              <Text style={styles.kpiHint}>Completed services</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Employees</Text>

              <Text style={styles.kpiValue}>{summary.employeeCount}</Text>

              <Text style={styles.kpiHint}>Included in report</Text>
            </View>
          </View>
        </View>

        {/* EMPLOYEE PERFORMANCE */}
        {!employeeName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employee Performance</Text>

            <Text style={styles.sectionSubtitle}>
              Revenue and service contribution by employee
            </Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.colEmployee]}>
                  Employee
                </Text>

                <Text
                  style={[styles.headerCell, styles.colServices, styles.right]}
                >
                  Services
                </Text>

                <Text
                  style={[styles.headerCell, styles.colRevenue, styles.right]}
                >
                  Revenue
                </Text>

                <Text
                  style={[styles.headerCell, styles.colShare, styles.right]}
                >
                  Revenue Share
                </Text>
              </View>

              {employeeStats.length > 0 ? (
                employeeStats.map((employee, i) => {
                  const share =
                    revenue > 0 ? (employee.revenue / revenue) * 100 : 0;

                  return (
                    <View
                      key={i}
                      style={[
                        styles.tableRow,
                        i % 2 === 1 ? styles.tableRowAlt : {},
                      ]}
                    >
                      <Text style={[styles.cellStrong, styles.colEmployee]}>
                        {employee.name}
                      </Text>

                      <Text
                        style={[styles.cell, styles.colServices, styles.right]}
                      >
                        {employee.servicesCount}
                      </Text>

                      <Text
                        style={[styles.cell, styles.colRevenue, styles.right]}
                      >
                        {money(employee.revenue)}
                      </Text>

                      <Text
                        style={[styles.cell, styles.colShare, styles.right]}
                      >
                        {share.toFixed(1)}%
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.empty}>
                  No employee data in this period.
                </Text>
              )}
            </View>
          </View>
        )}

        {/* SERVICE LOG */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Activity</Text>

          <Text style={styles.sectionSubtitle}>
            Detailed record of services performed during the selected period
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colDate]}>Date</Text>

              <Text style={[styles.headerCell, styles.colMain]}>Employee</Text>

              <Text style={[styles.headerCell, styles.colService]}>
                Service
              </Text>

              <Text style={[styles.headerCell, styles.colCustomer]}>
                Customer
              </Text>

              <Text style={[styles.headerCell, styles.colAmount, styles.right]}>
                Amount
              </Text>
            </View>

            {log.length > 0 ? (
              log.map((row, i) => (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    i % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.cell, styles.colDate]}>
                    {formatDate(row.date)}
                  </Text>

                  <Text style={[styles.cell, styles.colMain]}>
                    {row.employeeName}
                  </Text>

                  <Text style={[styles.cellStrong, styles.colService]}>
                    {row.serviceName}
                  </Text>

                  <Text style={[styles.cell, styles.colCustomer]}>
                    {row.customerName}
                  </Text>

                  <Text
                    style={[styles.cellStrong, styles.colAmount, styles.right]}
                  >
                    {money(row.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>
                No services recorded in this period.
              </Text>
            )}
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {BUSINESS_INFO.name} · Employee Report
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

export default EmployeeReportPdfDocument;
