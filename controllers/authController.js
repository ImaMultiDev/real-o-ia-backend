// real-o-ia-backend/controllers/authController.js
const User = require('../models/User');
const Score = require('../models/Score');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Generar tokens
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// Registrar usuario
exports.register = async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }

  try {
    // Verificar si el email ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Correo ya registrado' });
    }

    // Generar un username por defecto si no se proporciona
    const defaultUsername = `user_${Date.now()}`;

    // Crear el nuevo usuario
    const user = await User.create({
      email,
      password, // Se hasheará mediante el hook beforeCreate en el modelo
      username: username || defaultUsername
    });

    // Crear puntuación inicial asociada al usuario
    await Score.create({
      userId: user.id,
      bestScore: 0,
      attemptsLeft: 5,
      lastAttemptDate: new Date()
    });

    // Generar tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);

    // Manejar errores de restricción única (código de error de PostgreSQL)
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'El username o email ya está registrado' });
    }

    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Renovar token
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token es requerido' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = generateAccessToken(decoded.id);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'El refreshToken ha expirado, inicia sesión nuevamente' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'El refreshToken es inválido' });
    } else {
      console.error("Error al renovar el token:", error);
      return res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
};

// Obtener perfil de usuario
exports.getUserProfile = async (req, res) => {
  try {
    // El usuario ya viene adjunto desde el middleware
    const user = req.user;

    // Encuentra el score asociado al usuario
    const score = await Score.findOne({ where: { userId: user.id } });

    res.json({
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      bestScore: score ? score.bestScore : 0,
      attemptsLeft: score ? score.attemptsLeft : 5,
    });
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};

// Actualizar perfil de usuario
exports.updateUserProfile = async (req, res) => {
  const { email, username, phone, password } = req.body;
  const profileImage = req.files ? req.files.profileImage : null;

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar si el username ya está en uso
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
      }
      user.username = username;
    }

    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = password; // Se hasheará en el hook beforeUpdate

    if (profileImage) {
      // Verificar y eliminar la imagen previa si existe
      if (user.profileImage) {
        const oldImagePath = path.join(__dirname, `../uploads/profiles/${path.basename(user.profileImage)}`);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // Elimina la imagen anterior del servidor
        }
      }
      
      // Guardar la nueva imagen
      const fileExtension = path.extname(profileImage.name).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ message: 'Solo se permiten imágenes JPG, JPEG, PNG y GIF' });
      }

      const filePath = path.join(__dirname, '../uploads/profiles', `${Date.now()}_${profileImage.name}`);
      await profileImage.mv(filePath);

      user.profileImage = `/uploads/profiles/${path.basename(filePath)}`;
    }

    await user.save();

    res.status(200).json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error("Error al actualizar el perfil:", error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
};
