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

const LmAboController = {
  getLmAbo: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.monitoring.lm_abo.folderId, //folder Id
        dataConfig.monitoring.lm_abo.spreadsheetId, //spreadsheet Id
        [0] // sheet id
      );

      const headerMapping = [
        { field: "bidang", column: 1 },
        { field: "program", column: 2 },
        { field: "uraian_pekerjaan", column: 3 },
        { field: "target", column: 4 },
        { field: "realisasi", column: 5 },
        { field: "persen_realisasi", column: 6 },
      ];

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, // data spreadsheet
        1, //index mulai data
        headerMapping
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: jsonResult.data,
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

module.exports = LmAboController;
