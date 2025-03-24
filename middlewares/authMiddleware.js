const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado, falta el token o formato incorrecto" });
  }

  const token = authHeader.split(" ")[1];
  console.log("Token recibido:", token);

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
    // Verificar si el usuario existe en la base de datos
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
  
    req.user = user; // Adjuntar el usuario al request
    next(); // Continuar con la siguiente función
  } catch (error) {
    console.error("Error en el middleware de autenticación:", error);
  
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado" });
    }
  
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Token malformado" });
    }
  
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = protect;
