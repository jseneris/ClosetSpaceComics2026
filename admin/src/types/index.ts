export interface Box {
  id: number;
  name: string;
  itemCount: number;
  isVisibleInCatalog: boolean;
}

export interface Location {
  id: number;
  name: string;
  boxes: Box[];
}
