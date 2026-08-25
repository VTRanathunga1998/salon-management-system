import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ServiceReportData } from "./serviceReport";

type Props = {
  report: ServiceReportData;
  from: string;
  to: string;
  serviceId?: string;
  serviceName?: string;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1e293b" },

  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#64748b", marginBottom: 16 },

  summaryRow: { flexDirection: "row", marginBottom: 16 },
  summaryBox: {
    flex: 1,
    padding: 8,
    marginRight: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 7,
    color: "#94a3b8",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  summaryValue: { fontSize: 12, fontWeight: 700 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 4,
    marginBottom: 6,
  },

  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 5,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
  },
  th: {
    fontSize: 7.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    fontWeight: 700,
  },
  td: { fontSize: 8.5, color: "#334155" },

  colDate: { width: "12%" },
  colInvoice: { width: "14%" },
  colCustomer: { width: "20%" },
  colStaff: { width: "22%" },
  colQty: { width: "8%", textAlign: "right" },
  colUnit: { width: "12%", textAlign: "right" },
  colRevenue: { width: "12%", textAlign: "right" },

  colService: { width: "46%" },
  colBookings: { width: "18%", textAlign: "right" },
  colTotalQty: { width: "18%", textAlign: "right" },
  colTotalRevenue: { width: "18%", textAlign: "right" },

  emptyState: { marginTop: 8, color: "#94a3b8" },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
  },
});

const money = (v: number) =>
  `AED ${v.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-AE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const ServiceReportPdfDocument = ({
  report,
  from,
  to,
  serviceId,
  serviceName,
}: Props) => {
  const selected = serviceId
    ? report.services.find((s) => s.id === serviceId)
    : undefined;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Service Report</Text>
        <Text style={styles.subtitle}>
          {from} to {to}
          {selected
            ? ` · ${selected.name}`
            : serviceName
              ? ` · ${serviceName}`
              : ""}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Service Types</Text>
            <Text style={styles.summaryValue}>
              {report.summary.totalServiceTypes}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Bookings</Text>
            <Text style={styles.summaryValue}>
              {report.summary.totalBookings}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Qty Sold</Text>
            <Text style={styles.summaryValue}>
              {report.summary.totalQuantity}
            </Text>
          </View>
          <View style={[styles.summaryBox, { marginRight: 0 }]}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>
              {money(report.summary.totalRevenue)}
            </Text>
          </View>
        </View>

        {selected ? (
          <SingleServiceSection service={selected} />
        ) : serviceId && !selected ? (
          <Text style={styles.emptyState}>
            No revenue recorded for {serviceName ?? "this service"} in the
            selected range.
          </Text>
        ) : (
          <AggregateSection services={report.services} />
        )}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

const AggregateSection = ({
  services,
}: {
  services: ServiceReportData["services"];
}) => (
  <View>
    <Text style={styles.sectionTitle}>Revenue by Service</Text>

    <View style={styles.tableHeaderRow}>
      <Text style={[styles.th, styles.colService]}>Service</Text>
      <Text style={[styles.th, styles.colBookings]}>Bookings</Text>
      <Text style={[styles.th, styles.colTotalQty]}>Qty</Text>
      <Text style={[styles.th, styles.colTotalRevenue]}>Revenue</Text>
    </View>

    {services.map((s) => (
      <View key={s.id} style={styles.tableRow} wrap={false}>
        <Text style={[styles.td, styles.colService]}>{s.name}</Text>
        <Text style={[styles.td, styles.colBookings]}>{s.timesPerformed}</Text>
        <Text style={[styles.td, styles.colTotalQty]}>{s.totalQuantity}</Text>
        <Text style={[styles.td, styles.colTotalRevenue]}>
          {money(s.totalRevenue)}
        </Text>
      </View>
    ))}

    {services.length === 0 && (
      <Text style={styles.emptyState}>
        No service activity found for the selected filters.
      </Text>
    )}
  </View>
);

const SingleServiceSection = ({
  service,
}: {
  service: ServiceReportData["services"][number];
}) => (
  <View>
    <Text style={styles.sectionTitle}>Booking History</Text>

    <View style={styles.tableHeaderRow}>
      <Text style={[styles.th, styles.colDate]}>Date</Text>
      <Text style={[styles.th, styles.colInvoice]}>Invoice</Text>
      <Text style={[styles.th, styles.colCustomer]}>Customer</Text>
      <Text style={[styles.th, styles.colStaff]}>Staff</Text>
      <Text style={[styles.th, styles.colQty]}>Qty</Text>
      <Text style={[styles.th, styles.colUnit]}>Unit</Text>
      <Text style={[styles.th, styles.colRevenue]}>Revenue</Text>
    </View>

    {service.entries.map((entry, idx) => (
      <View
        key={`${entry.invoiceId}-${idx}`}
        style={styles.tableRow}
        wrap={false}
      >
        <Text style={[styles.td, styles.colDate]}>
          {formatDate(entry.date)}
        </Text>
        <Text style={[styles.td, styles.colInvoice]}>
          {entry.invoiceNumber}
        </Text>
        <Text style={[styles.td, styles.colCustomer]}>
          {entry.customerName}
        </Text>
        <Text style={[styles.td, styles.colStaff]}>
          {entry.employees.length > 0 ? entry.employees.join(", ") : "—"}
        </Text>
        <Text style={[styles.td, styles.colQty]}>{entry.quantity}</Text>
        <Text style={[styles.td, styles.colUnit]}>
          {money(entry.unitPrice)}
        </Text>
        <Text style={[styles.td, styles.colRevenue]}>
          {money(entry.subtotal)}
        </Text>
      </View>
    ))}

    {service.entries.length === 0 && (
      <Text style={styles.emptyState}>
        No bookings recorded in the selected range.
      </Text>
    )}
  </View>
);

export default ServiceReportPdfDocument;
