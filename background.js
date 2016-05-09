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
    chrome.browserAction.setBadgeText({text: text});
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
    return execFn(src, remoteInject).then(function() { return session; });
  }


  function onActivate(tab) {
    badge('...', 'Edit in progress');
    Promise.resolve({url: tab.url})
        .then(injectHelper)
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
    return execFn({evt: 'EmacsGetText'}, remoteDispatch)
        .then(function() {
          return execFn(null, remoteGetText)
              .then(function(text) {
                session.text = text;
                return session;
              });
        });
  }

  function setText(session) {
    var HACKid = 0;
    var args = {evt: 'EmacsSetText', id: HACKid, text: session.text};
    return execFn(args, remoteDispatch).then(function() { return session; });
  }


  // Convert fn to a string and execute it in the tab context.
  function execFn(args, fn) {
    var code = '(' + fn.toString() + ')(' + JSON.stringify(args) + ');';

    return new Promise(function(resolve, reject) {
      var cb = function(r) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(r && r[0]);
        }
      };
      // console.warn('exec code ', code);
      chrome.tabs.executeScript({code: code}, cb);
    });
  }

  // Invoked on web page.
  function remoteInject(src) {
    if (!document.getElementById('EditInEmacs')) {
      var s = document.createElement('script');
      s.src = src;
      s.id = 'EditInEmacs';
      document.body.appendChild(s);
    }
  }

  // HACK: only allows one active edit at a time.
  function remoteGetText() {
    return document.getElementById('EditInEmacs').dataset.text;
  }

  function remoteDispatch(args) {
    document.dispatchEvent(
        new CustomEvent(args.evt, {detail: JSON.stringify(args)}));
  }

})();
