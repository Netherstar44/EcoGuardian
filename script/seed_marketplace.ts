import "dotenv/config";
import { db } from "../server/db";
import { marketplaceProducts, users } from "../shared/schema";
import fs from "fs";
import path from "path";

async function seed() {
  const allUsers = await db.select().from(users).limit(1);
  if (allUsers.length === 0) {
    console.log("No users found. Please register a user first.");
    return;
  }
  const sellerId = allUsers[0].id;
  
  const baseDir = path.join(process.cwd(), "client/public/assets/images/marketplace");
  const categories = fs.readdirSync(baseDir);
  
  let count = 0;
  for (const cat of categories) {
    const catPath = path.join(baseDir, cat);
    if (!fs.statSync(catPath).isDirectory()) continue;
    
    const subCategories = fs.readdirSync(catPath);
    for (const subCat of subCategories) {
      const subCatPath = path.join(catPath, subCat);
      if (!fs.statSync(subCatPath).isDirectory()) continue;
      
      const files = fs.readdirSync(subCatPath);
      for (const file of files) {
        if (!file.match(/\.(png|jpe?g)$/i)) continue;
        
        const title = file.replace(/\.[^/.]+$/, "");
        const imageUrl = `/assets/images/marketplace/${encodeURIComponent(cat)}/${encodeURIComponent(subCat)}/${encodeURIComponent(file)}`;
        
        const price = Math.floor(Math.random() * 90) + 10.99;
        const description = `Excelente ${title} para tu huerta ecológica. Parte de nuestra colección de ${subCat}. Producto 100% recomendado para una agricultura sostenible. ¡Mejora tu cultivo hoy mismo!`;
        
        // determine category loosely
        let sysCategory = "otro";
        if (cat.toLowerCase().includes("agrícola")) sysCategory = "semillas";
        else if (cat.toLowerCase().includes("iot")) sysCategory = "energia";
        else if (cat.toLowerCase().includes("venta")) sysCategory = "abono";

        await db.insert(marketplaceProducts).values({
          sellerId,
          title,
          description,
          category: sysCategory,
          price,
          quantity: Math.floor(Math.random() * 50) + 5,
          imageUrl,
          status: "available",
          rating: 5,
        });
        count++;
      }
    }
  }
  console.log(`Successfully seeded ${count} marketplace products!`);
}

seed().catch(console.error).finally(() => process.exit(0));
