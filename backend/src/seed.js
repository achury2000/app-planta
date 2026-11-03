// backend/src/seed.js
// Semilla de datos de prueba. Uso:
//   npm run seed            → inserta solo si las colecciones están vacías
//   npm run seed -- --reset → borra y vuelve a insertar
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Content = require("./models/Content");

const RESET = process.argv.includes("--reset");

const users = [
  {
    name: "Administrador Planta",
    email: "admin@planta.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Carlos Pérez",
    email: "carlos@planta.com",
    password: "demo123",
    role: "user",
  },
  {
    name: "María Gómez",
    email: "maria@planta.com",
    password: "demo123",
    role: "user",
  },
  {
    name: "Juan Rodríguez",
    email: "juan@planta.com",
    password: "demo123",
    role: "user",
  },
];

const contents = [
  {
    type: "video",
    category: "fitness",
    title: "Rutina de movilidad para empezar el día",
    description:
      "5 minutos de estiramientos guiados para activar el cuerpo antes de cualquier actividad.",
    videoSource: "youtube",
    youtubeId: "cacwri2wio4",
    videoUrl: "https://www.youtube.com/embed/cacwri2wio4",
    thumbnail: "https://img.youtube.com/vi/cacwri2wio4/hqdefault.jpg",
    duration: 5,
    isFeatured: true,
    status: "published",
    views: 128,
  },
  {
    type: "video",
    category: "environment",
    title: "Ejercicio al aire libre: conecta con tu entorno",
    description:
      "Ideas para entrenar en parques y espacios naturales de tu ciudad.",
    videoSource: "youtube",
    youtubeId: "U07R85A_WJg",
    videoUrl: "https://www.youtube.com/embed/U07R85A_WJg",
    thumbnail: "https://img.youtube.com/vi/U07R85A_WJg/hqdefault.jpg",
    duration: 30,
    isFeatured: false,
    status: "published",
    views: 54,
  },
  {
    type: "article",
    category: "routine",
    title: "Cómo construir una rutina matutina de 10 minutos",
    description:
      "Guía paso a paso para armar un hábito de transformación que sí puedas mantener.",
    body:
      "Comienza con una intención clara.\n\n" +
      "1. Define una sola acción mínima (ej: 5 flexiones).\n" +
      "2. Ata el hábito a algo que ya haces (después de cepillarte los dientes).\n" +
      "3. Registra cada día en 'Mi actividad' para ver tu racha crecer.\n\n" +
      "La constancia vence a la intensidad.",
    thumbnail:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=60",
    duration: 10,
    isFeatured: true,
    status: "published",
    views: 89,
    quiz: [
      {
        question: "¿Qué es lo primero que debes definir al armar una rutina matutina?",
        options: [
          "La hora exacta a la que te levantas",
          "Una intención clara",
          "El número total de días del reto",
        ],
        correctIndex: 1,
        explanation:
          "El texto propone empezar con una intención clara: eso sostiene el resto del plan.",
      },
      {
        question: "¿Cómo se recomienda atar el hábito nuevo?",
        options: [
          "A algo que ya haces todos los días",
          "Al final de la semana",
          "A la motivation de otros",
        ],
        correctIndex: 0,
        explanation:
          "Unir el hábito nuevo a una rutina existente (ej: después de cepillarte los dientes) lo hace más fácil de recordar.",
      },
      {
        question: "Según la guía, ¿qué pesa más?",
        options: ["La constancia", "La intensidad", "La duración exacta"],
        correctIndex: 0,
        explanation: "La constancia vence a la intensidad.",
      },
    ],
  },
  {
    type: "article",
    category: "challenges",
    title: "Reto 30 días: hidratación y movimiento",
    description:
      "Un reto progresivo para beber más agua y moverte un poco más cada día.",
    body:
      "Semana 1: 6 vasos de agua y 5 minutos de caminata.\n" +
      "Semana 2: 7 vasos de agua y 10 minutos de caminata.\n" +
      "Semana 3: 8 vasos de agua y 15 minutos de ejercicio libre.\n" +
      "Semana 4: sostén el hábito y comparte tu resultado.",
    thumbnail:
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=60",
    duration: 30,
    isFeatured: false,
    status: "published",
    views: 41,
    quiz: [
      {
        question: "¿Cuántos vasos de agua se piden en la semana 1?",
        options: ["5 vasos", "6 vasos", "8 vasos"],
        correctIndex: 1,
        explanation: "Semana 1: 6 vasos de agua y 5 minutos de caminata.",
      },
      {
        question: "¿Cuánto dura la caminata en la semana 3?",
        options: ["10 minutos", "5 minutos", "15 minutos"],
        correctIndex: 2,
        explanation:
          "Semana 3: 8 vasos de agua y 15 minutos de ejercicio libre.",
      },
    ],
  },
  {
    type: "article",
    category: "environment",
    title: "Tu transformación también es ambiental",
    description:
      "Cuidar de ti y cuidar de tu entorno van de la mano. Conoce acciones simples.",
    body:
      "Reciclar, caminar en vez de usar el carro para distancias cortas, y " +
      "apoyar el comercio local son pequeñas decisiones con gran impacto.\n\n" +
      "Empieza con una sola acción esta semana.",
    thumbnail:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=60",
    duration: 5,
    isFeatured: false,
    status: "published",
    views: 23,
    quiz: [
      {
        question: "¿Cuál de estas es una acción ambiental mencionada en el artículo?",
        options: [
          "Caminar en vez de usar el carro para distancias cortas",
          "Comprar más plástico de un solo uso",
          "Dejar luces encendidas toda la noche",
        ],
        correctIndex: 0,
        explanation:
          "Reciclar, caminar en vez de usar el carro y apoyar el comercio local son decisiones con gran impacto.",
      },
      {
        question: "¿Con qué empieza el artículo?",
        options: [
          "Con todas las acciones a la vez",
          "Con una sola acción esta semana",
          "Con un plan de un año",
        ],
        correctIndex: 1,
        explanation: "Empieza con una sola acción esta semana.",
      },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `✅ Conectado a ${mongoose.connection.host} / ${mongoose.connection.name}`
    );

    if (RESET) {
      await Promise.all([User.deleteMany({}), Content.deleteMany({})]);
      console.log("🗑️  Colecciones vaciadas (--reset)");
    }

    const userCount = await User.countDocuments();
    const contentCount = await Content.countDocuments();

    if (userCount > 0 || contentCount > 0) {
      console.log(
        "⚠️  Ya existen datos. Usa 'npm run seed -- --reset' para reemplazarlos."
      );
      process.exit(0);
    }

    const createdUsers = await User.create(users);
    console.log(`👤 ${createdUsers.length} usuarios creados (admin@planta.com / admin123)`);

    const createdContents = await Content.create(contents);
    console.log(`📄 ${createdContents.length} contenidos creados`);

    await mongoose.disconnect();
    console.log("✅ Seed completado");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error en el seed:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
