import * as jsonToAst from "json-to-ast";

export type JsonAST = jsonToAst.AstJsonEntity | undefined;

export interface LinterProblem<TKey> {
    key: TKey;
    loc: jsonToAst.AstLocation;
}

export function makeLint<TProblemKey>(
    json: string, 
    validateProperty: (property: jsonToAst.AstProperty) => LinterProblem<TProblemKey>[],
    validateObject: (property: jsonToAst.AstObject) => LinterProblem<TProblemKey>[]
): LinterProblem<TProblemKey>[] {
    function walk(
        node: jsonToAst.AstJsonEntity, 
        cbProp: (property: jsonToAst.AstProperty) => LinterProblem<TProblemKey>[],
        cbObj: (property: jsonToAst.AstObject) => LinterProblem<TProblemKey>[],
        errors: LinterProblem<TProblemKey>[]
    ) {
        switch (node.type) {
            case 'Array':
                node.children.forEach((item: jsonToAst.AstJsonEntity) => {
                    walk(item, cbProp, cbObj, errors);
                });
                break;
            case 'Object':
                if(cbObj(node).length) {
                    errors.push(...cbObj(node));
                }
                node.children.forEach((property: jsonToAst.AstProperty) => {
                if(cbProp(property).length) {
                    cbProp(property);
                }
                    walk(property.value, cbProp, cbObj, errors);
                });
                break;
        }
        return errors;
    }

    function parseJson(json: string):JsonAST  {return jsonToAst(json); }

    const errors: LinterProblem<TProblemKey>[] = [];
    const ast: JsonAST = parseJson(json);
    if (ast) {
            walk(ast, 
            (property: jsonToAst.AstProperty) => validateProperty(property), 
            (obj: jsonToAst.AstObject) => validateObject(obj),
            errors);
    }
    return errors;
}
