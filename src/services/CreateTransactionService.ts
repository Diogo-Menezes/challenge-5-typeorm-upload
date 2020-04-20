import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  categoryTitle: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    categoryTitle,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const hasEnoughBalance = await transactionRepository.hasEnoughBalance(
        value,
      );

      if (!hasEnoughBalance) {
        throw new AppError(
          "You don't have enough money to make this operation",
        );
      }
    }

    const categoryRepository = getRepository(Category);

    const existingCategory = await categoryRepository.findOne({
      where: { title: categoryTitle },
    });
    let category: Category;

    if (existingCategory) {
      category = existingCategory;
    } else {
      category = categoryRepository.create({ title: categoryTitle });
      await categoryRepository.save(category);
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
