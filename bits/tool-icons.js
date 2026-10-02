/* Bits & Bobs tool pictures. One style. The Hub can use /bits/icons/<id>.svg. */
(function (root) {
  var inner = {
    drama: '<circle cx="12" cy="12" r="8"/><path d="M12 12 12 7"/><path d="M12 4v1.5"/>',
    bell: '<path d="M6 15a6 6 0 0 1 12 0"/><path d="M5 15h14"/><circle cx="12" cy="17.2" r="1.2" fill="currentColor" stroke="none"/><path d="M12 18.4V21"/><path d="M9 21h6"/>',
    dice: '<rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1" fill="currentColor" stroke="none"/>',
    noise: '<rect x="3" y="5" width="10" height="14" rx="1.5"/><path d="M8 15l3-6"/><path d="M16 9a3 3 0 0 1 0 6"/><path d="M16 12h2"/><circle cx="19.2" cy="12" r="1.3"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><circle cx="8.5" cy="11.5" r=".8" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r=".8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="11.5" r=".8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15" r=".8" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r=".8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15" r=".8" fill="currentColor" stroke="none"/><circle cx="8.5" cy="18" r=".8" fill="currentColor" stroke="none"/><circle cx="15.5" cy="18" r=".8" fill="currentColor" stroke="none"/>',
    prompt: '<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    tape: '<rect x="3" y="8" width="7" height="8" rx="1"/><path d="M10 12h10"/><path d="M20 9v6"/><path d="M14 10v4M17 10v4"/>',
    cuts: '<path d="M3 16h10"/><path d="M3 19h8"/><path d="M14 6l6 6"/><path d="M14 9l3 3"/><path d="M16 5l3 3"/>',
    robot: '<rect x="8" y="3" width="8" height="6" rx="1"/><circle cx="10.5" cy="6" r=".7" fill="currentColor" stroke="none"/><circle cx="13.5" cy="6" r=".7" fill="currentColor" stroke="none"/><rect x="7" y="10" width="10" height="7" rx="1"/><circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/><path d="M5 12H7M17 12h2"/>',
    sheet: '<rect x="3" y="3" width="18" height="18" rx="1"/><rect x="6" y="6" width="5" height="4"/><rect x="13" y="6" width="5" height="4"/><rect x="6" y="13" width="12" height="4"/>',
    strength: '<path d="M4 16h16"/><path d="M7 16v3M17 16v3"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M12 8V5"/><path d="M9 5h6"/>',
    convert: '<path d="M4 16h12"/><path d="M4 16v-3M8 16v-6M12 16v-4M16 16v-2"/><path d="M17 5v8"/><circle cx="17" cy="5" r="1.4"/><path d="M17 13v2"/>',
    scale: '<path d="M4 18h16L6 6H4v12z"/><path d="M8 18V10M12 18v-5M16 18v-3"/>',
    volume: '<path d="M5 8l7-4 7 4-7 4-7-4z"/><path d="M5 8v8l7 4 7-4V8"/><path d="M12 12v8"/>',
    speed: '<path d="M5 16a7 7 0 1 1 14 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/><path d="M7 16h1M16 16h1"/>',
    circuits: '<path d="M4 8h4l2 3 2-6 2 6 2-3h4"/><path d="M4 8v8h16v-8"/><path d="M4 16h2v3M18 16h2v3"/>',
    levers: '<path d="M3 16h18"/><path d="M8 16l10-8"/><path d="M7 18l2-2 2 2-2 2z"/><rect x="16" y="5" width="4" height="4"/>',
    lumber: '<path d="M3 8h14v8H3z"/><path d="M17 8l4 2v8l-4-2"/><path d="M7 8v8M11 8v8"/>',
    roof: '<path d="M4 11 12 4l8 7"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/>',
    gears: '<circle cx="9" cy="10" r="3"/><path d="M9 5v2M9 13v2M4.2 7.2l1.4 1.4M12.4 11.4l1.4 1.4M4.2 12.8l1.4-1.4M12.4 8.6l1.4-1.4"/><circle cx="16" cy="16" r="2.4"/><path d="M16 12.2V14M16 18v1.6M13.2 14.2l1.2.8M17.6 17l1.2.8M13.2 17.8l1.2-.8M17.6 15l1.2-.8"/>',
    angles: '<path d="M4 17a8 8 0 0 1 16 0"/><path d="M4 17h16"/><path d="M12 17 18 10"/><path d="M8 17v-2M12 17v-3M16 17v-2"/>',
    race: '<circle cx="12" cy="13" r="6"/><path d="M12 13V9"/><path d="M10 4h4v2h-4z"/><circle cx="12" cy="13" r=".8" fill="currentColor" stroke="none"/>',
    color: '<circle cx="9" cy="10" r="3.2"/><circle cx="15" cy="10" r="3.2"/><circle cx="12" cy="14.5" r="3.2"/><circle cx="9" cy="10" r=".7" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="14.5" r=".7" fill="currentColor" stroke="none"/>',
    binary: '<rect x="3" y="4" width="8" height="8"/><rect x="13" y="4" width="8" height="8"/><path d="M5 16h4M5 19h2.5"/><text x="5.1" y="10.2" font-size="6" font-family="ui-monospace,monospace" fill="currentColor" stroke="none">0</text><text x="15.2" y="10.2" font-size="6" font-family="ui-monospace,monospace" fill="currentColor" stroke="none">1</text>'
  };
  root.BitsIcons = inner;
  root.BitsIcons.svg = function (id) {
    var body = inner[id] || '';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
