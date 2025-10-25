FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm init -y && npm install next react react-dom && npx next telemetry disable
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
