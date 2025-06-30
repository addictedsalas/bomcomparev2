export interface ExcelBomItem {
  itemNumber: string;
  partNumber: string;
  description: string;
  quantity: string;
}

export interface ExcelBomData {
  items: ExcelBomItem[];
}
