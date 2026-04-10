import express, { Request, Response } from 'express';
import { Referral } from '../models/Referral';
import { Loyalty } from '../models/Loyalty';
import User from '../models/User';

const router = express.Router();

// Generate unique referral code
const generateReferralCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get referral profile
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let referral = await Referral.findOne({ referrerId: userId });

    if (!referral) {
      // Create new referral profile
      const code = generateReferralCode();
      referral = new Referral({
        referrerId: userId,
        referralCode: code
      });
      await referral.save();
    }

    res.json(referral);
  } catch (error) {
    console.error('Error fetching referral profile:', error);
    res.status(500).json({ error: 'Failed to fetch referral profile' });
  }
});

// Generate new referral code
router.post('/generate-code', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const code = generateReferralCode();

    let referral = await Referral.findOne({ referrerId: userId });
    if (!referral) {
      referral = new Referral({ referrerId: userId, referralCode: code });
    } else {
      referral.referralCode = code;
    }

    await referral.save();

    res.json({ referralCode: code });
  } catch (error) {
    console.error('Error generating referral code:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Apply referral code during registration
router.post('/apply-code', async (req: Request, res: Response) => {
  try {
    const { referralCode, newUserId } = req.body;

    const referral = await Referral.findOne({ referralCode, isActive: true });
    if (!referral) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    // Add referred user
    referral.referredUsers.push({
      userId: newUserId,
      referredAt: new Date(),
      conversionStatus: 'pending'
    });

    referral.totalReferrals += 1;
    await referral.save();

    // Give bonus to new user
    let loyalty = await Loyalty.findOne({ userId: newUserId });
    if (!loyalty) {
      loyalty = new Loyalty({ userId: newUserId });
    }

    loyalty.transactionHistory.push({
      type: 'bonus',
      points: 100,
      source: 'referral',
      description: `Sign up via referral code ${referralCode}`
    });

    loyalty.availableBalance += 100;
    loyalty.totalPoints += 100;
    await loyalty.save();

    res.json({
      bonusPoints: 100,
      discount: 50,
      message: 'Referral code applied successfully!'
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({ error: 'Failed to apply referral code' });
  }
});

// Track referred user order
router.post('/track-order', async (req: Request, res: Response) => {
  try {
    const { referralCode, orderId, orderAmount } = req.body;

    const referral = await Referral.findOne({ referralCode });
    if (!referral) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    // Find the referred user's order and mark as converted
    const minOrderValue = 100; // Minimum order value to count as conversion
    if (orderAmount >= minOrderValue) {
      const referredUser = referral.referredUsers.find(
        r => (r.conversionStatus === 'pending' || r.conversionStatus === 'converted') &&
          (!r.convertedAt || r.orderCount === undefined)
      );

      if (referredUser) {
        referredUser.conversionStatus = 'converted';
        referredUser.convertedAt = new Date();
        referredUser.orderCount = (referredUser.orderCount || 0) + 1;
        referredUser.totalSpent = (referredUser.totalSpent || 0) + orderAmount;

        // Award bonus only once
        if (!referredUser.bonusEarned) {
          referral.successfulReferrals += 1;
          referral.totalBonusPointsEarned += referral.bonusPoints;
          referral.totalBonusAmountEarned += 50;
          referredUser.bonusEarned = true;
          referredUser.bonusPoints = referral.bonusPoints;

          // Award referrer bonus points
          const referrerLoyalty = await Loyalty.findOne({ userId: referral.referrerId });
          if (referrerLoyalty) {
            referrerLoyalty.transactionHistory.push({
              type: 'earned',
              points: referral.bonusPoints,
              source: 'referral',
              referenceId: orderId,
              description: `Referral bonus for user conversion`
            });
            referrerLoyalty.availableBalance += referral.bonusPoints;
            referrerLoyalty.totalPoints += referral.bonusPoints;
            await referrerLoyalty.save();
          }
        }
      }
    }

    await referral.save();

    res.json({
      bonusEarned: true,
      pointsAwarded: referral.bonusPoints
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Get referred users list
router.get('/referred-users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const referral = await Referral.findOne({ referrerId: userId });

    if (!referral) {
      return res.json([]);
    }

    res.json(referral.referredUsers);
  } catch (error) {
    console.error('Error fetching referred users:', error);
    res.status(500).json({ error: 'Failed to fetch referred users' });
  }
});

// Get referral earnings
router.get('/earnings/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const referral = await Referral.findOne({ referrerId: userId });

    if (!referral) {
      return res.json({
        totalEarnings: 0,
        pendingBonus: 0,
        historyCount: 0
      });
    }

    const pendingBonus = referral.referredUsers.filter(r => r.conversionStatus === 'pending').length * referral.bonusPoints;

    res.json({
      totalEarnings: referral.totalBonusAmountEarned,
      pendingBonus,
      historyCount: referral.referredUsers.length
    });
  } catch (error) {
    console.error('Error fetching referral earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

export default router;
