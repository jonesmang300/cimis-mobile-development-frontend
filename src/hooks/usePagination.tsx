import { useState, useMemo } from "react";

export const usePagination = (
  items: any[] = [],
  itemsPerPage: number = 5,
  sortKey: string = "id",
  sortOrder: "asc" | "desc" = "desc"
) => {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (sortOrder === "asc") return a[sortKey] - b[sortKey];
      return b[sortKey] - a[sortKey];
    });
  }, [items, sortKey, sortOrder]);

  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [currentPage, setCurrentPage] = useState(1);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const resetPagination = () => setCurrentPage(1);

  return {
    currentItems,
    currentPage,
    totalPages,
    totalItems,
    startIndex, // ✅ <-- add this line!
    handleNextPage,
    handlePrevPage,
    resetPagination,
  };
};
