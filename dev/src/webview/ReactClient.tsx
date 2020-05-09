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

// import type CWWebview from "./CWWebview";
import TestPage123 from "./pages/TestPage123";

// tslint:disable no-console

const obj = <TestPage123/>
ReactDOM.render(obj, document.getElementById("root"));

window.addEventListener("message", (e: MessageEvent) => {

    console.log("A MESSAGE!!!", e);

    // const data = e.data as CWWebview.BaseMsg;
    // if (data.type === "page") {
    //     let obj: React.ReactElement;

    //     const pageSelectorMsg = data as CWWebview.PageMsg;
    //     if (pageSelectorMsg.page === "test1") {

            // const obj = <TestPage123/>
            // ReactDOM.render(obj, document.getElementById("root"));
    //     }
    //     else {
    //         obj = <h1>Oh no you shouldn't see this</h1>
    //     }
    // }
});
