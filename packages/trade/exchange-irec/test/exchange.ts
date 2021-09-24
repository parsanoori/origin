/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AccountService,
    AppModule,
    entities as ExchangeEntities,
    IExchangeConfigurationService,
    IExternalDeviceService,
    IExternalUserService,
    IProductInfo,
    OrderService,
    TransferService
} from '@energyweb/exchange';
import { CertificateUtils, Contracts } from '@energyweb/issuer';
import { BlockchainPropertiesService } from '@energyweb/issuer-irec-api';
import { IUser, UserStatus } from '@energyweb/origin-backend-core';
import { DatabaseService, RolesGuard } from '@energyweb/origin-backend-utils';
import { getProviderWithFallback } from '@energyweb/utils-general';

import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { useContainer } from 'class-validator';
import { entities as ExchangeIRECEntities, IssuerIRECEntities } from '../src';

import { AppModule as ExchangeIRECModule } from '../src/app.module';

import { ProductDTO } from '../src/product';

const web3 = 'http://localhost:8545';
const provider = getProviderWithFallback(web3);

// ganache account 1
export const deviceManager = {
    address: '0xd46aC0Bc23dB5e8AfDAAB9Ad35E9A3bA05E092E8',
    privateKey: '0xd9bc30dc17023fbb68fe3002e0ff9107b241544fd6d60863081c55e383f1b5a3'
};
// ganache account 2
export const registryDeployer = {
    address: '0x9442ED348b161af888e6cB999951aE8b961F7B4B',
    privateKey: '0xc4b87d68ea2b91f9d3de3fcb77c299ad962f006ffb8711900cb93d94afec3dc3'
};

// ganache account 2
export const otherDeviceManager = {
    address: '0xB00F0793d0ce69d7b07db16F92dC982cD6Bdf651',
    privateKey: '0xca77c9b06fde68bcbcc09f603c958620613f4be79f3abb4b2032131d0229462e'
};

const deployRegistry = async () => {
    return Contracts.migrateRegistry(provider, registryDeployer.privateKey);
};

const deployIssuer = async (registry: string) => {
    return Contracts.migrateIssuer(provider, registryDeployer.privateKey, registry);
};

const deployPrivateIssuer = async (issuer: string) => {
    return Contracts.migratePrivateIssuer(provider, registryDeployer.privateKey, issuer);
};

export const authenticatedUser = { id: 1, organization: { id: '1000' }, status: UserStatus.Active };

const authGuard: CanActivate = {
    canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        req.user = authenticatedUser;

        return true;
    }
};

const deviceTypes = [
    ['Solar'],
    ['Solar', 'Photovoltaic'],
    ['Solar', 'Photovoltaic', 'Roof mounted'],
    ['Solar', 'Photovoltaic', 'Ground mounted'],
    ['Solar', 'Photovoltaic', 'Classic silicon'],
    ['Solar', 'Concentration'],
    ['Wind'],
    ['Wind', 'Onshore'],
    ['Wind', 'Offshore'],
    ['Marine'],
    ['Marine', 'Tidal'],
    ['Marine', 'Tidal', 'Inshore'],
    ['Marine', 'Tidal', 'Offshore']
];

export const bootstrapTestInstance = async (
    deviceServiceMock?: IExternalDeviceService,
    userServiceMock?: IExternalUserService
) => {
    const registry = await deployRegistry();
    const issuer = await deployIssuer(registry.address);
    const privateIssuer = await deployPrivateIssuer(issuer.address);

    await issuer.setPrivateIssuer(privateIssuer.address);

    const configService = new ConfigService({
        WEB3: web3,
        // ganache account 0
        EXCHANGE_ACCOUNT_DEPLOYER_PRIV:
            '0xd9066ff9f753a1898709b568119055660a77d9aae4d7a4ad677b8fb3d2a571e5',
        // ganache account 1
        EXCHANGE_WALLET_PUB: '0xd46aC0Bc23dB5e8AfDAAB9Ad35E9A3bA05E092E8',
        EXCHANGE_WALLET_PRIV: '0xd9bc30dc17023fbb68fe3002e0ff9107b241544fd6d60863081c55e383f1b5a3',
        ISSUER_ID: 'Issuer ID',
        ENERGY_PER_UNIT: 1000000,
        EXCHANGE_PRICE_STRATEGY: 0
    });

    const moduleFixture = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.DB_HOST ?? 'localhost',
                port: Number(process.env.DB_PORT ?? 5432),
                username: process.env.DB_USERNAME ?? 'postgres',
                password: process.env.DB_PASSWORD ?? 'postgres',
                database: process.env.DB_DATABASE ?? 'origin',
                entities: [...ExchangeEntities, ...ExchangeIRECEntities, ...IssuerIRECEntities],
                logging: ['info']
            }),
            ConfigModule,
            AppModule,
            ExchangeIRECModule
        ],
        providers: [
            DatabaseService,
            {
                provide: IExchangeConfigurationService,
                useValue: {
                    getRegistryAddress: async () => '0xd46aC0Bc23dB5e8AfDAAB9Ad35E9A3bA05E092E8',
                    getIssuerAddress: async () => '0xd46aC0Bc23dB5e8AfDAAB9Ad35E9A3bA05E092E8',
                    getDeviceTypes: async () => deviceTypes,
                    getGridOperators: async () => ['TH-PEA', 'TH-MEA']
                }
            },
            {
                provide: IExternalDeviceService,
                useValue: deviceServiceMock ?? {
                    getDeviceProductInfo: async (): Promise<IProductInfo> => ({
                        deviceType: 'Solar;Photovoltaic;Classic silicon',
                        country: 'Thailand',
                        region: 'Central',
                        province: 'Nakhon Pathom',
                        operationalSince: 2016,
                        gridOperator: 'TH-PEA'
                    })
                }
            },
            {
                provide: IExternalUserService,
                useValue: userServiceMock ?? {
                    getPlatformAdmin: async (): Promise<IUser> =>
                        ({
                            organization: {
                                id: 1
                            }
                        } as IUser)
                }
            }
        ]
    })
        .overrideProvider(ConfigService)
        .useValue(configService)
        .overrideGuard(AuthGuard('default'))
        .useValue(authGuard)
        .overrideGuard(RolesGuard)
        .useValue(authGuard)
        .compile();

    const app = moduleFixture.createNestApplication();

    const transferService = await app.resolve<TransferService>(TransferService);
    const accountService = await app.resolve<AccountService>(AccountService);
    const databaseService = await app.resolve<DatabaseService>(DatabaseService);
    const orderService = await app.resolve<OrderService<ProductDTO>>(OrderService);
    const blockchainPropertiesService = await app.resolve<BlockchainPropertiesService>(
        BlockchainPropertiesService
    );

    const blockchainProperties = await blockchainPropertiesService.create(
        provider.network.chainId,
        registry.address,
        issuer.address,
        web3,
        registryDeployer.privateKey,
        null,
        privateIssuer.address
    );

    await CertificateUtils.approveOperator(
        registryDeployer.address,
        blockchainProperties.wrap(deviceManager.privateKey)
    );

    await CertificateUtils.approveOperator(
        registryDeployer.address,
        blockchainProperties.wrap(otherDeviceManager.privateKey)
    );

    app.useLogger(['log']);
    app.enableCors();

    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    return {
        transferService,
        accountService,
        databaseService,
        orderService,
        app
    };
};
