const fs = require('fs');

const dataStr = fs.readFileSync('products.js', 'utf8');
eval(dataStr);

// Mock document
const grid = [];
const emptyState = { classList: { add: () => {}, remove: () => {} } };

let jewelryData = jewelry;
let activeCategory = 'all';
let searchQuery = '';
let activeSort = 'default';

function resolveImageUrl(imagePath) {
    if (!imagePath) return '';
    if (imagePath.startsWith('assets/uploads/')) {
        return `http://localhost:3000/${imagePath}`;
    }
    return imagePath;
}

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const matches = priceStr.toString().replace(/,/g, '').match(/\d+/);
    return matches ? parseInt(matches[0], 10) : 0;
}

function renderGrid() {
    let items = [...jewelryData];

    // 1. Filter by Category
    if (activeCategory !== 'all') {
        if (activeCategory === 'korean') {
            items = items.filter(item => item.isKorean === true);
        } else {
            items = items.filter(item => (item.category || '').toLowerCase() === activeCategory.toLowerCase());
        }
    }

    if (items.length === 0) {
        console.log('No items');
        return;
    }

    items.forEach((item, index) => {
        try {
            const isRent = (item.category || '').toLowerCase().includes('rent') || (item.category || '').toLowerCase() === 'rented jewelry';
            let actionBadge = isRent ? 'Available for Rent' : 'Available for Sale';
            if (item.isKorean) {
                actionBadge = 'Unique Design';
            }

            const whatsappMessage = item.isKorean 
                ? `Hi Neha, I am interested in the unique Korean jewelry piece "${item.name}". Please let me know its availability! Thank you.`
                : `Hi Neha, I am interested in the jewelry item "${item.name}" listed under category "${item.category}". Can you please share more details? Thanks!`;
                
            const waUrl = `https://wa.me/917337480803?text=${encodeURIComponent(whatsappMessage)}`;

            // Dynamic price rendering
            let priceHtml = '';
            if (!isRent) {
                const offerPrice = item.price || '250';
                const originalPrice = item.originalPrice || '500';
                priceHtml = `<span class="original-price">₹${originalPrice}</span> ₹${offerPrice}`;
            } else {
                const currentPrice = item.price || 'Enquire Rent';
                const originalPrice = item.originalPrice ? `<span class="original-price">₹${item.originalPrice}</span> ` : '';
                priceHtml = `${originalPrice}${currentPrice}`;
            }

            const imageUrl = resolveImageUrl(item.image);
            const escapedImage = imageUrl.replace(/'/g, "\\'");
            grid.push(escapedImage);
        } catch (e) {
            console.error('Error on item:', item.id, e.message);
        }
    });
    console.log('Successfully rendered', grid.length, 'items');
}

renderGrid();
