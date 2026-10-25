# AccessiVision Studio - Production Container with Headless Chromium
FROM node:20-bookworm-slim

# Install Chromium and required font dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_PATH=/usr/bin/chromium \
    PORT=3000 \
    NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "server.js"]
