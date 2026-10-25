import { NextRequest, NextResponse } from 'next/server';
import { createHash, createHmac } from 'crypto';
import { products, EXCHANGE_RATE } from '../../products';

// Type definitions
interface OrderItem {
  id: number;
  qty: number;
}

interface OrderRequest {
  name: string;
  phone: string;
  city: string;
  address: string;
  country: string;
  paymentMethod: 'cash_on_delivery' | 'kashier';
  items: OrderItem[];
}

// In-memory duplicate detection (replace with Redis/KV in production)
const processedRequests = new Map<string, { timestamp: number; orderId: string; response: any }>();

// Clean up old entries periodically (older than 1 hour)
function cleanupOldRequests() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, value] of processedRequests.entries()) {
    if (value.timestamp < oneHourAgo) {
      processedRequests.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get idempotency key from header
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: 'مفتاح الطلب مفقود' },
        { status: 400 }
      );
    }

    // Check for duplicate request first
    cleanupOldRequests();
    const existing = processedRequests.get(idempotencyKey);
    if (existing) {
      console.log('Duplicate request detected, returning existing order:', existing.orderId);
      return NextResponse.json(existing.response, { status: 200 });
    }

    // Parse request body
    const body: OrderRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.phone || !body.city || !body.address || !body.country) {
      return NextResponse.json(
        { error: 'بيانات الطلب غير مكتملة' },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'الطلب فارغ، أضف منتجات إلى السلة' },
        { status: 400 }
      );
    }

    // Calculate totals
    let totalSarHalalas = 0;
    const itemsWithDetails = body.items.map((item) => {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        throw new Error(`منتج غير موجود: ${item.id}`);
      }
      const itemTotal = product.price * item.qty * 100; // Convert to halalas
      totalSarHalalas += itemTotal;
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: item.qty,
      };
    });

    // Calculate local currency
    const totalLocalCents = Math.round(totalSarHalalas * EXCHANGE_RATE);
    const currency = body.country === 'EG' ? 'EGP' : 'SAR';

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Prepare order data
    const orderData = {
      id: orderId,
      requestKey: idempotencyKey,
      name: body.name,
      phone: body.phone,
      city: body.city,
      address: body.address,
      country: body.country,
      items: itemsWithDetails,
      totalSarHalalas,
      totalLocalCents,
      currency,
      exchangeRate: EXCHANGE_RATE.toString(),
      status: 'new',
      paymentMethod: body.paymentMethod || 'cash_on_delivery',
      createdAt: new Date().toISOString(),
    };

    console.log('Order created:', orderId, 'Payment method:', body.paymentMethod);

    let responsePayload: any = {
      orderId,
      status: 'confirmed',
      order: orderData,
    };

    // Handle Kashier payment
    if (body.paymentMethod === 'kashier') {
      const kashierData = await initializeKashierPayment(orderData);
      
      if (!kashierData.configured) {
        return NextResponse.json(
          { error: kashierData.error || kashierData.message || 'فشل تهيئة الدفع الإلكتروني' },
          { status: 500 }
        );
      }
      
      responsePayload = {
        orderId,
        status: 'pending_payment',
        kashier: kashierData,
        order: orderData,
      };
      
      console.log('Kashier payment initialized with session:', kashierData.sessionUrl);
    }

    // Store in cache for idempotency
    processedRequests.set(idempotencyKey, {
      timestamp: Date.now(),
      orderId,
      response: responsePayload,
    });

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error) {
    console.error('Order processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    );
  }
}

async function initializeKashierPayment(orderData: any) {
  const merchantId = process.env.KASHIER_MERCHANT_ID;
  const apiKey = process.env.KASHIER_API_KEY;
  const secretKey = process.env.KASHIER_SECRET_KEY;
  const mode = process.env.KASHIER_MODE || 'test';
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  console.log('Kashier env check:', {
    merchantId: merchantId ? `${merchantId.substring(0, 10)}...` : 'MISSING',
    apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING',
    secretKey: secretKey ? `${secretKey.substring(0, 10)}...` : 'MISSING',
    mode,
  });

  // Check if credentials are configured
  if (!merchantId || !secretKey || !apiKey || merchantId.includes('YOUR_KASHIER')) {
    console.error('Kashier credentials not configured properly');
    return {
      merchantId: merchantId || 'YOUR_KASHIER_MERCHANT_ID',
      mode: mode,
      configured: false,
      message: 'يرجى تكوين بيانات كاشير في ملف .env',
    };
  }

  // Calculate amount (in local currency)
  const amount = (orderData.totalLocalCents / 100).toFixed(2);

  // Kashier API endpoint for creating payment sessions
  const apiUrl = mode === 'live' 
    ? 'https://api.kashier.io/v3/payment/sessions'
    : 'https://test-api.kashier.io/v3/payment/sessions';

  // Create payment session
  try {
    const sessionPayload = {
      merchantId,
      amount,
      currency: orderData.currency,
      order: orderData.id,
      merchantRedirect: `${appUrl}/?paymentStatus=SUCCESS&orderId=${orderData.id}`,
      failureRedirect: `${appUrl}/?paymentStatus=FAILURE&orderId=${orderData.id}`,
      display: 'ar',
      type: 'one-time',
      allowedMethods: 'card,wallet',
      paymentType: 'credit',
      description: `طلب ${orderData.id}`,
      customer: {
        email: `customer-${orderData.phone}@temp.kashier.local`,
        reference: orderData.phone,
      },
      metaData: {
        customerName: orderData.name,
        phone: orderData.phone,
        city: orderData.city,
      },
    };

    console.log('Creating Kashier session:', sessionPayload);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': secretKey,
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('Kashier session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        headers: {
          authorization: secretKey ? '***' + secretKey.slice(-4) : 'missing',
          apiKey: apiKey ? '***' + apiKey.slice(-4) : 'missing',
        }
      });
      throw new Error(`فشل إنشاء جلسة الدفع: ${errorData.message || response.statusText}`);
    }

    const sessionData = await response.json();
    console.log('Kashier session created:', sessionData);

    return {
      sessionUrl: sessionData.sessionUrl,
      sessionId: sessionData.sessionId,
      merchantId,
      orderId: orderData.id,
      amount,
      currency: orderData.currency,
      mode,
      configured: true,
    };

  } catch (error) {
    console.error('Error creating Kashier session:', error);
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء إنشاء جلسة الدفع',
    };
  }
}
