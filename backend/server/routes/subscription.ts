import express, { Request, Response } from 'express';
import { Subscription } from '../models/Subscription';
import { Loyalty } from '../models/Loyalty';

const router = express.Router();

// Define subscription plans
const SUBSCRIPTION_PLANS = [
  {
    name: 'basic',
    monthlyFee: 0,
    benefits: ['Access to platform'],
    freeDeliveries: 0,
    discountPercentage: 0,
    bonusPoints: 0
  },
  {
    name: 'premium',
    monthlyFee: 99,
    benefits: [
      '10 free deliveries',
      '5% discount on orders',
      'Priority support',
      '500 bonus points'
    ],
    freeDeliveries: 10,
    discountPercentage: 5,
    bonusPoints: 500
  },
  {
    name: 'elite',
    monthlyFee: 299,
    benefits: [
      'Unlimited free deliveries',
      '15% discount on orders',
      'Premium support',
      '2000 bonus points',
      'Exclusive offers'
    ],
    freeDeliveries: 999,
    discountPercentage: 15,
    bonusPoints: 2000
  }
];

// Get available subscription plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    res.json(SUBSCRIPTION_PLANS);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// Get user subscription
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const subscription = await Subscription.findOne({
      userId,
      isActive: true
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Subscribe to a plan
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { userId, plan, paymentMethodId } = req.body;

    // Cancel existing subscription
    await Subscription.updateMany(
      { userId, isActive: true },
      { isActive: false, cancelledAt: new Date() }
    );

    // Get plan details
    const planDetails = SUBSCRIPTION_PLANS.find(p => p.name === plan);
    if (!planDetails) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = new Subscription({
      userId,
      plan,
      monthlyFee: planDetails.monthlyFee,
      benefits: planDetails.benefits,
      freeDeliveries: planDetails.freeDeliveries,
      discountPercentage: planDetails.discountPercentage,
      startDate,
      endDate,
      autoRenew: true,
      isActive: true
    });

    await subscription.save();

    // Award bonus points
    if (planDetails.bonusPoints > 0) {
      const loyalty = await Loyalty.findOne({ userId });
      if (loyalty) {
        loyalty.transactionHistory.push({
          type: 'bonus',
          points: planDetails.bonusPoints,
          source: 'admin',
          description: `Subscription bonus for ${plan} plan`
        });
        loyalty.availableBalance += planDetails.bonusPoints;
        loyalty.totalPoints += planDetails.bonusPoints;
        await loyalty.save();
      }
    }

    res.json({
      subscriptionId: subscription._id,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      message: `Successfully subscribed to ${plan} plan!`
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Upgrade subscription
router.post('/upgrade', async (req: Request, res: Response) => {
  try {
    const { userId, newPlan } = req.body;

    const currentSubscription = await Subscription.findOne({ userId, isActive: true });
    if (!currentSubscription) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const currentPlanDetails = SUBSCRIPTION_PLANS.find(p => p.name === currentSubscription.plan);
    const newPlanDetails = SUBSCRIPTION_PLANS.find(p => p.name === newPlan);

    if (!newPlanDetails || !currentPlanDetails) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Calculate prorated amount
    const daysRemaining = Math.ceil(
      (new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyRate = currentPlanDetails.monthlyFee / 30;
    const creditAmount = dailyRate * daysRemaining;
    const proratedAmount = Math.max(0, newPlanDetails.monthlyFee - creditAmount);

    // Update subscription
    currentSubscription.plan = newPlan;
    currentSubscription.monthlyFee = newPlanDetails.monthlyFee;
    currentSubscription.benefits = newPlanDetails.benefits;
    currentSubscription.freeDeliveries = newPlanDetails.freeDeliveries;
    currentSubscription.discountPercentage = newPlanDetails.discountPercentage;

    await currentSubscription.save();

    res.json({
      newPlan,
      proratedAmount,
      newEndDate: currentSubscription.endDate,
      message: 'Subscription upgraded successfully'
    });
  } catch (error) {
    console.error('Error upgrading:', error);
    res.status(500).json({ error: 'Failed to upgrade' });
  }
});

// Downgrade subscription
router.post('/downgrade', async (req: Request, res: Response) => {
  try {
    const { userId, newPlan } = req.body;

    const currentSubscription = await Subscription.findOne({ userId, isActive: true });
    if (!currentSubscription) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const daysRemaining = Math.ceil(
      (new Date(currentSubscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyRate = currentSubscription.monthlyFee / 30;
    const refundAmount = dailyRate * daysRemaining;

    currentSubscription.plan = newPlan;
    currentSubscription.freeDeliveriesUsed = 0;
    await currentSubscription.save();

    res.json({
      newPlan,
      refundAmount,
      effectiveDate: new Date(),
      message: 'Subscription downgraded'
    });
  } catch (error) {
    console.error('Error downgrading:', error);
    res.status(500).json({ error: 'Failed to downgrade' });
  }
});

// Cancel subscription
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { userId, cancellationReason } = req.body;

    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (!subscription) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    subscription.isActive = false;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = cancellationReason;
    await subscription.save();

    res.json({
      cancelledAt: subscription.cancelledAt,
      message: 'Subscription cancelled'
    });
  } catch (error) {
    console.error('Error cancelling:', error);
    res.status(500).json({ error: 'Failed to cancel' });
  }
});

// Use free delivery
router.post('/use-free-delivery', async (req: Request, res: Response) => {
  try {
    const { userId, orderId } = req.body;

    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (!subscription || subscription.freeDeliveriesUsed >= subscription.freeDeliveries) {
      return res.status(400).json({ error: 'No free deliveries available' });
    }

    subscription.freeDeliveriesUsed += 1;
    await subscription.save();

    res.json({
      used: true,
      remainingFreeDeliveries: subscription.freeDeliveries - subscription.freeDeliveriesUsed
    });
  } catch (error) {
    console.error('Error using free delivery:', error);
    res.status(500).json({ error: 'Failed to use free delivery' });
  }
});

// Renew subscription
router.post('/renew', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (!subscription) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    const renewDate = new Date();
    const nextBillingDate = new Date(renewDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    subscription.startDate = renewDate;
    subscription.endDate = nextBillingDate;
    subscription.freeDeliveriesUsed = 0;
    await subscription.save();

    res.json({
      renewedAt: subscription.startDate,
      nextBillingDate: subscription.endDate
    });
  } catch (error) {
    console.error('Error renewing:', error);
    res.status(500).json({ error: 'Failed to renew' });
  }
});

// Get subscription benefits
router.get('/benefits/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const subscription = await Subscription.findOne({ userId, isActive: true });

    if (!subscription) {
      return res.json({
        plan: 'basic',
        benefits: ['Access to platform'],
        redeemableUntil: null
      });
    }

    res.json({
      plan: subscription.plan,
      benefits: subscription.benefits,
      redeemableUntil: subscription.endDate
    });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    res.status(500).json({ error: 'Failed to fetch benefits' });
  }
});

// Apply subscription discount
router.post('/apply-discount', async (req: Request, res: Response) => {
  try {
    const { userId, orderAmount } = req.body;

    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (!subscription) {
      return res.json({
        discount: 0,
        finalAmount: orderAmount,
        discountType: 'none'
      });
    }

    const discount = (orderAmount * subscription.discountPercentage) / 100;

    res.json({
      discount,
      finalAmount: orderAmount - discount,
      discountType: `${subscription.discountPercentage}% subscription discount`
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

export default router;
