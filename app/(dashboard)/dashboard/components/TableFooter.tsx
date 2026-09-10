import Link from 'next/link';

type TableFooterProps = {
  basePath: string;
  exportHref: string;
  page: number;
  pageSize: number;
  total: number;
};

export function TableFooter({ basePath, exportHref, page, pageSize, total }: TableFooterProps) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const first = (currentPage - 1) * pageSize + 1;
  const last = Math.min(currentPage * pageSize, total);
  const pages = Array.from(new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]))
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);

  return <footer className="table-footer">
    <div><strong>{first.toLocaleString()}–{last.toLocaleString()}</strong><span>of {total.toLocaleString()}</span></div>
    <nav aria-label="Table pagination">
      <Link className={currentPage === 1 ? 'is-disabled' : ''} aria-disabled={currentPage === 1} tabIndex={currentPage === 1 ? -1 : undefined} href={`${basePath}?page=${Math.max(1, currentPage - 1)}`}>Previous</Link>
      <div className="table-page-list">{pages.map((item, index) => <span key={item}>{index > 0 && item - pages[index - 1] > 1 ? <i>…</i> : null}<Link className={item === currentPage ? 'active' : ''} aria-current={item === currentPage ? 'page' : undefined} href={`${basePath}?page=${item}`}>{item}</Link></span>)}</div>
      <Link className={currentPage === totalPages ? 'is-disabled' : ''} aria-disabled={currentPage === totalPages} tabIndex={currentPage === totalPages ? -1 : undefined} href={`${basePath}?page=${Math.min(totalPages, currentPage + 1)}`}>Next</Link>
    </nav>
    <a className="table-export" href={exportHref}>Export CSV</a>
  </footer>;
}
