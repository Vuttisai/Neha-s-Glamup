const services = [
    {
        id: "bridal-makeup",
        title: "Bridal Makeup",
        category: "Bridal & Ceremonial",
        description: "Premium, long-lasting bridal makeover customized to match your wedding attire, jewelry, and personal style. Includes standard draping and hair styling.",
        icon: "👑",
        type: "makeup"
    },
    {
        id: "engagement-makeup",
        title: "Engagement Makeup",
        category: "Bridal & Ceremonial",
        description: "Elegant, radiant, and dewy makeup look designed to make you glow on your ring ceremony. Complemented by sophisticated hair styling.",
        icon: "💍",
        type: "makeup"
    },
    {
        id: "reception-makeup",
        title: "Reception Makeup",
        category: "Bridal & Ceremonial",
        description: "High-glam, sophisticated, and camera-ready evening makeup designed to stand out under reception lighting.",
        icon: "✨",
        type: "makeup"
    },
    {
        id: "haldi-makeup",
        title: "Haldi & Mehendi Makeup",
        category: "Pre-Wedding",
        description: "Vibrant, fresh, and lightweight makeup tailored for daytime rituals. Sweat-proof and smudge-proof for stress-free celebrations.",
        icon: "💛",
        type: "makeup"
    },
    {
        id: "party-makeup",
        title: "Party Makeup",
        category: "Occasions",
        description: "Customized makeover ranging from subtle and natural to bold and dramatic, perfect for party guests, cocktail events, or festivals.",
        icon: "💄",
        type: "makeup"
    },
    {
        id: "airbrush-makeup",
        title: "Airbrush Makeup",
        category: "Specialized Techniques",
        description: "Ultra-flawless, lightweight, and water-resistant makeup applied using professional airbrushing for a seamless, second-skin finish.",
        icon: "💨",
        type: "makeup"
    },
    {
        id: "hd-makeup",
        title: "HD Makeup",
        category: "Specialized Techniques",
        description: "High-definition makeup using light-diffusing products that look completely natural in person and stunning in 4K photography and videography.",
        icon: "📸",
        type: "makeup"
    },
    {
        id: "waterproof-makeup",
        title: "Waterproof & Sweat-Proof",
        category: "Specialized Techniques",
        description: "Advanced long-wear makeup formulas locked in to withstand humidity, sweat, and tears. Ideal for long ceremonies and Hyderabad summers.",
        icon: "☔",
        type: "makeup"
    },
    {
        id: "pre-wedding-makeup",
        title: "Pre-Wedding Shoot Makeup",
        category: "Pre-Wedding",
        description: "Photogenic makeup looks tailored for outdoor shoots, matching different outfits and concepts with camera-friendly contouring.",
        icon: "📹",
        type: "makeup"
    },
    {
        id: "customized-makeup",
        title: "Customized Makeup",
        category: "Occasions",
        description: "A tailored makeup experience designed after a personal consultation to perfectly fit your skin type, tone, and specific event theme.",
        icon: "🌸",
        type: "makeup"
    },
    {
        id: "saree-draping",
        title: "Saree Draping & Pleating",
        category: "Styling Services",
        description: "Professional draping for all saree types (Kanjeevaram, Silk, Georgette, Lehenga style) with perfect, secure pleating that lasts all day.",
        icon: "👘",
        type: "makeup"
    },
    {
        id: "hairstyles",
        title: "Professional Hairstyles",
        category: "Styling Services",
        description: "From classic bridal buns and intricate braids (Jada) to modern curls, waves, and extensions, styled to perfectly complement your look.",
        icon: "💇",
        type: "makeup"
    },
    {
        id: "mehendi-services",
        title: "Mehendi Services",
        category: "Styling Services",
        description: "Beautiful, dark-staining henna designs from traditional bridal patterns to modern Arabic designs for brides and guests.",
        icon: "🌿",
        type: "makeup"
    },
    {
        id: "hydrafacial-glow",
        title: "HydraFacial Glow",
        category: "Skincare & Salon",
        description: "Premium deep-cleansing, exfoliation, and intense skin hydration therapy. *Beauty from inner with flawless glam.*",
        icon: "💆‍♀️",
        type: "beautician"
    },
    {
        id: "gold-facial",
        title: "Gold Luxury Facial",
        category: "Skincare & Salon",
        description: "Brighten and rejuvenate your skin with a luxury gold facial. Ideal for brides and guests seeking a flawless bridal glow.",
        icon: "✨",
        type: "beautician"
    },
    {
        id: "diamond-facial",
        title: "Diamond Radiance Facial",
        category: "Skincare & Salon",
        description: "Diamond dust polish facial designed for deep exfoliation, skin tightening, and an ultra-brilliant flawless finish.",
        icon: "💎",
        type: "beautician"
    },
    {
        id: "detan-brightening",
        title: "De-Tan & Skin Brightening",
        category: "Skincare & Salon",
        description: "Revive your natural complexion and clear sun tanning using professional, safe, and herbal organic de-tan formulations.",
        icon: "🌿",
        type: "beautician"
    },
    {
        id: "nourishing-hairspa",
        title: "Nourishing Hair Spa",
        category: "Skincare & Salon",
        description: "Deep hair conditioning and massage treatment to restore shine, lock in moisture, and repair dry or damaged hair.",
        icon: "💇‍♀️",
        type: "beautician"
    },
    {
        id: "threading-waxing",
        title: "Threading & Waxing",
        category: "Skincare & Salon",
        description: "Grooming essentials including gentle facial threading and highly hygienic body waxing to leave your skin soft and smooth.",
        icon: "🧴",
        type: "beautician"
    }
];

