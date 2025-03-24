// real-o-ia-backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, refreshToken } = require('../controllers/authController');

// Ruta para registrar un nuevo usuario
router.post('/register', register); // Aquí usamos la función `register` correctamente

// Ruta para iniciar sesión
router.post('/login', login); // Aquí usamos la función `login` correctamente

// Ruta para renovar el token
router.post('/refresh', refreshToken); // Aquí usamos la función `refreshToken` correctamente

module.exports = router;
