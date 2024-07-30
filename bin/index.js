#! /usr/bin/env node
import {createRequire} from "node:module";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = createRequire(import.meta.url);

// node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var humanReadableArgName = function(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  };
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.length > 3 && this._name.slice(-3) === "...") {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, helper.subcommandTerm(command).length);
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length);
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, helper.optionTerm(option).length);
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, helper.argumentTerm(argument).length);
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        return `${option.description} (${extraInfo.join(", ")})`;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescripton = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescripton}`;
        }
        return extraDescripton;
      }
      return argument.description;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth || 80;
      const itemIndentWidth = 2;
      const itemSeparatorWidth = 2;
      function formatItem(term, description) {
        if (description) {
          const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
          return helper.wrap(fullText, helpWidth - itemIndentWidth, termWidth + itemSeparatorWidth);
        }
        return term;
      }
      function formatList(textArray) {
        return textArray.join("\n").replace(/^/gm, " ".repeat(itemIndentWidth));
      }
      let output = [`Usage: ${helper.commandUsage(cmd)}`, ""];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.wrap(commandDescription, helpWidth, 0),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return formatItem(helper.argumentTerm(argument), helper.argumentDescription(argument));
      });
      if (argumentList.length > 0) {
        output = output.concat(["Arguments:", formatList(argumentList), ""]);
      }
      const optionList = helper.visibleOptions(cmd).map((option) => {
        return formatItem(helper.optionTerm(option), helper.optionDescription(option));
      });
      if (optionList.length > 0) {
        output = output.concat(["Options:", formatList(optionList), ""]);
      }
      if (this.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return formatItem(helper.optionTerm(option), helper.optionDescription(option));
        });
        if (globalOptionList.length > 0) {
          output = output.concat([
            "Global Options:",
            formatList(globalOptionList),
            ""
          ]);
        }
      }
      const commandList = helper.visibleCommands(cmd).map((cmd2) => {
        return formatItem(helper.subcommandTerm(cmd2), helper.subcommandDescription(cmd2));
      });
      if (commandList.length > 0) {
        output = output.concat(["Commands:", formatList(commandList), ""]);
      }
      return output.join("\n");
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    wrap(str, width, indent, minColumnWidth = 40) {
      const indents = " \\f\\t\\v\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF";
      const manualIndent = new RegExp(`[\\n][${indents}]+`);
      if (str.match(manualIndent))
        return str;
      const columnWidth = width - indent;
      if (columnWidth < minColumnWidth)
        return str;
      const leadingStr = str.slice(0, indent);
      const columnText = str.slice(indent).replace("\r\n", "\n");
      const indentString = " ".repeat(indent);
      const zeroWidthSpace = "\u200B";
      const breaks = `\\s${zeroWidthSpace}`;
      const regex = new RegExp(`\n|.{1,${columnWidth - 1}}([${breaks}]|\$)|[^${breaks}]+?([${breaks}]|\$)`, "g");
      const lines = columnText.match(regex) || [];
      return leadingStr + lines.map((line, i) => {
        if (line === "\n")
          return "";
        return (i > 0 ? indentString : "") + line.trimEnd();
      }).join("\n");
    }
  }
  exports.Help = Help;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var camelcase = function(str) {
    return str.split("-").reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  };
  var splitOptionFlags = function(flags) {
    let shortFlag;
    let longFlag;
    const flagParts = flags.split(/[ |,]+/);
    if (flagParts.length > 1 && !/^[[<]/.test(flagParts[1]))
      shortFlag = flagParts.shift();
    longFlag = flagParts.shift();
    if (!shortFlag && /^-[^-]$/.test(longFlag)) {
      shortFlag = longFlag;
      longFlag = undefined;
    }
    return { shortFlag, longFlag };
  };
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      return camelcase(this.name().replace(/^no-/, ""));
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var editDistance = function(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  };
  var suggestSimilar = function(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `\n(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `\n(Did you mean ${similar[0]}?)`;
    }
    return "";
  };
  var maxDistance = 3;
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var incrementNodeInspectorPort = function(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  };
  var EventEmitter = __require("node:events").EventEmitter;
  var childProcess = __require("node:child_process");
  var path = __require("node:path");
  var fs = __require("node:fs");
  var process2 = __require("node:process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = true;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        outputError: (str, write) => write(str)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      Object.assign(this._outputConfiguration, configuration);
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, fn, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof fn === "function") {
        argument.default(defaultValue).argParser(fn);
      } else {
        argument.default(fn);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument && previousArgument.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        return this;
      }
      enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {
          }
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._concatValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch (err) {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
          const executableMissing = `'${executableFile}' does not exist
 - if '${subcommand._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
          throw new Error(executableMissing);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise && promise.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent && this.parent.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(argv) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      const args = argv.slice();
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      let activeVariadicOption = null;
      while (args.length) {
        const arg = args.shift();
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args);
          break;
        }
        if (activeVariadicOption && !maybeOption(arg)) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args.shift();
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (args.length > 0 && !maybeOption(args[0])) {
                value = args.shift();
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              args.unshift(`-${arg.slice(2)}`);
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (maybeOption(arg)) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg);
            if (args.length > 0)
              operands.push(...args);
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg);
          if (args.length > 0)
            dest.push(...args);
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}\n`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}\n`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr("\n");
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str, flags, description) {
      if (str === undefined)
        return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}\n`);
        this._exit(0, "commander.version", str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined)
        return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined)
        return this._name;
      this._name = str;
      return this;
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      if (helper.helpWidth === undefined) {
        helper.helpWidth = contextOptions && contextOptions.error ? this._outputConfiguration.getErrHelpWidth() : this._outputConfiguration.getOutHelpWidth();
      }
      return helper.formatHelp(this, helper);
    }
    _getHelpContext(contextOptions) {
      contextOptions = contextOptions || {};
      const context = { error: !!contextOptions.error };
      let write;
      if (context.error) {
        write = (arg) => this._outputConfiguration.writeErr(arg);
      } else {
        write = (arg) => this._outputConfiguration.writeOut(arg);
      }
      context.write = contextOptions.write || write;
      context.command = this;
      return context;
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const context = this._getHelpContext(contextOptions);
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", context));
      this.emit("beforeHelp", context);
      let helpInformation = this.helpInformation(context);
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      context.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", context);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", context));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          this._helpOption = this._helpOption ?? undefined;
        } else {
          this._helpOption = null;
        }
        return this;
      }
      flags = flags ?? "-h, --help";
      description = description ?? "display help for command";
      this._helpOption = this.createOption(flags, description);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = process2.exitCode || 0;
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}\n`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  exports.Command = Command;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// node_modules/cli-progress/lib/eta.js
var require_eta = __commonJS((exports, module) => {
  class ETA {
    constructor(length, initTime, initValue) {
      this.etaBufferLength = length || 100;
      this.valueBuffer = [initValue];
      this.timeBuffer = [initTime];
      this.eta = "0";
    }
    update(time, value, total) {
      this.valueBuffer.push(value);
      this.timeBuffer.push(time);
      this.calculate(total - value);
    }
    getTime() {
      return this.eta;
    }
    calculate(remaining) {
      const currentBufferSize = this.valueBuffer.length;
      const buffer = Math.min(this.etaBufferLength, currentBufferSize);
      const v_diff = this.valueBuffer[currentBufferSize - 1] - this.valueBuffer[currentBufferSize - buffer];
      const t_diff = this.timeBuffer[currentBufferSize - 1] - this.timeBuffer[currentBufferSize - buffer];
      const vt_rate = v_diff / t_diff;
      this.valueBuffer = this.valueBuffer.slice(-this.etaBufferLength);
      this.timeBuffer = this.timeBuffer.slice(-this.etaBufferLength);
      const eta = Math.ceil(remaining / vt_rate / 1000);
      if (isNaN(eta)) {
        this.eta = "NULL";
      } else if (!isFinite(eta)) {
        this.eta = "INF";
      } else if (eta > 1e7) {
        this.eta = "INF";
      } else if (eta < 0) {
        this.eta = 0;
      } else {
        this.eta = eta;
      }
    }
  }
  module.exports = ETA;
});

// node_modules/cli-progress/lib/terminal.js
var require_terminal = __commonJS((exports, module) => {
  var _readline = __require("readline");

  class Terminal {
    constructor(outputStream) {
      this.stream = outputStream;
      this.linewrap = true;
      this.dy = 0;
    }
    cursorSave() {
      if (!this.stream.isTTY) {
        return;
      }
      this.stream.write("\x1B7");
    }
    cursorRestore() {
      if (!this.stream.isTTY) {
        return;
      }
      this.stream.write("\x1B8");
    }
    cursor(enabled) {
      if (!this.stream.isTTY) {
        return;
      }
      if (enabled) {
        this.stream.write("\x1B[?25h");
      } else {
        this.stream.write("\x1B[?25l");
      }
    }
    cursorTo(x = null, y = null) {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.cursorTo(this.stream, x, y);
    }
    cursorRelative(dx = null, dy = null) {
      if (!this.stream.isTTY) {
        return;
      }
      this.dy = this.dy + dy;
      _readline.moveCursor(this.stream, dx, dy);
    }
    cursorRelativeReset() {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.moveCursor(this.stream, 0, -this.dy);
      _readline.cursorTo(this.stream, 0, null);
      this.dy = 0;
    }
    clearRight() {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.clearLine(this.stream, 1);
    }
    clearLine() {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.clearLine(this.stream, 0);
    }
    clearBottom() {
      if (!this.stream.isTTY) {
        return;
      }
      _readline.clearScreenDown(this.stream);
    }
    newline() {
      this.stream.write("\n");
      this.dy++;
    }
    write(s, rawWrite = false) {
      if (this.linewrap === true && rawWrite === false) {
        this.stream.write(s.substr(0, this.getWidth()));
      } else {
        this.stream.write(s);
      }
    }
    lineWrapping(enabled) {
      if (!this.stream.isTTY) {
        return;
      }
      this.linewrap = enabled;
      if (enabled) {
        this.stream.write("\x1B[?7h");
      } else {
        this.stream.write("\x1B[?7l");
      }
    }
    isTTY() {
      return this.stream.isTTY === true;
    }
    getWidth() {
      return this.stream.columns || (this.stream.isTTY ? 80 : 200);
    }
  }
  module.exports = Terminal;
});

// node_modules/string-width/node_modules/strip-ansi/node_modules/ansi-regex/index.js
var require_ansi_regex = __commonJS((exports, module) => {
  module.exports = ({ onlyFirst = false } = {}) => {
    const pattern = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");
    return new RegExp(pattern, onlyFirst ? undefined : "g");
  };
});

// node_modules/string-width/node_modules/strip-ansi/index.js
var require_strip_ansi = __commonJS((exports, module) => {
  var ansiRegex = require_ansi_regex();
  module.exports = (string) => typeof string === "string" ? string.replace(ansiRegex(), "") : string;
});

// node_modules/is-fullwidth-code-point/index.js
var require_is_fullwidth_code_point = __commonJS((exports, module) => {
  var isFullwidthCodePoint = (codePoint) => {
    if (Number.isNaN(codePoint)) {
      return false;
    }
    if (codePoint >= 4352 && (codePoint <= 4447 || codePoint === 9001 || codePoint === 9002 || 11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || 12880 <= codePoint && codePoint <= 19903 || 19968 <= codePoint && codePoint <= 42182 || 43360 <= codePoint && codePoint <= 43388 || 44032 <= codePoint && codePoint <= 55203 || 63744 <= codePoint && codePoint <= 64255 || 65040 <= codePoint && codePoint <= 65049 || 65072 <= codePoint && codePoint <= 65131 || 65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || 110592 <= codePoint && codePoint <= 110593 || 127488 <= codePoint && codePoint <= 127569 || 131072 <= codePoint && codePoint <= 262141)) {
      return true;
    }
    return false;
  };
  module.exports = isFullwidthCodePoint;
  module.exports.default = isFullwidthCodePoint;
});

// node_modules/emoji-regex/index.js
var require_emoji_regex = __commonJS((exports, module) => {
  module.exports = function() {
    return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
  };
});

// node_modules/string-width/index.js
var require_string_width = __commonJS((exports, module) => {
  var stripAnsi = require_strip_ansi();
  var isFullwidthCodePoint = require_is_fullwidth_code_point();
  var emojiRegex = require_emoji_regex();
  var stringWidth = (string) => {
    if (typeof string !== "string" || string.length === 0) {
      return 0;
    }
    string = stripAnsi(string);
    if (string.length === 0) {
      return 0;
    }
    string = string.replace(emojiRegex(), "  ");
    let width = 0;
    for (let i = 0;i < string.length; i++) {
      const code2 = string.codePointAt(i);
      if (code2 <= 31 || code2 >= 127 && code2 <= 159) {
        continue;
      }
      if (code2 >= 768 && code2 <= 879) {
        continue;
      }
      if (code2 > 65535) {
        i++;
      }
      width += isFullwidthCodePoint(code2) ? 2 : 1;
    }
    return width;
  };
  module.exports = stringWidth;
  module.exports.default = stringWidth;
});

// node_modules/cli-progress/lib/format-value.js
var require_format_value = __commonJS((exports, module) => {
  module.exports = function formatValue(v, options4, type) {
    if (options4.autopadding !== true) {
      return v;
    }
    function autopadding(value, length) {
      return (options4.autopaddingChar + value).slice(-length);
    }
    switch (type) {
      case "percentage":
        return autopadding(v, 3);
      default:
        return v;
    }
  };
});

// node_modules/cli-progress/lib/format-bar.js
var require_format_bar = __commonJS((exports, module) => {
  module.exports = function formatBar(progress, options4) {
    const completeSize = Math.round(progress * options4.barsize);
    const incompleteSize = options4.barsize - completeSize;
    return options4.barCompleteString.substr(0, completeSize) + options4.barGlue + options4.barIncompleteString.substr(0, incompleteSize);
  };
});

// node_modules/cli-progress/lib/format-time.js
var require_format_time = __commonJS((exports, module) => {
  module.exports = function formatTime(t, options4, roundToMultipleOf) {
    function round(input) {
      if (roundToMultipleOf) {
        return roundToMultipleOf * Math.round(input / roundToMultipleOf);
      } else {
        return input;
      }
    }
    function autopadding(v) {
      return (options4.autopaddingChar + v).slice(-2);
    }
    if (t > 3600) {
      return autopadding(Math.floor(t / 3600)) + "h" + autopadding(round(t % 3600 / 60)) + "m";
    } else if (t > 60) {
      return autopadding(Math.floor(t / 60)) + "m" + autopadding(round(t % 60)) + "s";
    } else if (t > 10) {
      return autopadding(round(t)) + "s";
    } else {
      return autopadding(t) + "s";
    }
  };
});

// node_modules/cli-progress/lib/formatter.js
var require_formatter = __commonJS((exports, module) => {
  var _stringWidth = require_string_width();
  var _defaultFormatValue = require_format_value();
  var _defaultFormatBar = require_format_bar();
  var _defaultFormatTime = require_format_time();
  module.exports = function defaultFormatter(options4, params, payload) {
    let s = options4.format;
    const formatTime = options4.formatTime || _defaultFormatTime;
    const formatValue = options4.formatValue || _defaultFormatValue;
    const formatBar = options4.formatBar || _defaultFormatBar;
    const percentage = Math.floor(params.progress * 100) + "";
    const stopTime = params.stopTime || Date.now();
    const elapsedTime = Math.round((stopTime - params.startTime) / 1000);
    const context = Object.assign({}, payload, {
      bar: formatBar(params.progress, options4),
      percentage: formatValue(percentage, options4, "percentage"),
      total: formatValue(params.total, options4, "total"),
      value: formatValue(params.value, options4, "value"),
      eta: formatValue(params.eta, options4, "eta"),
      eta_formatted: formatTime(params.eta, options4, 5),
      duration: formatValue(elapsedTime, options4, "duration"),
      duration_formatted: formatTime(elapsedTime, options4, 1)
    });
    s = s.replace(/\{(\w+)\}/g, function(match, key) {
      if (typeof context[key] !== "undefined") {
        return context[key];
      }
      return match;
    });
    const fullMargin = Math.max(0, params.maxWidth - _stringWidth(s) - 2);
    const halfMargin = Math.floor(fullMargin / 2);
    switch (options4.align) {
      case "right":
        s = fullMargin > 0 ? " ".repeat(fullMargin) + s : s;
        break;
      case "center":
        s = halfMargin > 0 ? " ".repeat(halfMargin) + s : s;
        break;
      case "left":
      default:
        break;
    }
    return s;
  };
});

// node_modules/cli-progress/lib/options.js
var require_options = __commonJS((exports, module) => {
  var mergeOption = function(v, defaultValue) {
    if (typeof v === "undefined" || v === null) {
      return defaultValue;
    } else {
      return v;
    }
  };
  module.exports = {
    parse: function parse(rawOptions, preset) {
      const options4 = {};
      const opt = Object.assign({}, preset, rawOptions);
      options4.throttleTime = 1000 / mergeOption(opt.fps, 10);
      options4.stream = mergeOption(opt.stream, process.stderr);
      options4.terminal = mergeOption(opt.terminal, null);
      options4.clearOnComplete = mergeOption(opt.clearOnComplete, false);
      options4.stopOnComplete = mergeOption(opt.stopOnComplete, false);
      options4.barsize = mergeOption(opt.barsize, 40);
      options4.align = mergeOption(opt.align, "left");
      options4.hideCursor = mergeOption(opt.hideCursor, false);
      options4.linewrap = mergeOption(opt.linewrap, false);
      options4.barGlue = mergeOption(opt.barGlue, "");
      options4.barCompleteChar = mergeOption(opt.barCompleteChar, "=");
      options4.barIncompleteChar = mergeOption(opt.barIncompleteChar, "-");
      options4.format = mergeOption(opt.format, "progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}");
      options4.formatTime = mergeOption(opt.formatTime, null);
      options4.formatValue = mergeOption(opt.formatValue, null);
      options4.formatBar = mergeOption(opt.formatBar, null);
      options4.etaBufferLength = mergeOption(opt.etaBuffer, 10);
      options4.etaAsynchronousUpdate = mergeOption(opt.etaAsynchronousUpdate, false);
      options4.progressCalculationRelative = mergeOption(opt.progressCalculationRelative, false);
      options4.synchronousUpdate = mergeOption(opt.synchronousUpdate, true);
      options4.noTTYOutput = mergeOption(opt.noTTYOutput, false);
      options4.notTTYSchedule = mergeOption(opt.notTTYSchedule, 2000);
      options4.emptyOnZero = mergeOption(opt.emptyOnZero, false);
      options4.forceRedraw = mergeOption(opt.forceRedraw, false);
      options4.autopadding = mergeOption(opt.autopadding, false);
      options4.gracefulExit = mergeOption(opt.gracefulExit, false);
      return options4;
    },
    assignDerivedOptions: function assignDerivedOptions(options4) {
      options4.barCompleteString = options4.barCompleteChar.repeat(options4.barsize + 1);
      options4.barIncompleteString = options4.barIncompleteChar.repeat(options4.barsize + 1);
      options4.autopaddingChar = options4.autopadding ? mergeOption(options4.autopaddingChar, "   ") : "";
      return options4;
    }
  };
});

// node_modules/cli-progress/lib/generic-bar.js
var require_generic_bar = __commonJS((exports, module) => {
  var _ETA = require_eta();
  var _Terminal = require_terminal();
  var _formatter = require_formatter();
  var _options = require_options();
  var _EventEmitter = __require("events");
  module.exports = class GenericBar extends _EventEmitter {
    constructor(options4) {
      super();
      this.options = _options.assignDerivedOptions(options4);
      this.terminal = this.options.terminal ? this.options.terminal : new _Terminal(this.options.stream);
      this.value = 0;
      this.startValue = 0;
      this.total = 100;
      this.lastDrawnString = null;
      this.startTime = null;
      this.stopTime = null;
      this.lastRedraw = Date.now();
      this.eta = new _ETA(this.options.etaBufferLength, 0, 0);
      this.payload = {};
      this.isActive = false;
      this.formatter = typeof this.options.format === "function" ? this.options.format : _formatter;
    }
    render(forceRendering = false) {
      const params = {
        progress: this.getProgress(),
        eta: this.eta.getTime(),
        startTime: this.startTime,
        stopTime: this.stopTime,
        total: this.total,
        value: this.value,
        maxWidth: this.terminal.getWidth()
      };
      if (this.options.etaAsynchronousUpdate) {
        this.updateETA();
      }
      const s = this.formatter(this.options, params, this.payload);
      const forceRedraw = forceRendering || this.options.forceRedraw || this.options.noTTYOutput && !this.terminal.isTTY();
      if (forceRedraw || this.lastDrawnString != s) {
        this.emit("redraw-pre");
        this.terminal.cursorTo(0, null);
        this.terminal.write(s);
        this.terminal.clearRight();
        this.lastDrawnString = s;
        this.lastRedraw = Date.now();
        this.emit("redraw-post");
      }
    }
    start(total, startValue, payload) {
      this.value = startValue || 0;
      this.total = typeof total !== "undefined" && total >= 0 ? total : 100;
      this.startValue = startValue || 0;
      this.payload = payload || {};
      this.startTime = Date.now();
      this.stopTime = null;
      this.lastDrawnString = "";
      this.eta = new _ETA(this.options.etaBufferLength, this.startTime, this.value);
      this.isActive = true;
      this.emit("start", total, startValue);
    }
    stop() {
      this.isActive = false;
      this.stopTime = Date.now();
      this.emit("stop", this.total, this.value);
    }
    update(arg0, arg1 = {}) {
      if (typeof arg0 === "number") {
        this.value = arg0;
        this.eta.update(Date.now(), arg0, this.total);
      }
      const payloadData = (typeof arg0 === "object" ? arg0 : arg1) || {};
      this.emit("update", this.total, this.value);
      for (const key in payloadData) {
        this.payload[key] = payloadData[key];
      }
      if (this.value >= this.getTotal() && this.options.stopOnComplete) {
        this.stop();
      }
    }
    getProgress() {
      let progress = this.value / this.total;
      if (this.options.progressCalculationRelative) {
        progress = (this.value - this.startValue) / (this.total - this.startValue);
      }
      if (isNaN(progress)) {
        progress = this.options && this.options.emptyOnZero ? 0 : 1;
      }
      progress = Math.min(Math.max(progress, 0), 1);
      return progress;
    }
    increment(arg0 = 1, arg1 = {}) {
      if (typeof arg0 === "object") {
        this.update(this.value + 1, arg0);
      } else {
        this.update(this.value + arg0, arg1);
      }
    }
    getTotal() {
      return this.total;
    }
    setTotal(total) {
      if (typeof total !== "undefined" && total >= 0) {
        this.total = total;
      }
    }
    updateETA() {
      this.eta.update(Date.now(), this.value, this.total);
    }
  };
});

// node_modules/cli-progress/lib/single-bar.js
var require_single_bar = __commonJS((exports, module) => {
  var _GenericBar = require_generic_bar();
  var _options = require_options();
  module.exports = class SingleBar extends _GenericBar {
    constructor(options4, preset) {
      super(_options.parse(options4, preset));
      this.timer = null;
      if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
        this.options.synchronousUpdate = false;
      }
      this.schedulingRate = this.terminal.isTTY() ? this.options.throttleTime : this.options.notTTYSchedule;
      this.sigintCallback = null;
    }
    render() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      super.render();
      if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
        this.terminal.newline();
      }
      this.timer = setTimeout(this.render.bind(this), this.schedulingRate);
    }
    update(current, payload) {
      if (!this.timer) {
        return;
      }
      super.update(current, payload);
      if (this.options.synchronousUpdate && this.lastRedraw + this.options.throttleTime * 2 < Date.now()) {
        this.render();
      }
    }
    start(total, startValue, payload) {
      if (this.options.noTTYOutput === false && this.terminal.isTTY() === false) {
        return;
      }
      if (this.sigintCallback === null && this.options.gracefulExit) {
        this.sigintCallback = this.stop.bind(this);
        process.once("SIGINT", this.sigintCallback);
        process.once("SIGTERM", this.sigintCallback);
      }
      this.terminal.cursorSave();
      if (this.options.hideCursor === true) {
        this.terminal.cursor(false);
      }
      if (this.options.linewrap === false) {
        this.terminal.lineWrapping(false);
      }
      super.start(total, startValue, payload);
      this.render();
    }
    stop() {
      if (!this.timer) {
        return;
      }
      if (this.sigintCallback) {
        process.removeListener("SIGINT", this.sigintCallback);
        process.removeListener("SIGTERM", this.sigintCallback);
        this.sigintCallback = null;
      }
      this.render();
      super.stop();
      clearTimeout(this.timer);
      this.timer = null;
      if (this.options.hideCursor === true) {
        this.terminal.cursor(true);
      }
      if (this.options.linewrap === false) {
        this.terminal.lineWrapping(true);
      }
      this.terminal.cursorRestore();
      if (this.options.clearOnComplete) {
        this.terminal.cursorTo(0, null);
        this.terminal.clearLine();
      } else {
        this.terminal.newline();
      }
    }
  };
});

// node_modules/cli-progress/lib/multi-bar.js
var require_multi_bar = __commonJS((exports, module) => {
  var _Terminal = require_terminal();
  var _BarElement = require_generic_bar();
  var _options = require_options();
  var _EventEmitter = __require("events");
  module.exports = class MultiBar extends _EventEmitter {
    constructor(options4, preset) {
      super();
      this.bars = [];
      this.options = _options.parse(options4, preset);
      this.options.synchronousUpdate = false;
      this.terminal = this.options.terminal ? this.options.terminal : new _Terminal(this.options.stream);
      this.timer = null;
      this.isActive = false;
      this.schedulingRate = this.terminal.isTTY() ? this.options.throttleTime : this.options.notTTYSchedule;
      this.loggingBuffer = [];
      this.sigintCallback = null;
    }
    create(total, startValue, payload, barOptions = {}) {
      const bar = new _BarElement(Object.assign({}, this.options, {
        terminal: this.terminal
      }, barOptions));
      this.bars.push(bar);
      if (this.options.noTTYOutput === false && this.terminal.isTTY() === false) {
        return bar;
      }
      if (this.sigintCallback === null && this.options.gracefulExit) {
        this.sigintCallback = this.stop.bind(this);
        process.once("SIGINT", this.sigintCallback);
        process.once("SIGTERM", this.sigintCallback);
      }
      if (!this.isActive) {
        if (this.options.hideCursor === true) {
          this.terminal.cursor(false);
        }
        if (this.options.linewrap === false) {
          this.terminal.lineWrapping(false);
        }
        this.timer = setTimeout(this.update.bind(this), this.schedulingRate);
      }
      this.isActive = true;
      bar.start(total, startValue, payload);
      this.emit("start");
      return bar;
    }
    remove(bar) {
      const index = this.bars.indexOf(bar);
      if (index < 0) {
        return false;
      }
      this.bars.splice(index, 1);
      this.update();
      this.terminal.newline();
      this.terminal.clearBottom();
      return true;
    }
    update() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.emit("update-pre");
      this.terminal.cursorRelativeReset();
      this.emit("redraw-pre");
      if (this.loggingBuffer.length > 0) {
        this.terminal.clearLine();
        while (this.loggingBuffer.length > 0) {
          this.terminal.write(this.loggingBuffer.shift(), true);
        }
      }
      for (let i = 0;i < this.bars.length; i++) {
        if (i > 0) {
          this.terminal.newline();
        }
        this.bars[i].render();
      }
      this.emit("redraw-post");
      if (this.options.noTTYOutput && this.terminal.isTTY() === false) {
        this.terminal.newline();
        this.terminal.newline();
      }
      this.timer = setTimeout(this.update.bind(this), this.schedulingRate);
      this.emit("update-post");
      if (this.options.stopOnComplete && !this.bars.find((bar) => bar.isActive)) {
        this.stop();
      }
    }
    stop() {
      clearTimeout(this.timer);
      this.timer = null;
      if (this.sigintCallback) {
        process.removeListener("SIGINT", this.sigintCallback);
        process.removeListener("SIGTERM", this.sigintCallback);
        this.sigintCallback = null;
      }
      this.isActive = false;
      if (this.options.hideCursor === true) {
        this.terminal.cursor(true);
      }
      if (this.options.linewrap === false) {
        this.terminal.lineWrapping(true);
      }
      this.terminal.cursorRelativeReset();
      this.emit("stop-pre-clear");
      if (this.options.clearOnComplete) {
        this.terminal.clearBottom();
      } else {
        for (let i = 0;i < this.bars.length; i++) {
          if (i > 0) {
            this.terminal.newline();
          }
          this.bars[i].render();
          this.bars[i].stop();
        }
        this.terminal.newline();
      }
      this.emit("stop");
    }
    log(s) {
      this.loggingBuffer.push(s);
    }
  };
});

// node_modules/cli-progress/presets/legacy.js
var require_legacy = __commonJS((exports, module) => {
  module.exports = {
    format: "progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "=",
    barIncompleteChar: "-"
  };
});

// node_modules/cli-progress/presets/shades-classic.js
var require_shades_classic = __commonJS((exports, module) => {
  module.exports = {
    format: " {bar} {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591"
  };
});

// node_modules/cli-progress/presets/shades-grey.js
var require_shades_grey = __commonJS((exports, module) => {
  module.exports = {
    format: " \x1B[90m{bar}\x1B[0m {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591"
  };
});

// node_modules/cli-progress/presets/rect.js
var require_rect = __commonJS((exports, module) => {
  module.exports = {
    format: " {bar}\u25A0 {percentage}% | ETA: {eta}s | {value}/{total}",
    barCompleteChar: "\u25A0",
    barIncompleteChar: " "
  };
});

// node_modules/cli-progress/presets/index.js
var require_presets = __commonJS((exports, module) => {
  var _legacy = require_legacy();
  var _shades_classic = require_shades_classic();
  var _shades_grey = require_shades_grey();
  var _rect = require_rect();
  module.exports = {
    legacy: _legacy,
    shades_classic: _shades_classic,
    shades_grey: _shades_grey,
    rect: _rect
  };
});

// node_modules/cli-progress/cli-progress.js
var require_cli_progress = __commonJS((exports, module) => {
  var _SingleBar = require_single_bar();
  var _MultiBar = require_multi_bar();
  var _Presets = require_presets();
  var _Formatter = require_formatter();
  var _defaultFormatValue = require_format_value();
  var _defaultFormatBar = require_format_bar();
  var _defaultFormatTime = require_format_time();
  module.exports = {
    Bar: _SingleBar,
    SingleBar: _SingleBar,
    MultiBar: _MultiBar,
    Presets: _Presets,
    Format: {
      Formatter: _Formatter,
      BarFormat: _defaultFormatBar,
      ValueFormat: _defaultFormatValue,
      TimeFormat: _defaultFormatTime
    }
  };
});

// node_modules/mimic-fn/index.js
var require_mimic_fn = __commonJS((exports, module) => {
  var mimicFn = (to, from) => {
    for (const prop of Reflect.ownKeys(from)) {
      Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
    }
    return to;
  };
  module.exports = mimicFn;
  module.exports.default = mimicFn;
});

// node_modules/onetime/index.js
var require_onetime = __commonJS((exports, module) => {
  var mimicFn = require_mimic_fn();
  var calledFunctions = new WeakMap;
  var onetime = (function_, options4 = {}) => {
    if (typeof function_ !== "function") {
      throw new TypeError("Expected a function");
    }
    let returnValue;
    let callCount = 0;
    const functionName = function_.displayName || function_.name || "<anonymous>";
    const onetime2 = function(...arguments_) {
      calledFunctions.set(onetime2, ++callCount);
      if (callCount === 1) {
        returnValue = function_.apply(this, arguments_);
        function_ = null;
      } else if (options4.throw === true) {
        throw new Error(`Function \`${functionName}\` can only be called once`);
      }
      return returnValue;
    };
    mimicFn(onetime2, function_);
    calledFunctions.set(onetime2, callCount);
    return onetime2;
  };
  module.exports = onetime;
  module.exports.default = onetime;
  module.exports.callCount = (function_) => {
    if (!calledFunctions.has(function_)) {
      throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
    }
    return calledFunctions.get(function_);
  };
});

// node_modules/restore-cursor/node_modules/signal-exit/signals.js
var require_signals = __commonJS((exports, module) => {
  module.exports = [
    "SIGABRT",
    "SIGALRM",
    "SIGHUP",
    "SIGINT",
    "SIGTERM"
  ];
  if (process.platform !== "win32") {
    module.exports.push("SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
  }
  if (process.platform === "linux") {
    module.exports.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT", "SIGUNUSED");
  }
});

// node_modules/restore-cursor/node_modules/signal-exit/index.js
var require_signal_exit = __commonJS((exports, module) => {
  var process3 = global.process;
  var processOk = function(process4) {
    return process4 && typeof process4 === "object" && typeof process4.removeListener === "function" && typeof process4.emit === "function" && typeof process4.reallyExit === "function" && typeof process4.listeners === "function" && typeof process4.kill === "function" && typeof process4.pid === "number" && typeof process4.on === "function";
  };
  if (!processOk(process3)) {
    module.exports = function() {
      return function() {
      };
    };
  } else {
    assert3 = __require("assert");
    signals = require_signals();
    isWin = /^win/i.test(process3.platform);
    EE3 = __require("events");
    if (typeof EE3 !== "function") {
      EE3 = EE3.EventEmitter;
    }
    if (process3.__signal_exit_emitter__) {
      emitter = process3.__signal_exit_emitter__;
    } else {
      emitter = process3.__signal_exit_emitter__ = new EE3;
      emitter.count = 0;
      emitter.emitted = {};
    }
    if (!emitter.infinite) {
      emitter.setMaxListeners(Infinity);
      emitter.infinite = true;
    }
    module.exports = function(cb, opts) {
      if (!processOk(global.process)) {
        return function() {
        };
      }
      assert3.equal(typeof cb, "function", "a callback must be provided for exit handler");
      if (loaded === false) {
        load();
      }
      var ev = "exit";
      if (opts && opts.alwaysLast) {
        ev = "afterexit";
      }
      var remove = function() {
        emitter.removeListener(ev, cb);
        if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
          unload();
        }
      };
      emitter.on(ev, cb);
      return remove;
    };
    unload = function unload() {
      if (!loaded || !processOk(global.process)) {
        return;
      }
      loaded = false;
      signals.forEach(function(sig) {
        try {
          process3.removeListener(sig, sigListeners[sig]);
        } catch (er) {
        }
      });
      process3.emit = originalProcessEmit;
      process3.reallyExit = originalProcessReallyExit;
      emitter.count -= 1;
    };
    module.exports.unload = unload;
    emit = function emit(event, code2, signal) {
      if (emitter.emitted[event]) {
        return;
      }
      emitter.emitted[event] = true;
      emitter.emit(event, code2, signal);
    };
    sigListeners = {};
    signals.forEach(function(sig) {
      sigListeners[sig] = function listener() {
        if (!processOk(global.process)) {
          return;
        }
        var listeners = process3.listeners(sig);
        if (listeners.length === emitter.count) {
          unload();
          emit("exit", null, sig);
          emit("afterexit", null, sig);
          if (isWin && sig === "SIGHUP") {
            sig = "SIGINT";
          }
          process3.kill(process3.pid, sig);
        }
      };
    });
    module.exports.signals = function() {
      return signals;
    };
    loaded = false;
    load = function load() {
      if (loaded || !processOk(global.process)) {
        return;
      }
      loaded = true;
      emitter.count += 1;
      signals = signals.filter(function(sig) {
        try {
          process3.on(sig, sigListeners[sig]);
          return true;
        } catch (er) {
          return false;
        }
      });
      process3.emit = processEmit;
      process3.reallyExit = processReallyExit;
    };
    module.exports.load = load;
    originalProcessReallyExit = process3.reallyExit;
    processReallyExit = function processReallyExit(code2) {
      if (!processOk(global.process)) {
        return;
      }
      process3.exitCode = code2 || 0;
      emit("exit", process3.exitCode, null);
      emit("afterexit", process3.exitCode, null);
      originalProcessReallyExit.call(process3, process3.exitCode);
    };
    originalProcessEmit = process3.emit;
    processEmit = function processEmit(ev, arg) {
      if (ev === "exit" && processOk(global.process)) {
        if (arg !== undefined) {
          process3.exitCode = arg;
        }
        var ret = originalProcessEmit.apply(this, arguments);
        emit("exit", process3.exitCode, null);
        emit("afterexit", process3.exitCode, null);
        return ret;
      } else {
        return originalProcessEmit.apply(this, arguments);
      }
    };
  }
  var assert3;
  var signals;
  var isWin;
  var EE3;
  var emitter;
  var unload;
  var emit;
  var sigListeners;
  var loaded;
  var load;
  var originalProcessReallyExit;
  var processReallyExit;
  var originalProcessEmit;
  var processEmit;
});

