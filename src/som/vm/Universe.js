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

import { assert } from '../../lib/assert.js';
import { IllegalStateException } from '../../lib/exceptions.js';

import {
  getMillisecondTicks, isBrowser, stderr, stderrnl, stdout, stdoutnl, exitInterpreter,
} from '../../lib/platform.js';

import { Shell } from './Shell.js';

import { compileClassFile } from '../compiler/SourcecodeCompiler.js';

import { SObject } from '../vmobjects/SObject.js';
import { SBlock, getBlockEvaluationPrimitive } from '../vmobjects/SBlock.js';
import { SArray } from '../vmobjects/SArray.js';
import { SClass } from '../vmobjects/SClass.js';
import { SString } from '../vmobjects/SString.js';
import { SSymbol } from '../vmobjects/SSymbol.js';
import { SPrimitive, SMethod } from '../vmobjects/SInvokable.js';
import { SInteger, SBigInteger, SDouble } from '../vmobjects/numbers.js';

class Association {
  constructor(keySymbol, valueObj) {
    this.key = keySymbol;
    this.value = valueObj;
  }

  getKey() { return this.key; }

  getValue() { return this.value; }

  setValue(v) { this.value = v; }
}

class ExitException {
  constructor(exitCode) {
    this.exitCode = exitCode;
  }

  getExitCode() { return this.exitCode; }
}

function printUsageAndExit() {
  // TODO
}

function getDefaultClassPath() {
  if (isBrowser) {
    return ['core-lib/Smalltalk', 'core-lib/Examples', 'core-lib/TestSuite'];
  }
  return ['.'];
}

const pathSeparator = ':';

class Universe {
  constructor() {
    this.avoidExit = false;
    this.classPath = null;
    this.globals = {};
    this.objectSystemInitialized = false;

    this.printAST = false;
    this.symbolTable = {};
    this.lastExitCode = 0;

    this.nilObject = new SObject(null, 0);
    this.metaclassClass = this.newMetaclassClass();
    this.objectClass = this.newSystemClass();
    this.nilClass = this.newSystemClass();
    this.classClass = this.newSystemClass();
    this.arrayClass = this.newSystemClass();
    this.symbolClass = this.newSystemClass();
    this.methodClass = this.newSystemClass();
    this.integerClass = this.newSystemClass();
    this.primitiveClass = this.newSystemClass();
    this.stringClass = this.newSystemClass();
    this.doubleClass = this.newSystemClass();
    this.booleanClass = this.newSystemClass();
    this.trueClass = this.newSystemClass();
    this.falseClass = this.newSystemClass();
    this.blockClasses = [];
    this.trueObject = null;
    this.falseObject = null;
    this.systemObject = null;
    this.startTime = getMillisecondTicks();
  }

  setAvoidExit(bool) {
    this.avoidExit = bool;
  }

  setupClassPath(cp) {
    const tokens = cp.split(pathSeparator);
    this.classPath = getDefaultClassPath();
    this.classPath = this.classPath.concat(tokens);
  }

  // take argument of the form "../foo/Test.som" and return
  // "../foo", "Test", "som"
  getPathClassExt(str) {
    const pathElements = str.split('/');
    const fileName = pathElements.pop();
    const parentPath = pathElements.join('/');
    const nameParts = fileName.split('.');

    if (nameParts.length > 2) {
      this.errorPrintln('Class with . in its name?');
      this.exit(1);
    }

    return [(parentPath === null) ? '' : parentPath,
      nameParts[0],
      nameParts.length > 1 ? nameParts[1] : ''];
  }

