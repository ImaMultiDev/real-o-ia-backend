// real-o-ia-backend/routes/scoreRoutes.js
const express = require('express');
const { 
  getMyScore, 
  updateScore, 
  getLeaderboard,
  resetAttempts 
} = require('../controllers/scoreController');
const protect = require('../middlewares/authMiddleware');

const router = express.Router();

// Ruta para obtener la puntuación del usuario
router.get('/my-score', protect, getMyScore);

// Ruta para actualizar la puntuación del usuario
router.post('/update', protect, updateScore);

// Ruta para obtener la clasificación global (sin protección, visible para todos)
router.get('/leaderboard', getLeaderboard);

// Ruta para resetear intentos del usuario
router.post('/reset-attempts', protect, resetAttempts);

module.exports = router;
