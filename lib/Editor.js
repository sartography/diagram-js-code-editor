import {attr as domAttr, classes as domClasses, event as domEvent,} from 'min-dom';

import {assign} from 'min-dash';

import * as ace from 'ace-builds/src-noconflict/ace';

// Enable dynamic loading of formatting modes
ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.4.12/src-noconflict');

/**
 * A code editor that allows you to add syntax highlighting and testing to bpmn properties panel
 */
export default function Editor(
    config, injector, eventBus,
    canvas, elementRegistry) {

    var self = this;

    this._canvas = canvas;
    // this._elementRegistry = elementRegistry;
    this._eventBus = eventBus;
    this._injector = injector;

    this._state = {
        isOpen: undefined,
    };

    this.init();

    this.toggle((config && config.open) || false);

    domEvent.bind(this.toggle_btn, 'click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        self.toggle();
    });

    domEvent.bind(this.run_btn, 'click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        self.validate();
    });

    domEvent.bind(this.exit_btn, 'click', function (event) {
        event.preventDefault();
        event.stopPropagation();

        self.close();
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
            if (context.newSelection[0].type == 'bpmn:ScriptTask' && true) { // TODO: Check if opened task is 'inline script'
                domClasses(self._parent).add('enabled');

            }
        }
    });

    eventBus.on('editor.validate.response', function (response) {
        this.set_valid_state(response.passing ? 'passing' : 'failing');
    });

    // Return a list of objects containing both the script name and description in plain text
    eventBus.on('editor.scripts.response', function (response) {
        if (response.scripts && response.scripts.length > 0) {
            self.scripts = response.scripts;
        } else {
            self.scripts = [{
                name: 'No Scripts Available',
                description: 'Contact your system administrator if this is abnormal'
            }];
        }

        self.scripts_menu.innerHTML = '';
        self.scripts.forEach(element =>
            self.scripts_menu.innerHTML += `<a class="dropdown-item">${element.name}</a>`);// <ul><li>${element.description}</ul></li>`); // <div class="description">${element.description}</div>
    });

    // Return a single object containing all data available to the open task
    eventBus.on('editor.objects.response', function (response) {
        self.objects = response.objects;

        function recurseObject(data) {
            var html = '';
            for (const [key, value] of Object.entries(data)) {

                if (typeof value == 'object' && value != undefined) {
                    html += `<li><a class="dropdown-item">${key}</a><ul class="dropdown-menu dropdown-submenu">` + recurseObject(value) + '</ul><li>';
                } else {
                    let type = typeof value;
                    if (value == undefined) {
                        type = 'undefined';
                    }
                    html += `<li><a class="dropdown-item">${key}</a><div class="data-type ${type}">${type}</div></li>`;
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
    'elementRegistry'
];

Editor.prototype.set_valid_state = function (state) {
    if (state === 'passing') {
        domClasses(this.run_btn).add('passing');
        domClasses(this.run_btn).remove('failing');
        domClasses(this.run_btn).remove('unknown');
    } else if (state === 'failing') {
        domClasses(this.run_btn).add('failing');
        domClasses(this.run_btn).remove('passing');
        domClasses(this.run_btn).remove('unknown');
    } else {
        domClasses(this.run_btn).add('unknown');
        domClasses(this.run_btn).remove('passing');
        domClasses(this.run_btn).remove('failing');
    }
};

Editor.prototype.init = function () {
    var canvas = this._canvas,
        container = canvas.getContainer();

    var template = `
  <div class="djs-editor">
    <div class="toggle" id="toggle"></div>

     <nav class="navbar navbar-expand-sm navbar-light bg-light toolbar">
    <div class="collapse navbar-collapse sidenav" id="navbarSupportedContent">
      <ul class="navbar-nav mr-auto">   
      <li class="nav-item"> 
      <a class="nav-link" id="run_btn">
        <i class="fas fa-build"></i>
      </a>
      </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" id="scriptsDropdown" role="button" data-toggle="dropdown" aria-haspopup="true"
            aria-expanded="false">
            Scripts
          </a>
          <div class="dropdown-menu" aria-labelledby="scriptsDropdown" id="scripts_list">
            <a class="dropdown-item">
             Validate to Load Scripts...
            </a>
          </div>
        </li>
    <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" id="dataDropdown" role="button" data-toggle="dropdown" aria-haspopup="true"
            aria-expanded="false">
            Data
          </a>
          <div class="dropdown-menu" aria-labelledby="dataDropdown" id="objects_list">
            <a class="dropdown-item">
             Validate to Load Data...
            </a>
          </div>
        </li>
       <li class="nav-item"> 
      <a class="nav-link waves-effect waves-light" id="exit_btn">
          <i class="fas fa-close"></i>
        </a>
      </li>
      </ul>
    </div>
  </nav>
    <div class="ide" id="editor"></div>
  </div>`;
    let dom = new DOMParser()
        .parseFromString(template, 'text/html');

    // create parent div
    var parent = this._parent = dom.body.firstElementChild;
    this.toggle_btn = dom.getElementById('toggle');

    this.run_btn = dom.getElementById('run_btn');
    this.exit_btn = dom.getElementById('exit_btn');

    this.scripts_menu = dom.getElementById('scripts_list');
    this.scripts = [];
    this.objects_menu = dom.getElementById('objects_list');
    this.objects = {};

    container.appendChild(parent);

    this._eventBus.fire('editor.toolbar.update');

};

Editor.prototype.validate = function () {
    this._eventBus.fire('editor.validate.request', {
        code: document.getElementById('cam-script-val').value,
        task_name: document.getElementById('camunda-id').value
    });
};

Editor.prototype.open = function () {
    assign(this._state, {isOpen: true});

    domClasses(this._parent).add('open');

    var translate = this._injector.get('translate', false) || function (s) {
        return s;
    };

    domAttr(this.toggle_btn, 'title', translate('Close Editor'));

    // ? There should be some way to pass the closed editor to ace
    this._ide = ace.edit('editor');

    // this._ide.setTheme("ace/theme/monokai");
    this._ide.session.setMode('ace/mode/python');

    // grab script properties window
    var codestore = document.getElementById('cam-script-val');

    // Sync code window and a properties tab
    this._ide.session.setValue(codestore.value);

    codestore.addEventListener('input', (event) => {
        this._ide.session.setValue(codestore.value);

        // TODO: Consolidate this bit
        domClasses(this.run_btn).remove('passing');
        domClasses(this.run_btn).remove('failing');
        domClasses(this.run_btn).add('unknown');
    });

    this._ide.addEventListener('input', (event) => {
        codestore.value = this._ide.getValue();

        domClasses(this.run_btn).remove('passing');
        domClasses(this.run_btn).remove('failing');
        domClasses(this.run_btn).add('unknown');
        triggerEvent(codestore, 'change');
    });

    this._eventBus.fire('editor.toggle', {open: true});

    this._eventBus.fire('editor.objects.request');
    this._eventBus.fire('editor.scripts.request');
};

Editor.prototype.close = function () {

    assign(this._state, {isOpen: false});

    domClasses(this._parent).remove('open');

    var translate = this._injector.get('translate', false) || function (s) {
        return s;
    };

    domAttr(this.toggle_btn, 'title', translate('Open Editor'));

    this._eventBus.fire('editor.toggle', {open: false});
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


