# Cursor Usage Calculator

Tiện ích mở rộng Chrome giúp theo dõi và phân tích chi tiết việc sử dụng Cursor AI của bạn với các tính năng mạnh mẽ và dễ sử dụng.

---

## 📷 Demo giao diện

![Demo ảnh Popup Extension](https://upanh.nhatkythuthuat.com/images/2025/11/18/image.png)

---

## 🌟 Tính năng chính

### 📊 Hiển thị Badge tự động
- **Badge trên icon**: Hiển thị phần trăm sử dụng trực tiếp trên icon tiện ích
- **Tự động cập nhật**: Refresh mỗi 15 phút để theo dõi real-time
- **Màu sắc thông minh**: 
  - 🟢 Xanh lá (< 70%): Sử dụng bình thường
  - 🟡 Vàng (70-90%): Cần chú ý
  - 🔴 Đỏ (≥ 90%): Gần đạt giới hạn

### 📈 Popup thông tin nhanh
Khi click vào icon tiện ích, bạn sẽ thấy:
- **Thông tin plan**: Số ngày còn lại đến khi plan refresh
- **Số requests hiện tại**: Tổng số requests trong tháng hiện tại
- **Usage limits**: Phần trăm đã sử dụng với thanh progress bar
- **Total tokens**: Tổng số tokens đã sử dụng
- **API cost**: Chi phí API tính bằng USD
- **Models Cost Breakdown**: Chi tiết chi phí theo từng model (có thể mở rộng)

### 📉 Biểu đồ mini trên Popup
- **Usage % Over Time**: Biểu đồ đường hiển thị xu hướng sử dụng
- **Breakdown by Model**: Biểu đồ tròn phân tích theo model

### 📊 Biểu đồ đầy đủ trên Dashboard
Khi truy cập `cursor.com/dashboard?tab=usage`, extension tự động thêm:
- **By Model**: Biểu đồ cột ngang hiển thị số requests theo model
- **By Time of Day**: Biểu đồ đường hiển thị mức độ sử dụng theo giờ trong ngày
- **By Day of Week**: Biểu đồ cột hiển thị mức độ sử dụng theo ngày trong tuần
- **By Month**: Biểu đồ cột hiển thị xu hướng sử dụng theo tháng

### 🧮 Tính toán từ bảng Dashboard
- **Tự động tính toán**: Tự động tính tổng hợp khi vào trang usage
- **Xử lý nhiều trang**: Tự động duyệt qua tất cả các trang để tính chính xác
- **Thống kê chi tiết**:
  - Tổng số requests
  - Requests thành công/thất bại
  - Tổng tokens
  - Tổng chi phí
  - Tỷ lệ thành công
- **Xuất dữ liệu**: Export kết quả ra file CSV

### ⚙️ Quản lý Cache
- **Tùy chọn thời gian cache**: 1 phút hoặc 3 phút
- **Tự động clear**: Cache tự động hết hạn và refresh
- **Clear thủ công**: Nút clear cache trong popup
- **Tối ưu hiệu suất**: Load nhanh khi xem lại dữ liệu

### 🔄 Hỗ trợ cả 2 Pricing Models
- **Old quota-based limits**: Hỗ trợ gói cũ với giới hạn requests
- **New unlimited rate limits**: Hỗ trợ gói mới với giới hạn dựa trên cost
- **Tự động phát hiện**: Extension tự động nhận diện loại gói của bạn

### 📱 Analytics toàn diện
- **Phân tích theo model**: Xem model nào được sử dụng nhiều nhất
- **Phân tích theo thời gian**: Xem thời điểm nào sử dụng nhiều nhất
- **Phân tích theo ngày**: Xem ngày nào trong tuần sử dụng nhiều nhất
- **Xu hướng tháng**: Theo dõi xu hướng sử dụng qua các tháng
- **Cost tracking**: Theo dõi chi phí và dự đoán

### 🔐 Xác thực tự động
- **Tự động lấy cookie**: Extension tự động lấy cookie từ trình duyệt
- **Không cần đăng nhập thủ công**: Hoạt động ngay khi đã đăng nhập Cursor

## 🚀 Cài đặt

### Từ Chrome Web Store
(Link sẽ được cập nhật khi extension được publish)

### Cài đặt thủ công (Developer Mode)
1. Tải hoặc clone repository này
2. Mở Chrome và vào `chrome://extensions/`
3. Bật **Developer mode** (góc trên bên phải)
4. Click **Load unpacked**
5. Chọn thư mục chứa extension

## 📖 Hướng dẫn sử dụng

### Lần đầu sử dụng
1. Đảm bảo bạn đã đăng nhập vào Cursor trên trình duyệt
2. Extension sẽ tự động lấy cookie và bắt đầu theo dõi
3. Badge sẽ xuất hiện trên icon với phần trăm sử dụng

### Xem thông tin chi tiết
1. Click vào icon extension trên thanh công cụ
2. Popup sẽ hiển thị:
   - Thông tin plan và số ngày còn lại
   - Số requests hiện tại
   - Usage limits với progress bar
   - Total tokens và API cost
   - Models Cost Breakdown (click để mở rộng)
   - Biểu đồ mini

### Xem biểu đồ đầy đủ
1. Truy cập `https://cursor.com/dashboard?tab=usage`
2. Extension tự động thêm section "Usage Analytics" với các biểu đồ:
   - By Model
   - By Time of Day
   - By Day of Week
   - By Month

### Tính toán từ bảng
1. Vào trang `cursor.com/dashboard?tab=usage`
2. Extension tự động tính toán và hiển thị summary block
3. Nếu tắt auto-calculate, click nút "Calculate Usage" để tính thủ công
4. Click "Export Summary Data" để xuất CSV

### Cài đặt
Trong popup, bạn có thể:
- **Show Usage Badge**: Bật/tắt hiển thị badge (mặc định: bật)
- **Auto Calculate**: Tự động tính toán khi vào trang usage (mặc định: bật)
- **Cache Duration**: Chọn thời gian cache 1 phút hoặc 3 phút
- **Proxy URL**: Cấu hình URL proxy server (xem phần [Proxy Server](#-proxy-server-tùy-chọn) để biết thêm chi tiết)
- **Clear Cache**: Xóa cache thủ công

## 🎯 Use Cases

### Cho Developers
- Theo dõi usage để tránh vượt quá giới hạn
- Phân tích pattern sử dụng để tối ưu workflow
- Dự đoán chi phí hàng tháng

### Cho Teams
- Monitor usage của team
- Phân tích xu hướng sử dụng
- Quản lý budget hiệu quả

### Cho Individuals
- Hiểu rõ cách sử dụng Cursor
- Tối ưu thời gian sử dụng
- Tránh chi phí phát sinh không cần thiết

## 🔧 Cấu trúc Project

```
Cursor Usage/
├── manifest.json          # Manifest file cho extension
├── background.js          # Service worker xử lý badge và cache
├── popup.html            # UI của popup
├── popup.js              # Logic của popup
├── content.js            # Script chạy trên dashboard page
├── proxy.php             # Proxy server (tùy chọn, upload lên server)
├── assets/
│   └── js/
│       └── chart.min.js  # Chart.js library
├── icons/                # Icons cho extension
└── _locales/             # i18n messages
    ├── en/
    └── vi/
```

## 🛠️ Công nghệ sử dụng

- **Manifest V3**: Sử dụng Chrome Extension Manifest V3
- **Chart.js**: Thư viện vẽ biểu đồ
- **Chrome Storage API**: Lưu trữ settings và cache
- **Chrome Cookies API**: Lấy cookie tự động
- **Chrome Alarms API**: Tự động refresh badge

## 📝 Permissions

Extension yêu cầu các permissions sau:
- `cookies`: Để lấy cookie từ cursor.com
- `storage`: Để lưu settings và cache
- `alarms`: Để tự động refresh badge
- `activeTab`: Để chạy script trên dashboard page

## 🔒 Privacy

- Extension chỉ đọc cookie từ cursor.com
- Dữ liệu được lưu local trên máy của bạn
- **Khi sử dụng proxy**: Cookie được gửi đến proxy server của bạn để forward request đến Cursor API. Proxy không lưu trữ cookie hay dữ liệu.
- **Khi không dùng proxy**: Cookie chỉ được sử dụng để fetch dữ liệu từ Cursor API trực tiếp
- Không gửi dữ liệu đến server bên thứ ba ngoài proxy server bạn cấu hình

## 🌐 Proxy Server (Tùy chọn)

Extension hỗ trợ sử dụng proxy server để xử lý các vấn đề về CORS và bảo mật khi gọi API trực tiếp từ trình duyệt.

### Tại sao cần Proxy?

- **Giải quyết CORS**: Một số trình duyệt có thể chặn requests trực tiếp đến Cursor API do chính sách CORS
- **Bảo mật cookie**: Proxy giúp xử lý cookie một cách an toàn hơn
- **Tùy chỉnh**: Bạn có thể tự host proxy server của riêng mình

### Cài đặt Proxy Server

#### Yêu cầu hệ thống

- **PHP 7.4+** hoặc cao hơn
- **cURL extension** đã được bật trong PHP
- **Web server** (Apache, Nginx, hoặc PHP built-in server)

#### Các bước cài đặt

1. **Upload file proxy.php lên server**
   ```bash
   # Upload file proxy.php lên thư mục web của bạn
   # Ví dụ: /var/www/html/extension/cursor-used/proxy.php
   ```

2. **Kiểm tra quyền truy cập file**
   ```bash
   # Đảm bảo file có quyền đọc
   chmod 644 proxy.php
   ```

3. **Kiểm tra cURL extension**
   ```bash
   # Kiểm tra PHP có cURL không
   php -m | grep curl
   ```

4. **Test proxy server**
   ```bash
   # Test bằng cách truy cập URL proxy trong trình duyệt
   # Nếu thấy JSON response với message "Cookie found..." là thành công
   ```

#### Cấu hình Extension để sử dụng Proxy

1. **Mở popup extension** (click vào icon)
2. **Scroll xuống phần Settings**
3. **Tìm trường "Proxy URL"**
4. **Nhập URL của proxy server**:
   - Nếu proxy.php nằm ở thư mục gốc: `https://yourdomain.com/proxy.php`
   - Nếu proxy.php nằm trong thư mục con: `https://yourdomain.com/extension/cursor-used/`
   - Extension sẽ tự động thêm `proxy.php` nếu URL kết thúc bằng `/`
5. **URL sẽ được lưu tự động** khi bạn thay đổi

#### Ví dụ cấu hình

```
Proxy URL: https://addlivetag.com/extension/cursor-used/
```

hoặc

```
Proxy URL: https://yourdomain.com/proxy.php
```

#### Sử dụng Direct API (Không dùng Proxy)

- **Để trống trường Proxy URL** hoặc nhập chuỗi rỗng
- Extension sẽ gọi API trực tiếp đến Cursor
- Yêu cầu trình duyệt hỗ trợ CORS và cookie

### Cách Proxy hoạt động

1. **Extension gửi request** đến proxy server với:
   - Cookie `WorkosCursorSessionToken` trong request body
   - Payload JSON với thông tin filter/query

2. **Proxy server**:
   - Nhận request từ extension
   - Lấy cookie từ request body hoặc header
   - Forward request đến Cursor API (`https://cursor.com/api/dashboard/get-filtered-usage-events`)
   - Trả về response cho extension

3. **Extension nhận response** và xử lý dữ liệu như bình thường

### Bảo mật Proxy

- **Cookie chỉ được truyền qua HTTPS**: Đảm bảo proxy server của bạn sử dụng SSL/TLS
- **Không lưu trữ cookie**: Proxy không lưu cookie, chỉ forward request
- **CORS headers**: Proxy tự động thêm CORS headers để extension có thể gọi

### Troubleshooting Proxy

#### Proxy không hoạt động

1. **Kiểm tra URL proxy đúng chưa**
   - Đảm bảo URL có thể truy cập được từ trình duyệt
   - Test bằng cách mở URL trong trình duyệt

2. **Kiểm tra PHP và cURL**
   ```bash
   php -v
   php -m | grep curl
   ```

3. **Kiểm tra log lỗi PHP**
   - Xem error log của web server
   - Bật error reporting trong PHP để debug

4. **Kiểm tra SSL certificate**
   - Đảm bảo SSL certificate hợp lệ
   - Extension chỉ gọi HTTPS URLs

#### Lỗi "Missing WorkosCursorSessionToken cookie"

1. **Đảm bảo đã đăng nhập Cursor** trên trình duyệt
2. **Kiểm tra cookie có tồn tại**:
   - Mở DevTools > Application > Cookies
   - Tìm cookie `WorkosCursorSessionToken` tại `cursor.com`

#### Lỗi CORS

1. **Kiểm tra CORS headers** trong proxy.php
2. **Đảm bảo proxy server trả về đúng headers**:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Accept, Cookie
   ```

#### Lỗi 500 Internal Server Error

1. **Kiểm tra PHP error log**
2. **Kiểm tra cURL có hoạt động không**
3. **Kiểm tra timeout settings** trong proxy.php
4. **Kiểm tra memory limit** của PHP

### Proxy mặc định

Extension có proxy mặc định tại:
```
https://addlivetag.com/extension/cursor-used/
```

Bạn có thể sử dụng proxy này hoặc tự host proxy server của riêng mình.

## 🐛 Troubleshooting

### Badge không hiển thị
1. Kiểm tra "Show Usage Badge" đã được bật trong popup
2. Đảm bảo bạn đã đăng nhập vào Cursor
3. Refresh extension hoặc reload trang

### Dữ liệu không cập nhật
1. Click "Clear Cache" trong popup
2. Đợi vài giây để extension fetch dữ liệu mới
3. Reload popup

### Biểu đồ không hiển thị trên dashboard
1. Đảm bảo bạn đang ở trang `cursor.com/dashboard?tab=usage`
2. Kiểm tra console để xem có lỗi không
3. Reload trang

### Tính toán không chính xác
1. Đảm bảo bảng đã load đầy đủ
2. Nếu có nhiều trang, extension sẽ tự động duyệt qua
3. Click "Calculate Usage" để tính lại thủ công

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết

## 👨‍💻 Tác giả

Được phát triển để giúp cộng đồng Cursor users theo dõi và tối ưu việc sử dụng AI coding assistant.

## 🙏 Acknowledgments

- Cảm ơn Cursor team đã tạo ra công cụ tuyệt vời
- Cảm ơn Chart.js cho thư viện biểu đồ mạnh mẽ
- Cảm ơn cộng đồng open source

> **Ghi chú:** Công cụ này có tham khảo ý tưởng và <br>
một số phương pháp từ tiện ích [Cursor Usage](https://chromewebstore.google.com/detail/cursor-usage/feemeooihcjjkddafjjldpajadjhlela).

## 📞 Support

Nếu gặp vấn đề hoặc có câu hỏi:
- Mở issue trên GitHub
- Kiểm tra documentation
- Xem troubleshooting section

---

**Lưu ý**: Extension này không phải là sản phẩm chính thức của Cursor. Đây là một công cụ của cộng đồng để hỗ trợ người dùng.