// node_modules/ora/node_modules/cli-spinners/spinners.json
var require_spinners = __commonJS((exports, module) => {
  module.exports = {
    dots: {
      interval: 80,
      frames: [
        "\u280B",
        "\u2819",
        "\u2839",
        "\u2838",
        "\u283C",
        "\u2834",
        "\u2826",
        "\u2827",
        "\u2807",
        "\u280F"
      ]
    },
    dots2: {
      interval: 80,
      frames: [
        "\u28FE",
        "\u28FD",
        "\u28FB",
        "\u28BF",
        "\u287F",
        "\u28DF",
        "\u28EF",
        "\u28F7"
      ]
    },
    dots3: {
      interval: 80,
      frames: [
        "\u280B",
        "\u2819",
        "\u281A",
        "\u281E",
        "\u2816",
        "\u2826",
        "\u2834",
        "\u2832",
        "\u2833",
        "\u2813"
      ]
    },
    dots4: {
      interval: 80,
      frames: [
        "\u2804",
        "\u2806",
        "\u2807",
        "\u280B",
        "\u2819",
        "\u2838",
        "\u2830",
        "\u2820",
        "\u2830",
        "\u2838",
        "\u2819",
        "\u280B",
        "\u2807",
        "\u2806"
      ]
    },
    dots5: {
      interval: 80,
      frames: [
        "\u280B",
        "\u2819",
        "\u281A",
        "\u2812",
        "\u2802",
        "\u2802",
        "\u2812",
        "\u2832",
        "\u2834",
        "\u2826",
        "\u2816",
        "\u2812",
        "\u2810",
        "\u2810",
        "\u2812",
        "\u2813",
        "\u280B"
      ]
    },
    dots6: {
      interval: 80,
      frames: [
        "\u2801",
        "\u2809",
        "\u2819",
        "\u281A",
        "\u2812",
        "\u2802",
        "\u2802",
        "\u2812",
        "\u2832",
        "\u2834",
        "\u2824",
        "\u2804",
        "\u2804",
        "\u2824",
        "\u2834",
        "\u2832",
        "\u2812",
        "\u2802",
        "\u2802",
        "\u2812",
        "\u281A",
        "\u2819",
        "\u2809",
        "\u2801"
      ]
    },
    dots7: {
      interval: 80,
      frames: [
        "\u2808",
        "\u2809",
        "\u280B",
        "\u2813",
        "\u2812",
        "\u2810",
        "\u2810",
        "\u2812",
        "\u2816",
        "\u2826",
        "\u2824",
        "\u2820",
        "\u2820",
        "\u2824",
        "\u2826",
        "\u2816",
        "\u2812",
        "\u2810",
        "\u2810",
        "\u2812",
        "\u2813",
        "\u280B",
        "\u2809",
        "\u2808"
      ]
    },
    dots8: {
      interval: 80,
      frames: [
        "\u2801",
        "\u2801",
        "\u2809",
        "\u2819",
        "\u281A",
        "\u2812",
        "\u2802",
        "\u2802",
        "\u2812",
        "\u2832",
        "\u2834",
        "\u2824",
        "\u2804",
        "\u2804",
        "\u2824",
        "\u2820",
        "\u2820",
        "\u2824",
        "\u2826",
        "\u2816",
        "\u2812",
        "\u2810",
        "\u2810",
        "\u2812",
        "\u2813",
        "\u280B",
        "\u2809",
        "\u2808",
        "\u2808"
      ]
    },
    dots9: {
      interval: 80,
      frames: [
        "\u28B9",
        "\u28BA",
        "\u28BC",
        "\u28F8",
        "\u28C7",
        "\u2867",
        "\u2857",
        "\u284F"
      ]
    },
    dots10: {
      interval: 80,
      frames: [
        "\u2884",
        "\u2882",
        "\u2881",
        "\u2841",
        "\u2848",
        "\u2850",
        "\u2860"
      ]
    },
    dots11: {
      interval: 100,
      frames: [
        "\u2801",
        "\u2802",
        "\u2804",
        "\u2840",
        "\u2880",
        "\u2820",
        "\u2810",
        "\u2808"
      ]
    },
    dots12: {
      interval: 80,
      frames: [
        "\u2880\u2800",
        "\u2840\u2800",
        "\u2804\u2800",
        "\u2882\u2800",
        "\u2842\u2800",
        "\u2805\u2800",
        "\u2883\u2800",
        "\u2843\u2800",
        "\u280D\u2800",
        "\u288B\u2800",
        "\u284B\u2800",
        "\u280D\u2801",
        "\u288B\u2801",
        "\u284B\u2801",
        "\u280D\u2809",
        "\u280B\u2809",
        "\u280B\u2809",
        "\u2809\u2819",
        "\u2809\u2819",
        "\u2809\u2829",
        "\u2808\u2899",
        "\u2808\u2859",
        "\u2888\u2829",
        "\u2840\u2899",
        "\u2804\u2859",
        "\u2882\u2829",
        "\u2842\u2898",
        "\u2805\u2858",
        "\u2883\u2828",
        "\u2843\u2890",
        "\u280D\u2850",
        "\u288B\u2820",
        "\u284B\u2880",
        "\u280D\u2841",
        "\u288B\u2801",
        "\u284B\u2801",
        "\u280D\u2809",
        "\u280B\u2809",
        "\u280B\u2809",
        "\u2809\u2819",
        "\u2809\u2819",
        "\u2809\u2829",
        "\u2808\u2899",
        "\u2808\u2859",
        "\u2808\u2829",
        "\u2800\u2899",
        "\u2800\u2859",
        "\u2800\u2829",
        "\u2800\u2898",
        "\u2800\u2858",
        "\u2800\u2828",
        "\u2800\u2890",
        "\u2800\u2850",
        "\u2800\u2820",
        "\u2800\u2880",
        "\u2800\u2840"
      ]
    },
    dots13: {
      interval: 80,
      frames: [
        "\u28FC",
        "\u28F9",
        "\u28BB",
        "\u283F",
        "\u285F",
        "\u28CF",
        "\u28E7",
        "\u28F6"
      ]
    },
    dots8Bit: {
      interval: 80,
      frames: [
        "\u2800",
        "\u2801",
        "\u2802",
        "\u2803",
        "\u2804",
        "\u2805",
        "\u2806",
        "\u2807",
        "\u2840",
        "\u2841",
        "\u2842",
        "\u2843",
        "\u2844",
        "\u2845",
        "\u2846",
        "\u2847",
        "\u2808",
        "\u2809",
        "\u280A",
        "\u280B",
        "\u280C",
        "\u280D",
        "\u280E",
        "\u280F",
        "\u2848",
        "\u2849",
        "\u284A",
        "\u284B",
        "\u284C",
        "\u284D",
        "\u284E",
        "\u284F",
        "\u2810",
        "\u2811",
        "\u2812",
        "\u2813",
        "\u2814",
        "\u2815",
        "\u2816",
        "\u2817",
        "\u2850",
        "\u2851",
        "\u2852",
        "\u2853",
        "\u2854",
        "\u2855",
        "\u2856",
        "\u2857",
        "\u2818",
        "\u2819",
        "\u281A",
        "\u281B",
        "\u281C",
        "\u281D",
        "\u281E",
        "\u281F",
        "\u2858",
        "\u2859",
        "\u285A",
        "\u285B",
        "\u285C",
        "\u285D",
        "\u285E",
        "\u285F",
        "\u2820",
        "\u2821",
        "\u2822",
        "\u2823",
        "\u2824",
        "\u2825",
        "\u2826",
        "\u2827",
        "\u2860",
        "\u2861",
        "\u2862",
        "\u2863",
        "\u2864",
        "\u2865",
        "\u2866",
        "\u2867",
        "\u2828",
        "\u2829",
        "\u282A",
        "\u282B",
        "\u282C",
        "\u282D",
        "\u282E",
        "\u282F",
        "\u2868",
        "\u2869",
        "\u286A",
        "\u286B",
        "\u286C",
        "\u286D",
        "\u286E",
        "\u286F",
        "\u2830",
        "\u2831",
        "\u2832",
        "\u2833",
        "\u2834",
        "\u2835",
        "\u2836",
        "\u2837",
        "\u2870",
        "\u2871",
        "\u2872",
        "\u2873",
        "\u2874",
        "\u2875",
        "\u2876",
        "\u2877",
        "\u2838",
        "\u2839",
        "\u283A",
        "\u283B",
        "\u283C",
        "\u283D",
        "\u283E",
        "\u283F",
        "\u2878",
        "\u2879",
        "\u287A",
        "\u287B",
        "\u287C",
        "\u287D",
        "\u287E",
        "\u287F",
        "\u2880",
        "\u2881",
        "\u2882",
        "\u2883",
        "\u2884",
        "\u2885",
        "\u2886",
        "\u2887",
        "\u28C0",
        "\u28C1",
        "\u28C2",
        "\u28C3",
        "\u28C4",
        "\u28C5",
        "\u28C6",
        "\u28C7",
        "\u2888",
        "\u2889",
        "\u288A",
        "\u288B",
        "\u288C",
        "\u288D",
        "\u288E",
        "\u288F",
        "\u28C8",
        "\u28C9",
        "\u28CA",
        "\u28CB",
        "\u28CC",
        "\u28CD",
        "\u28CE",
        "\u28CF",
        "\u2890",
        "\u2891",
        "\u2892",
        "\u2893",
        "\u2894",
        "\u2895",
        "\u2896",
        "\u2897",
        "\u28D0",
        "\u28D1",
        "\u28D2",
        "\u28D3",
        "\u28D4",
        "\u28D5",
        "\u28D6",
        "\u28D7",
        "\u2898",
        "\u2899",
        "\u289A",
        "\u289B",
        "\u289C",
        "\u289D",
        "\u289E",
        "\u289F",
        "\u28D8",
        "\u28D9",
        "\u28DA",
        "\u28DB",
        "\u28DC",
        "\u28DD",
        "\u28DE",
        "\u28DF",
        "\u28A0",
        "\u28A1",
        "\u28A2",
        "\u28A3",
        "\u28A4",
        "\u28A5",
        "\u28A6",
        "\u28A7",
        "\u28E0",
        "\u28E1",
        "\u28E2",
        "\u28E3",
        "\u28E4",
        "\u28E5",
        "\u28E6",
        "\u28E7",
        "\u28A8",
        "\u28A9",
        "\u28AA",
        "\u28AB",
        "\u28AC",
        "\u28AD",
        "\u28AE",
        "\u28AF",
        "\u28E8",
        "\u28E9",
        "\u28EA",
        "\u28EB",
        "\u28EC",
        "\u28ED",
        "\u28EE",
        "\u28EF",
        "\u28B0",
        "\u28B1",
        "\u28B2",
        "\u28B3",
        "\u28B4",
        "\u28B5",
        "\u28B6",
        "\u28B7",
        "\u28F0",
        "\u28F1",
        "\u28F2",
        "\u28F3",
        "\u28F4",
        "\u28F5",
        "\u28F6",
        "\u28F7",
        "\u28B8",
        "\u28B9",
        "\u28BA",
        "\u28BB",
        "\u28BC",
        "\u28BD",
        "\u28BE",
        "\u28BF",
        "\u28F8",
        "\u28F9",
        "\u28FA",
        "\u28FB",
        "\u28FC",
        "\u28FD",
        "\u28FE",
        "\u28FF"
      ]
    },
    sand: {
      interval: 80,
      frames: [
        "\u2801",
        "\u2802",
        "\u2804",
        "\u2840",
        "\u2848",
        "\u2850",
        "\u2860",
        "\u28C0",
        "\u28C1",
        "\u28C2",
        "\u28C4",
        "\u28CC",
        "\u28D4",
        "\u28E4",
        "\u28E5",
        "\u28E6",
        "\u28EE",
        "\u28F6",
        "\u28F7",
        "\u28FF",
        "\u287F",
        "\u283F",
        "\u289F",
        "\u281F",
        "\u285B",
        "\u281B",
        "\u282B",
        "\u288B",
        "\u280B",
        "\u280D",
        "\u2849",
        "\u2809",
        "\u2811",
        "\u2821",
        "\u2881"
      ]
    },
    line: {
      interval: 130,
      frames: [
        "-",
        "\\",
        "|",
        "/"
      ]
    },
    line2: {
      interval: 100,
      frames: [
        "\u2802",
        "-",
        "\u2013",
        "\u2014",
        "\u2013",
        "-"
      ]
    },
    pipe: {
      interval: 100,
      frames: [
        "\u2524",
        "\u2518",
        "\u2534",
        "\u2514",
        "\u251C",
        "\u250C",
        "\u252C",
        "\u2510"
      ]
    },
    simpleDots: {
      interval: 400,
      frames: [
        ".  ",
        ".. ",
        "...",
        "   "
      ]
    },
    simpleDotsScrolling: {
      interval: 200,
      frames: [
        ".  ",
        ".. ",
        "...",
        " ..",
        "  .",
        "   "
      ]
    },
    star: {
      interval: 70,
      frames: [
        "\u2736",
        "\u2738",
        "\u2739",
        "\u273A",
        "\u2739",
        "\u2737"
      ]
    },
    star2: {
      interval: 80,
      frames: [
        "+",
        "x",
        "*"
      ]
    },
    flip: {
      interval: 70,
      frames: [
        "_",
        "_",
        "_",
        "-",
        "`",
        "`",
        "'",
        "\xB4",
        "-",
        "_",
        "_",
        "_"
      ]
    },
    hamburger: {
      interval: 100,
      frames: [
        "\u2631",
        "\u2632",
        "\u2634"
      ]
    },
    growVertical: {
      interval: 120,
      frames: [
        "\u2581",
        "\u2583",
        "\u2584",
        "\u2585",
        "\u2586",
        "\u2587",
        "\u2586",
        "\u2585",
        "\u2584",
        "\u2583"
      ]
    },
    growHorizontal: {
      interval: 120,
      frames: [
        "\u258F",
        "\u258E",
        "\u258D",
        "\u258C",
        "\u258B",
        "\u258A",
        "\u2589",
        "\u258A",
        "\u258B",
        "\u258C",
        "\u258D",
        "\u258E"
      ]
    },
    balloon: {
      interval: 140,
      frames: [
        " ",
        ".",
        "o",
        "O",
        "@",
        "*",
        " "
      ]
    },
    balloon2: {
      interval: 120,
      frames: [
        ".",
        "o",
        "O",
        "\xB0",
        "O",
        "o",
        "."
      ]
    },
    noise: {
      interval: 100,
      frames: [
        "\u2593",
        "\u2592",
        "\u2591"
      ]
    },
    bounce: {
      interval: 120,
      frames: [
        "\u2801",
        "\u2802",
        "\u2804",
        "\u2802"
      ]
    },
    boxBounce: {
      interval: 120,
      frames: [
        "\u2596",
        "\u2598",
        "\u259D",
        "\u2597"
      ]
    },
    boxBounce2: {
      interval: 100,
      frames: [
        "\u258C",
        "\u2580",
        "\u2590",
        "\u2584"
      ]
    },
    triangle: {
      interval: 50,
      frames: [
        "\u25E2",
        "\u25E3",
        "\u25E4",
        "\u25E5"
      ]
    },
    binary: {
      interval: 80,
      frames: [
        "010010",
        "001100",
        "100101",
        "111010",
        "111101",
        "010111",
        "101011",
        "111000",
        "110011",
        "110101"
      ]
    },
    arc: {
      interval: 100,
      frames: [
        "\u25DC",
        "\u25E0",
        "\u25DD",
        "\u25DE",
        "\u25E1",
        "\u25DF"
      ]
    },
    circle: {
      interval: 120,
      frames: [
        "\u25E1",
        "\u2299",
        "\u25E0"
      ]
    },
    squareCorners: {
      interval: 180,
      frames: [
        "\u25F0",
        "\u25F3",
        "\u25F2",
        "\u25F1"
      ]
    },
    circleQuarters: {
      interval: 120,
      frames: [
        "\u25F4",
        "\u25F7",
        "\u25F6",
        "\u25F5"
      ]
    },
    circleHalves: {
      interval: 50,
      frames: [
        "\u25D0",
        "\u25D3",
        "\u25D1",
        "\u25D2"
      ]
    },
    squish: {
      interval: 100,
      frames: [
        "\u256B",
        "\u256A"
      ]
    },
    toggle: {
      interval: 250,
      frames: [
        "\u22B6",
        "\u22B7"
      ]
    },
    toggle2: {
      interval: 80,
      frames: [
        "\u25AB",
        "\u25AA"
      ]
    },
    toggle3: {
      interval: 120,
      frames: [
        "\u25A1",
        "\u25A0"
      ]
    },
    toggle4: {
      interval: 100,
      frames: [
        "\u25A0",
        "\u25A1",
        "\u25AA",
        "\u25AB"
      ]
    },
    toggle5: {
      interval: 100,
      frames: [
        "\u25AE",
        "\u25AF"
      ]
    },
    toggle6: {
      interval: 300,
      frames: [
        "\u101D",
        "\u1040"
      ]
    },
    toggle7: {
      interval: 80,
      frames: [
        "\u29BE",
        "\u29BF"
      ]
    },
    toggle8: {
      interval: 100,
      frames: [
        "\u25CD",
        "\u25CC"
      ]
    },
    toggle9: {
      interval: 100,
      frames: [
        "\u25C9",
        "\u25CE"
      ]
    },
    toggle10: {
      interval: 100,
      frames: [
        "\u3282",
        "\u3280",
        "\u3281"
      ]
    },
    toggle11: {
      interval: 50,
      frames: [
        "\u29C7",
        "\u29C6"
      ]
    },
    toggle12: {
      interval: 120,
      frames: [
        "\u2617",
        "\u2616"
      ]
    },
    toggle13: {
      interval: 80,
      frames: [
        "=",
        "*",
        "-"
      ]
    },
    arrow: {
      interval: 100,
      frames: [
        "\u2190",
        "\u2196",
        "\u2191",
        "\u2197",
        "\u2192",
        "\u2198",
        "\u2193",
        "\u2199"
      ]
    },
    arrow2: {
      interval: 80,
      frames: [
        "\u2B06\uFE0F ",
        "\u2197\uFE0F ",
        "\u27A1\uFE0F ",
        "\u2198\uFE0F ",
        "\u2B07\uFE0F ",
        "\u2199\uFE0F ",
        "\u2B05\uFE0F ",
        "\u2196\uFE0F "
      ]
    },
    arrow3: {
      interval: 120,
      frames: [
        "\u25B9\u25B9\u25B9\u25B9\u25B9",
        "\u25B8\u25B9\u25B9\u25B9\u25B9",
        "\u25B9\u25B8\u25B9\u25B9\u25B9",
        "\u25B9\u25B9\u25B8\u25B9\u25B9",
        "\u25B9\u25B9\u25B9\u25B8\u25B9",
        "\u25B9\u25B9\u25B9\u25B9\u25B8"
      ]
    },
    bouncingBar: {
      interval: 80,
      frames: [
        "[    ]",
        "[=   ]",
        "[==  ]",
        "[=== ]",
        "[====]",
        "[ ===]",
        "[  ==]",
        "[   =]",
        "[    ]",
        "[   =]",
        "[  ==]",
        "[ ===]",
        "[====]",
        "[=== ]",
        "[==  ]",
        "[=   ]"
      ]
    },
    bouncingBall: {
      interval: 80,
      frames: [
        "( \u25CF    )",
        "(  \u25CF   )",
        "(   \u25CF  )",
        "(    \u25CF )",
        "(     \u25CF)",
        "(    \u25CF )",
        "(   \u25CF  )",
        "(  \u25CF   )",
        "( \u25CF    )",
        "(\u25CF     )"
      ]
    },
    smiley: {
      interval: 200,
      frames: [
        "\uD83D\uDE04 ",
        "\uD83D\uDE1D "
      ]
    },
    monkey: {
      interval: 300,
      frames: [
        "\uD83D\uDE48 ",
        "\uD83D\uDE48 ",
        "\uD83D\uDE49 ",
        "\uD83D\uDE4A "
      ]
    },
    hearts: {
      interval: 100,
      frames: [
        "\uD83D\uDC9B ",
        "\uD83D\uDC99 ",
        "\uD83D\uDC9C ",
        "\uD83D\uDC9A ",
        "\u2764\uFE0F "
      ]
    },
    clock: {
      interval: 100,
      frames: [
        "\uD83D\uDD5B ",
        "\uD83D\uDD50 ",
        "\uD83D\uDD51 ",
        "\uD83D\uDD52 ",
        "\uD83D\uDD53 ",
        "\uD83D\uDD54 ",
        "\uD83D\uDD55 ",
        "\uD83D\uDD56 ",
        "\uD83D\uDD57 ",
        "\uD83D\uDD58 ",
        "\uD83D\uDD59 ",
        "\uD83D\uDD5A "
      ]
    },
    earth: {
      interval: 180,
      frames: [
        "\uD83C\uDF0D ",
        "\uD83C\uDF0E ",
        "\uD83C\uDF0F "
      ]
    },
    material: {
      interval: 17,
      frames: [
        "\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
        "\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
        "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
        "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
        "\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
        "\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
        "\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
        "\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581"
      ]
    },
    moon: {
      interval: 80,
      frames: [
        "\uD83C\uDF11 ",
        "\uD83C\uDF12 ",
        "\uD83C\uDF13 ",
        "\uD83C\uDF14 ",
        "\uD83C\uDF15 ",
        "\uD83C\uDF16 ",
        "\uD83C\uDF17 ",
        "\uD83C\uDF18 "
      ]
    },
    runner: {
      interval: 140,
      frames: [
        "\uD83D\uDEB6 ",
        "\uD83C\uDFC3 "
      ]
    },
    pong: {
      interval: 80,
      frames: [
        "\u2590\u2802       \u258C",
        "\u2590\u2808       \u258C",
        "\u2590 \u2802      \u258C",
        "\u2590 \u2820      \u258C",
        "\u2590  \u2840     \u258C",
        "\u2590  \u2820     \u258C",
        "\u2590   \u2802    \u258C",
        "\u2590   \u2808    \u258C",
        "\u2590    \u2802   \u258C",
        "\u2590    \u2820   \u258C",
        "\u2590     \u2840  \u258C",
        "\u2590     \u2820  \u258C",
        "\u2590      \u2802 \u258C",
        "\u2590      \u2808 \u258C",
        "\u2590       \u2802\u258C",
        "\u2590       \u2820\u258C",
        "\u2590       \u2840\u258C",
        "\u2590      \u2820 \u258C",
        "\u2590      \u2802 \u258C",
        "\u2590     \u2808  \u258C",
        "\u2590     \u2802  \u258C",
        "\u2590    \u2820   \u258C",
        "\u2590    \u2840   \u258C",
        "\u2590   \u2820    \u258C",
        "\u2590   \u2802    \u258C",
        "\u2590  \u2808     \u258C",
        "\u2590  \u2802     \u258C",
        "\u2590 \u2820      \u258C",
        "\u2590 \u2840      \u258C",
        "\u2590\u2820       \u258C"
      ]
    },
    shark: {
      interval: 120,
      frames: [
        "\u2590|\\____________\u258C",
        "\u2590_|\\___________\u258C",
        "\u2590__|\\__________\u258C",
        "\u2590___|\\_________\u258C",
        "\u2590____|\\________\u258C",
        "\u2590_____|\\_______\u258C",
        "\u2590______|\\______\u258C",
        "\u2590_______|\\_____\u258C",
        "\u2590________|\\____\u258C",
        "\u2590_________|\\___\u258C",
        "\u2590__________|\\__\u258C",
        "\u2590___________|\\_\u258C",
        "\u2590____________|\\\u258C",
        "\u2590____________/|\u258C",
        "\u2590___________/|_\u258C",
        "\u2590__________/|__\u258C",
        "\u2590_________/|___\u258C",
        "\u2590________/|____\u258C",
        "\u2590_______/|_____\u258C",
        "\u2590______/|______\u258C",
        "\u2590_____/|_______\u258C",
        "\u2590____/|________\u258C",
        "\u2590___/|_________\u258C",
        "\u2590__/|__________\u258C",
        "\u2590_/|___________\u258C",
        "\u2590/|____________\u258C"
      ]
    },
    dqpb: {
      interval: 100,
      frames: [
        "d",
        "q",
        "p",
        "b"
      ]
    },
    weather: {
      interval: 100,
      frames: [
        "\u2600\uFE0F ",
        "\u2600\uFE0F ",
        "\u2600\uFE0F ",
        "\uD83C\uDF24 ",
        "\u26C5\uFE0F ",
        "\uD83C\uDF25 ",
        "\u2601\uFE0F ",
        "\uD83C\uDF27 ",
        "\uD83C\uDF28 ",
        "\uD83C\uDF27 ",
        "\uD83C\uDF28 ",
        "\uD83C\uDF27 ",
        "\uD83C\uDF28 ",
        "\u26C8 ",
        "\uD83C\uDF28 ",
        "\uD83C\uDF27 ",
        "\uD83C\uDF28 ",
        "\u2601\uFE0F ",
        "\uD83C\uDF25 ",
        "\u26C5\uFE0F ",
        "\uD83C\uDF24 ",
        "\u2600\uFE0F ",
        "\u2600\uFE0F "
      ]
    },
    christmas: {
      interval: 400,
      frames: [
        "\uD83C\uDF32",
        "\uD83C\uDF84"
      ]
    },
    grenade: {
      interval: 80,
      frames: [
        "\u060C  ",
        "\u2032  ",
        " \xB4 ",
        " \u203E ",
        "  \u2E0C",
        "  \u2E0A",
        "  |",
        "  \u204E",
        "  \u2055",
        " \u0DF4 ",
        "  \u2053",
        "   ",
        "   ",
        "   "
      ]
    },
    point: {
      interval: 125,
      frames: [
        "\u2219\u2219\u2219",
        "\u25CF\u2219\u2219",
        "\u2219\u25CF\u2219",
        "\u2219\u2219\u25CF",
        "\u2219\u2219\u2219"
      ]
    },
    layer: {
      interval: 150,
      frames: [
        "-",
        "=",
        "\u2261"
      ]
    },
    betaWave: {
      interval: 80,
      frames: [
        "\u03C1\u03B2\u03B2\u03B2\u03B2\u03B2\u03B2",
        "\u03B2\u03C1\u03B2\u03B2\u03B2\u03B2\u03B2",
        "\u03B2\u03B2\u03C1\u03B2\u03B2\u03B2\u03B2",
        "\u03B2\u03B2\u03B2\u03C1\u03B2\u03B2\u03B2",
        "\u03B2\u03B2\u03B2\u03B2\u03C1\u03B2\u03B2",
        "\u03B2\u03B2\u03B2\u03B2\u03B2\u03C1\u03B2",
        "\u03B2\u03B2\u03B2\u03B2\u03B2\u03B2\u03C1"
      ]
    },
    fingerDance: {
      interval: 160,
      frames: [
        "\uD83E\uDD18 ",
        "\uD83E\uDD1F ",
        "\uD83D\uDD96 ",
        "\u270B ",
        "\uD83E\uDD1A ",
        "\uD83D\uDC46 "
      ]
    },
    fistBump: {
      interval: 80,
      frames: [
        "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
        "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
        "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
        "\u3000\uD83E\uDD1C\u3000\u3000\uD83E\uDD1B\u3000 ",
        "\u3000\u3000\uD83E\uDD1C\uD83E\uDD1B\u3000\u3000 ",
        "\u3000\uD83E\uDD1C\u2728\uD83E\uDD1B\u3000\u3000 ",
        "\uD83E\uDD1C\u3000\u2728\u3000\uD83E\uDD1B\u3000 "
      ]
    },
    soccerHeader: {
      interval: 80,
      frames: [
        " \uD83E\uDDD1\u26BD\uFE0F       \uD83E\uDDD1 ",
        "\uD83E\uDDD1  \u26BD\uFE0F      \uD83E\uDDD1 ",
        "\uD83E\uDDD1   \u26BD\uFE0F     \uD83E\uDDD1 ",
        "\uD83E\uDDD1    \u26BD\uFE0F    \uD83E\uDDD1 ",
        "\uD83E\uDDD1     \u26BD\uFE0F   \uD83E\uDDD1 ",
        "\uD83E\uDDD1      \u26BD\uFE0F  \uD83E\uDDD1 ",
        "\uD83E\uDDD1       \u26BD\uFE0F\uD83E\uDDD1  ",
        "\uD83E\uDDD1      \u26BD\uFE0F  \uD83E\uDDD1 ",
        "\uD83E\uDDD1     \u26BD\uFE0F   \uD83E\uDDD1 ",
        "\uD83E\uDDD1    \u26BD\uFE0F    \uD83E\uDDD1 ",
        "\uD83E\uDDD1   \u26BD\uFE0F     \uD83E\uDDD1 ",
        "\uD83E\uDDD1  \u26BD\uFE0F      \uD83E\uDDD1 "
      ]
    },
    mindblown: {
      interval: 160,
      frames: [
        "\uD83D\uDE10 ",
        "\uD83D\uDE10 ",
        "\uD83D\uDE2E ",
        "\uD83D\uDE2E ",
        "\uD83D\uDE26 ",
        "\uD83D\uDE26 ",
        "\uD83D\uDE27 ",
        "\uD83D\uDE27 ",
        "\uD83E\uDD2F ",
        "\uD83D\uDCA5 ",
        "\u2728 ",
        "\u3000 ",
        "\u3000 ",
        "\u3000 "
      ]
    },
    speaker: {
      interval: 160,
      frames: [
        "\uD83D\uDD08 ",
        "\uD83D\uDD09 ",
        "\uD83D\uDD0A ",
        "\uD83D\uDD09 "
      ]
    },
    orangePulse: {
      interval: 100,
      frames: [
        "\uD83D\uDD38 ",
        "\uD83D\uDD36 ",
        "\uD83D\uDFE0 ",
        "\uD83D\uDFE0 ",
        "\uD83D\uDD36 "
      ]
    },
    bluePulse: {
      interval: 100,
      frames: [
        "\uD83D\uDD39 ",
        "\uD83D\uDD37 ",
        "\uD83D\uDD35 ",
        "\uD83D\uDD35 ",
        "\uD83D\uDD37 "
      ]
    },
    orangeBluePulse: {
      interval: 100,
      frames: [
        "\uD83D\uDD38 ",
        "\uD83D\uDD36 ",
        "\uD83D\uDFE0 ",
        "\uD83D\uDFE0 ",
        "\uD83D\uDD36 ",
        "\uD83D\uDD39 ",
        "\uD83D\uDD37 ",
        "\uD83D\uDD35 ",
        "\uD83D\uDD35 ",
        "\uD83D\uDD37 "
      ]
    },
    timeTravel: {
      interval: 100,
      frames: [
        "\uD83D\uDD5B ",
        "\uD83D\uDD5A ",
        "\uD83D\uDD59 ",
        "\uD83D\uDD58 ",
        "\uD83D\uDD57 ",
        "\uD83D\uDD56 ",
        "\uD83D\uDD55 ",
        "\uD83D\uDD54 ",
        "\uD83D\uDD53 ",
        "\uD83D\uDD52 ",
        "\uD83D\uDD51 ",
        "\uD83D\uDD50 "
      ]
    },
    aesthetic: {
      interval: 80,
      frames: [
        "\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1\u25B1",
        "\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1",
        "\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1",
        "\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1",
        "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1",
        "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1",
        "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0",
        "\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1\u25B1"
      ]
    },
    dwarfFortress: {
      interval: 80,
      frames: [
        " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A\u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A\u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A\u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A\u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A\u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A\u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A\u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A\u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "\u263A \u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A\u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A\u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A\u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A\u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A\u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A\u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u263A \u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A\u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A\u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A\u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A\u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A\u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A\u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u263A \u2588\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A\u2593\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A\u2593\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A\u2592\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A\u2592\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A\u2591\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A\u2591\u2588\u2588\xA3\xA3\xA3  ",
        "   \u263A \u2588\u2588\xA3\xA3\xA3  ",
        "    \u263A\u2588\u2588\xA3\xA3\xA3  ",
        "    \u263A\u2588\u2588\xA3\xA3\xA3  ",
        "    \u263A\u2593\u2588\xA3\xA3\xA3  ",
        "    \u263A\u2593\u2588\xA3\xA3\xA3  ",
        "    \u263A\u2592\u2588\xA3\xA3\xA3  ",
        "    \u263A\u2592\u2588\xA3\xA3\xA3  ",
        "    \u263A\u2591\u2588\xA3\xA3\xA3  ",
        "    \u263A\u2591\u2588\xA3\xA3\xA3  ",
        "    \u263A \u2588\xA3\xA3\xA3  ",
        "     \u263A\u2588\xA3\xA3\xA3  ",
        "     \u263A\u2588\xA3\xA3\xA3  ",
        "     \u263A\u2593\xA3\xA3\xA3  ",
        "     \u263A\u2593\xA3\xA3\xA3  ",
        "     \u263A\u2592\xA3\xA3\xA3  ",
        "     \u263A\u2592\xA3\xA3\xA3  ",
        "     \u263A\u2591\xA3\xA3\xA3  ",
        "     \u263A\u2591\xA3\xA3\xA3  ",
        "     \u263A \xA3\xA3\xA3  ",
        "      \u263A\xA3\xA3\xA3  ",
        "      \u263A\xA3\xA3\xA3  ",
        "      \u263A\u2593\xA3\xA3  ",
        "      \u263A\u2593\xA3\xA3  ",
        "      \u263A\u2592\xA3\xA3  ",
        "      \u263A\u2592\xA3\xA3  ",
        "      \u263A\u2591\xA3\xA3  ",
        "      \u263A\u2591\xA3\xA3  ",
        "      \u263A \xA3\xA3  ",
        "       \u263A\xA3\xA3  ",
        "       \u263A\xA3\xA3  ",
        "       \u263A\u2593\xA3  ",
        "       \u263A\u2593\xA3  ",
        "       \u263A\u2592\xA3  ",
        "       \u263A\u2592\xA3  ",
        "       \u263A\u2591\xA3  ",
        "       \u263A\u2591\xA3  ",
        "       \u263A \xA3  ",
        "        \u263A\xA3  ",
        "        \u263A\xA3  ",
        "        \u263A\u2593  ",
        "        \u263A\u2593  ",
        "        \u263A\u2592  ",
        "        \u263A\u2592  ",
        "        \u263A\u2591  ",
        "        \u263A\u2591  ",
        "        \u263A   ",
        "        \u263A  &",
        "        \u263A \u263C&",
        "       \u263A \u263C &",
        "       \u263A\u263C  &",
        "      \u263A\u263C  & ",
        "      \u203C   & ",
        "     \u263A   &  ",
        "    \u203C    &  ",
        "   \u263A    &   ",
        "  \u203C     &   ",
        " \u263A     &    ",
        "\u203C      &    ",
        "      &     ",
        "      &     ",
        "     &   \u2591  ",
        "     &   \u2592  ",
        "    &    \u2593  ",
        "    &    \xA3  ",
        "   &    \u2591\xA3  ",
        "   &    \u2592\xA3  ",
        "  &     \u2593\xA3  ",
        "  &     \xA3\xA3  ",
        " &     \u2591\xA3\xA3  ",
        " &     \u2592\xA3\xA3  ",
        "&      \u2593\xA3\xA3  ",
        "&      \xA3\xA3\xA3  ",
        "      \u2591\xA3\xA3\xA3  ",
        "      \u2592\xA3\xA3\xA3  ",
        "      \u2593\xA3\xA3\xA3  ",
        "      \u2588\xA3\xA3\xA3  ",
        "     \u2591\u2588\xA3\xA3\xA3  ",
        "     \u2592\u2588\xA3\xA3\xA3  ",
        "     \u2593\u2588\xA3\xA3\xA3  ",
        "     \u2588\u2588\xA3\xA3\xA3  ",
        "    \u2591\u2588\u2588\xA3\xA3\xA3  ",
        "    \u2592\u2588\u2588\xA3\xA3\xA3  ",
        "    \u2593\u2588\u2588\xA3\xA3\xA3  ",
        "    \u2588\u2588\u2588\xA3\xA3\xA3  ",
        "   \u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "   \u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "   \u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "   \u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        "  \u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  "
      ]
    }
  };
});

// node_modules/ora/node_modules/cli-spinners/index.js
var require_cli_spinners = __commonJS((exports, module) => {
  var spinners2 = Object.assign({}, require_spinners());
  var spinnersList2 = Object.keys(spinners2);
  Object.defineProperty(spinners2, "random", {
    get() {
      const randomIndex = Math.floor(Math.random() * spinnersList2.length);
      const spinnerName = spinnersList2[randomIndex];
      return spinners2[spinnerName];
    }
  });
  module.exports = spinners2;
});

// node_modules/ora/node_modules/string-width/node_modules/emoji-regex/index.js
var require_emoji_regex2 = __commonJS((exports, module) => {
  module.exports = () => {
    return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC2\uDECE-\uDEDB\uDEE0-\uDEE8]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
  };
});

// node_modules/commander/esm.mjs
var import_ = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help
} = import_.default;

// parseAndDownload.ts
import {mkdir as mkdir5, rm} from "node:fs/promises";
import {writeFileSync, readFileSync} from "node:fs";
import {createWriteStream} from "node:fs";
import {exec as exec2} from "node:child_process";
import {win32 as win322} from "node:path";

// download.ts
import {get} from "node:https";
var download = (url, stream, onData) => new Promise((resolve, reject) => {
  get(url, function(response) {
    var len = parseInt(response.headers["content-length"] ?? "0", 10);
    var cur = 0;
    var total = len;
    response.pipe(stream);
    response.on("data", function(chunk) {
      if (onData) {
        cur += chunk.length;
        onData(cur, total);
      }
    });
    stream.on("finish", () => {
      stream.close();
      resolve();
    });
    stream.on("error", () => reject());
  });
});

// node_modules/@isaacs/fs-minipass/dist/esm/index.js
import EE from "events";
import fs from "fs";

// node_modules/minipass/dist/esm/index.js
import {EventEmitter} from "node:events";
import Stream from "node:stream";
import {StringDecoder} from "node:string_decoder";
var proc = typeof process === "object" && process ? process : {
  stdout: null,
  stderr: null
};
var isStream = (s) => !!s && typeof s === "object" && (s instanceof Minipass || s instanceof Stream || isReadable(s) || isWritable(s));
var isReadable = (s) => !!s && typeof s === "object" && s instanceof EventEmitter && typeof s.pipe === "function" && s.pipe !== Stream.Writable.prototype.pipe;
var isWritable = (s) => !!s && typeof s === "object" && s instanceof EventEmitter && typeof s.write === "function" && typeof s.end === "function";
var EOF = Symbol("EOF");
var MAYBE_EMIT_END = Symbol("maybeEmitEnd");
var EMITTED_END = Symbol("emittedEnd");
var EMITTING_END = Symbol("emittingEnd");
var EMITTED_ERROR = Symbol("emittedError");
var CLOSED = Symbol("closed");
var READ = Symbol("read");
var FLUSH = Symbol("flush");
var FLUSHCHUNK = Symbol("flushChunk");
var ENCODING = Symbol("encoding");
var DECODER = Symbol("decoder");
var FLOWING = Symbol("flowing");
var PAUSED = Symbol("paused");
var RESUME = Symbol("resume");
var BUFFER = Symbol("buffer");
var PIPES = Symbol("pipes");
var BUFFERLENGTH = Symbol("bufferLength");
var BUFFERPUSH = Symbol("bufferPush");
var BUFFERSHIFT = Symbol("bufferShift");
var OBJECTMODE = Symbol("objectMode");
var DESTROYED = Symbol("destroyed");
var ERROR = Symbol("error");
var EMITDATA = Symbol("emitData");
var EMITEND = Symbol("emitEnd");
var EMITEND2 = Symbol("emitEnd2");
var ASYNC = Symbol("async");
var ABORT = Symbol("abort");
var ABORTED = Symbol("aborted");
var SIGNAL = Symbol("signal");
var DATALISTENERS = Symbol("dataListeners");
var DISCARDED = Symbol("discarded");
var defer = (fn) => Promise.resolve().then(fn);
var nodefer = (fn) => fn();
var isEndish = (ev) => ev === "end" || ev === "finish" || ev === "prefinish";
var isArrayBufferLike = (b) => b instanceof ArrayBuffer || !!b && typeof b === "object" && b.constructor && b.constructor.name === "ArrayBuffer" && b.byteLength >= 0;
var isArrayBufferView = (b) => !Buffer.isBuffer(b) && ArrayBuffer.isView(b);

class Pipe {
  src;
  dest;
  opts;
  ondrain;
  constructor(src, dest, opts) {
    this.src = src;
    this.dest = dest;
    this.opts = opts;
    this.ondrain = () => src[RESUME]();
    this.dest.on("drain", this.ondrain);
  }
  unpipe() {
    this.dest.removeListener("drain", this.ondrain);
  }
  proxyErrors(_er) {
  }
  end() {
    this.unpipe();
    if (this.opts.end)
      this.dest.end();
  }
}

class PipeProxyErrors extends Pipe {
  unpipe() {
    this.src.removeListener("error", this.proxyErrors);
    super.unpipe();
  }
  constructor(src, dest, opts) {
    super(src, dest, opts);
    this.proxyErrors = (er) => dest.emit("error", er);
    src.on("error", this.proxyErrors);
  }
}
var isObjectModeOptions = (o) => !!o.objectMode;
var isEncodingOptions = (o) => !o.objectMode && !!o.encoding && o.encoding !== "buffer";

