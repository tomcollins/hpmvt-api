require(["jquery-1"], function($){
console.log('init');
  // capture exit links
  document.onclick = function(e) {
     if (!document.getElementById) return true;
     var url
      , eventElement
      , depth = 0;
   
     if (!e) {
        e = window.event;
        eventElement = e.srcElement;
     } else {
        eventElement = e.target;
     }
     while (String(eventElement.nodeName) != "A") {
        eventElement = eventElement.parentNode;
        if (String(eventElement.nodeName) == "HTML") return true;
        if (++depth > 20) {
          break;
        }
     }
     if (eventElement) {
      url = eventElement.getAttribute('href');
      if ('/' === url.substr(0,1)) url = _analytics.httpBaseUrl + url;
      url = url.replace(/http:\/\/www.bbc.co.uk/, _analytics.httpBaseUrl);
      window.location = url;
     }
     return false;
  }
});
