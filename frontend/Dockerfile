FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
RUN npm install --save-dev typescript @types/node @types/react @types/react-dom --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
