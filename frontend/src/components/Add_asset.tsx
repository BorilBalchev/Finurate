import { db } from '../utils/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export type Stock = {
  ticker: string;
  name: string;
  type: string;
  sector: string;
};

export type Asset = {
  ticker: string;
  name: string;
  type: 'stock' | 'crypto';
  sector: string;
};

export const addStockToPortfolio = async (
  user: User,
  stock: Asset,
  amount: number
): Promise<void> => {
  const userId = user.uid;

  await setDoc(doc(db, 'users', userId, 'portfolio', stock.ticker), {
    ticker: stock.ticker,
    name: stock.name,
    type: 'stock',
    sector: stock.sector,
    amount,
  });
};

export const addCryptoToPortfolio = async (
  user: User,
  stock: Asset,
  amount: number
): Promise<void> => {
  const userId = user.uid;

  await setDoc(doc(db, 'users', userId, 'portfolio', stock.ticker), {
    ticker: `${stock.ticker}-USD`,
    name: stock.name,
    type: 'crypto',
    sector: stock.sector,
    amount,
  });
};