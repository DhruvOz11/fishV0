// =====================================================
// FRESHCATCH - SEAFOOD QUICK COMMERCE DATA
// =====================================================

// Categories Data
const categories = [
  {
    id: 'fish',
    name: 'Fish & Seafood',
    description: 'No added chemicals',
    image:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80',
    heroImage:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    subcategories: [
      {
        id: 'freshwater',
        name: 'Freshwater',
        image:
          'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200&q=80',
      },
      {
        id: 'seawater',
        name: 'Seawater',
        image:
          'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=200&q=80',
      },
      {
        id: 'exotic',
        name: 'Exotic Fish',
        image:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200&q=80',
      },
    ],
  },
  {
    id: 'prawns',
    name: 'Prawns & Shrimps',
    description: 'Ocean fresh delicacies',
    image:
      'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=200&q=80',
    heroImage:
      'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
    subcategories: [
      {
        id: 'tiger-prawns',
        name: 'Tiger Prawns',
        image:
          'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=200&q=80',
      },
      {
        id: 'white-prawns',
        name: 'White Prawns',
        image:
          'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=200&q=80',
      },
      {
        id: 'jumbo-shrimps',
        name: 'Jumbo Shrimps',
        image:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200&q=80',
      },
    ],
  },
  {
    id: 'crabs',
    name: 'Crabs & Lobsters',
    description: 'Premium shellfish',
    image:
      'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200&q=80',
    heroImage:
      'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80',
    subcategories: [
      {
        id: 'mud-crab',
        name: 'Mud Crabs',
        image:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200&q=80',
      },
      {
        id: 'blue-crab',
        name: 'Blue Crabs',
        image:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200&q=80',
      },
      {
        id: 'lobster',
        name: 'Lobsters',
        image:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=200&q=80',
      },
    ],
  },
  {
    id: 'squid',
    name: 'Squid & Octopus',
    description: 'Tender & fresh',
    image:
      'https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=200&q=80',
    heroImage:
      'https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=800&q=80',
    subcategories: [
      {
        id: 'squid-rings',
        name: 'Squid Rings',
        image:
          'https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=200&q=80',
      },
      {
        id: 'baby-octopus',
        name: 'Baby Octopus',
        image:
          'https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=200&q=80',
      },
      {
        id: 'whole-squid',
        name: 'Whole Squid',
        image:
          'https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=200&q=80',
      },
    ],
  },
  {
    id: 'ready-to-cook',
    name: 'Ready to Cook',
    description: 'Freshly marinated',
    image:
      'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=200&q=80',
    heroImage:
      'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&q=80',
    subcategories: [
      {
        id: 'marinated-fish',
        name: 'Marinated Fish',
        image:
          'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=200&q=80',
      },
      {
        id: 'fish-fry',
        name: 'Fish Fry Ready',
        image:
          'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=200&q=80',
      },
      {
        id: 'curry-cut',
        name: 'Curry Cut',
        image:
          'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=200&q=80',
      },
    ],
  },
  {
    id: 'combos',
    name: 'Seafood Combos',
    description: 'Value packs & bundles',
    image:
      'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=200&q=80',
    heroImage:
      'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=800&q=80',
    subcategories: [
      {
        id: 'family-pack',
        name: 'Family Packs',
        image:
          'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=200&q=80',
      },
      {
        id: 'party-pack',
        name: 'Party Packs',
        image:
          'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=200&q=80',
      },
      {
        id: 'starter-combo',
        name: 'Starter Combos',
        image:
          'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=200&q=80',
      },
    ],
  },
  {
    id: 'dried',
    name: 'Dried Seafood',
    description: 'Traditional favorites',
    image:
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&q=80',
    heroImage:
      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&q=80',
    subcategories: [
      {
        id: 'dried-fish',
        name: 'Dried Fish',
        image:
          'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&q=80',
      },
      {
        id: 'dried-prawns',
        name: 'Dried Prawns',
        image:
          'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&q=80',
      },
    ],
  },
  {
    id: 'specials',
    name: 'Chef Specials',
    description: 'Gourmet selections',
    image:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=200&q=80',
    heroImage:
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',
    subcategories: [
      {
        id: 'sashimi',
        name: 'Sashimi Grade',
        image:
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=200&q=80',
      },
      {
        id: 'premium-cuts',
        name: 'Premium Cuts',
        image:
          'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=200&q=80',
      },
    ],
  },
]

