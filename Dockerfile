# ============================================================
# AIGEN BioAgent Web UI — Dockerfile
# A안: 단일 컨테이너 (FE 정적 빌드 + Nginx)
# 확정 근거: A1(기술스택), A8(Docker A안 기본)
# ============================================================

# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 캐시 레이어
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# ── Stage 2: Serve ──
FROM nginx:1.27-alpine AS production

# 타임존 설정
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && echo "Asia/Seoul" > /etc/timezone \
    && apk del tzdata

# Nginx 설정
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
