export const CATEGORIES = [
  {
    id: "bouquets",
    label: "Bouquets",
    singular: "Bouquet",
    subtitle: "L'élégance à porter, l'instant à offrir",
  },
  {
    id: "romantiques",
    label: "Créations Romantiques",
    singular: "Création Romantique",
    subtitle: "Pour les moments qui disent « je t'aime »",
  },
  {
    id: "compositions",
    label: "Compositions Élégantes",
    singular: "Composition Élégante",
    subtitle: "Vases, coffrets et paniers raffinés",
  },
  {
    id: "cadeaux",
    label: "Cadeaux Floraux",
    singular: "Cadeau Floral",
    subtitle: "Roses & douceurs pour surprendre",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [
  CategoryId,
  ...CategoryId[],
];

export type CatalogItem = {
  id: number;
  name: string;
  category: CategoryId;
  imageUrl: string;
  priceLabel: string;
  description: string;
  sortOrder: number;
  available: boolean;
  createdAt: string;
};

export type CatalogItemInput = {
  name: string;
  category: CategoryId;
  imageUrl: string;
  priceLabel: string;
  description: string;
  sortOrder: number;
  available: boolean;
};

export const WA_PHONE = "21652408825";
export const INSTAGRAM_URL = "https://www.instagram.com/fleuriste_omy_fleur";
export const MAPS_SAHLOUL = "https://maps.app.goo.gl/vvruSKf3TavkFxsXA";
export const MAPS_HAMMAM = "https://maps.app.goo.gl/WABDtomGMR8XjNJm6";
export const DEFAULT_PRICE_LABEL = "Exclusivité O'my Fleur";

export function categoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

export function waOrderUrl(name: string) {
  const message = `Bonjour Fleuriste O'my Fleur, est-ce que cette création [${name}] est disponible ?`;
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(message)}`;
}

export function parseCategory(value: string): CategoryId {
  return isCategoryId(value) ? value : "bouquets";
}
