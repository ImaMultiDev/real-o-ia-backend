// real-o-ia-backend/scripts/init-db.js
const { sequelize } = require('../config/db');
const User = require('../models/User');
const Score = require('../models/Score');

async function initDatabase() {
  try {
    console.log('Iniciando sincronización de la base de datos...');
    
    // Sincronizar los modelos con la base de datos (crea las tablas si no existen)
    await sequelize.sync({ alter: true });
    console.log('Modelos sincronizados correctamente');

    // Verificar si existen usuarios
    const userCount = await User.count();
    console.log(`Usuarios existentes: ${userCount}`);

    if (userCount === 0) {
      console.log('Creando usuario de prueba...');
      // Crear un usuario de prueba
      const testUser = await User.create({
        email: 'test@example.com',
        password: 'Test1234',  // Se hará hash automáticamente mediante el hook
        username: 'test_user',
      });

      // Crear un registro de puntuación para el usuario de prueba
      await Score.create({
        userId: testUser.id,
        bestScore: 100,
        attemptsLeft: 5,
        lastAttemptDate: new Date()
      });

      console.log('Usuario de prueba creado correctamente');
    }

    console.log('Inicialización de la base de datos completada con éxito');
  } catch (error) {
    console.error('Error durante la inicialización de la base de datos:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
}

// Ejecutar la función de inicialización
initDatabase();