class Minipass extends EventEmitter {
  [FLOWING] = false;
  [PAUSED] = false;
  [PIPES] = [];
  [BUFFER] = [];
  [OBJECTMODE];
  [ENCODING];
  [ASYNC];
  [DECODER];
  [EOF] = false;
  [EMITTED_END] = false;
  [EMITTING_END] = false;
  [CLOSED] = false;
  [EMITTED_ERROR] = null;
  [BUFFERLENGTH] = 0;
  [DESTROYED] = false;
  [SIGNAL];
  [ABORTED] = false;
  [DATALISTENERS] = 0;
  [DISCARDED] = false;
  writable = true;
  readable = true;
  constructor(...args) {
    const options = args[0] || {};
    super();
    if (options.objectMode && typeof options.encoding === "string") {
      throw new TypeError("Encoding and objectMode may not be used together");
    }
    if (isObjectModeOptions(options)) {
      this[OBJECTMODE] = true;
      this[ENCODING] = null;
    } else if (isEncodingOptions(options)) {
      this[ENCODING] = options.encoding;
      this[OBJECTMODE] = false;
    } else {
      this[OBJECTMODE] = false;
      this[ENCODING] = null;
    }
    this[ASYNC] = !!options.async;
    this[DECODER] = this[ENCODING] ? new StringDecoder(this[ENCODING]) : null;
    if (options && options.debugExposeBuffer === true) {
      Object.defineProperty(this, "buffer", { get: () => this[BUFFER] });
    }
    if (options && options.debugExposePipes === true) {
      Object.defineProperty(this, "pipes", { get: () => this[PIPES] });
    }
    const { signal } = options;
    if (signal) {
      this[SIGNAL] = signal;
      if (signal.aborted) {
        this[ABORT]();
      } else {
        signal.addEventListener("abort", () => this[ABORT]());
      }
    }
  }
  get bufferLength() {
    return this[BUFFERLENGTH];
  }
  get encoding() {
    return this[ENCODING];
  }
  set encoding(_enc) {
    throw new Error("Encoding must be set at instantiation time");
  }
  setEncoding(_enc) {
    throw new Error("Encoding must be set at instantiation time");
  }
  get objectMode() {
    return this[OBJECTMODE];
  }
  set objectMode(_om) {
    throw new Error("objectMode must be set at instantiation time");
  }
  get ["async"]() {
    return this[ASYNC];
  }
  set ["async"](a) {
    this[ASYNC] = this[ASYNC] || !!a;
  }
  [ABORT]() {
    this[ABORTED] = true;
    this.emit("abort", this[SIGNAL]?.reason);
    this.destroy(this[SIGNAL]?.reason);
  }
  get aborted() {
    return this[ABORTED];
  }
  set aborted(_) {
  }
  write(chunk, encoding, cb) {
    if (this[ABORTED])
      return false;
    if (this[EOF])
      throw new Error("write after end");
    if (this[DESTROYED]) {
      this.emit("error", Object.assign(new Error("Cannot call write after a stream was destroyed"), { code: "ERR_STREAM_DESTROYED" }));
      return true;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = "utf8";
    }
    if (!encoding)
      encoding = "utf8";
    const fn = this[ASYNC] ? defer : nodefer;
    if (!this[OBJECTMODE] && !Buffer.isBuffer(chunk)) {
      if (isArrayBufferView(chunk)) {
        chunk = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
      } else if (isArrayBufferLike(chunk)) {
        chunk = Buffer.from(chunk);
      } else if (typeof chunk !== "string") {
        throw new Error("Non-contiguous data written to non-objectMode stream");
      }
    }
    if (this[OBJECTMODE]) {
      if (this[FLOWING] && this[BUFFERLENGTH] !== 0)
        this[FLUSH](true);
      if (this[FLOWING])
        this.emit("data", chunk);
      else
        this[BUFFERPUSH](chunk);
      if (this[BUFFERLENGTH] !== 0)
        this.emit("readable");
      if (cb)
        fn(cb);
      return this[FLOWING];
    }
    if (!chunk.length) {
      if (this[BUFFERLENGTH] !== 0)
        this.emit("readable");
      if (cb)
        fn(cb);
      return this[FLOWING];
    }
    if (typeof chunk === "string" && !(encoding === this[ENCODING] && !this[DECODER]?.lastNeed)) {
      chunk = Buffer.from(chunk, encoding);
    }
    if (Buffer.isBuffer(chunk) && this[ENCODING]) {
      chunk = this[DECODER].write(chunk);
    }
    if (this[FLOWING] && this[BUFFERLENGTH] !== 0)
      this[FLUSH](true);
    if (this[FLOWING])
      this.emit("data", chunk);
    else
      this[BUFFERPUSH](chunk);
    if (this[BUFFERLENGTH] !== 0)
      this.emit("readable");
    if (cb)
      fn(cb);
    return this[FLOWING];
  }
  read(n) {
    if (this[DESTROYED])
      return null;
    this[DISCARDED] = false;
    if (this[BUFFERLENGTH] === 0 || n === 0 || n && n > this[BUFFERLENGTH]) {
      this[MAYBE_EMIT_END]();
      return null;
    }
    if (this[OBJECTMODE])
      n = null;
    if (this[BUFFER].length > 1 && !this[OBJECTMODE]) {
      this[BUFFER] = [
        this[ENCODING] ? this[BUFFER].join("") : Buffer.concat(this[BUFFER], this[BUFFERLENGTH])
      ];
    }
    const ret = this[READ](n || null, this[BUFFER][0]);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [READ](n, chunk) {
    if (this[OBJECTMODE])
      this[BUFFERSHIFT]();
    else {
      const c = chunk;
      if (n === c.length || n === null)
        this[BUFFERSHIFT]();
      else if (typeof c === "string") {
        this[BUFFER][0] = c.slice(n);
        chunk = c.slice(0, n);
        this[BUFFERLENGTH] -= n;
      } else {
        this[BUFFER][0] = c.subarray(n);
        chunk = c.subarray(0, n);
        this[BUFFERLENGTH] -= n;
      }
    }
    this.emit("data", chunk);
    if (!this[BUFFER].length && !this[EOF])
      this.emit("drain");
    return chunk;
  }
  end(chunk, encoding, cb) {
    if (typeof chunk === "function") {
      cb = chunk;
      chunk = undefined;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = "utf8";
    }
    if (chunk !== undefined)
      this.write(chunk, encoding);
    if (cb)
      this.once("end", cb);
    this[EOF] = true;
    this.writable = false;
    if (this[FLOWING] || !this[PAUSED])
      this[MAYBE_EMIT_END]();
    return this;
  }
  [RESUME]() {
    if (this[DESTROYED])
      return;
    if (!this[DATALISTENERS] && !this[PIPES].length) {
      this[DISCARDED] = true;
    }
    this[PAUSED] = false;
    this[FLOWING] = true;
    this.emit("resume");
    if (this[BUFFER].length)
      this[FLUSH]();
    else if (this[EOF])
      this[MAYBE_EMIT_END]();
    else
      this.emit("drain");
  }
  resume() {
    return this[RESUME]();
  }
  pause() {
    this[FLOWING] = false;
    this[PAUSED] = true;
    this[DISCARDED] = false;
  }
  get destroyed() {
    return this[DESTROYED];
  }
  get flowing() {
    return this[FLOWING];
  }
  get paused() {
    return this[PAUSED];
  }
  [BUFFERPUSH](chunk) {
    if (this[OBJECTMODE])
      this[BUFFERLENGTH] += 1;
    else
      this[BUFFERLENGTH] += chunk.length;
    this[BUFFER].push(chunk);
  }
  [BUFFERSHIFT]() {
    if (this[OBJECTMODE])
      this[BUFFERLENGTH] -= 1;
    else
      this[BUFFERLENGTH] -= this[BUFFER][0].length;
    return this[BUFFER].shift();
  }
  [FLUSH](noDrain = false) {
    do {
    } while (this[FLUSHCHUNK](this[BUFFERSHIFT]()) && this[BUFFER].length);
    if (!noDrain && !this[BUFFER].length && !this[EOF])
      this.emit("drain");
  }
  [FLUSHCHUNK](chunk) {
    this.emit("data", chunk);
    return this[FLOWING];
  }
  pipe(dest, opts) {
    if (this[DESTROYED])
      return dest;
    this[DISCARDED] = false;
    const ended = this[EMITTED_END];
    opts = opts || {};
    if (dest === proc.stdout || dest === proc.stderr)
      opts.end = false;
    else
      opts.end = opts.end !== false;
    opts.proxyErrors = !!opts.proxyErrors;
    if (ended) {
      if (opts.end)
        dest.end();
    } else {
      this[PIPES].push(!opts.proxyErrors ? new Pipe(this, dest, opts) : new PipeProxyErrors(this, dest, opts));
      if (this[ASYNC])
        defer(() => this[RESUME]());
      else
        this[RESUME]();
    }
    return dest;
  }
  unpipe(dest) {
    const p = this[PIPES].find((p2) => p2.dest === dest);
    if (p) {
      if (this[PIPES].length === 1) {
        if (this[FLOWING] && this[DATALISTENERS] === 0) {
          this[FLOWING] = false;
        }
        this[PIPES] = [];
      } else
        this[PIPES].splice(this[PIPES].indexOf(p), 1);
      p.unpipe();
    }
  }
  addListener(ev, handler) {
    return this.on(ev, handler);
  }
  on(ev, handler) {
    const ret = super.on(ev, handler);
    if (ev === "data") {
      this[DISCARDED] = false;
      this[DATALISTENERS]++;
      if (!this[PIPES].length && !this[FLOWING]) {
        this[RESUME]();
      }
    } else if (ev === "readable" && this[BUFFERLENGTH] !== 0) {
      super.emit("readable");
    } else if (isEndish(ev) && this[EMITTED_END]) {
      super.emit(ev);
      this.removeAllListeners(ev);
    } else if (ev === "error" && this[EMITTED_ERROR]) {
      const h = handler;
      if (this[ASYNC])
        defer(() => h.call(this, this[EMITTED_ERROR]));
      else
        h.call(this, this[EMITTED_ERROR]);
    }
    return ret;
  }
  removeListener(ev, handler) {
    return this.off(ev, handler);
  }
  off(ev, handler) {
    const ret = super.off(ev, handler);
    if (ev === "data") {
      this[DATALISTENERS] = this.listeners("data").length;
      if (this[DATALISTENERS] === 0 && !this[DISCARDED] && !this[PIPES].length) {
        this[FLOWING] = false;
      }
    }
    return ret;
  }
  removeAllListeners(ev) {
    const ret = super.removeAllListeners(ev);
    if (ev === "data" || ev === undefined) {
      this[DATALISTENERS] = 0;
      if (!this[DISCARDED] && !this[PIPES].length) {
        this[FLOWING] = false;
      }
    }
    return ret;
  }
  get emittedEnd() {
    return this[EMITTED_END];
  }
  [MAYBE_EMIT_END]() {
    if (!this[EMITTING_END] && !this[EMITTED_END] && !this[DESTROYED] && this[BUFFER].length === 0 && this[EOF]) {
      this[EMITTING_END] = true;
      this.emit("end");
      this.emit("prefinish");
      this.emit("finish");
      if (this[CLOSED])
        this.emit("close");
      this[EMITTING_END] = false;
    }
  }
  emit(ev, ...args) {
    const data = args[0];
    if (ev !== "error" && ev !== "close" && ev !== DESTROYED && this[DESTROYED]) {
      return false;
    } else if (ev === "data") {
      return !this[OBJECTMODE] && !data ? false : this[ASYNC] ? (defer(() => this[EMITDATA](data)), true) : this[EMITDATA](data);
    } else if (ev === "end") {
      return this[EMITEND]();
    } else if (ev === "close") {
      this[CLOSED] = true;
      if (!this[EMITTED_END] && !this[DESTROYED])
        return false;
      const ret2 = super.emit("close");
      this.removeAllListeners("close");
      return ret2;
    } else if (ev === "error") {
      this[EMITTED_ERROR] = data;
      super.emit(ERROR, data);
      const ret2 = !this[SIGNAL] || this.listeners("error").length ? super.emit("error", data) : false;
      this[MAYBE_EMIT_END]();
      return ret2;
    } else if (ev === "resume") {
      const ret2 = super.emit("resume");
      this[MAYBE_EMIT_END]();
      return ret2;
    } else if (ev === "finish" || ev === "prefinish") {
      const ret2 = super.emit(ev);
      this.removeAllListeners(ev);
      return ret2;
    }
    const ret = super.emit(ev, ...args);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [EMITDATA](data) {
    for (const p of this[PIPES]) {
      if (p.dest.write(data) === false)
        this.pause();
    }
    const ret = this[DISCARDED] ? false : super.emit("data", data);
    this[MAYBE_EMIT_END]();
    return ret;
  }
  [EMITEND]() {
    if (this[EMITTED_END])
      return false;
    this[EMITTED_END] = true;
    this.readable = false;
    return this[ASYNC] ? (defer(() => this[EMITEND2]()), true) : this[EMITEND2]();
  }
  [EMITEND2]() {
    if (this[DECODER]) {
      const data = this[DECODER].end();
      if (data) {
        for (const p of this[PIPES]) {
          p.dest.write(data);
        }
        if (!this[DISCARDED])
          super.emit("data", data);
      }
    }
    for (const p of this[PIPES]) {
      p.end();
    }
    const ret = super.emit("end");
    this.removeAllListeners("end");
    return ret;
  }
  async collect() {
    const buf = Object.assign([], {
      dataLength: 0
    });
    if (!this[OBJECTMODE])
      buf.dataLength = 0;
    const p = this.promise();
    this.on("data", (c) => {
      buf.push(c);
      if (!this[OBJECTMODE])
        buf.dataLength += c.length;
    });
    await p;
    return buf;
  }
  async concat() {
    if (this[OBJECTMODE]) {
      throw new Error("cannot concat in objectMode");
    }
    const buf = await this.collect();
    return this[ENCODING] ? buf.join("") : Buffer.concat(buf, buf.dataLength);
  }
  async promise() {
    return new Promise((resolve, reject) => {
      this.on(DESTROYED, () => reject(new Error("stream destroyed")));
      this.on("error", (er) => reject(er));
      this.on("end", () => resolve());
    });
  }
  [Symbol.asyncIterator]() {
    this[DISCARDED] = false;
    let stopped = false;
    const stop = async () => {
      this.pause();
      stopped = true;
      return { value: undefined, done: true };
    };
    const next = () => {
      if (stopped)
        return stop();
      const res = this.read();
      if (res !== null)
        return Promise.resolve({ done: false, value: res });
      if (this[EOF])
        return stop();
      let resolve;
      let reject;
      const onerr = (er) => {
        this.off("data", ondata);
        this.off("end", onend);
        this.off(DESTROYED, ondestroy);
        stop();
        reject(er);
      };
      const ondata = (value) => {
        this.off("error", onerr);
        this.off("end", onend);
        this.off(DESTROYED, ondestroy);
        this.pause();
        resolve({ value, done: !!this[EOF] });
      };
      const onend = () => {
        this.off("error", onerr);
        this.off("data", ondata);
        this.off(DESTROYED, ondestroy);
        stop();
        resolve({ done: true, value: undefined });
      };
      const ondestroy = () => onerr(new Error("stream destroyed"));
      return new Promise((res2, rej) => {
        reject = rej;
        resolve = res2;
        this.once(DESTROYED, ondestroy);
        this.once("error", onerr);
        this.once("end", onend);
        this.once("data", ondata);
      });
    };
    return {
      next,
      throw: stop,
      return: stop,
      [Symbol.asyncIterator]() {
        return this;
      }
    };
  }
  [Symbol.iterator]() {
    this[DISCARDED] = false;
    let stopped = false;
    const stop = () => {
      this.pause();
      this.off(ERROR, stop);
      this.off(DESTROYED, stop);
      this.off("end", stop);
      stopped = true;
      return { done: true, value: undefined };
    };
    const next = () => {
      if (stopped)
        return stop();
      const value = this.read();
      return value === null ? stop() : { done: false, value };
    };
    this.once("end", stop);
    this.once(ERROR, stop);
    this.once(DESTROYED, stop);
    return {
      next,
      throw: stop,
      return: stop,
      [Symbol.iterator]() {
        return this;
      }
    };
  }
  destroy(er) {
    if (this[DESTROYED]) {
      if (er)
        this.emit("error", er);
      else
        this.emit(DESTROYED);
      return this;
    }
    this[DESTROYED] = true;
    this[DISCARDED] = true;
    this[BUFFER].length = 0;
    this[BUFFERLENGTH] = 0;
    const wc = this;
    if (typeof wc.close === "function" && !this[CLOSED])
      wc.close();
    if (er)
      this.emit("error", er);
    else
      this.emit(DESTROYED);
    return this;
  }
  static get isStream() {
    return isStream;
  }
}

// node_modules/@isaacs/fs-minipass/dist/esm/index.js
var writev = fs.writev;
var _autoClose = Symbol("_autoClose");
var _close = Symbol("_close");
var _ended = Symbol("_ended");
var _fd = Symbol("_fd");
var _finished = Symbol("_finished");
var _flags = Symbol("_flags");
var _flush = Symbol("_flush");
var _handleChunk = Symbol("_handleChunk");
var _makeBuf = Symbol("_makeBuf");
var _mode = Symbol("_mode");
var _needDrain = Symbol("_needDrain");
var _onerror = Symbol("_onerror");
var _onopen = Symbol("_onopen");
var _onread = Symbol("_onread");
var _onwrite = Symbol("_onwrite");
var _open = Symbol("_open");
var _path = Symbol("_path");
var _pos = Symbol("_pos");
var _queue = Symbol("_queue");
var _read = Symbol("_read");
var _readSize = Symbol("_readSize");
var _reading = Symbol("_reading");
var _remain = Symbol("_remain");
var _size = Symbol("_size");
var _write = Symbol("_write");
var _writing = Symbol("_writing");
var _defaultFlag = Symbol("_defaultFlag");
var _errored = Symbol("_errored");

class ReadStream extends Minipass {
  [_errored] = false;
  [_fd];
  [_path];
  [_readSize];
  [_reading] = false;
  [_size];
  [_remain];
  [_autoClose];
  constructor(path, opt) {
    opt = opt || {};
    super(opt);
    this.readable = true;
    this.writable = false;
    if (typeof path !== "string") {
      throw new TypeError("path must be a string");
    }
    this[_errored] = false;
    this[_fd] = typeof opt.fd === "number" ? opt.fd : undefined;
    this[_path] = path;
    this[_readSize] = opt.readSize || 16 * 1024 * 1024;
    this[_reading] = false;
    this[_size] = typeof opt.size === "number" ? opt.size : Infinity;
    this[_remain] = this[_size];
    this[_autoClose] = typeof opt.autoClose === "boolean" ? opt.autoClose : true;
    if (typeof this[_fd] === "number") {
      this[_read]();
    } else {
      this[_open]();
    }
  }
  get fd() {
    return this[_fd];
  }
  get path() {
    return this[_path];
  }
  write() {
    throw new TypeError("this is a readable stream");
  }
  end() {
    throw new TypeError("this is a readable stream");
  }
  [_open]() {
    fs.open(this[_path], "r", (er, fd) => this[_onopen](er, fd));
  }
  [_onopen](er, fd) {
    if (er) {
      this[_onerror](er);
    } else {
      this[_fd] = fd;
      this.emit("open", fd);
      this[_read]();
    }
  }
  [_makeBuf]() {
    return Buffer.allocUnsafe(Math.min(this[_readSize], this[_remain]));
  }
  [_read]() {
    if (!this[_reading]) {
      this[_reading] = true;
      const buf = this[_makeBuf]();
      if (buf.length === 0) {
        return process.nextTick(() => this[_onread](null, 0, buf));
      }
      fs.read(this[_fd], buf, 0, buf.length, null, (er, br, b) => this[_onread](er, br, b));
    }
  }
  [_onread](er, br, buf) {
    this[_reading] = false;
    if (er) {
      this[_onerror](er);
    } else if (this[_handleChunk](br, buf)) {
      this[_read]();
    }
  }
  [_close]() {
    if (this[_autoClose] && typeof this[_fd] === "number") {
      const fd = this[_fd];
      this[_fd] = undefined;
      fs.close(fd, (er) => er ? this.emit("error", er) : this.emit("close"));
    }
  }
  [_onerror](er) {
    this[_reading] = true;
    this[_close]();
    this.emit("error", er);
  }
  [_handleChunk](br, buf) {
    let ret = false;
    this[_remain] -= br;
    if (br > 0) {
      ret = super.write(br < buf.length ? buf.subarray(0, br) : buf);
    }
    if (br === 0 || this[_remain] <= 0) {
      ret = false;
      this[_close]();
      super.end();
    }
    return ret;
  }
  emit(ev, ...args) {
    switch (ev) {
      case "prefinish":
      case "finish":
        return false;
      case "drain":
        if (typeof this[_fd] === "number") {
          this[_read]();
        }
        return false;
      case "error":
        if (this[_errored]) {
          return false;
        }
        this[_errored] = true;
        return super.emit(ev, ...args);
      default:
        return super.emit(ev, ...args);
    }
  }
}

class ReadStreamSync extends ReadStream {
  [_open]() {
    let threw = true;
    try {
      this[_onopen](null, fs.openSync(this[_path], "r"));
      threw = false;
    } finally {
      if (threw) {
        this[_close]();
      }
    }
  }
  [_read]() {
    let threw = true;
    try {
      if (!this[_reading]) {
        this[_reading] = true;
        do {
          const buf = this[_makeBuf]();
          const br = buf.length === 0 ? 0 : fs.readSync(this[_fd], buf, 0, buf.length, null);
          if (!this[_handleChunk](br, buf)) {
            break;
          }
        } while (true);
        this[_reading] = false;
      }
      threw = false;
    } finally {
      if (threw) {
        this[_close]();
      }
    }
  }
  [_close]() {
    if (this[_autoClose] && typeof this[_fd] === "number") {
      const fd = this[_fd];
      this[_fd] = undefined;
      fs.closeSync(fd);
      this.emit("close");
    }
  }
}

class WriteStream extends EE {
  readable = false;
  writable = true;
  [_errored] = false;
  [_writing] = false;
  [_ended] = false;
  [_queue] = [];
  [_needDrain] = false;
  [_path];
  [_mode];
  [_autoClose];
  [_fd];
  [_defaultFlag];
  [_flags];
  [_finished] = false;
  [_pos];
  constructor(path, opt) {
    opt = opt || {};
    super(opt);
    this[_path] = path;
    this[_fd] = typeof opt.fd === "number" ? opt.fd : undefined;
    this[_mode] = opt.mode === undefined ? 438 : opt.mode;
    this[_pos] = typeof opt.start === "number" ? opt.start : undefined;
    this[_autoClose] = typeof opt.autoClose === "boolean" ? opt.autoClose : true;
    const defaultFlag = this[_pos] !== undefined ? "r+" : "w";
    this[_defaultFlag] = opt.flags === undefined;
    this[_flags] = opt.flags === undefined ? defaultFlag : opt.flags;
    if (this[_fd] === undefined) {
      this[_open]();
    }
  }
  emit(ev, ...args) {
    if (ev === "error") {
      if (this[_errored]) {
        return false;
      }
      this[_errored] = true;
    }
    return super.emit(ev, ...args);
  }
  get fd() {
    return this[_fd];
  }
  get path() {
    return this[_path];
  }
  [_onerror](er) {
    this[_close]();
    this[_writing] = true;
    this.emit("error", er);
  }
  [_open]() {
    fs.open(this[_path], this[_flags], this[_mode], (er, fd) => this[_onopen](er, fd));
  }
  [_onopen](er, fd) {
    if (this[_defaultFlag] && this[_flags] === "r+" && er && er.code === "ENOENT") {
      this[_flags] = "w";
      this[_open]();
    } else if (er) {
      this[_onerror](er);
    } else {
      this[_fd] = fd;
      this.emit("open", fd);
      if (!this[_writing]) {
        this[_flush]();
      }
    }
  }
  end(buf, enc) {
    if (buf) {
      this.write(buf, enc);
    }
    this[_ended] = true;
    if (!this[_writing] && !this[_queue].length && typeof this[_fd] === "number") {
      this[_onwrite](null, 0);
    }
    return this;
  }
  write(buf, enc) {
    if (typeof buf === "string") {
      buf = Buffer.from(buf, enc);
    }
    if (this[_ended]) {
      this.emit("error", new Error("write() after end()"));
      return false;
    }
    if (this[_fd] === undefined || this[_writing] || this[_queue].length) {
      this[_queue].push(buf);
      this[_needDrain] = true;
      return false;
    }
    this[_writing] = true;
    this[_write](buf);
    return true;
  }
  [_write](buf) {
    fs.write(this[_fd], buf, 0, buf.length, this[_pos], (er, bw) => this[_onwrite](er, bw));
  }
  [_onwrite](er, bw) {
    if (er) {
      this[_onerror](er);
    } else {
      if (this[_pos] !== undefined && typeof bw === "number") {
        this[_pos] += bw;
      }
      if (this[_queue].length) {
        this[_flush]();
      } else {
        this[_writing] = false;
        if (this[_ended] && !this[_finished]) {
          this[_finished] = true;
          this[_close]();
          this.emit("finish");
        } else if (this[_needDrain]) {
          this[_needDrain] = false;
          this.emit("drain");
        }
      }
    }
  }
  [_flush]() {
    if (this[_queue].length === 0) {
      if (this[_ended]) {
        this[_onwrite](null, 0);
      }
    } else if (this[_queue].length === 1) {
      this[_write](this[_queue].pop());
    } else {
      const iovec = this[_queue];
      this[_queue] = [];
      writev(this[_fd], iovec, this[_pos], (er, bw) => this[_onwrite](er, bw));
    }
  }
  [_close]() {
    if (this[_autoClose] && typeof this[_fd] === "number") {
      const fd = this[_fd];
      this[_fd] = undefined;
      fs.close(fd, (er) => er ? this.emit("error", er) : this.emit("close"));
    }
  }
}

class WriteStreamSync extends WriteStream {
  [_open]() {
    let fd;
    if (this[_defaultFlag] && this[_flags] === "r+") {
      try {
        fd = fs.openSync(this[_path], this[_flags], this[_mode]);
      } catch (er) {
        if (er?.code === "ENOENT") {
          this[_flags] = "w";
          return this[_open]();
        } else {
          throw er;
        }
      }
    } else {
      fd = fs.openSync(this[_path], this[_flags], this[_mode]);
    }
    this[_onopen](null, fd);
  }
  [_close]() {
    if (this[_autoClose] && typeof this[_fd] === "number") {
      const fd = this[_fd];
      this[_fd] = undefined;
      fs.closeSync(fd);
      this.emit("close");
    }
  }
  [_write](buf) {
    let threw = true;
    try {
      this[_onwrite](null, fs.writeSync(this[_fd], buf, 0, buf.length, this[_pos]));
      threw = false;
    } finally {
      if (threw) {
        try {
          this[_close]();
        } catch {
        }
      }
    }
  }
}

// node_modules/tar/dist/esm/create.js
import path3 from "node:path";

// node_modules/tar/dist/esm/list.js
import fs2 from "node:fs";
import {dirname, parse as parse2} from "path";

// node_modules/tar/dist/esm/options.js
var argmap = new Map([
  ["C", "cwd"],
  ["f", "file"],
  ["z", "gzip"],
  ["P", "preservePaths"],
  ["U", "unlink"],
  ["strip-components", "strip"],
  ["stripComponents", "strip"],
  ["keep-newer", "newer"],
  ["keepNewer", "newer"],
  ["keep-newer-files", "newer"],
  ["keepNewerFiles", "newer"],
  ["k", "keep"],
  ["keep-existing", "keep"],
  ["keepExisting", "keep"],
  ["m", "noMtime"],
  ["no-mtime", "noMtime"],
  ["p", "preserveOwner"],
  ["L", "follow"],
  ["h", "follow"],
  ["onentry", "onReadEntry"]
]);
var isSyncFile = (o) => !!o.sync && !!o.file;
var isAsyncFile = (o) => !o.sync && !!o.file;
var isSyncNoFile = (o) => !!o.sync && !o.file;
var isAsyncNoFile = (o) => !o.sync && !o.file;
var isFile = (o) => !!o.file;
var dealiasKey = (k) => {
  const d = argmap.get(k);
  if (d)
    return d;
  return k;
};
var dealias = (opt = {}) => {
  if (!opt)
    return {};
  const result = {};
  for (const [key, v] of Object.entries(opt)) {
    const k = dealiasKey(key);
    result[k] = v;
  }
  if (result.chmod === undefined && result.noChmod === false) {
    result.chmod = true;
  }
  delete result.noChmod;
  return result;
};

// node_modules/tar/dist/esm/make-command.js
var makeCommand = (syncFile, asyncFile, syncNoFile, asyncNoFile, validate) => {
  return Object.assign((opt_ = [], entries, cb) => {
    if (Array.isArray(opt_)) {
      entries = opt_;
      opt_ = {};
    }
    if (typeof entries === "function") {
      cb = entries;
      entries = undefined;
    }
    if (!entries) {
      entries = [];
    } else {
      entries = Array.from(entries);
    }
    const opt = dealias(opt_);
    validate?.(opt, entries);
    if (isSyncFile(opt)) {
      if (typeof cb === "function") {
        throw new TypeError("callback not supported for sync tar functions");
      }
      return syncFile(opt, entries);
    } else if (isAsyncFile(opt)) {
      const p = asyncFile(opt, entries);
      const c = cb ? cb : undefined;
      return c ? p.then(() => c(), c) : p;
    } else if (isSyncNoFile(opt)) {
      if (typeof cb === "function") {
        throw new TypeError("callback not supported for sync tar functions");
      }
      return syncNoFile(opt, entries);
    } else if (isAsyncNoFile(opt)) {
      if (typeof cb === "function") {
        throw new TypeError("callback only supported with file option");
      }
      return asyncNoFile(opt, entries);
    } else {
      throw new Error("impossible options??");
    }
  }, {
    syncFile,
    asyncFile,
    syncNoFile,
    asyncNoFile,
    validate
  });
};

// node_modules/tar/dist/esm/parse.js
import {EventEmitter as EE2} from "events";

// node_modules/minizlib/dist/esm/index.js
import assert from "assert";
import {Buffer as Buffer2} from "buffer";
import realZlib2 from "zlib";

// node_modules/minizlib/dist/esm/constants.js
import realZlib from "zlib";
var realZlibConstants = realZlib.constants || { ZLIB_VERNUM: 4736 };
var constants = Object.freeze(Object.assign(Object.create(null), {
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_VERSION_ERROR: -6,
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  DEFLATE: 1,
  INFLATE: 2,
  GZIP: 3,
  GUNZIP: 4,
  DEFLATERAW: 5,
  INFLATERAW: 6,
  UNZIP: 7,
  BROTLI_DECODE: 8,
  BROTLI_ENCODE: 9,
  Z_MIN_WINDOWBITS: 8,
  Z_MAX_WINDOWBITS: 15,
  Z_DEFAULT_WINDOWBITS: 15,
  Z_MIN_CHUNK: 64,
  Z_MAX_CHUNK: Infinity,
  Z_DEFAULT_CHUNK: 16384,
  Z_MIN_MEMLEVEL: 1,
  Z_MAX_MEMLEVEL: 9,
  Z_DEFAULT_MEMLEVEL: 8,
  Z_MIN_LEVEL: -1,
  Z_MAX_LEVEL: 9,
  Z_DEFAULT_LEVEL: -1,
  BROTLI_OPERATION_PROCESS: 0,
  BROTLI_OPERATION_FLUSH: 1,
  BROTLI_OPERATION_FINISH: 2,
  BROTLI_OPERATION_EMIT_METADATA: 3,
  BROTLI_MODE_GENERIC: 0,
  BROTLI_MODE_TEXT: 1,
  BROTLI_MODE_FONT: 2,
  BROTLI_DEFAULT_MODE: 0,
  BROTLI_MIN_QUALITY: 0,
  BROTLI_MAX_QUALITY: 11,
  BROTLI_DEFAULT_QUALITY: 11,
  BROTLI_MIN_WINDOW_BITS: 10,
  BROTLI_MAX_WINDOW_BITS: 24,
  BROTLI_LARGE_MAX_WINDOW_BITS: 30,
  BROTLI_DEFAULT_WINDOW: 22,
  BROTLI_MIN_INPUT_BLOCK_BITS: 16,
  BROTLI_MAX_INPUT_BLOCK_BITS: 24,
  BROTLI_PARAM_MODE: 0,
  BROTLI_PARAM_QUALITY: 1,
  BROTLI_PARAM_LGWIN: 2,
  BROTLI_PARAM_LGBLOCK: 3,
  BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: 4,
  BROTLI_PARAM_SIZE_HINT: 5,
  BROTLI_PARAM_LARGE_WINDOW: 6,
  BROTLI_PARAM_NPOSTFIX: 7,
  BROTLI_PARAM_NDIRECT: 8,
  BROTLI_DECODER_RESULT_ERROR: 0,
  BROTLI_DECODER_RESULT_SUCCESS: 1,
  BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: 2,
  BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: 3,
  BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: 0,
  BROTLI_DECODER_PARAM_LARGE_WINDOW: 1,
  BROTLI_DECODER_NO_ERROR: 0,
  BROTLI_DECODER_SUCCESS: 1,
  BROTLI_DECODER_NEEDS_MORE_INPUT: 2,
  BROTLI_DECODER_NEEDS_MORE_OUTPUT: 3,
  BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE: -1,
  BROTLI_DECODER_ERROR_FORMAT_RESERVED: -2,
  BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE: -3,
  BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET: -4,
  BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME: -5,
  BROTLI_DECODER_ERROR_FORMAT_CL_SPACE: -6,
  BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE: -7,
  BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT: -8,
  BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1: -9,
  BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2: -10,
  BROTLI_DECODER_ERROR_FORMAT_TRANSFORM: -11,
  BROTLI_DECODER_ERROR_FORMAT_DICTIONARY: -12,
  BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS: -13,
  BROTLI_DECODER_ERROR_FORMAT_PADDING_1: -14,
  BROTLI_DECODER_ERROR_FORMAT_PADDING_2: -15,
  BROTLI_DECODER_ERROR_FORMAT_DISTANCE: -16,
  BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET: -19,
  BROTLI_DECODER_ERROR_INVALID_ARGUMENTS: -20,
  BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES: -21,
  BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS: -22,
  BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP: -25,
  BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1: -26,
  BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2: -27,
  BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES: -30,
  BROTLI_DECODER_ERROR_UNREACHABLE: -31
}, realZlibConstants));

// node_modules/minizlib/dist/esm/index.js
var OriginalBufferConcat = Buffer2.concat;
var _superWrite = Symbol("_superWrite");

class ZlibError extends Error {
  code;
  errno;
  constructor(err) {
    super("zlib: " + err.message);
    this.code = err.code;
    this.errno = err.errno;
    if (!this.code)
      this.code = "ZLIB_ERROR";
    this.message = "zlib: " + err.message;
    Error.captureStackTrace(this, this.constructor);
  }
  get name() {
    return "ZlibError";
  }
}
var _flushFlag = Symbol("flushFlag");

class ZlibBase extends Minipass {
  #sawError = false;
  #ended = false;
  #flushFlag;
  #finishFlushFlag;
  #fullFlushFlag;
  #handle;
  #onError;
  get sawError() {
    return this.#sawError;
  }
  get handle() {
    return this.#handle;
  }
  get flushFlag() {
    return this.#flushFlag;
  }
  constructor(opts, mode) {
    if (!opts || typeof opts !== "object")
      throw new TypeError("invalid options for ZlibBase constructor");
    super(opts);
    this.#flushFlag = opts.flush ?? 0;
    this.#finishFlushFlag = opts.finishFlush ?? 0;
    this.#fullFlushFlag = opts.fullFlushFlag ?? 0;
    try {
      this.#handle = new realZlib2[mode](opts);
    } catch (er) {
      throw new ZlibError(er);
    }
    this.#onError = (err) => {
      if (this.#sawError)
        return;
      this.#sawError = true;
      this.close();
      this.emit("error", err);
    };
    this.#handle?.on("error", (er) => this.#onError(new ZlibError(er)));
    this.once("end", () => this.close);
  }
  close() {
    if (this.#handle) {
      this.#handle.close();
      this.#handle = undefined;
      this.emit("close");
    }
  }
  reset() {
    if (!this.#sawError) {
      assert(this.#handle, "zlib binding closed");
      return this.#handle.reset?.();
    }
  }
  flush(flushFlag) {
    if (this.ended)
      return;
    if (typeof flushFlag !== "number")
      flushFlag = this.#fullFlushFlag;
    this.write(Object.assign(Buffer2.alloc(0), { [_flushFlag]: flushFlag }));
  }
  end(chunk, encoding, cb) {
    if (typeof chunk === "function") {
      cb = chunk;
      encoding = undefined;
      chunk = undefined;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = undefined;
    }
    if (chunk) {
      if (encoding)
        this.write(chunk, encoding);
      else
        this.write(chunk);
    }
    this.flush(this.#finishFlushFlag);
    this.#ended = true;
    return super.end(cb);
  }
  get ended() {
    return this.#ended;
  }
  [_superWrite](data) {
    return super.write(data);
  }
  write(chunk, encoding, cb) {
    if (typeof encoding === "function")
      cb = encoding, encoding = "utf8";
    if (typeof chunk === "string")
      chunk = Buffer2.from(chunk, encoding);
    if (this.#sawError)
      return;
    assert(this.#handle, "zlib binding closed");
    const nativeHandle = this.#handle._handle;
    const originalNativeClose = nativeHandle.close;
    nativeHandle.close = () => {
    };
    const originalClose = this.#handle.close;
    this.#handle.close = () => {
    };
    Buffer2.concat = (args) => args;
    let result = undefined;
    try {
      const flushFlag = typeof chunk[_flushFlag] === "number" ? chunk[_flushFlag] : this.#flushFlag;
      result = this.#handle._processChunk(chunk, flushFlag);
      Buffer2.concat = OriginalBufferConcat;
    } catch (err) {
      Buffer2.concat = OriginalBufferConcat;
      this.#onError(new ZlibError(err));
    } finally {
      if (this.#handle) {
        this.#handle._handle = nativeHandle;
        nativeHandle.close = originalNativeClose;
        this.#handle.close = originalClose;
        this.#handle.removeAllListeners("error");
      }
    }
    if (this.#handle)
      this.#handle.on("error", (er) => this.#onError(new ZlibError(er)));
    let writeReturn;
    if (result) {
      if (Array.isArray(result) && result.length > 0) {
        const r = result[0];
        writeReturn = this[_superWrite](Buffer2.from(r));
        for (let i = 1;i < result.length; i++) {
          writeReturn = this[_superWrite](result[i]);
        }
      } else {
        writeReturn = this[_superWrite](Buffer2.from(result));
      }
    }
    if (cb)
      cb();
    return writeReturn;
  }
}

class Zlib extends ZlibBase {
  #level;
  #strategy;
  constructor(opts, mode) {
    opts = opts || {};
    opts.flush = opts.flush || constants.Z_NO_FLUSH;
    opts.finishFlush = opts.finishFlush || constants.Z_FINISH;
    opts.fullFlushFlag = constants.Z_FULL_FLUSH;
    super(opts, mode);
    this.#level = opts.level;
    this.#strategy = opts.strategy;
  }
  params(level, strategy) {
    if (this.sawError)
      return;
    if (!this.handle)
      throw new Error("cannot switch params when binding is closed");
    if (!this.handle.params)
      throw new Error("not supported in this implementation");
    if (this.#level !== level || this.#strategy !== strategy) {
      this.flush(constants.Z_SYNC_FLUSH);
      assert(this.handle, "zlib binding closed");
      const origFlush = this.handle.flush;
      this.handle.flush = (flushFlag, cb) => {
        if (typeof flushFlag === "function") {
          cb = flushFlag;
          flushFlag = this.flushFlag;
        }
        this.flush(flushFlag);
        cb?.();
      };
      try {
        this.handle.params(level, strategy);
      } finally {
        this.handle.flush = origFlush;
      }
      if (this.handle) {
        this.#level = level;
        this.#strategy = strategy;
      }
    }
  }
}
class Gzip extends Zlib {
  #portable;
  constructor(opts) {
    super(opts, "Gzip");
    this.#portable = opts && !!opts.portable;
  }
  [_superWrite](data) {
    if (!this.#portable)
      return super[_superWrite](data);
    this.#portable = false;
    data[9] = 255;
    return super[_superWrite](data);
  }
}
class Unzip extends Zlib {
  constructor(opts) {
    super(opts, "Unzip");
  }
}

class Brotli extends ZlibBase {
  constructor(opts, mode) {
    opts = opts || {};
    opts.flush = opts.flush || constants.BROTLI_OPERATION_PROCESS;
    opts.finishFlush = opts.finishFlush || constants.BROTLI_OPERATION_FINISH;
    opts.fullFlushFlag = constants.BROTLI_OPERATION_FLUSH;
    super(opts, mode);
  }
}

class BrotliCompress extends Brotli {
  constructor(opts) {
    super(opts, "BrotliCompress");
  }
}

class BrotliDecompress extends Brotli {
  constructor(opts) {
    super(opts, "BrotliDecompress");
  }
}

// node_modules/yallist/dist/esm/index.js
var insertAfter = function(self, node, value) {
  const prev = node;
  const next = node ? node.next : self.head;
  const inserted = new Node(value, prev, next, self);
  if (inserted.next === undefined) {
    self.tail = inserted;
  }
  if (inserted.prev === undefined) {
    self.head = inserted;
  }
  self.length++;
  return inserted;
};
var push = function(self, item) {
  self.tail = new Node(item, self.tail, undefined, self);
  if (!self.head) {
    self.head = self.tail;
  }
  self.length++;
};
var unshift = function(self, item) {
  self.head = new Node(item, undefined, self.head, self);
  if (!self.tail) {
    self.tail = self.head;
  }
  self.length++;
};

class Yallist {
  tail;
  head;
  length = 0;
  static create(list = []) {
    return new Yallist(list);
  }
  constructor(list = []) {
    for (const item of list) {
      this.push(item);
    }
  }
  *[Symbol.iterator]() {
    for (let walker = this.head;walker; walker = walker.next) {
      yield walker.value;
    }
  }
  removeNode(node) {
    if (node.list !== this) {
      throw new Error("removing node which does not belong to this list");
    }
    const next = node.next;
    const prev = node.prev;
    if (next) {
      next.prev = prev;
    }
    if (prev) {
      prev.next = next;
    }
    if (node === this.head) {
      this.head = next;
    }
    if (node === this.tail) {
      this.tail = prev;
    }
    this.length--;
    node.next = undefined;
    node.prev = undefined;
    node.list = undefined;
    return next;
  }
  unshiftNode(node) {
    if (node === this.head) {
      return;
    }
    if (node.list) {
      node.list.removeNode(node);
    }
    const head = this.head;
    node.list = this;
    node.next = head;
    if (head) {
      head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
    this.length++;
  }
  pushNode(node) {
    if (node === this.tail) {
      return;
    }
    if (node.list) {
      node.list.removeNode(node);
    }
    const tail = this.tail;
    node.list = this;
    node.prev = tail;
    if (tail) {
      tail.next = node;
    }
    this.tail = node;
    if (!this.head) {
      this.head = node;
    }
    this.length++;
  }
  push(...args) {
    for (let i = 0, l = args.length;i < l; i++) {
      push(this, args[i]);
    }
    return this.length;
  }
  unshift(...args) {
    for (var i = 0, l = args.length;i < l; i++) {
      unshift(this, args[i]);
    }
    return this.length;
  }
  pop() {
    if (!this.tail) {
      return;
    }
    const res = this.tail.value;
    const t = this.tail;
    this.tail = this.tail.prev;
    if (this.tail) {
      this.tail.next = undefined;
    } else {
      this.head = undefined;
    }
    t.list = undefined;
    this.length--;
    return res;
  }
  shift() {
    if (!this.head) {
      return;
    }
    const res = this.head.value;
    const h = this.head;
    this.head = this.head.next;
    if (this.head) {
      this.head.prev = undefined;
    } else {
      this.tail = undefined;
    }
    h.list = undefined;
    this.length--;
    return res;
  }
  forEach(fn, thisp) {
    thisp = thisp || this;
    for (let walker = this.head, i = 0;walker; i++) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.next;
    }
  }
  forEachReverse(fn, thisp) {
    thisp = thisp || this;
    for (let walker = this.tail, i = this.length - 1;walker; i--) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.prev;
    }
  }
  get(n) {
    let i = 0;
    let walker = this.head;
    for (;!!walker && i < n; i++) {
      walker = walker.next;
    }
    if (i === n && !!walker) {
      return walker.value;
    }
  }
  getReverse(n) {
    let i = 0;
    let walker = this.tail;
    for (;!!walker && i < n; i++) {
      walker = walker.prev;
    }
    if (i === n && !!walker) {
      return walker.value;
    }
  }
  map(fn, thisp) {
    thisp = thisp || this;
    const res = new Yallist;
    for (let walker = this.head;walker; ) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.next;
    }
    return res;
  }
  mapReverse(fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist;
    for (let walker = this.tail;walker; ) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.prev;
    }
    return res;
  }
  reduce(fn, initial) {
    let acc;
    let walker = this.head;
    if (arguments.length > 1) {
      acc = initial;
    } else if (this.head) {
      walker = this.head.next;
      acc = this.head.value;
    } else {
      throw new TypeError("Reduce of empty list with no initial value");
    }
    for (var i = 0;walker; i++) {
      acc = fn(acc, walker.value, i);
      walker = walker.next;
    }
    return acc;
  }
  reduceReverse(fn, initial) {
    let acc;
    let walker = this.tail;
    if (arguments.length > 1) {
      acc = initial;
    } else if (this.tail) {
      walker = this.tail.prev;
      acc = this.tail.value;
    } else {
      throw new TypeError("Reduce of empty list with no initial value");
    }
    for (let i = this.length - 1;walker; i--) {
      acc = fn(acc, walker.value, i);
      walker = walker.prev;
    }
    return acc;
  }
  toArray() {
    const arr = new Array(this.length);
    for (let i = 0, walker = this.head;walker; i++) {
      arr[i] = walker.value;
      walker = walker.next;
    }
    return arr;
  }
  toArrayReverse() {
    const arr = new Array(this.length);
    for (let i = 0, walker = this.tail;walker; i++) {
      arr[i] = walker.value;
      walker = walker.prev;
    }
    return arr;
  }
  slice(from = 0, to = this.length) {
    if (to < 0) {
      to += this.length;
    }
    if (from < 0) {
      from += this.length;
    }
    const ret = new Yallist;
    if (to < from || to < 0) {
      return ret;
    }
    if (from < 0) {
      from = 0;
    }
    if (to > this.length) {
      to = this.length;
    }
    let walker = this.head;
    let i = 0;
    for (i = 0;!!walker && i < from; i++) {
      walker = walker.next;
    }
    for (;!!walker && i < to; i++, walker = walker.next) {
      ret.push(walker.value);
    }
    return ret;
  }
  sliceReverse(from = 0, to = this.length) {
    if (to < 0) {
      to += this.length;
    }
    if (from < 0) {
      from += this.length;
    }
    const ret = new Yallist;
    if (to < from || to < 0) {
      return ret;
    }
    if (from < 0) {
      from = 0;
    }
    if (to > this.length) {
      to = this.length;
    }
    let i = this.length;
    let walker = this.tail;
    for (;!!walker && i > to; i--) {
      walker = walker.prev;
    }
    for (;!!walker && i > from; i--, walker = walker.prev) {
      ret.push(walker.value);
    }
    return ret;
  }
  splice(start, deleteCount = 0, ...nodes) {
    if (start > this.length) {
      start = this.length - 1;
    }
    if (start < 0) {
      start = this.length + start;
    }
    let walker = this.head;
    for (let i = 0;!!walker && i < start; i++) {
      walker = walker.next;
    }
    const ret = [];
    for (let i = 0;!!walker && i < deleteCount; i++) {
      ret.push(walker.value);
      walker = this.removeNode(walker);
    }
    if (!walker) {
      walker = this.tail;
    } else if (walker !== this.tail) {
      walker = walker.prev;
    }
    for (const v of nodes) {
      walker = insertAfter(this, walker, v);
    }
    return ret;
  }
  reverse() {
    const head = this.head;
    const tail = this.tail;
    for (let walker = head;walker; walker = walker.prev) {
      const p = walker.prev;
      walker.prev = walker.next;
      walker.next = p;
    }
    this.head = tail;
    this.tail = head;
    return this;
  }
}

class Node {
  list;
  next;
  prev;
  value;
  constructor(value, prev, next, list) {
    this.list = list;
    this.value = value;
    if (prev) {
      prev.next = this;
      this.prev = prev;
    } else {
      this.prev = undefined;
    }
    if (next) {
      next.prev = this;
      this.next = next;
    } else {
      this.next = undefined;
    }
  }
}

// node_modules/tar/dist/esm/header.js
import {posix as pathModule} from "node:path";

// node_modules/tar/dist/esm/large-numbers.js
var encode = (num, buf) => {
  if (!Number.isSafeInteger(num)) {
    throw Error("cannot encode number outside of javascript safe integer range");
  } else if (num < 0) {
    encodeNegative(num, buf);
  } else {
    encodePositive(num, buf);
  }
  return buf;
};
var encodePositive = (num, buf) => {
  buf[0] = 128;
  for (var i = buf.length;i > 1; i--) {
    buf[i - 1] = num & 255;
    num = Math.floor(num / 256);
  }
};
var encodeNegative = (num, buf) => {
  buf[0] = 255;
  var flipped = false;
  num = num * -1;
  for (var i = buf.length;i > 1; i--) {
    var byte = num & 255;
    num = Math.floor(num / 256);
    if (flipped) {
      buf[i - 1] = onesComp(byte);
    } else if (byte === 0) {
      buf[i - 1] = 0;
    } else {
      flipped = true;
      buf[i - 1] = twosComp(byte);
    }
  }
};
var parse = (buf) => {
  const pre = buf[0];
  const value = pre === 128 ? pos(buf.subarray(1, buf.length)) : pre === 255 ? twos(buf) : null;
  if (value === null) {
    throw Error("invalid base256 encoding");
  }
  if (!Number.isSafeInteger(value)) {
    throw Error("parsed number outside of javascript safe integer range");
  }
  return value;
};
var twos = (buf) => {
  var len = buf.length;
  var sum = 0;
  var flipped = false;
  for (var i = len - 1;i > -1; i--) {
    var byte = Number(buf[i]);
    var f;
    if (flipped) {
      f = onesComp(byte);
    } else if (byte === 0) {
      f = byte;
    } else {
      flipped = true;
      f = twosComp(byte);
    }
    if (f !== 0) {
      sum -= f * Math.pow(256, len - i - 1);
    }
  }
  return sum;
};
var pos = (buf) => {
  var len = buf.length;
  var sum = 0;
  for (var i = len - 1;i > -1; i--) {
    var byte = Number(buf[i]);
    if (byte !== 0) {
      sum += byte * Math.pow(256, len - i - 1);
    }
  }
  return sum;
};
var onesComp = (byte) => (255 ^ byte) & 255;
var twosComp = (byte) => (255 ^ byte) + 1 & 255;

// node_modules/tar/dist/esm/types.js
var isCode = (c) => name.has(c);
var name = new Map([
  ["0", "File"],
  ["", "OldFile"],
  ["1", "Link"],
  ["2", "SymbolicLink"],
  ["3", "CharacterDevice"],
  ["4", "BlockDevice"],
  ["5", "Directory"],
  ["6", "FIFO"],
  ["7", "ContiguousFile"],
  ["g", "GlobalExtendedHeader"],
  ["x", "ExtendedHeader"],
  ["A", "SolarisACL"],
  ["D", "GNUDumpDir"],
  ["I", "Inode"],
  ["K", "NextFileHasLongLinkpath"],
  ["L", "NextFileHasLongPath"],
  ["M", "ContinuationFile"],
  ["N", "OldGnuLongPath"],
  ["S", "SparseFile"],
  ["V", "TapeVolumeHeader"],
  ["X", "OldExtendedHeader"]
]);
var code = new Map(Array.from(name).map((kv) => [kv[1], kv[0]]));

// node_modules/tar/dist/esm/header.js
class Header {
  cksumValid = false;
  needPax = false;
  nullBlock = false;
  block;
  path;
  mode;
  uid;
  gid;
  size;
  cksum;
  #type = "Unsupported";
  linkpath;
  uname;
  gname;
  devmaj = 0;
  devmin = 0;
  atime;
  ctime;
  mtime;
  charset;
  comment;
  constructor(data, off = 0, ex, gex) {
    if (Buffer.isBuffer(data)) {
      this.decode(data, off || 0, ex, gex);
    } else if (data) {
      this.#slurp(data);
    }
  }
  decode(buf, off, ex, gex) {
    if (!off) {
      off = 0;
    }
    if (!buf || !(buf.length >= off + 512)) {
      throw new Error("need 512 bytes for header");
    }
    this.path = decString(buf, off, 100);
    this.mode = decNumber(buf, off + 100, 8);
    this.uid = decNumber(buf, off + 108, 8);
    this.gid = decNumber(buf, off + 116, 8);
    this.size = decNumber(buf, off + 124, 12);
    this.mtime = decDate(buf, off + 136, 12);
    this.cksum = decNumber(buf, off + 148, 12);
    if (gex)
      this.#slurp(gex, true);
    if (ex)
      this.#slurp(ex);
    const t = decString(buf, off + 156, 1);
    if (isCode(t)) {
      this.#type = t || "0";
    }
    if (this.#type === "0" && this.path.slice(-1) === "/") {
      this.#type = "5";
    }
    if (this.#type === "5") {
      this.size = 0;
    }
    this.linkpath = decString(buf, off + 157, 100);
    if (buf.subarray(off + 257, off + 265).toString() === "ustar\x0000") {
      this.uname = decString(buf, off + 265, 32);
      this.gname = decString(buf, off + 297, 32);
      this.devmaj = decNumber(buf, off + 329, 8) ?? 0;
      this.devmin = decNumber(buf, off + 337, 8) ?? 0;
      if (buf[off + 475] !== 0) {
        const prefix = decString(buf, off + 345, 155);
        this.path = prefix + "/" + this.path;
      } else {
        const prefix = decString(buf, off + 345, 130);
        if (prefix) {
          this.path = prefix + "/" + this.path;
        }
        this.atime = decDate(buf, off + 476, 12);
        this.ctime = decDate(buf, off + 488, 12);
      }
    }
    let sum = 8 * 32;
    for (let i = off;i < off + 148; i++) {
      sum += buf[i];
    }
    for (let i = off + 156;i < off + 512; i++) {
      sum += buf[i];
    }
    this.cksumValid = sum === this.cksum;
    if (this.cksum === undefined && sum === 8 * 32) {
      this.nullBlock = true;
    }
  }
  #slurp(ex, gex = false) {
    Object.assign(this, Object.fromEntries(Object.entries(ex).filter(([k, v]) => {
      return !(v === null || v === undefined || k === "path" && gex || k === "linkpath" && gex || k === "global");
    })));
  }
  encode(buf, off = 0) {
    if (!buf) {
      buf = this.block = Buffer.alloc(512);
    }
    if (this.#type === "Unsupported") {
      this.#type = "0";
    }
    if (!(buf.length >= off + 512)) {
      throw new Error("need 512 bytes for header");
    }
    const prefixSize = this.ctime || this.atime ? 130 : 155;
    const split = splitPrefix(this.path || "", prefixSize);
    const path = split[0];
    const prefix = split[1];
    this.needPax = !!split[2];
    this.needPax = encString(buf, off, 100, path) || this.needPax;
    this.needPax = encNumber(buf, off + 100, 8, this.mode) || this.needPax;
    this.needPax = encNumber(buf, off + 108, 8, this.uid) || this.needPax;
    this.needPax = encNumber(buf, off + 116, 8, this.gid) || this.needPax;
    this.needPax = encNumber(buf, off + 124, 12, this.size) || this.needPax;
    this.needPax = encDate(buf, off + 136, 12, this.mtime) || this.needPax;
    buf[off + 156] = this.#type.charCodeAt(0);
    this.needPax = encString(buf, off + 157, 100, this.linkpath) || this.needPax;
    buf.write("ustar\x0000", off + 257, 8);
    this.needPax = encString(buf, off + 265, 32, this.uname) || this.needPax;
    this.needPax = encString(buf, off + 297, 32, this.gname) || this.needPax;
    this.needPax = encNumber(buf, off + 329, 8, this.devmaj) || this.needPax;
    this.needPax = encNumber(buf, off + 337, 8, this.devmin) || this.needPax;
    this.needPax = encString(buf, off + 345, prefixSize, prefix) || this.needPax;
    if (buf[off + 475] !== 0) {
      this.needPax = encString(buf, off + 345, 155, prefix) || this.needPax;
    } else {
      this.needPax = encString(buf, off + 345, 130, prefix) || this.needPax;
      this.needPax = encDate(buf, off + 476, 12, this.atime) || this.needPax;
      this.needPax = encDate(buf, off + 488, 12, this.ctime) || this.needPax;
    }
    let sum = 8 * 32;
    for (let i = off;i < off + 148; i++) {
      sum += buf[i];
    }
    for (let i = off + 156;i < off + 512; i++) {
      sum += buf[i];
    }
    this.cksum = sum;
    encNumber(buf, off + 148, 8, this.cksum);
    this.cksumValid = true;
    return this.needPax;
  }
  get type() {
    return this.#type === "Unsupported" ? this.#type : name.get(this.#type);
  }
  get typeKey() {
    return this.#type;
  }
  set type(type) {
    const c = String(code.get(type));
    if (isCode(c) || c === "Unsupported") {
      this.#type = c;
    } else if (isCode(type)) {
      this.#type = type;
    } else {
      throw new TypeError("invalid entry type: " + type);
    }
  }
}
var splitPrefix = (p, prefixSize) => {
  const pathSize = 100;
  let pp = p;
  let prefix = "";
  let ret = undefined;
  const root = pathModule.parse(p).root || ".";
  if (Buffer.byteLength(pp) < pathSize) {
    ret = [pp, prefix, false];
  } else {
    prefix = pathModule.dirname(pp);
    pp = pathModule.basename(pp);
    do {
      if (Buffer.byteLength(pp) <= pathSize && Buffer.byteLength(prefix) <= prefixSize) {
        ret = [pp, prefix, false];
      } else if (Buffer.byteLength(pp) > pathSize && Buffer.byteLength(prefix) <= prefixSize) {
        ret = [pp.slice(0, pathSize - 1), prefix, true];
      } else {
        pp = pathModule.join(pathModule.basename(prefix), pp);
        prefix = pathModule.dirname(prefix);
      }
    } while (prefix !== root && ret === undefined);
    if (!ret) {
      ret = [p.slice(0, pathSize - 1), "", true];
    }
  }
  return ret;
};
var decString = (buf, off, size) => buf.subarray(off, off + size).toString("utf8").replace(/\0.*/, "");
var decDate = (buf, off, size) => numToDate(decNumber(buf, off, size));
var numToDate = (num) => num === undefined ? undefined : new Date(num * 1000);
var decNumber = (buf, off, size) => Number(buf[off]) & 128 ? parse(buf.subarray(off, off + size)) : decSmallNumber(buf, off, size);
var nanUndef = (value) => isNaN(value) ? undefined : value;
var decSmallNumber = (buf, off, size) => nanUndef(parseInt(buf.subarray(off, off + size).toString("utf8").replace(/\0.*$/, "").trim(), 8));
var MAXNUM = {
  12: 8589934591,
  8: 2097151
};
var encNumber = (buf, off, size, num) => num === undefined ? false : num > MAXNUM[size] || num < 0 ? (encode(num, buf.subarray(off, off + size)), true) : (encSmallNumber(buf, off, size, num), false);
var encSmallNumber = (buf, off, size, num) => buf.write(octalString(num, size), off, size, "ascii");
var octalString = (num, size) => padOctal(Math.floor(num).toString(8), size);
var padOctal = (str, size) => (str.length === size - 1 ? str : new Array(size - str.length - 1).join("0") + str + " ") + "\0";
var encDate = (buf, off, size, date) => date === undefined ? false : encNumber(buf, off, size, date.getTime() / 1000);
var NULLS = new Array(156).join("\0");
var encString = (buf, off, size, str) => str === undefined ? false : (buf.write(str + NULLS, off, size, "utf8"), str.length !== Buffer.byteLength(str) || str.length > size);

// node_modules/tar/dist/esm/pax.js
import {basename} from "node:path";
class Pax {
  atime;
  mtime;
  ctime;
  charset;
  comment;
  gid;
  uid;
  gname;
  uname;
  linkpath;
  dev;
  ino;
  nlink;
  path;
  size;
  mode;
  global;
  constructor(obj, global2 = false) {
    this.atime = obj.atime;
    this.charset = obj.charset;
    this.comment = obj.comment;
    this.ctime = obj.ctime;
    this.dev = obj.dev;
    this.gid = obj.gid;
    this.global = global2;
    this.gname = obj.gname;
    this.ino = obj.ino;
    this.linkpath = obj.linkpath;
    this.mtime = obj.mtime;
    this.nlink = obj.nlink;
    this.path = obj.path;
    this.size = obj.size;
    this.uid = obj.uid;
    this.uname = obj.uname;
  }
  encode() {
    const body = this.encodeBody();
    if (body === "") {
      return Buffer.allocUnsafe(0);
    }
    const bodyLen = Buffer.byteLength(body);
    const bufLen = 512 * Math.ceil(1 + bodyLen / 512);
    const buf = Buffer.allocUnsafe(bufLen);
    for (let i = 0;i < 512; i++) {
      buf[i] = 0;
    }
    new Header({
      path: ("PaxHeader/" + basename(this.path ?? "")).slice(0, 99),
      mode: this.mode || 420,
      uid: this.uid,
      gid: this.gid,
      size: bodyLen,
      mtime: this.mtime,
      type: this.global ? "GlobalExtendedHeader" : "ExtendedHeader",
      linkpath: "",
      uname: this.uname || "",
      gname: this.gname || "",
      devmaj: 0,
      devmin: 0,
      atime: this.atime,
      ctime: this.ctime
    }).encode(buf);
    buf.write(body, 512, bodyLen, "utf8");
    for (let i = bodyLen + 512;i < buf.length; i++) {
      buf[i] = 0;
    }
    return buf;
  }
  encodeBody() {
    return this.encodeField("path") + this.encodeField("ctime") + this.encodeField("atime") + this.encodeField("dev") + this.encodeField("ino") + this.encodeField("nlink") + this.encodeField("charset") + this.encodeField("comment") + this.encodeField("gid") + this.encodeField("gname") + this.encodeField("linkpath") + this.encodeField("mtime") + this.encodeField("size") + this.encodeField("uid") + this.encodeField("uname");
  }
  encodeField(field) {
    if (this[field] === undefined) {
      return "";
    }
    const r = this[field];
    const v = r instanceof Date ? r.getTime() / 1000 : r;
    const s = " " + (field === "dev" || field === "ino" || field === "nlink" ? "SCHILY." : "") + field + "=" + v + "\n";
    const byteLen = Buffer.byteLength(s);
    let digits = Math.floor(Math.log(byteLen) / Math.log(10)) + 1;
    if (byteLen + digits >= Math.pow(10, digits)) {
      digits += 1;
    }
    const len = digits + byteLen;
    return len + s;
  }
  static parse(str, ex, g = false) {
    return new Pax(merge(parseKV(str), ex), g);
  }
}
var merge = (a, b) => b ? Object.assign({}, b, a) : a;
var parseKV = (str) => str.replace(/\n$/, "").split("\n").reduce(parseKVLine, Object.create(null));
var parseKVLine = (set, line) => {
  const n = parseInt(line, 10);
  if (n !== Buffer.byteLength(line) + 1) {
    return set;
  }
  line = line.slice((n + " ").length);
  const kv = line.split("=");
  const r = kv.shift();
  if (!r) {
    return set;
  }
  const k = r.replace(/^SCHILY\.(dev|ino|nlink)/, "$1");
  const v = kv.join("=");
  set[k] = /^([A-Z]+\.)?([mac]|birth|creation)time$/.test(k) ? new Date(Number(v) * 1000) : /^[0-9]+$/.test(v) ? +v : v;
  return set;
};

// node_modules/tar/dist/esm/normalize-windows-path.js
var platform = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var normalizeWindowsPath = platform !== "win32" ? (p) => p : (p) => p && p.replace(/\\/g, "/");

// node_modules/tar/dist/esm/read-entry.js
class ReadEntry extends Minipass {
  extended;
  globalExtended;
  header;
  startBlockSize;
  blockRemain;
  remain;
  type;
  meta = false;
  ignore = false;
  path;
  mode;
  uid;
  gid;
  uname;
  gname;
  size = 0;
  mtime;
  atime;
  ctime;
  linkpath;
  dev;
  ino;
  nlink;
  invalid = false;
  absolute;
  unsupported = false;
  constructor(header2, ex, gex) {
    super({});
    this.pause();
    this.extended = ex;
    this.globalExtended = gex;
    this.header = header2;
    this.remain = header2.size ?? 0;
    this.startBlockSize = 512 * Math.ceil(this.remain / 512);
    this.blockRemain = this.startBlockSize;
    this.type = header2.type;
    switch (this.type) {
      case "File":
      case "OldFile":
      case "Link":
      case "SymbolicLink":
      case "CharacterDevice":
      case "BlockDevice":
      case "Directory":
      case "FIFO":
      case "ContiguousFile":
      case "GNUDumpDir":
        break;
      case "NextFileHasLongLinkpath":
      case "NextFileHasLongPath":
      case "OldGnuLongPath":
      case "GlobalExtendedHeader":
      case "ExtendedHeader":
      case "OldExtendedHeader":
        this.meta = true;
        break;
      default:
        this.ignore = true;
    }
    if (!header2.path) {
      throw new Error("no path provided for tar.ReadEntry");
    }
    this.path = normalizeWindowsPath(header2.path);
    this.mode = header2.mode;
    if (this.mode) {
      this.mode = this.mode & 4095;
    }
    this.uid = header2.uid;
    this.gid = header2.gid;
    this.uname = header2.uname;
    this.gname = header2.gname;
    this.size = this.remain;
    this.mtime = header2.mtime;
    this.atime = header2.atime;
    this.ctime = header2.ctime;
    this.linkpath = header2.linkpath ? normalizeWindowsPath(header2.linkpath) : undefined;
    this.uname = header2.uname;
    this.gname = header2.gname;
    if (ex) {
      this.#slurp(ex);
    }
    if (gex) {
      this.#slurp(gex, true);
    }
  }
  write(data) {
    const writeLen = data.length;
    if (writeLen > this.blockRemain) {
      throw new Error("writing more to entry than is appropriate");
    }
    const r = this.remain;
    const br = this.blockRemain;
    this.remain = Math.max(0, r - writeLen);
    this.blockRemain = Math.max(0, br - writeLen);
    if (this.ignore) {
      return true;
    }
    if (r >= writeLen) {
      return super.write(data);
    }
    return super.write(data.subarray(0, r));
  }
  #slurp(ex, gex = false) {
    if (ex.path)
      ex.path = normalizeWindowsPath(ex.path);
    if (ex.linkpath)
      ex.linkpath = normalizeWindowsPath(ex.linkpath);
    Object.assign(this, Object.fromEntries(Object.entries(ex).filter(([k, v]) => {
      return !(v === null || v === undefined || k === "path" && gex);
    })));
  }
}

// node_modules/tar/dist/esm/warn-method.js
var warnMethod = (self, code2, message, data = {}) => {
  if (self.file) {
    data.file = self.file;
  }
  if (self.cwd) {
    data.cwd = self.cwd;
  }
  data.code = message instanceof Error && message.code || code2;
  data.tarCode = code2;
  if (!self.strict && data.recoverable !== false) {
    if (message instanceof Error) {
      data = Object.assign(message, data);
      message = message.message;
    }
    self.emit("warn", code2, message, data);
  } else if (message instanceof Error) {
    self.emit("error", Object.assign(message, data));
  } else {
    self.emit("error", Object.assign(new Error(`${code2}: ${message}`), data));
  }
};

// node_modules/tar/dist/esm/parse.js
var maxMetaEntrySize = 1024 * 1024;
var gzipHeader = Buffer.from([31, 139]);
var STATE = Symbol("state");
var WRITEENTRY = Symbol("writeEntry");
var READENTRY = Symbol("readEntry");
var NEXTENTRY = Symbol("nextEntry");
var PROCESSENTRY = Symbol("processEntry");
var EX = Symbol("extendedHeader");
var GEX = Symbol("globalExtendedHeader");
var META = Symbol("meta");
var EMITMETA = Symbol("emitMeta");
var BUFFER2 = Symbol("buffer");
var QUEUE = Symbol("queue");
var ENDED = Symbol("ended");
var EMITTEDEND = Symbol("emittedEnd");
var EMIT = Symbol("emit");
var UNZIP = Symbol("unzip");
var CONSUMECHUNK = Symbol("consumeChunk");
var CONSUMECHUNKSUB = Symbol("consumeChunkSub");
var CONSUMEBODY = Symbol("consumeBody");
var CONSUMEMETA = Symbol("consumeMeta");
var CONSUMEHEADER = Symbol("consumeHeader");
var CONSUMING = Symbol("consuming");
var BUFFERCONCAT = Symbol("bufferConcat");
var MAYBEEND = Symbol("maybeEnd");
var WRITING = Symbol("writing");
var ABORTED2 = Symbol("aborted");
var DONE = Symbol("onDone");
var SAW_VALID_ENTRY = Symbol("sawValidEntry");
var SAW_NULL_BLOCK = Symbol("sawNullBlock");
var SAW_EOF = Symbol("sawEOF");
var CLOSESTREAM = Symbol("closeStream");
var noop = () => true;

class Parser extends EE2 {
  file;
  strict;
  maxMetaEntrySize;
  filter;
  brotli;
  writable = true;
  readable = false;
  [QUEUE] = new Yallist;
  [BUFFER2];
  [READENTRY];
  [WRITEENTRY];
  [STATE] = "begin";
  [META] = "";
  [EX];
  [GEX];
  [ENDED] = false;
  [UNZIP];
  [ABORTED2] = false;
  [SAW_VALID_ENTRY];
  [SAW_NULL_BLOCK] = false;
  [SAW_EOF] = false;
  [WRITING] = false;
  [CONSUMING] = false;
  [EMITTEDEND] = false;
  constructor(opt = {}) {
    super();
    this.file = opt.file || "";
    this.on(DONE, () => {
      if (this[STATE] === "begin" || this[SAW_VALID_ENTRY] === false) {
        this.warn("TAR_BAD_ARCHIVE", "Unrecognized archive format");
      }
    });
    if (opt.ondone) {
      this.on(DONE, opt.ondone);
    } else {
      this.on(DONE, () => {
        this.emit("prefinish");
        this.emit("finish");
        this.emit("end");
      });
    }
    this.strict = !!opt.strict;
    this.maxMetaEntrySize = opt.maxMetaEntrySize || maxMetaEntrySize;
    this.filter = typeof opt.filter === "function" ? opt.filter : noop;
    const isTBR = opt.file && (opt.file.endsWith(".tar.br") || opt.file.endsWith(".tbr"));
    this.brotli = !opt.gzip && opt.brotli !== undefined ? opt.brotli : isTBR ? undefined : false;
    this.on("end", () => this[CLOSESTREAM]());
    if (typeof opt.onwarn === "function") {
      this.on("warn", opt.onwarn);
    }
    if (typeof opt.onReadEntry === "function") {
      this.on("entry", opt.onReadEntry);
    }
  }
  warn(code2, message, data = {}) {
    warnMethod(this, code2, message, data);
  }
  [CONSUMEHEADER](chunk, position) {
    if (this[SAW_VALID_ENTRY] === undefined) {
      this[SAW_VALID_ENTRY] = false;
    }
    let header3;
    try {
      header3 = new Header(chunk, position, this[EX], this[GEX]);
    } catch (er) {
      return this.warn("TAR_ENTRY_INVALID", er);
    }
    if (header3.nullBlock) {
      if (this[SAW_NULL_BLOCK]) {
        this[SAW_EOF] = true;
        if (this[STATE] === "begin") {
          this[STATE] = "header";
        }
        this[EMIT]("eof");
      } else {
        this[SAW_NULL_BLOCK] = true;
        this[EMIT]("nullBlock");
      }
    } else {
      this[SAW_NULL_BLOCK] = false;
      if (!header3.cksumValid) {
        this.warn("TAR_ENTRY_INVALID", "checksum failure", { header: header3 });
      } else if (!header3.path) {
        this.warn("TAR_ENTRY_INVALID", "path is required", { header: header3 });
      } else {
        const type = header3.type;
        if (/^(Symbolic)?Link$/.test(type) && !header3.linkpath) {
          this.warn("TAR_ENTRY_INVALID", "linkpath required", {
            header: header3
          });
        } else if (!/^(Symbolic)?Link$/.test(type) && !/^(Global)?ExtendedHeader$/.test(type) && header3.linkpath) {
          this.warn("TAR_ENTRY_INVALID", "linkpath forbidden", {
            header: header3
          });
        } else {
          const entry = this[WRITEENTRY] = new ReadEntry(header3, this[EX], this[GEX]);
          if (!this[SAW_VALID_ENTRY]) {
            if (entry.remain) {
              const onend = () => {
                if (!entry.invalid) {
                  this[SAW_VALID_ENTRY] = true;
                }
              };
              entry.on("end", onend);
            } else {
              this[SAW_VALID_ENTRY] = true;
            }
          }
          if (entry.meta) {
            if (entry.size > this.maxMetaEntrySize) {
              entry.ignore = true;
              this[EMIT]("ignoredEntry", entry);
              this[STATE] = "ignore";
              entry.resume();
            } else if (entry.size > 0) {
              this[META] = "";
              entry.on("data", (c) => this[META] += c);
              this[STATE] = "meta";
            }
          } else {
            this[EX] = undefined;
            entry.ignore = entry.ignore || !this.filter(entry.path, entry);
            if (entry.ignore) {
              this[EMIT]("ignoredEntry", entry);
              this[STATE] = entry.remain ? "ignore" : "header";
              entry.resume();
            } else {
              if (entry.remain) {
                this[STATE] = "body";
              } else {
                this[STATE] = "header";
                entry.end();
              }
              if (!this[READENTRY]) {
                this[QUEUE].push(entry);
                this[NEXTENTRY]();
              } else {
                this[QUEUE].push(entry);
              }
            }
          }
        }
      }
    }
  }
  [CLOSESTREAM]() {
    queueMicrotask(() => this.emit("close"));
  }
  [PROCESSENTRY](entry) {
    let go = true;
    if (!entry) {
      this[READENTRY] = undefined;
      go = false;
    } else if (Array.isArray(entry)) {
      const [ev, ...args] = entry;
      this.emit(ev, ...args);
    } else {
      this[READENTRY] = entry;
      this.emit("entry", entry);
      if (!entry.emittedEnd) {
        entry.on("end", () => this[NEXTENTRY]());
        go = false;
      }
    }
    return go;
  }
  [NEXTENTRY]() {
    do {
    } while (this[PROCESSENTRY](this[QUEUE].shift()));
    if (!this[QUEUE].length) {
      const re = this[READENTRY];
      const drainNow = !re || re.flowing || re.size === re.remain;
      if (drainNow) {
        if (!this[WRITING]) {
          this.emit("drain");
        }
      } else {
        re.once("drain", () => this.emit("drain"));
      }
    }
  }
  [CONSUMEBODY](chunk, position) {
    const entry = this[WRITEENTRY];
    if (!entry) {
      throw new Error("attempt to consume body without entry??");
    }
    const br = entry.blockRemain ?? 0;
    const c = br >= chunk.length && position === 0 ? chunk : chunk.subarray(position, position + br);
    entry.write(c);
    if (!entry.blockRemain) {
      this[STATE] = "header";
      this[WRITEENTRY] = undefined;
      entry.end();
    }
    return c.length;
  }
  [CONSUMEMETA](chunk, position) {
    const entry = this[WRITEENTRY];
    const ret = this[CONSUMEBODY](chunk, position);
    if (!this[WRITEENTRY] && entry) {
      this[EMITMETA](entry);
    }
    return ret;
  }
  [EMIT](ev, data, extra) {
    if (!this[QUEUE].length && !this[READENTRY]) {
      this.emit(ev, data, extra);
    } else {
      this[QUEUE].push([ev, data, extra]);
    }
  }
  [EMITMETA](entry) {
    this[EMIT]("meta", this[META]);
    switch (entry.type) {
      case "ExtendedHeader":
      case "OldExtendedHeader":
        this[EX] = Pax.parse(this[META], this[EX], false);
        break;
      case "GlobalExtendedHeader":
        this[GEX] = Pax.parse(this[META], this[GEX], true);
        break;
      case "NextFileHasLongPath":
      case "OldGnuLongPath": {
        const ex = this[EX] ?? Object.create(null);
        this[EX] = ex;
        ex.path = this[META].replace(/\0.*/, "");
        break;
      }
      case "NextFileHasLongLinkpath": {
        const ex = this[EX] || Object.create(null);
        this[EX] = ex;
        ex.linkpath = this[META].replace(/\0.*/, "");
        break;
      }
      default:
        throw new Error("unknown meta: " + entry.type);
    }
  }
  abort(error) {
    this[ABORTED2] = true;
    this.emit("abort", error);
    this.warn("TAR_ABORT", error, { recoverable: false });
  }
  write(chunk, encoding, cb) {
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = undefined;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
    }
    if (this[ABORTED2]) {
      cb?.();
      return false;
    }
    const needSniff = this[UNZIP] === undefined || this.brotli === undefined && this[UNZIP] === false;
    if (needSniff && chunk) {
      if (this[BUFFER2]) {
        chunk = Buffer.concat([this[BUFFER2], chunk]);
        this[BUFFER2] = undefined;
      }
      if (chunk.length < gzipHeader.length) {
        this[BUFFER2] = chunk;
        cb?.();
        return true;
      }
      for (let i = 0;this[UNZIP] === undefined && i < gzipHeader.length; i++) {
        if (chunk[i] !== gzipHeader[i]) {
          this[UNZIP] = false;
        }
      }
      const maybeBrotli = this.brotli === undefined;
      if (this[UNZIP] === false && maybeBrotli) {
        if (chunk.length < 512) {
          if (this[ENDED]) {
            this.brotli = true;
          } else {
            this[BUFFER2] = chunk;
            cb?.();
            return true;
          }
        } else {
          try {
            new Header(chunk.subarray(0, 512));
            this.brotli = false;
          } catch (_) {
            this.brotli = true;
          }
        }
      }
      if (this[UNZIP] === undefined || this[UNZIP] === false && this.brotli) {
        const ended = this[ENDED];
        this[ENDED] = false;
        this[UNZIP] = this[UNZIP] === undefined ? new Unzip({}) : new BrotliDecompress({});
        this[UNZIP].on("data", (chunk2) => this[CONSUMECHUNK](chunk2));
        this[UNZIP].on("error", (er) => this.abort(er));
        this[UNZIP].on("end", () => {
          this[ENDED] = true;
          this[CONSUMECHUNK]();
        });
        this[WRITING] = true;
        const ret2 = !!this[UNZIP][ended ? "end" : "write"](chunk);
        this[WRITING] = false;
        cb?.();
        return ret2;
      }
    }
    this[WRITING] = true;
    if (this[UNZIP]) {
      this[UNZIP].write(chunk);
    } else {
      this[CONSUMECHUNK](chunk);
    }
    this[WRITING] = false;
    const ret = this[QUEUE].length ? false : this[READENTRY] ? this[READENTRY].flowing : true;
    if (!ret && !this[QUEUE].length) {
      this[READENTRY]?.once("drain", () => this.emit("drain"));
    }
    cb?.();
    return ret;
  }
  [BUFFERCONCAT](c) {
    if (c && !this[ABORTED2]) {
      this[BUFFER2] = this[BUFFER2] ? Buffer.concat([this[BUFFER2], c]) : c;
    }
  }
  [MAYBEEND]() {
    if (this[ENDED] && !this[EMITTEDEND] && !this[ABORTED2] && !this[CONSUMING]) {
      this[EMITTEDEND] = true;
      const entry = this[WRITEENTRY];
      if (entry && entry.blockRemain) {
        const have = this[BUFFER2] ? this[BUFFER2].length : 0;
        this.warn("TAR_BAD_ARCHIVE", `Truncated input (needed ${entry.blockRemain} more bytes, only ${have} available)`, { entry });
        if (this[BUFFER2]) {
          entry.write(this[BUFFER2]);
        }
        entry.end();
      }
      this[EMIT](DONE);
    }
  }
  [CONSUMECHUNK](chunk) {
    if (this[CONSUMING] && chunk) {
      this[BUFFERCONCAT](chunk);
    } else if (!chunk && !this[BUFFER2]) {
      this[MAYBEEND]();
    } else if (chunk) {
      this[CONSUMING] = true;
      if (this[BUFFER2]) {
        this[BUFFERCONCAT](chunk);
        const c = this[BUFFER2];
        this[BUFFER2] = undefined;
        this[CONSUMECHUNKSUB](c);
      } else {
        this[CONSUMECHUNKSUB](chunk);
      }
      while (this[BUFFER2] && this[BUFFER2]?.length >= 512 && !this[ABORTED2] && !this[SAW_EOF]) {
        const c = this[BUFFER2];
        this[BUFFER2] = undefined;
        this[CONSUMECHUNKSUB](c);
      }
      this[CONSUMING] = false;
    }
    if (!this[BUFFER2] || this[ENDED]) {
      this[MAYBEEND]();
    }
  }
  [CONSUMECHUNKSUB](chunk) {
    let position = 0;
    const length = chunk.length;
    while (position + 512 <= length && !this[ABORTED2] && !this[SAW_EOF]) {
      switch (this[STATE]) {
        case "begin":
        case "header":
          this[CONSUMEHEADER](chunk, position);
          position += 512;
          break;
        case "ignore":
        case "body":
          position += this[CONSUMEBODY](chunk, position);
          break;
        case "meta":
          position += this[CONSUMEMETA](chunk, position);
          break;
        default:
          throw new Error("invalid state: " + this[STATE]);
      }
    }
    if (position < length) {
      if (this[BUFFER2]) {
        this[BUFFER2] = Buffer.concat([
          chunk.subarray(position),
          this[BUFFER2]
        ]);
      } else {
        this[BUFFER2] = chunk.subarray(position);
      }
    }
  }
  end(chunk, encoding, cb) {
    if (typeof chunk === "function") {
      cb = chunk;
      encoding = undefined;
      chunk = undefined;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = undefined;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, encoding);
    }
    if (cb)
      this.once("finish", cb);
    if (!this[ABORTED2]) {
      if (this[UNZIP]) {
        if (chunk)
          this[UNZIP].write(chunk);
        this[UNZIP].end();
      } else {
        this[ENDED] = true;
        if (this.brotli === undefined)
          chunk = chunk || Buffer.alloc(0);
        if (chunk)
          this.write(chunk);
        this[MAYBEEND]();
      }
    }
    return this;
  }
}

