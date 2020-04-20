import { EntityRepository, getCustomRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryId: string;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const balance = { income: 0, outcome: 0, total: 0 };

    if (transactions) {
      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          balance.income += transaction.value;
        } else {
          balance.outcome += transaction.value;
        }
        balance.total = balance.income - balance.outcome;
      });
    }

    return balance;
  }

  public async hasEnoughBalance(value: number): Promise<boolean> {
    const balance = await this.getBalance();
    const dif = balance.total - value;

    return dif >= 0;
  }

  public async createTransaction({
    title,
    value,
    type,
    categoryId,
  }: TransactionDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: categoryId,
    });

    if (type === 'outcome') {
      const balance = await this.getBalance();
      const diff = balance.total - value;
      if (diff < 0) {
        throw new AppError("You don't have enough money");
      }
    }

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default TransactionsRepository;
