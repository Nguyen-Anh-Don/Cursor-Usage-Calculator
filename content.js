// Hàm lấy message i18n
function getMessage(messageName) {
    // Sử dụng chrome.i18n nếu có, nếu không thì fallback
    if (typeof chrome !== "undefined" && chrome.i18n) {
        return chrome.i18n.getMessage(messageName);
    }
    // Fallback cho development
    const fallbacks = {
        summaryTitle: "Usage Summary",
        totalRequests: "Total Requests",
        successfulRequests: "Successful Requests",
        failedRequests: "Failed Requests",
        totalTokens: "Total Tokens",
        totalCost: "Total Cost",
        successRate: "Success Rate",
        exportData: "Export Summary Data",
        calculateNow: "Calculate Usage",
        calculating: "Calculating...",
    };
    return fallbacks[messageName] || messageName;
}

// Kiểm tra xem có phải trang usage không
function isUsagePage() {
    const url = window.location.href;
    return url.includes("cursor.com/dashboard") && url.includes("tab=usage");
}

// Hàm chờ đợi phần tử xuất hiện trên trang
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            return resolve(element);
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`));
        }, timeout);
    });
}

// Hàm chuyển đổi rows per page sang 500
async function changeRowsPerPage() {
    try {
        // Tìm select element cho rows per page
        const select = document.querySelector("select.rounded.border");
        if (!select) {
            console.warn("Rows per page select not found");
            return false;
        }

        // Kiểm tra xem đã là 500 chưa
        if (select.value === "500") {
            return true;
        }

        // Thay đổi giá trị sang 500
        select.value = "500";

        // Trigger change event
        const changeEvent = new Event("change", { bubbles: true });
        select.dispatchEvent(changeEvent);

        // Chờ 1-2 giây để trang load lại
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Chờ bảng load lại
        await waitForElement("table tbody", 5000);

        return true;
    } catch (error) {
        console.error("Error changing rows per page:", error);
        return false;
    }
}

// Hàm tính toán tổng hợp dữ liệu
function calculateUsageTotals() {
    const table = document.querySelector("table");
    if (!table) return null;

    const rows = table.querySelectorAll("tbody tr");
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let successfulRequests = 0;

    rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 5) {
            // Tăng tổng số yêu cầu
            totalRequests++;

            // Lấy số token
            const tokenCell = cells[3];
            const tokenText = tokenCell.textContent.trim();
            const tokenMatch = tokenText.match(/([\d.]+)([KMB]?)/);
            if (tokenMatch) {
                let tokenValue = parseFloat(tokenMatch[1]);
                const tokenUnit = tokenMatch[2];

                // Chuyển đổi K, M, B thành số tương ứng
                if (tokenUnit === "K") tokenValue *= 1000;
                else if (tokenUnit === "M") tokenValue *= 1000000;
                else if (tokenUnit === "B") tokenValue *= 1000000000;

                totalTokens += tokenValue;
            }

            // Lấy chi phí
            const costCell = cells[4];
            const costText = costCell.textContent.trim();

            // Kiểm tra xem có phải là yêu cầu thành công không
            if (!costText.includes("-")) {
                successfulRequests++;

                // Tìm giá trị chi phí
                const costMatch = costText.match(/\$(\d+\.?\d*)/);
                if (costMatch) {
                    totalCost += parseFloat(costMatch[1]);
                }
            }
        }
    });

    return {
        totalRequests,
        successfulRequests,
        failedRequests: totalRequests - successfulRequests,
        totalTokens,
        totalCost,
    };
}

// Hàm tích lũy totals từ nhiều trang
function accumulateTotals(total1, total2) {
    if (!total1) return total2;
    if (!total2) return total1;

    return {
        totalRequests: total1.totalRequests + total2.totalRequests,
        successfulRequests: total1.successfulRequests + total2.successfulRequests,
        failedRequests: total1.failedRequests + total2.failedRequests,
        totalTokens: total1.totalTokens + total2.totalTokens,
        totalCost: total1.totalCost + total2.totalCost,
    };
}

// Hàm tạo khối hiển thị tổng hợp
function createSummaryBlock(totals) {
    if (!totals) return null;

    // Xóa tất cả các summary blocks cũ để tránh duplicate
    const existingSummaries = document.querySelectorAll(".cursor-usage-summary");
    existingSummaries.forEach((summary) => summary.remove());

    // Tạo container chính
    const summaryContainer = document.createElement("div");
    summaryContainer.className = "cursor-usage-summary";
    summaryContainer.style.cssText = `
      background-color: var(--color-theme-bg-card-02, #1e1e1e);
      border-radius: 8px;
      padding: 0.8rem;
      margin: 0.8rem 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      font-family: var(--font-cursor-gothic-beta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    // Tạo tiêu đề
    const title = document.createElement("h3");
    title.textContent = getMessage("summaryTitle");
    title.style.cssText = `
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-theme-fg, #ffffff);
    `;
    summaryContainer.appendChild(title);

    // Tạo grid cho các chỉ số
    const statsGrid = document.createElement("div");
    statsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    `;

    // Hàm tạo một mục thống kê
    function createStatItem(label, value, unit = "") {
        const statItem = document.createElement("div");
        statItem.style.cssText = `
        background-color: var(--color-theme-bg-card-01, #2a2a2a);
        border-radius: 6px;
        padding: 12px;
      `;

        const statLabel = document.createElement("div");
        statLabel.textContent = label;
        statLabel.style.cssText = `
        font-size: 1rem;
        color: var(--color-theme-text-sec, #a0a0a0);
        margin-bottom: 4px;
      `;

        const statValue = document.createElement("div");
        statValue.textContent = `${value.toLocaleString()} ${unit}`;
        statValue.style.cssText = `
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--color-theme-fg, #ffffff);
      `;

        statItem.appendChild(statLabel);
        statItem.appendChild(statValue);

        return statItem;
    }

    // Thêm các mục thống kê
    statsGrid.appendChild(createStatItem(getMessage("totalRequests"), totals.totalRequests));
    statsGrid.appendChild(createStatItem(getMessage("successfulRequests"), totals.successfulRequests));
    statsGrid.appendChild(createStatItem(getMessage("failedRequests"), totals.failedRequests));
    statsGrid.appendChild(createStatItem(getMessage("totalTokens"), formatNumber(totals.totalTokens)));
    statsGrid.appendChild(createStatItem(getMessage("totalCost"), totals.totalCost.toFixed(2), "$"));

    // Thêm tỷ lệ thành công
    const successRate = totals.totalRequests > 0 ? ((totals.successfulRequests / totals.totalRequests) * 100).toFixed(1) : 0;
    statsGrid.appendChild(createStatItem(getMessage("successRate"), successRate, "%"));

    summaryContainer.appendChild(statsGrid);

    // Thêm nút xuất CSV
    const exportButton = document.createElement("button");
    exportButton.textContent = getMessage("exportData");
    exportButton.style.cssText = `
      margin-top: 12px;
      background: transparent;
      color: var(--color-theme-text);
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 13px;
      transition: background-color 0.2s;
    `;

    exportButton.addEventListener("click", () => {
        exportSummaryData(totals);
    });

    exportButton.addEventListener("mouseenter", () => {
        exportButton.style.backgroundColor = "var(--color-theme-bg-card-01, #2a2a2a)";
    });

    exportButton.addEventListener("mouseleave", () => {
        exportButton.style.background = "transparent";
    });

    summaryContainer.appendChild(exportButton);

    return summaryContainer;
}

// Hàm định dạng số lớn
function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + "B";
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + "M";
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + "K";
    }
    return num.toFixed(0);
}

// Hàm xuất dữ liệu tổng hợp
function exportSummaryData(totals) {
    const data = [
        ["Chỉ Số", "Giá Trị"],
        ["Tổng Yêu Cầu", totals.totalRequests],
        ["Yêu Cầu Thành Công", totals.successfulRequests],
        ["Yêu Cầu Thất Bại", totals.failedRequests],
        ["Tổng Tokens", totals.totalTokens],
        ["Tổng Chi Phí ($)", totals.totalCost.toFixed(2)],
        ["Tỷ Lệ Thành Công (%)", totals.totalRequests > 0 ? ((totals.successfulRequests / totals.totalRequests) * 100).toFixed(1) : 0],
    ];

    // Tạo CSV
    let csv = "";
    data.forEach((row) => {
        csv += row.join(",") + "\n";
    });

    // Tạo blob và tải về
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cursor_usage_summary_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Hàm xử lý tất cả các trang
async function processAllPages() {
    try {
        // Chờ bảng dữ liệu xuất hiện
        await waitForElement("table tbody");

        // Chuyển sang 500 rows per page
        const changed = await changeRowsPerPage();
        if (!changed) {
            console.warn("Could not change rows per page, processing current page only");
        }

        // Chờ thêm 1-2 giây sau khi chuyển đổi
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Khởi tạo totals tổng hợp
        let accumulatedTotals = null;

        // Xử lý từng trang
        let pageProcessed = 0;
        while (true) {
            // Chờ bảng load
            await waitForElement("table tbody", 5000);

            // Tính toán cho trang hiện tại
            const pageTotals = calculateUsageTotals();
            if (pageTotals) {
                accumulatedTotals = accumulateTotals(accumulatedTotals, pageTotals);
                pageProcessed++;
                console.log(`Processed page ${pageProcessed}, current totals:`, accumulatedTotals);
            }

            // Kiểm tra xem có trang tiếp theo không
            const nextButton = document.querySelector('button[aria-label="Next page"]');
            if (!nextButton || nextButton.hasAttribute("disabled")) {
                // Không còn trang nào
                break;
            }

            // Click nút next
            nextButton.click();

            // Chờ trang mới load (1-2 giây)
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        console.log(`Finished processing ${pageProcessed} page(s)`, accumulatedTotals);
        return accumulatedTotals;
    } catch (error) {
        console.error("Error processing all pages:", error);
        return null;
    }
}

// Hàm tạo nút tính toán thủ công
function createCalculateButton() {
    // Xóa nút cũ nếu có
    const existingButton = document.querySelector(".cursor-calculate-button");
    if (existingButton) {
        existingButton.remove();
    }

    const button = document.createElement("button");
    button.className = "cursor-calculate-button";
    // Thêm icon SVG vào đầu button
    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgIcon.setAttribute("width", "24");
    svgIcon.setAttribute("height", "24");
    svgIcon.setAttribute("viewBox", "0 0 24 24");
    svgIcon.setAttribute("fill", "none");
    svgIcon.setAttribute("stroke", "currentColor");
    svgIcon.setAttribute("stroke-width", "2");
    svgIcon.setAttribute("stroke-linecap", "round");
    svgIcon.setAttribute("stroke-linejoin", "round");
    svgIcon.setAttribute("class", "w-4 h-4");

    const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line1.setAttribute("x1", "18");
    line1.setAttribute("y1", "20");
    line1.setAttribute("x2", "18");
    line1.setAttribute("y2", "10");

    const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line2.setAttribute("x1", "12");
    line2.setAttribute("y1", "20");
    line2.setAttribute("x2", "12");
    line2.setAttribute("y2", "4");

    const line3 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line3.setAttribute("x1", "6");
    line3.setAttribute("y1", "20");
    line3.setAttribute("x2", "6");
    line3.setAttribute("y2", "14");

    svgIcon.appendChild(line1);
    svgIcon.appendChild(line2);
    svgIcon.appendChild(line3);

    button.appendChild(svgIcon);
    button.appendChild(document.createTextNode(getMessage("calculateNow")));
    button.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 10000;
        height: 24px;
        padding: 4px 6px;
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 16px;
        color: var(--color-theme-text);
        outline: 1px solid var(--color-theme-border-secondary);
        outline-offset: -1px;
        background: transparent;
        border: none;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        cursor: pointer;
        transition: background-color .15s ease, outline-color .15s ease, color .15s ease;
        font-family: var(--font-cursor-gothic-beta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    button.addEventListener("mouseenter", () => {
        button.style.backgroundColor = "var(--color-theme-bg-card-01, #2a2a2a)";
    });

    button.addEventListener("mouseleave", () => {
        button.style.backgroundColor = "transparent";
    });

    button.addEventListener("click", async () => {
        button.disabled = true;
        button.textContent = getMessage("calculating");
        button.style.opacity = "0.7";
        button.style.cursor = "not-allowed";

        try {
            await runExtension();
        } finally {
            button.disabled = false;
            button.textContent = getMessage("calculateNow");
            button.style.opacity = "1";
            button.style.cursor = "pointer";
        }
    });

    document.body.appendChild(button);
    return button;
}

// Hàm chính để chạy tiện ích
async function runExtension() {
    try {
        // Kiểm tra URL
        if (!isUsagePage()) {
            return;
        }

        // Xử lý tất cả các trang
        const totals = await processAllPages();

        if (totals) {
            // Tạo khối hiển thị tổng hợp
            const summaryBlock = createSummaryBlock(totals);

            if (summaryBlock) {
                // Tìm vị trí để chèn khối tổng hợp
                const tableContainer = document.querySelector(".overflow-x-auto")?.parentElement;

                if (tableContainer) {
                    // Chèn khối tổng hợp trước bảng
                    tableContainer.parentElement.insertBefore(summaryBlock, tableContainer);
                } else {
                    // Nếu không tìm thấy vị trí phù hợp, thêm vào đầu phần nội dung chính
                    const mainContent = document.querySelector(".md\\:col-span-3");
                    if (mainContent) {
                        mainContent.insertBefore(summaryBlock, mainContent.firstChild);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Cursor Usage Calculator Error:", error);
    }
}

// Flag để tránh trigger observer khi đang xử lý pagination
let isProcessing = false;

// Hàm khởi tạo extension
async function initExtension() {
    // Kiểm tra URL
    if (!isUsagePage()) {
        return;
    }

    // Lấy cấu hình auto-calculate
    let autoCalculate = true; // Default là true
    try {
        if (typeof chrome !== "undefined" && chrome.storage) {
            const result = await chrome.storage.sync.get(["autoCalculate"]);
            autoCalculate = result.autoCalculate !== false; // Default là true nếu chưa có setting
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }

    // Chờ bảng load
    try {
        await waitForElement("table tbody", 10000);
    } catch (error) {
        console.warn("Table not found, waiting...");
        return;
    }

    if (autoCalculate) {
        // Tự động tính toán
        isProcessing = true;
        runExtension().finally(() => {
            isProcessing = false;
        });
    } else {
        // Hiển thị nút tính toán thủ công
        createCalculateButton();
    }
}

// Chạy tiện ích khi trang tải xong
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExtension);
} else {
    initExtension();
}

// Lắng nghe thay đổi URL (SPA navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Xóa summary và button cũ
        document.querySelectorAll(".cursor-usage-summary").forEach((el) => el.remove());
        document.querySelectorAll(".cursor-calculate-button").forEach((el) => el.remove());
        // Khởi tạo lại
        setTimeout(initExtension, 500);
    }
}).observe(document, { subtree: true, childList: true });

// Lắng nghe thay đổi trên trang (ví dụ: khi người dùng thay đổi bộ lọc)
const observer = new MutationObserver(async (mutations) => {
    // Chỉ chạy khi ở trang usage
    if (!isUsagePage()) {
        return;
    }

    // Bỏ qua nếu đang xử lý pagination
    if (isProcessing) {
        return;
    }

    // Kiểm tra auto-calculate setting
    let autoCalculate = true;
    try {
        if (typeof chrome !== "undefined" && chrome.storage) {
            const result = await chrome.storage.sync.get(["autoCalculate"]);
            autoCalculate = result.autoCalculate !== false;
        }
    } catch (error) {
        // Ignore
    }

    // Chỉ recalculate nếu auto-calculate bật
    if (!autoCalculate) {
        return;
    }

    let shouldRecalculate = false;

    mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
            // Kiểm tra xem bảng dữ liệu có được cập nhật không
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === "TABLE" || (node.querySelector && node.querySelector("table")))) {
                    // Chỉ recalculate nếu không phải là thay đổi do pagination
                    const isPaginationChange = node.closest && (node.closest('button[aria-label="Next page"]') || node.closest("select.rounded.border"));
                    if (!isPaginationChange) {
                        shouldRecalculate = true;
                        break;
                    }
                }
            }
        }
    });

    if (shouldRecalculate) {
        // Xóa tất cả các khối tổng hợp cũ
        const existingSummaries = document.querySelectorAll(".cursor-usage-summary");
        existingSummaries.forEach((summary) => summary.remove());

        // Tính toán lại và hiển thị khối tổng hợp mới
        setTimeout(() => {
            isProcessing = true;
            runExtension().finally(() => {
                isProcessing = false;
            });
        }, 500);
    }
});

// Bắt đầu quan sát thay đổi trong DOM
observer.observe(document.body, {
    childList: true,
    subtree: true,
});

// Lắng nghe thay đổi setting từ popup
if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync" && changes.autoCalculate) {
            // Xóa summary và button cũ
            document.querySelectorAll(".cursor-usage-summary").forEach((el) => el.remove());
            document.querySelectorAll(".cursor-calculate-button").forEach((el) => el.remove());
            document.querySelectorAll(".cursor-usage-charts").forEach((el) => el.remove());
            // Khởi tạo lại với setting mới
            setTimeout(initExtension, 300);
        }
    });
}

// ========== CHART FUNCTIONALITY ==========

// Load Chart.js library
function loadChartJS() {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== "undefined") {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("assets/js/chart.min.js");
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Chart.js"));
        document.head.appendChild(script);
    });
}

// Get cookie helper
async function getCookieForCharts() {
    return new Promise((resolve) => {
        chrome.cookies.get(
            { url: "https://www.cursor.com", name: "WorkosCursorSessionToken" },
            (cookie) => {
                if (cookie) {
                    resolve(cookie.value);
                } else {
                    chrome.cookies.get(
                        { url: "https://cursor.com", name: "WorkosCursorSessionToken" },
                        (cookie) => resolve(cookie?.value || null)
                    );
                }
            }
        );
    });
}

// Fetch usage events for charts
async function fetchUsageEventsForCharts(cookie, startDate, endDate) {
    try {
        const response = await fetch(
            "https://cursor.com/api/dashboard/get-filtered-usage-events",
            {
                method: "POST",
                mode: "cors",
                headers: {
                    "accept": "*/*",
                    "accept-language": "en-US,en;q=0.9",
                    "content-type": "application/json",
                    "priority": "u=1, i",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "sec-fetch-storage-access": "active"
                },
                body: JSON.stringify({
                    teamId: 0,
                    startDate: startDate,
                    endDate: endDate,
                    page: 1,
                    pageSize: 500
                }),
                credentials: "include"
            }
        );

        if (response.status === 403) {
            // Return null silently for 403 errors
            return null;
        }

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.usageEventsDisplay || [];
    } catch (error) {
        // Only log unexpected errors (not 403)
        if (error.message && !error.message.includes("403")) {
            console.warn("Failed to fetch usage events for charts:", error);
        }
        return null;
    }
}

// Process usage events for analytics
function processUsageEventsForAnalytics(events) {
    if (!events || !Array.isArray(events)) {
        return {
            byModel: {},
            byHour: new Array(24).fill(0),
            byDay: new Array(7).fill(0),
            byMonth: new Array(12).fill(0),
            byAction: {}
        };
    }

    const stats = {
        byModel: {},
        byHour: new Array(24).fill(0),
        byDay: new Array(7).fill(0),
        byMonth: new Array(12).fill(0),
        byAction: {}
    };

    events.forEach((event) => {
        if (event.kind === "USAGE_EVENT_KIND_ERRORED_NOT_CHARGED" || 
            event.kind === "USAGE_EVENT_KIND_ABORTED_NOT_CHARGED") {
            return; // Skip errored events
        }

        const timestamp = parseInt(event.timestamp);
        if (isNaN(timestamp)) return;

        const date = new Date(timestamp);
        const hour = date.getUTCHours();
        const day = date.getUTCDay();
        const month = date.getUTCMonth();

        // By model
        const model = event.model || "Unknown";
        stats.byModel[model] = (stats.byModel[model] || 0) + 1;

        // By hour
        stats.byHour[hour]++;

        // By day
        stats.byDay[day]++;

        // By month
        stats.byMonth[month]++;

        // By action (simplified - would need to parse event details)
        // For now, we'll use a placeholder
    });

    return stats;
}

// Create charts container
function createChartsContainer() {
    // Remove existing charts
    const existing = document.querySelectorAll(".cursor-usage-charts");
    existing.forEach((el) => el.remove());

    const container = document.createElement("div");
    container.className = "cursor-usage-charts";
    container.style.cssText = `
        background-color: var(--color-theme-bg-card-02, #1e1e1e);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        font-family: var(--font-cursor-gothic-beta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    const title = document.createElement("h3");
    title.textContent = "Usage Analytics";
    title.style.cssText = `
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--color-theme-fg, #ffffff);
    `;
    container.appendChild(title);

    // Charts grid
    const chartsGrid = document.createElement("div");
    chartsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    `;

    // Model chart
    const modelChartWrapper = document.createElement("div");
    modelChartWrapper.style.cssText = `
        background-color: var(--color-theme-bg-card-01, #2a2a2a);
        border-radius: 6px;
        padding: 1rem;
    `;
    const modelTitle = document.createElement("h4");
    modelTitle.textContent = "By Model";
    modelTitle.style.cssText = `margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--color-theme-fg, #ffffff);`;
    modelChartWrapper.appendChild(modelTitle);
    const modelCanvas = document.createElement("canvas");
    modelCanvas.id = "cursor-chart-model";
    modelChartWrapper.appendChild(modelCanvas);
    chartsGrid.appendChild(modelChartWrapper);

    // Time of day chart
    const timeChartWrapper = document.createElement("div");
    timeChartWrapper.style.cssText = `
        background-color: var(--color-theme-bg-card-01, #2a2a2a);
        border-radius: 6px;
        padding: 1rem;
    `;
    const timeTitle = document.createElement("h4");
    timeTitle.textContent = "By Time of Day";
    timeTitle.style.cssText = `margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--color-theme-fg, #ffffff);`;
    timeChartWrapper.appendChild(timeTitle);
    const timeCanvas = document.createElement("canvas");
    timeCanvas.id = "cursor-chart-time";
    timeChartWrapper.appendChild(timeCanvas);
    chartsGrid.appendChild(timeChartWrapper);

    // Day of week chart
    const dayChartWrapper = document.createElement("div");
    dayChartWrapper.style.cssText = `
        background-color: var(--color-theme-bg-card-01, #2a2a2a);
        border-radius: 6px;
        padding: 1rem;
    `;
    const dayTitle = document.createElement("h4");
    dayTitle.textContent = "By Day of Week";
    dayTitle.style.cssText = `margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--color-theme-fg, #ffffff);`;
    dayChartWrapper.appendChild(dayTitle);
    const dayCanvas = document.createElement("canvas");
    dayCanvas.id = "cursor-chart-day";
    dayChartWrapper.appendChild(dayCanvas);
    chartsGrid.appendChild(dayChartWrapper);

    // Month chart
    const monthChartWrapper = document.createElement("div");
    monthChartWrapper.style.cssText = `
        background-color: var(--color-theme-bg-card-01, #2a2a2a);
        border-radius: 6px;
        padding: 1rem;
    `;
    const monthTitle = document.createElement("h4");
    monthTitle.textContent = "By Month";
    monthTitle.style.cssText = `margin: 0 0 0.5rem 0; font-size: 0.9rem; color: var(--color-theme-fg, #ffffff);`;
    monthChartWrapper.appendChild(monthTitle);
    const monthCanvas = document.createElement("canvas");
    monthCanvas.id = "cursor-chart-month";
    monthChartWrapper.appendChild(monthCanvas);
    chartsGrid.appendChild(monthChartWrapper);

    container.appendChild(chartsGrid);
    return container;
}

// Create charts
function createCharts(stats) {
    if (typeof Chart === "undefined") {
        console.warn("Chart.js not loaded");
        return;
    }

    // Destroy existing charts
    [Chart.getChart("cursor-chart-model"), 
     Chart.getChart("cursor-chart-time"),
     Chart.getChart("cursor-chart-day"),
     Chart.getChart("cursor-chart-month")].forEach(chart => {
        if (chart) chart.destroy();
    });

    // Model chart
    const modelData = Object.entries(stats.byModel)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (modelData.length > 0) {
        new Chart(document.getElementById("cursor-chart-model"), {
            type: "bar",
            data: {
                labels: modelData.map(([model]) => model.length > 20 ? model.substring(0, 20) + "..." : model),
                datasets: [{
                    label: "Requests",
                    data: modelData.map(([, count]) => count),
                    backgroundColor: "#4ade80",
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                indexAxis: "y",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.x} requests`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: "#ffffff" },
                        grid: { color: "rgba(255,255,255,0.1)" }
                    },
                    y: {
                        ticks: { color: "#ffffff", font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Time of day chart
    new Chart(document.getElementById("cursor-chart-time"), {
        type: "line",
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                label: "Requests",
                data: stats.byHour,
                borderColor: "#4ade80",
                backgroundColor: "rgba(74, 222, 128, 0.1)",
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} requests`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#ffffff", maxRotation: 45 },
                    grid: { color: "rgba(255,255,255,0.1)" }
                },
                y: {
                    ticks: { color: "#ffffff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                }
            }
        }
    });

    // Day of week chart
    new Chart(document.getElementById("cursor-chart-day"), {
        type: "bar",
        data: {
            labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            datasets: [{
                label: "Requests",
                data: stats.byDay,
                backgroundColor: "#4ade80",
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} requests`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#ffffff" },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: "#ffffff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                }
            }
        }
    });

    // Month chart
    new Chart(document.getElementById("cursor-chart-month"), {
        type: "bar",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [{
                label: "Requests",
                data: stats.byMonth,
                backgroundColor: "#4ade80",
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} requests`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#ffffff" },
                    grid: { display: false }
                },
                y: {
                    ticks: { color: "#ffffff" },
                    grid: { color: "rgba(255,255,255,0.1)" }
                }
            }
        }
    });
}

// Load and display charts
async function loadCharts() {
    try {
        // Load Chart.js
        await loadChartJS();

        // Get cookie
        const cookie = await getCookieForCharts();
        if (!cookie) {
            console.warn("No cookie found for charts");
            return;
        }

        // Get date range (last 30 days)
        const endDate = Date.now();
        const startDate = endDate - 30 * 24 * 60 * 60 * 1000;

        // Fetch usage events
        const events = await fetchUsageEventsForCharts(cookie, startDate, endDate);
        if (!events || events.length === 0) {
            console.warn("No usage events found for charts");
            return;
        }

        // Process events
        const stats = processUsageEventsForAnalytics(events);

        // Create charts container
        const chartsContainer = createChartsContainer();

        // Insert after summary block
        const summaryBlock = document.querySelector(".cursor-usage-summary");
        if (summaryBlock) {
            summaryBlock.parentNode.insertBefore(chartsContainer, summaryBlock.nextSibling);
        } else {
            // Fallback: insert before table
            const tableContainer = document.querySelector(".overflow-x-auto")?.parentElement;
            if (tableContainer) {
                tableContainer.parentElement.insertBefore(chartsContainer, tableContainer);
            }
        }

        // Create charts
        createCharts(stats);
    } catch (error) {
        console.error("Error loading charts:", error);
    }
}

// Modify runExtension to include charts
const originalRunExtension = runExtension;
runExtension = async function() {
    await originalRunExtension();
    // Load charts after summary is created
    setTimeout(loadCharts, 1000);
};
