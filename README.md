# Redis 캐시 TTL 분석 및 자동화 최적화 프로젝트

## 🧠 프로젝트 개요

이 프로젝트는 `NestJS` 기반 백엔드에서 Redis 캐시의 **HIT/MISS 로그를 수집**하고,  
이를 기반으로 **사용자별 캐시 TTL을 동적으로 추천**하는 실험 환경입니다.

Elasticsearch + Kibana를 통해 로그를 시각화하고, TTL 조정이 실제 캐시 효율에 어떤 영향을 주는지를 측정합니다.

---

## 🛠 기술 스택

| 구성 요소 | 기술                            |
| --------- | ------------------------------- |
| 백엔드    | NestJS + TypeORM                |
| 캐시      | Redis (`cache-manager-ioredis`) |
| DB        | PostgreSQL                      |
| 로그 수집 | Winston + Elasticsearch         |
| 시각화    | Kibana                          |
| 컨테이너  | Docker Compose                  |

---

## 📦 실행 방법

### 1. Docker 컨테이너 빌드 및 실행

```bash
docker compose up --build -d
```

실행 후 아래 서비스들이 동시에 구동됩니다:

- NestJS (`http://localhost:3000`)
- Redis (`localhost:6379`)
- PostgreSQL (`localhost:5432`)
- Elasticsearch (`http://localhost:9200`)
- Kibana (`http://localhost:5601`)

---

### 2. NestJS API 사용

#### 사용자 생성

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"hoon", "email":"hoon@example.com"}'
```

#### 사용자 조회 (캐시 테스트용)

```bash
curl http://localhost:3000/users/1
```

- 첫 요청은 MISS → Redis에 저장
- 이후 요청은 HIT → 캐시 반환

---

### 3. 트래픽 시뮬레이션 실행

```bash
yarn ts-node scripts/load-generator.ts
```

- 10명의 유저가 랜덤 시간 간격으로 API 호출 (10분 동안 반복)

---

### 4. TTL 추천 배치 실행

```bash
yarn ts-node cron/ttl-analyzer.ts
```

- Elasticsearch에서 최근 10~12분간 로그 조회
- HIT/MISS 비율 기반 TTL 계산
- PostgreSQL + Elasticsearch(`ttl-stats`)에 결과 저장

---

## 🔍 Kibana 사용법

1. 접속: [http://localhost:5601](http://localhost:5601)
2. Stack Management → Index Patterns → `ttl-stats` 등록
3. Discover → `ttl-stats` 선택 → 로그 확인
4. Visualize → Bar/Line Chart 생성
   - 예: 사용자별 TTL 변화, HIT/MISS 비율 추이

---

## 📊 기대 효과

| 목표            | 설명                                                |
| --------------- | --------------------------------------------------- |
| 캐시 효율 측정  | 실제 API 사용 패턴에서 TTL이 얼마나 적절했는지 확인 |
| TTL 튜닝 자동화 | 일정 비율 이상 HIT이면 TTL 증가, 낮으면 감소        |
| 시각적 인사이트 | Kibana로 사용자별 캐시 성능 가시화                  |

---

## 📁 디렉토리 구조 예시

```
├── src/
│   ├── user/
│   │   ├── user.service.ts
│   │   └── entities/
│   │       ├── user.entity.ts
│   │       └── user-ttl-log.entity.ts
├── scripts/
│   └── load-generator.ts
├── cron/
│   └── ttl-analyzer.ts
├── logger.ts
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🙌 마무리

이 프로젝트는 Redis를 사용할 때 TTL(Time To Live)을 단순히 1분, 30분, 150분처럼 고정값으로 설정하는 대신,
**보다 의미 있는 방식으로 TTL을 설정했을 때 어떤 효과가 있을지 탐색**하는 데서 출발했습니다.

물론 이런 접근에는 로그 수집과 분석이라는 비용이 따르지만, 자주 조회되는 데이터를 캐시에 오래 보존해 응답 속도 개선 할 수 있고, 불필요한 데이터를 오래 유지하지 않음으로써 메모리 낭비 감소
, MISS를 줄여 DB 호출 빈도를 줄임으로써 비용 절감 및 안정성 확보 할 수 있는 기대되는 부분도 있습니다.

추후에는 이처럼 수집된 HIT/MISS 로그 기반의 자동 TTL 분석 툴을 만들어,
Redis가 필요한 다양한 서비스에 쉽게 적용할 수 있는 구조로 확장해보는 것도 의미 있을 것 같습니다.
