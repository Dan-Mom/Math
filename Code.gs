/**
 * Times Tables Challenge — Apps Script backend
 *
 * SETUP (see SETUP.md for the full walkthrough):
 * 1. Create a new Google Sheet. Rename the first tab "Log".
 *    In row 1 add these headers (A1:G1):
 *    timestamp | name | event | level | levelTimeSec | mistakes | totalElapsedSec
 * 2. In the Sheet: Extensions > Apps Script. Delete the placeholder code
 *    and paste this whole file in.
 * 3. Click Deploy > New deployment > type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    Click Deploy, authorize it, and copy the Web app URL.
 * 4. Paste that URL into APPS_SCRIPT_URL in both index.html and dashboard.html.
 */

const SHEET_NAME = "Log";
const ROSTER_SHEET_NAME = "Names";

function getSheet(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if(!sheet){
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["timestamp","name","event","level","levelTimeSec","mistakes","levelPoints","totalElapsedSec","totalPoints"]);
  }
  return sheet;
}

function getRosterSheet(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(ROSTER_SHEET_NAME);
  if(!sheet){
    sheet = ss.insertSheet(ROSTER_SHEET_NAME);
    sheet.appendRow(["name","addedAt"]);
  }
  return sheet;
}

function getRosterNames(){
  const sheet = getRosterSheet();
  const values = sheet.getDataRange().getValues();
  values.shift(); // header
  return values.map(r=>r[0]).filter(n=> n && String(n).trim() !== "");
}

/**
 * Run this ONCE from the Apps Script editor (select "resetLogHeaders" from
 * the function dropdown at the top, then click ▶ Run) if your dashboard
 * ever shows "undefined" names or "Invalid Date" — that means the header
 * row in the Log tab got typed wrong (e.g. all in one cell instead of
 * split across 9 separate cells). This rewrites row 1 correctly no matter
 * what's there now.
 */
function resetLogHeaders(){
  const sheet = getSheet();
  sheet.getRange(1,1,1,9).setValues([[
    "timestamp","name","event","level","levelTimeSec","mistakes","levelPoints","totalElapsedSec","totalPoints"
  ]]);
}

// Kids' app POSTs here: run_start / level_complete / run_complete / add_name
function doPost(e){
  const data = JSON.parse(e.postData.contents);

  if(data.event === "add_name"){
    const roster = getRosterSheet();
    const existing = getRosterNames().map(n=>n.toLowerCase());
    const name = String(data.name || "").trim();
    if(name && existing.indexOf(name.toLowerCase()) === -1){
      roster.appendRow([name, data.timestamp || new Date().toISOString()]);
    }
    return ContentService.createTextOutput(JSON.stringify({ok:true}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet();
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.name || "",
    data.event || "",
    data.level != null ? data.level : "",
    data.levelTimeSec != null ? data.levelTimeSec : "",
    data.mistakes != null ? data.mistakes : "",
    data.levelPoints != null ? data.levelPoints : "",
    data.totalElapsedSec != null ? data.totalElapsedSec : (data.totalTimeSec != null ? data.totalTimeSec : ""),
    data.totalPoints != null ? data.totalPoints : ""
  ]);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET ?action=names -> roster list for the name dropdown
// GET ?action=progress&name=X -> that kid's best time/points per level, computed from the log
// GET ?action=log (or no action) -> full activity log for the dashboard
function doGet(e){
  const action = e.parameter && e.parameter.action;

  if(action === "names"){
    return ContentService.createTextOutput(JSON.stringify(getRosterNames()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if(action === "progress"){
    const name = e.parameter.name || "";
    const sheet = getSheet();
    const values = sheet.getDataRange().getValues();
    const headers = values.shift();
    const idx = {};
    headers.forEach((h,i)=> idx[h]=i);
    const levelBestTimes = {};
    const levelPoints = {};
    values.forEach(row=>{
      if(row[idx.name] !== name) return;
      if(row[idx.event] !== "level_complete" && row[idx.event] !== "all_complete") return;
      const lvl = row[idx.level];
      const t = row[idx.levelTimeSec];
      const p = row[idx.levelPoints];
      if(lvl === "" || lvl == null) return;
      if(t !== "" && t != null){
        if(levelBestTimes[lvl] == null || t < levelBestTimes[lvl]) levelBestTimes[lvl] = t;
      }
      if(p !== "" && p != null){
        if(levelPoints[lvl] == null || p > levelPoints[lvl]) levelPoints[lvl] = p;
      }
    });
    return ContentService.createTextOutput(JSON.stringify({levelBestTimes, levelPoints}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const rows = values.map(row=>{
    const obj = {};
    headers.forEach((h,i)=> obj[h] = row[i]);
    // normalize field names the dashboard expects
    obj.totalTimeSec = obj.totalElapsedSec !== "" ? obj.totalElapsedSec : obj.totalTimeSec;
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
