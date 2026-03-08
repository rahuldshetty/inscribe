#! /usr/bin/env bun
import { Cli } from "clerc";

const cli = Cli({
    name: "inscribe",
    scriptName: "inscribe",
    description: "A simple static website generator for blogs and portfolio.",
    version: "0.0.1",
});

cli
    .command(
        "bar", // Command name
        "A bar command", // Command description
    )
    .on(
        "bar",
        (
            _ctx, // Command context, but we're not using it yet
        ) => {
            console.log("Hello, world from Clerc.js!");
        },
    )

// Parse arguments and run!
cli.parse(); 
