import { mount } from "svelte";
import Options from "../components/Options.svelte";

// Action popup
// https://developer.chrome.com/docs/extensions/reference/action/
import "../styles.css";

function render() {
    const target = document.getElementById("app");

    if (target) {
        mount(Options, { target });
    }
}

document.addEventListener("DOMContentLoaded", render);
