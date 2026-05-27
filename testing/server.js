const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const path = require("path");

const app = express();

// Middleware configuration
app.use(cors());
app.use(express.json()); // Added to parse JSON request bodies
app.use(express.static(path.join(__dirname))); // Serve static assets from root directly

// FIX: Initialized the missing data store array variable
const users = [];

// FIX: Root path pointer logic targeting local folder directly
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// FIX: Clear index.html router bypass looking at direct level
app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --- SECURITY ROUTING ENGINE ---

// 1. REGISTRATION ENDPOINT (Username-based)
app.post("/register", async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;

    if (
      users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      return res
        .status(400)
        .json({ message: "This username identifier is already taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({
      username,
      password: hashedPassword,
      trustedDevices: [deviceId],
      logs: [],
    });

    res
      .status(201)
      .json({ message: "Registration successful! Hardware profile bound." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error during credential registration mapping." });
  }
});

// 2. SECURE LOGIN ENDPOINT WITH DEVICE RECOGNITION CHECK
app.post("/login", async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase(),
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid username identity or key phrase parameters.",
      });
    }

    // Hardware authorization check
    const isDeviceKnown = user.trustedDevices.includes(deviceId);
    if (!isDeviceKnown) {
      user.logs.push({
        event: "Unrecognized Device Flagged & Access Blocked",
        time: new Date(),
        deviceId,
      });
      return res.status(403).json({
        message:
          "SECURITY ALERT: Access denied. Hardware signature unrecognized.",
      });
    }

    res.json({ message: "Identity authorized! Session bridge established." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Internal server authentication loop dropped." });
  }
});

// 3. GENERATE PASSWORD RESET OVERWRITE TOKEN
app.post("/forgot-password", (req, res) => {
  const { username } = req.body;
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );

  if (!user) {
    return res.json({
      message:
        "If the username matches our ledger, a recovery route has initialized.",
    });
  }

  const token = crypto.randomBytes(20).toString("hex");
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 900000; // 15 Minute Validation Window

  // Terminal console printout simulation
  console.log(
    `\n=================== [SIMULATED OUTBOUND MAIL] ===================`,
  );
  console.log(`User Recipient: ${username}`);
  console.log(`Action Link: http://localhost:3000/?token=${token}`);
  console.log(
    `=================================================================\n`,
  );

  res.json({
    message:
      "Recovery data dispatched. Intercept payload inside your server console window.",
  });
});

// 4. COMMIT CRYPTOGRAPHIC OVERWRITE PASSWORD RESET
app.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = users.find(
      (u) => u.resetToken === token && u.resetTokenExpires > Date.now(),
    );

    if (!user) {
      return res
        .status(400)
        .json({ message: "Verification token is invalid, used, or expired." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    res.json({
      message: "Credential reset complete! Proceed to regular login step.",
    });
  } catch (err) {
    res.status(500).json({ message: "Error modifying secure data profiles." });
  }
});

// 5. AUDIT SECURITY ACCESS ENGINE
app.get("/admin/logs/:username", (req, res) => {
  const user = users.find(
    (u) => u.username.toLowerCase() === req.params.username.toLowerCase(),
  );
  if (!user)
    return res
      .status(404)
      .json({ message: "Subject identity tracking parameters invalid." });
  res.json({ username: user.username, verification_failures: user.logs });
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ ShieldAuth Engine online at: http://localhost:${PORT}`),
);
