import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import closetSpaceComicsApi from '../api/ClosetSpaceComicsApi';
import { Location } from '../types';

export const App: React.FC = () => {
  const {
    isLoading: isAuthLoading,
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
    getAccessTokenSilently,
  } = useAuth0();

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingBoxId, setSavingBoxId] = useState<number | null>(null);
  const [savingLocationId, setSavingLocationId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interceptorId = closetSpaceComicsApi.interceptors.request.use(async (config) => {
      const token = await getAccessTokenSilently();
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return () => closetSpaceComicsApi.interceptors.request.eject(interceptorId);
  }, [isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadLocations = async () => {
      setIsLoadingLocations(true);
      setError(null);
      try {
        const response = await closetSpaceComicsApi.get('/user/collection');
        const nextLocations: Location[] = (response.data.Locations ?? []).map((location: any) => ({
          id: location.Id,
          name: location.Name,
          boxes: (location.Boxes ?? []).map((box: any) => ({
            id: box.Id,
            name: box.Name,
            itemCount: box.ItemCount ?? 0,
            isVisibleInCatalog: Boolean(box.IsVisibleInCatalog),
          })),
        }));
        setLocations(nextLocations);
      } catch {
        setError('Unable to load locations and boxes.');
      } finally {
        setIsLoadingLocations(false);
      }
    };

    loadLocations();
  }, [isAuthenticated]);

  const toggleBoxVisibility = async (boxId: number, isVisibleInCatalog: boolean) => {
    setSavingBoxId(boxId);
    setError(null);
    try {
      await closetSpaceComicsApi.patch(`/user/boxes/${boxId}/visibility`, { isVisibleInCatalog });
      setLocations((current) =>
        current.map((location) => ({
          ...location,
          boxes: location.boxes.map((box) => (box.id === boxId ? { ...box, isVisibleInCatalog } : box)),
        }))
      );
    } catch {
      setError('Unable to update box visibility.');
    } finally {
      setSavingBoxId(null);
    }
  };

  const toggleLocationVisibility = async (location: Location) => {
    const isVisibleInCatalog = !location.boxes.every((box) => box.isVisibleInCatalog);
    setSavingLocationId(location.id);
    setError(null);
    try {
      await Promise.all(
        location.boxes.map((box) =>
          closetSpaceComicsApi.patch(`/user/boxes/${box.id}/visibility`, { isVisibleInCatalog })
        )
      );
      setLocations((current) =>
        current.map((currentLocation) =>
          currentLocation.id === location.id
            ? {
                ...currentLocation,
                boxes: currentLocation.boxes.map((box) => ({ ...box, isVisibleInCatalog })),
              }
            : currentLocation
        )
      );
    } catch {
      setError(`Unable to update visibility for ${location.name}.`);
    } finally {
      setSavingLocationId(null);
    }
  };

  if (isAuthLoading) {
    return <p className="status-message">Loading...</p>;
  }

  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <h1>Closet Space Comics — Admin</h1>
        <button type="button" onClick={() => loginWithRedirect()}>
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="admin-header">
        <h1>Locations &amp; Boxes</h1>
        <div className="admin-user">
          <span>{user?.email ?? user?.name}</span>
          <button type="button" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Log out
          </button>
        </div>
      </header>

      <p className="admin-help">
        Toggle a box to control whether its contents appear on the public catalog site.
      </p>

      {error ? <p className="error-message">{error}</p> : null}

      {isLoadingLocations ? (
        <p className="status-message">Loading locations...</p>
      ) : locations.length === 0 ? (
        <p className="status-message">No locations found.</p>
      ) : (
        locations.map((location) => (
          <section key={location.id} className="location-card">
            <div className="location-heading">
              <h2>{location.name}</h2>
              {location.boxes.length > 0 ? (
                <button
                  type="button"
                  className="location-toggle"
                  disabled={savingLocationId === location.id || savingBoxId !== null}
                  onClick={() => toggleLocationVisibility(location)}
                >
                  {location.boxes.every((box) => box.isVisibleInCatalog) ? 'Unselect all' : 'Select all'}
                </button>
              ) : null}
            </div>
            {location.boxes.length === 0 ? (
              <p className="status-message">No boxes in this location.</p>
            ) : (
              <ul className="box-list">
                {location.boxes.map((box) => (
                  <li key={box.id} className="box-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={box.isVisibleInCatalog}
                        disabled={savingBoxId === box.id || savingLocationId === location.id}
                        onChange={(event) => toggleBoxVisibility(box.id, event.target.checked)}
                      />
                      {box.name} ({box.itemCount.toLocaleString()} {box.itemCount === 1 ? 'item' : 'items'})
                    </label>
                    <span className={`visibility-badge ${box.isVisibleInCatalog ? 'visible' : 'hidden'}`}>
                      {box.isVisibleInCatalog ? 'Shown on catalog' : 'Hidden from catalog'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
};

export default App;
