import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import path from "path";
import { BUSINESS_INFO } from "@/lib/settings";

import fs from "fs";

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

const logoBuffer = fs.readFileSync(LOGO_PATH);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },

  // ─────────────────────────────────────────────
  // Header
  // ─────────────────────────────────────────────

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },

  businessBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "60%",
  },

  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
    objectFit: "contain",
  },

  businessTextBlock: {
    flexShrink: 1,
  },

  businessName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 5,
  },

  businessInfo: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },

  invoiceBlock: {
    width: "35%",
    alignItems: "flex-end",
  },

  invoiceTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 5,
  },

  invoiceNumber: {
    fontSize: 10,
    color: "#4b5563",
    marginBottom: 3,
  },

  invoiceDate: {
    fontSize: 9,
    color: "#6b7280",
  },

  // ─────────────────────────────────────────────
  // Status
  // ─────────────────────────────────────────────

  statusBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "#f3f4f6",
  },

  statusText: {
    fontSize: 8,
    fontWeight: 700,
    color: "#374151",
  },

  // ─────────────────────────────────────────────
  // Divider
  // ─────────────────────────────────────────────

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginBottom: 20,
  },

  // ─────────────────────────────────────────────
  // Customer
  // ─────────────────────────────────────────────

  customerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  customerBlock: {
    width: "55%",
  },

  invoiceInfoBlock: {
    width: "35%",
    alignItems: "flex-end",
  },

  sectionLabel: {
    fontSize: 8,
    color: "#9ca3af",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: 5,
  },

  customerName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 3,
  },

  muted: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },

  // ─────────────────────────────────────────────
  // Table
  // ─────────────────────────────────────────────

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 9,
    paddingHorizontal: 6,
  },

  headerCell: {
    fontSize: 8,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
  },

  serviceCell: {
    width: "55%",
  },

  qtyCell: {
    width: "10%",
    textAlign: "center",
  },

  priceCell: {
    width: "17.5%",
    textAlign: "right",
  },

  amountCell: {
    width: "17.5%",
    textAlign: "right",
  },

  serviceText: {
    fontSize: 9.5,
    color: "#1f2937",
  },

  numberText: {
    fontSize: 9.5,
    color: "#374151",
  },

  amountText: {
    fontSize: 9.5,
    fontWeight: 700,
    color: "#111827",
  },

  // ─────────────────────────────────────────────
  // Totals
  // ─────────────────────────────────────────────

  totalsWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
  },

  totalsBox: {
    width: 230,
  },

  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  totalsLabel: {
    fontSize: 9,
    color: "#6b7280",
  },

  totalsValue: {
    fontSize: 9,
    color: "#374151",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 8,
    marginTop: 5,
    marginBottom: 5,
  },

  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
  },

  totalValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
  },

  paidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    marginTop: 7,
  },

  balanceLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#374151",
  },

  balanceValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111827",
  },

  // ─────────────────────────────────────────────
  // Notes
  // ─────────────────────────────────────────────

  notesSection: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  notesText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#4b5563",
  },

  // ─────────────────────────────────────────────
  // Footer
  // ─────────────────────────────────────────────

  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },

  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginBottom: 8,
  },
});

