import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Product, StockEntry, Sale, DashboardStats } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import * as firestoreService from "@/services/firestoreService";

interface InventoryContextType {
  products: Product[];
  stockEntries: StockEntry[];
  sales: Sale[];
  stats: DashboardStats;
  loading: boolean;
  
  // Product operations
  addProduct: (product: Omit<Product, "id" | "stock" | "cost" | "createdAt" | "updatedAt">) => boolean;
  updateProduct: (id: string, updates: Partial<Omit<Product, "id" | "stock" | "cost" | "createdAt" | "updatedAt">>) => boolean;
  deleteProduct: (id: string) => boolean;
  getProductBySku: (sku: string) => Product | undefined;
  
  // Stock operations
  addStockEntry: (entry: Omit<StockEntry, "id" | "createdAt">) => boolean;
  deleteStockEntry: (id: string) => boolean;
  
  // Sale operations
  addSale: (sale: Omit<Sale, "id" | "costAtSale" | "netProfit" | "margin" | "createdAt"> & { additionalCost?: number }) => { success: boolean; error?: string };
  deleteSale: (id: string) => boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateNetProfit(
  salePrice: number,
  cost: number,
  quantity: number,
  platformFee: number,
  shipping: number,
  additionalCost: number
): number {
  return (salePrice - cost) * quantity - platformFee - shipping - additionalCost;
}

function calculateMargin(netProfit: number, salePrice: number, quantity: number): number {
  const totalRevenue = salePrice * quantity;
  if (totalRevenue === 0) return 0;
  return netProfit / totalRevenue;
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data from Firestore only when user is authenticated and ready
  useEffect(() => {
    // Only proceed if user is fully authenticated
    if (!user || !user.uid) {
      setProducts([]);
      setStockEntries([]);
      setSales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let mounted = true;

    try {
      // Subscribe to real-time updates using user.uid
      const unsubscribeProducts = firestoreService.subscribeToUserProducts(
        user.uid,
        (products) => {
          if (mounted) {
            setProducts(products);
          }
        },
        (error) => {
          if (mounted) {
            console.error('Erro ao carregar produtos:', error);
            toast({
              title: "Erro",
              description: "Falha ao carregar produtos: " + error.message,
              variant: "destructive",
            });
          }
        }
      );

      const unsubscribeStockEntries = firestoreService.subscribeToUserStockEntries(
        user.uid,
        (stockEntries) => {
          if (mounted) {
            setStockEntries(stockEntries);
          }
        },
        (error) => {
          if (mounted) {
            console.error('Erro ao carregar entradas de estoque:', error);
          }
        }
      );

      const unsubscribeSales = firestoreService.subscribeToUserSales(
        user.uid,
        (sales) => {
          if (mounted) {
            setSales(sales);
            setLoading(false);
          }
        },
        (error) => {
          if (mounted) {
            console.error('Erro ao carregar vendas:', error);
            setLoading(false);
          }
        }
      );

      // Cleanup subscriptions on unmount or user change
      return () => {
        mounted = false;
        unsubscribeProducts();
        unsubscribeStockEntries();
        unsubscribeSales();
      };
    } catch (error) {
      if (mounted) {
        console.error('Erro ao subscrever dados:', error);
        setLoading(false);
      }
    }
  }, [user?.uid, toast]); // Use user?.uid para detectar mudanças reais

  // Calculate stats
  const stats: DashboardStats = React.useMemo(() => {
    // Total invested = sum of (cost * quantity) for all stock entries
    const totalInvested = stockEntries.reduce((sum, entry) => {
      return sum + entry.cost * entry.quantity;
    }, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
    const totalSales = sales.reduce((sum, s) => sum + s.salePrice * s.quantity, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.netProfit, 0);
    const averageMargin = sales.length > 0
      ? sales.reduce((sum, s) => sum + s.margin, 0) / sales.length
      : 0;
    const lowStockProducts = products.filter(p => p.stock <= 5).length;
    
    return {
      totalInvested,
      totalInventoryValue,
      totalSales,
      totalProfit,
      averageMargin,
      totalProducts: products.length,
      lowStockProducts,
    };
  }, [products, stockEntries, sales]);

  const getProductBySku = useCallback((sku: string) => {
    return products.find(p => p.sku === sku);
  }, [products]);

  const addProduct = useCallback((product: Omit<Product, "id" | "stock" | "cost" | "createdAt" | "updatedAt">): boolean => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    // Validate SKU uniqueness
    if (products.some(p => p.sku === product.sku)) {
      toast({
        title: "Erro",
        description: "SKU já existe no sistema",
        variant: "destructive",
      });
      return false;
    }
    
    firestoreService.addProduct(user.uid, product)
      .then(id => {
        const newProduct: Product = {
          ...product,
          id,
          stock: 0,
          cost: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setProducts(prev => [...prev, newProduct]);
        toast({
          title: "Sucesso",
          description: "Produto cadastrado com sucesso",
        });
      })
      .catch(err => {
        console.error(err);
        toast({
          title: "Erro",
          description: "Falha ao cadastrar produto",
          variant: "destructive",
        });
      });
    
    return true;
  }, [user, products, toast]);

  const updateProduct = useCallback((id: string, updates: Partial<Omit<Product, "id" | "stock" | "cost" | "createdAt" | "updatedAt">>): boolean => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

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
    
    firestoreService.updateProduct(user.uid, id, updates)
      .then(() => {
        setProducts(prev => prev.map(p => 
          p.id === id 
            ? { ...p, ...updates, updatedAt: new Date() }
            : p
        ));
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso",
        });
      })
      .catch(err => {
        console.error(err);
        toast({
          title: "Erro",
          description: "Falha ao atualizar produto",
          variant: "destructive",
        });
      });

    return true;
  }, [user, products, toast]);

