const express = require('express');
const cors = require('cors');
const { router } = require('./router'); // Ensure this imports the router correctly

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use('/api', router); // Mount the router at /api

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
