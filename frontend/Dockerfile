FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

# Use Vite's preview server
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]