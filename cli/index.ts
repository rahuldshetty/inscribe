#! /usr/bin/env bun
import { Cli, defineCommand } from "clerc";
import fs from "fs-extra";
import path from "path";
import { LocalServer } from "./api/server";
import { build } from "./api/builder";

const templateDir = path.resolve(__dirname, "../template")

const cli = Cli({
    name: "inscribe",
    scriptName: "inscribe",
    description: "A simple static website generator for blogs and portfolio.",
    version: "0.0.1",
});

const initCommand = defineCommand(
    {
        name: "init",
        description: "Create scaffold for blog/docs",
    },
    async (ctx) => {
        const target = process.cwd();
        // check whether target is empty
        if (fs.readdirSync(target).length > 0) {
            console.log("Target directory is not empty");
            return;
        }
        await fs.copy(templateDir, target, {
            overwrite: false,
        });
        console.log("Docs scaffold created");
    }
);

const devCommand = defineCommand(
    {
        name: "dev",
        description: "Run development server",
        parameters: [
            "[path]",
        ],
    },
    async (ctx) => {
        const sourceDir = path.resolve(process.cwd(), ctx.parameters.path || ".");

        if (!fs.existsSync(sourceDir)) {
            console.error(`Error: directory not found ${sourceDir}`);
            return;
        }

        console.log(`Starting dev server for: ${sourceDir}`);

        const server = Bun.serve(LocalServer(sourceDir));

        console.log(`Server running at http://localhost:${server.port}`);
    }
);

const buildCommand = defineCommand(
    {
        name: "build",
        description: "Build static website",
        parameters: ["[path]"],
        flags: {
            output: {
                type: String,
                alias: "o",
                default: "./dist",
                description: "Output directory",
            },
            env: {
                type: String,
                default: "release",
                description: "Build environment (dev or release)",
            },
        },
    },
    async (ctx) => {
        const sourceDir = path.resolve(process.cwd(), ctx.parameters.path || ".");
        const outputDir = path.resolve(process.cwd(), ctx.flags.output);

        console.log(`Building static site from: ${sourceDir}`);
        console.log(`Output directory: ${outputDir}`);
        console.log(`Environment: ${ctx.flags.env}`);

        try {
            await build({
                sourceDir,
                outputDir,
                env: ctx.flags.env,
            });
            console.log("Build completed successfully!");
        } catch (error: any) {
            console.error(`Build failed: ${error.message}`);
        }
    }
);


cli.command(initCommand);
cli.command(devCommand);
cli.command(buildCommand);

// Parse arguments and run!
cli.parse(); 
