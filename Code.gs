/**
 * AUTOOM booking backend (Google Apps Script bound to the Google Sheet).
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me | Who has access: Anyone
 * Optional Telegram alerts: Project Settings > Script properties
 *   TG_TOKEN = bot token, TG_CHAT = chat id
 * Run setup() once to create the sheet and header row.
 */
var SHEET = "Bookings";
var HEAD = ["ID", "Created", "Name", "Phone", "Email", "Service", "Plan", "Date", "Time", "Notes", "Lang", "Status"];
var MAX_PER_HOUR = 3;

function setup() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
  if (sh.getLastRow() === 0) sh.appendRow(HEAD);
  sh.setFrozenRows(1);
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function clean(v, n) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);

    if (d.website) return out({ ok: true, id: "ATM-0000" });          // honeypot: bots see success
    if (!(Number(d.t) > 3000)) return out({ ok: false, error: "too_fast" });

    var rec = {
      name: clean(d.name, 80), phone: clean(d.phone, 20), email: clean(d.email, 120),
      service: clean(d.service, 80), plan: clean(d.plan, 80), date: clean(d.date, 10),
      time: clean(d.time, 5), notes: clean(d.notes, 600), lang: d.lang === "en" ? "en" : "ar"
    };
    if (!rec.name || !/^\+?\d{8,15}$/.test(rec.phone) || !rec.service ||
        !/^\d{4}-\d{2}-\d{2}$/.test(rec.date) || !/^\d{2}:\d{2}$/.test(rec.time)) {
      return out({ ok: false, error: "invalid" });
    }

    // rate limit per phone number (Apps Script cannot see the visitor's IP)
    var cache = CacheService.getScriptCache(), key = "r:" + rec.phone;
    var n = Number(cache.get(key) || 0);
    if (n >= MAX_PER_HOUR) return out({ ok: false, error: "rate_limited" });
    cache.put(key, String(n + 1), 3600);

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
      var rows = sh.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {            // same date + time already booked
        if (String(rows[i][7]) === rec.date && String(rows[i][8]) === rec.time && rows[i][11] !== "Cancelled") {
          return out({ ok: false, error: "slot_taken" });
        }
      }
      var id = "ATM-" + Utilities.getUuid().slice(0, 6).toUpperCase();
      var row = [id, new Date(), rec.name, rec.phone, rec.email, rec.service, rec.plan,
                 rec.date, rec.time, rec.notes, rec.lang, "New"];
      var r = sh.getLastRow() + 1;
      // plain-text format: stops =, +, -, @ from being evaluated as formulas
      sh.getRange(r, 1, 1, row.length).setNumberFormat("@").setValues([row]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    notify("New booking " + id + "\n" + rec.name + " | " + rec.phone + "\n" + rec.service +
           "\n" + rec.date + " " + rec.time);
    return out({ ok: true, id: id });
  } catch (err) {
    return out({ ok: false, error: "server" });
  }
}

function notify(text) {
  try {
    var p = PropertiesService.getScriptProperties();
    var token = p.getProperty("TG_TOKEN"), chat = p.getProperty("TG_CHAT");
    if (!token || !chat) return;
    UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      payload: JSON.stringify({ chat_id: chat, text: text })
    });
  } catch (e) {}
}
