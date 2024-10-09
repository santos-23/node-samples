const express = require('express')
const connectDB = require('./database/mongodb')
const errorHandler = require('./middleware/errorHandler')
const swaggerUI = require('swagger-ui-express')
const YAML = require('yamljs');
const swaggerJsDocs = YAML.load('./api.yaml');
const dotenv = require('dotenv').config();


connectDB();

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json())
app.use('/api/admin',require('./routes/adminRoute'))
app.use('/api/products',require('./routes/productRoute'))
app.use('/api/users/',require('./routes/userRoute'))
app.use(errorHandler)

app.use('/api-docs',swaggerUI.serve,swaggerUI.setup(swaggerJsDocs));

app.listen(port,()=>{
    console.log("server run on port 3000")
})