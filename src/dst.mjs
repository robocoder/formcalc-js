"use strict";

import { EnvironmentInterface } from "./environment.mjs";

export class DynamicSymbolTableException extends Error {}

/**
 * Dynamic symbol table to support FormCalc environment
 *
 * Notes:
 * - names are vars are case-sensitive
 * - names of functions are case-insensitive
 */
export class DynamicSymbolTable extends EnvironmentInterface {
    constructor() {
        super();

        const $ = this;
        let undef;

        // initialize root (global) scope
        $.functions = new Array(new Map);
        $.variables = new Array(new Map);
        $.passthru = new Array();
        $.passthru.push(undef);
    }

    /**
     * Reset
     */
    reset() {
        const $ = this;
        let undef;

        $.functions.splice(1);
        $.variables.splice(1);
        $.passthru = new Array();
        $.passthru.push(undef);
    }

    /**
     * Push new block scope
     *
     * @return integer
     */
    push() {
        const $ = this;
        const current = $.functions.length;
        let undef;
        
        $.functions.push(new Map);
        $.variables.push(new Map);
        $.passthru.push(undef);

        return current;
    }

    /**
     * Pop block scope, optionally to a specific level; peeks at result beforehand
     *
     * @param integer to
     *
     * @return mixed
     */
    pop(to) {
        const $ = this;

        if (to == 0 || $.functions.length == 1) {
            throw new DynamicSymbolTableException('never pop the root scope!');
        }

        const result = $.passthru.at(-1);

        if (typeof(to) == 'undefined') {
            $.functions.pop();
            $.variables.pop();
            $.passthru.pop();

            return result;
        }

        $.functions.splice(to);
        $.variables.splice(to);
        $.passthru.splice(to);

        return result;
    }

    /**
     * Get current scope level
     *
     * @return integer
     */
    depth() {
        const $ = this;

        return $.functions.length - 1;
    }

    /**
     * Poke result
     *
     * @param mixed
     */
    poke(value) {
        const $ = this;

        if (typeof(value) != 'undefined') {
            $.passthru[$.passthru.length - 1] = value;
        }
    }

    /**
     * Peek result
     *
     * @return mixed
     */
    peek() {
        const $ = this;

        return $.passthru.at(-1);
    }

    /**
     * Set variable
     *
     * @param string  name
     * @param mixed   value
     * @param integer depth If set, forces the scope level; otherwise, searches from current scope towards root
     *
     * @return mixed
     */
    set(name, value, depth) {
        const $ = this;

        if (typeof(depth) != 'undefined') {
            $.variables[depth].set(name, value);
            return value;
        }

        const current = $.variables.length - 1;

        for (let i = current; i >= 0; i--) {
            if ($.variables[i].has(name)) {
                $.variables[i].set(name, value);
                return value;
            }
        }

        $.variables[current].set(name, value);
    }

    /**
     * Get variable
     *
     * @param string  name
     *
     * @return mixed
     */
    get(name) {
        const $ = this;
        const current = $.variables.length - 1;

        for (let i = current; i >= 0; i--) {
            if ($.variables[i].has(name)) {
                return $.variables[i].get(name);
            }
        }

        throw new DynamicSymbolTableException(`variable "${name}" not found`);
    }

    /**
     * Register function
     *
     * @param string  name
     * @param object  func
     * @param integer depth If unset, defaults to the current scope
     */
    register(name, func, depth) {
        const $ = this;

        name = name.toLowerCase();

        if (typeof(depth) != 'undefined') {
            $.functions[depth].set(name, func);
            return;
        }

        const current = $.functions.length - 1;

        $.functions[current].set(name, func);
    }

    /**
     * Locate function - searches root first, then iterates from the current scope towards root
     *
     * @param string name
     *
     * @return mixed
     */
    find(name) {
        const $ = this;

        name = name.toLowerCase();

        if ($.functions[0].has(name)) {
            return $.functions[0].get(name);
        }

        const current = $.functions.length - 1;

        for (let i = current; i > 0; i--) {
            if ($.functions[i].has(name)) {
                return $.functions[i].get(name);
            }
        }

        throw new DynamicSymbolTableException(`function "${name}" not found`);
    }

    /**
     * Is collection?
     *
     * @param mixed obj
     *
     * @return boolean
     */
    isCollection(obj) {
        return Array.isArray(obj);
    }

    /**
     * Get nth item of collection
     *
     * @param mixed   collection
     * @param integer n
     *
     * @return mixed
     */
    nth(collection, n = 0) {
        const $ = this;

        if ($.isCollection(collection) && collection.length > n && n >= 0) {
            return collection[n];
        }

        throw new DynamicSymbolTableException(`nth(${n}) item not found`);
    }
}
