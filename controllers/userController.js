const bcrypt = require('bcrypt');
const User = require('../models/User');
const Score = require('../models/Score');
const { Op } = require('sequelize');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let score = await Score.findOne({ where: { userId: req.user.id } });
    if (!score) {
      score = await Score.create({ 
        userId: req.user.id,
        bestScore: 0,
        attemptsLeft: 5,
        lastAttemptDate: new Date()
      });
    }

    res.json({
      email: user.email,
      username: user.username,
      phone: user.phone,
      bestScore: score.bestScore,
      attemptsLeft: score.attemptsLeft,
    });
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.updateUserProfile = async (req, res) => {
  const { email, password, username, phone } = req.body;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        where: { 
          username,
          id: { [Op.ne]: req.user.id }
        } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
      }
      user.username = username;
    }

    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = password;

    await user.save();
    res.status(200).json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar el perfil del usuario:", error);
    res.status(500).json({ message: 'Error al actualizar el perfil del usuario' });
  }
};
