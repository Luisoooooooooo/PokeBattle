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
            <img class="item-team-pokemon-sprite" src="${pokemon.sprite}" alt="${formatPokemonName(pokemon.name)}">
            <div class="item-team-content">
                <strong>${formatPokemonName(pokemon.name)}</strong>
                <div class="pokemon-types">${renderTypes(pokemon.types)}</div>
                ${pokemon.item ? `
                    <div class="equipped-item">
                        <img class="equipped-item-sprite" src="${pokemon.item.sprite}" alt="">
                        <span>${pokemon.item.name}</span>
                        <button class="remove-item-btn" type="button" aria-label="Quitar ${pokemon.item.name}">×</button>
                    </div>
                ` : `
                    <p class="no-item">Sin objeto</p>
                `}
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