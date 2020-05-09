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
import * as fs from "fs-extra";
import * as path from "path";

import CWExtensionContext from "../../CWExtensionContext";
import type CWWebview from "../../webview/CWWebview";
import MCUtil from '../../MCUtil';
import Log from '../../Logger';

export default class ReactWebview {

    private readonly panel: vscode.WebviewPanel;

    constructor(
        public readonly title: string
    ) {
        this.panel = vscode.window.createWebviewPanel("quack", title, vscode.ViewColumn.Active, {
            enableScripts: true,
            localResourceRoots: [ vscode.Uri.file(CWExtensionContext.get().vscContext.extensionPath) ],
        });

        this.panel.webview.html = `
            <html>
                <body>
                    <h1>Loading...</h1>
                </body>
            </html>`;

        this.init().catch((err) => {
            Log.e(`Error initializing React webview:`, err);
            vscode.window.showErrorMessage(`Error opening webview: ${MCUtil.errToString(err)}`);
        });
    }

    private async init(): Promise<void> {
        const indexHtmlPath = path.join(CWExtensionContext.get().resourcesPath, "index.html");
        const indexHtmlContents = await fs.readFile(indexHtmlPath);
        this.panel.webview.html = indexHtmlContents.toString();
        Log.d("Loaded the index file");

        this.openPage("test1");
        Log.d("Opened the test page");
    }

    private openPage(page: CWWebview.Pages): void {
        this.postMessage<CWWebview.PageMsg>({ type: "page", page, });
    }

    public postMessage<T extends CWWebview.BaseMsg>(msg: T): void {
        this.panel.webview.postMessage(msg);
    }

    public reveal(): void {
        this.panel.reveal();
    }
}
