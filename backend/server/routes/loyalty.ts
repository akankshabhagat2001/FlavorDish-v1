import express, { Request, Response } from 'express';
import { Loyalty } from '../models/Loyalty';
import { LoyaltyTier } from '../models/LoyaltyTier';
import Order from '../models/Order';
import User from '../models/User';

const router = express.Router();

// Get user loyalty profile
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let loyalty = await Loyalty.findOne({ userId }).populate('transactionHistory');

    if (!loyalty) {
      // Create new loyalty profile for user
      loyalty = new Loyalty({ userId, tier: 'silver' });
      await loyalty.save();
    }

    res.json(loyalty);
  } catch (error) {
    console.error('Error fetching loyalty profile:', error);
    res.status(500).json({ error: 'Failed to fetch loyalty profile' });
  }
});

// Earn points on order
router.post('/earn-points', async (req: Request, res: Response) => {
  try {
    const { userId, points, source, referenceId, description } = req.body;

    let loyalty = await Loyalty.findOne({ userId });
    if (!loyalty) {
      loyalty = new Loyalty({ userId });
    }

    // Add transaction
    loyalty.transactionHistory.push({
      type: 'earned',
      points,
      source,
      referenceId,
      description
    });

    // Update totals
    loyalty.totalPoints += points;
    loyalty.availableBalance += points;
    loyalty.lastPointsUpdate = new Date();

    // Check tier upgrade
    if (loyalty.totalPoints >= 7500 && loyalty.tier === 'silver') {
      loyalty.tier = 'gold';
      loyalty.tierUpgradeDate = new Date();
    } else if (loyalty.totalPoints >= 20000 && loyalty.tier === 'gold') {
      loyalty.tier = 'platinum';
      loyalty.tierUpgradeDate = new Date();
    }

    await loyalty.save();

    res.json({
      totalPoints: loyalty.totalPoints,
      tier: loyalty.tier,
      message: `${points} points earned!`
    });
  } catch (error) {
    console.error('Error earning points:', error);
    res.status(500).json({ error: 'Failed to earn points' });
  }
});

// Redeem points
router.post('/redeem-points', async (req: Request, res: Response) => {
  try {
    const { userId, points, description } = req.body;

    const loyalty = await Loyalty.findOne({ userId });
    if (!loyalty || loyalty.availableBalance < points) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Add redemption transaction
    loyalty.transactionHistory.push({
      type: 'redeemed',
      points,
      source: 'redemption',
      description
    });

    // Update balance
    loyalty.availableBalance -= points;
    loyalty.lastPointsUpdate = new Date();

    await loyalty.save();

    const cashback = (points / 100) * 5;
    res.json({
      cashback,
      availableBalance: loyalty.availableBalance,
      message: `Successfully redeemed ${points} points for ₹${cashback} credit!`
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).json({ error: 'Failed to redeem points' });
  }
});

// Get tier benefits
router.get('/tier-benefits/:tier', async (req: Request, res: Response) => {
  try {
    const { tier } = req.params;
    const tierConfig = await LoyaltyTier.findOne({ name: tier });

    if (!tierConfig) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    res.json(tierConfig);
  } catch (error) {
    console.error('Error fetching tier benefits:', error);
    res.status(500).json({ error: 'Failed to fetch tier benefits' });
  }
});

// Check tier upgrade eligibility
router.get('/check-upgrade/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const loyalty = await Loyalty.findOne({ userId });

    if (!loyalty) {
      return res.json({ eligible: false });
    }

    const tierThresholds = { silver: 2500, gold: 7500, platinum: 20000 };
    const nextTiers = { silver: 'gold', gold: 'platinum' };

    const currentThreshold = tierThresholds[loyalty.tier as keyof typeof tierThresholds];
    const nextTier = nextTiers[loyalty.tier as keyof typeof nextTiers];

    if (nextTier && loyalty.totalPoints >= currentThreshold) {
      const nextThreshold = tierThresholds[nextTier as keyof typeof tierThresholds];
      return res.json({
        eligible: true,
        nextTier,
        pointsNeeded: nextThreshold - loyalty.totalPoints
      });
    }

    res.json({ eligible: false });
  } catch (error) {
    console.error('Error checking tier upgrade:', error);
    res.status(500).json({ error: 'Failed to check tier upgrade' });
  }
});

// Apply loyalty discount at checkout
router.post('/apply-discount', async (req: Request, res: Response) => {
  try {
    const { userId, orderAmount } = req.body;
    const loyalty = await Loyalty.findOne({ userId });

    if (!loyalty) {
      return res.json({ discount: 0, finalAmount: orderAmount });
    }

    const tierDiscounts = { silver: 0.01, gold: 0.02, platinum: 0.05 };
    const discountRate = tierDiscounts[loyalty.tier as keyof typeof tierDiscounts];
    const discount = orderAmount * discountRate;

    res.json({
      discount,
      finalAmount: orderAmount - discount
    });
  } catch (error) {
    console.error('Error applying loyalty discount:', error);
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

// Get transaction history
router.get('/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const loyalty = await Loyalty.findOne({ userId });
    if (!loyalty) {
      return res.json([]);
    }

    const history = loyalty.transactionHistory.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json(history.slice(0, limit));
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Get points expiry info
router.get('/points-expiry/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const loyalty = await Loyalty.findOne({ userId });

    if (!loyalty) {
      return res.json([]);
    }

    const expiryInfo = loyalty.pointsExpiryDates.filter(p => p.expiresAt > new Date());
    res.json(expiryInfo);
  } catch (error) {
    console.error('Error fetching points expiry:', error);
    res.status(500).json({ error: 'Failed to fetch points expiry' });
  }
});

export default router;
