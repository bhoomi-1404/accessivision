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
    PORT=3000

WORKDIR /app

COPY package*.json ./
# Install all dependencies (including devDependencies like typescript & vite for build)
RUN npm install --include=dev

COPY . .
RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
