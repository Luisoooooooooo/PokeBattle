const TRAINER_CLASSES = [
    {
        className: "Arlequín",
        gender: "male",
        sprite: "./src/assets/trainers/Spr_B2W2_Harlequin.png"
    },
    {
        className: "Montañero",
        gender: "male",
        sprite: "./src/assets/trainers/Spr_B2W2_Hiker.png"
    },
    {
        className: "Conserje",
        gender: "male",
        sprite: "./src/assets/trainers/Spr_B2W2_Janitor.png"
    },
    {
        className: "Dama",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Lady.png"
    },
    {
        className: "Chica",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Lass.png"
    },
    {
        className: "Doncella",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Maid.png"
    },
    {
        className: "Músico",
        gender: "male",
        sprite: "./src/assets/trainers/Spr_B2W2_Musician.png"
    },
    {
        className: "Enfermera",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Nurse.png"
    },
    {
        className: "Cuidadora",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Nursery_Aide.png"
    },
    {
        className: "Dama Parasol",
        gender: "female",
        sprite: "./src/assets/trainers/Spr_B2W2_Parasol_Lady.png"
    }
];

const MALE_NAMES = [
    "Manuel",
    "Javier",
    "Carlos",
    "Raúl",
    "Sergio",
    "Daniel",
    "Marcos",
    "Álvaro",
    "Diego",
    "Pablo",
    "Hugo",
    "Mario"
];

const FEMALE_NAMES = [
    "Laura",
    "Marta",
    "Lucía",
    "Paula",
    "Elena",
    "Sara",
    "Andrea",
    "Claudia",
    "Irene",
    "Natalia",
    "Alba",
    "Sofía"
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

// Para el modo aventura: más entrenadores que clases, así que los sprites se repiten
export function getRandomTrainerIdentities(amount) {
    const shuffledClasses = shuffle(TRAINER_CLASSES);
    const usedNames = [];
    return Array.from({ length: amount }, (_, index) => {
        const trainerClass = shuffledClasses[index % shuffledClasses.length];
        return {
            trainerName: getRandomName(trainerClass.gender, usedNames),
            gender: trainerClass.gender,
            sprite: trainerClass.sprite
        };
    });
}