  handleArguments(args) {
    let gotClasspath = false;
    const remainingArgs = [];

    for (let i = 0; i < args.length; i += 1) {
      if (args[i] === '-cp') {
        if (i + 1 >= args.length) {
          printUsageAndExit();
        }
        this.setupClassPath(args[i + 1]);
        i += 1; // skip class path
        gotClasspath = true;
      } else if (args[i] === '-d') {
        this.printAST = true;
      } else {
        remainingArgs.push(args[i]);
      }
    }

    if (!gotClasspath) {
      // Get the default class path of the appropriate size
      this.classPath = getDefaultClassPath();
    }

    // check remaining args for class paths, and strip file extension
    for (let i = 0; i < remainingArgs.length; i += 1) {
      const split = this.getPathClassExt(remainingArgs[i]);

      if (split[0] !== '') { // there was a path
        this.classPath.unshift(split[0]);
      }
      remainingArgs[i] = split[1];
    }

    return remainingArgs;
  }

  newSymbol(string) {
    const result = new SSymbol(string);
    this.symbolTable[string] = result;
    return result;
  }

  symbolFor(string) {
    assert(typeof string === 'string' || string instanceof String);
    // Lookup the symbol in the symbol table
    const result = this.symbolTable[string];
    if (result != null) { return result; }

    return this.newSymbol(string);
  }

  newMetaclassClass() {
    // Allocate the metaclass classes
    const result = new SClass(null, 0);
    result.setClass(new SClass(null, 0));

    // Setup the metaclass hierarchy
    result.getClass().setClass(result);
    return result;
  }

  newSystemClass() {
    // Allocate the new system class
    const systemClass = new SClass(null, 0);

    // Setup the metaclass hierarchy
    systemClass.setClass(new SClass(null, 0));
    systemClass.getClass().setClass(this.metaclassClass);

    // Return the freshly allocated system class
    return systemClass;
  }

  initializeSystemClass(systemClass, superClass, name) {
    // Initialize the superclass hierarchy
    if (superClass != null) {
      systemClass.setSuperClass(superClass);
      systemClass.getClass().setSuperClass(superClass.getClass());
    } else {
      systemClass.getClass().setSuperClass(this.classClass);
    }

    // Initialize the array of instance fields
    systemClass.setInstanceFields(new SArray(0));
    systemClass.getClass().setInstanceFields(new SArray(0));

    // Initialize the array of instance invokables
    systemClass.setInstanceInvokables(new SArray(0));
    systemClass.getClass().setInstanceInvokables(new SArray(0));

    // Initialize the name of the system class
    systemClass.setName(this.symbolFor(name));
    systemClass.getClass().setName(this.symbolFor(`${name} class`));

    // Insert the system class into the dictionary of globals
    this.setGlobal(systemClass.getName(), systemClass);
  }

  loadPrimitives(result, isSystemClass) {
    if (result == null) { return; }

    // Load primitives if class defines them, or try to load optional
    // primitives defined for system classes.
    if (result.hasPrimitives() || isSystemClass) {
      result.loadPrimitives(!isSystemClass);
    }
  }

  loadBlockClass(numberOfArguments) {
    // Compute the name of the block class with the given number of arguments
    const name = this.symbolFor(`Block${numberOfArguments}`);
    assert(this.getGlobal(name) == null);

    // Get the block class for blocks with the given number of arguments
    const result = this.loadClassFor(name, null);

    // Add the appropriate value primitive to the block class
    const prim = getBlockEvaluationPrimitive(numberOfArguments, result);
    result.addInstancePrimitive(prim);

    // Insert the block class into the dictionary of globals
    this.setGlobal(name, result);

    this.blockClasses[numberOfArguments] = result;
  }

  loadClass(name) {
    // Check if the requested class is already in the dictionary of globals
    let result = this.getGlobal(name);
    if (result != null) { return result; }

    result = this.loadClassFor(name, null);

    this.loadPrimitives(result, false);

    this.setGlobal(name, result);
    return result;
  }

  loadClassFor(name, systemClass) {
    // Try loading the class from all different paths
    for (let i = 0; i < this.classPath.length; i += 1) {
      const cpEntry = this.classPath[i];

      // Load the class from a file and return the loaded class
      const result = compileClassFile(
        cpEntry,
        name.getString(),
        systemClass,
        this,
      );
      if (result == null) {
        continue; // continue searching in the class path
      }
      if (this.printAST) {
        // TODO
        // dump(result.getClass());
        // dump(result);
      }
      return result;
    }
    return null; // The class could not be found.
  }

