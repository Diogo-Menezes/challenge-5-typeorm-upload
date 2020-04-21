import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParser from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface CsvTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[] | null> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const readFileStream = fs.createReadStream(filePath);

    const parser = csvParser({ from_line: 2 });

    const parseCSV = readFileStream.pipe(parser);

    const importedCategories: string[] = [];
    const importedTransactions: CsvTransaction[] = [];

    parseCSV.on('data', async transaction => {
      const [title, type, value, category] = transaction.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      importedTransactions.push({ title, type, value, category });
      importedCategories.push(category);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const databaseCategories = await categoryRepository.find({
      where: {
        title: In(importedCategories),
      },
    });

    const databaseCategoriesTitle = databaseCategories.map(
      (category: Category) => category.title,
    );

    const newCategories = importedCategories
      .filter((value, index, array) => array.indexOf(value) === index)
      .filter(value => !databaseCategoriesTitle.includes(value));

    const categoriesToSave = categoryRepository.create(
      newCategories.map(item => ({ title: item })),
    );

    const savedCategories = await categoryRepository.save(categoriesToSave);

    const categories = [...databaseCategories, ...savedCategories];

    // const transactions = importedTransactions.map(item => ({
    //   title: item.title,
    //   value: item.value,
    //   type: item.type,
    //   category: categories.find(category => category.title === item.title),
    // }));

    const transactions = transactionsRepository.create(
      importedTransactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: categories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionsRepository.save(transactions);

    fs.unlinkSync(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;
