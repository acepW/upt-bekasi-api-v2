const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx"); // Untuk membaca file Excel

const SpreadsheetsFunction = {
  // NEW METHOD: Mengambil data dari sheet tertentu saja (lebih ringan dan cepat)
  // Mendukung single sheet (string) atau multiple sheets (array)
  getSpecificSheetData: async (
    folderId,
    spreadsheetId,
    sheetNames,
    range = null
  ) => {
    const { sheets, drive } = await authenticateGoogle();

    // Normalize sheetNames menjadi array
    const targetSheets = Array.isArray(sheetNames) ? sheetNames : [sheetNames];

    console.log(
      `Getting specific sheet data: [${targetSheets.join(
        ", "
      )}] from spreadsheet ${spreadsheetId}`
    );

    try {
      // Verifikasi dan resolve file (handle shortcuts)
      const resolvedFile = await resolveFileOrShortcut(
        drive,
        spreadsheetId,
        folderId
      );

      const mimeType = resolvedFile.mimeType;
      console.log("Resolved file MIME type:", mimeType);
      console.log("Resolved file ID:", resolvedFile.id);

      // Cek apakah file adalah spreadsheet yang didukung
      if (mimeType === "application/vnd.google-apps.spreadsheet") {
        // Handle Google Sheets - langsung ambil sheet yang diminta
        return await getGoogleSheetSpecificData(
          resolvedFile.id,
          targetSheets,
          range,
          sheets,
          resolvedFile
        );
      } else if (
        mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimeType === "application/vnd.ms-excel"
      ) {
        // Handle Excel files - langsung ambil sheet yang diminta
        return await getExcelSpecificSheetData(
          resolvedFile.id,
          targetSheets,
          drive,
          resolvedFile
        );
      } else {
        return {
          success: false,
          error: "File is not a supported spreadsheet format",
          mimeType: mimeType,
          supportedTypes: [
            "application/vnd.google-apps.spreadsheet",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
          ],
        };
      }
    } catch (error) {
      console.error("Error in getSpecificSheetData:", error);
      return {
        success: false,
        error: error.message,
        fileId: spreadsheetId,
        sheetNames: targetSheets,
      };
    }
  },

  // Main function untuk mengambil sheet data berdasarkan sheet ID
  getSpecificSheetDataById: async (
    folderId,
    spreadsheetId,
    sheetIds,
    range = null
  ) => {
    const { sheets, drive } = await authenticateGoogle();

    // Normalize sheetIds menjadi array
    const targetSheetIds = Array.isArray(sheetIds) ? sheetIds : [sheetIds];

    console.log(
      `Getting specific sheet data by IDs: [${targetSheetIds.join(
        ", "
      )}] from spreadsheet ${spreadsheetId}`
    );

    try {
      // Verifikasi dan resolve file (handle shortcuts)
      const resolvedFile = await resolveFileOrShortcut(
        drive,
        spreadsheetId,
        folderId
      );

      const mimeType = resolvedFile.mimeType;
      console.log("Resolved file MIME type:", mimeType);
      console.log("Resolved file ID:", resolvedFile.id);

      // Cek apakah file adalah spreadsheet yang didukung
      if (mimeType === "application/vnd.google-apps.spreadsheet") {
        // Handle Google Sheets - ambil sheet berdasarkan ID
        return await getGoogleSheetDataBySheetId(
          resolvedFile.id,
          targetSheetIds,
          range,
          sheets,
          resolvedFile
        );
      } else if (
        mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimeType === "application/vnd.ms-excel"
      ) {
        // Handle Excel files - ambil sheet berdasarkan ID (index)
        return await getExcelDataBySheetId(
          resolvedFile.id,
          targetSheetIds,
          drive,
          resolvedFile
        );
      } else {
        return {
          success: false,
          error: "File is not a supported spreadsheet format",
          mimeType: mimeType,
          supportedTypes: [
            "application/vnd.google-apps.spreadsheet",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
          ],
        };
      }
    } catch (error) {
      console.error("Error in getSpecificSheetDataById:", error);
      return {
        success: false,
        error: error.message,
        fileId: spreadsheetId,
        sheetIds: targetSheetIds,
      };
    }
  },

  // Method untuk debug - cek semua file yang bisa diakses
  debugAllFiles: async (req, res) => {
    const { drive } = await authenticateGoogle();

    // Cek semua file tanpa filter
    const allFilesResponse = await drive.files.list({
      fields:
        "files(id, name, mimeType, parents, createdTime, modifiedTime, trashed)",
      pageSize: 100,
    });

    console.log("Total files found:", allFilesResponse.data.files.length);

    // Filter spreadsheet (Google Sheets, Excel, dan Shortcuts)
    const spreadsheets = allFilesResponse.data.files.filter(
      (file) =>
        file.mimeType === "application/vnd.google-apps.spreadsheet" ||
        file.mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimeType === "application/vnd.ms-excel" ||
        file.mimeType === "application/vnd.google-apps.shortcut"
    );

    console.log("Spreadsheets found:", spreadsheets.length);

    // Kategorikan berdasarkan type
    const googleSheets = spreadsheets.filter(
      (f) => f.mimeType === "application/vnd.google-apps.spreadsheet"
    );
    const excelFiles = spreadsheets.filter(
      (f) =>
        f.mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        f.mimeType === "application/vnd.ms-excel"
    );
    const shortcuts = spreadsheets.filter(
      (f) => f.mimeType === "application/vnd.google-apps.shortcut"
    );

    return {
      success: true,
      totalFiles: allFilesResponse.data.files.length,
      spreadsheets: spreadsheets,
      spreadsheetCount: spreadsheets.length,
      googleSheets: googleSheets,
      googleSheetsCount: googleSheets.length,
      excelFiles: excelFiles,
      excelFilesCount: excelFiles.length,
      shortcuts: shortcuts,
      shortcutsCount: shortcuts.length,
      allFiles: allFilesResponse.data.files, // Untuk debugging
    };
  },

  // Method untuk cek permissions
  checkPermissions: async () => {
    const { drive } = await authenticateGoogle();

    // Cek informasi about user
    const about = await drive.about.get({
      fields: "user, storageQuota",
    });

    console.log("User info:", about.data);

    return {
      success: true,
      userInfo: about.data,
    };
  },

  // Method untuk cek file dalam folder specific
  getFilesInFolder: async (folderId) => {
    const { drive } = await authenticateGoogle();

    console.log("Checking folder:", folderId);

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields:
        "files(id, name, mimeType, parents, createdTime, modifiedTime, size)",
      pageSize: 100,
    });

    console.log(`Files in folder ${folderId}:`, response.data.files.length);

    // Kategorikan files
    const files = response.data.files.map((file) => ({
      ...file,
      fileType: getFileType(file.mimeType),
    }));

    return {
      success: true,
      folderId: folderId,
      files: files,
      count: response.data.files.length,
    };
  },

  // UPDATED METHOD: Mendapatkan semua data dari semua spreadsheet dalam folder
  getAllSpreadsheetsDataInFolder: async (folderId) => {
    const { drive, sheets } = await authenticateGoogle();

    console.log("Getting all spreadsheets data in folder:", folderId);

    // Dapatkan semua spreadsheet dalam folder (Google Sheets, Excel, dan Shortcuts)
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel' or mimeType='application/vnd.google-apps.shortcut') and trashed=false`,
      fields:
        "files(id, name, mimeType, parents, createdTime, modifiedTime, size, shortcutDetails)",
      pageSize: 100,
    });

    const spreadsheetFiles = response.data.files;
    console.log(
      `Found ${spreadsheetFiles.length} spreadsheet files/shortcuts in folder`
    );

    if (spreadsheetFiles.length === 0) {
      return res.json({
        success: true,
        folderId: folderId,
        message: "No spreadsheets found in this folder",
        spreadsheets: [],
      });
    }

    // Ambil data dari setiap spreadsheet
    const spreadsheetsData = [];

    for (const spreadsheetFile of spreadsheetFiles) {
      try {
        // Resolve shortcut jika diperlukan
        const resolvedFile = await resolveFileOrShortcut(
          drive,
          spreadsheetFile.id
        );
        const mimeType = resolvedFile.mimeType;
        let spreadsheetData;

        if (mimeType === "application/vnd.google-apps.spreadsheet") {
          // Handle Google Sheets
          spreadsheetData = await processGoogleSheet(resolvedFile.id, sheets);
        } else if (
          mimeType ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          mimeType === "application/vnd.ms-excel"
        ) {
          // Handle Excel files
          spreadsheetData = await processExcelFile(resolvedFile.id, drive);
        } else {
          // Skip non-spreadsheet files
          continue;
        }

        spreadsheetsData.push({
          id: spreadsheetFile.id,
          name: spreadsheetFile.name,
          mimeType: spreadsheetFile.mimeType,
          fileType: getFileType(spreadsheetFile.mimeType),
          size: spreadsheetFile.size,
          createdTime: spreadsheetFile.createdTime,
          modifiedTime: spreadsheetFile.modifiedTime,
          isShortcut: resolvedFile.isShortcut || false,
          targetId: resolvedFile.isShortcut ? resolvedFile.id : undefined,
          targetName: resolvedFile.isShortcut ? resolvedFile.name : undefined,
          targetMimeType: resolvedFile.isShortcut
            ? resolvedFile.mimeType
            : undefined,
          ...spreadsheetData,
        });
      } catch (fileError) {
        console.error(
          `Error reading spreadsheet ${spreadsheetFile.name}:`,
          fileError.message
        );
        spreadsheetsData.push({
          id: spreadsheetFile.id,
          name: spreadsheetFile.name,
          mimeType: spreadsheetFile.mimeType,
          fileType: getFileType(spreadsheetFile.mimeType),
          error: `Failed to read data: ${fileError.message}`,
        });
      }
    }

    return {
      success: true,
      folderId: folderId,
      spreadsheetCount: spreadsheetFiles.length,
      spreadsheets: spreadsheetsData,
    };
  },

  // NEW METHOD: Debug shortcuts
  debugShortcuts: async (req, res) => {
    const { drive } = await authenticateGoogle();

    // Cek semua shortcuts
    const shortcutsResponse = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.shortcut' and trashed=false",
      fields:
        "files(id, name, mimeType, parents, createdTime, modifiedTime, shortcutDetails)",
      pageSize: 100,
    });

    const shortcuts = shortcutsResponse.data.files;
    console.log("Shortcuts found:", shortcuts.length);

    // Resolve setiap shortcut
    const resolvedShortcuts = [];
    for (const shortcut of shortcuts) {
      try {
        if (shortcut.shortcutDetails && shortcut.shortcutDetails.targetId) {
          const targetInfo = await drive.files.get({
            fileId: shortcut.shortcutDetails.targetId,
            fields: "id, name, mimeType, parents, trashed",
          });

          resolvedShortcuts.push({
            shortcut: {
              id: shortcut.id,
              name: shortcut.name,
              parents: shortcut.parents,
              createdTime: shortcut.createdTime,
            },
            target: {
              id: targetInfo.data.id,
              name: targetInfo.data.name,
              mimeType: targetInfo.data.mimeType,
              fileType: getFileType(targetInfo.data.mimeType),
              parents: targetInfo.data.parents,
              trashed: targetInfo.data.trashed,
            },
          });
        } else {
          resolvedShortcuts.push({
            shortcut: {
              id: shortcut.id,
              name: shortcut.name,
              parents: shortcut.parents,
              createdTime: shortcut.createdTime,
            },
            target: null,
            error: "No target information available",
          });
        }
      } catch (error) {
        resolvedShortcuts.push({
          shortcut: {
            id: shortcut.id,
            name: shortcut.name,
            parents: shortcut.parents,
            createdTime: shortcut.createdTime,
          },
          target: null,
          error: `Failed to resolve target: ${error.message}`,
        });
      }
    }

    return {
      success: true,
      shortcutsFound: shortcuts.length,
      shortcuts: resolvedShortcuts,
    };
  },
};

