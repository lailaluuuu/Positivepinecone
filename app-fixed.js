/* Quick reference of changes needed:
In runSearch function, change:
  els.results.innerHTML = renderEntries(entriesObj, query);
To:
  els.results.innerHTML = renderEntries(entriesObj, "");

And in searchEntries function, improve tag matching to handle hashtags better.

This prevents double-filtering that was limiting results to just one entry.
*/
