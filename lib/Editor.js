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

  domEvent.bind(this._run_btn, 'click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    self.validate();
  });

  domEvent.bind(this._parent, 'wheel', function(event) {
    // stop propagation and handle scroll differently
    event.preventDefault();
    event.stopPropagation();
  });
  
  // Check that the currently selected bpmn task is a script task and enable or disable coding window appropriately
  eventBus.on('selection.changed', function (context) {
    if (self.isOpen()) {
      self.close();
    }
    if (context.newSelection && self._parent) { // ? Try and replace self._parent with self.isOpen() cause idk why it works yet 
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
    if(response.type == "error"){
    } else {
      if (response.passing){
        // Update Status
      }
    }
    self._eventBus.fire("editor.toolbar.update");
  });

  eventBus.on('editor.scripts.response', function (response) {
    if(response.type == "error"){
      self.scripts = [{name:"No Scripts Available", description:"Contact your system administrator if this is abnormal"}];
    } else {
      self.scripts = response.scripts;
    }
    self._eventBus.fire("editor.toolbar.update");
  });

  eventBus.on('editor.objects.response', function (response) {
    if(response.type == "error"){
      self.objects = [{name:"No Data Objects Available", description:"Contact your system administrator if this is abnormal"}];
    } else {
      self.objects = response.objects;
    }
    self._eventBus.fire("editor.toolbar.update");
  });

  eventBus.on('editor.toolbar.update', function () {
    self._scripts_menu.innerHTML = "";
    self.scripts.forEach(element =>
      self._scripts_menu.innerHTML += `<div class="sub-trigger">${element.name}<div class="description">${element.description}</div></div>`);
     

    self._objects_menu.innerHTML = "";
    self.objects.forEach(element => {
      self._objects_menu.innerHTML += `<div class="sub-trigger">${element.name}<div class="data-type">${element.type}</div>`;
      // Add hierarchical stuff
      self._objects_menu.innerHTML += "</div>";});
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

  // prevent drag propagation
  domEvent.bind(parent, 'mousedown', function (event) {
    event.stopPropagation();
  });

  domClasses(parent).add('djs-editor');

  container.appendChild(parent);

  // create toggle
  var toggle = this._toggle = document.createElement('div');

  domClasses(toggle).add('toggle');

  parent.appendChild(toggle);


  var toolbar = this._toolbar = document.createElement('div');
  domClasses(toolbar).add('toolbar');

  var run_btn = this._run_btn = document.createElement('div');
  run_btn.setAttribute("id", "run_btn");

  // ? I'm pretty sure I can just create a template string that will hold all these definitions but I'll have to get into that

  this.scripts = [];

  var scripts_menu_container = document.createElement('div');
  domClasses(scripts_menu_container).add('dropdown');

  var scripts_menu_trigger = document.createElement('div');
  scripts_menu_trigger.innerHTML = "Scripts";
  domClasses(scripts_menu_trigger).add('trigger');

  scripts_menu_container.appendChild(scripts_menu_trigger);
  
  var scripts_menu = this._scripts_menu = document.createElement('div');
  domClasses(scripts_menu).add('dropdown-content');
  self._scripts = [];

  scripts_menu_container.appendChild(scripts_menu);
  //--------------------------------------------------------//
  this.objects = [];

  var objects_menu_container = document.createElement('div');
  domClasses(objects_menu_container).add('dropdown');

  var objects_menu_trigger = document.createElement('div');
  objects_menu_trigger.innerHTML = "Data";
  domClasses(objects_menu_trigger).add('trigger');

  objects_menu_container.appendChild(objects_menu_trigger);
  
  var objects_menu = this._objects_menu = document.createElement('div');
  domClasses(objects_menu).add('dropdown-content');
  self._objects = [];

  objects_menu_container.appendChild(objects_menu);

  toolbar.appendChild(run_btn);
  toolbar.appendChild(scripts_menu_container);
  toolbar.appendChild(objects_menu_container);

  // create ide textarea
  var ide_window = document.createElement('div');
  ide_window.setAttribute("id", "editor");
  domClasses(ide_window).add('ide');

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

  this._eventBus.fire('editor.objects.request');
  this._eventBus.fire('editor.scripts.request');
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