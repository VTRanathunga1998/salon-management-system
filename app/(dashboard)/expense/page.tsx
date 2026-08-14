import { Expense, Prisma } from "@prisma/client";
import EmptyState from "@/components/EmptyState";
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { prisma } from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { serializeData } from "@/lib/utils/serialize";
import { formatDateInSalonTz } from "@/lib/utils/timezone";

type ExpenseList = Expense;

const formatLabel = (v: string) =>
  v.charAt(0) + v.slice(1).toLowerCase().replace("_", " ");

const ExpenseListPage = async ({
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
    { header: "Title", accessor: "title" },
    {
      header: "Category",
      accessor: "category",
      className: "hidden md:table-cell",
    },
    { header: "Amount", accessor: "amount" },
    {
      header: "Paid Via",
      accessor: "method",
      className: "hidden md:table-cell",
    },
    { header: "Date", accessor: "date" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (item: ExpenseList) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-[#F1F0FF]"
    >
      <td className="px-2 md:px-0 py-2">{item.title}</td>
      <td className="px-2 md:px-0 py-2 hidden md:table-cell">
        {formatLabel(item.category)}
      </td>
      <td className="px-2 md:px-0 py-2">AED {Number(item.amount).toFixed(2)}</td>
      <td className="px-2 md:px-0 py-2 hidden md:table-cell">{formatLabel(item.method)}</td>
      <td className="px-2 md:px-0 py-2">{formatDateInSalonTz(item.date)}</td>
      <td className="px-2 md:px-0 py-2">
        <div className="flex flex-row items-center gap-2 py-2">
          <FormContainer table="expense" type="update" data={item} />
          <FormContainer table="expense" type="delete" id={item.id} />
        </div>
      </td>
    </tr>
  );

  const query: Prisma.ExpenseWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "search":
            query.title = { contains: value, mode: "insensitive" };
            break;
        }
      }
    }
  }

  const [data, count, totalAgg] = await prisma.$transaction([
    prisma.expense.findMany({
      where: query,
      orderBy: { date: "desc" },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.expense.count({ where: query }),
    prisma.expense.aggregate({ where: query, _sum: { amount: true } }),
  ]);

  const totalAmount = Number(totalAgg._sum.amount ?? 0);

  return (
    <div className="flex-1 bg-white p-6 mt-0 space-y-4 md:p-4">
      {/* ── Top bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">
            All Expenses
          </h1>
        </div>

        <div className="flex items-center gap-4 self-end">
          <TableSearch />

          <div className="flex items-center gap-4 self-end">
            <FormContainer table="expense" type="create" />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {count === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Start by adding a new expense."
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

export default ExpenseListPage;
