import { BUSINESS_INFO } from "@/lib/settings";

interface InvoiceEmailTemplateProps {
  customerName: string;
  invoiceNumber: string;
  total: number;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function invoiceEmailTemplate({
  customerName,
  invoiceNumber,
  total,
}: InvoiceEmailTemplateProps): string {
  const safeCustomerName = escapeHtml(customerName);
  const safeInvoiceNumber = escapeHtml(invoiceNumber);
  const formattedTotal = total.toFixed(2);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Invoice ${safeInvoiceNumber}</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f5f7fb;
    font-family:Arial,Helvetica,sans-serif;
    color:#1f2937;
  "
>
  <div
    style="
      width:100%;
      padding:40px 16px;
      box-sizing:border-box;
    "
  >

    <div
      style="
        max-width:600px;
        margin:0 auto;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
        border:1px solid #e5e7eb;
      "
    >

      <!-- Accent -->
      <div
        style="
          height:5px;
          background:linear-gradient(
            90deg,
            #93c5fd,
            #c3ebfa,
            #cfceff
          );
        "
      ></div>

      <!-- Header -->
      <div
        style="
          padding:32px 32px 24px 32px;
        "
      >

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
        >
          <tr>

            <td
              valign="top"
              style="padding-right:20px;"
            >

              <div
                style="
                  font-size:20px;
                  font-weight:700;
                  color:#1f2937;
                "
              >
                ${escapeHtml(BUSINESS_INFO.name)}
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:13px;
                  line-height:20px;
                  color:#6b7280;
                "
              >
                ${escapeHtml(BUSINESS_INFO.address)}
              </div>

              <div
                style="
                  margin-top:2px;
                  font-size:13px;
                  color:#6b7280;
                "
              >
                ${escapeHtml(BUSINESS_INFO.phone)}
              </div>

            </td>

            <td
              valign="top"
              align="right"
            >

              <div
                style="
                  font-size:12px;
                  font-weight:700;
                  color:#9ca3af;
                  letter-spacing:1px;
                "
              >
                INVOICE
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:14px;
                  font-weight:600;
                  color:#374151;
                "
              >
                ${safeInvoiceNumber}
              </div>

            </td>

          </tr>
        </table>

      </div>

      <!-- Divider -->
      <div
        style="
          height:1px;
          background:#f1f5f9;
          margin:0 32px;
        "
      ></div>

      <!-- Greeting -->
      <div
        style="
          padding:28px 32px 10px 32px;
        "
      >

        <div
          style="
            font-size:16px;
            font-weight:600;
            color:#111827;
          "
        >
          Hi ${safeCustomerName},
        </div>

        <p
          style="
            margin:10px 0 0 0;
            font-size:14px;
            line-height:22px;
            color:#6b7280;
          "
        >
          Thank you for visiting
          ${escapeHtml(BUSINESS_INFO.name)}.
          Your invoice is attached to this email.
        </p>

      </div>

      <!-- Invoice Summary -->
      <div
        style="
          padding:20px 32px;
        "
      >

        <div
          style="
            background:#f8fafc;
            border:1px solid #e5e7eb;
            border-radius:12px;
            padding:20px;
          "
        >

          <div
            style="
              font-size:11px;
              font-weight:700;
              text-transform:uppercase;
              letter-spacing:.8px;
              color:#9ca3af;
            "
          >
            Invoice Summary
          </div>

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="margin-top:14px;"
          >

            <tr>

              <td
                style="
                  padding-bottom:10px;
                  color:#6b7280;
                  font-size:14px;
                "
              >
                Invoice Number
              </td>

              <td
                align="right"
                style="
                  padding-bottom:10px;
                  font-size:14px;
                  font-weight:600;
                  color:#374151;
                "
              >
                ${safeInvoiceNumber}
              </td>

            </tr>

            <tr>

              <td
                style="
                  color:#6b7280;
                  font-size:14px;
                "
              >
                Total Amount
              </td>

              <td
                align="right"
                style="
                  font-size:20px;
                  font-weight:700;
                  color:#111827;
                "
              >
                AED ${formattedTotal}
              </td>

            </tr>

          </table>

        </div>

      </div>

      <!-- Attachment Notice -->
      <div
        style="
          padding:4px 32px 28px 32px;
        "
      >

        <div
          style="
            background:#f0fdf4;
            border:1px solid #dcfce7;
            border-radius:10px;
            padding:14px 16px;
            font-size:13px;
            line-height:20px;
            color:#166534;
          "
        >
          Your invoice PDF is attached to this email
          for your records.
        </div>

      </div>

      <!-- Footer -->
      <div
        style="
          background:#f8fafc;
          border-top:1px solid #eef2f7;
          padding:24px 32px;
          text-align:center;
        "
      >

        <div
          style="
            font-size:14px;
            font-weight:600;
            color:#374151;
          "
        >
          Thank you for visiting
          ${escapeHtml(BUSINESS_INFO.name)}!
        </div>

        <div
          style="
            margin-top:8px;
            font-size:12px;
            line-height:18px;
            color:#9ca3af;
          "
        >
          ${escapeHtml(BUSINESS_INFO.phone)}
          <br />
          ${escapeHtml(BUSINESS_INFO.email)}
        </div>

        <div
          style="
            margin-top:14px;
            font-size:11px;
            color:#c0c7d1;
          "
        >
          This is an automatically generated email.
          Please do not reply directly to this message.
        </div>

      </div>

    </div>

  </div>
</body>
</html>
`;
}