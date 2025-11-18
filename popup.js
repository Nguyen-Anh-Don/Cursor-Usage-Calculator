// Popup script for Cursor Usage Extension
let usageTimeChart = null;
let modelChart = null;
let usageData = null;

// Helper: Get message i18n
function getMessage(messageName) {
    return chrome.i18n.getMessage(messageName) || messageName;
}

// Helper: Get cookie
async function getCookie() {
    try {
        return await new Promise((resolve) => {
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
    } catch (error) {
        console.error("Error getting cookie:", error);
        return null;
    }
}

// Helper: Extract user ID from cookie
function extractUserId(cookie) {
    if (!cookie) return null;
    try {
        const decoded = decodeURIComponent(cookie);
        const match = decoded.match(/^([^:]+)(:|%3A|%3A%3A)/);
        if (match) return match[1];
        return decoded.split("%3A")[0].split(":")[0];
    } catch (error) {
        return null;
    }
}

// Helper: Get billing period date range
function getBillingPeriodDateRange(startOfMonth) {
    if (!startOfMonth) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            startDate: start.getTime(),
            endDate: now.getTime()
        };
    }
    const start = new Date(startOfMonth);
    const end = new Date();
    return {
        startDate: start.getTime(),
        endDate: end.getTime()
    };
}

// Helper: Format number
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

// Helper: Format model name
function formatModelName(model) {
    if (!model) return "Unknown Model";
    let name = model;
    if (name.startsWith("accounts/fireworks/models/")) {
        name = name.substring("accounts/fireworks/models/".length);
    }
    return name || "Unknown Model";
}

// Helper: Get rate limit based on plan type
function getRateLimit(planType) {
    if (!planType || planType === "free") return 4500;
    const plan = planType.toLowerCase();
    if (plan === "pro" || plan === "pro_student") return 4500;
    if (plan === "pro_plus") return 13500;
    if (plan === "ultra") return 45000;
    return 4500;
}

// Fetch teams list
async function fetchTeams() {
    try {
        const response = await fetch("https://cursor.com/api/dashboard/teams", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });
        if (response.ok) {
            const data = await response.json();
            return data.teams || [];
        }
        return [];
    } catch (error) {
        console.warn("Failed to fetch teams:", error);
        return [];
    }
}

