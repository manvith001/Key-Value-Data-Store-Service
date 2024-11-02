const sql = require('mssql');

// Db creds 
const config = {
    user: 'sa',             
    password: 'admin',      
    server: 'BHOOMI',    
    database: 'sample', 
    options: {
        encrypt: true,      
        trustServerCertificate: true ,
        instancename:"SQLEXPRESS"    },
        port:1433
};


// a function to check the tenant id 
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
        request.input('tenant',  sql.Int, tenant); 

        const result = await request.query(checkQuery);
        const recordset = result.recordset;

        
        if (recordset.length === 0) {
            const insertQuery = `INSERT INTO Tenants (tenantID, storageLimitMB)
                                 VALUES (@tenant, @storageLimit)`;
          
            request.input('storageLimit', sql.Int, 500); 
            await request.query(insertQuery);
        }

        
        await transaction.commit();

        console.log('Tenant checked/inserted successfully');
    } catch (err) {
        console.log(err);
        
     
        if (transaction) await transaction.rollback();

       
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
            await pool.close();
        }
    }
};


module.exports={
    config,tenantCheck
}