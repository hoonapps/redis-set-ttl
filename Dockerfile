# Dockerfile
FROM node:18

# 앱 디렉토리 생성
WORKDIR /app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN yarn install

# 소스 복사
COPY . .

# 앱 빌드
RUN yarn build

# 3000 포트 오픈
EXPOSE 3000

# 앱 실행 (빌드된 코드 실행)
CMD ["node", "dist/main"]
