# Ứng dụng Học Từ Vựng Tiếng Anh

Ứng dụng học từ vựng tiếng Anh thông minh sử dụng thuật toán "Giờ vàng" (Spaced Repetition) để tối ưu hóa quá trình ghi nhớ.

## 🎯 Tính năng

- ✅ Đăng ký, đăng nhập, quên mật khẩu
- 📚 Học từ vựng mới với flashcard
- 🔄 Ôn tập theo "Giờ vàng" (Spaced Repetition Algorithm)
- 📊 Thống kê tiến trình học tập
- 🎨 Giao diện đẹp, dễ sử dụng

## 🛠️ Công nghệ sử dụng

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- SuperMemo-2 Algorithm (Spaced Repetition)

### Frontend
- React Native + Expo 54
- React Navigation
- Axios
- AsyncStorage

## 📦 Cài đặt

### 1. Cài đặt MongoDB

**Cách 1: MongoDB Local**
```bash
# macOS
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Windows
# Download từ: https://www.mongodb.com/try/download/community
```

**Cách 2: MongoDB Atlas (Cloud - Khuyến nghị)**
1. Đăng ký tài khoản tại: https://www.mongodb.com/cloud/atlas/register
2. Tạo cluster miễn phí
3. Lấy connection string
4. Cập nhật vào file `.env`

### 2. Setup Backend

```bash
# Tạo thư mục backend
mkdir backend
cd backend

# Khởi tạo npm
npm init -y

# Cài đặt dependencies
npm install express mongoose bcryptjs jsonwebtoken cors dotenv

# Cài đặt dev dependencies
npm install --save-dev nodemon

# Tạo file .env
cat > .env << EOL
MONGODB_URI=mongodb://localhost:27017/english-vocab
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
EOL

# Copy file server.js vào thư mục này

# Chạy server
npm run dev
```

### 3. Thêm dữ liệu mẫu

Truy cập: `http://localhost:3000/api/admin/seed-vocabulary` để thêm từ vựng mẫu.

### 4. Setup React Native App

```bash
# Tạo project Expo
npx create-expo-app@latest english-vocab-app --template blank
cd english-vocab-app

# Cài đặt dependencies
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios

# Cài đặt expo dependencies
npx expo install expo-status-bar

# Tạo cấu trúc thư mục
mkdir -p screens contexts services
```

### 5. Cấu hình API URL

Mở file `services/api.js` và cập nhật `API_URL`:

```javascript
// Development
const API_URL = 'http://localhost:3000/api'; // iOS Simulator
// const API_URL = 'http://10.0.2.2:3000/api'; // Android Emulator
// const API_URL = 'http://YOUR_IP:3000/api'; // Thiết bị thật

// Production (sau khi deploy)
// const API_URL = 'https://your-api.com/api';
```

**Lưu ý:** Để lấy IP của máy:
- macOS/Linux: `ifconfig | grep "inet "`
- Windows: `ipconfig`

### 6. Chạy ứng dụng

```bash
# Chạy trên iOS Simulator (macOS only)
npm run ios

# Chạy trên Android Emulator
npm run android

# Hoặc scan QR code
npm start
```

## 🚀 Sử dụng

1. **Đăng ký tài khoản**: Tạo tài khoản mới
2. **Đăng nhập**: Đăng nhập vào ứng dụng
3. **Học từ mới**: Chọn "Học từ mới" để học từ vựng mới
4. **Ôn tập**: Ôn tập các từ đã học theo lịch "giờ vàng"
5. **Xem thống kê**: Theo dõi tiến trình học tập

## 📖 Giờ vàng (Spaced Repetition)

Ứng dụng sử dụng thuật toán SuperMemo-2 (SM-2) để tính toán thời điểm ôn tập tối ưu:

- **1 phút**: Ngay sau khi học
- **6 phút**: Giờ vàng đầu tiên
- **1 giờ**: Giờ vàng thứ hai
- **1 ngày**: Giờ vàng thứ ba
- **3 ngày, 1 tuần, 2 tuần, 1 tháng, 3 tháng**: Các mốc tiếp theo

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Reset mật khẩu

### Vocabulary
- `GET /api/vocabulary/new` - Lấy từ vựng mới
- `GET /api/vocabulary/review` - Lấy từ cần ôn tập

### Learning
- `POST /api/learning/start` - Bắt đầu học từ
- `POST /api/learning/update` - Cập nhật tiến trình (quality: 0-5)
- `GET /api/learning/stats` - Lấy thống kê

## 🎨 Cấu trúc thư mục

```
english-vocab-app/
├── App.js                  # Entry point
├── screens/
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── ForgotPasswordScreen.js
│   ├── HomeScreen.js
│   ├── LearnNewScreen.js
│   ├── ReviewScreen.js
│   └── StatsScreen.js
├── contexts/
│   └── AuthContext.js
├── services/
│   └── api.js
└── package.json

backend/
├── server.js
├── .env
└── package.json
```

## 🐛 Debug

### Backend không chạy được
```bash
# Kiểm tra MongoDB
mongosh # hoặc mongo

# Kiểm tra port 3000
lsof -i :3000
```

### App không kết nối được API
1. Kiểm tra backend đã chạy: `http://localhost:3000/api/auth/login`
2. Kiểm tra IP đúng (nếu dùng thiết bị thật)
3. Kiểm tra firewall không chặn port 3000

### Lỗi "Network Error"
- Đảm bảo máy tính và điện thoại cùng mạng WiFi
- Sử dụng IP thay vì localhost
- Tắt firewall/antivirus tạm thời

## 📱 Deploy

### Backend
- Heroku
- Railway
- Render
- DigitalOcean

### React Native
```bash
# Build APK (Android)
eas build --platform android

# Build IPA (iOS)
eas build --platform ios
```

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Hãy tạo issue hoặc pull request.

## 📄 License

MIT License

## 👨‍💻 Tác giả

Ứng dụng học từ vựng tiếng Anh với thuật toán Spaced Repetition

---

**Happy Learning! 📚✨**