// node_modules/tar/dist/esm/strip-trailing-slashes.js
var stripTrailingSlashes = (str) => {
  let i = str.length - 1;
  let slashesStart = -1;
  while (i > -1 && str.charAt(i) === "/") {
    slashesStart = i;
    i--;
  }
  return slashesStart === -1 ? str : str.slice(0, slashesStart);
};

// node_modules/tar/dist/esm/list.js
var onReadEntryFunction = (opt) => {
  const onReadEntry = opt.onReadEntry;
  opt.onReadEntry = onReadEntry ? (e) => {
    onReadEntry(e);
    e.resume();
  } : (e) => e.resume();
};
var filesFilter = (opt, files) => {
  const map = new Map(files.map((f) => [stripTrailingSlashes(f), true]));
  const filter = opt.filter;
  const mapHas = (file, r = "") => {
    const root = r || parse2(file).root || ".";
    let ret;
    if (file === root)
      ret = false;
    else {
      const m = map.get(file);
      if (m !== undefined) {
        ret = m;
      } else {
        ret = mapHas(dirname(file), root);
      }
    }
    map.set(file, ret);
    return ret;
  };
  opt.filter = filter ? (file, entry) => filter(file, entry) && mapHas(stripTrailingSlashes(file)) : (file) => mapHas(stripTrailingSlashes(file));
};
var listFileSync = (opt) => {
  const p = new Parser(opt);
  const file = opt.file;
  let fd;
  try {
    const stat = fs2.statSync(file);
    const readSize = opt.maxReadSize || 16 * 1024 * 1024;
    if (stat.size < readSize) {
      p.end(fs2.readFileSync(file));
    } else {
      let pos2 = 0;
      const buf = Buffer.allocUnsafe(readSize);
      fd = fs2.openSync(file, "r");
      while (pos2 < stat.size) {
        const bytesRead = fs2.readSync(fd, buf, 0, readSize, pos2);
        pos2 += bytesRead;
        p.write(buf.subarray(0, bytesRead));
      }
      p.end();
    }
  } finally {
    if (typeof fd === "number") {
      try {
        fs2.closeSync(fd);
      } catch (er) {
      }
    }
  }
};
var listFile = (opt, _files) => {
  const parse4 = new Parser(opt);
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;
  const file = opt.file;
  const p = new Promise((resolve, reject) => {
    parse4.on("error", reject);
    parse4.on("end", resolve);
    fs2.stat(file, (er, stat) => {
      if (er) {
        reject(er);
      } else {
        const stream = new ReadStream(file, {
          readSize,
          size: stat.size
        });
        stream.on("error", reject);
        stream.pipe(parse4);
      }
    });
  });
  return p;
};
var list = makeCommand(listFileSync, listFile, (opt) => new Parser(opt), (opt) => new Parser(opt), (opt, files) => {
  if (files?.length)
    filesFilter(opt, files);
  if (!opt.noResume)
    onReadEntryFunction(opt);
});

