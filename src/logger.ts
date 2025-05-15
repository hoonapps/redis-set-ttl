import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransport = new ElasticsearchTransport({
  level: 'info',
  indexPrefix: 'winston',
  clientOpts: {
    node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200',
  },
});

export const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/cache.log' }), esTransport],
});
