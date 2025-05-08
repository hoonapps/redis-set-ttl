import { Client } from '@elastic/elasticsearch';
import { DataSource } from 'typeorm';
import { UserTtlLog } from '../src/user/entities/user-ttl-log.entity';

const es = new Client({ node: 'http://localhost:9200' });

export async function runTtlBatch(dataSource: DataSource) {
  const response = await es.search({
    index: 'winston-*',
    size: 10000,
    query: {
      range: {
        '@timestamp': {
          gte: 'now-10m',
          lte: 'now',
        },
      },
    },
  });

  const logs = response.hits.hits.map((h: any) => h._source);
  const stats = new Map<string, { hit: number; miss: number }>();

  for (const log of logs) {
    const userId = log.userId;
    if (!userId) continue;
    const type = log.type;
    if (!stats.has(userId)) stats.set(userId, { hit: 0, miss: 0 });
    const s = stats.get(userId)!;
    if (type === 'HIT') s.hit++;
    if (type === 'MISS') s.miss++;
  }

  const repo = dataSource.getRepository(UserTtlLog);
  for (const [userId, { hit, miss }] of stats) {
    const ttl = hit + miss < 5 ? 60 : Math.floor((hit / (hit + miss)) * 1800);
    const log = repo.create({
      userId: +userId,
      hit,
      miss,
      recommendedTtl: ttl,
    });
    await repo.save(log);
    await es.index({
      index: 'ttl-stats',
      body: { userId, hit, miss, ttl, timestamp: new Date().toISOString() },
    });
  }
}