// Helper function untuk menentukan tipe file
function getFileType(mimeType) {
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    return "Google Sheets";
  } else if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "Excel (.xlsx)";
  } else if (mimeType === "application/vnd.ms-excel") {
    return "Excel (.xls)";
  } else if (mimeType === "application/vnd.google-apps.shortcut") {
    return "Google Drive Shortcut";
  } else {
    return "Unknown";
  }
}

// NEW Helper function untuk resolve shortcut atau file biasa
async function resolveFileOrShortcut(drive, fileId, expectedFolderId = null) {
  try {
    // Dapatkan informasi file
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: "id, name, parents, mimeType, size, shortcutDetails",
    });

    const file = fileInfo.data;
    console.log(`Original file: ${file.name} (${file.mimeType})`);

    // Jika expected folder diberikan, cek apakah file ada di folder tersebut
    if (
      expectedFolderId &&
      (!file.parents || !file.parents.includes(expectedFolderId))
    ) {
      throw new Error(
        `File ${fileId} not found in expected folder ${expectedFolderId}`
      );
    }

    // Jika bukan shortcut, return file asli
    if (file.mimeType !== "application/vnd.google-apps.shortcut") {
      return file;
    }

    // Jika shortcut, dapatkan target file
    if (!file.shortcutDetails || !file.shortcutDetails.targetId) {
      throw new Error("Shortcut does not have target information");
    }

    const targetId = file.shortcutDetails.targetId;
    console.log(`Resolving shortcut to target: ${targetId}`);

    // Dapatkan informasi target file
    const targetFileInfo = await drive.files.get({
      fileId: targetId,
      fields: "id, name, parents, mimeType, size, trashed",
    });

    const targetFile = targetFileInfo.data;
    console.log(`Target file: ${targetFile.name} (${targetFile.mimeType})`);

    // Cek apakah target file masih ada dan tidak di trash
    if (targetFile.trashed) {
      throw new Error("Target file is in trash");
    }

    // Return target file dengan informasi tambahan
    return {
      ...targetFile,
      isShortcut: true,
      shortcutId: fileId,
      shortcutName: file.name,
    };
  } catch (error) {
    console.error("Error resolving file/shortcut:", error);
    throw error;
  }
}

