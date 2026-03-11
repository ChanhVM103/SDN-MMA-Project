const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Restaurant = require('./models/restaurant.model');
    const Product = require('./models/product.model');

    const rest = await Restaurant.findOne({ name: /Phở Thìn/i });
    if (!rest) {
        console.log("Not found Phở Thìn");
        process.exit(1);
    }
    console.log("Found Restaurant:", rest.name, rest._id);

    const prods = await Product.find({ restaurant: rest._id });
    if (prods.length > 0) {
        console.log("Products already exist for this restaurant. Count:", prods.length);
        process.exit(0);
    }

    const phoBoAddons = [
        {
            name: "Chọn Size",
            isRequired: true,
            maxOptions: 1,
            options: [
                { name: "Sợi Bún Nhỏ", price: 0 },
                { name: "Sợi Phở Lớn", price: 5000 },
            ]
        },
        {
            name: "Thêm Topping",
            isRequired: false,
            maxOptions: 5,
            options: [
                { name: "Trứng chần", price: 10000 },
                { name: "Quẩy", price: 5000 },
                { name: "Thêm nạm bò", price: 20000 },
            ]
        }
    ];

    const sampleProducts = [
        {
            restaurantId: rest._id,
            name: "Phở Bò Tái Nạm",
            description: "Phở bò truyền thống với thịt tái và nạm bò mềm, nước dùng thanh ngọt.",
            price: 55000,
            image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800",
            category: "Món chính",
            type: "food",
            addons: phoBoAddons,
            isBestSeller: true,
            isAvailable: true,
            emoji: "🍜"
        },
        {
            restaurantId: rest._id,
            name: "Trà Tắc Cà Phê",
            description: "Giải khát cực mát lạnh",
            price: 25000,
            image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800",
            category: "Đồ uống",
            type: "drink",
            addons: [
                {
                    name: "Chọn Size",
                    isRequired: true,
                    maxOptions: 1,
                    options: [
                        { name: "Vừa", price: 0 },
                        { name: "Lớn", price: 10000 },
                    ]
                },
                {
                    name: "Lượng Đá",
                    isRequired: true,
                    maxOptions: 1,
                    options: [
                        { name: "Bình thường", price: 0 },
                        { name: "Ít đá", price: 0 },
                    ]
                }
            ],
            isBestSeller: false,
            isAvailable: true,
            emoji: "🥤"
        }
    ];

    try {
        await Product.insertMany(sampleProducts);
        console.log("Successfully seeded", sampleProducts.length, "products for Phở Thìn");
    } catch (err) {
        console.error("Seed error", err);
    }

    process.exit(0);
}
run();
