/*******************************************************************************
 * Copyright (c) 2019, 2020 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/

import * as vscode from "vscode";
import Log from "./Logger";

const BTN_BACK = "$btn-back";

type StringGenerator = (...previousValues: string[]) => string;
type StringOrGenerator = string | StringGenerator;

namespace InputUtil {

    export interface Step {
        buttons?: [{
            button: vscode.QuickInputButton,
            action: () => void | Promise<void>,
            closeWizardOnClick?: boolean,
        }];
        condition?: (...previousValues: string[]) => boolean;
    }

    export interface InputStep extends Step {
        allowEmpty?: boolean;
        password?: boolean;
        placeholder?: StringOrGenerator;
        prompt: StringOrGenerator;
        validator?: (value: string) => string | undefined;
        value?: string;
    }

    export interface QuickPickStep extends Step {
        // canSelectMany?: boolean;         // Not supported because of https://github.com/eclipse-theia/theia/issues/5673
        initialSelection?: vscode.QuickPickItem;
        items: vscode.QuickPickItem[];
        placeholder: StringOrGenerator;
        matchOnDescription?: boolean;
        matchOnDetail?: boolean;
    }

    function isInputStep(step: Step): step is InputStep {
        return "prompt" in step;
    }

    function isStringGenerator(obj: StringOrGenerator): obj is StringGenerator {
        return typeof obj === typeof (() => { /* nothing */ });
    }

    function getGeneratedString(stringOrGenerator: StringOrGenerator | undefined, previousResults: string[]): string {
        if (stringOrGenerator == null) {
            return "";
        }
        else if (isStringGenerator(stringOrGenerator)) {
            return stringOrGenerator(...previousResults);
        }
        return stringOrGenerator;
    }

    let reusableIB: vscode.InputBox | undefined;
    let reusableQP: vscode.QuickPick<vscode.QuickPickItem> | undefined;

    function disposeIBIfExists(): void {
        if (reusableIB) {
            reusableIB.dispose();
            reusableIB = undefined;
        }
    }

    function disposeQPIfExists(): void {
        if (reusableQP) {
            reusableQP.dispose();
            reusableQP = undefined;
        }
    }

    export async function runMultiStepInput(title: string, steps: Array<QuickPickStep | InputStep>): Promise<string[] | undefined> {
        const results: string[] = [];

        try {
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];

                if (step.condition) {
                    const shouldRunStep = step.condition(...results);
                    if (!shouldRunStep) {
                        continue;
                    }
                }

                try {
                    let result: string | undefined;
                    if (isInputStep(step)) {
                        if (results[i]) {
                            // this step has run before (and user clicked Back) so prefill the previous value
                            step.value = results[i];
                        }
                        result = await runInputStep(title, steps.length, i, step, results);
                    }
                    else {
                        // it's a quickpickstep
                        if (results[i]) {
                            const prevResult = step.items.find((item) => item.label === results[i]);
                            step.initialSelection = prevResult;
                        }
                        const qpResult = await runQuickPickStep(title, steps.length, i, step, results);
                        result = qpResult?.label;
                    }

                    if (result == null) {
                        // Log.d(`User quit at step ${i}`);
                        return undefined;
                    }
                    results[i] = result;
                }
                catch (err) {
                    if (err === BTN_BACK) {
                        i -= 2;
                        continue;
                    }
                    else {
                        throw err;
                    }
                }
            }
        }
        finally {
            disposeIBIfExists();
            disposeQPIfExists();
        }

        return results;
    }

    function runInputStep(title: string, totalSteps: number, stepIndex: number, step: InputStep, previousResults: string[])
        : Promise<string | undefined> {

        disposeQPIfExists();

        const ib = reusableIB ? reusableIB : vscode.window.createInputBox();
        ib.title = title;
        ib.totalSteps = totalSteps;
        ib.step = stepIndex + 1;
        ib.prompt = getGeneratedString(step.prompt, previousResults);
        ib.placeholder = getGeneratedString(step.placeholder, previousResults);
        ib.value = step.value || "";
        ib.password = step.password || false;
        ib.validationMessage = undefined;
        // ignore focus out on all steps after the first so we don't accidentally lose wizard progress
        // ib.ignoreFocusOut = stepIndex > 0;
        ib.ignoreFocusOut = true;

        const btns: vscode.QuickInputButton[] = [];
        if (stepIndex > 0) {
            btns.push(vscode.QuickInputButtons.Back);
        }

        if (step.buttons) {
            btns.concat(step.buttons.map((btn) => btn.button));
        }

        const disposables: vscode.Disposable[] = [];

        if (step.validator) {
            let currentValidation: Promise<string | undefined>;

            const onDidChangeValue = ib.onDidChangeValue(async (value) => {
                if (step.validator) {
                    if (currentValidation) {
                        await currentValidation;
                    }
                    currentValidation = new Promise<string | undefined>((resolve) => {
                        if (step.validator) {
                            return resolve(step.validator(value));
                        }
                        return resolve(undefined);
                    });
                    ib.validationMessage = await currentValidation;
                    // Log.d(`Set validation message to ${ib.validationMessage}`);
                }
            });

            disposables.push(onDidChangeValue);
        }

        ib.show();

        const result = new Promise<string | undefined>((resolve, reject) => {
            const onDidTriggerButton = ib.onDidTriggerButton((triggeredBtn) => {
                if (triggeredBtn === vscode.QuickInputButtons.Back) {
                    return reject(BTN_BACK);
                }

                const matchingBtn = step.buttons?.find((btn) => btn.button === triggeredBtn);
                if (matchingBtn == null) {
                    Log.e(`Couldn't find action for button that was triggered!`, triggeredBtn);
                }
                else {
                    matchingBtn.action();
                    if (matchingBtn.closeWizardOnClick) {
                        return resolve(undefined);
                    }
                }
            });

            const onDidHide = ib.onDidHide(() => {
                // Log.d("IB was hidden");
                return resolve(undefined);
            });

            const onDidAccept = ib.onDidAccept(() => {
                if (ib.value === "" && step.allowEmpty !== true) {
                    ib.validationMessage = "The input cannot be empty.";
                    return;
                }
                else if (ib.validationMessage) {
                    // Block acceptance because the input is invalid.
                    return;
                }
                // Log.d(`IB was accepted with value ${ib.value}`);
                return resolve(ib.value);
            });

            disposables.push(onDidTriggerButton, onDidHide, onDidAccept);
        })
        .finally(() => {
            if (!reusableIB) {
                reusableIB = ib;
            }
            disposables.forEach((d) => d.dispose());
        });
        return result;
    }

    function runQuickPickStep(title: string, totalSteps: number, stepIndex: number, step: QuickPickStep, previousResults: string[]):
        Promise<vscode.QuickPickItem | undefined> {

        disposeIBIfExists();

        const qp = reusableQP ? reusableQP : vscode.window.createQuickPick();
        qp.title = title;
        qp.totalSteps = totalSteps;
        qp.step = stepIndex + 1;
        qp.placeholder = getGeneratedString(step.placeholder, previousResults);
        // ignore focus out on all steps after the first so we don't accidentally lose wizard progress
        qp.ignoreFocusOut = stepIndex > 0;

        const btns: vscode.QuickInputButton[] = [];
        if (stepIndex > 0) {
            btns.push(vscode.QuickInputButtons.Back);
        }

        if (step.buttons) {
            btns.concat(step.buttons.map((btn) => btn.button));
        }

        qp.show();

        const disposables: vscode.Disposable[] = [];

        const result = new Promise<vscode.QuickPickItem | undefined>((resolve, reject) => {
            const onDidTriggerButton = qp.onDidTriggerButton((triggeredBtn) => {
                if (triggeredBtn === vscode.QuickInputButtons.Back) {
                    return reject(BTN_BACK);
                }

                const matchingBtn = step.buttons?.find((btn) => btn.button === triggeredBtn);
                if (matchingBtn == null) {
                    Log.e(`Couldn't find action for button that was triggered!`, triggeredBtn);
                }
                else {
                    matchingBtn.action();
                    if (matchingBtn.closeWizardOnClick) {
                        return resolve(undefined);
                    }
                }
            });

            const onDidHide = qp.onDidHide(() => {
                return resolve(undefined);
            });

            // const onDidAccept = qp.onDidAccept(() => {
            //     // canSelectMany not supported yet
            //     return resolve(qp.selectedItems[0]);
            // });

            const onDidChangeSelection = qp.onDidChangeSelection((selection) => {
                // Workaround https://github.com/eclipse-theia/theia/issues/5674
                // Works as long as canSelectMany not allowed
                return resolve(selection[0]);
            });

            disposables.push(onDidTriggerButton, onDidHide, /* onDidAccept,*/ onDidChangeSelection);
        })
        .finally(() => {
            if (!reusableQP) {
                reusableQP = qp;
            }
            disposables.forEach((d) => d.dispose());
        });
        return result;
    }

}

export default InputUtil;
