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

app.get('/api/matches', async (req, res) => {
    try {
        const matches = await Match.findAll({
            include: [Player],
            order: [['date', 'ASC'], ['startTime', 'ASC']]
        });
        res.json(matches);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});


app.post('/api/matches', async (req, res) => {
    try {
        const match = await Match.create(req.body);
        res.status(201).json(match);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

app.get('/api/matches/:id', async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id, {
            include: [Player]
        });
        if (!match) {
            return res.status(404).json({error: 'Match not found.'});
        }
        res.json(match);
    } catch (error) {
      res.status(500).json({error: error.message});
    }
});

app.put('/api/matches/:id', async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id);
        if(!match) {
            return res.status(404).json({error: 'Match not found.'});
        }
        await match.update(req.body);
        res.json(match);
    } catch (error) {
      res.status(400).json({error: error.message});
    }
});

app.delete('/api/matches/:id', async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id);
        if (!match) {
            return res.status(404).json({error: 'Match not found.'});
        }
        await match.destroy();
        res.json({message: 'Match deleted successfully.'});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

app.get('/api/players', async (req, res) => {
    try {
        const players = await Player.findAll({
            include: [Match]
        });
        res.json(players);
    } catch (error) {
      res.status(500).json({error: error.message});
    }
});

app.post('/api/players', async (req, res) => {
    try {
        const players = await Player.create(req.body);
        res.status(201).json(player);
    } catch (error) {
      res.status(400).json({error: error.message});
    }
});

app.put('/api/players/:id', async (req, res) => {
    try {
        const player = await Player.findByPk(req.params.id);
        if (!player) {
            return res.status(404).json({error: 'Player not found.'});
        }
        await player.update(req.body);
        res.json(player);
    } catch (error) {
      res.status(400).json({error: error.message});
    }
});

app.delete('/api/players/:id', async (req, res) => {
    try {
        const player = await Player.findByPk(req.params.id);
        if (!player) {
            return res.status(404).json({error: 'Player not found.'});
        }
        await player.destroy();
        res.json({message: 'Player deleted.'});
    } catch (error) {
      res.status(500).json({error: error.message});
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const totalMatches = await Match.count();
        const upcomingMatches = await Match.count({
        where: {
            status: 'upcoming'
        }
    });
        const completedMatches = await Match.count({
            where: {status: 'completed'}
    });

        const completedMatchesWithTime = await Match.findAll({
            where: {
                status: 'completed'
            },
            attribute: [
                'startTime', 'endTime'
            ]
        });

        let totalHours = 0;
        completedMatchesWithTime.forEach(match => {
            const start = new Date(`1970-01-01T${match.startTime}`);
            const end = new Date(`1970-01-01T${match.endTime}`);
            const hours = (end - start) / (1000 * 60 * 60);
            totalHours += hours;
        });

        res.json({
            totalMatches,
            upcomingMatches,
            completedMatches,
            hoursPlayed: totalHours.toFixed(1)
        });
    } catch (error) {
      res.status(500).json({error: error.message});
    }
});

app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
    testConnection();
});

