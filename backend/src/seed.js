/**
 * Seed script — populates MongoDB with categories & products
 * using real data scraped from omegadistribution.tn.
 *
 * Usage:
 *   cd backend && node src/seed.js
 *
 * Prerequisites:
 *   - MongoDB running, MONGODB_URI in .env
 *   - At least one admin user in the database (used as vendor for products)
 *   - sharp installed (already a project dependency)
 */

import "dotenv/config";
import mongoose from "mongoose";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { processProductImage } from "./utils/imageProcessor.js";
import Category from "./models/categoryModel.js";
import Product from "./models/productModel.js";
import User from "./models/userModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_ROOT = path.resolve(__dirname, "../../images/produits/images produits");
const UPLOADS_DIR = path.resolve(__dirname, "../uploads/products");
const CAT_UPLOADS_DIR = path.resolve(__dirname, "../uploads/categories");

// ─── CATEGORY DEFINITIONS ─────────────────────────────────────────────────────
// Structure matches omegadistribution.tn — top-level + subcategories
const CATEGORIES = [
  // Top-level
  { name: "Imprimantes & Consommables", description: "Imprimantes professionnelles et consommables d'impression", slug: "imprimantes-consommables", parent: null },
  { name: "Accessoires Photo & Studio", description: "Cadres, albums, produits de sublimation et équipements studio", slug: "accessoires-photo-studio", parent: null },
  { name: "Éclairage & Énergie", description: "Piles standards, boutons, rechargeables et lampes LED", slug: "eclairage-energie", parent: null },
  { name: "Stockage", description: "Cartes mémoire, clés USB, SSD portables et solutions de stockage", slug: "stockage", parent: null },

  // Subcategories under Imprimantes & Consommables
  { name: "Imprimantes", description: "Imprimantes photo professionnelles jet d'encre et sublimation", slug: "imprimantes", parent: "Imprimantes & Consommables" },
  { name: "Papier Photo", description: "Papier photo professionnel brillant, lustré et mat pour imprimantes Frontier", slug: "papier-photo", parent: "Imprimantes & Consommables" },
  { name: "Encres pour Imprimantes", description: "Cartouches d'encre authentiques pour imprimantes Fujifilm Frontier", slug: "encres-imprimantes", parent: "Imprimantes & Consommables" },
  { name: "Autres Consommables", description: "Blocs récupérateurs, cartouches de maintenance et chimie", slug: "autres-consommables", parent: "Imprimantes & Consommables" },

  // Subcategories under Accessoires Photo & Studio
  { name: "Cadres Photo", description: "Cadres photo en différentes tailles et finitions", slug: "cadres-photo", parent: "Accessoires Photo & Studio" },
  { name: "Albums Photo", description: "Albums photo de qualité pour conserver vos souvenirs", slug: "albums-photo", parent: "Accessoires Photo & Studio" },
  { name: "Produits à Sublimation", description: "Mugs et objets personnalisables par sublimation", slug: "produits-sublimation", parent: "Accessoires Photo & Studio" },
  { name: "Équipements Studio", description: "Fonds studio et équipements pour photographes professionnels", slug: "equipements-studio", parent: "Accessoires Photo & Studio" },

  // Subcategories under Éclairage & Énergie
  { name: "Piles Standards", description: "Piles alcalines AA, AAA, C, D et 9V des marques Varta et Energizer", slug: "piles-standards", parent: "Éclairage & Énergie" },
  { name: "Piles Boutons", description: "Piles boutons CR2016, CR2025, CR2032 et autres formats", slug: "piles-boutons", parent: "Éclairage & Énergie" },
  { name: "Piles Rechargeables", description: "Piles rechargeables et chargeurs Energizer et Varta", slug: "piles-rechargeables", parent: "Éclairage & Énergie" },
];

