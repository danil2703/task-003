import * as jsonToAst from "json-to-ast";

export type JsonAST = jsonToAst.AstJsonEntity | undefined;

export interface LinterProblem {
    code: string;
    error: string;
    location: {
        start: { column: number | undefined; line: number | undefined; };
        end: { column: number | undefined; line: number | undefined; };
    };
}

interface Data {
    h1: boolean;
    h2: boolean;
    warning: {
        firstText: boolean | string;
        firstBlock: boolean | string;
    };
    str: string;
    warningString: string;
}

interface ObjectJson {
    block: string;
    mods: {
        'm-columns': any;
        type: any;
        size: any;
    };
    content: any;
    elem?: any;
    elemMods?: any;
}

function findErrors(
    string: string,
    cutString: string,
    codeError: string,
    messageError: string,
    errors: Array<LinterProblem>
    ): void {
    const endOfSearch = string.length - cutString.length;
    let start = string.lastIndexOf('{', endOfSearch);
    let open = 1;
    let close = 0;
    let end;
    for (let i = start + 1; i < string.length; i++) {
        console.log(open, close);
        if (string[i] === '{') {
            open += 1;
        }
        if (string[i] === '}') {
            close += 1;
        }
        if (close === open) {
            end = i + 1;
            break;
        }
    }
    errors.push({
        code: codeError,
        error: messageError,
        location: {
            start: { column: start, line: start },
            end: { column: end, line: end },
        },
    });
}

function lintText (
    object: ObjectJson,
    string: string,
    errors: Array<LinterProblem>,
    data: Data
): void {
    if (object.mods) {
        if (object.mods.type === 'h1') {
            if (data.h1) {
                const message = "Заголовок первого уровня на странице должен быть единственным";
                const code = "TEXT.SEVERAL_H1";
                findErrors(string, data.str, code, message, errors);
            }
            data.h1 = true;
        }
        if (object.mods.type === 'h2') {
            if (!data.h1) {
                const message = "Заголовок второго уровня не может находиться перед заголовком первого уровня";
                const code = "TEXT.INVALID_H2_POSITION";
                findErrors(string, data.str, code, message, errors);
            }
            data.h2 = true;
        }
        if (object.mods.type === 'h3') {
            if (!data.h2) {
                const message = "Заголовок третьего уровня не должен быть перед второго уровня";
                const code = "TEXT.INVALID_H3_POSITION";
                findErrors(string, data.str, code, message, errors);
            }
        }
    }
}

function lintGrid(
    content: Array<ObjectJson>,
    string: string,
    gridSize: number,
    errors: Array<LinterProblem>,
    data: Data): void {
    let marketing = 0;
    const marketingBlocks = ['commercial', 'offer'];
    content.forEach((item) => {
        if (item.elem === 'fraction' && item.elemMods) {
            if (marketingBlocks.includes(item.content[0].block)) {
                marketing += +item.elemMods['m-col'];
            }
        }
    });
    if (marketing > gridSize / 2) {
        const message = "Маркетинговые блоки не могут занимать больше половины от всех колонок блока grid";
        const code = "GRID.TOO_MUCH_MARKETING_BLOCKS";
        findErrors(string, data.str, code, message, errors);
    }
}

function findFirst(
    object: ObjectJson,
    data: Data
    ): void {
    if (object.block === 'text' && object.mods && object.mods.size && !data.warning.firstText) {
        data.warning.firstText = object.mods.size;
    }
    if (Array.isArray(object.content)) {
        object.content.forEach((item) => {
            if (!data.warning.firstText) {
                findFirst(item, data);
            }
        });
    } else if (typeof (object.content) === 'object') {
        for (const key in object.content) {
            findFirst(object.content[key], data);
        }
    }
}