const jewelry = [
    {
        id: "royal-kundan-set",
        name: "Royal Kundan Bridal Set",
        category: "renting",
        price: "Rent: ₹2,499 / day",
        description: "Premium gold-plated Kundan choker necklace embellished with green glass beads, matching jhumkas, and an elegant maang tikka.",
        image: "assets/jewelry_kundan_set.jpg",
        isKorean: false
    },
    {
        id: "temple-gold-haram",
        name: "Temple Gold Long Haram",
        category: "renting",
        price: "Rent: ₹1,999 / day",
        description: "Traditional South Indian long necklace featuring intricate carvings of Goddess Lakshmi, bordered by red rubies and seed pearls.",
        image: "assets/jewelry_temple_haram.jpg",
        isKorean: false
    },
    {
        id: "antique-guttapusalu",
        name: "Antique Guttapusalu Choker",
        category: "renting",
        price: "Rent: ₹1,799 / day",
        description: "Stunning heritage choker loaded with premium pearl clusters (guttapusalu) and rubies, giving an authentic royal look.",
        image: "assets/jewelry_guttapusalu.jpg",
        isKorean: false
    },
    {
        id: "korean-jewelry-1",
        name: "Dainty Pearl Drop Earrings",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_223756.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-2",
        name: "Korean Blossom Stud Earrings",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_223831.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-3",
        name: "Minimalist Gold Helix Ring",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_223931.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-4",
        name: "Sparkling Crystal Hoop Earrings",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224006.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-5",
        name: "Rose Gold Heart Pendant",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224018.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-6",
        name: "Vintage Emerald Drop Earrings",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224043.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-7",
        name: "Korean Layered Choker Necklace",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224115.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-8",
        name: "Elegant Pearl Hair Pin",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224136.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-9",
        name: "Bohemian Tassel Earrings",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224153.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-10",
        name: "Sleek Geometric Gold Ring",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224235.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-11",
        name: "Classic Cubic Zirconia Studs",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224252.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-12",
        name: "Korean Crystal Leaf Brooch",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224302.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-13",
        name: "Dainty Starburst Necklace",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224322.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-14",
        name: "Textured Gold Dome Bangles",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224342.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-15",
        name: "Chic Opal Pendant Necklace",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224426.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-16",
        name: "Luxury Pearl Cluster Earrings",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224551.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-17",
        name: "Modern Threader Earrings",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_224626.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-18",
        name: "Elegant Floral Choker",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_225134.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-19",
        name: "Korean Vintage Pearl Ring",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_225303.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-20",
        name: "Sparkling Tear-drop Pendant",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_225441.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-21",
        name: "Minimalist Bar Chain Bracelet",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_233627.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-22",
        name: "Dainty Butterfly Studs",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_233739.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-23",
        name: "Vintage Filigree Ring",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_233826.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-24",
        name: "Korean Moonstone Necklace",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_234245.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-25",
        name: "Glistening Rhinestone Choker",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_234411.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-26",
        name: "Delicate Floral Studs",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_234650.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-27",
        name: "Modern Chevron Ring",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_234819.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-28",
        name: "Luxury Solitaire Studs",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_235128.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-29",
        name: "Korean Multi-stone Bracelet",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_235834.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-30",
        name: "Elegant Velvet Ribbon Choker",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_235907.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-31",
        name: "Sparkling Constellation Studs",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_235928.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-32",
        name: "Dainty Chain Link Ring",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/20260613_235946.jpg",
        isKorean: true
    },
    {
        id: "korean-jewelry-33",
        name: "Korean Tassel Drop Necklace",
        category: "selling",
        price: "",
        description: "Exquisite, unique, and imported Korean jewelry piece. Featuring premium finishes and elegant design.",
        image: "assets/korean/InShot_20260613_225035183.jpg",
        isKorean: true
    }
];

// Export for usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { services, jewelry };
}
