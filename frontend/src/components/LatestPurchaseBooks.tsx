import React, { useEffect, useState } from 'react';
import { Issue } from '../types';

interface LatestPurchaseBooksProps {
  Books: Issue[];
  IsLoading: boolean;
  IsInitialLoading: boolean;
  HasMore: boolean;
}

const BookImage: React.FC<{ book: Issue }> = ({ book }) => {
  const hasCoverUrl = Boolean(book.imageUrl);
  const [isLoaded, setIsLoaded] = useState(!hasCoverUrl);
  const [imageSource, setImageSource] = useState(book.imageUrl ?? '/no-image.svg');

  useEffect(() => {
    setIsLoaded(!book.imageUrl);
    setImageSource(book.imageUrl ?? '/no-image.svg');
  }, [book.imageUrl]);

  return (
    <div className="book-image">
      {!isLoaded ? <span className="cover-loading-spinner loading-spinner" aria-label="Loading cover" /> : null}
      <img
        src={imageSource}
        alt={`${book.title} #${book.issueNum}`}
        title={book.title}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setImageSource('/no-image.svg');
          setIsLoaded(true);
        }}
      />
    </div>
  );
};

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
            <BookImage book={book} />
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