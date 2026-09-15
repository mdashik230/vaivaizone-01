import { Smartphone, Shirt, ShoppingBasket } from "lucide-react";
import React from 'react';
import { Product } from './types';

export const ALL_PRODUCTS: Product[] = [
  { id: "1", name: "Premium Smartphone X", price: 85000, category: "Smartphones", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400", stock: 12 },
  { id: "2", name: "Super AMOLED Phone", price: 45000, category: "Smartphones", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=400", stock: 18 },
  { id: "3", name: "Sport Smartwatch Pro", price: 5500, category: "Smartwatches", image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400", stock: 25 },
  { id: "4", name: "Noise Cancelling Headphones", price: 12000, category: "Headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400", stock: 15 },
  { id: "5", name: "Ultra Power Bank 20k", price: 3500, category: "Power Banks", image: "https://images.unsplash.com/photo-1609592424109-dd0369877478?auto=format&fit=crop&q=80&w=400", stock: 30 },
  { 
    id: "6", 
    name: "Modern Denim Jeans", 
    price: 1800, 
    category: "Fashion & Lifestyle", 
    subCategory: "Men's Wear", 
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=400",
    description: "High-quality stretchable denim jeans for men. Perfect for casual wear and outdoor activities. Breathable fabric and durable stitching.",
    specifications: "Material: 98% Cotton 2% Spandex, Fit: Slim Fit, Color: Dark Blue",
    gallery: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1475178626620-a4d074967452?auto=format&fit=crop&q=80&w=400"
    ],
    colors: ["Black", "Blue", "Gray"],
    sizes: ["30", "32", "34", "36"],
    stock: 20
  },
  { 
    id: "7", 
    name: "Summer Floral Dress", 
    price: 2500, 
    category: "Fashion & Lifestyle", 
    subCategory: "Women's Wear", 
    image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=400",
    description: "Beautiful summer floral dress with soft fabric and elegant design. Ideal for beach parties, picnics, and summer outings.",
    specifications: "Fabric: Rayon, Length: Knee Length, Pattern: Floral Print",
    gallery: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=400"
    ],
    colors: ["Pink", "Yellow", "White"],
    sizes: ["S", "M", "L"],
    stock: 14
  },
  // Adding products from FeaturedProducts
  { id: "101", name: "Noise ColorFit Pulse Grand", price: 1850, originalPrice: 2500, image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400", category: "Smartwatches", discount: "26% Off", isNew: true, stock: 22 },
  { id: "102", name: "Classic Denim Jacket", price: 3200, originalPrice: 4000, image: "https://images.unsplash.com/photo-1576905066962-18e001767664?auto=format&fit=crop&q=80&w=400", category: "Men's Wear", discount: "20% Off", stock: 16 },
  { id: "104", name: "Bluetooth Wireless Mouse", price: 850, originalPrice: 1200, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&q=80&w=400", category: "Gadgets", isNew: true, stock: 40 },
  { id: "105", name: "Premium Cotton T-Shirt", price: 1200, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400", category: "Men's Wear", stock: 35 },
  { id: "107", name: "JBL Flip 6 Speaker", price: 8500, originalPrice: 10500, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=400", category: "Gadgets", discount: "Best Seller", stock: 10 },
  { id: "108", name: "Casual Sneakers", price: 4500, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400", category: "Footwear", isNew: true, stock: 15 },
];

export const CATEGORY_DATA: Record<string, any> = {
  "gadgets-accessories": {
    name: "Gadgets & Accessories",
    image: "https://images.unsplash.com/photo-1546054452-963030310217?auto=format&fit=crop&q=80&w=1200",
    subcategories: [
      { name: "Smartphones", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400" },
      { name: "Smartwatches", image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=400" },
      { name: "Headphones", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400" },
      { name: "Power Banks", image: "https://images.unsplash.com/photo-1609592424109-dd0369877478?auto=format&fit=crop&q=80&w=400" },
      { name: "Laptops", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=400" },
      { name: "Gaming Gear", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400" }
    ]
  },
  "fashion-lifestyle": {
    name: "Fashion & Lifestyle",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200",
    subcategories: [
      { name: "Men's Wear", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&q=80&w=400" },
      { name: "Women's Wear", image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=400" },
      { name: "Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400" },
      { name: "Watches", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400" }
    ]
  }
};
