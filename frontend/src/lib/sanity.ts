import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

// Sanity client — reads from env variables
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "zm4xq3z1",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  useCdn: false, // Set to false if you are getting "Request error" or CORS issues
  apiVersion: "2024-01-01",
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return builder.image(source as any);
}

// GROQ Queries
export const PRODUCT_QUERY = `*[_type == "product"] | order(isSponsored desc, _createdAt desc) {
  _id,
  name,
  slug,
  "imageUrl": image.asset->url,
  description,
  price,
  originalPrice,
  discount,
  category,
  seller,
  rating,
  reviews,
  isSponsored,
  inStock,
  tags,
  features,
  specifications,
  targetDiseases
}`;

export const PRODUCTS_BY_DISEASE_QUERY = `*[_type == "product" && (
  (defined(targetDiseases) && $diseaseName in targetDiseases) ||
  name match $diseaseName ||
  (defined(tags) && length(tags[@ in $pesticides]) > 0)
)] | order(isSponsored desc, _createdAt desc)[0...10] {
  _id,
  name,
  slug,
  "imageUrl": image.asset->url,
  description,
  price,
  originalPrice,
  discount,
  category,
  seller,
  rating,
  reviews,
  isSponsored,
  inStock,
  tags,
  features,
  specifications,
  targetDiseases
}`;

export const DISEASE_CURE_QUERY = `*[_type == "diseaseCure"] | order(_createdAt desc) {
  _id,
  diseaseName,
  slug,
  "imageUrl": image.asset->url,
  affectedCrops,
  symptoms,
  description,
  cause,
  severity,
  cureSteps,
  pesticides,
  organicRemedies,
  preventionTips,
  season,
  region
}`;
