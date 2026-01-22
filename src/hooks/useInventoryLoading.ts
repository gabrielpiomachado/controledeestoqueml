import { useInventory } from '@/contexts/InventoryContext';

export function useInventoryLoading() {
  const context = useInventory();
  // A propriedade 'loading' pode ser acessada através de uma nova propriedade que vamos adicionar
  return {
    products: context.products,
    stockEntries: context.stockEntries,
    sales: context.sales,
    stats: context.stats,
  };
}
