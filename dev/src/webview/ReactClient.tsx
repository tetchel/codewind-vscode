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
import WebviewMessages from "messages/WebviewMessages";

console.log(`REACT CLIENT LOADING`);

export function filterMessage(e: MessageEvent, ...mandatoryProps: string[]): boolean {
    if (!e.data) {
        return false;
    }

    if (e.data.source !== "extension") {
        console.log("I don't care about this message from " + e.data.source);
        return false;
    }

    const dataKeys = Object.keys(e.data);
    const hadAllProps = mandatoryProps.every((key) => {
        const exists = dataKeys.indexOf(key) !== -1;
        if (!exists) {
            console.log(`message is missing required property ${key}`);
        }
        return exists;
    });

    if (!hadAllProps) {
        return false;
    }

    return true;
}

window.addEventListener("message", (e: MessageEvent) => {

    console.log("A MESSAGE!!!", JSON.stringify(e));
    if (!filterMessage(e)) {
        console.log("Message was filtered out");
        return;
    }

    const data = e.data;
    if (data.page) {
        const pageMsg = data as WebviewMessages.PageMsg;
        let obj: JSX.Element;
        // if (data.page === WebviewMessages.Pages.CONNECTION) {
        if (pageMsg.page === "connection") {
            const connectionPageMsg = pageMsg as WebviewMessages.ConnectionPageMsg;
            obj = <ConnectionPage connection={connectionPageMsg.state}/>
        }
        else {
            obj = <h1>Unknown page "{data.page}"</h1>
        }

        ReactDOM.render(obj, document.getElementById("root"));
    }
});
