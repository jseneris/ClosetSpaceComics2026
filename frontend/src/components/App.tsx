import React, { useEffect, useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import closetSpaceComicsApi from '../api/ClosetSpaceComicsApi';
import { HeaderSection } from './HeaderSection';
import { CatalogSection } from './CatalogSection';
import { CollectionSection } from './CollectionSection';
import { PurchasesSection } from './PurchasesSection';
import { AboutUsSection } from './AboutUsSection';
import { FooterSection } from './FooterSection';
import { Filter, Issue, Location, PurchasesState, ListItem } from '../types';

export const App: React.FC = () => {
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const [filters, setFilters] = useState<Filter[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [purchases, setPurchases] = useState<PurchasesState>({ totalPages: 0, purchases: [] });

  const getAccessToken = useCallback(async (): Promise<string> => {
    if (!isAuthenticated) {
      await loginWithRedirect();
      return '';
    }
    const token = await getAccessTokenSilently();
    return token ?? '';
  }, [isAuthenticated, loginWithRedirect, getAccessTokenSilently]);

  const authHeaders = useCallback(async () => {
    const token = await getAccessToken();
    return { Authorization: `Bearer ${token}` };
  }, [getAccessToken]);

  const handleSearchByDate = useCallback(async (searchDate: string) => {
    const response = await closetSpaceComicsApi.get('/catalog/issues', { params: { date: searchDate } });

    const issueList: Issue[] = (response.data.Issues ?? []).map((issue: any) => ({
      id: issue.Id,
      imageUrl: issue.ImageUrl,
      title: issue.Title,
      issueNum: issue.IssueNum,
      publisher: issue.Publisher,
      description: issue.Description,
      coverPrice: issue.CoverPrice,
    }));

    const filterList: Filter[] = (response.data.Filters ?? []).map((filter: any) => ({
      publisher: filter.Name,
      imageUrl: filter.ImageUrl,
    }));

    setFilters(filterList);
    setIssues(issueList);
  }, []);

  const getCollections = useCallback(async () => {
    if (!isAuthenticated) return;
    const headers = await authHeaders();
    const response = await closetSpaceComicsApi.get('/user/collection', { headers });

    const locationList: Location[] = (response.data.Locations ?? []).map((location: any) => ({
      id: location.Id,
      name: location.Name,
      imageUrl: location.ImageUrl,
      boxes: (location.Boxes ?? []).map((box: any) => ({ id: box.Id, name: box.Name, imageUrl: box.ImageUrl })),
    }));

    setLocations(locationList);
  }, [isAuthenticated, authHeaders]);

  const getPurchases = useCallback(
    async (page: number) => {
      if (!isAuthenticated) return;
      const headers = await authHeaders();
      const response = await closetSpaceComicsApi.get('/user/purchases', { params: { page }, headers });

      setPurchases({
        totalPages: response.data.TotalPages,
        purchases: (response.data.Purchases ?? []).map((purchase: any) => ({
          id: purchase.Id,
          description: purchase.Description,
          purchaseDate: purchase.PurchaseDate,
          price: purchase.Price,
          imageUrl: purchase.ImageUrl,
        })),
      });
    },
    [isAuthenticated, authHeaders]
  );

  useEffect(() => {
    handleSearchByDate(new Date().toISOString().substring(0, 10));
    getCollections();
    getPurchases(1);
  }, [handleSearchByDate, getCollections, getPurchases]);

  const handleAddLocation = async (payload: { description: string }): Promise<Location | null> => {
    const headers = await authHeaders();
    const response = await closetSpaceComicsApi.post('/user/locations', { name: payload.description }, { headers });
    if (!response.data) return null;

    const newLocation: Location = {
      id: response.data.Id,
      name: response.data.Name,
      boxes: [],
    };
    setLocations((prev) => [newLocation, ...prev]);
    return newLocation;
  };

  const handleEditLocation = async (payload: { description: string; itemId?: number }) => {
    const headers = await authHeaders();
    await closetSpaceComicsApi.post(`/user/locations/${payload.itemId}`, { name: payload.description }, { headers });
    setLocations((prev) =>
      prev.map((location) =>
        location.id === payload.itemId ? { ...location, name: payload.description } : location
      )
    );
  };

  const handleAddBox = async (payload: { description: string; locationId: number }): Promise<ListItem | null> => {
    const headers = await authHeaders();
    const response = await closetSpaceComicsApi.post(
      `/user/locations/${payload.locationId}/boxes`,
      { name: payload.description },
      { headers }
    );
    if (!response.data) return null;

    const newBox: ListItem = { id: response.data.Id, name: response.data.Name };
    setLocations((prev) =>
      prev.map((location) =>
        location.id === payload.locationId ? { ...location, boxes: [newBox, ...location.boxes] } : location
      )
    );
    return newBox;
  };

  const handleEditBox = async (payload: { description: string; itemId?: number; locationId: number }) => {
    const headers = await authHeaders();
    await closetSpaceComicsApi.post(
      `/user/locations/${payload.locationId}/boxes/${payload.itemId}`,
      { name: payload.description },
      { headers }
    );
    setLocations((prev) =>
      prev.map((location) => {
        if (location.id !== payload.locationId) return location;
        return {
          ...location,
          boxes: location.boxes.map((box) =>
            box.id === payload.itemId ? { ...box, name: payload.description } : box
          ),
        };
      })
    );
  };

  return (
    <div className="App">
      <HeaderSection />
      <a id="section-catalog-anchor"></a>
      <CatalogSection Filters={filters} Issues={issues} HandleDateChange={handleSearchByDate} />
      <a id="section-collection-anchor"></a>
      <CollectionSection
        Locations={locations}
        HandleAddLocation={handleAddLocation}
        HandleEditLocation={handleEditLocation}
        HandleAddBox={handleAddBox}
        HandleEditBox={handleEditBox}
        GetAccessToken={getAccessToken}
      />
      <a id="section-purchases-anchor"></a>
      <PurchasesSection Purchases={purchases} />
      <a id="section-about-us-anchor"></a>
      <AboutUsSection />
      <FooterSection />
    </div>
  );
};

export default App;
