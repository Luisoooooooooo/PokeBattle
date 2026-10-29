import { createPokemon } from "../game/pokemon.js";
import { ITEM_OFFER_SIZE, supportedItems } from "../data/items.js";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
const ITEM_API_BASE_URL = "https://pokeapi.co/api/v2/item";
const MAX_POKEMON_ID = 1025;

export async function getPokemon(id) {
    const response = await fetch(`${POKEAPI_BASE_URL}/${id}`);

    if (!response.ok) {
        throw new Error(`Error al cargar el Pokémon con ID ${id}`);
    }

    const data = await response.json();
    return createPokemon(data);
}

export async function getItem(id) {
    const response = await fetch(`${ITEM_API_BASE_URL}/${id}`);
    if (!response.ok) {
        throw new Error(`Error al cargar el objeto con ID ${id}`);
    }
    const data = await response.json();
    return {
        id: data.name,
        sprite: data.sprites.default
    };
}

function shuffleArray(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

export async function getRandomItemOffer() {
    const normalItems = supportedItems.filter(
        item => !item.rare
    );
    const rareItems = supportedItems.filter(
        item => item.rare
    );
    const selectedItems = shuffleArray(normalItems).slice(
        0,
        ITEM_OFFER_SIZE
    );

    if (Math.random() < 0.35 && rareItems.length > 0) {
        const randomRareItem = rareItems[Math.floor(Math.random() * rareItems.length)];
        selectedItems[selectedItems.length - 1] = randomRareItem;
    }

    const itemOffer = await Promise.all(
        selectedItems.map(async item => {
            const apiItem = await getItem(item.id);
            return {
                ...item,
                sprite: apiItem.sprite
            };
        })
    );
    return itemOffer;
}

function canAddPokemonByTypeLimit(pokemon, typeCounts, maxPerType) {
    return pokemon.types.every(type => {
        return (typeCounts[type] ?? 0) < maxPerType;
    });
}

function addPokemonTypesToCount(pokemon, typeCounts) {
    pokemon.types.forEach(type => {
        typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    });
}

// Sin idPool se elige entre todos los IDs del 1 a MAX_POKEMON_ID
function getRandomUntriedIds(amount, triedIds, idPool = null) {
    const poolSize = idPool ? idPool.length : MAX_POKEMON_ID;
    const ids = [];
    while (ids.length < amount && triedIds.size < poolSize) {
        const randomIndex = Math.floor(Math.random() * poolSize);
        const randomId = idPool ? idPool[randomIndex] : randomIndex + 1;
        if (triedIds.has(randomId)) {
            continue;
        }
        triedIds.add(randomId);
        ids.push(randomId);
    }
    return ids;
}

export async function getUniqueRandomPokemon(count, maxPerType = null, idPool = null) {
    const pokemonMap = new Map();
    const typeCounts = {};
    const triedIds = new Set();
    while (pokemonMap.size < count) {
        // Se piden el doble de los que faltan porque algunos se descartan por el límite de tipos
        const batchIds = getRandomUntriedIds((count - pokemonMap.size) * 2, triedIds, idPool);
        if (batchIds.length === 0) {
            throw new Error("No hay suficientes Pokémon disponibles");
        }
        const results = await Promise.allSettled(batchIds.map(id => getPokemon(id)));
        const loadedPokemon = results
            .filter(result => result.status === "fulfilled")
            .map(result => result.value);
        if (loadedPokemon.length === 0) {
            throw results[0].reason;
        }
        for (const pokemon of loadedPokemon) {
            if (pokemonMap.size >= count) {
                break;
            }
            if (maxPerType !== null && !canAddPokemonByTypeLimit(pokemon, typeCounts, maxPerType)) {
                continue;
            }
            pokemonMap.set(pokemon.id, pokemon);
            if (maxPerType !== null) {
                addPokemonTypesToCount(pokemon, typeCounts);
            }
        }
    }

    return [...pokemonMap.values()];
}
