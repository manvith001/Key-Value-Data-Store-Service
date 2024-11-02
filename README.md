# Key-Value-Data-Store-Service
Key-Value Data Store Service

## Overview

This project is a high-performance, scalable key-value data store service built using Node.js, Express, and Microsoft SQL Server. It supports CRUD operations, batch processing, multi-tenancy, and TTL (Time to Live) functionality.

## Features

- **CRUD Operations**: Perform Create, Read, Update, and Delete operations on key-value pairs.
- **Batch Insertion**: Insert multiple records in a single request (up to 1000 entries).
- **Multi-Tenancy**: Support for multiple tenants with individual data storage.
- **TTL Support**: Set expiration times for key-value pairs.
- **Security**: Ensures data isolation between tenants.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/manvith001/Key-Value-Data-Store-Service.git
   cd Key-Value-Data-Store-Service
Or download as a ZIP and extract it.

2. ## Install Dependencies: Ensure you have Node.js installed. Then, install the necessary packages:
  npm install


3. ## Configure Database Connection: Edit the constants.js file to include your SQL Server credentials:
   const config = {
    user: 'YOUR_SQL_USER',
    password: 'YOUR_SQL_PASSWORD',
    server: 'YOUR_SERVER_NAME',
    database: 'YOUR_DATABASE_NAME',
    options: {
        encrypt: true,
        trustServerCertificate: true,
        instanceName: 'YOUR_INSTANCE_NAME'
    },
    port: 1433
};
Ensure your SQL Server is configured to accept connections and that the credentials are correctly set.
i have used MSSQL

4. ## Run the Application: Start the server with:
  npm start

##  API Endpoints and Payload
1.##  GET /api/object/:key
Fetch a key-value object based on the specified key.

URL: /api/object/:key
Example: http://localhost:3000/api/object/key3

2.## POST /api/object
Create a new key-value pair.

URL: /api/object
Method: POST
Example: http://localhost:3000/api/object
Payload:

{
    "key": "key3",
    "data": {"name": "Doe", "age": 40},
    "ttl": 86400,
    "tenantID": 5
}

3. ## DELETE /api/object/:key
Delete a key-value object based on the specified key.

URL: /api/object/:key
Method: DELETE
Example: http://localhost:3000/api/object/key2
Request Payload:

{
    "tenantID": 123
}

4. ## POST /api/batch/object
Insert multiple key-value pairs in a single request.

URL: /api/batch/object
Method: POST
Request Payload:

{
    "tenantID": 123,
    "keys": [
        {"key": "key1", "data": {"name": "data1"}, "ttl": 3600},
        {"key": "key2", "data": {"name": "data2"}, "ttl": 7200}
    ]
}

