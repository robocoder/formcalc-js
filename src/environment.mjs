"use strict";

/*eslint no-unused-vars: ["error", { "args": "none" }]*/

/**
 * Environment base class / interface between the interpreter and engine (host environment)
 */
export class EnvironmentInterface {
    constructor(locales) {
        if (typeof(locales) == 'undefined') {
            locales = typeof(navigator) == 'undefined'
                    ? (new Intl.ListFormat).resolvedOptions().locale
                    : navigator?.languages || navigator.language;
        }

        this.locales = locales;
    }

    /**
     * Reset
     */
    reset() { }

    /**
     * Push new block scope
     *
     * @param string name
     *
     * @return integer
     */
    push(name) { }

    /**
     * Pop block scope, optionally to a specific level; peeks at result beforehand
     *
     * @param integer to
     *
     * @return mixed
     */
    pop(to) { }

    /**
     * Can we pop the scope here?
     *
     * @param string context
     *
     * @return boolean
     */
    inContext(context) { }

    /**
     * Get current scope level
     *
     * @return integer
     */
    depth() { }

    /**
     * Poke result
     *
     * @param mixed
     */
    poke(value) { }

    /**
     * Peek result
     *
     * @return mixed
     */
    peek() { }

    /**
     * Set variable
     *
     * @param string  name
     * @param mixed   value
     * @param integer depth If set, forces the scope level; otherwise, searches from current scope towards root
     *
     * @return mixed
     */
    set(name, value, depth) { }

    /**
     * Get variable
     *
     * @param string  name
     *
     * @return mixed
     */
    get(name) { }

    /**
     * Register function
     *
     * @param string  name
     * @param object  func
     * @param integer depth If unset, defaults to the current scope
     */
    register(name, func, depth) { }

    /**
     * Locate function - searches root first, then iterates from the current scope towards root
     *
     * @param string name
     *
     * @return mixed
     */
    find(name) { }

    /**
     * Is collection?
     *
     * @param mixed obj
     *
     * @return boolean
     */
    isCollection(obj) { }

    /**
     * Get nth item of collection
     *
     * @param mixed   collection
     * @param integer n
     *
     * @return mixed
     */
    nth(collection, n = 0) { }
}
