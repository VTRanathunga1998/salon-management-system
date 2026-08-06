"use server";

import { prisma } from "@/lib/prisma";
import { ServiceSchema } from "@/lib/formValidationsSchemas";

type CurrentState = { success: boolean; error: boolean; message?: string };

export async function createService(
  currentState: CurrentState,
  data: ServiceSchema,
): Promise<CurrentState> {
  try {
    await prisma.service.create({
      data: {
        name: data.name,
        description: data.description || null,
        duration: data.duration,
        price: data.price,
        isActive: data.isActive,
      },
    });

    // No revalidatePath — client calls router.refresh() itself after
    // reacting to this resolved state (avoids the useActionState remount race).
    return { success: true, error: false, message: "Service created." };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: "Failed to create service.",
    };
  }
}

export async function updateService(
  currentState: CurrentState,
  data: ServiceSchema,
): Promise<CurrentState> {
  if (!data.id) {
    return { success: false, error: true, message: "Missing service id." };
  }

  try {
    await prisma.service.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || null,
        duration: data.duration,
        price: data.price,
        isActive: data.isActive,
      },
    });

    return { success: true, error: false, message: "Service updated." };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: "Failed to update service.",
    };
  }
}

export async function deleteService(
  currentState: CurrentState,
  formData: FormData,
): Promise<CurrentState> {
  const id = formData.get("id") as string;

  if (!id) {
    return { success: false, error: true, message: "Missing service id." };
  }

  try {
    const invoiceItem = await prisma.invoiceItem.findFirst({
      where: { serviceId: id },
    });

    if (invoiceItem) {
      return {
        success: false,
        error: true,
        message:
          "Cannot delete this service — it's used on invoice records. Deactivate it instead to keep history intact.",
      };
    }

    await prisma.service.delete({ where: { id } });

    return { success: true, error: false, message: "Service deleted." };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: true,
      message: "Failed to delete service.",
    };
  }
}
