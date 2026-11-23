import React from "react";
import {SearchIcon} from 'lucide-animated';

interface SearchWithSortProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
}

const SearchWithSort: React.FC<SearchWithSortProps> = ({
  searchValue,
  onSearchChange,
}) => {
  return (
    <div className="search-sort-container">
        <SearchIcon className="search-icon"/>
      <input
        type="text"
        placeholder="Search..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

export default SearchWithSort;