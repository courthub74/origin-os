# Use Node (pick your version)
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose your app port
EXPOSE 4000

# Start the app
CMD ["npm", "run", "dev"]
