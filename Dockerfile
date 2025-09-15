# Use an official Node.js base image
FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json if available
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (Koyeb will map this)
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
