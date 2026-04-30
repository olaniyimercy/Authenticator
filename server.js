const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");
const app = express();

// Middleware
app.use(cors()); // Allows your frontend to talk to this server
app.use(express.json()); // Allows parsing JSON data
app.use(express.static("public")); // Serves your HTML/CSS files

// Mock Database (Data resets when server restarts)
const users = [];

//REGISTER: Create user and save the initial device ID
app.post("/register", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
      email,
      password: hashedPassword,
      trustedDevices: [deviceId],
      logs: [],
    });

    res.status(201).json({ message: "Account created! Device registered." });
  } catch (err) {
    res.status(500).json({ message: "Error during registration." });
  }
});

// 2. LOGIN: Verify credentials and check Device Recognition
app.post("/login", async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const user = users.find((u) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // DEVICE RECOGNITION LOGIC
    const isTrusted = user.trustedDevices.includes(deviceId);

    if (!isTrusted) {
      // Monitor and Flag: Record the unauthorized attempt
      user.logs.push({
        event: "Unrecognized Device Login",
        time: new Date(),
        id: deviceId,
      });
      return res.status(403).json({
        message: "ACCESS DENIED: Unknown device detected.",
      });
    }

    res.json({ message: "Login successful! Welcome back." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Security Server running at http://localhost:${PORT}`);
});