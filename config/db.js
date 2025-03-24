// real-o-ia-backend/config/db.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración para desarrollo local
const localConfig = {
  host: 'localhost',
  port: 5433,
  database: 'real-ia',
  username: 'postgres',
  password: '0077777',
  dialect: 'postgres',
};

// Configuración para producción (Railway)
const prodConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.POSTGRES_PASSWORD,
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Usar configuración de producción si hay variables de entorno disponibles
const config = process.env.PGHOST ? prodConfig : localConfig;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  dialectOptions: config.dialectOptions,
  pool: config.pool,
  logging: false, // Desactivar logging en producción
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a PostgreSQL establecida correctamente');
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados con la base de datos');
  } catch (error) {
    console.error('Error al conectar con PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB
};
