// ─────────────────────────────────────────────────────────────────────
// DROP-IN replacement for handleCheckout in App.tsx
//
// Add this import at the top of App.tsx (if not already there):
//   import { paymentService } from './services/paymentService';
// ─────────────────────────────────────────────────────────────────────

const handleCheckout = async (paymentMethod: string, address: string) => {
  if (!currentUser) {
    setCurrentView('login');
    setIsCartOpen(false);
    return;
  }

  // Capture live GPS
  let finalCoords = userCoords;
  try {
    const live = await gpsLocationService.getCurrentLocation();
    finalCoords = { latitude: live.latitude, longitude: live.longitude, lat: live.latitude, lng: live.longitude };
  } catch {
    console.warn('GPS unavailable, using last known coords');
  }

  const subtotal    = cartItems.reduce((a, b) => a + b.item.price * b.qty, 0);
  const platformFee = 15;
  const gst         = Math.round(subtotal * 0.05);
  const deliveryFee = 25;
  const total       = subtotal + platformFee + gst + deliveryFee;

  const orderPayload = {
    restaurant: cartItems[0]?.restaurant?._id,
    items: cartItems.map(i => ({
      food:     i.item._id,
      quantity: i.qty,
      specialInstructions: i.item.specialInstructions || '',
    })),
    deliveryAddress: {
      street: address,
      city:   currentCity || 'Ahmedabad',
      state:  'Gujarat',
      zipCode: '',
      coordinates: { latitude: finalCoords.latitude, longitude: finalCoords.longitude },
    },
    paymentMethod: paymentMethod === 'cod' ? 'cash_on_delivery' : 'online',
    totalAmount:   total,
    deliveryFee,
    taxAmount:     gst,
  };

  // ── Helper: clear cart and go to success screen ─────────
  const onOrderSuccess = (orderNumber: string) => {
    setCartItems([]);
    db.setCart([]);
    setIsCartOpen(false);
    setLastOrderId(orderNumber);
    setLastOrderTotal(total);
    setCurrentView('order_complete');
  };

  try {
    // Step 1 — Save order to our DB
    const result       = await orderService.createOrder(orderPayload);
    const createdId    = result?.order?._id    || result?._id;
    const orderNumber  = result?.order?.orderNumber || result?.orderNumber || createdId;

    if (!createdId) throw new Error('Server did not return an order ID.');

    // ── Cash on Delivery ────────────────────────────────────
    if (paymentMethod === 'cod') {
      await paymentService.confirmCOD(createdId);
      onOrderSuccess(orderNumber);
      return;
    }

    // ── Online Payment via Razorpay ─────────────────────────
    await paymentService.openRazorpayCheckout({
      orderId:       createdId,
      customerName:  currentUser.name  || 'Customer',
      customerEmail: currentUser.email || '',
      customerPhone: (currentUser as any).phone || '',
      onSuccess: () => onOrderSuccess(orderNumber),
      onFailure: (msg) => {
        if (msg !== 'Payment cancelled.') {
          alert(`⚠️ Payment issue: ${msg}\n\nYour order is saved — retry from Order History.`);
        }
        setIsCartOpen(false);
        setCurrentView('history');
      },
    });

  } catch (err: any) {
    console.error('Checkout error:', err);
    alert(`Checkout failed: ${err?.response?.data?.message || err?.message || 'Please try again.'}`);
  }
};