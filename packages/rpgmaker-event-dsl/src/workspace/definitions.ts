import { basename, dirname, matchesGlob, relative, resolve } from "node:path";

import * as ts from "typescript";

import * as dsl from "../authoring/index.js";
import { isDslOwnedDeclaration, type DslOwnedDeclaration } from "../domain/declarations.js";
import { collectDslOwnedDeclarations } from "../validation/declarations.js";
import { TypeInputCapture } from "./type-inputs.js";
import {
  captureSourceUse,
  rememberCapturedLocation,
  type SourceLocation,
} from "./source-provenance.js";
import { resolveLocalValueModule } from "./source-modules.js";

export { discoverDefinitionFiles, type DefinitionSourceDiscovery } from "./source-discovery.js";

const dslHelpers: ReadonlySet<unknown> = new Set(
  Object.values(dsl).filter((value) => typeof value === "function"),
);
const declarationHelpers: ReadonlySet<unknown> = new Set([
  dsl.commonEvent,
  dsl.mapEvent,
  dsl.troopEvent,
  dsl.variableDefinition,
  dsl.switchDefinition,
]);

type EvaluationScope = {
  bindings: Map<string, unknown>;
  sourceFile: ts.SourceFile;
  parent?: EvaluationScope;
  calls: readonly AuthorFunction[];
  importModule?: (statement: ts.ImportDeclaration) => Record<string, unknown>;
};

type AuthorFunction = {
  name: string;
  node: ts.FunctionDeclaration | ts.ArrowFunction;
  closure: EvaluationScope;
};

// Author functions are inert tokens, never executable host functions. Their AST and
// lexical environment are private and cannot be reached through authored properties.
const authorFunctions = new WeakMap<object, AuthorFunction>();
const uninitializedBinding = Symbol("uninitialized binding");

function createAuthorFunction(
  name: string,
  node: AuthorFunction["node"],
  closure: EvaluationScope,
): object {
  if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
    throw sourceError(node, closure, "Default exports are unsupported for author functions.");
  }
  if (
    node.parameters.length > 1 ||
    node.parameters.some(
      (parameter) =>
        (!ts.isIdentifier(parameter.name) && !ts.isObjectBindingPattern(parameter.name)) ||
        (ts.isIdentifier(parameter.name) && parameter.name.text === "this") ||
        parameter.initializer ||
        parameter.dotDotDotToken ||
        (ts.isObjectBindingPattern(parameter.name) &&
          parameter.name.elements.some(
            (element) =>
              !ts.isIdentifier(element.name) ||
              element.initializer ||
              element.dotDotDotToken ||
              (element.propertyName && !ts.isIdentifier(element.propertyName)),
          )),
    ) ||
    node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ||
    (ts.isFunctionDeclaration(node) && node.asteriskToken) ||
    !node.body
  ) {
    throw sourceError(
      node,
      closure,
      "Author functions require zero parameters or one named options object; defaults, rest, async and generators are unsupported.",
    );
  }
  if (ts.isBlock(node.body)) {
    for (const [index, statement] of node.body.statements.entries()) {
      if (
        index === node.body.statements.length - 1 &&
        ts.isReturnStatement(statement) &&
        statement.expression
      ) {
        validateAuthorExpression(statement.expression, closure);
        continue;
      }
      if (
        !ts.isVariableStatement(statement) ||
        (statement.declarationList.flags & ts.NodeFlags.Const) === 0
      ) {
        throw sourceError(
          statement,
          closure,
          "Author function blocks require const declarations followed by one return.",
        );
      }
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
          throw sourceError(
            declaration,
            closure,
            "Author function locals require named const initializers.",
          );
        }
        validateAuthorExpression(declaration.initializer, closure);
      }
    }
    const last = node.body.statements.at(-1);
    if (!last || !ts.isReturnStatement(last) || !last.expression) {
      throw sourceError(
        node.body,
        closure,
        "Author function blocks require a final return expression.",
      );
    }
  } else {
    validateAuthorExpression(node.body, closure);
  }
  const token = Object.freeze(Object.create(null) as object);
  authorFunctions.set(token, { name, node, closure });
  return token;
}

class SourceEvaluationError extends Error {}

function sourceError(node: ts.Node, scope: EvaluationScope, message: string): Error {
  const position = scope.sourceFile.getLineAndCharacterOfPosition(node.getStart(scope.sourceFile));
  return new SourceEvaluationError(
    `${scope.sourceFile.fileName}:${position.line + 1}:${position.character + 1} ${message}`,
  );
}

