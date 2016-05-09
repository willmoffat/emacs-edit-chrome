/*var text =
    document.activeElement.
 */

"use strict";

var s = document.getElementById('EditInEmacs');

var nextId = 0;

function getText() {
  var el = document.activeElement;
  var text;

  if (el.closest('.CodeMirror')) {
    text = el.closest('.CodeMirror').CodeMirror.doc.getValue();
    el.dataset.emacsid = nextId++; // HACK unify.
  } else if (el && 'value' in el) {
    el.dataset.emacsid = nextId++;
    text = el.value;
  } else {
    text = window.getSelection().toString();
  }
  if (!text) {
    console.warn('EditInEmacs - no text found to edit', el);
  }
  console.log('EditInEmacs - ', text);
  s.dataset.text = text;
}

function setText(e) {
  var session = JSON.parse(e.detail);
  var sel = '[data-emacsid="' + session.id + '"]';
  var el = document.querySelector(sel);
  if (!el) {
    console.error('Not found ' + sel);
    return;
  }
  if (el.closest('.CodeMirror')) {
    el.closest('.CodeMirror').CodeMirror.doc.setValue(session.text);
  } else {
    el.value = session.text;
    el.dispatchEvent(new Event('input', {bubbles : true}));
  }
}

document.addEventListener('EmacsGetText', getText);
document.addEventListener('EmacsSetText', setText);

console.log('injector ready');
