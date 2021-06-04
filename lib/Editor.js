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
 * A code editor that allows you to add syntax highlighting and tessting to bpmn properties panel
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
  // ! Remove in prod
  this._run = this._toggle;
  domEvent.bind(this._run, 'click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    self.validate();
  });

  // Check that the currently selected bpmn task is a script task and enable or disable coding window appropriately
  eventBus.on('selection.changed', function (context) {
    if (self.isOpen()) {
      self.close();
    }
    if (context.newSelection[0] && self._parent) { // ? Try and replace self._parent with self.isOpen() cause idk why it works yet 
      if (context.newSelection[0].type == "bpmn:ScriptTask") {
        domClasses(self._parent).add('enabled');
        self._state.isEnabled = true;
        return;
      }
    }
    domClasses(self._parent).remove('enabled');
    self._state.isEnabled = false;
  });
  
  eventBus.on('editor.validate.response', function (response) {
    if(response.type == "ok"){ // ? passing vs type

    } else {
      response.msg; // Show Error Response
    }
  });

  eventBus.on('editor.scripts.response', function (response) {
    if(response.type == "error"){
      this.scripts = [{name:"No Scripts Available", description:"Either pound sand or contact your system administrator "}];
    } else {
      this.scripts = response.scripts;
    }
    self._toolbar.innerHTML = "<button class='run'></button>" + generateScriptDropdown(this.scripts);
  });

  eventBus.on('editor.toolbar.update', function (updates) {
  
  });
  
  eventBus.fire('editor.scripts.request');
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

  // prevent drag propagation
  domEvent.bind(parent, 'mousemove', function (event) {
    event.stopPropagation();
  });

  domClasses(parent).add('djs-editor');

  container.appendChild(parent);

  // create toggle
  var toggle = this._toggle = document.createElement('div');

  domClasses(toggle).add('toggle');

  parent.appendChild(toggle);

  // ? I'm pretty sure I can just create a template string that will hold all these definitions but I'll have to get into that

  var toolbar = this._toolbar = document.createElement('div');
  domClasses(toolbar).add('toolbar');

  var run_btn = this._run_btn = document.createElement('div');
  run_btn.setAttribute("id", "run_btn");

  var scripts_menu = this._scripts_menu = document.createElement('div');
  scripts_menu.setAttribute("id", "scripts_menu");
  domClasses(scripts_menu).add('dropdown');

  var objects_menu = this._objects_menu = document.createElement('div');
  objects_menu.setAttribute("id", "objects_menu");
  domClasses(objects_menu).add('dropdown');

  // create ide textarea
  var ide_window = document.createElement('div');
  ide_window.setAttribute("id", "editor");
  domClasses(ide_window).add('ide');

  toolbar.appendChild(run_btn);
  toolbar.appendChild(scripts_menu);
  toolbar.appendChild(objects_menu);

  parent.appendChild(toolbar);
  parent.appendChild(ide_window);

  this._eventBus.fire('editor.toolbar.update');
};

Editor.prototype.validate = function () {
  this._eventBus.fire('editor.validate.request', { code: this._codestore.value });
}

Editor.prototype.open = function () {
  assign(this._state, { isOpen: true });

  domClasses(this._parent).add('open');

  var translate = this._injector.get('translate', false) || function (s) { return s; };

  domAttr(this._toggle, 'title', translate('Close Editor'));
  // ? There should be some way to pass the closed editor to ace
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
    triggerEvent(codestore, "change");
  });
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

function generateScriptDropdown(scripts) {
  let template = `<div class="dropdown">
  <button class="dropbtn">Scripts</button>
  <div class="dropdown-content">`;
  scripts.forEach(element =>
    template += `<button>${element.name}</button>`);
  return template + '</div></div>';
}


/**
 * Triggers a change event
 *
 * @param element on which the change should be triggered
 * @param eventType type of the event (e.g. click, change, ...)
 */
var triggerEvent = function (element, eventType) {

  var evt;

  eventType = eventType || 'change';

  try {

    // Chrome, Safari, Firefox
    evt = new MouseEvent((eventType), {
      view: window,
      bubbles: true,
      cancelable: true
    });
  } catch (e) {

    // IE 11, PhantomJS (wat!)
    evt = document.createEvent('MouseEvent');

    evt.initEvent((eventType), true, true);
  }

  return element.dispatchEvent(evt);
};