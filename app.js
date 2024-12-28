// Omer-Serruya-322570243-Ron-Elmalech-322766809

require('dotenv').config();
 
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = process.env.PORT;
const mongoDBUrl = process.env.MONGODB_URL;

const app = express();
app.use(express.json());
mongoose.connect(mongoDBUrl)

const db = mongoose.connection
db.on('error',error=>{console.log(error)})
db.on('connected',()=>{console.log(`[ ${new Date().toISOString()} ] Connected Succefuly to MongoDB`)})

// Routes Import
const healthRoute = require('./routes/health_route')
const postsRoute = require('./routes/post_route')

// Routes Use
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.use('/health',healthRoute)
app.use('/posts',postsRoute)

app.listen(port, () => {
  console.log(`[ ${new Date().toISOString()} ] Server is running on http://localhost:${port}`);
});
