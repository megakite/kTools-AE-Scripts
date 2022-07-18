/*
	kTools Animation

 	Version IT-JUST-WORKS
 	2022 kite (@megakite).
*/

(function kToolsAnimation(thisObj) {
	/* Build UI */
	function buildUI(thisObj) {

		var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', "kTools");
			win.orientation = "column";
			win.alignChildren = "left";
			win.btn1 = win.add('button', undefined, "Work!");
			win.grp1 = win.add('group');
			win.chk1 = win.add('checkbox', undefined, "Separate");
			win.chk2 = win.add('checkbox', undefined, "Normalize");
			win.chk3 = win.add('checkbox', undefined, "Apply");
			win.txt1 = win.add('edittext', [0,0,40,20], 10);
			win.lbl1 = win.add('statictext', undefined, 90);
			win.txt3 = win.add('edittext', [0,0,40,20], 0);
			win.chk4 = win.add('checkbox', undefined, "Inverse");
			win.lbl2 = win.add('statictext', undefined, "Version IJW");

			win.chk3.value = true;

			win.txt1.onChange = function() {
				win.lbl1.text = 100 - parseFloat(win.txt1.text);
			}
			win.chk1.onClick = function() {
				if (this.value) 
					win.chk2.enabled = win.chk3.enabled = win.chk4.enabled = false;
				else
					win.chk2.enabled = win.chk3.enabled = win.chk4.enabled = true;
			}
			win.btn1.onClick = function() {
				work(
					parseFloat(win.lbl1.text),
					parseFloat(win.txt1.text),
					parseFloat(win.txt3.text),
					win.chk1.value,
					win.chk2.value && win.chk2.enabled,
					win.chk3.value && win.chk3.enabled,
					win.chk4.value && win.chk4.enabled
				);
			}

		win.layout.layout(true);

		return win
	}
	buildUI(thisObj);
	

	/* General functions */
	function doSeparation(prop, layer) {

		if (prop.value instanceof Array) {

			var tmpStr = '[';
			var seprProp = layer.effect.addProperty("Pseudo/kTASepr");
			seprProp.property("Pseudo/kTASepr-0001").expression = "//" + prop.name + '\r' + "value;";
			for (var i = 0; i < prop.value.length; i++) {
				var curDim = seprProp.property("Pseudo/kTASepr-000" + (i+2));
				if (prop.selKeys && prop.selKeys.length > 0) {
					var selKeyfrms = prop.selKeys;
					for (var j = 0; j < selKeyfrms.length; j++) {
						var curKeyfrm = selKeyfrms[j];
						curDim.setValueAtTime(prop.keyTime(curKeyfrm), prop.keyValue(curKeyfrm)[i]);
					}
				}
				tmpStr += 'effect("' + seprProp.name + '")("Pseudo/kTASepr-000' + (i+2) + '"), ';
			}
			prop.expression = tmpStr.slice(0, -2) + ']';
			
		}

	}

	function doNormalization(prop, layer) {

		var selKeyfrms = prop.selKeys;
		// Check if Properties are multi-dimensional
		if (prop.value instanceof Array) {

			var rngVal = new Array(selKeyfrms.length);
			for (var i = 0; i < prop.value.length; i++) {
				var valMax, valMin;
				for (var j = 1; j < selKeyfrms.length; j++) {
					var curKeyfrm = selKeyfrms[j];
					valMax = Math.max(prop.keyValue(curKeyfrm)[i], prop.keyValue(curKeyfrm-1)[i]);
					valMin = Math.min(prop.keyValue(curKeyfrm)[i], prop.keyValue(curKeyfrm-1)[i]);
				}
				if (valMin == 0 && valMax == 0)
					rngVal[i] = 1;
				else 
					rngVal[i] = Math.max(Math.abs(valMax), Math.abs(valMin));
			}
			
			var tmpStr = '[';
			var nrmlProp = layer.effect.addProperty("Pseudo/kTANrmlMD");
			nrmlProp.property("Pseudo/kTANrmlMD-0001").expression = "//" + prop.name + "\rvalue;";
			for (var i = 0; i < prop.value.length; i++) {
				var tgtAmount = nrmlProp.property("Pseudo/kTANrmlMD-000" + (2*i+2));
				var tgtRange =  nrmlProp.property("Pseudo/kTANrmlMD-000" + (2*i+3));
				tgtRange.setValue(rngVal[i]);
				for (var j = 0; j < selKeyfrms.length; j++) {
					var curKeyfrm = selKeyfrms[j];
					tgtAmount.setValueAtTime(prop.keyTime(curKeyfrm), prop.keyValue(curKeyfrm)[i]/rngVal[i]);
				}
				tmpStr += 'effect("' + nrmlProp.name + '")("Pseudo/kTANrmlMD-000' + (2*i+2) + '")*' +
						  'effect("' + nrmlProp.name + '")("Pseudo/kTANrmlMD-000' + (2*i+3) + '"), ';
			}
			prop.expression = tmpStr.slice(0, -2) + "]";

		} else {

			var rngVal, valMax, valMin;
			for (var j = 1; j < selKeyfrms.length; j++) {
				var curKeyfrm = selKeyfrms[j];
				valMax = Math.max(prop.keyValue(curKeyfrm), prop.keyValue(curKeyfrm-1));
				valMin = Math.min(prop.keyValue(curKeyfrm), prop.keyValue(curKeyfrm-1));
			}
			if (valMin == 0 && valMax == 0)
				rngVal = 1;
			else 
				rngVal = Math.max(Math.abs(valMax), Math.abs(valMin));

			var tmpStr = '[';
			var nrmlProp = layer.effect.addProperty("Pseudo/kTANrmlSD");
			nrmlProp.property("Pseudo/kTANrmlSD-0001").expression = "//" + prop.name + "\rvalue;";
			var tgtAmount = nrmlProp.property("Pseudo/kTANrmlSD-0002");
			var tgtRange = nrmlProp.property("Pseudo/kTANrmlSD-0003");
			tgtRange.setValue(rngVal);
			for (var j = 0; j < selKeyfrms.length; j++) {
				var curKeyfrm = selKeyfrms[j];
				tgtAmount.setValueAtTime(prop.keyTime(curKeyfrm), prop.keyValue(curKeyfrm)/rngVal);
			}
			tmpStr += 'effect("' + nrmlProp.name + '")("Pseudo/kTANrmlSD-0002")*' +
					  'effect("' + nrmlProp.name + '")("Pseudo/kTANrmlSD-0003"), ';
			prop.expression = tmpStr.slice(0, -2) + "]";

		}

	}

	function doApplyCurve(prop, I, O, ovs, inv) {

		var selKeyfrms = prop.selKeys;
		var speeds = new Array(selKeyfrms.length);
		for (var j = 1; j < selKeyfrms.length; j++) {
			var curKeyfrm = selKeyfrms[j];
			var dx = prop.keyValue(curKeyfrm) - prop.keyValue(curKeyfrm-1);
			var dt = prop.keyTime(curKeyfrm) - prop.keyTime(curKeyfrm-1);
			speeds[j-1] = dx * ( 1 + ovs / 100 ) / dt / ( O / 100 );
		} speeds[selKeyfrms.length-1] = 0;

		for (var i = 0; i < selKeyfrms.length; i++) {
			var curKeyfrm = selKeyfrms[i];
			if (inv) {
				var easeIn = new KeyframeEase(speeds[selKeyfrms.length - i - 1], O);
				var easeOut = new KeyframeEase(0, I);
			} else {
				var easeIn = new KeyframeEase(0, I);
				var easeOut = new KeyframeEase(speeds[i], O);
			}
			prop.setInterpolationTypeAtKey(curKeyfrm, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
			prop.setTemporalEaseAtKey(curKeyfrm, [easeIn], [easeOut]);
		}

	}


	/* Executive function */
	function work(typedIn, typedOut, overshoot, separation, normalization, applyCurve, inversed) {

		var functionName = "kTools_Work";

		app.beginUndoGroup(functionName);
		if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
			var selLayers = app.project.activeItem.layers;
			for (var i = 1; i <= selLayers.length; i++) {
				var curLayer = selLayers[i];
				if (curLayer.selProps && curLayer.selProps.length > 0) {
					var selProps = curLayer.selProps;
					for (var j = 0; j < selProps.length; j++) {
						var curProp = selProps[j];
						if (separation)
							doSeparation(curProp, curLayer);
						if (curProp.selKeys && curProp.selKeys.length > 0) {
							if (normalization)
								doNormalization(curProp, curLayer);
							if (applyCurve)
								doApplyCurve(curProp, typedIn, typedOut, overshoot, inversed);
						}
					}
				}
			}
		}
		app.endUndoGroup();

	}

})(this);