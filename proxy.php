<?php
/**
 * Cursor API Proxy
 * Proxy server để forward requests đến Cursor API với cookie authentication.
 */

// Bắt lỗi toàn cục (global error handler)
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => "PHP error: $errstr at $errfile:$errline"
    ]);
    exit;
});
set_exception_handler(function($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Internal Server Error',
        'details' => $e->getMessage()
    ]);
    exit;
});

/**
 * CORS headers - cho phép extension gọi API
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Accept-Language, Origin, Referer, User-Agent, Cookie');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Chỉ chấp nhận POST requests cho API proxy
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    checkCookieAndRedirect();
    exit;
}

/**
 * Kiểm tra cookie và redirect nếu thiếu
 */
function checkCookieAndRedirect() {
    $cookie = getWorkosCursorSessionToken();
    
    if (empty($cookie)) {
        header('Location: https://cursor.com/dashboard?tab=usage');
        exit;
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'ok',
        'message' => 'Cookie found. Use POST method to proxy API requests.'
    ]);
}

/**
 * Lấy WorkosCursorSessionToken cookie
 */
function getWorkosCursorSessionToken() {
    // Ưu tiên: Cookie từ payload, sau đó là từ header
    $rawBody = file_get_contents('php://input');
    if ($rawBody) {
        $payload = json_decode($rawBody, true);
        if (is_array($payload) && isset($payload['cookie'])) {
            $cookieStr = $payload['cookie'];
            // Nếu truyền nguyên str cookie
            if (strpos($cookieStr, 'WorkosCursorSessionToken=') !== false) {
                $pieces = explode(';', $cookieStr);
                foreach ($pieces as $piece) {
                    $piece = trim($piece);
                    if (strpos($piece, 'WorkosCursorSessionToken=') === 0) {
                        return urldecode(substr($piece, strlen('WorkosCursorSessionToken=')));
                    }
                }
            }
            // Nếu truyền value trực tiếp
            elseif ($cookieStr !== '') {
                return urldecode($cookieStr);
            }
        }
    }
    
    // Kiểm tra cookie từ header
    if (isset($_SERVER['HTTP_COOKIE'])) {
        foreach (explode(';', $_SERVER['HTTP_COOKIE']) as $cookie) {
            $cookie = trim($cookie);
            if ($cookie === "") continue;
            $parts = explode('=', $cookie, 2);
            if (count($parts) === 2 && $parts[0] === 'WorkosCursorSessionToken') {
                return urldecode($parts[1]);
            }
        }
    }
    
    // Kiểm tra từ $_COOKIE
    if (isset($_COOKIE['WorkosCursorSessionToken'])) {
        return urldecode($_COOKIE['WorkosCursorSessionToken']);
    }
    
    return null;
}

/**
 * Tạo cookie string đúng spec cursor
 */
function buildCursorCookie($sessionToken) {
    // Lấy các cookie khác từ request nếu có
    $cookies = [];
    
    // Lấy từ header
    if (isset($_SERVER['HTTP_COOKIE'])) {
        foreach (explode(';', $_SERVER['HTTP_COOKIE']) as $cookie) {
            $cookie = trim($cookie);
            if ($cookie === "") continue;
            $parts = explode('=', $cookie, 2);
            if (count($parts) === 2) {
                $cookies[$parts[0]] = $parts[1];
            }
        }
    }
    
    // Lấy từ $_COOKIE nếu chưa có
    if (isset($_COOKIE) && is_array($_COOKIE)) {
        foreach ($_COOKIE as $name => $value) {
            if (!isset($cookies[$name])) {
                $cookies[$name] = $value;
            }
        }
    }
    
    // Đảm bảo có session token
    $cookies['WorkosCursorSessionToken'] = urlencode($sessionToken);
    
    // Xây dựng chuỗi cookie
    $cookiePairs = [];
    foreach ($cookies as $name => $value) {
        $cookiePairs[] = $name . '=' . $value;
    }
    
    return implode('; ', $cookiePairs);
}

/**
 * Proxy request đến Cursor API
 */
function proxyRequest() {
    $requestBody = file_get_contents('php://input');
    if ($requestBody === false) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Cannot read request body']);
        exit;
    }
    
    $data = json_decode($requestBody, true);
    if (!empty($requestBody) && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid JSON in request body']);
        exit;
    }
    
    $sessionToken = getWorkosCursorSessionToken();
    if (empty($sessionToken)) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Missing WorkosCursorSessionToken cookie. Please log in to cursor.com first.',
            'redirect' => 'https://cursor.com/dashboard?tab=usage'
        ]);
        exit;
    }

    // Xóa trường cookie từ dữ liệu gửi đi nếu có
    if (is_array($data) && isset($data['cookie'])) {
        unset($data['cookie']);
        $requestBody = json_encode($data);
    }

    $cookieString = buildCursorCookie($sessionToken);

    // Headers chuẩn như mẫu curl
    $headers = [
        "accept: */*",
        "accept-language: vi,en;q=0.9,vi-VN;q=0.8,en-US;q=0.7",
        "content-type: application/json",
        "origin: https://cursor.com",
        "priority: u=1, i",
        "referer: https://cursor.com/dashboard?tab=usage",
        'sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
        'sec-ch-ua-arch: "x86"',
        'sec-ch-ua-bitness: "64"',
        'sec-ch-ua-mobile: ?0',
        'sec-ch-ua-platform: "Windows"',
        'sec-ch-ua-platform-version: "10.0.0"',
        'sec-fetch-dest: empty',
        'sec-fetch-mode: cors',
        'sec-fetch-site: same-origin',
        'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
        'Cookie: ' . $cookieString
    ];

    $apiUrl = 'https://cursor.com/api/dashboard/get-filtered-usage-events';

    $ch = curl_init();
    if ($ch === false) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Failed to initialize cURL'
        ]);
        exit;
    }

    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => $requestBody,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_VERBOSE => true, // Bật verbose để debug
        CURLOPT_HEADER => true, // Lấy cả header để debug
    ]);

    // Execute request
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    
    // Tách header và body để debug
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $responseHeaders = substr($response, 0, $headerSize);
    $responseBody = substr($response, $headerSize);

    if (curl_errno($ch)) {
        curl_close($ch);
        http_response_code(502);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Proxy error: ' . $error,
            'debug' => [
                'headers' => $headers,
                'response_headers' => $responseHeaders
            ]
        ]);
        exit;
    }
    curl_close($ch);

    // Nếu có lỗi 500, trả về thông tin debug
    if ($httpCode >= 500) {
        http_response_code($httpCode);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Cursor API returned server error',
            'status' => $httpCode,
            'body' => $responseBody,
            'debug' => [
                'request_headers' => $headers,
                'request_body' => $requestBody,
                'response_headers' => $responseHeaders
            ]
        ]);
        exit;
    }

    http_response_code($httpCode);
    if ($contentType && !empty($contentType)) {
        header('Content-Type: ' . $contentType);
    } else {
        header('Content-Type: application/json');
    }

    echo $responseBody;
}

proxyRequest();