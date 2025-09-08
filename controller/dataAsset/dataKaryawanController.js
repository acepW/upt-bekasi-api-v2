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

const KaryawanController = {
  getKaryawan: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.dataAsset.karyawan.folderId, //folder Id
        dataConfig.dataAsset.karyawan.spreadsheetId, //spreadsheet Id
        [0, 1, 2] // sheet id
      );

      const headerMapping = [
        { field: "nip", column: 0 },
        { field: "nama", column: 1 },
        { field: "unit", column: 6 },
        { field: "jenis_kelamin", column: 9 },
        { field: "grade", column: 10 },
        { field: "jenjang", column: 11 },
        { field: "pendidikan_terakhir", column: 13 },
        { field: "masa_kerja", column: 20 },
        { field: "tahun_pensiun", column: 21 },
      ];
      const headerFtk = [
        { field: "unit", column: 1 },
        { field: "ftk", column: 2 },
        { field: "existing", column: 3 },
      ];

      const headerTad = [
        { field: "uraian", column: 0 },
        { field: "jumlah", column: 1 },
      ];

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.sheetsData[0].data, // data spreadsheet
        1, //index mulai data
        headerMapping // mapping header
      );

      const jsonResultFtk = convertSpreadsheetToJSON(
        data.sheetsData[1].data, // data spreadsheet
        5, //index mulai data
        headerFtk // mapping header
      );

      const jsonResultTad = convertSpreadsheetToJSON(
        data.sheetsData[2].data, // data spreadsheet
        4, //index mulai data
        headerTad // mapping header
      );

      const filterFtk = jsonResultFtk.data.filter((item) => item.unit !== "-");
      const filterTad = jsonResultTad.data.filter(
        (item) => item.uraian !== "TOTAL"
      );

      const unit = groupCount(jsonResult.data, "unit");
      const jenis_kelamin = groupCount(jsonResult.data, "jenis_kelamin");
      const grade = groupCount(jsonResult.data, "grade");
      const pegawaiPensiun = groupCount(jsonResult.data, "tahun_pensiun");
      const masaKerjaGrouped = groupByMasaKerja(jsonResult.data);
      const totalTad = filterTad.reduce(
        (sum, item) => sum + Number(item.jumlah),
        0
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",

        unit: unit,
        jenis_kelamin: jenis_kelamin,
        grade: grade,
        masa_kerja: masaKerjaGrouped,
        pegawai_pensiun: pegawaiPensiun,
        personil: {
          pegawai: jsonResult.data.length,
          tad: totalTad,
        },
        ftk: filterFtk,
        data_karyawan: jsonResult.data,
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

module.exports = KaryawanController;
