/*
* Copyright (c) 2014 Stefan Marr, mail@stefan-marr.de
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
// @ts-check

import { intOrBigInt, isInIntRange } from '../../lib/platform.js';

import { SBigInteger, SInteger } from '../vmobjects/numbers.js';
import { Primitives } from './Primitives.js';

import { universe } from '../vm/Universe.js';
import { SString } from '../vmobjects/SString.js';
import { notYetImplemented } from '../../lib/assert.js';

function toNumber(val) {
  if (val instanceof SBigInteger) {
    return Number(val.getEmbeddedBigInteger());
  }
  return val.getEmbeddedInteger();
}

function _asString(_frame, args) {
  return args[0].primAsString();
}

function _sqrt(_frame, args) {
  const rcvr = args[0];
  if (rcvr instanceof SBigInteger) {
    const res = Math.sqrt(rcvr.getEmbeddedBigInteger());
    if (res === BigInt(Math.floor(Number(res)))) {
      return universe.newBigInteger(res);
    }
    return universe.newDouble(Number(res));
  }

  const res = Math.sqrt(rcvr.getEmbeddedInteger());
  if (res === Math.floor(res)) {
    return universe.newInteger(Math.floor(res));
  }
  return universe.newDouble(res);
}

function _atRandom(_frame, args) {
  return universe.newInteger(Math.floor(args[0].getEmbeddedInteger()
        * Math.random()));
}

function _plus(_frame, args) {
  return args[0].primAdd(args[1]);
}

function _minus(_frame, args) {
  return args[0].primSubtract(args[1]);
}

function _mult(_frame, args) {
  return args[0].primMultiply(args[1]);
}

function _doubleDiv(_frame, args) {
  return args[0].primDoubleDiv(args[1]);
}

function _intDiv(_frame, args) {
  return args[0].primIntDiv(args[1]);
}

function _mod(_frame, args) {
  return args[0].primModulo(args[1]);
}

function _and(_frame, args) {
  return args[0].primAnd(args[1]);
}

function _equals(_frame, args) {
  return args[0].primEquals(args[1]);
}

function _equalsEquals(_frame, args) {
  return args[0].primEquals(args[1]);
}

function _lessThan(_frame, args) {
  return args[0].primLessThan(args[1]);
}

function _fromString(_frame, args) {
  const param = args[1];
  if (!(param instanceof SString)) {
    return universe.nilObject;
  }

  const i = BigInt(param.getEmbeddedString());
  return intOrBigInt(i, universe);
}

function _leftShift(_frame, args) {
  const r = toNumber(args[1]);
  const l = toNumber(args[0]);

  const result = l << r;
  if (Math.floor(l) !== l || !isInIntRange(result) || !isInIntRange(l * (2 ** r))) {
    let big = BigInt(l);
    big *= BigInt(2 ** r);
    return universe.newBigInteger(big);
  }
  return universe.newInteger(result);
}

function _bitXor(_frame, args) {
  const right = args[1];
  const left = args[0];

  if (left instanceof SInteger && right instanceof SInteger) {
    return universe.newInteger(left.getEmbeddedInteger() ^ right.getEmbeddedInteger());
  }

  if (left instanceof SInteger && right instanceof SBigInteger) {
    return intOrBigInt(BigInt(left.getEmbeddedInteger()) ^ right.getEmbeddedBigInteger(), universe);
  }

  if (left instanceof SBigInteger && right instanceof SBigInteger) {
    return universe.newBigInteger(left.getEmbeddedBigInteger()
        ^ right.getEmbeddedBigInteger());
  }

  if (left instanceof SBigInteger && right instanceof SInteger) {
    return intOrBigInt(left.getEmbeddedBigInteger()
        ^ BigInt(right.getEmbeddedInteger()), universe);
  }

  return notYetImplemented();
}

function _rem(_frame, args) {
  const right = args[1];
  const left = args[0];
  return universe.newInteger(left.getEmbeddedInteger()
        % right.getEmbeddedInteger());
}

function _as32BitUnsignedValue(_frame, args) {
  return args[0].prim32BitUnsignedValue();
}

function _as32BitSignedValue(_frame, args) {
  return args[0].prim32BitSignedValue();
}

function _unsignedRightShift(_frame, args) {
  const right = toNumber(args[1]);
  const left = toNumber(args[0]);
  return universe.newInteger(left >>> right);
}

function _asDouble(_frame, args) {
  return universe.newDouble(toNumber(args[0]));
}

class IntegerPrimitives extends Primitives {
  installPrimitives() {
    this.installInstancePrimitive('asString', _asString);
    this.installInstancePrimitive('sqrt', _sqrt);
    this.installInstancePrimitive('atRandom', _atRandom);
    this.installInstancePrimitive('+', _plus);
    this.installInstancePrimitive('-', _minus);
    this.installInstancePrimitive('*', _mult);
    this.installInstancePrimitive('//', _doubleDiv);
    this.installInstancePrimitive('/', _intDiv);
    this.installInstancePrimitive('%', _mod);
    this.installInstancePrimitive('&', _and);
    this.installInstancePrimitive('=', _equals);
    this.installInstancePrimitive('==', _equalsEquals, true);
    this.installInstancePrimitive('<', _lessThan);
    this.installInstancePrimitive('<<', _leftShift);
    this.installInstancePrimitive('bitXor:', _bitXor);
    this.installInstancePrimitive('rem:', _rem);
    this.installInstancePrimitive('>>>', _unsignedRightShift);

    this.installInstancePrimitive('as32BitUnsignedValue', _as32BitUnsignedValue);
    this.installInstancePrimitive('as32BitSignedValue', _as32BitSignedValue);

    this.installInstancePrimitive('asDouble', _asDouble);

    this.installClassPrimitive('fromString:', _fromString);
  }
}

export const prims = IntegerPrimitives;
