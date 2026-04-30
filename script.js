// 1. GET OR CREATE DEVICE ID (Stored in browser)
function getDeviceId() {
  let id = localStorage.getItem("unique_device_id");
  if (!id) {
    id = "DEV-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    localStorage.setItem("unique_device_id", id);
  }
  return id;
}

const currentDeviceId = getDeviceId();
document.getElementById("display-id").innerText = currentDeviceId;

// 2. AUTHENTICATION FUNCTION
async function auth(type) {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("status-text");

  if (!email || !password) return alert("Please fill in all fields.");

  try {
    const response = await fetch(`http://localhost:3000/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, deviceId: currentDeviceId }),
    });

    const result = await response.json();
    status.innerText = result.message;
    status.className = response.ok ? "success" : "error";
  } catch (err) {
    status.innerText = "Connection failed. Start your Node server!";
    status.className = "error";
  }
}

function toggleView() {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.getElementById("togglePassword");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleBtn.innerText = "Hide";
  } else {
    passwordInput.type = "password";
    toggleBtn.innerText = "Show";
  }
}