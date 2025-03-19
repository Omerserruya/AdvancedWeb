FROM node:18-alpine

WORKDIR /app

# Install build dependencies for bcrypt and native modules
RUN apk add --no-cache make gcc g++ python3 py3-pip

# Copy only package files first
COPY package*.json ./

# Install dependencies with specific flags for bcrypt
RUN npm install --build-from-source
# Explicitly rebuild bcrypt to ensure it matches the container architecture
RUN npm rebuild bcrypt --build-from-source

# Copy source code but exclude node_modules
COPY . .

EXPOSE 4000

CMD ["npm", "run", "prodstart"] 