// lib/demo/content.ts — Catálogo del modo demo (mismo contrato que /api/content)
export type DemoQuiz = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type DemoContent = {
  _id: string;
  type: "video" | "article";
  category: "environment" | "fitness" | "routine" | "challenges";
  title: string;
  description: string;
  thumbnail: string;
  body: string;
  duration: number;
  views: number;
  isNew: boolean;
  isFeatured: boolean;
  status: "published" | "draft" | "archived";
  createdAt: string;
  videoSource?: "youtube";
  youtubeId?: string;
  videoUrl?: string;
  quiz?: DemoQuiz[];
};

const id = (n: number) => `65f0a1c4e7b2d3a9f8c0${String(n).padStart(4, "0")}`;
const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const DEMO_CONTENT: DemoContent[] = [
  {
    _id: id(1),
    type: "video",
    category: "fitness",
    title: "Rutina de movilidad para empezar el día",
    description: "5 minutos de estiramientos guiados para activar el cuerpo antes de cualquier actividad.",
    thumbnail: "asset:hola",
    body: "",
    duration: 5,
    views: 428,
    isNew: false,
    isFeatured: true,
    status: "published",
    createdAt: day(12),
    videoSource: "youtube",
    youtubeId: "cacwri2wio4",
    videoUrl: "https://www.youtube.com/embed/cacwri2wio4",
  },
  {
    _id: id(2),
    type: "video",
    category: "environment",
    title: "Ejercicio al aire libre: conecta con tu entorno",
    description: "Ideas para entrenar en parques y espacios naturales de tu ciudad.",
    thumbnail: "asset:cambio",
    body: "",
    duration: 30,
    views: 254,
    isNew: false,
    isFeatured: false,
    status: "published",
    createdAt: day(10),
    videoSource: "youtube",
    youtubeId: "U07R85A_WJg",
    videoUrl: "https://www.youtube.com/embed/U07R85A_WJg",
  },
  {
    _id: id(3),
    type: "article",
    category: "routine",
    title: "Cómo construir una rutina matutina de 10 minutos",
    description: "Guía paso a paso para armar un hábito de transformación que sí puedas mantener.",
    thumbnail: "asset:respirar",
    body:
      "Comienza con una intención clara. No necesitas una mañana perfecta: necesitas una mañana que se repita.\n\n" +
      "Los hábitos que duran son pequeños, específicos y están anclados a algo que ya haces. Por eso funcionan mejor que los grandes propósitos de lunes.\n\n" +
      "1. Define una sola acción mínima (ej: 5 flexiones).\n" +
      "2. Ata el hábito a algo que ya haces (después de cepillarte los dientes).\n" +
      "3. Registra cada día en 'Mi actividad' para ver tu racha crecer.\n\n" +
      "La constancia vence a la intensidad.",
    duration: 10,
    views: 389,
    isNew: false,
    isFeatured: true,
    status: "published",
    createdAt: day(9),
    quiz: [
      { question: "¿Qué es lo primero que debes definir al armar una rutina matutina?", options: ["La hora exacta a la que te levantas", "Una intención clara", "El número total de días del reto"], correctIndex: 1, explanation: "El texto propone empezar con una intención clara: eso sostiene el resto del plan." },
      { question: "¿Cómo se recomienda atar el hábito nuevo?", options: ["A algo que ya haces todos los días", "Al final de la semana", "A la motivación de otros"], correctIndex: 0, explanation: "Unir el hábito nuevo a una rutina existente lo hace más fácil de recordar." },
      { question: "Según la guía, ¿qué pesa más?", options: ["La constancia", "La intensidad", "La duración exacta"], correctIndex: 0, explanation: "La constancia vence a la intensidad." },
    ],
  },
  {
    _id: id(4),
    type: "article",
    category: "challenges",
    title: "Reto 30 días: hidratación y movimiento",
    description: "Un reto progresivo para beber más agua y moverte un poco más cada día.",
    thumbnail: "asset:agua",
    body:
      "Treinta días bastan para que el cuerpo note la diferencia. El truco es subir poco a poco.\n\n" +
      "Semana 1: 6 vasos de agua y 5 minutos de caminata.\n" +
      "Semana 2: 7 vasos de agua y 10 minutos de caminata.\n" +
      "Semana 3: 8 vasos de agua y 15 minutos de ejercicio libre.\n" +
      "Semana 4: sostén el hábito y comparte tu resultado.",
    duration: 30,
    views: 241,
    isNew: false,
    isFeatured: false,
    status: "published",
    createdAt: day(8),
    quiz: [
      { question: "¿Cuántos vasos de agua se piden en la semana 1?", options: ["5 vasos", "6 vasos", "8 vasos"], correctIndex: 1, explanation: "Semana 1: 6 vasos de agua y 5 minutos de caminata." },
      { question: "¿Cuánto dura la caminata en la semana 3?", options: ["10 minutos", "5 minutos", "15 minutos"], correctIndex: 2, explanation: "Semana 3: 8 vasos de agua y 15 minutos de ejercicio libre." },
    ],
  },
  {
    _id: id(5),
    type: "article",
    category: "environment",
    title: "Tu transformación también es ambiental",
    description: "Cuidar de ti y cuidar de tu entorno van de la mano. Conoce acciones simples.",
    thumbnail: "asset:eco",
    body:
      "Reciclar, caminar en vez de usar el carro para distancias cortas, y apoyar el comercio local son pequeñas decisiones con gran impacto.\n\n" +
      "Cada acción cuenta doble: mejora tu salud y alivia el planeta.\n\n" +
      "Empieza con una sola acción esta semana.",
    duration: 5,
    views: 223,
    isNew: false,
    isFeatured: false,
    status: "published",
    createdAt: day(7),
    quiz: [
      { question: "¿Cuál de estas es una acción ambiental mencionada en el artículo?", options: ["Caminar en vez de usar el carro para distancias cortas", "Comprar más plástico de un solo uso", "Dejar luces encendidas toda la noche"], correctIndex: 0, explanation: "Caminar en vez de usar el carro es una decisión con gran impacto." },
      { question: "¿Con qué empieza el artículo?", options: ["Con todas las acciones a la vez", "Con una sola acción esta semana", "Con un plan de un año"], correctIndex: 1, explanation: "Empieza con una sola acción esta semana." },
    ],
  },
  {
    _id: id(6),
    type: "article",
    category: "routine",
    title: "Respira 5 minutos: la pausa que reinicia tu día",
    description: "Una técnica simple de respiración para bajar el estrés y recuperar el foco.",
    thumbnail: "asset:respirar",
    body:
      "Respirar es lo único que haces 20.000 veces al día sin pensar. Hacerlo con intención cambia cómo te sientes en minutos.\n\n" +
      "La respiración lenta activa el sistema nervioso parasimpático: baja el pulso, afloja los hombros y despeja la mente.\n\n" +
      "1. Siéntate con la espalda recta y los pies en el suelo.\n" +
      "2. Inhala por la nariz contando 4 segundos.\n" +
      "3. Sostén el aire 4 segundos.\n" +
      "4. Exhala despacio por la boca contando 6 segundos.\n" +
      "5. Repite durante 5 minutos.",
    duration: 5,
    views: 312,
    isNew: true,
    isFeatured: true,
    status: "published",
    createdAt: day(2),
    quiz: [
      { question: "¿Cuánto dura la exhalación en la técnica?", options: ["4 segundos", "6 segundos", "10 segundos"], correctIndex: 1, explanation: "Se exhala despacio durante 6 segundos." },
      { question: "¿Qué sistema activa la respiración lenta?", options: ["El parasimpático", "El digestivo", "El óseo"], correctIndex: 0, explanation: "Activa el sistema nervioso parasimpático, el de la calma." },
    ],
  },
  {
    _id: id(7),
    type: "article",
    category: "environment",
    title: "Pedalea tu ciudad: la bici le gana al tráfico",
    description: "Por qué moverte en bicicleta mejora tu energía, tu bolsillo y el aire que respiras.",
    thumbnail: "asset:bicicleta",
    body:
      "En trayectos de menos de 5 km la bicicleta suele ser más rápida que el carro en hora pico, y no paga parqueadero.\n\n" +
      "Además, pedalear 20 minutos al día mejora la capacidad cardiovascular y reduce el estrés.\n\n" +
      "1. Empieza con un solo trayecto a la semana.\n" +
      "2. Usa casco y luces, siempre.\n" +
      "3. Planea una ruta con ciclovía o calles tranquilas.\n" +
      "4. Súmalo a tu racha: cada viaje cuenta como acción.",
    duration: 6,
    views: 187,
    isNew: true,
    isFeatured: false,
    status: "published",
    createdAt: day(3),
    quiz: [
      { question: "¿Para qué distancias la bici suele ganarle al carro en hora pico?", options: ["Menos de 5 km", "Más de 30 km", "Solo fines de semana"], correctIndex: 0, explanation: "En trayectos cortos la bici es muy competitiva." },
      { question: "¿Cuál es un buen primer paso?", options: ["Cambiar todos tus viajes de golpe", "Un solo trayecto a la semana", "Comprar equipo costoso"], correctIndex: 1, explanation: "Empezar pequeño hace el hábito sostenible." },
    ],
  },
  {
    _id: id(8),
    type: "article",
    category: "fitness",
    title: "Fuerza en casa: 15 minutos sin equipo",
    description: "Un circuito corto para ganar fuerza usando solo el peso de tu cuerpo.",
    thumbnail: "asset:hola",
    body:
      "No necesitas gimnasio para ponerte fuerte. Necesitas constancia y buena técnica.\n\n" +
      "Este circuito trabaja piernas, pecho, espalda y abdomen en un cuarto de hora.\n\n" +
      "1. 12 sentadillas lentas.\n" +
      "2. 10 flexiones (apoya las rodillas si hace falta).\n" +
      "3. 30 segundos de plancha.\n" +
      "4. 12 zancadas por pierna.\n" +
      "5. Descansa 1 minuto y repite 2 veces más.",
    duration: 15,
    views: 276,
    isNew: false,
    isFeatured: true,
    status: "published",
    createdAt: day(6),
    quiz: [
      { question: "¿Cuántas rondas del circuito se sugieren en total?", options: ["1", "3", "10"], correctIndex: 1, explanation: "Una ronda inicial más dos repeticiones: 3 rondas." },
      { question: "Si las flexiones son muy difíciles, ¿qué haces?", options: ["Las omites", "Apoyas las rodillas", "Saltas el descanso"], correctIndex: 1, explanation: "Apoyar las rodillas reduce la carga sin perder la técnica." },
    ],
  },
  {
    _id: id(9),
    type: "article",
    category: "environment",
    title: "Aire limpio, mente clara",
    description: "Cómo la calidad del aire afecta tu energía y qué puedes hacer cada día para mejorarla.",
    thumbnail: "asset:aire",
    body:
      "El aire que respiras influye en tu concentración, tu sueño y tu ánimo, aunque casi nunca lo notemos.\n\n" +
      "Reducir el uso del carro, ventilar tu casa y sembrar plantas son acciones pequeñas que suman.\n\n" +
      "1. Ventila tu hogar 10 minutos cada mañana.\n" +
      "2. Camina o pedalea los trayectos cortos.\n" +
      "3. Evita ejercitarte junto a avenidas muy congestionadas.",
    duration: 6,
    views: 134,
    isNew: false,
    isFeatured: false,
    status: "published",
    createdAt: day(5),
    quiz: [
      { question: "¿Qué puedes hacer cada mañana en casa?", options: ["Ventilar 10 minutos", "Cerrar todas las ventanas", "Encender el carro"], correctIndex: 0, explanation: "Ventilar renueva el aire de tu hogar." },
    ],
  },
  {
    _id: id(10),
    type: "article",
    category: "challenges",
    title: "Reto: 7 días sin plástico de un solo uso",
    description: "Una semana para descubrir cuánto plástico usas y cómo reemplazarlo.",
    thumbnail: "asset:botella",
    body:
      "El plástico de un solo uso se usa minutos y dura siglos. Esta semana lo vas a notar en cada compra.\n\n" +
      "1. Lleva tu botella reutilizable y tu bolsa de tela.\n" +
      "2. Rechaza pitillos y cubiertos desechables.\n" +
      "3. Compra a granel o con empaques retornables.\n" +
      "4. Anota cada día qué reemplazaste.\n\n" +
      "Al terminar, tendrás hábitos que ya no pesan.",
    duration: 7,
    views: 198,
    isNew: true,
    isFeatured: false,
    status: "published",
    createdAt: day(1),
    quiz: [
      { question: "¿Qué llevas contigo para evitar plástico?", options: ["Botella reutilizable y bolsa de tela", "Más bolsas desechables", "Nada"], correctIndex: 0, explanation: "Son los dos reemplazos más simples." },
      { question: "¿Cuántos días dura el reto?", options: ["3", "7", "30"], correctIndex: 1, explanation: "Son siete días." },
    ],
  },
  {
    _id: id(11),
    type: "article",
    category: "environment",
    title: "Compra consciente: mercado sin desperdicio",
    description: "Planea, compra lo justo y aprovecha todo: ahorra dinero y reduce residuos.",
    thumbnail: "asset:carro",
    body:
      "Casi un tercio de la comida que se produce termina en la basura. Una buena lista de compras lo cambia todo.\n\n" +
      "1. Revisa tu nevera antes de salir.\n" +
      "2. Planea 3 comidas base para la semana.\n" +
      "3. Prefiere lo local y de temporada.\n" +
      "4. Congela lo que no vayas a usar pronto.",
    duration: 5,
    views: 97,
    isNew: false,
    isFeatured: false,
    status: "published",
    createdAt: day(4),
    quiz: [
      { question: "¿Qué haces antes de salir a comprar?", options: ["Revisar la nevera", "Comprar sin lista", "Ir con hambre"], correctIndex: 0, explanation: "Saber qué tienes evita duplicar compras." },
    ],
  },
  {
    _id: id(12),
    type: "article",
    category: "routine",
    title: "Descansa para rendir: guía de sueño y recuperación",
    description: "Tu cuerpo se transforma mientras duerme. Aprende a darle el descanso que necesita.",
    thumbnail: "asset:enfermo",
    body:
      "Entrenar sin dormir es pedalear con el freno puesto. El descanso es parte del progreso, no su enemigo.\n\n" +
      "1. Acuéstate y levántate a la misma hora.\n" +
      "2. Apaga las pantallas 30 minutos antes.\n" +
      "3. Mantén la habitación oscura y fresca.\n" +
      "4. Si estás enfermo, descansa: volver a tu racha es más fácil que volver de una recaída.",
    duration: 6,
    views: 164,
    isNew: false,
    isFeatured: false,
    status: "published",
    createdAt: day(11),
    quiz: [
      { question: "¿Cuánto antes de dormir apagas pantallas?", options: ["30 minutos", "5 segundos", "No hace falta"], correctIndex: 0, explanation: "Treinta minutos ayudan a conciliar el sueño." },
    ],
  },
  {
    _id: id(13),
    type: "article",
    category: "fitness",
    title: "Tu primer mes con pesas, sin lesiones",
    description: "Cómo empezar a entrenar fuerza con técnica, progresión y paciencia.",
    thumbnail: "asset:pesas",
    body:
      "La fuerza es una de las mejores inversiones para tu salud: huesos, metabolismo y postura mejoran.\n\n" +
      "1. Aprende la técnica con poco peso.\n" +
      "2. Entrena 3 días por semana, con un día de descanso entre sesiones.\n" +
      "3. Sube la carga solo cuando las repeticiones se sientan fáciles.\n" +
      "4. Calienta 5 minutos antes de empezar.",
    duration: 8,
    views: 151,
    isNew: false,
    isFeatured: false,
    status: "published",
    createdAt: day(13),
    quiz: [
      { question: "¿Cuándo subes la carga?", options: ["Cuando las repeticiones se sienten fáciles", "Todos los días", "Nunca"], correctIndex: 0, explanation: "La progresión debe ser gradual." },
    ],
  },
  {
    _id: id(14),
    type: "article",
    category: "routine",
    title: "Presupuesto de hábitos: invierte tu energía",
    description: "Igual que el dinero, tu energía es limitada. Aprende a repartirla donde más rinde.",
    thumbnail: "asset:factura",
    body:
      "Cada día tienes una cantidad limitada de energía y decisiones. Un hábito automático ahorra las dos.\n\n" +
      "1. Elige solo tres hábitos clave al mes.\n" +
      "2. Prepara el entorno la noche anterior.\n" +
      "3. Revisa cada domingo qué funcionó y qué no.",
    duration: 5,
    views: 76,
    isNew: false,
    isFeatured: false,
    status: "published",
    createdAt: day(14),
    quiz: [
      { question: "¿Cuántos hábitos clave se sugieren por mes?", options: ["Tres", "Veinte", "Ninguno"], correctIndex: 0, explanation: "Menos hábitos, mejor ejecución." },
    ],
  },
];
