import Editor from './Editor';
import { Dropdown, Button } from '../assets/bootstrap.esm.min';

Array.from(document.querySelectorAll('.dropdown')).forEach(n => new Dropdown(n));
Array.from(document.querySelectorAll('.button')).forEach(n => new Button(n));

export default {
  __init__: [ 'editor' ],
  editor: [ 'type', Editor ] 
};
