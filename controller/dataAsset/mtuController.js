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

const MtuController = {
  getMonitoringKondisiMtu: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetData(
        dataConfig.dataAsset.mtuKondisi.folderId, //folder Id
        dataConfig.dataAsset.mtuKondisi.spreadsheetId, //spreadsheet Id
        ["LA", "CT", "Kabel Power", "TRAFO", "CVT", "CB", "DS"] // sheet name
      );

      const headerMappingLA = [
        { field: "no", column: 0 },
        { field: "gi", column: 3 },
        { field: "bay", column: 4 },
        { field: "status_usia", column: 14 },
        { field: "prioritas", column: 99 },
      ];
      const headerMappingCT = [
        { field: "no", column: 0 },
        { field: "gi", column: 3 },
        { field: "bay", column: 4 },
        { field: "status_usia", column: 14 },
        { field: "prioritas", column: 99 },
      ];
      const headerMappingKabelPower = [
        { field: "no", column: 0 },
        { field: "gi", column: 3 },
        { field: "bay", column: 4 },
        { field: "status_usia", column: 15 },
        { field: "prioritas", column: 13 },
      ];

      const headerMappingTRAFO = [
        { field: "no", column: 0 },
        { field: "gi", column: 3 },
        { field: "bay", column: 4 },
        { field: "status_usia", column: 14 },
        { field: "prioritas", column: 99 },
      ];

      const headerMappingCVT = [
        { field: "no", column: 0 },
        { field: "gi", column: 3 },
        { field: "bay", column: 4 },
        { field: "status_usia", column: 14 },
        { field: "prioritas", column: 99 },
      ];

      const headerMappingCB = [
        { field: "no", column: 0 },
        { field: "gi", column: 3 },
        { field: "bay", column: 4 },
        { field: "status_usia", column: 14 },
        { field: "prioritas", column: 99 },
      ];

      const headerMappingDS = [
        { field: "no", column: 0 },
        { field: "gi", column: 3 },
        { field: "bay", column: 4 },
        { field: "status_usia", column: 15 },
        { field: "prioritas", column: 99 },
      ];

      // Konversi data
      const jsonResultLA = convertSpreadsheetToJSON(
        data.sheetsData["LA"].data, // data spreadsheet
        1, //index mulai data
        headerMappingLA // mapping header
      );

      const jsonResultCT = convertSpreadsheetToJSON(
        data.sheetsData["CT"].data, // data spreadsheet
        1, //index mulai data
        headerMappingCT // mapping header
      );

      const jsonResultKabelPower = convertSpreadsheetToJSON(
        data.sheetsData["Kabel Power"].data, // data spreadsheet
        1, //index mulai data
        headerMappingKabelPower // mapping header
      );
      const jsonResultTRAFO = convertSpreadsheetToJSON(
        data.sheetsData["TRAFO"].data, // data spreadsheet
        1, //index mulai data
        headerMappingTRAFO // mapping header
      );

      const jsonResultCVT = convertSpreadsheetToJSON(
        data.sheetsData["CVT"].data, // data spreadsheet
        1, //index mulai data
        headerMappingCVT // mapping header
      );
      const jsonResultCB = convertSpreadsheetToJSON(
        data.sheetsData["CB"].data, // data spreadsheet
        1, //index mulai data
        headerMappingCB // mapping header
      );

      const jsonResultDS = convertSpreadsheetToJSON(
        data.sheetsData["DS"].data, // data spreadsheet
        1, //index mulai data
        headerMappingDS // mapping header
      );

      const resultLAFilter = filterData(jsonResultLA.data);
      const resultCTFilter = filterData(jsonResultCT.data);
      const resultKabelPowerFilter = filterData(jsonResultKabelPower.data);
      const resultTRAFOFilter = filterData(jsonResultTRAFO.data);
      const resultCVTFilter = filterData(jsonResultCVT.data);
      const resultCBFilter = filterData(jsonResultCB.data);
      const resultDSFilter = filterData(jsonResultDS.data);

      res.status(200).json({
        status: "success",
        message: "get data successfully",

        la: {
          status_usia: resultLAFilter.usia,
          prioritas: resultLAFilter.prioritas,
        },
        ct: {
          status_usia: resultCTFilter.usia,
          prioritas: resultCTFilter.prioritas,
        },
        kabel_power: {
          status_usia: resultKabelPowerFilter.usia,
          prioritas: resultKabelPowerFilter.prioritas,
        },
        trafo: {
          status_usia: resultTRAFOFilter.usia,
          prioritas: resultTRAFOFilter.prioritas,
        },
        cvt: {
          status_usia: resultCVTFilter.usia,
          prioritas: resultCVTFilter.prioritas,
        },
        cb: {
          status_usia: resultCBFilter.usia,
          prioritas: resultCBFilter.prioritas,
        },
        ds: {
          status_usia: resultDSFilter.usia,
          prioritas: resultDSFilter.prioritas,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to get data",
        error: error.message,
      });
    }
  },
  getPenggantianMtu: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetData(
        dataConfig.dataAsset.mtuPergantian.folderId, //folder Id
        dataConfig.dataAsset.mtuPergantian.spreadsheetId, //spreadsheet Id
        ["Daftar MTU", "Dashboard"] // sheet name
      );

      //untuk 99 belum ada datanya
      const headerMapping = [
        { field: "no", column: 0 },
        { field: "ultg", column: 3 },
        { field: "bay", column: 5 },
        { field: "mtu", column: 11 },
        { field: "fase", column: 16 },
        { field: "onsite_mtu", column: 99 },
        { field: "rencana_pasang", column: 36 },
        { field: "realisasi_pasang", column: 37 },
        { field: "usulan_relokasi", column: 99 },
      ];

      const headerMappingDashboard = [
        { field: "uraian", column: 0 },
        {
          field: "bekasi",
          type: "group",
          fields: {
            kontrak: 1,
            onsite: 2,
            periksa: 3,
            pasang: 4,
          },
        },
        {
          field: "cikarang",
          type: "group",
          fields: {
            kontrak: 5,
            onsite: 6,
            periksa: 7,
            pasang: 8,
          },
        },

        {
          field: "total",
          type: "group",
          fields: {
            kontrak: 9,
            onsite: 10,
            periksa: 11,
            pasang: 12,
          },
        },
      ];
      //header untu data
      //data.data = data spreadsheet
      // 7 =  index mulai data
      // headerMapping = mapping header
      const validation = validateMapping(
        data.sheetsData["Daftar MTU"].data,
        7,
        headerMapping
      );

      //header untuk Dashboard
      const validationDashboard = validateMapping(
        data.sheetsData["Dashboard"].data,
        14,
        headerMappingDashboard
      );

      if (validation.errors.length > 0) {
        console.log("\n❌ Mapping Errors (akan menyebabkan error):");
        validation.errors.forEach((error) => console.log(`  - ${error}`));
        return; // Stop execution jika ada error
      }

      if (validation.warnings.length > 0) {
        console.log("\n⚠️  Mapping Warnings (akan menggunakan '-'):");
        validation.warnings.forEach((warning) => console.log(`  - ${warning}`));
      }

      if (validationDashboard.errors.length > 0) {
        console.log("\n❌ Mapping Errors (akan menyebabkan error):");
        validationDashboard.errors.forEach((error) =>
          console.log(`  - ${error}`)
        );
        return; // Stop execution jika ada error
      }

      if (validationDashboard.warnings.length > 0) {
        console.log("\n⚠️  Mapping Warnings (akan menggunakan '-'):");
        validationDashboard.warnings.forEach((warning) =>
          console.log(`  - ${warning}`)
        );
      }

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.sheetsData["Daftar MTU"].data,
        7,
        headerMapping
      );

      // Konversi data
      const jsonResultDashboard = convertSpreadsheetToJSON(
        data.sheetsData["Dashboard"].data,
        14,
        headerMappingDashboard
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        // data: data,
        data_dashboard: jsonResultDashboard,
        data: jsonResult,
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

function filterData(data) {
  // Grup berdasarkan status_usia
  const byStatusUsia = Object.values(
    data.reduce((acc, item) => {
      acc[item.status_usia] = acc[item.status_usia] || {
        status_usia: item.status_usia,
        jumlah: 0,
      };
      acc[item.status_usia].jumlah += 1;
      return acc;
    }, {})
  );

  // Grup berdasarkan prioritas
  const byPrioritas = Object.values(
    data.reduce((acc, item) => {
      acc[item.prioritas] = acc[item.prioritas] || {
        prioritas: item.prioritas,
        jumlah: 0,
      };
      acc[item.prioritas].jumlah += 1;
      return acc;
    }, {})
  );
  return {
    usia: byStatusUsia,
    prioritas: byPrioritas,
  };
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

module.exports = MtuController;