// node_modules/tar/dist/esm/pack.js
import fs4 from "fs";

// node_modules/tar/dist/esm/write-entry.js
import fs3 from "fs";
import path from "path";

// node_modules/tar/dist/esm/mode-fix.js
var modeFix = (mode, isDir, portable) => {
  mode &= 4095;
  if (portable) {
    mode = (mode | 384) & ~18;
  }
  if (isDir) {
    if (mode & 256) {
      mode |= 64;
    }
    if (mode & 32) {
      mode |= 8;
    }
    if (mode & 4) {
      mode |= 1;
    }
  }
  return mode;
};

// node_modules/tar/dist/esm/strip-absolute-path.js
import {win32} from "node:path";
var { isAbsolute, parse: parse4 } = win32;
var stripAbsolutePath = (path) => {
  let r = "";
  let parsed = parse4(path);
  while (isAbsolute(path) || parsed.root) {
    const root = path.charAt(0) === "/" && path.slice(0, 4) !== "//?/" ? "/" : parsed.root;
    path = path.slice(root.length);
    r += root;
    parsed = parse4(path);
  }
  return [r, path];
};

// node_modules/tar/dist/esm/winchars.js
var raw = ["|", "<", ">", "?", ":"];
var win = raw.map((char) => String.fromCharCode(61440 + char.charCodeAt(0)));
var toWin = new Map(raw.map((char, i) => [char, win[i]]));
var toRaw = new Map(win.map((char, i) => [char, raw[i]]));
var encode2 = (s) => raw.reduce((s2, c) => s2.split(c).join(toWin.get(c)), s);
var decode = (s) => win.reduce((s2, c) => s2.split(c).join(toRaw.get(c)), s);

// node_modules/tar/dist/esm/write-entry.js
var prefixPath = (path2, prefix) => {
  if (!prefix) {
    return normalizeWindowsPath(path2);
  }
  path2 = normalizeWindowsPath(path2).replace(/^\.(\/|$)/, "");
  return stripTrailingSlashes(prefix) + "/" + path2;
};
var maxReadSize = 16 * 1024 * 1024;
var PROCESS = Symbol("process");
var FILE = Symbol("file");
var DIRECTORY = Symbol("directory");
var SYMLINK = Symbol("symlink");
var HARDLINK = Symbol("hardlink");
var HEADER = Symbol("header");
var READ2 = Symbol("read");
var LSTAT = Symbol("lstat");
var ONLSTAT = Symbol("onlstat");
var ONREAD = Symbol("onread");
var ONREADLINK = Symbol("onreadlink");
var OPENFILE = Symbol("openfile");
var ONOPENFILE = Symbol("onopenfile");
var CLOSE = Symbol("close");
var MODE = Symbol("mode");
var AWAITDRAIN = Symbol("awaitDrain");
var ONDRAIN = Symbol("ondrain");
var PREFIX = Symbol("prefix");

class WriteEntry extends Minipass {
  path;
  portable;
  myuid = process.getuid && process.getuid() || 0;
  myuser = process.env.USER || "";
  maxReadSize;
  linkCache;
  statCache;
  preservePaths;
  cwd;
  strict;
  mtime;
  noPax;
  noMtime;
  prefix;
  fd;
  blockLen = 0;
  blockRemain = 0;
  buf;
  pos = 0;
  remain = 0;
  length = 0;
  offset = 0;
  win32;
  absolute;
  header;
  type;
  linkpath;
  stat;
  #hadError = false;
  constructor(p, opt_ = {}) {
    const opt = dealias(opt_);
    super();
    this.path = normalizeWindowsPath(p);
    this.portable = !!opt.portable;
    this.maxReadSize = opt.maxReadSize || maxReadSize;
    this.linkCache = opt.linkCache || new Map;
    this.statCache = opt.statCache || new Map;
    this.preservePaths = !!opt.preservePaths;
    this.cwd = normalizeWindowsPath(opt.cwd || process.cwd());
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.noMtime = !!opt.noMtime;
    this.mtime = opt.mtime;
    this.prefix = opt.prefix ? normalizeWindowsPath(opt.prefix) : undefined;
    if (typeof opt.onwarn === "function") {
      this.on("warn", opt.onwarn);
    }
    let pathWarn = false;
    if (!this.preservePaths) {
      const [root, stripped] = stripAbsolutePath(this.path);
      if (root && typeof stripped === "string") {
        this.path = stripped;
        pathWarn = root;
      }
    }
    this.win32 = !!opt.win32 || process.platform === "win32";
    if (this.win32) {
      this.path = decode(this.path.replace(/\\/g, "/"));
      p = p.replace(/\\/g, "/");
    }
    this.absolute = normalizeWindowsPath(opt.absolute || path.resolve(this.cwd, p));
    if (this.path === "") {
      this.path = "./";
    }
    if (pathWarn) {
      this.warn("TAR_ENTRY_INFO", `stripping ${pathWarn} from absolute path`, {
        entry: this,
        path: pathWarn + this.path
      });
    }
    const cs = this.statCache.get(this.absolute);
    if (cs) {
      this[ONLSTAT](cs);
    } else {
      this[LSTAT]();
    }
  }
  warn(code2, message, data = {}) {
    return warnMethod(this, code2, message, data);
  }
  emit(ev, ...data) {
    if (ev === "error") {
      this.#hadError = true;
    }
    return super.emit(ev, ...data);
  }
  [LSTAT]() {
    fs3.lstat(this.absolute, (er, stat) => {
      if (er) {
        return this.emit("error", er);
      }
      this[ONLSTAT](stat);
    });
  }
  [ONLSTAT](stat) {
    this.statCache.set(this.absolute, stat);
    this.stat = stat;
    if (!stat.isFile()) {
      stat.size = 0;
    }
    this.type = getType(stat);
    this.emit("stat", stat);
    this[PROCESS]();
  }
  [PROCESS]() {
    switch (this.type) {
      case "File":
        return this[FILE]();
      case "Directory":
        return this[DIRECTORY]();
      case "SymbolicLink":
        return this[SYMLINK]();
      default:
        return this.end();
    }
  }
  [MODE](mode) {
    return modeFix(mode, this.type === "Directory", this.portable);
  }
  [PREFIX](path2) {
    return prefixPath(path2, this.prefix);
  }
  [HEADER]() {
    if (!this.stat) {
      throw new Error("cannot write header before stat");
    }
    if (this.type === "Directory" && this.portable) {
      this.noMtime = true;
    }
    this.header = new Header({
      path: this[PREFIX](this.path),
      linkpath: this.type === "Link" && this.linkpath !== undefined ? this[PREFIX](this.linkpath) : this.linkpath,
      mode: this[MODE](this.stat.mode),
      uid: this.portable ? undefined : this.stat.uid,
      gid: this.portable ? undefined : this.stat.gid,
      size: this.stat.size,
      mtime: this.noMtime ? undefined : this.mtime || this.stat.mtime,
      type: this.type === "Unsupported" ? undefined : this.type,
      uname: this.portable ? undefined : this.stat.uid === this.myuid ? this.myuser : "",
      atime: this.portable ? undefined : this.stat.atime,
      ctime: this.portable ? undefined : this.stat.ctime
    });
    if (this.header.encode() && !this.noPax) {
      super.write(new Pax({
        atime: this.portable ? undefined : this.header.atime,
        ctime: this.portable ? undefined : this.header.ctime,
        gid: this.portable ? undefined : this.header.gid,
        mtime: this.noMtime ? undefined : this.mtime || this.header.mtime,
        path: this[PREFIX](this.path),
        linkpath: this.type === "Link" && this.linkpath !== undefined ? this[PREFIX](this.linkpath) : this.linkpath,
        size: this.header.size,
        uid: this.portable ? undefined : this.header.uid,
        uname: this.portable ? undefined : this.header.uname,
        dev: this.portable ? undefined : this.stat.dev,
        ino: this.portable ? undefined : this.stat.ino,
        nlink: this.portable ? undefined : this.stat.nlink
      }).encode());
    }
    const block = this.header?.block;
    if (!block) {
      throw new Error("failed to encode header");
    }
    super.write(block);
  }
  [DIRECTORY]() {
    if (!this.stat) {
      throw new Error("cannot create directory entry without stat");
    }
    if (this.path.slice(-1) !== "/") {
      this.path += "/";
    }
    this.stat.size = 0;
    this[HEADER]();
    this.end();
  }
  [SYMLINK]() {
    fs3.readlink(this.absolute, (er, linkpath) => {
      if (er) {
        return this.emit("error", er);
      }
      this[ONREADLINK](linkpath);
    });
  }
  [ONREADLINK](linkpath) {
    this.linkpath = normalizeWindowsPath(linkpath);
    this[HEADER]();
    this.end();
  }
  [HARDLINK](linkpath) {
    if (!this.stat) {
      throw new Error("cannot create link entry without stat");
    }
    this.type = "Link";
    this.linkpath = normalizeWindowsPath(path.relative(this.cwd, linkpath));
    this.stat.size = 0;
    this[HEADER]();
    this.end();
  }
  [FILE]() {
    if (!this.stat) {
      throw new Error("cannot create file entry without stat");
    }
    if (this.stat.nlink > 1) {
      const linkKey = `${this.stat.dev}:${this.stat.ino}`;
      const linkpath = this.linkCache.get(linkKey);
      if (linkpath?.indexOf(this.cwd) === 0) {
        return this[HARDLINK](linkpath);
      }
      this.linkCache.set(linkKey, this.absolute);
    }
    this[HEADER]();
    if (this.stat.size === 0) {
      return this.end();
    }
    this[OPENFILE]();
  }
  [OPENFILE]() {
    fs3.open(this.absolute, "r", (er, fd) => {
      if (er) {
        return this.emit("error", er);
      }
      this[ONOPENFILE](fd);
    });
  }
  [ONOPENFILE](fd) {
    this.fd = fd;
    if (this.#hadError) {
      return this[CLOSE]();
    }
    if (!this.stat) {
      throw new Error("should stat before calling onopenfile");
    }
    this.blockLen = 512 * Math.ceil(this.stat.size / 512);
    this.blockRemain = this.blockLen;
    const bufLen = Math.min(this.blockLen, this.maxReadSize);
    this.buf = Buffer.allocUnsafe(bufLen);
    this.offset = 0;
    this.pos = 0;
    this.remain = this.stat.size;
    this.length = this.buf.length;
    this[READ2]();
  }
  [READ2]() {
    const { fd, buf, offset, length, pos: pos2 } = this;
    if (fd === undefined || buf === undefined) {
      throw new Error("cannot read file without first opening");
    }
    fs3.read(fd, buf, offset, length, pos2, (er, bytesRead) => {
      if (er) {
        return this[CLOSE](() => this.emit("error", er));
      }
      this[ONREAD](bytesRead);
    });
  }
  [CLOSE](cb = () => {
  }) {
    if (this.fd !== undefined)
      fs3.close(this.fd, cb);
  }
  [ONREAD](bytesRead) {
    if (bytesRead <= 0 && this.remain > 0) {
      const er = Object.assign(new Error("encountered unexpected EOF"), {
        path: this.absolute,
        syscall: "read",
        code: "EOF"
      });
      return this[CLOSE](() => this.emit("error", er));
    }
    if (bytesRead > this.remain) {
      const er = Object.assign(new Error("did not encounter expected EOF"), {
        path: this.absolute,
        syscall: "read",
        code: "EOF"
      });
      return this[CLOSE](() => this.emit("error", er));
    }
    if (!this.buf) {
      throw new Error("should have created buffer prior to reading");
    }
    if (bytesRead === this.remain) {
      for (let i = bytesRead;i < this.length && bytesRead < this.blockRemain; i++) {
        this.buf[i + this.offset] = 0;
        bytesRead++;
        this.remain++;
      }
    }
    const chunk = this.offset === 0 && bytesRead === this.buf.length ? this.buf : this.buf.subarray(this.offset, this.offset + bytesRead);
    const flushed = this.write(chunk);
    if (!flushed) {
      this[AWAITDRAIN](() => this[ONDRAIN]());
    } else {
      this[ONDRAIN]();
    }
  }
  [AWAITDRAIN](cb) {
    this.once("drain", cb);
  }
  write(chunk, encoding, cb) {
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = undefined;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
    }
    if (this.blockRemain < chunk.length) {
      const er = Object.assign(new Error("writing more data than expected"), {
        path: this.absolute
      });
      return this.emit("error", er);
    }
    this.remain -= chunk.length;
    this.blockRemain -= chunk.length;
    this.pos += chunk.length;
    this.offset += chunk.length;
    return super.write(chunk, null, cb);
  }
  [ONDRAIN]() {
    if (!this.remain) {
      if (this.blockRemain) {
        super.write(Buffer.alloc(this.blockRemain));
      }
      return this[CLOSE]((er) => er ? this.emit("error", er) : this.end());
    }
    if (!this.buf) {
      throw new Error("buffer lost somehow in ONDRAIN");
    }
    if (this.offset >= this.length) {
      this.buf = Buffer.allocUnsafe(Math.min(this.blockRemain, this.buf.length));
      this.offset = 0;
    }
    this.length = this.buf.length - this.offset;
    this[READ2]();
  }
}

class WriteEntrySync extends WriteEntry {
  sync = true;
  [LSTAT]() {
    this[ONLSTAT](fs3.lstatSync(this.absolute));
  }
  [SYMLINK]() {
    this[ONREADLINK](fs3.readlinkSync(this.absolute));
  }
  [OPENFILE]() {
    this[ONOPENFILE](fs3.openSync(this.absolute, "r"));
  }
  [READ2]() {
    let threw = true;
    try {
      const { fd, buf, offset, length, pos: pos2 } = this;
      if (fd === undefined || buf === undefined) {
        throw new Error("fd and buf must be set in READ method");
      }
      const bytesRead = fs3.readSync(fd, buf, offset, length, pos2);
      this[ONREAD](bytesRead);
      threw = false;
    } finally {
      if (threw) {
        try {
          this[CLOSE](() => {
          });
        } catch (er) {
        }
      }
    }
  }
  [AWAITDRAIN](cb) {
    cb();
  }
  [CLOSE](cb = () => {
  }) {
    if (this.fd !== undefined)
      fs3.closeSync(this.fd);
    cb();
  }
}

class WriteEntryTar extends Minipass {
  blockLen = 0;
  blockRemain = 0;
  buf = 0;
  pos = 0;
  remain = 0;
  length = 0;
  preservePaths;
  portable;
  strict;
  noPax;
  noMtime;
  readEntry;
  type;
  prefix;
  path;
  mode;
  uid;
  gid;
  uname;
  gname;
  header;
  mtime;
  atime;
  ctime;
  linkpath;
  size;
  warn(code2, message, data = {}) {
    return warnMethod(this, code2, message, data);
  }
  constructor(readEntry, opt_ = {}) {
    const opt = dealias(opt_);
    super();
    this.preservePaths = !!opt.preservePaths;
    this.portable = !!opt.portable;
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.noMtime = !!opt.noMtime;
    this.readEntry = readEntry;
    const { type } = readEntry;
    if (type === "Unsupported") {
      throw new Error("writing entry that should be ignored");
    }
    this.type = type;
    if (this.type === "Directory" && this.portable) {
      this.noMtime = true;
    }
    this.prefix = opt.prefix;
    this.path = normalizeWindowsPath(readEntry.path);
    this.mode = readEntry.mode !== undefined ? this[MODE](readEntry.mode) : undefined;
    this.uid = this.portable ? undefined : readEntry.uid;
    this.gid = this.portable ? undefined : readEntry.gid;
    this.uname = this.portable ? undefined : readEntry.uname;
    this.gname = this.portable ? undefined : readEntry.gname;
    this.size = readEntry.size;
    this.mtime = this.noMtime ? undefined : opt.mtime || readEntry.mtime;
    this.atime = this.portable ? undefined : readEntry.atime;
    this.ctime = this.portable ? undefined : readEntry.ctime;
    this.linkpath = readEntry.linkpath !== undefined ? normalizeWindowsPath(readEntry.linkpath) : undefined;
    if (typeof opt.onwarn === "function") {
      this.on("warn", opt.onwarn);
    }
    let pathWarn = false;
    if (!this.preservePaths) {
      const [root, stripped] = stripAbsolutePath(this.path);
      if (root && typeof stripped === "string") {
        this.path = stripped;
        pathWarn = root;
      }
    }
    this.remain = readEntry.size;
    this.blockRemain = readEntry.startBlockSize;
    this.header = new Header({
      path: this[PREFIX](this.path),
      linkpath: this.type === "Link" && this.linkpath !== undefined ? this[PREFIX](this.linkpath) : this.linkpath,
      mode: this.mode,
      uid: this.portable ? undefined : this.uid,
      gid: this.portable ? undefined : this.gid,
      size: this.size,
      mtime: this.noMtime ? undefined : this.mtime,
      type: this.type,
      uname: this.portable ? undefined : this.uname,
      atime: this.portable ? undefined : this.atime,
      ctime: this.portable ? undefined : this.ctime
    });
    if (pathWarn) {
      this.warn("TAR_ENTRY_INFO", `stripping ${pathWarn} from absolute path`, {
        entry: this,
        path: pathWarn + this.path
      });
    }
    if (this.header.encode() && !this.noPax) {
      super.write(new Pax({
        atime: this.portable ? undefined : this.atime,
        ctime: this.portable ? undefined : this.ctime,
        gid: this.portable ? undefined : this.gid,
        mtime: this.noMtime ? undefined : this.mtime,
        path: this[PREFIX](this.path),
        linkpath: this.type === "Link" && this.linkpath !== undefined ? this[PREFIX](this.linkpath) : this.linkpath,
        size: this.size,
        uid: this.portable ? undefined : this.uid,
        uname: this.portable ? undefined : this.uname,
        dev: this.portable ? undefined : this.readEntry.dev,
        ino: this.portable ? undefined : this.readEntry.ino,
        nlink: this.portable ? undefined : this.readEntry.nlink
      }).encode());
    }
    const b = this.header?.block;
    if (!b)
      throw new Error("failed to encode header");
    super.write(b);
    readEntry.pipe(this);
  }
  [PREFIX](path2) {
    return prefixPath(path2, this.prefix);
  }
  [MODE](mode) {
    return modeFix(mode, this.type === "Directory", this.portable);
  }
  write(chunk, encoding, cb) {
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = undefined;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8");
    }
    const writeLen = chunk.length;
    if (writeLen > this.blockRemain) {
      throw new Error("writing more to entry than is appropriate");
    }
    this.blockRemain -= writeLen;
    return super.write(chunk, cb);
  }
  end(chunk, encoding, cb) {
    if (this.blockRemain) {
      super.write(Buffer.alloc(this.blockRemain));
    }
    if (typeof chunk === "function") {
      cb = chunk;
      encoding = undefined;
      chunk = undefined;
    }
    if (typeof encoding === "function") {
      cb = encoding;
      encoding = undefined;
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, encoding ?? "utf8");
    }
    if (cb)
      this.once("finish", cb);
    chunk ? super.end(chunk, cb) : super.end(cb);
    return this;
  }
}
var getType = (stat) => stat.isFile() ? "File" : stat.isDirectory() ? "Directory" : stat.isSymbolicLink() ? "SymbolicLink" : "Unsupported";

// node_modules/tar/dist/esm/pack.js
import path2 from "path";
class PackJob {
  path;
  absolute;
  entry;
  stat;
  readdir;
  pending = false;
  ignore = false;
  piped = false;
  constructor(path3, absolute) {
    this.path = path3 || "./";
    this.absolute = absolute;
  }
}
var EOF2 = Buffer.alloc(1024);
var ONSTAT = Symbol("onStat");
var ENDED2 = Symbol("ended");
var QUEUE2 = Symbol("queue");
var CURRENT = Symbol("current");
var PROCESS2 = Symbol("process");
var PROCESSING = Symbol("processing");
var PROCESSJOB = Symbol("processJob");
var JOBS = Symbol("jobs");
var JOBDONE = Symbol("jobDone");
var ADDFSENTRY = Symbol("addFSEntry");
var ADDTARENTRY = Symbol("addTarEntry");
var STAT = Symbol("stat");
var READDIR = Symbol("readdir");
var ONREADDIR = Symbol("onreaddir");
var PIPE = Symbol("pipe");
var ENTRY = Symbol("entry");
var ENTRYOPT = Symbol("entryOpt");
var WRITEENTRYCLASS = Symbol("writeEntryClass");
var WRITE = Symbol("write");
var ONDRAIN2 = Symbol("ondrain");

