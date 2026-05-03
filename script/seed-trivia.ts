import 'dotenv/config';
import { pool } from "../server/db";

async function seedTrivia() {
  try {
    console.log("🌱 Sembrando preguntas de trivia...");

    const questions = [
      {
        question: "¿Cuál es el gas de efecto invernadero más abundante de origen humano?",
        options: JSON.stringify(["Metano", "Dióxido de carbono", "Óxido nitroso", "Fluorados"]),
        correctAnswer: "Dióxido de carbono",
        difficulty: "easy",
        category: "climate",
      },
      {
        question: "¿Cuántas especies se extinguen cada día aproximadamente?",
        options: JSON.stringify(["50-100", "150-200", "5-10", "500-1000"]),
        correctAnswer: "150-200",
        difficulty: "medium",
        category: "biodiversity",
      },
      {
        question: "¿Qué energía renovable es la más utilizada actualmente en el mundo?",
        options: JSON.stringify(["Solar", "Eólica", "Hidroeléctrica", "Geotérmica"]),
        correctAnswer: "Hidroeléctrica",
        difficulty: "medium",
        category: "energy",
      },
      {
        question: "¿Cuál es el nivel de pH del agua de mar?",
        options: JSON.stringify(["6.5", "7.0", "8.1", "9.5"]),
        correctAnswer: "8.1",
        difficulty: "hard",
        category: "water",
      },
      {
        question: "¿Qué porcentaje de los plásticos mundiales se recicla?",
        options: JSON.stringify(["5%", "15%", "35%", "60%"]),
        correctAnswer: "5%",
        difficulty: "medium",
        category: "pollution",
      },
      {
        question: "¿Cuál es el combustible fósil que más contribuye al cambio climático?",
        options: JSON.stringify(["Petróleo", "Carbón", "Gas natural", "Turba"]),
        correctAnswer: "Carbón",
        difficulty: "easy",
        category: "climate",
      },
      {
        question: "¿En qué año se firmó el Protocolo de Kioto?",
        options: JSON.stringify(["1992", "1997", "2002", "2008"]),
        correctAnswer: "1997",
        difficulty: "hard",
        category: "climate",
      },
      {
        question: "¿Cuánta agua consume una ducha típica de 5 minutos?",
        options: JSON.stringify(["25 litros", "50 litros", "75 litros", "100 litros"]),
        correctAnswer: "75 litros",
        difficulty: "medium",
        category: "water",
      },
      {
        question: "¿Cuál es el primero de los Objetivos de Desarrollo Sostenible de la ONU?",
        options: JSON.stringify(["Fin de la pobreza", "Hambre cero", "Salud y bienestar", "Educación de calidad"]),
        correctAnswer: "Fin de la pobreza",
        difficulty: "easy",
        category: "sustainability",
      },
      {
        question: "¿Qué animal es el más afectado por la contaminación de plásticos marinos?",
        options: JSON.stringify(["Ballenas", "Tortugas", "Peces", "Delfines"]),
        correctAnswer: "Tortugas",
        difficulty: "easy",
        category: "biodiversity",
      },
    ];

    for (const q of questions) {
      await pool.query(
        `INSERT INTO trivia_questions (question, options, correct_answer, explanation, category, difficulty, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT DO NOTHING`,
        [q.question, q.options, q.correctAnswer, `Respuesta correcta: ${q.correctAnswer}`, q.category, q.difficulty]
      );
    }

    console.log("✅ Preguntas de trivia sembradas exitosamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error sembrando trivia:", error);
    process.exit(1);
  }
}

seedTrivia();
