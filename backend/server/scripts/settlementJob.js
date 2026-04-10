import { releasePendingSettlements } from '../routes/payments.js';

const INTERVAL_MS = 6 * 60 * 60 * 1000;

export const startSettlementJob = () => {
    console.log('Settlement job started (runs every 6h)');
    setInterval(async() => {
        const settled = await releasePendingSettlements();
        if (settled.length > 0)
            console.log(`Auto-settlement: ${settled.length} orders settled.`);
    }, INTERVAL_MS);
};