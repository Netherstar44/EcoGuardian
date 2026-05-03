import 'dotenv/config';
import { db } from "../server/db";
import { users, reports, ecoPoints, posts } from "../shared/schema";
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
  const existingPosts = await db.select().from(posts);
  
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

    // Seed posts for search testing
    await db.insert(posts).values([
      {
        authorId: user1.id,
        content: "¡Hola a todos! Hoy participé en una jornada de limpieza en el parque. ¡Fue increíble ver cómo entre todos podemos hacer la diferencia! #EcoGuardian #LimpiezaAmbiental",
        category: "limpieza"
      },
      {
        authorId: user2.id,
        content: "Comparto esta foto de un río contaminado que reporté hace una semana. Las autoridades ya están trabajando en la solución. ¡Sigamos reportando! 🌊♻️",
        category: "contaminación de agua"
      },
      {
        authorId: user1.id,
        content: "Tips para reciclar correctamente: 1. Separa los materiales, 2. Lava los envases, 3. Usa los contenedores adecuados. ¡Cada pequeño gesto cuenta! 📚♻️",
        category: "reciclaje"
      },
      {
        authorId: user2.id,
        content: "Organizando una jornada de compostaje comunitario este sábado. ¿Quién se une? Necesitamos voluntarios para enseñar a los vecinos. 🗓️🌱",
        category: "compostaje"
      },
      {
        authorId: user1.id,
        content: "¡Felicitaciones a todos los EcoGuardianes que han alcanzado el nivel 5! Sus reportes están ayudando a mejorar nuestras comunidades. 👏🏆",
        category: "comunidad"
      }
    ]);
    
    console.log("Seeding complete!");
  } else if (existingPosts.length === 0) {
    console.log("Adding posts to existing database...");
    
    // Get existing users
    const [user1, user2] = existingUsers.slice(0, 2);
    
    if (user1 && user2) {
      // Seed posts for search testing
      await db.insert(posts).values([
        {
          authorId: user1.id,
          content: "¡Hola a todos! Hoy participé en una jornada de limpieza en el parque. ¡Fue increíble ver cómo entre todos podemos hacer la diferencia! #EcoGuardian #LimpiezaAmbiental",
          category: "limpieza"
        },
        {
          authorId: user2.id,
          content: "Comparto esta foto de un río contaminado que reporté hace una semana. Las autoridades ya están trabajando en la solución. ¡Sigamos reportando! 🌊♻️",
          category: "contaminación de agua"
        },
        {
          authorId: user1.id,
          content: "Tips para reciclar correctamente: 1. Separa los materiales, 2. Lava los envases, 3. Usa los contenedores adecuados. ¡Cada pequeño gesto cuenta! 📚♻️",
          category: "reciclaje"
        },
        {
          authorId: user2.id,
          content: "Organizando una jornada de compostaje comunitario este sábado. ¿Quién se une? Necesitamos voluntarios para enseñar a los vecinos. 🗓️🌱",
          category: "compostaje"
        },
        {
          authorId: user1.id,
          content: "¡Felicitaciones a todos los EcoGuardianes que han alcanzado el nivel 5! Sus reportes están ayudando a mejorar nuestras comunidades. 👏🏆",
          category: "comunidad"
        }
      ]);
      
      console.log("Posts added!");
    }
  } else {
    console.log("Database already seeded with posts.");
  }
}

runSeed().catch(console.error).finally(() => process.exit(0));
