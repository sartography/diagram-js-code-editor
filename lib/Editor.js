import {
  attr as domAttr,
  classes as domClasses,
  event as domEvent,
  query as domQuery
} from 'min-dom';

import {
  assign,
  every,
  isNumber,
  isObject
} from 'min-dash';

import CodeMirror from 'codemirror';
import cssEscape from 'css.escape';

import { getVisual } from 'diagram-js/lib/util/GraphicsUtil';

/**
 * A code editor that reflects and lets you navigate the diagram.
 */
export default function Editor(
    config, injector, eventBus,
    canvas, elementRegistry) {

  var self = this;

  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
  this._injector = injector;

  this._state = {
    isOpen: undefined,
    isEnabled: undefined,
  };

  this._init();

  this.toggle((config && config.open) || false);

  domEvent.bind(this._toggle, 'click', function(event) {
    event.preventDefault();
    event.stopPropagation();

    self.toggle();
  });

  eventBus.on('selection.changed', function(context) {
    if (context.newSelection[0] && self._parent){
      if (context.newSelection[0].type == "bpmn:ScriptTask"){
        domClasses(self._parent).add('enabled');
        self._state.isEnabled = true;
         // grab script properties window 
         self._codestore = document.getElementById("cam-script-val");
         console.log(self._codestore);
        return;
      }}
      domClasses(self._parent).remove('enabled');
      self._state.isEnabled = false;
      if (self.isOpen()){
        self.close();
    }
  });

}

Editor.$inject = [
  'config.editor',
  'injector',
  'eventBus',
  'canvas',
  'elementRegistry'
];

Editor.prototype._init = function() {
  var canvas = this._canvas,
      container = canvas.getContainer();

  // create parent div
  var parent = this._parent = document.createElement('div');

  domClasses(parent).add('djs-editor');

  container.appendChild(parent);

  // create toggle
  var toggle = this._toggle = document.createElement('div');

  domClasses(toggle).add('toggle');

  parent.appendChild(toggle);

  // create ide textarea
  var ide = this._ide = document.createElement('textarea');

  ide.name = "code";
  ide.maxLength = "5000";
  ide.cols = "80";
  ide.rows = "40";

  domClasses(ide).add('ide');

  parent.appendChild(ide);

  // CodeMirror.fromTextArea(ide, {
  //   lineNumbers: true,
  //   mode: "python",
  //   theme: 'monokai'
  // });

    // Add Comment


};


Editor.prototype.validate = function() {
  // ! This parts gonna be hard
}

Editor.prototype.open = function() {
  assign(this._state, { isOpen: true });

  domClasses(this._parent).add('open');

  var translate = this._injector.get('translate', false) || function(s) { return s; };

  domAttr(this._toggle, 'title', translate('Close Editor'));

  this._eventBus.fire('editor.toggle', { open: true });
};

Editor.prototype.close = function() {
  assign(this._state, { isOpen: false });

  domClasses(this._parent).remove('open');

  var translate = this._injector.get('translate', false) || function(s) { return s; };

  domAttr(this._toggle, 'title', translate('Open Editor'));

  this._eventBus.fire('editor.toggle', { open: false });
};

Editor.prototype.toggle = function(open) {

  var currentOpen = this.isOpen();

  if (typeof open === 'undefined') {
    open = !currentOpen;
  }

  if (open == currentOpen) {
    return;
  }

  if (open) {
    this.open();
  } else {
    this.close();
  }
};

Editor.prototype.isOpen = function() {
  return this._state.isOpen;
};