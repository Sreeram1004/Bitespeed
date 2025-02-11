FROM node:16 AS build
WORKDIR /app
COPY package*.json ./
RUN ls -la && npm install  # Debugging: List files
COPY . .

# Stage 2: Run
FROM node:16
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["npm", "run", "start"]
