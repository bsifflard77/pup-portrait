export interface Breed {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
}

// 100 dog breeds - 15 free (most popular), 85 premium
export const BREEDS: Breed[] = [
  // ============================================
  // FREE BREEDS (15 most popular + random)
  // ============================================
  { id: 'random', name: 'Random Breed', description: 'Let AI surprise you with a random breed', isPremium: false },
  { id: 'beagle', name: 'Beagle', description: 'Merry, friendly, and curious', isPremium: false },
  { id: 'boxer', name: 'Boxer', description: 'Fun-loving, bright, and active', isPremium: false },
  { id: 'bulldog', name: 'Bulldog', description: 'Calm, courageous, and friendly', isPremium: false },
  { id: 'corgi', name: 'Corgi', description: 'Affectionate, smart, and alert', isPremium: false },
  { id: 'dachshund', name: 'Dachshund', description: 'Clever, lively, and courageous', isPremium: false },
  { id: 'french-bulldog', name: 'French Bulldog', description: 'Adaptable, playful, and smart', isPremium: false },
  { id: 'german-shepherd', name: 'German Shepherd', description: 'Confident, courageous, and smart', isPremium: false },
  { id: 'golden-retriever', name: 'Golden Retriever', description: 'Friendly, intelligent, and devoted', isPremium: false },
  { id: 'labrador', name: 'Labrador Retriever', description: 'Outgoing, active, and friendly', isPremium: false },
  { id: 'poodle', name: 'Poodle', description: 'Proud, active, and very smart', isPremium: false },
  { id: 'rottweiler', name: 'Rottweiler', description: 'Loyal, loving, and confident guardian', isPremium: false },
  { id: 'shih-tzu', name: 'Shih Tzu', description: 'Affectionate, playful, and outgoing', isPremium: false },
  { id: 'siberian-husky', name: 'Siberian Husky', description: 'Loyal, outgoing, and mischievous', isPremium: false },
  { id: 'yorkshire-terrier', name: 'Yorkshire Terrier', description: 'Affectionate, sprightly, and tomboyish', isPremium: false },

  // ============================================
  // PREMIUM BREEDS (85 breeds - alphabetical)
  // ============================================
  { id: 'affenpinscher', name: 'Affenpinscher', description: 'Confident, famously funny, and fearless', isPremium: true },
  { id: 'afghan-hound', name: 'Afghan Hound', description: 'Aloof, dignified, and aristocratic', isPremium: true },
  { id: 'airedale-terrier', name: 'Airedale Terrier', description: 'Friendly, clever, and courageous', isPremium: true },
  { id: 'akita', name: 'Akita', description: 'Courageous, dignified, and profoundly loyal', isPremium: true },
  { id: 'alaskan-malamute', name: 'Alaskan Malamute', description: 'Affectionate, loyal, and playful', isPremium: true },
  { id: 'american-bulldog', name: 'American Bulldog', description: 'Loyal, confident, and friendly', isPremium: true },
  { id: 'american-eskimo', name: 'American Eskimo Dog', description: 'Playful, perky, and smart', isPremium: true },
  { id: 'american-pit-bull', name: 'American Pit Bull Terrier', description: 'Confident, smart, and good-natured', isPremium: true },
  { id: 'australian-cattle-dog', name: 'Australian Cattle Dog', description: 'Alert, curious, and pleasant', isPremium: true },
  { id: 'australian-shepherd', name: 'Australian Shepherd', description: 'Smart, work-oriented, and exuberant', isPremium: true },
  { id: 'basenji', name: 'Basenji', description: 'Independent, smart, and poised', isPremium: true },
  { id: 'basset-hound', name: 'Basset Hound', description: 'Patient, low-key, and charming', isPremium: true },
  { id: 'belgian-malinois', name: 'Belgian Malinois', description: 'Confident, smart, and hardworking', isPremium: true },
  { id: 'bernedoodle', name: 'Bernedoodle', description: 'Goofy, gentle, and loyal', isPremium: true },
  { id: 'bernese-mountain-dog', name: 'Bernese Mountain Dog', description: 'Good-natured, calm, and strong', isPremium: true },
  { id: 'bichon-frise', name: 'Bichon Frise', description: 'Playful, curious, and peppy', isPremium: true },
  { id: 'bloodhound', name: 'Bloodhound', description: 'Friendly, independent, and inquisitive', isPremium: true },
  { id: 'border-collie', name: 'Border Collie', description: 'Affectionate, smart, and energetic', isPremium: true },
  { id: 'border-terrier', name: 'Border Terrier', description: 'Affectionate, happy, and plucky', isPremium: true },
  { id: 'boston-terrier', name: 'Boston Terrier', description: 'Friendly, bright, and amusing', isPremium: true },
  { id: 'bouvier-des-flandres', name: 'Bouvier des Flandres', description: 'Affectionate, courageous, and strong-willed', isPremium: true },
  { id: 'brittany', name: 'Brittany', description: 'Bright, fun-loving, and upbeat', isPremium: true },
  { id: 'brussels-griffon', name: 'Brussels Griffon', description: 'Loyal, alert, and curious', isPremium: true },
  { id: 'bull-terrier', name: 'Bull Terrier', description: 'Playful, charming, and mischievous', isPremium: true },
  { id: 'cairn-terrier', name: 'Cairn Terrier', description: 'Alert, cheerful, and busy', isPremium: true },
  { id: 'cane-corso', name: 'Cane Corso', description: 'Affectionate, intelligent, and majestic', isPremium: true },
  { id: 'cavalier-king-charles', name: 'Cavalier King Charles Spaniel', description: 'Affectionate, gentle, and graceful', isPremium: true },
  { id: 'chesapeake-bay-retriever', name: 'Chesapeake Bay Retriever', description: 'Affectionate, bright, and sensitive', isPremium: true },
  { id: 'chihuahua', name: 'Chihuahua', description: 'Charming, graceful, and sassy', isPremium: true },
  { id: 'chinese-crested', name: 'Chinese Crested', description: 'Affectionate, alert, and lively', isPremium: true },
  { id: 'chinese-shar-pei', name: 'Chinese Shar-Pei', description: 'Loyal, independent, and calm', isPremium: true },
  { id: 'chow-chow', name: 'Chow Chow', description: 'Dignified, bright, and serious-minded', isPremium: true },
  { id: 'cocker-spaniel', name: 'Cocker Spaniel', description: 'Gentle, smart, and happy', isPremium: true },
  { id: 'collie', name: 'Collie', description: 'Graceful, devoted, and proud', isPremium: true },
  { id: 'dalmatian', name: 'Dalmatian', description: 'Dignified, smart, and outgoing', isPremium: true },
  { id: 'doberman-pinscher', name: 'Doberman Pinscher', description: 'Loyal, fearless, and alert', isPremium: true },
  { id: 'english-cocker-spaniel', name: 'English Cocker Spaniel', description: 'Energetic, merry, and responsive', isPremium: true },
  { id: 'english-setter', name: 'English Setter', description: 'Friendly, mellow, and merry', isPremium: true },
  { id: 'english-springer-spaniel', name: 'English Springer Spaniel', description: 'Friendly, playful, and obedient', isPremium: true },
  { id: 'flat-coated-retriever', name: 'Flat-Coated Retriever', description: 'Cheerful, optimistic, and good-humored', isPremium: true },
  { id: 'german-shorthaired-pointer', name: 'German Shorthaired Pointer', description: 'Friendly, smart, and willing to please', isPremium: true },
  { id: 'giant-schnauzer', name: 'Giant Schnauzer', description: 'Loyal, alert, and trainable', isPremium: true },
  { id: 'goldendoodle', name: 'Goldendoodle', description: 'Friendly, intelligent, and accepting', isPremium: true },
  { id: 'great-dane', name: 'Great Dane', description: 'Friendly, patient, and dependable', isPremium: true },
  { id: 'great-pyrenees', name: 'Great Pyrenees', description: 'Smart, patient, and calm', isPremium: true },
  { id: 'greyhound', name: 'Greyhound', description: 'Gentle, independent, and noble', isPremium: true },
  { id: 'havanese', name: 'Havanese', description: 'Intelligent, outgoing, and funny', isPremium: true },
  { id: 'irish-setter', name: 'Irish Setter', description: 'Outgoing, sweet-natured, and active', isPremium: true },
  { id: 'irish-wolfhound', name: 'Irish Wolfhound', description: 'Courageous, dignified, and calm', isPremium: true },
  { id: 'italian-greyhound', name: 'Italian Greyhound', description: 'Playful, alert, and sensitive', isPremium: true },
  { id: 'jack-russell-terrier', name: 'Jack Russell Terrier', description: 'Lively, clever, and athletic', isPremium: true },
  { id: 'japanese-chin', name: 'Japanese Chin', description: 'Charming, noble, and loving', isPremium: true },
  { id: 'keeshond', name: 'Keeshond', description: 'Friendly, lively, and outgoing', isPremium: true },
  { id: 'kerry-blue-terrier', name: 'Kerry Blue Terrier', description: 'Smart, alert, and people-oriented', isPremium: true },
  { id: 'labradoodle', name: 'Labradoodle', description: 'Friendly, energetic, and good-natured', isPremium: true },
  { id: 'lhasa-apso', name: 'Lhasa Apso', description: 'Confident, smart, and comical', isPremium: true },
  { id: 'maltese', name: 'Maltese', description: 'Gentle, playful, and charming', isPremium: true },
  { id: 'mastiff', name: 'Mastiff', description: 'Courageous, dignified, and good-natured', isPremium: true },
  { id: 'miniature-pinscher', name: 'Miniature Pinscher', description: 'Fearless, fun-loving, and proud', isPremium: true },
  { id: 'miniature-schnauzer', name: 'Miniature Schnauzer', description: 'Friendly, smart, and obedient', isPremium: true },
  { id: 'newfoundland', name: 'Newfoundland', description: 'Sweet, patient, and devoted', isPremium: true },
  { id: 'norfolk-terrier', name: 'Norfolk Terrier', description: 'Alert, fearless, and fun-loving', isPremium: true },
  { id: 'old-english-sheepdog', name: 'Old English Sheepdog', description: 'Adaptable, gentle, and smart', isPremium: true },
  { id: 'papillon', name: 'Papillon', description: 'Friendly, alert, and happy', isPremium: true },
  { id: 'pekingese', name: 'Pekingese', description: 'Affectionate, loyal, and regal', isPremium: true },
  { id: 'pembroke-welsh-corgi', name: 'Pembroke Welsh Corgi', description: 'Smart, alert, and affectionate', isPremium: true },
  { id: 'pointer', name: 'Pointer', description: 'Loyal, hardworking, and even-tempered', isPremium: true },
  { id: 'pomeranian', name: 'Pomeranian', description: 'Lively, bold, and inquisitive', isPremium: true },
  { id: 'portuguese-water-dog', name: 'Portuguese Water Dog', description: 'Affectionate, adventurous, and athletic', isPremium: true },
  { id: 'pug', name: 'Pug', description: 'Charming, mischievous, and loving', isPremium: true },
  { id: 'rhodesian-ridgeback', name: 'Rhodesian Ridgeback', description: 'Affectionate, dignified, and even-tempered', isPremium: true },
  { id: 'saint-bernard', name: 'Saint Bernard', description: 'Playful, charming, and inquisitive', isPremium: true },
  { id: 'saluki', name: 'Saluki', description: 'Gentle, dignified, and independent', isPremium: true },
  { id: 'samoyed', name: 'Samoyed', description: 'Adaptable, friendly, and gentle', isPremium: true },
  { id: 'scottish-terrier', name: 'Scottish Terrier', description: 'Confident, independent, and spirited', isPremium: true },
  { id: 'shetland-sheepdog', name: 'Shetland Sheepdog', description: 'Playful, energetic, and bright', isPremium: true },
  { id: 'shiba-inu', name: 'Shiba Inu', description: 'Alert, active, and attentive', isPremium: true },
  { id: 'soft-coated-wheaten', name: 'Soft Coated Wheaten Terrier', description: 'Friendly, happy, and deeply devoted', isPremium: true },
  { id: 'staffordshire-bull-terrier', name: 'Staffordshire Bull Terrier', description: 'Clever, brave, and tenacious', isPremium: true },
  { id: 'standard-schnauzer', name: 'Standard Schnauzer', description: 'Fearless, smart, and spirited', isPremium: true },
  { id: 'tibetan-mastiff', name: 'Tibetan Mastiff', description: 'Independent, reserved, and intelligent', isPremium: true },
  { id: 'tibetan-terrier', name: 'Tibetan Terrier', description: 'Affectionate, sensitive, and clever', isPremium: true },
  { id: 'vizsla', name: 'Vizsla', description: 'Affectionate, gentle, and energetic', isPremium: true },
  { id: 'weimaraner', name: 'Weimaraner', description: 'Friendly, fearless, and obedient', isPremium: true },
  { id: 'welsh-terrier', name: 'Welsh Terrier', description: 'Friendly, spirited, and game', isPremium: true },
  { id: 'west-highland-terrier', name: 'West Highland White Terrier', description: 'Loyal, happy, and entertaining', isPremium: true },
  { id: 'whippet', name: 'Whippet', description: 'Affectionate, playful, and calm', isPremium: true },
  { id: 'wire-fox-terrier', name: 'Wire Fox Terrier', description: 'Alert, confident, and gregarious', isPremium: true },
];

