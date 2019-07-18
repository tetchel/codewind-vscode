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
// import * as vscode from "vscode";

import Project from "../Project";
import MCLog, { LogTypes } from "./MCLog";
import Log from "../../../Logger";
import Requester from "../Requester";
import SocketEvents, { ILogResponse, ILogObject } from "../../connection/SocketEvents";

export default class MCLogManager {

    private readonly _logs: MCLog[] = [];
    public readonly initPromise: Promise<void>;

    private readonly managerName: string;

    private isShowingAll: boolean = false;

    constructor(
        private readonly project: Project,
    ) {
        this.initPromise = this.initialize();
        this.managerName = `${this.project.name} LogManager`;
    }

    private async initialize(): Promise<void> {
        if (this._logs.length > 0) {
            Log.e(this.managerName + " logs have already been initialized");
            return;
        }
        // Log.d("Initializing logs");
        try {
            const availableLogs = await Requester.requestAvailableLogs(this.project);
            this.onLogsListChanged(availableLogs);
            Log.i(`${this.managerName} has finished initializing logs: ${this.logs.map((l) => l.displayName).join(", ") || "<none>"}`);
        }
        catch (err) {
            // requester will show the error
            return;
        }
    }

    public toString(): string {
        return this.managerName;
    }

    public async showAll(): Promise<void> {
        this.isShowingAll = true;
        this.logs.forEach((log) => log.createOutput(true));
        // await this.toggleStreamingAll(true);
    }

    public async hideAll(): Promise<void> {
        this.isShowingAll = false;
        this.logs.forEach((log) => {
            log.disable();
            log.destroy();
        });
        // await this.toggleStreamingAll(false);
    }

    public onLogsListChanged(logs: ILogResponse): void {
        if (logs.app) {
            logs.app.forEach((newLogData) => this.processNewLog(newLogData, LogTypes.APP));
        }
        if (logs.build) {
            logs.build.forEach((newLogData) => this.processNewLog(newLogData, LogTypes.BUILD));
        }
    }

    private processNewLog(newLogData: ILogObject, logType: LogTypes): void {
        // skip useless container log
        if (newLogData.logName === "-" || newLogData.logName === "container") {
            return;
        }

        const existingIndex = this.logs.findIndex((l) => l.logName === newLogData.logName);
        const existed = existingIndex !== -1;
        let openOnCreate = this.isShowingAll;
        if (existed) {
            // destroy the old log and replace it with this one
            const existingLog = this.logs.splice(existingIndex, 1)[0];
            openOnCreate = openOnCreate || existingLog.isEnabled;
            existingLog.destroy();
        }

        const newLog = new MCLog(this.project, logType, newLogData.logName, newLogData.workspathLogPath);
        this.logs.push(newLog);
        if (openOnCreate) {
            newLog.createOutput(false);
        }
    }

    public onNewLogs(event: SocketEvents.ILogUpdateEvent): void {
        if (event.projectID !== this.project.id) {
            Log.e(`${this.managerName} received logs for other project ${event.projectName}`);
            return;
        }
        const existingLog = this.logs.find((log) => log.logName === event.logName);
        if (existingLog != null) {
            existingLog.onNewLogs(event.reset, event.logs);
        }
    }

    public onReconnect(): void {
        this.logs
            .filter((log) => log.isEnabled)
            .forEach((log) => log.createOutput(true));
    }

    public onDisconnectOrDisable(): void {
        // Log.d(`${this.managerName} onDisconnectOrDisable`);
        this.logs.forEach((log) => log.destroy());
    }

    public get logs(): MCLog[] {
        return this._logs;
    }
}
