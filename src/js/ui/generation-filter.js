import { GENERATIONS, getIdsInGenerations, getPokemonSpriteUrl } from "../data/generations.js";
import { FINAL_EVOLUTION_IDS } from "../data/final-evolutions.js";

export function renderGenerationFilter(selectedGenerationIds, onToggle) {
    const container = document.querySelector("#generationGrid");
    container.innerHTML = "";
    GENERATIONS.forEach(generation => {
        const isSelected = selectedGenerationIds.includes(generation.id);
        const finalCount = getIdsInGenerations([generation.id], FINAL_EVOLUTION_IDS).length;
        const card = document.createElement("button");
        card.type = "button";
        card.classList.add("generation-card");
        card.classList.toggle("selected", isSelected);
        card.setAttribute("aria-pressed", String(isSelected));
        card.innerHTML = `
            <div class="generation-sprites">
                ${generation.previewIds.map(id => `<img src="${getPokemonSpriteUrl(id)}" alt="" loading="lazy">`).join("")}
            </div>
            <h2>${generation.region}</h2>
            <p>Generación ${generation.id} · nº ${generation.firstId}–${generation.lastId}</p>
            <span>${finalCount} Pokémon elegibles</span>
        `;
        card.addEventListener("click", () => onToggle(generation.id));
        container.appendChild(card);
    });
}
