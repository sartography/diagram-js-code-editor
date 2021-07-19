import {attr as domAttr, classes as domClasses, event as domEvent} from 'min-dom';

import {assign} from 'min-dash';

import * as ace from 'ace-builds/src-noconflict/ace';
// var Range = ace.require('ace/range').Range;
// Enable dynamic loading of formatting modes
ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');
// https://stackoverflow.com/questions/16024721/how-can-i-highlight-multiple-lines-with-ace/16024998#16024998
const Range = ace.require('ace/range').Range // get reference to ace/range
/**
 * A code editor that allows you to add syntax highlighting and testing to bpmn properties panel
 */
export default function Editor(
    config, injector, eventBus,
    canvas, elementRegistry) {
  const self = this;

  this._canvas = canvas;
  this._elementRegistry = elementRegistry;
  this._eventBus = eventBus;
  this._injector = injector;

  this._state = {
    isOpen: undefined,
  };

  this.init();

  this.toggle((config && config.open) || false);

  domEvent.bind(this.toggle_btn, 'click', function(event) {
    event.preventDefault();
    event.stopPropagation();

    self.toggle();
  });

  domEvent.bind(this.run_btn, 'click', function(event) {
    event.preventDefault();
    event.stopPropagation();

    self.validate();
  });

  domEvent.bind(this._parent, 'wheel', function(event) {
    // stop propagation and handle scroll differently
    event.preventDefault();
    event.stopPropagation();
    console.log("wheel");
  });

  // Check that the currently selected bpmn task is a script task and enable or disable coding window appropriately
  eventBus.on('selection.changed', function(context) {
    if (self.isOpen()) {
      self.close();
    }
    domClasses(self._parent).remove('enabled');
    if (context.newSelection.length > 0) {
      console.log(context.newSelection);
      if (context.newSelection[0].type == 'bpmn:ScriptTask' && true) { // TODO: Check if opened task is 'inline script'
        domClasses(self._parent).add('enabled');
      }
    }
  });

  // Returns
  eventBus.on('editor.validation.response', function(response) {
    self.set_valid_state(response.state);
    if (self.marker_id){
      self._ide.session.removeMarker(self.marker_id);
    }
    if (response.line_number) {
      self.marker_id = self._ide.session.addMarker(new Range(response.line_number - 1, 0, response.line_number - 1, 1), "errorMarker", "fullLine");
    }
  });

  // Return a list of objects containing both the script name and description in plain text
  eventBus.on('editor.scripts.response', function(response) {
    if (response.scripts && response.scripts.length > 0) {
      self.scripts = response.scripts;
    } else {
      self.scripts = [{
        name: 'No Scripts Available',
        description: 'Contact your system administrator if this is abnormal',
      }];
    }

    self.scripts_menu.innerHTML = '';
    self.scripts.forEach((element) =>
      self.scripts_menu.innerHTML += `<li><a class="dropdown-item">${element.name}</a><div class="description">${element.description}</div></li>`);// <ul><li>${element.description}</ul></li>`); // <div class="description">${element.description}</div>
  });

  // Return a single object containing all data available to the open task
  eventBus.on('editor.objects.response', function(response) {
    self.objects = response.objects;

    function recurseObject(data) {
      let html = '';
      for (const [key, value] of Object.entries(data)) {
        if (typeof value == 'object' && value != undefined) {
          html += `<li><a class="dropdown-item">${key} &raquo;</a><ul class="submenu dropdown-menu">` + recurseObject(value) + '</ul></li>';
        } else {
          let type = typeof value;
          if (value == undefined) {
            type = 'undefined';
          }
          html += `<li><a class="dropdown-item">${key}<div class="data-type ${type}">${type}</div></a></li>`;
        }
      }
      return html;
    }

    self.objects_menu.innerHTML = recurseObject(self.objects);
  });
}

Editor.$inject = [
  'config.editor',
  'injector',
  'eventBus',
  'canvas',
  'elementRegistry',
];

Editor.prototype.set_valid_state = function(state) {
  if (state == 'passing') {
    domClasses(this.run_btn).add('passing');
    domClasses(this.run_btn).remove('failing');
    domClasses(this.run_btn).remove('unknown');
    domClasses(this.run_btn).remove('waiting');
  } else if (state == 'failing') {
    domClasses(this.run_btn).add('failing');
    domClasses(this.run_btn).remove('passing');
    domClasses(this.run_btn).remove('unknown');
    domClasses(this.run_btn).remove('waiting');
  } else if (state == 'waiting') {
    domClasses(this.run_btn).add('waiting');
    domClasses(this.run_btn).remove('passing');
    domClasses(this.run_btn).remove('unknown');
    domClasses(this.run_btn).remove('failing');
  } else {
    domClasses(this.run_btn).add('unknown');
    domClasses(this.run_btn).remove('passing');
    domClasses(this.run_btn).remove('failing');
    domClasses(this.run_btn).remove('waiting');
  }
};

