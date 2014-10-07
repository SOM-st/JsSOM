'use strict';

function createCatchNonLocalReturn(methodBody) {
    return new CatchNonLocalReturnNode(methodBody);
}

function createFieldRead(self, fieldIndex, source) {
    return new FieldReadNode(self, fieldIndex, source);
}

function createGlobalRead(name, source) {
    assert(name instanceof SSymbol);
    return new UninitializedGlobalReadNode(name, source);
}

function createFieldWrite(self, exp, fieldIndex, source) {
    return new FieldWriteNode(self, exp, fieldIndex, source);
}

function createArgumentRead(arg, contextLevel, source) {
    return new ArgumentReadNode(contextLevel, arg, source);
}

function createVariableRead(local, contextLevel, source) {
    return new VariableReadNode(contextLevel, local, source);
}

function createSuperRead(variable, contextLevel, holderClass, classSide, source) {
    assert(holderClass instanceof SSymbol);
    return new UninitializedSuperReadNode(variable, contextLevel, holderClass,
        classSide, source);
}

function createVariableWrite(variable, contextLevel, exp, source) {
    return new VariableWriteNode(contextLevel, variable, exp, source);
}

function createSequence(exps, source) {
    return new SequenceNode(exps, source);
}

function createBlockNode(blockMethod, source) {
    return new BlockNode(blockMethod, source);
}

function createMessageSend(msg, exprs, source) {
    return new MessageSendNode(msg, exprs,
        new GenericDispatchNode(msg), source);
}

function createSuperSend(msg, exprs, source) {
    return new MessageSendNode(msg, exprs, new SuperDispatchNode(msg,
            exprs[0].getSuperClass()), source);
}

function createNonLocalReturn(exp, contextLevel, source) {
    return new ReturnNonLocalNode(exp, contextLevel, source);
}

function createLiteralNode(somVal, source) {
    return new LiteralNode(somVal, source);
}
