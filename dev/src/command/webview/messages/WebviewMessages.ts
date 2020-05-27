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

import Connection from "../../../codewind/connection/Connection";
import { TemplateSource } from "../../../codewind/Types";

export namespace WebviewMessages {
    export enum MessageTypes {
        PAGE = "page",
    }

    export enum Pages {
        CONNECTION = "connection"
    }

    export interface BaseMsg {
        type: MessageTypes;
    }

    export interface PageMsg extends BaseMsg {
        type: MessageTypes.PAGE;
        page: Pages;
        state: object;
    }

    export interface ConnectionPageMsg extends PageMsg {
        type: MessageTypes.PAGE;
        page: Pages.CONNECTION;
        state: ConnectionPageState;
    }

    export interface ConnectionPageState {
        label: string;
        url: vscode.Uri;
        version: string;
        state: string;
        templateSources: TemplateSource[];
    }

    export async function stateify(connection: Connection): Promise<ConnectionPageState> {
        return {
            label: connection.label,
            url: connection.url,
            version: connection.version,
            state: connection.state.toString(),
            templateSources: await connection.templateSourcesList.get(),
        }
    }
}

export default WebviewMessages;
