// import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
// import { BUSINESS_INFO } from "@/lib/settings";

// const styles = StyleSheet.create({
//   page: {
//     padding: 36,
//     fontSize: 10,
//     fontFamily: "Helvetica",
//     color: "#1f2937",
//   },
//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//   },
//   businessName: { fontSize: 14, fontWeight: 700 },
//   muted: { color: "#6b7280", fontSize: 9, marginTop: 2 },
//   invoiceTitle: { fontSize: 18, fontWeight: 700, textAlign: "right" },
//   section: { marginBottom: 16 },
//   label: {
//     fontSize: 8,
//     color: "#9ca3af",
//     textTransform: "uppercase",
//     marginBottom: 3,
//   },
//   tableHeader: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e7eb",
//     paddingBottom: 6,
//     marginBottom: 4,
//   },
//   tableRow: {
//     flexDirection: "row",
//     borderBottomWidth: 0.5,
//     borderBottomColor: "#f3f4f6",
//     paddingVertical: 6,
//   },
//   colService: { width: "34%" },
//   colStaff: { width: "24%" },
//   colQty: { width: "10%", textAlign: "center" },
//   colPrice: { width: "16%", textAlign: "right" },
//   colAmount: { width: "16%", textAlign: "right", fontWeight: 700 },
//   headerCell: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase" },
//   totalsBox: { alignSelf: "flex-end", width: 220, marginTop: 12 },
//   totalsRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 3,
//   },
//   totalsFinal: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     borderTopWidth: 1,
//     borderTopColor: "#e5e7eb",
//     paddingTop: 6,
//     marginTop: 4,
//     fontWeight: 700,
//   },
//   footer: { textAlign: "center", color: "#9ca3af", fontSize: 8, marginTop: 30 },
// });

// const money = (n: number) => `AED${n.toFixed(2)}`;

// interface InvoicePdfProps {
//   invoice: {
//     invoiceNumber: string;
//     status: string;
//     createdAt: Date;
//     subtotal: number | string;
//     discountTotal: number | string;
//     taxTotal: number | string;
//     total: number | string;
//     notes?: string | null;
//     customer: {
//       name: string;
//       phone: string;
//       email?: string | null;
//       address?: string | null;
//     };
//     items: {
//       serviceNameSnapshot: string;
//       quantity: number;
//       unitPrice: number | string;
//       subtotal: number | string;
//       // CHANGED: was `employee: { name: string }` — now an array of
//       // join-table rows, one per assigned staff member.
//       employees: { employee: { name: string } }[];
//     }[];
//     payments?: { amount: number | string }[];
//   };
// }

// const InvoicePdfDocument = ({ invoice }: InvoicePdfProps) => {
//   const num = (v: number | string) => Number(v);
//   const amountPaid = (invoice.payments ?? []).reduce(
//     (s, p) => s + num(p.amount),
//     0,
//   );
//   const balanceDue = num(invoice.total) - amountPaid;

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         <View style={styles.headerRow}>
//           <View>
//             <Text style={styles.businessName}>{BUSINESS_INFO.name}</Text>
//             <Text style={styles.muted}>{BUSINESS_INFO.address}</Text>
//             <Text style={styles.muted}>
//               {BUSINESS_INFO.phone} · {BUSINESS_INFO.email}
//             </Text>
//           </View>
//           <View>
//             <Text style={styles.invoiceTitle}>INVOICE</Text>
//             <Text style={[styles.muted, { textAlign: "right" }]}>
//               {invoice.invoiceNumber}
//             </Text>
//             <Text style={[styles.muted, { textAlign: "right" }]}>
//               {new Date(invoice.createdAt).toLocaleDateString()}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.label}>Bill To</Text>
//           <Text style={{ fontWeight: 700 }}>{invoice.customer.name}</Text>
//           <Text style={styles.muted}>{invoice.customer.phone}</Text>
//           {invoice.customer.email && (
//             <Text style={styles.muted}>{invoice.customer.email}</Text>
//           )}
//           {invoice.customer.address && (
//             <Text style={styles.muted}>{invoice.customer.address}</Text>
//           )}
//         </View>