function sourceLocation(node: ts.Node, scope: EvaluationScope): SourceLocation {
  const position = scope.sourceFile.getLineAndCharacterOfPosition(node.getStart(scope.sourceFile));
  return {
    file: scope.sourceFile.fileName,
    line: position.line + 1,
    column: position.character + 1,
  };
}

function validateAuthorExpression(node: ts.Expression, scope: EvaluationScope): void {
  const validate = (child: ts.Expression) => validateAuthorExpression(child, scope);
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isNonNullExpression(node)
  ) {
    validate(node.expression);
    return;
  }
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword
  )
    return;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    validate(node.operand);
    return;
  }
  if (ts.isPropertyAccessExpression(node) && !node.questionDotToken) {
    validate(node.expression);
    return;
  }
  if (ts.isCallExpression(node) && !node.questionDotToken) {
    if (!ts.isIdentifier(node.expression) && !ts.isPropertyAccessExpression(node.expression)) {
      throw sourceError(
        node,
        scope,
        "Only identifier or property-access helper calls are allowed.",
      );
    }
    validate(node.expression);
    node.arguments.forEach(validate);
    return;
  }
  if (ts.isArrayLiteralExpression(node)) {
    for (const element of node.elements)
      validate(ts.isSpreadElement(element) ? element.expression : element);
    return;
  }
  if (ts.isObjectLiteralExpression(node)) {
    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) validate(property.expression);
      else if (ts.isShorthandPropertyAssignment(property) && !property.objectAssignmentInitializer)
        validate(property.name);
      else if (ts.isPropertyAssignment(property)) {
        try {
          evaluatePropertyName(property.name);
        } catch (error) {
          throw sourceError(property.name, scope, (error as Error).message);
        }
        validate(property.initializer);
      } else
        throw sourceError(
          property,
          scope,
          "Only object properties and spreads are allowed in author functions.",
        );
    }
    return;
  }
  throw sourceError(
    node,
    scope,
    `Unsupported author function expression: ${ts.SyntaxKind[node.kind]}`,
  );
}

/** Check unused bodies without executing them. Locals resolve only inert aliases;
 * parameters and call results never confer permission to invoke a function. */
function validateAuthorCalls(author: AuthorFunction): ReadonlySet<AuthorFunction> {
  const called = new Set<AuthorFunction>();
  const locals = new Map<string, ts.Expression | undefined>();
  for (const parameter of author.node.parameters) {
    if (ts.isIdentifier(parameter.name)) locals.set(parameter.name.text, undefined);
    else if (ts.isObjectBindingPattern(parameter.name)) {
      for (const element of parameter.name.elements)
        locals.set((element.name as ts.Identifier).text, undefined);
    }
  }
  const body = author.node.body!;
  if (ts.isBlock(body)) {
    for (const statement of body.statements) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        locals.set((declaration.name as ts.Identifier).text, declaration.initializer);
      }
    }
  }
  const resolving = new Set<string>();
  const resolveValue = (node: ts.Expression): unknown => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return resolveValue(node.expression);
    if (ts.isIdentifier(node)) {
      if (node.text === "undefined") return undefined;
      if (!locals.has(node.text)) return lookupBinding(node.text, author.closure);
      const initializer = locals.get(node.text);
      if (!initializer || resolving.has(node.text)) return undefined;
      resolving.add(node.text);
      try {
        return resolveValue(initializer);
      } finally {
        resolving.delete(node.text);
      }
    }
    if (ts.isPropertyAccessExpression(node)) {
      const target = resolveValue(node.expression);
      if (target && (typeof target === "object" || typeof target === "function")) {
        return (target as Record<string, unknown>)[node.name.text];
      }
    }
    if (ts.isObjectLiteralExpression(node)) {
      const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property))
          result[evaluatePropertyName(property.name)] = resolveValue(property.initializer);
        else if (ts.isShorthandPropertyAssignment(property))
          result[property.name.text] = resolveValue(property.name);
        else if (ts.isSpreadAssignment(property)) {
          const spread = resolveValue(property.expression);
          if (spread && typeof spread === "object") {
            for (const [key, value] of Object.entries(spread)) result[key] = value;
          }
        }
      }
      return result;
    }
    return undefined;
  };
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const value = resolveValue(node.expression);
      if (declarationHelpers.has(value)) {
        throw sourceError(
          node,
          author.closure,
          "Author functions cannot return functions or Event Definitions; declare event identities at module scope.",
        );
      }
      if (
        !dslHelpers.has(value) &&
        !(value && typeof value === "object" && authorFunctions.has(value))
      ) {
        throw sourceError(
          node,
          author.closure,
          "Only DSL helpers or supported author functions may be called; host methods and higher-order calls are unsupported.",
        );
      }
      const target = value && typeof value === "object" ? authorFunctions.get(value) : undefined;
      if (target) called.add(target);
    }
    if (ts.isReturnStatement(node) && node.expression) {
      assertAuthorResult(resolveValue(node.expression), node.expression, author.closure);
    }
    ts.forEachChild(node, visit);
  };
  if (!ts.isBlock(body)) assertAuthorResult(resolveValue(body), body, author.closure);
  visit(body);
  return called;
}

