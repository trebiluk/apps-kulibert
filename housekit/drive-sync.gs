/**
 * HouseKit shared file for two phones
 * Deploy as web app: Execute as Me, Anyone with the link.
 */
function doGet() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const file = findFile();
    const text = file ? file.getBlob().getDataAsString() : "{}";
    return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const body = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    JSON.parse(body);
    let file = findFile();
    if (!file) file = DriveApp.createFile("HouseKit.json", body, MimeType.PLAIN_TEXT);
    else file.setContent(body);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
function findFile() {
  const files = DriveApp.getFilesByName("HouseKit.json");
  return files.hasNext() ? files.next() : null;
}
