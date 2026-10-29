// Rutas del modo aventura: paradas entre combate y combate, dinero, tienda y eventos

export const START_MONEY = 1000;
export const ROUTE_LENGTH = 3;
const OPTIONS_PER_STEP = 3;

export const NODE_TYPES = {
    trainer: {
        label: "Entrenador",
        description: "Combate contra un entrenador de la ruta. Ganas dinero, pero tu equipo no se cura.",
        icon: "./src/assets/trainers/Spr_B2W2_Hiker.png"
    },
    event: {
        label: "Evento",
        description: "Algo inesperado: un Pokémon salvaje, un objeto, dinero o un entrenamiento.",
        icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-candy.png"
    },
    shop: {
        label: "Tienda",
        description: "Compra objetos para tu mochila y medicinas para tu equipo.",
        icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
    },
    center: {
        label: "Centro Pokémon",
        description: "Tu equipo recupera todos sus PS y se reaniman los debilitados.",
        icon: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-potion.png"
    }
};

const NODE_WEIGHTS = { trainer: 35, event: 30, shop: 20, center: 15 };

export const MEDICINES = [
    {
        id: "super-potion",
        name: "Superpoción",
        price: 400,
        description: "Todo tu equipo recupera la mitad de sus PS máximos."
    },
    {
        id: "revive",
        name: "Revivir",
        price: 700,
        description: "Tus Pokémon debilitados vuelven con la mitad de sus PS."
    }
];

const NORMAL_ITEM_PRICE = 600;
const RARE_ITEM_PRICE = 2000;
const TRAINING_BONUS = 5;
const TRAINED_STATS = ["attack", "specialAttack", "defense", "specialDefense", "speed"];

function pickWeighted(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;
    for (const [key, weight] of entries) {
        roll -= weight;
        if (roll < 0) {
            return key;
        }
    }
    return entries[entries.length - 1][0];
}

function createStep(mustInclude = null) {
    const options = mustInclude ? [mustInclude] : [];
    while (options.length < OPTIONS_PER_STEP) {
        const available = Object.fromEntries(Object.entries(NODE_WEIGHTS).filter(([type]) => !options.includes(type)));
        options.push(pickWeighted(available));
    }
    return options.sort(() => Math.random() - 0.5);
}

// La última parada siempre ofrece un Centro Pokémon para llegar al combate con PS
export function createRoute(name) {
    const steps = Array.from({ length: ROUTE_LENGTH }, (_, index) => createStep(index === ROUTE_LENGTH - 1 ? "center" : null));
    return { name, index: 0, steps };
}

export function getRouteName(stage, leagueStart) {
    return stage === leagueStart ? "Calle Victoria" : `Ruta ${stage + 1}`;
}

export function getItemPrice(item) {
    return item.rare ? RARE_ITEM_PRICE : NORMAL_ITEM_PRICE;
}

// Cada objeto de la mochila lleva su propio uid para poder tener dos iguales
export function createBagItem(item) {
    return { ...item, uid: `${item.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}` };
}

export function applyMedicine(medicineId, team) {
    team.forEach(pokemon => {
        const halfHp = Math.ceil(pokemon.maxHp / 2);
        if (medicineId === "super-potion" && !pokemon.fainted) {
            pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + halfHp);
        }
        if (medicineId === "revive" && pokemon.fainted) {
            pokemon.currentHp = halfHp;
            pokemon.fainted = false;
        }
    });
}

export function applyTraining(team) {
    team.forEach(pokemon => {
        TRAINED_STATS.forEach(stat => {
            pokemon[stat] += TRAINING_BONUS;
        });
    });
    return TRAINING_BONUS;
}

export function pickEvent() {
    return pickWeighted({ wild: 30, item: 25, training: 20, money: 25 });
}

// Dinero según lo avanzada que esté la región (stage = índice del próximo combate)
export function getRouteTrainerReward(stage) {
    return 200 + stage * 100;
}

export function getFoundMoney(stage) {
    return 150 + stage * 75;
}

export function getBattleReward(kind, stage) {
    if (kind === "gym") {
        return 800 + stage * 300;
    }
    if (kind === "elite") {
        return 2000;
    }
    return 5000;
}

export function getRouteTrainerTeamSize(stage) {
    return Math.min(4, 1 + Math.floor(stage / 3));
}

export function formatMoney(amount) {
    return `₽${amount.toLocaleString("es-ES")}`;
}
