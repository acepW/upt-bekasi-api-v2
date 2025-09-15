const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx"); // Untuk membaca file Excel
const SpreadsheetsFunction = require("../../function/spreadsheetFunction");
const dataConfig = require("../../config/dataConfig");
const {
  convertSpreadsheetToJSON,
} = require("../../function/converSpreadsheetToJson");

const TowerController = {
  getTowerKritis: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.dataAsset.towerKritis.folderId, //folder Id
        dataConfig.dataAsset.towerKritis.spreadsheetId, //spreadsheet Id
        [1245211520, 85722308] // sheet id
      );

      const headerMapping = [
        { field: "tgl_temuan", column: 1 },
        { field: "ultg", column: 2 },
        { field: "no_tower", column: 4 },
        { field: "sts", column: 6 },
        { field: "nilai_justifikasi", column: 7 },
        { field: "lingkungan", column: 8 },
        { field: "pondasi", column: 9 },
        { field: "tower", column: 10 },
        { field: "progress", column: 16 },
        { field: "status", column: 17 },
      ];

      const headerMappingTredBebanTrafo = [
        { field: "gi_gis", column: 0 },
        { field: "bay", column: 1 },
        { field: "trafo", column: 2 },
        { field: "feb", column: 3 },
        { field: "mar", column: 4 },
        { field: "apr", column: 5 },
        { field: "mei", column: 6 },
      ];

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.sheetsData[1245211520].data, // data spreadsheet
        3, //index mulai data
        headerMapping // mapping header
      );

      // Konversi data
      const jsonResultTrendBebanTrafo = convertSpreadsheetToJSON(
        data.sheetsData[85722308].data, // data spreadsheet
        1, //index mulai data
        headerMappingTredBebanTrafo // mapping header
      );

      // daftar bulan yg mau diambil
      const months = ["feb", "mar", "apr", "mei"];

      const groupedByMonth = months.map((month) => {
        return {
          bulan: month,
          data: jsonResultTrendBebanTrafo.data.map((item) => ({
            gi_gis: item.gi_gis,
            bay: item.bay,
            trafo: item.trafo,
            value: Number(item[month] || 0),
          })),
        };
      });

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: jsonResult.data,
        data_trend_beban_trafo: groupedByMonth,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to get data",
        error: error.message,
      });
    }
  },
};

// fungsi untuk hitung total per field
function groupCount(arr, field) {
  const result = {};
  arr.forEach((item) => {
    const key = item[field];
    if (!result[key]) result[key] = 0;
    result[key] += 1;
  });

  return Object.entries(result).map(([key, total]) => ({
    [field]: key,
    total,
  }));
}

// fungsi untuk bikin label range
function getRangeLabel(masaKerja) {
  const start = Math.floor((masaKerja - 1) / 5) * 5 + 1; // hitung awal range
  const end = start + 4;

  // khusus untuk 0–5
  if (masaKerja <= 5) return "0-5 tahun";

  return `${start}-${end} tahun`;
}

// fungsi grouping berdasarkan range
function groupByMasaKerja(arr) {
  const result = {};
  arr.forEach((item) => {
    const range = getRangeLabel(item.masa_kerja);
    if (!result[range]) result[range] = 0;
    result[range] += 1;
  });

  return Object.entries(result).map(([range, total]) => ({
    range,
    total,
  }));
}

function validateMapping(data, indexStartData, mapping) {
  const maxColumn = Math.max(...(data[indexStartData]?.map((_, i) => i) || []));
  const errors = [];
  const warnings = [];

  mapping.forEach((map, index) => {
    if (map.type === "group") {
      Object.entries(map.fields).forEach(([subField, column]) => {
        if (column > maxColumn) {
          warnings.push(
            `Mapping ${index}: Group '${map.field}' subfield '${subField}' column ${column} exceeds data range (max: ${maxColumn}) - will use '-'`
          );
        }
        if (column < 0) {
          errors.push(
            `Mapping ${index}: Group '${map.field}' subfield '${subField}' has invalid column index ${column}`
          );
        }
      });
    } else {
      if (map.column > maxColumn) {
        warnings.push(
          `Mapping ${index}: Field '${map.field}' column ${map.column} exceeds data range (max: ${maxColumn}) - will use '-'`
        );
      }
      if (map.column < 0) {
        errors.push(
          `Mapping ${index}: Field '${map.field}' has invalid column index ${map.column}`
        );
      }
    }
  });

  return { errors, warnings };
}

module.exports = TowerController;
