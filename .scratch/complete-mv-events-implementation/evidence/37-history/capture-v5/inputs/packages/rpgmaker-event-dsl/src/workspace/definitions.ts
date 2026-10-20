import { basename, dirname, matchesGlob, relative, resolve } from "node:path";

import * as ts from "typescript";

import * as dsl from "../authoring/index.js";
import type { DslOwnedDeclaration } from "../domain/declarations.js";
import { collectDslOwnedDeclarations } from "../validation/declarations.js";
import { TypeInputCapture } from "./type-inputs.js";

export { discoverDefinitionFiles, type DefinitionSourceDiscovery } from "./source-discovery.js";

type EvaluationScope = {
  bindings: Map<string, unknown>;
};

export async function loadDefinitionFile(
  filePath: string,
  capture = new TypeInputCapture(),
): Promise<DslOwnedDeclaration[]> {
  const sourceText = capture.readFile(filePath);
  if (sourceText === undefined) throw new Error(`Definition Source is missing: ${filePath}`);
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ES2023,
    true,
    ts.ScriptKind.TS,
  );

  const diagnostics = collectDiagnostics(filePath, sourceFile, capture);
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

/** Immutable candidate bytes at final filenames; all other reads remain captured real inputs. */
export function loadVirtualDefinitionFiles(
  files: ReadonlyMap<string, string>,
  capture: TypeInputCapture,
): DslOwnedDeclaration[] {
  const options: ts.CompilerOptions = {
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2023,
    verbatimModuleSyntax: true,
  };
  const content = new Map<string, string>();
  const paths = new Map<string, string>();
  const directories = new Set<string>();
  for (const [path, text] of files) {
    let ancestor = dirname(path);
    const missing: string[] = [];
    while (!capture.directoryExists(ancestor)) {
      missing.push(ancestor);
      const parent = dirname(ancestor);
      if (parent === ancestor)
        throw new Error(`Cannot locate candidate filesystem ancestor: ${path}`);
      ancestor = parent;
    }
    const physical = resolve(capture.realpath(ancestor), relative(ancestor, path));
    for (const candidate of [path, physical]) {
      content.set(normalizePath(candidate), text);
      paths.set(normalizePath(candidate), physical);
    }
    for (const directory of missing) {
      const physicalDirectory = resolve(capture.realpath(ancestor), relative(ancestor, directory));
      directories.add(normalizePath(directory));
      directories.add(normalizePath(physicalDirectory));
      paths.set(normalizePath(directory), physicalDirectory);
      paths.set(normalizePath(physicalDirectory), physicalDirectory);
    }
  }
  const read = (path: string) => content.get(normalizePath(path)) ?? capture.readFile(path);
  const host = ts.createCompilerHost(options, true);
  host.getCurrentDirectory = () => capture.currentDirectory;
  host.readFile = read;
  host.fileExists = (path) => content.has(normalizePath(path)) || capture.fileExists(path);
  host.directoryExists = (path) =>
    directories.has(normalizePath(path)) || capture.directoryExists(path);
  host.realpath = (path) => paths.get(normalizePath(path)) ?? capture.realpath(path);
  host.getDirectories = (path) =>
    [
      ...new Set([
        ...capture.getDirectories(path),
        ...[...directories]
          .filter((directory) => normalizePath(dirname(directory)) === normalizePath(path))
          .map((directory) => basename(directory)),
      ]),
    ].sort();
  host.readDirectory = (path, extensions, excludes, includes, depth) =>
    [
      ...new Set([
        ...capture.readDirectory(path, extensions, excludes, includes, depth),
        ...[...files.keys()].filter((file) => {
          const name = relative(path, file).replaceAll("\\", "/");
          return (
            name !== ".." &&
            !name.startsWith("../") &&
            (depth === undefined || name.split("/").length - 1 <= depth) &&
            (!extensions || extensions.some((extension) => name.endsWith(extension))) &&
            (!includes || includes.some((pattern) => matchesGlob(name, pattern))) &&
            !excludes?.some((pattern) => matchesGlob(name, pattern))
          );
        }),
      ]),
    ].sort();
  host.getSourceFile = (path, version) => {
    const text = read(path);
    return text === undefined ? undefined : ts.createSourceFile(path, text, version, true);
  };
  const program = ts.createProgram([...files.keys()], options, host);
  const declarations: DslOwnedDeclaration[] = [];
  for (const path of files.keys()) {
    const source = program.getSourceFile(path);
    if (!source) throw new Error(`Candidate source is missing at final location: ${path}`);
    const diagnostics = [
      ...program.getSyntacticDiagnostics(source),
      ...program.getSemanticDiagnostics(source),
    ];
    if (diagnostics.length) throw new Error(formatDiagnostics(path, diagnostics));
    try {
      declarations.push(...collectDslOwnedDeclarations(evaluateModule(source)));
    } catch (error) {
      throw new Error(
        formatSourceError(path, error instanceof Error ? error.message : String(error)),
      );
    }
  }
  return declarations;
}

function collectDiagnostics(
  filePath: string,
  sourceFile: ts.SourceFile,
  capture: TypeInputCapture,
): readonly ts.Diagnostic[] {
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
  host.getCurrentDirectory = () => capture.currentDirectory;
  host.readFile = capture.readFile;
  host.fileExists = capture.fileExists;
  host.directoryExists = capture.directoryExists;
  host.getDirectories = capture.getDirectories;
  host.realpath = capture.realpath;
  host.readDirectory = capture.readDirectory;

  host.getSourceFile = (requestedFileName, languageVersion) => {
    if (normalizePath(requestedFileName) === normalizePath(filePath)) {
      return sourceFile;
    }

    const text = capture.readFile(requestedFileName);
    return text === undefined
      ? undefined
      : ts.createSourceFile(requestedFileName, text, languageVersion, true);
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
  const exports: Record<string, unknown> = Object.create(null) as Record<string, unknown>;

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
    const set = (key: string, value: unknown) =>
      Object.defineProperty(output, key, {
        value,
        enumerable: true,
        configurable: true,
        writable: true,
      });

    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) {
        const spreadValue = evaluateExpression(property.expression, scope);
        if (spreadValue === null || typeof spreadValue !== "object" || Array.isArray(spreadValue)) {
          throw new Error("Object spreads must resolve to plain objects.");
        }

        for (const [key, value] of Object.entries(spreadValue)) set(key, value);
        continue;
      }

      if (ts.isShorthandPropertyAssignment(property)) {
        set(property.name.text, evaluateExpression(property.name, scope));
        continue;
      }

      if (!ts.isPropertyAssignment(property)) {
        throw new Error("Only object properties and spreads are allowed in Event Definitions.");
      }

      set(evaluatePropertyName(property.name), evaluateExpression(property.initializer, scope));
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
  if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression))
    return name.expression.text;
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
  return Object.fromEntries(
    Object.entries(dsl).filter(([, helper]) => typeof helper === "function"),
  );
}

function getDslHelper(name: string): unknown {
  const candidate = (dsl as Record<string, unknown>)[name];
  return typeof candidate === "function" ? candidate : undefined;
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
  const path = input.replaceAll("\\", "/");
  return process.platform === "win32" ? path.toLowerCase() : path;
}
