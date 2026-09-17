import React from 'react';
import { Issue } from '../types';

interface IssueListProps {
  Issues: Issue[];
  Size: string;
  ActiveFilters: string[];
  OnIssueClick: (issue: Issue, filteredList: Issue[]) => void;
}

export const IssueList: React.FC<IssueListProps> = ({ Issues, Size, ActiveFilters, OnIssueClick }) => {
  let filteredList = Issues.slice();
  if (ActiveFilters.length > 0) {
    filteredList = filteredList.filter((issue) => ActiveFilters.indexOf(issue.publisher) > -1);
  }

  return (
    <div className="row issue-list">
      {filteredList.map((issue) => (
        <div
          className={`col ${Size} issue`}
          key={issue.id}
          data-key={issue.id}
          onClick={() => OnIssueClick(issue, filteredList)}
        >
          <img src={issue.imageUrl ?? undefined} alt={issue.title} title={issue.title} />
        </div>
      ))}
    </div>
  );
};

export default IssueList;
