import React, { useMemo, useState, useEffect, } from "react";
import {DeleteIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownIcon } from 'lucide-animated';
import ExportIcon from "../../assets/Images/ExportIcon.svg";
import DashboardButtons from "./Buttons";

interface TableColumn {
  key: string;
  title: string;
  width?: string;
  render?: ( value: any, row: any, rowIndex: number ) => React.ReactNode; 
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
}) => {
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

  return (
    <div className={`custom-table-wrapper ${className}`}>
      {/* Top Actions */}
      {selectable && selectedRows.length > 0 && (
        <div className="table-top-actions">

          {/* <button className="export-btn" onClick={handleExportSelected} > Export ({selectedRows.length}) </button> */}
          <DashboardButtons text="Export" variant="blueborder" textsize="sm" icon={<img src={ExportIcon} alt="Add" className="btn-icon" />} onClick={handleExportSelected}/> 
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
        </div>
      )}
      {/* {selectable && onBulkDelete && selectedRows.length > 0 && (
        // <div className="table-top-actions">
        //   <Buttons
        //   textsize="md"
        //   text={`(${selectedRows.length})`}
        //   variant="red"
        //   icon={<DeleteIcon size={25}/>}
        //   onClick={handleBulkDelete}
        // />
        // </div>
        <div className="table-top-actions">
        </div> 
      )} */}
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
              <th>
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

            {columns.map((col) => (
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
            paginatedRows.map((row, rowIndex) => {
              const actualIndex =
                (currentPage - 1) * rowsPerPage + rowIndex;

              return (
                <tr key={actualIndex}>
                  {selectable && (
                    <td>
                    <div className="d-flex check-button"> 
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={selectedRows.includes(
                          actualIndex
                        )}
                        onChange={() =>
                          handleRowSelect(actualIndex)
                        }
                      />
                      </div>
                    </td>
                  )}

                {columns.map((col) => (
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
                    ? columns.length + 1
                    : columns.length
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
