const axios = require('axios');

const GALLERY_API_BASE_URL = "https://real-o-ia-api-gallery-backend-production.up.railway.app/api/images";

/**
 * Obtiene una imagen aleatoria (real o IA)
 */
exports.getRandomImage = async (req, res) => {
  try {
    const { real } = req.query; // El frontend puede enviar ?real=true o ?real=false
    console.log(`Solicitando imagen aleatoria - Real: ${real}`);

    // Construcción de la URL de la API de imágenes
    const url = real !== undefined ? `${GALLERY_API_BASE_URL}/list?real=${real}` : `${GALLERY_API_BASE_URL}/list`;

    // Llamamos a la API de imágenes
    const response = await axios.get(url, { timeout: 15000 });

    if (response.data.length > 0) {
      const randomIndex = Math.floor(Math.random() * response.data.length);
      const image = response.data[randomIndex];

      console.log(`✅ Imagen obtenida: ID ${image.id}, URL: ${image.url}`);
      return res.json({
        id: image.id,
        url: image.url,
        real: image.real
      });
    } else {
      console.error('No se encontraron imágenes en la API');
      return res.status(404).json({ message: 'No se encontraron imágenes disponibles' });
    }
  } catch (error) {
    console.error('Error al obtener imagen:', error.message);
    res.status(500).json({ 
      message: 'Error en el servidor al obtener la imagen',
      error: error.message
    });
  }
};