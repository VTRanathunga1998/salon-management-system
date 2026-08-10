"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/formValidationsSchemas";

type QuickCustomerInput = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
};

type QuickCustomerResult = {
  success: boolean;
  message?: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
};

export async function createQuickCustomer(
  input: QuickCustomerInput,
): Promise<QuickCustomerResult> {
  try {
    /*
     * Validate and normalize everything
     */
    const validated = customerSchema.parse({
      name: input.name,
      phone: input.phone,
      email: input.email ?? "",
      address: input.address ?? "",
    });

    /*
     * Check duplicate phone
     */
    const existing = await prisma.customer.findUnique({
      where: {
        phone: validated.phone,
      },
    });

    if (existing) {
      return {
        success: false,
        message: `A customer with this phone number already exists: ${existing.name}.`,
      };
    }

    /*
     * Create customer using the VALIDATED + NORMALIZED data
     */
    const customer = await prisma.customer.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        address: validated.address || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });

    revalidatePath("/customer");
    revalidatePath("/invoice");

    return {
      success: true,
      customer,
    };
  } catch (error) {
    console.error("CREATE QUICK CUSTOMER ERROR:", error);

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: false,
      message: "Failed to create customer.",
    };
  }
}

type ActionState = {
  success: boolean;
  error: boolean;
  message: string;
};

export async function createCustomer(
  prevState: ActionState,
  data: unknown,
): Promise<ActionState> {
  try {
    const validated = customerSchema.parse(data);

    const existingCustomer = await prisma.customer.findUnique({
      where: {
        phone: validated.phone,
      },
    });

    if (existingCustomer) {
      return {
        success: false,
        error: true,
        message: "A customer with this phone number already exists.",
      };
    }

    await prisma.customer.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        address: validated.address || null,
      },
    });

    return {
      success: true,
      error: false,
      message: "Customer created successfully.",
    };
  } catch (error) {
    console.error("CREATE CUSTOMER ERROR:", error);

    return {
      success: false,
      error: true,
      message:
        error instanceof Error ? error.message : "Failed to create customer.",
    };
  }
}

// export async function updateCustomer(
//   prevState: ActionState,
//   data: unknown,
// ): Promise<ActionState> {
//   try {
//     const validated = customerSchema.parse(data);

//     if (!validated.id) {
//       return {
//         success: false,
//         error: true,
//         message: "Customer ID is required.",
//       };
//     }

//     const existingCustomer = await prisma.customer.findFirst({
//       where: {
//         phone: validated.phone,
//         NOT: {
//           id: validated.id,
//         },
//       },
//     });

//     if (existingCustomer) {
//       return {
//         success: false,
//         error: true,
//         message: "A customer with this phone number already exists.",
//       };
//     }

//     await prisma.customer.update({
//       where: {
//         id: validated.id,
//       },
//       data: {
//         name: validated.name,
//         phone: validated.phone,
//         email: validated.email || null,
//         address: validated.address || null,
//       },
//     });

//     return {
//       success: true,
//       error: false,
//       message: "Customer updated successfully.",
//     };
//   } catch (error) {
//     console.error(error);

//     return {
//       success: false,
//       error: true,
//       message: "Failed to update customer.",
//     };
//   }
// }

export async function updateCustomer(
  prevState: ActionState,
  data: unknown,
): Promise<ActionState> {
  try {
    const validated = customerSchema.parse(data);

    if (!validated.id) {
      return {
        success: false,
        error: true,
        message: "Customer ID is required.",
      };
    }

    // Don't allow edits once money has actually changed hands for this
    // customer — keeps invoice records accurate to who was actually billed,
    // same principle as blocking edits on PAID/CANCELLED invoices themselves.
    const restrictedInvoice = await prisma.invoice.findFirst({
      where: {
        customerId: validated.id,
        status: { in: ["PAID", "PARTIALLY_PAID"] },
      },
      select: { id: true },
    });

    if (restrictedInvoice) {
      return {
        success: false,
        error: true,
        message:
          "This customer has a paid or partially paid invoice, so their details can't be edited.",
      };
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: validated.phone,
        NOT: {
          id: validated.id,
        },
      },
    });

    if (existingCustomer) {
      return {
        success: false,
        error: true,
        message: "A customer with this phone number already exists.",
      };
    }

    await prisma.customer.update({
      where: {
        id: validated.id,
      },
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        address: validated.address || null,
      },
    });

    return {
      success: true,
      error: false,
      message: "Customer updated successfully.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: true,
      message: "Failed to update customer.",
    };
  }
}

type CurrentState = { success: boolean; error: boolean; message?: string };

export async function deleteCustomer(
  currentState: CurrentState,
  formData: FormData,
): Promise<CurrentState> {
  const id = formData.get("id") as string;

  if (!id) {
    return { success: false, error: true, message: "Missing customer id." };
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { customerId: id },
    });

    if (invoice) {
      return {
        success: false,
        error: true,
        message:
          "Cannot delete this customer — they have invoice records. Consider keeping them for history instead.",
      };
    }

    await prisma.customer.delete({ where: { id } });

    return { success: true, error: false, message: "Customer deleted." };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: "Failed to delete customer.",
    };
  }
}

export async function getCustomers() {
  return await prisma.customer.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function getCustomerById(id: string) {
  return await prisma.customer.findUnique({
    where: {
      id,
    },
  });
}
