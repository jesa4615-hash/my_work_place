export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, buyerId, successUrl, cancelUrl } = req.body;

  try {
    const lineItems = items.map((item) => ({
      currency: 'PHP',
      amount: Math.round(item.price * 100), // Convert PHP to Centavos
      description: item.description || item.title,
      name: item.title,
      quantity: item.quantity,
    }));

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method_types: ['gcash', 'card', 'paymaya'],
            line_items: lineItems,
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
              buyer_id: buyerId,
            },
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.[0]?.detail || 'PayMongo session creation failed');

    return res.status(200).json({ checkoutUrl: data.data.attributes.checkout_url, checkoutId: data.data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
