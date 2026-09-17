import React from 'react';
import { PurchaseList } from './PurchaseList';
import { PurchasesState } from '../types';

interface PurchasesSectionProps {
  Purchases: PurchasesState;
}

export const PurchasesSection: React.FC<PurchasesSectionProps> = ({ Purchases }) => {
  return (
    <section id="section-purchases">
      <PurchaseList Purchases={Purchases.purchases} />
    </section>
  );
};

export default PurchasesSection;
