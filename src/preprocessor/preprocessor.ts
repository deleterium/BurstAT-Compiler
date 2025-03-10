import { BitField, STREAM_PAIR, StringStream, parseDecimalNumber } from '../repository/repository'
import { CONTRACT } from '../typings/contractTypes'

type IF_INFO = {
    active: boolean
    flipped: boolean
}
type REPLACEMENTS = {
    cname: string
    regex: RegExp
    value: string
    macro?: string
}
type PREP_TYPES = 'define'|'undef'|'ifdef'|'ifndef'|'else'|'endif'|'program'|'pragma'|'include'|'regular'
type PREP_LINE = {
    type: PREP_TYPES,
    property: string,
    value: string,
    newValue: string,
    line: string
}

/**
 * Process macro substitutions on source code
 * @param sourcecode Source code input
 * @returns preprocessed string
 */
export default function preprocessor (Program: CONTRACT) : string {
    let preprocessorReplacements: REPLACEMENTS[] = [
        { cname: 'true', regex: /\btrue\b/g, value: '1' },
        { cname: 'false', regex: /\bfalse\b/g, value: '0' },
        { cname: 'NULL', regex: /\bNULL\b/g, value: '(void *)(0)' },
        { cname: 'SMARTC', regex: /\bSMARTC\b/g, value: '' }
    ]
    const Context : {
        ifActive: IF_INFO[],
        currentIfLevel: number,
        getLastIfActive () : IF_INFO,
        isActive () : boolean
    } = {
        ifActive: [{ active: true, flipped: false }],
        currentIfLevel: 0,
        getLastIfActive () {
            return this.ifActive[this.ifActive.length - 1]
        },
        isActive () {
            return this.ifActive.every(item => item.active === true)
        }
    }

    function preprocessMain () : string {
        const tokenLines = prepare()
        const retLines = tokenLines.map(processLine)
        if (Context.ifActive.length !== 1) {
            throw new Error("At line: EOF. Unmatched directive '#ifdef' or '#ifndef'.")
        }
        if (Context.ifActive[0].flipped === true) {
            throw new Error("At line: EOF. Unmatched directives '#else'.")
        }
        return retLines.join('\n')
    }

    /** Moves escaped lines (ended with \ ) to the first line, analizes and return the preprocessor token line */
    function prepare () : PREP_LINE[] {
        const retTokens : PREP_LINE[] = []
        let afterEscapedLine = false
        let escapedFirstLine = -1
        for (let line = 0; line < Program.sourceLines.length; line++) {
            if (afterEscapedLine) {
                retTokens[escapedFirstLine].value += Program.sourceLines[line]
                retTokens.push({
                    type: 'regular',
                    property: '',
                    value: '',
                    newValue: '',
                    line: `${line + 1}:1`
                })
                if (retTokens[escapedFirstLine].value.endsWith('\\')) {
                    retTokens[escapedFirstLine].value = retTokens[escapedFirstLine].value.slice(0, -1)
                    continue
                }
                afterEscapedLine = false
                continue
            }
            if (!/^\s*#/.test(Program.sourceLines[line])) {
                retTokens.push({
                    type: 'regular',
                    property: '',
                    value: Program.sourceLines[line],
                    newValue: '',
                    line: `${line + 1}:1`
                })
            } else {
                const parts = parseDirective(Program.sourceLines[line], line + 1)
                if (['define', 'undef', 'ifdef', 'ifndef', 'else', 'endif', 'program', 'pragma', 'include'].includes(parts[0]) === false) {
                    throw new Error(Program.Context.formatError(`${line + 1}:1`, `Unknow preprocessor directive '${parts[0]}'.`))
                }
                retTokens.push({
                    type: parts[0] as PREP_TYPES,
                    property: parts[1],
                    value: parts[2],
                    newValue: '',
                    line: `${line + 1}:1`
                })
            }
            if (Program.sourceLines[line].endsWith('\\')) {
                escapedFirstLine = line
                afterEscapedLine = true
                retTokens[escapedFirstLine].value = retTokens[escapedFirstLine].value.slice(0, -1)
            }
        }
        return retTokens
    }

    /** Parse the line finding a directive and extracting the fields */
    function parseDirective (codeLine: string, line: number) : string[] {
        const Stream = new StringStream(codeLine)
        const firstField = findFirstField()
        const secondField = findSecondField()
        let thirdField = ''
        Stream.advance()
        if (!Stream.EOF()) {
            thirdField = codeLine.slice(Stream.index).trim()
        }
        return [firstField, secondField, thirdField]

        function findFirstField () {
            let char
            let stage = 0
            const field : string[] = []
            while (true) {
                char = Stream.advance()
                switch (stage) {
                case 0:
                    if (BitField.typeTable[char.code] & BitField.isBlank) {
                        continue
                    }
                    if (char.char === '#') {
                        stage = 1
                        continue
                    }
                    // never
                    throw new Error(Program.Context.formatError(`${line}:${Stream.index + 1}`, 'Invalid char found'))
                case 1:
                    if (BitField.typeTable[char.code] & BitField.isBlank) {
                        continue
                    }
                    if (BitField.typeTable[char.code] & BitField.isWord) {
                        stage = 2
                        field.push(char.char)
                        continue
                    }
                    throw new Error(Program.Context.formatError(`${line}:${Stream.index + 1}`, 'Invalid char found'))
                case 2:
                    if (BitField.typeTable[char.code] & BitField.isWord) {
                        field.push(char.char)
                        continue
                    }
                    Stream.rewind()
                }
                return field.join('')
            }
        }

        function findSecondField () {
            let char
            let stage = 0
            const field : string[] = []
            while (true) {
                char = Stream.advance()
                switch (stage) {
                case 0:
                    if (BitField.typeTable[char.code] & BitField.isBlank) {
                        continue
                    }
                    if (BitField.typeTable[char.code] & BitField.isWord || BitField.typeTable[char.code] & BitField.isDigit) {
                        stage = 1
                        field.push(char.char)
                        continue
                    }
                    if (Stream.EOF()) {
                        return ''
                    }
                    throw new Error(Program.Context.formatError(`${line}:${Stream.index + 1}`, 'Invalid char found'))
                case 1:
                    if (BitField.typeTable[char.code] & BitField.isWord || BitField.typeTable[char.code] & BitField.isDigit) {
                        field.push(char.char)
                        continue
                    }
                    Stream.rewind()
                }
                return field.join('')
            }
        }
    }

    /** OK... We parse the line backwards to find the string to be replaced.
     * This way we can maintain the right collumn index for the remaining string
     * in the most of cases. Collumns still wrong if there was a escaped line or
     * a replacement inside other replacement.
     */
    function replaceDefines (codeline: string, line: string) : string {
        let current : STREAM_PAIR
        let state = 0
        let wordEndIndex = 0
        let word : string
        let Replacement: REPLACEMENTS | undefined
        const Stream = new StringStream(codeline)
        Stream.setBack()
        do {
            current = Stream.back()
            switch (state) {
            case 0:
                if (BitField.typeTable[current.code] & BitField.isWord || BitField.typeTable[current.code] & BitField.isDigit) {
                    wordEndIndex = Stream.col
                    state = 1
                }
                break
            case 1:
                if (BitField.typeTable[current.code] & BitField.isWord || BitField.typeTable[current.code] & BitField.isDigit) {
                    continue
                }
                word = codeline.slice(Stream.col, wordEndIndex)
                Replacement = preprocessorReplacements.find(item => item.cname === word)
                if (Replacement) {
                    return replaceDefines(executeReplacement(Replacement, codeline, Stream.col, wordEndIndex, line), line)
                }
                state = 0
            }
        } while (current.char)

        return codeline
    }

    function executeReplacement (Replacement: REPLACEMENTS, code: string, startIndex: number, endIndex: number, line: string) {
        if (Replacement.macro === undefined) {
            return code.slice(0, startIndex) + Replacement.value + '#' + endIndex + '#' + code.slice(endIndex)
        }
        let replaced = Replacement.macro
        const currExtArgs = extractArgs(code, startIndex + 1, line)
        const origExtArgs = extractArgs(Replacement.value, 0, line)
        if (origExtArgs.argArray.length !== currExtArgs.argArray.length) {
            throw new Error(Program.Context.formatError(line,
                `Wrong number of arguments for macro '${Replacement.cname}'. ` +
                `Expected ${origExtArgs.argArray.length}, got ${currExtArgs.argArray.length}.`))
        }
        for (let currArg = 0; currArg < origExtArgs.argArray.length; currArg++) {
            replaced = replaced.replace(new RegExp(`\\b${origExtArgs.argArray[currArg]}\\b`, 'g'), currExtArgs.argArray[currArg])
        }
        return code.slice(0, startIndex) + replaced + `#${currExtArgs.endPosition}#` + code.slice(currExtArgs.endPosition)
    }

    function extractArgs (fnArgString: string, needle: number, line: string): { argArray: string[], endPosition: number} {
        const argArray : string [] = []
        let currArg: string = ''
        const Stream = new StringStream(fnArgString)
        Stream.index = fnArgString.indexOf('(', needle)
        let pLevel = 1
        while (!Stream.EOF()) {
            const current = Stream.advance()
            if (current.char === '(') {
                pLevel++
                currArg += current.char
                continue
            }
            if (current.char === ')') {
                pLevel--
                if (pLevel !== 0) {
                    currArg += current.char
                    continue
                }
                // end of arguments
                const endArg = currArg.trim()
                if (endArg.length === 0 && argArray.length !== 0) {
                    throw new Error(Program.Context.formatError(line, 'Found empty argument on macro declaration.'))
                }
                if (endArg.length !== 0) {
                    argArray.push(currArg.trim())
                }
                return {
                    argArray,
                    endPosition: Stream.index + 1
                }
            }
            if (current.char === ',' && pLevel === 1) {
                const newArg = currArg.trim()
                if (newArg.length === 0) {
                    throw new Error(Program.Context.formatError(line, 'Found empty argument on macro declaration.'))
                }
                argArray.push(currArg.trim())
                currArg = ''
                continue
            }
            currArg += current.char
        }
        throw new Error(Program.Context.formatError(line, 'Unmatched parenthesis or unexpected end of line.'))
    }

    function processLine (prepLine: PREP_LINE) : string {
        // Process rules that depend on lineActive
        switch (prepLine.type) {
        case 'ifdef':
            return processIfdef(prepLine)
        case 'ifndef':
            return processIfndef(prepLine)
        case 'else':
            return processElse(prepLine)
        case 'endif':
            return processEndif(prepLine)
        }
        if (!Context.isActive()) {
            return ''
        }
        // Process rules that does not depend on lineActive
        switch (prepLine.type) {
        case 'define':
            return processDefine(prepLine)
        case 'undef':
            preprocessorReplacements = preprocessorReplacements.filter(obj => obj.cname !== prepLine.property)
            return ''
        case 'include':
            return processInclude(prepLine)
        case 'program':
            processProgram(prepLine)
            return ''
        case 'pragma':
            processPragma(prepLine)
            return ''
        case 'regular':
            return replaceDefines(prepLine.value, prepLine.line)
        default:
            // Never reached code.
            throw new Error('Internal error.')
        }
    }

    function processIfdef (currTokenLine: PREP_LINE) : '' {
        const lastIf = Context.getLastIfActive()
        const IfTemplateObj = { active: true, flipped: false }
        Context.currentIfLevel += lastIf.active ? 1 : 0
        if (preprocessorReplacements.find(Obj => Obj.cname === currTokenLine.property) === undefined) {
            IfTemplateObj.active = false
        }
        Context.ifActive.push(IfTemplateObj)
        return ''
    }

    function processIfndef (currTokenLine: PREP_LINE) : '' {
        const lastIf = Context.getLastIfActive()
        const IfTemplateObj = { active: true, flipped: false }
        Context.currentIfLevel += lastIf.active ? 1 : 0
        if (preprocessorReplacements.find(Obj => Obj.cname === currTokenLine.property)) {
            IfTemplateObj.active = false
        }
        Context.ifActive.push(IfTemplateObj)
        return ''
    }

    function processElse (currTokenLine: PREP_LINE) : '' {
        const LastIfInfo = Context.getLastIfActive()
        if (LastIfInfo.flipped === true) {
            throw new Error(Program.Context.formatError(currTokenLine.line, "Unmatched '#else' directive."))
        }
        LastIfInfo.flipped = true
        LastIfInfo.active = !LastIfInfo.active
        return ''
    }

    function processEndif (currTokenLine: PREP_LINE) : '' {
        if (Context.ifActive.length - 1 === Context.currentIfLevel) {
            Context.currentIfLevel--
        }
        if (Context.currentIfLevel < 0) {
            throw new Error(Program.Context.formatError(currTokenLine.line, "Unmatched '#endif' directive."))
        }
        Context.ifActive.pop()
        return ''
    }

    function processDefine (currTokenLine: PREP_LINE): '' {
        let idx: number
        if (currTokenLine.value === '') {
            idx = preprocessorReplacements.findIndex(Obj => Obj.cname === currTokenLine.property)
            if (idx === -1) {
                preprocessorReplacements.push({
                    cname: currTokenLine.property,
                    regex: new RegExp('\\b' + currTokenLine.property + '\\b', 'g'),
                    value: ''
                })
                return ''
            }
            preprocessorReplacements[idx].value = ''
            return ''
        }
        const macroParts = /^(\([^)]*\))\s*(\(.+\))\s*$/.exec(currTokenLine.value)
        if (macroParts === null) {
            /* define val */
            idx = preprocessorReplacements.findIndex(Obj => Obj.cname === currTokenLine.property)
            if (idx === -1) {
                preprocessorReplacements.push({
                    cname: currTokenLine.property,
                    regex: new RegExp('\\b' + currTokenLine.property + '\\b', 'g'),
                    value: replaceDefines(currTokenLine.value, currTokenLine.line).trim()
                })
                return ''
            }
            preprocessorReplacements[idx].value = replaceDefines(currTokenLine.value, currTokenLine.line).trim()
            return ''
        }
        // define macro
        idx = preprocessorReplacements.findIndex(Obj => Obj.cname === currTokenLine.property)
        if (idx !== -1) {
            throw new Error(Program.Context.formatError(currTokenLine.line, `Cannot redefine macro '${currTokenLine.property}'.`))
        }
        preprocessorReplacements.push({
            cname: currTokenLine.property,
            regex: new RegExp(`\\b${currTokenLine.property}\\s*\\(`, 'g'),
            value: replaceDefines(macroParts[1], currTokenLine.line),
            macro: replaceDefines(macroParts[2], currTokenLine.line)
        })
        return ''
    }

    function processInclude (currTokenLine: PREP_LINE) : '' {
        if (currTokenLine.property === 'APIFunctions') {
            Program.Config.APIFunctions = getBoolVal(currTokenLine)
            // if undefine trhow
            return ''
        }
        if (currTokenLine.property === 'fixedAPIFunctions') {
            Program.Config.fixedAPIFunctions = getBoolVal(currTokenLine)
            // if undefine trhow
            return ''
        }
        throw new Error(Program.Context.formatError(currTokenLine.line,
            `Unknow macro property '#${currTokenLine.type} ${currTokenLine.property}'.` +
            " Do you mean 'APIFunctions'? Check valid values on Help page"))
    }

    /** Reads/verifies one macro token and add it into Program.Config object */
    function getBoolVal (currTokenLine: PREP_LINE) : boolean {
        switch (currTokenLine.value) {
        case undefined:
        case '':
        case 'true':
        case '1':
            return true
        case 'false':
        case '0':
            return false
        default:
            throw new Error(Program.Context.formatError(currTokenLine.line,
                `Macro: '#${currTokenLine.type} ${currTokenLine.property}' with wrong value. Please check valid values on Help page.`))
        }
    }

    /** Process all macro pragma options. */
    function processPragma (MacroToken: PREP_LINE) {
        const num = parseInt(MacroToken.value)
        switch (MacroToken.property) {
        case 'maxAuxVars':
            if (num >= 0 && num <= 10) {
                Program.Config.maxAuxVars = num
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line, 'Value out of permitted range 1..10.'))
        case 'maxConstVars':
            if (num >= 0 && num <= 10) {
                Program.Config.maxConstVars = num
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line, 'Value out of permitted range 0..10.'))
        case 'reuseAssignedVar':
            Program.Config.reuseAssignedVar = getBoolVal(MacroToken)
            return
        case 'optimizationLevel':
            if (num >= 0 && num <= 4) {
                Program.Config.optimizationLevel = num
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line, 'Value out of permitted range 0..3.'))
        case 'version':
            // Nothing to do. 'version' is a reminder for programmers.
            return false
        case 'verboseAssembly':
            Program.Config.verboseAssembly = getBoolVal(MacroToken)
            return true
        case 'verboseScope':
            Program.Config.verboseScope = getBoolVal(MacroToken)
            return true
        default:
            throw new Error(Program.Context.formatError(MacroToken.line,
                `Unknow macro property: '#${MacroToken.type} ${MacroToken.property}'.` +
                ' Please check valid values on Help page'))
        }
    }

    /** Process all macro Program options */
    function processProgram (MacroToken: PREP_LINE) : void {
        switch (MacroToken.property) {
        case 'name':
            if (/^[0-9a-zA-Z]{1,30}$/.test(MacroToken.value)) {
                Program.Config.PName = MacroToken.value
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line,
                'Program name must contains only letters [a-z][A-Z][0-9], from 1 to 30 chars.'))
        case 'description':
            if (MacroToken.value.length >= 1000) {
                throw new Error(Program.Context.formatError(MacroToken.line,
                    `Program description max lenght is 1000 chars. It is ${MacroToken.value.length} chars.`))
            }
            Program.Config.PDescription = MacroToken.value
            return
        case 'activationAmount':
            Program.Config.PActivationAmount = parseDecimalNumber(
                replaceDefines(MacroToken.value, MacroToken.line).split('#')[0],
                MacroToken.line
            ).value.toString(10)
            return
        case 'creator':
            Program.Config.PCreator = parseDecimalNumber(MacroToken.value, MacroToken.line).value.toString(10)
            return
        case 'contract':
            Program.Config.PContract = parseDecimalNumber(MacroToken.value, MacroToken.line).value.toString(10)
            return
        case 'userStackPages':
            if (/^\d\s*$|^10\s*$/.test(MacroToken.value)) {
                Program.Config.PUserStackPages = Number(MacroToken.value)
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line,
                'Program user stack pages must be a number between 0 and 10, included.'))
        case 'codeStackPages':
            if (/^\d\s*$|^10\s*$/.test(MacroToken.value)) {
                Program.Config.PCodeStackPages = Number(MacroToken.value)
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line,
                'Program code stack pages must be a number between 0 and 10, included.'))
        case 'codeHashId':
            if (/^\d+\s*$/.test(MacroToken.value)) {
                Program.Config.PCodeHashId = MacroToken.value.trim()
                return
            }
            throw new Error(Program.Context.formatError(MacroToken.line,
                'Program code hash id must be a decimal number. Use 0 to let compiler fill the value at assembly output.'))
        case 'compilerVersion':
            // Nothing to do. compilerVersion is a reminder for programmers.
            break
        default:
            throw new Error(Program.Context.formatError(MacroToken.line,
                `Unknow macro property: '#${MacroToken.type} ${MacroToken.property}'.` +
                ' Please check valid values on Help page'))
        }
    }

    return preprocessMain()
}
