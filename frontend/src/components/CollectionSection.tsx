import React, { useState } from 'react';
import { IssueList } from './IssueList';
import { ItemList } from './ItemList';
import { IssueZoom } from './IssueZoom';
import { Location, Issue, ListItem } from '../types';
import closetSpaceComicsApi from '../api/ClosetSpaceComicsApi';

interface CollectionSectionProps {
  Locations: Location[];
  HandleAddLocation: (payload: { description: string }) => Promise<Location | null>;
  HandleEditLocation: (payload: { description: string; itemId?: number }) => void;
  HandleAddBox: (payload: { description: string; locationId: number }) => Promise<ListItem | null>;
  HandleEditBox: (payload: { description: string; itemId?: number; locationId: number }) => void;
  GetAccessToken: () => Promise<string>;
}

export const CollectionSection: React.FC<CollectionSectionProps> = ({
  Locations,
  HandleAddLocation,
  HandleEditLocation,
  HandleAddBox,
  HandleEditBox,
  GetAccessToken,
}) => {
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [activeBox, setActiveBox] = useState<ListItem | null>(null);
  const [boxItemList, setBoxItemList] = useState<Issue[]>([]);
  const [zoomIssue, setZoomIssue] = useState<Issue | null>(null);
  const [zoomIssueList, setZoomIssueList] = useState<Issue[]>([]);

  const getBoxList = async (locationId: number, boxId: number) => {
    const token = await GetAccessToken();
    const response = await closetSpaceComicsApi.get(`/user/collection/location/${locationId}/box/${boxId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const items: Issue[] = (response.data ?? []).map((item: { Id: number; ImageUrl: string | null }) => ({
      id: item.Id,
      imageUrl: item.ImageUrl,
      title: '',
      issueNum: '',
      publisher: '',
      description: null,
      coverPrice: 0,
    }));
    setBoxItemList(items);
  };

  const handleLocationSelection = (location: Location) => {
    setActiveLocation(activeLocation === null || activeLocation.id !== location.id ? location : null);
  };

  const handleAddLocation = async (payload: { description: string }) => {
    const newLocation = await HandleAddLocation(payload);
    setActiveLocation(newLocation);
    return newLocation;
  };

  const handleBoxSelection = (box: ListItem) => {
    if (activeLocation) {
      getBoxList(activeLocation.id, box.id);
    }
    setActiveBox(box);
  };

  const handleAddBox = async (payload: { description: string }) => {
    if (!activeLocation) return null;
    const newBox = await HandleAddBox({ ...payload, locationId: activeLocation.id });
    setActiveBox(newBox);
    return newBox;
  };

  const handleEditBox = (payload: { description: string; itemId?: number }) => {
    if (!activeLocation) return;
    HandleEditBox({ ...payload, locationId: activeLocation.id });
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
    <section id="section-collection">
      <ItemList
        ItemType="location"
        Items={Locations}
        HandleItemSelection={handleLocationSelection}
        HandleAdd={handleAddLocation}
        HandleEdit={HandleEditLocation}
      />
      {activeLocation && (
        <ItemList
          ItemType="box"
          ActiveLocation={activeLocation}
          Items={activeLocation.boxes}
          HandleItemSelection={handleBoxSelection}
          HandleAdd={handleAddBox}
          HandleEdit={handleEditBox}
        />
      )}
      <IssueList Issues={boxItemList} Size="span-1-of-10" ActiveFilters={[]} OnIssueClick={handleIssueClick} />
    </section>
  );
};

export default CollectionSection;
