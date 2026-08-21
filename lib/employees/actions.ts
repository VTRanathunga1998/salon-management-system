"use server";

import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/formValidationsSchemas";
type ActionState = {
  success: boolean;
  error: boolean;
  message: string;
};

type CurrentState = { success: boolean; error: boolean; message?: string };

// Create Employee
export async function createEmployee(
  prevState: ActionState,
  data: unknown,
): Promise<ActionState> {
  try {
    const validated = employeeSchema.parse(data);

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          ...(validated.phone ? [{ phone: validated.phone }] : []),
          ...(validated.email ? [{ email: validated.email }] : []),
        ],
      },
    });

    if (existingEmployee) {
      return {
        success: false,
        error: true,
        message: "Employee with this phone number or email already exists.",
      };
    }

    await prisma.employee.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        address: validated.address || null,
        // NEW — the services this employee is qualified to perform.
        qualifiedServices: {
          create: validated.serviceIds.map((serviceId) => ({ serviceId })),
        },
      },
    });

    return {
      success: true,
      error: false,
      message: "Employee created successfully.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: true,
      message: "Failed to create employee.",
    };
  }
}

// Update Employee
export async function updateEmployee(
  prevState: ActionState,
  data: unknown,
): Promise<ActionState> {
  try {
    const validated = employeeSchema.parse(data);

    if (!validated.id) {
      return {
        success: false,
        error: true,
        message: "Employee ID is required.",
      };
    }

    // Check whether another employee already uses
    // the new phone number or email.
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: {
          not: validated.id,
        },
        OR: [
          ...(validated.phone ? [{ phone: validated.phone }] : []),
          ...(validated.email ? [{ email: validated.email }] : []),
        ],
      },
    });

    if (existingEmployee) {
      return {
        success: false,
        error: true,
        message:
          "Another employee with this phone number or email already exists.",
      };
    }

    // Wholesale replace: clear existing qualifications, then recreate from
    // the submitted list — same pattern used for invoice items / appointment
    // services elsewhere in this app, avoids diffing add/remove by hand.
    await prisma.$transaction([
      prisma.employeeService.deleteMany({
        where: { employeeId: validated.id },
      }),
      prisma.employee.update({
        where: {
          id: validated.id,
        },
        data: {
          name: validated.name,
          phone: validated.phone,
          email: validated.email || null,
          address: validated.address || null,
          isActive: validated.isActive,
          qualifiedServices: {
            create: validated.serviceIds.map((serviceId) => ({ serviceId })),
          },
        },
      }),
    ]);

    return {
      success: true,
      error: false,
      message: "Employee updated successfully.",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      error: true,
      message: "Failed to update employee.",
    };
  }
}
// Soft Delete Employee
export async function deleteEmployee(
  currentState: CurrentState,
  formData: FormData,
): Promise<CurrentState> {
  const id = formData.get("id") as string;

  if (!id) {
    return {
      success: false,
      error: true,
      message: "Missing employee id.",
    };
  }

  try {
    const invoiceItemEmployee = await prisma.invoiceItemEmployee.findFirst({
      where: {
        employeeId: id,
      },
    });

    if (invoiceItemEmployee) {
      return {
        success: false,
        error: true,
        message:
          "Cannot delete this employee — they have invoice records. Deactivate them instead to keep history intact.",
      };
    }

    await prisma.employee.delete({
      where: {
        id,
      },
    });

    return {
      success: true,
      error: false,
      message: "Employee deleted.",
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      error: true,
      message: "Failed to delete employee.",
    };
  }
}

// Restore Employee (optional)
async function restoreEmployee(id: string) {
  try {
    await prisma.employee.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
    });

    return {
      success: true,
      message: "Employee restored successfully.",
    };
  } catch (error) {
    console.error(error);

    throw new Error("Failed to restore employee.");
  }
}

// Get Employees
export async function getEmployees() {
  return prisma.employee.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Get Single Employee
async function getEmployee(id: string) {
  return prisma.employee.findUnique({
    where: {
      id,
    },
  });
}
