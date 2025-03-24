// real-o-ia-backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/authController');
const protect = require('../middlewares/authMiddleware');

router.get('/profile', protect, getUserProfile); // Ruta protegida para obtener perfil
router.put('/profile', protect, updateUserProfile); // Ruta protegida para actualizar perfil

module.exports = router;
