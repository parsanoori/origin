import { ConnectionOptions } from 'typeorm';
import { getDBConnectionOptions } from '@energyweb/origin-backend-utils';

const config: ConnectionOptions = {
    ...getDBConnectionOptions(),
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
    migrationsRun: true,
    migrations: ['migrations/*.ts'],
    migrationsTableName: 'migrations_exchange_irec',
    cli: {
        migrationsDir: 'migrations'
    }
};

export = config;
