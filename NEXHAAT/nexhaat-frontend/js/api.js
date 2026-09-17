const API_BASE_URL = "http://localhost:5000/api";

const USE_MOCK_DATA = false;


async function apiRequest(endpoint, options = {}) {

    if (USE_MOCK_DATA) {
        return getMockData(endpoint);
    }

    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (token) {
        headers.Authorization = "Bearer " + token;
    }

    try {

        const response = await fetch(
            API_BASE_URL + endpoint,
            {
                ...options,
                headers: headers
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }

        return data;

    } catch (error) {

        console.error("API Error:", error);

        throw error;
    }
}


async function getDashboardData() {
    return apiRequest("/farmer/summary");
}

async function getMarketPrices() {
    return apiRequest("/market/prices");
}

async function getLots() {
    return apiRequest("/farmer/lots/my-lots");
}

async function getBuyers() {
    return apiRequest("/buyer/lots"); // Changed buyers to buyer lots for now
}

async function getLiveBids() {
    return apiRequest("/fpo/available-lots"); // Closest matching endpoint
}

async function getTransactions() {
    return apiRequest("/farmer/lots/my-lots");
}

async function getNotifications() {
    return apiRequest("/auth/me"); // Just a dummy real endpoint for now
}


function getMockData(endpoint) {

    if (endpoint === "/dashboard") {

        return Promise.resolve({
            success: true,

            data: {
                user: {
                    name: "Farmer"
                },

                summary: {
                    bestPrice: "₹3,200",
                    activeLots: 4,
                    activeBids: 7,
                    pendingTransactions: 2
                }
            }
        });
    }


    if (endpoint === "/market-prices") {

        return Promise.resolve({
            success: true,

            data: []
        });
    }


    if (endpoint === "/lots") {

        return Promise.resolve({
            success: true,

            data: []
        });
    }


    if (endpoint === "/buyers") {

        return Promise.resolve({
            success: true,

            data: []
        });
    }


    if (endpoint === "/bids/live") {

        return Promise.resolve({
            success: true,

            data: []
        });
    }


    if (endpoint === "/transactions") {

        return Promise.resolve({
            success: true,

            data: []
        });
    }


    if (endpoint === "/notifications") {

        return Promise.resolve({
            success: true,

            data: []
        });
    }


    return Promise.resolve({
        success: true,
        data: []
    });
}