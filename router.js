const express = require('express');
const { hello, getApi, postApi, deleteApi,batchApi } = require('./controller'); // Ensure this imports the hello controller

const router = express.Router();

// Use the correct path for the route
router.get('/hello', hello); 
router.get('/object/:key?', getApi); 
router.post('/object',postApi); 
router.post('/object/:key',deleteApi); 
router.post('/batch/object',batchApi)

module.exports = {
    router
};
