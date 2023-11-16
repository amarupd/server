const fs = require('fs-extra');

const path = require('path');

const filePath = path.join(__dirname, 'configuration.json');

const login = async (req, res) => {
    try {
        const { user, password, database, server } = req.body;
        const port = req.body.port ? req.body.port : 1433;

        // Save user configuration to configuration.json
        const config = {
            user,
            password,
            database,
            port,  // Include the port in the config object
            server,
        };

        await fs.writeFile(filePath, JSON.stringify(config, null, 2));
        res.send('Login successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const logout = async (req, res) => {
    try {
        // Delete the config file on logout
        // await fs.unlink('./configuration.json');
        const config = {
            user:"",
            password:"",
            database:"",
            port:"",  // Include the port in the config object
            server:"",
        };

        const check=await fs.writeFile(filePath, JSON.stringify(config, null, 2));
        res.send('Logout successful');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    login,
    logout
};
