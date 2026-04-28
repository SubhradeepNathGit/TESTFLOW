const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, 
    message: {
        status: false,
        message: "Too many requests from this IP, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, 
    message: {
        status: false,
        message: "Too many login/registration attempts, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = (app) => {
    // CORS Configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()) 
        : ["http://localhost:5173"];
    
    console.log("🔒 CORS Allowed Origins:", allowedOrigins);
        
    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log("🚫 CORS Blocked Origin:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
    }));

    
    app.use(morgan("dev"));

    
    app.use(helmet());

    
    app.use(compression());

    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    
    app.use("/api/auth", authLimiter);
    app.use("/api", limiter);

    
    app.use("/uploads", express.static(path.join(__dirname, "..", "..", "uploads")));
};
