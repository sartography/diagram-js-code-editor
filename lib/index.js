
import Editor from './Editor';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.js';
import {Button, Dropdown} from './bootstrap.esm.js';

// document.addEventListener('DOMContentLoaded', (event) => {
//     Array.from(document.querySelectorAll('.dropdown')).forEach(n => {
//         console.log("Dropdown Created", n);
//         new Dropdown(n);
//     });
//     Array.from(document.querySelectorAll('.button')).forEach(n => new Button(n));
// })
document.addEventListener("DOMContentLoaded", function(){
  // close all inner dropdowns when parent is closed
  document.querySelectorAll('.navbar .dropdown').forEach(function(everydropdown){
    everydropdown.addEventListener('hidden.bs.dropdown', function () {
      // after dropdown is hidden, then find all submenus
        this.querySelectorAll('.submenu').forEach(function(everysubmenu){
          // hide every submenu as well
          everysubmenu.style.display = 'none';
        });
    })
  });

  document.querySelectorAll('.dropdown-menu a').forEach(function(element){
    element.addEventListener('click', function (e) {
        let nextEl = this.nextElementSibling;
        if(nextEl && nextEl.classList.contains('submenu')) {
          // prevent opening link if link needs to open dropdown
          e.preventDefault();
          if(nextEl.style.display == 'block'){
            nextEl.style.display = 'none';
          } else {
            nextEl.style.display = 'block';
          }
        }
    });
  })
});
// DOMContentLoaded  end

export default {
    __init__: ['editor'],
    editor: ['type', Editor],
    external: ['ace-builds','@popperjs/core']
};
