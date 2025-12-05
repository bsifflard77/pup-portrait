export interface Breed {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
}

export const BREEDS: Breed[] = [
  // Standard breeds (free)
  { id: 'random', name: 'Random Breed', description: 'Let AI surprise you with a random breed', isPremium: false },
  { id: 'golden-retriever', name: 'Golden Retriever', description: 'Friendly, intelligent, and devoted', isPremium: false },
  { id: 'labrador', name: 'Labrador Retriever', description: 'Outgoing, active, and friendly', isPremium: false },
  { id: 'german-shepherd', name: 'German Shepherd', description: 'Confident, courageous, and smart', isPremium: false },
  { id: 'bulldog', name: 'Bulldog', description: 'Calm, courageous, and friendly', isPremium: false },
  { id: 'poodle', name: 'Poodle', description: 'Proud, active, and very smart', isPremium: false },
  { id: 'beagle', name: 'Beagle', description: 'Merry, friendly, and curious', isPremium: false },
  { id: 'rottweiler', name: 'Rottweiler', description: 'Loyal, loving, and confident guardian', isPremium: false },
  { id: 'yorkshire-terrier', name: 'Yorkshire Terrier', description: 'Affectionate, sprightly, and tomboyish', isPremium: false },
  { id: 'dachshund', name: 'Dachshund', description: 'Clever, lively, and courageous', isPremium: false },
  { id: 'siberian-husky', name: 'Siberian Husky', description: 'Loyal, outgoing, and mischievous', isPremium: false },
  { id: 'boxer', name: 'Boxer', description: 'Fun-loving, bright, and active', isPremium: false },
  { id: 'shih-tzu', name: 'Shih Tzu', description: 'Affectionate, playful, and outgoing', isPremium: false },
  { id: 'corgi', name: 'Corgi', description: 'Affectionate, smart, and alert', isPremium: false },
  { id: 'french-bulldog', name: 'French Bulldog', description: 'Adaptable, playful, and smart', isPremium: false },

  // Premium breeds
  { id: 'bernese-mountain-dog', name: 'Bernese Mountain Dog', description: 'Good-natured, calm, and strong', isPremium: true },
  { id: 'st-bernard', name: 'St. Bernard', description: 'Watchful, patient, and gentle giant', isPremium: true },
  { id: 'great-dane', name: 'Great Dane', description: 'Friendly, patient, and dependable', isPremium: true },
  { id: 'samoyed', name: 'Samoyed', description: 'Adaptable, friendly, and gentle', isPremium: true },
  { id: 'akita', name: 'Akita', description: 'Courageous, dignified, and profoundly loyal', isPremium: true },
  { id: 'australian-shepherd', name: 'Australian Shepherd', description: 'Smart, work-oriented, and exuberant', isPremium: true },
  { id: 'border-collie', name: 'Border Collie', description: 'Affectionate, smart, and energetic', isPremium: true },
  { id: 'cavalier-king-charles', name: 'Cavalier King Charles Spaniel', description: 'Affectionate, gentle, and graceful', isPremium: true },
  { id: 'pomeranian', name: 'Pomeranian', description: 'Lively, bold, and inquisitive', isPremium: true },
  { id: 'dalmatian', name: 'Dalmatian', description: 'Dignified, smart, and outgoing', isPremium: true },
];

export const FREE_BREEDS = BREEDS.filter(b => !b.isPremium);
export const PREMIUM_BREEDS = BREEDS.filter(b => b.isPremium);

export function getBreedById(id: string): Breed | undefined {
  return BREEDS.find(b => b.id === id);
}

export function getRandomBreed(includePremium: boolean = false): Breed {
  const availableBreeds = includePremium ? BREEDS.filter(b => b.id !== 'random') : FREE_BREEDS.filter(b => b.id !== 'random');
  return availableBreeds[Math.floor(Math.random() * availableBreeds.length)];
}
