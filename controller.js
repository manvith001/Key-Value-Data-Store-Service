// controller.js
const sql = require('mssql');
const { config, tenantCheck } = require('./constant');

const moment = require('moment');
const hello = async (req, res) => {
    console.log("_______________", config)
    // Create a new connection pool

    try {
        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction); // Create a request object for the transaction
        const query = 'SELECT * FROM TestTable'; // Query to retrieve data
        const result = await request.query(query); // Execute the query

        await transaction.commit(); // Commit the transaction

        const response = {
            status: 200,
            data: result.recordset
        };

        res.status(200).send(response); // Send the response
    } catch (err) {
        console.log(err)
        await transaction.rollback();
        console.error('Error during database transaction: ', err);
        res.status(500).send({ status: 500, message: 'Server error' });
    }
};

const getApi = async (req, res) => {

    console.log("getAPIIin ", config)
    let pool
    try {
        pool = new sql.ConnectionPool(config)
        await pool.connect()
        const transaction = new sql.Transaction(pool)
        await transaction.begin()
        const request = pool.request();
       
        const keyParam = req.params.key
        console.log(keyParam)

        let getQuery
        if (keyParam) {
            getQuery = `select * from [KeyValue]  where [key]=@keyParam and  ttl IS NULL OR ttl > GETDATE() and is_active=1`
            request.input('keyParam', sql.VarChar, keyParam);
        }
        else {
            getQuery = `select * from [KeyValue] where   ttl IS NULL OR ttl > GETDATE()and is_active=1 `
        }



        const result = await request.query(getQuery)
        await transaction.commit()
        console.log("result", result)

        const data = result.recordset
        data.forEach(item => {
            item.data = JSON.parse(item.data)
            // const date = new Date(item.ttl);
            // item.ttl = date.toLocaleString(); 
            if (item.ttl) {
                item.ttl = moment(item.ttl).format('YYYY-MM-DD HH:mm:ss');
            } else {
                item.ttl = "NO ttl"
            }

        })
        console.log(data)

        if (data === 0) {
            res.status(200).send({ status: 200, response: 'No data found' })

        } else {
            res.status(200).send(data);
        }




    }
    catch (err) {
        console.log(err)
        await transaction.rollback();
        console.error('Error during database transaction: ', err);
        res.status(500).send({ status: 500, message: 'Server error' });
    }
    finally {
        if (pool) {
            await pool.close(); // Close the pool connection in the finally block
        }
    }

}

const postApi = async (req, res) => {
    console.log("postApi ", config)
    let pool
    try {
        pool = new sql.ConnectionPool(config)
        await pool.connect()
        const transaction = new sql.Transaction(pool)
        await transaction.begin()
        const request = pool.request();
        const { key, data, ttl } = req.body
        console.log("payload", key, data, ttl)
        const tenant=req.body.tenantID
        console.log(tenant);
        

        if (!tenant) {
            return res.status(400).send({
                error: "Invalid Input",
                message: "Tenant ID is required."
            });
        }
        const tenantcheck=await tenantCheck(tenant)

        if (!key || !data || !ttl) {
            res.status(400).send({
                "error": "Missing required field",
                "message": "The 'key', 'data', and 'ttl' fields are required."
            })
        }
        const expirationDateTime = moment().add(ttl, 'seconds').toISOString();
        console.log(expirationDateTime)
        const checkQuery = `SELECT COUNT(*) AS count FROM KeyValue WHERE [key] = @key AND tenantID = @tenantID`;
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('key', sql.VarChar, key);
        checkRequest.input('tenantID', sql.Int, tenant);

        const checkResult = await checkRequest.query(checkQuery);
        if (checkResult.recordset[0].count > 0) {
            // Throw an error for duplicate key
            return res.status(409).send({
                error: "Duplicate Key Error",
                message: `The key '${key}' already exists for tenant ID '${tenant}'.`
            });
            
        }

        const postQuery = ` INSERT INTO KeyValue ([key], data, ttl,tenantID) 
                                VALUES (@key,@data,@ttl,@tenantID)`;
        request.input('key', sql.VarChar, key);
        request.input('data', sql.NVarChar, JSON.stringify(data));
        request.input('ttl', sql.DateTime, expirationDateTime);
        request.input('tenantID', sql.Int, tenant);

        console.log(postQuery)
        const result = await request.query(postQuery)
        const rowsAffected = result.rowsAffected[0];

        console.log(rowsAffected);


        if (rowsAffected > 0) {
            res.status(200).send({ status: 200, response: 'Inserted successfully' })

        } else {
            res.status(500).send({
                "error": "Data Insertion Failed",
                "message": "An error occurred while inserting the payload data. Please try again later."
            });
        }









    }
    catch (err) {
        // Rollback in case of an error
        console.log(err);


        // Handle unique constraint violation (duplicate key)
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).send({
                "error": "Duplicate Key Error",
                "message": "The key already exists in the database."
            });
        }
        if (transaction) await transaction.rollback();

        console.error('Error during database transaction: ', err);
        return res.status(500).send({ status: 500, message: 'Server error' });
    }
    finally {
        if (pool) {
            await pool.close(); // Close the pool connection in the finally block
        }
    }
}

