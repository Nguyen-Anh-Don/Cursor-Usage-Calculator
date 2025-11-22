# Cursor Usage Calculator

<div align="center">

**🌐 Language / Ngôn ngữ:** [English](#english) | [Tiếng Việt](#tiếng-việt)

</div>

---

<a id="english"></a>
# English

A Chrome extension that helps you track and analyze your Cursor AI usage in detail with powerful and easy-to-use features.

---

## 📷 Demo Interface

![Demo ảnh Popup Extension](https://upanh.nhatkythuthuat.com/images/2025/11/22/image033a060943c7345c.png)

---

## 🌟 Key Features

### 📊 Automatic Badge Display
- **Badge on icon**: Displays usage percentage directly on the extension icon
- **Auto-update**: Refreshes every 15 minutes for real-time tracking
- **Smart colors**: 
  - 🟢 Green (< 70%): Normal usage
  - 🟡 Yellow (70-90%): Needs attention
  - 🔴 Red (≥ 90%): Near limit

### 📈 Quick Info Popup
When clicking the extension icon, you'll see:
- **Plan information**: Days remaining until plan refresh
- **Current requests**: Total requests in the current month
- **Usage limits**: Percentage used with progress bar
- **Total tokens**: Total tokens used
- **API cost**: API cost in USD
- **Models Cost Breakdown**: Detailed cost breakdown by model (expandable)

### 📉 Mini Charts on Popup
- **Usage % Over Time**: Line chart showing usage trends
- **Breakdown by Model**: Pie chart analyzing by model

### 📊 Full Charts on Dashboard
When accessing `cursor.com/dashboard?tab=usage`, the extension automatically adds:
- **By Model**: Horizontal bar chart showing requests by model
- **By Time of Day**: Line chart showing usage by hour of day
- **By Day of Week**: Bar chart showing usage by day of week
- **By Month**: Bar chart showing usage trends by month

### 🧮 Calculation from Dashboard Table
- **Automatic calculation**: Automatically calculates totals when entering the usage page
- **Multi-page handling**: Automatically browses through all pages for accurate calculation
- **Detailed statistics**:
  - Total requests
  - Successful/failed requests
  - Total tokens
  - Total cost
  - Success rate
- **Data export**: Export results to CSV file

### ⚙️ Cache Management
- **Cache time options**: 1 minute or 3 minutes
- **Auto clear**: Cache automatically expires and refreshes
- **Manual clear**: Clear cache button in popup
- **Performance optimization**: Fast loading when viewing data again

### 🔄 Supports Both Pricing Models
- **Old quota-based limits**: Supports old plans with request limits
- **New unlimited rate limits**: Supports new plans with cost-based limits
- **Auto detection**: Extension automatically detects your plan type

### 📱 Comprehensive Analytics
- **Model analysis**: See which model is used most
- **Time analysis**: See when usage is highest
- **Day analysis**: See which day of week has most usage
- **Monthly trends**: Track usage trends over months
- **Cost tracking**: Track costs and predictions

### 🔐 Automatic Authentication
- **Auto cookie retrieval**: Extension automatically retrieves cookies from browser
- **No manual login**: Works immediately when logged into Cursor

## 🚀 Installation

### From Chrome Web Store
(Link will be updated when extension is published)

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right corner)
4. Click **Load unpacked**
5. Select the folder containing the extension

## 📖 Usage Guide

### First Time Use
1. Make sure you're logged into Cursor in your browser
2. Extension will automatically retrieve cookies and start tracking
3. Badge will appear on icon with usage percentage

### View Detailed Information
1. Click the extension icon on the toolbar
2. Popup will display:
   - Plan information and days remaining
   - Current requests
   - Usage limits with progress bar
   - Total tokens and API cost
   - Models Cost Breakdown (click to expand)
   - Mini charts

### View Full Charts
1. Visit `https://cursor.com/dashboard?tab=usage`
2. Extension automatically adds "Usage Analytics" section with charts:
   - By Model
   - By Time of Day
   - By Day of Week
   - By Month

### Calculate from Table
1. Go to `cursor.com/dashboard?tab=usage`
2. Extension automatically calculates and displays summary block
3. If auto-calculate is off, click "Calculate Usage" button to calculate manually
4. Click "Export Summary Data" to export CSV

### Settings
In the popup, you can:
- **Show Usage Badge**: Toggle badge display (default: on)
- **Auto Calculate**: Automatically calculate when entering usage page (default: on)
- **Cache Duration**: Choose cache time 1 minute or 3 minutes
- **Proxy URL**: Configure proxy server URL (see [Proxy Server](#-proxy-server-optional) section for more details)
- **Clear Cache**: Manually clear cache

## 🎯 Use Cases

### For Developers
- Track usage to avoid exceeding limits
- Analyze usage patterns to optimize workflow
- Predict monthly costs

### For Teams
- Monitor team usage
- Analyze usage trends
- Manage budget effectively

### For Individuals
- Understand Cursor usage
- Optimize usage time
- Avoid unnecessary costs

## 🔧 Project Structure

```
Cursor Usage/
├── manifest.json          # Manifest file for extension
├── background.js          # Service worker handling badge and cache
├── popup.html            # Popup UI
├── popup.js              # Popup logic
├── content.js            # Script running on dashboard page
├── proxy.php             # Proxy server (optional, upload to server)
├── assets/
│   └── js/
│       └── chart.min.js  # Chart.js library
├── icons/                # Extension icons
└── _locales/             # i18n messages
    ├── en/
    └── vi/
```

## 🛠️ Technologies Used

- **Manifest V3**: Using Chrome Extension Manifest V3
- **Chart.js**: Chart library
- **Chrome Storage API**: Store settings and cache
- **Chrome Cookies API**: Auto retrieve cookies
- **Chrome Alarms API**: Auto refresh badge

## 📝 Permissions

Extension requires the following permissions:
- `cookies`: To retrieve cookies from cursor.com
- `storage`: To store settings and cache
- `alarms`: To automatically refresh badge
- `activeTab`: To run script on dashboard page

## 🔒 Privacy

- Extension only reads cookies from cursor.com
- Data is stored locally on your machine
- **When using proxy**: Cookies are sent to your proxy server to forward requests to Cursor API. Proxy does not store cookies or data.
- **When not using proxy**: Cookies are only used to fetch data from Cursor API directly
- No data is sent to third-party servers except the proxy server you configure

## 🌐 Proxy Server (Optional)

The extension supports using a proxy server to handle CORS issues and security when calling the API directly from the browser.

### Why Use a Proxy?

- **Solve CORS**: Some browsers may block direct requests to Cursor API due to CORS policy
- **Cookie security**: Proxy helps handle cookies more securely
- **Customization**: You can host your own proxy server

### Proxy Server Installation

#### System Requirements

- **PHP 7.4+** or higher
- **cURL extension** enabled in PHP
- **Web server** (Apache, Nginx, or PHP built-in server)

#### Installation Steps

1. **Upload proxy.php file to server**
   ```bash
   # Upload proxy.php file to your web directory
   # Example: /var/www/html/extension/cursor-used/proxy.php
   ```

2. **Check file access permissions**
   ```bash
   # Ensure file has read permissions
   chmod 644 proxy.php
   ```

3. **Check cURL extension**
   ```bash
   # Check if PHP has cURL
   php -m | grep curl
   ```

4. **Test proxy server**
   ```bash
   # Test by accessing proxy URL in browser
   # If you see JSON response with message "Cookie found..." it's successful
   ```

#### Configure Extension to Use Proxy

1. **Open extension popup** (click icon)
2. **Scroll to Settings section**
3. **Find "Proxy URL" field**
4. **Enter proxy server URL**:
   - If proxy.php is in root directory: `https://yourdomain.com/proxy.php`
   - If proxy.php is in subdirectory: `https://yourdomain.com/extension/cursor-used/`
   - Extension will automatically add `proxy.php` if URL ends with `/`
5. **URL will be saved automatically** when you change it

#### Configuration Examples

```
Proxy URL: https://addlivetag.com/extension/cursor-used/
```

or

```
Proxy URL: https://yourdomain.com/proxy.php
```

#### Using Direct API (No Proxy)

- **Leave Proxy URL field empty** or enter empty string
- Extension will call API directly to Cursor
- Requires browser to support CORS and cookies

### How Proxy Works

1. **Extension sends request** to proxy server with:
   - Cookie `WorkosCursorSessionToken` in request body
   - JSON payload with filter/query information

2. **Proxy server**:
   - Receives request from extension
   - Retrieves cookie from request body or header
   - Forwards request to Cursor API (`https://cursor.com/api/dashboard/get-filtered-usage-events`)
   - Returns response to extension

3. **Extension receives response** and processes data as normal

### Proxy Security

- **Cookies only transmitted via HTTPS**: Ensure your proxy server uses SSL/TLS
- **No cookie storage**: Proxy does not store cookies, only forwards requests
- **CORS headers**: Proxy automatically adds CORS headers so extension can call

### Troubleshooting Proxy

#### Proxy Not Working

1. **Check if proxy URL is correct**
   - Ensure URL is accessible from browser
   - Test by opening URL in browser

2. **Check PHP and cURL**
   ```bash
   php -v
   php -m | grep curl
   ```

3. **Check PHP error logs**
   - View web server error log
   - Enable error reporting in PHP for debugging

4. **Check SSL certificate**
   - Ensure SSL certificate is valid
   - Extension only calls HTTPS URLs

#### "Missing WorkosCursorSessionToken cookie" Error

1. **Ensure you're logged into Cursor** in browser
2. **Check if cookie exists**:
   - Open DevTools > Application > Cookies
   - Find `WorkosCursorSessionToken` cookie at `cursor.com`

#### CORS Error

1. **Check CORS headers** in proxy.php
2. **Ensure proxy server returns correct headers**:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Accept, Cookie
   ```

#### 500 Internal Server Error

1. **Check PHP error log**
2. **Check if cURL is working**
3. **Check timeout settings** in proxy.php
4. **Check PHP memory limit**

### Default Proxy

Extension has a default proxy at:
```
https://addlivetag.com/extension/cursor-used/
```

You can use this proxy or host your own proxy server.

## 🐛 Troubleshooting

### Badge Not Displaying
1. Check "Show Usage Badge" is enabled in popup
2. Ensure you're logged into Cursor
3. Refresh extension or reload page

### Data Not Updating
1. Click "Clear Cache" in popup
2. Wait a few seconds for extension to fetch new data
3. Reload popup

### Charts Not Displaying on Dashboard
1. Ensure you're on `cursor.com/dashboard?tab=usage` page
2. Check console for errors
3. Reload page

### Calculation Not Accurate
1. Ensure table is fully loaded
2. If there are multiple pages, extension will automatically browse through
3. Click "Calculate Usage" to recalculate manually

## 🤝 Contributing

All contributions are welcome! Please:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push and create Pull Request

## 📄 License

MIT License - See LICENSE file for more details

## 👨‍💻 Author

Developed to help the Cursor user community track and optimize their AI coding assistant usage.

## 🙏 Acknowledgments

- Thanks to Cursor team for creating a great tool
- Thanks to Chart.js for the powerful chart library
- Thanks to the open source community

> **Note:** This tool references ideas and <br>
> some methods from the [Cursor Usage](https://chromewebstore.google.com/detail/cursor-usage/feemeooihcjjkddafjjldpajadjhlela) extension.

## 📞 Support

If you encounter issues or have questions:
- Open an issue on GitHub
- Check documentation
- See troubleshooting section

---

**Note**: This extension is not an official Cursor product. This is a community tool to support users.

---

<a id="tiếng-việt"></a>
# Tiếng Việt

Tiện ích mở rộng Chrome giúp theo dõi và phân tích chi tiết việc sử dụng Cursor AI của bạn với các tính năng mạnh mẽ và dễ sử dụng.

---

## 📷 Demo giao diện

![Demo ảnh Popup Extension](https://upanh.nhatkythuthuat.com/images/2025/11/22/image033a060943c7345c.png)

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
> một số phương pháp từ tiện ích [Cursor Usage](https://chromewebstore.google.com/detail/cursor-usage/feemeooihcjjkddafjjldpajadjhlela).

## 📞 Support

Nếu gặp vấn đề hoặc có câu hỏi:
- Mở issue trên GitHub
- Kiểm tra documentation
- Xem troubleshooting section

---

**Lưu ý**: Extension này không phải là sản phẩm chính thức của Cursor. Đây là một công cụ của cộng đồng để hỗ trợ người dùng.
