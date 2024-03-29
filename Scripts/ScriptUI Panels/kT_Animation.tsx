/// <reference types='types-for-adobe/AfterEffects/18.0'/>

(function kT_Animation(thisObj: any) {
    function _separate(prop: Property, layer: AVLayer) {
        if (prop.value instanceof Array) {
            let prop_sepr = layer.effect.addProperty('Pseudo/kTASepr') as Property;
            let target_prop = prop_sepr.property('Pseudo/kTASepr-0001') as Property;
            target_prop.expression = `// ${prop.name}\rvalue`;

            let buf = '[';
            for (let i = 0; i < prop.value.length; ++i) {
                let curr_dim = prop_sepr.property(`Pseudo/kTASepr-000${i + 2}`) as Property;
                if (prop.selectedKeys && prop.selectedKeys.length > 0) {
                    let sel_keys = prop.selectedKeys;
                    for (const curr_key of sel_keys) {
                        curr_dim.setValueAtTime(prop.keyTime(curr_key), prop.keyValue(curr_key)[i]);
                    }
                }
                buf += `effect("${prop_sepr.name}")("Pseudo/kTASepr-000${i + 2}"), `;
            }
            prop.expression = buf.slice(0, -2) + ']';
        }
    }

    function _normalize(prop: Property, layer: AVLayer) {
        let sel_keys = prop.selectedKeys;
        if (prop.value instanceof Array) {
            let ranges = new Array<number>(prop.value.length);
            for (let i = 0; i < ranges.length; ++i) {
                ranges[i] = 1;
                let max: number;
                let min: number;
                for (const curr_key of sel_keys) {
                    max = Math.max(...prop.keyValue(curr_key));
                    min = Math.min(...prop.keyValue(curr_key));
                }
                if (min != 0 && max != 0) {
                    ranges[i] = Math.max(Math.abs(max), Math.abs(min));
                }
            }

            let prop_norm = layer.effect.addProperty('Pseudo/kTANrmlMD') as Property;
            let target_prop = prop_norm.property('Pseudo/kTANrmlMD-0001') as Property;
            target_prop.expression = `// ${prop.name}\rvalue`;

            let buf = '[';
            for (let i = 0; i < prop.value.length; ++i) {
                let target_amount = prop_norm.property(`Pseudo/kTANrmlMD-000${(2 * i + 2)}`) as Property;
                let target_range = prop_norm.property(`Pseudo/kTANrmlMD-000${(2 * i + 3)}`) as Property;
                for (const curr_key of sel_keys) {
                    target_amount.setValueAtTime(prop.keyTime(curr_key), prop.keyValue(curr_key)[i] / ranges[i]);
                }
                target_range.setValue(ranges[i]);

                buf += `effect("${prop_norm.name}")("Pseudo/kTANrmlMD-000${(2 * i + 2)}") * effect("${prop_norm.name}")("Pseudo/kTANrmlMD-000${(2 * i + 3)}"), `;
            }
            prop.expression = buf.slice(0, -2) + ']';
        } else {
            let range = 1;
            let max: number;
            let min: number;
            for (const curr_key of sel_keys) {
                max = Math.max(...prop.keyValue(curr_key));
                min = Math.min(...prop.keyValue(curr_key));
            }
            if (min != 0 && max != 0) {
                range = Math.max(Math.abs(max), Math.abs(min));
            }

            let prop_norm = layer.effect.addProperty('Pseudo/kTANrmlSD') as Property;
            let target_prop = prop_norm.property('Pseudo/kTANrmlSD-0001') as Property;
            target_prop.expression = `// ${prop.name}\rvalue`;

            let target_amount = target_prop.property('Pseudo/kTANrmlSD-0002') as Property;
            let target_range = target_prop.property('Pseudo/kTANrmlSD-0003') as Property;
            for (const curr_key of sel_keys) {
                target_amount.setValueAtTime(prop.keyTime(curr_key), prop.keyValue(curr_key) / range);
            }
            target_range.setValue(range);

            prop.expression = `[effect("${target_prop.name}")("Pseudo/kTANrmlSD-0002") * effect("${target_prop.name}")("Pseudo/kTANrmlSD-0003")]`;
        }
    }

    function _interpolate(prop: Property, infl_in: number, infl_out: number, overshoot: number, is_inversed: boolean) {
        let sel_keys = prop.selectedKeys;
        let speeds = new Array(sel_keys.length);
        for (let j = 1; j < sel_keys.length; ++j) {
            let curr_key = sel_keys[j];
            let dx = prop.keyValue(curr_key) - prop.keyValue(curr_key - 1);
            let dt = prop.keyTime(curr_key) - prop.keyTime(curr_key - 1);
            speeds[j - 1] = dx * (1 + overshoot / 100) / dt / (infl_out / 100);
        }

        if (prop.value instanceof Array) {
            speeds[sel_keys.length - 1] = new Array(prop.value.length);
            for (let i = 0; i < speeds[sel_keys.length - 1].length; ++i) {
                speeds[sel_keys.length - 1][i] = 0;
            }

            let ease_ins = new Array(prop.value.length)[prop.value.length];
            let ease_outs = new Array(prop.value.length)[prop.value.length];
            for (let j = 0; j < sel_keys.length; ++j) {
                let curr_key = sel_keys[j];

                for (let i = 0; i < prop.value.length; ++i) {
                    if (is_inversed) {
                        ease_ins[i] = new KeyframeEase(speeds[(sel_keys.length - 1) - j][i], infl_out);
                        ease_outs[i] = new KeyframeEase(0, infl_in);
                    } else {
                        ease_ins[i] = new KeyframeEase(0, infl_in);
                        ease_outs[i] = new KeyframeEase(speeds[j][i], infl_out);
                    }
                }

                prop.setInterpolationTypeAtKey(curr_key, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
                prop.setTemporalEaseAtKey(curr_key, ease_ins, ease_outs);
            }
        } else {
            speeds[sel_keys.length - 1] = 0;
            for (let j = 0; j < sel_keys.length; ++j) {
                let curr_key = sel_keys[j];

                let ease_in: KeyframeEase;
                let ease_out: KeyframeEase;
                if (is_inversed) {
                    ease_in = new KeyframeEase(speeds[sel_keys.length - j - 1], infl_out);
                    ease_out = new KeyframeEase(0, infl_in);
                } else {
                    ease_in = new KeyframeEase(0, infl_in);
                    ease_out = new KeyframeEase(speeds[j], infl_out);
                }

                prop.setInterpolationTypeAtKey(curr_key, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
                prop.setTemporalEaseAtKey(curr_key, [ease_in], [ease_out]);
            }
        }
    }

    function separate() {
        let fn_name = 'kTools_Animation_Separate';

        app.beginUndoGroup(fn_name);
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            const sel_layers = app.project.activeItem.layers;
            for (let i = 1; i <= sel_layers.length; ++i) {
                const curr_layer = sel_layers[i];
                if (curr_layer.selectedProperties && curr_layer.selectedProperties.length > 0) {
                    const sel_props = curr_layer.selectedProperties;
                    for (const curr_prop of sel_props) {
                        _separate(curr_prop as Property, curr_layer as AVLayer);
                    }
                }
            }
        }
        app.endUndoGroup();
    }

    function normalize() {
        let fn_name = 'kTools_Animation_Normalize';

        app.beginUndoGroup(fn_name);
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            const sel_layers = app.project.activeItem.layers;
            for (let i = 1; i <= sel_layers.length; ++i) {
                const curr_layer = sel_layers[i];
                if (curr_layer.selectedProperties && curr_layer.selectedProperties.length > 0) {
                    const sel_props = curr_layer.selectedProperties;
                    for (const curr_prop of sel_props) {
                        if (curr_prop instanceof Property && curr_prop.selectedKeys && curr_prop.selectedKeys.length > 0) {
                            _normalize(curr_prop, curr_layer as AVLayer);
                        }
                    }
                }
            }
        }
        app.endUndoGroup();
    }

    function interpolate(infl_in: number, infl_out: number, overshoot: number, is_inversed: boolean) {
        let fn_name = 'kTools_Animation_Interpolate';

        app.beginUndoGroup(fn_name);
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            const sel_layers = app.project.activeItem.layers;
            for (let i = 1; i <= sel_layers.length; ++i) {
                const curr_layer = sel_layers[i];
                if (curr_layer.selectedProperties && curr_layer.selectedProperties.length > 0) {
                    const sel_props = curr_layer.selectedProperties;
                    for (const curr_prop of sel_props) {
                        if (curr_prop instanceof Property && curr_prop.selectedKeys && curr_prop.selectedKeys.length > 0) {
                            _interpolate(curr_prop, infl_in, infl_out, overshoot, is_inversed);
                        }
                    }
                }
            }
        }
        app.endUndoGroup();
    }

    function buildUI(thisObj: any) {
        let win = (thisObj instanceof Panel) ? thisObj : (new Window('palette', 'kTools'));

        win.orientation = 'column';
        win.alignChildren = 'left';

        let btn_separate = win.add('button', undefined, 'Separate!');
        let btn_normalize = win.add('button', undefined, 'Normalize!');
        let btn_interpolate = win.add('button', undefined, 'Interpolate!');
        let txt_infl_out = win.add('edittext', [0, 0, 40, 40] as Bounds, '10');
        let txt_infl_in = win.add('edittext', [0, 0, 40, 40] as Bounds, '90');
        let txt_overshoot = win.add('edittext', [0, 0, 40, 40] as Bounds, '0');
        let chk_is_inversed = win.add('checkbox', undefined, 'Inverse');

        txt_infl_out.onChange = () => {
            txt_infl_in.text = (100 - parseFloat(this.text)).toString();
        }
        txt_infl_in.onChange = () => {
            txt_infl_out.text = (100 - parseFloat(this.text)).toString();
        }

        btn_separate.onClick = separate;
        btn_normalize.onClick = normalize;
        btn_interpolate.onClick = () => {
            interpolate(
                parseFloat(txt_infl_in.text),
                parseFloat(txt_infl_out.text),
                parseFloat(txt_overshoot.text),
                chk_is_inversed.value
            );
        }

        win.layout.layout(true);
        return win;
    }

    buildUI(thisObj);
})(this);
