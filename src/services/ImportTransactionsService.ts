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
      // search for duplicates
      .filter((value, index, array) => array.indexOf(value) === index)
      // search for corresponding elements
      .filter(value => !databaseCategoriesTitle.includes(value));

    console.log(newCategories);

    return null;
  }
}

export default ImportTransactionsService;