// Products Data
const products = [
  // Fish Products
  // {
  //   id: 'p1',
  //   name: 'Sole fish ( jipta )',
  //   description: 'Fresh whole fish for rawa fries, curries & more',
  //   category: 'fish',
  //   subcategory: 'seawater',
  //   weight: '1Kg',
  //   pieces: '4-5 Pieces',
  //   serves: '3-4',
  //   price: 230,
  //   originalPrice: 699,
  //   discount: 67,
  //   images: [
  //     'https://i.ibb.co/JWn0DwM5/jipta-2.png',
  //     'https://i.ibb.co/TXXwgM6/jipta.png',
  //     //   'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
  //   ],
  //   badge: 'bestseller',
  //   inStock: true,
  //   stockQty: 25,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'No added chemicals',
  //     'Cleaned & ready to cook',
  //     'Lab tested for quality',
  //     'Sourced from trusted fishermen',
  //   ],
  // },
  // {
  //   id: 'p2',
  //   name: 'Pink perch ( Rani )',
  //   description: 'Premium quality fish',
  //   category: 'fish',
  //   subcategory: 'seawater',
  //   weight: '1kg',
  //   pieces: '4-5 Pieces approx',
  //   serves: '3-4',
  //   price: 200,
  //   originalPrice: 300,
  //   discount: 33,
  //   images: ['https://i.ibb.co/h1V7r1Dq/Pink-perch-Rani.png'],
  //   badge: '',
  //   inStock: true,
  //   stockQty: 40,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Freshwater fish',
  //     'Traditional Bengali cut',
  //     'Perfect for fish curry',
  //     'High in protein',
  //   ],
  // },
  // {
  //   id: 'p3',
  //   name: 'White kaskaa',
  //   description: 'Premium quality fish',
  //   category: 'fish',
  //   subcategory: 'seawater',
  //   weight: '1kg',
  //   pieces: '4-5 approx',
  //   serves: '2-3',
  //   price: 180,
  //   originalPrice: 360,
  //   discount: 50,
  //   images: ['https://i.ibb.co/Q3C2GSG3/White-kaskaa.png'],
  //   badge: 'premium',
  //   inStock: true,
  //   stockQty: 15,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'King of fish',
  //     'Perfect steaks',
  //     'Great for grilling',
  //     'Rich in Omega-3',
  //   ],
  // },
  // {
  //   id: 'p4',
  //   name: 'Kati Fish',
  //   description: 'high grade quality',
  //   category: 'fish',
  //   subcategory: 'exotic',
  //   weight: '1kg',
  //   pieces: '4-5 approx',
  //   serves: '3-4',
  //   price: 250,
  //   originalPrice: 500,
  //   discount: 50,
  //   images: ['https://i.ibb.co/7dcTybtc/katifish.jpg'],
  //   badge: 'new',
  //   inStock: true,
  //   stockQty: 8,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Norwegian salmon',
  //     'Sashimi grade',
  //     'Rich in Omega-3',
  //     'Premium quality',
  //   ],
  // },
  // {
  //   id: 'p5',
  //   name: 'Black Pomfret ( black halvoo )',
  //   description: 'Premium quality fish',
  //   category: 'fish',
  //   subcategory: 'seawater',
  //   weight: '1kg',
  //   pieces: '5-6 approx',
  //   serves: '4-5',
  //   price: 500,
  //   originalPrice: 1000,
  //   discount: 50,
  //   images: ['https://i.ibb.co/cKp16Yg7/blkpaplet.jpg'],
  //   badge: 'bestseller',
  //   inStock: true,
  //   stockQty: 50,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: ['Ready to cook', 'Great taste', 'Great for kids'],
  // },
  // {
  //   id: 'p6',
  //   name: 'Bombay bangra ( aaila bangra )',
  //   description: 'Fresh Bangra, perfect for authentic fish curry',
  //   category: 'fish',
  //   subcategory: 'seawater',
  //   weight: '1kg',
  //   pieces: '6-7 approx',
  //   serves: '4-5 approx',
  //   price: 180,
  //   originalPrice: 360,
  //   discount: 50,
  //   images: ['https://i.ibb.co/YBM5pfQd/bangra.jpg'],
  //   badge: '',
  //   inStock: false,
  //   stockQty: 0,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Freshwater delicacy',
  //     'Rich taste',
  //     'Perfect for curry',
  //     'High protein',
  //   ],
  // },
  // Prawns Products
  // {
  //   id: 'p7',
  //   name: 'Silver pomfret ( paplet )',
  //   description: 'Fresh quality',
  //   category: 'fish',
  //   subcategory: 'seawater',
  //   weight: '1kg',
  //   pieces: '6-7 Pieces',
  //   serves: '4-5 approx',
  //   price: 350,
  //   originalPrice: 700,
  //   discount: 50,
  //   images: [
  //     'https://i.ibb.co/DPsFQFKv/silverpaplet.jpg',
  //     'https://i.ibb.co/0pk4NjZm/silverpaplet2.jpg',
  //   ],
  //   badge: 'bestseller',
  //   inStock: true,
  //   stockQty: 30,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Large size',
  //     'Cleaned & deveined',
  //     'Juicy & sweet',
  //     'Perfect for grilling',
  //   ],
  // },
  // {
  //   id: 'p8',
  //   name: 'prawns 🦐',
  //   description: 'Sweet freshwater prawns, cleaned & deveined',
  //   category: 'prawns',
  //   subcategory: 'white-prawns',
  //   weight: '1kg',
  //   pieces: '20-30 Pieces',
  //   serves: '3-4 approx',
  //   price: 449,
  //   originalPrice: 898,
  //   discount: 50,
  //   images: [
  //     'https://i.ibb.co/sJbRXPLX/prawn1.jpg',
  //     'https://i.ibb.co/r2dZ46kR/prawn2.jpg',
  //     'https://i.ibb.co/Q3z36H7s/prawn3.jpg',
  //   ],
  //   badge: 'bestseller',
  //   inStock: true,
  //   stockQty: 45,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Sea-water variety',
  //     'fresh taste',
  //     'Medium size',
  //     'Versatile cooking',
  //   ],
  // },
  // {
  //   id: 'p9',
  //   name: 'Tickrokerr fish small size',
  //   description: 'Premium quality',
  //   category: 'fish',
  //   subcategory: 'seawater',
  //   weight: '1kg',
  //   pieces: '10-12 approx',
  //   serves: '3-4 approx',
  //   price: 200,
  //   originalPrice: 300,
  //   discount: 33,
  //   images: ['https://i.ibb.co/3VnpzSn/Tickrokerr.jpg'],
  //   badge: 'premium',
  //   inStock: true,
  //   stockQty: 12,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: ['Party special', 'Impressive presentation', 'Succulent taste'],
  // },
  // // Crabs Products
  // {
  //   id: 'p10',
  //   name: 'Fresh rohu ( લાલિયો રવ )',
  //   description: 'Fresh supreme quality',
  //   category: 'fish',
  //   subcategory: 'freshwater',
  //   weight: '500g',
  //   pieces: '1 Piece',
  //   serves: '2',
  //   price: 799,
  //   originalPrice: 899,
  //   discount: 11,
  //   images: [
  //     'https://i.ibb.co/vxRKSNrS/rohu.jpg',
  //     'https://i.ibb.co/p6f60vLx/rohu2.jpg',
  //   ],
  //   badge: 'premium',
  //   inStock: true,
  //   stockQty: 10,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Live & fresh',
  //     'Sweet crab meat',
  //     'Full of roe',
  //     'Restaurant quality',
  //   ],
  // },
  // {
  //   id: 'p11',
  //   name: 'Pangasius fresh fish ( Basa fish , pangas fish )',
  //   description: 'Tender blue crab, perfect for crab curry',
  //   category: 'fish',
  //   subcategory: 'freshwater',
  //   weight: '1kg',
  //   pieces: '6-7 Pieces',
  //   serves: '3-4 approx',
  //   price: 130,
  //   originalPrice: 260,
  //   discount: 50,
  //   images: ['https://i.ibb.co/SDrj5sNm/Pangasius.jpg'],
  //   badge: '',
  //   inStock: true,
  //   stockQty: 20,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Tender meat',
  //     'Great for curry',
  //     'Sweet flavor',
  //     'Easy to cook',
  //   ],
  // },
  // // Squid Products
  // {
  //   id: 'p12',
  //   name: 'Fresh roopchand ( Chinese halwa ) lal pari',
  //   description: 'best quality',
  //   category: 'fish',
  //   subcategory: 'freshwater',
  //   weight: '1kg',
  //   pieces: '6-7 approx',
  //   serves: '3-4',
  //   price: 140,
  //   originalPrice: 280,
  //   discount: 50,
  //   images: [
  //     'https://i.ibb.co/SDSM1rh9/roopchand.jpg',
  //     'https://i.ibb.co/3YNPVCw7/roopchand2.jpg',
  //   ],
  //   badge: '',
  //   inStock: true,
  //   stockQty: 35,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: ['Tender texture', 'Quick cooking', 'Great for calamari'],
  // },
  // {
  //   id: 'p13',
  //   name: 'Fresh Catla rohu ( bhakuda )',
  //   description: 'A1 Grade quality, fresh-water fish',
  //   category: 'fish',
  //   subcategory: 'freshwater',
  //   weight: '1kg',
  //   pieces: '6-8 Pieces',
  //   serves: '3-4 approx',
  //   price: 130,
  //   originalPrice: 260,
  //   discount: 50,
  //   images: ['https://i.ibb.co/1tw9YK60/cutla.jpg'],
  //   badge: 'new',
  //   inStock: true,
  //   stockQty: 15,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: ['Tender & delicious', 'Restaurant favorite', 'Easy to cook'],
  // },
  // // Ready to Cook
  // {
  //   id: 'p14',
  //   name: 'Kolkata bhetki ( sea fish )',
  //   description: 'fresh water fish',
  //   category: 'fish',
  //   subcategory: 'freshwater',
  //   weight: '1kg',
  //   pieces: '4-5 approx',
  //   serves: '3-4 approx',
  //   price: 150,
  //   originalPrice: 300,
  //   discount: 50,
  //   images: [
  //     'https://i.ibb.co/xt7CQLck/kolkata.jpg',
  //     'https://i.ibb.co/B5s8Q0vT/kalkata.jpg',
  //   ],
  //   badge: 'bestseller',
  //   inStock: false,
  //   stockQty: 25,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: ['Just fry & serve', 'Authentic taste'],
  // },
  // {
  //   id: 'p15',
  //   name: 'Fresh Catla rohu ( bhakuda )',
  //   description: 'fresh water fish',
  //   category: 'fish',
  //   subcategory: 'freshwater',
  //   weight: '1kg',
  //   pieces: '5-6 Pieces',
  //   serves: '3-4 approx',
  //   price: 130,
  //   originalPrice: 260,
  //   discount: 50,
  //   images: [
  //     'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80',
  //   ],
  //   badge: '',
  //   inStock: true,
  //   stockQty: 30,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Tandoori marinated',
  //     'Grill or bake',
  //     'Restaurant style',
  //     'Juicy & flavorful',
  //   ],
  // },
  // {
  //   id: 'p16',
  //   name: 'Fresh Mirgall rohu ( મિર્ગલ રોહુ )',
  //   description: 'freshwater fish',
  //   category: 'fish',
  //   subcategory: 'freshwater',
  //   weight: '1kg',
  //   pieces: '4-5 approx',
  //   serves: '3-4 approx',
  //   price: 100,
  //   originalPrice: 200,
  //   discount: 50,
  //   images: ['https://i.ibb.co/jPJLhw1B/Mirgall.jpg'],
  //   badge: '',
  //   inStock: true,
  //   stockQty: 20,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Perfect curry cut',
  //     'Fresh surmai',
  //     'Bone-in for flavor',
  //     'Ready to cook',
  //   ],
  // },
  // // Combos
  // {
  //   id: 'p17',
  //   name: 'Seafood Family Pack',
  //   description: 'Assorted seafood combo for the whole family',
  //   category: 'combos',
  //   subcategory: 'family-pack',
  //   weight: '1.5kg',
  //   pieces: 'Assorted',
  //   serves: '5-6',
  //   price: 1499,
  //   originalPrice: 1799,
  //   discount: 17,
  //   images: [
  //     'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=400&q=80',
  //   ],
  //   badge: 'bestseller',
  //   inStock: false,
  //   stockQty: 15,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Fish + Prawns + Squid',
  //     'Great value',
  //     'Family size',
  //     'Variety pack',
  //   ],
  // },
  // {
  //   id: 'p18',
  //   name: 'Party Starter Combo',
  //   description: 'Perfect for parties - prawns, squid & fish fingers',
  //   category: 'combos',
  //   subcategory: 'party-pack',
  //   weight: '1kg',
  //   pieces: 'Assorted',
  //   serves: '6-8',
  //   price: 1199,
  //   originalPrice: 1399,
  //   discount: 14,
  //   images: [
  //     'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=400&q=80',
  //   ],
  //   badge: 'new',
  //   inStock: false,
  //   stockQty: 10,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Party ready',
  //     'Easy to cook',
  //     'Crowd pleaser',
  //     'Great appetizers',
  //   ],
  // },
  // // Specials
  // {
  //   id: 'p19',
  //   name: 'Sashimi Grade Tuna',
  //   description: 'Premium yellowfin tuna, sashimi quality',
  //   category: 'specials',
  //   subcategory: 'sashimi',
  //   weight: '250g',
  //   pieces: '1 Block',
  //   serves: '2',
  //   price: 1599,
  //   originalPrice: 1899,
  //   discount: 16,
  //   images: [
  //     'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&q=80',
  //   ],
  //   badge: 'premium',
  //   inStock: false,
  //   stockQty: 5,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Sashimi grade',
  //     'Yellowfin tuna',
  //     'Restaurant quality',
  //     'Flash frozen',
  //   ],
  // },
  // {
  //   id: 'p20',
  //   name: 'Lobster Tail - Premium',
  //   description: 'Imported lobster tail, perfect for special occasions',
  //   category: 'specials',
  //   subcategory: 'premium-cuts',
  //   weight: '200g',
  //   pieces: '1 Tail',
  //   serves: '1-2',
  //   price: 1999,
  //   originalPrice: 2299,
  //   discount: 13,
  //   images: [
  //     'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&q=80',
  //   ],
  //   badge: 'premium',
  //   inStock: false,
  //   stockQty: 3,
  //   deliveryTime: 'Tomorrow 6AM - 8AM',
  //   highlights: [
  //     'Premium lobster',
  //     'Imported quality',
  //     'Special occasions',
  //     'Succulent meat',
  //   ],
  // },
]

