import { Client } from '@elastic/elasticsearch';
import { DataSource } from 'typeorm';
import { UserTtlLog } from '../src/user/entities/user-ttl-log.entity';
import { User } from '../src/user/entities/user.entity';

// Elasticsearch 클라이언트
const es = new Client({ node: 'http://localhost:9200' });

// TTL 분석 메인 로직
export async function runTtlBatch(dataSource: DataSource) {
  // 1. Elasticsearch에서 최근 10분간 로그 조회
  const response = await es.search({
    index: 'winston-*',
    size: 10000,
    query: {
      range: {
        '@timestamp': {
          gte: 'now-30m',
          lte: 'now',
        },
      },
    },
  });

  // 2. 로그 파싱: fields.userId, fields.type 기반
  const logs = response.hits.hits
    .map((h: any) => {
      const source = h._source;
      const fields = source.fields || {};
      return {
        userId: fields.userId,
        type: fields.type,
      };
    })
    .filter((l) => l.userId && l.type);

  // 3. 통계 집계
  const stats = new Map<number, { hit: number; miss: number }>();

  for (const log of logs) {
    const { userId, type } = log;
    if (!stats.has(userId)) stats.set(userId, { hit: 0, miss: 0 });
    const s = stats.get(userId)!;
    if (type === 'HIT') s.hit++;
    if (type === 'MISS') s.miss++;
  }

  // 4. PostgreSQL + Elasticsearch에 결과 저장
  const repo = dataSource.getRepository(UserTtlLog);

  for (const [userId, { hit, miss }] of stats) {
    const ratio = hit / (hit + miss);

    const ttl =
      hit + miss < 5
        ? 60
        : ratio >= 0.7
          ? Math.floor(ratio * 1800) // HIT율 70% 이상이면 그대로 반영
          : 60; // 그 외엔 강제로 낮춤

    const log = repo.create({
      userId,
      hit,
      miss,
      recommendedTtl: ttl,
    });

    await repo.save(log);

    await es.index({
      index: 'ttl-stats',
      body: {
        userId,
        hit,
        miss,
        ttl,
        timestamp: new Date().toISOString(),
      },
    });
  }

  console.log('✅ TTL 분석 및 저장 완료');
}

// TypeORM 연결 및 실행
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'nestuser',
  password: process.env.DB_PASSWORD || 'nestpass',
  database: process.env.DB_NAME || 'nestdb',
  entities: [User, UserTtlLog],
  synchronize: false,
});

dataSource.initialize().then(async () => {
  console.log('📡 DB 연결 완료, TTL 분석 시작');
  await runTtlBatch(dataSource);
  process.exit(0);
});
