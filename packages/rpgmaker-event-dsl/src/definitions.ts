import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import { join, matchesGlob } from "node:path";

import * as ts from "typescript";

import * as dsl from "./dsl.js";
import { collectDslOwnedDeclarations, type DslOwnedDeclaration } from "./dsl.js";

export type DefinitionSourceDiscovery = {
  sourceRoot: string;
  sourceInclude: readonly string[];
  sourceExclude: readonly string[];
};

type EvaluationScope = {
  bindings: Map<string, unknown>;
};

export async function discoverDefinitionFiles(
  workspaceRoot: string,
  discovery: DefinitionSourceDiscovery,
): Promise<string[]> {
  const sourceRoot = join(workspaceRoot, discovery.sourceRoot);
  const includePatterns = discovery.sourceInclude.length > 0 ? discovery.sourceInclude : ["**/*"];
  const files = new Set<string>();

  for (const pattern of includePatterns) {
    for await (const relativePath of glob(pattern, {
      cwd: sourceRoot,
      exclude: discovery.sourceExclude,
    })) {
      if (!matchesGlob(relativePath, pattern)) {
        continue;
      }

      files.add(join(sourceRoot, relativePath));
    }
  }

  return [...files].sort();
}

export async function loadDefinitionFile(filePath: string): Promise<DslOwnedDeclaration[]> {
  const sourceText = await readFile(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ES2023,
    true,
    ts.ScriptKind.TS,
  );

  const diagnostics = collectDiagnostics(filePath, sourceFile);
  if (diagnostics.length > 0) {
    throw new Error(formatDiagnostics(filePath, diagnostics));
  }

  try {
    const moduleExports = evaluateModule(sourceFile);
    return collectDslOwnedDeclarations(moduleExports);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(formatSourceError(filePath, error.message));
    }

    throw error;
  }
}

function collectDiagnostics(filePath: string, sourceFile: ts.SourceFile): readonly ts.Diagnostic[] {
  const compilerOptions: ts.CompilerOptions = {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2023,
    verbatimModuleSyntax: true,
  };

  const host = ts.createCompilerHost(compilerOptions, true);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  const originalReadFile = host.readFile.bind(host);
  const originalFileExists = host.fileExists.bind(host);

  host.getSourceFile = (requestedFileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (normalizePath(requestedFileName) === normalizePath(filePath)) {
      return sourceFile;
    }

    return originalGetSourceFile(
      requestedFileName,
      languageVersion,
      onError,
      shouldCreateNewSourceFile,
    );
  };
  host.readFile = (requestedFileName) => {
    if (normalizePath(requestedFileName) === normalizePath(filePath)) {
      return sourceFile.getFullText();
    }

    return originalReadFile(requestedFileName);
  };
  host.fileExists = (requestedFileName) => {
    if (normalizePath(requestedFileName) === normalizePath(filePath)) {
      return true;
    }

    return originalFileExists(requestedFileName);
  };

  const program = ts.createProgram([filePath], compilerOptions, host);
  return [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ];
}

function evaluateModule(sourceFile: ts.SourceFile): Record<string, unknown> {
  const scope: EvaluationScope = {
    bindings: new Map<string, unknown>(),
  };
  const exports: Record<string, unknown> = {};

  for (const statement of sourceFile.statements) {
    if (ts.isEmptyStatement(statement)) {
      continue;
    }

    if (ts.isImportDeclaration(statement)) {
      registerImport(statement, scope);
      continue;
    }

    if (ts.isExportAssignment(statement)) {
      throw new Error("Default export is not allowed for Event Definitions.");
    }

    if (ts.isExportDeclaration(statement)) {
      if (statement.moduleSpecifier !== undefined) {
        throw new Error("Re-exporting from other modules is not allowed for Event Definitions.");
      }

      if (statement.exportClause === undefined || !ts.isNamedExports(statement.exportClause)) {
        throw new Error("Only named exports are allowed for Event Definitions.");
      }

      for (const specifier of statement.exportClause.elements) {
        const exportedName = specifier.name.text;
        const localName = specifier.propertyName?.text ?? exportedName;

        if (!scope.bindings.has(localName)) {
          throw new Error(`Exported binding "${localName}" was not declared in the file.`);
        }

        exports[exportedName] = scope.bindings.get(localName);
      }

      continue;
    }

    if (ts.isVariableStatement(statement)) {
      if ((statement.declarationList.flags & ts.NodeFlags.Const) === 0) {
        throw new Error("Only const bindings are allowed for Event Definitions.");
      }

      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          throw new Error("Only simple named bindings are supported for Event Definitions.");
        }

        if (declaration.initializer === undefined) {
          throw new Error(
            `Event Definition binding "${declaration.name.text}" must have an initializer.`,
          );
        }

        const value = evaluateExpression(declaration.initializer, scope);
        scope.bindings.set(declaration.name.text, value);

        if (
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          exports[declaration.name.text] = value;
        }
      }
      continue;
    }

    if (isIgnorableStatement(statement)) {
      continue;
    }

    throw new Error(`Unsupported Event Definition statement: ${ts.SyntaxKind[statement.kind]}`);
  }

  return exports;
}

