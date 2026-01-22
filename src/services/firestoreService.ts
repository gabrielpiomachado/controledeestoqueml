import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  doc,
  Timestamp,
  WriteBatch,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, StockEntry, Sale } from '@/types/inventory';

// Collection names
const COLLECTIONS = {
  PRODUCTS: 'products',
  STOCK_ENTRIES: 'stockEntries',
  SALES: 'sales',
};

// Helper to get user-specific collection path
function getUserProductsPath(userId: string): string {
  return `users/${userId}/products`;
}

function getUserStockEntriesPath(userId: string): string {
  return `users/${userId}/stockEntries`;
}

function getUserSalesPath(userId: string): string {
  return `users/${userId}/sales`;
}

// ============ PRODUCTS ============

export async function loadUserProducts(userId: string): Promise<Product[]> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    const snapshot = await getDocs(collection(db, getUserProductsPath(userId)));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Product;
    });
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    throw error;
  }
}

export async function addProduct(
  userId: string,
  product: Omit<Product, 'id' | 'stock' | 'cost' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    const docRef = await addDoc(collection(db, getUserProductsPath(userId)), {
      ...product,
      stock: 0,
      cost: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    throw error;
  }
}

export async function updateProduct(
  userId: string,
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'stock' | 'cost' | 'createdAt'>>
): Promise<void> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    await updateDoc(doc(db, getUserProductsPath(userId), productId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    throw error;
  }
}

export async function deleteProduct(userId: string, productId: string): Promise<void> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    await deleteDoc(doc(db, getUserProductsPath(userId), productId));
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    throw error;
  }
}

// ============ STOCK ENTRIES ============

export async function loadUserStockEntries(userId: string): Promise<StockEntry[]> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    const snapshot = await getDocs(collection(db, getUserStockEntriesPath(userId)));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as StockEntry;
    });
  } catch (error) {
    console.error('Erro ao carregar entradas de estoque:', error);
    throw error;
  }
}

export async function addStockEntry(
  userId: string,
  entry: Omit<StockEntry, 'id' | 'createdAt'>
): Promise<string> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    const docRef = await addDoc(collection(db, getUserStockEntriesPath(userId)), {
      ...entry,
      date: Timestamp.fromDate(entry.date),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar entrada de estoque:', error);
    throw error;
  }
}

export async function deleteStockEntry(userId: string, entryId: string): Promise<void> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    await deleteDoc(doc(db, getUserStockEntriesPath(userId), entryId));
  } catch (error) {
    console.error('Erro ao deletar entrada de estoque:', error);
    throw error;
  }
}

// ============ SALES ============

export async function loadUserSales(userId: string): Promise<Sale[]> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    const snapshot = await getDocs(collection(db, getUserSalesPath(userId)));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        date: data.date?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Sale;
    });
  } catch (error) {
    console.error('Erro ao carregar vendas:', error);
    throw error;
  }
}

export async function addSale(
  userId: string,
  sale: Omit<Sale, 'id' | 'createdAt'>
): Promise<string> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    const docRef = await addDoc(collection(db, getUserSalesPath(userId)), {
      ...sale,
      date: Timestamp.fromDate(sale.date),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar venda:', error);
    throw error;
  }
}

export async function deleteSale(userId: string, saleId: string): Promise<void> {
  if (!userId) throw new Error('userId é obrigatório');
  
  try {
    await deleteDoc(doc(db, getUserSalesPath(userId), saleId));
  } catch (error) {
    console.error('Erro ao deletar venda:', error);
    throw error;
  }
}

// ============ BATCH OPERATIONS ============

export async function updateProductAndStockBatch(
  productId: string,
  productUpdates: Partial<Product>,
  batch: WriteBatch
): Promise<WriteBatch> {
  batch.update(doc(db, COLLECTIONS.PRODUCTS, productId), {
    ...productUpdates,
    updatedAt: Timestamp.now(),
  });
  return batch;
}

export function getNewBatch(): WriteBatch {
  return writeBatch(db);
}

export async function commitBatch(batch: WriteBatch): Promise<void> {
  await batch.commit();
}

// ============ REAL-TIME LISTENERS ============

export function subscribeToUserProducts(
  userId: string,
  onUpdate: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    const error = new Error('userId é obrigatório para subscrever produtos');
    onError?.(error);
    return () => {};
  }

  return onSnapshot(
    collection(db, getUserProductsPath(userId)),
    snapshot => {
      const products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Product;
      });
      onUpdate(products);
    },
    error => {
      console.error('Erro ao observar produtos:', error);
      onError?.(error as Error);
    }
  );
}

export function subscribeToUserStockEntries(
  userId: string,
  onUpdate: (entries: StockEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    const error = new Error('userId é obrigatório para subscrever entradas de estoque');
    onError?.(error);
    return () => {};
  }

  return onSnapshot(
    collection(db, getUserStockEntriesPath(userId)),
    snapshot => {
      const entries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as StockEntry;
      });
      onUpdate(entries);
    },
    error => {
      console.error('Erro ao observar entradas de estoque:', error);
      onError?.(error as Error);
    }
  );
}

export function subscribeToUserSales(
  userId: string,
  onUpdate: (sales: Sale[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    const error = new Error('userId é obrigatório para subscrever vendas');
    onError?.(error);
    return () => {};
  }

  return onSnapshot(
    collection(db, getUserSalesPath(userId)),
    snapshot => {
      const sales = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Sale;
      });
      onUpdate(sales);
    },
    error => {
      console.error('Erro ao observar vendas:', error);
      onError?.(error as Error);
    }
  );
}
