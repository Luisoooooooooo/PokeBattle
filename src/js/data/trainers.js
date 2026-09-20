const TRAINER_CLASSES = [
    {
        className: "ARLEQUÍN",
        gender: "male",
        sprite: "./src/assets/trainers/Spr_B2W2_Harlequin.png"
    },
    {
        className: "MONTAÑERO",
        gender: "male",
        sprite: "./src/assets/trainers/Spr_B2W2_Hiker.png"
    },
    {
        className: "CONSERJE",
        gender: "male",
        sprite: "./src/assets/trainers/Spr_B2W2_Janitor.png"
    },
    {
        className: "DAMA",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Lady.png"
    },
    {
        className: "CHICA",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Lass.png"
    },
    {
        className: "DONCELLA",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Maid.png"
    },
    {
        className: "MÚSICO",
        gender: "male",
        sprite: "./src/assets/trainers/Spr_B2W2_Musician.png"
    },
    {
        className: "ENFERMERA",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Nurse.png"
    },
    {
        className: "CUIDADORA",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Nursery_Aide.png"
    },
    {
        className: "DAMA PARASOL",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Parasol_Lady.png"
    }
];

const MALE_NAMES = [
    "MANUEL",
    "JAVIER",
    "CARLOS",
    "RAÚL",
    "SERGIO",
    "DANIEL",
    "MARCOS",
    "ÁLVARO",
    "DIEGO",
    "PABLO",
    "HUGO",
    "MARIO"
];

const FEMALE_NAMES = [
    "LAURA",
    "MARTA",
    "LUCÍA",
    "PAULA",
    "ELENA",
    "SARA",
    "ANDREA",
    "CLAUDIA",
    "IRENE",
    "NATALIA",
    "ALBA",
    "SOFÍA"
];

function shuffle(array) {
    const shuffledArray = [...array];
    for (let index = shuffledArray.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledArray[index], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[index]];
    }
    return shuffledArray;
}

function getRandomName(gender, usedNames) {
    const names = gender === "female" ? FEMALE_NAMES : MALE_NAMES;
    const availableNames = names.filter(name => !usedNames.includes(name));
    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    usedNames.push(name);
    return name;
}

export function getRandomTrainers(amount = 5) {
    const trainerClasses = shuffle(TRAINER_CLASSES).slice(0, amount);
    const usedNames = [];
    return trainerClasses.map(trainerClass => {
        const trainerName = getRandomName(trainerClass.gender, usedNames);
        return {
            className: trainerClass.className,
            trainerName,
            name: `${trainerClass.className} ${trainerName}`,
            sprite: trainerClass.sprite
        };
    });
}