const deleteApi = async (req, res) => {
    console.log("deleteAPi", config)
    let pool

    try {
        pool = new sql.ConnectionPool(config)
        await pool.connect()
        const transaction = new sql.Transaction(pool)
        await transaction.begin()
        const request = pool.request()

        const keyParam = req.params.key
        console.log(keyParam)

        if (!keyParam || keyParam === undefined) {
            res.status(400).send({ status: 400, response: 'Please specify correct key in path parms to delete' })

        }
        const tenant=req.body.tenantID
        console.log(tenant);
        

        if (!tenant) {
            return res.status(400).send({
                error: "Invalid Input",
                message: "Tenant ID is required."
            });
        }
        const tenantcheck=await tenantCheck(tenant)
        const deleteQuery = `
        UPDATE KeyValue 
        SET is_active = 0 
        WHERE [key] = @keyParam;`; // Ensure it's correctly defined without extra characters

        // Set the input parameter
        request.input('keyParam', sql.VarChar, keyParam);
        console.log(deleteQuery)
        const result = await request.query(deleteQuery)
        const rowsAffected = result.rowsAffected[0];

        console.log(rowsAffected);


        if (rowsAffected > 0) {
            res.status(200).send({ status: 200, response: 'Deleted successfully"' })

        } else {
            res.status(500).send({
                "error": "Data Deletion  Failed",
                "message": "An error occurred while deleting  the  data. Please try again later."
            });
        }



    }
    catch (err) {
        console.log(err)
        await transaction.rollback();
        console.error('Error during database transaction: ', err);
        res.status(500).send({ status: 500, message: 'Server error' });
    }

    finally {
        if (pool) {
            await pool.close()
        }
    }
}

const batchApi = async (req, res) => {
    console.log("postApi ", config);
    let pool;
    let rowsAffectedTotal = 0; // To keep track of total rows inserted
    try {
        pool = new sql.ConnectionPool(config);
        await pool.connect();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
          const payload = req.body.keys; 
        console.log(req.body)
        console.log(payload);
        
      
        const tenant=req.body.tenantID
        console.log(tenant);
        

        if (!tenant) {
            return res.status(400).send({
                error: "Invalid Input",
                message: "Tenant ID is required."
            });
        }
        const tenantcheck=await tenantCheck(tenant)

        const batchSize = 1000;
        for (let i = 0; i < payload.length; i += batchSize) {
            const batch = payload.slice(i, i + batchSize);

            for (const item of batch) {
                const { key, data, ttl } = item;
                if (!key || !data || ttl === undefined) {
                    return res.status(400).send({
                        error: "Missing required field",
                        message: "Each item must include 'key', 'data', and 'ttl'."
                    });
                }

                const expirationDateTime =  moment().add(ttl, 'seconds').toISOString();

                const request = new sql.Request(transaction); 
                const checkQuery = `SELECT COUNT(*) AS count FROM KeyValue WHERE [key] = @key AND tenantID = @tenantID`;
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('key', sql.VarChar, key);
        checkRequest.input('tenantID', sql.Int, tenant);

        const checkResult = await checkRequest.query(checkQuery);
        if (checkResult.recordset[0].count > 0) {
            // Throw an error for duplicate key
            return res.status(409).send({
                error: "Duplicate Key Error",
                message: `The key '${key}' already exists for tenant ID '${tenant}'.`
            });
        }

                const postQuery = ` INSERT INTO KeyValue ([key], data, ttl,tenantID) 
                                VALUES (@key,@data,@ttl,@tenantID)`;
        request.input('key', sql.VarChar, key);
        request.input('data', sql.NVarChar, JSON.stringify(data));
        request.input('ttl', sql.DateTime, expirationDateTime);
        request.input('tenantID', sql.Int, tenant);


                const result = await request.query(postQuery);
                rowsAffectedTotal += result.rowsAffected[0]; 
            }
        }

        await transaction.commit(); 
        
        if (rowsAffectedTotal > 0) {
            return res.status(200).send({ status: 200, response: 'Inserted successfully', totalRecordsInserted: rowsAffectedTotal });
        } else {
            return res.status(500).send({
                error: "Data Insertion Failed",
                message: "An error occurred while inserting the payload data. Please try again later."
            });
        }
    } catch (err) {
        // Rollback in case of an error
        console.log(err);


        // Handle unique constraint violation (duplicate key)
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).send({
                "error": "Duplicate Key Error",
                "message": "The key already exists in the database."
            });
        }
        if (transaction) await transaction.rollback();

        console.error('Error during database transaction: ', err);
        return res.status(500).send({ status: 500, message: 'Server error' });
    }finally {
        if (pool) {
            await pool.close();
        }
    }
};


module.exports = {
    hello, getApi, postApi, deleteApi,batchApi
};
