import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/settings";
import { formatDateInSalonTz } from "@/lib/utils/timezone";
import type { ReportData } from "@/lib/reports/actions";

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 38,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },

  /* -------------------------------------------------
     HEADER
  ------------------------------------------------- */

  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
    marginBottom: 14,
  },

  businessName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 3,
  },

  reportTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 3,
  },

  subtitle: {
    fontSize: 8,
    color: "#6b7280",
  },

  /* -------------------------------------------------
     KPI CARDS
  ------------------------------------------------- */

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },

  kpiBox: {
    width: "31.5%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 9,
    marginRight: "2.25%",
    marginBottom: 8,
  },

  kpiBoxLast: {
    marginRight: 0,
  },

  kpiLabel: {
    fontSize: 7,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  kpiValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
  },

  kpiDescription: {
    fontSize: 6.5,
    color: "#9ca3af",
    marginTop: 3,
  },

  /* -------------------------------------------------
     SECTIONS
  ------------------------------------------------- */

  section: {
    marginTop: 12,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 6,
  },

  sectionSubtitle: {
    fontSize: 7,
    color: "#9ca3af",
    marginTop: -3,
    marginBottom: 6,
  },

  /* -------------------------------------------------
     FINANCIAL SUMMARY
  ------------------------------------------------- */

  financialBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 9,
    marginBottom: 2,
  },

  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  financialLabel: {
    fontSize: 8,
    color: "#6b7280",
  },

  financialValue: {
    fontSize: 8,
    color: "#374151",
    fontWeight: 700,
  },

  financialTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 4,
    paddingTop: 7,
  },

  financialTotalLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#111827",
  },

  financialTotalValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#15803d",
  },

  /* -------------------------------------------------
     TABLE
  ------------------------------------------------- */

  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 5,
    overflow: "hidden",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 7,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 7,
  },

  tableRowLast: {
    borderBottomWidth: 0,
  },

  headerCell: {
    fontSize: 7,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
  },

  cell: {
    fontSize: 8,
    color: "#374151",
  },

  cellStrong: {
    fontSize: 8,
    color: "#111827",
    fontWeight: 700,
  },

  colMain: {
    width: "50%",
  },

  colNum: {
    width: "25%",
    textAlign: "right",
  },

  emptyRow: {
    fontSize: 8,
    color: "#9ca3af",
    padding: 8,
    textAlign: "center",
  },

  /* -------------------------------------------------
     FOOTER
  ------------------------------------------------- */

  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerText: {
    fontSize: 6.5,
    color: "#9ca3af",
  },
});

