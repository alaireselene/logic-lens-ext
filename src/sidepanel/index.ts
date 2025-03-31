import { mount } from "svelte";
import Sidepanel from "../components/Sidepanel.svelte";
import "../styles.css"

// Side panel
// https://developer.chrome.com/docs/extensions/reference/sidePanel/

function render() {
    const target = document.getElementById("app");

    if (target) {
        mount(Sidepanel, { target });
    }
}

document.addEventListener("DOMContentLoaded", render);
