import React from 'react';
import { Issue } from '../types';

interface LatestPurchaseBooksProps {
  Books: Issue[];
  IsLoading: boolean;
  IsInitialLoading: boolean;
  HasMore: boolean;
}

export const LatestPurchaseBooks: React.FC<LatestPurchaseBooksProps> = ({
  Books,
  IsLoading,
  IsInitialLoading,
  HasMore,
}) => {
  if (IsInitialLoading) {
    return null;
  }

  if (Books.length === 0) {
    return <p>No books were found.</p>;
  }

  return (
    <main className="latest-purchase-books">
      <div className="row issue-list">
        {Books.map((book) => (
          <article className="col span-1-of-5 issue" key={book.id}>
            <div className="book-image">
              <img
                src={book.imageUrl ?? '/no-image.svg'}
                alt={`${book.title} #${book.issueNum}`}
                title={book.title}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = '/no-image.svg';
                }}
              />
            </div>
            <p className="book-label">
              <span>{book.title}</span>
              <span>{book.issueSeoFriendlyName ?? `#${book.issueNum}`}</span>
            </p>
          </article>
        ))}
      </div>
      {IsLoading && HasMore ? (
        <div className="infinite-scroll-loader" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading more issues...</span>
        </div>
      ) : null}
    </main>
  );
};

export default LatestPurchaseBooks;