const money = (n: number) => `AED ${n.toFixed(2)}`;

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

  const generatedAt = formatDateInSalonTz(new Date());

  return (
    <Document
      title={`${BUSINESS_INFO.name} - Business Report`}
      author={BUSINESS_INFO.name}
      subject="Business performance report"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View style={styles.header}>
          <Text style={styles.businessName}>{BUSINESS_INFO.name}</Text>

          <Text style={styles.reportTitle}>Business Performance Report</Text>

          <Text style={styles.subtitle}>
            Reporting period: {from} — {to}
          </Text>
        </View>

        {/* =====================================================
            KPI OVERVIEW
        ===================================================== */}

        <View style={styles.kpiGrid}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Revenue Collected</Text>
            <Text style={styles.kpiValue}>{money(summary.totalRevenue)}</Text>
            <Text style={styles.kpiDescription}>
              Payments actually received
            </Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Total Invoiced</Text>
            <Text style={styles.kpiValue}>{money(summary.invoicedTotal)}</Text>
            <Text style={styles.kpiDescription}>Value of invoices issued</Text>
          </View>

          <View style={[styles.kpiBox, styles.kpiBoxLast]}>
            <Text style={styles.kpiLabel}>Outstanding</Text>
            <Text style={styles.kpiValue}>{money(summary.outstanding)}</Text>
            <Text style={styles.kpiDescription}>
              Amount still to be collected
            </Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Invoices</Text>
            <Text style={styles.kpiValue}>{summary.invoiceCount}</Text>
            <Text style={styles.kpiDescription}>Invoices in this period</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Customers Served</Text>
            <Text style={styles.kpiValue}>{summary.customersServed}</Text>
            <Text style={styles.kpiDescription}>Unique customers</Text>
          </View>

          <View style={[styles.kpiBox, styles.kpiBoxLast]}>
            <Text style={styles.kpiLabel}>Customers Served</Text>
            <Text style={styles.kpiValue}>{summary.customersServed}</Text>
            <Text style={styles.kpiDescription}>Customers served</Text>
          </View>
        </View>

        {/* =====================================================
            FINANCIAL OVERVIEW
        ===================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          <View style={styles.financialBox}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total invoiced</Text>

              <Text style={styles.financialValue}>
                {money(summary.invoicedTotal)}
              </Text>
            </View>

            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Revenue collected</Text>

              <Text style={styles.financialValue}>
                {money(summary.totalRevenue)}
              </Text>
            </View>

            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Outstanding balance</Text>

              <Text style={styles.financialValue}>
                {money(summary.outstanding)}
              </Text>
            </View>

            <View style={styles.financialTotalRow}>
              <Text style={styles.financialTotalLabel}>
                Collection position
              </Text>

              <Text style={styles.financialTotalValue}>
                {summary.invoicedTotal > 0
                  ? `${(
                      (summary.totalRevenue / summary.invoicedTotal) *
                      100
                    ).toFixed(1)}% collected`
                  : "0.0% collected"}
              </Text>
            </View>
          </View>
        </View>

        {/* =====================================================
            EMPLOYEE PERFORMANCE
        ===================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Performance</Text>

          <Text style={styles.sectionSubtitle}>
            Services performed and revenue generated by employee
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colMain]}>Employee</Text>

              <Text style={[styles.headerCell, styles.colNum]}>Services</Text>

              <Text style={[styles.headerCell, styles.colNum]}>Revenue</Text>
            </View>

            {employeeStats.length > 0 ? (
              employeeStats.map((employee, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index === methodBreakdown.length - 1
                      ? styles.tableRowLast
                      : {},
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.cellStrong, styles.colMain]}>
                    {employee.name}
                  </Text>

                  <Text style={[styles.cell, styles.colNum]}>
                    {employee.servicesCount}
                  </Text>

                  <Text style={[styles.cellStrong, styles.colNum]}>
                    {money(employee.revenue)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyRow}>
                No employee data in this period.
              </Text>
            )}
          </View>
        </View>

        {/* =====================================================
            SERVICE PERFORMANCE
        ===================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Performance</Text>

          <Text style={styles.sectionSubtitle}>
            Most frequently performed services and generated revenue
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colMain]}>Service</Text>

              <Text style={[styles.headerCell, styles.colNum]}>
                Times Performed
              </Text>

              <Text style={[styles.headerCell, styles.colNum]}>Revenue</Text>
            </View>

            {serviceStats.length > 0 ? (
              serviceStats.map((service, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index === topCustomers.length - 1
                      ? styles.tableRowLast
                      : {},
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.cellStrong, styles.colMain]}>
                    {service.name}
                  </Text>

                  <Text style={[styles.cell, styles.colNum]}>
                    {service.timesPerformed}
                  </Text>

                  <Text style={[styles.cellStrong, styles.colNum]}>
                    {money(service.revenue)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyRow}>
                No service data in this period.
              </Text>
            )}
          </View>
        </View>

        {/* =====================================================
            TOP CUSTOMERS
        ===================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Customers</Text>

          <Text style={styles.sectionSubtitle}>
            Customers with the highest spending during this period
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colMain]}>Customer</Text>

              <Text style={[styles.headerCell, styles.colNum]}>Invoices</Text>

              <Text style={[styles.headerCell, styles.colNum]}>Spend</Text>
            </View>

            {topCustomers.length > 0 ? (
              topCustomers.map((customer, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index === serviceStats.length - 1
                      ? styles.tableRowLast
                      : {},
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.cellStrong, styles.colMain]}>
                    {customer.name}
                  </Text>

                  <Text style={[styles.cell, styles.colNum]}>
                    {customer.invoiceCount}
                  </Text>

                  <Text style={[styles.cellStrong, styles.colNum]}>
                    {money(customer.spend)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyRow}>
                No customer data in this period.
              </Text>
            )}
          </View>
        </View>

        {/* =====================================================
            PAYMENT METHODS
        ===================================================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments by Method</Text>

          <Text style={styles.sectionSubtitle}>
            Revenue collected through each payment method
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colMain]}>
                Payment Method
              </Text>

              <Text style={[styles.headerCell, styles.colNum]}>Amount</Text>
            </View>

            {methodBreakdown.length > 0 ? (
              methodBreakdown.map((method, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index === employeeStats.length - 1
                      ? styles.tableRowLast
                      : {},
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.cellStrong, styles.colMain]}>
                    {method.method}
                  </Text>

                  <Text style={[styles.cellStrong, styles.colNum]}>
                    {money(method.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyRow}>No payments in this period.</Text>
            )}
          </View>
        </View>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {BUSINESS_INFO.name} · Business Report
          </Text>

          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />

          <Text style={styles.footerText}>Generated {generatedAt}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReportPdfDocument;
