const express = require('express');
const {createEmployee,getEmployees,getEmployee} = require('./empControl');
const router = express.Router();

router.route('/').post(createEmployee)
router.route('/').get(getEmployees)
router.route('/:id').get(getEmployee)


module.exports = router;