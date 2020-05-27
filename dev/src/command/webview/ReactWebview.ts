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

import * as vscode from "vscode";

import CWExtensionContext from "../../CWExtensionContext";
import MCUtil from '../../MCUtil';
import Log from '../../Logger';
import WebviewMessages from "./messages/WebviewMessages";

export default class ReactWebview {

    private readonly panel: vscode.WebviewPanel;

    constructor(
        protected readonly id: string,
        protected readonly title: string,
        protected readonly pageID: WebviewMessages.Pages,
        readonly initialState: {},
    ) {
        const extensionPathUri = vscode.Uri.file(CWExtensionContext.get().extensionPath);

        this.panel = vscode.window.createWebviewPanel(id, title, vscode.ViewColumn.Active, {
            enableScripts: true,
            localResourceRoots: [ extensionPathUri ],
        });

        const extensionPathVSCodeUri = "vscode-resource://" + extensionPathUri.fsPath + "/";

        this.panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>${this.title}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">

                <base href="${extensionPathVSCodeUri}"/>

                <script src="node_modules/react/umd/react.development.js"></script>
                <script src="node_modules/react-dom/umd/react-dom.development.js"></script>

                <script>
                    console.log("Base href is ${extensionPathVSCodeUri}");
                    const vscode = acquireVsCodeApi();
                </script>
            </head>
            <body>
                <div id="root">
                    <h1>Loading...</h1>
                </div>
                <script src="dist/ReactClient.js"></script>
            </body>
            </html>
        `;

        try {
            this.init(initialState);
        }
        catch (err) {
            Log.e(`Error initializing React webview ${title}:`, err);
            vscode.window.showErrorMessage(`Error opening ${title}: ${MCUtil.errToString(err)}`);
        }
    }

    protected init(state: object): void {
        // this.openPage("test1");
        Log.d(`Open page "${this.pageID}"`);
        this.openPage(this.pageID, state);
    }

    private openPage(page: WebviewMessages.Pages, state: object): void {
        this.postMessage<WebviewMessages.PageMsg>({ type: WebviewMessages.MessageTypes.PAGE, page, state });
    }

    protected postMessage<T extends {}>(msg: T): void {
        msg = { source: "extension", ...msg };
        Log.d(`Posting message`, msg);
        this.panel.webview.postMessage(msg);
    }

    public reveal(): void {
        this.panel.reveal();
    }
}
