## FEATURE

Build a cli tool in NodeJs that will allow a user to control they Hue lights.

## Techstack

- NodeJs
- Typescript
- Prefer functional style
- Keep modules short and specific
- Use ESM
- Use the Hue API https://developers.meethue.com/develop/hue-api/
- Prefer native NodeJs and minimize external modules in dependencies
- Don't try to minimize the devDependencies for build tasksS
- Use native NodeJs tests for unit tests. Keep unit test files next to src files.
- Be able to run in a dev container while developing
- VSCode launch config for debugging CLI commands
- Pretty formatting
- Logging best practices and configuring at project level

## Features

- CLI for interacting with Hue home setup
- Compile to js module
- Deploy to npm
- Install globally with npm to allow running from command line
- Unit tests
- Linter

## Project Structure

package.json
modules

- cli // The main program entry and cli command logic
- api // Shared functions for accessing Hue API
- configure // Logic for module to configure lights and switches
- temps // Logic for setting the color temperature of your lights
- shared // Project level module for logging, etc..

Only implement the CLI module for now. We will fill in the rest later

## CLI COMMANDS

Command
Description
Example

huetemps list {lights, groups, sensors}
Lists all items for the given group.
`huetemps list`
`huetemps list lights`
`huetemps list groups`
`huetemps list sensors`
`huetemps list temps`

huetemps refresh
Clears cached data and fetches updated records from the hub
`huetemps refresh`

What other questions and considerations do you have?