Editor.prototype.init = function() {
  const canvas = this._canvas;
  const container = canvas.getContainer();
  // https://stackblitz.com/edit/bootstrap-navbar?file=index.html
  // https://stackoverflow.com/questions/18292521/best-way-to-use-bootstrap-3-navbar-without-responsive-collapse
  const template = `
  <div class="djs-editor">
    <div class="toggle" id="toggle"></div>
    <div class="navbar navbar-fixed-top toolbar">
    <div class="navbar-header pull-right">
      <button type="button" id="run_btn"  class="btn btn-default navbar-btn">Run <i class="fas fa-build" id="run_icon"></i></button>
      <div class="nav-item dropdown">
                        <div class="dropdown-toggle" data-bs-toggle="dropdown"> Scripts </div>
                        <ul class="dropdown-menu" id="scripts_list">
                            <li> <a class="dropdown-item"> Dropdown item 1 </a></li>
                        </ul>
                    </div>
      <div class="nav-item dropdown">
                        <div class="dropdown-toggle" data-bs-toggle="dropdown"> Data </div>
                        <ul class="dropdown-menu" id="objects_list">
                            <li> <a class="dropdown-item"> Dropdown item 2 &raquo; </a>
                                <ul class="submenu dropdown-menu">
                                    <li><a class="dropdown-item" href="#">Run in order to capture task data</a></li>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                                
  </div>
</div>
    <div class="ide" id="editor"></div>
  </div>`
  ;
  const local_dom = new DOMParser()
      .parseFromString(template, 'text/html');

  // create parent div
  const parent = this._parent = local_dom.body.firstElementChild;
  this.toggle_btn = local_dom.getElementById('toggle');

  this.run_btn = local_dom.getElementById('run_btn');

  this.scripts_menu = local_dom.getElementById('scripts_list');
  this.scripts = [];
  this.objects_menu = local_dom.getElementById('objects_list');
  this.objects = {};

  container.appendChild(parent);
};

Editor.prototype.validate = function() {
  this._eventBus.fire('editor.validation.request', {
    // TODO: This method of grabbing the values seems unsafe
    code: document.getElementById('cam-script-val').value,
    task_name: document.getElementById('camunda-id').value,
  });
};

Editor.prototype.open = function() {
  assign(this._state, {isOpen: true});

  domClasses(this._parent).add('open');

  const translate = this._injector.get('translate', false) || function(s) {
    return s;
  };

  domAttr(this.toggle_btn, 'title', translate('Close Editor'));

  // ? There should be some way to pass the closed editor to ace
  this._ide = ace.edit('editor');

  // this._ide.setTheme("ace/theme/monokai");
  this._ide.session.setMode('ace/mode/python');

  // grab script properties window
  const codestore = document.getElementById('cam-script-val');

  // Sync code window and a properties tab
  this._ide.session.setValue(codestore.value);

  codestore.addEventListener('input', (event) => {
    this._ide.session.setValue(codestore.value);

    // TODO: Consolidate this bit
    domClasses(this.run_btn).remove('passing');
    domClasses(this.run_btn).remove('failing');
    this.set_valid_state('unknown');
  });

  this._ide.addEventListener('input', (event) => {
    codestore.value = this._ide.getValue();
    this.set_valid_state('unknown');
    triggerEvent(codestore, 'change');
  });

  this._eventBus.fire('editor.toggle', {open: true});

  this._eventBus.fire('editor.objects.request');
  this._eventBus.fire('editor.scripts.request');
};

Editor.prototype.close = function() {
  assign(this._state, {isOpen: false});

  domClasses(this._parent).remove('open');

  const translate = this._injector.get('translate', false) || function(s) {
    return s;
  };

  domAttr(this.toggle_btn, 'title', translate('Open Editor'));

  this._eventBus.fire('editor.toggle', {open: false});
};

Editor.prototype.toggle = function(open) {
  const currentOpen = this.isOpen();

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

/**
 * Triggers a change event
 *
 * @param element on which the change should be triggered
 * @param eventType type of the event (e.g. click, change, ...)
 */
var triggerEvent = function(element, eventType) {
  let evt;

  eventType = eventType || 'change';

  try {
    // Chrome, Safari, Firefox
    evt = new MouseEvent((eventType), {
      view: window,
      bubbles: true,
      cancelable: true,
    });
  } catch (e) {
    // IE 11, PhantomJS (wat!)
    evt = document.createEvent('MouseEvent');

    evt.initEvent((eventType), true, true);
  }

  return element.dispatchEvent(evt);
};


