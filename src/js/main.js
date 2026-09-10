import { getPokemon } from "./api/pokeapi.js";

async function init() {
    try {
        const pokemon = await getPokemon(25);
        console.log(pokemon);
    } catch (error) {
        console.error(error);
    }
}

init();