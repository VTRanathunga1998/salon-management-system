/*
  Warnings:

  - You are about to drop the column `employeeId` on the `InvoiceItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_employeeId_fkey";

-- DropIndex
DROP INDEX "InvoiceItem_employeeId_idx";

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "employeeId";

-- CreateTable
CREATE TABLE "InvoiceItemEmployee" (
    "id" TEXT NOT NULL,
    "invoiceItemId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "InvoiceItemEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceItemEmployee_employeeId_idx" ON "InvoiceItemEmployee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceItemEmployee_invoiceItemId_employeeId_key" ON "InvoiceItemEmployee"("invoiceItemId", "employeeId");

-- AddForeignKey
ALTER TABLE "InvoiceItemEmployee" ADD CONSTRAINT "InvoiceItemEmployee_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "InvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItemEmployee" ADD CONSTRAINT "InvoiceItemEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