// Hero Banner Data (Admin Configurable)
let heroBanners = [
  {
    id: 'h1',
    image:
      'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80',
    title: 'Premium Prawns',
    subtitle: 'Freshwater & Seawater varieties',
    badge: 'Fresh Today',
    price: 'Starting ₹449',
    linkType: 'category',
    linkId: 'prawns',
    active: true,
  },
  {
    id: 'h2',
    image:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    title: 'Wild Caught Fish',
    subtitle: 'Same-day catch delivery',
    badge: 'Bestseller',
    price: 'Starting ₹199',
    linkType: 'category',
    linkId: 'fish',
    active: true,
  },
  //   {
  //     id: 'h3',
  //     image:
  //       'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80',
  //     title: 'Live Crabs',
  //     subtitle: 'Mud crabs & Blue crabs',
  //     badge: 'Premium',
  //     price: 'Starting ₹449',
  //     linkType: 'category',
  //     linkId: 'crabs',
  //     active: true,
  //   },
]

// Users Data
const users = [
  {
    id: 'u1',
    name: 'Rahul Sharma',
    phone: '+91 9876543210',
    email: 'rahul@example.com',
    addresses: [
      {
        id: 'a1',
        type: 'Home',
        address: '21/1, KPWD Quarters, Ananda Puram, Jeevanbhima Nagar',
        city: 'Bangalore',
        pincode: '560075',
        isDefault: true,
      },
      {
        id: 'a2',
        type: 'Office',
        address: 'Tech Park, Outer Ring Road',
        city: 'Bangalore',
        pincode: '560103',
        isDefault: false,
      },
    ],
    walletBalance: 250,
    createdAt: '2024-01-15',
  },
  {
    id: 'u2',
    name: 'Priya Patel',
    phone: '+91 9988776655',
    email: 'priya@example.com',
    addresses: [
      {
        id: 'a3',
        type: 'Home',
        address: '45, Sea View Apartments, Bandra West',
        city: 'Mumbai',
        pincode: '400050',
        isDefault: true,
      },
    ],
    walletBalance: 0,
    createdAt: '2024-02-20',
  },
  {
    id: 'u3',
    name: 'Amit Kumar',
    phone: '+91 8877665544',
    email: 'amit@example.com',
    addresses: [
      {
        id: 'a4',
        type: 'Home',
        address: '78, Salt Lake, Sector V',
        city: 'Kolkata',
        pincode: '700091',
        isDefault: true,
      },
    ],
    walletBalance: 100,
    createdAt: '2024-03-01',
  },
]

