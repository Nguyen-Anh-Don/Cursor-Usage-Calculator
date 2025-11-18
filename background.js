// Background service worker for Cursor Usage Extension

// Add global to control logs
let SHOW_LOG = true; // Set to false to disable all console.log

const USAGE_LIMIT_CACHE = "usageLimitCache";
const IS_NEW_PRICING_CACHE = "isNewPricingCache";
const EXCLUDED_MODELS_CACHE = "excludedModelsCache";
const BILLING_PERIOD_CACHE = "billingPeriodCache";

// Cache duration constants (in milliseconds)
const CACHE_DURATION_1M = 60 * 1000; // 1 minute
const CACHE_DURATION_3M = 3 * 60 * 1000; // 3 minutes
const NEW_PRICING_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const EXCLUDED_MODELS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate limit constants
const DEFAULT_RATE_LIMIT = 4500; // cents
const PRO_RATE_LIMIT = 4500;
const PRO_PLUS_RATE_LIMIT = 13500;
const ULTRA_RATE_LIMIT = 45000;

// Helper log wrapper
function log(...args) {
    if (SHOW_LOG) console.log(...args);
}

// Helper: Get billing period date range
function getBillingPeriodDateRange(startOfMonth) {
    log("getBillingPeriodDateRange startOfMonth:", startOfMonth);
    if (!startOfMonth) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        let range = {
            startDate: start.getTime(),
            endDate: now.getTime()
        };
        log("getBillingPeriodDateRange range:", range);
        return range;
    }
    const start = new Date(startOfMonth);
    const end = new Date();
    let range = {
        startDate: start.getTime(),
        endDate: end.getTime()
    };
    log("getBillingPeriodDateRange custom range:", range);
    return range;
}

// Helper: Get proxy URL from settings
async function getProxyUrl() {
    try {
        const result = await chrome.storage.sync.get(["proxyUrl"]);
        // Return proxyUrl if set, otherwise return default
        // Empty string means no proxy (use direct API)
        if (result.proxyUrl !== undefined) {
            return result.proxyUrl.trim() || null;
        }
        // Default proxy URL if not set
        return "https://addlivetag.com/extension/cursor-used/";
    } catch (error) {
        log("getProxyUrl error:", error);
        return "https://addlivetag.com/extension/cursor-used/";
    }
}

// Helper: Get cache duration from settings
async function getCacheDuration() {
    try {
        const result = await chrome.storage.sync.get(["cacheDuration"]);
        log("getCacheDuration result:", result);
        const duration = result.cacheDuration || "1m"; // default 1 minute
        return duration === "3m" ? CACHE_DURATION_3M : CACHE_DURATION_1M;
    } catch (error) {
        log("getCacheDuration error:", error);
        return CACHE_DURATION_1M;
    }
}

// Helper: Get cookie
async function getCookie() {
    try {
        return await new Promise((resolve) => {
            chrome.cookies.get(
                { url: "https://www.cursor.com", name: "WorkosCursorSessionToken" },
                (cookie) => {
                    log("getCookie cookie 1:", cookie);
                    if (cookie) {
                        resolve(cookie.value);
                    } else {
                        chrome.cookies.get(
                            { url: "https://cursor.com", name: "WorkosCursorSessionToken" },
                            (cookie) => {
                                log("getCookie cookie 2:", cookie);
                                resolve(cookie?.value || null)
                            }
                        );
                    }
                }
            );
        });
    } catch (error) {
        log("getCookie Error getting cookie:", error);
        return null;
    }
}

// Helper: Get user ID from cookie
function extractUserId(cookie) {
    log("extractUserId cookie:", cookie);
    if (!cookie) return null;
    try {
        const decoded = decodeURIComponent(cookie);
        log("extractUserId decoded:", decoded);
        const match = decoded.match(/^([^:]+)(:|%3A|%3A%3A)/);
        if (match) {
            log("extractUserId match1:", match[1]);
            return match[1];
        }
        let res = decoded.split("%3A")[0].split(":")[0];
        log("extractUserId fallback:", res);
        return res;
    } catch (error) {
        log("extractUserId error:", error);
        return null;
    }
}

