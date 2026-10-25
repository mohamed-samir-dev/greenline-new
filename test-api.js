// Test the orders API
const testAPI = async () => {
  const orderData = {
    name: 'محمد أحمد',
    phone: '01234567890',
    city: 'القاهرة',
    address: 'شارع التحرير',
    country: 'EG',
    paymentMethod: 'kashier',
    items: [{ id: 1, qty: 1 }]
  };

  try {
    console.log('Sending order...');
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'test-' + Date.now()
      },
      body: JSON.stringify(orderData)
    });

    console.log('Status:', response.status);
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    try {
      const result = JSON.parse(text);
      console.log('\n=== Parsed Response ===');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testAPI();