  loadSystemClass(systemClass) {
    // Load the system class
    const result = this.loadClassFor(systemClass.getName(), systemClass);

    if (result === null) {
      throw new IllegalStateException(`${systemClass.getName().getString()
      } class could not be loaded. `
                + 'It is likely that the class path has not been initialized properly. '
                + 'Please set system property \'system.class.path\' or '
                + 'pass the \'-cp\' command-line parameter.');
    }
    this.loadPrimitives(result, true);
  }

  initializeObjectSystem() {
    if (this.objectSystemInitialized) { return; }

    // Setup the class reference for the nil object
    this.nilObject.setClass(this.nilClass);

    // Initialize the system classes.
    this.initializeSystemClass(this.objectClass, null, 'Object');
    this.initializeSystemClass(this.classClass, this.objectClass, 'Class');
    this.initializeSystemClass(this.metaclassClass, this.classClass, 'Metaclass');
    this.initializeSystemClass(this.nilClass, this.objectClass, 'Nil');
    this.initializeSystemClass(this.arrayClass, this.objectClass, 'Array');
    this.initializeSystemClass(this.methodClass, this.objectClass, 'Method');
    this.initializeSystemClass(this.integerClass, this.objectClass, 'Integer');
    this.initializeSystemClass(this.primitiveClass, this.objectClass, 'Primitive');
    this.initializeSystemClass(this.stringClass, this.objectClass, 'String');
    this.initializeSystemClass(this.symbolClass, this.stringClass, 'Symbol');
    this.initializeSystemClass(this.doubleClass, this.objectClass, 'Double');
    this.initializeSystemClass(this.booleanClass, this.objectClass, 'Boolean');
    this.initializeSystemClass(this.trueClass, this.booleanClass, 'True');
    this.initializeSystemClass(this.falseClass, this.booleanClass, 'False');

    // Load methods and fields into the system classes
    this.loadSystemClass(this.objectClass);
    this.loadSystemClass(this.classClass);
    this.loadSystemClass(this.metaclassClass);
    this.loadSystemClass(this.nilClass);
    this.loadSystemClass(this.arrayClass);
    this.loadSystemClass(this.methodClass);
    this.loadSystemClass(this.symbolClass);
    this.loadSystemClass(this.integerClass);
    this.loadSystemClass(this.primitiveClass);
    this.loadSystemClass(this.stringClass);
    this.loadSystemClass(this.doubleClass);
    this.loadSystemClass(this.booleanClass);
    this.loadSystemClass(this.trueClass);
    this.loadSystemClass(this.falseClass);

    // Load the generic block class
    this.blockClasses[0] = this.loadClass(this.symbolFor('Block'));

    // Setup the true and false objects
    this.trueObject = this.newInstance(this.trueClass);
    this.falseObject = this.newInstance(this.falseClass);

    // Load the system class and create an instance of it
    this.systemClass = this.loadClass(this.symbolFor('System'));
    this.systemObject = this.newInstance(this.systemClass);

    // Put special objects into the dictionary of globals
    this.setGlobal(this.symbolFor('nil'), this.nilObject);
    this.setGlobal(this.symbolFor('true'), this.trueObject);
    this.setGlobal(this.symbolFor('false'), this.falseObject);
    this.setGlobal(this.symbolFor('system'), this.systemObject);

    // Load the remaining block classes
    this.loadBlockClass(1);
    this.loadBlockClass(2);
    this.loadBlockClass(3);

    this.objectSystemInitialized = true;
  }

  getGlobal(name) {
    const assoc = this.globals[name];
    if (assoc == null) {
      return null;
    }
    return assoc.getValue();
  }

  getGlobalsAssociation(name) {
    return this.globals[name];
  }

