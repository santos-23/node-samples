const express = require("express");
const {registerUser,currentUser,loginUser} = require("../controllers/userControl");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

// router.get("/current", validateToken, currentUser);

module.exports = router;