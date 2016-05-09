(function() {
  "use strict";

  var EMACS_EDIT_SERVICE = 'http://127.0.0.1:9292/edit';

  var extName = chrome.app.getDetails().name;
  var defaultTitle = extName;

  // Set up context menu at install time.
  chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create(
        {id: extName, title: extName, contexts: ["all"]});
    chrome.commands.getAll(updateShortcut);
  });

  chrome.tabs.onActivated.addListener(function() {
    badge();  // Reset the badge.
  });

  chrome.contextMenus.onClicked.addListener(function(_, tab) {
    onActivate(tab);
  });
  chrome.browserAction.onClicked.addListener(onActivate);

  function updateShortcut(cmds) {
    var shortcut = cmds && cmds[0] && cmds[0].shortcut;
    if (shortcut) {
      defaultTitle += ' - ' + shortcut;
      badge('', '');
    }
  }

  function badge(text, title) {
    chrome.browserAction.setBadgeText({text: text || ''});
    chrome.browserAction.setTitle({title: title || defaultTitle});
  }

  function showOK(session) {
    badge('', '');
    return session;
  }
  function showErr(session) {
    badge('err', '' + session.err);
    return session;
  }

  function injectHelper(session) {
    var src = chrome.extension.getURL('injected.js');
    return execFn(remoteInject, src).then(function() { return session; });
  }

  // TODO(wdm) Poll for injected.js being ready.
  function sleep(session) {
    return new Promise(function(resolve) {
      window.setTimeout(function() { resolve(session); }, 300);
    });
  }

  function onActivate(tab) {
    badge('...', 'Edit in progress');
    Promise.resolve({url: tab.url})
        .then(injectHelper)
        .then(sleep)
        .then(getText)
        .then(emacsEdit)
        .then(setText)
        .then(showOK)
        .catch(showErr);
  }

  // Doesn't resolve until emacs has sent response.
  function emacsEdit(session) {
    console.log('edit in emacs', session);
    var opts = {
      method: 'post',
      headers: {
        "Content-type": "text/plain",
        "x-url": session.url,
        "x-id": session.id  // TODO(wdm) What is this for?
      },
      body: session.text
    };
    return fetch(EMACS_EDIT_SERVICE, opts)
        .then(function(r) {
          if (r.status === 200) {
            return r.text().then(function(text) {
              session.text = text;
              return session;
            });
          } else {
            throw new Error(r.statusText);
          }
        });
  }

  function getText(session) {
    return execFn(remoteDispatch, {evt: 'EmacsGetText'})
        .then(function() {
          return execFn(remoteGetText)
              .then(function(data) {
                session.text = data.text;
                session.id = data.id;
                session.editor = data.editor;
                return session;
              });
        });
  }

  function setText(session) {
    session.evt = 'EmacsSetText';
    return execFn(remoteDispatch, session).then(function() { return session; });
  }

  // Convert fn to a string and execute it in the tab context.
  function execFn(fn, args) {
    var code = 'JSON.stringify((' + fn.toString() + ')(' +
               JSON.stringify(args) + '));';

    return new Promise(function(resolve, reject) {
      var cb = function(r) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(JSON.parse(r && r[0]));
        }
      };
      // console.warn('exec code ', code);
      chrome.tabs.executeScript({code: code}, cb);
    });
  }

  // Invoked on web page.
  function remoteInject(src) {
    if (!document.getElementById('EmacsEdit')) {
      var s = document.createElement('script');
      s.src = src;
      s.id = 'EmacsEdit';
      document.body.appendChild(s);
    }
  }

  function remoteGetText() {
    var msgEl = document.getElementById('EmacsEdit');
    return {
      text: msgEl.dataset.text,
      editor: msgEl.dataset.editor,
      id: msgEl.dataset.id
    };
  }

  function remoteDispatch(args) {
    console.log('EmacsEdit: remoteDispatch', args);
    var e = new CustomEvent(args.evt, {detail: JSON.stringify(args)});
    document.dispatchEvent(e);
  }

})();