// Orders Data
let orders = [
  {
    id: 'ORD001',
    userId: 'u1',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 9876543210',
    address:
      '21/1, KPWD Quarters, Ananda Puram, Jeevanbhima Nagar, Bangalore - 560075',
    items: [
      {
        productId: 'p7',
        name: 'Tiger Prawns - Large',
        quantity: 2,
        price: 649,
        image:
          'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=100&q=80',
      },
      {
        productId: 'p1',
        name: 'White Pomfret - Whole Cleaned',
        quantity: 1,
        price: 599,
        image:
          'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=100&q=80',
      },
    ],
    itemTotal: 1897,
    deliveryFee: 39,
    packingFee: 10,
    gst: 95,
    discount: 30,
    totalAmount: 2011,
    deliverySlot: 'Tomorrow 6AM - 8AM',
    deliveryType: 'standard',
    status: 'confirmed',
    paymentMethod: 'COD',
    createdAt: '2024-03-17T10:30:00',
    confirmedAt: '2024-03-17T10:35:00',
    deliveredAt: null,
  },
  {
    id: 'ORD002',
    userId: 'u2',
    customerName: 'Priya Patel',
    customerPhone: '+91 9988776655',
    address: '45, Sea View Apartments, Bandra West, Mumbai - 400050',
    items: [
      {
        productId: 'p4',
        name: 'Salmon - Norwegian Fillet',
        quantity: 1,
        price: 1299,
        image:
          'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=100&q=80',
      },
      {
        productId: 'p12',
        name: 'Squid Rings - Cleaned',
        quantity: 1,
        price: 399,
        image:
          'https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=100&q=80',
      },
    ],
    itemTotal: 1698,
    deliveryFee: 0,
    packingFee: 10,
    gst: 85,
    discount: 340,
    totalAmount: 1453,
    deliverySlot: 'Today 2PM - 4PM',
    deliveryType: 'express',
    status: 'delivered',
    paymentMethod: 'Online',
    createdAt: '2024-03-16T14:20:00',
    confirmedAt: '2024-03-16T14:22:00',
    deliveredAt: '2024-03-16T15:45:00',
  },
  {
    id: 'ORD003',
    userId: 'u3',
    customerName: 'Amit Kumar',
    customerPhone: '+91 8877665544',
    address: '78, Salt Lake, Sector V, Kolkata - 700091',
    items: [
      {
        productId: 'p17',
        name: 'Seafood Family Pack',
        quantity: 1,
        price: 1499,
        image:
          'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=100&q=80',
      },
    ],
    itemTotal: 1499,
    deliveryFee: 39,
    packingFee: 15,
    gst: 75,
    discount: 0,
    totalAmount: 1628,
    deliverySlot: 'Tomorrow 6AM - 8AM',
    deliveryType: 'standard',
    status: 'pending',
    paymentMethod: 'COD',
    createdAt: '2024-03-17T16:45:00',
    confirmedAt: null,
    deliveredAt: null,
  },
  {
    id: 'ORD004',
    userId: 'u1',
    customerName: 'Rahul Sharma',
    customerPhone: '+91 9876543210',
    address:
      '21/1, KPWD Quarters, Ananda Puram, Jeevanbhima Nagar, Bangalore - 560075',
    items: [
      {
        productId: 'p10',
        name: 'Mud Crab - Live',
        quantity: 2,
        price: 799,
        image:
          'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=100&q=80',
      },
    ],
    itemTotal: 1598,
    deliveryFee: 39,
    packingFee: 20,
    gst: 80,
    discount: 160,
    totalAmount: 1577,
    deliverySlot: 'Tomorrow 8AM - 10AM',
    deliveryType: 'standard',
    status: 'cancelled',
    paymentMethod: 'Online',
    createdAt: '2024-03-15T09:00:00',
    confirmedAt: '2024-03-15T09:05:00',
    cancelledAt: '2024-03-15T10:30:00',
    cancelReason: 'Customer request',
  },
]

