"use server";

import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { appointmentSchema } from "../formValidationsSchemas";
import { combineDateAndTime, startOfDayInSalonTz } from "@/lib/utils/timezone";

type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

async function assertNoServiceOverlap({
  date,
  startTime,
  endTime,
  serviceIds,
  excludeAppointmentId,
}: {
  date: Date;
  startTime: Date;
  endTime: Date;
  serviceIds: string[];
  excludeAppointmentId?: string;
}) {
  const conflicts = await prisma.appointmentService.findMany({
    where: {
      serviceId: { in: serviceIds },
      appointment: {
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        status: { not: AppointmentStatus.CANCELLED },
        date,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    },
    select: { service: { select: { name: true } } },
  });

  if (conflicts.length > 0) {
    const names = [...new Set(conflicts.map((c) => c.service.name))];
    throw new Error(
      `${names.join(", ")} ${names.length === 1 ? "is" : "are"} already booked during this time slot.`,
    );
  }
}

export async function createAppointment(
  prevState: ActionState,
  formData: unknown,
): Promise<ActionState> {
  const parsed = appointmentSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  const data = parsed.data;

  try {
    const services = await prisma.service.findMany({
      where: { id: { in: data.services.map((s) => s.serviceId) } },
    });
    if (services.length !== data.services.length) {
      return {
        success: false,
        error: true,
        message: "One or more selected services no longer exist.",
      };
    }
    const serviceMap = new Map(services.map((s) => [s.id, s]));

    const date = startOfDayInSalonTz(data.date);
    const startTime = combineDateAndTime(data.date, data.startTime);
    const endTime = combineDateAndTime(data.date, data.endTime);

    await assertNoServiceOverlap({
      date,
      startTime,
      endTime,
      serviceIds: data.services.map((s) => s.serviceId),
    });

    await prisma.appointment.create({
      data: {
        customerId: data.customerId,
        date,
        startTime,
        endTime,
        status: data.status,
        notes: data.notes || null,
        services: {
          create: data.services.map((s) => ({
            serviceId: s.serviceId,
            serviceNameSnapshot: serviceMap.get(s.serviceId)!.name,
            employees: {
              create: (s.employeeIds ?? []).map((employeeId) => ({
                employeeId,
              })),
            },
          })),
        },
      },
    });

    return { success: true, error: false, message: "Appointment booked." };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to book appointment.";
    return { success: false, error: true, message };
  }
}

export async function updateAppointment(
  prevState: ActionState,
  formData: unknown,
): Promise<ActionState> {
  const parsed = appointmentSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: true,
      message: parsed.error.issues[0]?.message ?? "Invalid data.",
    };
  }
  const data = parsed.data;
  if (!data.id) {
    return { success: false, error: true, message: "Missing appointment id." };
  }

  try {
    // Cancelled appointments are locked — no edits, ever.
    const existing = await prisma.appointment.findUnique({
      where: { id: data.id },
      select: { status: true },
    });
    if (!existing) {
      return { success: false, error: true, message: "Appointment not found." };
    }
    if (existing.status === AppointmentStatus.CANCELLED) {
      return {
        success: false,
        error: true,
        message: "This appointment has been cancelled and can't be edited.",
      };
    }

    const services = await prisma.service.findMany({
      where: { id: { in: data.services.map((s) => s.serviceId) } },
    });
    if (services.length !== data.services.length) {
      return {
        success: false,
        error: true,
        message: "One or more selected services no longer exist.",
      };
    }
    const serviceMap = new Map(services.map((s) => [s.id, s]));

    const date = startOfDayInSalonTz(data.date);
    const startTime = combineDateAndTime(data.date, data.startTime);
    const endTime = combineDateAndTime(data.date, data.endTime);

    // Skip the overlap check if this update is itself the cancellation —
    // no point validating a time slot that's about to be freed up.
    if (data.status !== AppointmentStatus.CANCELLED) {
      await assertNoServiceOverlap({
        date,
        startTime,
        endTime,
        serviceIds: data.services.map((s) => s.serviceId),
        excludeAppointmentId: data.id,
      });
    }

    // NOTE: deleteMany on AppointmentService cascades to
    // AppointmentServiceEmployee (onDelete: Cascade in schema), so the old
    // junction rows are cleaned up automatically — no separate delete needed.
    await prisma.$transaction([
      prisma.appointmentService.deleteMany({
        where: { appointmentId: data.id },
      }),
      prisma.appointment.update({
        where: { id: data.id },
        data: {
          customerId: data.customerId,
          date,
          startTime,
          endTime,
          status: data.status,
          notes: data.notes || null,
          cancelledAt:
            data.status === AppointmentStatus.CANCELLED ? new Date() : null,
          cancelReason:
            data.status === AppointmentStatus.CANCELLED
              ? data.cancelReason
              : null,
          services: {
            create: data.services.map((s) => ({
              serviceId: s.serviceId,
              serviceNameSnapshot: serviceMap.get(s.serviceId)!.name,
              employees: {
                create: (s.employeeIds ?? []).map((employeeId) => ({
                  employeeId,
                })),
              },
            })),
          },
        },
      }),
    ]);

    return { success: true, error: false, message: "Appointment updated." };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update appointment.";
    return { success: false, error: true, message };
  }
}

export async function deleteAppointment(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get("id") as string;
  if (!id)
    return { success: false, error: true, message: "Missing appointment id." };

  try {
    await prisma.appointment.delete({ where: { id } });
    return { success: true, error: false, message: "Appointment deleted." };
  } catch (err) {
    return {
      success: false,
      error: true,
      message: "Failed to delete appointment.",
    };
  }
}
