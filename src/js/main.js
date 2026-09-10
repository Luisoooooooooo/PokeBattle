import { getUniqueRandomPokemon } from "./api/pokeapi.js";
import { renderPokemonCards } from "./ui/pokemon-cards.js";

const TEAM_SIZE = 6;
let pokemonOffer = [];
let selectedPokemon = [];

function updateSelectionUI() {
    const selectionCount = document.querySelector("#selectionCount");
    const continueBtn = document.querySelector("#continueBtn");
    selectionCount.textContent = `${selectedPokemon.length} / ${TEAM_SIZE} seleccionados`;
    continueBtn.disabled = selectedPokemon.length !== TEAM_SIZE;
}

function togglePokemonSelection(pokemon) {
    const isSelected = selectedPokemon.some(
        selected => selected.id === pokemon.id
    );

    if (isSelected) {
        selectedPokemon = selectedPokemon.filter(
            selected => selected.id !== pokemon.id
        );
    } else {
        if (selectedPokemon.length >= TEAM_SIZE) {
            return;
        }

        selectedPokemon.push(pokemon);
    }

    renderPokemonCards(pokemonOffer, selectedPokemon, togglePokemonSelection);
    updateSelectionUI();
}

async function init() {
    try {
        pokemonOffer = await getUniqueRandomPokemon(12);
        renderPokemonCards(pokemonOffer, selectedPokemon, togglePokemonSelection);
        updateSelectionUI();
    } catch (error) {
        console.error(error);
    }
}

init();