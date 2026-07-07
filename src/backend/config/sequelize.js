require('dotenv').config();
const { Sequelize } = require('sequelize');

const NODE_ENV = process.env.NODE_ENV || 'development';
const dbConfig = require('./database')[NODE_ENV];

const sequelize = new Sequelize(dbConfig.url, {
  dialect: dbConfig.dialect || 'postgres',
  logging: dbConfig.logging !== undefined ? dbConfig.logging : false,
  pool: dbConfig.pool,
  dialectOptions: dbConfig.dialectOptions || {},
});

module.exports = sequelize;
