const express = require("express");
const subdomain = require("express-subdomain");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// Config
const MASTER_MONGO_URI = "mongodb://127.0.0.1:27017/main_db";
const JWT_SECRET = "change_this_in_production";
const PORT = 3000;

const app = express();
app.use(express.json());
app.use(cookieParser());

// 1. Connect to "master" DB
mongoose.connect(MASTER_MONGO_URI);

// 2. Define "master" schemas: tenants, users
const TenantSchema = new mongoose.Schema({ subdomain: String, createdAt: { default: Date.now, type: Date } });
const Tenant = mongoose.model("Tenant", TenantSchema);

const UserSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  createdAt: { default: Date.now, type: Date }
});
const User = mongoose.model("User", UserSchema);

// 3. Main router (root domain) => e.g. lvh.me:3000
const mainRouter = express.Router();

// Signup route: user picks subdomain, you create tenant
mainRouter.post("/signup", async (req, res) => {
  try {
    const { email, password, subdomain } = req.body;
    if (!email || !password || !subdomain) return res.status(400).json({ error: "Missing fields" });

    // Check subdomain availability
    const existing = await Tenant.findOne({ subdomain });
    if (existing) return res.status(400).json({ error: "Subdomain taken" });

    // Create user
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = await User.create({ email, passwordHash });

    // Create tenant
    const tenant = await Tenant.create({ subdomain });
    return res.json({ success: true, tenantId: tenant._id, subdomain });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

mainRouter.get("/", (req, res) => {
  res.send("Main domain => POST /signup to register a tenant.");
});
app.use("/", mainRouter);

// 4. Subdomain router => e.g. "mycompany.lvh.me:3000"
const tenantRouter = express.Router();

// Detect subdomain from req.subdomains
tenantRouter.use((req, res, next) => {
  const sd = req.subdomains[0]; // e.g. "mycompany"
  if (!sd) return res.status(400).json({ error: "No subdomain provided" });
  req.subdomainName = sd;
  next();
});

// Simple login route
tenantRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign({ userId: user._id, subdomain: req.subdomainName }, JWT_SECRET, { expiresIn: "1d" });
    return res.json({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

tenantRouter.get("/", (req, res) => {
  res.send(`Hello from subdomain: ${req.subdomainName}`);
});

// Attach subdomain router
app.use(subdomain("*", tenantRouter));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
