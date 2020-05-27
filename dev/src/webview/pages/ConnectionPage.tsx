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

import "../scss/index.scss"
import "../scss/app.scss";

import React from "react";
// import { Button } from "carbon-components-react";

import WebviewMessages from "messages/WebviewMessages";
import { filterMessage } from "../ReactClient";

interface P {
    connection: WebviewMessages.ConnectionPageState;
}

interface S {
    connection: WebviewMessages.ConnectionPageState;
}

export default class ConnectionPage extends React.Component<P, S> {

    constructor(props: P, state: S) {
        super(props, state);
        this.state = {
            connection: this.props.connection
        };
        console.log("Connection page initial state " + JSON.stringify(this.state));
    }

    public componentDidMount(): void {
        console.log("Connection page did mount");

        window.addEventListener("message", (e) => {
            console.log("A MESSAGE TO THE CONNECTION PAGE", JSON.stringify(e));
            if (!filterMessage(e, "connection")) {
                return;
            }

            this.setState({ connection: e.data.connection });
            console.log(`The connection is ` + this.props.connection.label);
        });
    }

    public render(): React.ReactElement {
        console.log("Rendering connection page");
        if (this.state == null || this.state.connection == null) {
            return (
                <div>
                    <h1>Error: No connection</h1>
                </div>
            );
        }

        return (
            <div>
                <h1>{this.state.connection.label}</h1>
                <a href={this.state.connection.url.toString()}>{this.state.connection.url}</a>
            </div>
        );
    }
}
