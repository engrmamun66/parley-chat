window.LLChatSettings = {
    publicKey: "pk_live_hp_8f3a2c91d7e4b6a0",
    settings: {
        display_in: 'body', // body | #element_id | HTMLElement — inside an element, the chat is positioned within that element
        chat_icon: true, // boolean: show the round chat icon (launcher). false → open only via API / open_proxy
        chat_icon_size: 56, // px (32 – 96)
        chat_icon_label: null, // small text bubble next to the icon, e.g. 'Chat with us'
        unread_badge: true, // boolean: red unread counter on the chat icon
        fullscreen_icon: true, // boolean: show a full screen icon before the chatbox close icon
        chatbox_position: {
            position: 'bottom_right', // bottom_right | bottom_left | top_right | top_left
            adjust_x: 0, // px, negative allowed: + moves right, − moves left
            adjust_y: 0, // px, negative allowed: + moves down, − moves up
        },
        width: 380, // chatbox width in px (capped to the screen)
        height: 640, // chatbox height in px (capped to the screen)
        border_radius: 16, // px
        mobile_fullscreen: true, // boolean: chatbox fills the screen on phones (≤ 480px wide)
        /*
        opening_animation: default | fade | zoom | pop | slide_up | slide_down | slide_left | slide_right
        Closing always plays the reverse automatically
        (e.g. slide_left opens right → left, and closes left → right).
        */
        opening_animation: 'default',
        animation_duration: 280, // ms
        colors: {
            primary: 'yellow', // any CSS color: name, #hex, rgb(), hsl() …
            primary_bg: 'white', // chatbox background
            on_primary: 'auto', // text/icon color on primary; 'auto' picks dark or white for readability
            text: '#071437', // main text color
        },
        font_family: null, // e.g. 'Poppins, sans-serif' (font must be loaded by the page)
        z_index: 2147483647,
        start_view: 'home', // first screen: home | chat | messages | help | tickets
        sections: { // hide whole tabs
            messages: true,
            help: true,
            tickets: true,
        },
        open_on_load: false, // false | true | delay in ms (e.g. 5000)
        remember_state: true, // reopen on the same screen after page reload / navigation
        close_on_escape: true, // Esc exits full screen first, then closes
        hide_on_paths: [], // e.g. ['/checkout', '/admin/*'] — no chat on these pages
        texts: {
            greeting: 'Hi there 👋',
            greeting_named: 'Hi {name} 👋', // used once the visitor's name is known
            tagline: 'How can we help?',
            reply_time: 'We typically reply in under 5 minutes',
        },
        open_proxy: {
            element: null, // '#element_id' | any CSS selector | HTMLElement — clicking it opens the chat
            mode: 'open', // open | toggle (open-close)
            target: '_self', // _self | _blank (used with url)
            /**
             * url: any page slug (e.g. /contact | /support)
             * On click, goes to the url (page reload) and opens the chat there.
             * If the current page already matches the url, no reload — just opens.
             */
            url: null,
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
