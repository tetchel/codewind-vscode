import { WebviewWrapper, WebviewResourceProvider } from "./WebviewWrapper";
import WebviewUtil from "./WebviewUtil";

export default class TestWrapper extends WebviewWrapper {
    protected generateHtml(_resourceProvider: WebviewResourceProvider): Promise<string> {
        throw new Error("Method not implemented.");
    }

    protected handleWebviewMessage: (msg: WebviewUtil.IWVMessage) => void = () => {
        return;
    }

    protected onDidDispose(): void {
        throw new Error("Method not implemented.");
    }

}
