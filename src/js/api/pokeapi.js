import { createPokemon } from "../game/pokemon.js";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
const MAX_POKEMON_ID = 1025;

export async function getPokemon(id) {
    const response = await fetch(`${POKEAPI_BASE_URL}/${id}`);

    if (!response.ok) {
        throw new Error(`Error al cargar el Pokémon con ID ${id}`);
    }

    const data = await response.json();
    return createPokemon(data);
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
