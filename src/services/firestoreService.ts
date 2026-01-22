import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
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

// ============ PRODUCTS ============

export async function loadUserProducts(userId: string): Promise<Product[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRODUCTS),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
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
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), {
      ...product,
      userId,
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
  productId: string,
  updates: Partial<Omit<Product, 'id' | 'stock' | 'cost' | 'createdAt'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    throw error;
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    throw error;
  }
}

// ============ STOCK ENTRIES ============

export async function loadUserStockEntries(userId: string): Promise<StockEntry[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.STOCK_ENTRIES),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
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
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.STOCK_ENTRIES), {
      ...entry,
      userId,
      date: Timestamp.fromDate(entry.date),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar entrada de estoque:', error);
    throw error;
  }
}

export async function deleteStockEntry(entryId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STOCK_ENTRIES, entryId));
  } catch (error) {
    console.error('Erro ao deletar entrada de estoque:', error);
    throw error;
  }
}

// ============ SALES ============

export async function loadUserSales(userId: string): Promise<Sale[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SALES),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
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
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.SALES), {
      ...sale,
      userId,
      date: Timestamp.fromDate(sale.date),
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erro ao adicionar venda:', error);
    throw error;
  }
}

export async function deleteSale(saleId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SALES, saleId));
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
  const q = query(
    collection(db, COLLECTIONS.PRODUCTS),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
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
  const q = query(
    collection(db, COLLECTIONS.STOCK_ENTRIES),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
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
  const q = query(
    collection(db, COLLECTIONS.SALES),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
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
