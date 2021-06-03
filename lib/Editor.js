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

let scripts = [
  {
    "name": "CompleteTemplate",
    "description": "        \nUsing the Jinja template engine, takes data available in the current task, and uses it to populate \na word document that contains Jinja markup.  Please see https://docxtpl.readthedocs.io/en/latest/ \nfor more information on exact syntax.\nTakes two arguments:\n1. The name of a MS Word docx file to use as a template.\n2. The 'code' of the IRB Document as set in the irb_documents.xlsx file.\"\n"
  },
  {
    "name": "Email",
    "description": "\nCreates an email, using the provided `subject`, `recipients`, and `cc` arguments.  \nThe recipients and cc arguments can contain an email address or list of email addresses. \nIn place of an email address, we accept the string 'associated', in which case we\nlook up the users associated with the study who have send_email set to True. \nThe cc argument is not required.\nThe \"documentation\" should contain markdown that will become the body of the email message.\nExamples:\nemail (subject=\"My Subject\", recipients=[\"dhf8r@virginia.edu\", pi.email, 'associated'])\nemail (subject=\"My Subject\", recipients=[\"dhf8r@virginia.edu\", pi.email], cc='associated')\n"
  },
  {
    "name": "FactService",
    "description": "Just your basic class that can pull in data from a few api endpoints and\n        do a basic task."
  },
  {
    "name": "FailingScript",
    "description": "It fails"
  },
  {
    "name": "GetStudyAssociates",
    "description": "\nReturns person assocated with study or an error if one is not associated.\nexample : get_study_associate('sbp3ey') => {'uid':'sbp3ey','role':'Unicorn Herder', 'send_email': False, \n'access':True}\n\n"
  },
  {
    "name": "GetStudyAssociates",
    "description": "\nReturns all people associated with the study - Will always return the study owner as assocated\nexample : get_study_associates() => [{'uid':'sbp3ey','role':'Unicorn Herder', 'send_email': False, 'access':True}] \n\n"
  },
  {
    "name": "IsFileUploaded",
    "description": "Test whether a file is uploaded for a study. \n                  Pass in the IRB Doc Code for the file."
  },
  {
    "name": "Ldap",
    "description": "\nAttempts to create a dictionary with person details, using the\nprovided argument (a UID) and look it up through LDAP.  If no UID is\nprovided, then returns information about the current user.\n\nExamples:\nsupervisor_info = ldap(supervisor_uid)   // Sets the supervisor information to ldap details for the given uid.\n"
  },
  {
    "name": "StudyDataGet",
    "description": "Gets study data from the data store."
  },
  {
    "name": "StudyDataSet",
    "description": "Sets study data from the data store. Takes two positional arguments key and value"
  },
  {
    "name": "StudyInfo",
    "description": "\nStudyInfo [TYPE], where TYPE is one of 'info', 'investigators', 'details', 'documents' or 'protocol'.\n\nAdds details about the current study to the Task Data.  The type of information required should be \nprovided as an argument.  The following arguments are available:\n\n### Info ###\nReturns the basic information such as the id and title\n```\n{\n  \"id\": 12,\n  \"title\": \"test\",\n  \"primary_investigator_id\": 21,\n  \"user_uid\": \"dif84\",\n  \"sponsor\": \"sponsor\",\n  \"ind_number\": \"1234\",\n  \"inactive\": false\n}\n```\n\n### Investigators ###\nReturns detailed information about related personnel.\nThe order returned is guaranteed to match the order provided in the investigators.xslx reference file.\nDetailed information is added in from LDAP about each personnel based on their user_id. \n```\n{\n  \"PI\": {\n    \"label\": \"Primary Investigator\",\n    \"display\": \"Always\",\n    \"unique\": \"Yes\",\n    \"user_id\": \"dhf8r\",\n    \"display_name\": \"Dan Funk\",\n    \"given_name\": \"Dan\",\n    \"email\": \"dhf8r@virginia.edu\",\n    \"telephone_number\": \"+1 (434) 924-1723\",\n    \"title\": \"E42:He's a hoopy frood\",\n    \"department\": \"E0:EN-Eng Study of Parallel Universes\",\n    \"affiliation\": \"faculty\",\n    \"sponsor_type\": \"Staff\"\n  },\n  \"SC_I\": {\n    \"label\": \"Study Coordinator I\",\n    \"display\": \"Always\",\n    \"unique\": \"Yes\",\n    \"user_id\": null\n  },\n  \"DC\": {\n    \"label\": \"Department Contact\",\n    \"display\": \"Optional\",\n    \"unique\": \"Yes\",\n    \"user_id\": \"asd3v\",\n    \"error\": \"Unable to locate a user with id asd3v in LDAP\"\n  },\n  \"DEPT_CH\": {\n    \"label\": \"Department Chair\",\n    \"display\": \"Always\",\n    \"unique\": \"Yes\",\n    \"user_id\": \"lb3dp\"\n  }\n}\n```\n\n### Investigator Roles ###\nReturns a list of all investigator roles, populating any roles with additional information available from\nthe Protocol Builder and LDAP.  Its basically just like Investigators, but it includes all the roles, rather\nthat just those that were set in Protocol Builder.\n```\n{\n  \"PI\": {\n    \"label\": \"Primary Investigator\",\n    \"display\": \"Always\",\n    \"unique\": \"Yes\",\n    \"user_id\": \"dhf8r\",\n    \"display_name\": \"Dan Funk\",\n    \"given_name\": \"Dan\",\n    \"email\": \"dhf8r@virginia.edu\",\n    \"telephone_number\": \"+1 (434) 924-1723\",\n    \"title\": \"E42:He's a hoopy frood\",\n    \"department\": \"E0:EN-Eng Study of Parallel Universes\",\n    \"affiliation\": \"faculty\",\n    \"sponsor_type\": \"Staff\"\n  },\n  \"SC_I\": {\n    \"label\": \"Study Coordinator I\",\n    \"display\": \"Always\",\n    \"unique\": \"Yes\",\n    \"user_id\": null\n  },\n  \"DC\": {\n    \"label\": \"Department Contact\",\n    \"display\": \"Optional\",\n    \"unique\": \"Yes\",\n    \"user_id\": \"asd3v\",\n    \"error\": \"Unable to locate a user with id asd3v in LDAP\"\n  },\n  \"DEPT_CH\": {\n    \"label\": \"Department Chair\",\n    \"display\": \"Always\",\n    \"unique\": \"Yes\",\n    \"user_id\": \"lb3dp\"\n  }\n}\n```\n\n\n### Details ###\nReturns detailed information about variable keys read in from the Protocol Builder.\n\n### Documents ###\nReturns a list of all documents that might be related to a study, reading all columns from the irb_documents.xsl \nfile. Including information about any files that were uploaded or generated that relate to a given document. \nPlease note this is just a few examples, ALL known document types are returned in an actual call.\n```\n{\n  \"AD_CoCApp\": {\n    \"category1\": \"Ancillary Document\",\n    \"category2\": \"CoC Application\",\n    \"category3\": \"\",\n    \"Who Uploads?\": \"CRC\",\n    \"id\": \"12\",\n    \"description\": \"Certificate of Confidentiality Application\",\n    \"required\": false,\n    \"study_id\": 1,\n    \"code\": \"AD_CoCApp\",\n    \"display_name\": \"Ancillary Document / CoC Application\",\n    \"count\": 0,\n    \"files\": []\n  },\n  \"UVACompl_PRCAppr\": {\n    \"category1\": \"UVA Compliance\",\n    \"category2\": \"PRC Approval\",\n    \"category3\": \"\",\n    \"Who Uploads?\": \"CRC\",\n    \"id\": \"6\",\n    \"description\": \"Cancer Center's PRC Approval Form\",\n    \"required\": true,\n    \"study_id\": 1,\n    \"code\": \"UVACompl_PRCAppr\",\n    \"display_name\": \"UVA Compliance / PRC Approval\",\n    \"count\": 1,\n    \"files\": [\n      {\n        \"file_id\": 10,\n        \"task_id\": \"fakingthisout\",\n        \"workflow_id\": 2,\n        \"workflow_spec_id\": \"docx\"\n      }\n    ],\n    \"status\": \"complete\"\n  }\n}\n```\n\n### Protocol ###\nReturns information specific to the protocol. \n\n\n        "
  },
  {
    "name": "UpdateStudy",
    "description": "\nAllows you to set specific attributes on the Study model by mapping them to \nvalues in the task data.  Should be called with the value to set (either title, short_title, or pi)\n\nExample:\nupdate_study(title=PIComputingID.label, short_title=\"Really Short Name\")\n"
  },
  {
    "name": "UpdateStudyAssociates",
    "description": "\nAllows you to associate other users with a study - only 'uid' is a required keyword argument\n\n\nAn empty list will delete the existing Associated list (except owner)\n\nThe UID will be validated vs ldap and will raise an error if the uva_uid is not found. This will replace any  \nassociation already in place for this user.\n\nexample : update_study_associate(uid='sbp3ey',role='Unicorn Herder',send_email=False, access=True) \n\n"
  },
  {
    "name": "UpdateStudyAssociates",
    "description": "\nAllows you to associate other users with a study - only 'uid' is required in the \nincoming dictionary, but will be useless without other information - all values will default to \nfalse or blank\n\nAn empty list will delete the existing Associated list (except owner)\n\nEach UID will be validated vs ldap and will raise an error if the uva_uid is not found. This supplied list will replace \nany \nassociations already in place. \n\nexample : update_study_associates([{'uid':'sbp3ey','role':'Unicorn Herder', 'send_email': False, 'access':True}]) \n\n"
  },
  {
    "name": "UserDataGet",
    "description": "Gets user data from the data store - takes only one argument 'key' "
  },
  {
    "name": "UserDataSet",
    "description": "Sets user data to the data store these are positional arguments key and value.\n        example: user_data_set('mykey','myvalue')\n        "
  }
]
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

  // Check that the currently selected bpmn task is a script task and enable or disable coding window appropriately
  eventBus.on('selection.changed', function (context) {
    if (context.newSelection[0] && self._parent) {
      if (context.newSelection[0].type == "bpmn:ScriptTask") {
        domClasses(self._parent).add('enabled');
        self._state.isEnabled = true;
        if (self.isOpen()) { self.close(); self.open(); } // close old window to reopen
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

  // var main_window = document.createElement('div');

  var toolbar = document.createElement('div');
  domClasses(toolbar).add('toolbar');

  // create ide textarea
  var ide_window = document.createElement('div');

  ide_window.setAttribute("id", "editor");
  domClasses(ide_window).add('ide');


  //toolbar.innerHTML = "<button class='test'>play</button><button class='test'> </button>" + generateScriptDropdown(scripts);

  parent.appendChild(toolbar);
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
    const evt = new MouseEvent(("change"), {
      view: window,
      bubbles: true,
      cancelable: true
    });
    codestore.dispatchEvent(evt);
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
    template += `<a href="#">${element.name}</a>`);
  return `<div class="container">
    <div class="row">
      <div class="col mt-4">
        <div class="dropdown">                                                                        <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expande  d="false">                                                                             Dropdown button                                                                   </button>                       
              <div class="dropdown-menu pre-scrollable" aria-labelledby="dropdownMenuButton">                                                           
               <a class="dropdown-item" href="#">Foo</a>                                  
               <a class="dropdown-item" href="#">Thing</a>                          
               <a class="dropdown-item" href="#">Something</a>
               <a class="dropdown-item" href="#">Dudes</a>
               <a class="dropdown-item" href="#">Birds</a>
               <a class="dropdown-item" href="#">Nikes</a>
               <a class="dropdown-item" href="#">Marsh mellows</a>                                        <a class="dropdown-item" href="#">Apples</a>                                                <a class="dropdown-item" href="#">Dingles</a>                                              <a class="dropdown-item" href="#">Berries</a>                                              <a class="dropdown-item" href="#">What not</a>                                              <a class="dropdown-item" href="#">Something else here</a>                                  <a class="dropdown-item" href="#">Action</a>                                                <a class="dropdown-item" href="#">Another action</a>                                        <a class="dropdown-item" href="#">Something else here</a>                     
             </div>                                                            
             </div>        
      </div>
    </div>
  </div>`//template + `</div> </div>`;
}