require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser')
const cors = require('cors');
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const PORT = process.env.PORT || 8080 || 8081 || 8082 || 8083;
const { authenticateJWT } = require('./middlewares/authMiddleware')



const app = express();
app.use(cors());
app.use(bodyParser.json())
app.use(authRoutes)
app.use(userRoutes)

// Define your routes and middleware here

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
