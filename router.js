const express = require('express');
const {  getApi, postApi, deleteApi,batchApi } = require('./controller'); 

const router = express.Router();


router.get('/object/:key?', getApi); 
router.post('/object',postApi); 
router.post('/object/:key',deleteApi); 
router.post('/batch/object',batchApi)

module.exports = {
    router
};
