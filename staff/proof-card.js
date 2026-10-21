function cardHtml() {
  return '<p class="chip">\u2691 Alias proof \u00b7 TEST board only</p>'
    + '<p data-i18n="lbAliasHelp">Pick a name from the list. Typed names are not saved.</p>'
    + '<label>Alias <select id="proof-alias" aria-label="Pick an alias"><option value="">Pick an alias</option></select></label>'
    + '<label>Score <input id="proof-score" inputmode="numeric" maxlength="4" value="12" aria-label="Score"/></label>'
    + '<button class="save" type="submit" style="min-width:44px;min-height:44px">Save to TEST board</button>'
    + '<button class="ghost" type="button" id="proof-reject" style="min-width:44px;min-height:44px">Try a typed name</button>'
    + '<p class="err" id="proof-status" role="status"></p>';
}
