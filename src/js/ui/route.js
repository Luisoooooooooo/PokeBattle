import { NODE_TYPES, formatMoney } from "../game/routes.js";
import { formatPokemonName } from "../utils/formatters.js";

export function renderRouteOptions(selector, nodeTypes, onChoose) {
    const container = document.querySelector(selector);
    container.innerHTML = "";
    nodeTypes.forEach(type => {
        const node = NODE_TYPES[type];
        const option = document.createElement("button");
        option.type = "button";
        option.classList.add("route-option", `route-${type}`);
        option.innerHTML = `
            <img src="${node.icon}" alt="">
            <h2>${node.label}</h2>
            <p>${node.description}</p>
        `;
        option.addEventListener("click", () => onChoose(type));
        container.appendChild(option);
    });
}

export function renderRouteTeam(selector, team) {
    const container = document.querySelector(selector);
    container.innerHTML = team.map(pokemon => {
        const hpPercentage = Math.max(0, (pokemon.currentHp / pokemon.maxHp) * 100);
        const hpClass = hpPercentage <= 25 ? "critical" : hpPercentage <= 50 ? "warning" : "";
        return `
            <div class="route-team-member${pokemon.fainted ? " fainted" : ""}">
                <img src="${pokemon.sprite}" alt="">
                <div>
                    <strong>${formatPokemonName(pokemon.name)}</strong>
                    <div class="battle-team-hp-bar"><span class="${hpClass}" style="width: ${hpPercentage}%"></span></div>
                    <small>${pokemon.currentHp} / ${pokemon.maxHp} PS</small>
                </div>
            </div>
        `;
    }).join("");
}

export function renderShop(selector, products, money, onBuy) {
    const container = document.querySelector(selector);
    container.innerHTML = "";
    products.forEach(product => {
        const canAfford = money >= product.price;
        const card = document.createElement("article");
        card.classList.add("item-card", "shop-card");
        card.classList.toggle("used", Boolean(product.sold));
        card.innerHTML = `
            <img src="${product.sprite}" alt="">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <button type="button" ${product.sold || !canAfford ? "disabled" : ""}>
                ${product.sold ? "Comprado" : `Comprar · ${formatMoney(product.price)}`}
            </button>
        `;
        card.querySelector("button").addEventListener("click", () => onBuy(product));
        container.appendChild(card);
    });
}
