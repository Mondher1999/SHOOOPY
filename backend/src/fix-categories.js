/**
 * Fix categories — assign images to all categories.
 * Uses existing homepage images and downloads missing ones.
 *
 * Usage: cd backend && node src/fix-categories.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import path from "path";
import fs from "fs/promises";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import Category from "./models/categoryModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAT_UPLOADS_DIR = path.resolve(__dirname, "../uploads/categories");
const HOMEPAGE_IMAGES = path.resolve(__dirname, "../../frontend/public/images/homepage/categories");

// Map category slugs to image sources
// "file:" prefix = copy from homepage images folder
// "url:" prefix = download from web (royalty-free sources)
const CATEGORY_IMAGES = {
  // Top-level
  "imprimantes-consommables": { source: "file:printers.png" },
  "accessoires-photo-studio": { source: "url:https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&h=400&fit=crop&q=80" },
  "clairage-nergie": { source: "file:batteries.png" },
  "stockage": { source: "file:memory-cards.png" },

  // Sub — Imprimantes & Consommables
  "imprimantes": { source: "file:printers.png" },
  "papier-photo": { source: "file:paper.png" },
  "encres-pour-imprimantes": { source: "file:inks.png" },
  "autres-consommables": { source: "url:https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=600&h=400&fit=crop&q=80" },

  // Sub — Accessoires
  "cadres-photo": { source: "url:https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=600&h=400&fit=crop&q=80" },
  "albums-photo": { source: "url:https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop&q=80" },
  "produits-sublimation": { source: "file:sublimation.png" },
  "quipements-studio": { source: "url:https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&h=400&fit=crop&q=80" },

  // Sub — Éclairage & Énergie
  "piles-standards": { source: "file:batteries.png" },
  "piles-boutons": { source: "url:https://images.unsplash.com/photo-1619641805634-98e5c5a11d4c?w=600&h=400&fit=crop&q=80" },
  "piles-rechargeables": { source: "url:https://images.unsplash.com/photo-1609592424109-f4e1e6ca7b7f?w=600&h=400&fit=crop&q=80" },
};

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const makeRequest = (requestUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error("Too many redirects"));
        return;
      }
      protocol.get(requestUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          makeRequest(response.headers.location, redirectCount + 1);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", async () => {
          await fs.writeFile(destPath, Buffer.concat(chunks));
          resolve();
        });
        response.on("error", reject);
      }).on("error", reject);
    };
    makeRequest(url);
  });
}

async function run() {
  console.log("🔗 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  await fs.mkdir(CAT_UPLOADS_DIR, { recursive: true });

  const categories = await Category.find({}).lean();
  console.log(`📁 Found ${categories.length} categories\n`);

  for (const cat of categories) {
    const config = CATEGORY_IMAGES[cat.slug];
    if (!config) {
      console.log(`  ⚠️  No image mapping for "${cat.slug}" (${cat.name})`);
      continue;
    }

    const ext = config.source.startsWith("file:")
      ? path.extname(config.source.replace("file:", "")) || ".png"
      : ".jpg";
    const destFilename = `${cat.slug}${ext}`;
    const destPath = path.join(CAT_UPLOADS_DIR, destFilename);
    const dbPath = `/uploads/categories/${destFilename}`;

    try {
      if (config.source.startsWith("file:")) {
        const srcFile = config.source.replace("file:", "");
        const srcPath = path.join(HOMEPAGE_IMAGES, srcFile);
        await fs.copyFile(srcPath, destPath);
        console.log(`  ✅ ${cat.name} ← copied ${srcFile}`);
      } else {
        const url = config.source.replace("url:", "");
        await downloadFile(url, destPath);
        console.log(`  ✅ ${cat.name} ← downloaded`);
      }

      await Category.findByIdAndUpdate(cat._id, { image: dbPath });
    } catch (err) {
      console.log(`  ❌ ${cat.name}: ${err.message}`);
    }
  }

  console.log("\n✅ Done!");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
