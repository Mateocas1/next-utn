// Configuración del request
const RAILWAY_URL = 'https://next-utn-production.up.railway.app';
const ENDPOINT = '/api/users/register';
const PAYLOAD = {
  email: 'test.user@example.com',
  password: 'SecurePassword123!',
  name: 'Test User',
};

// Función para probar el endpoint
async function testRegister() {
  console.log('🚀 Script de prueba ejecutándose...');
  try {
    console.log('🚀 Probando el endpoint de register en Railway...');
    console.log('📌 URL:', `${RAILWAY_URL}${ENDPOINT}`);
    console.log('📌 Payload:', JSON.stringify(PAYLOAD));

    const response = await fetch(`${RAILWAY_URL}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(PAYLOAD),
    });

    const responseData = await response.json();
    console.log('✅ Success:', response.status, responseData);
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

// Ejecutar la prueba
testRegister().catch((error) => {
  console.error('❌ Error en la ejecución:', error);
});