// Script fix role bị lưu sai (ví dụ: 'shipper"' thay vì 'shipper')
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

async function fixRoles() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;
  const users = db.collection("users");

  // Tìm các user có role bị lưu sai (chứa dấu ngoặc kép thừa)
  const badUsers = await users.find({
    role: { $regex: /["\s]/ }  // role chứa " hoặc khoảng trắng
  }).toArray();

  console.log(`🔍 Tìm thấy ${badUsers.length} user có role bị lỗi:`);

  for (const user of badUsers) {
    const fixedRole = user.role.replace(/["\s]/g, "").trim();
    const validRoles = ["user", "admin", "brand", "shipper"];
    
    if (!validRoles.includes(fixedRole)) {
      console.log(`  ⚠️  ${user.email}: role "${user.role}" → không nhận ra, bỏ qua`);
      continue;
    }

    await users.updateOne(
      { _id: user._id },
      { $set: { role: fixedRole } }
    );
    console.log(`  ✅ ${user.email}: role "${user.role}" → "${fixedRole}"`);
  }

  console.log("\n🎉 Xong!");
  await mongoose.disconnect();
}

fixRoles().catch(err => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
