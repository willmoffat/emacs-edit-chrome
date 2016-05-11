// This file is injected once as <script> tag into the host page.

(function() {
  "use strict";
  var LOG = 'EmacsEdit: ';
  var HELP =
      'https://github.com/willmoffat/emacs-edit-chrome/blob/master/README.md';
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

  function initErr() {
    var el = document.createElement('div');
    document.body.addEventListener('click', function() { el.remove(); });
    el.style = [
      'position:fixed; top:5px; right:5px; padding:1em;',
      'font-family: Verdana, sans-serif; cursor:pointer;',
      'color: red; background-color: #FFBABA; border:1px solid red;'
    ].join(' ');
    return el;
  }

  function getActiveEl() {
    var el = document.activeElement;
    if (el && el !== document.body) {
      return el;
    }

    // html5demos.com/contenteditable breaks activeNode, so use selection.
    var s = window.getSelection();
    if (s && s.focusNode) {
      return s.focusNode.parentElement;
    }
    return null;
  }

  var handlers = {};

  var errEl = initErr();
  handlers.err = function showError(args) {
    errEl.remove();
    if (args.err === 'NoEditor') {
      errEl.textContent = 'No active editor on this page. Click on a textarea.';
    } else if (args.err === 'NoEmacs') {
      errEl.innerHTML =
          'Emacs not found. <a target="_blank" href="' + HELP + '">Help</a>.';
    } else {
      errEl.textContent = args.err;
    }
    document.body.appendChild(errEl);
  };

  handlers.get = function getText() {
    msgEl.dataset.text = '';    // Text to edit.
    msgEl.dataset.editor = '';  // Type of editor.
    msgEl.dataset.id = '';      // emacsid of DOM node to update.

    var activeEl = getActiveEl();
    var editorEl;  // Top level editor node.
    var text;
    var editor;
    if (activeEl) {
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
    }

    if (!editorEl) {
      return;
    }

    if (!editorEl.dataset.emacsid) {
      emacsid++;
      editorEl.dataset.emacsid = emacsid;
    }
    msgEl.dataset.text = text;
    msgEl.dataset.editor = editor;
    msgEl.dataset.id = editorEl.dataset.emacsid;
  };

  handlers.set = function setText(args) {
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
  };

  document.addEventListener('EmacsEvent', function(e) {
    var args = JSON.parse(e.detail);
    console.log(LOG + 'Handle: ', args);
    handlers[args.type](args);
  });

  console.log(LOG + 'Initialised.');
})();
