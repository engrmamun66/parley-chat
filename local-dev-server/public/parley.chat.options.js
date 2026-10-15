  window.LLChatSettings = { 
    publicKey: "pk_live_hp_8f3a2c91d7e4b6a0",
    settings: {
        display_in: 'body', // body | #element_id | HTMLElement
        chat_icon: true, // booean: true | false
        fullscreen_icon: true, // booean: true | false (show a full screen icon before chatbox close icon)
        chatbox_position: {
            position: 'bottom_right', // bootom_right | bottom_left | top_right | top_left
            adjust_x: 0, // Able to pass negative value in pixel, will be adjust chatbox-postion left or right
            adjust_y: 0, // Able to pass negative value in pixel, will be adjust chatbox-postion top or bottom
        },
        /* 
        For opening_animation, add 4 to 6 type of opening animation 
        closing_animation will be automatic always(reverse of opening_animation(e.g. if opening animation is))
        if chat box open from right to left, will be close left to right
        */
        opening_animation: 'default', //  add 4 to 6 type of opening animation 
        colors: {
            primary: 'yellow', // color name and any type of color code will acceptable
            primary_bg: 'white',
        },
        open_proxy: {
            element: null, // supprted (#elemnt_id | HTMLElement)
            mode: 'open', // open | toggle (open-close)
            target: '_self', // _self | _blank 
            /**
             * url: support any page slug (e.g. /contact | /support | e.t.c)
             * after click the element will go the url by reloading page, if current page is matche with url, will not relaod, just open
             */
            url: null,  // `/contact` | `/support` | e.t.c
        }, 
        
    }
};
//   (function (w, d, s) {
//     if (w.LLChat) return;
//     var q = function () { q.c(arguments); }; q.q = []; q.c = function (a) { q.q.push(a); };
//     w.LLChat = q;
//     function load() {
//       var j = d.createElement(s); j.async = true;
//       j.src = "https://widget.leapinglogic.app/v1/dist/parley-live-chat.js";
//       var x = d.getElementsByTagName(s)[0]; x.parentNode.insertBefore(j, x);
//     }
//     d.readyState === "complete" ? load() : w.addEventListener("load", load, false);
//   })(window, document, "script"); 