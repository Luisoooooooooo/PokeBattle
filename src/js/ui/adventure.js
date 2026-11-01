import { TYPE_ICON_BASE } from "../data/types.js";
import { formatTypeName } from "../utils/formatters.js";

function getMarkerState(marker) {
    if (marker.done) {
        return "superado";
    }
    return marker.current ? "siguiente" : "pendiente";
}

function renderMarker(marker) {
    const classes = ["stage-marker", `stage-${marker.kind}`];
    if (marker.done) {
        classes.push("done");
    }
    if (marker.current) {
        classes.push("current");
    }
    const typeLabel = marker.type ? `, tipo ${formatTypeName(marker.type)}` : "";
    const label = `${marker.label}${typeLabel}: ${getMarkerState(marker)}`;
    const style = marker.type ? ` style="--type-color: var(--type-${marker.type})"` : "";
    const icon = marker.type
        ? `<img src="${TYPE_ICON_BASE}/${marker.type}.svg" alt="">`
        : `<span aria-hidden="true">★</span>`;
    return `<li class="${classes.join(" ")}"${style} title="${label}" aria-label="${label}">${icon}</li>`;
}

export function renderAdventureProgress(selector, markers, labels) {
    const container = document.querySelector(selector);
    const groups = ["gym", "elite", "champion"].map(kind => {
        const group = markers.filter(marker => marker.kind === kind);
        const done = group.filter(marker => marker.done).length;
        const count = group.length > 1 ? ` <small>${done}/${group.length}</small>` : "";
        return `
            <div class="stage-group stage-group-${kind}">
                <ol>${group.map(renderMarker).join("")}</ol>
                <span>${labels[kind]}${count}</span>
            </div>
        `;
    });
    container.innerHTML = groups.join("");
}
