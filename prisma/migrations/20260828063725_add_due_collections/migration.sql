-- CreateTable
CREATE TABLE "InvoiceDueCollection" (
    "id" TEXT NOT NULL,
    "collectingInvoiceId" TEXT NOT NULL,
    "sourceInvoiceId" TEXT NOT NULL,
    "sourceInvoiceNumber" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceDueCollection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InvoiceDueCollection" ADD CONSTRAINT "InvoiceDueCollection_collectingInvoiceId_fkey" FOREIGN KEY ("collectingInvoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
