
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
    function children(element) {
        return Array.from(element.childNodes);
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

    const propTypes = (prop, options) => {
      let validProp = false;

      if (Array.isArray(options)) {
        options.forEach((option) => (option === prop ? (validProp = true) : null));
        if (!validProp)
          throw new Error(
            `"${prop}" is not a valid PropType. Expected one of ${options.map(
          (option) => `"${option}"`
        )}`
          );
      } else if (options === "bool") {
        if (typeof prop !== "boolean")
          throw new Error(`"${prop}" is not of type boolean`);
      } else if (options === "string") {
        if (typeof prop !== "string")
          throw new Error(`${prop} is not of type string`);
      } else if (options === "number") {
        if (typeof prop !== "number")
          throw new Error(`${prop} is not of type number`);
      }
    };

    /* src\svg\Notification.svelte generated by Svelte v3.29.0 */

    const file = "src\\svg\\Notification.svelte";

    function create_fragment(ctx) {
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
    			add_location(path, file, 21, 2, 330);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon svelte-1cc7czh");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file, 13, 0, 161);
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
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
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

    /* src\svg\Search.svelte generated by Svelte v3.29.0 */

    const file$3 = "src\\svg\\Search.svelte";

    function create_fragment$3(ctx) {
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
    			add_location(path, file$3, 11, 2, 200);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$3, 10, 0, 133);
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Search",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\svg\ShoppingBag.svelte generated by Svelte v3.29.0 */

    const file$4 = "src\\svg\\ShoppingBag.svelte";

    function create_fragment$4(ctx) {
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
    			add_location(path, file$4, 19, 2, 349);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon hnf-svg-bag-default svelte-mz3j8z");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "display", "block");
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ShoppingBag",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\svg\ToggleArrow.svelte generated by Svelte v3.29.0 */

    const file$5 = "src\\svg\\ToggleArrow.svelte";

    function create_fragment$5(ctx) {
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
    			add_location(path, file$5, 20, 2, 296);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", "svelte-1cc7czh");
    			add_location(svg, file$5, 13, 0, 161);
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ToggleArrow",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\svg\User.svelte generated by Svelte v3.29.0 */

    const file$6 = "src\\svg\\User.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(path, file$6, 18, 2, 302);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon svelte-mz3j8z");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "User",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\svg\WishList.svelte generated by Svelte v3.29.0 */

    const file$7 = "src\\svg\\WishList.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(path, file$7, 18, 2, 302);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "class", "svg-icon  hnf-svg-icon svelte-mz3j8z");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$7, 10, 0, 133);
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WishList",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\atoms\Icon.svelte generated by Svelte v3.29.0 */
    const file$8 = "src\\components\\atoms\\Icon.svelte";

    // (110:34) 
    function create_if_block_7(ctx) {
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
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(110:34) ",
    		ctx
    	});

    	return block;
    }

    // (108:30) 
    function create_if_block_6(ctx) {
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
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(108:30) ",
    		ctx
    	});

    	return block;
    }

    // (106:37) 
    function create_if_block_5(ctx) {
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(106:37) ",
    		ctx
    	});

    	return block;
    }

    // (104:37) 
    function create_if_block_4(ctx) {
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(104:37) ",
    		ctx
    	});

    	return block;
    }

    // (102:32) 
    function create_if_block_3(ctx) {
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(102:32) ",
    		ctx
    	});

    	return block;
    }

    // (100:38) 
    function create_if_block_2(ctx) {
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(100:38) ",
    		ctx
    	});

    	return block;
    }

    // (98:30) 
    function create_if_block_1(ctx) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(98:30) ",
    		ctx
    	});

    	return block;
    }

    // (96:4) {#if icon === 'imageSearch'}
    function create_if_block(ctx) {
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(96:4) {#if icon === 'imageSearch'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
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
    		create_if_block_7
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*icon*/ ctx[4] === "imageSearch") return 0;
    		if (/*icon*/ ctx[4] === "menu") return 1;
    		if (/*icon*/ ctx[4] === "notification") return 2;
    		if (/*icon*/ ctx[4] === "search") return 3;
    		if (/*icon*/ ctx[4] === "shoppingBag") return 4;
    		if (/*icon*/ ctx[4] === "toggleArrow") return 5;
    		if (/*icon*/ ctx[4] === "user") return 6;
    		if (/*icon*/ ctx[4] === "wishList") return 7;
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
    			add_location(div0, file$8, 93, 2, 2456);
    			attr_dev(div1, "class", "icon svelte-17m2rzz");
    			add_location(div1, file$8, 94, 2, 2526);
    			attr_dev(div2, "ref", /*ref*/ ctx[0]);

    			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(`container ${/*small*/ ctx[2]
			? "container--small"
			: /*xsmall*/ ctx[3] ? "container--xsmall" : null} ${!/*hover*/ ctx[5] && "container--no-hover"}`) + " svelte-17m2rzz"));

    			attr_dev(div2, "style", div2_style_value = `cursor: ${/*cursor*/ ctx[1]} ${/*style*/ ctx[6]}`);
    			add_location(div2, file$8, 88, 0, 2260);
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

    			if (!current || dirty & /*cursor, style*/ 66 && div2_style_value !== (div2_style_value = `cursor: ${/*cursor*/ ctx[1]} ${/*style*/ ctx[6]}`)) {
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    	propTypes(cursor, ["auto", "default", "pointer", "text", "zoom-in", "zoom-out"]);

    	propTypes(icon, [
    		"imageSearch",
    		"menu",
    		"notification",
    		"search",
    		"shoppingBag",
    		"toggleArrow",
    		"user",
    		"wishList"
    	]);

    	propTypes(small, "bool");
    	propTypes(xsmall, "bool");
    	propTypes(hover, "bool");
    	propTypes(background, ["light-gray", "gray-100", "gray-800"]);
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
    		propTypes,
    		ImageSearch,
    		Menu,
    		Notification,
    		Search,
    		ShoppingBag,
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

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
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
    			id: create_fragment$8.name
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
    const file$9 = "src\\components\\molecules\\HeadNotification.svelte";

    // (88:4) {:else}
    function create_else_block(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(p, "class", "svelte-1ds6mvc");
    			add_location(p, file$9, 88, 6, 2471);
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
    		source: "(88:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:4) {#if action === 'link'}
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
    			add_location(span, file$9, 85, 8, 2419);
    			attr_dev(a, "href", /*href*/ ctx[4]);
    			attr_dev(a, "class", "svelte-1ds6mvc");
    			add_location(a, file$9, 83, 6, 2340);
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
    		source: "(83:4) {#if action === 'link'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
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
    			add_location(div0, file$9, 90, 4, 2501);
    			attr_dev(div1, "class", "message-section svelte-1ds6mvc");
    			add_location(div1, file$9, 81, 2, 2274);
    			attr_dev(p, "class", "svelte-1ds6mvc");
    			add_location(p, file$9, 99, 4, 2758);
    			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(`dismiss ${/*expand*/ ctx[1] && "dismiss--expand"}`) + " svelte-1ds6mvc"));
    			add_location(div2, file$9, 98, 2, 2698);
    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty(`notification ${/*show*/ ctx[0] && "notification--active"}`) + " svelte-1ds6mvc"));
    			add_location(div3, file$9, 80, 0, 2208);
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("HeadNotification", slots, []);
    	let { text = "Notification" } = $$props;
    	let { action = "link" } = $$props;
    	let { href = "Homepage" } = $$props;
    	let { show = false } = $$props;
    	let { expand = false } = $$props;
    	propTypes(text, "string");
    	propTypes(action, ["link", "reminder"]);
    	propTypes(href, "string");
    	propTypes(expand, "bool");

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
    		propTypes,
    		Notification,
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

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
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
    			id: create_fragment$9.name
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

    /* src\components\molecules\Header.svelte generated by Svelte v3.29.0 */
    const file$a = "src\\components\\molecules\\Header.svelte";

    function create_fragment$a(ctx) {
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
    			add_location(img, file$a, 19, 2, 430);
    			attr_dev(header, "class", "svelte-qt98mw");
    			add_location(header, file$a, 18, 0, 418);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let src = "./images/logo/ikea-logo-small.svg";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Icon, src });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\molecules\SearchBar.svelte generated by Svelte v3.29.0 */
    const file$b = "src\\components\\molecules\\SearchBar.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let form;
    	let icon0;
    	let t0;
    	let input;
    	let t1;
    	let icon1;
    	let div_class_value;
    	let current;

    	icon0 = new Icon({
    			props: {
    				icon: "search",
    				cursor: "text",
    				hover: false
    			},
    			$$inline: true
    		});

    	icon1 = new Icon({
    			props: {
    				icon: "imageSearch",
    				small: true,
    				background: "light-gray"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			form = element("form");
    			create_component(icon0.$$.fragment);
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			create_component(icon1.$$.fragment);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			attr_dev(input, "class", "svelte-90u96a");
    			add_location(input, file$b, 51, 4, 1353);
    			attr_dev(form, "class", "svelte-90u96a");
    			add_location(form, file$b, 49, 2, 1285);

    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(`search-bar ${/*hover*/ ctx[1]
			? "search-bar__secondary"
			: "search-bar__primary"}`) + " svelte-90u96a"));

    			add_location(div, file$b, 47, 0, 1193);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, form);
    			mount_component(icon0, form, null);
    			append_dev(form, t0);
    			append_dev(form, input);
    			append_dev(div, t1);
    			mount_component(icon1, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*placeholder*/ 1) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			}

    			if (!current || dirty & /*hover*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty(`search-bar ${/*hover*/ ctx[1]
			? "search-bar__secondary"
			: "search-bar__primary"}`) + " svelte-90u96a"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon0);
    			destroy_component(icon1);
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
    	validate_slots("SearchBar", slots, []);
    	let { placeholder = "Search" } = $$props;
    	let { hover = false } = $$props;
    	propTypes(hover, "bool");
    	propTypes(placeholder, "string");
    	const writable_props = ["placeholder", "hover"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("hover" in $$props) $$invalidate(1, hover = $$props.hover);
    	};

    	$$self.$capture_state = () => ({ propTypes, Icon, placeholder, hover });

    	$$self.$inject_state = $$props => {
    		if ("placeholder" in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ("hover" in $$props) $$invalidate(1, hover = $$props.hover);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [placeholder, hover];
    }

    class SearchBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { placeholder: 0, hover: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchBar",
    			options,
    			id: create_fragment$b.name
    		});
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
    }

    /* src\components\atoms\Title.svelte generated by Svelte v3.29.0 */
    const file$c = "src\\components\\atoms\\Title.svelte";

    // (50:24) 
    function create_if_block_5$1(ctx) {
    	let h6;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			h6 = element("h6");
    			if (default_slot) default_slot.c();
    			add_location(h6, file$c, 50, 2, 824);
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
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
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
    			if (detaching) detach_dev(h6);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(50:24) ",
    		ctx
    	});

    	return block;
    }

    // (46:24) 
    function create_if_block_4$1(ctx) {
    	let h5;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			if (default_slot) default_slot.c();
    			add_location(h5, file$c, 46, 2, 767);
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
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
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
    			if (detaching) detach_dev(h5);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(46:24) ",
    		ctx
    	});

    	return block;
    }

    // (42:24) 
    function create_if_block_3$1(ctx) {
    	let h4;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			if (default_slot) default_slot.c();
    			attr_dev(h4, "class", "svelte-tl6uja");
    			add_location(h4, file$c, 42, 2, 710);
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
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
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
    			if (detaching) detach_dev(h4);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(42:24) ",
    		ctx
    	});

    	return block;
    }

    // (38:24) 
    function create_if_block_2$1(ctx) {
    	let h3;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			if (default_slot) default_slot.c();
    			add_location(h3, file$c, 38, 2, 653);
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
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
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
    			if (detaching) detach_dev(h3);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(38:24) ",
    		ctx
    	});

    	return block;
    }

    // (34:24) 
    function create_if_block_1$1(ctx) {
    	let h2;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			if (default_slot) default_slot.c();
    			attr_dev(h2, "class", "svelte-tl6uja");
    			add_location(h2, file$c, 34, 2, 596);
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
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
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
    			if (detaching) detach_dev(h2);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(34:24) ",
    		ctx
    	});

    	return block;
    }

    // (30:0) {#if type === 'h1'}
    function create_if_block$2(ctx) {
    	let h1;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "class", "svelte-tl6uja");
    			add_location(h1, file$c, 30, 2, 539);
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
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
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
    			if (detaching) detach_dev(h1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(30:0) {#if type === 'h1'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block$2,
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Title", slots, ['default']);
    	let { type = "h1" } = $$props;
    	propTypes(type, ["h1", "h2", "h3", "h4", "h5", "h6"]);
    	const writable_props = ["type"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Title> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ propTypes, type });

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, $$scope, slots];
    }

    class Title extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { type: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Title",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get type() {
    		throw new Error("<Title>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Title>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\Section.svelte generated by Svelte v3.29.0 */

    const file$d = "src\\components\\atoms\\Section.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "section svelte-1vk1jem");
    			add_location(div, file$d, 9, 0, 130);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\components\atoms\Rule.svelte generated by Svelte v3.29.0 */

    const file$e = "src\\components\\atoms\\Rule.svelte";

    function create_fragment$e(ctx) {
    	let hr;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			attr_dev(hr, "class", "svelte-per6ep");
    			add_location(hr, file$e, 12, 0, 197);
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props) {
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Rule",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\components\atoms\Card.svelte generated by Svelte v3.29.0 */
    const file$f = "src\\components\\atoms\\Card.svelte";

    function create_fragment$f(ctx) {
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
    			add_location(div, file$f, 19, 0, 391);
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, ['default']);
    	let { style } = $$props;
    	let { ref } = $$props;
    	let { shadow = false } = $$props;
    	propTypes(shadow, "bool");
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

    	$$self.$capture_state = () => ({ propTypes, style, ref, shadow });

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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { style: 0, ref: 1, shadow: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !("style" in props)) {
    			console.warn("<Card> was created without expected prop 'style'");
    		}

    		if (/*ref*/ ctx[1] === undefined && !("ref" in props)) {
    			console.warn("<Card> was created without expected prop 'ref'");
    		}
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
    const file$g = "src\\components\\molecules\\ImageCard.svelte";

    // (46:0) <Card ref="image-card" style={` ${style}`}>
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
    			add_location(img, file$g, 46, 2, 1229);
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
    		source: "(46:0) <Card ref=\\\"image-card\\\" style={` ${style}`}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageCard", slots, ['default']);
    	let { src = "" } = $$props;
    	let { top = 50 } = $$props;
    	let { left = 50 } = $$props;
    	let { orientation = "portrait" } = $$props;
    	let { aspectRatio = "4:3" } = $$props;
    	propTypes(src, "string");
    	propTypes(top, "number");
    	propTypes(left, "number");
    	propTypes(orientation, ["portrait", "landscape"]);
    	propTypes(aspectRatio, ["16:9", "4:3", "1:1"]);
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
    		propTypes,
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

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
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
    			id: create_fragment$g.name
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

    /* src\components\atoms\Family.svelte generated by Svelte v3.29.0 */

    const file$h = "src\\components\\atoms\\Family.svelte";

    function create_fragment$h(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "IKEA Family price";
    			attr_dev(p, "class", "svelte-z0yx9f");
    			add_location(p, file$h, 11, 0, 173);
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props) {
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
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Family",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\components\atoms\News.svelte generated by Svelte v3.29.0 */

    const file$i = "src\\components\\atoms\\News.svelte";

    function create_fragment$i(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "New";
    			attr_dev(p, "class", "svelte-mbbwx4");
    			add_location(p, file$i, 11, 0, 173);
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props) {
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
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "News",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\components\molecules\ProductCard.svelte generated by Svelte v3.29.0 */
    const file$j = "src\\components\\molecules\\ProductCard.svelte";

    // (72:6) {#if news}
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
    		source: "(72:6) {#if news}",
    		ctx
    	});

    	return block;
    }

    // (75:6) {#if family}
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
    		source: "(75:6) {#if family}",
    		ctx
    	});

    	return block;
    }

    // (82:34) <Title type="h4">
    function create_default_slot_1(ctx) {
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
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(82:34) <Title type=\\\"h4\\\">",
    		ctx
    	});

    	return block;
    }

    // (84:4) {#if regularPrice}
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
    			add_location(p, file$j, 84, 6, 2226);
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
    		source: "(84:4) {#if regularPrice}",
    		ctx
    	});

    	return block;
    }

    // (89:6) {#if pieces > 0}
    function create_if_block$3(ctx) {
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
    			add_location(span, file$j, 88, 22, 2396);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(89:6) {#if pieces > 0}",
    		ctx
    	});

    	return block;
    }

    // (69:0) <Card shadow>
    function create_default_slot$1(ctx) {
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
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block2 = /*regularPrice*/ ctx[5] && create_if_block_1$2(ctx);
    	let if_block3 = /*pieces*/ ctx[7] > 0 && create_if_block$3(ctx);

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
    			add_location(div0, file$j, 70, 4, 1837);
    			attr_dev(div1, "class", "info__icon svelte-192r169");
    			add_location(div1, file$j, 78, 4, 1988);
    			attr_dev(a, "href", /*href*/ ctx[2]);
    			attr_dev(a, "class", "info__title svelte-192r169");
    			add_location(a, file$j, 81, 4, 2079);
    			attr_dev(p0, "class", "info__subtitle svelte-192r169");
    			add_location(p0, file$j, 82, 4, 2151);
    			attr_dev(span, "class", "currency svelte-192r169");
    			add_location(span, file$j, 87, 6, 2334);
    			attr_dev(p1, "class", "info__price svelte-192r169");
    			add_location(p1, file$j, 86, 4, 2303);
    			attr_dev(div2, "class", "info svelte-192r169");
    			add_location(div2, file$j, 69, 2, 1813);
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

    			if (dirty & /*$$scope, title*/ 264) {
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
    					if_block3 = create_if_block$3(ctx);
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(69:0) <Card shadow>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let card;
    	let current;

    	card = new Card({
    			props: {
    				shadow: true,
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

    			if (dirty & /*$$scope, pieces, price, regularPrice, productType, href, title, family, news*/ 511) {
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
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
    	propTypes(news, "bool");
    	propTypes(family, "bool");
    	propTypes(href, "string");
    	propTypes(title, "string");
    	propTypes(productType, "string");
    	propTypes(regularPrice, "number");
    	propTypes(price, "number");
    	propTypes(pieces, "number");

    	const writable_props = [
    		"news",
    		"family",
    		"href",
    		"title",
    		"productType",
    		"regularPrice",
    		"price",
    		"pieces"
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
    	};

    	$$self.$capture_state = () => ({
    		propTypes,
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
    		pieces
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
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [news, family, href, title, productType, regularPrice, price, pieces];
    }

    class ProductCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {
    			news: 0,
    			family: 1,
    			href: 2,
    			title: 3,
    			productType: 4,
    			regularPrice: 5,
    			price: 6,
    			pieces: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProductCard",
    			options,
    			id: create_fragment$j.name
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
    }

    /* src\components\atoms\Button.svelte generated by Svelte v3.29.0 */
    const file$k = "src\\components\\atoms\\Button.svelte";

    // (53:0) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "button svelte-o3ixoc");
    			toggle_class(button, "button--secondary", /*secondary*/ ctx[0]);
    			toggle_class(button, "button--tertiary", /*tertiary*/ ctx[1]);
    			add_location(button, file$k, 53, 2, 1237);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (dirty & /*secondary*/ 1) {
    				toggle_class(button, "button--secondary", /*secondary*/ ctx[0]);
    			}

    			if (dirty & /*tertiary*/ 2) {
    				toggle_class(button, "button--tertiary", /*tertiary*/ ctx[1]);
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(53:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:0) {#if href}
    function create_if_block$4(ctx) {
    	let a;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "class", "button svelte-o3ixoc");
    			attr_dev(a, "href", /*href*/ ctx[2]);
    			toggle_class(a, "button--secondary", /*secondary*/ ctx[0]);
    			toggle_class(a, "button--tertiary", /*tertiary*/ ctx[1]);
    			add_location(a, file$k, 47, 2, 1097);
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
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*href*/ 4) {
    				attr_dev(a, "href", /*href*/ ctx[2]);
    			}

    			if (dirty & /*secondary*/ 1) {
    				toggle_class(a, "button--secondary", /*secondary*/ ctx[0]);
    			}

    			if (dirty & /*tertiary*/ 2) {
    				toggle_class(a, "button--tertiary", /*tertiary*/ ctx[1]);
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
    		source: "(47:0) {#if href}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*href*/ ctx[2]) return 0;
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
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { secondary = false } = $$props;
    	let { tertiary = false } = $$props;
    	let { href } = $$props;
    	propTypes(secondary, "bool");
    	propTypes(tertiary, "bool");
    	const writable_props = ["secondary", "tertiary", "href"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("secondary" in $$props) $$invalidate(0, secondary = $$props.secondary);
    		if ("tertiary" in $$props) $$invalidate(1, tertiary = $$props.tertiary);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ propTypes, secondary, tertiary, href });

    	$$self.$inject_state = $$props => {
    		if ("secondary" in $$props) $$invalidate(0, secondary = $$props.secondary);
    		if ("tertiary" in $$props) $$invalidate(1, tertiary = $$props.tertiary);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [secondary, tertiary, href, $$scope, slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, { secondary: 0, tertiary: 1, href: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$k.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*href*/ ctx[2] === undefined && !("href" in props)) {
    			console.warn("<Button> was created without expected prop 'href'");
    		}
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

    	get href() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\SectionText.svelte generated by Svelte v3.29.0 */

    const file$l = "src\\components\\atoms\\SectionText.svelte";

    function create_fragment$l(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "container svelte-kvawct");
    			add_location(p, file$l, 10, 0, 160);
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
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SectionText",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\components\atoms\Link.svelte generated by Svelte v3.29.0 */
    const file$m = "src\\components\\atoms\\Link.svelte";

    // (36:2) {#if icon}
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
    			add_location(div, file$m, 36, 4, 803);
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
    		source: "(36:2) {#if icon}",
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
    			add_location(div, file$m, 32, 2, 735);
    			attr_dev(a, "href", /*href*/ ctx[0]);
    			attr_dev(a, "class", "link svelte-r69kg7");
    			attr_dev(a, "style", /*style*/ ctx[2]);
    			add_location(a, file$m, 31, 0, 700);
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
    	let { style } = $$props;
    	propTypes(href, "string");
    	propTypes(icon, "bool");
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

    	$$self.$capture_state = () => ({
    		propTypes,
    		ToggleArrow,
    		href,
    		icon,
    		style
    	});

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

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[2] === undefined && !("style" in props)) {
    			console.warn("<Link> was created without expected prop 'style'");
    		}
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

    /* src\svg\StadardArrow.svelte generated by Svelte v3.29.0 */

    const file$n = "src\\svg\\StadardArrow.svelte";

    function create_fragment$n(ctx) {
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
    			add_location(path, file$n, 10, 62, 195);
    			attr_dev(svg, "focusable", "false");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", "svelte-mz3j8z");
    			add_location(svg, file$n, 10, 0, 133);
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
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props) {
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
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StadardArrow",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\components\molecules\SeeMoreCard.svelte generated by Svelte v3.29.0 */
    const file$o = "src\\components\\molecules\\SeeMoreCard.svelte";

    // (20:2) <Link {href}>
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
    			add_location(div0, file$o, 20, 4, 445);
    			attr_dev(div1, "class", "icon svelte-r7t734");
    			add_location(div1, file$o, 23, 4, 497);
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
    		source: "(20:2) <Link {href}>",
    		ctx
    	});

    	return block;
    }

    // (19:0) <Card {style}>
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
    		source: "(19:0) <Card {style}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SeeMoreCard", slots, ['default']);
    	let { style } = $$props;
    	let { href = "/" } = $$props;
    	propTypes(href, "string");
    	const writable_props = ["style", "href"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SeeMoreCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    		if ("href" in $$props) $$invalidate(1, href = $$props.href);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		propTypes,
    		Card,
    		StandardArrow: StadardArrow,
    		Link,
    		style,
    		href
    	});

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
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, { style: 0, href: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SeeMoreCard",
    			options,
    			id: create_fragment$o.name
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
    const file$p = "src\\components\\atoms\\ImagePointer.svelte";

    function create_fragment$p(ctx) {
    	let div;
    	let div_style_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pointer svelte-12cd44o");
    			attr_dev(div, "style", div_style_value = `left: ${/*x*/ ctx[0]}%; top: ${/*y*/ ctx[1]}%`);
    			add_location(div, file$p, 37, 0, 893);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*x, y*/ 3 && div_style_value !== (div_style_value = `left: ${/*x*/ ctx[0]}%; top: ${/*y*/ ctx[1]}%`)) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$p($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImagePointer", slots, []);
    	let { x = 0 } = $$props;
    	let { y = 0 } = $$props;
    	propTypes(y, "number");
    	propTypes(x, "number");
    	const writable_props = ["x", "y"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImagePointer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    	};

    	$$self.$capture_state = () => ({ propTypes, x, y });

    	$$self.$inject_state = $$props => {
    		if ("x" in $$props) $$invalidate(0, x = $$props.x);
    		if ("y" in $$props) $$invalidate(1, y = $$props.y);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [x, y];
    }

    class ImagePointer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, { x: 0, y: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImagePointer",
    			options,
    			id: create_fragment$p.name
    		});
    	}

    	get x() {
    		throw new Error("<ImagePointer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<ImagePointer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<ImagePointer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<ImagePointer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\atoms\ImageOverlay.svelte generated by Svelte v3.29.0 */

    const file$q = "src\\components\\atoms\\ImageOverlay.svelte";

    function create_fragment$q(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "overlay svelte-1iryf55");
    			add_location(div, file$q, 11, 0, 146);
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
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ImageOverlay", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ImageOverlay> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class ImageOverlay extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageOverlay",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src\components\views\Homepage.svelte generated by Svelte v3.29.0 */
    const file$r = "src\\components\\views\\Homepage.svelte";

    // (19:2) <Title>
    function create_default_slot_15(ctx) {
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
    		id: create_default_slot_15.name,
    		type: "slot",
    		source: "(19:2) <Title>",
    		ctx
    	});

    	return block;
    }

    // (34:4) <SeeMoreCard style="position: absolute; bottom: 1rem; left: 1rem;">
    function create_default_slot_14(ctx) {
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
    		id: create_default_slot_14.name,
    		type: "slot",
    		source: "(34:4) <SeeMoreCard style=\\\"position: absolute; bottom: 1rem; left: 1rem;\\\">",
    		ctx
    	});

    	return block;
    }

    // (33:2) <ImageCard src="images/photos/festive-baking.jpg" left={10}>
    function create_default_slot_13(ctx) {
    	let seemorecard;
    	let current;

    	seemorecard = new SeeMoreCard({
    			props: {
    				style: "position: absolute; bottom: 1rem; left: 1rem;",
    				$$slots: { default: [create_default_slot_14] },
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
    		id: create_default_slot_13.name,
    		type: "slot",
    		source: "(33:2) <ImageCard src=\\\"images/photos/festive-baking.jpg\\\" left={10}>",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Section>
    function create_default_slot_12(ctx) {
    	let title;
    	let t0;
    	let imagecard;
    	let t1;
    	let rule;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_15] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	imagecard = new ImageCard({
    			props: {
    				src: "images/photos/festive-baking.jpg",
    				left: 10,
    				$$slots: { default: [create_default_slot_13] },
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
    		id: create_default_slot_12.name,
    		type: "slot",
    		source: "(18:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (43:4) <Title>
    function create_default_slot_11(ctx) {
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("See our products in real homes ");
    			br = element("br");
    			t1 = text(" @ikeauk");
    			add_location(br, file$r, 42, 42, 1397);
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
    		id: create_default_slot_11.name,
    		type: "slot",
    		source: "(43:4) <Title>",
    		ctx
    	});

    	return block;
    }

    // (44:4) <Button href="#">
    function create_default_slot_10(ctx) {
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
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(44:4) <Button href=\\\"#\\\">",
    		ctx
    	});

    	return block;
    }

    // (41:2) <Card      style="display: grid; grid-template-columns: 1fr auto; align-items: flex-start;">
    function create_default_slot_9(ctx) {
    	let title;
    	let t;
    	let button;
    	let current;

    	title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_11] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button = new Button({
    			props: {
    				href: "#",
    				$$slots: { default: [create_default_slot_10] },
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
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(41:2) <Card      style=\\\"display: grid; grid-template-columns: 1fr auto; align-items: flex-start;\\\">",
    		ctx
    	});

    	return block;
    }

    // (40:0) <Section>
    function create_default_slot_8(ctx) {
    	let card;
    	let t0;
    	let p;
    	let t2;
    	let rule;
    	let current;

    	card = new Card({
    			props: {
    				style: "display: grid; grid-template-columns: 1fr auto; align-items: flex-start;",
    				$$slots: { default: [create_default_slot_9] },
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
    			p.textContent = "Slideshow goes here";
    			t2 = space();
    			create_component(rule.$$.fragment);
    			add_location(p, file$r, 45, 2, 1475);
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
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(40:0) <Section>",
    		ctx
    	});

    	return block;
    }

    // (50:2) <Title type="h2">
    function create_default_slot_7(ctx) {
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
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(50:2) <Title type=\\\"h2\\\">",
    		ctx
    	});

    	return block;
    }

    // (51:2) <SectionText>
    function create_default_slot_6(ctx) {
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
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(51:2) <SectionText>",
    		ctx
    	});

    	return block;
    }

    // (56:4) <ImageOverlay>
    function create_default_slot_5(ctx) {
    	let imagepointer0;
    	let t0;
    	let imagepointer1;
    	let t1;
    	let imagepointer2;
    	let t2;
    	let imagepointer3;
    	let current;
    	imagepointer0 = new ImagePointer({ props: { x: 20, y: 20 }, $$inline: true });
    	imagepointer1 = new ImagePointer({ props: { x: 24, y: 38 }, $$inline: true });
    	imagepointer2 = new ImagePointer({ props: { x: 74, y: 26 }, $$inline: true });
    	imagepointer3 = new ImagePointer({ props: { x: 72, y: 65 }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(imagepointer0.$$.fragment);
    			t0 = space();
    			create_component(imagepointer1.$$.fragment);
    			t1 = space();
    			create_component(imagepointer2.$$.fragment);
    			t2 = space();
    			create_component(imagepointer3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imagepointer0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(imagepointer1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(imagepointer2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(imagepointer3, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagepointer0.$$.fragment, local);
    			transition_in(imagepointer1.$$.fragment, local);
    			transition_in(imagepointer2.$$.fragment, local);
    			transition_in(imagepointer3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagepointer0.$$.fragment, local);
    			transition_out(imagepointer1.$$.fragment, local);
    			transition_out(imagepointer2.$$.fragment, local);
    			transition_out(imagepointer3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imagepointer0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(imagepointer1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(imagepointer2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(imagepointer3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(56:4) <ImageOverlay>",
    		ctx
    	});

    	return block;
    }

    // (55:2) <ImageCard src="images/photos/strala-lights.jpg">
    function create_default_slot_4(ctx) {
    	let imageoverlay;
    	let current;

    	imageoverlay = new ImageOverlay({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
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
    		p: function update(ctx, dirty) {
    			const imageoverlay_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				imageoverlay_changes.$$scope = { dirty, ctx };
    			}

    			imageoverlay.$set(imageoverlay_changes);
    		},
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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(55:2) <ImageCard src=\\\"images/photos/strala-lights.jpg\\\">",
    		ctx
    	});

    	return block;
    }

    // (64:4) <ImageOverlay>
    function create_default_slot_3(ctx) {
    	let imagepointer0;
    	let t0;
    	let imagepointer1;
    	let t1;
    	let imagepointer2;
    	let current;
    	imagepointer0 = new ImagePointer({ props: { x: 41, y: 33 }, $$inline: true });
    	imagepointer1 = new ImagePointer({ props: { x: 55, y: 40 }, $$inline: true });
    	imagepointer2 = new ImagePointer({ props: { x: 25, y: 75 }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(imagepointer0.$$.fragment);
    			t0 = space();
    			create_component(imagepointer1.$$.fragment);
    			t1 = space();
    			create_component(imagepointer2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imagepointer0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(imagepointer1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(imagepointer2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imagepointer0.$$.fragment, local);
    			transition_in(imagepointer1.$$.fragment, local);
    			transition_in(imagepointer2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imagepointer0.$$.fragment, local);
    			transition_out(imagepointer1.$$.fragment, local);
    			transition_out(imagepointer2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imagepointer0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(imagepointer1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(imagepointer2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(64:4) <ImageOverlay>",
    		ctx
    	});

    	return block;
    }

    // (63:2) <ImageCard src="images/photos/christmas-decor.jpg">
    function create_default_slot_2(ctx) {
    	let imageoverlay;
    	let current;

    	imageoverlay = new ImageOverlay({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
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
    		p: function update(ctx, dirty) {
    			const imageoverlay_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				imageoverlay_changes.$$scope = { dirty, ctx };
    			}

    			imageoverlay.$set(imageoverlay_changes);
    		},
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(63:2) <ImageCard src=\\\"images/photos/christmas-decor.jpg\\\">",
    		ctx
    	});

    	return block;
    }

    // (70:2) <Link style="display: grid; margin: 1.25rem 0 1rem 0;" icon>
    function create_default_slot_1$2(ctx) {
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
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(70:2) <Link style=\\\"display: grid; margin: 1.25rem 0 1rem 0;\\\" icon>",
    		ctx
    	});

    	return block;
    }

    // (49:0) <Section>
    function create_default_slot$3(ctx) {
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
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sectiontext = new SectionText({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	imagecard0 = new ImageCard({
    			props: {
    				src: "images/photos/strala-lights.jpg",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	imagecard1 = new ImageCard({
    			props: {
    				src: "images/photos/christmas-decor.jpg",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	link = new Link({
    			props: {
    				style: "display: grid; margin: 1.25rem 0 1rem 0;",
    				icon: true,
    				$$slots: { default: [create_default_slot_1$2] },
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
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(49:0) <Section>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let section0;
    	let t0;
    	let section1;
    	let t1;
    	let section2;
    	let current;

    	section0 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_12] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section1 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	section2 = new Section({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
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
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(section0.$$.fragment, local);
    			transition_in(section1.$$.fragment, local);
    			transition_in(section2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(section0.$$.fragment, local);
    			transition_out(section1.$$.fragment, local);
    			transition_out(section2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(section0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(section1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(section2, detaching);
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
    		ProductCard,
    		Button,
    		Card,
    		SectionText,
    		Link,
    		SeeMoreCard,
    		ImagePointer,
    		ImageOverlay
    	});

    	return [];
    }

    class Homepage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Homepage",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.29.0 */

    function create_fragment$s(ctx) {
    	let headnotification;
    	let t0;
    	let header;
    	let t1;
    	let searchbar;
    	let t2;
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
    			create_component(searchbar.$$.fragment);
    			t2 = space();
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
    			mount_component(searchbar, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(homepage, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headnotification.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(searchbar.$$.fragment, local);
    			transition_in(homepage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headnotification.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(searchbar.$$.fragment, local);
    			transition_out(homepage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(headnotification, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(searchbar, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(homepage, detaching);
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
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		HeadNotification,
    		Header,
    		SearchBar,
    		Homepage
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$s.name
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
