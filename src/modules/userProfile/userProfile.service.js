const mongoose = require("mongoose");
const User = require("../auth/models/user.model");
const UserProfile = require("./userProfile.model");
const createUserWithProfile = async ({
    name,email,passwordHash,provider = "email",providerId,role,profileInput = {}
}) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await User.create(
          [{ name, email, password: passwordHash, provider, providerId, role }],
          { session }
        );
        const createdUser  = user[0];
        const profile = await UserProfile.create([
            {
                user: createdUser._id,
                role,
                ...profileInput,
            },
        ],
    {
        session
    })
    await session.commitTransaction();
    session.endSession();
    return {user: createdUser,profile: profile[0]}
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}
module.exports = {createUserWithProfile}