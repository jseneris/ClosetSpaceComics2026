import React, { useEffect, useRef, useState } from 'react';
import closetSpaceComicsApi from '../api/ClosetSpaceComicsApi';
import { Issue } from '../types';
import { LatestPurchaseBooks } from './LatestPurchaseBooks';
import { HeaderSection } from './HeaderSection';
import { FooterSection } from './FooterSection';

export const App: React.FC = () => {
  const [books, setBooks] = useState<Issue[]>([]);
  const [title, setTitle] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [isLoadingTitleSuggestions, setIsLoadingTitleSuggestions] = useState(false);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [publishers, setPublishers] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipSuggestionsEffect = useRef(false);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await closetSpaceComicsApi.get('/catalog/collection/filters', {
          params: { title: title || undefined, publisher: publisher || undefined },
        });
        setPublishers(response.data.Publishers ?? []);
        setYears((response.data.Years ?? []).slice().sort((left: number, right: number) => right - left));
      } catch {
        setError('Unable to load collection filters.');
      }
    };

    loadFilters();
  }, [title, publisher]);

  useEffect(() => {
    if (skipSuggestionsEffect.current) {
      skipSuggestionsEffect.current = false;
      return;
    }

    const query = titleDraft.trim();
    if (query.length < 2) {
      setTitleSuggestions([]);
      setIsLoadingTitleSuggestions(false);
      setShowTitleSuggestions(false);
      return;
    }

    setShowTitleSuggestions(true);
    setIsLoadingTitleSuggestions(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await closetSpaceComicsApi.get('/catalog/collection/title-suggestions', {
          params: { q: query },
        });
        setTitleSuggestions((response.data.Titles ?? []).map((suggestion: any) => suggestion.Name));
      } catch {
        setTitleSuggestions([]);
      } finally {
        setIsLoadingTitleSuggestions(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [titleDraft]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(page === 1);
    setIsLoadingMore(page > 1);
    setError(null);

    const loadBooks = async () => {
      try {
        const response = await closetSpaceComicsApi.get('/catalog/collection', {
          params: { page, title, publisher, year: year || undefined },
        });
        const nextBooks = (
          (response.data.Books ?? []).map((book: any) => ({
            id: book.Id,
            imageUrl: book.ImageUrl,
            issueSeoFriendlyName: book.IssueSeoFriendlyName,
            title: book.Title,
            issueNum: book.IssueNum,
            publisher: book.Publisher,
            description: book.Description,
            coverPrice: book.CoverPrice,
          }))
        );
        if (cancelled) return;
        setTotalIssues(response.data.TotalIssues ?? 0);
        setBooks((current) => (page === 1 ? nextBooks : [...current, ...nextBooks]));
        setHasMore(Boolean(response.data.HasMore));
      } catch {
        if (cancelled) return;
        setError('Unable to load the latest purchase.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    };

    loadBooks();
    return () => {
      cancelled = true;
    };
  }, [page, title, publisher, year]);

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setBooks([]);
    setTotalIssues(0);
    setIsLoading(true);
    setPage(1);
    setter(value);
  };

  const applyTitle = (value: string) => {
    skipSuggestionsEffect.current = true;
    setTitleDraft(value);
    const trimmed = value.trim();
    if (trimmed === title) {
      // Value unchanged (e.g. Enter's blur re-firing applyTitle) — skip the redundant requery.
      return;
    }
    updateFilter(setTitle, trimmed);
  };

  const clearFilters = () => {
    setTitleDraft('');
    setTitleSuggestions([]);
    setShowTitleSuggestions(false);
    setBooks([]);
    setTotalIssues(0);
    setIsLoading(true);
    setPage(1);
    setTitle('');
    setPublisher('');
    setYear('');
  };

  useEffect(() => {
    const sentinel = document.getElementById('collection-load-more');
    // Don't observe while the initial/filter-driven page 1 load is still in flight —
    // the sentinel can sit inside the viewport before any books render, which would
    // bump the page prematurely and clear isLoading before real data has arrived.
    if (!sentinel || !hasMore || isLoadingMore || isLoading) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPage((current) => current + 1);
    }, { rootMargin: '0px 0px 300px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading]);

  return (
    <div className="App">
      <HeaderSection />
      <div className="collection-filters">
        <label className="title-filter">
          Title
          <input
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyTitle(titleDraft);
                setTitleSuggestions([]);
                setShowTitleSuggestions(false);
                event.currentTarget.blur();
              }
            }}
            onBlur={() =>
              window.setTimeout(() => {
                applyTitle(titleDraft);
                setTitleSuggestions([]);
                setShowTitleSuggestions(false);
              }, 150)
            }
          />
          {showTitleSuggestions ? (
            <ul className="title-suggestions">
              {isLoadingTitleSuggestions ? (
                <li className="title-suggestions-loading">
                  <span className="spinner" aria-label="Loading suggestions" />
                </li>
              ) : titleSuggestions.length > 0 ? (
                titleSuggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        applyTitle(suggestion);
                        setTitleSuggestions([]);
                        setShowTitleSuggestions(false);
                      }}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))
              ) : (
                <li className="title-suggestions-empty">No matching titles</li>
              )}
            </ul>
          ) : null}
        </label>
        <label>
          Publisher
          <select value={publisher} onChange={(event) => updateFilter(setPublisher, event.target.value)}>
            <option value="">All publishers</option>
            {publishers.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Publication year
          <select value={year} onChange={(event) => updateFilter(setYear, event.target.value)}>
            <option value="">All years</option>
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <button type="button" className="clear-filters" onClick={clearFilters}>
          Clear filters
        </button>
        <p className="collection-count" aria-live="polite">
          {isLoading && page === 1 ? 'Loading issues...' : `${totalIssues.toLocaleString()} issues found`}
        </p>
      </div>
      {isLoading && page === 1 ? (
        <div className="initial-collection-loader" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading collection...</span>
        </div>
      ) : null}
      {error ? <p>{error}</p> : null}
      {!error ? (
        <LatestPurchaseBooks
          Books={books}
          IsLoading={isLoadingMore}
          IsInitialLoading={isLoading && page === 1}
          HasMore={hasMore}
        />
      ) : null}
      <div id="collection-load-more" aria-hidden="true" />
      <FooterSection />
    </div>
  );
};

export default App;
