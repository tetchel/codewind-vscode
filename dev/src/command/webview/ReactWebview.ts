
import * as vscode from "vscode";

import * as fs from "fs-extra";
import * as path from "path";
import CWExtensionContext from "../../CWExtensionContext";

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
                    Loading...
                </body>
            </html>`;

        this.init();
    }

    private async init(): Promise<void> {
        const indexHtmlPath = path.join(CWExtensionContext.get().resourcesPath, "index.html");
        const indexHtmlContents = await fs.readFile(indexHtmlPath);
        this.panel.webview.html = indexHtmlContents.toString();
        this.panel.webview.postMessage({ test: "Testerino" });
    }

    public reveal(): void {
        this.panel.reveal();
    }
}
