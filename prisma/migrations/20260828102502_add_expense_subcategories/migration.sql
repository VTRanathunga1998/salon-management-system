-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "subCategoryId" TEXT;

-- CreateTable
CREATE TABLE "ExpenseSubCategory" (
    "id" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseSubCategory_category_idx" ON "ExpenseSubCategory"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSubCategory_category_name_key" ON "ExpenseSubCategory"("category", "name");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "ExpenseSubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSubCategory" ADD CONSTRAINT "ExpenseSubCategory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
