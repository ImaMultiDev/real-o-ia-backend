// test-image-api.js - Script para probar la API de imágenes directamente
const axios = require('axios');

// URL de la API de imágenes
const API_URL = 'https://real-o-ia-api-gallery-backend-production.up.railway.app/api/images';

// Función para probar la API de imágenes
async function testImageAPI() {
  console.log('Probando API de imágenes...');
  
  try {
    // Probar endpoint de imágenes aleatorias
    console.log('\nProbando endpoint de imágenes aleatorias:');
    const randomResponse = await axios.get(`${API_URL}?size=1&random=true&nocache=${Date.now()}`);
    if (randomResponse.data.content && randomResponse.data.content.length > 0) {
      console.log('✅ Éxito! Imagen aleatoria obtenida:');
      console.log('ID:', randomResponse.data.content[0].id);
      console.log('URL:', randomResponse.data.content[0].url);
      console.log('Es Real:', randomResponse.data.content[0].real);
    } else {
      console.log('❌ Error: No se obtuvo ninguna imagen aleatoria');
      console.log('Respuesta:', JSON.stringify(randomResponse.data, null, 2));
    }
    
    // Probar endpoint de imágenes reales
    console.log('\nProbando endpoint de imágenes reales:');
    const realResponse = await axios.get(`${API_URL}?real=true&size=1&random=true&nocache=${Date.now()}`);
    if (realResponse.data.content && realResponse.data.content.length > 0) {
      console.log('✅ Éxito! Imagen real obtenida:');
      console.log('ID:', realResponse.data.content[0].id);
      console.log('URL:', realResponse.data.content[0].url);
      console.log('Es Real:', realResponse.data.content[0].real);
    } else {
      console.log('❌ Error: No se obtuvo ninguna imagen real');
      console.log('Respuesta:', JSON.stringify(realResponse.data, null, 2));
    }
    
    // Probar endpoint de imágenes de IA
    console.log('\nProbando endpoint de imágenes de IA:');
    const aiResponse = await axios.get(`${API_URL}?real=false&size=1&random=true&nocache=${Date.now()}`);
    if (aiResponse.data.content && aiResponse.data.content.length > 0) {
      console.log('✅ Éxito! Imagen de IA obtenida:');
      console.log('ID:', aiResponse.data.content[0].id);
      console.log('URL:', aiResponse.data.content[0].url);
      console.log('Es Real:', aiResponse.data.content[0].real);
    } else {
      console.log('❌ Error: No se obtuvo ninguna imagen de IA');
      console.log('Respuesta:', JSON.stringify(aiResponse.data, null, 2));
    }
    
    // Verificar si las URLs devueltas son accesibles
    console.log('\nVerificando accesibilidad de las URLs de imágenes:');
    if (randomResponse.data.content && randomResponse.data.content.length > 0) {
      const imageUrl = randomResponse.data.content[0].url;
      try {
        const imageCheck = await axios.head(imageUrl);
        console.log(`✅ URL de imagen accesible: ${imageUrl}`);
      } catch (error) {
        console.log(`❌ Error al acceder a la URL de imagen: ${imageUrl}`);
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Error al conectar con la API:');
    console.log('Mensaje:', error.message);
    if (error.response) {
      console.log('Datos del error:', error.response.data);
      console.log('Estado HTTP:', error.response.status);
    }
  }
}

// Ejecutar la prueba
testImageAPI();