  const deleteProduct = useCallback((id: string): boolean => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

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
    
    firestoreService.deleteProduct(user.uid, id)
      .then(() => {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast({
          title: "Sucesso",
          description: "Produto excluído com sucesso",
        });
      })
      .catch(err => {
        console.error(err);
        toast({
          title: "Erro",
          description: "Falha ao excluir produto",
          variant: "destructive",
        });
      });

    return true;
  }, [user, products, stockEntries, sales, toast]);

  const addStockEntry = useCallback((entry: Omit<StockEntry, "id" | "createdAt">): boolean => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

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
    
    firestoreService.addStockEntry(user.uid, entry)
      .then(id => {
        const newEntry: StockEntry = {
          ...entry,
          id,
          createdAt: new Date(),
        };
        
        setStockEntries(prev => [...prev, newEntry]);
        
        // Calculate new weighted average cost
        const currentTotalValue = product.cost * product.stock;
        const newTotalValue = entry.cost * entry.quantity;
        const newTotalStock = product.stock + entry.quantity;
        const newAverageCost = newTotalStock > 0 
          ? (currentTotalValue + newTotalValue) / newTotalStock 
          : 0;
        
        firestoreService.updateProduct(user.uid, product.id, {
          stock: newTotalStock,
          cost: newAverageCost,
        })
          .then(() => {
            setProducts(prev => prev.map(p => 
              p.sku === entry.sku
                ? { ...p, stock: newTotalStock, cost: newAverageCost, updatedAt: new Date() }
                : p
            ));
            toast({
              title: "Sucesso",
              description: `${entry.quantity} unidades adicionadas ao estoque`,
            });
          })
          .catch(err => {
            console.error(err);
            toast({
              title: "Erro",
              description: "Falha ao atualizar estoque",
              variant: "destructive",
            });
          });
      })
      .catch(err => {
        console.error(err);
        toast({
          title: "Erro",
          description: "Falha ao adicionar entrada de estoque",
          variant: "destructive",
        });
      });
    
    return true;
  }, [user, products, toast]);

  const deleteStockEntry = useCallback((id: string): boolean => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

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
    
    firestoreService.deleteStockEntry(user.uid, id)
      .then(() => {
        setStockEntries(prev => prev.filter(e => e.id !== id));
        
        // Recalculate average cost from remaining entries
        if (product) {
          const remainingEntries = stockEntries.filter(e => e.sku === entry.sku && e.id !== id);
          const totalRemainingValue = remainingEntries.reduce((sum, e) => sum + e.cost * e.quantity, 0);
          const totalRemainingQuantity = remainingEntries.reduce((sum, e) => sum + e.quantity, 0);
          
          // Subtract sold quantities to get remaining stock
          const soldQuantity = sales
            .filter(s => s.sku === entry.sku)
            .reduce((sum, s) => sum + s.quantity, 0);
          
          const newStock = product.stock - entry.quantity;
          const newAverageCost = totalRemainingQuantity > soldQuantity 
            ? totalRemainingValue / totalRemainingQuantity
            : 0;
          
          firestoreService.updateProduct(user.uid, product.id, {
            stock: newStock,
            cost: newAverageCost,
          })
            .then(() => {
              setProducts(prev => prev.map(p => 
                p.sku === entry.sku
                  ? { ...p, stock: newStock, cost: newAverageCost, updatedAt: new Date() }
                  : p
              ));
              toast({
                title: "Sucesso",
                description: "Entrada de estoque excluída",
              });
            })
            .catch(err => {
              console.error(err);
              toast({
                title: "Erro",
                description: "Falha ao atualizar estoque",
                variant: "destructive",
              });
            });
        }
      })
      .catch(err => {
        console.error(err);
        toast({
          title: "Erro",
          description: "Falha ao excluir entrada de estoque",
          variant: "destructive",
        });
      });
    
    return true;
  }, [user, stockEntries, products, sales, toast]);

  const addSale = useCallback((sale: Omit<Sale, "id" | "costAtSale" | "netProfit" | "margin" | "createdAt">): { success: boolean; error?: string } => {
    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

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
    const additionalCost = (sale as any).additionalCost || 0;
    const netProfit = calculateNetProfit(
      sale.salePrice,
      costAtSale,
      sale.quantity,
      sale.platformFee,
      sale.shipping,
      additionalCost
    );
    const margin = calculateMargin(netProfit, sale.salePrice, sale.quantity);
    
    const saleWithCalculations: Omit<Sale, "id" | "createdAt"> = {
      ...sale,
      costAtSale,
      additionalCost,
      netProfit,
      margin,
    };

    firestoreService.addSale(user.uid, saleWithCalculations)
      .then(id => {
        const newSale: Sale = {
          ...saleWithCalculations,
          id,
          createdAt: new Date(),
        };
        
        setSales(prev => [...prev, newSale]);
        
        // Update product stock
        firestoreService.updateProduct(user.uid, product.id, {
          stock: product.stock - sale.quantity,
        })
          .then(() => {
            setProducts(prev => prev.map(p => 
              p.sku === sale.sku
                ? { ...p, stock: p.stock - sale.quantity, updatedAt: new Date() }
                : p
            ));
            toast({
              title: "Sucesso",
              description: "Venda registrada com sucesso",
            });
          })
          .catch(err => {
            console.error(err);
            toast({
              title: "Erro",
              description: "Falha ao atualizar estoque",
              variant: "destructive",
            });
          });
      })
      .catch(err => {
        console.error(err);
        toast({
          title: "Erro",
          description: "Falha ao registrar venda",
          variant: "destructive",
        });
      });
    
    return { success: true };
  }, [user, products, toast]);

  const deleteSale = useCallback((id: string): boolean => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    const sale = sales.find(s => s.id === id);
    if (!sale) {
      toast({
        title: "Erro",
        description: "Venda não encontrada",
        variant: "destructive",
      });
      return false;
    }
    
    firestoreService.deleteSale(user.uid, id)
      .then(() => {
        setSales(prev => prev.filter(s => s.id !== id));
        
        // Restore product stock
        const product = products.find(p => p.sku === sale.sku);
        if (product) {
          firestoreService.updateProduct(
            user.uid,
            product.id,
            { stock: product.stock + sale.quantity }
          )
          .then(() => {
              setProducts(prev => prev.map(p => 
                p.sku === sale.sku
                  ? { ...p, stock: p.stock + sale.quantity, updatedAt: new Date() }
                  : p
              ));
              toast({
                title: "Sucesso",
                description: "Venda excluída e estoque restaurado",
              });
            })
            .catch(err => {
              console.error(err);
              toast({
                title: "Erro",
                description: "Falha ao restaurar estoque",
                variant: "destructive",
              });
            });
        }
              variant: "destructive",
            });
          });
      })
      .catch(err => {
        console.error(err);
        toast({
          title: "Erro",
          description: "Falha ao excluir venda",
          variant: "destructive",
        });
      });
    
    return true;
  }, [user, sales, products, toast]);

  return (
    <InventoryContext.Provider
      value={{
        products,
        stockEntries,
        sales,
        stats,
        loading,
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
