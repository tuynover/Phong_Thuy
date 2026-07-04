# Giai đoạn 1: Build mã nguồn React/Vite
FROM node:20-slim AS build

# Thiết lập thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json để cache dependencies
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci

# Sao chép toàn bộ mã nguồn frontend
COPY . .

# Định nghĩa các ARG biến môi trường để truyền vào lúc build
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_CLIENT_ID=996005265441-csord9mbqujekm6tl0en0da4d3mdk968.apps.googleusercontent.com

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build ứng dụng (sinh ra thư mục dist)
RUN npm run build

# Giai đoạn 2: Cấu hình máy chủ web tĩnh phục vụ file giao diện
FROM nginx:alpine

# Sao chép thư mục build dist từ Stage 1 sang thư mục html của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Sao chép file cấu hình nginx dành cho Single Page Application (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mở cổng 80 nội bộ của container
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