// Helper function untuk mengambil data sheet tertentu dari Google Sheets
async function getGoogleSheetSpecificData(
  spreadsheetId,
  sheetNames,
  range,
  sheets,
  fileData
) {
  try {
    console.log(`Processing Google Sheet: [${sheetNames.join(", ")}]`);

    // Jika tidak ada sheet names yang diberikan atau array kosong, ambil sheet pertama
    if (
      !sheetNames ||
      sheetNames.length === 0 ||
      (sheetNames.length === 1 && !sheetNames[0])
    ) {
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
      });

      if (spreadsheetInfo.data.sheets.length === 0) {
        throw new Error("No sheets found in the spreadsheet");
      }

      sheetNames = [spreadsheetInfo.data.sheets[0].properties.title];
      console.log(
        `No sheet names provided, using first sheet: ${sheetNames[0]}`
      );
    }

    // Jika hanya satu sheet, return format single sheet untuk backward compatibility
    if (sheetNames.length === 1) {
      const singleSheetName = sheetNames[0];
      const quotedSheetName = formatSheetNameForRange(singleSheetName);

      // Tentukan range yang akan diambil
      let dataRange = range;
      if (!dataRange) {
        dataRange = `${quotedSheetName}!A:ZZZ`;
      } else {
        if (!dataRange.includes("!")) {
          dataRange = `${quotedSheetName}!${dataRange}`;
        } else {
          dataRange = dataRange.replace(/^[^!]+!/, `${quotedSheetName}!`);
        }
      }

      console.log(`Getting data with range: ${dataRange}`);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: dataRange,
      });

      const rows = response.data.values || [];
      const columnCount = Math.max(
        ...rows.map((row) => (row ? row.length : 0)),
        0
      );

      console.log(`Retrieved ${rows.length} rows with ${columnCount} columns`);

      return {
        success: true,
        fileId: spreadsheetId,
        fileName: fileData.name,
        fileType: "Google Sheets",
        mimeType: fileData.mimeType,
        sheetName: singleSheetName,
        range: dataRange,
        actualRange: response.data.range,
        data: rows,
        rowCount: rows.length,
        columnCount: columnCount,
        headers: rows.length > 0 ? rows[0] : [],
        isEmpty: rows.length === 0,
      };
    }

    // Jika multiple sheets, return format multiple sheets
    const sheetsData = {};
    let totalRows = 0;
    let maxColumns = 0;
    const errors = [];

    for (const sheetName of sheetNames) {
      try {
        const quotedSheetName = formatSheetNameForRange(sheetName);

        // Tentukan range untuk sheet ini
        let dataRange = range;
        if (!dataRange) {
          dataRange = `${quotedSheetName}!A:ZZZ`;
        } else {
          if (!dataRange.includes("!")) {
            dataRange = `${quotedSheetName}!${dataRange}`;
          } else {
            dataRange = dataRange.replace(/^[^!]+!/, `${quotedSheetName}!`);
          }
        }

        console.log(`Getting data from ${sheetName} with range: ${dataRange}`);

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: dataRange,
        });

        const rows = response.data.values || [];
        const columnCount = Math.max(
          ...rows.map((row) => (row ? row.length : 0)),
          0
        );

        totalRows += rows.length;
        maxColumns = Math.max(maxColumns, columnCount);

        sheetsData[sheetName] = {
          range: dataRange,
          actualRange: response.data.range,
          data: rows,
          rowCount: rows.length,
          columnCount: columnCount,
          headers: rows.length > 0 ? rows[0] : [],
          isEmpty: rows.length === 0,
        };

        console.log(
          `${sheetName}: ${rows.length} rows with ${columnCount} columns`
        );
      } catch (sheetError) {
        console.error(
          `Error getting data from sheet ${sheetName}:`,
          sheetError
        );
        errors.push({
          sheetName: sheetName,
          error: sheetError.message,
        });
        sheetsData[sheetName] = {
          error: `Failed to get data: ${sheetError.message}`,
          data: [],
          rowCount: 0,
          columnCount: 0,
          headers: [],
          isEmpty: true,
        };
      }
    }

    return {
      success: true,
      fileId: spreadsheetId,
      fileName: fileData.name,
      fileType: "Google Sheets",
      mimeType: fileData.mimeType,
      requestedSheets: sheetNames,
      sheetsData: sheetsData,
      totalRows: totalRows,
      maxColumns: maxColumns,
      sheetsCount: sheetNames.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    // Jika error karena sheet tidak ditemukan, coba dapatkan daftar sheet yang tersedia
    if (
      error.message.includes("Unable to parse range") ||
      error.message.includes("Sheet not found")
    ) {
      console.log("Sheet(s) not found, getting available sheets...");

      try {
        const spreadsheetInfo = await sheets.spreadsheets.get({
          spreadsheetId: spreadsheetId,
        });

        const availableSheets = spreadsheetInfo.data.sheets.map(
          (sheet) => sheet.properties.title
        );

        return {
          success: false,
          error: `One or more sheets not found: [${sheetNames.join(", ")}]`,
          availableSheets: availableSheets,
          fileId: spreadsheetId,
          fileName: fileData.name,
          fileType: "Google Sheets",
          mimeType: fileData.mimeType,
        };
      } catch (listError) {
        console.error("Error getting available sheets:", listError);
      }
    }

    console.error("Error in getGoogleSheetSpecificData:", error);
    throw error;
  }
}