  hasGlobal(name) {
    return this.globals[name] !== undefined;
  }

  setGlobal(nameSymbol, value) {
    let assoc = this.globals[nameSymbol];
    if (assoc == null) {
      assoc = new Association(nameSymbol, value);
      this.globals[nameSymbol] = assoc;
    } else {
      assoc.setValue(value);
    }
  }

  execute(args) {
    this.initializeObjectSystem();

    // Start the shell if no filename is given
    if (args.length === 0) {
      const shell = new Shell();
      return shell.start();
    }

    // Lookup the initialize invokable on the system class
    const initialize = this.systemClass
      .lookupInvokable(this.symbolFor('initialize:'));
    const somArgs = this.newArrayWithStrings(args);

    return initialize.invoke(null, [this.systemObject, somArgs]);
  }

  initializeForStandardRepl() {
    this.classPath = ['Smalltalk', 'TestSuite', 'Examples', 'Examples/Benchmarks', 'SUnit'];
    this.initializeObjectSystem();
  }

  interpretMethodInClass(className, selector) {
    this.initializeObjectSystem();

    const clazz = this.loadClass(this.symbolFor(className));

    // Lookup the initialize invokable on the system class
    const initialize = clazz.getClass()
      .lookupInvokable(this.symbolFor(selector));

    if (initialize === null) {
      throw new Error(`Lookup of ${selector} in ${className} failed. Can't be executed.`);
    }

    try {
      return initialize.invoke(null, [clazz]);
    } catch (e) {
      if (e instanceof ExitException) {
        return e;
      }
      throw e;
    }
  }

  interpret(args) {
    // Check for command line switches first
    const remainingArgs = this.handleArguments(args);

    try {
      this.initializeObjectSystem();
      return this.execute(remainingArgs);
    } catch (e) {
      if (e instanceof ExitException) {
        return e;
      }
      if ('getMessage' in e) {
        // eslint-disable-next-line no-console
        console.error(e.getMessage());
      }
      throw e;
    }
  }

  newArrayWithStrings(strArr) {
    const arr = this.newArrayWithLength(strArr.length);
    for (let i = 0; i < strArr.length; i += 1) {
      arr.setIndexableField(i, this.newString(strArr[i]));
    }
    return arr;
  }

  newArrayFrom(array) {
    return new SArray(array.length, array);
  }

  newArrayWithLength(length) {
    return new SArray(length);
  }

  newMethod(signature, sourceSection, bodyNode, numberOfTemps) {
    return new SMethod(signature, sourceSection, bodyNode, numberOfTemps);
  }

  newPrimitive(signature, primFun, holder) {
    return new SPrimitive(signature, primFun, holder);
  }

  newString(strValue) {
    return new SString(strValue);
  }

  newInteger(intVal) {
    return new SInteger(intVal);
  }

  newBigInteger(bigIntVal) {
    return new SBigInteger(bigIntVal);
  }

  newBlock(blockMethod, contextFrame) {
    return new SBlock(blockMethod, contextFrame);
  }

  newClass(classClass) {
    return new SClass(classClass);
  }

  newDouble(doubleVal) {
    return new SDouble(doubleVal);
  }

  newInstance(clazz) {
    return new SObject(clazz);
  }

  errorExit(message) {
    this.errorPrintln(`Runtime Error: ${message}`);
    this.exit(1);
  }

  errorPrint(msg) {
    stderr(msg);
  }

  errorPrintln(msg) {
    stderrnl(msg);
  }

  print(msg) {
    stdout(msg);
  }

  println(msg) {
    stdoutnl(msg);
  }

  exit(errorCode) {
    // Exit from the Java system
    this.lastExitCode = errorCode;
    if (!this.avoidExit) {
      exitInterpreter(errorCode);
    }
    throw new ExitException(errorCode);
  }

  getLastExitCode() {
    return this.lastExitCode;
  }
}

export const universe = new Universe();
