'use strict';

function makeLexerState() {
    return {
        lineNumber :    0,
        charsRead  :    0, // all characters read, excluding the current line
        line       :   "",
        linePos    :    0,
        sym        : null,
        text       :   "",
        startCoord : null,
        set        : function (sym, text) {
            this.sym  = sym;
            this.text = text;
        }
    }
}

function cloneLexerState(old) {
    return {
        lineNumber : old.lineNumber,
        charsRead  : old.charsRead, // all characters read, excluding the current line
        line       : old.line,
        linePos    : old.linePos,
        sym        : old.sym,
        text       : old.text,
        startCoord : old.startCoord,
        set        : function (sym, text) {
            this.sym  = sym;
            this.text = text;
        }
    }
}

function Lexer(fileContent) {
    var SEPARATOR = "----",
        PRIMITIVE = "primitive",
        peekDone  = false,
        state     = makeLexerState(),
        stateAfterPeek = null,
        fileLines = fileContent.split('\n'),
        _this = this;

    function makeSourceCoordinate() {
        var startLine   = state.lineNumber,
            startColumn = state.linePos + 1,
            charIndex   = state.charsRead + state.linePos;

        return {
            get startLine()   { return startLine;   },
            get startColumn() { return startColumn; },
            get charIndex()   { return charIndex;   },
            toString: function() {
                return "SrcCoord(line: " + startLine + ", col: " + startColumn + ")";
            }
        };
    }

    this.getStartCoordinate = function () {
        return state.startCoord;
    };

    this.getSym = function () {
        if (peekDone) {
            peekDone = false;
            state = stateAfterPeek;
            stateAfterPeek = null;
            return state.sym;
        }

        state.startCoord = makeSourceCoordinate();

        do {
            if (!hasMoreInput()) {
                state.set(Sym.NONE, "");
                return state.sym;
            }
            skipWhiteSpace();
            skipComment();
        }
        while (endOfLine() || /\s/.test(currentChar())
            || currentChar() == '"');

        if (currentChar() == '\'') {
            lexString();
        } else if (currentChar() == '[') {
            match(Sym.NewBlock);
        } else if (currentChar() == ']') {
            match(Sym.EndBlock);
        } else if (currentChar() == ':') {
            if (bufchar(state.linePos + 1) == '=') {
                state.linePos += 2;
                state.set(Sym.Assign, ":=");
            } else {
                state.linePos++;
                state.set(Sym.Colon, ":");
            }
        } else if (currentChar() == '(') {
            match(Sym.NewTerm);
        } else if (currentChar() == ')') {
            match(Sym.EndTerm);
        } else if (currentChar() == '#') {
            match(Sym.Pound);
        } else if (currentChar() == '^') {
            match(Sym.Exit);
        } else if (currentChar() == '.') {
            match(Sym.Period);
        } else if (currentChar() == '-') {
            if (state.line.indexOf(SEPARATOR, state.linePos) == 0) {
                state.text = "";
                while (currentChar() == '-') {
                    state.text += bufchar(state.linePos++);
                }
                state.sym = Sym.Separator;
            } else {
                state.linePos++;
                state.set(Sym.Minus, "-");
            }
        } else if (isOperator(currentChar())) {
            lexOperator();
        } else if (nextWordInBufferIs(PRIMITIVE)) {
            state.linePos += PRIMITIVE.length;
            state.set(Sym.Primitive, PRIMITIVE);
        } else if (/[A-Za-z]/.test(currentChar())) {
            state.set(Sym.Identifier, "");
            while (isIdentifierChar(currentChar())) {
                state.text += bufchar(state.linePos++);
            }
            if (bufchar(state.linePos) == ':') {
                state.sym = Sym.Keyword;
                state.linePos++;
                state.text += ':';
                if (/[A-Za-z]/.test(currentChar())) {
                    state.sym = Sym.KeywordSequence;
                    while (/[A-Za-z]/.test(currentChar()) || currentChar() == ':') {
                        state.text += bufchar(state.linePos++);
                    }
                }
            }
        } else if (/\d/.test(currentChar())) {
            lexNumber();
        } else {
            state.set(Sym.NONE, currentChar());
        }

        return state.sym;
    };

    function lexNumber() {
        state.set(Sym.Integer, "");

        var sawDecimalMark = false;

        do {
            state.text += bufchar(state.linePos++);

            if (!sawDecimalMark      &&
                '.' == currentChar() &&
                /\d/.test(bufchar(state.linePos + 1))) {
                state.sym = Sym.Double;
                state.text += bufchar(state.linePos++);
            }
        } while (/\d/.test(currentChar()));
    }

    function lexString() {
        state.set(Sym.STString, "");

        do {
            state.text += bufchar(++state.linePos);
        }
        while (currentChar() != '\'');

        state.text = state.text.slice(0, -1);
        state.linePos++;
    }

    function lexOperator() {
        if (isOperator(bufchar(state.linePos + 1))) {
            state.set(Sym.OperatorSequence, "");
            while (isOperator(currentChar())) {
                state.text += bufchar(state.linePos++);
            }
        } else if (currentChar() == '~') {
            match(Sym.Not);
        } else if (currentChar() == '&') {
            match(Sym.And);
        } else if (currentChar() == '|') {
            match(Sym.Or);
        } else if (currentChar() == '*') {
            match(Sym.Star);
        } else if (currentChar() == '/') {
            match(Sym.Div);
        } else if (currentChar() == '\\') {
            match(Sym.Mod);
        } else if (currentChar() == '+') {
            match(Sym.Plus);
        } else if (currentChar() == '=') {
            match(Sym.Equal);
        } else if (currentChar() == '>') {
            match(Sym.More);
        } else if (currentChar() == '<') {
            match(Sym.Less);
        } else if (currentChar() == ',') {
            match(Sym.Comma);
        } else if (currentChar() == '@') {
            match(Sym.At);
        } else if (currentChar() == '%') {
            match(Sym.Per);
        }
    }

    this.peek = function () {
        var old = cloneLexerState(state);
        if (peekDone) {
            throw new IllegalStateException("SOM lexer: cannot peek twice!");
        }
        _this.getSym();
        var nextSym = state.sym;
        stateAfterPeek = state;
        state = old;

        peekDone = true;
        return nextSym;
    };

    this.getText = function () {
        return state.text;
    };

    this.getNextText = function () {
        return stateAfterPeek.text;
    };

    this.getCurrentLine = function () {
        return state.line;
    };

    this.getCurrentLineNumber = function () {
        return state.lineNumber;
    };

    this.getCurrentColumn = function () {
        return state.linePos + 1;
    };

    // All characters read and processed, including current line
    this.getNumberOfCharactersRead = function () {
        return state.startCoord.charIndex;
    };

    function readNextLine() {
        if (state.lineNumber >= fileLines.length) { return false; }

        var charCntOldLine = state.line.length;
        if (state.lineNumber > 0) { charCntOldLine++; } // add +1 for line break
        state.line = fileLines[state.lineNumber];
        state.charsRead = charCntOldLine;
        state.lineNumber++;
        state.linePos = 0;
        return true;
    }

    function hasMoreInput() {
        while (endOfLine()) {
            if (!readNextLine()) {
                return false;
            }
        }
        return true;
    }

    function skipWhiteSpace() {
        while (/\s/.test(currentChar())) {
            state.linePos++;
            while (endOfLine()) {
                if (!readNextLine()) {
                    return;
                }
            }
        }
    }

    function skipComment() {
        if (currentChar() == '"') {
            do {
                state.linePos++;
                while (endOfLine()) {
                    if (!readNextLine()) { return; }
                }
            } while (currentChar() != '"');
            state.linePos++;
        }
    }

    function currentChar() {
        return bufchar(state.linePos);
    }

    function endOfLine() {
        return state.linePos >= state.line.length;
    }

    function isOperator(c) {
        return c == '~'  || c == '&' || c == '|' || c == '*' || c == '/'
            || c == '\\' || c == '+' || c == '=' || c == '>' || c == '<'
            || c == ','  || c == '@' || c == '%';
    }

    function match(s) {
        state.set(s, currentChar());
        state.linePos++;
    }

    function bufchar(p) {
        return p >= state.line.length ? '\0' : state.line.charAt(p);
    }

    function isIdentifierChar(c) {
        return /[A-Za-z\d]/.test(c) || c == '_';
    }

    function nextWordInBufferIs(text) {
        if (state.line.indexOf(text, state.linePos) != state.linePos) {
            return false;
        }
        return !isIdentifierChar(bufchar(state.linePos + text.length));
    }
}