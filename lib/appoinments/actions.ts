"use server";

import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { appointmentSchema } from "../formValidationsSchemas";

type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function startOfDay(date: string) {
  return new Date(`${date}T00:00:00`);
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

    await prisma.appointment.create({
      data: {
        customerId: data.customerId,
        date: startOfDay(data.date),
        startTime: combineDateAndTime(data.date, data.startTime),
        endTime: combineDateAndTime(data.date, data.endTime),
        status: data.status,
        notes: data.notes || null,
        services: {
          create: data.services.map((s) => ({
            serviceId: s.serviceId,
            employeeId: s.employeeId || null,
            serviceNameSnapshot: serviceMap.get(s.serviceId)!.name,
          })),
        },
      },
    });

    return { success: true, error: false, message: "Appointment booked." };
  } catch (err) {
    console.error("[createAppointment]", err);
    return {
      success: false,
      error: true,
      message: "Failed to book appointment.",
    };
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

    await prisma.$transaction([
      prisma.appointmentService.deleteMany({
        where: { appointmentId: data.id },
      }),
      prisma.appointment.update({
        where: { id: data.id },
        data: {
          customerId: data.customerId,
          date: startOfDay(data.date),
          startTime: combineDateAndTime(data.date, data.startTime),
          endTime: combineDateAndTime(data.date, data.endTime),
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
              employeeId: s.employeeId || null,
              serviceNameSnapshot: serviceMap.get(s.serviceId)!.name,
            })),
          },
        },
      }),
    ]);

    return { success: true, error: false, message: "Appointment updated." };
  } catch (err) {
    console.error("[updateAppointment]", err);
    return {
      success: false,
      error: true,
      message: "Failed to update appointment.",
    };
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
    console.error("[deleteAppointment]", err);
    return {
      success: false,
      error: true,
      message: "Failed to delete appointment.",
    };
  }
}
