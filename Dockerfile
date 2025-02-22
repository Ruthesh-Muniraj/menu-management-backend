# Use an official Node runtime as a parent image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /src

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Define the command to run your app
CMD ["npm", "run", "start:prod"]
