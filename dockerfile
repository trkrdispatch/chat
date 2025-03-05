# Use the official Node.js image as the base
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "index.js"]