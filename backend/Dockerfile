# Sử dụng Node.js 20-slim làm base image để tương thích tốt với binary của bcrypt và giữ dung lượng nhẹ
FROM node:20-slim

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

# Cài đặt các thư viện production (bỏ qua devDependencies)
RUN npm ci --omit=dev

# Sao chép toàn bộ mã nguồn của backend vào container
COPY . .

# Mở cổng kết nối mặc định của backend
EXPOSE 3001

# Chạy ứng dụng ở chế độ production
CMD ["node", "src/index.js"]