function containsForbiddenAuthorValue(value: unknown, declarations: boolean): boolean {
  if (typeof value === "function") return true;
  if (!value || typeof value !== "object") return false;
  if (authorFunctions.has(value)) return true;
  if (declarations && isDslOwnedDeclaration(value)) return true;
  return Object.values(value).some((child) => containsForbiddenAuthorValue(child, declarations));
}

function assertAuthorResult(value: unknown, node: ts.Node, scope: EvaluationScope): void {
  if (containsForbiddenAuthorValue(value, true)) {
    throw sourceError(
      node,
      scope,
      "Author functions cannot return functions or Event Definitions.",
    );
  }
}

function lookupBinding(name: string, scope: EvaluationScope): unknown {
  if (scope.bindings.has(name)) {
    const value = scope.bindings.get(name);
    if (value === uninitializedBinding)
      throw new Error(`Cannot access binding "${name}" before initialization.`);
    return value;
  }
  if (scope.parent) return lookupBinding(name, scope.parent);
  throw new Error(`Unknown identifier in Event Definition source: ${name}`);
}

function callAuthorFunction(
  author: AuthorFunction,
  args: unknown[],
  caller: EvaluationScope,
): unknown {
  const cycle = caller.calls.indexOf(author);
  if (cycle !== -1) {
    throw new Error(
      `Recursive author function call: ${[...caller.calls.slice(cycle), author].map((entry) => entry.name).join(" -> ")}`,
    );
  }
  const scope: EvaluationScope = {
    bindings: new Map(),
    sourceFile: author.closure.sourceFile,
    parent: author.closure,
    calls: [...caller.calls, author],
  };
  const parameter = author.node.parameters[0];
  if (args.length !== author.node.parameters.length) {
    throw new Error(
      `Author function ${author.name} expects ${author.node.parameters.length} arguments.`,
    );
  }
  if (parameter) {
    const options = args[0];
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new Error(`Author function ${author.name} requires an options object.`);
    }
    if (containsForbiddenAuthorValue(options, false)) {
      throw new Error(
        `Author function ${author.name} does not accept functions in its options object.`,
      );
    }
    if (ts.isIdentifier(parameter.name)) scope.bindings.set(parameter.name.text, options);
    else if (ts.isObjectBindingPattern(parameter.name)) {
      for (const element of parameter.name.elements) {
        const name = element.name as ts.Identifier;
        const property = (element.propertyName as ts.Identifier | undefined)?.text ?? name.text;
        scope.bindings.set(name.text, (options as Record<string, unknown>)[property]);
      }
    }
  }
  const body = author.node.body!;
  const evaluateReturn = (expression: ts.Expression): unknown => {
    const result = evaluateExpression(expression, scope);
    assertAuthorResult(result, expression, scope);
    return result;
  };
  if (!ts.isBlock(body)) return evaluateReturn(body);
  declareConstBindings(body.statements, scope);
  for (const statement of body.statements) {
    if (ts.isReturnStatement(statement) && statement.expression) {
      return evaluateReturn(statement.expression);
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
          throw new Error("Author function locals require named const initializers.");
        }
        scope.bindings.set(
          declaration.name.text,
          evaluateExpression(declaration.initializer, scope),
        );
      }
    }
  }
  return undefined;
}

function declareConstBindings(statements: readonly ts.Statement[], scope: EvaluationScope): void {
  for (const statement of statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name))
        scope.bindings.set(declaration.name.text, uninitializedBinding);
    }
  }
}

function unwrapExpression(node: ts.Expression): ts.Expression {
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isNonNullExpression(node)
  )
    node = node.expression;
  return node;
}

