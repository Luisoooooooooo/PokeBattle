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

export async function getUniqueRandomPokemon(count) {
    const pokemonMap = new Map();

    while (pokemonMap.size < count) {
        const pokemon = await getRandomPokemon();
        pokemonMap.set(pokemon.id, pokemon);
    }

    return [...pokemonMap.values()];
}
