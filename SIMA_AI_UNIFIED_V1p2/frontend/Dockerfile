FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps || true
COPY . .
RUN mkdir -p public/wasm && cp node_modules/web-ifc/web-ifc.wasm public/wasm/web-ifc.wasm || true
RUN npm run build || true

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm","start"]
