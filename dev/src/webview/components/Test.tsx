
import * as React from "react";

// tslint:disable-next-line: no-console
console.log("the test component is loaded");

export const TestObj = (props: { name: string }) => (
    <h1>
        Hi {props.name}
    </h1>
);
