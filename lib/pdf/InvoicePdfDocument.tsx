import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/constants/business";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  businessName: { fontSize: 14, fontWeight: 700 },
  muted: { color: "#6b7280", fontSize: 9, marginTop: 2 },
  invoiceTitle: { fontSize: 18, fontWeight: 700, textAlign: "right" },
  section: { marginBottom: 16 },
  label: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 6,
  },
  colService: { width: "34%" },
  colStaff: { width: "24%" },
  colQty: { width: "10%", textAlign: "center" },
  colPrice: { width: "16%", textAlign: "right" },
  colAmount: { width: "16%", textAlign: "right", fontWeight: 700 },
  headerCell: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase" },
  totalsBox: { alignSelf: "flex-end", width: 220, marginTop: 12 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  totalsFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 6,
    marginTop: 4,
    fontWeight: 700,
  },
  footer: { textAlign: "center", color: "#9ca3af", fontSize: 8, marginTop: 30 },
});

const money = (n: number) => `Rs. ${n.toFixed(2)}`;

interface InvoicePdfProps {
  invoice: {
    invoiceNumber: string;
    status: string;
    createdAt: Date;
    subtotal: number | string;
    discountTotal: number | string;
    taxTotal: number | string;
    total: number | string;
    notes?: string | null;
    customer: {
      name: string;
      phone: string;
      email?: string | null;
      address?: string | null;
    };
    items: {
      serviceNameSnapshot: string;
      quantity: number;
      unitPrice: number | string;
      subtotal: number | string;
      employee: { name: string };
    }[];
    payments?: { amount: number | string }[];
  };
}

const InvoicePdfDocument = ({ invoice }: InvoicePdfProps) => {
  const num = (v: number | string) => Number(v);
  const amountPaid = (invoice.payments ?? []).reduce(
    (s, p) => s + num(p.amount),
    0,
  );
  const balanceDue = num(invoice.total) - amountPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.businessName}>{BUSINESS_INFO.name}</Text>
            <Text style={styles.muted}>{BUSINESS_INFO.address}</Text>
            <Text style={styles.muted}>
              {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={[styles.muted, { textAlign: "right" }]}>
              {invoice.invoiceNumber}
            </Text>
            <Text style={[styles.muted, { textAlign: "right" }]}>
              {new Date(invoice.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bill To</Text>
          <Text style={{ fontWeight: 700 }}>{invoice.customer.name}</Text>
          <Text style={styles.muted}>{invoice.customer.phone}</Text>
          {invoice.customer.email && (
            <Text style={styles.muted}>{invoice.customer.email}</Text>
          )}
          {invoice.customer.address && (
            <Text style={styles.muted}>{invoice.customer.address}</Text>
          )}
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.colService]}>Service</Text>
          <Text style={[styles.headerCell, styles.colStaff]}>Staff</Text>
          <Text style={[styles.headerCell, styles.colQty]}>Qty</Text>
          <Text style={[styles.headerCell, styles.colPrice]}>Unit Price</Text>
          <Text style={[styles.headerCell, styles.colAmount]}>Amount</Text>
        </View>

        {invoice.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colService}>{item.serviceNameSnapshot}</Text>
            <Text style={styles.colStaff}>{item.employee.name}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{money(num(item.unitPrice))}</Text>
            <Text style={styles.colAmount}>{money(num(item.subtotal))}</Text>
          </View>
        ))}

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{money(num(invoice.subtotal))}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Discount</Text>
            <Text>- {money(num(invoice.discountTotal))}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Tax</Text>
            <Text>+ {money(num(invoice.taxTotal))}</Text>
          </View>
          <View style={styles.totalsFinal}>
            <Text>Total</Text>
            <Text>{money(num(invoice.total))}</Text>
          </View>
          {amountPaid > 0 && (
            <>
              <View style={styles.totalsRow}>
                <Text>Paid</Text>
                <Text>{money(amountPaid)}</Text>
              </View>
              <View style={styles.totalsFinal}>
                <Text>Balance Due</Text>
                <Text>{money(Math.max(balanceDue, 0))}</Text>
              </View>
            </>
          )}
        </View>

        {invoice.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.label}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          Thank you for visiting {BUSINESS_INFO.name}!
        </Text>
      </Page>
    </Document>
  );
};

export default InvoicePdfDocument;
