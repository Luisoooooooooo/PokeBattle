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

export async function getRandomPokemon() {
    const randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
    return getPokemon(randomId);
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

export async function getUniqueRandomPokemon(count, maxPerType = null) {
    const pokemonMap = new Map();
    const typeCounts = {};
    while (pokemonMap.size < count) {
        const pokemon = await getRandomPokemon();
        if (pokemonMap.has(pokemon.id)) {
            continue;
        }
        if (maxPerType !== null && !canAddPokemonByTypeLimit(pokemon, typeCounts, maxPerType)) {
            continue;
        }
        pokemonMap.set(pokemon.id, pokemon);
        if (maxPerType !== null) {
            addPokemonTypesToCount(pokemon, typeCounts);
        }
    }

    return [...pokemonMap.values()];
}
