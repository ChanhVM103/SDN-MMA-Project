const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Generate JWT token for a user
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

/**
 * Format user response data
 */
const formatUserResponse = (user) => ({
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || "",
    avatar: user.avatar || "",
    role: user.role,
    authProvider: user.authProvider,
});

/**
 * Register a new user (local)
 */
const registerUser = async ({ fullName, email, phone, password }) => {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        if (existingUser.authProvider !== "local") {
            const error = new Error(
                `This email is already registered with ${existingUser.authProvider}. Please use ${existingUser.authProvider} to sign in.`
            );
            error.statusCode = 409;
            throw error;
        }
        const error = new Error("Email already registered");
        error.statusCode = 409;
        throw error;
    }

    // Create new user
    const user = await User.create({
        fullName,
        email,
        phone: phone || "",
        password,
        authProvider: "local",
    });

    // Generate token
    const token = generateToken(user._id);

    return {
        user: formatUserResponse(user),
        token,
    };
};

/**
 * Login user with email and password (local)
 */
const loginUser = async ({ email, password }) => {
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // Check if user registered via social auth
    if (user.authProvider !== "local") {
        const error = new Error(
            `This account uses ${user.authProvider} login. Please sign in with ${user.authProvider}.`
        );
        error.statusCode = 400;
        throw error;
    }

    // Check if account is active
    if (!user.isActive) {
        const error = new Error("Account has been deactivated");
        error.statusCode = 403;
        throw error;
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // Generate token
    const token = generateToken(user._id);

    return {
        user: formatUserResponse(user),
        token,
    };
};

/**
 * Verify Google access token and get user info
 */
const verifyGoogleToken = async (accessToken) => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );

        if (!response.ok) {
            throw new Error("Invalid Google token");
        }

        const data = await response.json();
        return {
            id: data.id,
            email: data.email,
            name: data.name,
            picture: data.picture,
        };
    } catch (error) {
        const err = new Error("Failed to verify Google token");
        err.statusCode = 401;
        throw err;
    }
};

/**
 * Verify Facebook access token and get user info
 */
const verifyFacebookToken = async (accessToken) => {
    try {
        const response = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
        );

        if (!response.ok) {
            throw new Error("Invalid Facebook token");
        }

        const data = await response.json();

        if (!data.email) {
            const err = new Error(
                "Email permission is required. Please allow email access."
            );
            err.statusCode = 400;
            throw err;
        }

        return {
            id: data.id,
            email: data.email,
            name: data.name,
            picture: data.picture?.data?.url || "",
        };
    } catch (error) {
        if (error.statusCode) throw error;
        const err = new Error("Failed to verify Facebook token");
        err.statusCode = 401;
        throw err;
    }
};

/**
 * Social login (Google / Facebook)
 * - If user exists with same email & same provider → login
 * - If user exists with same email & different provider → error
 * - If user doesn't exist → create new user & login
 */
const socialLogin = async ({ accessToken, provider }) => {
    // Verify token based on provider
    let socialUser;
    if (provider === "google") {
        socialUser = await verifyGoogleToken(accessToken);
    } else if (provider === "facebook") {
        socialUser = await verifyFacebookToken(accessToken);
    } else {
        const error = new Error("Invalid auth provider");
        error.statusCode = 400;
        throw error;
    }

    // Check if user already exists
    let user = await User.findOne({ email: socialUser.email });

    if (user) {
        // User exists - check provider
        if (user.authProvider !== provider && user.authProvider !== "local") {
            const error = new Error(
                `This email is already registered with ${user.authProvider}. Please use ${user.authProvider} to sign in.`
            );
            error.statusCode = 409;
            throw error;
        }

        // If user was local but now using social login, update provider info
        if (user.authProvider === "local") {
            user.authProvider = provider;
            user.providerId = socialUser.id;
            if (!user.avatar && socialUser.picture) {
                user.avatar = socialUser.picture;
            }
            await user.save();
        }

        // Check if account is active
        if (!user.isActive) {
            const error = new Error("Account has been deactivated");
            error.statusCode = 403;
            throw error;
        }
    } else {
        // Create new user
        user = await User.create({
            fullName: socialUser.name,
            email: socialUser.email,
            avatar: socialUser.picture || "",
            authProvider: provider,
            providerId: socialUser.id,
        });
    }

    // Generate token
    const token = generateToken(user._id);

    return {
        user: formatUserResponse(user),
        token,
    };
};

/**
 * Get user profile by ID
 */
const getUserProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }
    return user;
};

module.exports = {
    registerUser,
    loginUser,
    socialLogin,
    getUserProfile,
    generateToken,
};
