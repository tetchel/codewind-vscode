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

import React from "react";
// import "../scss/index.scss"
import "../scss/app.scss";
// import { Button } from "carbon-components-react";

export default class TestPage123 extends React.Component<{}, { thingo: string }> {

    private clicks = 0;

    constructor(props: {}) {
        super(props);
        console.log("Test page 123 !! !! !!");
        this.handleWindowEvent = this.handleWindowEvent.bind(this);
        this.handleBtnClick = this.handleBtnClick.bind(this);

        this.state = {
            thingo: "nada!!"
        };
    }

    public componentDidMount(): void {
        window.addEventListener("message", this.handleWindowEvent);
    }

    public componentWillUnmount(): void {
        window.removeEventListener("message", this.handleWindowEvent);
    }

    private handleWindowEvent(e: MessageEvent): void {
        // const testMsg = e.data as CWWebview.TestMsg;
        const testMsg = e.data;
        if (testMsg.thingo) {
            this.setState({ thingo: testMsg.thingo });
        }
    }

    private readonly handleBtnClick = (_e: React.MouseEvent<HTMLElement>): void => {
        this.clicks++;
        this.setState({ thingo: `It was clicked ${this.clicks} times`});
    }

    public render(): JSX.Element {
        return (
            <div>
                <h1>It's the test page! {this.state.thingo}</h1>
                {/* <Button onClick={this.handleBtnClick}>Click me</Button> */}
            </div>
        );
    }
}
