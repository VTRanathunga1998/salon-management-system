// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// async function main() {
//   console.log("Clearing existing data...");
//   // Only clearing what this seed touches. Invoices/Users are managed separately
//   // (invoices depend on employees/services via FK, so if any exist they must
//   // go first — safe to leave uncommented even if those tables are empty).
//   await prisma.payment.deleteMany();
//   await prisma.invoiceItem.deleteMany();
//   await prisma.invoice.deleteMany();
//   await prisma.service.deleteMany();
//   await prisma.employee.deleteMany();
//   await prisma.customer.deleteMany();

//   console.log("Seeding employees...");
//   const employeeDefs = [
//     {
//       name: "Nadeesha Perera",
//       phone: "0771234567",
//       email: "nadeesha@salon.lk",
//     },
//     { name: "Kasun Fernando", phone: "0772345678", email: "kasun@salon.lk" },
//     { name: "Ishara Silva", phone: "0773456789", email: "ishara@salon.lk" },
//     { name: "Tharindu Jayasuriya", phone: "0774567890", email: null },
//   ];
//   const employees = await Promise.all(
//     employeeDefs.map((e) => prisma.employee.create({ data: e })),
//   );

//   console.log("Seeding services...");
//   const serviceDefs = [
//     {
//       name: "Haircut - Basic",
//       description: "Wash, cut & blow dry",
//       duration: 30,
//       price: 1500,
//     },
//     {
//       name: "Haircut - Premium",
//       description: "Cut, style & consultation",
//       duration: 45,
//       price: 2500,
//     },
//     {
//       name: "Hair Coloring",
//       description: "Full head color",
//       duration: 90,
//       price: 6500,
//     },
//     {
//       name: "Manicure",
//       description: "Classic manicure",
//       duration: 40,
//       price: 1800,
//     },
//     {
//       name: "Pedicure",
//       description: "Classic pedicure",
//       duration: 45,
//       price: 2000,
//     },
//     {
//       name: "Facial - Deep Cleanse",
//       description: "60 min facial treatment",
//       duration: 60,
//       price: 4000,
//     },
//     {
//       name: "Bridal Makeup",
//       description: "Full bridal package",
//       duration: 120,
//       price: 15000,
//     },
//     {
//       name: "Head Massage",
//       description: "Relaxing scalp massage",
//       duration: 20,
//       price: 1200,
//     },
//   ];
//   const services = await Promise.all(
//     serviceDefs.map((s) => prisma.service.create({ data: s })),
//   );

//   console.log("Seeding customers...");
//   const customerDefs = [
//     {
//       name: "Amaya Wickramasinghe",
//       phone: "0711111111",
//       email: "amaya@example.com",
//       address: "Negombo",
//     },
//     {
//       name: "Ruwan Bandara",
//       phone: "0712222222",
//       email: "ruwan@example.com",
//       address: "Colombo",
//     },
//     {
//       name: "Sanduni Rajapaksha",
//       phone: "0713333333",
//       email: null,
//       address: "Wattala",
//     },
//     {
//       name: "Dilshan Gunasekara",
//       phone: "0714444444",
//       email: "dilshan@example.com",
//       address: null,
//     },
//     {
//       name: "Hansika Weerasinghe",
//       phone: "0715555555",
//       email: "hansika@example.com",
//       address: "Negombo",
//     },
//     {
//       name: "Chamara Rathnayake",
//       phone: "0716666666",
//       email: null,
//       address: "Ja-Ela",
//     },
//   ];
//   const customers = await Promise.all(
//     customerDefs.map((c) => prisma.customer.create({ data: c })),
//   );

