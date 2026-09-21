export interface Filter {
  publisher: string;
  imageUrl?: string | null;
}

export interface Issue {
  id: number;
  imageUrl: string | null;
  issueSeoFriendlyName?: string | null;
  title: string;
  issueNum: string;
  publisher: string;
  description: string | null;
  coverPrice: number;
}

export interface Box {
  id: number;
  name: string;
  imageUrl?: string | null;
}

export interface Location {
  id: number;
  name: string;
  imageUrl?: string | null;
  boxes: Box[];
}

export interface Purchase {
  id: number;
  description: string;
  purchaseDate: string;
  price: number;
  size?: string;
  imageUrl?: string | null;
}

export interface PurchasesState {
  totalPages: number;
  purchases: Purchase[];
}

export interface ListItem {
  id: number;
  name: string;
  imageUrl?: string | null;
}
