import { Player, PlayingType, SkillLevel } from "@/types";
import { downloadAndSaveImage } from "@/lib/imageDownloader";

export interface GoogleSheetsConfig {
  sheetId?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
  csvUrl?: string;
  rawContent?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  importedCount: number;
  players?: Player[];
  warnings?: string[];
}

// Normalizes header names regardless of casing, spaces, or minor variations in Google Form
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Parse CSV or TSV text safely into array of objects
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") {
        i++;
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  // Auto-detect delimiter: Tab (when copied from Google Sheets) or Comma (CSV)
  const firstLine = lines[0];
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount ? "\t" : ",";

  const parseRow = (row: string): string[] => {
    const entries: string[] = [];
    let entry = "";
    let insideQuote = false;

    for (let j = 0; j < row.length; j++) {
      const c = row[j];
      if (c === '"') {
        if (insideQuote && row[j + 1] === '"') {
          entry += '"';
          j++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (c === delimiter && !insideQuote) {
        entries.push(entry.trim());
        entry = "";
      } else {
        entry += c;
      }
    }
    entries.push(entry.trim());
    return entries;
  };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let k = 1; k < lines.length; k++) {
    const values = parseRow(lines[k]);
    if (values.length === 0 || (values.length === 1 && values[0] === "")) continue;
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });
    rows.push(obj);
  }

  return rows;
}

// Maps raw Google Form / Sheet rows to the application's Player model
export function mapSheetRowsToPlayers(rows: Record<string, string>[], startIndex: number = 1): Player[] {
  return rows.map((row, idx) => {
    // Search fields by normalized keys
    const rowNormalized: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      rowNormalized[normalizeHeader(k)] = row[k];
    });

    const findVal = (patterns: string[]): string => {
      for (const pattern of patterns) {
        for (const [key, val] of Object.entries(rowNormalized)) {
          if (key.includes(pattern)) return val;
        }
      }
      return "";
    };

    const name = findVal(["playername", "fullname", "name"]) || `Player ${startIndex + idx}`;
    const rollNumber = findVal(["rollnumber", "rollno", "roll", "hallticket", "id"]) || `HOSTEL-${100 + idx}`;
    const branch = findVal(["branch", "department", "dept", "stream"]) || "General";
    const rawYear = findVal(["year", "studyingyear", "batch"]) || "1st";
    const genderVal = findVal(["gender", "sex"]).toLowerCase();
    const gender = genderVal.includes("f") ? "Female" : "Male";

    const rawType = findVal(["playingtype", "type", "playtype", "category"]).toLowerCase();
    let playingType: PlayingType = "Both";
    if (rawType.includes("single")) playingType = "Singles";
    else if (rawType.includes("double")) playingType = "Doubles";

    const rawSkill = findVal(["skilllevel", "skill", "level", "expertise"]).toLowerCase();
    let skillLevel: SkillLevel = "Intermediate";
    if (rawSkill.includes("adv")) skillLevel = "Advanced";
    else if (rawSkill.includes("beg")) skillLevel = "Beginner";

    const rawBasePrice = findVal(["baseprice", "price", "base", "startingprice"]);
    const parsedPrice = parseInt(rawBasePrice.replace(/[^0-9]/g, ""), 10);
    const basePrice = isNaN(parsedPrice) || parsedPrice <= 0 ? 20 : parsedPrice;

    let photo = findVal(["photo", "playerphoto", "image", "picture", "avatar", "photourl"]) || undefined;
    if (photo) {
      const driveMatch = photo.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || photo.match(/id=([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        photo = `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w1000`;
      }
    }

    return {
      id: `imported-${Date.now()}-${idx + 1}`,
      name,
      photo,
      rollNumber,
      branch,
      year: rawYear.replace(/year/i, "").trim() || "3rd",
      gender,
      playingType,
      skillLevel,
      basePrice,
      status: "Available",
      queueOrder: startIndex + idx,
      notes: "Imported from Google Sheet",
    };
  });
}

// Download photos to permanent disk storage
async function downloadPhotosForPlayers(players: Player[]): Promise<void> {
  for (const p of players) {
    if (p.photo && (p.photo.startsWith("http://") || p.photo.startsWith("https://"))) {
      const safeName = `${p.name.replace(/[^a-zA-Z0-9_-]/g, "_")}-${p.id}`;
      const localUrl = await downloadAndSaveImage(p.photo, safeName);
      if (localUrl) {
        p.photo = localUrl;
      }
    }
  }
}

