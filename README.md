# diagram-js Code Editor

[![Build Status](https://travis-ci.com/bpmn-io/diagram-js-minimap.svg?branch=master)]()

A code editor for diagram-js.

![Code Editor](resources/screenshot.png)


## Features

* [x] Modify script tasks with python formatting 
* [ ] Tests scripts in place with feedback
* [x] View externally provided data and functions

## Usage

Extend your diagram-js application with the coding module. We'll use [bpmn-js](https://github.com/bpmn-io/bpmn-js) as an example:

```javascript
import BpmnModeler from 'bpmn-js/lib/Modeler';
import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/camunda';

import codingModule from 'diagram-js-code-editor';


var bpmnModeler = new BpmnModeler({
  additionalModules: [
    propertiesProviderModule,
    propertiesPanelModule,
    codingModule
  ]
});

bpmnModeler.get('eventBus').on('editor.validate.request', (request) => {
  if (isGoodCode(request.code)){

  } else {

  }
bpmnModeler.get('eventBus').fire('editor.validate.response', {passing: true, msg: "msg"});
});

bpmnModeler.get('eventBus').on('editor.scripts.request', () => {
  let scripts = [{name: "", description: ""}]
bpmnModeler.get('eventBus').fire('editor.scripts.response', {scripts: scripts});
});

bpmnModeler.get('eventBus').on('editor.objects.request', () => {
  let data = [{userId: "int", description: "string"}]
bpmnModeler.get('eventBus').fire('editor.scripts.response', {objects: data});
});
```

For proper styling integrate the embedded style sheet:

```html
<link rel="stylesheet" href="diagram-js-code-editor/assets/diagram-js-code-editor.css" />
```

Please see [this example]() for a more detailed instruction.


## License

MIT
