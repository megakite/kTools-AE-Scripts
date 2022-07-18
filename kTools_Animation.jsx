/**
 * kTools AE
 *
 * Version IT-JUST-WORKS
 * 2022 kite (@megakite).
 */

 (function(thisObj) {
  
  function doSeparation(prop, layer) {
    if (prop.value instanceof Array) {
      var tmpStr = '[';
      var seprProp = layer.effect.addProperty("Pseudo/kTools Separation");
      seprProp.property("Pseudo/kTools Separation-0001").expression = "//" + prop.name + '\r' + "value;";
      for (var k = 0; k < prop.value.length; k++) {
        var curDim = seprProp.property("Pseudo/kTools Separation-000" + (k+2));
        if (prop.selKeys && prop.selKeys.length > 0) {
          var selKeyfrms = prop.selKeys;
          for (var l = 0; l < selKeyfrms.length; l++) {
            var curKeyfrm = selKeyfrms[l];
            curDim.setValueAtTime(prop.keyTime(curKeyfrm), prop.keyValue(curKeyfrm)[k]);
          }
        }
        tmpStr += 'effect("' + seprProp.name + '")("Pseudo/kTools Separation-000' + (k+2) + '"), ';
      }
      prop.expression = tmpStr.slice(0, -2) + ']';
    }
  }

  function doNormalization(prop, layer) {
    var selKeyfrms = prop.selKeys;
    if (prop.value instanceof Array) {
      var rngVal = new Array(selKeyfrms.length);
      for (var k = 0; k < prop.value.length; k++) {
        var valMax, valMin;
        for (var l = 1; l < selKeyfrms.length; l++) {
          var curKeyfrm = selKeyfrms[l];
          valMax = Math.max(prop.keyValue(curKeyfrm)[k], prop.keyValue(curKeyfrm-1)[k]);
          valMin = Math.min(prop.keyValue(curKeyfrm)[k], prop.keyValue(curKeyfrm-1)[k]);
        } rngVal[k] = (valMin == 0 && valMax == 0 ? 1 : Math.max(Math.abs(valMax), Math.abs(valMin)));
      }
      var tmpStr = '[';
      var nrmlProp = layer.effect.addProperty("Pseudo/kTools Normalization MD");
      nrmlProp.property("Pseudo/kTools Normalization MD-0001").expression = "//" + prop.name + "\rvalue;";
      for (var k = 0; k < prop.value.length; k++) {
        var tgtAmt = nrmlProp.property("Pseudo/kTools Normalization MD-000" + (2*k+2));
        var tgtRng = nrmlProp.property("Pseudo/kTools Normalization MD-000" + (2*k+3));
        tgtRng.setValue(rngVal[k]);
        for (var l = 0; l < selKeyfrms.length; l++) {
          var curKeyfrm = selKeyfrms[l];
          tgtAmt.setValueAtTime(prop.keyTime(curKeyfrm), prop.keyValue(curKeyfrm)[k]/rngVal[k]);
        }
        tmpStr += 'effect("' + nrmlProp.name + '")("Pseudo/kTools Normalization MD-000' + (2*k+2) + '")*' +
                           'effect("' + nrmlProp.name + '")("Pseudo/kTools Normalization MD-000' + (2*k+3) + '"), ';
      }
      prop.expression = tmpStr.slice(0, -2) + "]";
    } else {
      var rngVal, valMax, valMin;
      for (var k = 1; k < selKeyfrms.length; k++) {
        var curKeyfrm = selKeyfrms[k];
        valMax = Math.max(prop.keyValue(curKeyfrm), prop.keyValue(curKeyfrm-1));
        valMin = Math.min(prop.keyValue(curKeyfrm), prop.keyValue(curKeyfrm-1));
      } rngVal = (valMin == 0 && valMax == 0 ? 1 : Math.max(Math.abs(valMax), Math.abs(valMin)));
      var tmpStr = '[';
      var nrmlProp = layer.effect.addProperty("Pseudo/kTools Normalization SD");
      nrmlProp.property("Pseudo/kTools Normalization SD-0001").expression = "//" + prop.name + "\rvalue;";
      var tgtAmt = nrmlProp.property("Pseudo/kTools Normalization SD-0002");
      var tgtRng = nrmlProp.property("Pseudo/kTools Normalization SD-0003");
      tgtRng.setValue(rngVal);
      for (var k = 0; k < selKeyfrms.length; k++) {
        var curKeyfrm = selKeyfrms[k];
        tgtAmt.setValueAtTime(prop.keyTime(curKeyfrm), prop.keyValue(curKeyfrm)/rngVal);
      }
      tmpStr += 'effect("' + nrmlProp.name + '")("Pseudo/kTools Normalization SD-0002")*' +
                         'effect("' + nrmlProp.name + '")("Pseudo/kTools Normalization SD-0003"), ';
      prop.expression = tmpStr.slice(0, -2) + "]";
    }
  }

  function doApplyCurve(prop, I, O, ovs, inv) {
    var selKeyfrms = prop.selKeys;
    var speeds = new Array(selKeyfrms.length);
    for (var l = 1; l < selKeyfrms.length; l++) {
      var curKeyfrm = selKeyfrms[l];
      var dx = prop.keyValue(curKeyfrm) - prop.keyValue(curKeyfrm-1);
      var dt = prop.keyTime(curKeyfrm) - prop.keyTime(curKeyfrm-1);
      speeds[l-1] = dx * ( 1 + ovs / 100 ) / dt / ( O / 100 );
    } speeds[selKeyfrms.length-1] = 0;
    for (var l = 0; l < selKeyfrms.length; l++) {
      var curKeyfrm = selKeyfrms[l];
      if (inv) {
        var easeIn = new KeyframeEase(speeds[selKeyfrms.length - l - 1], O);
        var easeOut = new KeyframeEase(0, I);
      } else {
        var easeIn = new KeyframeEase(0, I);
        var easeOut = new KeyframeEase(speeds[l], O);
      }
      prop.setInterpolationTypeAtKey(curKeyfrm, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      prop.setTemporalEaseAtKey(curKeyfrm, [easeIn], [easeOut]);
    }
  }

  function work(typedIn, typedOut, overshoot, separation, normalization, applyCurve, inversed) {

    var functionName = "kTools_Work";

    app.beginUndoGroup(functionName);
    
    if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
      var selectedLayers = app.project.activeItem.layers;
      for (var i = 1; i <= selectedLayers.length; i++) {
        var currentLayer = selectedLayers[i];
        if (currentLayer.selectedProperties && currentLayer.selectedProperties.length > 0) {
          var selectedProperties = currentLayer.selectedProperties;
          for (var j = 0; j < selectedProperties.length; j++) {
            var currentProperty = selectedProperties[j];
            if (separation) doSeparation(currentProperty, currentLayer);
            if (currentProperty.selKeys && currentProperty.selKeys.length > 0) {
              if (normalization) doNormalization(currentProperty, currentLayer);
              if (applyCurve) doApplyCurve(currentProperty, typedIn, typedOut, overshoot, inversed);
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
    win.chk1.onClick = function(){
      if (this.value) win.chk2.enabled = win.chk3.enabled = win.chk4.enabled = false;
      else win.chk2.enabled = win.chk3.enabled = win.chk4.enabled = true;
    }
    win.btn1.onClick = function() {
      work(parseFloat(win.lbl1.text),
         parseFloat(win.txt1.text),
         parseFloat(win.txt3.text),
         win.chk1.value,
         win.chk2.value && win.chk2.enabled,
         win.chk3.value && win.chk3.enabled,
         win.chk4.value && win.chk4.enabled);
    }

    win.layout.layout(true);

    return win

  }

  buildUI(thisObj);

})(this);