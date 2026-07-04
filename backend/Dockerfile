# Sử dụng Node.js 20-slim làm base image để tương thích tốt với binary của bcrypt và giữ dung lượng nhẹ
FROM node:20-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

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
