export default function PaginationControls({ page, pageSize, totalItems, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const end = Math.min(totalItems, (currentPage + 1) * pageSize);
  const pages = Array.from({ length: totalPages }, (_, index) => index)
    .filter((index) => Math.abs(index - currentPage) <= 2 || index === 0 || index === totalPages - 1);

  if (totalItems === 0) return null;

  return (
    <div className="pagination-controls">
      <span>{start}-{end} of {totalItems}</span>
      <div className="pagination-buttons">
        <button className="btn btn-soft btn-small" type="button" disabled={currentPage === 0} onClick={() => onPageChange(currentPage - 1)}>Previous</button>
        {pages.map((pageIndex, index) => {
          const previousPage = pages[index - 1];
          const showGap = previousPage !== undefined && pageIndex - previousPage > 1;
          return (
            <span className="pagination-group" key={pageIndex}>
              {showGap && <span className="pagination-gap">...</span>}
              <button
                className={`btn btn-small page-button ${pageIndex === currentPage ? 'active' : ''}`}
                type="button"
                onClick={() => onPageChange(pageIndex)}
              >
                {pageIndex + 1}
              </button>
            </span>
          );
        })}
        <button className="btn btn-soft btn-small" type="button" disabled={currentPage >= totalPages - 1} onClick={() => onPageChange(currentPage + 1)}>Next</button>
      </div>
    </div>
  );
}
