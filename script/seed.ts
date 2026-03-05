import { db } from "../server/db";
import { users, reports, ecoPoints } from "../shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function runSeed() {
  console.log("Checking if seeding is needed...");
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length === 0) {
    console.log("Seeding database...");
    
    const pw = await hashPassword("password123");
    
    const [user1] = await db.insert(users).values({
      name: "Juan Pérez",
      email: "juan@example.com",
      password: pw,
      points: 50
    }).returning();

    const [user2] = await db.insert(users).values({
      name: "Ana Gómez",
      email: "ana@example.com",
      password: pw,
      points: 120
    }).returning();

    await db.insert(reports).values([
      {
        userId: user1.id,
        title: "Basura acumulada en el parque",
        description: "Hay mucha basura cerca de los juegos infantiles.",
        type: "basura",
        location: "Parque Simón Bolívar, Bogotá",
        latitude: 4.6582,
        longitude: -74.0936,
        status: "pending",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
      },
      {
        userId: user2.id,
        title: "Contaminación en el río",
        description: "El agua del río se ve muy turbia y tiene mal olor.",
        type: "contaminación de agua",
        location: "Río Medellín",
        latitude: 6.2442,
        longitude: -75.5812,
        status: "in_progress",
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
      }
    ]);

    await db.insert(ecoPoints).values([
      { userId: user1.id, points: 50, reason: "Reporte de basura y 4 comentarios de apoyo" },
      { userId: user2.id, points: 120, reason: "Múltiples reportes verificados" }
    ]);
    
    console.log("Seeding complete!");
  } else {
    console.log("Database already seeded.");
  }
}

runSeed().catch(console.error).finally(() => process.exit(0));