// Helper function untuk mengambil data sheet tertentu dari Excel
async function getExcelSpecificSheetData(fileId, sheetNames, drive, fileData) {
  try {
    console.log(`Processing Excel file for sheets: [${sheetNames.join(", ")}]`);

    // Download file dari Google Drive
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      {
        responseType: "arraybuffer",
      }
    );

    // Parse Excel file dengan XLSX
    const workbook = XLSX.read(response.data, { type: "array" });

    // Jika tidak ada sheet names yang diberikan atau array kosong, ambil sheet pertama
    if (
      !sheetNames ||
      sheetNames.length === 0 ||
      (sheetNames.length === 1 && !sheetNames[0])
    ) {
      if (workbook.SheetNames.length === 0) {
        throw new Error("No sheets found in the Excel file");
      }
      sheetNames = [workbook.SheetNames[0]];
      console.log(
        `No sheet names provided, using first sheet: ${sheetNames[0]}`
      );
    }

    // Validasi sheet yang ada
    const missingSheets = sheetNames.filter(
      (sheetName) => !workbook.SheetNames.includes(sheetName)
    );

    if (missingSheets.length > 0) {
      return {
        success: false,
        error: `Sheet(s) not found: [${missingSheets.join(", ")}]`,
        availableSheets: workbook.SheetNames,
        fileId: fileId,
        fileName: fileData.name,
        fileType: getFileType(fileData.mimeType),
        mimeType: fileData.mimeType,
      };
    }

    // Jika hanya satu sheet, return format single sheet untuk backward compatibility
    if (sheetNames.length === 1) {
      const singleSheetName = sheetNames[0];
      const worksheet = workbook.Sheets[singleSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Return array of arrays
        defval: "", // Default value for empty cells
        raw: false, // Format all values as strings
      });

      const columnCount =
        rows.length > 0 ? Math.max(...rows.map((row) => row.length)) : 0;

      console.log(
        `Retrieved ${rows.length} rows with ${columnCount} columns from ${singleSheetName}`
      );

      return {
        success: true,
        fileId: fileId,
        fileName: fileData.name,
        fileType: getFileType(fileData.mimeType),
        mimeType: fileData.mimeType,
        size: fileData.size,
        sheetName: singleSheetName,
        data: rows,
        rowCount: rows.length,
        columnCount: columnCount,
        headers: rows.length > 0 ? rows[0] : [],
        isEmpty: rows.length === 0,
      };
    }

    // Jika multiple sheets, return format multiple sheets
    const sheetsData = {};
    let totalRows = 0;
    let maxColumns = 0;

    for (const sheetName of sheetNames) {
      try {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Return array of arrays
          defval: "", // Default value for empty cells
          raw: false, // Format all values as strings
        });

        const columnCount =
          rows.length > 0 ? Math.max(...rows.map((row) => row.length)) : 0;

        totalRows += rows.length;
        maxColumns = Math.max(maxColumns, columnCount);

        sheetsData[sheetName] = {
          data: rows,
          rowCount: rows.length,
          columnCount: columnCount,
          headers: rows.length > 0 ? rows[0] : [],
          isEmpty: rows.length === 0,
        };

        console.log(
          `${sheetName}: ${rows.length} rows with ${columnCount} columns`
        );
      } catch (sheetError) {
        console.error(
          `Error getting data from sheet ${sheetName}:`,
          sheetError
        );
        sheetsData[sheetName] = {
          error: `Failed to get data: ${sheetError.message}`,
          data: [],
          rowCount: 0,
          columnCount: 0,
          headers: [],
          isEmpty: true,
        };
      }
    }

    return {
      success: true,
      fileId: fileId,
      fileName: fileData.name,
      fileType: getFileType(fileData.mimeType),
      mimeType: fileData.mimeType,
      size: fileData.size,
      requestedSheets: sheetNames,
      sheetsData: sheetsData,
      totalRows: totalRows,
      maxColumns: maxColumns,
      sheetsCount: sheetNames.length,
    };
  } catch (error) {
    console.error("Error in getExcelSpecificSheetData:", error);
    throw error;
  }
}

