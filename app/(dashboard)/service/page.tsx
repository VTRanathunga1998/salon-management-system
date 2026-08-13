import { Prisma, Service } from "@prisma/client";
import EmptyState from "@/components/EmptyState";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

type ServiceList = Service;

const ServiceListPage = async ({
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
    { header: "Service Name", accessor: "name" },
    {
      header: "Description",
      accessor: "description",
      className: "hidden md:table-cell",
    },
    { header: "Price", accessor: "price" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: ServiceList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-[#F1F0FF]"
    >
      <td className="py-2">{item.name}</td>
      <td className="py-2 hidden md:table-cell">{item.description}</td>
      <td className="py-2">AED {item.price.toFixed(2)}</td>
      <td className="py-2">
        <div className="flex flex-col md:flex-row items-center gap-2 py-2">
          <FormContainer table="service" type="update" data={item} />
          <FormContainer table="service" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  const query: Prisma.ServiceWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.name = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.service.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.service.count({
      where: query,
    }),
  ]);

  return (
    <div className="flex-1 bg-white p-6 mt-0 space-y-4 md:p-4">
      {/* ── Top bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            All Services
          </h1>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />

          <div className="flex items-center gap-4 self-end">
            <FormContainer table="service" type="create" />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {count === 0 ? (
        <EmptyState
          title="No services found"
          description="Start by adding a new service."
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

export default ServiceListPage;
