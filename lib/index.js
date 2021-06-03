import Editor from './Editor';
import CoreModule from 'diagram-js/lib/core';

export default {
  // __depends__: [ CoreModule ], // {2}
  __init__: [ 'editor' ], // {3}
  editor: [ 'type', Editor ] // {1}
};
