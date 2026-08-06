import { prisma } from "@/lib/prisma";
import FormModal from "./FormModal";

export type FormContainerProps = {
  table: "invoice" | "customer" | "employee" | "service";
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
            select: { id: true, name: true, isActive: true },
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
          employees,
          services: services.map((s) => ({ ...s, price: Number(s.price) })),
        };
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