//   console.log("Seed complete.");
//   console.log(
//     `  Employees: ${employees.length}, Services: ${services.length}, Customers: ${customers.length}`,
//   );
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");

  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.service.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.customer.deleteMany();

  console.log("Seeding services...");
  const serviceDefs = [
    // =========================
    // Beauty Service
    // =========================
    {
      name: "Eyebrows Threading",
      description: "Eyebrow threading",
      duration: 15,
      price: 20,
    },
    {
      name: "Eyebrows Waxing",
      description: "Eyebrow waxing",
      duration: 15,
      price: 30,
    },
    {
      name: "Upper Lip Threading",
      description: "Upper lip threading",
      duration: 10,
      price: 10,
    },
    {
      name: "Upper Lip Waxing",
      description: "Upper lip waxing",
      duration: 10,
      price: 15,
    },
    {
      name: "Chin Threading",
      description: "Chin threading",
      duration: 10,
      price: 10,
    },
    {
      name: "Full Face Threading",
      description: "Full face threading",
      duration: 30,
      price: 60,
    },
    {
      name: "Full Face Waxing",
      description: "Full face waxing",
      duration: 30,
      price: 70,
    },
    {
      name: "Eyebrow Tint",
      description: "Eyebrow tinting",
      duration: 20,
      price: 35,
    },
    {
      name: "Eyebrow Bleach",
      description: "Eyebrow bleaching",
      duration: 20,
      price: 35,
    },
    {
      name: "Face Bleach (with Cleanser)",
      description: "Face bleach with cleanser",
      duration: 30,
      price: 45,
    },

    // =========================
    // Wax
    // =========================
    {
      name: "Half Arms Wax",
      description: "Waxing for half arms",
      duration: 20,
      price: 30,
    },
    {
      name: "Full Arms Wax",
      description: "Waxing for full arms",
      duration: 30,
      price: 40,
    },
    {
      name: "Under Arms Wax",
      description: "Underarm waxing",
      duration: 15,
      price: 30,
    },
    {
      name: "Full Legs Wax",
      description: "Waxing for full legs",
      duration: 45,
      price: 50,
    },
    {
      name: "Half Legs Wax",
      description: "Waxing for half legs",
      duration: 30,
      price: 40,
    },
    {
      name: "Bikini Wax",
      description: "Bikini waxing",
      duration: 30,
      price: 80,
    },
    {
      name: "Full Body Wax",
      description: "Full body waxing",
      duration: 90,
      price: 180,
    },

    // =========================
    // Facials
    // =========================
    {
      name: "Face Cleanup",
      description: "Basic face cleanup",
      duration: 30,
      price: 85,
    },
    {
      name: "Hydra Face Cleanup",
      description: "Hydra face cleanup",
      duration: 45,
      price: 120,
    },
    {
      name: "Gold Facial",
      description: "Gold facial treatment",
      duration: 60,
      price: 100,
    },
    {
      name: "Pearl Facial",
      description: "Pearl facial treatment",
      duration: 60,
      price: 100,
    },
    {
      name: "Fruit Facial",
      description: "Fruit facial treatment",
      duration: 60,
      price: 100,
    },
    {
      name: "Dr. Renaud Facial",
      description: "Dr. Renaud facial treatment",
      duration: 60,
      price: 160,
    },
    {
      name: "Cristina Facial",
      description: "Cristina facial treatment",
      duration: 60,
      price: 180,
    },
    {
      name: "Hydra Facial",
      description: "Hydra facial treatment",
      duration: 60,
      price: 230,
    },
    {
      name: "Whitening Facial",
      description: "Whitening facial treatment",
      duration: 60,
      price: 200,
    },

    // =========================
    // Nails
    // =========================
    {
      name: "Classic Manicure",
      description: "Classic manicure",
      duration: 30,
      price: 50,
    },
    {
      name: "Classic Pedicure",
      description: "Classic pedicure",
      duration: 45,
      price: 70,
    },
    {
      name: "Gel Manicure",
      description: "Gel manicure",
      duration: 45,
      price: 70,
    },
    {
      name: "Gel Pedicure",
      description: "Gel pedicure",
      duration: 60,
      price: 90,
    },
    {
      name: "Poly Gel Extension",
      description: "Poly gel nail extension",
      duration: 90,
      price: 180,
    },
    {
      name: "Gel Extension",
      description: "Gel nail extension",
      duration: 90,
      price: 170,
    },
    {
      name: "Acrylic Nail Extension",
      description: "Acrylic nail extension",
      duration: 90,
      price: 190,
    },
    {
      name: "Gel Remover",
      description: "Gel removal",
      duration: 20,
      price: 30,
    },
    {
      name: "Nail Extension Remover",
      description: "Nail extension removal",
      duration: 30,
      price: 45,
    },
    {
      name: "Gel Polish",
      description: "Gel polish application",
      duration: 30,
      price: 40,
    },
    {
      name: "Normal Nail Polish",
      description: "Normal nail polish application",
      duration: 20,
      price: 25,
    },
    {
      name: "French Nail Art",
      description: "French nail art",
      duration: 30,
      price: 20,
    },
    {
      name: "Foot Spa",
      description: "Relaxing foot spa treatment",
      duration: 45,
      price: 120,
    },

    // =========================
    // Hair Colour
    // =========================
    {
      name: "Hair Root Colour (With Ammonia)",
      description: "Root hair colour with ammonia",
      duration: 60,
      price: 100,
    },
    {
      name: "Hair Root Colour (Without Ammonia)",
      description: "Root hair colour without ammonia",
      duration: 60,
      price: 120,
    },
    {
      name: "Hair Highlight",
      description: "Hair highlighting treatment",
      duration: 120,
      price: 175,
    },
    {
      name: "Hair Full Colour",
      description: "Full hair colouring",
      duration: 120,
      price: 500,
    },
    {
      name: "Ombre & Balayage",
      description: "Ombre and balayage colouring",
      duration: 150,
      price: 300,
    },
    {
      name: "Hair Colour (Client Product)",
      description: "Hair colouring using client's product",
      duration: 120,
      price: 80,
    },
    {
      name: "Henna Application",
      description: "Henna hair application",
      duration: 60,
      price: 80,
    },

    // =========================
    // Spa
    // =========================
    {
      name: "Hot Oil Head Massage",
      description: "Hot oil head massage",
      duration: 30,
      price: 80,
    },
    {
      name: "Hot Oil Cream Head Massage",
      description: "Hot oil cream head massage",
      duration: 30,
      price: 100,
    },
    {
      name: "Hair Condition Treatment",
      description: "Hair conditioning treatment",
      duration: 45,
      price: 120,
    },
    {
      name: "Hair Spa",
      description: "Hair spa treatment",
      duration: 60,
      price: 140,
    },
    {
      name: "Keratin Treatment",
      description: "Keratin hair treatment",
      duration: 150,
      price: 250,
    },
    {
      name: "Protein Treatment",
      description: "Protein hair treatment",
      duration: 120,
      price: 250,
    },
    {
      name: "Hair Botox Treatment",
      description: "Hair botox treatment",
      duration: 120,
      price: 300,
    },
    {
      name: "Hair Rebond Treatment",
      description: "Hair rebonding treatment",
      duration: 180,
      price: 300,
    },

    // =========================
    // Hair
    // =========================
    {
      name: "Hair Wash & Normal Dry",
      description: "Hair wash and normal drying",
      duration: 30,
      price: 50,
    },
    {
      name: "Hair Wash & Blow Dry",
      description: "Hair wash and blow dry",
      duration: 45,
      price: 95,
    },
    {
      name: "Hair Trim",
      description: "Hair trimming",
      duration: 30,
      price: 70,
    },
    {
      name: "Hair Cut Style",
      description: "Hair cut and styling",
      duration: 45,
      price: 90,
    },
    {
      name: "Hair Blow Dry",
      description: "Hair blow drying",
      duration: 30,
      price: 95,
    },
    {
      name: "Hair Style",
      description: "Hair styling",
      duration: 45,
      price: 120,
    },

    // =========================
    // Massage
    // =========================
    {
      name: "Head Massage",
      description: "Relaxing head massage",
      duration: 30,
      price: 80,
    },
    {
      name: "Head / Neck / Shoulder",
      description: "Head, neck and shoulder massage",
      duration: 30,
      price: 90,
    },
    {
      name: "Feet Massage",
      description: "Foot massage - 20 minutes",
      duration: 20,
      price: 60,
    },
    {
      name: "Hand Massage",
      description: "Hand massage - 20 minutes",
      duration: 20,
      price: 50,
    },
    {
      name: "Back Massage",
      description: "Back massage - 30 minutes",
      duration: 30,
      price: 80,
    },
    {
      name: "Full Body Massage",
      description: "Full body massage - 1 hour",
      duration: 60,
      price: 180,
    },
    {
      name: "Full Body with (Lava Shell)",
      description: "Full body lava shell massage - 1 hour",
      duration: 60,
      price: 210,
    },

    // =========================
    // Other Beauty Services
    // =========================
    {
      name: "Eyebrow Microblading",
      description: "Eyebrow microblading",
      duration: 120,
      price: 450,
    },
    {
      name: "Eyebrow Micro Shading",
      description: "Eyebrow micro shading",
      duration: 120,
      price: 450,
    },
    {
      name: "Eyelash Extension",
      description: "Eyelash extension application",
      duration: 120,
      price: 120,
    },
  ];
  const services = await Promise.all(
    serviceDefs.map((s) => prisma.service.create({ data: s })),
  );

  console.log("Seed complete.");
  console.log(` Services: ${services.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
