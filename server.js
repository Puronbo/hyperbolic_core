import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Our network's in-memory global data storage matrix
const distributedContentStore = new Map();

/**
 * AI Hyperbolic Coordinate Engine
 * Converts text strings mathematically into 2D Poincaré space coordinates.
 */
function embedTextToHyperbolicSpace(text) {
    const hash = crypto.createHash('sha256').update(text.toLowerCase()).digest();
    
    // Seed math generation out of byte metrics
    let weightSum = 0;
    for (let i = 0; i < 4; i++) { weightSum += hash[i]; }

    const radius = 0.25 + (weightSum % 60) / 100; // Constrains nodes inside bounding boundary r=1
    const angle = (weightSum % 360) * (Math.PI / 180);

    return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
    };
}

/**
 * API Route: Ingest content entries, compute vectors, and generate immutable address CIDs
 */
app.post('/api/network/publish', (req, res) => {
    const { title, textBody, author } = req.body;
    if (!textBody) return res.status(400).json({ error: "Empty payloads rejected." });

    const coordinates = embedTextToHyperbolicSpace(textBody);
    
    const payload = {
        title: title || "Untitled Block",
        content: textBody,
        author: author || "Anonymous Peer",
        coordinates: coordinates,
        timestamp: Date.now()
    };

    // Formulate a clean IPFS styled Content Identifier address string
    const jsonString = JSON.stringify(payload);
    const contentIdentifier = "Qm" + crypto.createHash('md5').update(jsonString).digest('hex');

    // Store item in the global cache dictionary
    distributedContentStore.set(contentIdentifier, payload);

    console.log(`📡 [MESH NODE UPDATE]: Anchored block ${contentIdentifier} at [X: ${coordinates.x.toFixed(3)}, Y: ${coordinates.y.toFixed(3)}]`);
    
    res.json({ cid: contentIdentifier, data: payload });
});

/**
 * API Route: Search database by projecting strings and scanning vector properties
 */
app.post('/api/network/search', (req, res) => {
    const { searchTokens } = req.body;
    if (!searchTokens) return res.status(400).json({ error: "Missing query parameter parameters." });

    const tokens = searchTokens.toLowerCase().split(/\s+/);
    let topMatchingCid = null;
    let highestRelevanceScore = -1;

    for (let [cid, record] of distributedContentStore.entries()) {
        let currentScore = 0;
        tokens.forEach(t => {
            if (record.content.toLowerCase().includes(t)) currentScore += 1.0;
        });

        if (currentScore > highestRelevanceScore && currentScore > 0) {
            highestRelevanceScore = currentScore;
            topMatchingCid = cid;
        }
    }

    if (topMatchingCid) {
        const matchingRecord = distributedContentStore.get(topMatchingCid);
        res.json({ found: true, cid: topMatchingCid, record: matchingRecord });
    } else {
        res.json({ found: false, message: "No geometric spatial paths matched the search input parameters." });
    }
});

app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🚀 MANIFOLD NET ENGINE RUNNING LIVE NATIVELY AT http://localhost:${PORT}`);
    console.log(`================================================================`);
});