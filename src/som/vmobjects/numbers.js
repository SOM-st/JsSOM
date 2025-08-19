/* eslint-disable no-use-before-define */
/*
* Copyright (c) 2014-2019 Stefan Marr, mail@stefan-marr.de
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

import { RuntimeException } from '../../lib/exceptions.js';

import { assert, notYetImplemented } from '../../lib/assert.js';
import { isInIntRange, intOrBigInt } from '../../lib/platform.js';

import { SAbstractObject } from './SAbstractObject.js';
import { universe } from '../vm/Universe.js';

export class SInteger extends SAbstractObject {
  constructor(intVal) {
    super();
    assert(isInIntRange(intVal) && Math.floor(intVal) === intVal);
    this.intVal = intVal;
  }

  getEmbeddedInteger() {
    return this.intVal;
  }

  getClass() {
    return universe.integerClass;
  }

  toDouble() {
    return universe.newDouble(this.intVal); // JS numbers are always doubles...
  }

  primLessThan(right) {
    let result;
    if (right instanceof SBigInteger) {
      result = this.intVal < right.getEmbeddedBigInteger();
    } else if (right instanceof SDouble) {
      return this.toDouble().primLessThan(right);
    } else {
      result = this.intVal < right.getEmbeddedInteger();
    }
    return result ? universe.trueObject : universe.falseObject;
  }

  primAsString() {
    return universe.newString(this.intVal.toString());
  }

  primAdd(right) {
    if (right instanceof SBigInteger) {
      return intOrBigInt(right.getEmbeddedBigInteger() + BigInt(this.intVal), universe);
    } if (right instanceof SDouble) {
      return this.toDouble().primAdd(right);
    }
    const r = right.getEmbeddedInteger();
    return intOrBigInt(this.intVal + r, universe);
  }

  primSubtract(right) {
    if (right instanceof SBigInteger) {
      return intOrBigInt(BigInt(this.intVal) - right.getEmbeddedBigInteger(), universe);
    } if (right instanceof SDouble) {
      return this.toDouble().primSubtract(right);
    }
    const r = right.getEmbeddedInteger();
    return intOrBigInt(this.intVal - r, universe);
  }

  primMultiply(right) {
    if (right instanceof SBigInteger) {
      return intOrBigInt(right.getEmbeddedBigInteger().multiply(this.intVal), universe);
    } if (right instanceof SDouble) {
      return this.toDouble().primMultiply(right);
    }
    const r = right.getEmbeddedInteger();
    return intOrBigInt(this.intVal * r, universe);
  }

  primDoubleDiv(right) {
    let result;
    if (right instanceof SBigInteger) {
      result = this.intVal / Number(right.getEmbeddedBigInteger());
    } else if (right instanceof SDouble) {
      result = this.intVal / right.getEmbeddedDouble();
    } else {
      result = this.intVal / right.getEmbeddedInteger();
    }
    return universe.newDouble(result);
  }

  primIntDiv(right) {
    if (right instanceof SBigInteger) {
      const result = BigInt(this.intVal).divide(right.getEmbeddedBigInteger());
      return universe.newBigInteger(result);
    } if (right instanceof SDouble) {
      return this.toDouble().primIntDiv(right);
    }
    const result = Math.floor(this.intVal / right.getEmbeddedInteger());
    return universe.newInteger(result);
  }

  primModulo(right) {
    if (right instanceof SBigInteger) {
      const result = BigInt(this.intVal).mod(right.getEmbeddedBigInteger());
      return universe.newBigInteger(result);
    } if (right instanceof SDouble) {
      return this.toDouble().primModulo(right);
    }
    const r = right.getEmbeddedInteger();
    // Java has Math.floorMod, JavaScript can use this
    // but it is likely to be very inefficient
    const result = Math.floor(((this.intVal % r) + r) % r);
    return universe.newInteger(result);
  }

  primAnd(right) {
    if (right instanceof SInteger) {
      return universe.newInteger(this.intVal & right.getEmbeddedInteger());
    }

    if (right instanceof SBigInteger) {
      const r = Number(BigInt.asUintN(53, right.getEmbeddedBigInteger()));
      return universe.newInteger(this.intVal & r);
    }

    notYetImplemented(); // not supported by the library and, not sure what semantics should be
    return null;
  }

  primEquals(right) {
    let result;
    if (right instanceof SBigInteger) {
      result = BigInt(this.intVal).equals(right.getEmbeddedBigInteger());
    } else if (right instanceof SDouble) {
      result = this.intVal === right.getEmbeddedDouble();
    } else if (right instanceof SInteger) {
      result = this.intVal === right.getEmbeddedInteger();
    } else {
      result = false;
    }
    return (result) ? universe.trueObject : universe.falseObject;
  }

  prim32BitUnsignedValue() {
    const arr = new Uint32Array(1);
    arr[0] = this.intVal;
    return intOrBigInt(arr[0], universe);
  }

  prim32BitSignedValue() {
    return universe.newInteger(this.intVal | 0);
  }
}

function asFloat(obj) {
  if (obj instanceof SDouble) {
    return obj.getEmbeddedDouble();
  } if (obj instanceof SInteger) {
    return obj.getEmbeddedInteger();
  } if (obj instanceof SBigInteger) {
    return Number(obj.getEmbeddedBigInteger());
  }
  throw new RuntimeException(`Cannot coerce ${obj} to Double!`);
}

export class SDouble extends SAbstractObject {
  constructor(doubleVal) {
    super();
    this.doubleVal = doubleVal;
  }

  getEmbeddedDouble() {
    return this.doubleVal;
  }

  getClass() {
    return universe.doubleClass;
  }

  primMultiply(right) {
    return universe.newDouble(this.doubleVal * asFloat(right));
  }

  primAdd(right) {
    return universe.newDouble(this.doubleVal + asFloat(right));
  }

  primAsInteger() {
    const val = this.doubleVal > 0 ? Math.floor(this.doubleVal) : Math.ceil(this.doubleVal);
    return universe.newInteger(val);
  }

  primAsString() {
    let val = this.doubleVal.toString();
    if (!val.includes('.') && !Number.isNaN(this.doubleVal)) {
      val += '.0'; // ensure that we have a decimal point
    }
    return universe.newString(val);
  }

  primSubtract(right) {
    return universe.newDouble(this.doubleVal - asFloat(right));
  }

  primDoubleDiv(right) {
    return universe.newDouble(this.doubleVal / asFloat(right));
  }

  primIntDiv(right) {
    return universe.newInteger(Math.floor(this.doubleVal / asFloat(right)));
  }

  primModulo(right) {
    return universe.newDouble(this.doubleVal % asFloat(right));
  }

  primEquals(right) {
    return (this.doubleVal === asFloat(right)) ? universe.trueObject : universe.falseObject;
  }

  primLessThan(right) {
    return (this.doubleVal < asFloat(right)) ? universe.trueObject : universe.falseObject;
  }
}

export class SBigInteger extends SAbstractObject {
  constructor(bigIntVal) {
    super();
    assert(typeof bigIntVal === 'bigint');
    assert(!isInIntRange(bigIntVal));
    this.bigIntVal = bigIntVal;
  }

  getEmbeddedBigInteger() {
    return this.bigIntVal;
  }

  getClass() {
    return universe.integerClass;
  }

  primLessThan(right) {
    let result;
    if (right instanceof SDouble) {
      result = Number(this.bigIntVal) < right.getEmbeddedDouble();
    } else if (right instanceof SInteger) {
      result = this.bigIntVal < right.getEmbeddedInteger();
    } else {
      result = this.bigIntVal < right.getEmbeddedBigInteger();
    }
    return (result) ? universe.trueObject : universe.falseObject;
  }

  primAsString() {
    return universe.newString(this.bigIntVal.toString());
  }

  primAdd(right) {
    if (right instanceof SBigInteger) {
      return universe.newBigInteger(right.getEmbeddedBigInteger() + this.bigIntVal);
    } if (right instanceof SDouble) {
      return universe.newDouble(Number(this.bigIntVal) + right.getEmbeddedDouble());
    }
    return intOrBigInt(this.bigIntVal + BigInt(right.getEmbeddedInteger()), universe);
  }

  primSubtract(right) {
    let result;
    if (right instanceof SBigInteger) {
      result = this.bigIntVal - right.getEmbeddedBigInteger();
    } else if (right instanceof SDouble) {
      return universe.newDouble(Number(this.bigIntVal) - right.getEmbeddedDouble());
    } else {
      result = this.bigIntVal - BigInt(right.getEmbeddedInteger());
    }
    return universe.newBigInteger(result);
  }

  primMultiply(right) {
    let result;
    if (right instanceof SBigInteger) {
      result = this.bigIntVal * right.getEmbeddedBigInteger();
    } else if (right instanceof SDouble) {
      return universe.newDouble(Number(this.bigIntVal) * right.getEmbeddedDouble());
    } else {
      result = this.bigIntVal * BigInt(right.getEmbeddedInteger());
    }
    return universe.newBigInteger(result);
  }

  primDoubleDiv(right) {
    let result;
    const doubleVal = Number(this.bigIntVal);
    if (right instanceof SBigInteger) {
      result = doubleVal / Number(right.getEmbeddedBigInteger());
    } else if (right instanceof SDouble) {
      result = doubleVal / right.getEmbeddedDouble();
    } else {
      result = doubleVal / right.getEmbeddedInteger();
    }
    return universe.newDouble(result);
  }

  primIntDiv(right) {
    let result;
    if (right instanceof SBigInteger) {
      result = this.bigIntVal / right.getEmbeddedBigInteger();
    } else if (right instanceof SDouble) {
      return universe.newDouble(Number(this.bigIntVal)).primIntDiv(right);
    } else {
      result = this.bigIntVal / BigInt(right.getEmbeddedInteger());
    }
    return universe.newBigInteger(result);
  }

  primModulo(right) {
    let result;
    if (right instanceof SBigInteger) {
      result = this.bigIntVal % right.getEmbeddedBigInteger();
    } else if (right instanceof SDouble) {
      return universe.newDouble(Number(this.bigIntVal)).primModulo(right);
    } else {
      result = this.bigIntVal % right.getEmbeddedInteger();
    }
    return universe.newBigInteger(result);
  }

  primAnd(right) {
    if (right instanceof SBigInteger) {
      return intOrBigInt(this.bigIntVal & right.getEmbeddedBigInteger(), universe);
    }

    if (right instanceof SInteger) {
      return intOrBigInt(this.bigIntVal & BigInt(right.getEmbeddedInteger()), universe);
    }

    notYetImplemented(); // not supported by the library and, not sure what semantics should be
    return null;
  }

  primEquals(right) {
    let result;
    if (right instanceof SBigInteger) {
      result = this.bigIntVal === right.getEmbeddedBigInteger();
    } else if (right instanceof SDouble) {
      result = Number(this.bigIntVal) === right.getEmbeddedDouble();
    } else if (right instanceof SInteger) {
      result = this.bigIntVal === right.getEmbeddedInteger();
    } else {
      result = false;
    }
    return (result) ? universe.trueObject : universe.falseObject;
  }

  prim32BitUnsignedValue() {
    return intOrBigInt(BigInt.asUintN(32, this.bigIntVal), universe);
  }

  prim32BitSignedValue() {
    return intOrBigInt(BigInt.asIntN(32, this.bigIntVal), universe);
  }
}
