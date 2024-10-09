const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");


const registerAdmin = asyncHandler(async (req, res) => {
    const { adminName, role, email, password } = req.body;
    if (!adminName|| !role || !email || !password) {
        res.status(400);
        throw new Error("All fields are mandatory!");
    }
    const adminAvailable = await Admin.findOne({ email });
    if (adminAvailable) {
        res.status(400);
        throw new Error("User already registered!");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed Password: ", hashedPassword);
    const admin = await Admin.create({
        adminName,
        role,
        email,
        password: hashedPassword,
    });
    console.log(`Admin created ${admin}`);
    if (admin) {
        res.status(201).json({ _id: admin.id, email: admin.email });
    } else {
        res.status(400);
        throw new Error("Admin data is not valid");
    }
    res.json({ message: "Register the admin" });
});

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error("All fields are mandatory!");
    }
    const admin = await Admin.findOne({ email });
    if (admin && (await bcrypt.compare(password, admin.password))) {
    const accessToken = jwt.sign(
        
        {
            adminName: admin.adminName,
            role: admin.role,
            email: admin.email,
            id: admin.id,
        
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


const currentAdmin = asyncHandler(async (req, res) => {
    res.json(req.admin);
    console.log(req.admin)
});

module.exports = { registerAdmin, loginAdmin, currentAdmin };