import { Invoice, Prisma } from "@prisma/client";
import EmptyState from "@/components/EmptyState";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { serializeData } from "@/lib/utils/serialize";
import InvoiceStatusFilter from "@/components/invoice/Invoicestatusfilter";
import { InvoiceStatus } from "@prisma/client";

type InvoiceList = Invoice & {
  customer: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    serviceId: string;
    serviceNameSnapshot: string;
    quantity: number;
    unitPrice: unknown;
    subtotal: unknown;
    employees: {
      employeeId: string;
      employee: { id: string; name: string };
    }[];
  }[];
  payments: {
    id: string;
    amount: unknown;
    method: string;
    status: string;
  }[];
};

const InvoicesListPage = async ({
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
    {
      header: "Invoice Number",
      accessor: "invoiceNumber",
    },
    {
      header: "Customer",
      accessor: "customer",
      className: "hidden md:table-cell",
    },
    {
      header: "Total",
      accessor: "total",
    },
    {
      header: "Status",
      accessor: "status",
    },
    {
      header: "Actions",
      accessor: "actions",
    },
  ];

  const renderRow = (item: InvoiceList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-[#F1F0FF]"
    >
      <td className="px-2 md:px-0 py-2">{item.invoiceNumber}</td>
      <td className="px-2 md:px-0 py-2 hidden md:table-cell">
        {item.customer.name}
      </td>
      <td className="px-2 md:px-0 py-2">AED {Number(item.total).toFixed(2)}</td>
      <td className="px-2 md:px-0 py-2">{item.status}</td>
      <td className="px-2 md:px-0 py-2">
        <div className="flex flex-row items-center gap-2 py-2">
          <FormContainer table="invoice" type="update" data={item} />
          <FormContainer table="invoice" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  const query: Prisma.InvoiceWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.OR = [
              {
                invoiceNumber: {
                  contains: value,
                  mode: "insensitive",
                },
              },
              {
                customer: {
                  name: {
                    contains: value,
                    mode: "insensitive",
                  },
                },
              },
              {
                customer: {
                  phone: {
                    contains: value,
                    mode: "insensitive",
                  },
                },
              },
            ];
            break;

          case "status":
            query.status = value as InvoiceStatus;
            break;
        }
      }
    }
  }

  const [data, count] = await prisma.$transaction([
    prisma.invoice.findMany({
      where: query,
      include: {
        customer: true,
        items: { include: { employees: { include: { employee: true } } } },
        payments: { where: { status: "COMPLETED" } },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.count({ where: query }),
  ]);

  return (
    <div className="flex-1 bg-white p-6 mt-0 space-y-4 md:p-4">
      {/* ── Top bar ── */}
      <div className="flex flex-col gap-4 md:flex-row sm:items-center sm:justify-between">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            All Invoices
          </h1>
        </div>

        <div className="flex items-center gap-4 lg:self-end">
          <FormContainer table="invoice" type="create" />
        </div>

        <div className="flex items-center gap-4 lg:self-end">
          <TableSearch />
        </div>
      </div>

      <div>
        <InvoiceStatusFilter />
      </div>

      {/* CONTENT */}
      {count === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Start by adding a new invoice."
          imageSrc="/no-data.gif"
        />
      ) : (
        <>
          <Table
            columns={columns}
            renderRow={renderRow}
            data={serializeData(data)}
          />
          <Pagination page={p} count={count} />
        </>
      )}
    </div>
  );
};

export default InvoicesListPage;
