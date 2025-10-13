const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const hashPassword = async (plain) => {
  if (!plain) return undefined;
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
const JWT_SECRET='1d791dfad85833e73bd9baf9bda04bfef6f4121b215b62c0268920472016ccc1439afc0f819eef581283be376c4f908b5fc1f32b4eaf1b50e2c08f9bdb016abc'
const signToken = (payload, expiresIn = "7d") =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

module.exports = { hashPassword, comparePassword, signToken };
