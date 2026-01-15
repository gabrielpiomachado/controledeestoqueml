export interface Product {
  id: string;
  sku: string;
  ean: string;
  category: string;
  cost: number; // Calculated average cost
  stock: number;
  link: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockEntry {
  id: string;
  date: Date;
  sku: string;
  quantity: number;
  cost: number; // Unit cost at time of entry
  createdAt: Date;
}

export interface Sale {
  id: string;
  date: Date;
  marketplace: string;
  sku: string;
  quantity: number;
  salePrice: number;
  platformFee: number;
  shipping: number;
  // Frozen values at time of sale
  costAtSale: number;
  netProfit: number;
  margin: number;
  createdAt: Date;
}

export interface DashboardStats {
  totalInvested: number;
  totalInventoryValue: number;
  totalSales: number;
  totalProfit: number;
  averageMargin: number;
  totalProducts: number;
  lowStockProducts: number;
}

export type Marketplace = 
  | "Mercado Livre"
  | "Shopee"
  | "Amazon"
  | "Magalu"
  | "Americanas"
  | "Outro";

export const MARKETPLACES: Marketplace[] = [
  "Mercado Livre",
  "Shopee",
  "Amazon",
  "Magalu",
  "Americanas",
  "Outro",
];
