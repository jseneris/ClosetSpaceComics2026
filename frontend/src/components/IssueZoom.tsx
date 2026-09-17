import React, { useState } from 'react';
import CancelRounded from '@mui/icons-material/CancelRounded';
import { Issue } from '../types';

interface IssueZoomProps {
  Issue: Issue;
  IssueList: Issue[];
  OnCloseZoomClick: () => void;
}

export const IssueZoom: React.FC<IssueZoomProps> = ({ Issue, IssueList, OnCloseZoomClick }) => {
  const [activeIssue, setActiveIssue] = useState<Issue>(Issue);

  return (
    <div id="zoom">
      <div className="btn-add-edit" onClick={OnCloseZoomClick}>
        <CancelRounded />
      </div>
      <div className="zoom-header">
        <h2>{`${activeIssue.title} #${activeIssue.issueNum}`}</h2>
      </div>
      <div className="row zoom-body">
        <div className="col span-1-of-2 cover">
          <img src={activeIssue.imageUrl ?? undefined} alt={activeIssue.title} />
        </div>
        <div className="col span-1-of-2 description">
          <div>{activeIssue.description}</div>
          <div className="addToCollection">
            <a className="btn">Add To Collection</a>
          </div>
        </div>
      </div>
      <div className="row horizontal-list">
        <ul>
          {IssueList.map((issue) => (
            <li className="issue" key={issue.id} onClick={() => setActiveIssue(issue)}>
              <img src={issue.imageUrl ?? undefined} alt={issue.title} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default IssueZoom;
