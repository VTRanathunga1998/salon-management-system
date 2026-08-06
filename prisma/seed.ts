import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");
  // Only clearing what this seed touches. Invoices/Users are managed separately
  // (invoices depend on employees/services via FK, so if any exist they must
  // go first — safe to leave uncommented even if those tables are empty).
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.service.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.customer.deleteMany();

  console.log("Seeding employees...");
  const employeeDefs = [
    {
      name: "Nadeesha Perera",
      phone: "0771234567",
      email: "nadeesha@salon.lk",
    },
    { name: "Kasun Fernando", phone: "0772345678", email: "kasun@salon.lk" },
    { name: "Ishara Silva", phone: "0773456789", email: "ishara@salon.lk" },
    { name: "Tharindu Jayasuriya", phone: "0774567890", email: null },
  ];
  const employees = await Promise.all(
    employeeDefs.map((e) => prisma.employee.create({ data: e })),
  );

  console.log("Seeding services...");
  const serviceDefs = [
    {
      name: "Haircut - Basic",
      description: "Wash, cut & blow dry",
      duration: 30,
      price: 1500,
    },
    {
      name: "Haircut - Premium",
      description: "Cut, style & consultation",
      duration: 45,
      price: 2500,
    },
    {
      name: "Hair Coloring",
      description: "Full head color",
      duration: 90,
      price: 6500,
    },
    {
      name: "Manicure",
      description: "Classic manicure",
      duration: 40,
      price: 1800,
    },
    {
      name: "Pedicure",
      description: "Classic pedicure",
      duration: 45,
      price: 2000,
    },
    {
      name: "Facial - Deep Cleanse",
      description: "60 min facial treatment",
      duration: 60,
      price: 4000,
    },
    {
      name: "Bridal Makeup",
      description: "Full bridal package",
      duration: 120,
      price: 15000,
    },
    {
      name: "Head Massage",
      description: "Relaxing scalp massage",
      duration: 20,
      price: 1200,
    },
  ];
  const services = await Promise.all(
    serviceDefs.map((s) => prisma.service.create({ data: s })),
  );

  console.log("Seeding customers...");
  const customerDefs = [
    {
      name: "Amaya Wickramasinghe",
      phone: "0711111111",
      email: "amaya@example.com",
      address: "Negombo",
    },
    {
      name: "Ruwan Bandara",
      phone: "0712222222",
      email: "ruwan@example.com",
      address: "Colombo",
    },
    {
      name: "Sanduni Rajapaksha",
      phone: "0713333333",
      email: null,
      address: "Wattala",
    },
    {
      name: "Dilshan Gunasekara",
      phone: "0714444444",
      email: "dilshan@example.com",
      address: null,
    },
    {
      name: "Hansika Weerasinghe",
      phone: "0715555555",
      email: "hansika@example.com",
      address: "Negombo",
    },
    {
      name: "Chamara Rathnayake",
      phone: "0716666666",
      email: null,
      address: "Ja-Ela",
    },
  ];
  const customers = await Promise.all(
    customerDefs.map((c) => prisma.customer.create({ data: c })),
  );

  console.log("Seed complete.");
  console.log(
    `  Employees: ${employees.length}, Services: ${services.length}, Customers: ${customers.length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
