import { getUniqueRandomPokemon } from "./api/pokeapi.js";
import { renderPokemonCards } from "./ui/pokemon-cards.js";

async function init() {
    try {
        const pokemon = await getUniqueRandomPokemon(12);
        renderPokemonCards(pokemon);
    } catch (error) {
        console.error(error);
    }
}

init();