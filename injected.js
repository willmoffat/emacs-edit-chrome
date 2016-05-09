// This file is injected once as <script> tag into the host page.

(function() {
  "use strict";
  var LOG = 'EmacsEdit: ';

  var msgEl = document.getElementById('EmacsEdit');

  var emacsid = 0;  // Uninque id for each editor on page we are invoked on.

  // Supported editors. Looked for in the DOM in the following order.
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

    Ace: {
      get: function(el) {
        el = el.closest('.ace_editor');
        if (!el) {
          return null;
        }
        return {el: el, text: el.env.editor.getSession().getValue()};
      },
      set: function(el, text) { el.env.editor.getSession().setValue(text); }
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

    ContentEditable: {
      get: function(el) {
        el = el.closest('[contenteditable]');
        if (!el) {
          return null;
        }
        return {el: el, text: el.innerText};
      },
      set: function(el, text) { el.innerText = text; }
    },

    Selection: {
      get: function() { return {text: window.getSelection().toString()}; },
      set: function(el, text) {
        console.log(LOG + 'Ignoring update selection.', el, text);
      }
    }
  };

  function getText() {
    console.log(LOG + 'getText');
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
      console.warn(LOG + 'No text found to edit', el);
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

    console.log(LOG + 'Ready for edit', r);
  }

  function setText(e) {
    console.log(LOG + 'setText');
    var args = JSON.parse(e.detail);
    var el;
    if (args.id) {
      var sel = '[data-emacsid="' + args.id + '"]';
      el = document.querySelector(sel);
      if (!el) {
        console.error(LOG + 'Not found ' + sel);
        return;
      }
    }
    // Update the text.
    io[args.editor].set(el, args.text);
  }

  document.addEventListener('EmacsGetText', getText);
  document.addEventListener('EmacsSetText', setText);

  console.log(LOG + 'Initialised.');
})();
