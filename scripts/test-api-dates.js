const axios = require('axios');

async function testApiDates() {
  try {
    console.log('🔍 Probando endpoint de fechas...\n');
    
    // Test the dates endpoint
    const response = await axios.get('http://localhost:3000/api/v1/store-products/test-dates');
    
    console.log('📅 Respuesta del endpoint de fechas:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n✅ Test completado');
  } catch (error) {
    console.error('❌ Error al probar la API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testApiDates();


