import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/settings";
import type { CustomerReportData } from "@/lib/reports/customer/customerReport";

const money = (n: number) =>
  `AED ${n.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).format(new Date(date));
};

const styles = StyleSheet.create({
  // =========================================================
  // PAGE
  // =========================================================

  page: {
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },

  // =========================================================
  // HEADER
  // =========================================================

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

  reportHeaderRight: {
    alignItems: "flex-end",
  },

  reportLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },

  reportTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111827",
  },

  // =========================================================
  // PERIOD
  // =========================================================

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

  // =========================================================
  // SECTION
  // =========================================================

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

  // =========================================================
  // KPI
  // =========================================================

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
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
    marginTop: 4,
  },

  kpiHint: {
    fontSize: 6.5,
    color: "#9ca3af",
    marginTop: 2,
  },

  // =========================================================
  // TABLE
  // =========================================================

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

  // =========================================================
  // CUSTOMER TABLE COLUMNS
  // =========================================================

  customerName: {
    width: "25%",
  },

  customerPhone: {
    width: "15%",
  },

  customerInvoices: {
    width: "10%",
    textAlign: "center",
  },

  customerBilled: {
    width: "17%",
    textAlign: "right",
  },

  customerPaid: {
    width: "16%",
    textAlign: "right",
  },

  customerOutstanding: {
    width: "17%",
    textAlign: "right",
  },

  // =========================================================
  // INVOICE TABLE COLUMNS
  // =========================================================

  invoiceCustomer: {
    width: "21%",
  },

  invoiceNumber: {
    width: "14%",
  },

  invoiceDate: {
    width: "13%",
  },

  invoiceStatus: {
    width: "13%",
  },

  invoiceTotal: {
    width: "13%",
    textAlign: "right",
  },

  invoicePaid: {
    width: "13%",
    textAlign: "right",
  },

  invoiceBalance: {
    width: "13%",
    textAlign: "right",
  },

  // =========================================================
  // EMPTY STATE
  // =========================================================

  empty: {
    padding: 12,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },

  // =========================================================
  // FOOTER
  // =========================================================

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

export default function CustomerReportPdfDocument({
  report,
  from,
  to,
  search,
}: {
  report: CustomerReportData;
  from?: string;
  to?: string;
  search?: string;
}) {
  const { summary, customers } = report;

  const rangeLabel =
    from && to
      ? `${from} — ${to}`
      : from
        ? `From ${from}`
        : to
          ? `Until ${to}`
          : "All time";

  const invoices = customers.flatMap((customer) =>
    customer.invoices.map((invoice) => ({
      ...invoice,
      customerName: customer.name,
    })),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{BUSINESS_INFO.name}</Text>

            <Text style={styles.businessInfo}>{BUSINESS_INFO.address}</Text>

            <Text style={styles.businessInfo}>
              {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
            </Text>
          </View>

          <View style={styles.reportHeaderRight}>
            <Text style={styles.reportLabel}>Customer Analytics</Text>

            <Text style={styles.reportTitle}>Customer Report</Text>
          </View>
        </View>

        {/* =================================================
            PERIOD
        ================================================= */}

        <View style={styles.periodBox}>
          <View>
            <Text style={styles.periodLabel}>Reporting Period</Text>

            <Text style={styles.periodValue}>{rangeLabel}</Text>
          </View>

          {search && (
            <View>
              <Text style={[styles.periodLabel, { textAlign: "right" }]}>
                Search
              </Text>

              <Text style={[styles.periodValue, { textAlign: "right" }]}>
                "{search}"
              </Text>
            </View>
          )}
        </View>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Overview</Text>

          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Customers</Text>

              <Text style={styles.kpiValue}>{summary.totalCustomers}</Text>

              <Text style={styles.kpiHint}>Customers in report</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Invoices</Text>

              <Text style={styles.kpiValue}>{summary.totalInvoices}</Text>

              <Text style={styles.kpiHint}>Invoices recorded</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Total Billed</Text>

              <Text style={styles.kpiValue}>{money(summary.totalBilled)}</Text>

              <Text style={styles.kpiHint}>Total invoice value</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Total Paid</Text>

              <Text style={styles.kpiValue}>{money(summary.totalPaid)}</Text>

              <Text style={styles.kpiHint}>Payments received</Text>
            </View>

            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>Outstanding</Text>

              <Text style={styles.kpiValue}>
                {money(summary.totalOutstanding)}
              </Text>

              <Text style={styles.kpiHint}>Remaining balance</Text>
            </View>
          </View>
        </View>

        {/* =================================================
            CUSTOMER PERFORMANCE
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Summary</Text>

          <Text style={styles.sectionSubtitle}>
            Billing and payment summary by customer
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.customerName]}>
                Customer
              </Text>

              <Text style={[styles.headerCell, styles.customerPhone]}>
                Phone
              </Text>

              <Text style={[styles.headerCell, styles.customerInvoices]}>
                Invoices
              </Text>

              <Text style={[styles.headerCell, styles.customerBilled]}>
                Billed
              </Text>

              <Text style={[styles.headerCell, styles.customerPaid]}>Paid</Text>

              <Text style={[styles.headerCell, styles.customerOutstanding]}>
                Outstanding
              </Text>
            </View>

            {customers.length > 0 ? (
              customers.map((customer, index) => (
                <View
                  key={customer.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.cellStrong, styles.customerName]}>
                    {customer.name}
                  </Text>

                  <Text style={[styles.cell, styles.customerPhone]}>
                    {customer.phone}
                  </Text>

                  <Text style={[styles.cell, styles.customerInvoices]}>
                    {customer.invoiceCount}
                  </Text>

                  <Text style={[styles.cell, styles.customerBilled]}>
                    {money(customer.totalBilled)}
                  </Text>

                  <Text style={[styles.cell, styles.customerPaid]}>
                    {money(customer.totalPaid)}
                  </Text>

                  <Text style={[styles.cellStrong, styles.customerOutstanding]}>
                    {money(customer.outstanding)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>
                No customers found in this period.
              </Text>
            )}
          </View>
        </View>

        {/* =================================================
            INVOICE DETAIL
        ================================================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Activity</Text>

          <Text style={styles.sectionSubtitle}>
            Detailed invoice and payment activity
          </Text>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.invoiceCustomer]}>
                Customer
              </Text>

              <Text style={[styles.headerCell, styles.invoiceNumber]}>
                Invoice #
              </Text>

              <Text style={[styles.headerCell, styles.invoiceDate]}>Date</Text>

              <Text style={[styles.headerCell, styles.invoiceStatus]}>
                Status
              </Text>

              <Text style={[styles.headerCell, styles.invoiceTotal]}>
                Total
              </Text>

              <Text style={[styles.headerCell, styles.invoicePaid]}>Paid</Text>

              <Text style={[styles.headerCell, styles.invoiceBalance]}>
                Balance
              </Text>
            </View>

            {invoices.length > 0 ? (
              invoices.map((invoice, index) => (
                <View
                  key={invoice.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text style={[styles.cellStrong, styles.invoiceCustomer]}>
                    {invoice.customerName}
                  </Text>

                  <Text style={[styles.cell, styles.invoiceNumber]}>
                    {invoice.invoiceNumber}
                  </Text>

                  <Text style={[styles.cell, styles.invoiceDate]}>
                    {formatDate(invoice.date)}
                  </Text>

                  <Text style={[styles.cell, styles.invoiceStatus]}>
                    {invoice.status}
                  </Text>

                  <Text style={[styles.cell, styles.invoiceTotal]}>
                    {money(invoice.total)}
                  </Text>

                  <Text style={[styles.cell, styles.invoicePaid]}>
                    {money(invoice.paid)}
                  </Text>

                  <Text style={[styles.cellStrong, styles.invoiceBalance]}>
                    {money(invoice.balance)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>
                No invoices recorded in this period.
              </Text>
            )}
          </View>
        </View>

        {/* =================================================
            FOOTER
        ================================================= */}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {BUSINESS_INFO.name} · Customer Report
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
}
