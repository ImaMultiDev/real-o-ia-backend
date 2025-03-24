const express = require('express');
const router = express.Router();
const { getRandomImage } = require('../controllers/imageController'); // 🔥 Solo importamos `getRandomImage`

// Ruta para obtener una imagen aleatoria
router.get('/random', getRandomImage); // ✅ Solo dejamos la función que SÍ existe

module.exports = router;
