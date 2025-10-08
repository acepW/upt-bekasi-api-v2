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

const KinerjaUptController = {
  getKinerjaUpt: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.kinerja.upt.folderId, //folder Id
        dataConfig.kinerja.upt.spreadsheetId, //spreadsheet Id
        "1730394021" // sheet id
      );

      const headerMapping = [
        { field: "indikator", column: 1 },
        { field: "bobot", column: 4 },
        { field: "target", column: 5 },
        { field: "realisasi", column: 6 },
        { field: "nilai", column: 8 },
      ];

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, // data spreadsheet
        7, //index mulai data
        headerMapping
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
};

module.exports = KinerjaUptController;
