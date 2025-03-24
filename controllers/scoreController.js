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
  const { points, hasFailed } = req.body; // Cambiado decrementAttempts por hasFailed para mayor claridad

  if (points === undefined || points === null) {
    return res.status(400).json({ message: 'Se requiere el campo "points" para actualizar la puntuación' });
  }

  try {
    console.log(`Actualizando puntuación para usuario ${req.user.id}. Puntos: ${points}, ¿Falló?: ${hasFailed}`);

    let score = await Score.findOne({ where: { userId: req.user.id } });

    if (!score) {
      score = await Score.create({
        userId: req.user.id,
        bestScore: points > 0 ? points : 0,
        attemptsLeft: 5,
        lastAttemptDate: new Date(),
      });
      console.log(`Nueva puntuación creada para usuario ${req.user.id} con valor inicial ${points}`);
      return res.status(200).json({
        bestScore: score.bestScore,
        attemptsLeft: score.attemptsLeft,
        message: 'Puntuación inicial creada'
      });
    }

    // Verificar y actualizar vidas si es un nuevo día
    await checkAndResetAttempts(score);

    if (score.attemptsLeft <= 0) {
      return res.status(403).json({
        message: 'No tienes intentos restantes. Vuelve mañana para jugar nuevamente.',
        bestScore: score.bestScore,
        attemptsLeft: score.attemptsLeft
      });
    }

    // Lógica del juego:
    if (hasFailed) {
      // El usuario falló: restar una vida
      score.attemptsLeft -= 1;
      console.log(`Usuario ${req.user.id} falló. Intentos restantes: ${score.attemptsLeft}`);
    } else {
      // El usuario acertó: actualizar puntuación si es mayor
      if (points > score.bestScore) {
        console.log(`Nuevo record para usuario ${req.user.id}: ${points} (anterior: ${score.bestScore})`);
        score.bestScore = points;

        try {
          const user = await User.findByPk(req.user.id);
          if (user) {
            user.top = points;
            await user.save();
            console.log(`Campo 'top' actualizado en User para ${req.user.id}: ${points}`);
          }
        } catch (err) {
          console.error("Error al actualizar campo 'top' en User:", err);
        }
      }
    }

    score.lastAttemptDate = new Date();
    await score.save();

    res.status(200).json({
      bestScore: score.bestScore,
      attemptsLeft: score.attemptsLeft,
      message: hasFailed ? 
        `¡Fallaste! Pierdes una vida. Te quedan ${score.attemptsLeft} intentos.` : 
        (points > score.bestScore ? '¡Nuevo récord!' : '¡Correcto! +10 puntos')
    });
  } catch (error) {
    console.error("Error al actualizar la puntuación del usuario:", error);
    res.status(500).json({ message: 'Error al actualizar la puntuación' });
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