function lintWarningButton(
    object: ObjectJson,
    string: string,
    errors: Array<LinterProblem>,
    data: Data): void {
    const sizes = ['s', 'm', 'l', 'xl', 'xxl'];
    let trueSize;
    sizes.forEach((item, index, arr) => {
        if (item === data.warning.firstText) {
            trueSize = arr[index + 1];
        }
    });
    if (object.mods) {
        if (object.mods.size !== trueSize) {
            const message = "Размер кнопки блока warning должен быть на 1 шаг больше эталонного";
            const code = "WARNING.INVALID_BUTTON_SIZE";
            findErrors(string, data.warningString, code, message, errors);
        }
    }
}

function lintWarningPlaceholder(
    object: ObjectJson,
    string: string,
    errors: Array<LinterProblem>,
    data: Data): void {
    let size;
    if (object.mods) {
        size = object.mods.size;
    }
    if (size !== 's' && size !== 'm' && size !== 'l') {
        const message = "Допустимые размеры для блока placeholder в блоке warning: s, m, l";
        const code = "WARNING.INVALID_PLACEHOLDER_SIZE";
        findErrors(string, data.warningString, code, message, errors);
    }
}


function lintWarning(
    object: ObjectJson,
    string: string,
    errors: Array<LinterProblem>,
    data: Data): void {
    data.warningString = data.warningString
        .slice(data.warningString.indexOf(object.block) + object.block.length);
    if (object.block === 'placeholder') {
        lintWarningPlaceholder(object, string, errors, data);
        if (!data.warning.firstBlock) {
            data.warning.firstBlock = 'placeholder';
        }
    }
    if (object.block === 'text' && object.mods) {
        if (data.warning.firstText !== object.mods.size) {
            const message = "Тексты в блоке warning должны быть одного размера";
            const code = "WARNING.TEXT_SIZES_SHOULD_BE_EQUAL";
            findErrors(string, data.str, code, message, errors);
        }
    }
    if (object.block === 'button') {
        lintWarningButton(object, string, errors, data);
        if (!data.warning.firstBlock) {
            const message = "Блок button в блоке warning не может находиться перед блоком placeholder";
            const code = "WARNING.INVALID_BUTTON_POSITION";
            findErrors(string, data.warningString, code, message, errors);
        }
    }
    if (Array.isArray(object.content)) {
        object.content.forEach((item) => {
            if (item.block !== 'warning') {
                lintWarning(item, string, errors, data);
            }
        });
    } else if (typeof (object.content) === 'object') {
        for (const key in object.content) {
            lintWarning(object.content[key], string, errors, data);
        }
    }
}


function lintMain(
    object: ObjectJson,
    string: string,
    errors: Array<LinterProblem>,
    data: Data
    ): void {
    console.log(object.block);
    if(object.block) {
        data.str = data.str.slice(data.str.indexOf(object.block) + object.block.length);
    }
    if (object.block === 'grid' && object.mods) {
        lintGrid(object.content, string, object.mods['m-columns'], errors, data);
    }

    if (object.block === 'text') {
        lintText(object, string, errors, data);
    }

    if (object.block === 'warning') {
        data.warning.firstBlock = false;
        data.warning.firstText = false;
        data.warningString = string;
        findFirst(object, data);
        lintWarning(object, string, errors, data);
    }
    if (Array.isArray(object.content)) {
        object.content.forEach((item) => {
            lintMain(item, string, errors, data);
        });
    } else if (typeof (object.content) === 'object') {
        lintMain(object.content, string, errors, data);
    }
}

export function lint(
    string: string
    ): Array<LinterProblem>  {
    const object: ObjectJson = JSON.parse(string);
    let errors: LinterProblem[] = [];
    const data: Data = {
        h1: false,
        h2: false,
        warning: {
            firstText: false,
            firstBlock: false,
        },
        str: string,
        warningString: '',
    };
    if (Array.isArray(object)) {
        object.forEach((item) => {
            lintMain(item, string, errors, data);
        });
    } else {
        lintMain(object, string, errors, data);
    }
    return errors;
}
