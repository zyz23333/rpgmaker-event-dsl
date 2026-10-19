import * as ts from "typescript";
import * as dsl from "../authoring/index.js";

type ObjectValue = { object: true; field: (key: string) => Value };
type HelperValue = { helper: string };
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
  | { opaque: true };
const opaque = { opaque: true } as const;
const declarationKinds: Record<string, string> = {
  mapEvent: "mapEvent",
  commonEvent: "commonEvent",
  switchDefinition: "switchDefinition",
  variableDefinition: "variableDefinition",
};

/** Read only declaration identity; unrelated fields and command constructors are never evaluated. */
export function definitionIdentities(filePath: string, text: string): string[] {
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
  const bindings = new Map<string, ts.Expression | Value>();
  const exported = new Map<string, string>();
  const helper = (name: string): HelperValue => {
    if (typeof (dsl as Record<string, unknown>)[name] !== "function")
      fail(`Unknown DSL helper ${name}.`);
    return { helper: name };
  };
  const namespace: ObjectValue = { object: true, field: helper };
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (statement.importClause?.isTypeOnly) continue;
      if (
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== "rpgmaker-event-dsl"
      )
        fail("Unsupported value import source.");
      if (statement.importClause?.name) fail("Default import is not allowed.");
      const named = statement.importClause?.namedBindings;
      if (named && ts.isNamespaceImport(named)) bindings.set(named.name.text, namespace);
      else if (named)
        for (const element of named.elements)
          if (!element.isTypeOnly)
            bindings.set(element.name.text, {
              helper: element.propertyName?.text ?? element.name.text,
            });
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
  const read = (value: Value, key: string): Value => {
    if (!value || typeof value !== "object" || !("object" in value))
      return fail(`Cannot reliably determine field ${key}.`);
    const active = fields.get(value) ?? new Set<string>();
    fields.set(value, active);
    if (active.has(key)) fail(`Cyclic identity field ${key}.`);
    active.add(key);
    try {
      return value.field(key);
    } finally {
      active.delete(key);
    }
  };
  const binding = (name: string): Value => {
    if (name === "undefined") return undefined;
    if (memo.has(name)) return memo.get(name);
    if (!bindings.has(name) || resolving.has(name))
      return fail(`Unresolved or cyclic binding ${name}.`);
    const value = bindings.get(name);
    if (value && typeof value === "object" && ("helper" in value || "object" in value))
      return "helper" in value ? helper(value.helper) : value;
    resolving.add(name);
    try {
      const result = expression(value as ts.Expression);
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
  const expression = (node: ts.Expression): Value => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    )
      return expression(node.expression);
    if (ts.isIdentifier(node)) return binding(node.text);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.NullKeyword) return null;
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
      const value = expression(node.operand);
      return typeof value === "number" ? -value : fail("Invalid numeric identity.");
    }
    if (ts.isArrayLiteralExpression(node)) return opaque;
    if (ts.isObjectLiteralExpression(node))
      return {
        object: true,
        field: (key) => {
          for (const property of [...node.properties].reverse()) {
            if (ts.isSpreadAssignment(property)) {
              const spread = expression(property.expression);
              const found = read(spread, key);
              if (found !== missing) return found;
            } else if (propertyName(property.name!) === key) {
              if (ts.isPropertyAssignment(property)) return expression(property.initializer);
              if (ts.isShorthandPropertyAssignment(property)) return binding(property.name.text);
              return fail(`Unsupported identity property ${key}.`);
            }
          }
          return missing;
        },
      };
    if (ts.isPropertyAccessExpression(node))
      return read(expression(node.expression), node.name.text);
    if (ts.isCallExpression(node)) {
      const callee = expression(node.expression);
      if (!callee || typeof callee !== "object" || !("helper" in callee))
        return fail("Only known DSL helpers can determine identity.");
      const kind = declarationKinds[callee.helper];
      if (!kind) return opaque;
      if (node.arguments.length !== 1) return fail("Declaration requires one input.");
      const input = expression(node.arguments[0]!);
      return {
        object: true,
        field: (key) =>
          key === "kind"
            ? kind
            : key === "id" || (kind === "mapEvent" && key === "mapId")
              ? read(input, key)
              : missing,
      };
    }
    return fail(`Cannot reliably determine identity from ${ts.SyntaxKind[node.kind]}.`);
  };
  const ids: string[] = [];
  for (const [name, local] of exported) {
    const value = binding(local);
    if (!value || typeof value !== "object" || !("object" in value)) continue;
    const kind = read(value, "kind");
    if (typeof kind !== "string" || !Object.values(declarationKinds).includes(kind)) continue;
    const id = read(value, "id"),
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
