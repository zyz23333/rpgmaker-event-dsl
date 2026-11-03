import * as ts from "typescript";
import * as dsl from "../authoring/index.js";
import { referenceKinds } from "../domain/references.js";
import { resolveLocalValueModule } from "./source-modules.js";
import type { TypeInputCapture } from "./type-inputs.js";

type ObjectValue = {
  object: true;
  field: (key: string, presence?: boolean) => Value;
  fromAuthor?: true;
};
type HelperValue = { helper: string };
type Lookup = (name: string) => Value;
type AuthorValue = {
  author: true;
  name: string;
  invoke: (args: (() => Value)[], calls: readonly AuthorValue[]) => Value;
};
const missing = Symbol("absent own identity field");
type Value =
  | string
  | number
  | boolean
  | null
  | undefined
  | typeof missing
  | ObjectValue
  | HelperValue
  | AuthorValue
  | { opaque: true };
const opaque = { opaque: true } as const;
const declarationKinds: Record<string, string> = {
  mapEvent: "mapEvent",
  commonEvent: "commonEvent",
  troopEvent: "troopEvent",
  switchDefinition: "switchDefinition",
  variableDefinition: "variableDefinition",
};
const referenceHelpers = new Map<string, string>(
  referenceKinds.map((kind) => [`${kind}Ref`, kind]),
);

type IdentityModule = { exported: Map<string, string>; binding: (name: string) => Value };
type ImportModule = (name: string, containingFile: string) => IdentityModule;

/** Read only declaration identity; unrelated fields and command constructors are never evaluated. */
export function definitionIdentities(
  filePath: string,
  text: string,
  context?: { capture: TypeInputCapture; sourceRoot: string },
): string[] {
  const modules = new Map<string, IdentityModule>();
  const importModule: ImportModule = (name, containingFile) => {
    if (!context) throw new Error("Local value imports require captured source context.");
    const path = resolveLocalValueModule(name, containingFile, context.capture, context.sourceRoot);
    const key = context.capture.realpath(path).toLowerCase();
    let loaded = modules.get(key);
    if (!loaded) {
      const contents = context.capture.readFile(path);
      if (contents === undefined) throw new Error(`Cannot read identity dependency ${path}.`);
      loaded = identityModule(path, contents, importModule);
      modules.set(key, loaded);
    }
    return loaded;
  };
  const module = identityModule(filePath, text, importModule);
  if (context) modules.set(context.capture.realpath(filePath).toLowerCase(), module);
  return collectIdentities(module, filePath);
}

