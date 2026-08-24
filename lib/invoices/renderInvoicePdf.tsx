import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePdfDocument from "./InvoicePdfDocument";

export async function renderInvoicePdf(invoice: any) {
  return renderToBuffer(<InvoicePdfDocument invoice={invoice} />);
}
