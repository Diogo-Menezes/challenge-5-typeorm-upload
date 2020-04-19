import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class CreateTransactions1587302623862
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: id,
        type: 'uuid',
        default: 'generate_uuid_v4()',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