function registerImport(statement: ts.ImportDeclaration, scope: EvaluationScope): void {
  if (statement.importClause?.isTypeOnly === true) {
    return;
  }

  const moduleSpecifier = getModuleSpecifier(statement);
  if (moduleSpecifier !== "rpgmaker-event-dsl") {
    throw new Error(`Unsupported import source: ${moduleSpecifier}`);
  }

  if (statement.importClause === undefined) {
    return;
  }

  if (statement.importClause.name !== undefined) {
    throw new Error("Default imports are not allowed for Event Definitions.");
  }

  if (statement.importClause.namedBindings === undefined) {
    return;
  }

  if (ts.isNamespaceImport(statement.importClause.namedBindings)) {
    scope.bindings.set(statement.importClause.namedBindings.name.text, createDslNamespace());
    return;
  }

  for (const element of statement.importClause.namedBindings.elements) {
    if (element.isTypeOnly) {
      continue;
    }

    const importedName = element.propertyName?.text ?? element.name.text;
    const helper = getDslHelper(importedName);

    if (helper === undefined) {
      throw new Error(`Unsupported imported helper: ${importedName}`);
    }

    scope.bindings.set(element.name.text, helper);
  }
}

function evaluateExpression(node: ts.Expression, scope: EvaluationScope): unknown {
  if (ts.isParenthesizedExpression(node)) {
    return evaluateExpression(node.expression, scope);
  }

  if (
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    return evaluateExpression(node.expression, scope);
  }

  if (ts.isNonNullExpression(node)) {
    return evaluateExpression(node.expression, scope);
  }

  if (ts.isIdentifier(node)) {
    if (node.text === "undefined") {
      return undefined;
    }

    const value = scope.bindings.get(node.text);
    if (value === undefined && !scope.bindings.has(node.text)) {
      throw new Error(`Unknown identifier in Event Definition source: ${node.text}`);
    }

    return value;
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const operand = evaluateExpression(node.operand, scope);
    if (typeof operand !== "number") {
      throw new Error("Unary minus can only be applied to numbers in Event Definitions.");
    }

    return -operand;
  }

  if (ts.isArrayLiteralExpression(node)) {
    const output: unknown[] = [];

    for (const element of node.elements) {
      if (ts.isSpreadElement(element)) {
        const spreadValue = evaluateExpression(element.expression, scope);
        if (!Array.isArray(spreadValue)) {
          throw new Error("Array spreads must resolve to arrays.");
        }

        output.push(...spreadValue);
        continue;
      }

      output.push(evaluateExpression(element, scope));
    }

    return output;
  }

  if (ts.isObjectLiteralExpression(node)) {
    const output: Record<string, unknown> = {};

    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        const spreadValue = evaluateExpression(property.expression, scope);
        if (spreadValue === null || typeof spreadValue !== "object" || Array.isArray(spreadValue)) {
          throw new Error("Object spreads must resolve to plain objects.");
        }

        Object.assign(output, spreadValue);
        continue;
      }

      if (ts.isShorthandPropertyAssignment(property)) {
        output[property.name.text] = evaluateExpression(property.name, scope);
        continue;
      }

      if (!ts.isPropertyAssignment(property)) {
        throw new Error("Only object properties and spreads are allowed in Event Definitions.");
      }

      output[evaluatePropertyName(property.name)] = evaluateExpression(property.initializer, scope);
    }

    return output;
  }

  if (ts.isCallExpression(node)) {
    const callee = evaluateCallee(node.expression, scope);
    if (typeof callee !== "function") {
      throw new Error("Only DSL helper calls are allowed in Event Definitions.");
    }

    const args = node.arguments.map((argument) => evaluateExpression(argument, scope));
    return callee(...args);
  }

  if (ts.isPropertyAccessExpression(node)) {
    const target = evaluateExpression(node.expression, scope);
    if (target === null || (typeof target !== "object" && typeof target !== "function")) {
      throw new Error("Property access must target an object or namespace import.");
    }

    const record = target as Record<string, unknown>;
    const value = record[node.name.text];
    if (value === undefined && !(node.name.text in record)) {
      throw new Error(`Unknown property access in Event Definition source: ${node.name.text}`);
    }

    return value;
  }

  throw new Error(`Unsupported Event Definition expression: ${ts.SyntaxKind[node.kind]}`);
}

