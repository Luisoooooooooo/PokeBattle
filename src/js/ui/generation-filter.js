import { GENERATIONS } from "../data/generations.js";

export function renderGenerationChips(selector, selectedGenerationIds, onToggle) {
    const container = document.querySelector(selector);
    container.innerHTML = "";
    GENERATIONS.forEach(generation => {
        const isSelected = selectedGenerationIds.includes(generation.id);
        // La última región marcada no se puede quitar
        const isLastSelected = isSelected && selectedGenerationIds.length === 1;
        const chip = document.createElement("button");
        chip.type = "button";
        chip.classList.add("generation-chip");
        chip.classList.toggle("selected", isSelected);
        chip.setAttribute("aria-pressed", String(isSelected));
        chip.title = isLastSelected ? "Tiene que quedar al menos una región" : `Generación ${generation.id}`;
        chip.disabled = isLastSelected;
        chip.textContent = generation.region;
        chip.addEventListener("click", () => onToggle(generation.id));
        container.appendChild(chip);
    });
}
