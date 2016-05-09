// This file is injected once as <script> tag into the host page.

(function() {
  "use strict";

  var msgEl = document.getElementById('EditInEmacs');

  var emacsid = 0;  // Uninque id for each editor on page we are invoked on.

  var io = {

    CodeMirror: {
      get: function(el) {
        el = el.closest('.CodeMirror');
        if (!el) {
          return null;
        }
        return {el: el, text: el.CodeMirror.doc.getValue()};
      },
      set: function(el, text) { el.CodeMirror.doc.setValue(text); }
    },

    TextArea: {
      get: function(el) {
        if (!('value' in el)) {
          return null;
        }
        return {el: el, text: el.value};
      },
      set: function(el, text) {
        el.value = text;
        el.dispatchEvent(new Event('input', {bubbles: true}));
      }
    },

    // TODO(wdm) Contenteditable.

    Selection: {
      get: function() { return {text: window.getSelection().toString()}; },
      set: function(el, text) {
        console.log('EditInEmacs: Ignoring update selection.', el, text);
      }
    }
  };

  function getText() {
    msgEl.dataset.text = '';    // Text to edit.
    msgEl.dataset.editor = '';  // Type of editor.
    msgEl.dataset.id = '';      // emacsid of DOM node to update.

    var el = document.activeElement;
    var r;
    var editor;
    for (editor in io) {
      if (io.hasOwnProperty(editor)) {
        r = io[editor].get(el);
        if (r) {
          break;
        }
      }
    }

    if (!r) {
      console.warn('EditInEmacs: No text found to edit', el);
      return;
    }
    el = r.el;  // DOM node for editor.
    if (!el.dataset.emacsid) {
      emacsid++;
      el.dataset.emacsid = emacsid;
    }
    msgEl.dataset.text = r.text;
    msgEl.dataset.editor = editor;
    msgEl.dataset.id = el.dataset.emacsid;

    console.log('EditInEmacs: Ready for edit', r);
  }

  function setText(e) {
    var args = JSON.parse(e.detail);
    var el;
    if (args.id) {
      var sel = '[data-emacsid="' + args.id + '"]';
      el = document.querySelector(sel);
      if (!el) {
        console.error('EditInEmacs: Not found ' + sel);
        return;
      }
    }
    // Update the text.
    io[args.editor].set(el, args.text);
  }

  document.addEventListener('EmacsGetText', getText);
  document.addEventListener('EmacsSetText', setText);

  console.log('EditInEmacs: Initialised.');
})();
