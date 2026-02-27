const authService = require("../services/auth.services");

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = async (req, res) => {
    try {
        const { fullName, email, phone, password, confirmPassword } = req.body;

        // Validation
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, and password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        // Email format validation
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        const result = await authService.registerUser({
            fullName,
            email,
            phone,
            password,
        });

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: result,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Registration failed",
        });
    }
};

/**
 * POST /api/auth/login
 * Login user with email/password
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const result = await authService.loginUser({ email, password });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: result,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Login failed",
        });
    }
};

/**
 * POST /api/auth/google
 * Login/Register with Google
 */
const googleAuth = async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: "Google access token is required",
            });
        }

        const result = await authService.socialLogin({
            accessToken,
            provider: "google",
        });

        res.status(200).json({
            success: true,
            message: "Google login successful",
            data: result,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Google login failed",
        });
    }
};

/**
 * POST /api/auth/facebook
 * Login/Register with Facebook
 */
const facebookAuth = async (req, res) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: "Facebook access token is required",
            });
        }

        const result = await authService.socialLogin({
            accessToken,
            provider: "facebook",
        });

        res.status(200).json({
            success: true,
            message: "Facebook login successful",
            data: result,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Facebook login failed",
        });
    }
};

/**
 * GET /api/auth/profile
 * Get current user profile (requires auth middleware)
 */
const getProfile = async (req, res) => {
    try {
        const user = await authService.getUserProfile(req.userId);

        res.status(200).json({
            success: true,
            data: { user },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to get profile",
        });
    }
};

/**
 * PUT /api/auth/profile
 * Update current user profile (requires auth middleware)
 */
const updateProfile = async (req, res) => {
    try {
        const { fullName, phone, address } = req.body;
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;

        const user = await authService.updateUserProfile(req.userId, updateData);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: { user },
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to update profile",
        });
    }
};

module.exports = {
    register,
    login,
    googleAuth,
    facebookAuth,
    getProfile,
    updateProfile,
};
