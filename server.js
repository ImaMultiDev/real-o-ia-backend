// real-o-ia-backend/server.js
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const path = require('path');
const fileUpload = require('express-fileupload');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS
app.use(cors({
  origin: '*', // Permitir todos los orígenes en desarrollo
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Configuración para subida de archivos
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB max-file-size
  },
}));

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conectar a la base de datos PostgreSQL
connectDB();

// Rutas de la API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/scores', require('./routes/scoreRoutes'));
app.use('/api/images', require('./routes/imageRoutes'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
