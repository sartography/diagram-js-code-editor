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

import cssEscape from 'css.escape';
import * as ace from 'ace-builds/src-noconflict/ace';

// Enable dynamic loading of formatting modes
ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');

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

  domEvent.bind(this._toggle, 'click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    self.toggle();
  });

  eventBus.on('selection.changed', function (context) {
    if (context.newSelection[0] && self._parent) {
      if (context.newSelection[0].type == "bpmn:ScriptTask") {
        domClasses(self._parent).add('enabled');
        self._state.isEnabled = true;
        return;
      }
    }
    domClasses(self._parent).remove('enabled');
    self._state.isEnabled = false;
    if (self.isOpen()) {
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

Editor.prototype._init = function () {
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
  var ide_window = document.createElement('div');

  ide_window.setAttribute("id", "editor");

  domClasses(ide_window).add('ide');  
  parent.appendChild(ide_window);
};


Editor.prototype.validate = function () {
  // ! This parts gonna be hard
}

Editor.prototype.open = function () {
  assign(this._state, { isOpen: true });

  domClasses(this._parent).add('open');

  var translate = this._injector.get('translate', false) || function (s) { return s; };

  domAttr(this._toggle, 'title', translate('Close Editor'));
  if (this._state.isEnabled) {
    this._ide = ace.edit("editor");
    //this._ide.setTheme("ace/theme/monokai");
    this._ide.session.setMode("ace/mode/python");
    
    // grab script properties window 
    var codestore = this._codestore = document.getElementById("cam-script-val");
    // Sync code window and a properties tab
    this._ide.session.setValue(codestore.value);

    codestore.addEventListener("input", (event) => {
      this._ide.session.setValue(codestore.value);
    });
    this._ide.addEventListener("input", (event) => {
      codestore.value = this._ide.getValue();
    });
  }

  this._eventBus.fire('editor.toggle', { open: true });
};

Editor.prototype.close = function () {
  assign(this._state, { isOpen: false });

  domClasses(this._parent).remove('open');

  var translate = this._injector.get('translate', false) || function (s) { return s; };

  domAttr(this._toggle, 'title', translate('Open Editor'));

  this._eventBus.fire('editor.toggle', { open: false });
};

Editor.prototype.toggle = function (open) {

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

Editor.prototype.isOpen = function () {
  return this._state.isOpen;
};