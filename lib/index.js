import Editor from './Editor';
import { Dropdown, Button } from '../node_modules/bootstrap/dist/js/bootstrap.esm.min.js';

Array.from(document.querySelectorAll('.dropdown')).forEach(n => new Dropdown(n));
Array.from(document.querySelectorAll('.button')).forEach(n => new Button(n));

export default {
  __init__: [ 'editor' ],
  editor: [ 'type', Editor ] 
};