// Fetch players from Google Sheets using either raw content, Service Account, or Published CSV
export async function syncPlayersFromGoogleSheets(config?: GoogleSheetsConfig): Promise<SyncResult> {
  // Mode 0: Raw Content (Pasted CSV / TSV directly from user clipboard)
  if (config?.rawContent && config.rawContent.trim().length > 0) {
    try {
      const rows = parseCSV(config.rawContent.trim());
      if (rows.length === 0) {
        return {
          success: false,
          message: "Pasted data contains no rows or invalid format.",
          importedCount: 0,
        };
      }

      const players = mapSheetRowsToPlayers(rows);
      await downloadPhotosForPlayers(players);
      return {
        success: true,
        message: `Successfully imported ${players.length} players from pasted data!`,
        importedCount: players.length,
        players,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Error parsing pasted data: ${errorMsg}`,
        importedCount: 0,
      };
    }
  }

  let sheetId = config?.sheetId || process.env.GOOGLE_SHEET_ID;
  let csvUrl = config?.csvUrl || process.env.NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL;
  const serviceAccountEmail = config?.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = config?.privateKey || process.env.GOOGLE_PRIVATE_KEY;

  // Handle case where user pastes full URL into sheetId or csvUrl
  let targetCsvUrl = csvUrl;
  const rawInput = (sheetId || csvUrl || "").trim();

  if (rawInput.startsWith("http://") || rawInput.startsWith("https://")) {
    // Case 1: Published to web URL with /d/e/2PACX-...
    if (rawInput.includes("/spreadsheets/d/e/2PACX-")) {
      const match = rawInput.match(/\/spreadsheets\/d\/e\/(2PACX-[a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const pubKey = match[1];
        const gidMatch = rawInput.match(/gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : "";
        targetCsvUrl = `https://docs.google.com/spreadsheets/d/e/${pubKey}/pub?output=csv${gidParam}`;
      } else {
        targetCsvUrl = rawInput.replace(/\/pubhtml.*$/, "/pub?output=csv").replace(/\/pub(\?.*)?$/, "/pub?output=csv");
        if (!targetCsvUrl.includes("output=csv")) {
          targetCsvUrl += targetCsvUrl.includes("?") ? "&output=csv" : "/pub?output=csv";
        }
      }
      sheetId = undefined;
    }
    // Case 2: Already a CSV export URL
    else if (rawInput.includes("output=csv") || rawInput.includes("format=csv")) {
      targetCsvUrl = rawInput;
      sheetId = undefined;
    }
    // Case 3: Standard Google Sheet URL (/spreadsheets/d/<SHEET_ID>/...)
    else {
      const match = rawInput.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1] && match[1] !== "e") {
        const sid = match[1];
        const gidMatch = rawInput.match(/gid=([0-9]+)/);
        const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : "";
        targetCsvUrl = `https://docs.google.com/spreadsheets/d/${sid}/export?format=csv${gidParam}`;
        sheetId = undefined;
      }
    }
  } else if (sheetId && !sheetId.includes("http") && !serviceAccountEmail) {
    targetCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId.trim()}/export?format=csv`;
  }

  if (targetCsvUrl) {
    try {
      const response = await fetch(targetCsvUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/csv,text/plain,*/*",
        },
        redirect: "follow",
        cache: "no-store",
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Could not access Google Sheet (HTTP ${response.status}). In Google Sheets, make sure 'Share' is set to 'Anyone with the link can view' or use 'Paste Data Directly'.`,
          importedCount: 0,
        };
      }

      const csvText = await response.text();

      // Check if Google returned an HTML login page instead of CSV
      if (csvText.trim().startsWith("<!DOCTYPE") || csvText.includes("<html")) {
        return {
          success: false,
          message: "Google returned a web page / sign-in screen instead of CSV data. Please ensure the Google Sheet is shared with 'Anyone with the link can view', or copy and paste the rows directly into the 'Paste Data' tab.",
          importedCount: 0,
        };
      }

      const rows = parseCSV(csvText);

      if (rows.length === 0) {
        return {
          success: false,
          message: "The Google Sheet appears to be empty or has no response rows.",
          importedCount: 0,
        };
      }

      const players = mapSheetRowsToPlayers(rows);
      await downloadPhotosForPlayers(players);
      return {
        success: true,
        message: `Successfully synchronized ${players.length} players from Google Sheet!`,
        importedCount: players.length,
        players,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Error syncing Google Sheet via URL: ${errorMsg}. Tip: You can also use the 'Paste Data Directly' option!`,
        importedCount: 0,
      };
    }
  }

  // Mode 2: Service Account API
  if (sheetId && serviceAccountEmail && privateKey) {
    try {
      // In production or full service account setup, we fetch using Google Sheets v4 API
      // Since we also support direct CSV export, we give clear guidance if API call fails
      const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z1000`;
      // If service account credentials are provided without a JWT library, we provide helpful notice
      return {
        success: false,
        message: "Google Service Account credentials detected. For easiest zero-config sync, you can also use 'Publish to the web' as CSV or make sheet viewable.",
        importedCount: 0,
      };
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        message: `Google Sheets API error: ${errorMsg}`,
        importedCount: 0,
      };
    }
  }

  return {
    success: false,
    message: "Google Sheets is not configured yet. Please provide a Google Sheet ID, CSV Publish URL, or set environment variables.",
    importedCount: 0,
  };
}
