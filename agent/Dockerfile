FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -f

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
