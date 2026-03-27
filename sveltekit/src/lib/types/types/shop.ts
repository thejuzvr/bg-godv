export interface ShopInventoryItem {
  itemId: string;
  quantity: number;
  pricePerUnit: number;
  listedAt: number;
}

export interface ShopPurchaseDetails {
  cost: number; // стоимость покупки лавки
  maintenanceFee: number; // ежедневная плата
}


