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

const KonstruksiController = {
  getAdkonDalkon: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetData(
        dataConfig.monitoring.konstruksi.adkonDalkon.folderId, //folder Id
        dataConfig.monitoring.konstruksi.adkonDalkon.spreadsheetId, //spreadsheet Id
        "kontrak AI" // sheet name
      );

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        9, //index awal data
        headerMapping //custom header
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
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

  getMonitoringGudang: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.monitoring.konstruksi.logistik.monitoringGudang.folderId, //folder Id
        dataConfig.monitoring.konstruksi.logistik.monitoringGudang
          .spreadsheetId, //spreadsheet Id
        [1618970871, 1125139855] // sheet id
        //kapasitas gudang , limbah non b3
      );

      // Konversi data
      const jsonResultGudang = convertSpreadsheetToJSON(
        data.sheetsData[1618970871].data, //data spreadsheet
        9, //index awal data
        headerMappingGudang //custom header
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: {
          gudang: jsonResultGudang,
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
};

const headerMapping = [
  { field: "no_kontrak", column: 1 },
  { field: "nama_kontrak", column: 3 },
  { field: "tgl_kontrak", column: 10 },
  { field: "akhir_kontrak", column: 99 }, // 99 untuk kolom yang tidak ada di spreadsheet
  { field: "fisik", column: 17 },
  { field: "bayar", column: 18 },
  { field: "status", column: 99 }, // 99 untuk kolom yang tidak ada di spreadsheet
];

const headerMappingGudang = [
  { field: "gudang", column: 2 },
  { field: "sub_gudang", column: 3 },
  { field: "persentase_gudang_terpakai", column: 7 },
  { field: "persediaan", column: 9 },
  { field: "cadang", column: 10 },
  { field: "pre_memory", column: 11 },
  { field: "attb", column: 12 },
  { field: "lainnya_limbah_non_b3", column: 13 },
  { field: "waktu_update", column: 24 },
];

module.exports = KonstruksiController;
