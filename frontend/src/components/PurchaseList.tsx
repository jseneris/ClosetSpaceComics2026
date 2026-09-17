import React from 'react';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import { Purchase } from '../types';

interface PurchaseListProps {
  Purchases: Purchase[];
}

export const PurchaseList: React.FC<PurchaseListProps> = ({ Purchases }) => {
  return (
    <div className="row purchase-list">
      <div className="btn-add-edit">
        <AddCircleOutline />
      </div>
      <ul>
        {Purchases.map((purchase) => (
          <li className="col purchase-detail" key={purchase.id}>
            <div>
              <img src={purchase.imageUrl ?? undefined} alt={purchase.description} title={purchase.description} />
            </div>
            <span>{purchase.description}</span>
            <span>({purchase.size})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PurchaseList;