export async function loadDefinitionFile(
  filePath: string,
  capture = new TypeInputCapture(),
  sourceRoot = dirname(filePath),
): Promise<DslOwnedDeclaration[]> {
  const modules = new Map<string, Record<string, unknown>>();
  const loading: { key: string; path: string }[] = [];
  const loadModule = (path: string): Record<string, unknown> => {
    const key = normalizePath(capture.realpath(path));
    const cached = modules.get(key);
    if (cached) return cached;
    const cycle = loading.findIndex((entry) => entry.key === key);
    if (cycle !== -1) {
      throw new Error(
        `Value-module cycle: ${[...loading.slice(cycle).map((entry) => entry.path), path].join(" -> ")}`,
      );
    }
    const sourceText = capture.readFile(path);
    if (sourceText === undefined) throw new Error(`Definition Source is missing: ${path}`);
    const sourceFile = ts.createSourceFile(
      path,
      sourceText,
      ts.ScriptTarget.ES2023,
      true,
      ts.ScriptKind.TS,
    );

    const diagnostics = collectDiagnostics(path, sourceFile, capture);
    if (diagnostics.length > 0) {
      throw new Error(formatDiagnostics(path, diagnostics));
    }

    loading.push({ key, path });
    try {
      const exports = evaluateModule(sourceFile, (statement) =>
        loadModule(
          resolveLocalValueModule(
            getModuleSpecifier(statement),
            sourceFile.fileName,
            capture,
            sourceRoot,
          ),
        ),
      );
      modules.set(key, exports);
      return exports;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(formatSourceError(path, error.message));
      }

      throw error;
    } finally {
      loading.pop();
    }
  };

  return collectDslOwnedDeclarations(loadModule(filePath));
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

