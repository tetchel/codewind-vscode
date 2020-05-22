/*******************************************************************************
 * Copyright (c) 2020 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

import ReactDOM from "react-dom";
import React from "react";

import ConnectionPage from "./pages/ConnectionPage";

// tslint:disable no-console

console.log(`REACT CLIENT LOADING`);

window.addEventListener("message", (e: MessageEvent) => {

    if (e.data.source !== "extension") {
        console.log("I don't care about this message from " + e.data.source);
        return;
    }

    console.log("A MESSAGE!!!", e);

    const data = e.data;
    if (data.type === "page") {
        let obj: React.ReactElement;

        if (data.connection) {
            obj = <ConnectionPage connection={data.connection}/>
        }
        else {
            obj = <h1>Oh no you shouldn't see this</h1>
        }
            ReactDOM.render(obj, document.getElementById("root"));
    }
});