function identityModule(
  filePath: string,
  text: string,
  importModule: ImportModule,
): IdentityModule {
  const fail = (detail: string): never => {
    throw new Error(`MV-DECOMPILE-IDENTITY ${filePath}: ${detail}`);
  };
  const diagnostics =
    ts.transpileModule(text, {
      fileName: filePath,
      reportDiagnostics: true,
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).diagnostics ?? [];
  if (diagnostics.length) fail(ts.flattenDiagnosticMessageText(diagnostics[0]!.messageText, "\n"));
  const source = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.ES2023,
    true,
    ts.ScriptKind.TS,
  );
  const bindings = new Map<string, ts.Expression | Value | (() => Value)>();
  const exported = new Map<string, string>();
  const helper = (name: string): HelperValue => {
    if (typeof (dsl as Record<string, unknown>)[name] !== "function")
      fail(`Unknown DSL helper ${name}.`);
    return { helper: name };
  };
  const namespace: ObjectValue = { object: true, field: helper };
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const named = statement.importClause?.namedBindings;
      if (
        statement.importClause?.isTypeOnly ||
        (named &&
          ts.isNamedImports(named) &&
          named.elements.length > 0 &&
          named.elements.every((element) => element.isTypeOnly))
      )
        continue;
      if (!ts.isStringLiteral(statement.moduleSpecifier)) fail("Unsupported value import source.");
      const moduleName = (statement.moduleSpecifier as ts.StringLiteral).text;
      if (statement.importClause?.name) fail("Default import is not allowed.");
      if (moduleName !== "rpgmaker-event-dsl") {
        if (!named || !ts.isNamedImports(named))
          fail("Only named local value imports are supported.");
        for (const element of (named as ts.NamedImports).elements) {
          if (element.isTypeOnly) continue;
          bindings.set(element.name.text, () => {
            try {
              const dependency = importModule(moduleName, filePath);
              const name = element.propertyName?.text ?? element.name.text;
              const local = dependency.exported.get(name);
              if (local === undefined) fail(`Module ${moduleName} has no named export ${name}.`);
              return dependency.binding(local!);
            } catch (error) {
              const position = source.getLineAndCharacterOfPosition(element.getStart(source));
              throw new Error(
                `MV-DECOMPILE-IDENTITY ${filePath}:${position.line + 1}:${position.character + 1} ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          });
        }
        continue;
      }
      if (named && ts.isNamespaceImport(named)) bindings.set(named.name.text, namespace);
      else if (named)
        for (const element of named.elements)
          if (!element.isTypeOnly)
            bindings.set(element.name.text, {
              helper: element.propertyName?.text ?? element.name.text,
            });
    } else if (ts.isFunctionDeclaration(statement)) {
      if (!statement.name) fail("Expected a named function.");
      const name = statement.name!.text;
      bindings.set(name, () => authorFunction(statement, name, binding));
      if (statement.modifiers?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword))
        exported.set(name, name);
    } else if (ts.isVariableStatement(statement)) {
      if (!(statement.declarationList.flags & ts.NodeFlags.Const))
        fail("Only const bindings are supported.");
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer)
          fail("Expected a named initialized const.");
        const name = (declaration.name as ts.Identifier).text;
        if (bindings.has(name)) fail(`Duplicate binding ${name}.`);
        bindings.set(name, declaration.initializer!);
        if (statement.modifiers?.some((item) => item.kind === ts.SyntaxKind.ExportKeyword))
          exported.set(name, name);
      }
    } else if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
      if (
        statement.moduleSpecifier ||
        !statement.exportClause ||
        !ts.isNamedExports(statement.exportClause)
      )
        fail("Only local named exports are supported.");
      for (const element of (statement.exportClause as ts.NamedExports).elements)
        if (!element.isTypeOnly)
          exported.set(element.name.text, element.propertyName?.text ?? element.name.text);
    } else if (
      ts.isEmptyStatement(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    )
      continue;
    else fail(`Unsupported statement ${ts.SyntaxKind[statement.kind]}.`);
  }
  const resolving = new Set<string>();
  const memo = new Map<string, Value>();
  const fields = new WeakMap<ObjectValue, Set<string>>();
  const read = (value: Value, key: string, presence = false): Value => {
    if (!value || typeof value !== "object" || !("object" in value))
      return fail(`Cannot reliably determine field ${key}.`);
    const active = fields.get(value) ?? new Set<string>();
    fields.set(value, active);
    if (active.has(key)) fail(`Cyclic identity field ${key}.`);
    active.add(key);
    try {
      return value.field(key, presence);
    } finally {
      active.delete(key);
    }
  };
  const binding = (name: string): Value => {
    if (name === "undefined" && !bindings.has(name)) return undefined;
    if (memo.has(name)) return memo.get(name);
    if (!bindings.has(name) || resolving.has(name))
      return fail(`Unresolved or cyclic binding ${name}.`);
    const value = bindings.get(name);
    if (
      value &&
      typeof value === "object" &&
      ("helper" in value || "object" in value || "opaque" in value)
    )
      return "helper" in value ? helper(value.helper) : value;
    resolving.add(name);
    try {
      const result = typeof value === "function" ? value() : expression(value as ts.Expression);
      memo.set(name, result);
      return result;
    } finally {
      resolving.delete(name);
    }
  };
  const propertyName = (name: ts.PropertyName): string => {
    if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression))
      return name.expression.text;
    if (
      ts.isIdentifier(name) ||
      ts.isStringLiteral(name) ||
      ts.isNumericLiteral(name) ||
      ts.isNoSubstitutionTemplateLiteral(name)
    )
      return name.text;
    return fail("Unresolved computed property name.");
  };
  const authorFunction = (
    node: ts.FunctionDeclaration | ts.ArrowFunction,
    name: string,
    closure: Lookup,
  ): AuthorValue => {
    const author: AuthorValue = {
      author: true,
      name,
      invoke: (args, calls) => {
        if (calls.includes(author))
          return fail(
            `Recursive identity function call: ${[...calls, author].map((call) => call.name).join(" -> ")}.`,
          );
        const parameter = node.parameters[0];
        if (
          !node.body ||
          node.parameters.length > 1 ||
          args.length !== node.parameters.length ||
          node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ||
          (ts.isFunctionDeclaration(node) && node.asteriskToken) ||
          (parameter && (parameter.initializer || parameter.dotDotDotToken))
        )
          return fail(`Cannot reliably determine identity from unsupported function ${name}.`);
        const locals = new Map<string, () => Value>();
        const pending = new Set<string>();
        const lookupFrom =
          (available: ReadonlyMap<string, () => Value>): Lookup =>
          (local) => {
            const readLocal = available.get(local);
            if (!readLocal) return closure(local);
            if (pending.has(local)) return fail(`Cyclic identity function binding ${local}.`);
            pending.add(local);
            try {
              return readLocal();
            } finally {
              pending.delete(local);
            }
          };
        const lookup = lookupFrom(locals);
        if (parameter) {
          // Inspect only consumed option fields, while keeping higher-order calls outside
          // the supported function subset. Unrelated option payloads remain unread.
          const option = (value: Value): Value => {
            if (value && typeof value === "object") {
              if ("author" in value || "helper" in value)
                return fail("Identity functions cannot consume functions in options.");
              if ("object" in value)
                return {
                  object: true,
                  field: (key, presence) => option(read(value, key, presence)),
                };
            }
            return value;
          };
          const input = () => {
            const argument = args[0]!();
            if (!argument || typeof argument !== "object" || !("object" in argument))
              return fail(`Identity function ${name} requires an options object.`);
            return option(argument);
          };
          if (ts.isIdentifier(parameter.name)) locals.set(parameter.name.text, input);
          else if (ts.isObjectBindingPattern(parameter.name)) {
            for (const element of parameter.name.elements) {
              if (!ts.isIdentifier(element.name) || element.initializer || element.dotDotDotToken)
                return fail(`Unsupported identity function parameter in ${name}.`);
              const key = element.propertyName
                ? propertyName(element.propertyName)
                : element.name.text;
              locals.set(element.name.text, () => read(input(), key));
            }
          } else return fail(`Unsupported identity function parameter in ${name}.`);
        }
        const nestedCalls = [...calls, author];
        let result: Value;
        if (ts.isBlock(node.body!)) {
          const statements = (node.body as ts.Block).statements;
          const returned = statements.at(-1);
          if (!returned || !ts.isReturnStatement(returned) || !returned.expression)
            return fail(`Identity function ${name} requires a final return expression.`);
          for (const statement of statements.slice(0, -1)) {
            if (!ts.isVariableStatement(statement)) continue;
            for (const declaration of statement.declarationList.declarations) {
              if (!ts.isIdentifier(declaration.name)) continue;
              const local = declaration.name.text;
              if (locals.has(local)) return fail(`Duplicate identity function binding ${local}.`);
              locals.set(local, () =>
                fail(`Identity function binding ${local} is read before initialization.`),
              );
            }
          }
          for (const statement of statements.slice(0, -1)) {
            if (
              !ts.isVariableStatement(statement) ||
              !(statement.declarationList.flags & ts.NodeFlags.Const)
            )
              return fail(`Unsupported statement in identity function ${name}.`);
            for (const declaration of statement.declarationList.declarations) {
              if (!ts.isIdentifier(declaration.name) || !declaration.initializer)
                return fail(`Unsupported const in identity function ${name}.`);
              const initialized = lookupFrom(new Map(locals));
              locals.set(declaration.name.text, () =>
                expression(declaration.initializer!, initialized, nestedCalls),
              );
            }
          }
          result = expression(returned.expression, lookup, nestedCalls);
        } else result = expression(node.body as ts.Expression, lookup, nestedCalls);
        if (result && typeof result === "object") {
          if ("author" in result || "helper" in result)
            return fail("Identity functions cannot return functions.");
          if ("object" in result) return { ...result, fromAuthor: true };
        }
        return result;
      },
    };
    return author;
  };
  const expression = (
    node: ts.Expression,
    lookup: Lookup = binding,
    calls: readonly AuthorValue[] = [],
  ): Value => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return expression(node.expression, lookup, calls);
    if (ts.isIdentifier(node)) return lookup(node.text);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
      const value = expression(node.operand, lookup, calls);
      return typeof value === "number" ? -value : fail("Invalid numeric identity.");
    }
    if (ts.isArrayLiteralExpression(node)) return opaque;
    if (ts.isArrowFunction(node)) return authorFunction(node, "arrow", lookup);
    if (ts.isObjectLiteralExpression(node))
      return {
        object: true,
        field: (key, presence = false) => {
          for (const property of [...node.properties].reverse()) {
            if (ts.isSpreadAssignment(property)) {
              const spread = expression(property.expression, lookup, calls);
              const found = read(spread, key, presence);
              if (found !== missing) return found;
            } else if (propertyName(property.name!) === key) {
              // Declaration classification needs field presence, never the command payload.
              if (presence) return true;
              if (ts.isPropertyAssignment(property))
                return expression(property.initializer, lookup, calls);
              if (ts.isShorthandPropertyAssignment(property)) return lookup(property.name.text);
              return fail(`Unsupported identity property ${key}.`);
            }
          }
          return missing;
        },
      };
    if (ts.isPropertyAccessExpression(node))
      return read(expression(node.expression, lookup, calls), node.name.text);
    if (ts.isCallExpression(node)) {
      const callee = expression(node.expression, lookup, calls);
      if (callee && typeof callee === "object" && "author" in callee)
        return callee.invoke(
          node.arguments.map((argument) => () => expression(argument, lookup, calls)),
          calls,
        );
      if (!callee || typeof callee !== "object" || !("helper" in callee))
        return fail("Only known DSL helpers can determine identity.");
      const referenceKind = referenceHelpers.get(callee.helper);
      if (referenceKind) {
        return {
          object: true,
          field: (key, presence = false) => {
            if (key === "kind") return presence ? true : referenceKind;
            if (key !== "id" && key !== "name") return missing;
            if (node.arguments.length !== 1) return fail("Reference requires one input.");
            return read(expression(node.arguments[0]!, lookup, calls), key, presence);
          },
        };
      }
      const kind = declarationKinds[callee.helper];
      if (!kind) return opaque;
      if (calls.length)
        return fail(
          "Event Definition factories cannot determine Entry Identity; declare it at module scope.",
        );
      if (node.arguments.length !== 1) return fail("Declaration requires one input.");
      const input = expression(node.arguments[0]!, lookup, calls);
      return {
        object: true,
        field: (key, presence = false) =>
          key === "kind"
            ? presence
              ? true
              : kind
            : kind === "commonEvent" && (key === "commands" || key === "trigger")
              ? read(input, key, presence)
              : key === "id" ||
                  (kind === "mapEvent" && key === "mapId") ||
                  (kind === "troopEvent" && key === "troopId")
                ? read(input, key, presence)
                : missing,
      };
    }
    return fail(`Cannot reliably determine identity from ${ts.SyntaxKind[node.kind]}.`);
  };
  return { exported, binding };
}

function collectIdentities({ exported, binding }: IdentityModule, filePath: string): string[] {
  const fail = (detail: string): never => {
    throw new Error(`MV-DECOMPILE-IDENTITY ${filePath}: ${detail}`);
  };
  const read = (value: ObjectValue, key: string) => value.field(key);
  const ids: string[] = [];
  for (const [name, local] of exported) {
    const value = binding(local);
    if (!value || typeof value !== "object" || !("object" in value)) continue;
    const kind = read(value, "kind");
    if (typeof kind !== "string" || !Object.values(declarationKinds).includes(kind)) continue;
    if (
      kind === "commonEvent" &&
      value.field("commands", true) === missing &&
      value.field("trigger", true) === missing
    )
      continue;
    if (value.fromAuthor)
      fail(`Event Definition factory in export ${name}; declare Entry Identity at module scope.`);
    const id = read(value, kind === "troopEvent" ? "troopId" : "id"),
      mapId = kind === "mapEvent" ? read(value, "mapId") : undefined;
    if (
      !Number.isSafeInteger(id) ||
      Number(id) <= 0 ||
      (kind === "mapEvent" && (!Number.isSafeInteger(mapId) || Number(mapId) <= 0))
    )
      fail(`Unresolved or invalid Entry Identity in export ${name}.`);
    ids.push(
      kind === "mapEvent" ? `map:${String(mapId)}/event:${String(id)}` : `${kind}:${String(id)}`,
    );
  }
  return ids;
}
