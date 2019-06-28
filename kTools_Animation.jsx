/*
  kTools AE
  
  TEST VERSION
  2019 kite (@megakite).
*/

(function(thisObj) {
/* INCOMPLETED
  function getPropertyPathDetail(prop) {
    var current = prop.parentProperty;
    var string = prop.name;
    while (current) {
       string = current.name + "." + string;
       current = current.parentProperty;
    }
    return string
  }
*/

  function doSeparation(prop, layer) {
    if (prop.value instanceof Array) {
      var temporaryString = '[';
      var separationProperty = layer.effect.addProperty("Pseudo/kTools Separation");
      separationProperty.property("Pseudo/kTools Separation-0001").expression = "//" + prop.name + '\r' + "value;";
      for (var k = 0; k < prop.value.length; k++) {
        var currentDimention = separationProperty.property("Pseudo/kTools Separation-000" + (k+2));
        if (prop.selectedKeys && prop.selectedKeys.length > 0) {
          var selectedKeyframes = prop.selectedKeys;
          for (var l = 0; l < selectedKeyframes.length; l++) {
            var currentKeyframe = selectedKeyframes[l];
            currentDimention.setValueAtTime(prop.keyTime(currentKeyframe), prop.keyValue(currentKeyframe)[k]);
          }
        }
        temporaryString += 'effect("' + separationProperty.name + '")("Pseudo/kTools Separation-000' + (k+2) + '"), ';
      }
      prop.expression = temporaryString.slice(0, -2) + ']';
    }
  }

  function doNormalization(prop, layer) {
    var selectedKeyframes = prop.selectedKeys;
    if (prop.value instanceof Array) {
      var rangeValue = new Array(selectedKeyframes.length);
      for (var k = 0; k < prop.value.length; k++) {
        var valueMax, valueMin;
        for (var l = 1; l < selectedKeyframes.length; l++) {
          var currentKeyframe = selectedKeyframes[l];
          valueMax = Math.max(prop.keyValue(currentKeyframe)[k], prop.keyValue(currentKeyframe-1)[k]);
          valueMin = Math.min(prop.keyValue(currentKeyframe)[k], prop.keyValue(currentKeyframe-1)[k]);
        } rangeValue[k] = (valueMin == 0 && valueMax == 0 ? 1 : Math.max(Math.abs(valueMax), Math.abs(valueMin)));
      }
      var temporaryString = '[';
      var normalizationProperty = layer.effect.addProperty("Pseudo/kTools Normalization MD");
      normalizationProperty.property("Pseudo/kTools Normalization MD-0001").expression = "//" + prop.name + "\rvalue;";
      for (var k = 0; k < prop.value.length; k++) {
        var targetAmount = normalizationProperty.property("Pseudo/kTools Normalization MD-000" + (2*k+2));
        var targetRange = normalizationProperty.property("Pseudo/kTools Normalization MD-000" + (2*k+3));
        targetRange.setValue(rangeValue[k]);
        for (var l = 0; l < selectedKeyframes.length; l++) {
          var currentKeyframe = selectedKeyframes[l];
          targetAmount.setValueAtTime(prop.keyTime(currentKeyframe), prop.keyValue(currentKeyframe)[k]/rangeValue[k]);
        }
        temporaryString += 'effect("' + normalizationProperty.name + '")("Pseudo/kTools Normalization MD-000' + (2*k+2) + '")*' +
                           'effect("' + normalizationProperty.name + '")("Pseudo/kTools Normalization MD-000' + (2*k+3) + '"), ';
      }
      prop.expression = temporaryString.slice(0, -2) + "]";
      //if (apply) doApplyCurve(normalizationProperty);
    } else {
      var rangeValue = new Array(selectedKeyframes.length);
      var valueMax, valueMin;
      for (var k = 1; k < selectedKeyframes.length; k++) {
        var currentKeyframe = selectedKeyframes[k];
        valueMax = Math.max(prop.keyValue(currentKeyframe), prop.keyValue(currentKeyframe-1));
        valueMin = Math.min(prop.keyValue(currentKeyframe), prop.keyValue(currentKeyframe-1));
      } rangeValue = (valueMin == 0 && valueMax == 0 ? 1 : Math.max(Math.abs(valueMax), Math.abs(valueMin)));
      var temporaryString = '[';
      var normalizationProperty = layer.effect.addProperty("Pseudo/kTools Normalization SD");
      normalizationProperty.property("Pseudo/kTools Normalization SD-0001").expression = "//" + prop.name + "\rvalue;";
      var targetAmount = normalizationProperty.property("Pseudo/kTools Normalization SD-0002");
      var targetRange = normalizationProperty.property("Pseudo/kTools Normalization SD-0003");
      targetRange.setValue(rangeValue);
      for (var k = 0; k < selectedKeyframes.length; k++) {
        var currentKeyframe = selectedKeyframes[k];
        targetAmount.setValueAtTime(prop.keyTime(currentKeyframe), prop.keyValue(currentKeyframe)/rangeValue);
      }
      temporaryString += 'effect("' + normalizationProperty.name + '")("Pseudo/kTools Normalization SD-0002")*' +
                         'effect("' + normalizationProperty.name + '")("Pseudo/kTools Normalization SD-0003"), ';
      prop.expression = temporaryString.slice(0, -2) + "]";
      //if (apply) doApplyCurve(normalizationProperty);
    }
  }

  function doApplyCurve(prop, I, O, ovs, inv) {
    var selectedKeyframes = prop.selectedKeys;
    /*if (prop.matchName == "Pseudo/kTools Normalization MD") {

    } else if (prop.matchName == "Pseudo/kTools Normalization SD") {

    } else {*/
    var influences = new Array(selectedKeyframes.length);
    for (var k = 1; k < selectedKeyframes.length; k++) {
      var currentKeyframe = selectedKeyframes[k];
      var dx = prop.keyValue(currentKeyframe) - prop.keyValue(currentKeyframe-1);
      var dt = prop.keyTime(currentKeyframe) - prop.keyTime(currentKeyframe-1);
      influences[k-1] = dx * ( 1 + ovs / 100 ) / dt / ( O / 100 );
    } influences[selectedKeyframes.length-1] = 0;
    for (var k = 0; k < selectedKeyframes.length; k++) {
      var currentKeyframe = selectedKeyframes[k];
      if (inv) {
        var easeIn = new KeyframeEase(0, I);
        var easeOut = new KeyframeEase(influences[k], O);
      } else {
        var easeIn = new KeyframeEase(influences[k], O);
        var easeOut = new KeyframeEase(0, I);
      }
      prop.setInterpolationTypeAtKey(currentKeyframe, KeyframeInterpolationType.BEZIER, KeyframeInterpolationType.BEZIER);
      prop.setTemporalEaseAtKey(currentKeyframe, [easeIn], [easeOut]);
    }
    /*}*/
  }

  function work(typedIn, typedOut, overshoot, separation, normalization, applyCurve) {

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
            if (currentProperty.selectedKeys && currentProperty.selectedKeys.length > 0) {
              if (normalization) doNormalization(currentProperty, currentLayer);
              if (applyCurve) doApplyCurve(currentProperty, typedIn, typedOut, overshoot);
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
    win.chkbx1 = win.add('checkbox', undefined, "Separate Only, for multidimensional properties");
    win.chkbx2 = win.add('checkbox', undefined, "Normalize, for animated properties");
    win.chkbx3 = win.add('checkbox', undefined, "Apply curve, for the “Amount” property");
    win.txtbx1 = win.add('edittext', [0,0,40,20], 1);
    win.lbl1 = win.add('statictext', undefined, 99);
    win.txtbx3 = win.add('edittext', [0,0,40,20], 0);
    win.chkbx4 = win.add('checkbox', undefined, "Inverse");
    win.lbl2 = win.add('statictext', undefined, "TEST VERSION");

    win.chkbx2.value = true;
    win.chkbx3.value = true;

    win.txtbx1.onChange = function() {
      win.lbl1.text = 100 - parseFloat(win.txtbx1.text);
    }
    win.chkbx1.onClick = function(){
      if (this.value) win.chkbx2.enabled = win.chkbx3.enabled = win.chkbx4.enabled = false;
      else win.chkbx2.enabled = win.chkbx3.enabled = win.chkbx4.enabled = true;
    }
    win.btn1.onClick = function() {
      work(parseFloat(win.lbl1.text),
         parseFloat(win.txtbx1.text),
         parseFloat(win.txtbx3.text),
         win.chkbx1.value,
         win.chkbx2.value && win.chkbx2.enabled,
         win.chkbx3.value && win.chkbx3.enabled,
         win.chkbx4.value && win.chkbx3.enabled);
    }

    win.layout.layout(true);

    return win

  }

  buildUI(thisObj);

})(this);