// Get team user info
async function getTeamUserInfo(teamId) {
    try {
        const response = await fetch(`https://cursor.com/api/dashboard/team?teamId=${encodeURIComponent(teamId)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.warn("Failed to fetch team user info:", error);
        return null;
    }
}

// Get team spend data
async function getTeamSpend(teamId, userId) {
    try {
        const response = await fetch("https://cursor.com/api/dashboard/get-team-spend", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                teamId: teamId,
                userId: userId
            }),
            credentials: "include"
        });
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.warn("Failed to fetch team spend:", error);
        return null;
    }
}

// Helper: Calculate reset tracking info
function calculateResetTracking(startOfMonth) {
    if (!startOfMonth) return null;
    
    const startDate = new Date(startOfMonth);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(0, 0, 0, 0);
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const daysUntilReset = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
    const resetDateStr = nextMonth.toISOString().split('T')[0];
    
    return {
        daysUntilReset,
        resetDate: nextMonth,
        resetDateStr,
        startDate
    };
}

// Helper: Calculate usage analytics
function calculateUsageAnalytics(startOfMonth, totalRequests) {
    if (!startOfMonth || !totalRequests) return null;
    
    const startDate = new Date(startOfMonth);
    const now = new Date();
    const daysElapsed = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    const dailyAverage = totalRequests / daysElapsed;
    
    return {
        daysElapsed,
        dailyAverage: Math.round(dailyAverage * 10) / 10
    };
}

// Helper: Calculate predictive warnings
function calculatePredictiveWarnings(remaining, limit, dailyAverage, spending, budgetLimit) {
    const warnings = [];
    
    // Request-based warnings
    if (limit && remaining !== undefined) {
        const usagePercent = ((limit - remaining) / limit) * 100;
        
        if (remaining === 0) {
            warnings.push({ type: "no_requests", message: "⚠️ No requests remaining" });
        } else if (remaining <= limit * 0.1) {
            warnings.push({ type: "low_requests", message: "⚠️ Low on requests" });
        }
        
        // Predictive warning for quota exhaustion
        if (dailyAverage > 0 && remaining > 0) {
            const daysUntilExhaustion = Math.ceil(remaining / dailyAverage);
            if (daysUntilExhaustion < 30 && daysUntilExhaustion > 0) {
                warnings.push({ 
                    type: "predictive_exhaustion", 
                    message: `⚠️ At current rate, quota exhausted in ~${daysUntilExhaustion} days`,
                    daysUntilExhaustion
                });
            }
        }
    }
    
    // Spending-based warnings
    if (budgetLimit && spending !== undefined) {
        const spendPercent = (spending / budgetLimit) * 100;
        
        if (spending >= budgetLimit) {
            warnings.push({ type: "spend_limit_reached", message: "⚠️ Spend limit reached!" });
        } else if (spendPercent >= 80) {
            warnings.push({ type: "approaching_spend_limit", message: "⚠️ Approaching spend limit" });
        }
    }
    
    return warnings;
}

// Fetch usage data
async function fetchUsageData() {
    try {
        const cookie = await getCookie();
        if (!cookie) {
            console.log("fetchUsageData: No cookie found");
            return null;
        }
        console.log("fetchUsageData: Cookie found, fetching data...");

        // Get user ID
        let userId = extractUserId(cookie);
        if (!userId) {
            try {
                const response = await fetch("https://cursor.com/api/auth/me", {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                });
                if (response.ok) {
                    const data = await response.json();
                    userId = data.sub;
                }
            } catch (error) {
                console.warn("Failed to fetch user info:", error);
            }
        }

        // Check for team support
        let teamData = null;
        let teamId = null;
        let teamUserId = null;
        
        try {
            // Get teamId from settings or auto-detect
            const settings = await chrome.storage.sync.get(["teamId"]);
            const requestedTeamId = settings.teamId || null;
            
            const teams = await fetchTeams();
            if (teams && teams.length > 0) {
                // Use requested teamId or first team
                teamId = requestedTeamId || teams[0].id;
                
                if (teamId) {
                    const teamUserInfo = await getTeamUserInfo(teamId);
                    if (teamUserInfo && teamUserInfo.userId) {
                        teamUserId = teamUserInfo.userId;
                        teamData = await getTeamSpend(teamId, teamUserId);
                    }
                }
            }
        } catch (error) {
            console.warn("Failed to fetch team data:", error);
        }

        // Fetch individual usage (for reset dates and limits)
        const usageUrl = userId
            ? `https://cursor.com/api/usage?user=${encodeURIComponent(userId)}`
            : "https://cursor.com/api/usage";

        const usageResponse = await fetch(usageUrl, {
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        });

        if (!usageResponse.ok) {
            throw new Error("Failed to fetch usage data");
        }

        const usageData = await usageResponse.json();
        console.log("fetchUsageData: Got usageData", usageData);

        // Infer new pricing from usageData.startOfMonth (if exists, likely new pricing)
        const isNewPricing = !!(usageData && usageData.startOfMonth);
        console.log("fetchUsageData: isNewPricing", isNewPricing, "startOfMonth", usageData?.startOfMonth);

        // Get plan type
        let planType = null;
        try {
            const planResponse = await fetch("https://cursor.com/api/usage-summary", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            if (planResponse.ok) {
                const planData = await planResponse.json();
                planType = planData.membershipType || null;
            }
        } catch (error) {
            console.warn("Failed to get plan type:", error);
        }

        // Calculate aggregated usage from filtered events
        let aggregatedUsage = null;
        let currentMonthUsage = null;
        
        // Always fetch usage events to count requests and calculate aggregated data if startOfMonth exists
        if (usageData.startOfMonth) {
            try {
                const dateRange = getBillingPeriodDateRange(usageData.startOfMonth);
                
                // Fetch usage events (fetch all pages)
                try {
                    let allEvents = [];
                    let allValidRequests = [];
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
                        
                        // Build request body - include cookie if using proxy
                        const requestBody = {
                            teamId: 0,
                            startDate: dateRange.startDate,
                            endDate: dateRange.endDate,
                            page: page,
                            pageSize: pageSize
                        };
                        if (proxyUrl && sessionCookie) {
                            requestBody.cookie = sessionCookie;
                        }
                        
                        const eventsResponse = await fetch(apiUrl, {
                            method: "POST",
                            mode: "cors",
                            headers: headers,
                            body: JSON.stringify(requestBody),
                            credentials: proxyUrl ? "omit" : "include"
                        });
                        
                        if (eventsResponse.ok) {
                            const eventsData = await eventsResponse.json();
                            if (eventsData.usageEventsDisplay && Array.isArray(eventsData.usageEventsDisplay)) {
                                allEvents = allEvents.concat(eventsData.usageEventsDisplay);
                                
                                // Filter valid requests (exclude errored/aborted)
                                const validRequests = eventsData.usageEventsDisplay.filter(
                                    (event) =>
                                        event.kind !== "USAGE_EVENT_KIND_ERRORED_NOT_CHARGED" &&
                                        event.kind !== "USAGE_EVENT_KIND_ABORTED_NOT_CHARGED"
                                );
                                allValidRequests = allValidRequests.concat(validRequests);
                                
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
                    
                    // Count valid requests - always set currentMonthUsage even if 0
                    currentMonthUsage = {
                        total: allValidRequests.length
                    };
                    console.log("fetchUsageData: currentMonthUsage", currentMonthUsage, "total events", allEvents.length, "valid requests", allValidRequests.length);
                    
                    // Calculate aggregated usage data from events
                    if (isNewPricing && allEvents.length > 0) {
                        let totalCostCents = 0;
                        let totalInputTokens = 0;
                        let totalOutputTokens = 0;
                        let totalCacheWriteTokens = 0;
                        let totalCacheReadTokens = 0;
                        const aggregations = {};
                        
                        allEvents.forEach((event) => {
                            // Skip errored/aborted events
                            if (event.kind === "USAGE_EVENT_KIND_ERRORED_NOT_CHARGED" || 
                                event.kind === "USAGE_EVENT_KIND_ABORTED_NOT_CHARGED") {
                                return;
                            }
                            
                            // Calculate cost: requestsCosts (in dollars) + tokenUsage.totalCents (in cents)
                            const eventCost = (parseFloat(event.requestsCosts || 0) * 100) + 
                                            parseFloat(event.tokenUsage?.totalCents || 0);
                            totalCostCents += eventCost;
                            
                            // Calculate tokens
                            if (event.tokenUsage) {
                                totalInputTokens += parseInt(event.tokenUsage.inputTokens || 0);
                                totalOutputTokens += parseInt(event.tokenUsage.outputTokens || 0);
                                totalCacheWriteTokens += parseInt(event.tokenUsage.cacheWriteTokens || 0);
                                totalCacheReadTokens += parseInt(event.tokenUsage.cacheReadTokens || 0);
                            }
                            
                            // Group by model
                            const modelIntent = event.model || "default";
                            if (!aggregations[modelIntent]) {
                                aggregations[modelIntent] = {
                                    modelIntent: modelIntent,
                                    totalCents: 0,
                                    inputTokens: 0,
                                    outputTokens: 0,
                                    cacheWriteTokens: 0,
                                    cacheReadTokens: 0
                                };
                            }
                            aggregations[modelIntent].totalCents += eventCost;
                            if (event.tokenUsage) {
                                aggregations[modelIntent].inputTokens += parseInt(event.tokenUsage.inputTokens || 0);
                                aggregations[modelIntent].outputTokens += parseInt(event.tokenUsage.outputTokens || 0);
                                aggregations[modelIntent].cacheWriteTokens += parseInt(event.tokenUsage.cacheWriteTokens || 0);
                                aggregations[modelIntent].cacheReadTokens += parseInt(event.tokenUsage.cacheReadTokens || 0);
                            }
                        });
                        
                        // Convert aggregations object to array and sort by cost
                        const aggregationsArray = Object.values(aggregations)
                            .sort((a, b) => b.totalCents - a.totalCents);
                        
                        aggregatedUsage = {
                            totalCostCents: totalCostCents,
                            totalInputTokens: totalInputTokens,
                            totalOutputTokens: totalOutputTokens,
                            totalCacheWriteTokens: totalCacheWriteTokens,
                            totalCacheReadTokens: totalCacheReadTokens,
                            aggregations: aggregationsArray
                        };
                    }
                } catch (error) {
                    console.warn("Failed to fetch usage events:", error);
                }
            } catch (error) {
                console.warn("Failed to process usage data:", error);
            }
        }

        // Calculate reset tracking
        const resetTracking = calculateResetTracking(usageData.startOfMonth);
        
        // Calculate usage analytics
        let usageAnalytics = null;
        if (currentMonthUsage && usageData.startOfMonth) {
            usageAnalytics = calculateUsageAnalytics(usageData.startOfMonth, currentMonthUsage.total);
        } else if (usageData["gpt-4"] && usageData.startOfMonth) {
            usageAnalytics = calculateUsageAnalytics(usageData.startOfMonth, usageData["gpt-4"].numRequests || 0);
        }
        
        // Combine individual and team data
        let fastPremiumRequests = null;
        let fastPremiumLimit = null;
        let spendCents = null;
        let hardLimitDollars = null;
        
        if (teamData) {
            // Use team data for actual usage/spending
            fastPremiumRequests = teamData.fastPremiumRequests || teamData.remainingRequests || null;
            fastPremiumLimit = teamData.fastPremiumLimit || teamData.requestLimit || null;
            spendCents = teamData.spendCents || null;
            hardLimitDollars = teamData.hardLimitOverrideDollars || teamData.budgetLimit || null;
        } else {
            // For individual users, calculate from individual usage data
            if (isNewPricing && aggregatedUsage && currentMonthUsage) {
                // For new pricing model with individual user
                const rateLimit = getRateLimit(planType);
                const totalCost = aggregatedUsage.totalCostCents || 0;
                spendCents = totalCost;
                hardLimitDollars = rateLimit / 100; // Convert cents to dollars
                
                // For individual users with new pricing, we show cost-based limits
                // Requests are calculated from events, so we use currentMonthUsage.total
                // The limit would be estimated based on cost limit
                // For now, we'll show cost-based info primarily
            } else if (usageData["gpt-4"]) {
                // Old pricing model - direct request limits
                const numRequests = usageData["gpt-4"].numRequests || 0;
                const maxRequests = usageData["gpt-4"].maxRequestUsage || null;
                if (maxRequests !== null) {
                    fastPremiumRequests = maxRequests - numRequests; // Remaining
                    fastPremiumLimit = maxRequests;
                }
            }
        }
        
        // Calculate warnings - for individual users with new pricing, calculate from cost
        let warningsRequestLimit = fastPremiumLimit;
        let warningsRemaining = fastPremiumRequests;
        
        if (!teamData && isNewPricing && aggregatedUsage && !fastPremiumRequests) {
            // For individual users with new pricing, estimate requests from cost
            const rateLimit = getRateLimit(planType);
            const totalCost = aggregatedUsage.totalCostCents || 0;
            if (currentMonthUsage && currentMonthUsage.total > 0 && totalCost > 0) {
                const avgCostPerRequest = totalCost / currentMonthUsage.total;
                if (avgCostPerRequest > 0) {
                    const remainingCost = Math.max(0, rateLimit - totalCost);
                    warningsRemaining = Math.floor(remainingCost / avgCostPerRequest);
                    warningsRequestLimit = Math.floor(rateLimit / avgCostPerRequest); // Approximate limit
                }
            }
        }
        
        // Calculate warnings
        const warnings = calculatePredictiveWarnings(
            warningsRemaining,
            warningsRequestLimit,
            usageAnalytics?.dailyAverage || 0,
            spendCents ? spendCents / 100 : null,
            hardLimitDollars
        );
        
        const result = {
            usageData,
            isNewPricing,
            planType,
            aggregatedUsage,
            currentMonthUsage,
            resetTracking,
            usageAnalytics,
            teamData,
            teamId,
            fastPremiumRequests,
            fastPremiumLimit,
            spendCents,
            hardLimitDollars,
            warnings
        };
        console.log("fetchUsageData: Returning result", result);
        return result;
    } catch (error) {
        console.error("Error fetching usage data:", error);
        return null;
    }
}

// Display usage information
function displayUsageInfo(data) {
    const container = document.getElementById("usage-container");
    console.log("displayUsageInfo: Received data", data);
    
    if (!data || !data.usageData) {
        console.log("displayUsageInfo: No data or usageData");
        container.innerHTML = `
            <div class="message">
                <span class="message-icon">&#128274;</span>
                <span>Unable to load usage data. Please check your Cursor login.</span>
            </div>
        `;
        return;
    }

    const { 
        usageData, 
        isNewPricing, 
        planType, 
        aggregatedUsage, 
        currentMonthUsage,
        resetTracking,
        usageAnalytics,
        fastPremiumRequests,
        fastPremiumLimit,
        spendCents,
        hardLimitDollars,
        warnings
    } = data;
    
    console.log("displayUsageInfo: Extracted values", {
        isNewPricing,
        planType,
        currentMonthUsage,
        resetTracking,
        usageAnalytics,
        fastPremiumRequests,
        fastPremiumLimit,
        spendCents,
        hardLimitDollars,
        hasAggregatedUsage: !!aggregatedUsage
    });
    
    let html = "";

    // Reset tracking section
    if (resetTracking) {
        html += `
            <div class="info-item reset-info">
                <span class="info-label">Resets in</span>
                <span class="info-value">${resetTracking.daysUntilReset} days</span>
                <span class="info-subtext">(${resetTracking.resetDateStr})</span>
            </div>
        `;
    }

    // Usage analytics section
    if (usageAnalytics) {
        html += `
            <div class="info-item analytics-info">
                <span class="info-label">Daily average</span>
                <span class="info-value">${usageAnalytics.dailyAverage} requests/day</span>
            </div>
        `;
    }

    // Warnings section
    if (warnings && warnings.length > 0) {
        warnings.forEach(warning => {
            const warningClass = warning.type === "no_requests" || warning.type === "spend_limit_reached" ? "warning-critical" : "warning";
            html += `
                <div class="info-item ${warningClass}">
                    <span class="warning-message">${warning.message}</span>
                </div>
            `;
        });
    }

    // Fast Premium Requests section
    if (fastPremiumRequests !== null && fastPremiumLimit !== null) {
        const remaining = fastPremiumRequests;
        const limit = fastPremiumLimit;
        const used = limit - remaining;
        const usagePercent = limit > 0 ? Math.min(Math.max((used / limit) * 100, 0), 100) : 0;
        const barColorClass = usagePercent >= 90 ? "full" : usagePercent >= 70 ? "high" : "";
        
        html += `
            <div class="info-item">
                <span class="info-label">Fast Premium Requests</span>
                <span class="info-value">${remaining}/${limit} remaining</span>
                <span class="info-subtext">(${Math.round((used / limit) * 100)}% used)</span>
            </div>
            <div class="usage-bar-container">
                <div class="usage-bar">
                    <div class="usage-bar-fill ${barColorClass}" style="width: ${usagePercent}%"></div>
                </div>
            </div>
        `;
    } else if (currentMonthUsage !== null && currentMonthUsage !== undefined) {
        // Show current month requests
        html += `
            <div class="info-item">
                <span class="info-label">Current month</span>
                <span class="info-value">${currentMonthUsage.total || 0} requests</span>
            </div>
        `;
    } else if (usageData["gpt-4"]) {
        html += `
            <div class="info-item">
                <span class="info-label">Current month</span>
                <span class="info-value">${usageData["gpt-4"].numRequests || 0} requests</span>
            </div>
        `;
    }

    // Spending section (for new pricing model or team data)
    if (spendCents !== null && hardLimitDollars !== null) {
        const spending = spendCents / 100;
        const budgetLimit = hardLimitDollars;
        const remainingBudget = Math.max(0, budgetLimit - spending);
        const spendPercent = budgetLimit > 0 ? Math.min(Math.max((spending / budgetLimit) * 100, 0), 100) : 0;
        const spendBarColorClass = spendPercent >= 80 ? "full" : spendPercent >= 60 ? "high" : "";
        
        html += `
            <div class="info-item">
                <span class="info-label">Spending</span>
                <span class="info-value">$${spending.toFixed(2)} of $${budgetLimit.toFixed(2)} limit</span>
                <span class="info-subtext">(${Math.round(spendPercent)}% used)</span>
            </div>
            <div class="info-item" style="font-size: 12px; color: #a0a0a0; margin-top: -4px;">
                <span>Remaining budget: $${remainingBudget.toFixed(2)}</span>
            </div>
            <div class="usage-bar-container">
                <div class="usage-bar">
                    <div class="usage-bar-fill ${spendBarColorClass}" style="width: ${spendPercent}%"></div>
                </div>
            </div>
        `;
    } else if (isNewPricing && aggregatedUsage) {
        // Fallback: show aggregated usage cost
        const totalCost = aggregatedUsage.totalCostCents || 0;
        const rateLimit = getRateLimit(planType);
        const totalTokens =
            parseInt(aggregatedUsage.totalInputTokens || 0) +
            parseInt(aggregatedUsage.totalOutputTokens || 0) +
            parseInt(aggregatedUsage.totalCacheWriteTokens || 0) +
            parseInt(aggregatedUsage.totalCacheReadTokens || 0);
        const usagePercent = Math.min(Math.max((totalCost / rateLimit) * 100, 0), 100);
        const barColorClass = usagePercent >= 90 ? "full" : usagePercent >= 70 ? "high" : "";

        html += `
            <div class="info-item">
                <span class="info-label">Usage limits <small>(estimated)</small></span>
                <span class="info-value">${Math.round(usagePercent)}% used</span>
            </div>
            <div class="usage-bar-container">
                <div class="usage-bar">
                    <div class="usage-bar-fill ${barColorClass}" style="width: ${usagePercent}%"></div>
                </div>
            </div>
            <div class="info-item">
                <span class="info-label">Total tokens</span>
                <span class="info-value">${formatNumber(totalTokens)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">API cost</span>
                <span class="info-value">$${(totalCost / 100).toFixed(2)}</span>
            </div>
        `;
    } else if (usageData["gpt-4"] && usageData["gpt-4"].maxRequestUsage) {
        // Old pricing model
        const usagePercent = Math.floor(
            (usageData["gpt-4"].numRequests / usageData["gpt-4"].maxRequestUsage) * 100
        );
        const barColorClass = usagePercent >= 90 ? "full" : usagePercent >= 70 ? "high" : "";
        
        html += `
            <div class="info-item">
                <span class="info-label">Usage limits</span>
                <span class="info-value">${usagePercent}% used</span>
            </div>
            <div class="usage-bar-container">
                <div class="usage-bar">
                    <div class="usage-bar-fill ${barColorClass}" style="width: ${usagePercent}%"></div>
                </div>
            </div>
        `;
    }

    // Models cost breakdown
    if (aggregatedUsage && aggregatedUsage.aggregations && Array.isArray(aggregatedUsage.aggregations) && aggregatedUsage.aggregations.length > 0) {
        const models = aggregatedUsage.aggregations
            .filter((agg) => parseFloat(agg.totalCents || 0) > 0)
            .sort((a, b) => parseFloat(b.totalCents || 0) - parseFloat(a.totalCents || 0))
            .slice(0, 10);

        if (models.length > 0) {
            html += `
                <div class="model-breakdown">
                    <details>
                        <summary>Models Cost Breakdown</summary>
                        <div class="model-breakdown-content">
            `;

            models.forEach((model) => {
                const modelName = formatModelName(model.modelIntent);
                const cost = parseFloat(model.totalCents || 0) / 100;
                html += `
                    <div class="model-item">
                        <span class="model-name">${modelName}</span>
                        <span class="model-cost">$${cost.toFixed(2)}</span>
                    </div>
                `;
            });

            html += `
                        </div>
                    </details>
                </div>
            `;
        }
    }

    container.innerHTML = html;
}

// Create mini charts
function createMiniCharts(data) {
    if (!data || !data.aggregatedUsage) {
        document.getElementById("charts-container").style.display = "none";
        return;
    }

    document.getElementById("charts-container").style.display = "grid";

    // Destroy existing charts
    if (usageTimeChart) {
        usageTimeChart.destroy();
        usageTimeChart = null;
    }
    if (modelChart) {
        modelChart.destroy();
        modelChart = null;
    }

    const { aggregatedUsage } = data;

    // Usage % over time chart (simplified - would need historical data)
    const timeCtx = document.getElementById("usageTimeChart").getContext("2d");
    const currentUsage = aggregatedUsage.totalCostCents || 0;
    const rateLimit = 4500; // Default, would get from plan
    const usagePercent = Math.min((currentUsage / rateLimit) * 100, 100);

    // Create a simple line chart with sample data (in real implementation, would use historical data)
    usageTimeChart = new Chart(timeCtx, {
        type: "line",
        data: {
            labels: Array.from({ length: 7 }, (_, i) => `Day ${i + 1}`),
            datasets: [
                {
                    label: "Usage %",
                    data: Array(7).fill(usagePercent), // Simplified - would use actual historical data
                    borderColor: "#4ade80",
                    backgroundColor: "rgba(74, 222, 128, 0.1)",
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Usage: ${context.parsed.y.toFixed(1)}%`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: "#a0a0a0", font: { size: 10 } },
                    grid: { color: "#3a3a3a" }
                },
                x: {
                    ticks: { color: "#a0a0a0", font: { size: 10 } },
                    grid: { color: "#3a3a3a", display: false }
                }
            }
        }
    });

    // Breakdown by model chart
    if (aggregatedUsage.aggregations && Array.isArray(aggregatedUsage.aggregations)) {
        const models = aggregatedUsage.aggregations
            .filter((agg) => parseFloat(agg.totalCents || 0) > 0)
            .sort((a, b) => parseFloat(b.totalCents || 0) - parseFloat(a.totalCents || 0))
            .slice(0, 5);

        if (models.length > 0) {
            const modelCtx = document.getElementById("modelChart").getContext("2d");
            modelChart = new Chart(modelCtx, {
                type: "doughnut",
                data: {
                    labels: models.map((m) => formatModelName(m.modelIntent)),
                    datasets: [
                        {
                            data: models.map((m) => parseFloat(m.totalCents || 0) / 100),
                            backgroundColor: [
                                "#4ade80",
                                "#60a5fa",
                                "#f472b6",
                                "#fbbf24",
                                "#a78bfa"
                            ],
                            borderWidth: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percent = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: $${context.parsed.toFixed(2)} (${percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
}

// Get proxy URL from settings
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
        console.error("Error getting proxy URL:", error);
        return "https://addlivetag.com/extension/cursor-used/";
    }
}

// Load settings
async function loadSettings() {
    try {
        const result = await chrome.storage.sync.get([
            "autoRefresh",
            "autoCalculate",
            "cacheDuration",
            "proxyUrl"
        ]);

        document.getElementById("autoRefreshToggle").checked = result.autoRefresh !== false; // Default true
        document.getElementById("autoCalculateToggle").checked = result.autoCalculate !== false; // Default true
        document.getElementById("cacheDurationSelect").value = result.cacheDuration || "1m";
        document.getElementById("proxyUrlInput").value = result.proxyUrl || "https://addlivetag.com/extension/cursor-used/";
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

// Save settings
async function saveSettings() {
    try {
        const autoRefresh = document.getElementById("autoRefreshToggle").checked;
        const autoCalculate = document.getElementById("autoCalculateToggle").checked;
        const cacheDuration = document.getElementById("cacheDurationSelect").value;
        const proxyUrl = document.getElementById("proxyUrlInput").value.trim();

        await chrome.storage.sync.set({
            autoRefresh,
            autoCalculate,
            cacheDuration,
            proxyUrl: proxyUrl || "https://addlivetag.com/extension/cursor-used/" // Keep default if empty
        });

        // Update badge if auto-refresh changed
        if (autoRefresh) {
            chrome.runtime.sendMessage({ action: "checkBadgeState" });
        }

        showStatus("Settings saved", "success");
    } catch (error) {
        console.error("Error saving settings:", error);
        showStatus("Error saving settings", "error");
    }
}

// Clear cache
async function clearCache() {
    try {
        await chrome.runtime.sendMessage({ action: "clearCache" });
        await chrome.storage.local.remove([
            "usageLogsCache",
            "yearlyStatsCache",
            "lastApiRequestTime",
            "isNewPricingCache",
            "usageLimitCache",
            "excludedModelsCache",
            "billingPeriodCache"
        ]);

        showStatus("Cache cleared", "success");
        // Reload usage data
        await loadUsageData();
    } catch (error) {
        console.error("Error clearing cache:", error);
        showStatus("Error clearing cache", "error");
    }
}

// Show status message
function showStatus(message, type) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.className = `status ${type}`;
    setTimeout(() => {
        status.className = "status";
    }, 3000);
}

// Get cached usage data from background script
async function getCachedUsageData() {
    try {
        const cached = await chrome.storage.local.get(["usageLimitCache"]);
        if (cached.usageLimitCache && cached.usageLimitCache.overallRateLimitUsage) {
            return cached.usageLimitCache;
        }
        return null;
    } catch (error) {
        console.error("Error getting cached usage data:", error);
        return null;
    }
}

// Load usage data
async function loadUsageData() {
    const container = document.getElementById("usage-container");
    container.innerHTML = `
        <div class="loading">
            <span class="message-icon">&#10227;</span>
            <span>Loading usage data...</span>
        </div>
    `;

    // Try to get cached data first for faster display
    const cachedData = await getCachedUsageData();
    
    // Fetch fresh data
    const data = await fetchUsageData();
    
    if (data) {
        usageData = data;
        displayUsageInfo(data);
        createMiniCharts(data);
    } else if (cachedData) {
        // If fresh fetch failed but we have cached data, try to display it
        // We still need to fetch basic usage data for display
        console.log("Using cached data as fallback");
        // Still try to fetch basic usage info
        const basicData = await fetchUsageData();
        if (basicData) {
            usageData = basicData;
            displayUsageInfo(basicData);
            createMiniCharts(basicData);
        } else {
            container.innerHTML = `
                <div class="message">
                    <span class="message-icon">&#128274;</span>
                    <span>Unable to load usage data. Please check your Cursor login.</span>
                </div>
            `;
        }
    } else {
        container.innerHTML = `
            <div class="message">
                <span class="message-icon">&#128274;</span>
                <span>Unable to load usage data. Please check your Cursor login.</span>
            </div>
        `;
    }
}

// Update i18n texts
function updateI18nTexts() {
    document.getElementById("header").textContent = getMessage("extensionName");
    document.getElementById("autoRefreshLabel").textContent = getMessage("autoRefreshBadge");
    document.getElementById("autoRefreshDesc").textContent = getMessage("autoRefreshDescription");
    document.getElementById("autoCalculateLabel").textContent = getMessage("autoCalculate");
    document.getElementById("autoCalculateDesc").textContent = getMessage("autoCalculateDescription");
    document.getElementById("cacheDurationLabel").textContent = getMessage("cacheDuration");
    document.getElementById("cacheDurationDesc").textContent = getMessage("cacheDurationDescription");
    document.getElementById("clearCacheLabel").textContent = getMessage("clearCache");
    document.getElementById("clearCacheDesc").textContent = getMessage("clearCacheDescription");
    document.getElementById("clearCacheBtn").textContent = getMessage("clearCache");
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
    updateI18nTexts();
    await loadSettings();
    await loadUsageData();

    // Event listeners
    document.getElementById("autoRefreshToggle").addEventListener("change", saveSettings);
    document.getElementById("autoCalculateToggle").addEventListener("change", saveSettings);
    document.getElementById("cacheDurationSelect").addEventListener("change", saveSettings);
    document.getElementById("proxyUrlInput").addEventListener("change", saveSettings);
    document.getElementById("clearCacheBtn").addEventListener("click", clearCache);
});