// Cart Data
let cart = {
  items: [],
  couponCode: null,
  couponDiscount: 0,
}

// Current User (for demo)
let currentUser = {
  id: 'guest',
  name: '',
  phone: '',
  isLoggedIn: false,
}

// Delivery Location
let deliveryLocation = {
  address: 'Set-Location',
  pincode: 'Set-Pincode',
  city: 'Surat',
}

// Coupons
const coupons = [
  {
    code: 'FRESH20',
    discount: 20,
    type: 'percentage',
    minOrder: 500,
    maxDiscount: 200,
    description: '20% off up to ₹200',
  },
  {
    code: 'FIRST50',
    discount: 50,
    type: 'percentage',
    minOrder: 300,
    maxDiscount: 150,
    description: '50% off up to ₹150 (First order)',
  },
  {
    code: 'FLAT100',
    discount: 100,
    type: 'flat',
    minOrder: 800,
    maxDiscount: 100,
    description: 'Flat ₹100 off',
  },
]

// Delivery Options
const deliveryOptions = [
  {
    id: 'Porter',
    name: 'Porter',
    description: 'Porter will deliever your order',
    fee: 0,
  },
  //   {
  //     id: 'standard',
  //     name: 'Standard Delivery',
  //     description: 'Tomorrow 6AM - 8AM',
  //     fee: 39,
  //   },
  //   {
  //     id: 'scheduled',
  //     name: 'Scheduled Delivery',
  //     description: 'Choose your preferred slot',
  //     fee: 29,
  //   },
]

