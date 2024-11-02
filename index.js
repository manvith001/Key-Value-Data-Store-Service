const express = require('express');
const cors = require('cors');
const { router } = require('./router'); 

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use('/api', router); // api acts as the main path 
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
