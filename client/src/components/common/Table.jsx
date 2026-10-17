import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { LoadingSpinner, EmptyState } from './LoadingAndEmpty.jsx';

export const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching this criteria.',
  searchPlaceholder = 'Search records...',
  searchable = true,
  searchQuery = '',
  onSearchChange,
  itemsPerPage = 10,
  headerAction,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [internalSearch, setInternalSearch] = useState('');

  const currentSearch = onSearchChange ? searchQuery : internalSearch;
  const handleSearchChange = (e) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    } else {
      setInternalSearch(e.target.value);
      setCurrentPage(1);
    }
  };

  // Client-side filtering if search is handled internally
  const filteredData = onSearchChange
    ? data
    : data.filter((item) => {
        if (!internalSearch) return true;
        const q = internalSearch.toLowerCase();
        return Object.values(item).some(
          (val) => val && String(val).toLowerCase().includes(q)
        );
      });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = onSearchChange
    ? filteredData
    : filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      {(searchable || headerAction) && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          {searchable ? (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={currentSearch}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          ) : (
            <div />
          )}
          {headerAction && <div className="w-full sm:w-auto flex items-center justify-end">{headerAction}</div>}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : paginatedData.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/40 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th
                    key={col.key || idx}
                    className={`py-3.5 px-4 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`py-3.5 px-4 text-slate-700 dark:text-slate-300 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.cellClassName || ''}`}
                    >
                      {col.render ? col.render(row[col.accessor || col.key], row) : row[col.accessor || col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && filteredData.length > itemsPerPage && !onSearchChange && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
