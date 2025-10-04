// const BACKEND_URL = "http://localhost:3001";

// // --- Token check ---
// const token = localStorage.getItem("authToken");
// if (!token) {
//     alert("No token found. Please login first.");
//     window.location.href = "index.html";
// }

// // Helper to decode JWT
// function parseJwt(token) {
//     const base64Url = token.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
//         '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
//     ).join(''));
//     return JSON.parse(jsonPayload);
// }

// const userId = parseJwt(token).id;

// // --- Socket.IO Setup ---
// let socket;

// function initSocket() {
//     if (socket) return; // Prevent multiple connections

//     socket = io(BACKEND_URL, {
//         auth: { token },
//         reconnectionAttempts: 5, // Max reconnect tries
//         reconnectionDelay: 1000  // 1s between attempts
//     });

//     socket.on("connect", () => {
//         console.log("Connected to Socket.IO server:", socket.id);
//         socket.emit("join", userId);
//     });

//     socket.on("disconnect", (reason) => {
//         console.warn("Socket disconnected. Reason:", reason);
//     });

//     socket.on("notification", (data) => {
//         console.log("🔔 New notification:", data);
//         addNotification(data.message);
//     });
// }

// // --- Notifications ---
// async function fetchNotifications() {
//     try {
//         const res = await fetch(`${BACKEND_URL}/api/notifications/`, {
//             headers: { "Authorization": `Bearer ${token}` }
//         });

//         const notifications = await res.json();
//         notifications.forEach(n => addNotification(n.message));
//     } catch (err) {
//         console.error("Failed to fetch notifications:", err);
//     }
// }

// function addNotification(message) {
//     const notifDiv = document.createElement("div");
//     notifDiv.classList.add("notif");
//     notifDiv.textContent = message;
//     document.getElementById("notifications").prepend(notifDiv);
// }

// // --- Logout ---
// function logout() {
//     localStorage.removeItem("authToken");
//     localStorage.removeItem("refreshToken");
//     if (socket) socket.disconnect(); // Disconnect socket on logout
//     window.location.href = "index.html";
// }

// // --- Init ---
// document.addEventListener("DOMContentLoaded", () => {
//     initSocket();
//     fetchNotifications();
// });



const BACKEND_URL = "http://localhost:3001";
const token = localStorage.getItem("authToken");
if (!token) {
  alert("No token found. Please login first.");
  window.location.href = "index.html";
}

// Decode JWT
function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}

const userId = parseJwt(token).id;

let socket;

// Initialize Socket.IO
function initSocket() {
  if (socket) socket.disconnect(); // Disconnect old socket

  socket = io(BACKEND_URL, {
    auth: { token },
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  // Join user room on connect
  socket.on("connect", () => {
    console.log("Connected:", socket.id);
    socket.emit("join", userId);
  });

  socket.on("disconnect", (reason) => {
    console.warn("Socket disconnected:", reason);
  });

  // Remove old listener if any
  socket.off("notification");
  socket.on("notification", (data) => {
    console.log("🔔 Notification:", data);
    addNotification(data.message);
  });
}

// Fetch missed notifications (optional)
async function fetchNotifications() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/notifications/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notifications = await res.json();
    notifications.forEach(n => addNotification(n.message));
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
  }
}

function addNotification(message) {
  const notifDiv = document.createElement("div");
  notifDiv.classList.add("notif");
  notifDiv.textContent = message;
  document.getElementById("notifications").prepend(notifDiv);
}

// Logout
function logout() {
  localStorage.removeItem("authToken");
  if (socket) socket.disconnect();
  window.location.href = "index.html";
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  initSocket();
  fetchNotifications();
});
