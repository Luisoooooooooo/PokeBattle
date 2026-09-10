import { getUniqueRandomPokemon } from "./api/pokeapi.js";

async function init() {
    try {
        const pokemon = await getUniqueRandomPokemon(12);
        console.log(pokemon);
    } catch (error) {
        console.error(error);
    }
}

init();