const money = (value: number | string) =>
  `AED ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatStatus = (status: string) => {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

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
    }[];

    payments?: {
      amount: number | string;
      amountTendered?: number | string | null;
      changeGiven?: number | string | null;
      method?: string;
    }[];

    dueCollections?: {
      sourceInvoiceNumber: string;
      amount: number | string;
    }[];
  };
}

const InvoicePdfDocument = ({ invoice }: InvoicePdfProps) => {
  const num = (value: number | string | null | undefined) => Number(value ?? 0);

  const payments = invoice.payments ?? [];

  // "Paid" — what actually applied to THIS invoice's balance.
  const amountPaid = payments.reduce((sum, p) => sum + num(p.amount), 0);

  // "Amount Received" — what the customer actually handed over across all
  // payments (can exceed amountPaid if change was given on any of them).
  const amountReceived = payments.reduce(
    (sum, p) =>
      sum + (p.amountTendered != null ? num(p.amountTendered) : num(p.amount)),
    0,
  );

  const changeGivenTotal = payments.reduce(
    (sum, p) => sum + num(p.changeGiven),
    0,
  );

  const total = num(invoice.total);
  const balanceDue = Math.max(total - amountPaid, 0);

  const hasDiscount = num(invoice.discountTotal) > 0;
  const hasTax = num(invoice.taxTotal) > 0;
  const hasPayment = amountPaid > 0;
  const hasChange = changeGivenTotal > 0;
  const showAmountReceived =
    amountReceived > 0 && amountReceived !== amountPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* =====================================================
            HEADER
        ====================================================== */}

        <View style={styles.header}>
          <View style={styles.businessBlock}>
            <Image style={styles.logo} src={logoBuffer} />

            <View style={styles.businessTextBlock}>
              <Text style={styles.businessName}>{BUSINESS_INFO.name}</Text>
              <Text style={styles.businessInfo}>{BUSINESS_INFO.address}</Text>
              <Text style={styles.businessInfo}>{BUSINESS_INFO.phone}</Text>
              <Text style={styles.businessInfo}>{BUSINESS_INFO.email}</Text>
            </View>
          </View>

          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              {new Date(invoice.createdAt).toLocaleDateString("en-LK")}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {formatStatus(invoice.status)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* =====================================================
            CUSTOMER
        ====================================================== */}

        <View style={styles.customerSection}>
          <View style={styles.customerBlock}>
            <Text style={styles.sectionLabel}>Bill To</Text>

            <Text style={styles.customerName}>{invoice.customer.name}</Text>

            <Text style={styles.muted}>{invoice.customer.phone}</Text>

            {invoice.customer.email && (
              <Text style={styles.muted}>{invoice.customer.email}</Text>
            )}

            {invoice.customer.address && (
              <Text style={styles.muted}>{invoice.customer.address}</Text>
            )}
          </View>

          <View style={styles.invoiceInfoBlock}>
            <Text style={styles.sectionLabel}>Invoice Date</Text>

            <Text style={styles.muted}>
              {new Date(invoice.createdAt).toLocaleDateString("en-LK")}
            </Text>
          </View>
        </View>

        {/* =====================================================
            ITEMS TABLE
        ====================================================== */}

        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.serviceCell]}>Service</Text>

          <Text style={[styles.headerCell, styles.qtyCell]}>Qty</Text>

          <Text style={[styles.headerCell, styles.priceCell]}>Unit Price</Text>

          <Text style={[styles.headerCell, styles.amountCell]}>Amount</Text>
        </View>

        {invoice.items.map((item, index) => (
          <View
            key={`${item.serviceNameSnapshot}-${index}`}
            style={styles.tableRow}
          >
            <Text style={[styles.serviceText, styles.serviceCell]}>
              {item.serviceNameSnapshot}
            </Text>

            <Text style={[styles.numberText, styles.qtyCell]}>
              {item.quantity}
            </Text>

            <Text style={[styles.numberText, styles.priceCell]}>
              {money(item.unitPrice)}
            </Text>

            <Text style={[styles.amountText, styles.amountCell]}>
              {money(item.subtotal)}
            </Text>
          </View>
        ))}

        {/* =====================================================
            TOTALS
        ====================================================== */}

        <View style={styles.totalsWrapper}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>

              <Text style={styles.totalsValue}>{money(invoice.subtotal)}</Text>
            </View>

            {hasDiscount && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Discount</Text>

                <Text style={styles.totalsValue}>
                  - {money(invoice.discountTotal)}
                </Text>
              </View>
            )}

            {hasTax && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax</Text>

                <Text style={styles.totalsValue}>
                  + {money(invoice.taxTotal)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>

              <Text style={styles.totalValue}>{money(invoice.total)}</Text>
            </View>

            {hasPayment && (
              <>
                {showAmountReceived && (
                  <View style={styles.paidRow}>
                    <Text style={styles.totalsLabel}>Amount Received</Text>
                    <Text style={styles.totalsValue}>
                      {money(amountReceived)}
                    </Text>
                  </View>
                )}

                <View style={styles.paidRow}>
                  <Text style={styles.totalsLabel}>Paid</Text>
                  <Text style={styles.totalsValue}>{money(amountPaid)}</Text>
                </View>

                {hasChange && (
                  <View style={styles.paidRow}>
                    <Text style={styles.totalsLabel}>Change Given</Text>
                    <Text style={styles.totalsValue}>
                      {money(changeGivenTotal)}
                    </Text>
                  </View>
                )}
              </>
            )}

            {balanceDue > 0 && (
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance Due</Text>
                <Text style={styles.balanceValue}>{money(balanceDue)}</Text>
              </View>
            )}
          </View>
        </View>

        {invoice.dueCollections && invoice.dueCollections.length > 0 && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Previous Balances Settled</Text>
            {invoice.dueCollections.map((c, i) => (
              <Text key={i} style={styles.notesText}>
                {money(c.amount)} — {c.sourceInvoiceNumber}
              </Text>
            ))}
          </View>
        )}

        {/* =====================================================
            NOTES
        ====================================================== */}

        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Notes</Text>

            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <View style={styles.footer}>
          <View style={styles.footerDivider} />

          <Text>Thank you for visiting {BUSINESS_INFO.name}!</Text>

          <Text style={{ marginTop: 3 }}>We appreciate your business.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePdfDocument;
