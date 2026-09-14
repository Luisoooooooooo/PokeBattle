import { typeMeta, TYPE_ICON_BASE } from "../data/types.js";

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function createPokemonCard(pokemon, selectedPokemon, onToggle) {
    const card = document.createElement("article");
    card.classList.add("pokemon-card");
    if (selectedPokemon.some(selected => selected.id === pokemon.id)) {
        card.classList.add("selected");
    }
    card.innerHTML = `
        <img src="${pokemon.sprite}" alt="${capitalize(pokemon.name)}">
        <h2>${capitalize(pokemon.name)}</h2>
        <div class="pokemon-types">
            ${renderTypes(pokemon.types)}
        </div>
        <div class="pokemon-stats">
            <span>HP ${pokemon.maxHp}</span>
            <span>ATK ${pokemon.attack}</span>
            <span>DEF ${pokemon.defense}</span>
            <span>VEL ${pokemon.speed}</span>
        </div>
    `;
    card.addEventListener("click", () => {
        onToggle(pokemon);
    })

    return card;
}

export function renderTypes(types) {
    return types.map(type => {
        const meta = typeMeta[type] ?? {color: "#666"};
        return `
            <span class="type" style="--type-color:${meta.color}">
                <img class="type-icon" src="${TYPE_ICON_BASE}/${type}.svg" alt="" aria-hidden="true">
                ${capitalize(type)}
            </span>
        `;
    }).join("");
}

export function renderPokemonCards(pokemonList, selectedPokemon, onToggle) {
    const pokemonGrid = document.querySelector("#pokemonGrid");
    pokemonGrid.innerHTML = "";

    pokemonList.forEach(pokemon => {
        const card = createPokemonCard(pokemon, selectedPokemon, onToggle);
        pokemonGrid.appendChild(card);
    });
}