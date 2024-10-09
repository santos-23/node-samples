const express = require("express");
const {registerAdmin,currentAdmin,loginAdmin} = require("../controllers/adminControl");
const validateToken = require("../middleware/validateToken");

const router = express.Router();

router.post("/register", registerAdmin);

router.post("/login", loginAdmin);

router.get("/current", validateToken, currentAdmin);

module.exports = router;