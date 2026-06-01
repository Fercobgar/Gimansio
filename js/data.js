const ROUTINE = {
  warmup: {
    name: "Calentamiento Dinámico",
    duration: "5-7 min",
    exercises: [
      { id: "w1", name: "Rotaciones de hombros y brazos", target: "1 minuto", icon: "🔄" },
      { id: "w2", name: "Gato-Camello (Cat-Cow)", target: "10 reps", icon: "🐈" },
      { id: "w3", name: "Aperturas de pecho dinámicas", target: "15 reps", icon: "🤸" },
      { id: "w4", name: "Puentes de glúteo", target: "15 reps", icon: "🌉" },
      { id: "w5", name: "Zancadas con rotación de torso", target: "10 por pierna", icon: "🚶" },
    ],
  },

  days: [
    {
      id: "push",
      label: "Empuje",
      subtitle: "Día 1 & 4",
      focus: "Pecho · Hombros · Tríceps",
      weekDays: [1, 4],
      exercises: [
        { id: "p1", name: "Press de banca con mancuernas",           sets: 4, repsMin: 8,  repsMax: 10, rest: "90-120s", compound: true  },
        { id: "p2", name: "Press militar con mancuernas (sentado)",  sets: 3, repsMin: 8,  repsMax: 12, rest: "90-120s", compound: true  },
        { id: "p3", name: "Pec Deck / Cruces en polea",              sets: 3, repsMin: 10, repsMax: 15, rest: "60-90s",  compound: false },
        { id: "p4", name: "Elevaciones laterales con mancuernas",    sets: 4, repsMin: 12, repsMax: 15, rest: "60-90s",  compound: false },
        { id: "p5", name: "Extensión de tríceps en polea (cuerda)",  sets: 3, repsMin: 10, repsMax: 15, rest: "60-90s",  compound: false },
        { id: "p6", name: "Fondos en máquina / entre bancos",        sets: 3, repsMin: null, repsMax: null, repsLabel: "Al fallo técnico", rest: "60-90s", compound: false },
      ],
    },
    {
      id: "pull",
      label: "Tirón",
      subtitle: "Día 2 & 5",
      focus: "Espalda · Bíceps · Deltoides posterior",
      weekDays: [2, 5],
      exercises: [
        { id: "u1", name: "Jalón al pecho en polea (agarre prono ancho)", sets: 4, repsMin: 8,  repsMax: 12, rest: "90-120s", compound: true  },
        { id: "u2", name: "Remo en máquina / polea baja (agarre neutro)", sets: 3, repsMin: 8,  repsMax: 12, rest: "90-120s", compound: true  },
        { id: "u3", name: "Face pulls en polea",                          sets: 4, repsMin: 12, repsMax: 15, rest: "60-90s",  compound: false },
        { id: "u4", name: "Curl de bíceps con barra / polea baja",        sets: 3, repsMin: 10, repsMax: 12, rest: "60-90s",  compound: false },
        { id: "u5", name: "Curl martillo con mancuernas",                 sets: 3, repsMin: 10, repsMax: 15, rest: "60-90s",  compound: false },
        { id: "u6", name: "Encogimientos de hombros (Trapecios)",         sets: 3, repsMin: 12, repsMax: 15, rest: "60-90s",  compound: false },
      ],
    },
    {
      id: "legs",
      label: "Piernas",
      subtitle: "Día 3 & 6",
      focus: "Cuádriceps · Isquios · Core",
      weekDays: [3, 6],
      exercises: [
        { id: "l1", name: "Prensa de piernas (Leg Press)",              sets: 4, repsMin: 8,  repsMax: 12, rest: "90-120s", compound: true  },
        { id: "l2", name: "Peso muerto rumano con mancuernas",          sets: 3, repsMin: 8,  repsMax: 12, rest: "90-120s", compound: true  },
        { id: "l3", name: "Extensión de cuádriceps en máquina",         sets: 3, repsMin: 12, repsMax: 15, rest: "60-90s",  compound: false },
        { id: "l4", name: "Curl de isquiotibiales en máquina",          sets: 3, repsMin: 10, repsMax: 15, rest: "60-90s",  compound: false },
        { id: "l5", name: "Elevación de talones (Gemelos)",             sets: 4, repsMin: 15, repsMax: 20, rest: "60s",     compound: false },
        { id: "l6", name: "Plancha abdominal (Plank)",                  sets: 3, repsMin: null, repsMax: null, repsLabel: "45-60 segundos", rest: "60s", compound: false },
        { id: "l7", name: "Crunch en polea alta / suelo",               sets: 3, repsMin: 15, repsMax: 20, rest: "60s",     compound: false },
      ],
    },
  ],

  rest: {
    id: "rest",
    label: "Descanso",
    subtitle: "Domingo",
    note: "Descanso activo: caminar, estirar o fútbol 7. Sin estrés muscular.",
    weekDays: [0],
  },
};
