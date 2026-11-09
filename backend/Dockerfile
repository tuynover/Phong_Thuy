# Sử dụng Node.js 22-slim làm base image gọn nhẹ và tối ưu bảo mật
FROM node:22-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Cài đặt Chromium và các font chữ cần thiết cho kết xuất PDF chuẩn tiếng Việt trên Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cấu hình Puppeteer sử dụng Chromium của hệ điều hành và thiết lập NODE_ENV production
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Sao chép package.json và package-lock.json để tận dụng Docker cache cho dependencies
COPY package*.json ./

# Cài đặt các thư viện production (sử dụng bcryptjs 100% pure JS, không cần compiler C++)
RUN npm ci --omit=dev

# Sao chép toàn bộ mã nguồn của backend vào container
COPY . .

# Tạo thư mục scratch cache và cấp quyền sở hữu toàn bộ cho user node
RUN mkdir -p /usr/src/app/scratch/pdf_cache /usr/src/app/scratch/tts_cache \
    && chown -R node:node /usr/src/app

# Hạ quyền container: Chạy bằng non-root user node
USER node

# Mở cổng kết nối mặc định của backend
EXPOSE 3001

# Chạy ứng dụng ở chế độ production
CMD ["node", "src/index.js"]
