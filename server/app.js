require("dotenv").config();
const express = require("express");
const app = express();

const connectDB = require("./app/config/db");
const setupMiddleware = require("./app/middleware");
const routes = require("./app/routes");
const errorHandler = require("./app/middleware/error");

// Connect to Database
connectDB().then(() => {
  // Sync Super Admin with .env
  const syncSuperAdmin = require("./app/utils/superAdminSync");
  syncSuperAdmin();
});

// Setup global middleware (CORS, Helmet, Rate Limit, etc.)
setupMiddleware(app);

// API Routes
app.use("/", routes);

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3006;
const server = app.listen(PORT, () => {
  console.log(`TESTFLOW Server running on PORT: ${PORT}`);
});

// Initialize Socket.io
const { initSocket } = require("./app/utils/socket");
initSocket(server);

server.timeout = 600000;
