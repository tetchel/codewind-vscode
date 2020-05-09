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

declare namespace CWWebview {
    export type MessageTypes = "page" | "test";
    export type Pages = "test1" | "test2";

    export interface BaseMsg {
        type: MessageTypes;
    }

    export interface PageMsg extends BaseMsg {
        type: "page";
        page: Pages;
    }

    export interface TestMsg extends BaseMsg {
        type: "test";
        thingo: string;
    }
}

export default CWWebview;
