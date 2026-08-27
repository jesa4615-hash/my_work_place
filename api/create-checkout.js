import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId, buyerId } = req.body;

  try {
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (prodError || !product) throw new Error('Product not found');

    // Create pending order record in Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          buyer_id: buyerId,
          seller_id: product.seller_id,
          product_id: product.id,
          amount: product.price,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // Call PayMongo Checkout API
    const paymongoRes = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { name: 'Buyer' },
            line_items: [
              {
                currency: 'PHP',
                amount: Math.round(product.price * 100), // PayMongo accepts centavo integers
                description: product.description || 'Office Supply Item',
                name: product.title,
                quantity: 1
              }
            ],
            payment_method_types: ['gcash', 'card', 'paymaya'],
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/index.html?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/index.html?payment=cancelled`,
            metadata: {
              order_id: order.id
            }
          }
        }
      })
    });

    const checkoutData = await paymongoRes.json();
    if (!paymongoRes.ok) throw new Error(checkoutData.errors[0]?.detail || 'PayMongo API Error');

    // Update order with checkout session ID
    await supabase
      .from('orders')
      .update({ paymongo_checkout_id: checkoutData.data.id })
      .eq('id', order.id);

    return res.status(200).json({ checkoutUrl: checkoutData.data.attributes.checkout_url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
