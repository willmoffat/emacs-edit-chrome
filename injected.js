// This file is injected once as <script> tag into the host page.

(function() {
  "use strict";
  var LOG = 'EmacsEdit: ';

  var msgEl = document.getElementById('EmacsEdit');

  var emacsid = 0;  // Uninque id for each editor on page we are invoked on.

  // Supported editors. Looked for in the DOM in the following order.
  var io = {

    CodeMirror: {
      find: '.CodeMirror',
      get: function(el) { return el.CodeMirror.doc.getValue(); },
      set: function(el, text) { el.CodeMirror.doc.setValue(text); }
    },

    Ace: {
      find: '.ace_editor',
      get: function(el) { return el.env.editor.getSession().getValue(); },
      set: function(el, text) { el.env.editor.getSession().setValue(text); }
    },

    TinyMCE: {
      find: '.mce-tinymce',  // TODO(wdm) Lookup editor, don't assume active.
      get: function() { return window.tinymce.activeEditor.getContent(); },
      set: function(el, text) { window.tinymce.activeEditor.setContent(text); }
    },

    TextArea: {
      find: 'textarea',
      get: function(el) { return el.value; },
      set: function(el, text) {
        el.value = text;
        el.dispatchEvent(new Event('input', {bubbles: true}));
      }
    },

    ContentEditable: {
      find: '[contenteditable]',
      get: function(el) { return el.innerText; },
      set: function(el, text) { el.innerText = text; }
    },

    Selection: {
      find: 'body',
      get: function() { return window.getSelection().toString(); },
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

    var activeEl = document.activeElement;
    if (activeEl === document.body) {
      // html5demos.com/contenteditable breaks activeNode, so use selection.
      activeEl = window.getSelection().focusNode.parentElement;
    }
    var editorEl;  // Top level editor node.
    var text;
    var editor;
    for (editor in io) {
      if (io.hasOwnProperty(editor)) {
        var sel = io[editor].find;
        editorEl = activeEl.closest(sel);
        if (editorEl) {
          text = io[editor].get(editorEl);
          break;
        }
      }
    }

    if (!text) {
      console.warn(LOG + 'No text found to edit', activeEl);
      return;
    }

    if (!editorEl.dataset.emacsid) {
      emacsid++;
      editorEl.dataset.emacsid = emacsid;
    }
    msgEl.dataset.text = text;
    msgEl.dataset.editor = editor;
    msgEl.dataset.id = editorEl.dataset.emacsid;

    console.log(LOG + 'Ready to edit: "' + text + '".');
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
