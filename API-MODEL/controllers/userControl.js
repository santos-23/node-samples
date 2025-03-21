const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");


const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role, phone } = req.body;
    if (!username || !password|| !role || !email || !phone) {
        res.status(400);
        throw new Error("All fields are mandatory!");
    }
    const userAvailable = await User.findOne({ email });
    if (userAvailable) {
        res.status(400);
        throw new Error("User already registered!");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed Password: ", hashedPassword);
    const user = await User.create({
        username,
        email,
        password:hashedPassword,
        role,
        phone,
    });
    console.log(`User created ${user}`);
    if (user) {
        res.status(201).json({ _id: user.id,username:user.username, email: user.email });
    } else {
        res.status(400);
        throw new Error("User data is not valid");
    }
    res.json({ message: "Register the user" });
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error("All fields are mandatory!");
    }
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
        {
            username: user.username,
            email: user.email,
            role: user.role,
            id: user.id,
        },
        process.env.ACCESS_TOKEN_SECERT,
        { expiresIn: "60m" }
    );
    res.status(200).json({ accessToken });
    } else {
        res.status(401);
        throw new Error("email or password is not valid");
    }
});


// const currentUser = asyncHandler(async (req, res) => {
//     res.json(req.user);
//     console.log(req.user)
// });

module.exports = { registerUser,loginUser};