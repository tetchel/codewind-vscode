/*******************************************************************************
 * Copyright (c) 2018, 2020 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

import * as vscode from "vscode";

import Log from "../../Logger";
import ProjectCapabilities from "./ProjectCapabilities";
import Commands from "../../constants/Commands";
import MCUtil from "../../MCUtil";

interface DetailedAppStatus {
    readonly severity: "INFO" | "WARN" | "ERROR";
    readonly message?: string;

    // readonly notify: boolean;
    readonly notificationID?: string;
    readonly linkLabel?: string;
    readonly link?: string;
}

interface ProjectStateInfo {
    appStatus?: string;
    detailedAppStatus?: DetailedAppStatus;
    buildStatus?: string;
    detailedBuildStatus?: string;
    startMode?: string;
    state?: string;
}

/**
 * Represents the project's state. This means app state, build state, and any status details.
 */
export class ProjectState {
    public appState: ProjectState.AppStates = ProjectState.AppStates.UNKNOWN;
    public appDetail: DetailedAppStatus | undefined;
    public buildState: ProjectState.BuildStates | undefined;
    public buildDetail: string | undefined;

    private readonly notificationIDsShown: string[] = [];

    constructor(
        private readonly projectName: string,
    ) {
        // call update() right away
    }

    public update(projectStateInfo: ProjectStateInfo): boolean {
        const oldState = { ... this };
        this.appState = ProjectState.getAppState(projectStateInfo);
        if (this.appState !== ProjectState.AppStates.DISABLED) {
            this.appDetail = projectStateInfo.detailedAppStatus;
            this.buildState = ProjectState.getBuildState(projectStateInfo.buildStatus);
            this.buildDetail = projectStateInfo.detailedBuildStatus;
        }
        else {
            // the disabled app state has no other states.
            this.appDetail = undefined;
            this.buildState = undefined;
            this.buildDetail = undefined;
        }

        if (this.appDetail && this.appDetail.notificationID) {
            this.notify();
        }

        return !(this.appState === oldState.appState &&
            this.appDetail === oldState.appDetail &&
            this.buildState === oldState.buildState &&
            this.buildDetail === oldState.buildDetail);
    }

    public get isEnabled(): boolean {
        return ProjectState.getEnabledStates().includes(this.appState);
    }

    public get isStarted(): boolean {
        return ProjectState.getStartedStates().includes(this.appState);
    }

    public get isStarting(): boolean {
        return ProjectState.getStartingStates().includes(this.appState);
    }

    public get isDebuggable(): boolean {
        return ProjectState.getDebuggableStates().includes(this.appState);
    }

    public get isBuilding(): boolean {
        return this.buildState === ProjectState.BuildStates.BUILDING;
    }

    public toString(): string {
        if (!this.isEnabled) {
            // Just show Disabled for disabled projects
            return `[${this.appState}]`;
        }

        const hasAppState = this.appState !== ProjectState.AppStates.UNKNOWN;
        const hasBuildState = this.buildState !== ProjectState.BuildStates.UNKNOWN;

        if (hasAppState) {
            if (hasBuildState) {
                // both states
                return `[${this.appState}] [${this.getBuildString()}]`;
            }
            else {
                // app state only
                return `[${this.appState}]`;
            }
        }
        else if (hasBuildState) {
            // build state only
            return `[${this.getBuildString()}]`;
        }
        // Log.w(`${this.projectName} has unknown app and build statuses`);
        return "[Unknown]";
    }

    public getBuildString(): string | undefined {
        if (!this.isEnabled) {
            return undefined;
        }

        let buildStateStr = "";

        if (this.buildDetail != null && this.buildDetail.trim() !== "") {
            // a detailed status is available
            buildStateStr = `${this.buildState} - ${this.buildDetail}`;
        }
        // Don't display the build state if it's unknown
        else if (this.buildState !== ProjectState.BuildStates.UNKNOWN) {
            buildStateStr = `${this.buildState}`;                               // non-nls
        }
        return buildStateStr;
    }

