FROM node:22.16.0-alpine
WORKDIR /app
COPY package.json ./
COPY server/ ./server/
COPY web/ ./web/
ENV NODE_ENV=production PORT=8787 HOST=0.0.0.0 DATA_DIR=/data
RUN mkdir -p /data && chown -R node:node /app /data
USER node
EXPOSE 8787
CMD ["node","--experimental-sqlite","server/index.js"]