function evaluateCallee(node: ts.LeftHandSideExpression, scope: EvaluationScope): unknown {
  if (ts.isIdentifier(node)) {
    const value = scope.bindings.get(node.text);
    if (value === undefined && !scope.bindings.has(node.text)) {
      throw new Error(`Unknown DSL helper: ${node.text}`);
    }

    return value;
  }

  if (ts.isPropertyAccessExpression(node)) {
    const target = evaluateExpression(node.expression, scope);
    if (target === null || (typeof target !== "object" && typeof target !== "function")) {
      throw new Error("Property access must target an object or namespace import.");
    }

    const record = target as Record<string, unknown>;
    const value = record[node.name.text];
    if (value === undefined && !(node.name.text in record)) {
      throw new Error(`Unknown DSL helper: ${node.name.text}`);
    }

    return value;
  }

  throw new Error("Only identifier or property-access helper calls are allowed.");
}

function evaluatePropertyName(name: ts.PropertyName): string {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNoSubstitutionTemplateLiteral(name)
  ) {
    return name.text;
  }

  if (ts.isNumericLiteral(name)) {
    return name.text;
  }

  throw new Error("Only simple property names are allowed in Event Definitions.");
}

function getModuleSpecifier(statement: ts.ImportDeclaration): string {
  const moduleSpecifier = statement.moduleSpecifier;
  if (
    !ts.isStringLiteral(moduleSpecifier) &&
    !ts.isNoSubstitutionTemplateLiteral(moduleSpecifier)
  ) {
    throw new Error("Import sources must be string literals.");
  }

  return moduleSpecifier.text;
}

function createDslNamespace(): Record<string, unknown> {
  return {
    actorRef: getDslHelper("actorRef"),
    armorRef: getDslHelper("armorRef"),
    battleProcessing: getDslHelper("battleProcessing"),
    breakLoop: getDslHelper("breakLoop"),
    changeArmors: getDslHelper("changeArmors"),
    changeGold: getDslHelper("changeGold"),
    changeItems: getDslHelper("changeItems"),
    changePartyMember: getDslHelper("changePartyMember"),
    changeWeapons: getDslHelper("changeWeapons"),
    collectDslOwnedDeclarations: getDslHelper("collectDslOwnedDeclarations"),
    comment: getDslHelper("comment"),
    commonEvent: getDslHelper("commonEvent"),
    callCommonEvent: getDslHelper("callCommonEvent"),
    commonEventRef: getDslHelper("commonEventRef"),
    conditional: getDslHelper("conditional"),
    controlSelfSwitch: getDslHelper("controlSelfSwitch"),
    controlSwitches: getDslHelper("controlSwitches"),
    controlTimer: getDslHelper("controlTimer"),
    controlVariables: getDslHelper("controlVariables"),
    eraseEvent: getDslHelper("eraseEvent"),
    exitEvent: getDslHelper("exitEvent"),
    imageAsset: getDslHelper("imageAsset"),
    inputNumber: getDslHelper("inputNumber"),
    itemRef: getDslHelper("itemRef"),
    jumpToLabel: getDslHelper("jumpToLabel"),
    label: getDslHelper("label"),
    loop: getDslHelper("loop"),
    mapEvent: getDslHelper("mapEvent"),
    mapRef: getDslHelper("mapRef"),
    page: getDslHelper("page"),
    pluginCommand: getDslHelper("pluginCommand"),
    rawDslCommand: getDslHelper("rawDslCommand"),
    selectItem: getDslHelper("selectItem"),
    shopProcessing: getDslHelper("shopProcessing"),
    showChoices: getDslHelper("showChoices"),
    showScrollingText: getDslHelper("showScrollingText"),
    showText: getDslHelper("showText"),
    script: getDslHelper("script"),
    switchRef: getDslHelper("switchRef"),
    switchDefinition: getDslHelper("switchDefinition"),
    troopRef: getDslHelper("troopRef"),
    transferPlayer: getDslHelper("transferPlayer"),
    variableRef: getDslHelper("variableRef"),
    variableDefinition: getDslHelper("variableDefinition"),
    wait: getDslHelper("wait"),
    weaponRef: getDslHelper("weaponRef"),
  };
}

