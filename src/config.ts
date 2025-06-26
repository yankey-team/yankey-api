import 'dotenv/config';

export interface Config {
  readonly adminDb: string;
  readonly dbTemplate: string;
  readonly listen: {
    readonly port: number;
    readonly host: string;
  };
  readonly maxBodySize: number;
}

export const getConfig = (): Config => {
  return {
    adminDb: process.env.ADMIN_DATABASE_URL ?? '',
    dbTemplate: process.env.DATABASE_URL_TEMPLATE ?? '',
    listen: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST ?? '0.0.0.0',
    },
    maxBodySize: +(process.env.MAX_BODY_SIZE ?? 10000000),
  };
};
