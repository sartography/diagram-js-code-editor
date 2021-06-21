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
  };

  this.init();

  this.toggle((config && config.open) || false);

  domEvent.bind(this._toggle, 'click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    self.toggle();
  });

  domEvent.bind(this.run_btn, 'click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    self.validate();
  });

  domEvent.bind(this._parent, 'wheel', function (event) {
    // stop propagation and handle scroll differently
    event.preventDefault();
    event.stopPropagation();
  });

  // Check that the currently selected bpmn task is a script task and enable or disable coding window appropriately
  eventBus.on('selection.changed', function (context) {
    if (self.isOpen()) {
      self.close();
    }
    domClasses(self._parent).remove('enabled');
    if (context.newSelection.length > 0) {
      if (context.newSelection[0].type == "bpmn:ScriptTask") {
        domClasses(self._parent).add('enabled');
        return;
      }
    }
  });

  eventBus.on('editor.validate.response', function (response) {
    if (response.passing) {
      domClasses(self.run_btn).add('passing');
      domClasses(self.run_btn).remove('failing');
      domClasses(self.run_btn).remove('unknown');
    } else {
      domClasses(self.run_btn).add('failing');
      domClasses(self.run_btn).remove('passing');
      domClasses(self.run_btn).remove('unknown');
    }
  });

  // Return a list of objects containing both the script name and description in plain text
  eventBus.on('editor.scripts.response', function (response) {
    if (response.type == "error") {
      self.scripts = [{ name: "No Scripts Available", description: "Contact your system administrator if this is abnormal" }];
    } else {
      self.scripts = response.scripts;
    }

    self.scripts_menu.innerHTML = "";
    self.scripts.forEach(element =>
      self.scripts_menu.innerHTML += `<li class="submenu"><a>${element.name}</a><ul><li>${element.description}</ul></li></li>`); //<div class="description">${element.description}</div>
  });
  // 
  eventBus.on('editor.objects.response', function (response) {
    self.objects = response.objects;
    self.objects_menu.innerHTML = recurseObject(self.objects);
  });
}

Editor.$inject = [
  'config.editor',
  'injector',
  'eventBus',
  'canvas',
  'elementRegistry'
];

Editor.prototype.init = function () {
  var canvas = this._canvas,
    container = canvas.getContainer();

  var template = `
  <div class="djs-editor">
    <div class="toggle" id="toggle"></div>
    <div class="toolbar" id="toolbar">
      <nav>
        <ul>
          <li><a id="run_btn"></a></li>
          <li class="submenu"><a>Validate to Load Scripts...</a>
            <ul id="scripts_list">
            </ul>
          </li>
          <li class="submenu"><a>Data</a>
            <ul id="objects_list">
            <li><a>Validate to Load Data...</a></li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
    <div class="ide" id="editor"></div>
  </div>`
  let dom = new DOMParser()
    .parseFromString(template, 'text/html');

  // create parent div
  var parent = this._parent = dom.body.firstElementChild;

  this._toggle = dom.getElementById('toggle');

  this.run_btn = dom.getElementById('run_btn');
  this.scripts_menu = dom.getElementById('scripts_list');
  this.scripts = [];
  this.objects_menu = dom.getElementById('objects_list');
  this.objects = {};

  container.appendChild(parent);

  this._eventBus.fire('editor.toolbar.update');
};

Editor.prototype.validate = function () {
  this._eventBus.fire('editor.validate.request', { code: document.getElementById("cam-script-val").value, task_name: document.getElementById('camunda-id').value });
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
  var codestore = document.getElementById("cam-script-val");
  // Sync code window and a properties tab
  this._ide.session.setValue(codestore.value);

  codestore.addEventListener("input", (event) => {
    this._ide.session.setValue(codestore.value);
    // TODO: Consolidate this bit 
    domClasses(this.run_btn).remove('passing');
    domClasses(this.run_btn).remove('failing');
    domClasses(this.run_btn).add('unknown');
  });

  this._ide.addEventListener("input", (event) => {
    codestore.value = this._ide.getValue();

    domClasses(this.run_btn).remove('passing');
    domClasses(this.run_btn).remove('failing');
    domClasses(this.run_btn).add('unknown');
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

function recurseObject(data) {
  var html = "";
  for (const [key, value] of Object.entries(data)) {
    
    if (typeof value == 'object' && value != undefined) {
      html += `<li class="submenu"><a>${key}</a><ul>` + recurseObject(value) + `</ul><li>`;
    } else {
      let type = typeof value
      if (value == undefined){
        type = "undefined";
      }
      html += `<li><a>${key}</a><div class="data-type">${type}</div></li>`;
    }
  }
  return html
}