function evaluateModule(
  sourceFile: ts.SourceFile,
  importModule?: EvaluationScope["importModule"],
): Record<string, unknown> {
  const scope: EvaluationScope = {
    bindings: new Map<string, unknown>(),
    sourceFile,
    calls: [],
    ...(importModule === undefined ? {} : { importModule }),
  };
  const exports: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  const namedExports: ts.ExportSpecifier[] = [];

  declareConstBindings(sourceFile.statements, scope);
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      try {
        registerImport(statement, scope);
      } catch (error) {
        throw sourceError(statement, scope, error instanceof Error ? error.message : String(error));
      }
    }
    if (ts.isFunctionDeclaration(statement)) {
      if (!statement.name) throw sourceError(statement, scope, "Author functions require a name.");
      scope.bindings.set(
        statement.name.text,
        createAuthorFunction(statement.name.text, statement, scope),
      );
    }
  }

  for (const statement of sourceFile.statements) {
    try {
      if (ts.isEmptyStatement(statement)) {
        continue;
      }

      if (ts.isImportDeclaration(statement)) {
        continue;
      }

      if (ts.isFunctionDeclaration(statement)) {
        if (!statement.name) throw new Error("Author functions require a name.");
        const value = lookupBinding(statement.name.text, scope);
        if (
          statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
        ) {
          exports[statement.name.text] = value;
        }
        continue;
      }

      if (ts.isExportAssignment(statement)) {
        throw new Error("Default export is not allowed for Event Definitions.");
      }

      if (ts.isExportDeclaration(statement)) {
        if (statement.isTypeOnly) continue;
        if (statement.moduleSpecifier !== undefined) {
          throw new Error("Re-exporting from other modules is not allowed for Event Definitions.");
        }

        if (statement.exportClause === undefined || !ts.isNamedExports(statement.exportClause)) {
          throw new Error("Only named exports are allowed for Event Definitions.");
        }

        for (const specifier of statement.exportClause.elements) {
          if (specifier.isTypeOnly) continue;
          namedExports.push(specifier);
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

          const initializer = unwrapExpression(declaration.initializer);
          const value = ts.isArrowFunction(initializer)
            ? createAuthorFunction(declaration.name.text, initializer, scope)
            : evaluateExpression(declaration.initializer, scope);
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
    } catch (error) {
      const position = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile));
      throw new Error(
        `${sourceFile.fileName}:${position.line + 1}:${position.character + 1} ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  for (const specifier of namedExports) {
    const name = specifier.propertyName?.text ?? specifier.name.text;
    if (!scope.bindings.has(name)) {
      throw new Error(`Exported binding "${name}" was not declared in the file.`);
    }
    exports[specifier.name.text] = scope.bindings.get(name);
  }
  const checked = new Set<AuthorFunction>();
  const validateCalls = (author: AuthorFunction, chain: readonly AuthorFunction[]): void => {
    if (chain.includes(author)) {
      throw sourceError(
        author.node,
        author.closure,
        `Recursive author function call: ${[...chain, author].map((entry) => entry.name).join(" -> ")}`,
      );
    }
    if (checked.has(author)) return;
    for (const called of validateAuthorCalls(author)) validateCalls(called, [...chain, author]);
    checked.add(author);
  };
  for (const value of scope.bindings.values()) {
    const author = value && typeof value === "object" ? authorFunctions.get(value) : undefined;
    if (author?.closure === scope) validateCalls(author, []);
  }
  return exports;
}

function registerImport(statement: ts.ImportDeclaration, scope: EvaluationScope): void {
  const namedBindings = statement.importClause?.namedBindings;
  if (
    statement.importClause?.isTypeOnly === true ||
    (statement.importClause?.name === undefined &&
      namedBindings &&
      ts.isNamedImports(namedBindings) &&
      namedBindings.elements.length > 0 &&
      namedBindings.elements.every((element) => element.isTypeOnly))
  ) {
    return;
  }

  const moduleSpecifier = getModuleSpecifier(statement);
  if (moduleSpecifier !== "rpgmaker-event-dsl") {
    const clause = statement.importClause;
    if (
      !scope.importModule ||
      clause?.name ||
      !clause?.namedBindings ||
      !ts.isNamedImports(clause.namedBindings)
    ) {
      throw new Error(`Only named local value imports are supported: ${moduleSpecifier}`);
    }
    const exports = scope.importModule(statement);
    for (const element of clause.namedBindings.elements) {
      if (element.isTypeOnly) continue;
      const name = element.propertyName?.text ?? element.name.text;
      if (!Object.hasOwn(exports, name)) {
        throw new Error(`Module ${moduleSpecifier} has no named export ${name}.`);
      }
      scope.bindings.set(element.name.text, exports[name]);
    }
    return;
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
  try {
    return evaluateExpressionValue(node, scope);
  } catch (error) {
    if (error instanceof SourceEvaluationError) throw error;
    throw sourceError(node, scope, error instanceof Error ? error.message : String(error));
  }
}

function evaluateExpressionValue(node: ts.Expression, scope: EvaluationScope): unknown {
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

    try {
      return captureSourceUse(
        lookupBinding(node.text, scope),
        { location: sourceLocation(node, scope) },
        (value) => authorFunctions.has(value),
      );
    } catch (error) {
      throw sourceError(node, scope, error instanceof Error ? error.message : String(error));
    }
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

    const position = scope.sourceFile.getLineAndCharacterOfPosition(
      node.getStart(scope.sourceFile),
    );
    rememberCapturedLocation(output, {
      file: scope.sourceFile.fileName,
      line: position.line + 1,
      column: position.character + 1,
    });
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

    const position = scope.sourceFile.getLineAndCharacterOfPosition(
      node.getStart(scope.sourceFile),
    );
    rememberCapturedLocation(output, {
      file: scope.sourceFile.fileName,
      line: position.line + 1,
      column: position.character + 1,
    });
    return output;
  }

  if (ts.isCallExpression(node)) {
    const callee = evaluateCallee(node.expression, scope);
    const author = callee && typeof callee === "object" ? authorFunctions.get(callee) : undefined;
    if (!author && (typeof callee !== "function" || !dslHelpers.has(callee))) {
      throw new Error(
        "Only DSL helper calls or supported author functions are allowed in Event Definitions.",
      );
    }

    const args = node.arguments.map((argument) => evaluateExpression(argument, scope));
    let result: unknown;
    try {
      result = author
        ? callAuthorFunction(author, args, scope)
        : (callee as (...args: unknown[]) => unknown)(...args);
    } catch (error) {
      const definition = author
        ? `Author function ${author.name} defined at ${sourceError(author.node, author.closure, "").message.trim()}: `
        : "";
      throw sourceError(
        node,
        scope,
        `${definition}${error instanceof Error ? error.message : String(error)}`,
      );
    }
    if (author)
      return captureSourceUse(
        result,
        {
          location: sourceLocation(node, scope),
          call: { name: author.name, definition: sourceLocation(author.node, author.closure) },
        },
        (value) => authorFunctions.has(value),
      );
    rememberCapturedLocation(result, sourceLocation(node, scope));
    return result;
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
    return lookupBinding(node.text, scope);
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
