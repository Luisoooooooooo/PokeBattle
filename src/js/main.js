import { getPokemon } from "./api/pokeapi.js";
import { createPokemon } from "./game/pokemon.js";

async function init() {
    try {
        const pokemonData = await getPokemon(25);
        const pokemon = createPokemon(pokemonData);
        console.log(pokemon);
    } catch (error) {
        console.error(error);
    }
}

init();