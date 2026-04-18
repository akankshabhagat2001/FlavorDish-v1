import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';

const router = express.Router();

/**
 * AI Food Recommendation Engine (Gemini API)
 * Route: POST /api/ai/recommend
 */
router.post('/recommend', async (req, res) => {
    try {
        const { query, userLocation } = req.body;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required.' });
        }

        const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: 'Gemini API Key is not configured.' });
        }

        // Fetch basic info from DB to give context to the AI (e.g., top 10 foods/restaurants)
        const activeRestaurants = await Restaurant.find({ isActive: true })
            .limit(20)
            .select('name cuisine costForTwo location rating');
        
        // Prepare prompt context
        const contextData = activeRestaurants.map(r => 
            `${r.name} (Rating: ${r.rating}, Cost: Rs ${r.costForTwo}, Cuisine: ${r.cuisine.join(', ')})`
        ).join(' | ');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a helpful AI Food Assistant for "FlavorFinder". A user asked: "${query}". 
        Here are some available restaurants in our database right now: ${contextData}. 
        Keep your response friendly, concise, and recommend 2-3 specific options from the data provided if they match. Format your response cleanly.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.json({ success: true, ai_response: text });

    } catch (error) {
        console.error('Gemini AI Error:', error);
        return res.status(500).json({ success: false, message: 'AI Processing Error.' });
    }
});

export default router;
