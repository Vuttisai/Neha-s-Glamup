require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || '')
    .toLowerCase()
    .split(',')
    .map(e => e.trim())
    .filter(e => e.length > 0);
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Session store (in-memory — resets on server restart)
const sessions = new Map();
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Paths
const PRODUCTS_JSON_PATH = path.join(__dirname, 'products.json');
const PRODUCTS_JS_PATH = path.join(__dirname, 'products.js');
const FRONTEND_PRODUCTS_JS_PATH = path.join(__dirname, '..', 'products.js');
const UPLOAD_DIR = path.join(__dirname, 'assets', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'jewelry-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed!'));
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all assets statically (including uploads, korean, and pre-packaged assets)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve admin panel statically at /admin
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Redirect /admin.html to /admin/ (prevents broken link from old root file layout)
app.get('/admin.html', (req, res) => {
    res.redirect('/admin/');
});

// Serve products.js with caching disabled so edits reflect immediately
app.get('/products.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'products.js'));
});

// Serve frontend static files from parent root directory
app.use(express.static(path.join(__dirname, '..')));

// =============================================
// SESSION & GOOGLE AUTH
// =============================================

// Create a new session
function createSession(email, name, picture) {
    // Clean up expired sessions
    const now = Date.now();
    for (const [token, session] of sessions) {
        if (now > session.expiresAt) {
            sessions.delete(token);
        }
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
        email,
        name,
        picture,
        createdAt: now,
        expiresAt: now + SESSION_EXPIRY_MS
    });
    return token;
}

// Validate a session token
function getSession(token) {
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        sessions.delete(token);
        return null;
    }
    return session;
}

// Security middleware for Admin API endpoints
const adminAuth = (req, res, next) => {
    const sessionToken = req.headers['x-admin-session'];
    const session = getSession(sessionToken);
    if (session) {
        req.adminUser = session;
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Please sign in with Google' });
    }
};

// =============================================
// AUTH ENDPOINTS
// =============================================

// Google Sign-In verification
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'No credential provided' });
    }

    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Google Client ID not configured on server. Set GOOGLE_CLIENT_ID env variable.' });
    }

    if (ADMIN_EMAILS.length === 0) {
        return res.status(500).json({ error: 'Admin email not configured on server. Set ADMIN_EMAIL env variable.' });
    }

    try {
        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload.email.toLowerCase().trim();
        const name = payload.name || email;
        const picture = payload.picture || '';

        // Check if this email is in the authorized admin list
        if (!ADMIN_EMAILS.includes(email)) {
            console.log(`Access denied for: ${email} (authorized list: ${ADMIN_EMAILS.join(', ')})`);
            return res.status(403).json({
                error: 'Access denied',
                message: `This Google account (${email}) is not authorized to access the admin panel.`
            });
        }

        // Create session
        const sessionToken = createSession(email, name, picture);
        console.log(`Admin authenticated: ${name} (${email})`);

        res.json({
            success: true,
            session: sessionToken,
            user: { name, email, picture }
        });

    } catch (err) {
        console.error('Google auth error:', err.message);
        res.status(401).json({ error: 'Invalid Google credential. Please try signing in again.' });
    }
});

// Validate existing session
app.post('/api/auth/validate', (req, res) => {
    const sessionToken = req.headers['x-admin-session'] || req.body.session;
    const session = getSession(sessionToken);
    if (session) {
        res.json({
            success: true,
            user: { name: session.name, email: session.email, picture: session.picture }
        });
    } else {
        res.status(401).json({ success: false, error: 'Session expired or invalid' });
    }
});

// Logout — destroy session
app.post('/api/auth/logout', (req, res) => {
    const sessionToken = req.headers['x-admin-session'];
    if (sessionToken) {
        sessions.delete(sessionToken);
    }
    res.json({ success: true, message: 'Logged out successfully' });
});