//untuk sheet by id
// Helper function untuk mengambil data sheet berdasarkan sheet ID dari Google Sheets
async function getGoogleSheetDataBySheetId(
  spreadsheetId,
  sheetIds,
  range,
  sheets,
  fileData
) {
  try {
    console.log(
      `Processing Google Sheet by sheet IDs: [${sheetIds.join(", ")}]`
    );

    // Dapatkan informasi spreadsheet untuk mendapatkan mapping sheet ID ke nama
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const allSheets = spreadsheetInfo.data.sheets;

    // Buat mapping dari sheet ID ke sheet name
    const sheetIdToName = {};
    const sheetIdToProperties = {};

    allSheets.forEach((sheet) => {
      const sheetId = sheet.properties.sheetId;
      const sheetName = sheet.properties.title;
      sheetIdToName[sheetId] = sheetName;
      sheetIdToProperties[sheetId] = sheet.properties;
    });

    // Validasi apakah semua sheet ID yang diminta ada
    const missingSheetIds = sheetIds.filter((id) => !sheetIdToName[id]);

    if (missingSheetIds.length > 0) {
      const availableSheetIds = allSheets.map((sheet) => ({
        sheetId: sheet.properties.sheetId,
        sheetName: sheet.properties.title,
      }));

      return {
        success: false,
        error: `Sheet ID(s) not found: [${missingSheetIds.join(", ")}]`,
        availableSheets: availableSheetIds,
        fileId: spreadsheetId,
        fileName: fileData.name,
        fileType: "Google Sheets",
        mimeType: fileData.mimeType,
      };
    }

    // Konversi sheet IDs ke sheet names
    const sheetNames = sheetIds.map((id) => sheetIdToName[id]);

    // Jika hanya satu sheet, return format single sheet untuk backward compatibility
    if (sheetIds.length === 1) {
      const singleSheetId = sheetIds[0];
      const singleSheetName = sheetNames[0];
      const quotedSheetName = formatSheetNameForRange(singleSheetName);

      // Tentukan range yang akan diambil
      let dataRange = range;
      if (!dataRange) {
        dataRange = `${quotedSheetName}!A:ZZZ`;
      } else {
        if (!dataRange.includes("!")) {
          dataRange = `${quotedSheetName}!${dataRange}`;
        } else {
          dataRange = dataRange.replace(/^[^!]+!/, `${quotedSheetName}!`);
        }
      }

      console.log(`Getting data with range: ${dataRange}`);

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: dataRange,
        // includeGridData: true,
      });

      const rows = response.data.values || [];
      const columnCount = Math.max(
        ...rows.map((row) => (row ? row.length : 0)),
        0
      );

      console.log(`Retrieved ${rows.length} rows with ${columnCount} columns`);

      return {
        success: true,
        fileId: spreadsheetId,
        fileName: fileData.name,
        fileType: "Google Sheets",
        mimeType: fileData.mimeType,
        sheetId: singleSheetId,
        sheetName: singleSheetName,
        sheetProperties: sheetIdToProperties[singleSheetId],
        range: dataRange,
        actualRange: response.data.range,
        data: rows,
        rowCount: rows.length,
        columnCount: columnCount,
        headers: rows.length > 0 ? rows[0] : [],
        isEmpty: rows.length === 0,
      };
    }

    // Jika multiple sheets, return format multiple sheets
    const sheetsData = {};
    let totalRows = 0;
    let maxColumns = 0;
    const errors = [];

    for (let i = 0; i < sheetIds.length; i++) {
      const sheetId = sheetIds[i];
      const sheetName = sheetNames[i];

      try {
        const quotedSheetName = formatSheetNameForRange(sheetName);

        // Tentukan range untuk sheet ini
        let dataRange = range;
        if (!dataRange) {
          dataRange = `${quotedSheetName}!A:ZZZ`;
        } else {
          if (!dataRange.includes("!")) {
            dataRange = `${quotedSheetName}!${dataRange}`;
          } else {
            dataRange = dataRange.replace(/^[^!]+!/, `${quotedSheetName}!`);
          }
        }

        console.log(
          `Getting data from sheet ID ${sheetId} (${sheetName}) with range: ${dataRange}`
        );

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: dataRange,
        });

        const rows = response.data.values || [];
        const columnCount = Math.max(
          ...rows.map((row) => (row ? row.length : 0)),
          0
        );

        totalRows += rows.length;
        maxColumns = Math.max(maxColumns, columnCount);

        sheetsData[sheetId] = {
          sheetId: sheetId,
          sheetName: sheetName,
          sheetProperties: sheetIdToProperties[sheetId],
          range: dataRange,
          actualRange: response.data.range,
          data: rows,
          rowCount: rows.length,
          columnCount: columnCount,
          headers: rows.length > 0 ? rows[0] : [],
          isEmpty: rows.length === 0,
        };

        console.log(
          `Sheet ID ${sheetId} (${sheetName}): ${rows.length} rows with ${columnCount} columns`
        );
      } catch (sheetError) {
        console.error(
          `Error getting data from sheet ID ${sheetId} (${sheetName}):`,
          sheetError
        );
        errors.push({
          sheetId: sheetId,
          sheetName: sheetName,
          error: sheetError.message,
        });
        sheetsData[sheetId] = {
          sheetId: sheetId,
          sheetName: sheetName,
          error: `Failed to get data: ${sheetError.message}`,
          data: [],
          rowCount: 0,
          columnCount: 0,
          headers: [],
          isEmpty: true,
        };
      }
    }

    return {
      success: true,
      fileId: spreadsheetId,
      fileName: fileData.name,
      fileType: "Google Sheets",
      mimeType: fileData.mimeType,
      requestedSheetIds: sheetIds,
      sheetsData: sheetsData,
      totalRows: totalRows,
      maxColumns: maxColumns,
      sheetsCount: sheetIds.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error in getGoogleSheetDataBySheetId:", error);
    throw error;
  }
}

