const Score = require('../models/Score');
const User = require('../models/User');
const { Op } = require('sequelize');

// Obtener la puntuación del usuario y el tiempo restante para recargar vidas
exports.getMyScore = async (req, res) => {
  try {
    let score = await Score.findOne({ where: { userId: req.user.id } });

    if (!score) {
      score = await Score.create({
        userId: req.user.id,
        bestScore: 0,
        attemptsLeft: 5,
        lastAttemptDate: new Date(),
      });
      console.log(`Nueva puntuación creada para usuario ${req.user.id}`);
    }

    // Verificar y actualizar vidas si es un nuevo día
    await checkAndResetAttempts(score);

    const currentDate = new Date();
    const lastAttemptDate = new Date(score.lastAttemptDate);
    const nextResetDate = new Date(lastAttemptDate);
    nextResetDate.setDate(nextResetDate.getDate() + 1);
    const timeRemaining = nextResetDate > currentDate ? nextResetDate - currentDate : 0;

    res.json({
      bestScore: score.bestScore,
      attemptsLeft: score.attemptsLeft,
      timeRemaining,
    });
  } catch (error) {
    console.error("Error al obtener la puntuación del usuario:", error);
    res.status(500).json({ message: 'Error al obtener la puntuación' });
  }
};

// Función auxiliar para verificar y resetear intentos
async function checkAndResetAttempts(score) {
  const currentDate = new Date();
  const lastAttemptDate = new Date(score.lastAttemptDate);
  
  const isNewDay = currentDate.toDateString() !== lastAttemptDate.toDateString();
  if (isNewDay && score.attemptsLeft < 5) {
    score.attemptsLeft = 5;
    score.lastAttemptDate = currentDate;
    await score.save();
    console.log(`Intentos restablecidos para usuario ${score.userId} (nuevo día)`);
  }
}

// Actualizar la puntuación del usuario al finalizar una partida

exports.updateScore = async (req, res) => {
  const { points, hasFailed } = req.body;

  try {
    let score = await Score.findOne({ where: { userId: req.user.id } });

    // Verificar y resetear intentos si es nuevo día
    await checkAndResetAttempts(score);

    if (score.attemptsLeft <= 0) {
      return res.status(403).json({ message: 'No tienes intentos restantes' });
    }

    if (hasFailed) {
      score.attemptsLeft -= 1;
      console.log(`Usuario ${req.user.id} falló. Vidas restantes: ${score.attemptsLeft}`);
    } else {
      // Solo actualiza el puntaje si es mayor al actual
      if (points > score.bestScore) {
        score.bestScore = points;
        // Actualizar también en el modelo User si es necesario
      }
    }

    await score.save();

    res.status(200).json({
      bestScore: score.bestScore,
      attemptsLeft: score.attemptsLeft,
      message: hasFailed ? 'Has perdido una vida' : '¡Correcto! Puntos actualizados'
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: 'Error al actualizar puntuación' });
  }
};

// Obtener la clasificación global de las mejores puntuaciones
exports.getLeaderboard = async (req, res) => {
  try {
    console.log('Solicitando leaderboard...');

    const topScores = await Score.findAll({
      attributes: ['id', 'bestScore', 'userId'],
      include: [{
        model: User,
        attributes: ['email', 'username']
      }],
      where: {
        bestScore: {
          [Op.gt]: 0
        }
      },
      order: [['bestScore', 'DESC']],
      limit: 100
    });

    console.log(`Leaderboard: ${topScores.length} resultados encontrados`);
    res.json(topScores);
  } catch (error) {
    console.error("Error al obtener la clasificación global:", error);
    res.status(500).json({ message: 'Error al obtener la clasificación' });
  }
};

// Endpoint para resetear los intentos diarios (solo para pruebas)
exports.resetAttempts = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    let score = await Score.findOne({ where: { userId: req.user.id } });
    if (!score) {
      return res.status(404).json({ message: 'No se encontró ninguna puntuación para este usuario' });
    }

    score.attemptsLeft = 5;
    await score.save();

    res.json({
      message: 'Intentos restablecidos con éxito',
      attemptsLeft: score.attemptsLeft
    });
  } catch (error) {
    console.error("Error al resetear los intentos:", error);
    res.status(500).json({ message: 'Error al resetear los intentos' });
  }
};