// Get Google Client ID (public — needed by frontend for the sign-in button)
app.get('/api/auth/config', (req, res) => {
    res.json({
        googleClientId: GOOGLE_CLIENT_ID,
        configured: !!(GOOGLE_CLIENT_ID && ADMIN_EMAILS.length > 0)
    });
});

// =============================================
// DATA HELPERS
// =============================================

// Helper function to read products data
const readProductsData = () => {
    if (!fs.existsSync(PRODUCTS_JSON_PATH)) {
        return { services: [], jewelry: [], jewelryCategories: [], showcase: [] };
    }
    try {
        const fileContent = fs.readFileSync(PRODUCTS_JSON_PATH, 'utf-8');
        const data = JSON.parse(fileContent);
        if (!data.services) data.services = [];
        if (!data.jewelry) data.jewelry = [];
        if (!data.jewelryCategories) data.jewelryCategories = [];
        if (!data.showcase) data.showcase = [];
        return data;
    } catch (err) {
        console.error('Error reading products.json:', err);
        return { services: [], jewelry: [], jewelryCategories: [], showcase: [] };
    }
};

// Helper function to write products data and regenerate products.js
const writeProductsData = (data) => {
    try {
        // 1. Write JSON file
        fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(data, null, 4), 'utf-8');
        
        // 2. Generate products.js contents
        const productsJsContent = `// Neha's GlamUp Products & Services Catalog
// This file is auto-generated by the backend admin dashboard. Do not edit manually.

const services = ${JSON.stringify(data.services || [], null, 4)};

const jewelry = ${JSON.stringify(data.jewelry || [], null, 4)};

const jewelryCategories = ${JSON.stringify(data.jewelryCategories || [], null, 4)};

const showcase = ${JSON.stringify(data.showcase || [], null, 4)};

// Export for usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { services, jewelry, jewelryCategories, showcase };
}
`;
        fs.writeFileSync(PRODUCTS_JS_PATH, productsJsContent, 'utf-8');
        
        // 3. Write fallback/local static copy in frontend root folder
        try {
            fs.writeFileSync(FRONTEND_PRODUCTS_JS_PATH, productsJsContent, 'utf-8');
        } catch (err) {
            console.warn('Could not write static products.js fallback in parent folder:', err.message);
        }
        
        return true;
    } catch (err) {
        console.error('Error writing products data:', err);
        return false;
    }
};

// Helper to delete an image file if it exists and is an uploaded file
const deleteProductImage = (imagePath) => {
    if (!imagePath) return;
    // Only delete files residing in assets/uploads/ to prevent deleting pre-packaged assets accidentally
    if (imagePath.startsWith('assets/uploads/')) {
        const fullPath = path.join(__dirname, imagePath);
        if (fs.existsSync(fullPath)) {
            try {
                fs.unlinkSync(fullPath);
                console.log(`Deleted unused image: ${imagePath}`);
            } catch (err) {
                console.error(`Failed to delete image: ${fullPath}`, err);
            }
        }
    }
};

// =============================================
// API ENDPOINTS
// =============================================

// Read all jewelry categories (Public endpoint)
app.get('/api/jewelry-categories', (req, res) => {
    const data = readProductsData();
    res.json(data.jewelryCategories || []);
});

