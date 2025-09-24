FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --omit=dev || npm i --omit=dev
COPY index.js ./index.js
# persistent volume for sqlite
VOLUME ["/data"]
ENV DB_PATH=/data/weather.db
EXPOSE 3000
CMD ["node", "index.js"]
