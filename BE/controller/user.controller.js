const User = require("../models/user.model");

/**
 * GET /api/users
 * Get all users for Admin
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "restaurants",
                    localField: "_id",
                    foreignField: "owner",
                    as: "restaurantData"
                }
            },
            {
                $addFields: {
                    hasRestaurant: { $gt: [{ $size: "$restaurantData" }, 0] }
                }
            },
            {
                $project: {
                    password: 0,
                    restaurantData: 0 // We just need the boolean locally
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            message: "Fetched users successfully",
            data: { users },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch users",
        });
    }
};

/**
 * PUT /api/users/:id
 * Update a user's details (e.g., role, isActive) by Admin
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, isActive, fullName, phone, address } = req.body;

        const updateData = {};
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (fullName) updateData.fullName = fullName;
        if (phone) updateData.phone = phone;
        if (address) updateData.address = address;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: { user: updatedUser },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update user",
        });
    }
};

/**
 * DELETE /api/users/:id
 * Delete a user by Admin
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (id === req.userId) {
             return res.status(400).json({
                 success: false,
                 message: "You cannot delete your own admin account",
             });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete user",
        });
    }
};

/**
 * POST /api/users
 * Admin creates a new user directly
 */
const adminCreateUser = async (req, res) => {
    try {
        const { fullName, email, password, phone, role } = req.body;

        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ tên, email, mật khẩu và quyền.",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email này đã được sử dụng.",
            });
        }

        // Hash password
        const bcrypt = require("bcryptjs");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            phone: phone || "",
            role,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: "Tạo tài khoản thành công",
            data: { user: newUser }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Lỗi khi tạo tài khoản",
        });
    }
};

module.exports = {
    getAllUsers,
    updateUser,
    deleteUser,
    adminCreateUser
};