// Update jewelry categories (Admin only)
app.put('/api/jewelry-categories', adminAuth, (req, res) => {
    try {
        const { categories } = req.body;
        if (!Array.isArray(categories)) {
            return res.status(400).json({ error: 'Categories must be an array of strings' });
        }
        const data = readProductsData();
        // Clean categories list
        data.jewelryCategories = categories
            .map(cat => cat.trim().toLowerCase())
            .filter(cat => cat.length > 0);
            
        if (writeProductsData(data)) {
            res.json({ success: true, categories: data.jewelryCategories });
        } else {
            res.status(500).json({ error: 'Database write error' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Multer storage for work showcase media (photos & videos)
const showcaseStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'showcase-' + uniqueSuffix + ext);
    }
});

const showcaseUpload = multer({
    storage: showcaseStorage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif|mp4|mov|webm|avi|mkv/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = /image|video/.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files (jpg, png, etc.) or video files (mp4, webm, etc.) are allowed!'));
    },
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// --- WORK SHOWCASE ENDPOINTS ---

// 1. Read all showcase items (Public)
app.get('/api/showcase', (req, res) => {
    try {
        const data = readProductsData();
        const items = data.showcase || [];
        // Sort by order ascending
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Create showcase item (Admin only)
app.post('/api/showcase', adminAuth, showcaseUpload.single('media'), (req, res) => {
    try {
        const { title, description, mediaType, order } = req.body;
        
        if (!title) {
            if (req.file) deleteProductImage(path.join('assets/uploads', req.file.filename));
            return res.status(400).json({ error: 'Title is required for showcase' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'A media file upload (photo/video) is required' });
        }

        const mediaPath = `assets/uploads/${req.file.filename}`;
        const data = readProductsData();
        const items = data.showcase || [];
        
        // Auto-detect type if not explicitly set
        let resolvedType = mediaType;
        if (!resolvedType) {
            resolvedType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
        }

        // Calculate next order
        let resolvedOrder = parseInt(order, 10);
        if (isNaN(resolvedOrder)) {
            resolvedOrder = items.reduce((max, item) => Math.max(max, item.order || 0), 0) + 1;
        }

        const id = 'showcase-' + Date.now();
        const newItem = {
            id,
            title,
            description: description || '',
            mediaType: resolvedType,
            mediaUrl: mediaPath,
            order: resolvedOrder
        };

        items.push(newItem);
        data.showcase = items;

        if (writeProductsData(data)) {
            res.status(201).json({ success: true, item: newItem });
        } else {
            deleteProductImage(mediaPath);
            res.status(500).json({ error: 'Database write error' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update showcase item (Admin only)
app.put('/api/showcase/:id', adminAuth, showcaseUpload.single('media'), (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, mediaType, order } = req.body;
        
        const data = readProductsData();
        const items = data.showcase || [];
        const itemIdx = items.findIndex(item => item.id === id);

        if (itemIdx === -1) {
            if (req.file) deleteProductImage(path.join('assets/uploads', req.file.filename));
            return res.status(404).json({ error: 'Showcase item not found' });
        }

        const existingItem = items[itemIdx];

        if (title) existingItem.title = title;
        if (description !== undefined) existingItem.description = description;
        if (mediaType) existingItem.mediaType = mediaType;
        if (order !== undefined) {
            const parsedOrder = parseInt(order, 10);
            if (!isNaN(parsedOrder)) {
                existingItem.order = parsedOrder;
            }
        }

        let oldFileToDelete = null;
        if (req.file) {
            oldFileToDelete = existingItem.mediaUrl;
            existingItem.mediaUrl = `assets/uploads/${req.file.filename}`;
            if (!mediaType) {
                existingItem.mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
            }
        }

        data.showcase = items;

        if (writeProductsData(data)) {
            if (oldFileToDelete) deleteProductImage(oldFileToDelete);
            res.json({ success: true, item: existingItem });
        } else {
            if (req.file) deleteProductImage(`assets/uploads/${req.file.filename}`);
            res.status(500).json({ error: 'Database write error' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete showcase item (Admin only)
app.delete('/api/showcase/:id', adminAuth, (req, res) => {
    try {
        const { id } = req.params;
        const data = readProductsData();
        const items = data.showcase || [];
        const itemIdx = items.findIndex(item => item.id === id);

        if (itemIdx === -1) {
            return res.status(404).json({ error: 'Showcase item not found' });
        }

        const itemToDelete = items[itemIdx];
        const mediaUrl = itemToDelete.mediaUrl;

        items.splice(itemIdx, 1);
        data.showcase = items;

        if (writeProductsData(data)) {
            deleteProductImage(mediaUrl);
            res.json({ success: true, message: 'Showcase item deleted successfully' });
        } else {
            res.status(500).json({ error: 'Database write error' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Reorder showcase items (Admin only)
app.post('/api/showcase/reorder', adminAuth, (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'IDs must be an array of showcase item IDs' });
        }

        const data = readProductsData();
        const items = data.showcase || [];

        // Update the order based on their position in the incoming array
        items.forEach(item => {
            const newIndex = ids.indexOf(item.id);
            if (newIndex !== -1) {
                item.order = newIndex + 1;
            }
        });

        // Sort items array by order so we keep database file naturally ordered
        items.sort((a, b) => (a.order || 0) - (b.order || 0));
        data.showcase = items;

        if (writeProductsData(data)) {
            res.json({ success: true, message: 'Showcase items reordered successfully' });
        } else {
            res.status(500).json({ error: 'Database write error' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read all products (Public endpoint)
app.get('/api/products', (req, res) => {
    const data = readProductsData();
    res.json(data);
});

// Create a product (Admin only)
app.post('/api/products', adminAuth, upload.single('image'), (req, res) => {
    try {
        const { type, name, title, category, price, originalPrice, description, icon, isKorean } = req.body;
        const data = readProductsData();
        
        if (type === 'jewelry') {
            if (!name || !category) {
                if (req.file) deleteProductImage(path.join('assets/uploads', req.file.filename));
                return res.status(400).json({ error: 'Name and Category are required for jewelry' });
            }
            if (!req.file) {
                return res.status(400).json({ error: 'An image file upload is required for new jewelry' });
            }

            const imagePath = `assets/uploads/${req.file.filename}`;
            const id = 'jewelry-' + Date.now();
            
            const newJewelry = {
                id,
                name,
                category, // 'renting' or 'selling'
                price: price || '',
                originalPrice: originalPrice || '',
                description: description || '',
                image: imagePath,
                isKorean: isKorean === 'true'
            };
            
            data.jewelry.push(newJewelry);
            if (writeProductsData(data)) {
                res.status(201).json({ success: true, item: newJewelry });
            } else {
                deleteProductImage(imagePath);
                res.status(500).json({ error: 'Database write error' });
            }

        } else if (type === 'service') {
            if (!title || !category || !icon) {
                return res.status(400).json({ error: 'Title, Category, and Icon are required for services' });
            }
            
            const id = 'service-' + Date.now();
            const newService = {
                id,
                title,
                category,
                description: description || '',
                icon,
                type: (() => {
                    const cat = category.toLowerCase();
                    if (cat.includes('mehendi') || cat.includes('henna')) return 'mehendi';
                    if (cat.includes('makeup') || cat.includes('bridal')) return 'makeup';
                    return 'beautician';
                })()
            };
            
            data.services.push(newService);
            if (writeProductsData(data)) {
                res.status(201).json({ success: true, item: newService });
            } else {
                res.status(500).json({ error: 'Database write error' });
            }
        } else {
            if (req.file) deleteProductImage(path.join('assets/uploads', req.file.filename));
            res.status(400).json({ error: 'Invalid product type. Must be jewelry or service.' });
        }
    } catch (err) {
        console.error('Error creating product:', err);
        if (req.file) deleteProductImage(path.join('assets/uploads', req.file.filename));
        res.status(500).json({ error: err.message });
    }
});

// Update a product (Admin only)
app.put('/api/products/:id', adminAuth, upload.single('image'), (req, res) => {
    try {
        const { id } = req.params;
        const { type, name, title, category, price, originalPrice, description, icon, isKorean } = req.body;
        const data = readProductsData();
        
        let found = false;
        
        if (type === 'jewelry') {
            const index = data.jewelry.findIndex(item => item.id === id);
            if (index !== -1) {
                found = true;
                const oldItem = data.jewelry[index];
                let imagePath = oldItem.image;
                
                // If a new image was uploaded
                if (req.file) {
                    // Delete old upload if it exists
                    deleteProductImage(oldItem.image);
                    imagePath = `assets/uploads/${req.file.filename}`;
                }
                
                data.jewelry[index] = {
                    ...oldItem,
                    name: name || oldItem.name,
                    category: category || oldItem.category,
                    price: price !== undefined ? price : oldItem.price,
                    originalPrice: originalPrice !== undefined ? originalPrice : oldItem.originalPrice,
                    description: description !== undefined ? description : oldItem.description,
                    image: imagePath,
                    isKorean: isKorean !== undefined ? (isKorean === 'true') : oldItem.isKorean
                };
                
                if (writeProductsData(data)) {
                    res.json({ success: true, item: data.jewelry[index] });
                } else {
                    if (req.file) deleteProductImage(imagePath);
                    res.status(500).json({ error: 'Database write error' });
                }
            }
        } else if (type === 'service') {
            const index = data.services.findIndex(item => item.id === id);
            if (index !== -1) {
                found = true;
                const oldItem = data.services[index];
                
                data.services[index] = {
                    ...oldItem,
                    title: title || oldItem.title,
                    category: category || oldItem.category,
                    description: description !== undefined ? description : oldItem.description,
                    icon: icon || oldItem.icon,
                    type: category ? (() => {
                        const cat = category.toLowerCase();
                        if (cat.includes('mehendi') || cat.includes('henna')) return 'mehendi';
                        if (cat.includes('makeup') || cat.includes('bridal')) return 'makeup';
                        return 'beautician';
                    })() : oldItem.type
                };
                
                if (writeProductsData(data)) {
                    res.json({ success: true, item: data.services[index] });
                } else {
                    res.status(500).json({ error: 'Database write error' });
                }
            }
        }
        
        if (!found) {
            if (req.file) deleteProductImage(path.join('assets/uploads', req.file.filename));
            res.status(404).json({ error: `Product with ID ${id} not found.` });
        }
    } catch (err) {
        console.error('Error updating product:', err);
        if (req.file) deleteProductImage(path.join('assets/uploads', req.file.filename));
        res.status(500).json({ error: err.message });
    }
});

// Delete a product (Admin only)
app.delete('/api/products/:id', adminAuth, (req, res) => {
    try {
        const { id } = req.params;
        const data = readProductsData();
        
        let found = false;
        
        // Try searching in jewelry
        const jewelryIndex = data.jewelry.findIndex(item => item.id === id);
        if (jewelryIndex !== -1) {
            found = true;
            const item = data.jewelry[jewelryIndex];
            // Delete image file from disk
            deleteProductImage(item.image);
            data.jewelry.splice(jewelryIndex, 1);
        } else {
            // Try searching in services
            const serviceIndex = data.services.findIndex(item => item.id === id);
            if (serviceIndex !== -1) {
                found = true;
                data.services.splice(serviceIndex, 1);
            }
        }
        
        if (found) {
            if (writeProductsData(data)) {
                res.json({ success: true, message: `Successfully deleted product: ${id}` });
            } else {
                res.status(500).json({ error: 'Database write error' });
            }
        } else {
            res.status(404).json({ error: `Product with ID ${id} not found.` });
        }
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ error: err.message });
    }
});

// Health check for deployment monitoring
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database generation on startup
try {
    writeProductsData(readProductsData());
    console.log(`✅ Dynamically generated products.js and fallback files on startup`);
} catch (err) {
    console.error(`⚠️ Failed to generate products.js at startup:`, err.message);
}

// Start Server
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Neha's GlamUp Admin Backend is running!`);
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
    console.log(`========================================`);
    if (!GOOGLE_CLIENT_ID) {
        console.log(`⚠️  GOOGLE_CLIENT_ID not set — Google Sign-In will not work`);
    }
    if (ADMIN_EMAILS.length === 0) {
        console.log(`⚠️  ADMIN_EMAIL not set — No admin can sign in`);
    }
    if (ADMIN_EMAILS.length > 0) {
        console.log(`✅ Authorized admin list: ${ADMIN_EMAILS.join(', ')}`);
    }
});
