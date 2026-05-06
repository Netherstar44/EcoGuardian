import fs from 'fs';
import path from 'path';

const baseDir = path.join(process.cwd(), 'client/public/assets/images/marketplace');
const categories = fs.readdirSync(baseDir);
const products = [];
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
      const title = file.replace(/\.[^/.]+$/, '');
      const imageUrl = `/assets/images/marketplace/${encodeURIComponent(cat)}/${encodeURIComponent(subCat)}/${encodeURIComponent(file)}`;
      let sysCategory = 'otro';
      if (cat.toLowerCase().includes('agrícola')) sysCategory = 'semillas';
      else if (cat.toLowerCase().includes('iot')) sysCategory = 'energia';
      else if (cat.toLowerCase().includes('venta')) sysCategory = 'abono';
      products.push({
        title,
        description: `Excelente ${title} para tu huerta ecológica. Parte de nuestra colección de ${subCat}. Producto 100% recomendado para una agricultura sostenible. ¡Mejora tu cultivo hoy mismo!`,
        category: sysCategory,
        price: Math.floor(Math.random() * 90) + 10.99,
        quantity: Math.floor(Math.random() * 50) + 5,
        imageUrl,
        status: 'available',
        rating: 5,
      });
    }
  }
}
fs.writeFileSync('products_seed.json', JSON.stringify(products, null, 2));
console.log('Done');
