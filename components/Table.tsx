const Table = ({
  columns,
  renderRow,
  data,
}: {
  columns: { header: string; accessor: string; className?: string }[];
  renderRow: (item: any) => React.ReactNode;
  data: any[];
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-max mt-4 mb-2">
        <thead>
          <tr className="text-left text-gray-500 text-sm">
            {columns.map((col) => (
              <th
                key={col.accessor}
                className={`whitespace-nowrap pr-4 ${col.className ?? ""} px-2 md:px-0`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{data.map((item) => renderRow(item))}</tbody>
      </table>
    </div>
  );
};

export default Table;