// Get user plan type
async function getUserPlanType(cookie) {
    log("getUserPlanType cookie:", cookie);
    try {
        // Try usage-summary endpoint
        try {
            const response = await fetch("https://cursor.com/api/usage-summary", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            log("getUserPlanType usage-summary response.ok:", response.ok);
            if (response.ok) {
                const data = await response.json();
                log("getUserPlanType usage-summary data:", data);
                if (data.membershipType) return data.membershipType;
            }
        } catch (error) {
            log("getUserPlanType Failed to check plan via usage-summary:", error);
        }

        // Try auth/stripe endpoint
        try {
            const response = await fetch("https://cursor.com/api/auth/stripe", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            log("getUserPlanType auth/stripe response.ok:", response.ok);
            if (response.ok) {
                const data = await response.json();
                log("getUserPlanType auth/stripe data:", data);
                if (data.membershipType) return data.membershipType;
            }
        } catch (error) {
            log("getUserPlanType Failed to check plan via auth/stripe:", error);
        }

        return null;
    } catch (error) {
        log("getUserPlanType Failed to check user plan type:", error);
        return null;
    }
}

// Check if user is on new pricing (inferred from usageData.startOfMonth)
// This function is now deprecated - we infer from usageData directly
async function isOnNewPricing(usageData = null) {
    // If usageData is provided, check if it has startOfMonth (indicates new pricing)
    if (usageData && usageData.startOfMonth) {
        return true;
    }
    
    // Otherwise, check cache
    try {
        const cached = await new Promise((resolve) => {
            chrome.storage.local.get(IS_NEW_PRICING_CACHE, (result) => {
                resolve(result[IS_NEW_PRICING_CACHE]);
            });
        });
        log("isOnNewPricing cached:", cached);

        if (cached && cached.timestamp && Date.now() - cached.timestamp < NEW_PRICING_CACHE_DURATION) {
            log("isOnNewPricing cache valid, status:", cached.isOnNewPricing);
            return cached.isOnNewPricing;
        }

        // Default to false if no data available
        return false;
    } catch (error) {
        log("isOnNewPricing error:", error);
        return false;
    }
}

// Get excluded models
async function getExcludedModels() {
    try {
        const cached = await new Promise((resolve) => {
            chrome.storage.local.get(EXCLUDED_MODELS_CACHE, (result) => {
                resolve(result[EXCLUDED_MODELS_CACHE]);
            });
        });

        log("getExcludedModels cached:", cached);

        if (cached && cached.timestamp && Date.now() - cached.timestamp < EXCLUDED_MODELS_CACHE_DURATION) {
            log("getExcludedModels using cache:", cached.data || []);
            return cached.data || [];
        }

        // No direct API available for excluded models, return empty array
        // This functionality relied on the proxy service which is no longer available
        log("getExcludedModels fallback:", cached?.data || []);
        return cached?.data || [];
    } catch (error) {
        log("getExcludedModels Failed to get excluded models:", error);
        return [];
    }
}

// Get rate limit based on plan type
function getRateLimit(planType) {
    log("getRateLimit planType:", planType);
    if (!planType || planType === "free") return DEFAULT_RATE_LIMIT;
    const plan = planType.toLowerCase();
    if (plan === "pro" || plan === "pro_student") return PRO_RATE_LIMIT;
    if (plan === "pro_plus") return PRO_PLUS_RATE_LIMIT;
    if (plan === "ultra") return ULTRA_RATE_LIMIT;
    return DEFAULT_RATE_LIMIT;
}

// Update badge
async function updateBadge(force = false) {
    log("updateBadge force:", force);
    try {
        const cookie = await getCookie();
        log("updateBadge cookie:", cookie);

        if (!cookie) {
            chrome.action.setBadgeText({ text: "" });
            return;
        }

        // Check if auto-refresh is enabled
        const settings = await chrome.storage.sync.get(["autoRefresh"]);
        log("updateBadge settings.autoRefresh:", settings.autoRefresh);

        if (!force && !settings.autoRefresh) {
            chrome.action.setBadgeText({ text: "" });
            return;
        }

        // Get user ID
        let userId = extractUserId(cookie);
        log("updateBadge userId:", userId);

        if (!userId) {
            try {
                const response = await fetch("https://cursor.com/api/auth/me", {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                });
                log("updateBadge fetch /api/auth/me response.ok:", response.ok);
                if (response.ok) {
                    const data = await response.json();
                    userId = data.sub;
                    log("updateBadge auth/me data.sub:", data.sub);
                }
            } catch (error) {
                log("updateBadge Failed to fetch user info:", error);
            }
        }

        // Fetch usage data
        const usageUrl = userId
            ? `https://cursor.com/api/usage?user=${encodeURIComponent(userId)}`
            : "https://cursor.com/api/usage";

        log("updateBadge usageUrl:", usageUrl);

        const usageResponse = await fetch(usageUrl, {
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        log("updateBadge usageResponse.ok:", usageResponse.ok, "status:", usageResponse.status);

        if (!usageResponse.ok) {
            if (usageResponse.status === 401 || usageResponse.status === 403) {
                log("updateBadge clearCache due to unauthorized/forbidden");
                await clearCache();
            }
            chrome.action.setBadgeText({ text: "" });
            return;
        }

        const usageData = await usageResponse.json();
        log("updateBadge usageData:", usageData);

        // Infer new pricing from usageData.startOfMonth
        const isNewPricing = !!(usageData && usageData.startOfMonth);
        log("updateBadge isNewPricing (inferred):", isNewPricing);

        let usagePercentage = 0;
        let hasUsage = false;

        if (isNewPricing && usageData.startOfMonth) {
            // New pricing model - use aggregated usage events
            const cacheDuration = await getCacheDuration();
            log("updateBadge cacheDuration:", cacheDuration);

            const cached = await new Promise((resolve) => {
                chrome.storage.local.get(USAGE_LIMIT_CACHE, (result) => {
                    resolve(result[USAGE_LIMIT_CACHE]);
                });
            });

            log("updateBadge USAGE_LIMIT_CACHE:", cached);

            // Check if we can use cached data
            if (
                cached &&
                cached.timestamp &&
                Date.now() - cached.timestamp < cacheDuration &&
                cached.startOfMonth === usageData.startOfMonth &&
                cached.currentLoad === 100
            ) {
                if (cached.overallRateLimitUsage) {
                    log("updateBadge using cached overallRateLimitUsage:", cached.overallRateLimitUsage);
                    usagePercentage = cached.overallRateLimitUsage.currentLoad;
                    hasUsage = true;
                }
            } else {
                // Fetch aggregated usage
                const excludedModels = await getExcludedModels();
                log("updateBadge excludedModels:", excludedModels);

                const planType = await getUserPlanType(cookie);
                log("updateBadge planType:", planType);

                const rateLimit = getRateLimit(planType);
                log("updateBadge rateLimit:", rateLimit);

                const dateRange = getBillingPeriodDateRange(usageData.startOfMonth);
                log("updateBadge dateRange:", dateRange);

                try {
                    // Fetch all usage events and calculate aggregated data
                    let allEvents = [];
                    let page = 1;
                    const pageSize = 500;
                    let hasMore = true;
                    
                    // Get proxy URL and cookie
                    const proxyUrl = await getProxyUrl();
                    const sessionCookie = await getCookie();
                    
                    while (hasMore) {
                        // Use proxy if available, otherwise use direct API
                        let apiUrl = "https://cursor.com/api/dashboard/get-filtered-usage-events";
                        if (proxyUrl) {
                            if (proxyUrl.endsWith('.php')) {
                                apiUrl = proxyUrl;
                            } else {
                                apiUrl = (proxyUrl.endsWith('/') ? proxyUrl : proxyUrl + '/') + 'proxy.php';
                            }
                        }
                        
                        const headers = {
                            "accept": "*/*",
                            "accept-language": "en-US,en;q=0.9",
                            "content-type": "application/json",
                            "priority": "u=1, i",
                            "sec-fetch-dest": "empty",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "none",
                            "sec-fetch-storage-access": "active"
                        };
                        
                        // Add cookie to headers if using proxy
                        if (proxyUrl && sessionCookie) {
                            headers["Cookie"] = `WorkosCursorSessionToken=${encodeURIComponent(sessionCookie)}`;
                        }
                        
                        const eventsResponse = await fetch(apiUrl, {
                            method: "POST",
                            mode: "cors",
                            headers: headers,
                            body: JSON.stringify({
                                cookie: sessionCookie,
                                teamId: 0,
                                startDate: dateRange.startDate,
                                endDate: dateRange.endDate,
                                page: page,
                                pageSize: pageSize
                            }),
                            credentials: proxyUrl ? "omit" : "include"
                        });
                        
                        if (eventsResponse.ok) {
                            const eventsData = await eventsResponse.json();
                            if (eventsData.usageEventsDisplay && Array.isArray(eventsData.usageEventsDisplay)) {
                                allEvents = allEvents.concat(eventsData.usageEventsDisplay);
                                
                                // Check if there are more pages
                                const totalCount = eventsData.totalUsageEventsCount || 0;
                                const fetchedCount = page * pageSize;
                                hasMore = fetchedCount < totalCount && eventsData.usageEventsDisplay.length === pageSize;
                                page++;
                            } else {
                                hasMore = false;
                            }
                        } else {
                            hasMore = false;
                        }
                    }
                    
                    // Calculate aggregated data from events
                    let totalCost = 0;
                    let totalInputTokens = 0;
                    let totalOutputTokens = 0;
                    let totalCacheWriteTokens = 0;
                    let totalCacheReadTokens = 0;
                    const modelUsage = {};
                    
                    allEvents.forEach((event) => {
                        // Skip errored/aborted events
                        if (event.kind === "USAGE_EVENT_KIND_ERRORED_NOT_CHARGED" || 
                            event.kind === "USAGE_EVENT_KIND_ABORTED_NOT_CHARGED") {
                            return;
                        }
                        
                        // Calculate cost: requestsCosts + tokenUsage.totalCents
                        const eventCost = (parseFloat(event.requestsCosts || 0) * 100) + // requestsCosts is in dollars, convert to cents
                                        parseFloat(event.tokenUsage?.totalCents || 0);
                        totalCost += eventCost;
                        
                        // Calculate tokens
                        if (event.tokenUsage) {
                            totalInputTokens += parseInt(event.tokenUsage.inputTokens || 0);
                            totalOutputTokens += parseInt(event.tokenUsage.outputTokens || 0);
                            totalCacheWriteTokens += parseInt(event.tokenUsage.cacheWriteTokens || 0);
                            totalCacheReadTokens += parseInt(event.tokenUsage.cacheReadTokens || 0);
                        }
                        
                        // Track model usage
                        const model = event.model || "default";
                        if (!modelUsage[model]) {
                            modelUsage[model] = { cost: 0, count: 0 };
                        }
                        modelUsage[model].cost += eventCost;
                        modelUsage[model].count++;
                    });
                    
                    // Exclude models if needed
                    if (excludedModels.length > 0) {
                        let adjustedCost = 0;
                        let adjustedInputTokens = 0;
                        let adjustedOutputTokens = 0;
                        let adjustedCacheWriteTokens = 0;
                        let adjustedCacheReadTokens = 0;
                        
                        allEvents.forEach((event) => {
                            if (event.kind === "USAGE_EVENT_KIND_ERRORED_NOT_CHARGED" || 
                                event.kind === "USAGE_EVENT_KIND_ABORTED_NOT_CHARGED") {
                                return;
                            }
                            
                            const model = event.model || "default";
                            const shouldExclude = excludedModels.some((ex) => 
                                model.toLowerCase().includes(ex.toLowerCase())
                            );
                            
                            if (!shouldExclude) {
                                const eventCost = (parseFloat(event.requestsCosts || 0) * 100) + 
                                                parseFloat(event.tokenUsage?.totalCents || 0);
                                adjustedCost += eventCost;
                                
                                if (event.tokenUsage) {
                                    adjustedInputTokens += parseInt(event.tokenUsage.inputTokens || 0);
                                    adjustedOutputTokens += parseInt(event.tokenUsage.outputTokens || 0);
                                    adjustedCacheWriteTokens += parseInt(event.tokenUsage.cacheWriteTokens || 0);
                                    adjustedCacheReadTokens += parseInt(event.tokenUsage.cacheReadTokens || 0);
                                }
                            }
                        });
                        
                        totalCost = adjustedCost;
                        totalInputTokens = adjustedInputTokens;
                        totalOutputTokens = adjustedOutputTokens;
                        totalCacheWriteTokens = adjustedCacheWriteTokens;
                        totalCacheReadTokens = adjustedCacheReadTokens;
                    }
                    
                    const totalTokens = totalInputTokens + totalOutputTokens + totalCacheWriteTokens + totalCacheReadTokens;
                    
                    // Find most used model
                    let mostUsedModel = "unknown";
                    let maxCount = 0;
                    Object.entries(modelUsage).forEach(([model, data]) => {
                        if (data.count > maxCount) {
                            maxCount = data.count;
                            mostUsedModel = model;
                        }
                    });
                    
                    const percentage = (totalCost / rateLimit) * 100;
                    usagePercentage = Math.min(Math.max(Math.round(percentage), 0), 100);
                    hasUsage = true;

                    // Cache the result
                    const cacheData = {
                        currentLoad: usagePercentage,
                        startOfMonth: usageData.startOfMonth,
                        overallRateLimitUsage: {
                            currentLoad: usagePercentage,
                            membershipType: planType,
                            rateLimitCents: rateLimit,
                            primaryConcern: { type: "cost" },
                            mostUsedModel: mostUsedModel
                        },
                        timestamp: Date.now()
                    };

                    log("updateBadge cacheData:", cacheData);

                    await chrome.storage.local.set({ [USAGE_LIMIT_CACHE]: cacheData });
                } catch (error) {
                    log("updateBadge Failed to calculate aggregated usage:", error);
                }
            }
        } else {
            // Old pricing model - use request-based limits
            if (usageData["gpt-4"] && usageData["gpt-4"].maxRequestUsage) {
                usagePercentage = Math.floor(
                    (usageData["gpt-4"].numRequests / usageData["gpt-4"].maxRequestUsage) * 100
                );
                hasUsage = true;
                log("updateBadge old pricing usagePercentage:", usagePercentage);
            } else if (Object.values(usageData).some((v) => v && typeof v === "object" && v.maxRequestUsage === null)) {
                // Fallback: calculate from usage logs
                hasUsage = false;
                log("updateBadge fallback old pricing, hasUsage false");
            }
        }

        log("updateBadge hasUsage:", hasUsage, "usagePercentage:", usagePercentage);

        // Update badge
        if (hasUsage && usagePercentage > 0) {
            const planType = await getUserPlanType(cookie);
            log("updateBadge planType for badge:", planType);
            if (planType === "free") {
                chrome.action.setBadgeText({ text: "" });
            } else {
                chrome.action.setBadgeText({ text: `${usagePercentage}%` });
                chrome.action.setBadgeBackgroundColor({
                    color: usagePercentage >= 90 ? "#f44336" : usagePercentage >= 70 ? "#e9b33b" : "#63a11a"
                });
                chrome.action.setBadgeTextColor({ color: "#ffffff" });
            }
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
    } catch (error) {
        log("updateBadge Error updating badge:", error);
        chrome.action.setBadgeText({ text: "" });
    }
}

// Clear cache (does not clear cookies to avoid logout)
async function clearCache() {
    log("clearCache called");
    try {
        await chrome.storage.local.remove([
            "usageLogsCache",
            "yearlyStatsCache",
            "lastApiRequestTime",
            IS_NEW_PRICING_CACHE,
            USAGE_LIMIT_CACHE,
            EXCLUDED_MODELS_CACHE,
            BILLING_PERIOD_CACHE
        ]);
        log("clearCache done");
    } catch (error) {
        log("clearCache Error clearing cache:", error);
    }
}

// Event listeners
chrome.runtime.onStartup.addListener(async () => {
    log("onStartup triggered");
    const settings = await chrome.storage.sync.get(["autoRefresh"]);
    log("onStartup settings:", settings);
    if (settings.autoRefresh) {
        await updateBadge(false);
    } else {
        chrome.action.setBadgeText({ text: "" });
    }
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    log("onMessage message:", message);
    if (message.action === "checkBadgeState") {
        const settings = await chrome.storage.sync.get(["autoRefresh"]);
        log("onMessage checkBadgeState settings:", settings);
        if (settings.autoRefresh) {
            await updateBadge(false);
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
        sendResponse({ success: true });
    } else if (message.action === "updateBadgeFromPopup") {
        const settings = await chrome.storage.sync.get(["autoRefresh"]);
        log("onMessage updateBadgeFromPopup settings:", settings, "usageLimitData:", message.usageLimitData);
        if (settings.autoRefresh) {
            if (message.usageLimitData) {
                const cookie = await getCookie();
                log("onMessage updateBadgeFromPopup cookie:", cookie);
                const planType = cookie ? await getUserPlanType(cookie) : null;
                log("onMessage updateBadgeFromPopup planType:", planType);
                if (planType === "free") {
                    chrome.action.setBadgeText({ text: "" });
                } else if (message.usageLimitData && typeof message.usageLimitData.currentLoad === "number") {
                    const percentage = message.usageLimitData.currentLoad;
                    chrome.action.setBadgeText({ text: `${percentage}%` });
                    chrome.action.setBadgeBackgroundColor({
                        color: percentage >= 90 ? "#f44336" : percentage >= 70 ? "#e9b33b" : "#63a11a"
                    });
                    chrome.action.setBadgeTextColor({ color: "#ffffff" });
                    log("onMessage updateBadgeFromPopup set badge:", percentage);
                } else {
                    chrome.action.setBadgeText({ text: "" });
                    log("onMessage updateBadgeFromPopup set badge: empty");
                }
            } else {
                await updateBadge(false);
            }
        } else {
            chrome.action.setBadgeText({ text: "" });
            await chrome.storage.local.remove([USAGE_LIMIT_CACHE]);
        }
        sendResponse({ success: true });
    } else if (message.action === "clearCache") {
        log("onMessage clearCache called");
        await clearCache();
        sendResponse({ success: true });
        return true; // Keep channel open for async response
    }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    log("onAlarm triggered alarm:", alarm);
    if (alarm.name === "updateUsageBadge") {
        const settings = await chrome.storage.sync.get(["autoRefresh"]);
        log("onAlarm settings:", settings);
        if (settings.autoRefresh) {
            await updateBadge(true);
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
    }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
    log("onChanged changes:", changes, "areaName:", areaName);
    if (areaName === "sync" && changes.autoRefresh) {
        if (changes.autoRefresh.newValue) {
            chrome.alarms.create("updateUsageBadge", { periodInMinutes: 15 });
            await updateBadge(true);
        } else {
            chrome.alarms.clear("updateUsageBadge");
            chrome.action.setBadgeText({ text: "" });
        }
    }
});

chrome.runtime.onInstalled.addListener(async (details) => {
    log("onInstalled details:", details);
    if (details.reason === "install") {
        await chrome.storage.sync.set({
            autoRefresh: true, // Default true
            showLogs: false,
            showStats: false,
            cacheDuration: "1m"
        });
        log("onInstalled set defaults");
    } else if (details.reason === "update") {
        // Clear old cache on update
        try {
            await chrome.storage.local.remove(["lastApiRequestTime"]);
            const settings = await chrome.storage.sync.get(["autoRefresh"]);
            log("onInstalled update settings:", settings);
            if (settings.autoRefresh) {
                setTimeout(() => updateBadge(true), 2000);
            }
        } catch (error) {
            log("onInstalled Error handling extension update:", error);
        }
    }

    const settings = await chrome.storage.sync.get(["autoRefresh"]);
    log("onInstalled settings after:", settings);
    if (settings.autoRefresh !== undefined) {
        if (settings.autoRefresh) {
            chrome.alarms.create("updateUsageBadge", { periodInMinutes: 15 });
            await updateBadge(true);
        } else {
            chrome.action.setBadgeText({ text: "" });
        }
    } else {
        // Default to true if not set
        await chrome.storage.sync.set({ autoRefresh: true });
        chrome.alarms.create("updateUsageBadge", { periodInMinutes: 15 });
        await updateBadge(true);
    }
});
