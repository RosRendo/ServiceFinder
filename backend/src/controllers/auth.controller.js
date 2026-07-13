const bcrypt = require("bcryptjs");
const prisma = require("../config/database");
const transporter = require("../config/email");
const { getPasswordResetEmail } = require("../utils/emailTemplates");
const { generateToken } = require("../utils/jwt");
const cookie = require("cookie");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
    secure: isProd, // HTTPS only in production (required for sameSite: 'none')
    sameSite: isProd ? "none" : "lax", // 'none' allows cross-domain cookies (Vercel -> Railway)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/", // Available on all routes
  };
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role = "customer" } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        passwordHash,
        role,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });


    // Verify user can be looked up immediately
    const verifyUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    // Generate token
    const token = generateToken(user.id);
    res.cookie("token", token, getCookieOptions());

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("token", {
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });


    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if account is active
    if (user.status !== "active") {
      return res.status(403).json({ error: "Account is suspended" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = generateToken(user.id);
    res.cookie("token", token, getCookieOptions());

    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset (send email with code)
const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return res.json({
        message: "If the email exists, a reset code has been sent",
      });
    }

    // Generate 6-digit code
    const code = generateCode();

    // Set expiration (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidate old codes
    await prisma.passwordReset.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: { used: true },
    });

    // Create new reset code
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        code,
        expiresAt,
      },
    });

    // Send email
    const emailContent = getPasswordResetEmail(code, user.fullName);

    await transporter.sendMail({
      from: `"CleanService" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });


    res.json({
      message: "If the email exists, a reset code has been sent",
    });
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    next(error);
  }
};

// Verify reset code
const verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Invalid code" });
    }

    // Find valid reset code
    const resetCode = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: {
          gt: new Date(), // Greater than now (not expired)
        },
      },
    });

    if (!resetCode) {
      return res.status(400).json({
        error: "Invalid or expired code",
      });
    }

    res.json({
      message: "Code verified successfully",
      valid: true,
    });
  } catch (error) {
    console.error("Error in verifyResetCode:", error);
    next(error);
  }
};

// Reset password with code
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    // Validate input
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: "Email, code, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ error: "Invalid code" });
    }

    // Find valid reset code
    const resetCode = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetCode) {
      return res.status(400).json({
        error: "Invalid or expired code",
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and mark code as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetCode.id },
        data: { used: true },
      }),
    ]);


    res.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    next(error);
  }
};

// Google Login/Register
const googleLogin = async (req, res, next) => {
  try {
    const { token, role = "customer" } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Google token is required" });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create user if they don't exist
      // Generate a random password since they use Google
      const randomPassword =
        Math.random().toString(36).slice(-10) +
        Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          fullName: name,
          email,
          avatar: picture,
          passwordHash,
          role,
          status: "active",
        },
      });
    }

    // Check if account is active
    if (user.status !== "active") {
      return res.status(403).json({ error: "Account is suspended" });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const jwtToken = generateToken(user.id);
    res.cookie("token", jwtToken, getCookieOptions());

    // Return user data without password
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      message: "Google login successful",
      user: userWithoutPassword,
      token: jwtToken,
    });
  } catch (error) {
    console.error("Error in googleLogin:", error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  getMe,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
};
