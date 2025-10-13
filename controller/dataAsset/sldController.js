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

const SldController = {
  getSld: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.dataAsset.sld.folderId, //folder Id
        dataConfig.dataAsset.sld.spreadsheetId, //spreadsheet Id
        [1089802955] // sheet id
      );

      const headerMapping = [
        { field: "upt", column: 2 },
        { field: "ultg", column: 17 },
        { field: "nama_gi_gis", column: 1 },
        { field: "jenis", column: 3 },
        { field: "tegangan", column: 4 },
        { field: "rilis_sld", column: 8 },
        { field: "link_sld", column: 7 },
      ];

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, // data spreadsheet
        1, //index mulai data
        headerMapping // mapping header
      );

      const filterData = jsonResult.data.filter((item) => item.upt == "BEKASI");
      console.log(filterData.length);
      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: filterData,
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

module.exports = SldController;
