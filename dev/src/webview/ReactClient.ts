
import ReactDOM from "react-dom";

import * as Test from "./components/Test";

// tslint:disable no-console
console.log("the react client is loaded!!")

function doRender(): void {
    const name = "timbo";
    ReactDOM.render(Test.TestObj({ name }), document.getElementById("root"));
}

window.addEventListener("message", (msg) => {
    console.log("ReactClient received message", JSON.stringify(msg));
    doRender();
});

doRender();
