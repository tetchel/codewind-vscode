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

import ReactWebview from "../../ReactWebview";
import Connection from "../../../../codewind/connection/Connection";
import Messages from "../../messages/WebviewMessages";

export default class ConnectionPage extends ReactWebview {

    constructor(
        connection: Connection,
    ) {
        super(connection.id, connection.label, Messages.Pages.CONNECTION, { connection: Messages.stateify(connection) });
    }

}
