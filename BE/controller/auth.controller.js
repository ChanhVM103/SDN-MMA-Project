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

        const updatedUser = await authService.updateUserProfile(req.userId, updateData);
        const user = {
            id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            phone: updatedUser.phone || "",
            avatar: updatedUser.avatar || "",
            role: updatedUser.role,
            authProvider: updatedUser.authProvider,
            address: updatedUser.address || "",
        };

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

/**
 * PUT /api/auth/change-password
 * User tự đổi mật khẩu (cần nhập mật khẩu hiện tại)
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu mới phải có ít nhất 6 ký tự",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu mới phải khác mật khẩu hiện tại",
            });
        }

        // Lấy user kèm password
        const User = require("../models/user.model");
        const user = await User.findById(req.userId).select("+password");

        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        }

        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "Tài khoản đăng nhập qua mạng xã hội không thể đổi mật khẩu",
            });
        }

        // Xác minh mật khẩu hiện tại
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Mật khẩu hiện tại không đúng",
            });
        }

        // Lưu mật khẩu mới (pre-save hook tự hash)
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Đổi mật khẩu thành công",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Đổi mật khẩu thất bại",
        });
    }
};


/**
 * PUT /api/auth/avatar
 * Upload avatar dạng base64
 */
const updateAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ảnh avatar' });
        }

        const isValidBase64 = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/.test(avatar);
        if (!isValidBase64 && !avatar.startsWith('http')) {
            return res.status(400).json({ success: false, message: 'Định dạng ảnh không hợp lệ' });
        }

        // Base64 length calculation (approximate)
        const sizeInBytes = avatar.length * (3 / 4);
        if (sizeInBytes > 5 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'Ảnh quá lớn, vui lòng chọn ảnh dưới 5MB' });
        }

        const user = await authService.updateUserProfile(req.userId, { avatar });

        res.status(200).json({
            success: true,
            message: 'Cập nhật avatar thành công',
            data: { user },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Cập nhật avatar thất bại' });
    }
};

module.exports = {
    register,
    login,
    googleAuth,
    facebookAuth,
    getProfile,
    updateProfile,
    changePassword,
    updateAvatar,
};