    public getAppStatusWithDetail(): string {
        if (!this.appState || this.appState === ProjectState.AppStates.UNKNOWN) {
            return "";
        }

        let status = this.appState.toString();
        if (this.appDetail && this.appDetail.message) {
            status += ` - ${this.appDetail.message}`;
        }
        return status;
    }

    private notify(): void {
        // https://github.com/eclipse/codewind/issues/1297
        if (!this.appDetail || !this.appDetail.notificationID || this.notificationIDsShown.includes(this.appDetail.notificationID)) {
            return;
        }

        this.notificationIDsShown.push(this.appDetail.notificationID);
        Log.i(`Showing user detailed app status ${this.appDetail.message} for project ${this.projectName}`);

        // https://github.com/eclipse/codewind/issues/1812
        let helpLinkBtn: string | undefined;
        let helpLinkUri: vscode.Uri | undefined;
        if (this.appDetail.link) {
            helpLinkUri = vscode.Uri.parse(this.appDetail.link);
            if (!helpLinkUri.scheme || !helpLinkUri.authority) {
                Log.e(`Failed to parse appDetailStatus.link "${this.appDetail.link}"`);
            }
            else {
                helpLinkBtn = this.appDetail.linkLabel || "Troubleshooting";
            }
        }

        let notificationFn;
        if (this.appDetail.severity === "ERROR") {
            notificationFn = vscode.window.showErrorMessage;
        }
        else if (this.appDetail.severity === "WARN") {
            notificationFn = vscode.window.showWarningMessage;
        }
        else {
            notificationFn = vscode.window.showInformationMessage;
        }

        const notificationMsg = `${this.projectName} - ${this.appDetail.message}`;
        if (helpLinkBtn) {
            notificationFn(notificationMsg, helpLinkBtn)
            .then((res) => {
                if (res === helpLinkBtn) {
                    vscode.commands.executeCommand(Commands.VSC_OPEN, helpLinkUri);
                }
            });
        }
        else {
            notificationFn(notificationMsg);
        }
    }
}

export namespace ProjectState {

    // The AppStates and BuildStates string values are all exposed to the user.

    export enum AppStates {
        STARTED = "Running",
        STARTING = "Starting",
        STOPPING = "Stopping",
        STOPPED = "Stopped",

        DEBUGGING = "Debugging",
        DEBUG_STARTING = "Starting - Debug",

        DISABLED = "Disabled",
        UNKNOWN = "N/A"
    }

    export enum BuildStates {
        BUILD_SUCCESS = "Build Succeeded",
        BUILDING = "Building",
        BUILD_FAILED = "Build Failed",
        BUILD_QUEUED = "Build Queued",

        UNKNOWN = "N/A"
    }

    export type AppStateSet = { states: ProjectState.AppStates[], userLabel: string };

    export function getAppStateSet(stateSet: "enabled" | "disabled" | "started" | "started-starting" | "debuggable"): AppStateSet {

        let states;

        // tslint:disable-next-line: switch-default
        switch (stateSet) {
            case "enabled": {
                states = getEnabledStates();
                break;
            };
            case "disabled": {
                states = [ ProjectState.AppStates.DISABLED ];
                break;
            };
            case "started": {
                states = getStartedStates();
                break;
            }
            case "started-starting": {
                states = getStartedOrStartingStates();
                break;
            }
            case "debuggable": {
                states = getDebuggableStates();
                break;
            }
        }

        let userLabel;
        if (stateSet === "enabled") {
            userLabel = "enabled";
        }
        else {
            userLabel = MCUtil.joinList(states, "or").toLowerCase();
        }

        return {
            states, userLabel
        }
    }

    export function getAllAppStates(): AppStates[] {
        return Object.values(AppStates);
    }

