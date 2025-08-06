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

const Match = sequelize.define('Match', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    courtNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    startTime: {
        type: DataTypes.Time,
        allowNull: false
    },
    endTime: {
        type: DataTypes.Time,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('upcoming', 'completed'),
        defaultValue: 'upcoming'
    }
});

const Player = sequelize.define('Player', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paymentStatus: {
        type: DataTypes.ENUM('belum_setor', 'sudah_setor'),
        defaultValue: 'belum_setor'
    },
    playerStatus: {
        type: DataTypes.ENUM('active', 'tentative'),
        defaultValue: 'active'
    },
    matchId: {
        type: DataTypes.INTEGER,
        references: {
            model: Match,
            key: 'id'
        }
    }
});

Match.hasMany(Player, {foreignKey: 'matchId'});
Player.belongsTo(Match, {foreignKet: 'matchId'});

sequelize.sync({force: false});

app.get('/', (req, res) => {
    res.json({message: 'Capybara Dashboard API activated!'});
});

app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
    testConnection();
});

