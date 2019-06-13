(function() {
  "use strict";

  var EMACS_EDIT_SERVICE = 'http://127.0.0.1:9292/edit';

  var extName = chrome.app.getDetails().name;

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
    var t = extName;
    var s = cmds && cmds[0] && cmds[0].shortcut;
    if (s) {
      t += ' - ' + s;
    }
    chrome.browserAction.setTitle({title: t});
  }

  //////////////// Session-based promises. ////////////////

  function onActivate(tab) {
    Promise.resolve({url: tab.url})
        .then(injectHelper)
        .then(sleep)
        .then(getText)
        .then(emacsEdit)
        .then(setText)
        .catch(showErr);
  }

  function showErr(session) {
    console.log('showErr', session);
    session.html = chrome.extension.getURL('error.html');
    session.type = 'err';
    execFn(remoteDispatch, session).catch(function() { alert(session.err); });
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

  const sendPing = () => execFn(remoteDispatch, {type:'ping'})

  // Doesn't resolve until emacs has sent response.
  function emacsEdit(session) {
    console.log('sending to emacs', session);
    const pinger = setInterval(sendPing, 10*1000)
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
            throw new Error(r.statusText);  // Never seen this happen.
          }
        })
        .catch(function(err) {
          session.err = 'NoEmacs';
          return Promise.reject(session);
        }).finally( () => clearInterval(pinger) )
  }

  function getText(session) {
    return execFn(remoteDispatch, {type: 'get'})
        .then(function() {
          return execFn(remoteGetText)
              .then(function(data) {
                if (!data.editor) {
                  session.err = 'NoEditor';
                  return Promise.reject(session);
                }
                session.text = data.text;
                session.id = data.id;
                session.editor = data.editor;
                return session;
              });
        });
  }

  function setText(session) {
    session.type = 'set';
    return execFn(remoteDispatch, session).then(function() { return session; });
  }

  ////////////////////// Remote execution //////////////////////

  // Convert fn to a string and execute it in the tab context.
  function execFn(fn, args) {
    var code = 'JSON.stringify((' + fn.toString() + ')(' +
               JSON.stringify(args) + '));';

    return new Promise(function(resolve, reject) {
      var cb = function(r) {
        if (chrome.runtime.lastError) {
          reject({err: chrome.runtime.lastError.message});
        } else {
          resolve(JSON.parse(r && r[0]));
        }
      };
      // console.warn('exec code ', code);
      chrome.tabs.executeScript({code: code}, cb);
    });
  }

  // Add injected.js once to a page.
  function remoteInject(src) {
    if (!document.getElementById('EmacsEdit')) {
      var s = document.createElement('script');
      s.src = src;
      s.id = 'EmacsEdit';
      document.body.appendChild(s);
    }
  }

  // Read the text to edit from the DOM.
  function remoteGetText() {
    var msgEl = document.getElementById('EmacsEdit');
    return {
      text: msgEl.dataset.text,
      editor: msgEl.dataset.editor,
      id: msgEl.dataset.id
    };
  }

  // Dispatch an event to injected.js.
  function remoteDispatch(args) {
    document.dispatchEvent(
        new CustomEvent('EmacsEvent', {detail: JSON.stringify(args)}));
  }

})();
