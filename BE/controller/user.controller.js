const User = require("../models/user.model");

// ── GET /api/users ────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, role, isActive, sortBy = "createdAt", order = "desc" } = req.query;
        const filter = {};
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === "true";
        if (search) filter.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
        ];
        const total = await User.countDocuments(filter);
        const users = await User.find(filter).select("-password")
            .sort({ [sortBy]: order === "desc" ? -1 : 1 })
            .skip((page - 1) * limit).limit(Number(limit));
        return res.json({ success: true, data: users, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/users/stats ──────────────────────────
const getUserStats = async (req, res) => {
    try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const [total, active, admins, brands, newThisMonth] = await Promise.all([
            User.countDocuments(), User.countDocuments({ isActive: true }),
            User.countDocuments({ role: "admin" }), User.countDocuments({ role: "brand" }),
            User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        ]);
        return res.json({ success: true, data: { total, active, inactive: total - active, admins, brands, normalUsers: total - admins - brands, newThisMonth } });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/users/brands/public (No Auth) ─────────
const getPublicBrands = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const brands = await User.find({ role: "brand", isActive: true })
            .select("_id fullName avatar email")
            .limit(limit);
        return res.json({ success: true, data: brands });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── GET /api/users/:id ────────────────────────────
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        return res.json({ success: true, data: user });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── POST /api/users ───────────────────────────────
const adminCreateUser = async (req, res) => {
    try {
        const { fullName, email, password, phone, role, address } = req.body;
        if (!fullName || !email || !password) return res.status(400).json({ success: false, message: "fullName, email và password là bắt buộc" });
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(400).json({ success: false, message: "Email đã tồn tại" });
        const user = await User.create({ fullName, email, phone, password, role, address, isActive: true });
        return res.status(201).json({ success: true, message: "Tạo tài khoản thành công", data: { user } });
    } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
};

// ── PUT /api/users/:id ────────────────────────────
const updateUser = async (req, res) => {
    try {
        const { fullName, phone, address, role, isActive } = req.body;
        const updateData = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        return res.json({ success: true, message: "Cập nhật thành công", data: user });
    } catch (err) { return res.status(400).json({ success: false, message: err.message }); }
};

// ── PATCH /api/users/:id/role ─────────────────────
const changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "admin", "brand"].includes(role)) return res.status(400).json({ success: false, message: "Role không hợp lệ (user/admin/brand)" });
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        return res.json({ success: true, message: `Đã đổi role thành "${role}"`, data: user });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── PATCH /api/users/:id/toggle-active ───────────
const toggleUserActive = async (req, res) => {
    try {
        if (req.params.id === req.userId) return res.status(400).json({ success: false, message: "Không thể thay đổi trạng thái tài khoản của chính mình" });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        user.isActive = !user.isActive;
        await user.save();
        return res.json({ success: true, message: user.isActive ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản", data: user });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── PATCH /api/users/:id/reset-password ──────────
const resetPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        if (!newPassword || !confirmPassword) return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu mới và xác nhận" });
        if (newPassword.length < 6) return res.status(400).json({ success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" });
        if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: "Mật khẩu mới và xác nhận không khớp" });
        const user = await User.findById(req.params.id).select("+password");
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        user.password = newPassword;
        await user.save();
        return res.json({ success: true, message: `Đã reset mật khẩu cho "${user.fullName}"` });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── DELETE /api/users/:id ─────────────────────────
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.userId) return res.status(400).json({ success: false, message: "Không thể xóa tài khoản của chính mình" });
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
        return res.json({ success: true, message: "Đã xóa user thành công" });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

// ── FAVORITES Logic ───────────────────────────────
const toggleFavorite = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        console.log(`[DEBUG] toggleFavorite for user ${req.userId}, restaurant ${restaurantId}`);
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });

        const isFavorited = user.favorites.some(id => id.toString() === restaurantId);
        if (isFavorited) {
            user.favorites = user.favorites.filter(id => id.toString() !== restaurantId);
        } else {
            user.favorites.push(restaurantId);
        }

        await user.save();
        return res.json({ success: true, message: isFavorited ? "Đã xóa khỏi danh sách yêu thích" : "Đã thêm vào danh sách yêu thích", isFavorited: !isFavorited });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};

const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate({
            path: 'favorites',
            select: 'name image emoji address rating reviews distance tags'
        });
        if (!user) return res.status(404).json({ success: false, message: "Người dùng không tồn tại" });
        return res.json({ success: true, data: user.favorites });
    } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
};


module.exports = {
    getAllUsers, getUserStats, getUserById,
    adminCreateUser, updateUser, changeUserRole,
    toggleUserActive, resetPassword, deleteUser,
    getPublicBrands, toggleFavorite, getFavorites,
};
