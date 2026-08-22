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
  type: "create" | "update" | "delete";
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
                ? {} // show all when editing so previously-assigned (now inactive) staff still appear
                : { isActive: true },
            select: {
              id: true,
              name: true,
              isActive: true,
              // NEW — which services this employee is qualified to
              // perform, so InvoiceForm can filter the staff picker
              // per line item.
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
          // Reshape into a flat array of ids — easier for the client
          // component to filter against than the nested join shape.
          employees: employees.map((e) => ({
            id: e.id,
            name: e.name,
            isActive: e.isActive,
            qualifiedServiceIds: e.qualifiedServices.map((qs) => qs.serviceId),
          })),
          services: services.map((s) => ({ ...s, price: Number(s.price) })),
        };
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
        const employees = await prisma.employee.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          orderBy: {
            name: "asc",
          },
        });

        relatedData = { employees };

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
