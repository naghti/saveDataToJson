const fs = require('fs');
require('dotenv').config();

const USER_NAME = process.env.USER_NAME;
const PASSWORD = process.env.PASSWORD;
const URL = process.env.API_URL;

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);

const weekAgo = new Date(today);
weekAgo.setDate(weekAgo.getDate() - 7);

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const getData = async () => {
    let token = null;
    const savedData = {
        "/api/v1/auth/token": {
            username: USER_NAME,
            password: PASSWORD
        }
    };

    const getToken = async () => {
        const urlencoded = new URLSearchParams();
        urlencoded.append("username", USER_NAME);
        urlencoded.append("password", PASSWORD);

        const requestOptions = {
            method: "POST",
            body: urlencoded,
            redirect: "follow"
        };

        await fetch(URL + "auth/token", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                token = result['access_token'];
            })
            .catch((error) => console.error('error on get token', error));
    }

    const fetchData = async (endpoint, method = "GET", body = null, queryParams = {}) => {
        try {
            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${token}`);

            const queryString = new URLSearchParams(queryParams).toString();
            const fullUrl = URL + endpoint + (queryString ? `?${queryString}` : '');

            const requestOptions = {
                method: method,
                headers: myHeaders,
                redirect: "follow"
            };

            if (method === "POST" && body) {
                requestOptions.body = JSON.stringify(body);
                myHeaders.append("Content-Type", "application/json");
            }

            const response = await fetch(fullUrl, requestOptions);
            return await response.json();
        } catch (e) {
            console.error(`failed ${method} request to`, endpoint);
            return null;
        }
    }

    await getToken();

    const endpoints = [
        { endpoint: "auth/users/me", method: "GET" },
        {
            endpoint: "chart",
            method: "GET",
            queryParams: {
                "from_date": formatDate(weekAgo),
                "to_date": formatDate(yesterday),
            }
        },
        { endpoint: "apps", method: "GET" },
        {
            endpoint: "mrr-changes/preview",
            method: "GET",
            queryParams: {
                "from_date": formatDate(weekAgo),
                "to_date": formatDate(yesterday),
            }
        },
        {
            endpoint: "top-keywords/groups",
            method: "GET",
            queryParams: {
                limit: 10,
                offset: 0,
                order_by: "created_at",
                order: "asc",
                state: "all"
            }
        },
        {
            endpoint: "top-keywords/groups/usa",
            method: "GET",
            queryParams: {
                limit: 10,
                offset: 0,
                order_by: "created_at",
                order: "asc",
                state: "all"
            }
        },
        {
            endpoint: "top-keywords/groups/english",
            method: "GET",
            queryParams: {
                limit: 10,
                offset: 0,
                order_by: "created_at",
                order: "asc",
                state: "all"
            }
        },
        {
            endpoint: "top-keywords/groups/europe",
            method: "GET",
            queryParams: {
                limit: 10,
                offset: 0,
                order_by: "created_at",
                order: "asc",
                state: "all"
            }
        },
        {
            endpoint: "top-keywords/groups/latin",
            method: "GET",
            queryParams: {
                limit: 10,
                offset: 0,
                order_by: "created_at",
                order: "asc",
                state: "all"
            }
        },
        {
            endpoint: "top-keywords/groups/asia",
            method: "GET",
            queryParams: {
                limit: 10,
                offset: 0,
                order_by: "created_at",
                order: "asc",
                state: "all"
            }
        },

        {
            endpoint: "suggestions",
            method: "GET",
            queryParams: {
                limit: 10,
                offset: 0,
                order_by: "created_at",
                order: "desc",
            }
        },
        {
            endpoint: "checks-data",
            method: "GET",
            queryParams: {
                limit: 10,
                offset: 0,
                for_date: formatDate(yesterday),
                state: "new",
                active_checks: true,
            }
        },
        { endpoint: "niches", method: "GET" },
        { endpoint: "dashboards/info", method: "GET" },
        {
            endpoint: "apps-data",
            method: "GET",
            queryParams: {
                charts: true,
                parse: false,
                from_date: formatDate(weekAgo),
                to_date: formatDate(yesterday),
            }
        },
        {
            endpoint: "ab-tests",
            method: "GET",
            queryParams: {
                limit: 20,
                offset: 0,
                order: "desc",
                order_by: "created_at",
                owner: "our",
                pattern: "",
            }
        },
        {
            endpoint: "reviews",
            method: "POST",
            queryParams: {
                limit: 10,
                offset: 0,
                order_by: "for_date",
                order: "desc"
            },
            body: {}
        },
        {
            endpoint: "apps-data/availability",
            method: "GET",
            queryParams: {
                for_date: formatDate(yesterday)
            }
        }
    ];

    for (const config of endpoints) {
        const data = await fetchData(
            config.endpoint,
            config.method,
            config.body,
            config.queryParams
        );

        const key = `/api/v1/${config.endpoint}`;

        savedData[key] = data;
    }

    const appsList = savedData['/api/v1/apps']?.all || [];

    for (const app of appsList) {
        try {
            const appId = app.id;
            const endpoint = `apps/${appId}`;

            const data = await fetchData(endpoint);
            savedData[`/api/v1/${endpoint}`] = data;
        } catch (e) {
            console.error('failed to fetch app details', app.id, e);
        }
    }

    fs.writeFileSync('savedData.json', JSON.stringify(savedData, null, 2));
    console.log('Data saved to savedData.json');
}

getData();