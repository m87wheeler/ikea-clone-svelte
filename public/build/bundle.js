
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
    			add_location(path, file$7, 22, 2, 328);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-1cc7czh");
    			add_location(svg, file$7, 14, 0, 182);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ToggleArrow", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ToggleArrow> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class ToggleArrow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToggleArrow",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<ToggleArrow> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<ToggleArrow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<ToggleArrow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    // (91:34) 
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
    		source: "(91:34) ",
    		ctx
    	});

    	return block;
    }

    // (89:30) 
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
    		source: "(89:30) ",
    		ctx
    	});

    	return block;
    }

    // (87:37) 
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
    		source: "(87:37) ",
    		ctx
    	});

    	return block;
    }

    // (85:31) 
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
    		source: "(85:31) ",
    		ctx
    	});

    	return block;
    }

    // (83:37) 
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
    		source: "(83:37) ",
    		ctx
    	});

    	return block;
    }

    // (81:32) 
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
    		source: "(81:32) ",
    		ctx
    	});

    	return block;
    }

    // (79:38) 
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
    		source: "(79:38) ",
    		ctx
    	});

    	return block;
    }

    // (77:30) 
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
    		source: "(77:30) ",
    		ctx
    	});

    	return block;
    }

    // (75:37) 
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
    		source: "(75:37) ",
    		ctx
    	});

    	return block;
    }

    // (73:4) {#if icon === 'close'}
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
    		source: "(73:4) {#if icon === 'close'}",
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
    			add_location(div0, file$a, 70, 2, 2064);
    			attr_dev(div1, "class", "icon svelte-17m2rzz");
    			add_location(div1, file$a, 71, 2, 2134);
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
    				dispose = listen_dev(div2, "click", /*click_handler*/ ctx[8], false, false, false);
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
    			dispose();
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

    	return [ref, cursor, small, xsmall, icon, hover, style, background, click_handler];
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
    const file$b = "src\\components\\molecules\\HeadNotification.svelte";

    // (78:4) {:else}
    function create_else_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(p, "class", "svelte-1ds6mvc");
    			add_location(p, file$b, 78, 6, 2155);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);
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
    		source: "(78:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (73:4) {#if action}
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
    			t1 = text(/*text*/ ctx[0]);
    			attr_dev(span, "class", "svelte-1ds6mvc");
    			add_location(span, file$b, 75, 8, 2103);
    			attr_dev(a, "href", /*href*/ ctx[2]);
    			attr_dev(a, "class", "svelte-1ds6mvc");
    			add_location(a, file$b, 73, 6, 2024);
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
    			if (!current || dirty & /*text*/ 1) set_data_dev(t1, /*text*/ ctx[0]);

    			if (!current || dirty & /*href*/ 4) {
    				attr_dev(a, "href", /*href*/ ctx[2]);
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
    		source: "(73:4) {#if action}",
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
    		if (/*action*/ ctx[1]) return 0;
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

    	icon.$on("click", /*toggleExpand*/ ctx[5]);

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
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(`icon ${/*expand*/ ctx[4] && "icon--active"}`) + " svelte-1ds6mvc"));
    			add_location(div0, file$b, 80, 4, 2185);
    			attr_dev(div1, "class", "message-section svelte-1ds6mvc");
    			add_location(div1, file$b, 71, 2, 1969);
    			attr_dev(p, "class", "svelte-1ds6mvc");
    			add_location(p, file$b, 89, 4, 2442);
    			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(`dismiss ${/*expand*/ ctx[4] && "dismiss--expand"}`) + " svelte-1ds6mvc"));
    			add_location(div2, file$b, 88, 2, 2382);
    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty(`notification ${/*show*/ ctx[3] && "notification--active"}`) + " svelte-1ds6mvc"));
    			add_location(div3, file$b, 70, 0, 1903);
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

    			if (!current || dirty & /*expand*/ 16 && div0_class_value !== (div0_class_value = "" + (null_to_empty(`icon ${/*expand*/ ctx[4] && "icon--active"}`) + " svelte-1ds6mvc"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty & /*expand*/ 16 && div2_class_value !== (div2_class_value = "" + (null_to_empty(`dismiss ${/*expand*/ ctx[4] && "dismiss--expand"}`) + " svelte-1ds6mvc"))) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (!current || dirty & /*show*/ 8 && div3_class_value !== (div3_class_value = "" + (null_to_empty(`notification ${/*show*/ ctx[3] && "notification--active"}`) + " svelte-1ds6mvc"))) {
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
    	let { action = true } = $$props;
    	let { href = "Homepage" } = $$props;
    	let show = false;
    	let expand = false;
    	const toggleExpand = () => $$invalidate(4, expand = !expand);

    	setTimeout(
    		() => {
    			$$invalidate(3, show = true);
    		},
    		3000
    	);

    	const writable_props = ["text", "action", "href"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<HeadNotification> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(3, show = false);

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("action" in $$props) $$invalidate(1, action = $$props.action);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    	};

    	$$self.$capture_state = () => ({
    		Icon,
    		text,
    		action,
    		href,
    		show,
    		expand,
    		toggleExpand
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("action" in $$props) $$invalidate(1, action = $$props.action);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    		if ("show" in $$props) $$invalidate(3, show = $$props.show);
    		if ("expand" in $$props) $$invalidate(4, expand = $$props.expand);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, action, href, show, expand, toggleExpand, click_handler];
    }

    class HeadNotification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { text: 0, action: 1, href: 2 });

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
    	let mounted;
    	let dispose;

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
    			set_style(img, "cursor", "pointer");
    			attr_dev(img, "class", "svelte-qt98mw");
    			add_location(img, file$c, 24, 2, 639);
    			attr_dev(header, "class", "svelte-qt98mw");
    			add_location(header, file$c, 23, 0, 627);
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

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*setHome*/ ctx[2], false, false, false);
    				mounted = true;
    			}
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
    			mounted = false;
    			dispose();
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
    	const setHome = () => dispatch("sethome", {});
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Icon,
    		src,
    		createEventDispatcher,
    		dispatch,
    		toggleNav,
    		setHome
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, toggleNav, setHome];
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
    	let section;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			section = element("section");
    			if (default_slot) default_slot.c();
    			attr_dev(section, "class", "section svelte-1vk1jem");
    			add_location(section, file$f, 9, 0, 130);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			if (default_slot) {
    				default_slot.m(section, null);
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
    			if (detaching) detach_dev(section);
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
    			attr_dev(hr, "class", "svelte-1l8ad03");
    			add_location(hr, file$g, 13, 0, 226);
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
    	let mounted;
    	let dispose;
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

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
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
    			mounted = false;
    			dispose();
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

    	function click_handler(event) {
    		bubble($$self, event);
    	}

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

    	return [style, ref, shadow, $$scope, slots, click_handler];
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

    const formatPrice = (num, ret) => {
      let currency = { pounds: "", pence: "" };

      if (num - Math.floor(num) === 0) {
        currency.pounds = num;
      } else {
        currency.pounds = Math.floor(num);
        currency.pence = Math.round((num - Math.floor(num)) * 100);
      }

      if (ret === "obj") {
        return currency;
      } else if (ret === "str") {
        return `£${currency.pounds}.${currency.pence}`;
      }
    };

    const formatArtNo = (num) => {
      let str = num.toString();
      let append = "0";
      while (str.length < 8) {
        str = append.concat(str);
      }
      return `${str.slice(0, 3)}.${str.slice(3, 6)}.${str.slice(6, 8)}`;
    };

    /* src\components\molecules\LargeProductCard.svelte generated by Svelte v3.29.0 */
    const file$l = "src\\components\\molecules\\LargeProductCard.svelte";

    // (28:4) <Title type="h2">
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
    		source: "(28:4) <Title type=\\\"h2\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:10)         
    function fallback_block(ctx) {
    	let p;
    	let t_value = formatPrice(/*price*/ ctx[2]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-n5mqsk");
    			add_location(p, file$l, 29, 6, 750);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*price*/ 4 && t_value !== (t_value = formatPrice(/*price*/ ctx[2]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(29:10)         ",
    		ctx
    	});

    	return block;
    }

    // (32:4) <Button style="margin-top: 1.5rem;" secondary>
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
    		source: "(32:4) <Button style=\\\"margin-top: 1.5rem;\\\" secondary>",
    		ctx
    	});

    	return block;
    }

    // (26:0) <Card style="width: 100%; margin-top: -.5rem; background: #f5f5f5;">
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
    			add_location(div, file$l, 26, 2, 669);
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
    		source: "(26:0) <Card style=\\\"width: 100%; margin-top: -.5rem; background: #f5f5f5;\\\">",
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
    		formatPrice,
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

    // (40:2) {#if icon}
    function create_if_block$5(ctx) {
    	let div;
    	let togglearrow;
    	let current;
    	togglearrow = new ToggleArrow({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(togglearrow.$$.fragment);
    			attr_dev(div, "class", "icon svelte-1nrmvsc");
    			add_location(div, file$m, 40, 4, 877);
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
    		source: "(40:2) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let a;
    	let div;
    	let t;
    	let a_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
    	let if_block = /*icon*/ ctx[1] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "text svelte-1nrmvsc");
    			add_location(div, file$m, 36, 2, 815);
    			attr_dev(a, "href", /*href*/ ctx[0]);
    			attr_dev(a, "class", a_class_value = "" + (null_to_empty(`${/*inline*/ ctx[3] ? "inline-link" : "link"}`) + " svelte-1nrmvsc"));
    			attr_dev(a, "style", /*style*/ ctx[2]);
    			add_location(a, file$m, 35, 0, 748);
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
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
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

    			if (!current || dirty & /*inline*/ 8 && a_class_value !== (a_class_value = "" + (null_to_empty(`${/*inline*/ ctx[3] ? "inline-link" : "link"}`) + " svelte-1nrmvsc"))) {
    				attr_dev(a, "class", a_class_value);
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
    	let { inline = false } = $$props;
    	const writable_props = ["href", "icon", "style", "inline"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("inline" in $$props) $$invalidate(3, inline = $$props.inline);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ ToggleArrow, href, icon, style, inline });

    	$$self.$inject_state = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("inline" in $$props) $$invalidate(3, inline = $$props.inline);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [href, icon, style, inline, $$scope, slots];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, { href: 0, icon: 1, style: 2, inline: 3 });

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

    	get inline() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inline(value) {
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

    /* src\components\atoms\Price.svelte generated by Svelte v3.29.0 */
    const file$r = "src\\components\\atoms\\Price.svelte";

    // (31:2) {#if formatted.pence}
    function create_if_block$6(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = `.${/*formatted*/ ctx[1].pence}`;
    			attr_dev(span, "class", "pence svelte-1t8y2h3");
    			add_location(span, file$r, 30, 23, 729);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(31:2) {#if formatted.pence}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let p;
    	let span0;
    	let t1;
    	let span1;
    	let t3;
    	let if_block = /*formatted*/ ctx[1].pence && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			p = element("p");
    			span0 = element("span");
    			span0.textContent = "£";
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = `${/*formatted*/ ctx[1].pounds}`;
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(span0, "class", "currency svelte-1t8y2h3");
    			add_location(span0, file$r, 28, 2, 623);
    			attr_dev(span1, "class", "pounds");
    			add_location(span1, file$r, 29, 2, 658);
    			attr_dev(p, "class", "price svelte-1t8y2h3");
    			toggle_class(p, "price--small", /*small*/ ctx[0]);
    			add_location(p, file$r, 27, 0, 575);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span0);
    			append_dev(p, t1);
    			append_dev(p, span1);
    			append_dev(p, t3);
    			if (if_block) if_block.m(p, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*formatted*/ ctx[1].pence) if_block.p(ctx, dirty);

    			if (dirty & /*small*/ 1) {
    				toggle_class(p, "price--small", /*small*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (if_block) if_block.d();
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
    	validate_slots("Price", slots, []);
    	let { price } = $$props;
    	let { small = false } = $$props;
    	let formatted = formatPrice(price, "obj");
    	const writable_props = ["price", "small"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Price> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("price" in $$props) $$invalidate(2, price = $$props.price);
    		if ("small" in $$props) $$invalidate(0, small = $$props.small);
    	};

    	$$self.$capture_state = () => ({ formatPrice, price, small, formatted });

    	$$self.$inject_state = $$props => {
    		if ("price" in $$props) $$invalidate(2, price = $$props.price);
    		if ("small" in $$props) $$invalidate(0, small = $$props.small);
    		if ("formatted" in $$props) $$invalidate(1, formatted = $$props.formatted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [small, formatted, price];
    }

    class Price extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { price: 2, small: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Price",
    			options,
    			id: create_fragment$r.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*price*/ ctx[2] === undefined && !("price" in props)) {
    			console.warn("<Price> was created without expected prop 'price'");
    		}
    	}

    	get price() {
    		throw new Error("<Price>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<Price>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get small() {
    		throw new Error("<Price>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set small(value) {
    		throw new Error("<Price>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\molecules\ProductCard.svelte generated by Svelte v3.29.0 */
    const file$s = "src\\components\\molecules\\ProductCard.svelte";

    // (69:6) {#if news}
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
    		source: "(69:6) {#if news}",
    		ctx
    	});

    	return block;
    }

    // (72:6) {#if family}
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
    		source: "(72:6) {#if family}",
    		ctx
    	});

    	return block;
    }

    // (79:34) <Title type="h4">
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
    		source: "(79:34) <Title type=\\\"h4\\\">",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if regularPrice}
    function create_if_block_1$2(ctx) {
    	let p;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Regular price £");
    			t1 = text(/*regularPrice*/ ctx[5]);
    			attr_dev(p, "class", "info__reg-price svelte-13giuor");
    			add_location(p, file$s, 81, 6, 2112);
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
    		source: "(81:4) {#if regularPrice}",
    		ctx
    	});

    	return block;
    }

    // (86:6) {#if pieces > 0}
    function create_if_block$7(ctx) {
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
    			attr_dev(span, "class", "svelte-13giuor");
    			add_location(span, file$s, 85, 22, 2261);
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(86:6) {#if pieces > 0}",
    		ctx
    	});

    	return block;
    }

    // (66:0) <Card shadow {style} on:click={viewProduct}>
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
    	let price_1;
    	let t7;
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

    	price_1 = new Price({
    			props: { price: /*price*/ ctx[6] },
    			$$inline: true
    		});

    	let if_block3 = /*pieces*/ ctx[7] > 0 && create_if_block$7(ctx);

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
    			create_component(price_1.$$.fragment);
    			t7 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div0, "class", "info__promotional svelte-13giuor");
    			add_location(div0, file$s, 67, 4, 1723);
    			attr_dev(div1, "class", "info__icon svelte-13giuor");
    			add_location(div1, file$s, 75, 4, 1874);
    			attr_dev(a, "href", /*href*/ ctx[2]);
    			attr_dev(a, "class", "info__title svelte-13giuor");
    			add_location(a, file$s, 78, 4, 1965);
    			attr_dev(p0, "class", "info__subtitle svelte-13giuor");
    			add_location(p0, file$s, 79, 4, 2037);
    			attr_dev(p1, "class", "info__price svelte-13giuor");
    			add_location(p1, file$s, 83, 4, 2189);
    			attr_dev(div2, "class", "info svelte-13giuor");
    			add_location(div2, file$s, 66, 2, 1699);
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
    			mount_component(price_1, p1, null);
    			append_dev(p1, t7);
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

    			if (dirty & /*$$scope, title*/ 4104) {
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

    			const price_1_changes = {};
    			if (dirty & /*price*/ 64) price_1_changes.price = /*price*/ ctx[6];
    			price_1.$set(price_1_changes);

    			if (/*pieces*/ ctx[7] > 0) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$7(ctx);
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
    			transition_in(price_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(icon.$$.fragment, local);
    			transition_out(title_1.$$.fragment, local);
    			transition_out(price_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(icon);
    			destroy_component(title_1);
    			if (if_block2) if_block2.d();
    			destroy_component(price_1);
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(66:0) <Card shadow {style} on:click={viewProduct}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
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

    	card.$on("click", /*viewProduct*/ ctx[9]);

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

    			if (dirty & /*$$scope, pieces, price, regularPrice, productType, href, title, family, news*/ 4351) {
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
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProductCard", slots, []);
    	const dispatch = createEventDispatcher();
    	let { news = false } = $$props;
    	let { family = false } = $$props;
    	let { href = "" } = $$props;
    	let { artno } = $$props;
    	let { title = "" } = $$props;
    	let { productType = "" } = $$props;
    	let { regularPrice = 0 } = $$props;
    	let { price = 0 } = $$props;
    	let { pieces = 0 } = $$props;
    	let { style = "" } = $$props;

    	const viewProduct = () => {
    		dispatch("productview", { artno });
    	};

    	const writable_props = [
    		"news",
    		"family",
    		"href",
    		"artno",
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
    		if ("artno" in $$props) $$invalidate(10, artno = $$props.artno);
    		if ("title" in $$props) $$invalidate(3, title = $$props.title);
    		if ("productType" in $$props) $$invalidate(4, productType = $$props.productType);
    		if ("regularPrice" in $$props) $$invalidate(5, regularPrice = $$props.regularPrice);
    		if ("price" in $$props) $$invalidate(6, price = $$props.price);
    		if ("pieces" in $$props) $$invalidate(7, pieces = $$props.pieces);
    		if ("style" in $$props) $$invalidate(8, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		Card,
    		Family,
    		Icon,
    		News,
    		Price,
    		Title,
    		news,
    		family,
    		href,
    		artno,
    		title,
    		productType,
    		regularPrice,
    		price,
    		pieces,
    		style,
    		viewProduct
    	});

    	$$self.$inject_state = $$props => {
    		if ("news" in $$props) $$invalidate(0, news = $$props.news);
    		if ("family" in $$props) $$invalidate(1, family = $$props.family);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    		if ("artno" in $$props) $$invalidate(10, artno = $$props.artno);
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

    	return [
    		news,
    		family,
    		href,
    		title,
    		productType,
    		regularPrice,
    		price,
    		pieces,
    		style,
    		viewProduct,
    		artno
    	];
    }

    class ProductCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {
    			news: 0,
    			family: 1,
    			href: 2,
    			artno: 10,
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
    			id: create_fragment$s.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*artno*/ ctx[10] === undefined && !("artno" in props)) {
    			console.warn("<ProductCard> was created without expected prop 'artno'");
    		}
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

    	get artno() {
    		throw new Error("<ProductCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set artno(value) {
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
    const file$t = "src\\components\\organisms\\HoverCard.svelte";

    function create_fragment$t(ctx) {
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
    	imagepointer.$on("mouseenter", /*revealCard*/ ctx[13]);

    	productcard = new ProductCard({
    			props: {
    				news: /*news*/ ctx[1],
    				family: /*family*/ ctx[2],
    				href: /*href*/ ctx[3],
    				title: /*title*/ ctx[4],
    				artno: /*artno*/ ctx[5],
    				productType: /*productType*/ ctx[6],
    				regularPrice: /*regularPrice*/ ctx[7],
    				price: /*price*/ ctx[8],
    				pieces: /*pieces*/ ctx[9]
    			},
    			$$inline: true
    		});

    	productcard.$on("productview", /*productview_handler*/ ctx[16]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(imagepointer.$$.fragment);
    			t = space();
    			div1 = element("div");
    			create_component(productcard.$$.fragment);
    			attr_dev(div0, "class", "container__pointer svelte-1rzrjan");
    			attr_dev(div0, "style", div0_style_value = /*layout*/ ctx[12].pointer);
    			add_location(div0, file$t, 106, 2, 3016);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(`container__card ${/*visible*/ ctx[0] && "container__card--visible"}`) + " svelte-1rzrjan"));
    			attr_dev(div1, "style", div1_style_value = /*layout*/ ctx[12].card);
    			add_location(div1, file$t, 109, 2, 3134);
    			attr_dev(div2, "class", "container svelte-1rzrjan");
    			attr_dev(div2, "style", div2_style_value = `top: ${/*y*/ ctx[11]}%; left: ${/*x*/ ctx[10]}%`);
    			add_location(div2, file$t, 102, 0, 2921);
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
    				dispose = listen_dev(div2, "mouseleave", /*hideCard*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*layout*/ 4096 && div0_style_value !== (div0_style_value = /*layout*/ ctx[12].pointer)) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			const productcard_changes = {};
    			if (dirty & /*news*/ 2) productcard_changes.news = /*news*/ ctx[1];
    			if (dirty & /*family*/ 4) productcard_changes.family = /*family*/ ctx[2];
    			if (dirty & /*href*/ 8) productcard_changes.href = /*href*/ ctx[3];
    			if (dirty & /*title*/ 16) productcard_changes.title = /*title*/ ctx[4];
    			if (dirty & /*artno*/ 32) productcard_changes.artno = /*artno*/ ctx[5];
    			if (dirty & /*productType*/ 64) productcard_changes.productType = /*productType*/ ctx[6];
    			if (dirty & /*regularPrice*/ 128) productcard_changes.regularPrice = /*regularPrice*/ ctx[7];
    			if (dirty & /*price*/ 256) productcard_changes.price = /*price*/ ctx[8];
    			if (dirty & /*pieces*/ 512) productcard_changes.pieces = /*pieces*/ ctx[9];
    			productcard.$set(productcard_changes);

    			if (!current || dirty & /*visible*/ 1 && div1_class_value !== (div1_class_value = "" + (null_to_empty(`container__card ${/*visible*/ ctx[0] && "container__card--visible"}`) + " svelte-1rzrjan"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (!current || dirty & /*layout*/ 4096 && div1_style_value !== (div1_style_value = /*layout*/ ctx[12].card)) {
    				attr_dev(div1, "style", div1_style_value);
    			}

    			if (!current || dirty & /*y, x*/ 3072 && div2_style_value !== (div2_style_value = `top: ${/*y*/ ctx[11]}%; left: ${/*x*/ ctx[10]}%`)) {
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
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HoverCard", slots, []);
    	let { news = false } = $$props;
    	let { family = false } = $$props;
    	let { href = "" } = $$props;
    	let { title = "" } = $$props;
    	let { artno } = $$props;
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
    		"artno",
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

    	function productview_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("news" in $$props) $$invalidate(1, news = $$props.news);
    		if ("family" in $$props) $$invalidate(2, family = $$props.family);
    		if ("href" in $$props) $$invalidate(3, href = $$props.href);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    		if ("artno" in $$props) $$invalidate(5, artno = $$props.artno);
    		if ("productType" in $$props) $$invalidate(6, productType = $$props.productType);
    		if ("regularPrice" in $$props) $$invalidate(7, regularPrice = $$props.regularPrice);
    		if ("price" in $$props) $$invalidate(8, price = $$props.price);
    		if ("pieces" in $$props) $$invalidate(9, pieces = $$props.pieces);
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("x" in $$props) $$invalidate(10, x = $$props.x);
    		if ("y" in $$props) $$invalidate(11, y = $$props.y);
    		if ("position" in $$props) $$invalidate(15, position = $$props.position);
    	};

    	$$self.$capture_state = () => ({
    		ImagePointer,
    		ProductCard,
    		news,
    		family,
    		href,
    		title,
    		artno,
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
    		if ("artno" in $$props) $$invalidate(5, artno = $$props.artno);
    		if ("productType" in $$props) $$invalidate(6, productType = $$props.productType);
    		if ("regularPrice" in $$props) $$invalidate(7, regularPrice = $$props.regularPrice);
    		if ("price" in $$props) $$invalidate(8, price = $$props.price);
    		if ("pieces" in $$props) $$invalidate(9, pieces = $$props.pieces);
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    		if ("x" in $$props) $$invalidate(10, x = $$props.x);
    		if ("y" in $$props) $$invalidate(11, y = $$props.y);
    		if ("position" in $$props) $$invalidate(15, position = $$props.position);
    		if ("layout" in $$props) $$invalidate(12, layout = $$props.layout);
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
    		artno,
    		productType,
    		regularPrice,
    		price,
    		pieces,
    		x,
    		y,
    		layout,
    		revealCard,
    		hideCard,
    		position,
    		productview_handler
    	];
    }

    class HoverCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {
    			news: 1,
    			family: 2,
    			href: 3,
    			title: 4,
    			artno: 5,
    			productType: 6,
    			regularPrice: 7,
    			price: 8,
    			pieces: 9,
    			visible: 0,
    			x: 10,
    			y: 11,
    			position: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HoverCard",
    			options,
    			id: create_fragment$t.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*artno*/ ctx[5] === undefined && !("artno" in props)) {
    			console.warn("<HoverCard> was created without expected prop 'artno'");
    		}
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

    	get artno() {
    		throw new Error("<HoverCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set artno(value) {
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
    const file$u = "src\\components\\molecules\\ImageOverlay.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
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
    				: /*product*/ ctx[5].visible,
    				x: /*product*/ ctx[5].x,
    				y: /*product*/ ctx[5].y,
    				position: /*product*/ ctx[5].position,
    				news: /*product*/ ctx[5].news,
    				family: /*product*/ ctx[5].family,
    				title: /*product*/ ctx[5].title,
    				artno: /*product*/ ctx[5].artno,
    				productType: /*product*/ ctx[5].productType,
    				regularPrice: /*product*/ ctx[5].regularPrice,
    				price: /*product*/ ctx[5].price,
    				pieces: /*product*/ ctx[5].pieces
    			},
    			$$inline: true
    		});

    	hovercard.$on("productview", /*productview_handler*/ ctx[2]);

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
    			: /*product*/ ctx[5].visible;

    			if (dirty & /*data*/ 1) hovercard_changes.x = /*product*/ ctx[5].x;
    			if (dirty & /*data*/ 1) hovercard_changes.y = /*product*/ ctx[5].y;
    			if (dirty & /*data*/ 1) hovercard_changes.position = /*product*/ ctx[5].position;
    			if (dirty & /*data*/ 1) hovercard_changes.news = /*product*/ ctx[5].news;
    			if (dirty & /*data*/ 1) hovercard_changes.family = /*product*/ ctx[5].family;
    			if (dirty & /*data*/ 1) hovercard_changes.title = /*product*/ ctx[5].title;
    			if (dirty & /*data*/ 1) hovercard_changes.artno = /*product*/ ctx[5].artno;
    			if (dirty & /*data*/ 1) hovercard_changes.productType = /*product*/ ctx[5].productType;
    			if (dirty & /*data*/ 1) hovercard_changes.regularPrice = /*product*/ ctx[5].regularPrice;
    			if (dirty & /*data*/ 1) hovercard_changes.price = /*product*/ ctx[5].price;
    			if (dirty & /*data*/ 1) hovercard_changes.pieces = /*product*/ ctx[5].pieces;
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

    function create_fragment$u(ctx) {
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
    			add_location(div, file$u, 23, 0, 480);
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
    					listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[3], false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[4], false, false, false)
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
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageOverlay", slots, []);
    	let { data = [] } = $$props;
    	let allHidden = false;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageOverlay> was created with unknown prop '${key}'`);
    	});

    	function productview_handler(event) {
    		bubble($$self, event);
    	}

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

    	return [data, allHidden, productview_handler, mouseenter_handler, mouseleave_handler];
    }

    class ImageOverlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$u, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageOverlay",
    			options,
    			id: create_fragment$u.name
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
    const file$v = "src\\components\\organisms\\Slideshow.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (151:35) 
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

    	let if_block = /*maxOnLoad*/ ctx[8] < /*data*/ ctx[0].length && create_if_block_3$3(ctx);

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
    			if (dirty & /*data, maxOnLoad*/ 257) {
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

    			if (/*maxOnLoad*/ ctx[8] < /*data*/ ctx[0].length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*maxOnLoad, data*/ 257) {
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
    		source: "(151:35) ",
    		ctx
    	});

    	return block;
    }

    // (143:6) {#if type === 'images'}
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
    			if (dirty & /*data, imageOnly*/ 9) {
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
    		source: "(143:6) {#if type === 'images'}",
    		ctx
    	});

    	return block;
    }

    // (153:10) {#if i < maxOnLoad}
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
    			attr_dev(div, "class", "btn-container svelte-bzitdd");
    			add_location(div, file$v, 153, 12, 4005);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope, data*/ 8388609) {
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
    		source: "(153:10) {#if i < maxOnLoad}",
    		ctx
    	});

    	return block;
    }

    // (155:14) <Button tertiary small>
    function create_default_slot_2$1(ctx) {
    	let t_value = /*button*/ ctx[20].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*button*/ ctx[20].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(155:14) <Button tertiary small>",
    		ctx
    	});

    	return block;
    }

    // (152:8) {#each data as button, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*i*/ ctx[22] < /*maxOnLoad*/ ctx[8] && create_if_block_4$2(ctx);

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
    			if (/*i*/ ctx[22] < /*maxOnLoad*/ ctx[8]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*maxOnLoad*/ 256) {
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
    		source: "(152:8) {#each data as button, i}",
    		ctx
    	});

    	return block;
    }

    // (159:8) {#if maxOnLoad < data.length}
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

    	button.$on("click", /*click_handler*/ ctx[13]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "btn-container svelte-bzitdd");
    			add_location(div, file$v, 159, 10, 4198);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope, data, maxOnLoad*/ 8388865) {
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
    		source: "(159:8) {#if maxOnLoad < data.length}",
    		ctx
    	});

    	return block;
    }

    // (161:12) <Button tertiary small on:click={() => (maxOnLoad = data.length)}>
    function create_default_slot_1$3(ctx) {
    	let t_value = `${/*data*/ ctx[0].length - /*maxOnLoad*/ ctx[8]}+ more` + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data, maxOnLoad*/ 257 && t_value !== (t_value = `${/*data*/ ctx[0].length - /*maxOnLoad*/ ctx[8]}+ more` + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(161:12) <Button tertiary small on:click={() => (maxOnLoad = data.length)}>",
    		ctx
    	});

    	return block;
    }

    // (147:14) <Button tertiary>
    function create_default_slot$4(ctx) {
    	let t_value = /*image*/ ctx[17].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*image*/ ctx[17].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(147:14) <Button tertiary>",
    		ctx
    	});

    	return block;
    }

    // (144:8) {#each data as image}
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
    			attr_dev(div0, "class", "image__btn svelte-bzitdd");
    			toggle_class(div0, "image__btn--hide", /*imageOnly*/ ctx[3]);
    			add_location(div0, file$v, 145, 12, 3720);
    			attr_dev(div1, "class", "image svelte-bzitdd");
    			attr_dev(div1, "style", div1_style_value = `background-image: url(${/*image*/ ctx[17].src})`);
    			add_location(div1, file$v, 144, 10, 3641);
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

    			if (dirty & /*$$scope, data*/ 8388609) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);

    			if (dirty & /*imageOnly*/ 8) {
    				toggle_class(div0, "image__btn--hide", /*imageOnly*/ ctx[3]);
    			}

    			if (!current || dirty & /*data*/ 1 && div1_style_value !== (div1_style_value = `background-image: url(${/*image*/ ctx[17].src})`)) {
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
    		source: "(144:8) {#each data as image}",
    		ctx
    	});

    	return block;
    }

    // (170:4) {#if !noSlider}
    function create_if_block$8(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "slider svelte-bzitdd");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", /*min*/ ctx[4]);
    			attr_dev(input, "max", /*max*/ ctx[5]);
    			attr_dev(input, "step", /*step*/ ctx[6]);
    			add_location(input, file$v, 170, 6, 4504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*scrolled*/ ctx[9]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[15]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[15]),
    					listen_dev(input, "input", /*handleSlider*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*min*/ 16) {
    				attr_dev(input, "min", /*min*/ ctx[4]);
    			}

    			if (dirty & /*max*/ 32) {
    				attr_dev(input, "max", /*max*/ ctx[5]);
    			}

    			if (dirty & /*step*/ 64) {
    				attr_dev(input, "step", /*step*/ ctx[6]);
    			}

    			if (dirty & /*scrolled*/ 512) {
    				set_input_value(input, /*scrolled*/ ctx[9]);
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
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(170:4) {#if !noSlider}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$v(ctx) {
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

    	let if_block1 = !/*noSlider*/ ctx[2] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			div2 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "image-rail__container svelte-bzitdd");
    			add_location(div0, file$v, 141, 4, 3532);
    			attr_dev(div1, "class", "image-rail svelte-bzitdd");
    			add_location(div1, file$v, 140, 2, 3460);
    			attr_dev(div2, "class", "indicator svelte-bzitdd");
    			add_location(div2, file$v, 168, 2, 4452);
    			attr_dev(div3, "class", "slideshow svelte-bzitdd");
    			toggle_class(div3, "slideshow--images", /*type*/ ctx[1] === "images");
    			toggle_class(div3, "slideshow--buttons", /*type*/ ctx[1] === "buttons");
    			add_location(div3, file$v, 136, 0, 3334);
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

    			/*div1_binding*/ ctx[14](div1);
    			append_dev(div3, t);
    			append_dev(div3, div2);
    			if (if_block1) if_block1.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "scroll", /*handleScroll*/ ctx[10], false, false, false);
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
    					if_block1 = create_if_block$8(ctx);
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

    			/*div1_binding*/ ctx[14](null);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
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
    	validate_slots("Slideshow", slots, []);
    	let { data = [] } = $$props;
    	let { type = "images" } = $$props;
    	let { showMax = data.length || 0 } = $$props;
    	let { noSlider = false } = $$props;
    	let { imageOnly = false } = $$props;
    	let rail;
    	let selected = false;
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { step = 0.5 } = $$props;

    	const handleScroll = e => {
    		let v = e.target.offsetWidth,
    			w = e.target.scrollWidth,
    			s = e.target.scrollLeft,
    			x = s / (w - v) * 100;

    		if (x.toFixed(1) - Math.floor(x) === 0 || x.toFixed(1) - Math.floor(x) >= 0.25 && x.toFixed(1) - Math.floor(x) < 0.75) {
    			$$invalidate(9, scrolled = x.toFixed(1));
    		} else if (x.toFixed(1) - Math.floor(x) < 0.25) {
    			$$invalidate(9, scrolled = Math.floor(x));
    		} else {
    			$$invalidate(9, scrolled = Math.ceil(x));
    		}
    	};

    	const handleSlider = () => {
    		let step = (rail.scrollWidth - rail.offsetWidth) / 100;
    		let x = scrolled * step;
    		$$invalidate(7, rail.scrollLeft = x, rail);
    	};

    	const writable_props = ["data", "type", "showMax", "noSlider", "imageOnly", "min", "max", "step"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Slideshow> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(8, maxOnLoad = data.length);

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rail = $$value;
    			$$invalidate(7, rail);
    		});
    	}

    	function input_change_input_handler() {
    		scrolled = to_number(this.value);
    		$$invalidate(9, scrolled);
    	}

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("showMax" in $$props) $$invalidate(12, showMax = $$props.showMax);
    		if ("noSlider" in $$props) $$invalidate(2, noSlider = $$props.noSlider);
    		if ("imageOnly" in $$props) $$invalidate(3, imageOnly = $$props.imageOnly);
    		if ("min" in $$props) $$invalidate(4, min = $$props.min);
    		if ("max" in $$props) $$invalidate(5, max = $$props.max);
    		if ("step" in $$props) $$invalidate(6, step = $$props.step);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		data,
    		type,
    		showMax,
    		noSlider,
    		imageOnly,
    		rail,
    		selected,
    		min,
    		max,
    		step,
    		handleScroll,
    		handleSlider,
    		maxOnLoad,
    		scrolled
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("showMax" in $$props) $$invalidate(12, showMax = $$props.showMax);
    		if ("noSlider" in $$props) $$invalidate(2, noSlider = $$props.noSlider);
    		if ("imageOnly" in $$props) $$invalidate(3, imageOnly = $$props.imageOnly);
    		if ("rail" in $$props) $$invalidate(7, rail = $$props.rail);
    		if ("selected" in $$props) selected = $$props.selected;
    		if ("min" in $$props) $$invalidate(4, min = $$props.min);
    		if ("max" in $$props) $$invalidate(5, max = $$props.max);
    		if ("step" in $$props) $$invalidate(6, step = $$props.step);
    		if ("maxOnLoad" in $$props) $$invalidate(8, maxOnLoad = $$props.maxOnLoad);
    		if ("scrolled" in $$props) $$invalidate(9, scrolled = $$props.scrolled);
    	};

    	let maxOnLoad;
    	let scrolled;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*showMax*/ 4096) {
    			 $$invalidate(8, maxOnLoad = showMax);
    		}
    	};

    	 $$invalidate(9, scrolled = 0);

    	return [
    		data,
    		type,
    		noSlider,
    		imageOnly,
    		min,
    		max,
    		step,
    		rail,
    		maxOnLoad,
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

    		init(this, options, instance$v, create_fragment$v, safe_not_equal, {
    			data: 0,
    			type: 1,
    			showMax: 12,
    			noSlider: 2,
    			imageOnly: 3,
    			min: 4,
    			max: 5,
    			step: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slideshow",
    			options,
    			id: create_fragment$v.name
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

    	get imageOnly() {
    		throw new Error("<Slideshow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imageOnly(value) {
    		throw new Error("<Slideshow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Slideshow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Slideshow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Slideshow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Slideshow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<Slideshow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
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
          artno: 90476908,
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
          artno: 90478238,
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
          artno: 30474196,
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
          artno: 70476872,
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
          artno: 90475174,
          productType: "Decoration, bauble",
          regularPrice: null,
          price: 5,
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
          artno: 50475717,
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
          artno: 475855,
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
    const file$w = "src\\components\\views\\Homepage.svelte";

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

    			if (dirty & /*$$scope*/ 4) {
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

    			if (dirty & /*$$scope*/ 4) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const imagecard_changes = {};

    			if (dirty & /*$$scope*/ 4) {
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
    			add_location(br, file$w, 31, 42, 1210);
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

    			if (dirty & /*$$scope*/ 4) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 4) {
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
    			add_location(p, file$w, 34, 2, 1288);
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

    			if (dirty & /*$$scope*/ 4) {
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

    	imageoverlay.$on("productview", /*productview_handler*/ ctx[0]);

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

    	imageoverlay.$on("productview", /*productview_handler_1*/ ctx[1]);

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

    			if (dirty & /*$$scope*/ 4) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const sectiontext_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				sectiontext_changes.$$scope = { dirty, ctx };
    			}

    			sectiontext.$set(sectiontext_changes);
    			const imagecard0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				imagecard0_changes.$$scope = { dirty, ctx };
    			}

    			imagecard0.$set(imagecard0_changes);
    			const imagecard1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				imagecard1_changes.$$scope = { dirty, ctx };
    			}

    			imagecard1.$set(imagecard1_changes);
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 4) {
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
    			add_location(p0, file$w, 60, 4, 2217);
    			set_style(p1, "margin-bottom", "0.625rem");
    			set_style(p1, "font-size", "0.875rem");
    			set_style(p1, "line-height", "1.7142");
    			add_location(p1, file$w, 68, 4, 2373);
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

    			if (dirty & /*$$scope*/ 4) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const largeproductcard_changes = {};

    			if (dirty & /*$$scope*/ 4) {
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

    			if (dirty & /*$$scope*/ 4) {
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
    			add_location(p, file$w, 84, 2, 2830);
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

    			if (dirty & /*$$scope*/ 4) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 4) {
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
    			add_location(p0, file$w, 91, 2, 3017);
    			add_location(p1, file$w, 93, 2, 3093);
    			add_location(p2, file$w, 97, 2, 3221);
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

    			if (dirty & /*$$scope*/ 4) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button2_changes = {};

    			if (dirty & /*$$scope*/ 4) {
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
    			add_location(a0, file$w, 107, 4, 3601);
    			attr_dev(a1, "href", "/");
    			add_location(a1, file$w, 109, 4, 3672);
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$w, 110, 4, 3712);
    			attr_dev(a3, "href", "/");
    			add_location(a3, file$w, 111, 4, 3743);
    			attr_dev(a4, "href", "/");
    			add_location(a4, file$w, 112, 4, 3771);
    			attr_dev(a5, "href", "/");
    			add_location(a5, file$w, 113, 4, 3802);
    			attr_dev(a6, "href", "/");
    			add_location(a6, file$w, 114, 4, 3831);
    			attr_dev(a7, "href", "/");
    			add_location(a7, file$w, 115, 4, 3862);
    			add_location(p, file$w, 102, 2, 3332);
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

    			if (dirty & /*$$scope*/ 4) {
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

    			if (dirty & /*$$scope*/ 4) {
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

    function create_fragment$w(ctx) {
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

    			if (dirty & /*$$scope*/ 4) {
    				section0_changes.$$scope = { dirty, ctx };
    			}

    			section0.$set(section0_changes);
    			const section1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section1_changes.$$scope = { dirty, ctx };
    			}

    			section1.$set(section1_changes);
    			const section2_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section2_changes.$$scope = { dirty, ctx };
    			}

    			section2.$set(section2_changes);
    			const section3_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section3_changes.$$scope = { dirty, ctx };
    			}

    			section3.$set(section3_changes);
    			const section4_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section4_changes.$$scope = { dirty, ctx };
    			}

    			section4.$set(section4_changes);
    			const section5_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section5_changes.$$scope = { dirty, ctx };
    			}

    			section5.$set(section5_changes);
    			const section6_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section6_changes.$$scope = { dirty, ctx };
    			}

    			section6.$set(section6_changes);
    			const section7_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section7_changes.$$scope = { dirty, ctx };
    			}

    			section7.$set(section7_changes);
    			const section8_changes = {};

    			if (dirty & /*$$scope*/ 4) {
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
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Homepage", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Homepage> was created with unknown prop '${key}'`);
    	});

    	function productview_handler(event) {
    		bubble($$self, event);
    	}

    	function productview_handler_1(event) {
    		bubble($$self, event);
    	}

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

    	return [productview_handler, productview_handler_1];
    }

    class Homepage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Homepage",
    			options,
    			id: create_fragment$w.name
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

    /* src\components\nav\MobileNavRooms.svelte generated by Svelte v3.29.0 */
    const file$x = "src\\components\\nav\\MobileNavRooms.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (27:0) <Title type="h2" style="padding-left: 1rem;">
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
    		source: "(27:0) <Title type=\\\"h2\\\" style=\\\"padding-left: 1rem;\\\">",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#each rooms as room}
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
    			attr_dev(img, "class", "svelte-wvqhak");
    			add_location(img, file$x, 30, 6, 702);
    			attr_dev(p, "class", "svelte-wvqhak");
    			add_location(p, file$x, 31, 6, 748);
    			attr_dev(div, "class", "room svelte-wvqhak");
    			add_location(div, file$x, 29, 4, 676);
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
    		source: "(29:2) {#each rooms as room}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$x(ctx) {
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

    			attr_dev(div, "class", "container svelte-wvqhak");
    			add_location(div, file$x, 27, 0, 622);
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
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$x, create_fragment$x, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileNavRooms",
    			options,
    			id: create_fragment$x.name
    		});
    	}
    }

    /* src\components\nav\MobileNavProducts.svelte generated by Svelte v3.29.0 */
    const file$y = "src\\components\\nav\\MobileNavProducts.svelte";

    // (50:0) <Title type="h2" style="padding-left: 1rem;">
    function create_default_slot$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Products");
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
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(50:0) <Title type=\\\"h2\\\" style=\\\"padding-left: 1rem;\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$y(ctx) {
    	let title;
    	let t0;
    	let div2;
    	let ul0;
    	let li0;
    	let a0;
    	let t2;
    	let li1;
    	let a1;
    	let t4;
    	let li2;
    	let a2;
    	let t6;
    	let ul1;
    	let li3;
    	let a3;
    	let t8;
    	let li4;
    	let a4;
    	let t10;
    	let li5;
    	let a5;
    	let t12;
    	let li6;
    	let a6;
    	let t14;
    	let li7;
    	let a7;
    	let t16;
    	let li8;
    	let a8;
    	let t18;
    	let li9;
    	let a9;
    	let t20;
    	let li10;
    	let a10;
    	let t22;
    	let li11;
    	let a11;
    	let t24;
    	let li12;
    	let a12;
    	let t26;
    	let li13;
    	let a13;
    	let t28;
    	let li14;
    	let a14;
    	let t30;
    	let li15;
    	let t31;
    	let li15_class_value;
    	let t32;
    	let li16;
    	let a15;
    	let li16_class_value;
    	let t34;
    	let li17;
    	let a16;
    	let li17_class_value;
    	let t36;
    	let li18;
    	let a17;
    	let li18_class_value;
    	let t38;
    	let li19;
    	let a18;
    	let li19_class_value;
    	let t40;
    	let li20;
    	let a19;
    	let li20_class_value;
    	let t42;
    	let li21;
    	let a20;
    	let li21_class_value;
    	let t44;
    	let li22;
    	let a21;
    	let li22_class_value;
    	let t46;
    	let li23;
    	let a22;
    	let li23_class_value;
    	let t48;
    	let li24;
    	let a23;
    	let li24_class_value;
    	let t50;
    	let li25;
    	let a24;
    	let li25_class_value;
    	let t52;
    	let li26;
    	let a25;
    	let li26_class_value;
    	let t54;
    	let div1;
    	let p;
    	let t56;
    	let div0;
    	let img;
    	let img_src_value;
    	let current;
    	let mounted;
    	let dispose;

    	title = new Title({
    			props: {
    				type: "h2",
    				style: "padding-left: 1rem;",
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			ul0 = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "New Products";
    			t2 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "New Lower Price";
    			t4 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Everyday Essentials";
    			t6 = space();
    			ul1 = element("ul");
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Christmas";
    			t8 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "Decoration";
    			t10 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "Furniture";
    			t12 = space();
    			li6 = element("li");
    			a6 = element("a");
    			a6.textContent = "Cookware & tableware";
    			t14 = space();
    			li7 = element("li");
    			a7 = element("a");
    			a7.textContent = "Storage & organisation";
    			t16 = space();
    			li8 = element("li");
    			a8 = element("a");
    			a8.textContent = "Kitchen & appliances";
    			t18 = space();
    			li9 = element("li");
    			a9 = element("a");
    			a9.textContent = "Home furnishing & accessories";
    			t20 = space();
    			li10 = element("li");
    			a10 = element("a");
    			a10.textContent = "Lighting";
    			t22 = space();
    			li11 = element("li");
    			a11 = element("a");
    			a11.textContent = "Textiles";
    			t24 = space();
    			li12 = element("li");
    			a12 = element("a");
    			a12.textContent = "Rugs, mats & flooring";
    			t26 = space();
    			li13 = element("li");
    			a13 = element("a");
    			a13.textContent = "Beds & mattresses";
    			t28 = space();
    			li14 = element("li");
    			a14 = element("a");
    			a14.textContent = "Plants & plant pots";
    			t30 = space();
    			li15 = element("li");
    			t31 = text("More");
    			t32 = space();
    			li16 = element("li");
    			a15 = element("a");
    			a15.textContent = "Baby & children";
    			t34 = space();
    			li17 = element("li");
    			a16 = element("a");
    			a16.textContent = "Bathroom products";
    			t36 = space();
    			li18 = element("li");
    			a17 = element("a");
    			a17.textContent = "Home electronics";
    			t38 = space();
    			li19 = element("li");
    			a18 = element("a");
    			a18.textContent = "Home Smart";
    			t40 = space();
    			li20 = element("li");
    			a19 = element("a");
    			a19.textContent = "Outdoor products";
    			t42 = space();
    			li21 = element("li");
    			a20 = element("a");
    			a20.textContent = "Summer";
    			t44 = space();
    			li22 = element("li");
    			a21 = element("a");
    			a21.textContent = "Laundry & cleaning";
    			t46 = space();
    			li23 = element("li");
    			a22 = element("a");
    			a22.textContent = "Home improvement";
    			t48 = space();
    			li24 = element("li");
    			a23 = element("a");
    			a23.textContent = "Safety products";
    			t50 = space();
    			li25 = element("li");
    			a24 = element("a");
    			a24.textContent = "Leisure & travel";
    			t52 = space();
    			li26 = element("li");
    			a25 = element("a");
    			a25.textContent = "Food & beverages";
    			t54 = space();
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Recently Viewed";
    			t56 = space();
    			div0 = element("div");
    			img = element("img");
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-17ipun1");
    			add_location(a0, file$y, 52, 8, 1112);
    			attr_dev(li0, "class", "svelte-17ipun1");
    			add_location(li0, file$y, 52, 4, 1108);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-17ipun1");
    			add_location(a1, file$y, 53, 8, 1155);
    			attr_dev(li1, "class", "svelte-17ipun1");
    			add_location(li1, file$y, 53, 4, 1151);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "class", "svelte-17ipun1");
    			add_location(a2, file$y, 54, 8, 1201);
    			attr_dev(li2, "class", "svelte-17ipun1");
    			add_location(li2, file$y, 54, 4, 1197);
    			attr_dev(ul0, "class", "svelte-17ipun1");
    			add_location(ul0, file$y, 51, 2, 1098);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "svelte-17ipun1");
    			add_location(a3, file$y, 57, 8, 1268);
    			attr_dev(li3, "class", "svelte-17ipun1");
    			add_location(li3, file$y, 57, 4, 1264);
    			attr_dev(a4, "href", "/");
    			attr_dev(a4, "class", "svelte-17ipun1");
    			add_location(a4, file$y, 58, 8, 1308);
    			attr_dev(li4, "class", "svelte-17ipun1");
    			add_location(li4, file$y, 58, 4, 1304);
    			attr_dev(a5, "href", "/");
    			attr_dev(a5, "class", "svelte-17ipun1");
    			add_location(a5, file$y, 59, 8, 1349);
    			attr_dev(li5, "class", "svelte-17ipun1");
    			add_location(li5, file$y, 59, 4, 1345);
    			attr_dev(a6, "href", "/");
    			attr_dev(a6, "class", "svelte-17ipun1");
    			add_location(a6, file$y, 60, 8, 1389);
    			attr_dev(li6, "class", "svelte-17ipun1");
    			add_location(li6, file$y, 60, 4, 1385);
    			attr_dev(a7, "href", "/");
    			attr_dev(a7, "class", "svelte-17ipun1");
    			add_location(a7, file$y, 61, 8, 1440);
    			attr_dev(li7, "class", "svelte-17ipun1");
    			add_location(li7, file$y, 61, 4, 1436);
    			attr_dev(a8, "href", "/");
    			attr_dev(a8, "class", "svelte-17ipun1");
    			add_location(a8, file$y, 62, 8, 1493);
    			attr_dev(li8, "class", "svelte-17ipun1");
    			add_location(li8, file$y, 62, 4, 1489);
    			attr_dev(a9, "href", "/");
    			attr_dev(a9, "class", "svelte-17ipun1");
    			add_location(a9, file$y, 63, 8, 1544);
    			attr_dev(li9, "class", "svelte-17ipun1");
    			add_location(li9, file$y, 63, 4, 1540);
    			attr_dev(a10, "href", "/");
    			attr_dev(a10, "class", "svelte-17ipun1");
    			add_location(a10, file$y, 64, 8, 1604);
    			attr_dev(li10, "class", "svelte-17ipun1");
    			add_location(li10, file$y, 64, 4, 1600);
    			attr_dev(a11, "href", "/");
    			attr_dev(a11, "class", "svelte-17ipun1");
    			add_location(a11, file$y, 65, 8, 1643);
    			attr_dev(li11, "class", "svelte-17ipun1");
    			add_location(li11, file$y, 65, 4, 1639);
    			attr_dev(a12, "href", "/");
    			attr_dev(a12, "class", "svelte-17ipun1");
    			add_location(a12, file$y, 66, 8, 1682);
    			attr_dev(li12, "class", "svelte-17ipun1");
    			add_location(li12, file$y, 66, 4, 1678);
    			attr_dev(a13, "href", "/");
    			attr_dev(a13, "class", "svelte-17ipun1");
    			add_location(a13, file$y, 67, 8, 1734);
    			attr_dev(li13, "class", "svelte-17ipun1");
    			add_location(li13, file$y, 67, 4, 1730);
    			attr_dev(a14, "href", "/");
    			attr_dev(a14, "class", "svelte-17ipun1");
    			add_location(a14, file$y, 68, 8, 1782);
    			attr_dev(li14, "class", "svelte-17ipun1");
    			add_location(li14, file$y, 68, 4, 1778);
    			attr_dev(li15, "class", li15_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] ? "show-more" : "hidden"}`) + " svelte-17ipun1"));
    			set_style(li15, "text-decoration", "underline");
    			add_location(li15, file$y, 69, 4, 1828);
    			attr_dev(a15, "href", "/");
    			attr_dev(a15, "class", "svelte-17ipun1");
    			add_location(a15, file$y, 75, 41, 2034);
    			attr_dev(li16, "class", li16_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li16, file$y, 75, 4, 1997);
    			attr_dev(a16, "href", "/");
    			attr_dev(a16, "class", "svelte-17ipun1");
    			add_location(a16, file$y, 76, 41, 2113);
    			attr_dev(li17, "class", li17_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li17, file$y, 76, 4, 2076);
    			attr_dev(a17, "href", "/");
    			attr_dev(a17, "class", "svelte-17ipun1");
    			add_location(a17, file$y, 77, 41, 2194);
    			attr_dev(li18, "class", li18_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li18, file$y, 77, 4, 2157);
    			attr_dev(a18, "href", "/");
    			attr_dev(a18, "class", "svelte-17ipun1");
    			add_location(a18, file$y, 78, 41, 2274);
    			attr_dev(li19, "class", li19_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li19, file$y, 78, 4, 2237);
    			attr_dev(a19, "href", "/");
    			attr_dev(a19, "class", "svelte-17ipun1");
    			add_location(a19, file$y, 79, 41, 2348);
    			attr_dev(li20, "class", li20_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li20, file$y, 79, 4, 2311);
    			attr_dev(a20, "href", "/");
    			attr_dev(a20, "class", "svelte-17ipun1");
    			add_location(a20, file$y, 80, 41, 2428);
    			attr_dev(li21, "class", li21_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li21, file$y, 80, 4, 2391);
    			attr_dev(a21, "href", "/");
    			attr_dev(a21, "class", "svelte-17ipun1");
    			add_location(a21, file$y, 81, 41, 2498);
    			attr_dev(li22, "class", li22_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li22, file$y, 81, 4, 2461);
    			attr_dev(a22, "href", "/");
    			attr_dev(a22, "class", "svelte-17ipun1");
    			add_location(a22, file$y, 82, 41, 2580);
    			attr_dev(li23, "class", li23_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li23, file$y, 82, 4, 2543);
    			attr_dev(a23, "href", "/");
    			attr_dev(a23, "class", "svelte-17ipun1");
    			add_location(a23, file$y, 83, 41, 2660);
    			attr_dev(li24, "class", li24_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li24, file$y, 83, 4, 2623);
    			attr_dev(a24, "href", "/");
    			attr_dev(a24, "class", "svelte-17ipun1");
    			add_location(a24, file$y, 84, 41, 2739);
    			attr_dev(li25, "class", li25_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li25, file$y, 84, 4, 2702);
    			attr_dev(a25, "href", "/");
    			attr_dev(a25, "class", "svelte-17ipun1");
    			add_location(a25, file$y, 85, 41, 2819);
    			attr_dev(li26, "class", li26_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"));
    			add_location(li26, file$y, 85, 4, 2782);
    			attr_dev(ul1, "class", "svelte-17ipun1");
    			add_location(ul1, file$y, 56, 2, 1254);
    			attr_dev(p, "class", "svelte-17ipun1");
    			add_location(p, file$y, 88, 4, 2895);
    			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "recent product");
    			attr_dev(img, "class", "svelte-17ipun1");
    			add_location(img, file$y, 89, 32, 2951);
    			attr_dev(div0, "class", "recent__images svelte-17ipun1");
    			add_location(div0, file$y, 89, 4, 2923);
    			attr_dev(div1, "class", "recent svelte-17ipun1");
    			add_location(div1, file$y, 87, 2, 2869);
    			attr_dev(div2, "class", "container svelte-17ipun1");
    			add_location(div2, file$y, 50, 0, 1071);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, a0);
    			append_dev(ul0, t2);
    			append_dev(ul0, li1);
    			append_dev(li1, a1);
    			append_dev(ul0, t4);
    			append_dev(ul0, li2);
    			append_dev(li2, a2);
    			append_dev(div2, t6);
    			append_dev(div2, ul1);
    			append_dev(ul1, li3);
    			append_dev(li3, a3);
    			append_dev(ul1, t8);
    			append_dev(ul1, li4);
    			append_dev(li4, a4);
    			append_dev(ul1, t10);
    			append_dev(ul1, li5);
    			append_dev(li5, a5);
    			append_dev(ul1, t12);
    			append_dev(ul1, li6);
    			append_dev(li6, a6);
    			append_dev(ul1, t14);
    			append_dev(ul1, li7);
    			append_dev(li7, a7);
    			append_dev(ul1, t16);
    			append_dev(ul1, li8);
    			append_dev(li8, a8);
    			append_dev(ul1, t18);
    			append_dev(ul1, li9);
    			append_dev(li9, a9);
    			append_dev(ul1, t20);
    			append_dev(ul1, li10);
    			append_dev(li10, a10);
    			append_dev(ul1, t22);
    			append_dev(ul1, li11);
    			append_dev(li11, a11);
    			append_dev(ul1, t24);
    			append_dev(ul1, li12);
    			append_dev(li12, a12);
    			append_dev(ul1, t26);
    			append_dev(ul1, li13);
    			append_dev(li13, a13);
    			append_dev(ul1, t28);
    			append_dev(ul1, li14);
    			append_dev(li14, a14);
    			append_dev(ul1, t30);
    			append_dev(ul1, li15);
    			append_dev(li15, t31);
    			append_dev(ul1, t32);
    			append_dev(ul1, li16);
    			append_dev(li16, a15);
    			append_dev(ul1, t34);
    			append_dev(ul1, li17);
    			append_dev(li17, a16);
    			append_dev(ul1, t36);
    			append_dev(ul1, li18);
    			append_dev(li18, a17);
    			append_dev(ul1, t38);
    			append_dev(ul1, li19);
    			append_dev(li19, a18);
    			append_dev(ul1, t40);
    			append_dev(ul1, li20);
    			append_dev(li20, a19);
    			append_dev(ul1, t42);
    			append_dev(ul1, li21);
    			append_dev(li21, a20);
    			append_dev(ul1, t44);
    			append_dev(ul1, li22);
    			append_dev(li22, a21);
    			append_dev(ul1, t46);
    			append_dev(ul1, li23);
    			append_dev(li23, a22);
    			append_dev(ul1, t48);
    			append_dev(ul1, li24);
    			append_dev(li24, a23);
    			append_dev(ul1, t50);
    			append_dev(ul1, li25);
    			append_dev(li25, a24);
    			append_dev(ul1, t52);
    			append_dev(ul1, li26);
    			append_dev(li26, a25);
    			append_dev(div2, t54);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(div1, t56);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(li15, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);

    			if (!current || dirty & /*unhide*/ 1 && li15_class_value !== (li15_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] ? "show-more" : "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li15, "class", li15_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li16_class_value !== (li16_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li16, "class", li16_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li17_class_value !== (li17_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li17, "class", li17_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li18_class_value !== (li18_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li18, "class", li18_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li19_class_value !== (li19_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li19, "class", li19_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li20_class_value !== (li20_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li20, "class", li20_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li21_class_value !== (li21_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li21, "class", li21_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li22_class_value !== (li22_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li22, "class", li22_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li23_class_value !== (li23_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li23, "class", li23_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li24_class_value !== (li24_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li24, "class", li24_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li25_class_value !== (li25_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li25, "class", li25_class_value);
    			}

    			if (!current || dirty & /*unhide*/ 1 && li26_class_value !== (li26_class_value = "" + (null_to_empty(`${!/*unhide*/ ctx[0] && "hidden"}`) + " svelte-17ipun1"))) {
    				attr_dev(li26, "class", li26_class_value);
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
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
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
    	validate_slots("MobileNavProducts", slots, []);
    	let src = "/images/photos/fabrikoer-glass-door-cabinet.webp";
    	let unhide = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MobileNavProducts> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, unhide = true);
    	$$self.$capture_state = () => ({ Title, src, unhide });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("unhide" in $$props) $$invalidate(0, unhide = $$props.unhide);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [unhide, src, click_handler];
    }

    class MobileNavProducts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$y, create_fragment$y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileNavProducts",
    			options,
    			id: create_fragment$y.name
    		});
    	}
    }

    /* src\components\nav\MobileNav.svelte generated by Svelte v3.29.0 */
    const file$z = "src\\components\\nav\\MobileNav.svelte";

    // (92:2) {:else}
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
    	icon1.$on("click", /*toggleNav*/ ctx[3]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon0.$$.fragment);
    			t0 = space();
    			create_component(searchbar.$$.fragment);
    			t1 = space();
    			create_component(icon1.$$.fragment);
    			attr_dev(div, "class", "nav__search svelte-gz1fjn");
    			add_location(div, file$z, 92, 4, 2427);
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
    		source: "(92:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (87:2) {#if page === 'main'}
    function create_if_block_3$4(ctx) {
    	let div;
    	let a;
    	let img;
    	let img_src_value;
    	let t;
    	let icon;
    	let current;
    	icon = new Icon({ props: { icon: "close" }, $$inline: true });
    	icon.$on("click", /*toggleNav*/ ctx[3]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			img = element("img");
    			t = space();
    			create_component(icon.$$.fragment);
    			if (img.src !== (img_src_value = /*src*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "IKEA Logo");
    			attr_dev(img, "class", "svelte-gz1fjn");
    			add_location(img, file$z, 88, 18, 2315);
    			attr_dev(a, "href", "/");
    			add_location(a, file$z, 88, 6, 2303);
    			attr_dev(div, "class", "nav__head svelte-gz1fjn");
    			add_location(div, file$z, 87, 4, 2272);
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
    		source: "(87:2) {#if page === 'main'}",
    		ctx
    	});

    	return block;
    }

    // (125:29) 
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
    		source: "(125:29) ",
    		ctx
    	});

    	return block;
    }

    // (123:32) 
    function create_if_block_1$4(ctx) {
    	let mobilenavproducts;
    	let current;
    	mobilenavproducts = new MobileNavProducts({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(mobilenavproducts.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(mobilenavproducts, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mobilenavproducts.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mobilenavproducts.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mobilenavproducts, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(123:32) ",
    		ctx
    	});

    	return block;
    }

    // (102:2) {#if page === 'main'}
    function create_if_block$9(ctx) {
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
    				$$slots: { default: [create_default_slot$8] },
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
    			attr_dev(button0, "class", "svelte-gz1fjn");
    			add_location(button0, file$z, 103, 10, 2774);
    			add_location(li0, file$z, 103, 6, 2770);
    			attr_dev(button1, "class", "svelte-gz1fjn");
    			add_location(button1, file$z, 104, 10, 2853);
    			add_location(li1, file$z, 104, 6, 2849);
    			attr_dev(ul0, "class", "nav__extended svelte-gz1fjn");
    			add_location(ul0, file$z, 102, 4, 2736);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-gz1fjn");
    			add_location(a0, file$z, 107, 10, 2965);
    			attr_dev(li2, "class", "svelte-gz1fjn");
    			add_location(li2, file$z, 107, 6, 2961);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-gz1fjn");
    			add_location(a1, file$z, 108, 10, 3015);
    			attr_dev(li3, "class", "svelte-gz1fjn");
    			add_location(li3, file$z, 108, 6, 3011);
    			attr_dev(a2, "href", "/");
    			attr_dev(a2, "class", "svelte-gz1fjn");
    			add_location(a2, file$z, 109, 10, 3054);
    			attr_dev(li4, "class", "svelte-gz1fjn");
    			add_location(li4, file$z, 109, 6, 3050);
    			attr_dev(a3, "href", "/");
    			attr_dev(a3, "class", "svelte-gz1fjn");
    			add_location(a3, file$z, 110, 10, 3098);
    			attr_dev(li5, "class", "svelte-gz1fjn");
    			add_location(li5, file$z, 110, 6, 3094);
    			attr_dev(a4, "href", "/");
    			attr_dev(a4, "class", "svelte-gz1fjn");
    			add_location(a4, file$z, 111, 10, 3159);
    			attr_dev(li6, "class", "svelte-gz1fjn");
    			add_location(li6, file$z, 111, 6, 3155);
    			attr_dev(a5, "href", "/");
    			attr_dev(a5, "class", "svelte-gz1fjn");
    			add_location(a5, file$z, 112, 10, 3201);
    			attr_dev(li7, "class", "svelte-gz1fjn");
    			add_location(li7, file$z, 112, 6, 3197);
    			attr_dev(ul1, "class", "nav__main svelte-gz1fjn");
    			add_location(ul1, file$z, 106, 4, 2931);
    			attr_dev(div, "class", "nav__language svelte-gz1fjn");
    			add_location(div, file$z, 114, 4, 3256);
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
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(102:2) {#if page === 'main'}",
    		ctx
    	});

    	return block;
    }

    // (116:6) <Button>
    function create_default_slot$8(ctx) {
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
    			attr_dev(span, "class", "icon svelte-gz1fjn");
    			add_location(span, file$z, 116, 8, 3309);
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
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(116:6) <Button>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$z(ctx) {
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
    		if (/*page*/ ctx[1] === "main") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block$9, create_if_block_1$4, create_if_block_2$4];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*page*/ ctx[1] === "main") return 0;
    		if (/*page*/ ctx[1] === "products") return 1;
    		if (/*page*/ ctx[1] === "rooms") return 2;
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
    			attr_dev(nav, "class", "nav svelte-gz1fjn");
    			toggle_class(nav, "nav--active", /*active*/ ctx[0]);
    			add_location(nav, file$z, 85, 0, 2197);
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

    			if (dirty & /*active*/ 1) {
    				toggle_class(nav, "nav--active", /*active*/ ctx[0]);
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
    		id: create_fragment$z.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$z($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MobileNav", slots, []);
    	let src = "images/logo/ikea-logo-small.svg";
    	let { active = false } = $$props;
    	const dispatch = createEventDispatcher();

    	const toggleNav = () => {
    		$$invalidate(1, page = "main");
    		dispatch("toggle", { show: false });
    	};

    	const writable_props = ["active"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MobileNav> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(1, page = "main");
    	const click_handler_1 = () => $$invalidate(1, page = "products");
    	const click_handler_2 = () => $$invalidate(1, page = "rooms");

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    	};

    	$$self.$capture_state = () => ({
    		Notification,
    		Button,
    		Icon,
    		src,
    		createEventDispatcher,
    		SearchBar,
    		MobileNavRooms,
    		MobileNavProducts,
    		active,
    		dispatch,
    		toggleNav,
    		page
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(2, src = $$props.src);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("page" in $$props) $$invalidate(1, page = $$props.page);
    	};

    	let page;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(1, page = "main");
    	return [active, page, src, toggleNav, click_handler, click_handler_1, click_handler_2];
    }

    class MobileNav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$z, create_fragment$z, safe_not_equal, { active: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileNav",
    			options,
    			id: create_fragment$z.name
    		});
    	}

    	get active() {
    		throw new Error("<MobileNav>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<MobileNav>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ProductPage\Breadcrumb.svelte generated by Svelte v3.29.0 */
    const file$A = "src\\components\\ProductPage\\Breadcrumb.svelte";

    function create_fragment$A(ctx) {
    	let ol;
    	let li0;
    	let a0;
    	let t0;
    	let t1;
    	let li1;
    	let togglearrow;
    	let t2;
    	let li2;
    	let a1;
    	let t3;
    	let current;

    	togglearrow = new ToggleArrow({
    			props: { style: "width: .75rem;" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			ol = element("ol");
    			li0 = element("li");
    			a0 = element("a");
    			t0 = text(/*grandparent*/ ctx[0]);
    			t1 = space();
    			li1 = element("li");
    			create_component(togglearrow.$$.fragment);
    			t2 = space();
    			li2 = element("li");
    			a1 = element("a");
    			t3 = text(/*parent*/ ctx[1]);
    			attr_dev(a0, "href", "/");
    			attr_dev(a0, "class", "svelte-qi89yq");
    			add_location(a0, file$A, 31, 6, 639);
    			add_location(li0, file$A, 31, 2, 635);
    			attr_dev(li1, "class", "icon svelte-qi89yq");
    			add_location(li1, file$A, 32, 2, 677);
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "class", "svelte-qi89yq");
    			add_location(a1, file$A, 35, 6, 755);
    			add_location(li2, file$A, 35, 2, 751);
    			attr_dev(ol, "class", "svelte-qi89yq");
    			add_location(ol, file$A, 30, 0, 627);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ol, anchor);
    			append_dev(ol, li0);
    			append_dev(li0, a0);
    			append_dev(a0, t0);
    			append_dev(ol, t1);
    			append_dev(ol, li1);
    			mount_component(togglearrow, li1, null);
    			append_dev(ol, t2);
    			append_dev(ol, li2);
    			append_dev(li2, a1);
    			append_dev(a1, t3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*grandparent*/ 1) set_data_dev(t0, /*grandparent*/ ctx[0]);
    			if (!current || dirty & /*parent*/ 2) set_data_dev(t3, /*parent*/ ctx[1]);
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
    			if (detaching) detach_dev(ol);
    			destroy_component(togglearrow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$A.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$A($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Breadcrumb", slots, []);
    	let { grandparent } = $$props;
    	let { parent } = $$props;
    	const writable_props = ["grandparent", "parent"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Breadcrumb> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("grandparent" in $$props) $$invalidate(0, grandparent = $$props.grandparent);
    		if ("parent" in $$props) $$invalidate(1, parent = $$props.parent);
    	};

    	$$self.$capture_state = () => ({ ToggleArrow, grandparent, parent });

    	$$self.$inject_state = $$props => {
    		if ("grandparent" in $$props) $$invalidate(0, grandparent = $$props.grandparent);
    		if ("parent" in $$props) $$invalidate(1, parent = $$props.parent);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [grandparent, parent];
    }

    class Breadcrumb extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$A, create_fragment$A, safe_not_equal, { grandparent: 0, parent: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Breadcrumb",
    			options,
    			id: create_fragment$A.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*grandparent*/ ctx[0] === undefined && !("grandparent" in props)) {
    			console.warn("<Breadcrumb> was created without expected prop 'grandparent'");
    		}

    		if (/*parent*/ ctx[1] === undefined && !("parent" in props)) {
    			console.warn("<Breadcrumb> was created without expected prop 'parent'");
    		}
    	}

    	get grandparent() {
    		throw new Error("<Breadcrumb>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grandparent(value) {
    		throw new Error("<Breadcrumb>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get parent() {
    		throw new Error("<Breadcrumb>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set parent(value) {
    		throw new Error("<Breadcrumb>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Info.svelte generated by Svelte v3.29.0 */

    const file$B = "src\\svg\\Info.svelte";

    function create_fragment$B(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12ZM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM11.2468 7.20281C11.4577 7.06223 11.7081 6.99194 11.9981 6.99194C12.2968 6.99194 12.5516 7.06223 12.7624 7.20281C12.9645 7.3346 13.0656 7.585 13.0656 7.95401C13.0656 8.31424 12.9645 8.56464 12.7624 8.70521C12.5516 8.84579 12.2968 8.91608 11.9981 8.91608C11.7081 8.91608 11.4577 8.84579 11.2468 8.70521C11.036 8.56464 10.9306 8.31424 10.9306 7.95401C10.9306 7.585 11.036 7.3346 11.2468 7.20281ZM11.0228 17.008V9.81225H12.9865V17.008H11.0228Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$B, 11, 70, 224);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$B, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$B.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$B($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Info", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Info> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$B, create_fragment$B, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$B.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Info> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Info>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Info>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Truck.svelte generated by Svelte v3.29.0 */

    const file$C = "src\\svg\\Truck.svelte";

    function create_fragment$C(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M1 4H16V7.00001L19.0246 7L23.0039 12.6848V18H20.3472C19.9254 19.3056 18.6999 20.25 17.2539 20.25C15.8079 20.25 14.5824 19.3056 14.1607 18H10.2563C9.83456 19.3056 8.60911 20.25 7.16309 20.25C5.71707 20.25 4.49161 19.3056 4.06984 18H1V4ZM4.06984 16C4.49161 14.6944 5.71707 13.75 7.16309 13.75C8.60911 13.75 9.83456 14.6944 10.2563 16H14V6H3V16H4.06984ZM16 14.0007C16.3858 13.8392 16.8095 13.75 17.2539 13.75C18.6999 13.75 19.9254 14.6944 20.3472 16H21.0039V13.3152L17.9833 9L16 9.00001V14.0007ZM7.16309 15.75C6.47273 15.75 5.91309 16.3096 5.91309 17C5.91309 17.6904 6.47273 18.25 7.16309 18.25C7.85344 18.25 8.41309 17.6904 8.41309 17C8.41309 16.3096 7.85344 15.75 7.16309 15.75ZM17.2539 15.75C16.5635 15.75 16.0039 16.3096 16.0039 17C16.0039 17.6904 16.5635 18.25 17.2539 18.25C17.9443 18.25 18.5039 17.6904 18.5039 17C18.5039 16.3096 17.9443 15.75 17.2539 15.75Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$C, 11, 70, 224);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$C, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$C.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$C($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Truck", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Truck> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Truck extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$C, create_fragment$C, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Truck",
    			options,
    			id: create_fragment$C.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Truck> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Truck>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Truck>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Store.svelte generated by Svelte v3.29.0 */

    const file$D = "src\\svg\\Store.svelte";

    function create_fragment$D(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M22 20V4H2V20H22ZM20 6H4V18H7V10H17V18H20V6ZM11 12H9V18H11V12ZM13 18H15V12H13V18Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$D, 11, 70, 224);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$D, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$D.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$D($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Store", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Store> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Store extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$D, create_fragment$D, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Store",
    			options,
    			id: create_fragment$D.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Store> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Store>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Store>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Returns.svelte generated by Svelte v3.29.0 */

    const file$E = "src\\svg\\Returns.svelte";

    function create_fragment$E(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M12.3341 5.59721C14.2317 3.70042 17.3076 3.70067 19.2049 5.59795C20.2048 6.59781 20.6777 7.92671 20.6239 9.23427C20.6132 12.2905 18.4165 14.942 16.4873 16.7133C15.4907 17.6283 14.4984 18.369 13.7574 18.8802C13.3859 19.1365 13.0752 19.3367 12.8554 19.474C12.7455 19.5426 12.6582 19.5957 12.5972 19.6322C12.5667 19.6504 12.5428 19.6645 12.5259 19.6744L12.506 19.6861L12.5001 19.6895L12.4981 19.6906L12.0038 18.8349V17.6459C12.1756 17.5355 12.3847 17.3974 12.6217 17.234C13.3105 16.7588 14.2248 16.0754 15.1347 15.24C17.0137 13.5148 18.624 11.3685 18.624 9.21172V9.18879L18.625 9.16588C18.6607 8.38887 18.3825 7.60393 17.7907 7.01216C16.6742 5.89569 14.864 5.89568 13.7476 7.01216L13.7462 7.01355L11.9945 8.75832L10.2484 7.01216C9.13192 5.89569 7.32175 5.89569 6.20527 7.01217C5.61351 7.60393 5.33529 8.38887 5.37094 9.16588L5.37199 9.18879V9.21173C5.37199 10.4952 5.94133 11.7912 6.84588 13.0277C7.19716 13.5079 7.59014 13.9669 8.00204 14.3987L8.0018 11.9529L10.0018 11.9527L10.0024 17.64L4.30215 17.6394L4.30234 15.6394L6.42318 15.6396C6.00479 15.1916 5.60085 14.7132 5.23168 14.2085C4.19817 12.7957 3.37862 11.0967 3.37203 9.23431C3.31828 7.92674 3.79118 6.59783 4.79106 5.59795C6.68858 3.70043 9.76508 3.70042 11.6626 5.59795L11.9973 5.93266L12.3334 5.59795L12.3341 5.59721ZM12.0038 18.8349L12.4969 19.6913L12.0038 19.9752V18.8349Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$E, 11, 70, 224);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$E, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$E.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$E($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Returns", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Returns> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Returns extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$E, create_fragment$E, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Returns",
    			options,
    			id: create_fragment$E.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Returns> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Returns>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Returns>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const products = [
      {
        artno: 90476908,
        name: "STRÅLA",
        type: "Lamp shade",
        description: "3D/dotted",
        color: "white",
        dimensions: "67 cm",
        price: {
          current: 11,
          previous: 13,
        },
        additional:
          "Cord set sold separately. Light bulb sold separately. IKEA recommends LED bulb 200 lumen chandelier opal white.",
        images: [
          { src: "images/products/90476908/STRALA_01.webp" },
          { src: "images/products/90476908/STRALA_02.webp" },
          { src: "images/products/90476908/STRALA_03.webp" },
          { src: "images/products/90476908/STRALA_04.webp" },
          { src: "images/products/90476908/STRALA_05.webp" },
        ],
        promotional: {
          news: false,
          family: true,
          valid_from: "19 Oct",
          valid_to: "15 Nov",
        },
        product_details: {
          text: [
            "Combine with a cord set and hang the shade from the ceiling as a pendant, for example over a table or in a window.",
            "Cord set is sold separately",
            "Light bulb sold separately. IKEA recommends LED bulb 200 lumen chandelier opal white.",
            "Only for indoor use.",
          ],
          designer: "IKEA of Sweden",
          materials_and_care: [
            { title: "Shade", text: "Paperboard" },
            { title: "Support bracket / Buckles:", text: "Polycarbonate plastic" },
            { title: "", text: "Wipe clean with a dry cloth." },
          ],
        },
        package_details: {
          width: "45 cm",
          height: "4 cm",
          length: "47 cm",
          weight: "0.66 kg",
          packages: 1,
        },
        breadcrumb: ["Indoor lighting", "Decorative lighting"],
        availability: {
          online: 0,
          stores: [
            {
              store: "Belfast",
              loc: "Hollywood Exchange, 306 Airport Road West",
              qty: 0,
            },
            { store: "Birmingham", loc: "Park Lane", qty: 0 },
            {
              store: "Bristol",
              loc: "Eastgate Shopping Centre, Eastgate Road",
              qty: 0,
            },
            { store: "Cardiff", loc: "Ferry Road", qty: 0 },
            { store: "Croydon", loc: "Valley Retail Park, off Purley Way", qty: 0 },
            { store: "Edinburgh", loc: "Costkea Way, Loanhead", qty: 0 },
            { store: "Exeter", loc: "1 Ikea Way", qty: 0 },
            { store: "Gateshead", loc: "Metro Park West", qty: 0 },
            { store: "Glasgow", loc: "99 Kings Inch Drive", qty: 0 },
            { store: "Greenwich", loc: "55-57 Bugsby's Way", qty: 0 },
            { store: "Lakeside", loc: "Lakeside Retail Park, Heron Way", qty: 0 },
            { store: "Leeds", loc: "Holden Ing Way", qty: 12 },
            {
              store: "Manchester",
              loc: "Wellington Rd, Ashton-Under-Lyne",
              qty: 0,
            },
            { store: "Milton Keynes", loc: "Goslington Off Bletcham Way", qty: 0 },
            { store: "Nottingham", loc: "Giltbrook Retail Park, IKEA Way", qty: 0 },
            { store: "Reading", loc: "Pincents Kiln, Calcot", qty: 0 },
            { store: "Sheffield", loc: "Sheffield Road", qty: 0 },
            { store: "Southampton", loc: "West Quay Road", qty: 0 },
            { store: "Tottenham", loc: "6 Glover Drive", qty: 0 },
            {
              store: "Warrington",
              loc: "Gemini Retail Park, 910 Europa Blvd",
              qty: 0,
            },
            { store: "Wembley", loc: "2 Drury Way, North Circular Road", qty: 0 },
          ],
        },
      },
      {
        artno: 76298709,
        name: "TEST PRODUCT",
        type: "Test Item",
        description: "3D/dotted",
        color: "white",
        dimensions: "67 cm",
        price: {
          current: 11,
          previous: 13,
        },
        additional:
          "Cord set sold separately. Light bulb sold separately. IKEA recommends LED bulb 200 lumen chandelier opal white.",
        images: [],
        promotional: {
          news: false,
          family: true,
          valid_from: "19 Oct",
          valid_to: "15 Nov",
        },
        product_details: {
          text: [
            "Combine with a cord set and hang the shade from the ceiling as a pendant, for example over a table or in a window.",
            "Cord set is sold separately",
            "Light bulb sold separately. IKEA recommends LED bulb 200 lumen chandelier opal white.",
            "Only for indoor use.",
          ],
          designer: "IKEA of Sweden",
          materials_and_care: [
            { title: "Shade", text: "Paperboard" },
            { title: "Support bracket / Buckles:", text: "Polycarbonate plastic" },
            { title: "", text: "Wipe clean with a dry cloth." },
          ],
        },
        package_details: {
          width: "45 cm",
          height: "4 cm",
          length: "47 cm",
          weight: "0.66 kg",
          packages: 1,
        },
        breadcrumb: ["Indoor lighting", "Decorative lighting"],
        availability: {
          online: 0,
          stores: [
            {
              store: "Belfast",
              loc: "Hollywood Exchange, 306 Airport Road West",
              qty: 0,
            },
            { store: "Birmingham", loc: "Park Lane", qty: 0 },
            {
              store: "Bristol",
              loc: "Eastgate Shopping Centre, Eastgate Road",
              qty: 0,
            },
            { store: "Cardiff", loc: "Ferry Road", qty: 0 },
            { store: "Croydon", loc: "Valley Retail Park, off Purley Way", qty: 0 },
            { store: "Edinburgh", loc: "Costkea Way, Loanhead", qty: 0 },
            { store: "Exeter", loc: "1 Ikea Way", qty: 0 },
            { store: "Gateshead", loc: "Metro Park West", qty: 0 },
            { store: "Glasgow", loc: "99 Kings Inch Drive", qty: 0 },
            { store: "Greenwich", loc: "55-57 Bugsby's Way", qty: 0 },
            { store: "Lakeside", loc: "Lakeside Retail Park, Heron Way", qty: 0 },
            { store: "Leeds", loc: "Holden Ing Way", qty: 12 },
            {
              store: "Manchester",
              loc: "Wellington Rd, Ashton-Under-Lyne",
              qty: 0,
            },
            { store: "Milton Keynes", loc: "Goslington Off Bletcham Way", qty: 0 },
            { store: "Nottingham", loc: "Giltbrook Retail Park, IKEA Way", qty: 0 },
            { store: "Reading", loc: "Pincents Kiln, Calcot", qty: 0 },
            { store: "Sheffield", loc: "Sheffield Road", qty: 0 },
            { store: "Southampton", loc: "West Quay Road", qty: 0 },
            { store: "Tottenham", loc: "6 Glover Drive", qty: 0 },
            {
              store: "Warrington",
              loc: "Gemini Retail Park, 910 Europa Blvd",
              qty: 0,
            },
            { store: "Wembley", loc: "2 Drury Way, North Circular Road", qty: 0 },
          ],
        },
      },
    ];

    /* src\components\atoms\StatusDot.svelte generated by Svelte v3.29.0 */

    const file$F = "src\\components\\atoms\\StatusDot.svelte";

    function create_fragment$F(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "dot svelte-18mwenv");
    			toggle_class(span, "dot--available", /*available*/ ctx[0]);
    			add_location(span, file$F, 14, 0, 260);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*available*/ 1) {
    				toggle_class(span, "dot--available", /*available*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$F.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$F($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StatusDot", slots, []);
    	let { available = false } = $$props;
    	const writable_props = ["available"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StatusDot> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("available" in $$props) $$invalidate(0, available = $$props.available);
    	};

    	$$self.$capture_state = () => ({ available });

    	$$self.$inject_state = $$props => {
    		if ("available" in $$props) $$invalidate(0, available = $$props.available);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [available];
    }

    class StatusDot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$F, create_fragment$F, safe_not_equal, { available: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StatusDot",
    			options,
    			id: create_fragment$F.name
    		});
    	}

    	get available() {
    		throw new Error("<StatusDot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set available(value) {
    		throw new Error("<StatusDot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\views\NotFound.svelte generated by Svelte v3.29.0 */
    const file$G = "src\\components\\views\\NotFound.svelte";

    // (41:4) <Title>
    function create_default_slot_1$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Oops! Something went wrong :(");
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
    		id: create_default_slot_1$5.name,
    		type: "slot",
    		source: "(41:4) <Title>",
    		ctx
    	});

    	return block;
    }

    // (30:0) <Section>
    function create_default_slot$9(ctx) {
    	let div1;
    	let div0;
    	let video;
    	let source;
    	let source_src_value;
    	let t0;
    	let title;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let button;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_1$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			video = element("video");
    			source = element("source");
    			t0 = space();
    			create_component(title.$$.fragment);
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "The page you are looking for can't be found.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Maybe the links below can be helpful.";
    			t5 = space();
    			button = element("button");
    			button.textContent = "Go back to the IKEA homepage";
    			if (source.src !== (source_src_value = /*src*/ ctx[0])) attr_dev(source, "src", source_src_value);
    			attr_dev(source, "type", "video/mp4");
    			add_location(source, file$G, 37, 8, 701);
    			video.autoplay = "autoplay";
    			video.loop = "loop";
    			video.muted = "muted";
    			video.playsInline = "playsinline";
    			attr_dev(video, "class", "svelte-ic3hbb");
    			add_location(video, file$G, 32, 6, 576);
    			attr_dev(div0, "class", "video svelte-ic3hbb");
    			add_location(div0, file$G, 31, 4, 549);
    			attr_dev(p0, "class", "svelte-ic3hbb");
    			add_location(p0, file$G, 41, 4, 818);
    			attr_dev(p1, "class", "svelte-ic3hbb");
    			add_location(p1, file$G, 42, 4, 875);
    			attr_dev(button, "class", "svelte-ic3hbb");
    			add_location(button, file$G, 43, 4, 925);
    			attr_dev(div1, "class", "container svelte-ic3hbb");
    			add_location(div1, file$G, 30, 2, 520);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, video);
    			append_dev(video, source);
    			append_dev(div1, t0);
    			mount_component(title, div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, p0);
    			append_dev(div1, t3);
    			append_dev(div1, p1);
    			append_dev(div1, t5);
    			append_dev(div1, button);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
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
    			if (detaching) detach_dev(div1);
    			destroy_component(title);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(30:0) <Section>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$G(ctx) {
    	let section;
    	let current;

    	section = new Section({
    			props: {
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(section.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(section, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const section_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				section_changes.$$scope = { dirty, ctx };
    			}

    			section.$set(section_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(section.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(section.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(section, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$G.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$G($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NotFound", slots, []);
    	let src = "/videos/404.mp4";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NotFound> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Section, Title, src });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src];
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$G, create_fragment$G, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$G.name
    		});
    	}
    }

    /* src\components\views\ProductPage.svelte generated by Svelte v3.29.0 */
    const file$H = "src\\components\\views\\ProductPage.svelte";

    // (158:0) {:else}
    function create_else_block_1(ctx) {
    	let notfound;
    	let current;
    	notfound = new NotFound({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(notfound.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notfound, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notfound.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notfound.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notfound, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(158:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (75:0) {#if prod}
    function create_if_block$a(ctx) {
    	let section0;
    	let t;
    	let section1;
    	let current;

    	section0 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section1 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(section0.$$.fragment);
    			t = space();
    			create_component(section1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(section0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(section1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const section0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section0_changes.$$scope = { dirty, ctx };
    			}

    			section0.$set(section0_changes);
    			const section1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				section1_changes.$$scope = { dirty, ctx };
    			}

    			section1.$set(section1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(section0.$$.fragment, local);
    			transition_in(section1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(section0.$$.fragment, local);
    			transition_out(section1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(section0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(section1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(75:0) {#if prod}",
    		ctx
    	});

    	return block;
    }

    // (82:6) {#if prod.promotional.news}
    function create_if_block_6$1(ctx) {
    	let news;
    	let current;
    	news = new News({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(news.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(news, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(news.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(news.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(news, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(82:6) {#if prod.promotional.news}",
    		ctx
    	});

    	return block;
    }

    // (85:6) {#if prod.promotional.family}
    function create_if_block_5$2(ctx) {
    	let family;
    	let current;
    	family = new Family({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(family.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(family, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(family.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(family.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(family, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$2.name,
    		type: "if",
    		source: "(85:6) {#if prod.promotional.family}",
    		ctx
    	});

    	return block;
    }

    // (89:8) <Title>
    function create_default_slot_6$1(ctx) {
    	let t_value = /*prod*/ ctx[0].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6$1.name,
    		type: "slot",
    		source: "(89:8) <Title>",
    		ctx
    	});

    	return block;
    }

    // (93:6) {#if prod.price.previous}
    function create_if_block_4$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = `Regular price ${formatPrice(/*prod*/ ctx[0].price.previous, "str")}`;
    			attr_dev(p, "class", "svelte-7bgniw");
    			add_location(p, file$H, 93, 8, 2795);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$3.name,
    		type: "if",
    		source: "(93:6) {#if prod.price.previous}",
    		ctx
    	});

    	return block;
    }

    // (96:6) {#if prod.promotional.valid_from && prod.promotional.valid_to}
    function create_if_block_3$5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");

    			p.textContent = `Price valid
          ${/*prod*/ ctx[0].promotional.valid_from}
          -
          ${/*prod*/ ctx[0].promotional.valid_to}
          or while supply lasts`;

    			attr_dev(p, "class", "svelte-7bgniw");
    			add_location(p, file$H, 96, 8, 2950);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$5.name,
    		type: "if",
    		source: "(96:6) {#if prod.promotional.valid_from && prod.promotional.valid_to}",
    		ctx
    	});

    	return block;
    }

    // (105:6) {#if prod.additional}
    function create_if_block_2$5(ctx) {
    	let div;
    	let info;
    	let t0;
    	let p;
    	let current;

    	info = new Info({
    			props: {
    				style: "width: 1rem; filter: contrast(.5);"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(info.$$.fragment);
    			t0 = space();
    			p = element("p");
    			p.textContent = `${/*prod*/ ctx[0].additional}`;
    			attr_dev(p, "class", "svelte-7bgniw");
    			add_location(p, file$H, 107, 10, 3275);
    			attr_dev(div, "class", "product__important svelte-7bgniw");
    			add_location(div, file$H, 105, 8, 3168);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(info, div, null);
    			append_dev(div, t0);
    			append_dev(div, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(info.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(info);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(105:6) {#if prod.additional}",
    		ctx
    	});

    	return block;
    }

    // (112:8) <Button>
    function create_default_slot_5$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Add To Wishlist");
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
    		id: create_default_slot_5$1.name,
    		type: "slot",
    		source: "(112:8) <Button>",
    		ctx
    	});

    	return block;
    }

    // (76:2) <Section>
    function create_default_slot_4$1(ctx) {
    	let breadcrumb;
    	let t0;
    	let rule;
    	let t1;
    	let slideshow;
    	let t2;
    	let div2;
    	let t3;
    	let t4;
    	let div0;
    	let title;
    	let t5;
    	let price;
    	let t6;
    	let p;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let div1;
    	let button;
    	let current;

    	breadcrumb = new Breadcrumb({
    			props: {
    				parent: /*prod*/ ctx[0].breadcrumb[0],
    				grandparent: /*prod*/ ctx[0].breadcrumb[1]
    			},
    			$$inline: true
    		});

    	rule = new Rule({ $$inline: true });

    	slideshow = new Slideshow({
    			props: {
    				data: /*prod*/ ctx[0].images,
    				imageOnly: true,
    				max: /*prod*/ ctx[0].images.length,
    				step: 1
    			},
    			$$inline: true
    		});

    	let if_block0 = /*prod*/ ctx[0].promotional.news && create_if_block_6$1(ctx);
    	let if_block1 = /*prod*/ ctx[0].promotional.family && create_if_block_5$2(ctx);

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_6$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	price = new Price({
    			props: { price: /*prod*/ ctx[0].price.current },
    			$$inline: true
    		});

    	let if_block2 = /*prod*/ ctx[0].price.previous && create_if_block_4$3(ctx);
    	let if_block3 = /*prod*/ ctx[0].promotional.valid_from && /*prod*/ ctx[0].promotional.valid_to && create_if_block_3$5(ctx);
    	let if_block4 = /*prod*/ ctx[0].additional && create_if_block_2$5(ctx);

    	button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_5$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(breadcrumb.$$.fragment);
    			t0 = space();
    			create_component(rule.$$.fragment);
    			t1 = space();
    			create_component(slideshow.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			div0 = element("div");
    			create_component(title.$$.fragment);
    			t5 = space();
    			create_component(price.$$.fragment);
    			t6 = space();
    			p = element("p");
    			p.textContent = `${/*prod*/ ctx[0].type}, ${/*prod*/ ctx[0].description}  ${/*prod*/ ctx[0].color}, ${/*prod*/ ctx[0].dimensions}`;
    			t14 = space();
    			if (if_block2) if_block2.c();
    			t15 = space();
    			if (if_block3) if_block3.c();
    			t16 = space();
    			if (if_block4) if_block4.c();
    			t17 = space();
    			div1 = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div0, "class", "product__info svelte-7bgniw");
    			add_location(div0, file$H, 87, 6, 2551);
    			attr_dev(p, "class", "svelte-7bgniw");
    			add_location(p, file$H, 91, 6, 2682);
    			attr_dev(div1, "class", "product__wishlist svelte-7bgniw");
    			add_location(div1, file$H, 110, 6, 3336);
    			attr_dev(div2, "class", "product svelte-7bgniw");
    			add_location(div2, file$H, 80, 4, 2386);
    		},
    		m: function mount(target, anchor) {
    			mount_component(breadcrumb, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(rule, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(slideshow, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t3);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t4);
    			append_dev(div2, div0);
    			mount_component(title, div0, null);
    			append_dev(div0, t5);
    			mount_component(price, div0, null);
    			append_dev(div2, t6);
    			append_dev(div2, p);
    			append_dev(div2, t14);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t15);
    			if (if_block3) if_block3.m(div2, null);
    			append_dev(div2, t16);
    			if (if_block4) if_block4.m(div2, null);
    			append_dev(div2, t17);
    			append_dev(div2, div1);
    			mount_component(button, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			if (/*prod*/ ctx[0].price.previous) if_block2.p(ctx, dirty);
    			if (/*prod*/ ctx[0].promotional.valid_from && /*prod*/ ctx[0].promotional.valid_to) if_block3.p(ctx, dirty);
    			if (/*prod*/ ctx[0].additional) if_block4.p(ctx, dirty);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(breadcrumb.$$.fragment, local);
    			transition_in(rule.$$.fragment, local);
    			transition_in(slideshow.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(title.$$.fragment, local);
    			transition_in(price.$$.fragment, local);
    			transition_in(if_block4);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(breadcrumb.$$.fragment, local);
    			transition_out(rule.$$.fragment, local);
    			transition_out(slideshow.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(title.$$.fragment, local);
    			transition_out(price.$$.fragment, local);
    			transition_out(if_block4);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(breadcrumb, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(rule, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(slideshow, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(title);
    			destroy_component(price);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(76:2) <Section>",
    		ctx
    	});

    	return block;
    }

    // (123:8) {:else}
    function create_else_block$3(ctx) {
    	let t;
    	let statusdot;
    	let current;
    	statusdot = new StatusDot({ $$inline: true });

    	const block = {
    		c: function create() {
    			t = text("Currently unavailable online\r\n          ");
    			create_component(statusdot.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(statusdot, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statusdot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statusdot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(statusdot, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(123:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (120:8) {#if prod.availability.online > 0}
    function create_if_block_1$5(ctx) {
    	let t;
    	let statusdot;
    	let current;

    	statusdot = new StatusDot({
    			props: { available: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = text("Available online\r\n          ");
    			create_component(statusdot.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(statusdot, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statusdot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statusdot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(statusdot, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(120:8) {#if prod.availability.online > 0}",
    		ctx
    	});

    	return block;
    }

    // (131:8) <Link>
    function create_default_slot_3$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Check in-store stock");
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
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(131:8) <Link>",
    		ctx
    	});

    	return block;
    }

    // (144:8) <Link>
    function create_default_slot_2$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Product details");
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
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(144:8) <Link>",
    		ctx
    	});

    	return block;
    }

    // (149:14) <Link style="display: block;">
    function create_default_slot_1$6(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Product size";
    			add_location(p, file$H, 149, 12, 4504);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$6.name,
    		type: "slot",
    		source: "(149:14) <Link style=\\\"display: block;\\\">",
    		ctx
    	});

    	return block;
    }

    // (116:2) <Section>
    function create_default_slot$a(ctx) {
    	let div1;
    	let p0;
    	let truck;
    	let t0;
    	let current_block_type_index;
    	let if_block;
    	let t1;
    	let rule0;
    	let t2;
    	let p1;
    	let store;
    	let t3;
    	let link0;
    	let t4;
    	let rule1;
    	let t5;
    	let p2;
    	let returns;
    	let t6;
    	let t7;
    	let rule2;
    	let t8;
    	let div0;
    	let p3;
    	let t10;
    	let rule3;
    	let t11;
    	let p4;
    	let link1;
    	let t12;
    	let togglearrow0;
    	let t13;
    	let rule4;
    	let t14;
    	let p5;
    	let span;
    	let link2;
    	let t15;
    	let t16_value = /*prod*/ ctx[0].dimensions + "";
    	let t16;
    	let t17;
    	let togglearrow1;
    	let t18;
    	let rule5;
    	let current;
    	truck = new Truck({ $$inline: true });
    	const if_block_creators = [create_if_block_1$5, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*prod*/ ctx[0].availability.online > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	rule0 = new Rule({ $$inline: true });
    	store = new Store({ $$inline: true });

    	link0 = new Link({
    			props: {
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	rule1 = new Rule({ $$inline: true });
    	returns = new Returns({ $$inline: true });
    	rule2 = new Rule({ $$inline: true });
    	rule3 = new Rule({ $$inline: true });

    	link1 = new Link({
    			props: {
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	togglearrow0 = new ToggleArrow({
    			props: {
    				style: "filter: invert(1); transform: rotate(-90deg);"
    			},
    			$$inline: true
    		});

    	rule4 = new Rule({ $$inline: true });

    	link2 = new Link({
    			props: {
    				style: "display: block;",
    				$$slots: { default: [create_default_slot_1$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	togglearrow1 = new ToggleArrow({
    			props: {
    				style: "filter: invert(1); transform: rotate(-90deg);"
    			},
    			$$inline: true
    		});

    	rule5 = new Rule({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p0 = element("p");
    			create_component(truck.$$.fragment);
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			create_component(rule0.$$.fragment);
    			t2 = space();
    			p1 = element("p");
    			create_component(store.$$.fragment);
    			t3 = space();
    			create_component(link0.$$.fragment);
    			t4 = space();
    			create_component(rule1.$$.fragment);
    			t5 = space();
    			p2 = element("p");
    			create_component(returns.$$.fragment);
    			t6 = text("\r\n        You have 365 days to change your mind.");
    			t7 = space();
    			create_component(rule2.$$.fragment);
    			t8 = space();
    			div0 = element("div");
    			p3 = element("p");
    			p3.textContent = `${formatArtNo(/*prod*/ ctx[0].artno)}`;
    			t10 = space();
    			create_component(rule3.$$.fragment);
    			t11 = space();
    			p4 = element("p");
    			create_component(link1.$$.fragment);
    			t12 = space();
    			create_component(togglearrow0.$$.fragment);
    			t13 = space();
    			create_component(rule4.$$.fragment);
    			t14 = space();
    			p5 = element("p");
    			span = element("span");
    			create_component(link2.$$.fragment);
    			t15 = space();
    			t16 = text(t16_value);
    			t17 = space();
    			create_component(togglearrow1.$$.fragment);
    			t18 = space();
    			create_component(rule5.$$.fragment);
    			attr_dev(p0, "class", "product-grid product-grid--ltr svelte-7bgniw");
    			add_location(p0, file$H, 117, 6, 3511);
    			attr_dev(p1, "class", "product-grid product-grid--ltr svelte-7bgniw");
    			add_location(p1, file$H, 128, 6, 3812);
    			attr_dev(p2, "class", "product-grid product-grid--ltr svelte-7bgniw");
    			add_location(p2, file$H, 133, 6, 3952);
    			attr_dev(p3, "class", "svelte-7bgniw");
    			add_location(p3, file$H, 139, 8, 4137);
    			attr_dev(div0, "class", "product__artno svelte-7bgniw");
    			add_location(div0, file$H, 138, 6, 4099);
    			attr_dev(p4, "class", "product-grid product-grid--rtl svelte-7bgniw");
    			add_location(p4, file$H, 142, 6, 4207);
    			add_location(span, file$H, 148, 8, 4454);
    			attr_dev(p5, "class", "product-grid product-grid--rtl svelte-7bgniw");
    			add_location(p5, file$H, 147, 6, 4402);
    			attr_dev(div1, "class", "product__availability svelte-7bgniw");
    			add_location(div1, file$H, 116, 4, 3468);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p0);
    			mount_component(truck, p0, null);
    			append_dev(p0, t0);
    			if_blocks[current_block_type_index].m(p0, null);
    			append_dev(div1, t1);
    			mount_component(rule0, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			mount_component(store, p1, null);
    			append_dev(p1, t3);
    			mount_component(link0, p1, null);
    			append_dev(div1, t4);
    			mount_component(rule1, div1, null);
    			append_dev(div1, t5);
    			append_dev(div1, p2);
    			mount_component(returns, p2, null);
    			append_dev(p2, t6);
    			append_dev(div1, t7);
    			mount_component(rule2, div1, null);
    			append_dev(div1, t8);
    			append_dev(div1, div0);
    			append_dev(div0, p3);
    			append_dev(div1, t10);
    			mount_component(rule3, div1, null);
    			append_dev(div1, t11);
    			append_dev(div1, p4);
    			mount_component(link1, p4, null);
    			append_dev(p4, t12);
    			mount_component(togglearrow0, p4, null);
    			append_dev(div1, t13);
    			mount_component(rule4, div1, null);
    			append_dev(div1, t14);
    			append_dev(div1, p5);
    			append_dev(p5, span);
    			mount_component(link2, span, null);
    			append_dev(span, t15);
    			append_dev(span, t16);
    			append_dev(p5, t17);
    			mount_component(togglearrow1, p5, null);
    			append_dev(div1, t18);
    			mount_component(rule5, div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(truck.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(rule0.$$.fragment, local);
    			transition_in(store.$$.fragment, local);
    			transition_in(link0.$$.fragment, local);
    			transition_in(rule1.$$.fragment, local);
    			transition_in(returns.$$.fragment, local);
    			transition_in(rule2.$$.fragment, local);
    			transition_in(rule3.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(togglearrow0.$$.fragment, local);
    			transition_in(rule4.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			transition_in(togglearrow1.$$.fragment, local);
    			transition_in(rule5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(truck.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(rule0.$$.fragment, local);
    			transition_out(store.$$.fragment, local);
    			transition_out(link0.$$.fragment, local);
    			transition_out(rule1.$$.fragment, local);
    			transition_out(returns.$$.fragment, local);
    			transition_out(rule2.$$.fragment, local);
    			transition_out(rule3.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(togglearrow0.$$.fragment, local);
    			transition_out(rule4.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			transition_out(togglearrow1.$$.fragment, local);
    			transition_out(rule5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(truck);
    			if_blocks[current_block_type_index].d();
    			destroy_component(rule0);
    			destroy_component(store);
    			destroy_component(link0);
    			destroy_component(rule1);
    			destroy_component(returns);
    			destroy_component(rule2);
    			destroy_component(rule3);
    			destroy_component(link1);
    			destroy_component(togglearrow0);
    			destroy_component(rule4);
    			destroy_component(link2);
    			destroy_component(togglearrow1);
    			destroy_component(rule5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(116:2) <Section>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$H(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$a, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*prod*/ ctx[0]) return 0;
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
    			if_block.p(ctx, dirty);
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
    		id: create_fragment$H.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$H($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ProductPage", slots, []);
    	let { artNumber } = $$props;
    	const prod = products.find(product => product.artno === artNumber);
    	const writable_props = ["artNumber"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ProductPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("artNumber" in $$props) $$invalidate(1, artNumber = $$props.artNumber);
    	};

    	$$self.$capture_state = () => ({
    		Rule,
    		Section,
    		Slideshow,
    		Breadcrumb,
    		News,
    		Family,
    		Title,
    		Price,
    		Info,
    		Button,
    		Truck,
    		Store,
    		Link,
    		Returns,
    		products,
    		formatPrice,
    		formatArtNo,
    		ToggleArrow,
    		StatusDot,
    		NotFound,
    		artNumber,
    		prod
    	});

    	$$self.$inject_state = $$props => {
    		if ("artNumber" in $$props) $$invalidate(1, artNumber = $$props.artNumber);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [prod, artNumber];
    }

    class ProductPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$H, create_fragment$H, safe_not_equal, { artNumber: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductPage",
    			options,
    			id: create_fragment$H.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*artNumber*/ ctx[1] === undefined && !("artNumber" in props)) {
    			console.warn("<ProductPage> was created without expected prop 'artNumber'");
    		}
    	}

    	get artNumber() {
    		throw new Error("<ProductPage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set artNumber(value) {
    		throw new Error("<ProductPage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Facebook.svelte generated by Svelte v3.29.0 */

    const file$I = "src\\svg\\Facebook.svelte";

    function create_fragment$I(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "clip-rule", "evenodd");
    			attr_dev(path, "d", "M21 12C21 7.02943 16.9706 3 12 3C7.02943 3 3 7.02943 3 12C3 16.4922 6.29117 20.2155 10.5938 20.8907V14.6016H8.30859V12H10.5938V10.0172C10.5938 7.76156 11.9374 6.51562 13.9932 6.51562C14.9779 6.51562 16.0078 6.69141 16.0078 6.69141V8.90625H14.8729C13.7549 8.90625 13.4062 9.60001 13.4062 10.3117V12H15.9023L15.5033 14.6016H13.4062V20.8907C17.7088 20.2155 21 16.4922 21 12Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$I, 19, 2, 300);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$I, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$I.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$I($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Facebook", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Facebook> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Facebook extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$I, create_fragment$I, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Facebook",
    			options,
    			id: create_fragment$I.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Facebook> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Facebook>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Facebook>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Instagram.svelte generated by Svelte v3.29.0 */

    const file$J = "src\\svg\\Instagram.svelte";

    function create_fragment$J(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M12 7.37946C12.8036 7.37946 13.567 7.62054 14.2902 8.02232C15.0134 8.42411 15.5759 8.98661 15.9777 9.70982C16.3795 10.433 16.6205 11.1964 16.6205 12C16.6205 12.8438 16.3795 13.6071 15.9777 14.3304C15.5759 15.0536 15.0134 15.6161 14.2902 16.0179C13.567 16.4196 12.8036 16.6205 12 16.6205C11.1562 16.6205 10.3929 16.4196 9.66964 16.0179C8.94643 15.6161 8.38393 15.0536 7.98214 14.3304C7.58036 13.6071 7.37946 12.8438 7.37946 12C7.37946 11.1964 7.58036 10.433 7.98214 9.70982C8.38393 8.98661 8.94643 8.42411 9.66964 8.02232C10.3929 7.62054 11.1562 7.37946 12 7.37946ZM12 15.0134C12.8036 15.0134 13.5268 14.7321 14.1295 14.1295C14.692 13.567 15.0134 12.8438 15.0134 12C15.0134 11.1964 14.692 10.4732 14.1295 9.87054C13.5268 9.30804 12.8036 8.98661 12 8.98661C11.1562 8.98661 10.433 9.30804 9.87054 9.87054C9.26786 10.4732 8.98661 11.1964 8.98661 12C8.98661 12.8438 9.26786 13.567 9.87054 14.1295C10.433 14.7321 11.1562 15.0134 12 15.0134ZM17.9062 7.17857C17.9062 6.89732 17.7857 6.65625 17.5848 6.41518C17.3438 6.21429 17.1027 6.09375 16.8214 6.09375C16.5 6.09375 16.2589 6.21429 16.058 6.41518C15.817 6.65625 15.7366 6.89732 15.7366 7.17857C15.7366 7.5 15.817 7.74107 16.058 7.94196C16.2589 8.18304 16.5 8.26339 16.8214 8.26339C17.1027 8.26339 17.3438 8.18304 17.5446 7.94196C17.7455 7.74107 17.8661 7.5 17.9062 7.17857ZM20.9598 8.26339C20.9598 9.02679 21 10.2723 21 12C21 13.7679 20.9598 15.0134 20.9196 15.7768C20.8795 16.5402 20.7589 17.183 20.5982 17.7455C20.3571 18.4286 19.9554 19.0312 19.4732 19.5134C18.9911 19.9955 18.3884 20.3571 17.7455 20.5982C17.183 20.7991 16.5 20.9196 15.7366 20.9598C14.9732 21 13.7277 21 12 21C10.2321 21 8.98661 21 8.22321 20.9598C7.45982 20.9196 6.81696 20.7991 6.25446 20.558C5.57143 20.3571 4.96875 19.9955 4.48661 19.5134C4.00446 19.0312 3.64286 18.4286 3.40179 17.7455C3.20089 17.183 3.08036 16.5402 3.04018 15.7768C3 15.0134 3 13.7679 3 12C3 10.2723 3 9.02679 3.04018 8.26339C3.08036 7.5 3.20089 6.81696 3.40179 6.25446C3.64286 5.61161 4.00446 5.00893 4.48661 4.52679C4.96875 4.04464 5.57143 3.64286 6.25446 3.40179C6.81696 3.24107 7.45982 3.12054 8.22321 3.08036C8.98661 3.04018 10.2321 3 12 3C13.7277 3 14.9732 3.04018 15.7366 3.08036C16.5 3.12054 17.183 3.24107 17.7455 3.40179C18.3884 3.64286 18.9911 4.04464 19.4732 4.52679C19.9554 5.00893 20.3571 5.61161 20.5982 6.25446C20.7589 6.81696 20.8795 7.5 20.9598 8.26339ZM19.0312 17.3036C19.192 16.8616 19.2723 16.1384 19.3527 15.1339C19.3527 14.5714 19.3929 13.7277 19.3929 12.6429V11.3571C19.3929 10.2723 19.3527 9.42857 19.3527 8.86607C19.2723 7.86161 19.192 7.13839 19.0312 6.69643C18.7098 5.89286 18.1071 5.29018 17.3036 4.96875C16.8616 4.80804 16.1384 4.72768 15.1339 4.64732C14.5312 4.64732 13.6875 4.60714 12.6429 4.60714H11.3571C10.2723 4.60714 9.42857 4.64732 8.86607 4.64732C7.86161 4.72768 7.13839 4.80804 6.69643 4.96875C5.85268 5.29018 5.29018 5.89286 4.96875 6.69643C4.80804 7.13839 4.6875 7.86161 4.64732 8.86607C4.60714 9.46875 4.60714 10.3125 4.60714 11.3571V12.6429C4.60714 13.7277 4.60714 14.5714 4.64732 15.1339C4.6875 16.1384 4.80804 16.8616 4.96875 17.3036C5.29018 18.1473 5.89286 18.7098 6.69643 19.0312C7.13839 19.192 7.86161 19.3125 8.86607 19.3527C9.42857 19.3929 10.2723 19.3929 11.3571 19.3929H12.6429C13.7277 19.3929 14.5714 19.3929 15.1339 19.3527C16.1384 19.3125 16.8616 19.192 17.3036 19.0312C18.1071 18.7098 18.7098 18.1071 19.0312 17.3036Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$J, 19, 2, 300);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$J, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$J.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$J($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Instagram", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Instagram> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Instagram extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$J, create_fragment$J, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Instagram",
    			options,
    			id: create_fragment$J.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Instagram> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Instagram>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Instagram>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Pinterest.svelte generated by Svelte v3.29.0 */

    const file$K = "src\\svg\\Pinterest.svelte";

    function create_fragment$K(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M12 3C7.02963 3 3 7.02632 3 11.9926C3 15.8043 5.37037 19.0609 8.71852 20.3709C8.63704 19.6604 8.57037 18.565 8.74815 17.7878C8.91111 17.0847 9.8 13.3174 9.8 13.3174C9.8 13.3174 9.53333 12.7771 9.53333 11.9852C9.53333 10.7344 10.2593 9.80181 11.163 9.80181C11.9333 9.80181 12.3037 10.3791 12.3037 11.0674C12.3037 11.8372 11.8148 12.9918 11.5556 14.065C11.3407 14.9605 12.0074 15.6933 12.8889 15.6933C14.4889 15.6933 15.7185 14.0058 15.7185 11.5781C15.7185 9.42434 14.1704 7.92188 11.9556 7.92188C9.39259 7.92188 7.88889 9.83882 7.88889 11.8224C7.88889 12.5921 8.18519 13.4211 8.55556 13.8725C8.62963 13.9613 8.63704 14.0428 8.61482 14.1316C8.54815 14.4128 8.39259 15.0271 8.36296 15.153C8.32593 15.3158 8.22963 15.3528 8.05926 15.2714C6.93333 14.7459 6.22963 13.1102 6.22963 11.7854C6.22963 8.95066 8.28889 6.34539 12.1778 6.34539C15.2963 6.34539 17.7259 8.56579 17.7259 11.5411C17.7259 14.6423 15.7704 17.1365 13.0593 17.1365C12.1481 17.1365 11.2889 16.6628 11 16.1003C11 16.1003 10.5481 17.8174 10.437 18.2393C10.237 19.0238 9.68889 20.0008 9.31852 20.6003C10.163 20.8594 11.0519 21 11.9852 21C16.9556 21 20.9852 16.9737 20.9852 12.0074C21 7.02632 16.9704 3 12 3Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$K, 19, 2, 300);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$K, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$K.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$K($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Pinterest", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pinterest> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Pinterest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$K, create_fragment$K, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pinterest",
    			options,
    			id: create_fragment$K.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Pinterest> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Pinterest>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Pinterest>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Twitter.svelte generated by Svelte v3.29.0 */

    const file$L = "src\\svg\\Twitter.svelte";

    function create_fragment$L(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M19.1367 8.5C19.8398 7.99519 20.4727 7.38942 21 6.64904C20.2969 6.95192 19.5938 7.15385 18.8906 7.22115C19.6641 6.75 20.2266 6.11058 20.5078 5.26923C19.7695 5.67308 18.9961 5.97596 18.1523 6.11058C17.8008 5.77404 17.3789 5.50481 16.9219 5.30288C16.4648 5.10096 15.9727 5 15.4453 5C14.7773 5 14.1797 5.16827 13.6172 5.47115C13.0547 5.80769 12.5977 6.24519 12.2812 6.78365C11.9297 7.32212 11.7891 7.92788 11.7891 8.53365C11.7891 8.80288 11.7891 9.07212 11.8594 9.34135C10.3477 9.27404 8.94141 8.9375 7.60547 8.26442C6.26953 7.625 5.17969 6.75 4.26562 5.63942C3.91406 6.21154 3.73828 6.81731 3.73828 7.42308C3.73828 8.02885 3.87891 8.60096 4.19531 9.10577C4.47656 9.64423 4.89844 10.0481 5.39062 10.3846C4.79297 10.3846 4.23047 10.2163 3.73828 9.91346V9.98077C3.73828 10.8221 4.01953 11.5625 4.58203 12.2019C5.14453 12.875 5.84766 13.2788 6.69141 13.4471C6.33984 13.5144 6.02344 13.5481 5.70703 13.5481C5.49609 13.5481 5.25 13.5481 5.03906 13.5144C5.25 14.2212 5.67188 14.7933 6.30469 15.2644C6.9375 15.7356 7.64062 15.9375 8.48438 15.9375C7.11328 16.9471 5.56641 17.4519 3.87891 17.4519C3.52734 17.4519 3.24609 17.4519 3 17.4183C4.6875 18.4952 6.58594 19 8.66016 19C10.8047 19 12.7031 18.4952 14.3906 17.4183C15.9023 16.476 17.0977 15.2308 17.9414 13.6154C18.75 12.1346 19.1719 10.5529 19.1719 8.9375C19.1719 8.73558 19.1367 8.60096 19.1367 8.5Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$L, 19, 2, 300);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$L, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$L.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$L($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Twitter", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Twitter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Twitter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$L, create_fragment$L, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Twitter",
    			options,
    			id: create_fragment$L.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Twitter> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Twitter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Twitter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\svg\Youtube.svelte generated by Svelte v3.29.0 */

    const file$M = "src\\svg\\Youtube.svelte";

    function create_fragment$M(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M21.5971 7.03125C21.7436 7.64062 21.8901 8.58854 21.9634 9.80729L22 11.5L21.9634 13.1927C21.8901 14.4792 21.7436 15.3932 21.5971 16.0026C21.4506 16.4089 21.2308 16.7474 20.9377 17.0182C20.6081 17.3229 20.2418 17.526 19.8022 17.6276C19.1429 17.7969 17.6777 17.8984 15.3333 17.9661L12 18L8.66667 17.9661C6.32234 17.8984 4.82051 17.7969 4.1978 17.6276C3.75824 17.526 3.35531 17.3229 3.06227 17.0182C2.7326 16.7474 2.51282 16.4089 2.40293 16.0026C2.21978 15.3932 2.10989 14.4792 2.03663 13.1927L2 11.5C2 11.026 2 10.4505 2.03663 9.80729C2.10989 8.58854 2.21978 7.64062 2.40293 7.03125C2.51282 6.625 2.7326 6.28646 3.06227 5.98177C3.35531 5.71094 3.75824 5.50781 4.1978 5.3724C4.82051 5.23698 6.32234 5.10156 8.66667 5.03385L12 5L15.3333 5.03385C17.6777 5.10156 19.1429 5.23698 19.8022 5.3724C20.2418 5.50781 20.6081 5.71094 20.9377 5.98177C21.2308 6.28646 21.4506 6.625 21.5971 7.03125ZM9.94872 14.276L15.1868 11.5L9.94872 8.75781V14.276Z");
    			attr_dev(path, "class", "svelte-mz3j8z");
    			add_location(path, file$M, 19, 2, 300);
    			attr_dev(svg, "style", /*style*/ ctx[0]);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$M, 11, 0, 154);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				attr_dev(svg, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$M.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$M($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Youtube", slots, []);
    	let { style } = $$props;
    	const writable_props = ["style"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Youtube> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	$$self.$capture_state = () => ({ style });

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style];
    }

    class Youtube extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$M, create_fragment$M, safe_not_equal, { style: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Youtube",
    			options,
    			id: create_fragment$M.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Youtube> was created without expected prop 'style'");
    		}
    	}

    	get style() {
    		throw new Error("<Youtube>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Youtube>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\FooterIcon.svelte generated by Svelte v3.29.0 */
    const file$N = "src\\components\\atoms\\FooterIcon.svelte";

    // (75:34) 
    function create_if_block_11(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*giftcard*/ ctx[10])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "payment icon");
    			attr_dev(img, "class", "payment-icon svelte-1qq4q4r");
    			add_location(img, file$N, 75, 6, 2443);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(75:34) ",
    		ctx
    	});

    	return block;
    }

    // (73:34) 
    function create_if_block_10(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*ppcredit*/ ctx[9])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "payment icon");
    			attr_dev(img, "class", "payment-icon svelte-1qq4q4r");
    			add_location(img, file$N, 73, 6, 2337);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(73:34) ",
    		ctx
    	});

    	return block;
    }

    // (71:32) 
    function create_if_block_9$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*paypal*/ ctx[8])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "payment icon");
    			attr_dev(img, "class", "payment-icon svelte-1qq4q4r");
    			add_location(img, file$N, 71, 6, 2233);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9$1.name,
    		type: "if",
    		source: "(71:32) ",
    		ctx
    	});

    	return block;
    }

    // (69:33) 
    function create_if_block_8$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*maestro*/ ctx[7])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "payment icon");
    			attr_dev(img, "class", "payment-icon svelte-1qq4q4r");
    			add_location(img, file$N, 69, 6, 2130);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$1.name,
    		type: "if",
    		source: "(69:33) ",
    		ctx
    	});

    	return block;
    }

    // (67:30) 
    function create_if_block_7$1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*amex*/ ctx[6])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "payment icon");
    			attr_dev(img, "class", "payment-icon svelte-1qq4q4r");
    			add_location(img, file$N, 67, 6, 2029);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(67:30) ",
    		ctx
    	});

    	return block;
    }

    // (65:36) 
    function create_if_block_6$2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*mastercard*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "payment icon");
    			attr_dev(img, "class", "payment-icon svelte-1qq4q4r");
    			add_location(img, file$N, 65, 6, 1925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$2.name,
    		type: "if",
    		source: "(65:36) ",
    		ctx
    	});

    	return block;
    }

    // (63:30) 
    function create_if_block_5$3(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*visa*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "payment icon");
    			attr_dev(img, "class", "payment-icon svelte-1qq4q4r");
    			add_location(img, file$N, 63, 6, 1821);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$3.name,
    		type: "if",
    		source: "(63:30) ",
    		ctx
    	});

    	return block;
    }

    // (61:33) 
    function create_if_block_4$4(ctx) {
    	let youtube;
    	let current;
    	youtube = new Youtube({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(youtube.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(youtube, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(youtube.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(youtube.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(youtube, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$4.name,
    		type: "if",
    		source: "(61:33) ",
    		ctx
    	});

    	return block;
    }

    // (59:35) 
    function create_if_block_3$6(ctx) {
    	let instagram;
    	let current;
    	instagram = new Instagram({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(instagram.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(instagram, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(instagram.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(instagram.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(instagram, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$6.name,
    		type: "if",
    		source: "(59:35) ",
    		ctx
    	});

    	return block;
    }

    // (57:35) 
    function create_if_block_2$6(ctx) {
    	let pinterest;
    	let current;
    	pinterest = new Pinterest({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(pinterest.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pinterest, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pinterest.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pinterest.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pinterest, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$6.name,
    		type: "if",
    		source: "(57:35) ",
    		ctx
    	});

    	return block;
    }

    // (55:33) 
    function create_if_block_1$6(ctx) {
    	let twitter;
    	let current;
    	twitter = new Twitter({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(twitter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(twitter, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(twitter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(twitter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(twitter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(55:33) ",
    		ctx
    	});

    	return block;
    }

    // (53:4) {#if icon === 'facebook'}
    function create_if_block$b(ctx) {
    	let facebook;
    	let current;
    	facebook = new Facebook({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(facebook.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(facebook, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(facebook.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(facebook.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(facebook, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(53:4) {#if icon === 'facebook'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$N(ctx) {
    	let div;
    	let span;
    	let current_block_type_index;
    	let if_block;
    	let div_class_value;
    	let current;

    	const if_block_creators = [
    		create_if_block$b,
    		create_if_block_1$6,
    		create_if_block_2$6,
    		create_if_block_3$6,
    		create_if_block_4$4,
    		create_if_block_5$3,
    		create_if_block_6$2,
    		create_if_block_7$1,
    		create_if_block_8$1,
    		create_if_block_9$1,
    		create_if_block_10,
    		create_if_block_11
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*icon*/ ctx[0] === "facebook") return 0;
    		if (/*icon*/ ctx[0] === "twitter") return 1;
    		if (/*icon*/ ctx[0] === "pinterest") return 2;
    		if (/*icon*/ ctx[0] === "instagram") return 3;
    		if (/*icon*/ ctx[0] === "youtube") return 4;
    		if (/*icon*/ ctx[0] === "visa") return 5;
    		if (/*icon*/ ctx[0] === "mastercard") return 6;
    		if (/*icon*/ ctx[0] === "amex") return 7;
    		if (/*icon*/ ctx[0] === "maestro") return 8;
    		if (/*icon*/ ctx[0] === "paypal") return 9;
    		if (/*icon*/ ctx[0] === "ppcredit") return 10;
    		if (/*icon*/ ctx[0] === "giftcard") return 11;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "icon__wrapper svelte-1qq4q4r");
    			add_location(span, file$N, 51, 2, 1478);
    			attr_dev(div, "style", /*style*/ ctx[2]);
    			attr_dev(div, "ref", /*ref*/ ctx[3]);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(`icon ${/*square*/ ctx[1] ? "icon--square" : "icon--round"}`) + " svelte-1qq4q4r"));
    			add_location(div, file$N, 50, 0, 1397);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(span, null);
    			}

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
    					if_block.m(span, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if (!current || dirty & /*style*/ 4) {
    				attr_dev(div, "style", /*style*/ ctx[2]);
    			}

    			if (!current || dirty & /*ref*/ 8) {
    				attr_dev(div, "ref", /*ref*/ ctx[3]);
    			}

    			if (!current || dirty & /*square*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(`icon ${/*square*/ ctx[1] ? "icon--square" : "icon--round"}`) + " svelte-1qq4q4r"))) {
    				attr_dev(div, "class", div_class_value);
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
    			if (detaching) detach_dev(div);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$N.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$N($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FooterIcon", slots, []);
    	let visa = "images/icons/visa.svg";
    	let mastercard = "images/icons/mastercard.svg";
    	let amex = "images/icons/amex.svg";
    	let maestro = "images/icons/maestro.svg";
    	let paypal = "images/icons/paypal.svg";
    	let ppcredit = "images/icons/paypal_credit.svg";
    	let giftcard = "images/icons/giftcard.svg";
    	let { icon = "facebook" } = $$props;
    	let { round } = $$props;
    	let { square } = $$props;
    	let { style } = $$props;
    	let { ref } = $$props;
    	const writable_props = ["icon", "round", "square", "style", "ref"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FooterIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("round" in $$props) $$invalidate(11, round = $$props.round);
    		if ("square" in $$props) $$invalidate(1, square = $$props.square);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("ref" in $$props) $$invalidate(3, ref = $$props.ref);
    	};

    	$$self.$capture_state = () => ({
    		visa,
    		mastercard,
    		amex,
    		maestro,
    		paypal,
    		ppcredit,
    		giftcard,
    		Facebook,
    		Instagram,
    		Pinterest,
    		Twitter,
    		Youtube,
    		icon,
    		round,
    		square,
    		style,
    		ref
    	});

    	$$self.$inject_state = $$props => {
    		if ("visa" in $$props) $$invalidate(4, visa = $$props.visa);
    		if ("mastercard" in $$props) $$invalidate(5, mastercard = $$props.mastercard);
    		if ("amex" in $$props) $$invalidate(6, amex = $$props.amex);
    		if ("maestro" in $$props) $$invalidate(7, maestro = $$props.maestro);
    		if ("paypal" in $$props) $$invalidate(8, paypal = $$props.paypal);
    		if ("ppcredit" in $$props) $$invalidate(9, ppcredit = $$props.ppcredit);
    		if ("giftcard" in $$props) $$invalidate(10, giftcard = $$props.giftcard);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("round" in $$props) $$invalidate(11, round = $$props.round);
    		if ("square" in $$props) $$invalidate(1, square = $$props.square);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("ref" in $$props) $$invalidate(3, ref = $$props.ref);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		icon,
    		square,
    		style,
    		ref,
    		visa,
    		mastercard,
    		amex,
    		maestro,
    		paypal,
    		ppcredit,
    		giftcard,
    		round
    	];
    }

    class FooterIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$N, create_fragment$N, safe_not_equal, {
    			icon: 0,
    			round: 11,
    			square: 1,
    			style: 2,
    			ref: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FooterIcon",
    			options,
    			id: create_fragment$N.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*round*/ ctx[11] === undefined && !("round" in props)) {
    			console.warn("<FooterIcon> was created without expected prop 'round'");
    		}

    		if (/*square*/ ctx[1] === undefined && !("square" in props)) {
    			console.warn("<FooterIcon> was created without expected prop 'square'");
    		}

    		if (/*style*/ ctx[2] === undefined && !("style" in props)) {
    			console.warn("<FooterIcon> was created without expected prop 'style'");
    		}

    		if (/*ref*/ ctx[3] === undefined && !("ref" in props)) {
    			console.warn("<FooterIcon> was created without expected prop 'ref'");
    		}
    	}

    	get icon() {
    		throw new Error("<FooterIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<FooterIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get round() {
    		throw new Error("<FooterIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set round(value) {
    		throw new Error("<FooterIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get square() {
    		throw new Error("<FooterIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set square(value) {
    		throw new Error("<FooterIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<FooterIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<FooterIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ref() {
    		throw new Error("<FooterIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ref(value) {
    		throw new Error("<FooterIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\organisms\Footer.svelte generated by Svelte v3.29.0 */
    const file$O = "src\\components\\organisms\\Footer.svelte";

    // (55:6) <Title type="h3" style="font-size: 1.375rem; color: #111;">
    function create_default_slot_17$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Join IKEA Family");
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
    		id: create_default_slot_17$1.name,
    		type: "slot",
    		source: "(55:6) <Title type=\\\"h3\\\" style=\\\"font-size: 1.375rem; color: #111;\\\">",
    		ctx
    	});

    	return block;
    }

    // (61:8) <Link inline>
    function create_default_slot_16$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("See more.");
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
    		id: create_default_slot_16$1.name,
    		type: "slot",
    		source: "(61:8) <Link inline>",
    		ctx
    	});

    	return block;
    }

    // (63:6) <Button secondary>
    function create_default_slot_15$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Join or log in");
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
    		id: create_default_slot_15$1.name,
    		type: "slot",
    		source: "(63:6) <Button secondary>",
    		ctx
    	});

    	return block;
    }

    // (53:2) <Section>
    function create_default_slot_14$1(ctx) {
    	let div;
    	let title;
    	let t0;
    	let p;
    	let t1;
    	let link;
    	let t2;
    	let button;
    	let current;

    	title = new Title({
    			props: {
    				type: "h3",
    				style: "font-size: 1.375rem; color: #111;",
    				$$slots: { default: [create_default_slot_17$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link = new Link({
    			props: {
    				inline: true,
    				$$slots: { default: [create_default_slot_16$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				secondary: true,
    				$$slots: { default: [create_default_slot_15$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(title.$$.fragment);
    			t0 = space();
    			p = element("p");
    			t1 = text("Get exclusive offers, inspiration, and lots more to help bring your\r\n        ideas to life. All for free.\r\n        ");
    			create_component(link.$$.fragment);
    			t2 = space();
    			create_component(button.$$.fragment);
    			attr_dev(p, "class", "svelte-18zlys2");
    			add_location(p, file$O, 57, 6, 1416);
    			attr_dev(div, "class", "join-family svelte-18zlys2");
    			add_location(div, file$O, 53, 4, 1274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(title, div, null);
    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			mount_component(link, p, null);
    			append_dev(div, t2);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			transition_in(link.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			transition_out(link.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(title);
    			destroy_component(link);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_14$1.name,
    		type: "slot",
    		source: "(53:2) <Section>",
    		ctx
    	});

    	return block;
    }

    // (66:2) <Section>
    function create_default_slot_13$1(ctx) {
    	let rule0;
    	let t0;
    	let div;
    	let p0;
    	let t1;
    	let togglearrow0;
    	let t2;
    	let rule1;
    	let t3;
    	let p1;
    	let t4;
    	let togglearrow1;
    	let t5;
    	let rule2;
    	let t6;
    	let p2;
    	let t7;
    	let togglearrow2;
    	let t8;
    	let rule3;
    	let t9;
    	let p3;
    	let t10;
    	let togglearrow3;
    	let t11;
    	let rule4;
    	let current;
    	rule0 = new Rule({ $$inline: true });

    	togglearrow0 = new ToggleArrow({
    			props: {
    				style: "filter: invert(1); transform: rotate(-90deg);"
    			},
    			$$inline: true
    		});

    	rule1 = new Rule({ $$inline: true });

    	togglearrow1 = new ToggleArrow({
    			props: {
    				style: "filter: invert(1); transform: rotate(-90deg);"
    			},
    			$$inline: true
    		});

    	rule2 = new Rule({ $$inline: true });

    	togglearrow2 = new ToggleArrow({
    			props: {
    				style: "filter: invert(1); transform: rotate(-90deg);"
    			},
    			$$inline: true
    		});

    	rule3 = new Rule({ $$inline: true });

    	togglearrow3 = new ToggleArrow({
    			props: {
    				style: "filter: invert(1); transform: rotate(-90deg);"
    			},
    			$$inline: true
    		});

    	rule4 = new Rule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(rule0.$$.fragment);
    			t0 = space();
    			div = element("div");
    			p0 = element("p");
    			t1 = text("Services\r\n        ");
    			create_component(togglearrow0.$$.fragment);
    			t2 = space();
    			create_component(rule1.$$.fragment);
    			t3 = space();
    			p1 = element("p");
    			t4 = text("Help\r\n        ");
    			create_component(togglearrow1.$$.fragment);
    			t5 = space();
    			create_component(rule2.$$.fragment);
    			t6 = space();
    			p2 = element("p");
    			t7 = text("About IKEA\r\n        ");
    			create_component(togglearrow2.$$.fragment);
    			t8 = space();
    			create_component(rule3.$$.fragment);
    			t9 = space();
    			p3 = element("p");
    			t10 = text("IKEA Family\r\n        ");
    			create_component(togglearrow3.$$.fragment);
    			t11 = space();
    			create_component(rule4.$$.fragment);
    			attr_dev(p0, "class", "link-grid link-grid--rtl svelte-18zlys2");
    			add_location(p0, file$O, 68, 6, 1726);
    			attr_dev(p1, "class", "link-grid link-grid--rtl svelte-18zlys2");
    			add_location(p1, file$O, 73, 6, 1895);
    			attr_dev(p2, "class", "link-grid link-grid--rtl svelte-18zlys2");
    			add_location(p2, file$O, 78, 6, 2060);
    			attr_dev(p3, "class", "link-grid link-grid--rtl svelte-18zlys2");
    			add_location(p3, file$O, 83, 6, 2231);
    			attr_dev(div, "class", "other-links");
    			add_location(div, file$O, 67, 4, 1693);
    		},
    		m: function mount(target, anchor) {
    			mount_component(rule0, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t1);
    			mount_component(togglearrow0, p0, null);
    			append_dev(div, t2);
    			mount_component(rule1, div, null);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, t4);
    			mount_component(togglearrow1, p1, null);
    			append_dev(div, t5);
    			mount_component(rule2, div, null);
    			append_dev(div, t6);
    			append_dev(div, p2);
    			append_dev(p2, t7);
    			mount_component(togglearrow2, p2, null);
    			append_dev(div, t8);
    			mount_component(rule3, div, null);
    			append_dev(div, t9);
    			append_dev(div, p3);
    			append_dev(p3, t10);
    			mount_component(togglearrow3, p3, null);
    			append_dev(div, t11);
    			mount_component(rule4, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(rule0.$$.fragment, local);
    			transition_in(togglearrow0.$$.fragment, local);
    			transition_in(rule1.$$.fragment, local);
    			transition_in(togglearrow1.$$.fragment, local);
    			transition_in(rule2.$$.fragment, local);
    			transition_in(togglearrow2.$$.fragment, local);
    			transition_in(rule3.$$.fragment, local);
    			transition_in(togglearrow3.$$.fragment, local);
    			transition_in(rule4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(rule0.$$.fragment, local);
    			transition_out(togglearrow0.$$.fragment, local);
    			transition_out(rule1.$$.fragment, local);
    			transition_out(togglearrow1.$$.fragment, local);
    			transition_out(rule2.$$.fragment, local);
    			transition_out(togglearrow2.$$.fragment, local);
    			transition_out(rule3.$$.fragment, local);
    			transition_out(togglearrow3.$$.fragment, local);
    			transition_out(rule4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(rule0, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(togglearrow0);
    			destroy_component(rule1);
    			destroy_component(togglearrow1);
    			destroy_component(rule2);
    			destroy_component(togglearrow2);
    			destroy_component(rule3);
    			destroy_component(togglearrow3);
    			destroy_component(rule4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_13$1.name,
    		type: "slot",
    		source: "(66:2) <Section>",
    		ctx
    	});

    	return block;
    }

    // (91:2) <Section>
    function create_default_slot_12$1(ctx) {
    	let div;
    	let footericon0;
    	let t0;
    	let footericon1;
    	let t1;
    	let footericon2;
    	let t2;
    	let footericon3;
    	let t3;
    	let footericon4;
    	let current;

    	footericon0 = new FooterIcon({
    			props: { round: true, icon: "facebook" },
    			$$inline: true
    		});

    	footericon1 = new FooterIcon({
    			props: { round: true, icon: "twitter" },
    			$$inline: true
    		});

    	footericon2 = new FooterIcon({
    			props: { round: true, icon: "pinterest" },
    			$$inline: true
    		});

    	footericon3 = new FooterIcon({
    			props: { round: true, icon: "instagram" },
    			$$inline: true
    		});

    	footericon4 = new FooterIcon({
    			props: { round: true, icon: "youtube" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(footericon0.$$.fragment);
    			t0 = space();
    			create_component(footericon1.$$.fragment);
    			t1 = space();
    			create_component(footericon2.$$.fragment);
    			t2 = space();
    			create_component(footericon3.$$.fragment);
    			t3 = space();
    			create_component(footericon4.$$.fragment);
    			attr_dev(div, "class", "social-links");
    			add_location(div, file$O, 91, 4, 2440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(footericon0, div, null);
    			append_dev(div, t0);
    			mount_component(footericon1, div, null);
    			append_dev(div, t1);
    			mount_component(footericon2, div, null);
    			append_dev(div, t2);
    			mount_component(footericon3, div, null);
    			append_dev(div, t3);
    			mount_component(footericon4, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(footericon0.$$.fragment, local);
    			transition_in(footericon1.$$.fragment, local);
    			transition_in(footericon2.$$.fragment, local);
    			transition_in(footericon3.$$.fragment, local);
    			transition_in(footericon4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(footericon0.$$.fragment, local);
    			transition_out(footericon1.$$.fragment, local);
    			transition_out(footericon2.$$.fragment, local);
    			transition_out(footericon3.$$.fragment, local);
    			transition_out(footericon4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(footericon0);
    			destroy_component(footericon1);
    			destroy_component(footericon2);
    			destroy_component(footericon3);
    			destroy_component(footericon4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_12$1.name,
    		type: "slot",
    		source: "(91:2) <Section>",
    		ctx
    	});

    	return block;
    }

    // (100:2) <Section>
    function create_default_slot_11$1(ctx) {
    	let div;
    	let footericon0;
    	let t0;
    	let footericon1;
    	let t1;
    	let footericon2;
    	let t2;
    	let footericon3;
    	let t3;
    	let footericon4;
    	let t4;
    	let footericon5;
    	let t5;
    	let footericon6;
    	let current;

    	footericon0 = new FooterIcon({
    			props: { square: true, icon: "visa" },
    			$$inline: true
    		});

    	footericon1 = new FooterIcon({
    			props: { square: true, icon: "mastercard" },
    			$$inline: true
    		});

    	footericon2 = new FooterIcon({
    			props: { square: true, icon: "amex" },
    			$$inline: true
    		});

    	footericon3 = new FooterIcon({
    			props: { square: true, icon: "maestro" },
    			$$inline: true
    		});

    	footericon4 = new FooterIcon({
    			props: { square: true, icon: "paypal" },
    			$$inline: true
    		});

    	footericon5 = new FooterIcon({
    			props: { square: true, icon: "ppcredit" },
    			$$inline: true
    		});

    	footericon6 = new FooterIcon({
    			props: { square: true, icon: "giftcard" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(footericon0.$$.fragment);
    			t0 = space();
    			create_component(footericon1.$$.fragment);
    			t1 = space();
    			create_component(footericon2.$$.fragment);
    			t2 = space();
    			create_component(footericon3.$$.fragment);
    			t3 = space();
    			create_component(footericon4.$$.fragment);
    			t4 = space();
    			create_component(footericon5.$$.fragment);
    			t5 = space();
    			create_component(footericon6.$$.fragment);
    			attr_dev(div, "class", "payment-links");
    			add_location(div, file$O, 100, 4, 2731);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(footericon0, div, null);
    			append_dev(div, t0);
    			mount_component(footericon1, div, null);
    			append_dev(div, t1);
    			mount_component(footericon2, div, null);
    			append_dev(div, t2);
    			mount_component(footericon3, div, null);
    			append_dev(div, t3);
    			mount_component(footericon4, div, null);
    			append_dev(div, t4);
    			mount_component(footericon5, div, null);
    			append_dev(div, t5);
    			mount_component(footericon6, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(footericon0.$$.fragment, local);
    			transition_in(footericon1.$$.fragment, local);
    			transition_in(footericon2.$$.fragment, local);
    			transition_in(footericon3.$$.fragment, local);
    			transition_in(footericon4.$$.fragment, local);
    			transition_in(footericon5.$$.fragment, local);
    			transition_in(footericon6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(footericon0.$$.fragment, local);
    			transition_out(footericon1.$$.fragment, local);
    			transition_out(footericon2.$$.fragment, local);
    			transition_out(footericon3.$$.fragment, local);
    			transition_out(footericon4.$$.fragment, local);
    			transition_out(footericon5.$$.fragment, local);
    			transition_out(footericon6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(footericon0);
    			destroy_component(footericon1);
    			destroy_component(footericon2);
    			destroy_component(footericon3);
    			destroy_component(footericon4);
    			destroy_component(footericon5);
    			destroy_component(footericon6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_11$1.name,
    		type: "slot",
    		source: "(100:2) <Section>",
    		ctx
    	});

    	return block;
    }

    // (113:6) <Button>
    function create_default_slot_10$1(ctx) {
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
    			attr_dev(span, "class", "icon svelte-18zlys2");
    			add_location(span, file$O, 113, 8, 3157);
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
    		id: create_default_slot_10$1.name,
    		type: "slot",
    		source: "(113:6) <Button>",
    		ctx
    	});

    	return block;
    }

    // (111:2) <Section>
    function create_default_slot_9$1(ctx) {
    	let div;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_10$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "language svelte-18zlys2");
    			add_location(div, file$O, 111, 4, 3109);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
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
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9$1.name,
    		type: "slot",
    		source: "(111:2) <Section>",
    		ctx
    	});

    	return block;
    }

    // (121:2) <Section>
    function create_default_slot_8$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "IKEA United Kingdom - 7th Floor, 100 Avebury Boulevard, Milton Keynes, MK9\r\n      1FH © Inter IKEA Systems B.V 1999-2020";
    			set_style(p, "font-size", ".75rem");
    			attr_dev(p, "class", "svelte-18zlys2");
    			add_location(p, file$O, 121, 4, 3309);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8$1.name,
    		type: "slot",
    		source: "(121:2) <Section>",
    		ctx
    	});

    	return block;
    }

    // (129:6) <Link inline style="text-decoration: none;">
    function create_default_slot_7$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Privacy policy");
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
    		id: create_default_slot_7$1.name,
    		type: "slot",
    		source: "(129:6) <Link inline style=\\\"text-decoration: none;\\\">",
    		ctx
    	});

    	return block;
    }

    // (130:6) <Link inline style="text-decoration: none;">
    function create_default_slot_6$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cookie policy");
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
    		id: create_default_slot_6$2.name,
    		type: "slot",
    		source: "(130:6) <Link inline style=\\\"text-decoration: none;\\\">",
    		ctx
    	});

    	return block;
    }

    // (131:6) <Link inline style="text-decoration: none;">
    function create_default_slot_5$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cookie settings");
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
    		id: create_default_slot_5$2.name,
    		type: "slot",
    		source: "(131:6) <Link inline style=\\\"text-decoration: none;\\\">",
    		ctx
    	});

    	return block;
    }

    // (132:6) <Link inline style="text-decoration: none;">
    function create_default_slot_4$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Terms & conditions");
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
    		id: create_default_slot_4$2.name,
    		type: "slot",
    		source: "(132:6) <Link inline style=\\\"text-decoration: none;\\\">",
    		ctx
    	});

    	return block;
    }

    // (133:6) <Link inline style="text-decoration: none;">
    function create_default_slot_3$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Responsible Disclosure policy");
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
    		id: create_default_slot_3$2.name,
    		type: "slot",
    		source: "(133:6) <Link inline style=\\\"text-decoration: none;\\\">",
    		ctx
    	});

    	return block;
    }

    // (136:6) <Link inline style="text-decoration: none;">
    function create_default_slot_2$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Modern Slavery Statement");
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
    		id: create_default_slot_2$4.name,
    		type: "slot",
    		source: "(136:6) <Link inline style=\\\"text-decoration: none;\\\">",
    		ctx
    	});

    	return block;
    }

    // (139:6) <Link inline style="text-decoration: none;">
    function create_default_slot_1$7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Accessibility");
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
    		id: create_default_slot_1$7.name,
    		type: "slot",
    		source: "(139:6) <Link inline style=\\\"text-decoration: none;\\\">",
    		ctx
    	});

    	return block;
    }

    // (127:2) <Section>
    function create_default_slot$b(ctx) {
    	let div;
    	let link0;
    	let t0;
    	let link1;
    	let t1;
    	let link2;
    	let t2;
    	let link3;
    	let t3;
    	let link4;
    	let t4;
    	let link5;
    	let t5;
    	let link6;
    	let current;

    	link0 = new Link({
    			props: {
    				inline: true,
    				style: "text-decoration: none;",
    				$$slots: { default: [create_default_slot_7$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link1 = new Link({
    			props: {
    				inline: true,
    				style: "text-decoration: none;",
    				$$slots: { default: [create_default_slot_6$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link2 = new Link({
    			props: {
    				inline: true,
    				style: "text-decoration: none;",
    				$$slots: { default: [create_default_slot_5$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link3 = new Link({
    			props: {
    				inline: true,
    				style: "text-decoration: none;",
    				$$slots: { default: [create_default_slot_4$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link4 = new Link({
    			props: {
    				inline: true,
    				style: "text-decoration: none;",
    				$$slots: { default: [create_default_slot_3$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link5 = new Link({
    			props: {
    				inline: true,
    				style: "text-decoration: none;",
    				$$slots: { default: [create_default_slot_2$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link6 = new Link({
    			props: {
    				inline: true,
    				style: "text-decoration: none;",
    				$$slots: { default: [create_default_slot_1$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(link0.$$.fragment);
    			t0 = space();
    			create_component(link1.$$.fragment);
    			t1 = space();
    			create_component(link2.$$.fragment);
    			t2 = space();
    			create_component(link3.$$.fragment);
    			t3 = space();
    			create_component(link4.$$.fragment);
    			t4 = space();
    			create_component(link5.$$.fragment);
    			t5 = space();
    			create_component(link6.$$.fragment);
    			attr_dev(div, "class", "footer-links svelte-18zlys2");
    			add_location(div, file$O, 127, 4, 3510);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(link0, div, null);
    			append_dev(div, t0);
    			mount_component(link1, div, null);
    			append_dev(div, t1);
    			mount_component(link2, div, null);
    			append_dev(div, t2);
    			mount_component(link3, div, null);
    			append_dev(div, t3);
    			mount_component(link4, div, null);
    			append_dev(div, t4);
    			mount_component(link5, div, null);
    			append_dev(div, t5);
    			mount_component(link6, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link0_changes.$$scope = { dirty, ctx };
    			}

    			link0.$set(link0_changes);
    			const link1_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link1_changes.$$scope = { dirty, ctx };
    			}

    			link1.$set(link1_changes);
    			const link2_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link2_changes.$$scope = { dirty, ctx };
    			}

    			link2.$set(link2_changes);
    			const link3_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link3_changes.$$scope = { dirty, ctx };
    			}

    			link3.$set(link3_changes);
    			const link4_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link4_changes.$$scope = { dirty, ctx };
    			}

    			link4.$set(link4_changes);
    			const link5_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link5_changes.$$scope = { dirty, ctx };
    			}

    			link5.$set(link5_changes);
    			const link6_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link6_changes.$$scope = { dirty, ctx };
    			}

    			link6.$set(link6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			transition_in(link3.$$.fragment, local);
    			transition_in(link4.$$.fragment, local);
    			transition_in(link5.$$.fragment, local);
    			transition_in(link6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			transition_out(link3.$$.fragment, local);
    			transition_out(link4.$$.fragment, local);
    			transition_out(link5.$$.fragment, local);
    			transition_out(link6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_component(link2);
    			destroy_component(link3);
    			destroy_component(link4);
    			destroy_component(link5);
    			destroy_component(link6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(127:2) <Section>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$O(ctx) {
    	let footer;
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
    	let current;

    	section0 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_14$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section1 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_13$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section2 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_12$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section3 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_11$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section4 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_9$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section5 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_8$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section6 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			footer = element("footer");
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
    			attr_dev(footer, "class", "svelte-18zlys2");
    			add_location(footer, file$O, 51, 0, 1247);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			mount_component(section0, footer, null);
    			append_dev(footer, t0);
    			mount_component(section1, footer, null);
    			append_dev(footer, t1);
    			mount_component(section2, footer, null);
    			append_dev(footer, t2);
    			mount_component(section3, footer, null);
    			append_dev(footer, t3);
    			mount_component(section4, footer, null);
    			append_dev(footer, t4);
    			mount_component(section5, footer, null);
    			append_dev(footer, t5);
    			mount_component(section6, footer, null);
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
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			destroy_component(section0);
    			destroy_component(section1);
    			destroy_component(section2);
    			destroy_component(section3);
    			destroy_component(section4);
    			destroy_component(section5);
    			destroy_component(section6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$O.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$O($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Notification,
    		ToggleArrow,
    		Button,
    		FooterIcon,
    		Link,
    		Rule,
    		Section,
    		Title
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$O, create_fragment$O, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$O.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.0 */

    // (38:36) 
    function create_if_block_1$7(ctx) {
    	let productpage;
    	let current;

    	productpage = new ProductPage({
    			props: { artNumber: /*currentProduct*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(productpage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(productpage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const productpage_changes = {};
    			if (dirty & /*currentProduct*/ 4) productpage_changes.artNumber = /*currentProduct*/ ctx[2];
    			productpage.$set(productpage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(productpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(productpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(productpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(38:36) ",
    		ctx
    	});

    	return block;
    }

    // (36:0) {#if currentPage === 'home'}
    function create_if_block$c(ctx) {
    	let homepage;
    	let current;
    	homepage = new Homepage({ $$inline: true });
    	homepage.$on("productview", /*productView*/ ctx[4]);

    	const block = {
    		c: function create() {
    			create_component(homepage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(homepage, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(homepage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(homepage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(homepage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(36:0) {#if currentPage === 'home'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$P(ctx) {
    	let headnotification;
    	let t0;
    	let header;
    	let t1;
    	let mobilenav;
    	let t2;
    	let searchbar;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let t4;
    	let footer;
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
    	header.$on("toggle", /*toggleNav*/ ctx[3]);
    	header.$on("sethome", /*sethome_handler*/ ctx[5]);

    	mobilenav = new MobileNav({
    			props: { active: /*showNav*/ ctx[0] },
    			$$inline: true
    		});

    	mobilenav.$on("toggle", /*toggleNav*/ ctx[3]);

    	searchbar = new SearchBar({
    			props: {
    				placeholder: "What are you looking for?",
    				hover: true
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block$c, create_if_block_1$7];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentPage*/ ctx[1] === "home") return 0;
    		if (/*currentPage*/ ctx[1] === "product") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	footer = new Footer({ $$inline: true });

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
    			if (if_block) if_block.c();
    			t4 = space();
    			create_component(footer.$$.fragment);
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

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, t4, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const mobilenav_changes = {};
    			if (dirty & /*showNav*/ 1) mobilenav_changes.active = /*showNav*/ ctx[0];
    			mobilenav.$set(mobilenav_changes);
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
    					if_block.m(t4.parentNode, t4);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headnotification.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(mobilenav.$$.fragment, local);
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headnotification.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(mobilenav.$$.fragment, local);
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(footer.$$.fragment, local);
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

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(t4);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$P.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$P($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let showNav = false;
    	const toggleNav = e => $$invalidate(0, showNav = e.detail.show);

    	if (showNav) {
    		document.body.style.height = "100%";
    		document.body.style.overflow = "hidden";
    	}

    	// update currentProduct to display ProductPage
    	let currentPage = "home";

    	let currentProduct = 90476908;

    	const productView = e => {
    		$$invalidate(1, currentPage = "product");
    		$$invalidate(2, currentProduct = e.detail.artno);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const sethome_handler = () => $$invalidate(1, currentPage = "home");

    	$$self.$capture_state = () => ({
    		HeadNotification,
    		Header,
    		SearchBar,
    		Homepage,
    		MobileNav,
    		ProductPage,
    		Footer,
    		showNav,
    		toggleNav,
    		currentPage,
    		currentProduct,
    		productView
    	});

    	$$self.$inject_state = $$props => {
    		if ("showNav" in $$props) $$invalidate(0, showNav = $$props.showNav);
    		if ("currentPage" in $$props) $$invalidate(1, currentPage = $$props.currentPage);
    		if ("currentProduct" in $$props) $$invalidate(2, currentProduct = $$props.currentProduct);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showNav, currentPage, currentProduct, toggleNav, productView, sethome_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$P, create_fragment$P, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$P.name
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
