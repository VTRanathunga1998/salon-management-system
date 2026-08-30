import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing database...\n");

  await prisma.$transaction(async (tx) => {
    await tx.refund.deleteMany();
    await tx.invoiceDueCollection.deleteMany();
    await tx.payment.deleteMany();
    await tx.invoiceItemEmployee.deleteMany();
    await tx.invoiceItem.deleteMany();
    await tx.invoice.deleteMany();
    await tx.invoiceCounter.deleteMany();
    await tx.appointmentService.deleteMany();
    await tx.appointment.deleteMany();
    await tx.expense.deleteMany();
    await tx.expenseSubCategory.deleteMany();
    await tx.expenseCategory.deleteMany();
    await tx.employeeService.deleteMany();
    await tx.service.deleteMany();
    await tx.employee.deleteMany();
    await tx.customer.deleteMany();
    await tx.session.deleteMany();
    await tx.user.deleteMany();
  });

  console.log("Database fully cleared.");
}

main()
  .catch((error) => {
    console.error("\nFailed to clear database:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
