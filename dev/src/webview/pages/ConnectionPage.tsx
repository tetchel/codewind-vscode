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

import type Connection from "codewind/connection/Connection";

interface P {
    connection: Connection
}

interface S {
}

export default class ConnectionPage extends React.Component<P, S> {

    constructor(props: P, state: S) {
        super(props, state);
        console.log(`The connection is bbbbbb ` + this.props.connection.label);
    }

    public render(): React.ReactElement {
        return (
            <div>
                <h1>${this.props.connection.label}</h1>
                <table>
                    <tr>
                        <td># Template Sources</td>
                        {/* <td>${this.props.connection.templateSourcesList.get(). </td> */}
                    </tr>
                </table>
            </div>
        )
    }
}
