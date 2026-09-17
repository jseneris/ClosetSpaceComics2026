import React, { useState } from 'react';
import { AddEditModal } from './AddEditModal';
import { ListItem } from '../types';

interface ItemListProps<T extends ListItem> {
  ItemType: string;
  Items: T[];
  ActiveLocation?: ListItem | null;
  HandleItemSelection: (item: T) => void;
  HandleAdd: (payload: { description: string }) => Promise<ListItem | null>;
  HandleEdit: (payload: { description: string; itemId?: number; locationId?: number | null }) => void;
}

export function ItemList<T extends ListItem>({
  ItemType,
  Items,
  ActiveLocation,
  HandleItemSelection,
  HandleAdd,
  HandleEdit,
}: ItemListProps<T>) {
  const [activeItem, setActiveItem] = useState<ListItem | null>(null);

  const handleAdd = async (payload: { description: string }) => {
    const newItem = await HandleAdd(payload);
    setActiveItem(newItem);
  };

  const onItemClick = (item: T) => {
    HandleItemSelection(item);
    setActiveItem(activeItem === null || activeItem.id !== item.id ? item : null);
  };

  return (
    <div className={`row ${ItemType}-list`}>
      <div className="btn-add-edit">
        {activeItem ? (
          <AddEditModal
            Action="edit"
            Item={activeItem}
            LocationId={ActiveLocation ? ActiveLocation.id : null}
            SaveChanges={HandleEdit}
          />
        ) : (
          <AddEditModal Action="add" SaveChanges={handleAdd} />
        )}
      </div>
      <ul>
        {Items.map((item) => (
          <li
            className={`col ${ItemType}-detail ${!activeItem || item.id === activeItem.id ? 'active' : 'inactive'}`}
            key={item.id}
            onClick={() => onItemClick(item)}
          >
            <div>
              <img className={`${ItemType}-image`} src={item.imageUrl ?? undefined} alt={item.name} title={item.name} />
            </div>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ItemList;
