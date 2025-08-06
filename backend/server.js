const express = require('express');
const cors = require('cors');
const {Sequelize, DataTypes} = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/capybara-dashboard', {
    dialect: 'postgres',
    logging: false
});

async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
    } catch (error) {
        console.error('Database connection failed.', error);
    }
}

app.get('/', (req, res) => {
    res.json({message: 'Capybara Dashboard API activated!'});
});

app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
    testConnection();
});

