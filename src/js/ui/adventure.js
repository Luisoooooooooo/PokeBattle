import { TYPE_ICON_BASE } from "../data/types.js";
import { formatTypeName } from "../utils/formatters.js";

const KIND_LABELS = {
    gym: "Gimnasio",
    elite: "Alto Mando",
    champion: "Campeonato"
};

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
    const typeLabel = marker.type ? ` tipo ${formatTypeName(marker.type)}` : "";
    const label = `${KIND_LABELS[marker.kind]}${typeLabel}: ${getMarkerState(marker)}`;
    const style = marker.type ? ` style="--type-color: var(--type-${marker.type})"` : "";
    const icon = marker.type
        ? `<img src="${TYPE_ICON_BASE}/${marker.type}.svg" alt="">`
        : `<span aria-hidden="true">★</span>`;
    return `<li class="${classes.join(" ")}"${style} title="${label}" aria-label="${label}">${icon}</li>`;
}

export function renderAdventureProgress(selector, markers) {
    const container = document.querySelector(selector);
    const groups = ["gym", "elite", "champion"].map(kind => {
        const items = markers.filter(marker => marker.kind === kind).map(renderMarker).join("");
        return `
            <div class="stage-group">
                <ol>${items}</ol>
                <span>${KIND_LABELS[kind]}</span>
            </div>
        `;
    });
    container.innerHTML = groups.join("");
}
