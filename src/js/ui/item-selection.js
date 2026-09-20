import { renderTypes } from "./pokemon-cards.js";
import { formatPokemonName } from "../utils/formatters.js";

export function renderItemTeam(pokemonTeam, selectedPokemonId, onPokemonSelect) {
    const container = document.querySelector("#itemTeamGrid");
    container.innerHTML = "";
    pokemonTeam.forEach(pokemon => {
        const card = document.createElement("article");
        card.classList.add("item-team-card");
        if (pokemon.id === selectedPokemonId) {
            card.classList.add("selected");
        }
        card.innerHTML = `
            <img src="${pokemon.sprite}" alt="${formatPokemonName(pokemon.name)}">
            <div>
                <strong>${formatPokemonName(pokemon.name)}</strong>
                <div class="pokemon-types">${renderTypes(pokemon.types)}</div>
                <p>${pokemon.item ? pokemon.item.name : "Sin objeto"}</p>
                ${pokemon.item ? `<button class="remove-item-btn" type="button">Quitar objeto</button>` : ""}
            </div>
        `;
        const removeItemBtn = card.querySelector(".remove-item-btn");
        if (removeItemBtn) {
            removeItemBtn.addEventListener("click", event => {
                event.stopPropagation();
                pokemon.item = null;
                onPokemonSelect(pokemon);
            });
        }
        card.addEventListener("click", () => {
            onPokemonSelect(pokemon);
        });
        container.appendChild(card);
    });
}

export function renderItemOffer(items, pokemonTeam, onItemSelect) {
    const container = document.querySelector("#itemOfferGrid");
    container.innerHTML = "";
    items.forEach(item => {
        const equipped = pokemonTeam.some(pokemon => pokemon.item?.id === item.id);
        const card = document.createElement("article");
        card.classList.add("item-card");
        if (equipped) {
            card.classList.add("used");
        }
        card.innerHTML = `
            <img src="${item.sprite}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
        `;
        card.addEventListener("click", () => {
            if (equipped) {
                return;
            }
            onItemSelect(item);
        });
        container.appendChild(card);
    });
}