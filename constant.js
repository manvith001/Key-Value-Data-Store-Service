const sql = require('mssql');

const config = {
    user: 'sa',             // SQL Server username
    password: 'admin',      // SQL Server password
    server: 'BHOOMI',    // You can change this to your server IP or domain
    database: 'sample', // Replace with your database name
    options: {
        encrypt: true,      // Use true if you're connecting to Azure
        trustServerCertificate: true ,// Use true for self-signed certificates
        instancename:"SQLEXPRESS"    },
        port:1433
};



const tenantCheck = async (tenant) => {
    console.log(tenant)
    console.log("Tenant check", config);
    let pool;
    let transaction;

    try {
        pool = new sql.ConnectionPool(config);
        await pool.connect();
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const request = new sql.Request(transaction);
        
      
        const checkQuery = `select * from Tenants where tenantID= @tenant   `;
        request.input('tenant',  sql.Int, tenant); // Assuming tenantID is of type INT

        const result = await request.query(checkQuery);
        const recordset = result.recordset;

        
        if (recordset.length === 0) {
            const insertQuery = `INSERT INTO Tenants (tenantID, storageLimitMB)
                                 VALUES (@tenant, @storageLimit)`;
          
            request.input('storageLimit', sql.Int, 500); // Assuming limit is in MB

            await request.query(insertQuery);
        }

        // Commit the transaction
        await transaction.commit();

        console.log('Tenant checked/inserted successfully');
    } catch (err) {
        console.log(err);
        
        // Rollback in case of an error
        if (transaction) await transaction.rollback();

        // Handle unique constraint violation (duplicate key)
        if (err.number === 2627 || err.number === 2601) {
            return {
                status: 409,
                error: "Duplicate tenantName Error",
                message: "The tenantName already exists in the database."
            };
        }

        console.error('Error during tenant transaction: ', err);
        return {
            status: 500,
            message: 'Server error'
        };
    } finally {
        if (pool) {
            await pool.close(); // Close the pool connection in the finally block
        }
    }
};


module.exports={
    config,tenantCheck
}