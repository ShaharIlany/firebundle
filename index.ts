#! /usr/bin/env node

import { program } from "commander"
import { single } from "./single";
import { project } from "./project";

program
    .name('firebundle | fb')
    .description('CLI tool to bundle node modules into tarball')
    .version('0.0.1');

program.command('package')
    .description('Bundle a single package with its dependencies')
    .argument('<package_name>', 'the package name')
    .action(async (package_name) => {
        await single(package_name)
    })

program.command('project')
    .description('Bundle all project dependencies, including all child dependencies')
    .argument('<package_json>', 'the package.json file path of the project')
    .action(async (package_json) => {
        await project(package_json)
    })

program.parse();