// Helper function untuk mengambil data sheet berdasarkan sheet ID dari Excel
async function getExcelDataBySheetId(fileId, sheetIds, drive, fileData) {
  try {
    console.log(
      `Processing Excel file for sheet IDs: [${sheetIds.join(", ")}]`
    );

    // Download file dari Google Drive
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
      },
      {
        responseType: "arraybuffer",
      }
    );

    // Parse Excel file dengan XLSX
    const workbook = XLSX.read(response.data, { type: "array" });

    // Untuk Excel, sheet ID biasanya adalah index (0-based)
    // Validasi sheet IDs
    const maxSheetIndex = workbook.SheetNames.length - 1;
    const invalidSheetIds = sheetIds.filter((id) => {
      const index = parseInt(id);
      return isNaN(index) || index < 0 || index > maxSheetIndex;
    });

    if (invalidSheetIds.length > 0) {
      const availableSheets = workbook.SheetNames.map((name, index) => ({
        sheetId: index,
        sheetName: name,
      }));

      return {
        success: false,
        error: `Invalid sheet ID(s): [${invalidSheetIds.join(
          ", "
        )}]. Valid IDs are 0-${maxSheetIndex}`,
        availableSheets: availableSheets,
        fileId: fileId,
        fileName: fileData.name,
        fileType: getFileType(fileData.mimeType),
        mimeType: fileData.mimeType,
      };
    }

    // Konversi sheet IDs ke sheet names
    const sheetNames = sheetIds.map((id) => workbook.SheetNames[parseInt(id)]);

    // Jika hanya satu sheet, return format single sheet untuk backward compatibility
    if (sheetIds.length === 1) {
      const singleSheetId = sheetIds[0];
      const singleSheetName = sheetNames[0];
      const worksheet = workbook.Sheets[singleSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Return array of arrays
        defval: "", // Default value for empty cells
        raw: false, // Format all values as strings
      });

      const columnCount =
        rows.length > 0 ? Math.max(...rows.map((row) => row.length)) : 0;

      console.log(
        `Retrieved ${rows.length} rows with ${columnCount} columns from sheet ID ${singleSheetId} (${singleSheetName})`
      );

      return {
        success: true,
        fileId: fileId,
        fileName: fileData.name,
        fileType: getFileType(fileData.mimeType),
        mimeType: fileData.mimeType,
        size: fileData.size,
        sheetId: parseInt(singleSheetId),
        sheetName: singleSheetName,
        data: rows,
        rowCount: rows.length,
        columnCount: columnCount,
        headers: rows.length > 0 ? rows[0] : [],
        isEmpty: rows.length === 0,
      };
    }

    // Jika multiple sheets, return format multiple sheets
    const sheetsData = {};
    let totalRows = 0;
    let maxColumns = 0;

    for (let i = 0; i < sheetIds.length; i++) {
      const sheetId = sheetIds[i];
      const sheetName = sheetNames[i];

      try {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1, // Return array of arrays
          defval: "", // Default value for empty cells
          raw: false, // Format all values as strings
        });

        const columnCount =
          rows.length > 0 ? Math.max(...rows.map((row) => row.length)) : 0;

        totalRows += rows.length;
        maxColumns = Math.max(maxColumns, columnCount);

        sheetsData[sheetId] = {
          sheetId: parseInt(sheetId),
          sheetName: sheetName,
          data: rows,
          rowCount: rows.length,
          columnCount: columnCount,
          headers: rows.length > 0 ? rows[0] : [],
          isEmpty: rows.length === 0,
        };

        console.log(
          `Sheet ID ${sheetId} (${sheetName}): ${rows.length} rows with ${columnCount} columns`
        );
      } catch (sheetError) {
        console.error(
          `Error getting data from sheet ID ${sheetId} (${sheetName}):`,
          sheetError
        );
        sheetsData[sheetId] = {
          sheetId: parseInt(sheetId),
          sheetName: sheetName,
          error: `Failed to get data: ${sheetError.message}`,
          data: [],
          rowCount: 0,
          columnCount: 0,
          headers: [],
          isEmpty: true,
        };
      }
    }

    return {
      success: true,
      fileId: fileId,
      fileName: fileData.name,
      fileType: getFileType(fileData.mimeType),
      mimeType: fileData.mimeType,
      size: fileData.size,
      requestedSheetIds: sheetIds.map((id) => parseInt(id)),
      sheetsData: sheetsData,
      totalRows: totalRows,
      maxColumns: maxColumns,
      sheetsCount: sheetIds.length,
    };
  } catch (error) {
    console.error("Error in getExcelDataBySheetId:", error);
    throw error;
  }
}

// Helper function untuk memproses Google Sheet
async function processGoogleSheet(spreadsheetId, sheets) {
  const spreadsheetInfo = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
  });

  const availableSheets = spreadsheetInfo.data.sheets.map((sheet) => ({
    sheetId: sheet.properties.sheetId,
    title: sheet.properties.title,
    gridProperties: sheet.properties.gridProperties,
  }));

  // Ambil data dari sheet pertama
  const firstSheetName = availableSheets[0]?.title || "Sheet1";
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: `${firstSheetName}!A:Z`,
  });

  const rows = dataResponse.data.values || [];

  return {
    availableSheets: availableSheets,
    data: rows,
    rowCount: rows.length,
    columnCount: rows.length > 0 ? rows[0].length : 0,
    headers: rows.length > 0 ? rows[0] : [],
  };
}

// Helper function untuk memproses Excel file
async function processExcelFile(fileId, drive, targetSheetName = null) {
  // Download file dari Google Drive
  const response = await drive.files.get(
    {
      fileId: fileId,
      alt: "media",
    },
    {
      responseType: "arraybuffer",
    }
  );

  // Parse Excel file dengan XLSX
  const workbook = XLSX.read(response.data, { type: "array" });

  // Dapatkan daftar sheet
  const availableSheets = workbook.SheetNames.map((name, index) => ({
    sheetId: index,
    title: name,
    gridProperties: {
      rowCount: 0, // Will be calculated when data is read
      columnCount: 0,
    },
  }));

  // Tentukan sheet yang akan dibaca
  const sheetName = targetSheetName || workbook.SheetNames[0];

  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(
      `Sheet '${sheetName}' not found. Available sheets: ${workbook.SheetNames.join(
        ", "
      )}`
    );
  }

  // Ambil data dari sheet
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1, // Return array of arrays
    defval: "", // Default value for empty cells
    raw: false, // Format all values as strings
  });

  // Update grid properties
  const targetSheetIndex = workbook.SheetNames.indexOf(sheetName);
  if (targetSheetIndex !== -1 && rows.length > 0) {
    availableSheets[targetSheetIndex].gridProperties = {
      rowCount: rows.length,
      columnCount: Math.max(...rows.map((row) => row.length)),
    };
  }

  return {
    availableSheets: availableSheets,
    currentSheet: sheetName,
    data: rows,
    rowCount: rows.length,
    columnCount:
      rows.length > 0 ? Math.max(...rows.map((row) => row.length)) : 0,
    headers: rows.length > 0 ? rows[0] : [],
  };
}