// ─── PRODUCT DEFINITIONS ───────────────────────────────────────────────────────
// Real data from omegadistribution.tn with descriptions and specs
const PRODUCTS = [
  // ═══════════════════════════════════════════════════════════════════════
  // IMPRIMANTES
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Imprimantes",
    name: "Imprimante Fujifilm Frontier DE100-XD",
    description: "Imprimante jet d'encre professionnelle avec technologie ViViDia D-photo. Résolution 1200 x 2400 dpi, formats de 89x50mm à 210x1000mm. Vitesse : 330 tirages/heure en mode standard (10x15cm en 10,8 secondes). Système d'encre 4 couleurs CMJN avec cartouches 200ml. Connectivité USB 2.0, compatible Mac et PC. Dimensions : 490L × 495P × 354H mm, poids 26,5 kg. Garantie 300 000 tirages ou 1 an.",
    price: 450000,
    compareAtPrice: null,
    stock: 5,
    sku: "DE100-XD-FUJI",
    imageDir: "DE100-XD",
    imageFiles: ["fuji-frontier-de100-xd.jpg", "pic-overview-01-fr2.jpg", "pic-overview-04-fr2.jpg", "pic-overview-05-fr2.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Résolution", value: "1200 x 2400 dpi" },
      { key: "Vitesse", value: "330 tirages/heure" },
      { key: "Formats", value: "89x50mm à 210x1000mm" },
      { key: "Encre", value: "ViViDia D-Photo 4 couleurs (CMJN)" },
      { key: "Connectivité", value: "USB 2.0" },
      { key: "Poids", value: "26,5 kg" },
    ],
  },
  {
    category: "Imprimantes",
    name: "Imprimante CY-02 Citizen 10x15/15x20",
    description: "Imprimante photo compacte Citizen CY-02 conçue pour une utilisation simple et intuitive. Configuration facile et changement de support rapide. Jusqu'à 700 impressions par rouleau en 10x15cm ou 350 en 15x20cm. Finitions brillante ou mate sélectionnables via le pilote. Bac de récupération pour tirages 10x15cm inclus.",
    price: 280000,
    compareAtPrice: null,
    stock: 3,
    sku: "CY-02PRINTER",
    imageDir: "imrimante sublimation",
    imageFiles: ["1.png", "2.png", "3.png"],
    attributes: [
      { key: "Marque", value: "Citizen" },
      { key: "Formats", value: "10x15cm, 15x20cm" },
      { key: "Capacité", value: "700 tirages/rouleau (10x15)" },
      { key: "Finitions", value: "Brillante, Mate" },
    ],
  },
  {
    category: "Imprimantes",
    name: "Presse à Chaud Multifonction 8 en 1",
    description: "Presse à chaud multifonction 8 en 1 permettant d'imprimer sur presque tout : t-shirts, tapis de souris, puzzles, bavoirs, gobelets, tasses, assiettes, casquettes, sacs, plaques et bien plus. Idéale pour la sublimation et le transfert thermique. Parfaite pour les créateurs et les entrepreneurs.",
    price: 85000,
    compareAtPrice: null,
    stock: 8,
    sku: "PRESS-8EN1",
    imageDir: "imrimante sublimation",
    imageFiles: ["4.png", "5.png", "6.png", "7.png"],
    attributes: [
      { key: "Type", value: "Presse à chaud 8 en 1" },
      { key: "Applications", value: "T-shirts, mugs, casquettes, assiettes, puzzles" },
      { key: "Technologie", value: "Sublimation / Transfert thermique" },
    ],
  },
  {
    category: "Imprimantes",
    name: "OMAJIC Traceur Eco-Solvant 1,8m",
    description: "Imprimante traceur grand format OMAJIC de 1,8m de largeur d'impression. Technologie éco-solvant pour des impressions durables et résistantes aux intempéries. Résolution jusqu'à 1440 dpi. Compatible avec bâches publicitaires, vinyles adhésifs, textiles, papier photo et toiles. Construction robuste pour une utilisation professionnelle intensive.",
    price: 650000,
    compareAtPrice: null,
    stock: 2,
    sku: "OMAJIC-P1800ES",
    imageDir: "imprimante eco solvant",
    imageFiles: ["1.png", "2.png", "3.png", "4.png", "5.png"],
    attributes: [
      { key: "Marque", value: "OMAJIC" },
      { key: "Largeur", value: "1,8 m" },
      { key: "Résolution", value: "Jusqu'à 1440 dpi" },
      { key: "Technologie", value: "Éco-solvant" },
      { key: "Supports", value: "Bâches, vinyles, textiles, toiles" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ENCRES POUR IMPRIMANTES — Frontier DE100
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Cyan - Frontier DE100 - 200ml",
    description: "Cartouche d'encre cyan de 200ml spécialement conçue pour offrir des résultats d'impression de qualité professionnelle sur les imprimantes photo professionnelles Fujifilm Frontier DE100/DE100-XD. Idéale pour imprimer de nombreux tirages de haute qualité.",
    price: 15000,
    compareAtPrice: null,
    stock: 20,
    sku: "31016562907",
    imageDir: "encre fujifilm/DE + maintenance",
    imageFiles: ["cyan-pour-frontier-de100-200ml.jpg", "cartouche-encre-fuji-frontier-de-100-cyan-200ml-31016562907.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Cyan" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DE100 / DE100-XD" },
    ],
  },
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Magenta - Frontier DE100 - 200ml",
    description: "Cartouche d'encre magenta de 200ml spécialement conçue pour les imprimantes photo professionnelles Fujifilm Frontier DE100/DE100-XD. Qualité professionnelle garantie.",
    price: 15000,
    compareAtPrice: null,
    stock: 20,
    sku: "31016562919",
    imageDir: "encre fujifilm/DE + maintenance",
    imageFiles: ["magenta-pour-frontier-de100-200ml.jpg", "cartouche-encre-fuji-frontier-de-100-magenta-200ml-31016562919.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Magenta" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DE100 / DE100-XD" },
    ],
  },
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Jaune - Frontier DE100 - 200ml",
    description: "Cartouche d'encre jaune de 200ml pour imprimantes photo Fujifilm Frontier DE100/DE100-XD. Résultats de qualité professionnelle pour vos tirages photo.",
    price: 15000,
    compareAtPrice: null,
    stock: 20,
    sku: "31016562921",
    imageDir: "encre fujifilm/DE + maintenance",
    imageFiles: ["jaune-pour-frontier-de100-200ml.jpg", "cartouche-encre-fuji-frontier-de-100-jaune-200ml-31016562921.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Jaune" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DE100 / DE100-XD" },
    ],
  },
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Noir - Frontier DE100 - 200ml",
    description: "Cartouche d'encre noire de 200ml pour imprimantes photo Fujifilm Frontier DE100/DE100-XD. Encre ViViDia D-Photo pour des noirs profonds et des détails nets.",
    price: 15000,
    compareAtPrice: null,
    stock: 20,
    sku: "31016562933",
    imageDir: "encre fujifilm/DE + maintenance",
    imageFiles: ["noir-pour-frontier-de100-200ml.jpg", "cartouche-encre-fuji-frontier-de-100-noir-200ml-31016562933.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Noir" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DE100 / DE100-XD" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ENCRES POUR IMPRIMANTES — Frontier DX100
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Cyan - Frontier DX100 - 200ml",
    description: "Cartouche d'encre cyan de 200ml spécialement conçue pour offrir des résultats d'impression de qualité professionnelle sur l'imprimante Fujifilm Frontier DX100.",
    price: 16000,
    compareAtPrice: null,
    stock: 15,
    sku: "3100100111582",
    imageDir: "encre fujifilm/DX + maintenance",
    imageFiles: ["fuji-encre-frontier-s-dx-100-cyan-200ml-3100100111582.jpg", "cartouche-d-encre-fuji-cyan-pour-dx100-200ml.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Cyan" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DX100" },
    ],
  },
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Magenta - Frontier DX100 - 200ml",
    description: "Cartouche d'encre magenta de 200ml pour l'imprimante Fujifilm Frontier DX100. Qualité d'impression professionnelle.",
    price: 16000,
    compareAtPrice: null,
    stock: 15,
    sku: "3100100111583",
    imageDir: "encre fujifilm/DX + maintenance",
    imageFiles: ["fuji-encre-frontier-s-dx-100-magenta-200ml-3100100111583.jpg", "cartouche-d-encre-fuji-magenta-pour-dx100-200ml.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Magenta" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DX100" },
    ],
  },
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Jaune - Frontier DX100 - 200ml",
    description: "Cartouche d'encre jaune de 200ml pour l'imprimante Fujifilm Frontier DX100.",
    price: 16000,
    compareAtPrice: null,
    stock: 15,
    sku: "3100100111584",
    imageDir: "encre fujifilm/DX + maintenance",
    imageFiles: ["fuji-encre-frontier-s-dx-100-jaune-200ml-3100100111584.jpg", "jaune-pour-frontier-dx100-200ml.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Jaune" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DX100" },
    ],
  },
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Noir - Frontier DX100 - 200ml",
    description: "Cartouche d'encre noire de 200ml pour l'imprimante Fujifilm Frontier DX100.",
    price: 16000,
    compareAtPrice: null,
    stock: 15,
    sku: "3100100111585",
    imageDir: "encre fujifilm/DX + maintenance",
    imageFiles: ["fuji-encre-frontier-s-dx-100-noir-200ml-3100100111585.jpg", "noir-pour-frontier-dx100-200ml.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Noir" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DX100" },
    ],
  },
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Rose - Frontier DX100 - 200ml",
    description: "Cartouche d'encre rose de 200ml pour l'imprimante Fujifilm Frontier DX100. Pour des tons chair et des dégradés subtils.",
    price: 16000,
    compareAtPrice: null,
    stock: 15,
    sku: "3100100111587",
    imageDir: "encre fujifilm/DX + maintenance",
    imageFiles: ["fuji-encre-frontier-s-dx-100-rose-200ml-3100100111587.jpg", "rose-pour-frontier-dx100-200ml.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Rose" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DX100" },
    ],
  },
  {
    category: "Encres pour Imprimantes",
    name: "Cartouche d'encre Bleu Ciel - Frontier DX100 - 200ml",
    description: "Cartouche d'encre bleu ciel de 200ml pour l'imprimante Fujifilm Frontier DX100. Pour des ciels éclatants et des tons froids précis.",
    price: 16000,
    compareAtPrice: null,
    stock: 15,
    sku: "3100100111586",
    imageDir: "encre fujifilm/DX + maintenance",
    imageFiles: ["fuji-encre-frontier-s-dx-100-bleu-ciel-200ml-3100100111586.jpg", "cartouche-d-encre-fuji-bleu-ciel-pour-dx100-200ml.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Couleur", value: "Bleu Ciel" },
      { key: "Volume", value: "200 ml" },
      { key: "Compatibilité", value: "Frontier DX100" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // AUTRES CONSOMMABLES
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Autres Consommables",
    name: "Bloc Récupérateur - Maintenance Frontier DE100",
    description: "Bloc récupérateur d'encre usagée FUJIFILM compatible avec le modèle Frontier DE100. Permet de récupérer l'encre usagée de votre matériel d'impression.",
    price: 8000,
    compareAtPrice: null,
    stock: 10,
    sku: "MAINT-DE100",
    imageDir: "FUJI autre conso/maintenance",
    imageFiles: ["de100.png", "de1002.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Type", value: "Bloc récupérateur" },
      { key: "Compatibilité", value: "Frontier DE100" },
    ],
  },
  {
    category: "Autres Consommables",
    name: "Bloc Récupérateur - Maintenance Frontier DE100-XD",
    description: "Bloc récupérateur d'encre usagée FUJIFILM compatible avec le modèle Frontier DE100-XD.",
    price: 8500,
    compareAtPrice: null,
    stock: 10,
    sku: "MAINT-DE100XD",
    imageDir: "FUJI autre conso/maintenance",
    imageFiles: ["de100xd1.png", "de100xd2.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Type", value: "Bloc récupérateur" },
      { key: "Compatibilité", value: "Frontier DE100-XD" },
    ],
  },
  {
    category: "Autres Consommables",
    name: "Bloc Récupérateur - Maintenance Frontier DX100",
    description: "Bloc récupérateur d'encre usagée FUJIFILM compatible avec le modèle Frontier DX100. Cartouche de maintenance essentielle.",
    price: 9000,
    compareAtPrice: null,
    stock: 10,
    sku: "16394996",
    imageDir: "FUJI autre conso/maintenance",
    imageFiles: ["dx1001.png", "dx1002.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Type", value: "Bloc récupérateur" },
      { key: "Compatibilité", value: "Frontier DX100" },
    ],
  },
  {
    category: "Autres Consommables",
    name: "Fujifilm CP-49 HVII PC-2 Cartridges",
    description: "Pack de 2 cartouches révélateur+blanchiment+fixage RA-4 pour processeur Fujifilm CP-49. Couverture de 2 x 111 m². Très facile à mettre en place.",
    price: 35000,
    compareAtPrice: null,
    stock: 5,
    sku: "FFXC999778",
    imageDir: "FUJI autre conso/chimi",
    imageFiles: ["cp21.png", "cp22.png", "cp23.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Type", value: "Chimie RA-4" },
      { key: "Couverture", value: "2 x 111 m²" },
      { key: "Contenu", value: "2 cartouches" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PAPIER PHOTO — Fuji Glossy (Brillant)
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Papier Photo",
    name: "Papier Fuji Brillant 102mm x 65m - Frontier DE/DX",
    description: "Papier FUJIFILM brillant (glossy) en rouleau 102mm x 65m pour imprimantes Fujifilm Frontier DE100, DE100-XD et DX100. Finition brillante professionnelle pour des tirages éclatants.",
    price: 12000,
    compareAtPrice: null,
    stock: 30,
    sku: "FDX10265B",
    imageDir: "papier DE DX fuji/DE-DX glossy",
    imageFiles: ["102-1.png", "102-2.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Format", value: "102mm x 65m" },
      { key: "Finition", value: "Brillant (Glossy)" },
      { key: "Compatibilité", value: "Frontier DE100, DE100-XD, DX100" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Papier Fuji Brillant 127mm x 65m - Frontier DE/DX",
    description: "Papier FUJIFILM brillant en rouleau 127mm x 65m pour imprimantes Fujifilm Frontier. Qualité photo professionnelle.",
    price: 14000,
    compareAtPrice: null,
    stock: 25,
    sku: "FDX12765B",
    imageDir: "papier DE DX fuji/DE-DX glossy",
    imageFiles: ["1.png", "2.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Format", value: "127mm x 65m" },
      { key: "Finition", value: "Brillant (Glossy)" },
      { key: "Compatibilité", value: "Frontier DE100, DE100-XD, DX100" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Papier Fuji Brillant 152mm x 65m - Frontier DE/DX",
    description: "Papier FUJIFILM brillant en rouleau 152mm x 65m pour imprimantes Fujifilm Frontier.",
    price: 16000,
    compareAtPrice: null,
    stock: 20,
    sku: "FDX15265B",
    imageDir: "papier DE DX fuji/DE-DX glossy",
    imageFiles: ["3.png", "4.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Format", value: "152mm x 65m" },
      { key: "Finition", value: "Brillant (Glossy)" },
      { key: "Compatibilité", value: "Frontier DE100, DE100-XD, DX100" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Papier Fuji Brillant 203mm x 65m - Frontier DE/DX",
    description: "Papier FUJIFILM brillant en rouleau 203mm x 65m pour imprimantes Fujifilm Frontier.",
    price: 18000,
    compareAtPrice: null,
    stock: 15,
    sku: "FDX20365B",
    imageDir: "papier DE DX fuji/DE-DX glossy",
    imageFiles: ["5.png", "6.jpg"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Format", value: "203mm x 65m" },
      { key: "Finition", value: "Brillant (Glossy)" },
      { key: "Compatibilité", value: "Frontier DE100, DE100-XD, DX100" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PAPIER PHOTO — Fuji Lustré
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Papier Photo",
    name: "Papier Fuji Lustré 102mm x 65m - Frontier DE/DX",
    description: "Papier FUJIFILM lustré en rouleau 102mm x 65m pour imprimantes Fujifilm Frontier. Finition satinée élégante, réduit les reflets.",
    price: 12000,
    compareAtPrice: null,
    stock: 25,
    sku: "FDX10265L",
    imageDir: "papier DE DX fuji/DE-DX lustre",
    imageFiles: ["102-1.png", "102-2.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Format", value: "102mm x 65m" },
      { key: "Finition", value: "Lustré (Lustre)" },
      { key: "Compatibilité", value: "Frontier DE100, DE100-XD, DX100" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Papier Fuji Lustré 127mm x 65m - Frontier DE/DX",
    description: "Papier FUJIFILM lustré en rouleau 127mm x 65m pour imprimantes Fujifilm Frontier.",
    price: 14000,
    compareAtPrice: null,
    stock: 20,
    sku: "FDX12765L",
    imageDir: "papier DE DX fuji/DE-DX lustre",
    imageFiles: ["1271.png", "1272.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Format", value: "127mm x 65m" },
      { key: "Finition", value: "Lustré (Lustre)" },
      { key: "Compatibilité", value: "Frontier DE100, DE100-XD, DX100" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Papier Fuji Lustré 152mm x 65m - Frontier DE/DX",
    description: "Papier FUJIFILM lustré en rouleau 152mm x 65m pour imprimantes Fujifilm Frontier.",
    price: 16000,
    compareAtPrice: null,
    stock: 20,
    sku: "FDX15265L",
    imageDir: "papier DE DX fuji/DE-DX lustre",
    imageFiles: ["152.png", "3.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Format", value: "152mm x 65m" },
      { key: "Finition", value: "Lustré (Lustre)" },
      { key: "Compatibilité", value: "Frontier DE100, DE100-XD, DX100" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Papier Fuji Lustré 203mm x 65m - Frontier DE/DX",
    description: "Papier FUJIFILM lustré en rouleau 203mm x 65m pour imprimantes Fujifilm Frontier.",
    price: 18000,
    compareAtPrice: null,
    stock: 15,
    sku: "FDX20365L",
    imageDir: "papier DE DX fuji/DE-DX lustre",
    imageFiles: ["203.jpg", "2032.png"],
    attributes: [
      { key: "Marque", value: "Fujifilm" },
      { key: "Format", value: "203mm x 65m" },
      { key: "Finition", value: "Lustré (Lustre)" },
      { key: "Compatibilité", value: "Frontier DE100, DE100-XD, DX100" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PAPIER PHOTO — Kodak
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Papier Photo",
    name: "Papier Photo Kodak Premium Gloss A4 240g",
    description: "Papier photo Kodak Premium Gloss format A4, grammage 240g. Parfait pour l'impression photo de très haute qualité. Finition brillante offrant une qualité d'impression inégalée, même pour les images complexes et détaillées. Impressions restant vibrantes et claires pendant des années.",
    price: 3500,
    compareAtPrice: null,
    stock: 50,
    sku: "5740-093",
    imageDir: "kodak/papier sublimation/240",
    imageFiles: ["1.jpg", "2.png", "3.png"],
    attributes: [
      { key: "Marque", value: "Kodak" },
      { key: "Format", value: "A4" },
      { key: "Grammage", value: "240 g/m²" },
      { key: "Finition", value: "Brillant (Gloss)" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Papier Photo Kodak 180g A4 - 20 feuilles",
    description: "Papier photo Kodak 180g/m² format A4. Conçu pour une utilisation avec les imprimantes photo jet d'encre. Applications : impression photo haute qualité, albums photo, cartes de vœux et projets artistiques. Finition brillante.",
    price: 2500,
    compareAtPrice: null,
    stock: 60,
    sku: "5740-512",
    imageDir: "kodak/papier sublimation/180",
    imageFiles: ["1.png", "2.png", "3.png"],
    attributes: [
      { key: "Marque", value: "Kodak" },
      { key: "Format", value: "A4" },
      { key: "Grammage", value: "180 g/m²" },
      { key: "Feuilles", value: "20" },
      { key: "Finition", value: "Brillant" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Kodak Kit Média Imprimante 305",
    description: "Kit média Kodak pour imprimante thermique 305. Consommable de remplacement d'origine Kodak pour l'imprimante photo 305.",
    price: 25000,
    compareAtPrice: null,
    stock: 10,
    sku: "KODAK-305-KIT",
    imageDir: "kodak/papier photo/305",
    imageFiles: ["kodak-305-6r-300x300.png", "2.png", "3.png"],
    attributes: [
      { key: "Marque", value: "Kodak" },
      { key: "Type", value: "Kit Média" },
      { key: "Compatibilité", value: "Imprimante Kodak 305" },
    ],
  },
  {
    category: "Papier Photo",
    name: "Kodak Consommable Thermique pour 6800",
    description: "Consommable thermique d'origine Kodak pour imprimante photo 6800. Kit de remplacement professionnel.",
    price: 45000,
    compareAtPrice: null,
    stock: 8,
    sku: "KODAK-6800-KIT",
    imageDir: "kodak/papier photo/6800",
    imageFiles: ["6800.png", "2.png", "3.png"],
    attributes: [
      { key: "Marque", value: "Kodak" },
      { key: "Type", value: "Consommable thermique" },
      { key: "Compatibilité", value: "Imprimante Kodak 6800" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // STOCKAGE — Cartes SD SanDisk
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Stockage",
    name: "Carte SanDisk Ultra SDHC UHS-I 32 Go",
    description: "Carte mémoire SD SanDisk Ultra 32 Go avec vitesse de lecture jusqu'à 120 Mo/s. Interface UHS-I. Garantie limitée de 10 ans. Dimensions : 31,92 × 23,91 × 2,17 mm, poids 2,1 g. Température de fonctionnement : -25°C à 85°C.",
    price: 3500,
    compareAtPrice: null,
    stock: 50,
    sku: "SDSDUN4-032G-GN6IN",
    imageDir: "SANDISK/carte-ultra-32gb-120mbs",
    imageFiles: ["92C17A9D5BA225CEA73644A3A983FC01102E598A_ULTRAUHSISD12032GBFRONT_gallery.png", "fd58f82d-1afa-4977-9ac1-6f6e8188efdd.jpg"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "32 Go" },
      { key: "Vitesse", value: "Jusqu'à 120 Mo/s" },
      { key: "Interface", value: "UHS-I" },
      { key: "Garantie", value: "10 ans" },
    ],
  },
  {
    category: "Stockage",
    name: "Carte SanDisk Ultra SDXC UHS-I 64 Go",
    description: "Carte mémoire SD SanDisk Ultra 64 Go avec vitesse de lecture jusqu'à 140 Mo/s. Interface UHS-I. Idéale pour la photographie et la vidéo.",
    price: 5500,
    compareAtPrice: null,
    stock: 40,
    sku: "SDSDUN4-064G",
    imageDir: "SANDISK/carte-ultra-64gb-140mbs",
    imageFiles: ["ultra-uhs-i-sd-64gb-140mbs.png"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "64 Go" },
      { key: "Vitesse", value: "Jusqu'à 140 Mo/s" },
      { key: "Interface", value: "UHS-I" },
    ],
  },
  {
    category: "Stockage",
    name: "Carte SanDisk Extreme SD UHS-I 64 Go",
    description: "Carte mémoire SD SanDisk Extreme 64 Go avec vitesse de lecture jusqu'à 170 Mo/s. Conçue pour les photographes et vidéastes exigeants.",
    price: 7500,
    compareAtPrice: null,
    stock: 30,
    sku: "SDSDXV2-064G",
    imageDir: "SANDISK/carte-extreme-64gb-170mbs",
    imageFiles: ["transparant.png", "81hqcdwVOKL._AC_SL1500_.jpg", "81kaqzeJ+hL._AC_SL1500_.jpg"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "64 Go" },
      { key: "Vitesse", value: "Jusqu'à 170 Mo/s" },
      { key: "Interface", value: "UHS-I" },
    ],
  },
  {
    category: "Stockage",
    name: "Carte SanDisk Extreme PRO SDHC/SDXC UHS-I 64 Go",
    description: "Carte mémoire SD SanDisk Extreme PRO 64 Go avec vitesse de lecture jusqu'à 200 Mo/s. Performance ultime pour la photographie professionnelle et la vidéo 4K.",
    price: 12000,
    compareAtPrice: null,
    stock: 20,
    sku: "SDSDXXU-064G",
    imageDir: "SANDISK/extreme-pro-uhs-i-sd-200mbs-64gb",
    imageFiles: ["extreme-pro-uhs-i-sd-200mbs-64gb-front.png.wdthumb.500.500.png", "813ABZo8o7L._AC_SL1500_.jpg", "91mlqzCSaJL._AC_SL1500_.jpg"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "64 Go" },
      { key: "Vitesse", value: "Jusqu'à 200 Mo/s" },
      { key: "Interface", value: "UHS-I" },
    ],
  },
  {
    category: "Stockage",
    name: "Carte microSD SanDisk Extreme 128 Go",
    description: "Carte microSD SanDisk Extreme 128 Go avec vitesse de lecture jusqu'à 190 Mo/s. Conçue pour le gaming mobile, les caméras d'action et les drones.",
    price: 9000,
    compareAtPrice: null,
    stock: 25,
    sku: "SDSQXAA-128G",
    imageDir: "SANDISK/minicarte-extreme-128gb-190mbs",
    imageFiles: ["extreme-uhs-i-microsd-128gb.png.wdthumb.1280.1280.jpg", "51umIL+zNZL._AC_SX679_.jpg", "51YkN1jw7eL._AC_SL1000_.jpg"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "128 Go" },
      { key: "Vitesse", value: "Jusqu'à 190 Mo/s" },
      { key: "Type", value: "microSD" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // STOCKAGE — Clés USB SanDisk
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Stockage",
    name: "Clé USB SanDisk Cruzer Blade 16 Go USB 2.0",
    description: "Clé USB SanDisk Cruzer Blade 16 Go avec un design compact et élégant. Sauvegardez, transférez et partagez vos fichiers facilement. Transportez photos, vidéos, musique et données personnelles partout avec vous.",
    price: 1500,
    compareAtPrice: null,
    stock: 100,
    sku: "SDCZ50-016G-B35",
    imageDir: "usb flash disque",
    imageFiles: ["cruzer-blade-usb-2-0-angle.png.wdthumb.1280.1280.webp", "cruzer-blade-usb-2-0-straight.png.wdthumb.319.319.webp", "cruzer-blade-usb-2-0-top.png.wdthumb.319.319.webp"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "16 Go" },
      { key: "Interface", value: "USB 2.0" },
    ],
  },
  {
    category: "Stockage",
    name: "Clé USB SanDisk Cruzer Blade 32 Go USB 2.0",
    description: "Clé USB SanDisk Cruzer Blade 32 Go. Design compact et élégant avec capacité généreuse pour le transfert de fichiers au quotidien.",
    price: 2200,
    compareAtPrice: null,
    stock: 80,
    sku: "SDCZ50-032G-B35",
    imageDir: "usb flash disque",
    imageFiles: ["cruzer-blade-usb-2-0-angle.png.wdthumb.1280.1280.webp", "cruzer-blade-usb-2-0-featured.jpg.wdthumb.319.319.webp"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "32 Go" },
      { key: "Interface", value: "USB 2.0" },
    ],
  },
  {
    category: "Stockage",
    name: "Clé USB SanDisk Cruzer Blade 64 Go USB 2.0",
    description: "Clé USB SanDisk Cruzer Blade 64 Go. Grande capacité dans un format compact.",
    price: 3500,
    compareAtPrice: null,
    stock: 60,
    sku: "SDCZ50-064G-B35",
    imageDir: "usb flash disque",
    imageFiles: ["cruzer-blade-usb-2-0-angle.png.wdthumb.1280.1280.webp", "cruzer-blade-usb-2-0-top.png.wdthumb.319.319.webp"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "64 Go" },
      { key: "Interface", value: "USB 2.0" },
    ],
  },
  {
    category: "Stockage",
    name: "Clé USB SanDisk Cruzer Glide 32 Go USB 3.0",
    description: "Clé USB SanDisk Cruzer Glide 32 Go avec interface USB 3.0 pour des transferts rapides. Design rétractable protégeant le connecteur.",
    price: 2800,
    compareAtPrice: null,
    stock: 50,
    sku: "SDCZ600-032G",
    imageDir: "SANDISK/usb-flash-disque",
    imageFiles: ["cruzer-glide-usb-3-0-front-closed.png.wdthumb.500.500.png", "cruzer-glide-usb-3-0-left-angled-closed.png.wdthumb.500.500.png", "cruzer-glide-usb-3-0-left-angled-open.png.wdthumb.500.500.png"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "32 Go" },
      { key: "Interface", value: "USB 3.0" },
    ],
  },
  {
    category: "Stockage",
    name: "Clé USB SanDisk Cruzer Glide 64 Go USB 3.0",
    description: "Clé USB SanDisk Cruzer Glide 64 Go USB 3.0 pour des transferts de fichiers rapides.",
    price: 4200,
    compareAtPrice: null,
    stock: 40,
    sku: "SDCZ600-064G",
    imageDir: "SANDISK/usb-flash-disque",
    imageFiles: ["cruzer-glide-usb-3-0-front-closed.png.wdthumb.500.500.png", "cruzer-glide-usb-3-0-left-angled-open.png.wdthumb.500.500.png"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "64 Go" },
      { key: "Interface", value: "USB 3.0" },
    ],
  },
  {
    category: "Stockage",
    name: "Clé USB SanDisk Cruzer Glide 128 Go USB 3.0",
    description: "Clé USB SanDisk Cruzer Glide 128 Go USB 3.0. Grande capacité pour stocker tous vos fichiers.",
    price: 6500,
    compareAtPrice: null,
    stock: 30,
    sku: "SDCZ600-128G",
    imageDir: "SANDISK/usb-flash-disque",
    imageFiles: ["cruzer-glide-usb-3-0-front-closed.png.wdthumb.500.500.png", "cruzer-glide-usb-3-0-left-angled-closed.png.thumb.1280.1280.png"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "128 Go" },
      { key: "Interface", value: "USB 3.0" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // STOCKAGE — SSD Portable
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Stockage",
    name: "SanDisk Extreme PRO Portable SSD 1 To",
    description: "SSD portable haute performance SanDisk Extreme PRO 1 To. Vitesse de lecture et écriture séquentielle jusqu'à 2000 Mo/s. Interface USB 3.2 Gen 2x2 avec connecteur USB-C. Certifié IP65 pour la résistance à l'eau et à la poussière. Dimensions : 110,26 × 57,34 × 10,22 mm, poids 77,5 g. Garantie limitée de 5 ans.",
    price: 45000,
    compareAtPrice: null,
    stock: 10,
    sku: "SDSSDE61-1T00-G25",
    imageDir: "SANDISK/disque-dur",
    imageFiles: ["extreme-usb-3-2-ssd-front.png", "extreme-usb-3-2-ssd-front-flat.png", "extreme-usb-3-2-ssd-front-angle-left.png"],
    attributes: [
      { key: "Marque", value: "SanDisk" },
      { key: "Capacité", value: "1 To" },
      { key: "Vitesse", value: "2000 Mo/s lecture/écriture" },
      { key: "Interface", value: "USB 3.2 Gen 2x2 (USB-C)" },
      { key: "Protection", value: "IP65" },
      { key: "Poids", value: "77,5 g" },
      { key: "Garantie", value: "5 ans" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // STOCKAGE — Clés USB ADATA
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Stockage",
    name: "Clé USB ADATA UV250 64 Go Silver",
    description: "Clé USB ADATA UV250 64 Go avec finition argent métallique. Compacte et résistante, idéale pour un usage quotidien.",
    price: 3000,
    compareAtPrice: null,
    stock: 40,
    sku: "ADATA-UV250-64",
    imageDir: "adata flash disque",
    imageFiles: ["cle-usb-adata-uv250-64-go-silver-1.png", "cle-usb-adata-uv250-64-go-silver-2.png", "cle-usb-adata-uv250-64-go-silver-3.png"],
    attributes: [
      { key: "Marque", value: "ADATA" },
      { key: "Capacité", value: "64 Go" },
      { key: "Couleur", value: "Silver" },
    ],
  },
  {
    category: "Stockage",
    name: "Clé USB ADATA 32 Go Silver",
    description: "Clé USB ADATA 32 Go avec finition argent. Design élégant et compact pour le transport de données.",
    price: 1800,
    compareAtPrice: null,
    stock: 60,
    sku: "ADATA-32-SILVER",
    imageDir: "adata flash disque",
    imageFiles: ["cle-usb-adata-32-go-silver-1.png", "cle-usb-adata-32-go-silver-2.png", "cle-usb-adata-32-go-silver-3.png"],
    attributes: [
      { key: "Marque", value: "ADATA" },
      { key: "Capacité", value: "32 Go" },
      { key: "Couleur", value: "Silver" },
    ],
  },
  {
    category: "Stockage",
    name: "Clé USB ADATA UV240 32 Go Blanc",
    description: "Clé USB ADATA UV240 32 Go avec finition blanche. Légère et compacte.",
    price: 1600,
    compareAtPrice: null,
    stock: 50,
    sku: "ADATA-UV240-32W",
    imageDir: "adata flash disque",
    imageFiles: ["cle-usb-adata-uv240-32-go-blanc-1.png", "cle-usb-adata-uv240-32-go-blanc-2.png", "cle-usb-adata-uv240-32-go-blanc-3.png"],
    attributes: [
      { key: "Marque", value: "ADATA" },
      { key: "Capacité", value: "32 Go" },
      { key: "Couleur", value: "Blanc" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PRODUITS À SUBLIMATION
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Produits à Sublimation",
    name: "Mug Personnalisable Blanc",
    description: "Mug sublimation blanc 325ml. Compatible presse à chaud. Finition brillante, résistant lave-vaisselle et micro-ondes. Emballage individuel inclus.",
    price: 500,
    compareAtPrice: null,
    stock: 200,
    sku: "MUG-BLANC",
    imageDir: "mug",
    imageFiles: ["1.png", "2.png"],
    attributes: [
      { key: "Capacité", value: "325 ml" },
      { key: "Couleur", value: "Blanc" },
      { key: "Finition", value: "Brillante" },
      { key: "Compatibilité", value: "Presse à chaud" },
    ],
  },
  {
    category: "Produits à Sublimation",
    name: "Mug Cœur Personnalisable - Anse Rouge",
    description: "Mug sublimation avec anse en forme de cœur rouge. 325ml, compatible presse à chaud. Finition brillante, résistant lave-vaisselle et micro-ondes. Parfait pour les cadeaux personnalisés.",
    price: 700,
    compareAtPrice: null,
    stock: 150,
    sku: "MUG-COEUR-ROUGE",
    imageDir: "mug",
    imageFiles: ["3.png", "4.png"],
    attributes: [
      { key: "Capacité", value: "325 ml" },
      { key: "Anse", value: "Cœur rouge" },
      { key: "Finition", value: "Brillante" },
      { key: "Compatibilité", value: "Presse à chaud" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PILES STANDARDS — Varta
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Piles Standards",
    name: "Pile Alcaline Varta 9V Longlife Power",
    description: "La plus puissante parmi les piles VARTA. Spécialement conçue pour les appareils à forte consommation comme les ordinateurs et les lampes torches. Énergie puissante de la gamme VARTA LONGLIFE Power.",
    price: 800,
    compareAtPrice: null,
    stock: 100,
    sku: "VARTA-9V-POWER",
    imageDir: "piles/varta/piles standare",
    imageFiles: ["9vlonglife-1.png", "9vlonglife-2.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "9V Alcaline" },
      { key: "Gamme", value: "Longlife Power" },
    ],
  },
  {
    category: "Piles Standards",
    name: "Pile Varta AA Longlife Power BP4",
    description: "Pack de 4 piles AA Varta Longlife Power. Énergie fiable pour vos appareils électroniques du quotidien.",
    price: 600,
    compareAtPrice: null,
    stock: 150,
    sku: "VARTA-AA-LP-BP4",
    imageDir: "piles/varta/piles standare",
    imageFiles: ["lr06-aa-power-bp4-1.png", "lr06-aa-power-bp4-2.png", "lr06-aa-power-bp4-3.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "AA (LR06)" },
      { key: "Quantité", value: "4 piles" },
      { key: "Gamme", value: "Longlife Power" },
    ],
  },
  {
    category: "Piles Standards",
    name: "Pile Varta AAA Longlife Power BP4",
    description: "Pack de 4 piles AAA Varta Longlife Power. Idéales pour télécommandes, jouets et petits appareils.",
    price: 550,
    compareAtPrice: null,
    stock: 150,
    sku: "VARTA-AAA-LP-BP4",
    imageDir: "piles/varta/piles standare",
    imageFiles: ["lr3-aaa-power-bp4-1.png", "lr3-aaa-power-bp4-2.png", "lr3-aaa-power-bp4-3.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "AAA (LR03)" },
      { key: "Quantité", value: "4 piles" },
      { key: "Gamme", value: "Longlife Power" },
    ],
  },
  {
    category: "Piles Standards",
    name: "Pile Varta 9V Max Tech",
    description: "Pile 9V Varta Max Tech haute performance. Pour les appareils nécessitant une alimentation puissante et durable.",
    price: 1000,
    compareAtPrice: null,
    stock: 80,
    sku: "VARTA-9V-MAXTECH",
    imageDir: "piles/varta/piles standare",
    imageFiles: ["9vmaxtech-1.png", "9vmaxtech-2.png", "9vmaxtech-3.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "9V Alcaline" },
      { key: "Gamme", value: "Max Tech" },
    ],
  },
  {
    category: "Piles Standards",
    name: "Pile Varta AA Max Tech BP4",
    description: "Pack de 4 piles AA Varta Max Tech. Performance maximale pour les appareils les plus exigeants.",
    price: 700,
    compareAtPrice: null,
    stock: 120,
    sku: "VARTA-AA-MT-BP4",
    imageDir: "piles/varta/piles standare",
    imageFiles: ["lr06-aa-maxtech-bp4-1.png", "lr06-aa-maxtech-bp4-2.png", "lr06-aa-maxtech-bp4-3.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "AA (LR06)" },
      { key: "Quantité", value: "4 piles" },
      { key: "Gamme", value: "Max Tech" },
    ],
  },
  {
    category: "Piles Standards",
    name: "Pile Varta C Longlife Power BP2",
    description: "Pack de 2 piles C (LR14) Varta Longlife Power. Pour les appareils de taille moyenne nécessitant une alimentation fiable.",
    price: 700,
    compareAtPrice: null,
    stock: 60,
    sku: "VARTA-LR14-LP",
    imageDir: "piles/varta/piles standare",
    imageFiles: ["lr14-longlifep-1.png", "lr14-longlifep-2.png", "lr14-longlifep-3.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "C (LR14)" },
      { key: "Quantité", value: "2 piles" },
      { key: "Gamme", value: "Longlife Power" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PILES STANDARDS — Energizer
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Piles Standards",
    name: "Pile Energizer 9V Max",
    description: "Pile 9V Energizer Max. Performance fiable et longue durée pour vos appareils électroniques.",
    price: 900,
    compareAtPrice: null,
    stock: 80,
    sku: "ENERG-9V-MAX",
    imageDir: "piles/Energizer/piles standare",
    imageFiles: ["9v-rouge-1.png", "9v-rouge-2.png", "9v-rouge-3.png"],
    attributes: [
      { key: "Marque", value: "Energizer" },
      { key: "Type", value: "9V Alcaline" },
      { key: "Gamme", value: "Max" },
    ],
  },
  {
    category: "Piles Standards",
    name: "Pile Energizer AA Max BP4",
    description: "Pack de 4 piles AA Energizer Max. Énergie longue durée pour tous vos appareils.",
    price: 650,
    compareAtPrice: null,
    stock: 150,
    sku: "ENERG-AA-MAX-BP4",
    imageDir: "piles/Energizer/piles standare",
    imageFiles: ["lr06-aa-max-bp4.png", "lr06-aa-max-bp4-2.png"],
    attributes: [
      { key: "Marque", value: "Energizer" },
      { key: "Type", value: "AA (LR06)" },
      { key: "Quantité", value: "4 piles" },
      { key: "Gamme", value: "Max" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PILES BOUTONS — Varta
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Piles Boutons",
    name: "Pile Bouton Varta CR2032",
    description: "Pile bouton lithium Varta CR2032. Utilisée dans les montres, télécommandes, clés de voiture et appareils médicaux.",
    price: 300,
    compareAtPrice: null,
    stock: 200,
    sku: "VARTA-CR2032",
    imageDir: "piles/varta/piles bouton",
    imageFiles: ["cr2032-1.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "CR2032" },
      { key: "Chimie", value: "Lithium" },
    ],
  },
  {
    category: "Piles Boutons",
    name: "Pile Bouton Varta CR2025",
    description: "Pile bouton lithium Varta CR2025. Pour montres, calculatrices et petits appareils électroniques.",
    price: 300,
    compareAtPrice: null,
    stock: 200,
    sku: "VARTA-CR2025",
    imageDir: "piles/varta/piles bouton",
    imageFiles: ["cr2025-1.png", "cr2025-2.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "CR2025" },
      { key: "Chimie", value: "Lithium" },
    ],
  },
  {
    category: "Piles Boutons",
    name: "Pile Bouton Varta CR2016",
    description: "Pile bouton lithium Varta CR2016.",
    price: 250,
    compareAtPrice: null,
    stock: 200,
    sku: "VARTA-CR2016",
    imageDir: "piles/varta/piles bouton",
    imageFiles: ["cr2016-1.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "CR2016" },
      { key: "Chimie", value: "Lithium" },
    ],
  },
  {
    category: "Piles Boutons",
    name: "Pile Bouton Varta CR2450",
    description: "Pile bouton lithium Varta CR2450 haute capacité.",
    price: 400,
    compareAtPrice: null,
    stock: 150,
    sku: "VARTA-CR2450",
    imageDir: "piles/varta/piles bouton",
    imageFiles: ["cr2450-1.png", "cr2450-2.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "CR2450" },
      { key: "Chimie", value: "Lithium" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PILES BOUTONS — Energizer
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Piles Boutons",
    name: "Pile Bouton Energizer CR2032",
    description: "Pile bouton lithium Energizer CR2032. Performance fiable pour montres, télécommandes et clés de voiture.",
    price: 350,
    compareAtPrice: null,
    stock: 180,
    sku: "ENERG-CR2032",
    imageDir: "piles/Energizer/piles bouton",
    imageFiles: ["cr2032-1.png", "cr2025-1.png"],
    attributes: [
      { key: "Marque", value: "Energizer" },
      { key: "Type", value: "CR2032" },
      { key: "Chimie", value: "Lithium" },
    ],
  },
  {
    category: "Piles Boutons",
    name: "Pile Bouton Energizer CR2025",
    description: "Pile bouton lithium Energizer CR2025.",
    price: 350,
    compareAtPrice: null,
    stock: 180,
    sku: "ENERG-CR2025",
    imageDir: "piles/Energizer/piles bouton",
    imageFiles: ["cr2025-2.png", "cr2016-1.png"],
    attributes: [
      { key: "Marque", value: "Energizer" },
      { key: "Type", value: "CR2025" },
      { key: "Chimie", value: "Lithium" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PILES RECHARGEABLES
  // ═══════════════════════════════════════════════════════════════════════
  {
    category: "Piles Rechargeables",
    name: "Pile Rechargeable Varta AAA 1000mAh BP4",
    description: "Pack de 4 piles rechargeables AAA Varta 1000mAh. Économiques et écologiques, rechargeables des centaines de fois.",
    price: 1500,
    compareAtPrice: null,
    stock: 60,
    sku: "VARTA-AAA-RECH-1000",
    imageDir: "piles/varta/piles rechargable",
    imageFiles: ["lr03-aaa-bp4-1000-1.png", "lr03-aaa-bp4-1000-2.png"],
    attributes: [
      { key: "Marque", value: "Varta" },
      { key: "Type", value: "AAA rechargeable" },
      { key: "Capacité", value: "1000 mAh" },
      { key: "Quantité", value: "4 piles" },
    ],
  },
  {
    category: "Piles Rechargeables",
    name: "Chargeur Energizer + 4 Piles Rechargeables",
    description: "Kit chargeur Energizer avec 4 piles rechargeables incluses. Solution économique et écologique pour alimenter vos appareils.",
    price: 3500,
    compareAtPrice: null,
    stock: 30,
    sku: "ENERG-CHARG-KIT",
    imageDir: "piles/Energizer/pile rechargable",
    imageFiles: ["charg-ref1-c1.png", "charg-ref1-c2.png", "charg-ref1-c3.png"],
    attributes: [
      { key: "Marque", value: "Energizer" },
      { key: "Type", value: "Chargeur + piles" },
      { key: "Contenu", value: "1 chargeur + 4 piles" },
    ],
  },
  {
    category: "Piles Rechargeables",
    name: "Pile Rechargeable Energizer AA 2300mAh BP4",
    description: "Pack de 4 piles rechargeables AA Energizer Extreme 2300mAh. Haute capacité pour les appareils gourmands en énergie.",
    price: 2500,
    compareAtPrice: null,
    stock: 50,
    sku: "ENERG-AA-RECH-2300",
    imageDir: "piles/Energizer/pile rechargable",
    imageFiles: ["lr06-aaa-extrem-bp4-2300-1.png", "lr06-aaa-extrem-2300-1.png"],
    attributes: [
      { key: "Marque", value: "Energizer" },
      { key: "Type", value: "AA rechargeable" },
      { key: "Capacité", value: "2300 mAh" },
      { key: "Quantité", value: "4 piles" },
    ],
  },
];

// ─── SEED LOGIC ───────────────────────────────────────────────────────────────

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");

  // Find admin user for vendor field
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("❌ No admin user found. Create one first, then re-run.");
    process.exit(1);
  }
  console.log(`👤 Using admin: ${admin.email}`);

  // ── Clean existing data ──
  console.log("🗑️  Clearing existing products and categories...");
  await Product.deleteMany({});
  await Category.deleteMany({});

  // Clean uploads
  try {
    await fs.rm(UPLOADS_DIR, { recursive: true, force: true });
    await fs.rm(CAT_UPLOADS_DIR, { recursive: true, force: true });
  } catch { /* ignore */ }
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(CAT_UPLOADS_DIR, { recursive: true });

  // ── Create categories ──
  console.log("📁 Creating categories...");
  const catMap = {};

  // First pass: top-level categories (parent: null)
  for (const def of CATEGORIES.filter(c => !c.parent)) {
    const cat = await Category.create({
      name: def.name,
      description: def.description,
      slug: def.slug,
      isActive: true,
    });
    catMap[def.name] = cat;
    console.log(`  ✅ ${cat.name}`);
  }

  // Second pass: subcategories
  for (const def of CATEGORIES.filter(c => c.parent)) {
    const parentCat = catMap[def.parent];
    if (!parentCat) {
      console.warn(`  ⚠️  Parent "${def.parent}" not found for "${def.name}"`);
      continue;
    }
    const cat = await Category.create({
      name: def.name,
      description: def.description,
      slug: def.slug,
      parent: parentCat._id,
      isActive: true,
    });
    catMap[def.name] = cat;
    console.log(`  ✅ ${cat.name} → parent: ${parentCat.name}`);
  }

  // ── Create products ──
  console.log("\n📦 Creating products...");
  let created = 0;
  let skipped = 0;

  for (const def of PRODUCTS) {
    const cat = catMap[def.category];
    if (!cat) {
      console.warn(`  ⚠️  Category "${def.category}" not found for "${def.name}"`);
      skipped++;
      continue;
    }

    // Check if product already exists by SKU
    const existing = await Product.findOne({ sku: def.sku });
    if (existing) {
      console.log(`  ⏭️  ${def.name} (SKU ${def.sku}) already exists`);
      skipped++;
      continue;
    }

    // Create the product first to get an _id
    const product = await Product.create({
      name: def.name,
      description: def.description,
      price: def.price,
      compareAtPrice: def.compareAtPrice,
      stock: def.stock,
      sku: def.sku,
      category: cat._id,
      vendor: admin._id,
      isActive: true,
      images: [],
      attributes: def.attributes
        ? Object.fromEntries(def.attributes.map(a => [a.key, a.value]))
        : {},
    });

    // Process images
    const productDir = path.join(UPLOADS_DIR, product._id.toString());
    await fs.mkdir(productDir, { recursive: true });

    const images = [];
    for (const file of def.imageFiles) {
      const sourcePath = path.join(IMAGES_ROOT, def.imageDir, file);
      if (!(await fileExists(sourcePath))) {
        console.warn(`    ⚠️  Image not found: ${sourcePath}`);
        continue;
      }

      const baseName = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const variants = await processProductImage(sourcePath, productDir, baseName);
        images.push({
          original: `/uploads/products/${product._id}/${variants.original}`,
          thumbnail: `/uploads/products/${product._id}/${variants.thumbnail}`,
          medium: `/uploads/products/${product._id}/${variants.medium}`,
          large: `/uploads/products/${product._id}/${variants.large}`,
        });
      } catch (err) {
        console.warn(`    ⚠️  Failed to process ${file}: ${err.message}`);
      }

      // Small delay to ensure unique timestamps
      await new Promise(r => setTimeout(r, 15));
    }

    if (images.length > 0) {
      product.images = images;
      await product.save();
    }

    console.log(`  ✅ ${product.name} (${images.length} images)`);
    created++;
  }

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`🌱 Seed complete!`);
  console.log(`   Categories: ${Object.keys(catMap).length}`);
  console.log(`   Products created: ${created}`);
  console.log(`   Products skipped: ${skipped}`);
  console.log(`═══════════════════════════════════════════`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
