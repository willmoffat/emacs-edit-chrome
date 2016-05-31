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
      api: function(el) {
        // Support old API without doc.
        var doc = el.CodeMirror && (el.CodeMirror.doc || el.CodeMirror);
        return {
          get: function() { return doc.getValue(); },
          set: function(text) { doc.setValue(text); }
        };
      }
    },

    Ace: {
      find: '.ace_editor',
      api: function(el) {
        var session = el.env.editor.getSession();
        return {
          get: function() { return session.getValue(); },
          set: function(text) { session.setValue(text); }
        };
      }
    },

    TinyMCE: {
      find: '.mce-tinymce',
      api: function() {
        var ed = window.tinymce.activeEditor;  // TODO(wdm) Lookup editor.
        return {
          get: function() { return ed.getContent(); },
          set: function(text) { ed.setContent(text); }
        };
      }
    },

    TextArea: {
      find: 'textarea,input',
      api: function(el) {
        return {
          get: function() { return el.value; },
          set: function(text) {
            el.value = text;
            el.dispatchEvent(new Event('input', {bubbles: true}));
          }
        };
      }
    },

    ContentEditable: {
      find: '[contenteditable]',
      api: function(el) {
        return {
          get: function() { return el.innerText; },
          set: function(text) { el.innerText = text; }
        };
      }
    },

    Selection: {
      find: 'body',
      api: function(el) {
        return {
          get: function() { return window.getSelection().toString(); },
          set: function(text) { console.log(LOG + 'Ignoring', el, text); }
        };
      }
    }

  };

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

  var $e;  // Error element.
  function hideErr() { return $e && $e.remove(); }
  function showErr(src) {
    if (!$e) {
      $e = document.createElement('iframe');
      window.addEventListener('click', hideErr);
      $e.style = 'position:fixed; top:0; right:1em; z-index:999999; border:0;';
    }
    document.body.appendChild($e);
    $e.src = src;
  }

  var handlers = {};

  handlers.err = function showError(args) {
    showErr(args.html + '#' + args.err);
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
            text = io[editor].api(editorEl).get();
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
    io[args.editor].api(el).set(args.text);
  };

  document.addEventListener('EmacsEvent', function(e) {
    var args = JSON.parse(e.detail);
    console.log(LOG + 'Handle: ', args);
    hideErr();
    handlers[args.type](args);
  });

  console.log(LOG + 'Initialised.');
})();
