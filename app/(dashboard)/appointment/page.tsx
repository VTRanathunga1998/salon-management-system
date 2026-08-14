import { Appointment, Prisma } from "@prisma/client";
import EmptyState from "@/components/EmptyState";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import AppointmentFilters from "@/components/appoinment/AppointmentFilters";
import AppointmentStatusBadge from "@/components/AppointmentStatusBadge";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import {
  endOfDayInSalonTz,
  startOfDayInSalonTz,
  formatDateInSalonTz,
  formatTimeInSalonTz,
} from "@/lib/utils/timezone";

type AppointmentList = Appointment & {
  customer: { id: string; name: string };
  services: {
    id: string;
    serviceId: string;
    employeeId: string | null;
    serviceNameSnapshot: string;
  }[];
};

const AppointmentListPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const resolvedSearchParams = await searchParams;

  const page = resolvedSearchParams.page
    ? parseInt(resolvedSearchParams.page)
    : 1;

  const queryParams = { ...resolvedSearchParams };
  delete queryParams.page;

  const p = page ? page : 1;

  const columns = [
    { header: "Customer Name", accessor: "name" },
    {
      header: "Service(s)",
      accessor: "service",
      className: "hidden md:table-cell",
    },
    { header: "Date", accessor: "date" },
    { header: "Start Time", accessor: "start" },
    { header: "End Time", accessor: "end" },
    { header: "Status", accessor: "status" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: AppointmentList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-[#F1F0FF]"
    >
      <td className="px-2 md:px-0 py-2">{item.customer.name}</td>
      <td className="px-2 md:px-0 py-2 hidden md:table-cell">
        {item.services.map((s) => s.serviceNameSnapshot).join(", ")}
      </td>
      <td className="px-2 md:px-0 py-2">{formatDateInSalonTz(item.date)}</td>
      <td className="px-2 md:px-0 py-2">
        {formatTimeInSalonTz(item.startTime)}
      </td>
      <td className="px-2 md:px-0 py-2">{formatTimeInSalonTz(item.endTime)}</td>
      <td className="px-2 md:px-0 py-2">
        <AppointmentStatusBadge status={item.status} />
      </td>
      <td className="px-2 md:px-0 py-2">
        <div className="flex flex-row items-center gap-2 py-2">
          <FormContainer table="appointment" type="update" data={item} />
          <FormContainer table="appointment" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  const query: Prisma.AppointmentWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (!value) continue;
      switch (key) {
        case "search":
          query.customer = { name: { contains: value, mode: "insensitive" } };
          break;
        case "from":
          query.date = {
            ...(query.date as object),
            gte: startOfDayInSalonTz(value),
          };
          break;

        case "to":
          query.date = {
            ...(query.date as object),
            lte: endOfDayInSalonTz(value),
          };
          break;
        case "serviceId":
          query.services = { some: { serviceId: value } };
          break;
      }
    }
  }

  const [data, count, services] = await prisma.$transaction([
    prisma.appointment.findMany({
      where: query,
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
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.appointment.count({ where: query }),
    prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex-1 bg-white p-6 mt-0 space-y-4 md:p-4">
      {/* ── Top bar ── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">
              All Appointments
            </h1>
          </div>

          <div className="flex items-center gap-4 self-end">
          {/* <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto"> */}
            <TableSearch />

            <div className="flex items-center gap-4 self-end">
              <FormContainer table="appointment" type="create" />
            </div>
          </div>
        </div>

        <AppointmentFilters services={services} />
      </div>

      {/* CONTENT */}
      {count === 0 ? (
        <EmptyState
          title="No appointments found"
          description="Start by booking a new appointment."
          imageSrc="/no-data.gif"
        />
      ) : (
        <>
          <Table columns={columns} renderRow={renderRow} data={data} />
          <Pagination page={p} count={count} />
        </>
      )}
    </div>
  );
};

export default AppointmentListPage;