function getDslHelper(name: string): unknown {
  switch (name) {
    case "actorRef":
      return (value: { id: number } | { name: string }) => ({ kind: "actor", ...value });
    case "armorRef":
      return (value: { id: number } | { name: string }) => ({ kind: "armor", ...value });
    case "battleProcessing":
      return dsl.battleProcessing;
    case "breakLoop":
      return dsl.breakLoop;
    case "changeArmors":
      return dsl.changeArmors;
    case "changeGold":
      return dsl.changeGold;
    case "changeItems":
      return dsl.changeItems;
    case "changePartyMember":
      return dsl.changePartyMember;
    case "changeWeapons":
      return dsl.changeWeapons;
    case "collectDslOwnedDeclarations":
      return dsl.collectDslOwnedDeclarations;
    case "comment":
      return dsl.comment;
    case "commonEvent":
      return dsl.commonEvent;
    case "callCommonEvent":
      return dsl.callCommonEvent;
    case "commonEventRef":
      return dsl.commonEventRef;
    case "conditional":
      return dsl.conditional;
    case "controlSelfSwitch":
      return dsl.controlSelfSwitch;
    case "controlSwitches":
      return dsl.controlSwitches;
    case "controlTimer":
      return dsl.controlTimer;
    case "controlVariables":
      return dsl.controlVariables;
    case "eraseEvent":
      return dsl.eraseEvent;
    case "exitEvent":
      return dsl.exitEvent;
    case "imageAsset":
      return dsl.imageAsset;
    case "inputNumber":
      return dsl.inputNumber;
    case "itemRef":
      return dsl.itemRef;
    case "jumpToLabel":
      return dsl.jumpToLabel;
    case "label":
      return dsl.label;
    case "loop":
      return dsl.loop;
    case "mapEvent":
      return dsl.mapEvent;
    case "mapRef":
      return dsl.mapRef;
    case "page":
      return dsl.page;
    case "pluginCommand":
      return dsl.pluginCommand;
    case "rawDslCommand":
      return dsl.rawDslCommand;
    case "selectItem":
      return dsl.selectItem;
    case "shopProcessing":
      return dsl.shopProcessing;
    case "showChoices":
      return dsl.showChoices;
    case "showScrollingText":
      return dsl.showScrollingText;
    case "showText":
      return dsl.showText;
    case "script":
      return dsl.script;
    case "switchDefinition":
      return dsl.switchDefinition;
    case "switchRef":
      return dsl.switchRef;
    case "troopRef":
      return dsl.troopRef;
    case "transferPlayer":
      return dsl.transferPlayer;
    case "variableRef":
      return dsl.variableRef;
    case "variableDefinition":
      return dsl.variableDefinition;
    case "wait":
      return dsl.wait;
    case "weaponRef":
      return dsl.weaponRef;
    default:
      return undefined;
  }
}

function isIgnorableStatement(statement: ts.Statement): boolean {
  return ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement);
}

function formatDiagnostics(filePath: string, diagnostics: readonly ts.Diagnostic[]): string {
  const header = `TypeScript diagnostics failed for ${filePath}:`;
  const lines = diagnostics.map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    if (diagnostic.file === undefined || diagnostic.start === undefined) {
      return `- ${message}`;
    }

    const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return `- ${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} ${message}`;
  });

  return [header, ...lines].join("\n");
}

function formatSourceError(filePath: string, message: string): string {
  return [`TypeScript diagnostics failed for ${filePath}:`, `- ${message}`].join("\n");
}

function normalizePath(input: string): string {
  return input.replaceAll("\\", "/");
}