//         <View style={styles.tableHeader}>
//           <Text style={[styles.headerCell, styles.colService]}>Service</Text>
//           <Text style={[styles.headerCell, styles.colStaff]}>Staff</Text>
//           <Text style={[styles.headerCell, styles.colQty]}>Qty</Text>
//           <Text style={[styles.headerCell, styles.colPrice]}>Unit Price</Text>
//           <Text style={[styles.headerCell, styles.colAmount]}>Amount</Text>
//         </View>

//         {invoice.items.map((item, i) => (
//           <View key={i} style={styles.tableRow}>
//             <Text style={styles.colService}>{item.serviceNameSnapshot}</Text>
//             <Text style={styles.colStaff}>
//               {item.employees.map((e) => e.employee.name).join(", ")}
//             </Text>
//             <Text style={styles.colQty}>{item.quantity}</Text>
//             <Text style={styles.colPrice}>{money(num(item.unitPrice))}</Text>
//             <Text style={styles.colAmount}>{money(num(item.subtotal))}</Text>
//           </View>
//         ))}

//         <View style={styles.totalsBox}>
//           <View style={styles.totalsRow}>
//             <Text>Subtotal</Text>
//             <Text>{money(num(invoice.subtotal))}</Text>
//           </View>
//           <View style={styles.totalsRow}>
//             <Text>Discount</Text>
//             <Text>- {money(num(invoice.discountTotal))}</Text>
//           </View>
//           <View style={styles.totalsRow}>
//             <Text>Tax</Text>
//             <Text>+ {money(num(invoice.taxTotal))}</Text>
//           </View>
//           <View style={styles.totalsFinal}>
//             <Text>Total</Text>
//             <Text>{money(num(invoice.total))}</Text>
//           </View>
//           {amountPaid > 0 && (
//             <>
//               <View style={styles.totalsRow}>
//                 <Text>Paid</Text>
//                 <Text>{money(amountPaid)}</Text>
//               </View>
//               <View style={styles.totalsFinal}>
//                 <Text>Balance Due</Text>
//                 <Text>{money(Math.max(balanceDue, 0))}</Text>
//               </View>
//             </>
//           )}
//         </View>

//         {invoice.notes && (
//           <View style={{ marginTop: 20 }}>
//             <Text style={styles.label}>Notes</Text>
//             <Text>{invoice.notes}</Text>
//           </View>
//         )}

//         <Text style={styles.footer}>
//           Thank you for visiting {BUSINESS_INFO.name}!
//         </Text>
//       </Page>
//     </Document>
//   );
// };

// export default InvoicePdfDocument;

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS_INFO } from "@/lib/settings";

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
    width: "60%",
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
    }[];
  };
}

const InvoicePdfDocument = ({ invoice }: InvoicePdfProps) => {
  const num = (value: number | string) => Number(value);

  const amountPaid = (invoice.payments ?? []).reduce(
    (sum, payment) => sum + num(payment.amount),
    0,
  );

  const total = num(invoice.total);

  const balanceDue = Math.max(total - amountPaid, 0);

  const hasDiscount = num(invoice.discountTotal) > 0;
  const hasTax = num(invoice.taxTotal) > 0;
  const hasPayment = amountPaid > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* =====================================================
            HEADER
        ====================================================== */}

        <View style={styles.header}>
          <View style={styles.businessBlock}>
            <Text style={styles.businessName}>{BUSINESS_INFO.name}</Text>

            <Text style={styles.businessInfo}>{BUSINESS_INFO.address}</Text>

            <Text style={styles.businessInfo}>{BUSINESS_INFO.phone}</Text>

            <Text style={styles.businessInfo}>{BUSINESS_INFO.email}</Text>
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
                <View style={styles.paidRow}>
                  <Text style={styles.totalsLabel}>Paid</Text>

                  <Text style={styles.totalsValue}>{money(amountPaid)}</Text>
                </View>

                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>Balance Due</Text>

                  <Text style={styles.balanceValue}>{money(balanceDue)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

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
