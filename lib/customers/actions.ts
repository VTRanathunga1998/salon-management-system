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
  customer?: { id: string; name: string; phone: string };
};

export async function createQuickCustomer(
  input: QuickCustomerInput,
): Promise<QuickCustomerResult> {
  const name = input.name?.trim();
  const phone = input.phone?.trim();

  if (!name) return { success: false, message: "Name is required." };
  if (!phone) return { success: false, message: "Phone is required." };

  try {
    const existing = await prisma.customer.findUnique({ where: { phone } });
    if (existing) {
      return {
        success: false,
        message: `A customer with this phone number already exists: ${existing.name}.`,
      };
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: input.email || null,
        address: input.address || null,
      },
      select: { id: true, name: true, phone: true },
    });

    return { success: true, customer };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Failed to create customer." };
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
