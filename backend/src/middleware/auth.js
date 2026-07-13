const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

const authenticate = async (req, res, next) => {
  try {
    // ✅ BEST: Check cookie first (HttpOnly, secure)
    // ⚠️ FALLBACK: Check Authorization header (for mobile apps, API clients)
    const token =
      req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");


    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    // Get user from database
    let user;
    try {
      const userId = BigInt(decoded.userId);

      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
        },
      });


      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
    } catch (conversionError) {
      console.error("🔐 BigInt conversion error:", conversionError.message);
      return res.status(401).json({ error: "Invalid token format" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ error: "Account is suspended" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(500).json({ error: "Authentication failed" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