export const FREE_BREEDS = BREEDS.filter(b => !b.isPremium);
export const PREMIUM_BREEDS = BREEDS.filter(b => b.isPremium);
export const ALL_BREEDS_SORTED = [...BREEDS].sort((a, b) => {
  // Random always first
  if (a.id === 'random') return -1;
  if (b.id === 'random') return 1;
  return a.name.localeCompare(b.name);
});

export function getBreedById(id: string): Breed | undefined {
  return BREEDS.find(b => b.id === id);
}

export function getRandomBreed(includePremium: boolean = false): Breed {
  const availableBreeds = includePremium
    ? BREEDS.filter(b => b.id !== 'random')
    : FREE_BREEDS.filter(b => b.id !== 'random');
  return availableBreeds[Math.floor(Math.random() * availableBreeds.length)];
}

// Search breeds by name (for premium type-to-search feature)
export function searchBreeds(query: string, includePremium: boolean = false): Breed[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const availableBreeds = includePremium ? ALL_BREEDS_SORTED : FREE_BREEDS;
  return availableBreeds.filter(b =>
    b.id !== 'random' && b.name.toLowerCase().includes(normalizedQuery)
  );
}

// Get breeds for dropdown (sorted, with random first)
export function getBreedsForDropdown(includePremium: boolean = false): Breed[] {
  if (includePremium) {
    return ALL_BREEDS_SORTED;
  }
  // Free users: return free breeds sorted with random first
  return [
    BREEDS.find(b => b.id === 'random')!,
    ...FREE_BREEDS.filter(b => b.id !== 'random').sort((a, b) => a.name.localeCompare(b.name))
  ];
}
