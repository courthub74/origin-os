FROM node:18-alpine
WORKDIR /app

# Copy backend package files first for caching
COPY origin-os-api/package*.json ./
RUN npm install

# Copy the backend source
COPY origin-os-api/ ./

EXPOSE 4000
CMD ["node", "src/server.js"]