    export function getEnabledStates(): AppStates[] {
        return Object.values(AppStates).filter((state) => state !== ProjectState.AppStates.DISABLED);
    }

    export function getStartedStates(): AppStates[] {
        return [
            ProjectState.AppStates.STARTED,
            ProjectState.AppStates.DEBUGGING
        ];
    }

    export function getStartingStates(): AppStates[] {
        return [
            ProjectState.AppStates.STARTING,
            ProjectState.AppStates.DEBUG_STARTING
        ];
    }

    export function getStartedOrStartingStates(): AppStates[] {
        return getStartedStates().concat(getStartingStates());
    }

    export function getDebuggableStates(): AppStates[] {
        return [
            ProjectState.AppStates.DEBUGGING,
            ProjectState.AppStates.DEBUG_STARTING
        ];
    }

    /**
     * Convert a project info object into a ProjectState.
     */
    export function getAppState(projectStateInfo: ProjectStateInfo): ProjectState.AppStates {

        // Logger.log("PIP", projectInfoPayload);
        const appStatus = projectStateInfo.appStatus;

        const openClosedState = projectStateInfo.state;
        const startMode = projectStateInfo.startMode;

        // Logger.log(`Convert - appStatus=${appStatus}, closedState=${closedState}, startMode=${startMode}`);

        // First, check if the project is closed (aka Disabled)
        if (openClosedState === "closed") {                                                                                         // non-nls
            return ProjectState.AppStates.DISABLED;
        }
        // Now, check the app states. Compare against both the value we expect from MC,
        // as well as our own possible values, in case we used the fallbackState in the constructor.
        else if (appStatus === "started" || appStatus === AppStates.DEBUGGING || appStatus === AppStates.STARTED) {             // non-nls
            if (startMode != null && ProjectCapabilities.isDebugMode(startMode)) {
                return ProjectState.AppStates.DEBUGGING;
            }
            return ProjectState.AppStates.STARTED;
        }
        else if (appStatus === "starting" || appStatus === AppStates.STARTING || appStatus === AppStates.DEBUG_STARTING) {      // non-nls
            if (startMode != null && ProjectCapabilities.isDebugMode(startMode)) {
                return ProjectState.AppStates.DEBUG_STARTING;
            }
            return ProjectState.AppStates.STARTING;
        }
        else if (appStatus === "stopping" || appStatus === AppStates.STOPPING) {                        // non-nls
            return ProjectState.AppStates.STOPPING;
        }
        else if (appStatus === "stopped" || appStatus === AppStates.STOPPED) {                          // non-nls
            return ProjectState.AppStates.STOPPED;
        }
        else if (!appStatus || appStatus === "unknown" || appStatus === AppStates.UNKNOWN) {      // non-nls
            return ProjectState.AppStates.UNKNOWN;
        }
        else {
            Log.e("Unknown app state:", appStatus);
            return ProjectState.AppStates.UNKNOWN;
        }
    }

    export function getBuildState(buildStatus: string | undefined): BuildStates {
        if (buildStatus === "success" || buildStatus === BuildStates.BUILD_SUCCESS) {           // non-nls
            return BuildStates.BUILD_SUCCESS;
        }
        else if (buildStatus === "inProgress" || buildStatus === BuildStates.BUILDING) {        // non-nls
            return BuildStates.BUILDING;
        }
        else if (buildStatus === "queued" || buildStatus === BuildStates.BUILD_QUEUED) {        // non-nls
            return BuildStates.BUILD_QUEUED;
        }
        else if (buildStatus === "failed" || buildStatus === BuildStates.BUILD_FAILED) {        // non-nls
            return BuildStates.BUILD_FAILED;
        }
        else if (buildStatus == null || buildStatus.toLowerCase() === "unknown") {              // non-nls
            return BuildStates.UNKNOWN;
        }
        else {
            Log.e("Unknown build state:", buildStatus);
            return BuildStates.UNKNOWN;
        }
    }
}

export default ProjectState;
