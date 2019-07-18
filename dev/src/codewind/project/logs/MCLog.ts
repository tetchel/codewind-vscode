/*******************************************************************************
 * Copyright (c) 2019 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
import * as vscode from "vscode";

import Translator from "../../../constants/strings/translator";
import StringNamespaces from "../../../constants/strings/StringNamespaces";
import Requester from "../Requester";
import Project from "../Project";
import Log from "../../../Logger";

export enum LogTypes {
    APP = "app", BUILD = "build",
}

const STRING_NS = StringNamespaces.LOGS;

export default class MCLog implements vscode.QuickPickItem {

    public readonly displayName: string;

    // quickPickItem
    public readonly label: string;
    // public readonly detail: string;

    private output: vscode.OutputChannel | undefined;

    /**
     * If the user has selected to show this log, either through Manage Logs or Show All Logs.
     * Persists through disconnect.
     */
    private _isEnabled: boolean = false;
    private _isStreaming: boolean = false;

    constructor(
        private readonly project: Project,
        // MUST match the logName provided in the log-update events
        public readonly logType: LogTypes,
        public readonly logName: string,
        public readonly logPath?: string,
    ) {
        this.displayName = `${project.name} - ${this.logName}`;
        this.label = this.displayName;
        // this.detail = logPath;
        // this.description = `(${this.logType} log)`;
        Log.d(`Initialized log ${this.displayName}`);
    }

    public toString(): string {
        return this.displayName;
    }

    public onNewLogs(reset: boolean, logs: string): void {
        if (!this.output) {
            return;
        }

        if (reset) {
            // Log.d("Reset " + this.displayName);
            this.output.clear();
        }
        // Log.d(`${this.displayName} appending length ${logs.length}`);
        this.output.append(logs);
    }

    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    // quickPickItem
    public get picked(): boolean {
        return this.isEnabled;
    }

    public createOutput(show: boolean): void {
        // Log.d("Show log " + this.displayName);
        if (!this.output) {
            // Log.d("Creating output for log " + this.displayName);
            this.output = vscode.window.createOutputChannel(this.displayName);
            this.output.appendLine(Translator.t(STRING_NS, "waitingForLogs"));
            if (show) {
                this.output.show();
            }
        }
        this.toggleStreaming(true);
        this._isEnabled = true;
    }

    public disable(): void {
        this._isEnabled = false;
    }

    public destroy(): void {
        // Log.d("Hide log " + this.displayName);
        if (this.output) {
            this.output.dispose();
            this.output = undefined;
        }
        // this is called on disconnect so skip this step if it will fail
        if (this.project.connection.isConnected) {
            this.toggleStreaming(false);
        }
    }

    public async toggleStreaming(enable: boolean): Promise<void> {
        if (this._isStreaming === enable) {
            // no-op
            return;
        }
        try {
            await Requester.requestToggleLog(this.project, enable, this.logType.toString(), this.logName);
            this._isStreaming = enable;
        }
        catch (err) {
            Log.e(`Error toggling ${this} to stream ${enable}`, err);
        }
        // Log.d("Now streaming single log", this.displayName);
    }
}
