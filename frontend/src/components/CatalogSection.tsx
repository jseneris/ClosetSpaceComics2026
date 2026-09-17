import React, { useState } from 'react';
import { IssueList } from './IssueList';
import { FilterBar } from './FilterBar';
import { SearchBar } from './SearchBar';
import { IssueZoom } from './IssueZoom';
import { Filter, Issue } from '../types';

interface CatalogSectionProps {
  Filters: Filter[];
  Issues: Issue[];
  HandleDateChange: (date: string) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({ Filters, Issues, HandleDateChange }) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [zoomIssue, setZoomIssue] = useState<Issue | null>(null);
  const [zoomIssueList, setZoomIssueList] = useState<Issue[]>([]);

  const updateActiveFilter = (filter: string) => {
    setActiveFilters((prev) => {
      const indexOf = prev.indexOf(filter);
      const next = prev.slice();
      if (indexOf > -1) {
        next.splice(indexOf, 1);
      } else {
        next.push(filter);
      }
      return next;
    });
  };

  const handleIssueClick = (issue: Issue, issueList: Issue[]) => {
    setZoomIssue(issue);
    setZoomIssueList(issueList);
  };

  const handleCloseZoomClick = () => {
    setZoomIssue(null);
    setZoomIssueList([]);
  };

  if (zoomIssue) {
    return (
      <section id="section-catalog">
        <IssueZoom Issue={zoomIssue} IssueList={zoomIssueList} OnCloseZoomClick={handleCloseZoomClick} />
      </section>
    );
  }

  return (
    <section id="section-catalog">
      <div className="row search-bar">
        <SearchBar OnDateChange={HandleDateChange} />
      </div>
      {Filters.length > 0 && Issues.length > 0 ? (
        <div>
          <FilterBar Filters={Filters} ActiveFilters={activeFilters} UpdateActiveFilter={updateActiveFilter} />
          <IssueList Issues={Issues} Size="span-1-of-6" ActiveFilters={activeFilters} OnIssueClick={handleIssueClick} />
        </div>
      ) : (
        <span>loading...</span>
      )}
    </section>
  );
};

export default CatalogSection;
