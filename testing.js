const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'amar',
  server: 'AMAR\\AMARDUTT', // Use the IP address of your local server
// server:"192.168.1.42",
  database: 'Icsoft',
  port: 1433, // Use the port you configured in SQL Server
  options: {
    trustedConnection: true,
    encrypt:false,
    trustServerCertificate: true,
  },
};

async function connectDB() {
  try {
    await sql.connect(config);
    console.log('Connected to the local database');

    // Perform database operations here

    await sql.close();
    console.log('Connection closed');
  } catch (err) {
    console.error('Error connecting to the local database:', err);
  }
}

connectDB();

// "build": "pkg . --target node18-win-x64",    "msnodesqlv8": "^4.1.0",
    // "bcrypt": "^5.1.1",