function formatSheetNameForRange(sheetName) {
  // Jika sheet name mengandung spasi, karakter khusus, atau dimulai dengan angka,
  // bungkus dengan tanda petik tunggal
  if (
    sheetName.includes(" ") ||
    sheetName.includes("-") ||
    sheetName.includes(".") ||
    sheetName.includes("!") ||
    sheetName.includes("'") ||
    sheetName.includes('"') ||
    /^[0-9]/.test(sheetName) ||
    /[^\w\s]/.test(sheetName)
  ) {
    // Escape tanda petik tunggal yang sudah ada dengan menggandakannya
    const escapedSheetName = sheetName.replace(/'/g, "''");
    return `'${escapedSheetName}'`;
  }
  return sheetName;
}

// Function authenticate tetap sama
async function authenticateGoogle() {
  try {
    console.log("Reading credentials from:", CREDENTIALS_PATH);

    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Credentials file not found at ${CREDENTIALS_PATH}`);
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    console.log("Credentials loaded, client_email:", credentials.client_email);

    const { client_email, private_key } = credentials;

    if (!client_email || !private_key) {
      throw new Error("Missing client_email or private_key in credentials");
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email,
        private_key: private_key.replace(/\\n/g, "\n"),
      },
      scopes: SCOPES,
    });

    const authClient = await auth.getClient();
    console.log("Authentication successful");

    return {
      sheets: google.sheets({ version: "v4", auth: authClient }),
      drive: google.drive({ version: "v3", auth: authClient }),
    };
  } catch (error) {
    console.error("Error authenticating:", error);
    throw error;
  }
}

// Konfigurasi tetap sama
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];
const CREDENTIALS_PATH = path.join(__dirname, "../credentials.json");

module.exports = SpreadsheetsFunction;

// fungsi yang tidak di pakai, ini metode memanggil semua data dulu baru filter sheetnya yang di pakainsekarang langsung ngambil dari sheet yang butuh saja

//ini controllernya
// // UPDATED METHOD: Mendapatkan data dari spreadsheet (Google Sheets atau Excel)
// getSpreadsheetData: async (folderId, spreadsheetId, sheetName, range) => {
//   const { sheets, drive } = await authenticateGoogle();

//   console.log(
//     `Getting data from spreadsheet ${spreadsheetId} in folder ${folderId}`
//   );

//   // Verifikasi dan resolve file (handle shortcuts)
//   const resolvedFile = await resolveFileOrShortcut(
//     drive,
//     spreadsheetId,
//     folderId
//   );

//   const mimeType = resolvedFile.mimeType;
//   console.log("Resolved file MIME type:", mimeType);
//   console.log("Resolved file ID:", resolvedFile.id);

//   // Cek apakah file adalah spreadsheet (Google Sheets atau Excel)
//   if (mimeType === "application/vnd.google-apps.spreadsheet") {
//     // Handle Google Sheets dengan range yang lebih luas
//     return await handleGoogleSheetsMultiple(
//       resolvedFile.id,
//       sheetName,
//       range,
//       sheets,
//       resolvedFile
//     );
//   } else if (
//     mimeType ===
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
//     mimeType === "application/vnd.ms-excel"
//   ) {
//     // Handle Excel files (sudah support semua kolom)
//     return await handleExcelFileMultiple(
//       resolvedFile.id,
//       sheetName,
//       drive,
//       resolvedFile
//     );
//   } else {
//     return {
//       success: false,
//       error: "File is not a supported spreadsheet format",
//       mimeType: mimeType,
//       supportedTypes: [
//         "application/vnd.google-apps.spreadsheet",
//         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         "application/vnd.ms-excel",
//       ],
//     };
//   }
// },

//ini functionnya spreadheet dan exelnya

// // Helper function untuk handle Google Sheets
// async function handleGoogleSheetsMultiple(
//   spreadsheetId,
//   sheetNames,
//   range,
//   sheets,
//   fileData
// ) {
//   try {
//     // Dapatkan informasi spreadsheet dan sheet-sheet yang ada
//     const spreadsheetInfo = await sheets.spreadsheets.get({
//       spreadsheetId: spreadsheetId,
//     });

//     const availableSheets = spreadsheetInfo.data.sheets.map((sheet) => ({
//       sheetId: sheet.properties.sheetId,
//       title: sheet.properties.title,
//       gridProperties: sheet.properties.gridProperties,
//     }));

//     // Tentukan sheets yang akan diambil
//     let targetSheets = [];

//     if (!sheetNames || sheetNames.length === 0) {
//       // Jika tidak ada sheet yang ditentukan, ambil sheet pertama
//       targetSheets = [availableSheets[0].title];
//     } else if (Array.isArray(sheetNames)) {
//       // Jika array sheet names diberikan
//       targetSheets = sheetNames;
//     } else if (typeof sheetNames === "string") {
//       // Jika single sheet name diberikan
//       targetSheets = [sheetNames];
//     }

//     console.log(`Target sheets: ${targetSheets.join(", ")}`);

//     // Validasi sheets yang diminta
//     const invalidSheets = targetSheets.filter(
//       (sheetName) => !availableSheets.some((sheet) => sheet.title === sheetName)
//     );

//     if (invalidSheets.length > 0) {
//       return {
//         success: false,
//         error: `Sheet(s) not found: ${invalidSheets.join(", ")}`,
//         availableSheets: availableSheets.map((s) => s.title),
//       };
//     }

//     // Ambil data dari setiap sheet
//     const sheetsData = {};
//     let totalRows = 0;
//     let maxColumns = 0;

//     for (const sheetName of targetSheets) {
//       try {
//         // Tentukan range yang akan diambil untuk sheet ini
//         let dataRange = range;
//         const quotedSheetName = formatSheetNameForRange(sheetName);

//         if (!dataRange) {
//           dataRange = await getDynamicRange(sheets, spreadsheetId, sheetName);
//         } else {
//           // Jika range diberikan, pastikan menggunakan nama sheet yang benar
//           if (!dataRange.includes("!")) {
//             dataRange = `${quotedSheetName}!${dataRange}`;
//           } else {
//             // Replace sheet name di range jika ada
//             dataRange = dataRange.replace(/^[^!]+!/, `${quotedSheetName}!`);
//           }
//         }

//         console.log(`Getting data from ${sheetName} with range: ${dataRange}`);

//         // Ambil data dari sheet
//         const response = await sheets.spreadsheets.values.get({
//           spreadsheetId: spreadsheetId,
//           range: dataRange,
//         });

//         const rows = response.data.values || [];
//         const actualColumnCount = Math.max(
//           ...rows.map((row) => (row ? row.length : 0))
//         );

//         totalRows += rows.length;
//         maxColumns = Math.max(maxColumns, actualColumnCount);

//         sheetsData[sheetName] = {
//           range: dataRange,
//           actualRange: response.data.range,
//           data: rows,
//           rowCount: rows.length,
//           columnCount: actualColumnCount,
//           headers: rows.length > 0 ? rows[0] : [],
//         };

//         console.log(
//           `${sheetName}: ${rows.length} rows, ${actualColumnCount} columns`
//         );
//       } catch (sheetError) {
//         console.error(
//           `Error getting data from sheet ${sheetName}:`,
//           sheetError
//         );
//         sheetsData[sheetName] = {
//           error: `Failed to get data: ${sheetError.message}`,
//           data: [],
//           rowCount: 0,
//           columnCount: 0,
//           headers: [],
//         };
//       }
//     }

//     return {
//       success: true,
//       fileId: spreadsheetId,
//       fileName: fileData.name,
//       fileType: "Google Sheets",
//       mimeType: fileData.mimeType,
//       //availableSheets: availableSheets,
//       requestedSheets: targetSheets,
//       sheetsData: sheetsData,
//       totalRows: totalRows,
//       maxColumns: maxColumns,
//       sheetsCount: targetSheets.length,
//     };
//   } catch (error) {
//     console.error("Error in handleGoogleSheetsMultiple:", error);
//     throw error;
//   }
// }

// // Helper function untuk handle Excel files dengan multiple sheets
// async function handleExcelFileMultiple(fileId, sheetNames, drive, fileData) {
//   try {
//     // Download file dari Google Drive
//     const response = await drive.files.get(
//       {
//         fileId: fileId,
//         alt: "media",
//       },
//       {
//         responseType: "arraybuffer",
//       }
//     );

//     // Parse Excel file dengan XLSX
//     const workbook = XLSX.read(response.data, { type: "array" });

//     // Dapatkan daftar sheet
//     const availableSheets = workbook.SheetNames.map((name, index) => ({
//       sheetId: index,
//       title: name,
//       gridProperties: {
//         rowCount: 0, // Will be calculated when data is read
//         columnCount: 0,
//       },
//     }));

//     // Tentukan sheets yang akan diambil
//     let targetSheets = [];

//     if (!sheetNames || sheetNames.length === 0) {
//       // Jika tidak ada sheet yang ditentukan, ambil sheet pertama
//       targetSheets = [workbook.SheetNames[0]];
//     } else if (Array.isArray(sheetNames)) {
//       // Jika array sheet names diberikan
//       targetSheets = sheetNames;
//     } else if (typeof sheetNames === "string") {
//       // Jika single sheet name diberikan
//       targetSheets = [sheetNames];
//     }

//     console.log(`Target sheets: ${targetSheets.join(", ")}`);

//     // Validasi sheets yang diminta
//     const invalidSheets = targetSheets.filter(
//       (sheetName) => !workbook.SheetNames.includes(sheetName)
//     );

//     if (invalidSheets.length > 0) {
//       return {
//         success: false,
//         error: `Sheet(s) not found: ${invalidSheets.join(", ")}`,
//         availableSheets: workbook.SheetNames,
//       };
//     }

//     // Ambil data dari setiap sheet
//     const sheetsData = {};
//     let totalRows = 0;
//     let maxColumns = 0;

//     for (const sheetName of targetSheets) {
//       try {
//         // Ambil data dari sheet
//         const worksheet = workbook.Sheets[sheetName];
//         const rows = XLSX.utils.sheet_to_json(worksheet, {
//           header: 1, // Return array of arrays
//           defval: "", // Default value for empty cells
//           raw: false, // Format all values as strings
//         });

//         const columnCount =
//           rows.length > 0 ? Math.max(...rows.map((row) => row.length)) : 0;

//         totalRows += rows.length;
//         maxColumns = Math.max(maxColumns, columnCount);

//         sheetsData[sheetName] = {
//           data: rows,
//           rowCount: rows.length,
//           columnCount: columnCount,
//           headers: rows.length > 0 ? rows[0] : [],
//         };

//         console.log(
//           `${sheetName}: ${rows.length} rows, ${columnCount} columns`
//         );
//       } catch (sheetError) {
//         console.error(
//           `Error getting data from sheet ${sheetName}:`,
//           sheetError
//         );
//         sheetsData[sheetName] = {
//           error: `Failed to get data: ${sheetError.message}`,
//           data: [],
//           rowCount: 0,
//           columnCount: 0,
//           headers: [],
//         };
//       }
//     }

//     return {
//       success: true,
//       fileId: fileId,
//       fileName: fileData.name,
//       fileType: getFileType(fileData.mimeType),
//       mimeType: fileData.mimeType,
//       size: fileData.size,
//       //availableSheets: availableSheets,
//       requestedSheets: targetSheets,
//       sheetsData: sheetsData,
//       totalRows: totalRows,
//       maxColumns: maxColumns,
//       sheetsCount: targetSheets.length,
//     };
//   } catch (error) {
//     console.error("Error in handleExcelFileMultiple:", error);
//     throw error;
//   }
// }

//ini function rangenya

// // Helper function untuk mendapatkan range dinamis berdasarkan data aktual
// async function getDynamicRange(sheets, spreadsheetId, sheetName) {
//   try {
//     // Coba ambil metadata spreadsheet untuk mendapatkan dimensi sebenarnya
//     const spreadsheetInfo = await sheets.spreadsheets.get({
//       spreadsheetId: spreadsheetId,
//       includeGridData: false,
//     });

//     const targetSheet = spreadsheetInfo.data.sheets.find(
//       (sheet) => sheet.properties.title === sheetName
//     );

//     if (targetSheet && targetSheet.properties.gridProperties) {
//       const rowCount = targetSheet.properties.gridProperties.rowCount || 1000;
//       const columnCount =
//         targetSheet.properties.gridProperties.columnCount || 26;

//       const lastColumn = numberToExcelColumn(columnCount);
//       return `${sheetName}!A1:${lastColumn}${rowCount}`;
//     }
//   } catch (error) {
//     console.log("Could not get dynamic range, using fallback");
//   }

//   // Fallback ke range yang lebih luas
//   return `${sheetName}!A:ZZZ`; // Ini akan mencakup sampai kolom ZZZ (sekitar 18000+ kolom)
// }

// // Helper function untuk convert number ke Excel column (A, B, C, ..., Z, AA, AB, ..., ZZ, AAA, ...)
// function numberToExcelColumn(num) {
//   let result = "";
//   while (num > 0) {
//     num--; // Make it 0-based
//     result = String.fromCharCode(65 + (num % 26)) + result;
//     num = Math.floor(num / 26);
//   }
//   return result;
// }
