import { prisma } from "@/lib/prisma";
import FormModal from "./FormModal";

export type FormContainerProps = {
  table:
    | "invoice"
    | "customer"
    | "employee"
    | "service"
    | "appointment"
    | "expense";
  type: "create" | "update" | "delete" | "convert";
  data?: any;
  id?: number | string;
};

import { serializeData } from "@/lib/utils/serialize";

const FormContainer = async ({ table, type, data, id }: FormContainerProps) => {
  let relatedData = {};

  if (type !== "delete") {
    switch (table) {
      case "invoice": {
        const [customers, employees, services] = await Promise.all([
          prisma.customer.findMany({
            select: { id: true, name: true, phone: true },
            orderBy: { name: "asc" },
          }),
          prisma.employee.findMany({
            where:
              type === "update" && data?.items?.length
                ? {}
                : { isActive: true },
            select: {
              id: true,
              name: true,
              isActive: true,
              qualifiedServices: { select: { serviceId: true } },
            },
            orderBy: { name: "asc" },
          }),
          prisma.service.findMany({
            where:
              type === "update" && data?.items?.length
                ? {}
                : { isActive: true },
            select: { id: true, name: true, price: true, isActive: true },
            orderBy: { name: "asc" },
          }),
        ]);

        relatedData = {
          customers,
          employees: employees.map((e) => ({
            id: e.id,
            name: e.name,
            isActive: e.isActive,
            qualifiedServiceIds: e.qualifiedServices.map((qs) => qs.serviceId),
          })),
          services: services.map((s) => ({ ...s, price: Number(s.price) })),
        };

        // NEW — build invoice seed data from an appointment. Runs after
        // relatedData is assembled since it doesn't need it, only needs
        // the appointment itself.
        if (type === "convert") {
          const appointmentId = data?.appointmentId ?? id;
          if (!appointmentId) {
            console.warn(
              "[FormContainer] convert->invoice missing appointmentId",
            );
            return null;
          }

          const appointment = await prisma.appointment.findUnique({
            where: { id: String(appointmentId) },
            include: {
              customer: { select: { id: true } },
              services: { select: { serviceId: true, employeeId: true } },
            },
          });

          if (!appointment) {
            console.warn(
              "[FormContainer] convert->invoice appointment not found",
            );
            return null;
          }
          if (
            appointment.status === "CANCELLED" ||
            appointment.status === "COMPLETED"
          ) {
            // Already converted / cancelled — don't render a button that
            // would just fail on submit.
            return null;
          }

          data = {
            customerId: appointment.customer.id,
            appointmentId: appointment.id,
            items: appointment.services.map((s) => ({
              serviceId: s.serviceId,
              employeeIds: s.employeeId ? [s.employeeId] : [],
              quantity: 1,
              customPrice: undefined,
            })),
          };
        }
        break;
      }
      case "appointment": {
        const [customers, employees, services] = await Promise.all([
          prisma.customer.findMany({
            select: { id: true, name: true, phone: true },
            orderBy: { name: "asc" },
          }),
          prisma.employee.findMany({
            where: { isActive: true },
            select: { id: true, name: true, isActive: true },
            orderBy: { name: "asc" },
          }),
          prisma.service.findMany({
            where: { isActive: true },
            select: { id: true, name: true, isActive: true },
            orderBy: { name: "asc" },
          }),
        ]);

        relatedData = { customers, employees, services };

        if (type === "update" && data?.id) {
          const fullAppointment = await prisma.appointment.findUnique({
            where: { id: data.id },
            include: {
              customer: { select: { id: true, name: true } },
              services: {
                select: {
                  id: true,
                  serviceId: true,
                  employeeId: true,
                  serviceNameSnapshot: true,
                },
              },
            },
          });
          if (fullAppointment) {
            data = fullAppointment;
          }
        }

        break;
      }
      case "employee": {
        const services = await prisma.service.findMany({
          where:
            type === "update"
              ? {} // show all so previously-qualified (now inactive) services still appear
              : { isActive: true },
          select: { id: true, name: true, isActive: true },
          orderBy: { name: "asc" },
        });

        relatedData = { services };

        if (type === "update" && data?.id) {
          const fullEmployee = await prisma.employee.findUnique({
            where: { id: data.id },
            include: {
              qualifiedServices: { select: { serviceId: true } },
            },
          });
          if (fullEmployee) {
            data = fullEmployee;
          }
        }

        break;
      }
      case "expense": {
        const [employees, categories, subCategories] = await Promise.all([
          prisma.employee.findMany({
            where: { isActive: true },
            select: { id: true, name: true, isActive: true },
            orderBy: { name: "asc" },
          }),
          prisma.expenseCategory.findMany({
            where:
              type === "update" && data?.categoryId ? {} : { isActive: true },
            select: { id: true, name: true, isSalary: true, isActive: true },
            orderBy: { name: "asc" },
          }),
          prisma.expenseSubCategory.findMany({
            where:
              type === "update" && data?.subCategoryId
                ? {}
                : { isActive: true },
            select: { id: true, categoryId: true, name: true, isActive: true },
            orderBy: { name: "asc" },
          }),
        ]);

        relatedData = { employees, categories, subCategories };
        break;
      }
    }
  }

  return (
    <FormModal
      table={table}
      type={type}
      data={serializeData(data)}
      id={id}
      relatedData={relatedData}
    />
  );
};

export default FormContainer;
