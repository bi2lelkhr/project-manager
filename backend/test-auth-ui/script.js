const API_BASE = 'http://localhost:3001/api/auth';

// --- Token handling with localStorage ---
function storeTokens(token, refreshToken) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    updateTokenStatus();
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

function clearTokens() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    updateTokenStatus();
    alert('Tokens cleared!');
}

function updateTokenStatus() {
    const token = getAuthToken();
    const statusElement = document.getElementById('tokenStatus');
    statusElement.textContent = token ? 'Set ✓' : 'Not set';
    statusElement.style.color = token ? '#4caf50' : '#f44336';
}

// --- API helper ---
async function apiCall(url, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// --- Login ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const result = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (result.token && result.refreshToken) {
            storeTokens(result.token, result.refreshToken);

            // Redirect to dashboard
            window.location.href = "dashboard.html";
        }

        document.getElementById('loginResult').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('loginResult').textContent = `Error: ${error.message}`;
    }
});

// --- Register ---
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const username = document.getElementById('registerUsername').value;
    const job_title = document.getElementById('registerJobTitle').value;
    const password = document.getElementById('registerPassword').value;
    const is_developper = document.getElementById('registerIsDeveloper').checked;

    try {
        const result = await apiCall('/register', {
            method: 'POST',
            body: JSON.stringify({ email, username, job_title, password, is_developper }),
        });

        if (result.token && result.refreshToken) {
            storeTokens(result.token, result.refreshToken);

            // Redirect to dashboard
            window.location.href = "dashboard.html";
        }

        document.getElementById('registerResult').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('registerResult').textContent = `Error: ${error.message}`;
    }
});

// --- Change Password ---
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
        const result = await apiCall('/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        document.getElementById('changePasswordResult').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('changePasswordResult').textContent = `Error: ${error.message}`;
    }
});

// --- Get Current User ---
async function getCurrentUser() {
    try {
        const result = await apiCall('/me');
        document.getElementById('currentUserResult').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('currentUserResult').textContent = `Error: ${error.message}`;
    }
}
window.getCurrentUser = getCurrentUser;

// --- Refresh Token ---
async function refreshTokenFunc() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        document.getElementById('refreshTokenResult').textContent = 'No refresh token found';
        return;
    }

    try {
        const result = await apiCall('/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });

        if (result.token && result.refreshToken) {
            storeTokens(result.token, result.refreshToken);
        }

        document.getElementById('refreshTokenResult').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('refreshTokenResult').textContent = `Error: ${error.message}`;
    }
}
window.refreshToken = refreshTokenFunc;

// --- Get All Users ---
async function getAllUsers() {
    try {
        const result = await apiCall('/users');
        document.getElementById('allUsersResult').textContent = JSON.stringify(result, null, 2);
    } catch (error) {
        document.getElementById('allUsersResult').textContent = `Error: ${error.message}`;
    }
}
window.getAllUsers = getAllUsers;

// --- Init ---
updateTokenStatus();
