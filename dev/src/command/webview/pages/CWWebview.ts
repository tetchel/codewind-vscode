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

export namespace CWWebview {
    export enum MessageTypesE {
        PAGE = "page",
    }

    export enum PagesE {
        "connection"
    }

    // export type MessageTypes = "page";
    // export type Pages = "test1" | "test2";

    export interface BaseMsg {
        type: MessageTypesE;
    }

    export interface PageMsg extends BaseMsg {
        type: MessageTypesE.PAGE;
        page: PagesE;
    }
}

export default CWWebview;
