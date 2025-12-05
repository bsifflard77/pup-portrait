// Types
export * from './types';

// Breeds
export * from './breeds';

// Pricing
export * from './pricing';

// Dog name generator for portraits
const DOG_NAMES = [
  'Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 'Buddy',
  'Sadie', 'Rocky', 'Molly', 'Tucker', 'Bailey', 'Duke', 'Lola', 'Bear',
  'Sophie', 'Zeus', 'Chloe', 'Bentley', 'Stella', 'Milo', 'Penny', 'Oscar',
  'Rosie', 'Leo', 'Ruby', 'Winston', 'Maggie', 'Murphy', 'Coco', 'Finn',
  'Olive', 'Teddy', 'Willow', 'Louie', 'Nala', 'Jasper', 'Pepper', 'Thor',
];

export function getRandomDogName(): string {
  return DOG_NAMES[Math.floor(Math.random() * DOG_NAMES.length)];
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Constants
export const APP_NAME = 'Pup Portrait';
export const APP_DOMAIN = 'favorite-dog.com';
export const SUPPORT_EMAIL = 'support@favorite-dog.com';

// Image constants
export const IMAGE_SIZES = {
  THUMBNAIL: 256,
  STANDARD: 512,
  HD: 1024,
  ULTRA: 2048,
} as const;
