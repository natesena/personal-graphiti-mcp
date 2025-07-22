# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port 8080
EXPOSE 8080

# Set environment variable for Next.js
ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"] 