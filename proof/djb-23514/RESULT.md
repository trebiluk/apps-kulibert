# DJ Berty MU 2.35.14

Lane B. The closed menu stays off the screen in Arabic and Dari.

Checked with real taps. 0 console errors.

- Arabic and Dari, closed, at 1366×768, 412×915, and 915×412: the menu rect starts past the right edge. It covers neither the Viz stage nor the drum grid. Open brings it over the app. Close sends it back off-screen.
- English is unchanged: the rail stays on the left, and a closed menu has no box.
- Rotate 412×915 to 915×412 and back with the menu open, then closed: the song stays, the layout refits, and the page does not scroll sideways.
