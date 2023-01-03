(function kT_Animation(thisObj) {

    function do_separate(prop, layer) {
        // Check whether selected properties are multi-dimensional
        if (prop.value instanceof Array) {
            var prop_sepr = layer.effect.addProperty("Pseudo/kTASepr");
            prop_sepr.property("Pseudo/kTASepr-0001").expression = "//" + prop.name + "\rvalue";

            var buf = '[';
            for (var i = 0; i < prop.value.length; ++i) {
                var curr_dim = prop_sepr.property("Pseudo/kTASepr-000" + (i + 2));
                if (prop.selectedKeys && prop.selectedKeys.length > 0) {
                    var sel_keys = prop.selectedKeys;
                    for (var j = 0; j < sel_keys.length; ++j) {
                        var curr_key = sel_keys[j];
                        curr_dim.setValueAtTime(prop.keyTime(curr_key), prop.keyValue(curr_key)[i]);
                    }
                }
                buf += 'effect("' + prop_sepr.name + '")("Pseudo/kTASepr-000' + (i + 2) + '"), ';
            }
            prop.expression = buf.slice(0, -2) + ']';
        }
    }

    function do_normalize(prop, layer) {
        var sel_keys = prop.selectedKeys;
        // Check whether selected properties are multi-dimensional
        if (prop.value instanceof Array) {
            var ranges = new Array(sel_keys.length);
            for (var i = 0; i < ranges.length; ++i) {
                ranges[i] = 1;
            }
            for (var i = 0; i < prop.value.length; ++i) {
                var max_value = -Infinity;
                var min_value = Infinity;
                for (var j = 0; j < sel_keys.length; ++j) {
                    var curr_key = sel_keys[j];
                    max_value = (prop.keyValue(curr_key)[i] > max_value) ? prop.keyValue(curr_key)[i] : max_value;
                    min_value = (prop.keyValue(curr_key)[i] < min_value) ? prop.keyValue(curr_key)[i] : min_value;
                }
                if (!(min_value == 0 && max_value == 0)) {
                    ranges[i] = Math.max(Math.abs(max_value), Math.abs(min_value));
                }
            }

            var prop_norm = layer.effect.addProperty("Pseudo/kTANrmlMD");
            prop_norm.property("Pseudo/kTANrmlMD-0001").expression = "//" + prop.name + "\rvalue";

            var buf = '[';
            for (var i = 0; i < prop.value.length; ++i) {
                var target_amount = prop_norm.property("Pseudo/kTANrmlMD-000" + (2 * i + 2));
                var target_range = prop_norm.property("Pseudo/kTANrmlMD-000" + (2 * i + 3));
                for (var j = 0; j < sel_keys.length; ++j) {
                    var curr_key = sel_keys[j];
                    target_amount.setValueAtTime(prop.keyTime(curr_key), prop.keyValue(curr_key)[i] / ranges[i]);
                }
                target_range.setValue(ranges[i]);

                buf += 'effect("' + prop_norm.name + '")("Pseudo/kTANrmlMD-000' + (2 * i + 2) + '")*' +
                    'effect("' + prop_norm.name + '")("Pseudo/kTANrmlMD-000' + (2 * i + 3) + '"), ';
            }
            prop.expression = buf.slice(0, -2) + "]";
        } else {
            var range = 1;
            var max_value = -Infinity;
            var min_value = Infinity;
            for (var j = 0; j < sel_keys.length; ++j) {
                var curr_key = sel_keys[j];
                max_value = (prop.keyValue(curr_key) > max_value) ? prop.keyValue(curr_key) : max_value;
                min_value = (prop.keyValue(curr_key) < min_value) ? prop.keyValue(curr_key) : min_value;
            }
            if (!(min_value == 0 && max_value == 0)) {
                range = Math.max(Math.abs(max_value), Math.abs(min_value));
            }

            var prop_norm = layer.effect.addProperty("Pseudo/kTANrmlSD");
            prop_norm.property("Pseudo/kTANrmlSD-0001").expression = "//" + prop.name + "\rvalue";

            var target_amount = prop_norm.property("Pseudo/kTANrmlSD-0002");
            var target_range = prop_norm.property("Pseudo/kTANrmlSD-0003");
            for (var j = 0; j < sel_keys.length; ++j) {
                var curr_key = sel_keys[j];
                target_amount.setValueAtTime(prop.keyTime(curr_key), prop.keyValue(curr_key) / range);
            }
            target_range.setValue(range);

            prop.expression = '[effect("' + prop_norm.name + '")("Pseudo/kTANrmlSD-0002")*' +
                'effect("' + prop_norm.name + '")("Pseudo/kTANrmlSD-0003")]';
        }
    }

    function do_interpolate(prop, infl_in, infl_out, overshoot, is_inversed) {
        var sel_keys = prop.selectedKeys;
        var speeds = new Array(sel_keys.length);
        for (var j = 1; j < sel_keys.length; ++j) {
            var curr_key = sel_keys[j];
            var dx = prop.keyValue(curr_key) - prop.keyValue(curr_key - 1);
            var dt = prop.keyTime(curr_key) - prop.keyTime(curr_key - 1);
            speeds[j - 1] = dx * (1 + overshoot / 100) / dt / (infl_out / 100);
        }

        // Check whether selected properties are multi-dimensional
        if (prop.value instanceof Array) {
            speeds[sel_keys.length - 1] = new Array(prop.value.length);
            for (var i = 0; i < prop.value.length; ++i) {
                speeds[sel_keys.length - 1][i] = 0;
            }
            var ease_ins = new Array(prop.value.length);
            var ease_outs = new Array(prop.value.length);
            for (var j = 0; j < sel_keys.length; ++j) {
                var curr_key = sel_keys[j];
                for (var i = 0; i < prop.value.length; ++i) {
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
            for (var j = 0; j < sel_keys.length; ++j) {
                var curr_key = sel_keys[j];
                if (is_inversed) {
                    var ease_in = new KeyframeEase(speeds[sel_keys.length - j - 1], infl_out);
                    var ease_out = new KeyframeEase(0, infl_in);
                } else {
                    var ease_in = new KeyframeEase(0, infl_in);
                    var ease_out = new KeyframeEase(speeds[j], infl_out);
                }
                prop.setInterpolationTypeAtKey(curr_key, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
                prop.setTemporalEaseAtKey(curr_key, [ease_in], [ease_out]);
            }
        }
    }

    function separate() {
        var fn_name = "kTools_Animation_Separate";
        app.beginUndoGroup(fn_name);
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var sel_layers = app.project.activeItem.layers;
            for (var i = 1; i <= sel_layers.length; ++i) {
                var curr_layer = sel_layers[i];
                if (curr_layer.selectedProperties && curr_layer.selectedProperties.length > 0) {
                    var sel_props = curr_layer.selectedProperties;
                    for (var j = 0; j < sel_props.length; ++j) {
                        var curr_prop = sel_props[j];
                        do_separate(curr_prop, curr_layer);
                    }
                }
            }
        }
        app.endUndoGroup();
    }

    function normalize() {
        var fn_name = "kTools_Animation_Normalize";
        app.beginUndoGroup(fn_name);
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var sel_layers = app.project.activeItem.layers;
            for (var i = 1; i <= sel_layers.length; ++i) {
                var curr_layer = sel_layers[i];
                if (curr_layer.selectedProperties && curr_layer.selectedProperties.length > 0) {
                    var sel_props = curr_layer.selectedProperties;
                    for (var j = 0; j < sel_props.length; ++j) {
                        var curr_prop = sel_props[j];
                        if (curr_prop.selectedKeys && curr_prop.selectedKeys.length > 0) {
                            do_normalize(curr_prop, curr_layer);
                        }
                    }
                }
            }
        }
        app.endUndoGroup();
    }

    function interpolate(infl_in, infl_out, overshoot, is_inversed) {
        var fn_name = "kTools_Animation_Interpolate";
        app.beginUndoGroup(fn_name);
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var sel_layers = app.project.activeItem.layers;
            for (var i = 1; i <= sel_layers.length; ++i) {
                var curr_layer = sel_layers[i];
                if (curr_layer.selectedProperties && curr_layer.selectedProperties.length > 0) {
                    var sel_props = curr_layer.selectedProperties;
                    for (var j = 0; j < sel_props.length; ++j) {
                        var curr_prop = sel_props[j];
                        if (curr_prop.selectedKeys && curr_prop.selectedKeys.length > 0) {
                            do_interpolate(curr_prop, infl_in, infl_out, overshoot, is_inversed);
                        }
                    }
                }
            }
        }
        app.endUndoGroup();
    }

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', "kTools");

        win.orientation = "column";
        win.alignChildren = "left";

        win.btn_separate = win.add('button', undefined, "Separate!");
        win.btn_normalize = win.add('button', undefined, "Normalize!");
        win.btn_interpolate = win.add('button', undefined, "Interpolate!");
        win.txt_infl_out = win.add('edittext', [0, 0, 40, 40], 10);
        win.txt_infl_in = win.add('edittext', [0, 0, 40, 40], 90);
        win.txt_overshoot = win.add('edittext', [0, 0, 40, 40], 0);
        win.chk_is_inversed = win.add('checkbox', undefined, "Inverse");

        win.txt_infl_out.onChange = function () {
            win.txt_infl_in.text = 100 - parseFloat(this.text);
        }
        win.txt_infl_in.onChange = function () {
            win.txt_infl_out.text = 100 - parseFloat(this.text);
        }

        win.btn_separate.onClick = function () {
            separate();
        }
        win.btn_normalize.onClick = function () {
            normalize();
        }
        win.btn_interpolate.onClick = function () {
            interpolate(
                win.txt_infl_in.text,
                win.txt_infl_out.text,
                win.txt_overshoot.text,
                win.chk_is_inversed.value
            );
        }

        win.layout.layout(true);
        return win;
    }

    buildUI(thisObj);

})(this);
