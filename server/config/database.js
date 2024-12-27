const mongoose = require('mongoose');
const connections = {}; // Cache for dynamic database connections


const connectMainDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI );
        console.log('Connected to the main database.');
        return connection;
    } catch (error) {
        console.error('Error connecting to the main database:', error);
        process.exit(1); // Exit if the main database connection fails
    }
};


const connectSubdomainDB = (dbName) => {
    if (!connections[dbName]) {
        const dbURI = `mongodb://localhost:27017/${dbName}`;
        // const dbURI = `${process.env.MONGO_URI}/${dbName}`;
        connections[dbName] = mongoose.createConnection(dbURI);

        connections[dbName].on('connected', () => {
            console.log(`Connected to the subdomain database: ${dbName}`);
        });

        connections[dbName].on('error', (err) => {
            console.error(`Database connection error for ${dbName}:`, err);
        });
    }

    return connections[dbName];
};

module.exports = {
    connectMainDB,
    connectSubdomainDB,
};