class Pack extends Minipass {
  opt;
  cwd;
  maxReadSize;
  preservePaths;
  strict;
  noPax;
  prefix;
  linkCache;
  statCache;
  file;
  portable;
  zip;
  readdirCache;
  noDirRecurse;
  follow;
  noMtime;
  mtime;
  filter;
  jobs;
  [WRITEENTRYCLASS];
  onWriteEntry;
  [QUEUE2];
  [JOBS] = 0;
  [PROCESSING] = false;
  [ENDED2] = false;
  constructor(opt = {}) {
    super();
    this.opt = opt;
    this.file = opt.file || "";
    this.cwd = opt.cwd || process.cwd();
    this.maxReadSize = opt.maxReadSize;
    this.preservePaths = !!opt.preservePaths;
    this.strict = !!opt.strict;
    this.noPax = !!opt.noPax;
    this.prefix = normalizeWindowsPath(opt.prefix || "");
    this.linkCache = opt.linkCache || new Map;
    this.statCache = opt.statCache || new Map;
    this.readdirCache = opt.readdirCache || new Map;
    this.onWriteEntry = opt.onWriteEntry;
    this[WRITEENTRYCLASS] = WriteEntry;
    if (typeof opt.onwarn === "function") {
      this.on("warn", opt.onwarn);
    }
    this.portable = !!opt.portable;
    if (opt.gzip || opt.brotli) {
      if (opt.gzip && opt.brotli) {
        throw new TypeError("gzip and brotli are mutually exclusive");
      }
      if (opt.gzip) {
        if (typeof opt.gzip !== "object") {
          opt.gzip = {};
        }
        if (this.portable) {
          opt.gzip.portable = true;
        }
        this.zip = new Gzip(opt.gzip);
      }
      if (opt.brotli) {
        if (typeof opt.brotli !== "object") {
          opt.brotli = {};
        }
        this.zip = new BrotliCompress(opt.brotli);
      }
      if (!this.zip)
        throw new Error("impossible");
      const zip = this.zip;
      zip.on("data", (chunk) => super.write(chunk));
      zip.on("end", () => super.end());
      zip.on("drain", () => this[ONDRAIN2]());
      this.on("resume", () => zip.resume());
    } else {
      this.on("drain", this[ONDRAIN2]);
    }
    this.noDirRecurse = !!opt.noDirRecurse;
    this.follow = !!opt.follow;
    this.noMtime = !!opt.noMtime;
    if (opt.mtime)
      this.mtime = opt.mtime;
    this.filter = typeof opt.filter === "function" ? opt.filter : () => true;
    this[QUEUE2] = new Yallist;
    this[JOBS] = 0;
    this.jobs = Number(opt.jobs) || 4;
    this[PROCESSING] = false;
    this[ENDED2] = false;
  }
  [WRITE](chunk) {
    return super.write(chunk);
  }
  add(path3) {
    this.write(path3);
    return this;
  }
  end(path3) {
    if (path3) {
      this.add(path3);
    }
    this[ENDED2] = true;
    this[PROCESS2]();
    return this;
  }
  write(path3) {
    if (this[ENDED2]) {
      throw new Error("write after end");
    }
    if (path3 instanceof ReadEntry) {
      this[ADDTARENTRY](path3);
    } else {
      this[ADDFSENTRY](path3);
    }
    return this.flowing;
  }
  [ADDTARENTRY](p) {
    const absolute = normalizeWindowsPath(path2.resolve(this.cwd, p.path));
    if (!this.filter(p.path, p)) {
      p.resume();
    } else {
      const job = new PackJob(p.path, absolute);
      job.entry = new WriteEntryTar(p, this[ENTRYOPT](job));
      job.entry.on("end", () => this[JOBDONE](job));
      this[JOBS] += 1;
      this[QUEUE2].push(job);
    }
    this[PROCESS2]();
  }
  [ADDFSENTRY](p) {
    const absolute = normalizeWindowsPath(path2.resolve(this.cwd, p));
    this[QUEUE2].push(new PackJob(p, absolute));
    this[PROCESS2]();
  }
  [STAT](job) {
    job.pending = true;
    this[JOBS] += 1;
    const stat = this.follow ? "stat" : "lstat";
    fs4[stat](job.absolute, (er, stat2) => {
      job.pending = false;
      this[JOBS] -= 1;
      if (er) {
        this.emit("error", er);
      } else {
        this[ONSTAT](job, stat2);
      }
    });
  }
  [ONSTAT](job, stat) {
    this.statCache.set(job.absolute, stat);
    job.stat = stat;
    if (!this.filter(job.path, stat)) {
      job.ignore = true;
    }
    this[PROCESS2]();
  }
  [READDIR](job) {
    job.pending = true;
    this[JOBS] += 1;
    fs4.readdir(job.absolute, (er, entries) => {
      job.pending = false;
      this[JOBS] -= 1;
      if (er) {
        return this.emit("error", er);
      }
      this[ONREADDIR](job, entries);
    });
  }
  [ONREADDIR](job, entries) {
    this.readdirCache.set(job.absolute, entries);
    job.readdir = entries;
    this[PROCESS2]();
  }
  [PROCESS2]() {
    if (this[PROCESSING]) {
      return;
    }
    this[PROCESSING] = true;
    for (let w = this[QUEUE2].head;!!w && this[JOBS] < this.jobs; w = w.next) {
      this[PROCESSJOB](w.value);
      if (w.value.ignore) {
        const p = w.next;
        this[QUEUE2].removeNode(w);
        w.next = p;
      }
    }
    this[PROCESSING] = false;
    if (this[ENDED2] && !this[QUEUE2].length && this[JOBS] === 0) {
      if (this.zip) {
        this.zip.end(EOF2);
      } else {
        super.write(EOF2);
        super.end();
      }
    }
  }
  get [CURRENT]() {
    return this[QUEUE2] && this[QUEUE2].head && this[QUEUE2].head.value;
  }
  [JOBDONE](_job) {
    this[QUEUE2].shift();
    this[JOBS] -= 1;
    this[PROCESS2]();
  }
  [PROCESSJOB](job) {
    if (job.pending) {
      return;
    }
    if (job.entry) {
      if (job === this[CURRENT] && !job.piped) {
        this[PIPE](job);
      }
      return;
    }
    if (!job.stat) {
      const sc = this.statCache.get(job.absolute);
      if (sc) {
        this[ONSTAT](job, sc);
      } else {
        this[STAT](job);
      }
    }
    if (!job.stat) {
      return;
    }
    if (job.ignore) {
      return;
    }
    if (!this.noDirRecurse && job.stat.isDirectory() && !job.readdir) {
      const rc = this.readdirCache.get(job.absolute);
      if (rc) {
        this[ONREADDIR](job, rc);
      } else {
        this[READDIR](job);
      }
      if (!job.readdir) {
        return;
      }
    }
    job.entry = this[ENTRY](job);
    if (!job.entry) {
      job.ignore = true;
      return;
    }
    if (job === this[CURRENT] && !job.piped) {
      this[PIPE](job);
    }
  }
  [ENTRYOPT](job) {
    return {
      onwarn: (code2, msg, data) => this.warn(code2, msg, data),
      noPax: this.noPax,
      cwd: this.cwd,
      absolute: job.absolute,
      preservePaths: this.preservePaths,
      maxReadSize: this.maxReadSize,
      strict: this.strict,
      portable: this.portable,
      linkCache: this.linkCache,
      statCache: this.statCache,
      noMtime: this.noMtime,
      mtime: this.mtime,
      prefix: this.prefix
    };
  }
  [ENTRY](job) {
    this[JOBS] += 1;
    try {
      const e = new this[WRITEENTRYCLASS](job.path, this[ENTRYOPT](job));
      this.onWriteEntry?.(e);
      return e.on("end", () => this[JOBDONE](job)).on("error", (er) => this.emit("error", er));
    } catch (er) {
      this.emit("error", er);
    }
  }
  [ONDRAIN2]() {
    if (this[CURRENT] && this[CURRENT].entry) {
      this[CURRENT].entry.resume();
    }
  }
  [PIPE](job) {
    job.piped = true;
    if (job.readdir) {
      job.readdir.forEach((entry) => {
        const p = job.path;
        const base = p === "./" ? "" : p.replace(/\/*$/, "/");
        this[ADDFSENTRY](base + entry);
      });
    }
    const source = job.entry;
    const zip = this.zip;
    if (!source)
      throw new Error("cannot pipe without source");
    if (zip) {
      source.on("data", (chunk) => {
        if (!zip.write(chunk)) {
          source.pause();
        }
      });
    } else {
      source.on("data", (chunk) => {
        if (!super.write(chunk)) {
          source.pause();
        }
      });
    }
  }
  pause() {
    if (this.zip) {
      this.zip.pause();
    }
    return super.pause();
  }
  warn(code2, message, data = {}) {
    warnMethod(this, code2, message, data);
  }
}

class PackSync extends Pack {
  sync = true;
  constructor(opt) {
    super(opt);
    this[WRITEENTRYCLASS] = WriteEntrySync;
  }
  pause() {
  }
  resume() {
  }
  [STAT](job) {
    const stat = this.follow ? "statSync" : "lstatSync";
    this[ONSTAT](job, fs4[stat](job.absolute));
  }
  [READDIR](job) {
    this[ONREADDIR](job, fs4.readdirSync(job.absolute));
  }
  [PIPE](job) {
    const source = job.entry;
    const zip = this.zip;
    if (job.readdir) {
      job.readdir.forEach((entry) => {
        const p = job.path;
        const base = p === "./" ? "" : p.replace(/\/*$/, "/");
        this[ADDFSENTRY](base + entry);
      });
    }
    if (!source)
      throw new Error("Cannot pipe without source");
    if (zip) {
      source.on("data", (chunk) => {
        zip.write(chunk);
      });
    } else {
      source.on("data", (chunk) => {
        super[WRITE](chunk);
      });
    }
  }
}

// node_modules/tar/dist/esm/create.js
var createFileSync = (opt, files) => {
  const p = new PackSync(opt);
  const stream = new WriteStreamSync(opt.file, {
    mode: opt.mode || 438
  });
  p.pipe(stream);
  addFilesSync(p, files);
};
var createFile = (opt, files) => {
  const p = new Pack(opt);
  const stream = new WriteStream(opt.file, {
    mode: opt.mode || 438
  });
  p.pipe(stream);
  const promise = new Promise((res, rej) => {
    stream.on("error", rej);
    stream.on("close", res);
    p.on("error", rej);
  });
  addFilesAsync(p, files);
  return promise;
};
var addFilesSync = (p, files) => {
  files.forEach((file) => {
    if (file.charAt(0) === "@") {
      list({
        file: path3.resolve(p.cwd, file.slice(1)),
        sync: true,
        noResume: true,
        onReadEntry: (entry) => p.add(entry)
      });
    } else {
      p.add(file);
    }
  });
  p.end();
};
var addFilesAsync = async (p, files) => {
  for (let i = 0;i < files.length; i++) {
    const file = String(files[i]);
    if (file.charAt(0) === "@") {
      await list({
        file: path3.resolve(String(p.cwd), file.slice(1)),
        noResume: true,
        onReadEntry: (entry) => {
          p.add(entry);
        }
      });
    } else {
      p.add(file);
    }
  }
  p.end();
};
var createSync = (opt, files) => {
  const p = new PackSync(opt);
  addFilesSync(p, files);
  return p;
};
var createAsync = (opt, files) => {
  const p = new Pack(opt);
  addFilesAsync(p, files);
  return p;
};
var create = makeCommand(createFileSync, createFile, createSync, createAsync, (_opt, files) => {
  if (!files?.length) {
    throw new TypeError("no paths specified to add to archive");
  }
});
// node_modules/tar/dist/esm/extract.js
import fs9 from "node:fs";

// node_modules/tar/dist/esm/unpack.js
import assert2 from "node:assert";
import {randomBytes} from "node:crypto";
import fs8 from "node:fs";
import path6 from "node:path";

// node_modules/tar/dist/esm/get-write-flag.js
import fs5 from "fs";
var platform2 = process.env.__FAKE_PLATFORM__ || process.platform;
var isWindows = platform2 === "win32";
var { O_CREAT, O_TRUNC, O_WRONLY } = fs5.constants;
var UV_FS_O_FILEMAP = Number(process.env.__FAKE_FS_O_FILENAME__) || fs5.constants.UV_FS_O_FILEMAP || 0;
var fMapEnabled = isWindows && !!UV_FS_O_FILEMAP;
var fMapLimit = 512 * 1024;
var fMapFlag = UV_FS_O_FILEMAP | O_TRUNC | O_CREAT | O_WRONLY;
var getWriteFlag = !fMapEnabled ? () => "w" : (size) => size < fMapLimit ? fMapFlag : "w";

// node_modules/chownr/dist/esm/index.js
import fs6 from "node:fs";
import path4 from "node:path";
var lchownSync = (path5, uid, gid) => {
  try {
    return fs6.lchownSync(path5, uid, gid);
  } catch (er) {
    if (er?.code !== "ENOENT")
      throw er;
  }
};
var chown = (cpath, uid, gid, cb) => {
  fs6.lchown(cpath, uid, gid, (er) => {
    cb(er && er?.code !== "ENOENT" ? er : null);
  });
};
var chownrKid = (p, child, uid, gid, cb) => {
  if (child.isDirectory()) {
    chownr(path4.resolve(p, child.name), uid, gid, (er) => {
      if (er)
        return cb(er);
      const cpath = path4.resolve(p, child.name);
      chown(cpath, uid, gid, cb);
    });
  } else {
    const cpath = path4.resolve(p, child.name);
    chown(cpath, uid, gid, cb);
  }
};
var chownr = (p, uid, gid, cb) => {
  fs6.readdir(p, { withFileTypes: true }, (er, children) => {
    if (er) {
      if (er.code === "ENOENT")
        return cb();
      else if (er.code !== "ENOTDIR" && er.code !== "ENOTSUP")
        return cb(er);
    }
    if (er || !children.length)
      return chown(p, uid, gid, cb);
    let len = children.length;
    let errState = null;
    const then = (er2) => {
      if (errState)
        return;
      if (er2)
        return cb(errState = er2);
      if (--len === 0)
        return chown(p, uid, gid, cb);
    };
    for (const child of children) {
      chownrKid(p, child, uid, gid, then);
    }
  });
};
var chownrKidSync = (p, child, uid, gid) => {
  if (child.isDirectory())
    chownrSync(path4.resolve(p, child.name), uid, gid);
  lchownSync(path4.resolve(p, child.name), uid, gid);
};
var chownrSync = (p, uid, gid) => {
  let children;
  try {
    children = fs6.readdirSync(p, { withFileTypes: true });
  } catch (er) {
    const e = er;
    if (e?.code === "ENOENT")
      return;
    else if (e?.code === "ENOTDIR" || e?.code === "ENOTSUP")
      return lchownSync(p, uid, gid);
    else
      throw e;
  }
  for (const child of children) {
    chownrKidSync(p, child, uid, gid);
  }
  return lchownSync(p, uid, gid);
};

// node_modules/tar/dist/esm/mkdir.js
import fs7 from "fs";

// node_modules/mkdirp/dist/mjs/mkdirp-manual.js
import {dirname as dirname2} from "path";

// node_modules/mkdirp/dist/mjs/opts-arg.js
import {mkdir, mkdirSync, stat, statSync} from "fs";
var optsArg = (opts) => {
  if (!opts) {
    opts = { mode: 511 };
  } else if (typeof opts === "object") {
    opts = { mode: 511, ...opts };
  } else if (typeof opts === "number") {
    opts = { mode: opts };
  } else if (typeof opts === "string") {
    opts = { mode: parseInt(opts, 8) };
  } else {
    throw new TypeError("invalid options argument");
  }
  const resolved = opts;
  const optsFs = opts.fs || {};
  opts.mkdir = opts.mkdir || optsFs.mkdir || mkdir;
  opts.mkdirAsync = opts.mkdirAsync ? opts.mkdirAsync : async (path5, options3) => {
    return new Promise((res, rej) => resolved.mkdir(path5, options3, (er, made) => er ? rej(er) : res(made)));
  };
  opts.stat = opts.stat || optsFs.stat || stat;
  opts.statAsync = opts.statAsync ? opts.statAsync : async (path5) => new Promise((res, rej) => resolved.stat(path5, (err, stats) => err ? rej(err) : res(stats)));
  opts.statSync = opts.statSync || optsFs.statSync || statSync;
  opts.mkdirSync = opts.mkdirSync || optsFs.mkdirSync || mkdirSync;
  return resolved;
};

// node_modules/mkdirp/dist/mjs/mkdirp-manual.js
var mkdirpManualSync = (path5, options3, made) => {
  const parent = dirname2(path5);
  const opts = { ...optsArg(options3), recursive: false };
  if (parent === path5) {
    try {
      return opts.mkdirSync(path5, opts);
    } catch (er) {
      const fer = er;
      if (fer && fer.code !== "EISDIR") {
        throw er;
      }
      return;
    }
  }
  try {
    opts.mkdirSync(path5, opts);
    return made || path5;
  } catch (er) {
    const fer = er;
    if (fer && fer.code === "ENOENT") {
      return mkdirpManualSync(path5, opts, mkdirpManualSync(parent, opts, made));
    }
    if (fer && fer.code !== "EEXIST" && fer && fer.code !== "EROFS") {
      throw er;
    }
    try {
      if (!opts.statSync(path5).isDirectory())
        throw er;
    } catch (_) {
      throw er;
    }
  }
};
var mkdirpManual = Object.assign(async (path5, options3, made) => {
  const opts = optsArg(options3);
  opts.recursive = false;
  const parent = dirname2(path5);
  if (parent === path5) {
    return opts.mkdirAsync(path5, opts).catch((er) => {
      const fer = er;
      if (fer && fer.code !== "EISDIR") {
        throw er;
      }
    });
  }
  return opts.mkdirAsync(path5, opts).then(() => made || path5, async (er) => {
    const fer = er;
    if (fer && fer.code === "ENOENT") {
      return mkdirpManual(parent, opts).then((made2) => mkdirpManual(path5, opts, made2));
    }
    if (fer && fer.code !== "EEXIST" && fer.code !== "EROFS") {
      throw er;
    }
    return opts.statAsync(path5).then((st) => {
      if (st.isDirectory()) {
        return made;
      } else {
        throw er;
      }
    }, () => {
      throw er;
    });
  });
}, { sync: mkdirpManualSync });

// node_modules/mkdirp/dist/mjs/mkdirp-native.js
import {dirname as dirname4} from "path";

// node_modules/mkdirp/dist/mjs/find-made.js
import {dirname as dirname3} from "path";
var findMade = async (opts, parent, path5) => {
  if (path5 === parent) {
    return;
  }
  return opts.statAsync(parent).then((st) => st.isDirectory() ? path5 : undefined, (er) => {
    const fer = er;
    return fer && fer.code === "ENOENT" ? findMade(opts, dirname3(parent), parent) : undefined;
  });
};
var findMadeSync = (opts, parent, path5) => {
  if (path5 === parent) {
    return;
  }
  try {
    return opts.statSync(parent).isDirectory() ? path5 : undefined;
  } catch (er) {
    const fer = er;
    return fer && fer.code === "ENOENT" ? findMadeSync(opts, dirname3(parent), parent) : undefined;
  }
};

// node_modules/mkdirp/dist/mjs/mkdirp-native.js
var mkdirpNativeSync = (path5, options3) => {
  const opts = optsArg(options3);
  opts.recursive = true;
  const parent = dirname4(path5);
  if (parent === path5) {
    return opts.mkdirSync(path5, opts);
  }
  const made = findMadeSync(opts, path5);
  try {
    opts.mkdirSync(path5, opts);
    return made;
  } catch (er) {
    const fer = er;
    if (fer && fer.code === "ENOENT") {
      return mkdirpManualSync(path5, opts);
    } else {
      throw er;
    }
  }
};
var mkdirpNative = Object.assign(async (path5, options3) => {
  const opts = { ...optsArg(options3), recursive: true };
  const parent = dirname4(path5);
  if (parent === path5) {
    return await opts.mkdirAsync(path5, opts);
  }
  return findMade(opts, path5).then((made) => opts.mkdirAsync(path5, opts).then((m) => made || m).catch((er) => {
    const fer = er;
    if (fer && fer.code === "ENOENT") {
      return mkdirpManual(path5, opts);
    } else {
      throw er;
    }
  }));
}, { sync: mkdirpNativeSync });

// node_modules/mkdirp/dist/mjs/path-arg.js
import {parse as parse5, resolve} from "path";
var platform3 = process.env.__TESTING_MKDIRP_PLATFORM__ || process.platform;
var pathArg = (path5) => {
  if (/\0/.test(path5)) {
    throw Object.assign(new TypeError("path must be a string without null bytes"), {
      path: path5,
      code: "ERR_INVALID_ARG_VALUE"
    });
  }
  path5 = resolve(path5);
  if (platform3 === "win32") {
    const badWinChars = /[*|"<>?:]/;
    const { root } = parse5(path5);
    if (badWinChars.test(path5.substring(root.length))) {
      throw Object.assign(new Error("Illegal characters in path."), {
        path: path5,
        code: "EINVAL"
      });
    }
  }
  return path5;
};

// node_modules/mkdirp/dist/mjs/use-native.js
import {mkdir as mkdir2, mkdirSync as mkdirSync2} from "fs";
var version = process.env.__TESTING_MKDIRP_NODE_VERSION__ || process.version;
var versArr = version.replace(/^v/, "").split(".");
var hasNative = +versArr[0] > 10 || +versArr[0] === 10 && +versArr[1] >= 12;
var useNativeSync = !hasNative ? () => false : (opts) => optsArg(opts).mkdirSync === mkdirSync2;
var useNative = Object.assign(!hasNative ? () => false : (opts) => optsArg(opts).mkdir === mkdir2, {
  sync: useNativeSync
});

// node_modules/mkdirp/dist/mjs/index.js
var mkdirpSync = (path5, opts) => {
  path5 = pathArg(path5);
  const resolved = optsArg(opts);
  return useNativeSync(resolved) ? mkdirpNativeSync(path5, resolved) : mkdirpManualSync(path5, resolved);
};
var mkdirp = Object.assign(async (path5, opts) => {
  path5 = pathArg(path5);
  const resolved = optsArg(opts);
  return useNative(resolved) ? mkdirpNative(path5, resolved) : mkdirpManual(path5, resolved);
}, {
  mkdirpSync,
  mkdirpNative,
  mkdirpNativeSync,
  mkdirpManual,
  mkdirpManualSync,
  sync: mkdirpSync,
  native: mkdirpNative,
  nativeSync: mkdirpNativeSync,
  manual: mkdirpManual,
  manualSync: mkdirpManualSync,
  useNative,
  useNativeSync
});

// node_modules/tar/dist/esm/mkdir.js
import path5 from "node:path";

// node_modules/tar/dist/esm/cwd-error.js
class CwdError extends Error {
  path;
  code;
  syscall = "chdir";
  constructor(path5, code2) {
    super(`${code2}: Cannot cd into '${path5}'`);
    this.path = path5;
    this.code = code2;
  }
  get name() {
    return "CwdError";
  }
}

// node_modules/tar/dist/esm/symlink-error.js
class SymlinkError extends Error {
  path;
  symlink;
  syscall = "symlink";
  code = "TAR_SYMLINK_ERROR";
  constructor(symlink, path5) {
    super("TAR_SYMLINK_ERROR: Cannot extract through symbolic link");
    this.symlink = symlink;
    this.path = path5;
  }
  get name() {
    return "SymlinkError";
  }
}

// node_modules/tar/dist/esm/mkdir.js
var cGet = (cache, key) => cache.get(normalizeWindowsPath(key));
var cSet = (cache, key, val) => cache.set(normalizeWindowsPath(key), val);
var checkCwd = (dir, cb) => {
  fs7.stat(dir, (er, st) => {
    if (er || !st.isDirectory()) {
      er = new CwdError(dir, er?.code || "ENOTDIR");
    }
    cb(er);
  });
};
var mkdir3 = (dir, opt, cb) => {
  dir = normalizeWindowsPath(dir);
  const umask = opt.umask ?? 18;
  const mode = opt.mode | 448;
  const needChmod = (mode & umask) !== 0;
  const uid = opt.uid;
  const gid = opt.gid;
  const doChown = typeof uid === "number" && typeof gid === "number" && (uid !== opt.processUid || gid !== opt.processGid);
  const preserve = opt.preserve;
  const unlink = opt.unlink;
  const cache = opt.cache;
  const cwd = normalizeWindowsPath(opt.cwd);
  const done = (er, created) => {
    if (er) {
      cb(er);
    } else {
      cSet(cache, dir, true);
      if (created && doChown) {
        chownr(created, uid, gid, (er2) => done(er2));
      } else if (needChmod) {
        fs7.chmod(dir, mode, cb);
      } else {
        cb();
      }
    }
  };
  if (cache && cGet(cache, dir) === true) {
    return done();
  }
  if (dir === cwd) {
    return checkCwd(dir, done);
  }
  if (preserve) {
    return mkdirp(dir, { mode }).then((made) => done(null, made ?? undefined), done);
  }
  const sub = normalizeWindowsPath(path5.relative(cwd, dir));
  const parts = sub.split("/");
  mkdir_(cwd, parts, mode, cache, unlink, cwd, undefined, done);
};
var mkdir_ = (base, parts, mode, cache, unlink, cwd, created, cb) => {
  if (!parts.length) {
    return cb(null, created);
  }
  const p = parts.shift();
  const part = normalizeWindowsPath(path5.resolve(base + "/" + p));
  if (cGet(cache, part)) {
    return mkdir_(part, parts, mode, cache, unlink, cwd, created, cb);
  }
  fs7.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cwd, created, cb));
};
var onmkdir = (part, parts, mode, cache, unlink, cwd, created, cb) => (er) => {
  if (er) {
    fs7.lstat(part, (statEr, st) => {
      if (statEr) {
        statEr.path = statEr.path && normalizeWindowsPath(statEr.path);
        cb(statEr);
      } else if (st.isDirectory()) {
        mkdir_(part, parts, mode, cache, unlink, cwd, created, cb);
      } else if (unlink) {
        fs7.unlink(part, (er2) => {
          if (er2) {
            return cb(er2);
          }
          fs7.mkdir(part, mode, onmkdir(part, parts, mode, cache, unlink, cwd, created, cb));
        });
      } else if (st.isSymbolicLink()) {
        return cb(new SymlinkError(part, part + "/" + parts.join("/")));
      } else {
        cb(er);
      }
    });
  } else {
    created = created || part;
    mkdir_(part, parts, mode, cache, unlink, cwd, created, cb);
  }
};
var checkCwdSync = (dir) => {
  let ok = false;
  let code2 = undefined;
  try {
    ok = fs7.statSync(dir).isDirectory();
  } catch (er) {
    code2 = er?.code;
  } finally {
    if (!ok) {
      throw new CwdError(dir, code2 ?? "ENOTDIR");
    }
  }
};
var mkdirSync3 = (dir, opt) => {
  dir = normalizeWindowsPath(dir);
  const umask = opt.umask ?? 18;
  const mode = opt.mode | 448;
  const needChmod = (mode & umask) !== 0;
  const uid = opt.uid;
  const gid = opt.gid;
  const doChown = typeof uid === "number" && typeof gid === "number" && (uid !== opt.processUid || gid !== opt.processGid);
  const preserve = opt.preserve;
  const unlink = opt.unlink;
  const cache = opt.cache;
  const cwd = normalizeWindowsPath(opt.cwd);
  const done = (created2) => {
    cSet(cache, dir, true);
    if (created2 && doChown) {
      chownrSync(created2, uid, gid);
    }
    if (needChmod) {
      fs7.chmodSync(dir, mode);
    }
  };
  if (cache && cGet(cache, dir) === true) {
    return done();
  }
  if (dir === cwd) {
    checkCwdSync(cwd);
    return done();
  }
  if (preserve) {
    return done(mkdirpSync(dir, mode) ?? undefined);
  }
  const sub = normalizeWindowsPath(path5.relative(cwd, dir));
  const parts = sub.split("/");
  let created = undefined;
  for (let p = parts.shift(), part = cwd;p && (part += "/" + p); p = parts.shift()) {
    part = normalizeWindowsPath(path5.resolve(part));
    if (cGet(cache, part)) {
      continue;
    }
    try {
      fs7.mkdirSync(part, mode);
      created = created || part;
      cSet(cache, part, true);
    } catch (er) {
      const st = fs7.lstatSync(part);
      if (st.isDirectory()) {
        cSet(cache, part, true);
        continue;
      } else if (unlink) {
        fs7.unlinkSync(part);
        fs7.mkdirSync(part, mode);
        created = created || part;
        cSet(cache, part, true);
        continue;
      } else if (st.isSymbolicLink()) {
        return new SymlinkError(part, part + "/" + parts.join("/"));
      }
    }
  }
  return done(created);
};

// node_modules/tar/dist/esm/normalize-unicode.js
var normalizeCache = Object.create(null);
var { hasOwnProperty } = Object.prototype;
var normalizeUnicode = (s) => {
  if (!hasOwnProperty.call(normalizeCache, s)) {
    normalizeCache[s] = s.normalize("NFD");
  }
  return normalizeCache[s];
};

// node_modules/tar/dist/esm/path-reservations.js
import {join} from "node:path";
var platform4 = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var isWindows2 = platform4 === "win32";
var getDirs = (path6) => {
  const dirs = path6.split("/").slice(0, -1).reduce((set, path7) => {
    const s = set[set.length - 1];
    if (s !== undefined) {
      path7 = join(s, path7);
    }
    set.push(path7 || "/");
    return set;
  }, []);
  return dirs;
};

class PathReservations {
  #queues = new Map;
  #reservations = new Map;
  #running = new Set;
  reserve(paths, fn) {
    paths = isWindows2 ? ["win32 parallelization disabled"] : paths.map((p) => {
      return stripTrailingSlashes(join(normalizeUnicode(p))).toLowerCase();
    });
    const dirs = new Set(paths.map((path6) => getDirs(path6)).reduce((a, b) => a.concat(b)));
    this.#reservations.set(fn, { dirs, paths });
    for (const p of paths) {
      const q = this.#queues.get(p);
      if (!q) {
        this.#queues.set(p, [fn]);
      } else {
        q.push(fn);
      }
    }
    for (const dir of dirs) {
      const q = this.#queues.get(dir);
      if (!q) {
        this.#queues.set(dir, [new Set([fn])]);
      } else {
        const l = q[q.length - 1];
        if (l instanceof Set) {
          l.add(fn);
        } else {
          q.push(new Set([fn]));
        }
      }
    }
    return this.#run(fn);
  }
  #getQueues(fn) {
    const res = this.#reservations.get(fn);
    if (!res) {
      throw new Error("function does not have any path reservations");
    }
    return {
      paths: res.paths.map((path6) => this.#queues.get(path6)),
      dirs: [...res.dirs].map((path6) => this.#queues.get(path6))
    };
  }
  check(fn) {
    const { paths, dirs } = this.#getQueues(fn);
    return paths.every((q) => q && q[0] === fn) && dirs.every((q) => q && q[0] instanceof Set && q[0].has(fn));
  }
  #run(fn) {
    if (this.#running.has(fn) || !this.check(fn)) {
      return false;
    }
    this.#running.add(fn);
    fn(() => this.#clear(fn));
    return true;
  }
  #clear(fn) {
    if (!this.#running.has(fn)) {
      return false;
    }
    const res = this.#reservations.get(fn);
    if (!res) {
      throw new Error("invalid reservation");
    }
    const { paths, dirs } = res;
    const next = new Set;
    for (const path6 of paths) {
      const q = this.#queues.get(path6);
      if (!q || q?.[0] !== fn) {
        continue;
      }
      const q0 = q[1];
      if (!q0) {
        this.#queues.delete(path6);
        continue;
      }
      q.shift();
      if (typeof q0 === "function") {
        next.add(q0);
      } else {
        for (const f of q0) {
          next.add(f);
        }
      }
    }
    for (const dir of dirs) {
      const q = this.#queues.get(dir);
      const q0 = q?.[0];
      if (!q || !(q0 instanceof Set))
        continue;
      if (q0.size === 1 && q.length === 1) {
        this.#queues.delete(dir);
        continue;
      } else if (q0.size === 1) {
        q.shift();
        const n = q[0];
        if (typeof n === "function") {
          next.add(n);
        }
      } else {
        q0.delete(fn);
      }
    }
    this.#running.delete(fn);
    next.forEach((fn2) => this.#run(fn2));
    return true;
  }
}

// node_modules/tar/dist/esm/unpack.js
var ONENTRY = Symbol("onEntry");
var CHECKFS = Symbol("checkFs");
var CHECKFS2 = Symbol("checkFs2");
var PRUNECACHE = Symbol("pruneCache");
var ISREUSABLE = Symbol("isReusable");
var MAKEFS = Symbol("makeFs");
var FILE2 = Symbol("file");
var DIRECTORY2 = Symbol("directory");
var LINK = Symbol("link");
var SYMLINK2 = Symbol("symlink");
var HARDLINK2 = Symbol("hardlink");
var UNSUPPORTED = Symbol("unsupported");
var CHECKPATH = Symbol("checkPath");
var MKDIR = Symbol("mkdir");
var ONERROR = Symbol("onError");
var PENDING = Symbol("pending");
var PEND = Symbol("pend");
var UNPEND = Symbol("unpend");
var ENDED3 = Symbol("ended");
var MAYBECLOSE = Symbol("maybeClose");
var SKIP = Symbol("skip");
var DOCHOWN = Symbol("doChown");
var UID = Symbol("uid");
var GID = Symbol("gid");
var CHECKED_CWD = Symbol("checkedCwd");
var platform5 = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var isWindows3 = platform5 === "win32";
var DEFAULT_MAX_DEPTH = 1024;
var unlinkFile = (path7, cb) => {
  if (!isWindows3) {
    return fs8.unlink(path7, cb);
  }
  const name2 = path7 + ".DELETE." + randomBytes(16).toString("hex");
  fs8.rename(path7, name2, (er) => {
    if (er) {
      return cb(er);
    }
    fs8.unlink(name2, cb);
  });
};
var unlinkFileSync = (path7) => {
  if (!isWindows3) {
    return fs8.unlinkSync(path7);
  }
  const name2 = path7 + ".DELETE." + randomBytes(16).toString("hex");
  fs8.renameSync(path7, name2);
  fs8.unlinkSync(name2);
};
var uint32 = (a, b, c) => a !== undefined && a === a >>> 0 ? a : b !== undefined && b === b >>> 0 ? b : c;
var cacheKeyNormalize = (path7) => stripTrailingSlashes(normalizeWindowsPath(normalizeUnicode(path7))).toLowerCase();
var pruneCache = (cache, abs) => {
  abs = cacheKeyNormalize(abs);
  for (const path7 of cache.keys()) {
    const pnorm = cacheKeyNormalize(path7);
    if (pnorm === abs || pnorm.indexOf(abs + "/") === 0) {
      cache.delete(path7);
    }
  }
};
var dropCache = (cache) => {
  for (const key of cache.keys()) {
    cache.delete(key);
  }
};

class Unpack extends Parser {
  [ENDED3] = false;
  [CHECKED_CWD] = false;
  [PENDING] = 0;
  reservations = new PathReservations;
  transform;
  writable = true;
  readable = false;
  dirCache;
  uid;
  gid;
  setOwner;
  preserveOwner;
  processGid;
  processUid;
  maxDepth;
  forceChown;
  win32;
  newer;
  keep;
  noMtime;
  preservePaths;
  unlink;
  cwd;
  strip;
  processUmask;
  umask;
  dmode;
  fmode;
  chmod;
  constructor(opt = {}) {
    opt.ondone = () => {
      this[ENDED3] = true;
      this[MAYBECLOSE]();
    };
    super(opt);
    this.transform = opt.transform;
    this.dirCache = opt.dirCache || new Map;
    this.chmod = !!opt.chmod;
    if (typeof opt.uid === "number" || typeof opt.gid === "number") {
      if (typeof opt.uid !== "number" || typeof opt.gid !== "number") {
        throw new TypeError("cannot set owner without number uid and gid");
      }
      if (opt.preserveOwner) {
        throw new TypeError("cannot preserve owner in archive and also set owner explicitly");
      }
      this.uid = opt.uid;
      this.gid = opt.gid;
      this.setOwner = true;
    } else {
      this.uid = undefined;
      this.gid = undefined;
      this.setOwner = false;
    }
    if (opt.preserveOwner === undefined && typeof opt.uid !== "number") {
      this.preserveOwner = !!(process.getuid && process.getuid() === 0);
    } else {
      this.preserveOwner = !!opt.preserveOwner;
    }
    this.processUid = (this.preserveOwner || this.setOwner) && process.getuid ? process.getuid() : undefined;
    this.processGid = (this.preserveOwner || this.setOwner) && process.getgid ? process.getgid() : undefined;
    this.maxDepth = typeof opt.maxDepth === "number" ? opt.maxDepth : DEFAULT_MAX_DEPTH;
    this.forceChown = opt.forceChown === true;
    this.win32 = !!opt.win32 || isWindows3;
    this.newer = !!opt.newer;
    this.keep = !!opt.keep;
    this.noMtime = !!opt.noMtime;
    this.preservePaths = !!opt.preservePaths;
    this.unlink = !!opt.unlink;
    this.cwd = normalizeWindowsPath(path6.resolve(opt.cwd || process.cwd()));
    this.strip = Number(opt.strip) || 0;
    this.processUmask = !this.chmod ? 0 : typeof opt.processUmask === "number" ? opt.processUmask : process.umask();
    this.umask = typeof opt.umask === "number" ? opt.umask : this.processUmask;
    this.dmode = opt.dmode || 511 & ~this.umask;
    this.fmode = opt.fmode || 438 & ~this.umask;
    this.on("entry", (entry) => this[ONENTRY](entry));
  }
  warn(code2, msg, data = {}) {
    if (code2 === "TAR_BAD_ARCHIVE" || code2 === "TAR_ABORT") {
      data.recoverable = false;
    }
    return super.warn(code2, msg, data);
  }
  [MAYBECLOSE]() {
    if (this[ENDED3] && this[PENDING] === 0) {
      this.emit("prefinish");
      this.emit("finish");
      this.emit("end");
    }
  }
  [CHECKPATH](entry) {
    const p = normalizeWindowsPath(entry.path);
    const parts = p.split("/");
    if (this.strip) {
      if (parts.length < this.strip) {
        return false;
      }
      if (entry.type === "Link") {
        const linkparts = normalizeWindowsPath(String(entry.linkpath)).split("/");
        if (linkparts.length >= this.strip) {
          entry.linkpath = linkparts.slice(this.strip).join("/");
        } else {
          return false;
        }
      }
      parts.splice(0, this.strip);
      entry.path = parts.join("/");
    }
    if (isFinite(this.maxDepth) && parts.length > this.maxDepth) {
      this.warn("TAR_ENTRY_ERROR", "path excessively deep", {
        entry,
        path: p,
        depth: parts.length,
        maxDepth: this.maxDepth
      });
      return false;
    }
    if (!this.preservePaths) {
      if (parts.includes("..") || isWindows3 && /^[a-z]:\.\.$/i.test(parts[0] ?? "")) {
        this.warn("TAR_ENTRY_ERROR", `path contains '..'`, {
          entry,
          path: p
        });
        return false;
      }
      const [root, stripped] = stripAbsolutePath(p);
      if (root) {
        entry.path = String(stripped);
        this.warn("TAR_ENTRY_INFO", `stripping ${root} from absolute path`, {
          entry,
          path: p
        });
      }
    }
    if (path6.isAbsolute(entry.path)) {
      entry.absolute = normalizeWindowsPath(path6.resolve(entry.path));
    } else {
      entry.absolute = normalizeWindowsPath(path6.resolve(this.cwd, entry.path));
    }
    if (!this.preservePaths && typeof entry.absolute === "string" && entry.absolute.indexOf(this.cwd + "/") !== 0 && entry.absolute !== this.cwd) {
      this.warn("TAR_ENTRY_ERROR", "path escaped extraction target", {
        entry,
        path: normalizeWindowsPath(entry.path),
        resolvedPath: entry.absolute,
        cwd: this.cwd
      });
      return false;
    }
    if (entry.absolute === this.cwd && entry.type !== "Directory" && entry.type !== "GNUDumpDir") {
      return false;
    }
    if (this.win32) {
      const { root: aRoot } = path6.win32.parse(String(entry.absolute));
      entry.absolute = aRoot + encode2(String(entry.absolute).slice(aRoot.length));
      const { root: pRoot } = path6.win32.parse(entry.path);
      entry.path = pRoot + encode2(entry.path.slice(pRoot.length));
    }
    return true;
  }
  [ONENTRY](entry) {
    if (!this[CHECKPATH](entry)) {
      return entry.resume();
    }
    assert2.equal(typeof entry.absolute, "string");
    switch (entry.type) {
      case "Directory":
      case "GNUDumpDir":
        if (entry.mode) {
          entry.mode = entry.mode | 448;
        }
      case "File":
      case "OldFile":
      case "ContiguousFile":
      case "Link":
      case "SymbolicLink":
        return this[CHECKFS](entry);
      case "CharacterDevice":
      case "BlockDevice":
      case "FIFO":
      default:
        return this[UNSUPPORTED](entry);
    }
  }
  [ONERROR](er, entry) {
    if (er.name === "CwdError") {
      this.emit("error", er);
    } else {
      this.warn("TAR_ENTRY_ERROR", er, { entry });
      this[UNPEND]();
      entry.resume();
    }
  }
  [MKDIR](dir, mode, cb) {
    mkdir3(normalizeWindowsPath(dir), {
      uid: this.uid,
      gid: this.gid,
      processUid: this.processUid,
      processGid: this.processGid,
      umask: this.processUmask,
      preserve: this.preservePaths,
      unlink: this.unlink,
      cache: this.dirCache,
      cwd: this.cwd,
      mode
    }, cb);
  }
  [DOCHOWN](entry) {
    return this.forceChown || this.preserveOwner && (typeof entry.uid === "number" && entry.uid !== this.processUid || typeof entry.gid === "number" && entry.gid !== this.processGid) || typeof this.uid === "number" && this.uid !== this.processUid || typeof this.gid === "number" && this.gid !== this.processGid;
  }
  [UID](entry) {
    return uint32(this.uid, entry.uid, this.processUid);
  }
  [GID](entry) {
    return uint32(this.gid, entry.gid, this.processGid);
  }
  [FILE2](entry, fullyDone) {
    const mode = typeof entry.mode === "number" ? entry.mode & 4095 : this.fmode;
    const stream = new WriteStream(String(entry.absolute), {
      flags: getWriteFlag(entry.size),
      mode,
      autoClose: false
    });
    stream.on("error", (er) => {
      if (stream.fd) {
        fs8.close(stream.fd, () => {
        });
      }
      stream.write = () => true;
      this[ONERROR](er, entry);
      fullyDone();
    });
    let actions = 1;
    const done = (er) => {
      if (er) {
        if (stream.fd) {
          fs8.close(stream.fd, () => {
          });
        }
        this[ONERROR](er, entry);
        fullyDone();
        return;
      }
      if (--actions === 0) {
        if (stream.fd !== undefined) {
          fs8.close(stream.fd, (er2) => {
            if (er2) {
              this[ONERROR](er2, entry);
            } else {
              this[UNPEND]();
            }
            fullyDone();
          });
        }
      }
    };
    stream.on("finish", () => {
      const abs = String(entry.absolute);
      const fd = stream.fd;
      if (typeof fd === "number" && entry.mtime && !this.noMtime) {
        actions++;
        const atime = entry.atime || new Date;
        const mtime = entry.mtime;
        fs8.futimes(fd, atime, mtime, (er) => er ? fs8.utimes(abs, atime, mtime, (er2) => done(er2 && er)) : done());
      }
      if (typeof fd === "number" && this[DOCHOWN](entry)) {
        actions++;
        const uid = this[UID](entry);
        const gid = this[GID](entry);
        if (typeof uid === "number" && typeof gid === "number") {
          fs8.fchown(fd, uid, gid, (er) => er ? fs8.chown(abs, uid, gid, (er2) => done(er2 && er)) : done());
        }
      }
      done();
    });
    const tx = this.transform ? this.transform(entry) || entry : entry;
    if (tx !== entry) {
      tx.on("error", (er) => {
        this[ONERROR](er, entry);
        fullyDone();
      });
      entry.pipe(tx);
    }
    tx.pipe(stream);
  }
  [DIRECTORY2](entry, fullyDone) {
    const mode = typeof entry.mode === "number" ? entry.mode & 4095 : this.dmode;
    this[MKDIR](String(entry.absolute), mode, (er) => {
      if (er) {
        this[ONERROR](er, entry);
        fullyDone();
        return;
      }
      let actions = 1;
      const done = () => {
        if (--actions === 0) {
          fullyDone();
          this[UNPEND]();
          entry.resume();
        }
      };
      if (entry.mtime && !this.noMtime) {
        actions++;
        fs8.utimes(String(entry.absolute), entry.atime || new Date, entry.mtime, done);
      }
      if (this[DOCHOWN](entry)) {
        actions++;
        fs8.chown(String(entry.absolute), Number(this[UID](entry)), Number(this[GID](entry)), done);
      }
      done();
    });
  }
  [UNSUPPORTED](entry) {
    entry.unsupported = true;
    this.warn("TAR_ENTRY_UNSUPPORTED", `unsupported entry type: ${entry.type}`, { entry });
    entry.resume();
  }
  [SYMLINK2](entry, done) {
    this[LINK](entry, String(entry.linkpath), "symlink", done);
  }
  [HARDLINK2](entry, done) {
    const linkpath = normalizeWindowsPath(path6.resolve(this.cwd, String(entry.linkpath)));
    this[LINK](entry, linkpath, "link", done);
  }
  [PEND]() {
    this[PENDING]++;
  }
  [UNPEND]() {
    this[PENDING]--;
    this[MAYBECLOSE]();
  }
  [SKIP](entry) {
    this[UNPEND]();
    entry.resume();
  }
  [ISREUSABLE](entry, st) {
    return entry.type === "File" && !this.unlink && st.isFile() && st.nlink <= 1 && !isWindows3;
  }
  [CHECKFS](entry) {
    this[PEND]();
    const paths = [entry.path];
    if (entry.linkpath) {
      paths.push(entry.linkpath);
    }
    this.reservations.reserve(paths, (done) => this[CHECKFS2](entry, done));
  }
  [PRUNECACHE](entry) {
    if (entry.type === "SymbolicLink") {
      dropCache(this.dirCache);
    } else if (entry.type !== "Directory") {
      pruneCache(this.dirCache, String(entry.absolute));
    }
  }
  [CHECKFS2](entry, fullyDone) {
    this[PRUNECACHE](entry);
    const done = (er) => {
      this[PRUNECACHE](entry);
      fullyDone(er);
    };
    const checkCwd2 = () => {
      this[MKDIR](this.cwd, this.dmode, (er) => {
        if (er) {
          this[ONERROR](er, entry);
          done();
          return;
        }
        this[CHECKED_CWD] = true;
        start();
      });
    };
    const start = () => {
      if (entry.absolute !== this.cwd) {
        const parent = normalizeWindowsPath(path6.dirname(String(entry.absolute)));
        if (parent !== this.cwd) {
          return this[MKDIR](parent, this.dmode, (er) => {
            if (er) {
              this[ONERROR](er, entry);
              done();
              return;
            }
            afterMakeParent();
          });
        }
      }
      afterMakeParent();
    };
    const afterMakeParent = () => {
      fs8.lstat(String(entry.absolute), (lstatEr, st) => {
        if (st && (this.keep || this.newer && st.mtime > (entry.mtime ?? st.mtime))) {
          this[SKIP](entry);
          done();
          return;
        }
        if (lstatEr || this[ISREUSABLE](entry, st)) {
          return this[MAKEFS](null, entry, done);
        }
        if (st.isDirectory()) {
          if (entry.type === "Directory") {
            const needChmod = this.chmod && entry.mode && (st.mode & 4095) !== entry.mode;
            const afterChmod = (er) => this[MAKEFS](er ?? null, entry, done);
            if (!needChmod) {
              return afterChmod();
            }
            return fs8.chmod(String(entry.absolute), Number(entry.mode), afterChmod);
          }
          if (entry.absolute !== this.cwd) {
            return fs8.rmdir(String(entry.absolute), (er) => this[MAKEFS](er ?? null, entry, done));
          }
        }
        if (entry.absolute === this.cwd) {
          return this[MAKEFS](null, entry, done);
        }
        unlinkFile(String(entry.absolute), (er) => this[MAKEFS](er ?? null, entry, done));
      });
    };
    if (this[CHECKED_CWD]) {
      start();
    } else {
      checkCwd2();
    }
  }
  [MAKEFS](er, entry, done) {
    if (er) {
      this[ONERROR](er, entry);
      done();
      return;
    }
    switch (entry.type) {
      case "File":
      case "OldFile":
      case "ContiguousFile":
        return this[FILE2](entry, done);
      case "Link":
        return this[HARDLINK2](entry, done);
      case "SymbolicLink":
        return this[SYMLINK2](entry, done);
      case "Directory":
      case "GNUDumpDir":
        return this[DIRECTORY2](entry, done);
    }
  }
  [LINK](entry, linkpath, link, done) {
    fs8[link](linkpath, String(entry.absolute), (er) => {
      if (er) {
        this[ONERROR](er, entry);
      } else {
        this[UNPEND]();
        entry.resume();
      }
      done();
    });
  }
}
var callSync = (fn) => {
  try {
    return [null, fn()];
  } catch (er) {
    return [er, null];
  }
};

class UnpackSync extends Unpack {
  sync = true;
  [MAKEFS](er, entry) {
    return super[MAKEFS](er, entry, () => {
    });
  }
  [CHECKFS](entry) {
    this[PRUNECACHE](entry);
    if (!this[CHECKED_CWD]) {
      const er2 = this[MKDIR](this.cwd, this.dmode);
      if (er2) {
        return this[ONERROR](er2, entry);
      }
      this[CHECKED_CWD] = true;
    }
    if (entry.absolute !== this.cwd) {
      const parent = normalizeWindowsPath(path6.dirname(String(entry.absolute)));
      if (parent !== this.cwd) {
        const mkParent = this[MKDIR](parent, this.dmode);
        if (mkParent) {
          return this[ONERROR](mkParent, entry);
        }
      }
    }
    const [lstatEr, st] = callSync(() => fs8.lstatSync(String(entry.absolute)));
    if (st && (this.keep || this.newer && st.mtime > (entry.mtime ?? st.mtime))) {
      return this[SKIP](entry);
    }
    if (lstatEr || this[ISREUSABLE](entry, st)) {
      return this[MAKEFS](null, entry);
    }
    if (st.isDirectory()) {
      if (entry.type === "Directory") {
        const needChmod = this.chmod && entry.mode && (st.mode & 4095) !== entry.mode;
        const [er3] = needChmod ? callSync(() => {
          fs8.chmodSync(String(entry.absolute), Number(entry.mode));
        }) : [];
        return this[MAKEFS](er3, entry);
      }
      const [er2] = callSync(() => fs8.rmdirSync(String(entry.absolute)));
      this[MAKEFS](er2, entry);
    }
    const [er] = entry.absolute === this.cwd ? [] : callSync(() => unlinkFileSync(String(entry.absolute)));
    this[MAKEFS](er, entry);
  }
  [FILE2](entry, done) {
    const mode = typeof entry.mode === "number" ? entry.mode & 4095 : this.fmode;
    const oner = (er) => {
      let closeError;
      try {
        fs8.closeSync(fd);
      } catch (e) {
        closeError = e;
      }
      if (er || closeError) {
        this[ONERROR](er || closeError, entry);
      }
      done();
    };
    let fd;
    try {
      fd = fs8.openSync(String(entry.absolute), getWriteFlag(entry.size), mode);
    } catch (er) {
      return oner(er);
    }
    const tx = this.transform ? this.transform(entry) || entry : entry;
    if (tx !== entry) {
      tx.on("error", (er) => this[ONERROR](er, entry));
      entry.pipe(tx);
    }
    tx.on("data", (chunk) => {
      try {
        fs8.writeSync(fd, chunk, 0, chunk.length);
      } catch (er) {
        oner(er);
      }
    });
    tx.on("end", () => {
      let er = null;
      if (entry.mtime && !this.noMtime) {
        const atime = entry.atime || new Date;
        const mtime = entry.mtime;
        try {
          fs8.futimesSync(fd, atime, mtime);
        } catch (futimeser) {
          try {
            fs8.utimesSync(String(entry.absolute), atime, mtime);
          } catch (utimeser) {
            er = futimeser;
          }
        }
      }
      if (this[DOCHOWN](entry)) {
        const uid = this[UID](entry);
        const gid = this[GID](entry);
        try {
          fs8.fchownSync(fd, Number(uid), Number(gid));
        } catch (fchowner) {
          try {
            fs8.chownSync(String(entry.absolute), Number(uid), Number(gid));
          } catch (chowner) {
            er = er || fchowner;
          }
        }
      }
      oner(er);
    });
  }
  [DIRECTORY2](entry, done) {
    const mode = typeof entry.mode === "number" ? entry.mode & 4095 : this.dmode;
    const er = this[MKDIR](String(entry.absolute), mode);
    if (er) {
      this[ONERROR](er, entry);
      done();
      return;
    }
    if (entry.mtime && !this.noMtime) {
      try {
        fs8.utimesSync(String(entry.absolute), entry.atime || new Date, entry.mtime);
      } catch (er2) {
      }
    }
    if (this[DOCHOWN](entry)) {
      try {
        fs8.chownSync(String(entry.absolute), Number(this[UID](entry)), Number(this[GID](entry)));
      } catch (er2) {
      }
    }
    done();
    entry.resume();
  }
  [MKDIR](dir, mode) {
    try {
      return mkdirSync3(normalizeWindowsPath(dir), {
        uid: this.uid,
        gid: this.gid,
        processUid: this.processUid,
        processGid: this.processGid,
        umask: this.processUmask,
        preserve: this.preservePaths,
        unlink: this.unlink,
        cache: this.dirCache,
        cwd: this.cwd,
        mode
      });
    } catch (er) {
      return er;
    }
  }
  [LINK](entry, linkpath, link, done) {
    const ls = `${link}Sync`;
    try {
      fs8[ls](linkpath, String(entry.absolute));
      done();
      entry.resume();
    } catch (er) {
      return this[ONERROR](er, entry);
    }
  }
}

// node_modules/tar/dist/esm/extract.js
var extractFileSync = (opt) => {
  const u = new UnpackSync(opt);
  const file = opt.file;
  const stat2 = fs9.statSync(file);
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;
  const stream = new ReadStreamSync(file, {
    readSize,
    size: stat2.size
  });
  stream.pipe(u);
};
var extractFile = (opt, _) => {
  const u = new Unpack(opt);
  const readSize = opt.maxReadSize || 16 * 1024 * 1024;
  const file = opt.file;
  const p = new Promise((resolve2, reject) => {
    u.on("error", reject);
    u.on("close", resolve2);
    fs9.stat(file, (er, stat2) => {
      if (er) {
        reject(er);
      } else {
        const stream = new ReadStream(file, {
          readSize,
          size: stat2.size
        });
        stream.on("error", reject);
        stream.pipe(u);
      }
    });
  });
  return p;
};
var extract = makeCommand(extractFileSync, extractFile, (opt) => new UnpackSync(opt), (opt) => new Unpack(opt), (opt, files) => {
  if (files?.length)
    filesFilter(opt, files);
});
// node_modules/tar/dist/esm/replace.js
import fs10 from "node:fs";
import path7 from "node:path";
var replaceSync = (opt, files) => {
  const p = new PackSync(opt);
  let threw = true;
  let fd;
  let position;
  try {
    try {
      fd = fs10.openSync(opt.file, "r+");
    } catch (er) {
      if (er?.code === "ENOENT") {
        fd = fs10.openSync(opt.file, "w+");
      } else {
        throw er;
      }
    }
    const st = fs10.fstatSync(fd);
    const headBuf = Buffer.alloc(512);
    POSITION:
      for (position = 0;position < st.size; position += 512) {
        for (let bufPos = 0, bytes = 0;bufPos < 512; bufPos += bytes) {
          bytes = fs10.readSync(fd, headBuf, bufPos, headBuf.length - bufPos, position + bufPos);
          if (position === 0 && headBuf[0] === 31 && headBuf[1] === 139) {
            throw new Error("cannot append to compressed archives");
          }
          if (!bytes) {
            break POSITION;
          }
        }
        const h = new Header(headBuf);
        if (!h.cksumValid) {
          break;
        }
        const entryBlockSize = 512 * Math.ceil((h.size || 0) / 512);
        if (position + entryBlockSize + 512 > st.size) {
          break;
        }
        position += entryBlockSize;
        if (opt.mtimeCache && h.mtime) {
          opt.mtimeCache.set(String(h.path), h.mtime);
        }
      }
    threw = false;
    streamSync(opt, p, position, fd, files);
  } finally {
    if (threw) {
      try {
        fs10.closeSync(fd);
      } catch (er) {
      }
    }
  }
};
var streamSync = (opt, p, position, fd, files) => {
  const stream = new WriteStreamSync(opt.file, {
    fd,
    start: position
  });
  p.pipe(stream);
  addFilesSync2(p, files);
};
var replaceAsync = (opt, files) => {
  files = Array.from(files);
  const p = new Pack(opt);
  const getPos = (fd, size, cb_) => {
    const cb = (er, pos2) => {
      if (er) {
        fs10.close(fd, (_) => cb_(er));
      } else {
        cb_(null, pos2);
      }
    };
    let position = 0;
    if (size === 0) {
      return cb(null, 0);
    }
    let bufPos = 0;
    const headBuf = Buffer.alloc(512);
    const onread = (er, bytes) => {
      if (er || typeof bytes === "undefined") {
        return cb(er);
      }
      bufPos += bytes;
      if (bufPos < 512 && bytes) {
        return fs10.read(fd, headBuf, bufPos, headBuf.length - bufPos, position + bufPos, onread);
      }
      if (position === 0 && headBuf[0] === 31 && headBuf[1] === 139) {
        return cb(new Error("cannot append to compressed archives"));
      }
      if (bufPos < 512) {
        return cb(null, position);
      }
      const h = new Header(headBuf);
      if (!h.cksumValid) {
        return cb(null, position);
      }
      const entryBlockSize = 512 * Math.ceil((h.size ?? 0) / 512);
      if (position + entryBlockSize + 512 > size) {
        return cb(null, position);
      }
      position += entryBlockSize + 512;
      if (position >= size) {
        return cb(null, position);
      }
      if (opt.mtimeCache && h.mtime) {
        opt.mtimeCache.set(String(h.path), h.mtime);
      }
      bufPos = 0;
      fs10.read(fd, headBuf, 0, 512, position, onread);
    };
    fs10.read(fd, headBuf, 0, 512, position, onread);
  };
  const promise = new Promise((resolve2, reject) => {
    p.on("error", reject);
    let flag = "r+";
    const onopen = (er, fd) => {
      if (er && er.code === "ENOENT" && flag === "r+") {
        flag = "w+";
        return fs10.open(opt.file, flag, onopen);
      }
      if (er || !fd) {
        return reject(er);
      }
      fs10.fstat(fd, (er2, st) => {
        if (er2) {
          return fs10.close(fd, () => reject(er2));
        }
        getPos(fd, st.size, (er3, position) => {
          if (er3) {
            return reject(er3);
          }
          const stream = new WriteStream(opt.file, {
            fd,
            start: position
          });
          p.pipe(stream);
          stream.on("error", reject);
          stream.on("close", resolve2);
          addFilesAsync2(p, files);
        });
      });
    };
    fs10.open(opt.file, flag, onopen);
  });
  return promise;
};
var addFilesSync2 = (p, files) => {
  files.forEach((file) => {
    if (file.charAt(0) === "@") {
      list({
        file: path7.resolve(p.cwd, file.slice(1)),
        sync: true,
        noResume: true,
        onReadEntry: (entry) => p.add(entry)
      });
    } else {
      p.add(file);
    }
  });
  p.end();
};
var addFilesAsync2 = async (p, files) => {
  for (let i = 0;i < files.length; i++) {
    const file = String(files[i]);
    if (file.charAt(0) === "@") {
      await list({
        file: path7.resolve(String(p.cwd), file.slice(1)),
        noResume: true,
        onReadEntry: (entry) => p.add(entry)
      });
    } else {
      p.add(file);
    }
  }
  p.end();
};
var replace = makeCommand(replaceSync, replaceAsync, () => {
  throw new TypeError("file is required");
}, () => {
  throw new TypeError("file is required");
}, (opt, entries) => {
  if (!isFile(opt)) {
    throw new TypeError("file is required");
  }
  if (opt.gzip || opt.brotli || opt.file.endsWith(".br") || opt.file.endsWith(".tbr")) {
    throw new TypeError("cannot append to compressed archives");
  }
  if (!entries?.length) {
    throw new TypeError("no paths specified to add/replace");
  }
});
// node_modules/tar/dist/esm/update.js
var update = makeCommand(replace.syncFile, replace.asyncFile, replace.syncNoFile, replace.asyncNoFile, (opt, entries = []) => {
  replace.validate?.(opt, entries);
  mtimeFilter(opt);
});
var mtimeFilter = (opt) => {
  const filter = opt.filter;
  if (!opt.mtimeCache) {
    opt.mtimeCache = new Map;
  }
  opt.filter = filter ? (path8, stat2) => filter(path8, stat2) && !((opt.mtimeCache?.get(path8) ?? stat2.mtime ?? 0) > (stat2.mtime ?? 0)) : (path8, stat2) => !((opt.mtimeCache?.get(path8) ?? stat2.mtime ?? 0) > (stat2.mtime ?? 0));
};
// sleep.ts
var sleep = (milliseconds) => new Promise((resolve2) => setTimeout(() => {
  resolve2();
}, milliseconds));

// parseAndDownload.ts
var import_cli_progress = __toESM(require_cli_progress(), 1);

// node_modules/yocto-queue/index.js
class Node2 {
  value;
  next;
  constructor(value) {
    this.value = value;
  }
}

class Queue {
  #head;
  #tail;
  #size;
  constructor() {
    this.clear();
  }
  enqueue(value) {
    const node = new Node2(value);
    if (this.#head) {
      this.#tail.next = node;
      this.#tail = node;
    } else {
      this.#head = node;
      this.#tail = node;
    }
    this.#size++;
  }
  dequeue() {
    const current = this.#head;
    if (!current) {
      return;
    }
    this.#head = this.#head.next;
    this.#size--;
    return current.value;
  }
  peek() {
    if (!this.#head) {
      return;
    }
    return this.#head.value;
  }
  clear() {
    this.#head = undefined;
    this.#tail = undefined;
    this.#size = 0;
  }
  get size() {
    return this.#size;
  }
  *[Symbol.iterator]() {
    let current = this.#head;
    while (current) {
      yield current.value;
      current = current.next;
    }
  }
}

// node_modules/p-limit/index.js
var validateConcurrency = function(concurrency) {
  if (!((Number.isInteger(concurrency) || concurrency === Number.POSITIVE_INFINITY) && concurrency > 0)) {
    throw new TypeError("Expected `concurrency` to be a number from 1 and up");
  }
};
function pLimit(concurrency) {
  validateConcurrency(concurrency);
  const queue = new Queue;
  let activeCount = 0;
  const resumeNext = () => {
    if (activeCount < concurrency && queue.size > 0) {
      queue.dequeue()();
      activeCount++;
    }
  };
  const next = () => {
    activeCount--;
    resumeNext();
  };
  const run = async (function_, resolve2, arguments_) => {
    const result = (async () => function_(...arguments_))();
    resolve2(result);
    try {
      await result;
    } catch {
    }
    next();
  };
  const enqueue = (function_, resolve2, arguments_) => {
    new Promise((internalResolve) => {
      queue.enqueue(internalResolve);
    }).then(run.bind(undefined, function_, resolve2, arguments_));
    (async () => {
      await Promise.resolve();
      if (activeCount < concurrency) {
        resumeNext();
      }
    })();
  };
  const generator = (function_, ...arguments_) => new Promise((resolve2) => {
    enqueue(function_, resolve2, arguments_);
  });
  Object.defineProperties(generator, {
    activeCount: {
      get: () => activeCount
    },
    pendingCount: {
      get: () => queue.size
    },
    clearQueue: {
      value() {
        queue.clear();
      }
    },
    concurrency: {
      get: () => concurrency,
      set(newConcurrency) {
        validateConcurrency(newConcurrency);
        concurrency = newConcurrency;
        queueMicrotask(() => {
          while (activeCount < concurrency && queue.size > 0) {
            resumeNext();
          }
        });
      }
    }
  });
  return generator;
}

// npm.ts
import {exec} from "node:child_process";
import {promisify} from "node:util";
var execAsync = promisify(exec);
var getRegistryUrl = async () => {
  const { stdout } = await execAsync("npm config get registry");
  return stdout.replaceAll("\n", "");
};
// node_modules/cli-spinners/spinners.json
var spinners_default = {
  dots: {
    interval: 80,
    frames: [
      "\u280B",
      "\u2819",
      "\u2839",
      "\u2838",
      "\u283C",
      "\u2834",
      "\u2826",
      "\u2827",
      "\u2807",
      "\u280F"
    ]
  },
  dots2: {
    interval: 80,
    frames: [
      "\u28FE",
      "\u28FD",
      "\u28FB",
      "\u28BF",
      "\u287F",
      "\u28DF",
      "\u28EF",
      "\u28F7"
    ]
  },
  dots3: {
    interval: 80,
    frames: [
      "\u280B",
      "\u2819",
      "\u281A",
      "\u281E",
      "\u2816",
      "\u2826",
      "\u2834",
      "\u2832",
      "\u2833",
      "\u2813"
    ]
  },
  dots4: {
    interval: 80,
    frames: [
      "\u2804",
      "\u2806",
      "\u2807",
      "\u280B",
      "\u2819",
      "\u2838",
      "\u2830",
      "\u2820",
      "\u2830",
      "\u2838",
      "\u2819",
      "\u280B",
      "\u2807",
      "\u2806"
    ]
  },
  dots5: {
    interval: 80,
    frames: [
      "\u280B",
      "\u2819",
      "\u281A",
      "\u2812",
      "\u2802",
      "\u2802",
      "\u2812",
      "\u2832",
      "\u2834",
      "\u2826",
      "\u2816",
      "\u2812",
      "\u2810",
      "\u2810",
      "\u2812",
      "\u2813",
      "\u280B"
    ]
  },
  dots6: {
    interval: 80,
    frames: [
      "\u2801",
      "\u2809",
      "\u2819",
      "\u281A",
      "\u2812",
      "\u2802",
      "\u2802",
      "\u2812",
      "\u2832",
      "\u2834",
      "\u2824",
      "\u2804",
      "\u2804",
      "\u2824",
      "\u2834",
      "\u2832",
      "\u2812",
      "\u2802",
      "\u2802",
      "\u2812",
      "\u281A",
      "\u2819",
      "\u2809",
      "\u2801"
    ]
  },
  dots7: {
    interval: 80,
    frames: [
      "\u2808",
      "\u2809",
      "\u280B",
      "\u2813",
      "\u2812",
      "\u2810",
      "\u2810",
      "\u2812",
      "\u2816",
      "\u2826",
      "\u2824",
      "\u2820",
      "\u2820",
      "\u2824",
      "\u2826",
      "\u2816",
      "\u2812",
      "\u2810",
      "\u2810",
      "\u2812",
      "\u2813",
      "\u280B",
      "\u2809",
      "\u2808"
    ]
  },
  dots8: {
    interval: 80,
    frames: [
      "\u2801",
      "\u2801",
      "\u2809",
      "\u2819",
      "\u281A",
      "\u2812",
      "\u2802",
      "\u2802",
      "\u2812",
      "\u2832",
      "\u2834",
      "\u2824",
      "\u2804",
      "\u2804",
      "\u2824",
      "\u2820",
      "\u2820",
      "\u2824",
      "\u2826",
      "\u2816",
      "\u2812",
      "\u2810",
      "\u2810",
      "\u2812",
      "\u2813",
      "\u280B",
      "\u2809",
      "\u2808",
      "\u2808"
    ]
  },
  dots9: {
    interval: 80,
    frames: [
      "\u28B9",
      "\u28BA",
      "\u28BC",
      "\u28F8",
      "\u28C7",
      "\u2867",
      "\u2857",
      "\u284F"
    ]
  },
  dots10: {
    interval: 80,
    frames: [
      "\u2884",
      "\u2882",
      "\u2881",
      "\u2841",
      "\u2848",
      "\u2850",
      "\u2860"
    ]
  },
  dots11: {
    interval: 100,
    frames: [
      "\u2801",
      "\u2802",
      "\u2804",
      "\u2840",
      "\u2880",
      "\u2820",
      "\u2810",
      "\u2808"
    ]
  },
  dots12: {
    interval: 80,
    frames: [
      "\u2880\u2800",
      "\u2840\u2800",
      "\u2804\u2800",
      "\u2882\u2800",
      "\u2842\u2800",
      "\u2805\u2800",
      "\u2883\u2800",
      "\u2843\u2800",
      "\u280D\u2800",
      "\u288B\u2800",
      "\u284B\u2800",
      "\u280D\u2801",
      "\u288B\u2801",
      "\u284B\u2801",
      "\u280D\u2809",
      "\u280B\u2809",
      "\u280B\u2809",
      "\u2809\u2819",
      "\u2809\u2819",
      "\u2809\u2829",
      "\u2808\u2899",
      "\u2808\u2859",
      "\u2888\u2829",
      "\u2840\u2899",
      "\u2804\u2859",
      "\u2882\u2829",
      "\u2842\u2898",
      "\u2805\u2858",
      "\u2883\u2828",
      "\u2843\u2890",
      "\u280D\u2850",
      "\u288B\u2820",
      "\u284B\u2880",
      "\u280D\u2841",
      "\u288B\u2801",
      "\u284B\u2801",
      "\u280D\u2809",
      "\u280B\u2809",
      "\u280B\u2809",
      "\u2809\u2819",
      "\u2809\u2819",
      "\u2809\u2829",
      "\u2808\u2899",
      "\u2808\u2859",
      "\u2808\u2829",
      "\u2800\u2899",
      "\u2800\u2859",
      "\u2800\u2829",
      "\u2800\u2898",
      "\u2800\u2858",
      "\u2800\u2828",
      "\u2800\u2890",
      "\u2800\u2850",
      "\u2800\u2820",
      "\u2800\u2880",
      "\u2800\u2840"
    ]
  },
  dots13: {
    interval: 80,
    frames: [
      "\u28FC",
      "\u28F9",
      "\u28BB",
      "\u283F",
      "\u285F",
      "\u28CF",
      "\u28E7",
      "\u28F6"
    ]
  },
  dots14: {
    interval: 80,
    frames: [
      "\u2809\u2809",
      "\u2808\u2819",
      "\u2800\u2839",
      "\u2800\u28B8",
      "\u2800\u28F0",
      "\u2880\u28E0",
      "\u28C0\u28C0",
      "\u28C4\u2840",
      "\u28C6\u2800",
      "\u2847\u2800",
      "\u280F\u2800",
      "\u280B\u2801"
    ]
  },
  dots8Bit: {
    interval: 80,
    frames: [
      "\u2800",
      "\u2801",
      "\u2802",
      "\u2803",
      "\u2804",
      "\u2805",
      "\u2806",
      "\u2807",
      "\u2840",
      "\u2841",
      "\u2842",
      "\u2843",
      "\u2844",
      "\u2845",
      "\u2846",
      "\u2847",
      "\u2808",
      "\u2809",
      "\u280A",
      "\u280B",
      "\u280C",
      "\u280D",
      "\u280E",
      "\u280F",
      "\u2848",
      "\u2849",
      "\u284A",
      "\u284B",
      "\u284C",
      "\u284D",
      "\u284E",
      "\u284F",
      "\u2810",
      "\u2811",
      "\u2812",
      "\u2813",
      "\u2814",
      "\u2815",
      "\u2816",
      "\u2817",
      "\u2850",
      "\u2851",
      "\u2852",
      "\u2853",
      "\u2854",
      "\u2855",
      "\u2856",
      "\u2857",
      "\u2818",
      "\u2819",
      "\u281A",
      "\u281B",
      "\u281C",
      "\u281D",
      "\u281E",
      "\u281F",
      "\u2858",
      "\u2859",
      "\u285A",
      "\u285B",
      "\u285C",
      "\u285D",
      "\u285E",
      "\u285F",
      "\u2820",
      "\u2821",
      "\u2822",
      "\u2823",
      "\u2824",
      "\u2825",
      "\u2826",
      "\u2827",
      "\u2860",
      "\u2861",
      "\u2862",
      "\u2863",
      "\u2864",
      "\u2865",
      "\u2866",
      "\u2867",
      "\u2828",
      "\u2829",
      "\u282A",
      "\u282B",
      "\u282C",
      "\u282D",
      "\u282E",
      "\u282F",
      "\u2868",
      "\u2869",
      "\u286A",
      "\u286B",
      "\u286C",
      "\u286D",
      "\u286E",
      "\u286F",
      "\u2830",
      "\u2831",
      "\u2832",
      "\u2833",
      "\u2834",
      "\u2835",
      "\u2836",
      "\u2837",
      "\u2870",
      "\u2871",
      "\u2872",
      "\u2873",
      "\u2874",
      "\u2875",
      "\u2876",
      "\u2877",
      "\u2838",
      "\u2839",
      "\u283A",
      "\u283B",
      "\u283C",
      "\u283D",
      "\u283E",
      "\u283F",
      "\u2878",
      "\u2879",
      "\u287A",
      "\u287B",
      "\u287C",
      "\u287D",
      "\u287E",
      "\u287F",
      "\u2880",
      "\u2881",
      "\u2882",
      "\u2883",
      "\u2884",
      "\u2885",
      "\u2886",
      "\u2887",
      "\u28C0",
      "\u28C1",
      "\u28C2",
      "\u28C3",
      "\u28C4",
      "\u28C5",
      "\u28C6",
      "\u28C7",
      "\u2888",
      "\u2889",
      "\u288A",
      "\u288B",
      "\u288C",
      "\u288D",
      "\u288E",
      "\u288F",
      "\u28C8",
      "\u28C9",
      "\u28CA",
      "\u28CB",
      "\u28CC",
      "\u28CD",
      "\u28CE",
      "\u28CF",
      "\u2890",
      "\u2891",
      "\u2892",
      "\u2893",
      "\u2894",
      "\u2895",
      "\u2896",
      "\u2897",
      "\u28D0",
      "\u28D1",
      "\u28D2",
      "\u28D3",
      "\u28D4",
      "\u28D5",
      "\u28D6",
      "\u28D7",
      "\u2898",
      "\u2899",
      "\u289A",
      "\u289B",
      "\u289C",
      "\u289D",
      "\u289E",
      "\u289F",
      "\u28D8",
      "\u28D9",
      "\u28DA",
      "\u28DB",
      "\u28DC",
      "\u28DD",
      "\u28DE",
      "\u28DF",
      "\u28A0",
      "\u28A1",
      "\u28A2",
      "\u28A3",
      "\u28A4",
      "\u28A5",
      "\u28A6",
      "\u28A7",
      "\u28E0",
      "\u28E1",
      "\u28E2",
      "\u28E3",
      "\u28E4",
      "\u28E5",
      "\u28E6",
      "\u28E7",
      "\u28A8",
      "\u28A9",
      "\u28AA",
      "\u28AB",
      "\u28AC",
      "\u28AD",
      "\u28AE",
      "\u28AF",
      "\u28E8",
      "\u28E9",
      "\u28EA",
      "\u28EB",
      "\u28EC",
      "\u28ED",
      "\u28EE",
      "\u28EF",
      "\u28B0",
      "\u28B1",
      "\u28B2",
      "\u28B3",
      "\u28B4",
      "\u28B5",
      "\u28B6",
      "\u28B7",
      "\u28F0",
      "\u28F1",
      "\u28F2",
      "\u28F3",
      "\u28F4",
      "\u28F5",
      "\u28F6",
      "\u28F7",
      "\u28B8",
      "\u28B9",
      "\u28BA",
      "\u28BB",
      "\u28BC",
      "\u28BD",
      "\u28BE",
      "\u28BF",
      "\u28F8",
      "\u28F9",
      "\u28FA",
      "\u28FB",
      "\u28FC",
      "\u28FD",
      "\u28FE",
      "\u28FF"
    ]
  },
  sand: {
    interval: 80,
    frames: [
      "\u2801",
      "\u2802",
      "\u2804",
      "\u2840",
      "\u2848",
      "\u2850",
      "\u2860",
      "\u28C0",
      "\u28C1",
      "\u28C2",
      "\u28C4",
      "\u28CC",
      "\u28D4",
      "\u28E4",
      "\u28E5",
      "\u28E6",
      "\u28EE",
      "\u28F6",
      "\u28F7",
      "\u28FF",
      "\u287F",
      "\u283F",
      "\u289F",
      "\u281F",
      "\u285B",
      "\u281B",
      "\u282B",
      "\u288B",
      "\u280B",
      "\u280D",
      "\u2849",
      "\u2809",
      "\u2811",
      "\u2821",
      "\u2881"
    ]
  },
  line: {
    interval: 130,
    frames: [
      "-",
      "\\",
      "|",
      "/"
    ]
  },
  line2: {
    interval: 100,
    frames: [
      "\u2802",
      "-",
      "\u2013",
      "\u2014",
      "\u2013",
      "-"
    ]
  },
  pipe: {
    interval: 100,
    frames: [
      "\u2524",
      "\u2518",
      "\u2534",
      "\u2514",
      "\u251C",
      "\u250C",
      "\u252C",
      "\u2510"
    ]
  },
  simpleDots: {
    interval: 400,
    frames: [
      ".  ",
      ".. ",
      "...",
      "   "
    ]
  },
  simpleDotsScrolling: {
    interval: 200,
    frames: [
      ".  ",
      ".. ",
      "...",
      " ..",
      "  .",
      "   "
    ]
  },
  star: {
    interval: 70,
    frames: [
      "\u2736",
      "\u2738",
      "\u2739",
      "\u273A",
      "\u2739",
      "\u2737"
    ]
  },
  star2: {
    interval: 80,
    frames: [
      "+",
      "x",
      "*"
    ]
  },
  flip: {
    interval: 70,
    frames: [
      "_",
      "_",
      "_",
      "-",
      "`",
      "`",
      "'",
      "\xB4",
      "-",
      "_",
      "_",
      "_"
    ]
  },
  hamburger: {
    interval: 100,
    frames: [
      "\u2631",
      "\u2632",
      "\u2634"
    ]
  },
  growVertical: {
    interval: 120,
    frames: [
      "\u2581",
      "\u2583",
      "\u2584",
      "\u2585",
      "\u2586",
      "\u2587",
      "\u2586",
      "\u2585",
      "\u2584",
      "\u2583"
    ]
  },
  growHorizontal: {
    interval: 120,
    frames: [
      "\u258F",
      "\u258E",
      "\u258D",
      "\u258C",
      "\u258B",
      "\u258A",
      "\u2589",
      "\u258A",
      "\u258B",
      "\u258C",
      "\u258D",
      "\u258E"
    ]
  },
  balloon: {
    interval: 140,
    frames: [
      " ",
      ".",
      "o",
      "O",
      "@",
      "*",
      " "
    ]
  },
  balloon2: {
    interval: 120,
    frames: [
      ".",
      "o",
      "O",
      "\xB0",
      "O",
      "o",
      "."
    ]
  },
  noise: {
    interval: 100,
    frames: [
      "\u2593",
      "\u2592",
      "\u2591"
    ]
  },
  bounce: {
    interval: 120,
    frames: [
      "\u2801",
      "\u2802",
      "\u2804",
      "\u2802"
    ]
  },
  boxBounce: {
    interval: 120,
    frames: [
      "\u2596",
      "\u2598",
      "\u259D",
      "\u2597"
    ]
  },
  boxBounce2: {
    interval: 100,
    frames: [
      "\u258C",
      "\u2580",
      "\u2590",
      "\u2584"
    ]
  },
  triangle: {
    interval: 50,
    frames: [
      "\u25E2",
      "\u25E3",
      "\u25E4",
      "\u25E5"
    ]
  },
  binary: {
    interval: 80,
    frames: [
      "010010",
      "001100",
      "100101",
      "111010",
      "111101",
      "010111",
      "101011",
      "111000",
      "110011",
      "110101"
    ]
  },
  arc: {
    interval: 100,
    frames: [
      "\u25DC",
      "\u25E0",
      "\u25DD",
      "\u25DE",
      "\u25E1",
      "\u25DF"
    ]
  },
  circle: {
    interval: 120,
    frames: [
      "\u25E1",
      "\u2299",
      "\u25E0"
    ]
  },
  squareCorners: {
    interval: 180,
    frames: [
      "\u25F0",
      "\u25F3",
      "\u25F2",
      "\u25F1"
    ]
  },
  circleQuarters: {
    interval: 120,
    frames: [
      "\u25F4",
      "\u25F7",
      "\u25F6",
      "\u25F5"
    ]
  },
  circleHalves: {
    interval: 50,
    frames: [
      "\u25D0",
      "\u25D3",
      "\u25D1",
      "\u25D2"
    ]
  },
  squish: {
    interval: 100,
    frames: [
      "\u256B",
      "\u256A"
    ]
  },
  toggle: {
    interval: 250,
    frames: [
      "\u22B6",
      "\u22B7"
    ]
  },
  toggle2: {
    interval: 80,
    frames: [
      "\u25AB",
      "\u25AA"
    ]
  },
  toggle3: {
    interval: 120,
    frames: [
      "\u25A1",
      "\u25A0"
    ]
  },
  toggle4: {
    interval: 100,
    frames: [
      "\u25A0",
      "\u25A1",
      "\u25AA",
      "\u25AB"
    ]
  },
  toggle5: {
    interval: 100,
    frames: [
      "\u25AE",
      "\u25AF"
    ]
  },
  toggle6: {
    interval: 300,
    frames: [
      "\u101D",
      "\u1040"
    ]
  },
  toggle7: {
    interval: 80,
    frames: [
      "\u29BE",
      "\u29BF"
    ]
  },
  toggle8: {
    interval: 100,
    frames: [
      "\u25CD",
      "\u25CC"
    ]
  },
  toggle9: {
    interval: 100,
    frames: [
      "\u25C9",
      "\u25CE"
    ]
  },
  toggle10: {
    interval: 100,
    frames: [
      "\u3282",
      "\u3280",
      "\u3281"
    ]
  },
  toggle11: {
    interval: 50,
    frames: [
      "\u29C7",
      "\u29C6"
    ]
  },
  toggle12: {
    interval: 120,
    frames: [
      "\u2617",
      "\u2616"
    ]
  },
  toggle13: {
    interval: 80,
    frames: [
      "=",
      "*",
      "-"
    ]
  },
  arrow: {
    interval: 100,
    frames: [
      "\u2190",
      "\u2196",
      "\u2191",
      "\u2197",
      "\u2192",
      "\u2198",
      "\u2193",
      "\u2199"
    ]
  },
  arrow2: {
    interval: 80,
    frames: [
      "\u2B06\uFE0F ",
      "\u2197\uFE0F ",
      "\u27A1\uFE0F ",
      "\u2198\uFE0F ",
      "\u2B07\uFE0F ",
      "\u2199\uFE0F ",
      "\u2B05\uFE0F ",
      "\u2196\uFE0F "
    ]
  },
  arrow3: {
    interval: 120,
    frames: [
      "\u25B9\u25B9\u25B9\u25B9\u25B9",
      "\u25B8\u25B9\u25B9\u25B9\u25B9",
      "\u25B9\u25B8\u25B9\u25B9\u25B9",
      "\u25B9\u25B9\u25B8\u25B9\u25B9",
      "\u25B9\u25B9\u25B9\u25B8\u25B9",
      "\u25B9\u25B9\u25B9\u25B9\u25B8"
    ]
  },
  bouncingBar: {
    interval: 80,
    frames: [
      "[    ]",
      "[=   ]",
      "[==  ]",
      "[=== ]",
      "[====]",
      "[ ===]",
      "[  ==]",
      "[   =]",
      "[    ]",
      "[   =]",
      "[  ==]",
      "[ ===]",
      "[====]",
      "[=== ]",
      "[==  ]",
      "[=   ]"
    ]
  },
  bouncingBall: {
    interval: 80,
    frames: [
      "( \u25CF    )",
      "(  \u25CF   )",
      "(   \u25CF  )",
      "(    \u25CF )",
      "(     \u25CF)",
      "(    \u25CF )",
      "(   \u25CF  )",
      "(  \u25CF   )",
      "( \u25CF    )",
      "(\u25CF     )"
    ]
  },
  smiley: {
    interval: 200,
    frames: [
      "\uD83D\uDE04 ",
      "\uD83D\uDE1D "
    ]
  },
  monkey: {
    interval: 300,
    frames: [
      "\uD83D\uDE48 ",
      "\uD83D\uDE48 ",
      "\uD83D\uDE49 ",
      "\uD83D\uDE4A "
    ]
  },
  hearts: {
    interval: 100,
    frames: [
      "\uD83D\uDC9B ",
      "\uD83D\uDC99 ",
      "\uD83D\uDC9C ",
      "\uD83D\uDC9A ",
      "\u2764\uFE0F "
    ]
  },
  clock: {
    interval: 100,
    frames: [
      "\uD83D\uDD5B ",
      "\uD83D\uDD50 ",
      "\uD83D\uDD51 ",
      "\uD83D\uDD52 ",
      "\uD83D\uDD53 ",
      "\uD83D\uDD54 ",
      "\uD83D\uDD55 ",
      "\uD83D\uDD56 ",
      "\uD83D\uDD57 ",
      "\uD83D\uDD58 ",
      "\uD83D\uDD59 ",
      "\uD83D\uDD5A "
    ]
  },
  earth: {
    interval: 180,
    frames: [
      "\uD83C\uDF0D ",
      "\uD83C\uDF0E ",
      "\uD83C\uDF0F "
    ]
  },
  material: {
    interval: 17,
    frames: [
      "\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
      "\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
      "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
      "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
      "\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
      "\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
      "\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
      "\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
      "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581"
    ]
  },
  moon: {
    interval: 80,
    frames: [
      "\uD83C\uDF11 ",
      "\uD83C\uDF12 ",
      "\uD83C\uDF13 ",
      "\uD83C\uDF14 ",
      "\uD83C\uDF15 ",
      "\uD83C\uDF16 ",
      "\uD83C\uDF17 ",
      "\uD83C\uDF18 "
    ]
  },
  runner: {
    interval: 140,
    frames: [
      "\uD83D\uDEB6 ",
      "\uD83C\uDFC3 "
    ]
  },
  pong: {
    interval: 80,
    frames: [
      "\u2590\u2802       \u258C",
      "\u2590\u2808       \u258C",
      "\u2590 \u2802      \u258C",
      "\u2590 \u2820      \u258C",
      "\u2590  \u2840     \u258C",
      "\u2590  \u2820     \u258C",
      "\u2590   \u2802    \u258C",
      "\u2590   \u2808    \u258C",
      "\u2590    \u2802   \u258C",
      "\u2590    \u2820   \u258C",
      "\u2590     \u2840  \u258C",
      "\u2590     \u2820  \u258C",
      "\u2590      \u2802 \u258C",
      "\u2590      \u2808 \u258C",
      "\u2590       \u2802\u258C",
      "\u2590       \u2820\u258C",
      "\u2590       \u2840\u258C",
      "\u2590      \u2820 \u258C",
      "\u2590      \u2802 \u258C",
      "\u2590     \u2808  \u258C",
      "\u2590     \u2802  \u258C",
      "\u2590    \u2820   \u258C",
      "\u2590    \u2840   \u258C",
      "\u2590   \u2820    \u258C",
      "\u2590   \u2802    \u258C",
      "\u2590  \u2808     \u258C",
      "\u2590  \u2802     \u258C",
      "\u2590 \u2820      \u258C",
      "\u2590 \u2840      \u258C",
      "\u2590\u2820       \u258C"
    ]
  },
  shark: {
    interval: 120,
    frames: [
      "\u2590|\\____________\u258C",
      "\u2590_|\\___________\u258C",
      "\u2590__|\\__________\u258C",
      "\u2590___|\\_________\u258C",
      "\u2590____|\\________\u258C",
      "\u2590_____|\\_______\u258C",
      "\u2590______|\\______\u258C",
      "\u2590_______|\\_____\u258C",
      "\u2590________|\\____\u258C",
      "\u2590_________|\\___\u258C",
      "\u2590__________|\\__\u258C",
      "\u2590___________|\\_\u258C",
      "\u2590____________|\\\u258C",
      "\u2590____________/|\u258C",
      "\u2590___________/|_\u258C",
      "\u2590__________/|__\u258C",
      "\u2590_________/|___\u258C",
      "\u2590________/|____\u258C",
      "\u2590_______/|_____\u258C",
      "\u2590______/|______\u258C",
      "\u2590_____/|_______\u258C",
      "\u2590____/|________\u258C",
      "\u2590___/|_________\u258C",
      "\u2590__/|__________\u258C",
      "\u2590_/|___________\u258C",
      "\u2590/|____________\u258C"
    ]
  },
  dqpb: {
    interval: 100,
    frames: [
      "d",
      "q",
      "p",
      "b"
    ]
  },
  weather: {
    interval: 100,
    frames: [
      "\u2600\uFE0F ",
      "\u2600\uFE0F ",
      "\u2600\uFE0F ",
      "\uD83C\uDF24 ",
      "\u26C5\uFE0F ",
      "\uD83C\uDF25 ",
      "\u2601\uFE0F ",
      "\uD83C\uDF27 ",
      "\uD83C\uDF28 ",
      "\uD83C\uDF27 ",
      "\uD83C\uDF28 ",
      "\uD83C\uDF27 ",
      "\uD83C\uDF28 ",
      "\u26C8 ",
      "\uD83C\uDF28 ",
      "\uD83C\uDF27 ",
      "\uD83C\uDF28 ",
      "\u2601\uFE0F ",
      "\uD83C\uDF25 ",
      "\u26C5\uFE0F ",
      "\uD83C\uDF24 ",
      "\u2600\uFE0F ",
      "\u2600\uFE0F "
    ]
  },
  christmas: {
    interval: 400,
    frames: [
      "\uD83C\uDF32",
      "\uD83C\uDF84"
    ]
  },
  grenade: {
    interval: 80,
    frames: [
      "\u060C  ",
      "\u2032  ",
      " \xB4 ",
      " \u203E ",
      "  \u2E0C",
      "  \u2E0A",
      "  |",
      "  \u204E",
      "  \u2055",
      " \u0DF4 ",
      "  \u2053",
      "   ",
      "   ",
      "   "
    ]
  },
  point: {
    interval: 125,
    frames: [
      "\u2219\u2219\u2219",
      "\u25CF\u2219\u2219",
      "\u2219\u25CF\u2219",
      "\u2219\u2219\u25CF",
      "\u2219\u2219\u2219"
    ]
  },
  layer: {
    interval: 150,
    frames: [
      "-",
      "=",
      "\u2261"
    ]
  },
  betaWave: {
    interval: 80,
    frames: [
      "\u03C1\u03B2\u03B2\u03B2\u03B2\u03B2\u03B2",
      "\u03B2\u03C1\u03B2\u03B2\u03B2\u03B2\u03B2",
      "\u03B2\u03B2\u03C1\u03B2\u03B2\u03B2\u03B2",
      "\u03B2\u03B2\u03B2\u03C1\u03B2\u03B2\u03B2",
      "\u03B2\u03B2\u03B2\u03B2\u03C1\u03B2\u03B2",
      "\u03B2\u03B2\u03B2\u03B2\u03B2\u03C1\u03B2",
      "\u03B2\u03B2\u03B2\u03B2\u03B2\u03B2\u03C1"
    ]
  },
  fingerDance: {
    interval: 160,
    frames: [
      "\uD83E\uDD18 ",
      "\uD83E\uDD1F ",
      "\uD83D\uDD96 ",
      "\u270B ",
      "\uD83E\uDD1A ",
      "\uD83D\uDC46 "
    ]
  },
  fistBump: {
    interval: 80,
    frames: [
      "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
      "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
      "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
      "\u3000\uD83E\uDD1C\u3000\u3000\uD83E\uDD1B\u3000 ",
      "\u3000\u3000\uD83E\uDD1C\uD83E\uDD1B\u3000\u3000 ",
      "\u3000\uD83E\uDD1C\u2728\uD83E\uDD1B\u3000\u3000 ",
      "\uD83E\uDD1C\u3000\u2728\u3000\uD83E\uDD1B\u3000 "
    ]
  },
  soccerHeader: {
    interval: 80,
    frames: [
      " \uD83E\uDDD1\u26BD\uFE0F       \uD83E\uDDD1 ",
      "\uD83E\uDDD1  \u26BD\uFE0F      \uD83E\uDDD1 ",
      "\uD83E\uDDD1   \u26BD\uFE0F     \uD83E\uDDD1 ",
      "\uD83E\uDDD1    \u26BD\uFE0F    \uD83E\uDDD1 ",
      "\uD83E\uDDD1     \u26BD\uFE0F   \uD83E\uDDD1 ",
      "\uD83E\uDDD1      \u26BD\uFE0F  \uD83E\uDDD1 ",
      "\uD83E\uDDD1       \u26BD\uFE0F\uD83E\uDDD1  ",
      "\uD83E\uDDD1      \u26BD\uFE0F  \uD83E\uDDD1 ",
      "\uD83E\uDDD1     \u26BD\uFE0F   \uD83E\uDDD1 ",
      "\uD83E\uDDD1    \u26BD\uFE0F    \uD83E\uDDD1 ",
      "\uD83E\uDDD1   \u26BD\uFE0F     \uD83E\uDDD1 ",
      "\uD83E\uDDD1  \u26BD\uFE0F      \uD83E\uDDD1 "
    ]
  },
  mindblown: {
    interval: 160,
    frames: [
      "\uD83D\uDE10 ",
      "\uD83D\uDE10 ",
      "\uD83D\uDE2E ",
      "\uD83D\uDE2E ",
      "\uD83D\uDE26 ",
      "\uD83D\uDE26 ",
      "\uD83D\uDE27 ",
      "\uD83D\uDE27 ",
      "\uD83E\uDD2F ",
      "\uD83D\uDCA5 ",
      "\u2728 ",
      "\u3000 ",
      "\u3000 ",
      "\u3000 "
    ]
  },
  speaker: {
    interval: 160,
    frames: [
      "\uD83D\uDD08 ",
      "\uD83D\uDD09 ",
      "\uD83D\uDD0A ",
      "\uD83D\uDD09 "
    ]
  },
  orangePulse: {
    interval: 100,
    frames: [
      "\uD83D\uDD38 ",
      "\uD83D\uDD36 ",
      "\uD83D\uDFE0 ",
      "\uD83D\uDFE0 ",
      "\uD83D\uDD36 "
    ]
  },
  bluePulse: {
    interval: 100,
    frames: [
      "\uD83D\uDD39 ",
      "\uD83D\uDD37 ",
      "\uD83D\uDD35 ",
      "\uD83D\uDD35 ",
      "\uD83D\uDD37 "
    ]
  },
  orangeBluePulse: {
    interval: 100,
    frames: [
      "\uD83D\uDD38 ",
      "\uD83D\uDD36 ",
      "\uD83D\uDFE0 ",
      "\uD83D\uDFE0 ",
      "\uD83D\uDD36 ",
      "\uD83D\uDD39 ",
      "\uD83D\uDD37 ",
      "\uD83D\uDD35 ",
      "\uD83D\uDD35 ",
      "\uD83D\uDD37 "
    ]
  },
  timeTravel: {
    interval: 100,
    frames: [
      "\uD83D\uDD5B ",
      "\uD83D\uDD5A ",
      "\uD83D\uDD59 ",
      "\uD83D\uDD58 ",
      "\uD83D\uDD57 ",
      "\uD83D\uDD56 ",
      "\uD83D\uDD55 ",
      "\uD83D\uDD54 ",
      "\uD83D\uDD53 ",
      "\uD83D\uDD52 ",
      "\uD83D\uDD51 ",
      "\uD83D\uDD50 "
    ]
  },
  aesthetic: {
    interval: 80,
    frames: [
      "\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1\u25B1",
      "\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1",
      "\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1",
      "\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1",
      "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1",
      "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1",
      "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0",
      "\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1\u25B1"
    ]
  },
  dwarfFortress: {
    interval: 80,
    frames: [
      " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A\u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A\u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A\u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A\u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A\u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A\u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A\u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A\u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "\u263A \u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A\u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A\u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A\u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A\u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A\u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A\u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u263A \u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A\u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A\u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A\u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A\u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A\u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A\u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u263A \u2588\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A\u2593\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A\u2593\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A\u2592\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A\u2592\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A\u2591\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A\u2591\u2588\u2588\xA3\xA3\xA3  ",
      "   \u263A \u2588\u2588\xA3\xA3\xA3  ",
      "    \u263A\u2588\u2588\xA3\xA3\xA3  ",
      "    \u263A\u2588\u2588\xA3\xA3\xA3  ",
      "    \u263A\u2593\u2588\xA3\xA3\xA3  ",
      "    \u263A\u2593\u2588\xA3\xA3\xA3  ",
      "    \u263A\u2592\u2588\xA3\xA3\xA3  ",
      "    \u263A\u2592\u2588\xA3\xA3\xA3  ",
      "    \u263A\u2591\u2588\xA3\xA3\xA3  ",
      "    \u263A\u2591\u2588\xA3\xA3\xA3  ",
      "    \u263A \u2588\xA3\xA3\xA3  ",
      "     \u263A\u2588\xA3\xA3\xA3  ",
      "     \u263A\u2588\xA3\xA3\xA3  ",
      "     \u263A\u2593\xA3\xA3\xA3  ",
      "     \u263A\u2593\xA3\xA3\xA3  ",
      "     \u263A\u2592\xA3\xA3\xA3  ",
      "     \u263A\u2592\xA3\xA3\xA3  ",
      "     \u263A\u2591\xA3\xA3\xA3  ",
      "     \u263A\u2591\xA3\xA3\xA3  ",
      "     \u263A \xA3\xA3\xA3  ",
      "      \u263A\xA3\xA3\xA3  ",
      "      \u263A\xA3\xA3\xA3  ",
      "      \u263A\u2593\xA3\xA3  ",
      "      \u263A\u2593\xA3\xA3  ",
      "      \u263A\u2592\xA3\xA3  ",
      "      \u263A\u2592\xA3\xA3  ",
      "      \u263A\u2591\xA3\xA3  ",
      "      \u263A\u2591\xA3\xA3  ",
      "      \u263A \xA3\xA3  ",
      "       \u263A\xA3\xA3  ",
      "       \u263A\xA3\xA3  ",
      "       \u263A\u2593\xA3  ",
      "       \u263A\u2593\xA3  ",
      "       \u263A\u2592\xA3  ",
      "       \u263A\u2592\xA3  ",
      "       \u263A\u2591\xA3  ",
      "       \u263A\u2591\xA3  ",
      "       \u263A \xA3  ",
      "        \u263A\xA3  ",
      "        \u263A\xA3  ",
      "        \u263A\u2593  ",
      "        \u263A\u2593  ",
      "        \u263A\u2592  ",
      "        \u263A\u2592  ",
      "        \u263A\u2591  ",
      "        \u263A\u2591  ",
      "        \u263A   ",
      "        \u263A  &",
      "        \u263A \u263C&",
      "       \u263A \u263C &",
      "       \u263A\u263C  &",
      "      \u263A\u263C  & ",
      "      \u203C   & ",
      "     \u263A   &  ",
      "    \u203C    &  ",
      "   \u263A    &   ",
      "  \u203C     &   ",
      " \u263A     &    ",
      "\u203C      &    ",
      "      &     ",
      "      &     ",
      "     &   \u2591  ",
      "     &   \u2592  ",
      "    &    \u2593  ",
      "    &    \xA3  ",
      "   &    \u2591\xA3  ",
      "   &    \u2592\xA3  ",
      "  &     \u2593\xA3  ",
      "  &     \xA3\xA3  ",
      " &     \u2591\xA3\xA3  ",
      " &     \u2592\xA3\xA3  ",
      "&      \u2593\xA3\xA3  ",
      "&      \xA3\xA3\xA3  ",
      "      \u2591\xA3\xA3\xA3  ",
      "      \u2592\xA3\xA3\xA3  ",
      "      \u2593\xA3\xA3\xA3  ",
      "      \u2588\xA3\xA3\xA3  ",
      "     \u2591\u2588\xA3\xA3\xA3  ",
      "     \u2592\u2588\xA3\xA3\xA3  ",
      "     \u2593\u2588\xA3\xA3\xA3  ",
      "     \u2588\u2588\xA3\xA3\xA3  ",
      "    \u2591\u2588\u2588\xA3\xA3\xA3  ",
      "    \u2592\u2588\u2588\xA3\xA3\xA3  ",
      "    \u2593\u2588\u2588\xA3\xA3\xA3  ",
      "    \u2588\u2588\u2588\xA3\xA3\xA3  ",
      "   \u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "   \u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "   \u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "   \u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      "  \u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
      " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  "
    ]
  }
};

// node_modules/cli-spinners/index.js
var cli_spinners_default = spinners_default;
var spinnersList = Object.keys(spinners_default);

// parseAndDownload.ts
import {promisify as promisify2} from "node:util";

// node_modules/ora/index.js
import process8 from "node:process";

// node_modules/chalk/source/vendor/ansi-styles/index.js
var assembleStyles = function() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code2) {
        if (code2 < 8) {
          return 30 + code2;
        }
        if (code2 < 16) {
          return 90 + (code2 - 8);
        }
        let red;
        let green;
        let blue;
        if (code2 >= 232) {
          red = ((code2 - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code2 -= 16;
          const remainder = code2 % 36;
          red = Math.floor(code2 / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
};
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code2) => `\x1B[${code2 + offset}m`;
var wrapAnsi256 = (offset = 0) => (code2) => `\x1B[${38 + offset};5;${code2}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "node:process";
import os from "node:os";
import tty from "node:tty";
var hasFlag = function(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
};
var envForceColor = function() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
};
var translateLevel = function(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
};
var _supportsColor = function(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if ("GITHUB_ACTIONS" in env || "GITEA_ACTIONS" in env) {
      return 3;
    }
    if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version2 = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version2 >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
};
function createSupportsColor(stream, options4 = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options4
  });
  return translateLevel(level);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var createChalk = function(options4) {
  return chalkFactory(options4);
};
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = Object.create(null);
var applyOptions = (object, options4 = {}) => {
  if (options4.level && !(Number.isInteger(options4.level) && options4.level >= 0 && options4.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options4.level === undefined ? colorLevel : options4.level;
};
var chalkFactory = (options4) => {
  const chalk = (...strings) => strings.join(" ");
  applyOptions(chalk, options4);
  Object.setPrototypeOf(chalk, createChalk.prototype);
  return chalk;
};
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {
}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === undefined) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// node_modules/cli-cursor/index.js
import process4 from "node:process";

// node_modules/restore-cursor/index.js
var import_onetime = __toESM(require_onetime(), 1);
var import_signal_exit = __toESM(require_signal_exit(), 1);
import process3 from "node:process";
var restoreCursor = import_onetime.default(() => {
  import_signal_exit.default(() => {
    process3.stderr.write("\x1B[?25h");
  }, { alwaysLast: true });
});
var restore_cursor_default = restoreCursor;

// node_modules/cli-cursor/index.js
var isHidden = false;
var cliCursor = {};
cliCursor.show = (writableStream = process4.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }
  isHidden = false;
  writableStream.write("\x1B[?25h");
};
cliCursor.hide = (writableStream = process4.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }
  restore_cursor_default();
  isHidden = true;
  writableStream.write("\x1B[?25l");
};
cliCursor.toggle = (force, writableStream) => {
  if (force !== undefined) {
    isHidden = force;
  }
  if (isHidden) {
    cliCursor.show(writableStream);
  } else {
    cliCursor.hide(writableStream);
  }
};
var cli_cursor_default = cliCursor;

// node_modules/ora/index.js
var import_cli_spinners = __toESM(require_cli_spinners(), 1);

// node_modules/log-symbols/node_modules/is-unicode-supported/index.js
import process5 from "node:process";
function isUnicodeSupported() {
  if (process5.platform !== "win32") {
    return process5.env.TERM !== "linux";
  }
  return Boolean(process5.env.CI) || Boolean(process5.env.WT_SESSION) || Boolean(process5.env.TERMINUS_SUBLIME) || process5.env.ConEmuTask === "{cmd::Cmder}" || process5.env.TERM_PROGRAM === "Terminus-Sublime" || process5.env.TERM_PROGRAM === "vscode" || process5.env.TERM === "xterm-256color" || process5.env.TERM === "alacritty" || process5.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}

// node_modules/log-symbols/index.js
var main = {
  info: source_default.blue("\u2139"),
  success: source_default.green("\u2714"),
  warning: source_default.yellow("\u26A0"),
  error: source_default.red("\u2716")
};
var fallback = {
  info: source_default.blue("i"),
  success: source_default.green("\u221A"),
  warning: source_default.yellow("\u203C"),
  error: source_default.red("\xD7")
};
var logSymbols = isUnicodeSupported() ? main : fallback;
var log_symbols_default = logSymbols;

// node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
  ].join("|");
  return new RegExp(pattern, onlyFirst ? undefined : "g");
}

// node_modules/strip-ansi/index.js
var regex = ansiRegex();
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, "");
}

// node_modules/get-east-asian-width/lookup.js
var isAmbiguous = function(x) {
  return x === 161 || x === 164 || x === 167 || x === 168 || x === 170 || x === 173 || x === 174 || x >= 176 && x <= 180 || x >= 182 && x <= 186 || x >= 188 && x <= 191 || x === 198 || x === 208 || x === 215 || x === 216 || x >= 222 && x <= 225 || x === 230 || x >= 232 && x <= 234 || x === 236 || x === 237 || x === 240 || x === 242 || x === 243 || x >= 247 && x <= 250 || x === 252 || x === 254 || x === 257 || x === 273 || x === 275 || x === 283 || x === 294 || x === 295 || x === 299 || x >= 305 && x <= 307 || x === 312 || x >= 319 && x <= 322 || x === 324 || x >= 328 && x <= 331 || x === 333 || x === 338 || x === 339 || x === 358 || x === 359 || x === 363 || x === 462 || x === 464 || x === 466 || x === 468 || x === 470 || x === 472 || x === 474 || x === 476 || x === 593 || x === 609 || x === 708 || x === 711 || x >= 713 && x <= 715 || x === 717 || x === 720 || x >= 728 && x <= 731 || x === 733 || x === 735 || x >= 768 && x <= 879 || x >= 913 && x <= 929 || x >= 931 && x <= 937 || x >= 945 && x <= 961 || x >= 963 && x <= 969 || x === 1025 || x >= 1040 && x <= 1103 || x === 1105 || x === 8208 || x >= 8211 && x <= 8214 || x === 8216 || x === 8217 || x === 8220 || x === 8221 || x >= 8224 && x <= 8226 || x >= 8228 && x <= 8231 || x === 8240 || x === 8242 || x === 8243 || x === 8245 || x === 8251 || x === 8254 || x === 8308 || x === 8319 || x >= 8321 && x <= 8324 || x === 8364 || x === 8451 || x === 8453 || x === 8457 || x === 8467 || x === 8470 || x === 8481 || x === 8482 || x === 8486 || x === 8491 || x === 8531 || x === 8532 || x >= 8539 && x <= 8542 || x >= 8544 && x <= 8555 || x >= 8560 && x <= 8569 || x === 8585 || x >= 8592 && x <= 8601 || x === 8632 || x === 8633 || x === 8658 || x === 8660 || x === 8679 || x === 8704 || x === 8706 || x === 8707 || x === 8711 || x === 8712 || x === 8715 || x === 8719 || x === 8721 || x === 8725 || x === 8730 || x >= 8733 && x <= 8736 || x === 8739 || x === 8741 || x >= 8743 && x <= 8748 || x === 8750 || x >= 8756 && x <= 8759 || x === 8764 || x === 8765 || x === 8776 || x === 8780 || x === 8786 || x === 8800 || x === 8801 || x >= 8804 && x <= 8807 || x === 8810 || x === 8811 || x === 8814 || x === 8815 || x === 8834 || x === 8835 || x === 8838 || x === 8839 || x === 8853 || x === 8857 || x === 8869 || x === 8895 || x === 8978 || x >= 9312 && x <= 9449 || x >= 9451 && x <= 9547 || x >= 9552 && x <= 9587 || x >= 9600 && x <= 9615 || x >= 9618 && x <= 9621 || x === 9632 || x === 9633 || x >= 9635 && x <= 9641 || x === 9650 || x === 9651 || x === 9654 || x === 9655 || x === 9660 || x === 9661 || x === 9664 || x === 9665 || x >= 9670 && x <= 9672 || x === 9675 || x >= 9678 && x <= 9681 || x >= 9698 && x <= 9701 || x === 9711 || x === 9733 || x === 9734 || x === 9737 || x === 9742 || x === 9743 || x === 9756 || x === 9758 || x === 9792 || x === 9794 || x === 9824 || x === 9825 || x >= 9827 && x <= 9829 || x >= 9831 && x <= 9834 || x === 9836 || x === 9837 || x === 9839 || x === 9886 || x === 9887 || x === 9919 || x >= 9926 && x <= 9933 || x >= 9935 && x <= 9939 || x >= 9941 && x <= 9953 || x === 9955 || x === 9960 || x === 9961 || x >= 9963 && x <= 9969 || x === 9972 || x >= 9974 && x <= 9977 || x === 9979 || x === 9980 || x === 9982 || x === 9983 || x === 10045 || x >= 10102 && x <= 10111 || x >= 11094 && x <= 11097 || x >= 12872 && x <= 12879 || x >= 57344 && x <= 63743 || x >= 65024 && x <= 65039 || x === 65533 || x >= 127232 && x <= 127242 || x >= 127248 && x <= 127277 || x >= 127280 && x <= 127337 || x >= 127344 && x <= 127373 || x === 127375 || x === 127376 || x >= 127387 && x <= 127404 || x >= 917760 && x <= 917999 || x >= 983040 && x <= 1048573 || x >= 1048576 && x <= 1114109;
};
var isFullWidth = function(x) {
  return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
};
var isWide = function(x) {
  return x >= 4352 && x <= 4447 || x === 8986 || x === 8987 || x === 9001 || x === 9002 || x >= 9193 && x <= 9196 || x === 9200 || x === 9203 || x === 9725 || x === 9726 || x === 9748 || x === 9749 || x >= 9800 && x <= 9811 || x === 9855 || x === 9875 || x === 9889 || x === 9898 || x === 9899 || x === 9917 || x === 9918 || x === 9924 || x === 9925 || x === 9934 || x === 9940 || x === 9962 || x === 9970 || x === 9971 || x === 9973 || x === 9978 || x === 9981 || x === 9989 || x === 9994 || x === 9995 || x === 10024 || x === 10060 || x === 10062 || x >= 10067 && x <= 10069 || x === 10071 || x >= 10133 && x <= 10135 || x === 10160 || x === 10175 || x === 11035 || x === 11036 || x === 11088 || x === 11093 || x >= 11904 && x <= 11929 || x >= 11931 && x <= 12019 || x >= 12032 && x <= 12245 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12353 && x <= 12438 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12771 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 19903 || x >= 19968 && x <= 42124 || x >= 42128 && x <= 42182 || x >= 43360 && x <= 43388 || x >= 44032 && x <= 55203 || x >= 63744 && x <= 64255 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 94176 && x <= 94180 || x === 94192 || x === 94193 || x >= 94208 && x <= 100343 || x >= 100352 && x <= 101589 || x >= 101632 && x <= 101640 || x >= 110576 && x <= 110579 || x >= 110581 && x <= 110587 || x === 110589 || x === 110590 || x >= 110592 && x <= 110882 || x === 110898 || x >= 110928 && x <= 110930 || x === 110933 || x >= 110948 && x <= 110951 || x >= 110960 && x <= 111355 || x === 126980 || x === 127183 || x === 127374 || x >= 127377 && x <= 127386 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x === 127568 || x === 127569 || x >= 127584 && x <= 127589 || x >= 127744 && x <= 127776 || x >= 127789 && x <= 127797 || x >= 127799 && x <= 127868 || x >= 127870 && x <= 127891 || x >= 127904 && x <= 127946 || x >= 127951 && x <= 127955 || x >= 127968 && x <= 127984 || x === 127988 || x >= 127992 && x <= 128062 || x === 128064 || x >= 128066 && x <= 128252 || x >= 128255 && x <= 128317 || x >= 128331 && x <= 128334 || x >= 128336 && x <= 128359 || x === 128378 || x === 128405 || x === 128406 || x === 128420 || x >= 128507 && x <= 128591 || x >= 128640 && x <= 128709 || x === 128716 || x >= 128720 && x <= 128722 || x >= 128725 && x <= 128727 || x >= 128732 && x <= 128735 || x === 128747 || x === 128748 || x >= 128756 && x <= 128764 || x >= 128992 && x <= 129003 || x === 129008 || x >= 129292 && x <= 129338 || x >= 129340 && x <= 129349 || x >= 129351 && x <= 129535 || x >= 129648 && x <= 129660 || x >= 129664 && x <= 129672 || x >= 129680 && x <= 129725 || x >= 129727 && x <= 129733 || x >= 129742 && x <= 129755 || x >= 129760 && x <= 129768 || x >= 129776 && x <= 129784 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
};

// node_modules/get-east-asian-width/index.js
var validate = function(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
};
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
  validate(codePoint);
  if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) {
    return 2;
  }
  return 1;
}

// node_modules/ora/node_modules/string-width/index.js
var import_emoji_regex = __toESM(require_emoji_regex2(), 1);
var segmenter = new Intl.Segmenter;
var defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth(string, options4 = {}) {
  if (typeof string !== "string" || string.length === 0) {
    return 0;
  }
  const {
    ambiguousIsNarrow = true,
    countAnsiEscapeCodes = false
  } = options4;
  if (!countAnsiEscapeCodes) {
    string = stripAnsi(string);
  }
  if (string.length === 0) {
    return 0;
  }
  let width = 0;
  const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
  for (const { segment: character } of segmenter.segment(string)) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) {
      continue;
    }
    if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) {
      continue;
    }
    if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) {
      continue;
    }
    if (codePoint >= 55296 && codePoint <= 57343) {
      continue;
    }
    if (codePoint >= 65024 && codePoint <= 65039) {
      continue;
    }
    if (defaultIgnorableCodePointRegex.test(character)) {
      continue;
    }
    if (import_emoji_regex.default().test(character)) {
      width += 2;
      continue;
    }
    width += eastAsianWidth(codePoint, eastAsianWidthOptions);
  }
  return width;
}

// node_modules/is-interactive/index.js
function isInteractive({ stream = process.stdout } = {}) {
  return Boolean(stream && stream.isTTY && process.env.TERM !== "dumb" && !("CI" in process.env));
}

// node_modules/is-unicode-supported/index.js
import process6 from "node:process";
function isUnicodeSupported2() {
  if (process6.platform !== "win32") {
    return process6.env.TERM !== "linux";
  }
  return Boolean(process6.env.WT_SESSION) || Boolean(process6.env.TERMINUS_SUBLIME) || process6.env.ConEmuTask === "{cmd::Cmder}" || process6.env.TERM_PROGRAM === "Terminus-Sublime" || process6.env.TERM_PROGRAM === "vscode" || process6.env.TERM === "xterm-256color" || process6.env.TERM === "alacritty" || process6.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}

// node_modules/stdin-discarder/index.js
import process7 from "node:process";
var ASCII_ETX_CODE = 3;

class StdinDiscarder {
  #activeCount = 0;
  start() {
    this.#activeCount++;
    if (this.#activeCount === 1) {
      this.#realStart();
    }
  }
  stop() {
    if (this.#activeCount <= 0) {
      throw new Error("`stop` called more times than `start`");
    }
    this.#activeCount--;
    if (this.#activeCount === 0) {
      this.#realStop();
    }
  }
  #realStart() {
    if (process7.platform === "win32" || !process7.stdin.isTTY) {
      return;
    }
    process7.stdin.setRawMode(true);
    process7.stdin.on("data", this.#handleInput);
    process7.stdin.resume();
  }
  #realStop() {
    if (!process7.stdin.isTTY) {
      return;
    }
    process7.stdin.off("data", this.#handleInput);
    process7.stdin.pause();
    process7.stdin.setRawMode(false);
  }
  #handleInput(chunk) {
    if (chunk[0] === ASCII_ETX_CODE) {
      process7.emit("SIGINT");
    }
  }
}
var stdinDiscarder = new StdinDiscarder;
var stdin_discarder_default = stdinDiscarder;

// node_modules/ora/index.js
var import_cli_spinners2 = __toESM(require_cli_spinners(), 1);

class Ora {
  #linesToClear = 0;
  #isDiscardingStdin = false;
  #lineCount = 0;
  #frameIndex = 0;
  #options;
  #spinner;
  #stream;
  #id;
  #initialInterval;
  #isEnabled;
  #isSilent;
  #indent;
  #text;
  #prefixText;
  #suffixText;
  color;
  constructor(options4) {
    if (typeof options4 === "string") {
      options4 = {
        text: options4
      };
    }
    this.#options = {
      color: "cyan",
      stream: process8.stderr,
      discardStdin: true,
      hideCursor: true,
      ...options4
    };
    this.color = this.#options.color;
    this.spinner = this.#options.spinner;
    this.#initialInterval = this.#options.interval;
    this.#stream = this.#options.stream;
    this.#isEnabled = typeof this.#options.isEnabled === "boolean" ? this.#options.isEnabled : isInteractive({ stream: this.#stream });
    this.#isSilent = typeof this.#options.isSilent === "boolean" ? this.#options.isSilent : false;
    this.text = this.#options.text;
    this.prefixText = this.#options.prefixText;
    this.suffixText = this.#options.suffixText;
    this.indent = this.#options.indent;
    if (process8.env.NODE_ENV === "test") {
      this._stream = this.#stream;
      this._isEnabled = this.#isEnabled;
      Object.defineProperty(this, "_linesToClear", {
        get() {
          return this.#linesToClear;
        },
        set(newValue) {
          this.#linesToClear = newValue;
        }
      });
      Object.defineProperty(this, "_frameIndex", {
        get() {
          return this.#frameIndex;
        }
      });
      Object.defineProperty(this, "_lineCount", {
        get() {
          return this.#lineCount;
        }
      });
    }
  }
  get indent() {
    return this.#indent;
  }
  set indent(indent = 0) {
    if (!(indent >= 0 && Number.isInteger(indent))) {
      throw new Error("The `indent` option must be an integer from 0 and up");
    }
    this.#indent = indent;
    this.#updateLineCount();
  }
  get interval() {
    return this.#initialInterval ?? this.#spinner.interval ?? 100;
  }
  get spinner() {
    return this.#spinner;
  }
  set spinner(spinner) {
    this.#frameIndex = 0;
    this.#initialInterval = undefined;
    if (typeof spinner === "object") {
      if (spinner.frames === undefined) {
        throw new Error("The given spinner must have a `frames` property");
      }
      this.#spinner = spinner;
    } else if (!isUnicodeSupported2()) {
      this.#spinner = import_cli_spinners.default.line;
    } else if (spinner === undefined) {
      this.#spinner = import_cli_spinners.default.dots;
    } else if (spinner !== "default" && import_cli_spinners.default[spinner]) {
      this.#spinner = import_cli_spinners.default[spinner];
    } else {
      throw new Error(`There is no built-in spinner named '${spinner}'. See https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json for a full list.`);
    }
  }
  get text() {
    return this.#text;
  }
  set text(value = "") {
    this.#text = value;
    this.#updateLineCount();
  }
  get prefixText() {
    return this.#prefixText;
  }
  set prefixText(value = "") {
    this.#prefixText = value;
    this.#updateLineCount();
  }
  get suffixText() {
    return this.#suffixText;
  }
  set suffixText(value = "") {
    this.#suffixText = value;
    this.#updateLineCount();
  }
  get isSpinning() {
    return this.#id !== undefined;
  }
  #getFullPrefixText(prefixText = this.#prefixText, postfix = " ") {
    if (typeof prefixText === "string" && prefixText !== "") {
      return prefixText + postfix;
    }
    if (typeof prefixText === "function") {
      return prefixText() + postfix;
    }
    return "";
  }
  #getFullSuffixText(suffixText = this.#suffixText, prefix = " ") {
    if (typeof suffixText === "string" && suffixText !== "") {
      return prefix + suffixText;
    }
    if (typeof suffixText === "function") {
      return prefix + suffixText();
    }
    return "";
  }
  #updateLineCount() {
    const columns = this.#stream.columns ?? 80;
    const fullPrefixText = this.#getFullPrefixText(this.#prefixText, "-");
    const fullSuffixText = this.#getFullSuffixText(this.#suffixText, "-");
    const fullText = " ".repeat(this.#indent) + fullPrefixText + "--" + this.#text + "--" + fullSuffixText;
    this.#lineCount = 0;
    for (const line of stripAnsi(fullText).split("\n")) {
      this.#lineCount += Math.max(1, Math.ceil(stringWidth(line, { countAnsiEscapeCodes: true }) / columns));
    }
  }
  get isEnabled() {
    return this.#isEnabled && !this.#isSilent;
  }
  set isEnabled(value) {
    if (typeof value !== "boolean") {
      throw new TypeError("The `isEnabled` option must be a boolean");
    }
    this.#isEnabled = value;
  }
  get isSilent() {
    return this.#isSilent;
  }
  set isSilent(value) {
    if (typeof value !== "boolean") {
      throw new TypeError("The `isSilent` option must be a boolean");
    }
    this.#isSilent = value;
  }
  frame() {
    const { frames } = this.#spinner;
    let frame = frames[this.#frameIndex];
    if (this.color) {
      frame = source_default[this.color](frame);
    }
    this.#frameIndex = ++this.#frameIndex % frames.length;
    const fullPrefixText = typeof this.#prefixText === "string" && this.#prefixText !== "" ? this.#prefixText + " " : "";
    const fullText = typeof this.text === "string" ? " " + this.text : "";
    const fullSuffixText = typeof this.#suffixText === "string" && this.#suffixText !== "" ? " " + this.#suffixText : "";
    return fullPrefixText + frame + fullText + fullSuffixText;
  }
  clear() {
    if (!this.#isEnabled || !this.#stream.isTTY) {
      return this;
    }
    this.#stream.cursorTo(0);
    for (let index = 0;index < this.#linesToClear; index++) {
      if (index > 0) {
        this.#stream.moveCursor(0, -1);
      }
      this.#stream.clearLine(1);
    }
    if (this.#indent || this.lastIndent !== this.#indent) {
      this.#stream.cursorTo(this.#indent);
    }
    this.lastIndent = this.#indent;
    this.#linesToClear = 0;
    return this;
  }
  render() {
    if (this.#isSilent) {
      return this;
    }
    this.clear();
    this.#stream.write(this.frame());
    this.#linesToClear = this.#lineCount;
    return this;
  }
  start(text) {
    if (text) {
      this.text = text;
    }
    if (this.#isSilent) {
      return this;
    }
    if (!this.#isEnabled) {
      if (this.text) {
        this.#stream.write(`- ${this.text}\n`);
      }
      return this;
    }
    if (this.isSpinning) {
      return this;
    }
    if (this.#options.hideCursor) {
      cli_cursor_default.hide(this.#stream);
    }
    if (this.#options.discardStdin && process8.stdin.isTTY) {
      this.#isDiscardingStdin = true;
      stdin_discarder_default.start();
    }
    this.render();
    this.#id = setInterval(this.render.bind(this), this.interval);
    return this;
  }
  stop() {
    if (!this.#isEnabled) {
      return this;
    }
    clearInterval(this.#id);
    this.#id = undefined;
    this.#frameIndex = 0;
    this.clear();
    if (this.#options.hideCursor) {
      cli_cursor_default.show(this.#stream);
    }
    if (this.#options.discardStdin && process8.stdin.isTTY && this.#isDiscardingStdin) {
      stdin_discarder_default.stop();
      this.#isDiscardingStdin = false;
    }
    return this;
  }
  succeed(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.success, text });
  }
  fail(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.error, text });
  }
  warn(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.warning, text });
  }
  info(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.info, text });
  }
  stopAndPersist(options4 = {}) {
    if (this.#isSilent) {
      return this;
    }
    const prefixText = options4.prefixText ?? this.#prefixText;
    const fullPrefixText = this.#getFullPrefixText(prefixText, " ");
    const symbolText = options4.symbol ?? " ";
    const text = options4.text ?? this.text;
    const fullText = typeof text === "string" ? " " + text : "";
    const suffixText = options4.suffixText ?? this.#suffixText;
    const fullSuffixText = this.#getFullSuffixText(suffixText, " ");
    const textToWrite = fullPrefixText + symbolText + fullText + fullSuffixText + "\n";
    this.stop();
    this.#stream.write(textToWrite);
    return this;
  }
}
function ora(options4) {
  return new Ora(options4);
}

// parseAndDownload.ts
var execAsync2 = promisify2(exec2);
var spinner = ora({ text: "Scanning dependencies", spinner: cli_spinners_default.bouncingBar });
var limit = pLimit(10);
var multibar = new import_cli_progress.MultiBar({
  clearOnComplete: false,
  hideCursor: true,
  format: " {bar} | {filename} | {percentage}%"
}, import_cli_progress.Presets.shades_grey);
var downloadTarball = async (url, filename, stream) => {
  const bar = multibar.create(100, 0, { filename });
  await download(url, stream, (current, total) => {
    bar.setTotal(total);
    bar.update(current);
  });
  bar.update(bar.getTotal());
  await sleep(500);
  multibar.remove(bar);
};
var parseAndDownload = async (firebundleName, packages) => {
  const CURRENT_TIME = `${+new Date}`;
  const TEMP_DIRECTORY = `.tmp_${CURRENT_TIME}`;
  const TEMP_PACKAGE_JSON = `${TEMP_DIRECTORY}/package.json`;
  const TEMP_PACKAGE_LOCK_JSON = `${TEMP_DIRECTORY}/package-lock.json`;
  const PACKAGE_JSON_CONTENT = {
    dependencies: packages
  };
  await mkdir5(TEMP_DIRECTORY);
  await writeFileSync(TEMP_PACKAGE_JSON, JSON.stringify(PACKAGE_JSON_CONTENT, undefined, 2));
  const REGISTRY_URL = await getRegistryUrl();
  spinner.start();
  await execAsync2("npm i --package-lock-only", {
    cwd: process.cwd() + "/" + TEMP_DIRECTORY
  });
  spinner.stop();
  console.log("Scanning dependencies");
  const packageLockJson = JSON.parse(readFileSync(TEMP_PACKAGE_LOCK_JSON, {
    encoding: "utf8"
  }));
  if (!("packages" in packageLockJson)) {
    console.log("No dependencies found");
    return;
  }
  await mkdir5(TEMP_DIRECTORY + "/tarball");
  const downloadLinks = [];
  for (const packageDetailsKey of Object.keys(packageLockJson.packages)) {
    if (packageDetailsKey.length > 0) {
      const packageDetails = packageLockJson.packages[packageDetailsKey];
      if ("resolved" in packageDetails) {
        const url = packageDetails.resolved;
        const savePath = url.replace(REGISTRY_URL, "");
        await mkdir5(TEMP_DIRECTORY + win322.dirname(`/tarball/${savePath}`), { recursive: true });
        const file = createWriteStream(TEMP_DIRECTORY + `/tarball/${savePath}`);
        downloadLinks.push(limit(() => downloadTarball(url, savePath, file)));
      }
    }
  }
  console.log(`Resolved ${downloadLinks.length} dependencies. Starting download process`);
  console.log();
  await Promise.all(downloadLinks);
  multibar.stop();
  const fileExtension = ".tgz";
  const fileName = `${firebundleName}_${CURRENT_TIME}${fileExtension}`;
  console.log(`Saving ${fileExtension} file`);
  await create({ file: fileName, C: TEMP_DIRECTORY + "/tarball", gzip: true }, ["."]);
  await sleep(1000);
  console.log(`Done - Saved to ./${fileName}`);
  await rm(TEMP_DIRECTORY, { recursive: true, force: true });
};

// single.ts
var getVersion = (packageName) => {
  const [name2, version2] = packageName.split("@").filter((part) => part.length > 0);
  return [name2, version2 ?? "latest"];
};
var single = async (packageName) => {
  const [name2, version2] = getVersion(packageName);
  console.log(`Downloading ${name2} (v: ${version2})`);
  await parseAndDownload(name2, {
    [name2]: version2
  });
};

// project.ts
import {readFileSync as readFileSync2} from "node:fs";
var project = async (packageJsonPath) => {
  const packageJsonContent = JSON.parse(readFileSync2(packageJsonPath, {
    encoding: "utf8"
  }));
  const toDownload = {
    ...packageJsonContent.devDependencies ?? {},
    ...packageJsonContent.peerDependencies ?? {},
    ...packageJsonContent.dependencies ?? {}
  };
  console.log(`Downloading ${Object.keys(toDownload).length} packages`);
  await parseAndDownload(packageJsonContent.name ?? "firebundle", toDownload);
};

// index.ts
program.name("firebundle | fb").description("CLI to bundle node modules into tarball").version("0.0.1");
program.command("package").description("Bundle a single package with its dependencies").argument("<package_name>", "the package name").action(async (package_name) => {
  await single(package_name);
});
program.command("project").description("Bundle all project dependencies, including all child dependencies").argument("<package_json>", "the package.json file path of the project").action(async (package_json) => {
  await project(package_json);
});
program.parse();
