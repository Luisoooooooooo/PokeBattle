import { getUniqueRandomPokemon, getRandomItemOffer } from "./api/pokeapi.js";
import { renderPokemonCards } from "./ui/pokemon-cards.js";
import { renderItemTeam, renderItemOffer } from "./ui/item-selection.js";

const TEAM_SIZE = 6;
let pokemonOffer = [];
let selectedPokemon = [];
let itemOffer = [];
let selectedItemPokemonId = null;

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

async function confirmTeam() {
    if (selectedPokemon.length !== TEAM_SIZE) {
        return;
    }
    itemOffer = await getRandomItemOffer();
    selectedItemPokemonId = selectedPokemon[0]?.id ?? null;
    document.querySelector(".selection").classList.add("hidden");
    document.querySelector("#itemScreen").classList.remove("hidden");
    renderItemSelection();
}

function renderItemSelection() {
    renderItemTeam(selectedPokemon, selectedItemPokemonId, selectItemPokemon);
    renderItemOffer(itemOffer, selectedPokemon, equipItem);
}

function selectItemPokemon(pokemon) {
    selectedItemPokemonId = pokemon.id;
    renderItemSelection();
}

function equipItem(item) {
    const pokemon = selectedPokemon.find(pokemon => pokemon.id === selectedItemPokemonId);
    if (!pokemon) {
        return;
    }
    pokemon.item = item;
    renderItemSelection();
}

async function init() {
    try {
        pokemonOffer = await getUniqueRandomPokemon(12, 2);
        renderPokemonCards(pokemonOffer, selectedPokemon, togglePokemonSelection);
        updateSelectionUI();
        const continueBtn = document.querySelector("#continueBtn");
        continueBtn.addEventListener("click", confirmTeam);
    } catch (error) {
        console.error(error);
    }
}

init();