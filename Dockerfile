FROM node:18
WORKDIR /app
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libc6 libgdk-pixbuf2.0-0 \
    libglib2.0-0 libnspr4 libx11-6 libx11-xcb1 libxcb1 libxext6 \
    libxi6 libxtst6 xdg-utils
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 7860
CMD ["node", "index.js"]
