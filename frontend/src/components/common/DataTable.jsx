export default function DataTable({ columns, rows, loading = false, emptyMessage = 'No records found.' }) {
  return (
    <div className="table-shell">
      <table className="table cfx-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                <span className="table-loading-dot" /> Loading records...
              </td>
            </tr>
          )}
          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                <strong>{emptyMessage}</strong>
                <span>Try changing the filters or search.</span>
              </td>
            </tr>
          )}
          {!loading && rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
