import { renderTypes } from "./pokemon-cards.js";
import { formatPokemonName } from "../utils/formatters.js";

// En la aventura los objetos llevan uid (puede haber dos iguales); en el clásico basta el id
function getItemKey(item) {
    return item?.uid ?? item?.id;
}

export function renderItemTeam(pokemonTeam, selectedPokemonId, onPokemonSelect, onRemoveItem = pokemon => { pokemon.item = null; }) {
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
                onRemoveItem(pokemon);
                onPokemonSelect(pokemon);
            });
        }
        card.addEventListener("click", () => {
            onPokemonSelect(pokemon);
        });
        container.appendChild(card);
    });
}

export function renderItemOffer(items, pokemonTeam, onItemSelect, emptyMessage = "") {
    const container = document.querySelector("#itemOfferGrid");
    container.innerHTML = "";
    if (items.length === 0 && emptyMessage) {
        container.innerHTML = `<p class="item-offer-empty">${emptyMessage}</p>`;
        return;
    }
    items.forEach(item => {
        const equipped = pokemonTeam.some(pokemon => getItemKey(pokemon.item) === getItemKey(item));
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