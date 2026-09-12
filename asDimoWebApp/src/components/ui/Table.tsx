import React, { useMemo, useState, useEffect, } from "react";
import {DeleteIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownIcon, DownloadIcon, ChartColumnDecreasingIcon} from 'lucide-animated';
import DashboardButtons from "./Buttons";
import { tokenManager } from "../../services/tokenManager";

interface TableColumn {
  key: string;
  title: string;
  width?: string;
  fixed?: boolean;
  render?: (value: any, row: any, rowIndex: number) => React.ReactNode;
  showFilter?: boolean;
  onFilterClick?: (key: string) => void;
}


interface TableProps {
  columns: TableColumn[];
  rows: Record<string, any>[];
  className?: string;
  selectable?: boolean;
  pagination?: boolean;
  rowsPerPageOptions?: number[];
  onBulkDelete?: boolean;
  onDeleteSelected?: ( selectedRows: any[] ) => void;
  onSelectionChange?: ( selectedRows: any[] ) => void;
  currentPage?: number;
  totalPages?: number;
  rowsPerPage?: number;
  onPageChange?: ( page: number ) => void; 
  onRowsPerPageChange?: ( value: number ) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  displayLimit?: number;
  showChooseColumns?: boolean;
}

const Table: React.FC<TableProps> = ({
  columns,
  rows,
  className = "",
  selectable = false,
  pagination = true,
  rowsPerPageOptions = [10, 20, 50, 200],
  onBulkDelete = false,
  onDeleteSelected,
  onSelectionChange,
  currentPage = 1,
  totalPages = 1,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  sortBy,
  sortOrder = "asc",
  displayLimit,
  showChooseColumns = false,
}) => {
  const roleFlag = Number(tokenManager.getUser()?.flag);
  const hiddenColumnKeysByRole: Record<number, string[]> = {
    6: ["zonalAdmin", "zonal_admin_name"],
    7: ["admin", "admin_name"],
    1: ["organization", "organization_name"],
    3: ["teacher", "doctor", "therapist"],
  };
  const permittedColumns = useMemo(
    () => columns.filter((column) => !hiddenColumnKeysByRole[roleFlag]?.includes(column.key)),
    [columns, roleFlag]
  );
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
    useEffect(() => {
    onSelectionChange?.(
      selectedRows.map((index) => rows[index])
    );
  }, [selectedRows, rows, onSelectionChange]);

  const paginatedRows = useMemo(() => {
    if (!pagination) {
      return rows;
    }

    const startIndex = (currentPage - 1) * rowsPerPage;
    return rows.slice(startIndex, startIndex + rowsPerPage);
  }, [rows, currentPage, rowsPerPage, pagination]);



useEffect(() => {
  onSelectionChange?.(
    selectedRows.map((index) => rows[index])
  );
}, [selectedRows, rows, onSelectionChange]);


  // Checkbox Handlers
  const isAllSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((_, index) => {
      const actualIndex =
        (currentPage - 1) * rowsPerPage + index;

      return selectedRows.includes(actualIndex);
    });

  const handleSelectAll = () => {
    if (isAllSelected) {
      const updated = selectedRows.filter((selectedIndex) => {
        const pageIndexes = paginatedRows.map(
          (_, index) =>
            (currentPage - 1) * rowsPerPage + index
        );

        return !pageIndexes.includes(selectedIndex);
      });

      setSelectedRows(updated);
    } else {
      const newIndexes = paginatedRows.map(
        (_, index) =>
          (currentPage - 1) * rowsPerPage + index
      );

      setSelectedRows([
        ...new Set([...selectedRows, ...newIndexes]),
      ]);
    }
  };

  const handleRowSelect = (index: number) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(
        selectedRows.filter((item) => item !== index)
      );
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

    const handleBulkDelete = () => {
      const selectedData =
        selectedRows.map(
          (index) => rows[index]
        );

      onDeleteSelected?.(
        selectedData
      );

      setSelectedRows([]);
    };

const handleExportSelected = () => {
  const selectedData = selectedRows.map(
    (index) => rows[index]
  );

  if (!selectedData.length) {
    alert("Please select at least one row.");
    return;
  }

  const headers = Object.keys(selectedData[0]);

  const csvContent = [
    headers.join(","),
    ...selectedData.map((row) =>
      headers
        .map((header) => `"${row[header] ?? ""}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "selected_rows.csv";
  link.click();

  URL.revokeObjectURL(url);
};

const limitedRows = displayLimit
  ? paginatedRows.slice(0, displayLimit)
  : paginatedRows;

const STORAGE_KEY = "table-columns";
const [showColumnPicker, setShowColumnPicker] = useState(false);
const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
useEffect(() => {
  if (!showChooseColumns) {
    setVisibleColumns(permittedColumns.map((c) => c.key));
    return;
  }

  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const validColumns = Array.isArray(parsed)
        ? parsed.filter((key) => permittedColumns.some((c) => c.key === key))
        : [];

      setVisibleColumns(
        validColumns.length > 0
          ? validColumns
          : permittedColumns.map((c) => c.key)
      );
    } catch {
      setVisibleColumns(permittedColumns.map((c) => c.key));
    }
  } else {
    setVisibleColumns(permittedColumns.map((c) => c.key));
  }
}, [permittedColumns, showChooseColumns]);
useEffect(() => {
  if (showChooseColumns && visibleColumns.length) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(visibleColumns)
    );
  }
}, [visibleColumns, showChooseColumns]);


const toggleColumn = (key: string) => {
  const column = permittedColumns.find(c => c.key === key);

  if (!column) return;

  if (column.fixed) return;

  if (visibleColumns.includes(key)) {
    setVisibleColumns(prev =>
      prev.filter(k => k !== key)
    );
    return;
  }

  const optionalSelected =
    visibleColumns.filter(k => {
      const col = permittedColumns.find(c => c.key === k);
      return col && !col.fixed;
    }).length;

  if (optionalSelected >= 5) {
    alert("Maximum 5 optional columns allowed.");
    return;
  }

  setVisibleColumns(prev => [...prev, key]);
};

const displayedColumns = permittedColumns.filter(
  c => c.fixed || visibleColumns.includes(c.key)
);


  return (
    <div className={`custom-table-wrapper ${className}`}>
      {/* Top Actions */}
      <div className="d-flex table-top-actions">
          {selectable && selectedRows.length > 0 && (
            <div className="ActionButtonsInvisible">

              {onBulkDelete && (
              <button
                className="bulk-delete-btn"
                onClick={handleBulkDelete}  
                title={`Delete ${selectedRows.length} selected items`}
              >
                <DeleteIcon size={20} />
                <span className="delete-badge">
                  {selectedRows.length}
                </span>
              </button>
              )}
              <DashboardButtons text="Export" variant="blueborder" textsize="sm" icon={<DownloadIcon size={18} className="icon"/>} onClick={handleExportSelected}/> 
            </div>
          )}
          {showChooseColumns && (
          <div className="table-toolbar">
            <DashboardButtons text="Columns" variant="blueborder" textsize="sm"  icon={<ChartColumnDecreasingIcon size={18} className="icon"/>} onClick={() => setShowColumnPicker(!showColumnPicker) }/>
              {showColumnPicker && (
                  <div className="column-picker">
                      {permittedColumns.map(col => (
                          <label key={col.key}>
                              <input
                                  type="checkbox"
                                  checked={
                                      col.fixed ||
                                      visibleColumns.includes(col.key)
                                  }
                                  disabled={col.fixed}
                                  onChange={() =>
                                      toggleColumn(col.key)
                                  }
                              />
                              {col.title}
                          </label>
                      ))}
                  </div>
              )}
          </div>
        )}
    </div>

      {selectable && (
        <div className="mobile-select-all">
          <label>
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
            />
            <span>Select All</span>
          </label>
        </div>
      )}
    <div className="GlobalTable gradientBox">
      <table className="custom-table ">
        <thead>
          <tr>
            {selectable && (
              <th className="custom-checkbox">
              <div className="d-flex check-button"> 
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
              </div> 
              </th>
            )}

            {displayedColumns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width || "auto" }}
              >
                <div className="table-head-content">
                  <span>{col.title}</span>

                  {col.showFilter && (
                    // <button
                    //   type="button"
                    //   className="filter-btn"
                    //   onClick={() => col.onFilterClick?.(col.key)}
                    // >
                    //   <ArrowDownIcon
                    //     size={14}
                    //     style={{
                    //       transform:
                    //         sortBy === col.key && sortOrder === "desc"
                    //           ? "rotate(180deg)"
                    //           : "rotate(0deg)",
                    //       transition: "transform 0.2s ease",
                    //     }}
                    //   />
                    // </button>
                    <button
                      type="button"
                      className="filter-btn"
                      onClick={() => col.onFilterClick?.(col.key)}
                    >
                      <ArrowDownIcon
                        size={14}
                        className={
                          sortBy === col.key && sortOrder === "desc"
                            ? "rotated"
                            : ""
                        }
                      />
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

          <tbody>
            {paginatedRows.length > 0 ? (
              limitedRows.map((row, rowIndex) => {
                const actualIndex =
                  (currentPage - 1) * rowsPerPage + rowIndex;

                return (
                  <tr key={actualIndex}>
                    {selectable && (
                      <td className="custom-checkbox">
                        <div className="d-flex check-button">
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={selectedRows.includes(actualIndex)}
                            onChange={() => handleRowSelect(actualIndex)}
                          />
                        </div>
                      </td>
                    )}

                    {displayedColumns.map((col) => (
                      <td
                        key={col.key}
                        data-label={col.title}
                      >
                        {col.render
                          ? col.render(
                              row[col.key],
                              row,
                              actualIndex
                            )
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    selectable
                      ? displayedColumns.length + 1
                      : displayedColumns.length
                  }
                >
                  No Data Found
                </td>
              </tr>
            )}
          </tbody>
      </table>
      </div>

      {/* Bottom Pagination */}
      {pagination && totalPages > 1 && (
        <div className="TablepaginationWrap">
          {/* Rows Per Page */}
          <div className="rows-per-page">
            <span>Rows per page:</span>

            <select
              className="custom-select"
              value={rowsPerPage}
              onChange={(e) => {
                onRowsPerPageChange?.(Number(e.target.value));
                onPageChange?.(1);
              }}
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            out of 200
          </div>
            <div className="table-pagination">
              <div className="table-pagination-wrap">
                {/* Prev Button */}
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() =>
                    onPageChange?.(currentPage - 1)
                  }
                >
                  <ChevronLeftIcon/>
                </button>

                {/* Page Numbers */}
                <div className="page-numbers">
                  {/* First Page */}
                  <button
                    className={
                      currentPage === 1 ? "active-page" : ""
                    }
                    onClick={() => onPageChange?.(1)}
                  >
                    1
                  </button>

                  {/* Left Dots */}
                  {currentPage > 4 && <span>...</span>}

                  {/* Middle Pages */}
                  {Array.from(
                    { length: totalPages },
                    (_, i) => i + 1
                  )
                    .filter(
                      (page) =>
                        page !== 1 &&
                        page !== totalPages &&
                        Math.abs(page - currentPage) <= 1
                    )
                    .map((page) => (
                      <button
                        key={page}
                        className={
                          currentPage === page
                            ? "active-page"
                            : ""
                        }
                        onClick={() =>
                          onPageChange?.(page)
                        }
                      >
                        {page}
                      </button>
                    ))}

                  {/* Right Dots */}
                  {currentPage < totalPages - 3 && (
                    <span>...</span>
                  )}

                  {/* Last Page */}
                  {totalPages > 1 && (
                    <button
                      className={
                        currentPage === totalPages
                          ? "active-page"
                          : ""
                      }
                      onClick={() =>
                        onPageChange?.(totalPages)
                      }
                    >
                      {totalPages}
                    </button>
                  )}
                </div>

                {/* Next Button */}
                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    onPageChange?.(currentPage + 1)
                  }
                >
                  <ChevronRightIcon/>
                </button>

              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