// Reports Data (for Admin Dashboard)
const reportsData = {
  totalRevenue: 156780,
  totalOrders: 342,
  totalCustomers: 128,
  averageOrderValue: 458,
  revenueGrowth: 12.5,
  orderGrowth: 8.3,
  customerGrowth: 15.2,
  dailyRevenue: [
    { date: '2024-03-11', revenue: 18500 },
    { date: '2024-03-12', revenue: 22300 },
    { date: '2024-03-13', revenue: 19800 },
    { date: '2024-03-14', revenue: 25600 },
    { date: '2024-03-15', revenue: 21200 },
    { date: '2024-03-16', revenue: 28900 },
    { date: '2024-03-17', revenue: 20480 },
  ],
  topProducts: [
    { id: 'p7', name: 'Tiger Prawns - Large', sales: 156, revenue: 101244 },
    {
      id: 'p1',
      name: 'White Pomfret - Whole Cleaned',
      sales: 134,
      revenue: 80266,
    },
    { id: 'p14', name: 'Fish Fry Masala - Pomfret', sales: 98, revenue: 48902 },
    { id: 'p17', name: 'Seafood Family Pack', sales: 45, revenue: 67455 },
    {
      id: 'p3',
      name: 'Surmai (King Fish) - Steaks',
      sales: 67,
      revenue: 50183,
    },
  ],
  ordersByStatus: {
    pending: 12,
    confirmed: 28,
    delivered: 298,
    cancelled: 4,
  },
}

// Export data for use in app.js
window.appData = {
  categories,
  products,
  heroBanners,
  users,
  orders,
  cart,
  currentUser,
  deliveryLocation,
  coupons,
  deliveryOptions,
  reportsData,
}
