import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Product, StockEntry, Sale, DashboardStats } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";

interface InventoryContextType {
  products: Product[];
  stockEntries: StockEntry[];
  sales: Sale[];
  stats: DashboardStats;
  
  // Product operations
  addProduct: (product: Omit<Product, "id" | "stock" | "createdAt" | "updatedAt">) => boolean;
  updateProduct: (id: string, updates: Partial<Omit<Product, "id" | "stock" | "createdAt" | "updatedAt">>) => boolean;
  deleteProduct: (id: string) => boolean;
  getProductBySku: (sku: string) => Product | undefined;
  
  // Stock operations
  addStockEntry: (entry: Omit<StockEntry, "id" | "createdAt">) => boolean;
  deleteStockEntry: (id: string) => boolean;
  
  // Sale operations
  addSale: (sale: Omit<Sale, "id" | "costAtSale" | "netProfit" | "margin" | "createdAt">) => { success: boolean; error?: string };
  deleteSale: (id: string) => boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  products: "inventory_products",
  stockEntries: "inventory_stock_entries",
  sales: "inventory_sales",
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateNetProfit(
  salePrice: number,
  cost: number,
  quantity: number,
  platformFee: number,
  shipping: number
): number {
  return (salePrice - cost) * quantity - platformFee - shipping;
}

function calculateMargin(netProfit: number, salePrice: number, quantity: number): number {
  const totalRevenue = salePrice * quantity;
  if (totalRevenue === 0) return 0;
  return netProfit / totalRevenue;
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.products);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((p: Product) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
    }
    return [];
  });
  
  const [stockEntries, setStockEntries] = useState<StockEntry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.stockEntries);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((e: StockEntry) => ({
        ...e,
        date: new Date(e.date),
        createdAt: new Date(e.createdAt),
      }));
    }
    return [];
  });
  
  const [sales, setSales] = useState<Sale[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.sales);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((s: Sale) => ({
        ...s,
        date: new Date(s.date),
        createdAt: new Date(s.createdAt),
      }));
    }
    return [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }, [products]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stockEntries, JSON.stringify(stockEntries));
  }, [stockEntries]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));
  }, [sales]);

  // Calculate stats
  const stats: DashboardStats = React.useMemo(() => {
    const totalInventoryValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
    const totalSales = sales.reduce((sum, s) => sum + s.salePrice * s.quantity, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.netProfit, 0);
    const averageMargin = sales.length > 0
      ? sales.reduce((sum, s) => sum + s.margin, 0) / sales.length
      : 0;
    const lowStockProducts = products.filter(p => p.stock <= 5).length;
    
    return {
      totalInventoryValue,
      totalSales,
      totalProfit,
      averageMargin,
      totalProducts: products.length,
      lowStockProducts,
    };
  }, [products, sales]);

  const getProductBySku = useCallback((sku: string) => {
    return products.find(p => p.sku === sku);
  }, [products]);

  const addProduct = useCallback((product: Omit<Product, "id" | "stock" | "createdAt" | "updatedAt">): boolean => {
    // Validate SKU uniqueness
    if (products.some(p => p.sku === product.sku)) {
      toast({
        title: "Erro",
        description: "SKU já existe no sistema",
        variant: "destructive",
      });
      return false;
    }
    
    const newProduct: Product = {
      ...product,
      id: generateId(),
      stock: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setProducts(prev => [...prev, newProduct]);
    toast({
      title: "Sucesso",
      description: "Produto cadastrado com sucesso",
    });
    return true;
  }, [products, toast]);

  const updateProduct = useCallback((id: string, updates: Partial<Omit<Product, "id" | "stock" | "createdAt" | "updatedAt">>): boolean => {
    // Check SKU uniqueness if updating SKU
    if (updates.sku) {
      const existingWithSku = products.find(p => p.sku === updates.sku && p.id !== id);
      if (existingWithSku) {
        toast({
          title: "Erro",
          description: "SKU já existe no sistema",
          variant: "destructive",
        });
        return false;
      }
    }
    
    setProducts(prev => prev.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date() }
        : p
    ));
    toast({
      title: "Sucesso",
      description: "Produto atualizado com sucesso",
    });
    return true;
  }, [products, toast]);

  const deleteProduct = useCallback((id: string): boolean => {
    const product = products.find(p => p.id === id);
    if (!product) return false;
    
    // Check if product has stock entries or sales
    const hasEntries = stockEntries.some(e => e.sku === product.sku);
    const hasSales = sales.some(s => s.sku === product.sku);
    
    if (hasEntries || hasSales) {
      toast({
        title: "Erro",
        description: "Não é possível excluir produto com histórico de movimentações",
        variant: "destructive",
      });
      return false;
    }
    
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Sucesso",
      description: "Produto excluído com sucesso",
    });
    return true;
  }, [products, stockEntries, sales, toast]);

  const addStockEntry = useCallback((entry: Omit<StockEntry, "id" | "createdAt">): boolean => {
    if (entry.quantity <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade deve ser maior que zero",
        variant: "destructive",
      });
      return false;
    }
    
    const product = products.find(p => p.sku === entry.sku);
    if (!product) {
      toast({
        title: "Erro",
        description: "Produto não encontrado",
        variant: "destructive",
      });
      return false;
    }
    
    const newEntry: StockEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date(),
    };
    
    setStockEntries(prev => [...prev, newEntry]);
    
    // Update product stock
    setProducts(prev => prev.map(p => 
      p.sku === entry.sku
        ? { ...p, stock: p.stock + entry.quantity, updatedAt: new Date() }
        : p
    ));
    
    toast({
      title: "Sucesso",
      description: `${entry.quantity} unidades adicionadas ao estoque`,
    });
    return true;
  }, [products, toast]);

  const deleteStockEntry = useCallback((id: string): boolean => {
    const entry = stockEntries.find(e => e.id === id);
    if (!entry) {
      toast({
        title: "Erro",
        description: "Entrada não encontrada",
        variant: "destructive",
      });
      return false;
    }
    
    const product = products.find(p => p.sku === entry.sku);
    if (product && product.stock < entry.quantity) {
      toast({
        title: "Erro",
        description: `Não é possível excluir. O estoque atual (${product.stock}) é menor que a quantidade da entrada (${entry.quantity})`,
        variant: "destructive",
      });
      return false;
    }
    
    // Remove entry
    setStockEntries(prev => prev.filter(e => e.id !== id));
    
    // Update product stock
    if (product) {
      setProducts(prev => prev.map(p => 
        p.sku === entry.sku
          ? { ...p, stock: p.stock - entry.quantity, updatedAt: new Date() }
          : p
      ));
    }
    
    toast({
      title: "Sucesso",
      description: "Entrada de estoque excluída",
    });
    return true;
  }, [stockEntries, products, toast]);

  const addSale = useCallback((sale: Omit<Sale, "id" | "costAtSale" | "netProfit" | "margin" | "createdAt">): { success: boolean; error?: string } => {
    if (sale.quantity <= 0) {
      return { success: false, error: "Quantidade deve ser maior que zero" };
    }
    
    const product = products.find(p => p.sku === sale.sku);
    if (!product) {
      return { success: false, error: "Produto não encontrado" };
    }
    
    if (product.stock < sale.quantity) {
      return { 
        success: false, 
        error: `Estoque insuficiente. Disponível: ${product.stock} unidades` 
      };
    }
    
    const costAtSale = product.cost;
    const netProfit = calculateNetProfit(
      sale.salePrice,
      costAtSale,
      sale.quantity,
      sale.platformFee,
      sale.shipping
    );
    const margin = calculateMargin(netProfit, sale.salePrice, sale.quantity);
    
    const newSale: Sale = {
      ...sale,
      id: generateId(),
      costAtSale,
      netProfit,
      margin,
      createdAt: new Date(),
    };
    
    setSales(prev => [...prev, newSale]);
    
    // Update product stock
    setProducts(prev => prev.map(p => 
      p.sku === sale.sku
        ? { ...p, stock: p.stock - sale.quantity, updatedAt: new Date() }
        : p
    ));
    
    toast({
      title: "Sucesso",
      description: "Venda registrada com sucesso",
    });
    return { success: true };
  }, [products, toast]);

  const deleteSale = useCallback((id: string): boolean => {
    const sale = sales.find(s => s.id === id);
    if (!sale) {
      toast({
        title: "Erro",
        description: "Venda não encontrada",
        variant: "destructive",
      });
      return false;
    }
    
    // Remove sale
    setSales(prev => prev.filter(s => s.id !== id));
    
    // Restore product stock
    setProducts(prev => prev.map(p => 
      p.sku === sale.sku
        ? { ...p, stock: p.stock + sale.quantity, updatedAt: new Date() }
        : p
    ));
    
    toast({
      title: "Sucesso",
      description: "Venda excluída e estoque restaurado",
    });
    return true;
  }, [sales, toast]);

  return (
    <InventoryContext.Provider
      value={{
        products,
        stockEntries,
        sales,
        stats,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductBySku,
        addStockEntry,
        deleteStockEntry,
        addSale,
        deleteSale,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
