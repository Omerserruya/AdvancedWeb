FROM node:18-alpine

WORKDIR /app

# Install build dependencies for bcrypt
RUN apk add --no-cache make gcc g++ python3

# Copy only package files first
COPY package*.json ./

# Install dependencies and rebuild bcrypt
RUN npm install

# Copy source code but exclude node_modules
COPY . .

EXPOSE 4000

CMD ["npm", "run", "devstart"] 