import React from 'react';
import { Filter } from '../types';

interface FilterBarProps {
  Filters: Filter[];
  ActiveFilters: string[];
  UpdateActiveFilter: (publisher: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ Filters, ActiveFilters, UpdateActiveFilter }) => {
  const onFilterButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const parent = (event.target as HTMLElement).closest('button');
    const parentKey = parent?.getAttribute('data-publisher');
    if (parentKey) {
      UpdateActiveFilter(parentKey);
    }
  };

  const buttonBody = (filter: Filter) => {
    if (filter.imageUrl) {
      return <img src={filter.imageUrl} alt={filter.publisher} title={filter.publisher} />;
    }
    return <span>{filter.publisher}</span>;
  };

  return (
    <div className="row filter-list">
      {Filters.map((filter) => {
        let filterState = '';
        if (ActiveFilters.length > 0 && ActiveFilters.indexOf(filter.publisher) === -1) {
          filterState = 'inactive';
        }
        return (
          <button
            className={`pub-logo ${filterState}`}
            data-publisher={filter.publisher}
            onClick={onFilterButtonClick}
            key={filter.publisher}
          >
            {buttonBody(filter)}
          </button>
        );
      })}
    </div>
  );
};

export default FilterBar;
