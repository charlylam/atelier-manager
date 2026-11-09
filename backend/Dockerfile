FROM node:24-alpine AS base
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN DATABASE_URL="postgresql://user:password@localhost:5432/db" npx prisma generate

FROM base AS dev
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm run build
EXPOSE 4000
CMD ["sh", "-c", "DATABASE_URL=${DIRECT_URL:-$DATABASE_URL} npm run db:deploy && npm run start:prod"]