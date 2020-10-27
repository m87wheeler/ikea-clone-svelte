
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\svg\Close.svelte generated by Svelte v3.29.0 */

    const file = "src\\svg\\Close.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M12.0002 13.4144L16.9499 18.3642L18.3642 16.9499L13.4144 12.0002L18.3642 7.05044L16.95 5.63623L12.0002 10.586L7.05044 5.63623L5.63623 7.05044L10.586 12.0002L5.63624 16.9499L7.05046 18.3642L12.0002 13.4144Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file, 18, 2, 302);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon svelte-mz3j8z");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file, 10, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Close", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Close> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Close extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Close",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\svg\ImageSearch.svelte generated by Svelte v3.29.0 */

    const file$1 = "src\\svg\\ImageSearch.svelte";

    function create_fragment$1(ctx) {
    	let svg;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "fill-rule", "evenodd");
    			attr_dev(path0, "clip-rule", "evenodd");
    			attr_dev(path0, "d", "M16.002 13C16.002 15.2091 14.2111 17 12.002 17C9.79281 17 8.00195 15.2091 8.00195 13C8.00195 10.7909 9.79281 9 12.002 9C14.2111 9 16.002 10.7909 16.002 13ZM14.002 13C14.002 14.1046 13.1065 15 12.002 15C10.8974 15 10.002 14.1046 10.002 13C10.002 11.8954 10.8974 11 12.002 11C13.1065 11 14.002 11.8954 14.002 13Z");
    			attr_dev(path0, "fill", "currentColor");
    			attr_dev(path0, "class", "svelte-mz3j8z");
    			add_location(path0, file$1, 10, 60, 193);
    			attr_dev(path1, "fill-rule", "evenodd");
    			attr_dev(path1, "clip-rule", "evenodd");
    			attr_dev(path1, "d", "M9.44289 4L7.58575 7H3V20H21L21 7H16.4141L14.557 4H9.44289ZM10.557 6H13.4429L15.3 9H19L19 18H5V9H8.69986L10.557 6Z");
    			attr_dev(path1, "fill", "currentColor");
    			attr_dev(path1, "class", "svelte-mz3j8z");
    			add_location(path1, file$1, 15, 2, 600);
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$1, 10, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageSearch", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageSearch> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ImageSearch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageSearch",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\svg\Menu.svelte generated by Svelte v3.29.0 */

    const file$2 = "src\\svg\\Menu.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M20 8H4V6H20V8ZM20 13H4V11H20V13ZM20 18H4V16H20V18Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$2, 18, 2, 302);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon svelte-mz3j8z");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$2, 10, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Menu", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\svg\Notification.svelte generated by Svelte v3.29.0 */

    const file$3 = "src\\svg\\Notification.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M12 20C12.2151 20 12.9482 19.7737 13.7467 18.1766C14.0532 17.5635 14.3212 16.8293 14.5298 16H9.4702C9.6788 16.8293 9.94677 17.5635 10.2533 18.1766C11.0518 19.7737 11.7849 20 12 20ZM9.11146 14C9.03919 13.3641 9 12.6949 9 12C9 11.3051 9.03919 10.6359 9.11146 10H14.8885C14.9608 10.6359 15 11.3051 15 12C15 12.6949 14.9608 13.3641 14.8885 14H9.11146ZM16.584 16C16.3182 17.2166 15.9348 18.307 15.4627 19.2138C16.9162 18.5149 18.1259 17.3895 18.9297 16H16.584ZM19.748 14H16.9C16.9656 13.3538 17 12.6849 17 12C17 11.3151 16.9656 10.6462 16.9 10H19.748C19.9125 10.6392 20 11.3094 20 12C20 12.6906 19.9125 13.3608 19.748 14ZM7.10002 14H4.25203C4.08751 13.3608 4 12.6906 4 12C4 11.3094 4.08751 10.6392 4.25203 10H7.10002C7.03443 10.6462 7 11.3151 7 12C7 12.6849 7.03443 13.3538 7.10002 14ZM5.07026 16H7.41605C7.68183 17.2166 8.06515 18.307 8.53731 19.2138C7.0838 18.5149 5.87406 17.3895 5.07026 16ZM9.4702 8H14.5298C14.3212 7.17074 14.0532 6.43647 13.7467 5.82336C12.9482 4.22632 12.2151 4 12 4C11.7849 4 11.0518 4.22632 10.2533 5.82336C9.94677 6.43647 9.6788 7.17074 9.4702 8ZM16.584 8H18.9297C18.1259 6.61047 16.9162 5.48514 15.4627 4.78617C15.9348 5.69296 16.3182 6.78337 16.584 8ZM8.53731 4.78617C8.06515 5.69296 7.68183 6.78337 7.41604 8H5.07026C5.87406 6.61047 7.08379 5.48514 8.53731 4.78617ZM12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z");
    			attr_dev(path, "class", "svelte-1cc7czh");
    			add_location(path, file$3, 21, 2, 330);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon svelte-1cc7czh");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$3, 13, 0, 161);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Notification", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notification> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Notification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\svg\Search.svelte generated by Svelte v3.29.0 */

    const file$4 = "src\\svg\\Search.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M13.98 15.395a6.294 6.294 0\r\n111.414-1.414l4.602 4.601-1.414 1.414-4.602-4.601zm.607-5.101a4.294 4.294 0\r\n11-8.587 0 4.294 4.294 0 018.587 0z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$4, 11, 2, 200);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$4, 10, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Search", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\svg\ShoppingBag.svelte generated by Svelte v3.29.0 */

    const file$5 = "src\\svg\\ShoppingBag.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M10.9994 4H10.4373L10.1451 4.48017L6.78803 9.99716H3.00001H1.71924L2.02987 11.2397L3.65114 17.7248C3.98501 19.0603 5.18497 19.9972 6.56157 19.9972L17.4385 19.9972C18.8151 19.9972 20.015 19.0603 20.3489 17.7248L21.9702 11.2397L22.2808 9.99716H21H17.2113L13.8539 4.48014L13.5618 4H12.9997H12.0004H10.9994ZM14.8701 9.99716L12.4376 6H12.0004H11.5615L9.12921 9.99716H14.8701ZM5.59142 17.2397L4.28079 11.9972H19.7192L18.4086 17.2397C18.2973 17.6849 17.8973 17.9972 17.4385 17.9972L6.56157 17.9972C6.1027 17.9972 5.70272 17.6849 5.59142 17.2397Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$5, 19, 2, 349);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon hnf-svg-bag-default svelte-mz3j8z");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "display", "block");
    			add_location(svg, file$5, 10, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ShoppingBag", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ShoppingBag> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ShoppingBag extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShoppingBag",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\svg\StadardArrow.svelte generated by Svelte v3.29.0 */

    const file$6 = "src\\svg\\StadardArrow.svelte";

    function create_fragment$6(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M19.2937 12.7074L20.0008 12.0003L19.2938 11.2932L12.0008 3.99927L10.5865 5.41339L16.1727 11.0003H4V13.0003H16.1723L10.5855 18.5868L11.9996 20.0011L19.2937 12.7074Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$6, 10, 62, 195);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$6, 10, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StadardArrow", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StadardArrow> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class StadardArrow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StadardArrow",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\svg\ToggleArrow.svelte generated by Svelte v3.29.0 */

    const file$7 = "src\\svg\\ToggleArrow.svelte";

    function create_fragment$7(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M12.0001 15.5997L6.21432 9.81468L7.62844 8.40038L12.0001 12.7715L16.3718 8.40038L17.7859 9.81469L12.0001 15.5997Z");
    			attr_dev(path, "class", "svelte-1cc7czh");
    			add_location(path, file$7, 20, 2, 296);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-1cc7czh");
    			add_location(svg, file$7, 13, 0, 161);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ToggleArrow", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ToggleArrow> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class ToggleArrow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToggleArrow",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\svg\User.svelte generated by Svelte v3.29.0 */

    const file$8 = "src\\svg\\User.svelte";

    function create_fragment$8(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M10.6724 6.46784C10.9458 6.18665 11.3528 5.99715 12.0217 5.99715C12.4188 5.99715 12.7267 6.08092 12.9746 6.21956C13.2156 6.35439 13.4125 6.5507 13.568 6.83892L13.5713 6.84481C13.7107 7.09904 13.8083 7.4634 13.8083 7.98518C13.8083 8.77085 13.6037 9.23031 13.3287 9.51296L13.3239 9.51801C13.048 9.80558 12.6449 9.99441 11.9899 9.99441C11.6042 9.99441 11.2937 9.91245 11.0339 9.77025C10.7951 9.63594 10.5997 9.44097 10.4451 9.15559C10.2997 8.88054 10.2032 8.50366 10.2032 7.98518C10.2032 7.19499 10.4067 6.74102 10.6724 6.46784ZM12.0217 3.99609C10.9383 3.99609 9.96765 4.32234 9.23788 5.07267C8.50032 5.831 8.20215 6.85365 8.20215 7.98518C8.20215 8.75078 8.34522 9.46819 8.6794 10.0972L8.68251 10.103C9.0074 10.705 9.46753 11.187 10.0602 11.5184L10.0664 11.5219C10.6538 11.8449 11.3032 11.9955 11.9899 11.9955C13.0717 11.9955 14.0383 11.6622 14.7654 10.9059C15.506 10.1432 15.8094 9.11998 15.8094 7.98518C15.8094 7.22231 15.6673 6.50678 15.3274 5.88561C15.0027 5.28499 14.543 4.80406 13.9514 4.47313C13.3656 4.14547 12.7126 3.99609 12.0217 3.99609ZM6.46911 16.8582C6.76743 16.2779 7.19186 15.8309 7.75908 15.501C8.31735 15.1819 9.04246 14.9961 9.97999 14.9961H14.02C14.9575 14.9961 15.6826 15.1819 16.2409 15.501C16.8081 15.8309 17.2326 16.2779 17.5309 16.8582C17.834 17.4478 18 18.1518 18 18.9961V19.9961H20V18.9961C20 17.8839 19.7795 16.8577 19.3096 15.9438C18.8353 15.0213 18.1407 14.2913 17.2425 13.7698L17.2425 13.7698L17.2374 13.7669C16.3095 13.2354 15.2217 12.9961 14.02 12.9961H9.97999C8.77826 12.9961 7.69052 13.2354 6.76257 13.7669L6.76256 13.7669L6.75753 13.7698C5.85928 14.2913 5.16466 15.0213 4.6904 15.9438C4.22053 16.8577 4 17.8839 4 18.9961V19.9961H6V18.9961C6 18.1518 6.16598 17.4478 6.46911 16.8582Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$8, 18, 2, 302);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon svelte-mz3j8z");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$8, 10, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("User", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<User> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class User extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "User",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\svg\WishList.svelte generated by Svelte v3.29.0 */

    const file$9 = "src\\svg\\WishList.svelte";

    function create_fragment$9(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M12.336 5.52055C14.2336 3.62376 17.3096 3.62401 19.2069 5.52129C20.2067 6.52115 20.6796 7.85005 20.6259 9.15761C20.6151 12.2138 18.4184 14.8654 16.4892 16.6366C15.4926 17.5517 14.5004 18.2923 13.7593 18.8036C13.3879 19.0598 13.0771 19.2601 12.8574 19.3973C12.7475 19.466 12.6601 19.519 12.5992 19.5555C12.5687 19.5737 12.5448 19.5879 12.5279 19.5978L12.5079 19.6094L12.502 19.6129L12.5001 19.614C12.5001 19.614 12.4989 19.6147 11.9999 18.748C11.501 19.6147 11.5005 19.6144 11.5005 19.6144L11.4979 19.6129L11.4919 19.6094L11.472 19.5978C11.4551 19.5879 11.4312 19.5737 11.4007 19.5555C11.3397 19.519 11.2524 19.466 11.1425 19.3973C10.9227 19.2601 10.612 19.0598 10.2405 18.8036C9.49947 18.2923 8.50726 17.5517 7.51063 16.6366C5.58146 14.8654 3.38477 12.2139 3.37399 9.15765C3.32024 7.85008 3.79314 6.52117 4.79301 5.52129C6.69054 3.62376 9.76704 3.62376 11.6646 5.52129L11.9993 5.856L12.3353 5.52129L12.336 5.52055ZM11.9999 18.748L11.5005 19.6144L11.9999 19.9019L12.4989 19.6147L11.9999 18.748ZM11.9999 17.573C12.1727 17.462 12.384 17.3226 12.6236 17.1573C13.3125 16.6821 14.2267 15.9988 15.1366 15.1634C17.0157 13.4381 18.6259 11.2919 18.6259 9.13506V9.11213L18.627 9.08922C18.6626 8.31221 18.3844 7.52727 17.7926 6.9355C16.6762 5.81903 14.866 5.81902 13.7495 6.9355L13.7481 6.93689L11.9965 8.68166L10.2504 6.9355C9.13387 5.81903 7.3237 5.81903 6.20722 6.9355C5.61546 7.52727 5.33724 8.31221 5.3729 9.08922L5.37395 9.11213V9.13507C5.37395 11.2919 6.98418 13.4381 8.86325 15.1634C9.77312 15.9988 10.6874 16.6821 11.3762 17.1573C11.6159 17.3226 11.8271 17.462 11.9999 17.573Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$9, 18, 2, 302);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon svelte-mz3j8z");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$9, 10, 0, 133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WishList", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WishList> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class WishList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WishList",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\atoms\Icon.svelte generated by Svelte v3.29.0 */
    const file$a = "src\\components\\atoms\\Icon.svelte";

    // (92:34) 
    function create_if_block_9(ctx) {
    	let wishlist;
    	let current;
    	wishlist = new WishList({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(wishlist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(wishlist, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(wishlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(wishlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(wishlist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(92:34) ",
    		ctx
    	});

    	return block;
    }

    // (90:30) 
    function create_if_block_8(ctx) {
    	let user;
    	let current;
    	user = new User({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(user.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(user, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(user.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(user.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(user, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(90:30) ",
    		ctx
    	});

    	return block;
    }

    // (88:37) 
    function create_if_block_7(ctx) {
    	let togglearrow;
    	let current;
    	togglearrow = new ToggleArrow({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(togglearrow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(togglearrow, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(togglearrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(togglearrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(togglearrow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(88:37) ",
    		ctx
    	});

    	return block;
    }

    // (86:31) 
    function create_if_block_6(ctx) {
    	let stadardarrow;
    	let current;
    	stadardarrow = new StadardArrow({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(stadardarrow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(stadardarrow, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(stadardarrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(stadardarrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(stadardarrow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(86:31) ",
    		ctx
    	});

    	return block;
    }

    // (84:37) 
    function create_if_block_5(ctx) {
    	let shoppingbag;
    	let current;
    	shoppingbag = new ShoppingBag({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(shoppingbag.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shoppingbag, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shoppingbag.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shoppingbag.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shoppingbag, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(84:37) ",
    		ctx
    	});

    	return block;
    }

    // (82:32) 
    function create_if_block_4(ctx) {
    	let search;
    	let current;
    	search = new Search({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(search.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(search, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(search, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(82:32) ",
    		ctx
    	});

    	return block;
    }

    // (80:38) 
    function create_if_block_3(ctx) {
    	let notification;
    	let current;
    	notification = new Notification({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(notification.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notification, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notification, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(80:38) ",
    		ctx
    	});

    	return block;
    }

    // (78:30) 
    function create_if_block_2(ctx) {
    	let menu;
    	let current;
    	menu = new Menu({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(78:30) ",
    		ctx
    	});

    	return block;
    }

    // (76:37) 
    function create_if_block_1(ctx) {
    	let imagesearch;
    	let current;
    	imagesearch = new ImageSearch({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(imagesearch.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imagesearch, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagesearch.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagesearch.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imagesearch, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(76:37) ",
    		ctx
    	});

    	return block;
    }

    // (74:4) {#if icon === 'close'}
    function create_if_block(ctx) {
    	let close;
    	let current;
    	close = new Close({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(close.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(close, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(close.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(close.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(close, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(74:4) {#if icon === 'close'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div2;
    	let div0;
    	let div0_class_value;
    	let t;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let div2_class_value;
    	let div2_style_value;
    	let current;
    	let mounted;
    	let dispose;

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7,
    		create_if_block_8,
    		create_if_block_9
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*icon*/ ctx[4] === "close") return 0;
    		if (/*icon*/ ctx[4] === "imageSearch") return 1;
    		if (/*icon*/ ctx[4] === "menu") return 2;
    		if (/*icon*/ ctx[4] === "notification") return 3;
    		if (/*icon*/ ctx[4] === "search") return 4;
    		if (/*icon*/ ctx[4] === "shoppingBag") return 5;
    		if (/*icon*/ ctx[4] === "arrow") return 6;
    		if (/*icon*/ ctx[4] === "toggleArrow") return 7;
    		if (/*icon*/ ctx[4] === "user") return 8;
    		if (/*icon*/ ctx[4] === "wishList") return 9;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(`background-color background-color--${/*background*/ ctx[7]}`) + " svelte-17m2rzz"));
    			add_location(div0, file$a, 71, 2, 2076);
    			attr_dev(div1, "class", "icon svelte-17m2rzz");
    			add_location(div1, file$a, 72, 2, 2146);
    			attr_dev(div2, "ref", /*ref*/ ctx[0]);

    			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(`container ${/*small*/ ctx[2]
			? "container--small"
			: /*xsmall*/ ctx[3] ? "container--xsmall" : null} ${!/*hover*/ ctx[5] && "container--no-hover"}`) + " svelte-17m2rzz"));

    			attr_dev(div2, "style", div2_style_value = `cursor: ${/*cursor*/ ctx[1]}; ${/*style*/ ctx[6]}`);
    			add_location(div2, file$a, 65, 0, 1867);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t);
    			append_dev(div2, div1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(div2, "click", /*click_handler_1*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*background*/ 128 && div0_class_value !== (div0_class_value = "" + (null_to_empty(`background-color background-color--${/*background*/ ctx[7]}`) + " svelte-17m2rzz"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if (!current || dirty & /*ref*/ 1) {
    				attr_dev(div2, "ref", /*ref*/ ctx[0]);
    			}

    			if (!current || dirty & /*small, xsmall, hover*/ 44 && div2_class_value !== (div2_class_value = "" + (null_to_empty(`container ${/*small*/ ctx[2]
			? "container--small"
			: /*xsmall*/ ctx[3] ? "container--xsmall" : null} ${!/*hover*/ ctx[5] && "container--no-hover"}`) + " svelte-17m2rzz"))) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (!current || dirty & /*cursor, style*/ 66 && div2_style_value !== (div2_style_value = `cursor: ${/*cursor*/ ctx[1]}; ${/*style*/ ctx[6]}`)) {
    				attr_dev(div2, "style", div2_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	let { ref = undefined } = $$props;
    	let { cursor = "pointer" } = $$props;
    	let { small = false } = $$props;
    	let { xsmall = false } = $$props;
    	let { icon } = $$props;
    	let { hover = true } = $$props;
    	let { style = "" } = $$props;
    	let { background = "gray-100" } = $$props;
    	const writable_props = ["ref", "cursor", "small", "xsmall", "icon", "hover", "style", "background"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("cursor" in $$props) $$invalidate(1, cursor = $$props.cursor);
    		if ("small" in $$props) $$invalidate(2, small = $$props.small);
    		if ("xsmall" in $$props) $$invalidate(3, xsmall = $$props.xsmall);
    		if ("icon" in $$props) $$invalidate(4, icon = $$props.icon);
    		if ("hover" in $$props) $$invalidate(5, hover = $$props.hover);
    		if ("style" in $$props) $$invalidate(6, style = $$props.style);
    		if ("background" in $$props) $$invalidate(7, background = $$props.background);
    	};

    	$$self.$capture_state = () => ({
    		Close,
    		ImageSearch,
    		Menu,
    		Notification,
    		Search,
    		ShoppingBag,
    		StadardArrow,
    		ToggleArrow,
    		User,
    		WishList,
    		ref,
    		cursor,
    		small,
    		xsmall,
    		icon,
    		hover,
    		style,
    		background
    	});

    	$$self.$inject_state = $$props => {
    		if ("ref" in $$props) $$invalidate(0, ref = $$props.ref);
    		if ("cursor" in $$props) $$invalidate(1, cursor = $$props.cursor);
    		if ("small" in $$props) $$invalidate(2, small = $$props.small);
    		if ("xsmall" in $$props) $$invalidate(3, xsmall = $$props.xsmall);
    		if ("icon" in $$props) $$invalidate(4, icon = $$props.icon);
    		if ("hover" in $$props) $$invalidate(5, hover = $$props.hover);
    		if ("style" in $$props) $$invalidate(6, style = $$props.style);
    		if ("background" in $$props) $$invalidate(7, background = $$props.background);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ref,
    		cursor,
    		small,
    		xsmall,
    		icon,
    		hover,
    		style,
    		background,
    		click_handler,
    		click_handler_1
    	];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			ref: 0,
    			cursor: 1,
    			small: 2,
    			xsmall: 3,
    			icon: 4,
    			hover: 5,
    			style: 6,
    			background: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[4] === undefined && !("icon" in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get ref() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cursor() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cursor(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get xsmall() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set xsmall(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hover() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hover(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\molecules\HeadNotification.svelte generated by Svelte v3.29.0 */

    const { console: console_1 } = globals;
    const file$b = "src\\components\\molecules\\HeadNotification.svelte";

    // (81:4) {:else}
    function create_else_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(p, "class", "svelte-1ds6mvc");
    			add_location(p, file$b, 81, 6, 2219);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 4) set_data_dev(t, /*text*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(81:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (76:4) {#if action === 'link'}
    function create_if_block$1(ctx) {
    	let a;
    	let icon;
    	let t0;
    	let span;
    	let t1;
    	let current;

    	icon = new Icon({
    			props: {
    				icon: "notification",
    				hover: false,
    				xsmall: true
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			a = element("a");
    			create_component(icon.$$.fragment);
    			t0 = space();
    			span = element("span");
    			t1 = text(/*text*/ ctx[2]);
    			attr_dev(span, "class", "svelte-1ds6mvc");
    			add_location(span, file$b, 78, 8, 2167);
    			attr_dev(a, "href", /*href*/ ctx[4]);
    			attr_dev(a, "class", "svelte-1ds6mvc");
    			add_location(a, file$b, 76, 6, 2088);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			mount_component(icon, a, null);
    			append_dev(a, t0);
    			append_dev(a, span);
    			append_dev(span, t1);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*text*/ 4) set_data_dev(t1, /*text*/ ctx[2]);

    			if (!current || dirty & /*href*/ 16) {
    				attr_dev(a, "href", /*href*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(76:4) {#if action === 'link'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div3;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let t0;
    	let div0;
    	let icon;
    	let div0_class_value;
    	let t1;
    	let div2;
    	let p;
    	let div2_class_value;
    	let div3_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*action*/ ctx[3] === "link") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	icon = new Icon({
    			props: {
    				icon: "toggleArrow",
    				small: true,
    				background: "gray-800"
    			},
    			$$inline: true
    		});

    	icon.$on("click", /*toggleexpand*/ ctx[5]);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			if_block.c();
    			t0 = space();
    			div0 = element("div");
    			create_component(icon.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			p = element("p");
    			p.textContent = "Dismiss message";
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(`icon ${/*expand*/ ctx[1] && "icon--active"}`) + " svelte-1ds6mvc"));
    			add_location(div0, file$b, 83, 4, 2249);
    			attr_dev(div1, "class", "message-section svelte-1ds6mvc");
    			add_location(div1, file$b, 74, 2, 2022);
    			attr_dev(p, "class", "svelte-1ds6mvc");
    			add_location(p, file$b, 92, 4, 2506);
    			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(`dismiss ${/*expand*/ ctx[1] && "dismiss--expand"}`) + " svelte-1ds6mvc"));
    			add_location(div2, file$b, 91, 2, 2446);
    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty(`notification ${/*show*/ ctx[0] && "notification--active"}`) + " svelte-1ds6mvc"));
    			add_location(div3, file$b, 73, 0, 1956);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			mount_component(icon, div0, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, p);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(p, "click", /*click_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div1, t0);
    			}

    			if (!current || dirty & /*expand*/ 2 && div0_class_value !== (div0_class_value = "" + (null_to_empty(`icon ${/*expand*/ ctx[1] && "icon--active"}`) + " svelte-1ds6mvc"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty & /*expand*/ 2 && div2_class_value !== (div2_class_value = "" + (null_to_empty(`dismiss ${/*expand*/ ctx[1] && "dismiss--expand"}`) + " svelte-1ds6mvc"))) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (!current || dirty & /*show*/ 1 && div3_class_value !== (div3_class_value = "" + (null_to_empty(`notification ${/*show*/ ctx[0] && "notification--active"}`) + " svelte-1ds6mvc"))) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_blocks[current_block_type_index].d();
    			destroy_component(icon);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HeadNotification", slots, []);
    	let { text = "Notification" } = $$props;
    	let { action = "link" } = $$props;
    	let { href = "Homepage" } = $$props;
    	let { show = false } = $$props;
    	let { expand = false } = $$props;

    	const toggleexpand = () => {
    		$$invalidate(1, expand = !expand);
    		console.log(expand);
    	};

    	setTimeout(
    		() => {
    			$$invalidate(0, show = true);
    		},
    		3000
    	);

    	const writable_props = ["text", "action", "href", "show", "expand"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<HeadNotification> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, show = false);

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("action" in $$props) $$invalidate(3, action = $$props.action);
    		if ("href" in $$props) $$invalidate(4, href = $$props.href);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("expand" in $$props) $$invalidate(1, expand = $$props.expand);
    	};

    	$$self.$capture_state = () => ({
    		Icon,
    		text,
    		action,
    		href,
    		show,
    		expand,
    		toggleexpand
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    		if ("action" in $$props) $$invalidate(3, action = $$props.action);
    		if ("href" in $$props) $$invalidate(4, href = $$props.href);
    		if ("show" in $$props) $$invalidate(0, show = $$props.show);
    		if ("expand" in $$props) $$invalidate(1, expand = $$props.expand);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [show, expand, text, action, href, toggleexpand, click_handler];
    }

    class HeadNotification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			text: 2,
    			action: 3,
    			href: 4,
    			show: 0,
    			expand: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HeadNotification",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get text() {
    		throw new Error("<HeadNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<HeadNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get action() {
    		throw new Error("<HeadNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set action(value) {
    		throw new Error("<HeadNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<HeadNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<HeadNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<HeadNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<HeadNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expand() {
    		throw new Error("<HeadNotification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expand(value) {
    		throw new Error("<HeadNotification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\organisms\Header.svelte generated by Svelte v3.29.0 */
    const file$c = "src\\components\\organisms\\Header.svelte";

    function create_fragment$c(ctx) {
    	let header;
    	let img;
    	let img_src_value;
    	let t0;
    	let icon0;
    	let t1;
    	let icon1;
    	let t2;
    	let icon2;
    	let t3;
    	let icon3;
    	let current;

    	icon0 = new Icon({
    			props: { icon: "user", ref: "header-icon" },
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: { icon: "wishList", ref: "header-icon" },
    			$$inline: true
    		});

    	icon2 = new Icon({
    			props: { icon: "shoppingBag", ref: "header-icon" },
    			$$inline: true
    		});

    	icon3 = new Icon({
    			props: { icon: "menu", ref: "header-icon" },
    			$$inline: true
    		});

    	icon3.$on("click", /*toggleNav*/ ctx[1]);

    	const block = {
    		c: function create() {
    			header = element("header");
    			img = element("img");
    			t0 = space();
    			create_component(icon0.$$.fragment);
    			t1 = space();
    			create_component(icon1.$$.fragment);
    			t2 = space();
    			create_component(icon2.$$.fragment);
    			t3 = space();
    			create_component(icon3.$$.fragment);
    			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "ikea logo");
    			attr_dev(img, "class", "svelte-qt98mw");
    			add_location(img, file$c, 23, 2, 589);
    			attr_dev(header, "class", "svelte-qt98mw");
    			add_location(header, file$c, 22, 0, 577);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, img);
    			append_dev(header, t0);
    			mount_component(icon0, header, null);
    			append_dev(header, t1);
    			mount_component(icon1, header, null);
    			append_dev(header, t2);
    			mount_component(icon2, header, null);
    			append_dev(header, t3);
    			mount_component(icon3, header, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			transition_in(icon3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			transition_out(icon3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			destroy_component(icon2);
    			destroy_component(icon3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let src = "images/logo/ikea-logo-small.svg";
    	const dispatch = createEventDispatcher();
    	const toggleNav = () => dispatch("toggle", { show: true });
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Icon,
    		src,
    		createEventDispatcher,
    		dispatch,
    		toggleNav
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, toggleNav];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\components\molecules\SearchBar.svelte generated by Svelte v3.29.0 */
    const file$d = "src\\components\\molecules\\SearchBar.svelte";

    // (52:2) {#if !noIcon}
    function create_if_block$2(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				icon: "imageSearch",
    				small: true,
    				background: "light-gray"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(52:2) {#if !noIcon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let form;
    	let icon;
    	let t0;
    	let input;
    	let t1;
    	let div_class_value;
    	let current;

    	icon = new Icon({
    			props: {
    				icon: "search",
    				cursor: "text",
    				hover: false
    			},
    			$$inline: true
    		});

    	let if_block = !/*noIcon*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			form = element("form");
    			create_component(icon.$$.fragment);
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			attr_dev(input, "class", "svelte-1kgr1f8");
    			add_location(input, file$d, 49, 4, 1293);
    			attr_dev(form, "class", "svelte-1kgr1f8");
    			add_location(form, file$d, 47, 2, 1225);

    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(`search-bar ${/*hover*/ ctx[1]
			? "search-bar__secondary"
			: "search-bar__primary"}`) + " svelte-1kgr1f8"));

    			attr_dev(div, "style", /*style*/ ctx[3]);
    			add_location(div, file$d, 44, 0, 1122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, form);
    			mount_component(icon, form, null);
    			append_dev(form, t0);
    			append_dev(form, input);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*placeholder*/ 1) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			}

    			if (!/*noIcon*/ ctx[2]) {
    				if (if_block) {
    					if (dirty & /*noIcon*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*hover*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(`search-bar ${/*hover*/ ctx[1]
			? "search-bar__secondary"
			: "search-bar__primary"}`) + " svelte-1kgr1f8"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*style*/ 8) {
    				attr_dev(div, "style", /*style*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SearchBar", slots, []);
    	let { placeholder = "Search" } = $$props;
    	let { hover = false } = $$props;
    	let { noIcon = false } = $$props;
    	let { style } = $$props;
    	const writable_props = ["placeholder", "hover", "noIcon", "style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("hover" in $$props) $$invalidate(1, hover = $$props.hover);
    		if ("noIcon" in $$props) $$invalidate(2, noIcon = $$props.noIcon);
    		if ("style" in $$props) $$invalidate(3, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ Icon, placeholder, hover, noIcon, style });

    	$$self.$inject_state = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("hover" in $$props) $$invalidate(1, hover = $$props.hover);
    		if ("noIcon" in $$props) $$invalidate(2, noIcon = $$props.noIcon);
    		if ("style" in $$props) $$invalidate(3, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [placeholder, hover, noIcon, style];
    }

    class SearchBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			placeholder: 0,
    			hover: 1,
    			noIcon: 2,
    			style: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[3] === undefined && !("style" in props)) {
    			console.warn("<SearchBar> was created without expected prop 'style'");
    		}
    	}

    	get placeholder() {
    		throw new Error("<SearchBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<SearchBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hover() {
    		throw new Error("<SearchBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hover(value) {
    		throw new Error("<SearchBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noIcon() {
    		throw new Error("<SearchBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noIcon(value) {
    		throw new Error("<SearchBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<SearchBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<SearchBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\Title.svelte generated by Svelte v3.29.0 */

    const file$e = "src\\components\\atoms\\Title.svelte";

    // (47:24) 
    function create_if_block_5$1(ctx) {
    	let h6;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			h6 = element("h6");
    			if (default_slot) default_slot.c();
    			attr_dev(h6, "style", /*style*/ ctx[1]);
    			add_location(h6, file$e, 47, 2, 768);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h6, anchor);

    			if (default_slot) {
    				default_slot.m(h6, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(h6, "style", /*style*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h6);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(47:24) ",
    		ctx
    	});

    	return block;
    }

    // (43:24) 
    function create_if_block_4$1(ctx) {
    	let h5;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			if (default_slot) default_slot.c();
    			attr_dev(h5, "style", /*style*/ ctx[1]);
    			add_location(h5, file$e, 43, 2, 703);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);

    			if (default_slot) {
    				default_slot.m(h5, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(h5, "style", /*style*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(43:24) ",
    		ctx
    	});

    	return block;
    }

    // (39:24) 
    function create_if_block_3$1(ctx) {
    	let h4;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			if (default_slot) default_slot.c();
    			attr_dev(h4, "style", /*style*/ ctx[1]);
    			attr_dev(h4, "class", "svelte-tl6uja");
    			add_location(h4, file$e, 39, 2, 638);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);

    			if (default_slot) {
    				default_slot.m(h4, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(h4, "style", /*style*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(39:24) ",
    		ctx
    	});

    	return block;
    }

    // (35:24) 
    function create_if_block_2$1(ctx) {
    	let h3;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			if (default_slot) default_slot.c();
    			attr_dev(h3, "style", /*style*/ ctx[1]);
    			add_location(h3, file$e, 35, 2, 573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);

    			if (default_slot) {
    				default_slot.m(h3, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(h3, "style", /*style*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(35:24) ",
    		ctx
    	});

    	return block;
    }

    // (31:24) 
    function create_if_block_1$1(ctx) {
    	let h2;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			if (default_slot) default_slot.c();
    			attr_dev(h2, "style", /*style*/ ctx[1]);
    			attr_dev(h2, "class", "svelte-tl6uja");
    			add_location(h2, file$e, 31, 2, 508);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);

    			if (default_slot) {
    				default_slot.m(h2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(h2, "style", /*style*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(31:24) ",
    		ctx
    	});

    	return block;
    }

    // (27:0) {#if type === 'h1'}
    function create_if_block$3(ctx) {
    	let h1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "style", /*style*/ ctx[1]);
    			attr_dev(h1, "class", "svelte-tl6uja");
    			add_location(h1, file$e, 27, 2, 443);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);

    			if (default_slot) {
    				default_slot.m(h1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 2) {
    				attr_dev(h1, "style", /*style*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(27:0) {#if type === 'h1'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block$3,
    		create_if_block_1$1,
    		create_if_block_2$1,
    		create_if_block_3$1,
    		create_if_block_4$1,
    		create_if_block_5$1
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[0] === "h1") return 0;
    		if (/*type*/ ctx[0] === "h2") return 1;
    		if (/*type*/ ctx[0] === "h3") return 2;
    		if (/*type*/ ctx[0] === "h4") return 3;
    		if (/*type*/ ctx[0] === "h5") return 4;
    		if (/*type*/ ctx[0] === "h6") return 5;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title", slots, ['default']);
    	let { type = "h1" } = $$props;
    	let { style } = $$props;
    	const writable_props = ["type", "style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ type, style });

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("style" in $$props) $$invalidate(1, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, style, $$scope, slots];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { type: 0, style: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[1] === undefined && !("style" in props)) {
    			console.warn("<Title> was created without expected prop 'style'");
    		}
    	}

    	get type() {
    		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\Section.svelte generated by Svelte v3.29.0 */

    const file$f = "src\\components\\atoms\\Section.svelte";

    function create_fragment$f(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "section svelte-1vk1jem");
    			add_location(div, file$f, 9, 0, 130);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Section", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Section> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\components\atoms\Rule.svelte generated by Svelte v3.29.0 */

    const file$g = "src\\components\\atoms\\Rule.svelte";

    function create_fragment$g(ctx) {
    	let hr;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			attr_dev(hr, "class", "svelte-per6ep");
    			add_location(hr, file$g, 12, 0, 197);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Rule", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Rule> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Rule extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rule",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\components\atoms\Card.svelte generated by Svelte v3.29.0 */

    const file$h = "src\\components\\atoms\\Card.svelte";

    function create_fragment$h(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "ref", /*ref*/ ctx[1]);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(`card ${/*shadow*/ ctx[2] && "card--shadow"}`) + " svelte-1q3uzh5"));
    			attr_dev(div, "style", /*style*/ ctx[0]);
    			add_location(div, file$h, 14, 0, 278);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*ref*/ 2) {
    				attr_dev(div, "ref", /*ref*/ ctx[1]);
    			}

    			if (!current || dirty & /*shadow*/ 4 && div_class_value !== (div_class_value = "" + (null_to_empty(`card ${/*shadow*/ ctx[2] && "card--shadow"}`) + " svelte-1q3uzh5"))) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*style*/ 1) {
    				attr_dev(div, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['default']);
    	let { style = "" } = $$props;
    	let { ref = "" } = $$props;
    	let { shadow = false } = $$props;
    	const writable_props = ["style", "ref", "shadow"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    		if ("ref" in $$props) $$invalidate(1, ref = $$props.ref);
    		if ("shadow" in $$props) $$invalidate(2, shadow = $$props.shadow);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ style, ref, shadow });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    		if ("ref" in $$props) $$invalidate(1, ref = $$props.ref);
    		if ("shadow" in $$props) $$invalidate(2, shadow = $$props.shadow);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style, ref, shadow, $$scope, slots];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, { style: 0, ref: 1, shadow: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$h.name
    		});
    	}

    	get style() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shadow() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shadow(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\molecules\ImageCard.svelte generated by Svelte v3.29.0 */
    const file$i = "src\\components\\molecules\\ImageCard.svelte";

    // (38:0) <Card ref="image-card" style={` ${style}`}>
    function create_default_slot(ctx) {
    	let img;
    	let img_src_value;
    	let img_style_value;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			img = element("img");
    			t = space();
    			if (default_slot) default_slot.c();
    			attr_dev(img, "class", "image svelte-14ty758");
    			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "style", img_style_value = `top: ${/*top*/ ctx[1]}%; left: ${/*left*/ ctx[2]}%;`);
    			add_location(img, file$i, 38, 2, 977);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*top, left*/ 6 && img_style_value !== (img_style_value = `top: ${/*top*/ ctx[1]}%; left: ${/*left*/ ctx[2]}%;`)) {
    				attr_dev(img, "style", img_style_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(38:0) <Card ref=\\\"image-card\\\" style={` ${style}`}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				ref: "image-card",
    				style: ` ${/*style*/ ctx[3]}`,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};
    			if (dirty & /*style*/ 8) card_changes.style = ` ${/*style*/ ctx[3]}`;

    			if (dirty & /*$$scope, src, top, left*/ 135) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageCard", slots, ['default']);
    	let { src = "" } = $$props;
    	let { top = 50 } = $$props;
    	let { left = 50 } = $$props;
    	let { orientation = "portrait" } = $$props;
    	let { aspectRatio = "4:3" } = $$props;
    	let style;

    	if (aspectRatio === "16:9") {
    		orientation === "portrait"
    		? style = "padding-bottom: 177.78%;"
    		: style = "padding-bottom: 56.25%;";
    	} else if (aspectRatio === "4:3") {
    		orientation === "portrait"
    		? style = "padding-bottom: 133%;"
    		: style = "padding-bottom: 75%;";
    	} else if (aspectRatio === "1:1") {
    		style = "padding-bottom: 100%;";
    	}

    	const writable_props = ["src", "top", "left", "orientation", "aspectRatio"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    		if ("left" in $$props) $$invalidate(2, left = $$props.left);
    		if ("orientation" in $$props) $$invalidate(4, orientation = $$props.orientation);
    		if ("aspectRatio" in $$props) $$invalidate(5, aspectRatio = $$props.aspectRatio);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Card,
    		src,
    		top,
    		left,
    		orientation,
    		aspectRatio,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("top" in $$props) $$invalidate(1, top = $$props.top);
    		if ("left" in $$props) $$invalidate(2, left = $$props.left);
    		if ("orientation" in $$props) $$invalidate(4, orientation = $$props.orientation);
    		if ("aspectRatio" in $$props) $$invalidate(5, aspectRatio = $$props.aspectRatio);
    		if ("style" in $$props) $$invalidate(3, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, top, left, style, orientation, aspectRatio, slots, $$scope];
    }

    class ImageCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {
    			src: 0,
    			top: 1,
    			left: 2,
    			orientation: 4,
    			aspectRatio: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageCard",
    			options,
    			id: create_fragment$i.name
    		});
    	}

    	get src() {
    		throw new Error("<ImageCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<ImageCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<ImageCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<ImageCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<ImageCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<ImageCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get orientation() {
    		throw new Error("<ImageCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set orientation(value) {
    		throw new Error("<ImageCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get aspectRatio() {
    		throw new Error("<ImageCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set aspectRatio(value) {
    		throw new Error("<ImageCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\Button.svelte generated by Svelte v3.29.0 */

    const file$j = "src\\components\\atoms\\Button.svelte";

    // (57:0) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "button svelte-v18gjg");
    			attr_dev(button, "style", /*style*/ ctx[4]);
    			toggle_class(button, "button--secondary", /*secondary*/ ctx[0]);
    			toggle_class(button, "button--tertiary", /*tertiary*/ ctx[1]);
    			toggle_class(button, "button--small", /*small*/ ctx[2]);
    			add_location(button, file$j, 57, 2, 1361);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 16) {
    				attr_dev(button, "style", /*style*/ ctx[4]);
    			}

    			if (dirty & /*secondary*/ 1) {
    				toggle_class(button, "button--secondary", /*secondary*/ ctx[0]);
    			}

    			if (dirty & /*tertiary*/ 2) {
    				toggle_class(button, "button--tertiary", /*tertiary*/ ctx[1]);
    			}

    			if (dirty & /*small*/ 4) {
    				toggle_class(button, "button--small", /*small*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(57:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (49:0) {#if href.length}
    function create_if_block$4(ctx) {
    	let a;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "class", "button svelte-v18gjg");
    			attr_dev(a, "href", /*href*/ ctx[3]);
    			attr_dev(a, "style", /*style*/ ctx[4]);
    			toggle_class(a, "button--secondary", /*secondary*/ ctx[0]);
    			toggle_class(a, "button--tertiary", /*tertiary*/ ctx[1]);
    			toggle_class(a, "button--small", /*small*/ ctx[2]);
    			add_location(a, file$j, 49, 2, 1175);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[5], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*href*/ 8) {
    				attr_dev(a, "href", /*href*/ ctx[3]);
    			}

    			if (!current || dirty & /*style*/ 16) {
    				attr_dev(a, "style", /*style*/ ctx[4]);
    			}

    			if (dirty & /*secondary*/ 1) {
    				toggle_class(a, "button--secondary", /*secondary*/ ctx[0]);
    			}

    			if (dirty & /*tertiary*/ 2) {
    				toggle_class(a, "button--tertiary", /*tertiary*/ ctx[1]);
    			}

    			if (dirty & /*small*/ 4) {
    				toggle_class(a, "button--small", /*small*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(49:0) {#if href.length}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[3].length) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { secondary = false } = $$props;
    	let { tertiary = false } = $$props;
    	let { small = false } = $$props;
    	let { href = "" } = $$props;
    	let { style = "" } = $$props;
    	const writable_props = ["secondary", "tertiary", "small", "href", "style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("secondary" in $$props) $$invalidate(0, secondary = $$props.secondary);
    		if ("tertiary" in $$props) $$invalidate(1, tertiary = $$props.tertiary);
    		if ("small" in $$props) $$invalidate(2, small = $$props.small);
    		if ("href" in $$props) $$invalidate(3, href = $$props.href);
    		if ("style" in $$props) $$invalidate(4, style = $$props.style);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ secondary, tertiary, small, href, style });

    	$$self.$inject_state = $$props => {
    		if ("secondary" in $$props) $$invalidate(0, secondary = $$props.secondary);
    		if ("tertiary" in $$props) $$invalidate(1, tertiary = $$props.tertiary);
    		if ("small" in $$props) $$invalidate(2, small = $$props.small);
    		if ("href" in $$props) $$invalidate(3, href = $$props.href);
    		if ("style" in $$props) $$invalidate(4, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [secondary, tertiary, small, href, style, $$scope, slots, click_handler];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {
    			secondary: 0,
    			tertiary: 1,
    			small: 2,
    			href: 3,
    			style: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get secondary() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondary(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tertiary() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tertiary(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\SectionText.svelte generated by Svelte v3.29.0 */

    const file$k = "src\\components\\atoms\\SectionText.svelte";

    function create_fragment$k(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "container svelte-kvawct");
    			add_location(p, file$k, 10, 0, 160);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SectionText", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SectionText> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class SectionText extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SectionText",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\components\molecules\LargeProductCard.svelte generated by Svelte v3.29.0 */
    const file$l = "src\\components\\molecules\\LargeProductCard.svelte";

    // (26:4) <Title type="h2">
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*title*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(26:4) <Title type=\\\"h2\\\">",
    		ctx
    	});

    	return block;
    }

    // (27:10)         
    function fallback_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*price*/ ctx[2]);
    			attr_dev(p, "class", "svelte-n5mqsk");
    			add_location(p, file$l, 27, 6, 691);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*price*/ 4) set_data_dev(t, /*price*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(27:10)         ",
    		ctx
    	});

    	return block;
    }

    // (30:4) <Button style="margin-top: 1.5rem;" secondary>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*buttonText*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*buttonText*/ 2) set_data_dev(t, /*buttonText*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(30:4) <Button style=\\\"margin-top: 1.5rem;\\\" secondary>",
    		ctx
    	});

    	return block;
    }

    // (24:0) <Card style="width: 100%; margin-top: -.5rem; background: #f5f5f5;">
    function create_default_slot$1(ctx) {
    	let div;
    	let title_1;
    	let t0;
    	let t1;
    	let button;
    	let current;

    	title_1 = new Title({
    			props: {
    				type: "h2",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	const default_slot_or_fallback = default_slot || fallback_block(ctx);

    	button = new Button({
    			props: {
    				style: "margin-top: 1.5rem;",
    				secondary: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(title_1.$$.fragment);
    			t0 = space();
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t1 = space();
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "container svelte-n5mqsk");
    			add_location(div, file$l, 24, 2, 610);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(title_1, div, null);
    			append_dev(div, t0);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div, null);
    			}

    			append_dev(div, t1);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_1_changes = {};

    			if (dirty & /*$$scope, title*/ 17) {
    				title_1_changes.$$scope = { dirty, ctx };
    			}

    			title_1.$set(title_1_changes);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty & /*price*/ 4) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			const button_changes = {};

    			if (dirty & /*$$scope, buttonText*/ 18) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title_1.$$.fragment, local);
    			transition_in(default_slot_or_fallback, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title_1.$$.fragment, local);
    			transition_out(default_slot_or_fallback, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(title_1);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(24:0) <Card style=\\\"width: 100%; margin-top: -.5rem; background: #f5f5f5;\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				style: "width: 100%; margin-top: -.5rem; background: #f5f5f5;",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};

    			if (dirty & /*$$scope, buttonText, price, title*/ 23) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LargeProductCard", slots, ['default']);
    	let { title = "" } = $$props;
    	let { buttonText = "" } = $$props;
    	let { price = null } = $$props;
    	const writable_props = ["title", "buttonText", "price"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LargeProductCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("buttonText" in $$props) $$invalidate(1, buttonText = $$props.buttonText);
    		if ("price" in $$props) $$invalidate(2, price = $$props.price);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		Card,
    		Title,
    		title,
    		buttonText,
    		price
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("buttonText" in $$props) $$invalidate(1, buttonText = $$props.buttonText);
    		if ("price" in $$props) $$invalidate(2, price = $$props.price);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, buttonText, price, slots, $$scope];
    }

    class LargeProductCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { title: 0, buttonText: 1, price: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LargeProductCard",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get title() {
    		throw new Error("<LargeProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<LargeProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get buttonText() {
    		throw new Error("<LargeProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set buttonText(value) {
    		throw new Error("<LargeProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price() {
    		throw new Error("<LargeProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<LargeProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\Link.svelte generated by Svelte v3.29.0 */
    const file$m = "src\\components\\atoms\\Link.svelte";

    // (32:2) {#if icon}
    function create_if_block$5(ctx) {
    	let div;
    	let togglearrow;
    	let current;
    	togglearrow = new ToggleArrow({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(togglearrow.$$.fragment);
    			attr_dev(div, "class", "link__icon svelte-r69kg7");
    			add_location(div, file$m, 32, 4, 693);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(togglearrow, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(togglearrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(togglearrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(togglearrow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(32:2) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let a;
    	let div;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let if_block = /*icon*/ ctx[1] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "link__text svelte-r69kg7");
    			add_location(div, file$m, 28, 2, 625);
    			attr_dev(a, "href", /*href*/ ctx[0]);
    			attr_dev(a, "class", "link svelte-r69kg7");
    			attr_dev(a, "style", /*style*/ ctx[2]);
    			add_location(a, file$m, 27, 0, 590);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, div);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(a, t);
    			if (if_block) if_block.m(a, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (/*icon*/ ctx[1]) {
    				if (if_block) {
    					if (dirty & /*icon*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(a, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*href*/ 1) {
    				attr_dev(a, "href", /*href*/ ctx[0]);
    			}

    			if (!current || dirty & /*style*/ 4) {
    				attr_dev(a, "style", /*style*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Link", slots, ['default']);
    	let { href = "/" } = $$props;
    	let { icon = false } = $$props;
    	let { style = "" } = $$props;
    	const writable_props = ["href", "icon", "style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ ToggleArrow, href, icon, style });

    	$$self.$inject_state = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [href, icon, style, $$scope, slots];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { href: 0, icon: 1, style: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get href() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\molecules\SeeMoreCard.svelte generated by Svelte v3.29.0 */
    const file$n = "src\\components\\molecules\\SeeMoreCard.svelte";

    // (18:2) <Link {href}>
    function create_default_slot_1$1(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let standardarrow;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	standardarrow = new StadardArrow({ $$inline: true });

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			div1 = element("div");
    			create_component(standardarrow.$$.fragment);
    			attr_dev(div0, "class", "text svelte-r7t734");
    			add_location(div0, file$n, 18, 4, 360);
    			attr_dev(div1, "class", "icon svelte-r7t734");
    			add_location(div1, file$n, 21, 4, 412);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(standardarrow, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(standardarrow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(standardarrow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_component(standardarrow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(18:2) <Link {href}>",
    		ctx
    	});

    	return block;
    }

    // (17:0) <Card {style}>
    function create_default_slot$2(ctx) {
    	let link;
    	let current;

    	link = new Link({
    			props: {
    				href: /*href*/ ctx[1],
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(link.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(link, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*href*/ 2) link_changes.href = /*href*/ ctx[1];

    			if (dirty & /*$$scope*/ 8) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(link, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(17:0) <Card {style}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				style: /*style*/ ctx[0],
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};
    			if (dirty & /*style*/ 1) card_changes.style = /*style*/ ctx[0];

    			if (dirty & /*$$scope, href*/ 10) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SeeMoreCard", slots, ['default']);
    	let { style } = $$props;
    	let { href = "/" } = $$props;
    	const writable_props = ["style", "href"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SeeMoreCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Card, StandardArrow: StadardArrow, Link, style, href });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style, href, slots, $$scope];
    }

    class SeeMoreCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { style: 0, href: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SeeMoreCard",
    			options,
    			id: create_fragment$n.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<SeeMoreCard> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<SeeMoreCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<SeeMoreCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<SeeMoreCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<SeeMoreCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\ImagePointer.svelte generated by Svelte v3.29.0 */

    const file$o = "src\\components\\atoms\\ImagePointer.svelte";

    function create_fragment$o(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pointer svelte-565o8f");
    			add_location(div, file$o, 31, 0, 740);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImagePointer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImagePointer> was created with unknown prop '${key}'`);
    	});

    	function mouseenter_handler(event) {
    		bubble($$self, event);
    	}

    	return [mouseenter_handler];
    }

    class ImagePointer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImagePointer",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\components\atoms\Family.svelte generated by Svelte v3.29.0 */

    const file$p = "src\\components\\atoms\\Family.svelte";

    function create_fragment$p(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "IKEA Family price";
    			attr_dev(p, "class", "svelte-z0yx9f");
    			add_location(p, file$p, 11, 0, 173);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Family", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Family> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Family extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Family",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\components\atoms\News.svelte generated by Svelte v3.29.0 */

    const file$q = "src\\components\\atoms\\News.svelte";

    function create_fragment$q(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "New";
    			attr_dev(p, "class", "svelte-mbbwx4");
    			add_location(p, file$q, 11, 0, 173);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("News", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<News> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class News extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "News",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src\components\molecules\ProductCard.svelte generated by Svelte v3.29.0 */
    const file$r = "src\\components\\molecules\\ProductCard.svelte";

    // (62:6) {#if news}
    function create_if_block_3$2(ctx) {
    	let news_1;
    	let current;
    	news_1 = new News({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(news_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(news_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(news_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(news_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(news_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(62:6) {#if news}",
    		ctx
    	});

    	return block;
    }

    // (65:6) {#if family}
    function create_if_block_2$2(ctx) {
    	let family_1;
    	let current;
    	family_1 = new Family({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(family_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(family_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(family_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(family_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(family_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(65:6) {#if family}",
    		ctx
    	});

    	return block;
    }

    // (72:34) <Title type="h4">
    function create_default_slot_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*title*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 8) set_data_dev(t, /*title*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(72:34) <Title type=\\\"h4\\\">",
    		ctx
    	});

    	return block;
    }

    // (74:4) {#if regularPrice}
    function create_if_block_1$2(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Regular price £");
    			t1 = text(/*regularPrice*/ ctx[5]);
    			attr_dev(p, "class", "info__reg-price svelte-192r169");
    			add_location(p, file$r, 74, 6, 1944);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*regularPrice*/ 32) set_data_dev(t1, /*regularPrice*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(74:4) {#if regularPrice}",
    		ctx
    	});

    	return block;
    }

    // (79:6) {#if pieces > 0}
    function create_if_block$6(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("/ ");
    			t1 = text(/*pieces*/ ctx[7]);
    			t2 = text(" pieces");
    			attr_dev(span, "class", "svelte-192r169");
    			add_location(span, file$r, 78, 22, 2114);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pieces*/ 128) set_data_dev(t1, /*pieces*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(79:6) {#if pieces > 0}",
    		ctx
    	});

    	return block;
    }

    // (59:0) <Card shadow {style}>
    function create_default_slot$3(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let div1;
    	let icon;
    	let t2;
    	let a;
    	let title_1;
    	let t3;
    	let p0;
    	let t4;
    	let t5;
    	let t6;
    	let p1;
    	let span;
    	let t8;
    	let t9;
    	let current;
    	let if_block0 = /*news*/ ctx[0] && create_if_block_3$2(ctx);
    	let if_block1 = /*family*/ ctx[1] && create_if_block_2$2(ctx);

    	icon = new Icon({
    			props: { icon: "toggleArrow", hover: false },
    			$$inline: true
    		});

    	title_1 = new Title({
    			props: {
    				type: "h4",
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block2 = /*regularPrice*/ ctx[5] && create_if_block_1$2(ctx);
    	let if_block3 = /*pieces*/ ctx[7] > 0 && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div1 = element("div");
    			create_component(icon.$$.fragment);
    			t2 = space();
    			a = element("a");
    			create_component(title_1.$$.fragment);
    			t3 = space();
    			p0 = element("p");
    			t4 = text(/*productType*/ ctx[4]);
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			p1 = element("p");
    			span = element("span");
    			span.textContent = "£";
    			t8 = text(/*price*/ ctx[6]);
    			t9 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div0, "class", "info__promotional svelte-192r169");
    			add_location(div0, file$r, 60, 4, 1555);
    			attr_dev(div1, "class", "info__icon svelte-192r169");
    			add_location(div1, file$r, 68, 4, 1706);
    			attr_dev(a, "href", /*href*/ ctx[2]);
    			attr_dev(a, "class", "info__title svelte-192r169");
    			add_location(a, file$r, 71, 4, 1797);
    			attr_dev(p0, "class", "info__subtitle svelte-192r169");
    			add_location(p0, file$r, 72, 4, 1869);
    			attr_dev(span, "class", "currency svelte-192r169");
    			add_location(span, file$r, 77, 6, 2052);
    			attr_dev(p1, "class", "info__price svelte-192r169");
    			add_location(p1, file$r, 76, 4, 2021);
    			attr_dev(div2, "class", "info svelte-192r169");
    			add_location(div2, file$r, 59, 2, 1531);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(icon, div1, null);
    			append_dev(div2, t2);
    			append_dev(div2, a);
    			mount_component(title_1, a, null);
    			append_dev(div2, t3);
    			append_dev(div2, p0);
    			append_dev(p0, t4);
    			append_dev(div2, t5);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t6);
    			append_dev(div2, p1);
    			append_dev(p1, span);
    			append_dev(p1, t8);
    			append_dev(p1, t9);
    			if (if_block3) if_block3.m(p1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*news*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*news*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*family*/ ctx[1]) {
    				if (if_block1) {
    					if (dirty & /*family*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			const title_1_changes = {};

    			if (dirty & /*$$scope, title*/ 520) {
    				title_1_changes.$$scope = { dirty, ctx };
    			}

    			title_1.$set(title_1_changes);

    			if (!current || dirty & /*href*/ 4) {
    				attr_dev(a, "href", /*href*/ ctx[2]);
    			}

    			if (!current || dirty & /*productType*/ 16) set_data_dev(t4, /*productType*/ ctx[4]);

    			if (/*regularPrice*/ ctx[5]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					if_block2.m(div2, t6);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (!current || dirty & /*price*/ 64) set_data_dev(t8, /*price*/ ctx[6]);

    			if (/*pieces*/ ctx[7] > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$6(ctx);
    					if_block3.c();
    					if_block3.m(p1, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(icon.$$.fragment, local);
    			transition_in(title_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(icon.$$.fragment, local);
    			transition_out(title_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(icon);
    			destroy_component(title_1);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(59:0) <Card shadow {style}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				shadow: true,
    				style: /*style*/ ctx[8],
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const card_changes = {};
    			if (dirty & /*style*/ 256) card_changes.style = /*style*/ ctx[8];

    			if (dirty & /*$$scope, pieces, price, regularPrice, productType, href, title, family, news*/ 767) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProductCard", slots, []);
    	let { news = false } = $$props;
    	let { family = false } = $$props;
    	let { href = "" } = $$props;
    	let { title = "" } = $$props;
    	let { productType = "" } = $$props;
    	let { regularPrice = 0 } = $$props;
    	let { price = 0 } = $$props;
    	let { pieces = 0 } = $$props;
    	let { style = "" } = $$props;

    	const writable_props = [
    		"news",
    		"family",
    		"href",
    		"title",
    		"productType",
    		"regularPrice",
    		"price",
    		"pieces",
    		"style"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProductCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("news" in $$props) $$invalidate(0, news = $$props.news);
    		if ("family" in $$props) $$invalidate(1, family = $$props.family);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    		if ("title" in $$props) $$invalidate(3, title = $$props.title);
    		if ("productType" in $$props) $$invalidate(4, productType = $$props.productType);
    		if ("regularPrice" in $$props) $$invalidate(5, regularPrice = $$props.regularPrice);
    		if ("price" in $$props) $$invalidate(6, price = $$props.price);
    		if ("pieces" in $$props) $$invalidate(7, pieces = $$props.pieces);
    		if ("style" in $$props) $$invalidate(8, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({
    		Card,
    		Family,
    		Icon,
    		News,
    		Title,
    		news,
    		family,
    		href,
    		title,
    		productType,
    		regularPrice,
    		price,
    		pieces,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("news" in $$props) $$invalidate(0, news = $$props.news);
    		if ("family" in $$props) $$invalidate(1, family = $$props.family);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    		if ("title" in $$props) $$invalidate(3, title = $$props.title);
    		if ("productType" in $$props) $$invalidate(4, productType = $$props.productType);
    		if ("regularPrice" in $$props) $$invalidate(5, regularPrice = $$props.regularPrice);
    		if ("price" in $$props) $$invalidate(6, price = $$props.price);
    		if ("pieces" in $$props) $$invalidate(7, pieces = $$props.pieces);
    		if ("style" in $$props) $$invalidate(8, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [news, family, href, title, productType, regularPrice, price, pieces, style];
    }

    class ProductCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {
    			news: 0,
    			family: 1,
    			href: 2,
    			title: 3,
    			productType: 4,
    			regularPrice: 5,
    			price: 6,
    			pieces: 7,
    			style: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductCard",
    			options,
    			id: create_fragment$r.name
    		});
    	}

    	get news() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set news(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get family() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set family(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get productType() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set productType(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get regularPrice() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set regularPrice(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pieces() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pieces(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<ProductCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\organisms\HoverCard.svelte generated by Svelte v3.29.0 */
    const file$s = "src\\components\\organisms\\HoverCard.svelte";

    function create_fragment$s(ctx) {
    	let div2;
    	let div0;
    	let imagepointer;
    	let div0_style_value;
    	let t;
    	let div1;
    	let productcard;
    	let div1_class_value;
    	let div1_style_value;
    	let div2_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	imagepointer = new ImagePointer({ $$inline: true });
    	imagepointer.$on("mouseenter", /*revealCard*/ ctx[12]);

    	productcard = new ProductCard({
    			props: {
    				news: /*news*/ ctx[1],
    				family: /*family*/ ctx[2],
    				href: /*href*/ ctx[3],
    				title: /*title*/ ctx[4],
    				productType: /*productType*/ ctx[5],
    				regularPrice: /*regularPrice*/ ctx[6],
    				price: /*price*/ ctx[7],
    				pieces: /*pieces*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(imagepointer.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(productcard.$$.fragment);
    			attr_dev(div0, "class", "container__pointer svelte-1rzrjan");
    			attr_dev(div0, "style", div0_style_value = /*layout*/ ctx[11].pointer);
    			add_location(div0, file$s, 105, 2, 2995);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(`container__card ${/*visible*/ ctx[0] && "container__card--visible"}`) + " svelte-1rzrjan"));
    			attr_dev(div1, "style", div1_style_value = /*layout*/ ctx[11].card);
    			add_location(div1, file$s, 108, 2, 3113);
    			attr_dev(div2, "class", "container svelte-1rzrjan");
    			attr_dev(div2, "style", div2_style_value = `top: ${/*y*/ ctx[10]}%; left: ${/*x*/ ctx[9]}%`);
    			add_location(div2, file$s, 101, 0, 2900);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(imagepointer, div0, null);
    			append_dev(div2, t);
    			append_dev(div2, div1);
    			mount_component(productcard, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div2, "mouseleave", /*hideCard*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*layout*/ 2048 && div0_style_value !== (div0_style_value = /*layout*/ ctx[11].pointer)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			const productcard_changes = {};
    			if (dirty & /*news*/ 2) productcard_changes.news = /*news*/ ctx[1];
    			if (dirty & /*family*/ 4) productcard_changes.family = /*family*/ ctx[2];
    			if (dirty & /*href*/ 8) productcard_changes.href = /*href*/ ctx[3];
    			if (dirty & /*title*/ 16) productcard_changes.title = /*title*/ ctx[4];
    			if (dirty & /*productType*/ 32) productcard_changes.productType = /*productType*/ ctx[5];
    			if (dirty & /*regularPrice*/ 64) productcard_changes.regularPrice = /*regularPrice*/ ctx[6];
    			if (dirty & /*price*/ 128) productcard_changes.price = /*price*/ ctx[7];
    			if (dirty & /*pieces*/ 256) productcard_changes.pieces = /*pieces*/ ctx[8];
    			productcard.$set(productcard_changes);

    			if (!current || dirty & /*visible*/ 1 && div1_class_value !== (div1_class_value = "" + (null_to_empty(`container__card ${/*visible*/ ctx[0] && "container__card--visible"}`) + " svelte-1rzrjan"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (!current || dirty & /*layout*/ 2048 && div1_style_value !== (div1_style_value = /*layout*/ ctx[11].card)) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (!current || dirty & /*y, x*/ 1536 && div2_style_value !== (div2_style_value = `top: ${/*y*/ ctx[10]}%; left: ${/*x*/ ctx[9]}%`)) {
    				attr_dev(div2, "style", div2_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagepointer.$$.fragment, local);
    			transition_in(productcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagepointer.$$.fragment, local);
    			transition_out(productcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(imagepointer);
    			destroy_component(productcard);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HoverCard", slots, []);
    	let { news = false } = $$props;
    	let { family = false } = $$props;
    	let { href = "" } = $$props;
    	let { title = "" } = $$props;
    	let { productType = "" } = $$props;
    	let { regularPrice = 0 } = $$props;
    	let { price = 0 } = $$props;
    	let { pieces = 0 } = $$props;
    	let { visible = false } = $$props;
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	let { position = "top left" } = $$props;

    	// position of pointer based on position props
    	let layout = {
    		pointer: "grid-column: 1 / 2; align-self: flex-start",
    		card: ""
    	};

    	switch (position) {
    		case "top":
    			layout = {
    				pointer: "grid-column: 1 / 3; grid-row: 1 / 2; justify-self: center;",
    				card: "grid-column: 1 / 3; grid-row: 2 / 3;"
    			};
    			break;
    		case "bottom":
    			layout = {
    				pointer: "grid-column: 1 / 3; grid-row: 2 / 3; justify-self: center;",
    				card: "grid-column: 1 / 3; grid-row: 1 / 2;"
    			};
    			break;
    		case "left":
    			layout = {
    				pointer: "grid-column: 1 / 2; grid-row: 1 / 3; align-self: center;",
    				card: "grid-column: 2 / 3; grid-row: 1 / 3; "
    			};
    			break;
    		case "right":
    			layout = {
    				pointer: "grid-column: 2 / 3; grid-row: 1 / 3; align-self: center;",
    				card: "grid-column: 1 / 2; grid-row: 1/ 3;"
    			};
    			break;
    		case "top right":
    			layout = {
    				pointer: "grid-column: 2 / 3; grid-row: 1 / 3; align-self: flex-start;",
    				card: "grid-column: 1 / 2; grid-row: 1/ 3;"
    			};
    			break;
    		case "bottom left":
    			layout = {
    				pointer: "grid-column: 1 / 2; grid-row: 1 / 3; align-self: flex-end;",
    				card: "grid-column: 2 / 3; grid-row: 1 / 3; "
    			};
    			break;
    		case "bottom right":
    			layout = {
    				pointer: "grid-column: 2 / 3; grid-row: 1 / 3; align-self: flex-end;",
    				card: "grid-column: 1 / 2; grid-row: 1/ 3;"
    			};
    			break;
    		default:
    			layout = {
    				pointer: "grid-column: 1 / 2; grid-row: 1 / 3; align-self: flex-start;",
    				card: "grid-column: 2 / 3; grid-row: 1 / 3; "
    			};
    			break;
    	}

    	// toggle card visibility on hover
    	const revealCard = () => $$invalidate(0, visible = true);

    	const hideCard = () => $$invalidate(0, visible = false);

    	const writable_props = [
    		"news",
    		"family",
    		"href",
    		"title",
    		"productType",
    		"regularPrice",
    		"price",
    		"pieces",
    		"visible",
    		"x",
    		"y",
    		"position"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HoverCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("news" in $$props) $$invalidate(1, news = $$props.news);
    		if ("family" in $$props) $$invalidate(2, family = $$props.family);
    		if ("href" in $$props) $$invalidate(3, href = $$props.href);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    		if ("productType" in $$props) $$invalidate(5, productType = $$props.productType);
    		if ("regularPrice" in $$props) $$invalidate(6, regularPrice = $$props.regularPrice);
    		if ("price" in $$props) $$invalidate(7, price = $$props.price);
    		if ("pieces" in $$props) $$invalidate(8, pieces = $$props.pieces);
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("x" in $$props) $$invalidate(9, x = $$props.x);
    		if ("y" in $$props) $$invalidate(10, y = $$props.y);
    		if ("position" in $$props) $$invalidate(14, position = $$props.position);
    	};

    	$$self.$capture_state = () => ({
    		ImagePointer,
    		ProductCard,
    		news,
    		family,
    		href,
    		title,
    		productType,
    		regularPrice,
    		price,
    		pieces,
    		visible,
    		x,
    		y,
    		position,
    		layout,
    		revealCard,
    		hideCard
    	});

    	$$self.$inject_state = $$props => {
    		if ("news" in $$props) $$invalidate(1, news = $$props.news);
    		if ("family" in $$props) $$invalidate(2, family = $$props.family);
    		if ("href" in $$props) $$invalidate(3, href = $$props.href);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    		if ("productType" in $$props) $$invalidate(5, productType = $$props.productType);
    		if ("regularPrice" in $$props) $$invalidate(6, regularPrice = $$props.regularPrice);
    		if ("price" in $$props) $$invalidate(7, price = $$props.price);
    		if ("pieces" in $$props) $$invalidate(8, pieces = $$props.pieces);
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("x" in $$props) $$invalidate(9, x = $$props.x);
    		if ("y" in $$props) $$invalidate(10, y = $$props.y);
    		if ("position" in $$props) $$invalidate(14, position = $$props.position);
    		if ("layout" in $$props) $$invalidate(11, layout = $$props.layout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		visible,
    		news,
    		family,
    		href,
    		title,
    		productType,
    		regularPrice,
    		price,
    		pieces,
    		x,
    		y,
    		layout,
    		revealCard,
    		hideCard,
    		position
    	];
    }

    class HoverCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {
    			news: 1,
    			family: 2,
    			href: 3,
    			title: 4,
    			productType: 5,
    			regularPrice: 6,
    			price: 7,
    			pieces: 8,
    			visible: 0,
    			x: 9,
    			y: 10,
    			position: 14
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HoverCard",
    			options,
    			id: create_fragment$s.name
    		});
    	}

    	get news() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set news(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get family() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set family(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get productType() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set productType(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get regularPrice() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set regularPrice(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pieces() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pieces(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<HoverCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\molecules\ImageOverlay.svelte generated by Svelte v3.29.0 */
    const file$t = "src\\components\\molecules\\ImageOverlay.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (28:2) {#each data as product}
    function create_each_block(ctx) {
    	let hovercard;
    	let current;

    	hovercard = new HoverCard({
    			props: {
    				visible: /*allHidden*/ ctx[1]
    				? false
    				: /*product*/ ctx[4].visible,
    				x: /*product*/ ctx[4].x,
    				y: /*product*/ ctx[4].y,
    				position: /*product*/ ctx[4].position,
    				news: /*product*/ ctx[4].news,
    				family: /*product*/ ctx[4].family,
    				title: /*product*/ ctx[4].title,
    				productType: /*product*/ ctx[4].productType,
    				regularPrice: /*product*/ ctx[4].regularPrice,
    				price: /*product*/ ctx[4].price,
    				pieces: /*product*/ ctx[4].pieces
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(hovercard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(hovercard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const hovercard_changes = {};

    			if (dirty & /*allHidden, data*/ 3) hovercard_changes.visible = /*allHidden*/ ctx[1]
    			? false
    			: /*product*/ ctx[4].visible;

    			if (dirty & /*data*/ 1) hovercard_changes.x = /*product*/ ctx[4].x;
    			if (dirty & /*data*/ 1) hovercard_changes.y = /*product*/ ctx[4].y;
    			if (dirty & /*data*/ 1) hovercard_changes.position = /*product*/ ctx[4].position;
    			if (dirty & /*data*/ 1) hovercard_changes.news = /*product*/ ctx[4].news;
    			if (dirty & /*data*/ 1) hovercard_changes.family = /*product*/ ctx[4].family;
    			if (dirty & /*data*/ 1) hovercard_changes.title = /*product*/ ctx[4].title;
    			if (dirty & /*data*/ 1) hovercard_changes.productType = /*product*/ ctx[4].productType;
    			if (dirty & /*data*/ 1) hovercard_changes.regularPrice = /*product*/ ctx[4].regularPrice;
    			if (dirty & /*data*/ 1) hovercard_changes.price = /*product*/ ctx[4].price;
    			if (dirty & /*data*/ 1) hovercard_changes.pieces = /*product*/ ctx[4].pieces;
    			hovercard.$set(hovercard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hovercard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hovercard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hovercard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(28:2) {#each data as product}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "overlay svelte-os2wpe");
    			add_location(div, file$t, 23, 0, 480);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[2], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*allHidden, data*/ 3) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageOverlay", slots, []);
    	let { data = [] } = $$props;
    	let allHidden = false;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageOverlay> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = () => $$invalidate(1, allHidden = true);
    	const mouseleave_handler = () => $$invalidate(1, allHidden = false);

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ HoverCard, data, allHidden });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("allHidden" in $$props) $$invalidate(1, allHidden = $$props.allHidden);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, allHidden, mouseenter_handler, mouseleave_handler];
    }

    class ImageOverlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageOverlay",
    			options,
    			id: create_fragment$t.name
    		});
    	}

    	get data() {
    		throw new Error("<ImageOverlay>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<ImageOverlay>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\organisms\Slideshow.svelte generated by Svelte v3.29.0 */
    const file$u = "src\\components\\organisms\\Slideshow.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (143:35) 
    function create_if_block_2$3(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;
    	let each_value_1 = /*data*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*max*/ ctx[4] < /*data*/ ctx[0].length && create_if_block_3$3(ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, max*/ 17) {
    				each_value_1 = /*data*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*max*/ ctx[4] < /*data*/ ctx[0].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*max, data*/ 17) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(143:35) ",
    		ctx
    	});

    	return block;
    }

    // (135:6) {#if type === 'images'}
    function create_if_block_1$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				each_value = /*data*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(135:6) {#if type === 'images'}",
    		ctx
    	});

    	return block;
    }

    // (145:10) {#if i < max}
    function create_if_block_4$2(ctx) {
    	let div;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				tertiary: true,
    				small: true,
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "btn-container svelte-v77sht");
    			add_location(div, file$u, 145, 12, 3784);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope, data*/ 524289) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(145:10) {#if i < max}",
    		ctx
    	});

    	return block;
    }

    // (147:14) <Button tertiary small>
    function create_default_slot_2$1(ctx) {
    	let t_value = /*button*/ ctx[16].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*button*/ ctx[16].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(147:14) <Button tertiary small>",
    		ctx
    	});

    	return block;
    }

    // (144:8) {#each data as button, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*i*/ ctx[18] < /*max*/ ctx[4] && create_if_block_4$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*i*/ ctx[18] < /*max*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*max*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(144:8) {#each data as button, i}",
    		ctx
    	});

    	return block;
    }

    // (151:8) {#if max < data.length}
    function create_if_block_3$3(ctx) {
    	let div;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				tertiary: true,
    				small: true,
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", /*click_handler*/ ctx[9]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "btn-container svelte-v77sht");
    			add_location(div, file$u, 151, 10, 3971);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope, data, max*/ 524305) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(151:8) {#if max < data.length}",
    		ctx
    	});

    	return block;
    }

    // (153:12) <Button tertiary small on:click={() => (max = data.length)}>
    function create_default_slot_1$3(ctx) {
    	let t_value = `${/*data*/ ctx[0].length - /*max*/ ctx[4]}+ more` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, max*/ 17 && t_value !== (t_value = `${/*data*/ ctx[0].length - /*max*/ ctx[4]}+ more` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(153:12) <Button tertiary small on:click={() => (max = data.length)}>",
    		ctx
    	});

    	return block;
    }

    // (139:14) <Button tertiary>
    function create_default_slot$4(ctx) {
    	let t_value = /*image*/ ctx[13].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*image*/ ctx[13].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(139:14) <Button tertiary>",
    		ctx
    	});

    	return block;
    }

    // (136:8) {#each data as image}
    function create_each_block$1(ctx) {
    	let div1;
    	let div0;
    	let button;
    	let t;
    	let div1_style_value;
    	let current;

    	button = new Button({
    			props: {
    				tertiary: true,
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(button.$$.fragment);
    			t = space();
    			attr_dev(div0, "class", "image__btn svelte-v77sht");
    			add_location(div0, file$u, 137, 12, 3540);
    			attr_dev(div1, "class", "image svelte-v77sht");
    			attr_dev(div1, "style", div1_style_value = `background-image: url(${/*image*/ ctx[13].src})`);
    			add_location(div1, file$u, 136, 10, 3461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(button, div0, null);
    			append_dev(div1, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope, data*/ 524289) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (!current || dirty & /*data*/ 1 && div1_style_value !== (div1_style_value = `background-image: url(${/*image*/ ctx[13].src})`)) {
    				attr_dev(div1, "style", div1_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(136:8) {#each data as image}",
    		ctx
    	});

    	return block;
    }

    // (162:4) {#if !noSlider}
    function create_if_block$7(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "slider svelte-v77sht");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "100");
    			attr_dev(input, "step", "0.5");
    			add_location(input, file$u, 162, 6, 4265);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*scrolled*/ ctx[5]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[11]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[11]),
    					listen_dev(input, "input", /*handleSlider*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*scrolled*/ 32) {
    				set_input_value(input, /*scrolled*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(162:4) {#if !noSlider}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$u(ctx) {
    	let div3;
    	let div1;
    	let div0;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let div2;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_1$3, create_if_block_2$3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[1] === "images") return 0;
    		if (/*type*/ ctx[1] === "buttons") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block1 = !/*noSlider*/ ctx[2] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			div2 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "image-rail__container svelte-v77sht");
    			add_location(div0, file$u, 133, 4, 3352);
    			attr_dev(div1, "class", "image-rail svelte-v77sht");
    			add_location(div1, file$u, 132, 2, 3280);
    			attr_dev(div2, "class", "indicator svelte-v77sht");
    			add_location(div2, file$u, 160, 2, 4213);
    			attr_dev(div3, "class", "slideshow svelte-v77sht");
    			toggle_class(div3, "slideshow--images", /*type*/ ctx[1] === "images");
    			toggle_class(div3, "slideshow--buttons", /*type*/ ctx[1] === "buttons");
    			add_location(div3, file$u, 128, 0, 3154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, div0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div0, null);
    			}

    			/*div1_binding*/ ctx[10](div1);
    			append_dev(div3, t);
    			append_dev(div3, div2);
    			if (if_block1) if_block1.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "scroll", /*handleScroll*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block0) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block0 = if_blocks[current_block_type_index];

    					if (!if_block0) {
    						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block0.c();
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (!/*noSlider*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$7(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*type*/ 2) {
    				toggle_class(div3, "slideshow--images", /*type*/ ctx[1] === "images");
    			}

    			if (dirty & /*type*/ 2) {
    				toggle_class(div3, "slideshow--buttons", /*type*/ ctx[1] === "buttons");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			/*div1_binding*/ ctx[10](null);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Slideshow", slots, []);
    	let { data = [] } = $$props;
    	let { type = "images" } = $$props;
    	let { showMax = data.length || 0 } = $$props;
    	let { noSlider = false } = $$props;
    	let rail;
    	let selected = false;

    	const handleScroll = e => {
    		let v = e.target.offsetWidth,
    			w = e.target.scrollWidth,
    			s = e.target.scrollLeft,
    			x = s / (w - v) * 100;

    		if (x.toFixed(1) - Math.floor(x) === 0 || x.toFixed(1) - Math.floor(x) >= 0.25 && x.toFixed(1) - Math.floor(x) < 0.75) {
    			$$invalidate(5, scrolled = x.toFixed(1));
    		} else if (x.toFixed(1) - Math.floor(x) < 0.25) {
    			$$invalidate(5, scrolled = Math.floor(x));
    		} else {
    			$$invalidate(5, scrolled = Math.ceil(x));
    		}
    	};

    	const handleSlider = () => {
    		let step = (rail.scrollWidth - rail.offsetWidth) / 100;
    		let x = scrolled * step;
    		$$invalidate(3, rail.scrollLeft = x, rail);
    	};

    	const writable_props = ["data", "type", "showMax", "noSlider"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Slideshow> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(4, max = data.length);

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rail = $$value;
    			$$invalidate(3, rail);
    		});
    	}

    	function input_change_input_handler() {
    		scrolled = to_number(this.value);
    		$$invalidate(5, scrolled);
    	}

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("showMax" in $$props) $$invalidate(8, showMax = $$props.showMax);
    		if ("noSlider" in $$props) $$invalidate(2, noSlider = $$props.noSlider);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		data,
    		type,
    		showMax,
    		noSlider,
    		rail,
    		selected,
    		handleScroll,
    		handleSlider,
    		max,
    		scrolled
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("showMax" in $$props) $$invalidate(8, showMax = $$props.showMax);
    		if ("noSlider" in $$props) $$invalidate(2, noSlider = $$props.noSlider);
    		if ("rail" in $$props) $$invalidate(3, rail = $$props.rail);
    		if ("selected" in $$props) selected = $$props.selected;
    		if ("max" in $$props) $$invalidate(4, max = $$props.max);
    		if ("scrolled" in $$props) $$invalidate(5, scrolled = $$props.scrolled);
    	};

    	let max;
    	let scrolled;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*showMax*/ 256) {
    			 $$invalidate(4, max = showMax);
    		}
    	};

    	 $$invalidate(5, scrolled = 0);

    	return [
    		data,
    		type,
    		noSlider,
    		rail,
    		max,
    		scrolled,
    		handleScroll,
    		handleSlider,
    		showMax,
    		click_handler,
    		div1_binding,
    		input_change_input_handler
    	];
    }

    class Slideshow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$u, create_fragment$u, safe_not_equal, {
    			data: 0,
    			type: 1,
    			showMax: 8,
    			noSlider: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slideshow",
    			options,
    			id: create_fragment$u.name
    		});
    	}

    	get data() {
    		throw new Error("<Slideshow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Slideshow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Slideshow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Slideshow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showMax() {
    		throw new Error("<Slideshow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showMax(value) {
    		throw new Error("<Slideshow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noSlider() {
    		throw new Error("<Slideshow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noSlider(value) {
    		throw new Error("<Slideshow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const productData = [
      [
        {
          visible: true,
          x: 30,
          y: 36,
          position: "top",
          news: true,
          family: true,
          title: "STRÅLA",
          productType: "Lamp shade",
          regularPrice: 13,
          price: 11,
          pieces: null,
          href: "",
        },
        {
          visible: false,
          x: 17,
          y: 10,
          position: "left",
          news: true,
          family: true,
          title: "STRÅLA",
          productType: "Lamp shade",
          regularPrice: 4,
          price: 3.4,
          pieces: null,
          href: "",
        },
        {
          visible: false,
          x: 47,
          y: 20,
          position: "right",
          news: true,
          family: false,
          title: "STRÅLA",
          productType: "Lamp shade",
          regularPrice: null,
          price: 4,
          pieces: null,
          href: "",
        },
        {
          visible: false,
          x: 36,
          y: 55,
          position: "right",
          news: true,
          family: false,
          title: "STRÅLA",
          productType: "Lamp shade",
          regularPrice: null,
          price: 3.5,
          pieces: null,
          href: "",
        },
      ],
      [
        {
          visible: false,
          x: 24,
          y: 34,
          position: "top",
          news: true,
          family: false,
          title: "VINTER 2020",
          productType: "Decoration, bauble",
          regularPrice: null,
          price: 3.5,
          pieces: 4,
          href: "",
        },
        {
          visible: true,
          x: 24,
          y: 34,
          position: "right",
          news: true,
          family: false,
          title: "VINTER 2020",
          productType: "Decoration, bauble",
          regularPrice: null,
          price: 9,
          pieces: 32,
          href: "",
        },
        {
          visible: false,
          x: 22,
          y: 64,
          position: "left",
          news: true,
          family: false,
          title: "VINTER 2020",
          productType: "Hanging decoration",
          regularPrice: null,
          price: 6,
          pieces: 6,
          href: "",
        },
      ],
    ];

    const slideShowData = [
      [
        {
          src: "images/photos/eat-sustainably.webp",
          text: "Food",
          icon: "",
          href: "/",
        },
        {
          src: "images/photos/how-to-choose-furniture.webp",
          text: "Furniture",
          icon: "",
          href: "/",
        },
        {
          src: "images/photos/how-to-save-energy.webp",
          text: "Water & energy",
          icon: "",
          href: "",
        },
        {
          src: "images/photos/how-to-choose-materials.webp",
          text: "Materials",
          icon: "",
          href: "",
        },
        {
          src: "images/photos/a-healthier-home.webp",
          text: "Health",
          icon: "",
          href: "",
        },
      ],
      [
        { text: "Bedroom", href: "" },
        { text: "Living Room", href: "" },
        { text: "Kitchen", href: "" },
        { text: "Workspace", href: "" },
        { text: "Outdoor", href: "" },
        { text: "Bathroom", href: "" },
        { text: "Baby & Children Room", href: "" },
        { text: "Dining", href: "" },
        { text: "Hallway", href: "" },
      ],
    ];

    /* src\components\views\Homepage.svelte generated by Svelte v3.29.0 */
    const file$v = "src\\components\\views\\Homepage.svelte";

    // (21:2) <Title>
    function create_default_slot_30(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Make moments to treasure");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_30.name,
    		type: "slot",
    		source: "(21:2) <Title>",
    		ctx
    	});

    	return block;
    }

    // (23:4) <SeeMoreCard style="position: absolute; bottom: 1rem; left: 1rem;">
    function create_default_slot_29(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("See more cookware & tableware");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_29.name,
    		type: "slot",
    		source: "(23:4) <SeeMoreCard style=\\\"position: absolute; bottom: 1rem; left: 1rem;\\\">",
    		ctx
    	});

    	return block;
    }

    // (22:2) <ImageCard src="images/photos/festive-baking.jpg" left={10}>
    function create_default_slot_28(ctx) {
    	let seemorecard;
    	let current;

    	seemorecard = new SeeMoreCard({
    			props: {
    				style: "position: absolute; bottom: 1rem; left: 1rem;",
    				$$slots: { default: [create_default_slot_29] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(seemorecard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(seemorecard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const seemorecard_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				seemorecard_changes.$$scope = { dirty, ctx };
    			}

    			seemorecard.$set(seemorecard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(seemorecard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(seemorecard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(seemorecard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_28.name,
    		type: "slot",
    		source: "(22:2) <ImageCard src=\\\"images/photos/festive-baking.jpg\\\" left={10}>",
    		ctx
    	});

    	return block;
    }

    // (20:0) <Section>
    function create_default_slot_27(ctx) {
    	let title;
    	let t0;
    	let imagecard;
    	let t1;
    	let rule;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_30] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	imagecard = new ImageCard({
    			props: {
    				src: "images/photos/festive-baking.jpg",
    				left: 10,
    				$$slots: { default: [create_default_slot_28] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	rule = new Rule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(imagecard.$$.fragment);
    			t1 = space();
    			create_component(rule.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(imagecard, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(rule, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const imagecard_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				imagecard_changes.$$scope = { dirty, ctx };
    			}

    			imagecard.$set(imagecard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(imagecard.$$.fragment, local);
    			transition_in(rule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(imagecard.$$.fragment, local);
    			transition_out(rule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(imagecard, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(rule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_27.name,
    		type: "slot",
    		source: "(20:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (32:4) <Title>
    function create_default_slot_26(ctx) {
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("See our products in real homes ");
    			br = element("br");
    			t1 = text(" @ikeauk");
    			add_location(br, file$v, 31, 42, 1210);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_26.name,
    		type: "slot",
    		source: "(32:4) <Title>",
    		ctx
    	});

    	return block;
    }

    // (33:4) <Button href="#">
    function create_default_slot_25(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("View more");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_25.name,
    		type: "slot",
    		source: "(33:4) <Button href=\\\"#\\\">",
    		ctx
    	});

    	return block;
    }

    // (30:2) <Card      style="display: grid; grid-template-columns: 1fr auto; align-items: flex-start;">
    function create_default_slot_24(ctx) {
    	let title;
    	let t;
    	let button;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_26] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				href: "#",
    				$$slots: { default: [create_default_slot_25] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t = space();
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_24.name,
    		type: "slot",
    		source: "(30:2) <Card      style=\\\"display: grid; grid-template-columns: 1fr auto; align-items: flex-start;\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:0) <Section>
    function create_default_slot_23(ctx) {
    	let card;
    	let t0;
    	let p;
    	let t2;
    	let rule;
    	let current;

    	card = new Card({
    			props: {
    				style: "display: grid; grid-template-columns: 1fr auto; align-items: flex-start;",
    				$$slots: { default: [create_default_slot_24] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	rule = new Rule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(card.$$.fragment);
    			t0 = space();
    			p = element("p");
    			p.textContent = "Carousel goes here";
    			t2 = space();
    			create_component(rule.$$.fragment);
    			add_location(p, file$v, 34, 2, 1288);
    		},
    		m: function mount(target, anchor) {
    			mount_component(card, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(rule, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const card_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				card_changes.$$scope = { dirty, ctx };
    			}

    			card.$set(card_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card.$$.fragment, local);
    			transition_in(rule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card.$$.fragment, local);
    			transition_out(rule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(card, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t2);
    			destroy_component(rule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_23.name,
    		type: "slot",
    		source: "(29:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (39:2) <Title type="h2">
    function create_default_slot_22(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Illuminate your home with Christmas decorations");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_22.name,
    		type: "slot",
    		source: "(39:2) <Title type=\\\"h2\\\">",
    		ctx
    	});

    	return block;
    }

    // (40:2) <SectionText>
    function create_default_slot_21(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("From paper lampshades to fairy lights and colourful baubles, here’s\r\n    everything you need to create a festive feel.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_21.name,
    		type: "slot",
    		source: "(40:2) <SectionText>",
    		ctx
    	});

    	return block;
    }

    // (44:2) <ImageCard src="images/photos/strala-lights.jpg">
    function create_default_slot_20(ctx) {
    	let imageoverlay;
    	let current;

    	imageoverlay = new ImageOverlay({
    			props: { data: productData[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageoverlay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageoverlay, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageoverlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageoverlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageoverlay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_20.name,
    		type: "slot",
    		source: "(44:2) <ImageCard src=\\\"images/photos/strala-lights.jpg\\\">",
    		ctx
    	});

    	return block;
    }

    // (47:2) <ImageCard src="images/photos/christmas-decor.jpg">
    function create_default_slot_19(ctx) {
    	let imageoverlay;
    	let current;

    	imageoverlay = new ImageOverlay({
    			props: { data: productData[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageoverlay.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageoverlay, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageoverlay.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageoverlay.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageoverlay, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_19.name,
    		type: "slot",
    		source: "(47:2) <ImageCard src=\\\"images/photos/christmas-decor.jpg\\\">",
    		ctx
    	});

    	return block;
    }

    // (50:2) <Link style="display: grid; margin: 1.25rem 0 1rem 0;" icon>
    function create_default_slot_18(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("See all products for Christmas");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_18.name,
    		type: "slot",
    		source: "(50:2) <Link style=\\\"display: grid; margin: 1.25rem 0 1rem 0;\\\" icon>",
    		ctx
    	});

    	return block;
    }

    // (38:0) <Section>
    function create_default_slot_17(ctx) {
    	let title;
    	let t0;
    	let sectiontext;
    	let t1;
    	let imagecard0;
    	let t2;
    	let imagecard1;
    	let t3;
    	let link;
    	let t4;
    	let rule;
    	let current;

    	title = new Title({
    			props: {
    				type: "h2",
    				$$slots: { default: [create_default_slot_22] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sectiontext = new SectionText({
    			props: {
    				$$slots: { default: [create_default_slot_21] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	imagecard0 = new ImageCard({
    			props: {
    				src: "images/photos/strala-lights.jpg",
    				$$slots: { default: [create_default_slot_20] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	imagecard1 = new ImageCard({
    			props: {
    				src: "images/photos/christmas-decor.jpg",
    				$$slots: { default: [create_default_slot_19] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link = new Link({
    			props: {
    				style: "display: grid; margin: 1.25rem 0 1rem 0;",
    				icon: true,
    				$$slots: { default: [create_default_slot_18] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	rule = new Rule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(sectiontext.$$.fragment);
    			t1 = space();
    			create_component(imagecard0.$$.fragment);
    			t2 = space();
    			create_component(imagecard1.$$.fragment);
    			t3 = space();
    			create_component(link.$$.fragment);
    			t4 = space();
    			create_component(rule.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(sectiontext, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(imagecard0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(imagecard1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(link, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(rule, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const sectiontext_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				sectiontext_changes.$$scope = { dirty, ctx };
    			}

    			sectiontext.$set(sectiontext_changes);
    			const imagecard0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				imagecard0_changes.$$scope = { dirty, ctx };
    			}

    			imagecard0.$set(imagecard0_changes);
    			const imagecard1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				imagecard1_changes.$$scope = { dirty, ctx };
    			}

    			imagecard1.$set(imagecard1_changes);
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(sectiontext.$$.fragment, local);
    			transition_in(imagecard0.$$.fragment, local);
    			transition_in(imagecard1.$$.fragment, local);
    			transition_in(link.$$.fragment, local);
    			transition_in(rule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(sectiontext.$$.fragment, local);
    			transition_out(imagecard0.$$.fragment, local);
    			transition_out(imagecard1.$$.fragment, local);
    			transition_out(link.$$.fragment, local);
    			transition_out(rule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(sectiontext, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(imagecard0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(imagecard1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(link, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(rule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_17.name,
    		type: "slot",
    		source: "(38:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (56:2) <Title>
    function create_default_slot_16(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("New lower prices, same great quality");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_16.name,
    		type: "slot",
    		source: "(56:2) <Title>",
    		ctx
    	});

    	return block;
    }

    // (58:2) <LargeProductCard      title="FABRIKÖR Glass door cabinet"      buttonText="Browse our new lower prices">
    function create_default_slot_15(ctx) {
    	let p0;
    	let t1;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Now £129";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "Was £150";
    			set_style(p0, "margin-bottom", "0.625rem");
    			set_style(p0, "font-size", "0.875rem");
    			set_style(p0, "font-weight", "700");
    			set_style(p0, "line-height", "1.7142");
    			add_location(p0, file$v, 60, 4, 2187);
    			set_style(p1, "margin-bottom", "0.625rem");
    			set_style(p1, "font-size", "0.875rem");
    			set_style(p1, "line-height", "1.7142");
    			add_location(p1, file$v, 68, 4, 2343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(58:2) <LargeProductCard      title=\\\"FABRIKÖR Glass door cabinet\\\"      buttonText=\\\"Browse our new lower prices\\\">",
    		ctx
    	});

    	return block;
    }

    // (55:0) <Section>
    function create_default_slot_14(ctx) {
    	let title;
    	let t0;
    	let imagecard;
    	let t1;
    	let largeproductcard;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_16] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	imagecard = new ImageCard({
    			props: {
    				src: "images/photos/fabrikor-cabinets.webp"
    			},
    			$$inline: true
    		});

    	largeproductcard = new LargeProductCard({
    			props: {
    				title: "FABRIKÖR Glass door cabinet",
    				buttonText: "Browse our new lower prices",
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(imagecard.$$.fragment);
    			t1 = space();
    			create_component(largeproductcard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(imagecard, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(largeproductcard, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const largeproductcard_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				largeproductcard_changes.$$scope = { dirty, ctx };
    			}

    			largeproductcard.$set(largeproductcard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(imagecard.$$.fragment, local);
    			transition_in(largeproductcard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(imagecard.$$.fragment, local);
    			transition_out(largeproductcard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(imagecard, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(largeproductcard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(55:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (79:2) <Title type="h2">
    function create_default_slot_13(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Quick guides to a more sustainable life at home");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(79:2) <Title type=\\\"h2\\\">",
    		ctx
    	});

    	return block;
    }

    // (78:0) <Section>
    function create_default_slot_12(ctx) {
    	let title;
    	let t;
    	let slideshow;
    	let current;

    	title = new Title({
    			props: {
    				type: "h2",
    				$$slots: { default: [create_default_slot_13] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	slideshow = new Slideshow({
    			props: { type: "images", data: slideShowData[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t = space();
    			create_component(slideshow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(slideshow, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(slideshow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(slideshow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(slideshow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(78:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (83:2) <Title type="h2">
    function create_default_slot_11(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("More ideas and inspiration");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(83:2) <Title type=\\\"h2\\\">",
    		ctx
    	});

    	return block;
    }

    // (86:2) <Button>
    function create_default_slot_10(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Load 12 more");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(86:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (82:0) <Section>
    function create_default_slot_9(ctx) {
    	let title;
    	let t0;
    	let slideshow;
    	let t1;
    	let p;
    	let t3;
    	let button;
    	let t4;
    	let rule;
    	let current;

    	title = new Title({
    			props: {
    				type: "h2",
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	slideshow = new Slideshow({
    			props: {
    				type: "buttons",
    				data: slideShowData[1],
    				noSlider: true,
    				showMax: 2
    			},
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	rule = new Rule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(slideshow.$$.fragment);
    			t1 = space();
    			p = element("p");
    			p.textContent = "Picture gallery goes here";
    			t3 = space();
    			create_component(button.$$.fragment);
    			t4 = space();
    			create_component(rule.$$.fragment);
    			add_location(p, file$v, 84, 2, 2800);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(slideshow, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(button, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(rule, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(slideshow.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(rule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(slideshow.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(rule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(slideshow, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			destroy_component(button, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(rule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(82:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (90:2) <Title>
    function create_default_slot_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Important information");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(90:2) <Title>",
    		ctx
    	});

    	return block;
    }

    // (91:2) <Button>
    function create_default_slot_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("See the latest updates");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(91:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (93:2) <Button>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Creating safer homes together");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(93:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (95:2) <Button>
    function create_default_slot_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("IKEA recalls TROLIGTVIS travel mug due to important safety warning");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(95:2) <Button>",
    		ctx
    	});

    	return block;
    }

    // (89:0) <Section>
    function create_default_slot_4(ctx) {
    	let title;
    	let t0;
    	let button0;
    	let t1;
    	let p0;
    	let t3;
    	let button1;
    	let t4;
    	let p1;
    	let t6;
    	let button2;
    	let t7;
    	let p2;
    	let t9;
    	let rule;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	rule = new Rule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			create_component(button0.$$.fragment);
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Covid Statement";
    			t3 = space();
    			create_component(button1.$$.fragment);
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Secure it! Statement";
    			t6 = space();
    			create_component(button2.$$.fragment);
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "TROLIGTVIS image";
    			t9 = space();
    			create_component(rule.$$.fragment);
    			add_location(p0, file$v, 91, 2, 2987);
    			add_location(p1, file$v, 93, 2, 3063);
    			add_location(p2, file$v, 97, 2, 3191);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(button0, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(button2, target, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			mount_component(rule, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(rule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(rule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			destroy_component(button1, detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t6);
    			destroy_component(button2, detaching);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			destroy_component(rule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(89:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (102:2) <Title>
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Furniture and home inspiration");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(102:2) <Title>",
    		ctx
    	});

    	return block;
    }

    // (101:0) <Section>
    function create_default_slot_2$2(ctx) {
    	let title;
    	let t0;
    	let p;
    	let t1;
    	let a0;
    	let t3;
    	let a1;
    	let t5;
    	let a2;
    	let t7;
    	let a3;
    	let t9;
    	let a4;
    	let t11;
    	let a5;
    	let t13;
    	let a6;
    	let t15;
    	let a7;
    	let t17;
    	let t18;
    	let rule;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	rule = new Rule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			p = element("p");
    			t1 = text("For more than 70 years, we have worked to create a better everyday life for\r\n    the many people. As a home furnishing store, we do this by producing\r\n    furniture that is well-designed, functional and affordable. Here you will\r\n    find everything from\r\n    ");
    			a0 = element("a");
    			a0.textContent = "smart home";
    			t3 = text("\r\n    solutions to a large selection of\r\n    ");
    			a1 = element("a");
    			a1.textContent = "bedroom furniture";
    			t5 = text(",\r\n    ");
    			a2 = element("a");
    			a2.textContent = "lighting";
    			t7 = text(",\r\n    ");
    			a3 = element("a");
    			a3.textContent = "sofas";
    			t9 = text(",\r\n    ");
    			a4 = element("a");
    			a4.textContent = "homeware";
    			t11 = text(",\r\n    ");
    			a5 = element("a");
    			a5.textContent = "blinds";
    			t13 = text(",\r\n    ");
    			a6 = element("a");
    			a6.textContent = "curtains";
    			t15 = text(",\r\n    ");
    			a7 = element("a");
    			a7.textContent = "bedding";
    			t17 = text("\r\n    and more. Discover our wide range of products in-store or online!");
    			t18 = space();
    			create_component(rule.$$.fragment);
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$v, 107, 4, 3571);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$v, 109, 4, 3642);
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$v, 110, 4, 3682);
    			attr_dev(a3, "href", "/");
    			add_location(a3, file$v, 111, 4, 3713);
    			attr_dev(a4, "href", "/");
    			add_location(a4, file$v, 112, 4, 3741);
    			attr_dev(a5, "href", "/");
    			add_location(a5, file$v, 113, 4, 3772);
    			attr_dev(a6, "href", "/");
    			add_location(a6, file$v, 114, 4, 3801);
    			attr_dev(a7, "href", "/");
    			add_location(a7, file$v, 115, 4, 3832);
    			add_location(p, file$v, 102, 2, 3302);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t1);
    			append_dev(p, a0);
    			append_dev(p, t3);
    			append_dev(p, a1);
    			append_dev(p, t5);
    			append_dev(p, a2);
    			append_dev(p, t7);
    			append_dev(p, a3);
    			append_dev(p, t9);
    			append_dev(p, a4);
    			append_dev(p, t11);
    			append_dev(p, a5);
    			append_dev(p, t13);
    			append_dev(p, a6);
    			append_dev(p, t15);
    			append_dev(p, a7);
    			append_dev(p, t17);
    			insert_dev(target, t18, anchor);
    			mount_component(rule, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(rule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(rule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t18);
    			destroy_component(rule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(101:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (122:2) <Button tertiary>
    function create_default_slot_1$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Back to top");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$4.name,
    		type: "slot",
    		source: "(122:2) <Button tertiary>",
    		ctx
    	});

    	return block;
    }

    // (121:0) <Section>
    function create_default_slot$5(ctx) {
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				tertiary: true,
    				$$slots: { default: [create_default_slot_1$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(121:0) <Section>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$v(ctx) {
    	let section0;
    	let t0;
    	let section1;
    	let t1;
    	let section2;
    	let t2;
    	let section3;
    	let t3;
    	let section4;
    	let t4;
    	let section5;
    	let t5;
    	let section6;
    	let t6;
    	let section7;
    	let t7;
    	let section8;
    	let current;

    	section0 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_27] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section1 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_23] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section2 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_17] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section3 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_14] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section4 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section5 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section6 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section7 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section8 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(section0.$$.fragment);
    			t0 = space();
    			create_component(section1.$$.fragment);
    			t1 = space();
    			create_component(section2.$$.fragment);
    			t2 = space();
    			create_component(section3.$$.fragment);
    			t3 = space();
    			create_component(section4.$$.fragment);
    			t4 = space();
    			create_component(section5.$$.fragment);
    			t5 = space();
    			create_component(section6.$$.fragment);
    			t6 = space();
    			create_component(section7.$$.fragment);
    			t7 = space();
    			create_component(section8.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(section0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(section1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(section2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(section3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(section4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(section5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(section6, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(section7, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(section8, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const section0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section0_changes.$$scope = { dirty, ctx };
    			}

    			section0.$set(section0_changes);
    			const section1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section1_changes.$$scope = { dirty, ctx };
    			}

    			section1.$set(section1_changes);
    			const section2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section2_changes.$$scope = { dirty, ctx };
    			}

    			section2.$set(section2_changes);
    			const section3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section3_changes.$$scope = { dirty, ctx };
    			}

    			section3.$set(section3_changes);
    			const section4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section4_changes.$$scope = { dirty, ctx };
    			}

    			section4.$set(section4_changes);
    			const section5_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section5_changes.$$scope = { dirty, ctx };
    			}

    			section5.$set(section5_changes);
    			const section6_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section6_changes.$$scope = { dirty, ctx };
    			}

    			section6.$set(section6_changes);
    			const section7_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section7_changes.$$scope = { dirty, ctx };
    			}

    			section7.$set(section7_changes);
    			const section8_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				section8_changes.$$scope = { dirty, ctx };
    			}

    			section8.$set(section8_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(section0.$$.fragment, local);
    			transition_in(section1.$$.fragment, local);
    			transition_in(section2.$$.fragment, local);
    			transition_in(section3.$$.fragment, local);
    			transition_in(section4.$$.fragment, local);
    			transition_in(section5.$$.fragment, local);
    			transition_in(section6.$$.fragment, local);
    			transition_in(section7.$$.fragment, local);
    			transition_in(section8.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(section0.$$.fragment, local);
    			transition_out(section1.$$.fragment, local);
    			transition_out(section2.$$.fragment, local);
    			transition_out(section3.$$.fragment, local);
    			transition_out(section4.$$.fragment, local);
    			transition_out(section5.$$.fragment, local);
    			transition_out(section6.$$.fragment, local);
    			transition_out(section7.$$.fragment, local);
    			transition_out(section8.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(section0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(section1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(section2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(section3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(section4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(section5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(section6, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(section7, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(section8, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Homepage", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Homepage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Title,
    		Section,
    		Rule,
    		ImageCard,
    		Button,
    		Card,
    		SectionText,
    		LargeProductCard,
    		Link,
    		SeeMoreCard,
    		ImageOverlay,
    		Slideshow,
    		productData,
    		slideShowData
    	});

    	return [];
    }

    class Homepage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Homepage",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    const rooms = [
      {
        room: "Living room",
        src:
          "images/rooms/a-living-room-with-two-sofas-with-cushions-and-throws-hangin-ec2ff7f0d25e282fd96db73679f18e90.webp",
      },
      {
        room: "Bedroom",
        src:
          "images/rooms/a-bedroom-containing-a-green-tufjord-bed-with-regolit-lampsh-2036339bd3fbfce67fea02b7aa1fa57f.webp",
      },
      {
        room: "Hallway",
        src:
          "images/rooms/boots-shoes-metal-rejsa-boxes-shoehorns-a-skateboard-and-oth-a82f94812a140a5f542b4a8c90b60beb.webp",
      },
      {
        room: "Dining",
        src:
          "images/rooms/a-dining-area-with-a-wood-top-table-with-black-legs-and-blac-b37126d66ec75c2bf7dd94729b3f841d.jpg",
      },
      {
        room: "Office",
        src:
          "images/rooms/a-desk-swivel-chair-wall-mounted-shelf-and-a-pegboard-in-whi-2b5a2701ae002fc6b7e2143f1d867998.webp",
      },
      {
        room: "Kitchen",
        src:
          "images/rooms/a-large-kitchen-with-fronts-in-stainless-steel-worktops-in-o-ae38ea2b77f552c3c15c81ef7f28e2a4.webp",
      },
      {
        room: "Children's room",
        src:
          "images/rooms/a-sundvik-cot-with-roedhake-bed-linen-cosy-cushions-and-soft-b60358ba2727a34b23dd308095e30c5a.webp",
      },
      {
        room: "Bathroom",
        src:
          "images/rooms/a-white-hemnes-mirror-cabinet-above-a-white-wash-stand-next--e3678c72f739aab6c5c1d5affa297fc2.webp",
      },
      {
        room: "Outdoor",
        src:
          "images/rooms/a-closed-balcony-with-grey-bondholmen-furniture-round-pendan-738abc8026d964b86022166857b73cc3.webp",
      },
      {
        room: "IKEA For Business",
        src:
          "images/rooms/part-of-room-with-areas-for-relaxing-chairs-and-coffee-table-f301fe0088203b84da7f48f32f57d5f7.webp",
      },
    ];

    /* src\components\views\MobileNavRooms.svelte generated by Svelte v3.29.0 */
    const file$w = "src\\components\\views\\MobileNavRooms.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (18:0) <Title type="h2" style="padding-left: 1rem;">
    function create_default_slot$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Rooms");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(18:0) <Title type=\\\"h2\\\" style=\\\"padding-left: 1rem;\\\">",
    		ctx
    	});

    	return block;
    }

    // (20:2) {#each rooms as room}
    function create_each_block$2(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p;
    	let t1_value = /*room*/ ctx[0].room + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			if (img.src !== (img_src_value = /*room*/ ctx[0].src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*room*/ ctx[0].room);
    			add_location(img, file$w, 21, 6, 485);
    			add_location(p, file$w, 22, 6, 531);
    			attr_dev(div, "class", "room svelte-1b59r1v");
    			add_location(div, file$w, 20, 4, 459);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(div, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(20:2) {#each rooms as room}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$w(ctx) {
    	let title;
    	let t;
    	let div;
    	let current;

    	title = new Title({
    			props: {
    				type: "h2",
    				style: "padding-left: 1rem;",
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = rooms;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "container svelte-1b59r1v");
    			add_location(div, file$w, 18, 0, 405);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);

    			if (dirty & /*rooms*/ 0) {
    				each_value = rooms;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MobileNavRooms", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MobileNavRooms> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Title, rooms });
    	return [];
    }

    class MobileNavRooms extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileNavRooms",
    			options,
    			id: create_fragment$w.name
    		});
    	}
    }

    /* src\components\views\MobileNav.svelte generated by Svelte v3.29.0 */
    const file$x = "src\\components\\views\\MobileNav.svelte";

    // (87:2) {:else}
    function create_else_block$2(ctx) {
    	let div;
    	let icon0;
    	let t0;
    	let searchbar;
    	let t1;
    	let icon1;
    	let current;

    	icon0 = new Icon({
    			props: {
    				icon: "arrow",
    				style: "transform: rotate(180deg)"
    			},
    			$$inline: true
    		});

    	icon0.$on("click", /*click_handler*/ ctx[4]);

    	searchbar = new SearchBar({
    			props: {
    				hover: true,
    				noIcon: true,
    				style: "margin: 0 .5rem;"
    			},
    			$$inline: true
    		});

    	icon1 = new Icon({ props: { icon: "close" }, $$inline: true });
    	icon1.$on("click", /*toggleNav*/ ctx[2]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon0.$$.fragment);
    			t0 = space();
    			create_component(searchbar.$$.fragment);
    			t1 = space();
    			create_component(icon1.$$.fragment);
    			attr_dev(div, "class", "nav__search svelte-hgmjjn");
    			add_location(div, file$x, 87, 4, 2307);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(icon0, div, null);
    			append_dev(div, t0);
    			mount_component(searchbar, div, null);
    			append_dev(div, t1);
    			mount_component(icon1, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon0);
    			destroy_component(searchbar);
    			destroy_component(icon1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(87:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (82:2) {#if page === 'main'}
    function create_if_block_3$4(ctx) {
    	let div;
    	let a;
    	let img;
    	let img_src_value;
    	let t;
    	let icon;
    	let current;
    	icon = new Icon({ props: { icon: "close" }, $$inline: true });
    	icon.$on("click", /*toggleNav*/ ctx[2]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			img = element("img");
    			t = space();
    			create_component(icon.$$.fragment);
    			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "IKEA Logo");
    			attr_dev(img, "class", "svelte-hgmjjn");
    			add_location(img, file$x, 83, 18, 2195);
    			attr_dev(a, "href", "/");
    			add_location(a, file$x, 83, 6, 2183);
    			attr_dev(div, "class", "nav__head svelte-hgmjjn");
    			add_location(div, file$x, 82, 4, 2152);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, img);
    			append_dev(div, t);
    			mount_component(icon, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$4.name,
    		type: "if",
    		source: "(82:2) {#if page === 'main'}",
    		ctx
    	});

    	return block;
    }

    // (120:29) 
    function create_if_block_2$4(ctx) {
    	let mobilenavrooms;
    	let current;
    	mobilenavrooms = new MobileNavRooms({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(mobilenavrooms.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(mobilenavrooms, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mobilenavrooms.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mobilenavrooms.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mobilenavrooms, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(120:29) ",
    		ctx
    	});

    	return block;
    }

    // (118:32) 
    function create_if_block_1$4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Products";
    			add_location(p, file$x, 118, 4, 3348);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(118:32) ",
    		ctx
    	});

    	return block;
    }

    // (97:2) {#if page === 'main'}
    function create_if_block$8(ctx) {
    	let ul0;
    	let li0;
    	let button0;
    	let t1;
    	let li1;
    	let button1;
    	let t3;
    	let ul1;
    	let li2;
    	let a0;
    	let t5;
    	let li3;
    	let a1;
    	let t7;
    	let li4;
    	let a2;
    	let t9;
    	let li5;
    	let a3;
    	let t11;
    	let li6;
    	let a4;
    	let t13;
    	let li7;
    	let a5;
    	let t15;
    	let div;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	button2 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			ul0 = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			button0.textContent = "Products";
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			button1.textContent = "Rooms";
    			t3 = space();
    			ul1 = element("ul");
    			li2 = element("li");
    			a0 = element("a");
    			a0.textContent = "Customer Services";
    			t5 = space();
    			li3 = element("li");
    			a1 = element("a");
    			a1.textContent = "Offers";
    			t7 = space();
    			li4 = element("li");
    			a2 = element("a");
    			a2.textContent = "Inspiration";
    			t9 = space();
    			li5 = element("li");
    			a3 = element("a");
    			a3.textContent = "Green energy - switch & save";
    			t11 = space();
    			li6 = element("li");
    			a4 = element("a");
    			a4.textContent = "IKEA Food";
    			t13 = space();
    			li7 = element("li");
    			a5 = element("a");
    			a5.textContent = "IKEA for Business";
    			t15 = space();
    			div = element("div");
    			create_component(button2.$$.fragment);
    			attr_dev(button0, "class", "svelte-hgmjjn");
    			add_location(button0, file$x, 98, 10, 2654);
    			add_location(li0, file$x, 98, 6, 2650);
    			attr_dev(button1, "class", "svelte-hgmjjn");
    			add_location(button1, file$x, 99, 10, 2733);
    			add_location(li1, file$x, 99, 6, 2729);
    			attr_dev(ul0, "class", "nav__extended svelte-hgmjjn");
    			add_location(ul0, file$x, 97, 4, 2616);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-hgmjjn");
    			add_location(a0, file$x, 102, 10, 2845);
    			attr_dev(li2, "class", "svelte-hgmjjn");
    			add_location(li2, file$x, 102, 6, 2841);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-hgmjjn");
    			add_location(a1, file$x, 103, 10, 2895);
    			attr_dev(li3, "class", "svelte-hgmjjn");
    			add_location(li3, file$x, 103, 6, 2891);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "class", "svelte-hgmjjn");
    			add_location(a2, file$x, 104, 10, 2934);
    			attr_dev(li4, "class", "svelte-hgmjjn");
    			add_location(li4, file$x, 104, 6, 2930);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "svelte-hgmjjn");
    			add_location(a3, file$x, 105, 10, 2978);
    			attr_dev(li5, "class", "svelte-hgmjjn");
    			add_location(li5, file$x, 105, 6, 2974);
    			attr_dev(a4, "href", "/");
    			attr_dev(a4, "class", "svelte-hgmjjn");
    			add_location(a4, file$x, 106, 10, 3039);
    			attr_dev(li6, "class", "svelte-hgmjjn");
    			add_location(li6, file$x, 106, 6, 3035);
    			attr_dev(a5, "href", "/");
    			attr_dev(a5, "class", "svelte-hgmjjn");
    			add_location(a5, file$x, 107, 10, 3081);
    			attr_dev(li7, "class", "svelte-hgmjjn");
    			add_location(li7, file$x, 107, 6, 3077);
    			attr_dev(ul1, "class", "nav__main svelte-hgmjjn");
    			add_location(ul1, file$x, 101, 4, 2811);
    			attr_dev(div, "class", "nav__language svelte-hgmjjn");
    			add_location(div, file$x, 109, 4, 3136);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			append_dev(li0, button0);
    			append_dev(ul0, t1);
    			append_dev(ul0, li1);
    			append_dev(li1, button1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, ul1, anchor);
    			append_dev(ul1, li2);
    			append_dev(li2, a0);
    			append_dev(ul1, t5);
    			append_dev(ul1, li3);
    			append_dev(li3, a1);
    			append_dev(ul1, t7);
    			append_dev(ul1, li4);
    			append_dev(li4, a2);
    			append_dev(ul1, t9);
    			append_dev(ul1, li5);
    			append_dev(li5, a3);
    			append_dev(ul1, t11);
    			append_dev(ul1, li6);
    			append_dev(li6, a4);
    			append_dev(ul1, t13);
    			append_dev(ul1, li7);
    			append_dev(li7, a5);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(button2, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[5], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				button2_changes.$$scope = { dirty, ctx };
    			}

    			button2.$set(button2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(ul1);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div);
    			destroy_component(button2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(97:2) {#if page === 'main'}",
    		ctx
    	});

    	return block;
    }

    // (111:6) <Button>
    function create_default_slot$7(ctx) {
    	let span;
    	let notification;
    	let t;
    	let current;
    	notification = new Notification({ $$inline: true });

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(notification.$$.fragment);
    			t = text("\r\n          Change country");
    			attr_dev(span, "class", "icon svelte-hgmjjn");
    			add_location(span, file$x, 111, 8, 3189);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(notification, span, null);
    			append_dev(span, t);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(notification);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(111:6) <Button>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$x(ctx) {
    	let nav;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let current_block_type_index_1;
    	let if_block1;
    	let current;
    	const if_block_creators = [create_if_block_3$4, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*page*/ ctx[0] === "main") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block$8, create_if_block_1$4, create_if_block_2$4];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*page*/ ctx[0] === "main") return 0;
    		if (/*page*/ ctx[0] === "products") return 1;
    		if (/*page*/ ctx[0] === "rooms") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index_1 = select_block_type_1(ctx))) {
    		if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(nav, "class", "nav svelte-hgmjjn");
    			toggle_class(nav, "nav--active", /*tempActive*/ ctx[3]);
    			add_location(nav, file$x, 80, 0, 2073);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			if_blocks[current_block_type_index].m(nav, null);
    			append_dev(nav, t);

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].m(nav, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(nav, t);
    			}

    			let previous_block_index_1 = current_block_type_index_1;
    			current_block_type_index_1 = select_block_type_1(ctx);

    			if (current_block_type_index_1 === previous_block_index_1) {
    				if (~current_block_type_index_1) {
    					if_blocks_1[current_block_type_index_1].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks_1[previous_block_index_1], 1, 1, () => {
    						if_blocks_1[previous_block_index_1] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index_1) {
    					if_block1 = if_blocks_1[current_block_type_index_1];

    					if (!if_block1) {
    						if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);
    						if_block1.c();
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(nav, null);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (dirty & /*tempActive*/ 8) {
    				toggle_class(nav, "nav--active", /*tempActive*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if_blocks[current_block_type_index].d();

    			if (~current_block_type_index_1) {
    				if_blocks_1[current_block_type_index_1].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MobileNav", slots, []);
    	let src = "images/logo/ikea-logo-small.svg";
    	const dispatch = createEventDispatcher();
    	const toggleNav = () => dispatch("toggle", { show: false });

    	//   export let active = false;
    	let tempActive = true;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MobileNav> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, page = "main");
    	const click_handler_1 = () => $$invalidate(0, page = "products");
    	const click_handler_2 = () => $$invalidate(0, page = "rooms");

    	$$self.$capture_state = () => ({
    		Notification,
    		Button,
    		Icon,
    		src,
    		createEventDispatcher,
    		SearchBar,
    		MobileNavRooms,
    		dispatch,
    		toggleNav,
    		tempActive,
    		page
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("tempActive" in $$props) $$invalidate(3, tempActive = $$props.tempActive);
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	let page;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(0, page = "main");

    	return [
    		page,
    		src,
    		toggleNav,
    		tempActive,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class MobileNav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileNav",
    			options,
    			id: create_fragment$x.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.0 */

    const { console: console_1$1 } = globals;

    function create_fragment$y(ctx) {
    	let headnotification;
    	let t0;
    	let header;
    	let t1;
    	let mobilenav;
    	let t2;
    	let searchbar;
    	let t3;
    	let homepage;
    	let current;

    	headnotification = new HeadNotification({
    			props: {
    				text: "Our Christmas shop is now open",
    				action: "link",
    				href: "#"
    			},
    			$$inline: true
    		});

    	header = new Header({ $$inline: true });
    	header.$on("toggle", /*toggleNav*/ ctx[1]);

    	mobilenav = new MobileNav({
    			props: { active: /*showNav*/ ctx[0] },
    			$$inline: true
    		});

    	mobilenav.$on("toggle", /*toggleNav*/ ctx[1]);

    	searchbar = new SearchBar({
    			props: {
    				placeholder: "What are you looking for?",
    				hover: true
    			},
    			$$inline: true
    		});

    	homepage = new Homepage({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(headnotification.$$.fragment);
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(mobilenav.$$.fragment);
    			t2 = space();
    			create_component(searchbar.$$.fragment);
    			t3 = space();
    			create_component(homepage.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(headnotification, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(mobilenav, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(searchbar, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(homepage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const mobilenav_changes = {};
    			if (dirty & /*showNav*/ 1) mobilenav_changes.active = /*showNav*/ ctx[0];
    			mobilenav.$set(mobilenav_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headnotification.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(mobilenav.$$.fragment, local);
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(homepage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headnotification.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(mobilenav.$$.fragment, local);
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(homepage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(headnotification, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(mobilenav, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(searchbar, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(homepage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$y.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$y($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	console.log("%cLEFT OFF IN MOBILENAVROOMS", `
  background: white;
  border: 3px solid red;
  color: red;
  font-size: 20px;
  margin: 5px;
  padding: 20px;
`);

    	let showNav = true;

    	const toggleNav = e => {
    		$$invalidate(0, showNav = e.detail.show);
    		console.log("click");
    	};

    	if (showNav) {
    		document.body.style.height = "100%";
    		document.body.style.overflow = "hidden";
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		HeadNotification,
    		Header,
    		SearchBar,
    		Homepage,
    		MobileNav,
    		showNav,
    		toggleNav
    	});

    	$$self.$inject_state = $$props => {
    		if ("showNav" in $$props) $$invalidate(0, showNav = $$props.showNav);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showNav, toggleNav];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$y, create_fragment$y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$y.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
