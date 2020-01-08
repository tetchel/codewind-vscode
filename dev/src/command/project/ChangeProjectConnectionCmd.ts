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

import Project from "../../codewind/project/Project";
import Log from "../../Logger";
import ConnectionManager from "../../codewind/connection/ConnectionManager";
import toggleEnablementCmd from "./ToggleEnablementCmd";
import { IDetectedProjectType } from "../../codewind/connection/CLICommandRunner";
import { addProjectToConnection } from "../connection/BindProjectCmd";
import RegistryUtils from "../../codewind/connection/RegistryUtils";
import { removeProject } from "./RemoveProjectCmd";

export default async function changeProjectConnectionCmd(project: Project): Promise<void> {

    const selectableConnections = ConnectionManager.instance.connections.filter((conn) =>
        // we show a given connection if the other connection is connected and does not already have this project
        conn.isConnected && conn !== project.connection && !conn.projects.some((proj) => proj.localPath.fsPath === project.localPath.fsPath)
    );

    if (selectableConnections.length === 0) {
        vscode.window.showWarningMessage(`No suitable target for moving ${project.name} - ` +
            `there is no connection that is connected and does not already have this project.`);
        return;
    }

    const targetConnection = await vscode.window.showQuickPick(selectableConnections, {
        canPickMany: false,
        ignoreFocusOut: true,
        matchOnDetail: true,
        placeHolder: `Select the connection to move ${project.name} to.`,
    });

    if (targetConnection == null) {
        return;
    }

    if (await RegistryUtils.doesNeedPushRegistry(project.type.internalType, targetConnection)) {
        return;
    }

    // Ask what to do with the existing instance of the project
    const optionRemove: vscode.QuickPickItem = {
        label: "Remove",
        detail: `Remove the project from ${project.connection.label}. The source code is not affected.`,
    };
    const optionDisable: vscode.QuickPickItem = {
        label: "Disable",
        detail: `Keep the project on ${project.connection.label}, but Disable it so it doesn't build there.`,
    };
    const optionNothing: vscode.QuickPickItem = {
        label: "Leave it alone",
        detail: `Leave the project running on ${project.connection.label}. It will be built on both Codewind instances.`
    };

    const options = [ optionRemove ];
    if (project.state.isEnabled) {
        options.push(optionDisable);
    }
    options.push(optionNothing);

    const existingActionResponse = await vscode.window.showQuickPick(options, {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: `Select what to do with the existing instance of ${project.name} deployed on ${project.connection.label}.`,
    });

    if (existingActionResponse == null) {
        return;
    }

    Log.i(`Moving ${project.name} from ${project.connection.label} to ${targetConnection.label}`);

    const projectType: IDetectedProjectType = {
        language: project.language,
        projectType: project.type.internalType,
        // projectSubtype:
    };

    await addProjectToConnection(targetConnection, project.name, project.localPath.fsPath, projectType);

    if (existingActionResponse === optionRemove) {
        await removeProject(project, false);
    }
    else if (existingActionResponse === optionDisable) {
        await toggleEnablementCmd(project);
    }
    // else, they want to leave the existing project
}