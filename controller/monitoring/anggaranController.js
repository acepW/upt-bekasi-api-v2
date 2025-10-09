const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx"); // Untuk membaca file Excel
const SpreadsheetsFunction = require("../../function/spreadsheetFunction");
const dataConfig = require("../../config/dataConfig");
const {
  convertSpreadsheetToJSON,
  convertSpreadsheetToJSONWithRange,
} = require("../../function/converSpreadsheetToJson");

const AnggaranController = {
  getAnggaran: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.monitoring.anggaran.folderId, //folder Id
        dataConfig.monitoring.anggaran.spreadsheetId, //spreadsheet Id
        [277215817] // sheet id
      );

      const dataInvestasi = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.monitoring.investasi.folderId, //folder Id
        dataConfig.monitoring.investasi.spreadsheetId, //spreadsheet Id
        [1941962179] // sheet id
      );

      const headerPosKepegawaian = [
        { field: "bulan", column: 1 },
        { field: "sko_1_tahun", column: 2 },
        { field: "realisasi_akumulasi", column: 4 },
        { field: "presentase", column: 5 },
      ];

      const headerPosPemeliharaan = [
        { field: "bulan", column: 1 },
        { field: "sko_1_tahun", column: 6 },
        { field: "realisasi_akumulasi", column: 8 },
        { field: "presentase", column: 9 },
      ];

      const headerPosAdministrasiUmum = [
        { field: "bulan", column: 1 },
        { field: "sko_1_tahun", column: 10 },
        { field: "realisasi_akumulasi", column: 12 },
        { field: "presentase", column: 13 },
      ];

      const headerInvestasi = [
        {
          field: "skki_terbit",
          type: "group",
          fields: {
            januari: 60,
            februari: 61,
            maret: 62,
            april: 63,
            mei: 64,
            juni: 65,
            juli: 66,
            agustus: 67,
            september: 68,
            oktober: 69,
            november: 70,
            desember: 71,
          },
        },

        {
          field: "rencana",
          type: "group",
          fields: {
            januari: 72,
            februari: 73,
            maret: 74,
            april: 75,
            mei: 76,
            juni: 77,
            juli: 78,
            agustus: 79,
            september: 80,
            oktober: 81,
            november: 82,
            desember: 83,
          },
        },
        {
          field: "realisasi",
          type: "group",
          fields: {
            januari: 84,
            februari: 85,
            maret: 86,
            april: 87,
            mei: 88,
            juni: 89,
            juli: 90,
            agustus: 91,
            september: 92,
            oktober: 93,
            november: 94,
            desember: 95,
          },
        },
      ];

      // Konversi data
      const jsonResultKepegawaian = convertSpreadsheetToJSON(
        data.data, // data spreadsheet
        2, //index mulai data
        headerPosKepegawaian,
        ["sko_1_tahun"] // mapping header //merge data
      );

      // Konversi data
      const jsonResultPemeliharaan = convertSpreadsheetToJSON(
        data.data, // data spreadsheet
        2, //index mulai data
        headerPosPemeliharaan,
        ["sko_1_tahun"] // mapping header //merge data
      );

      // Konversi data
      const jsonResultAdministrasiUmum = convertSpreadsheetToJSON(
        data.data, // data spreadsheet
        2, //index mulai data
        headerPosAdministrasiUmum,
        ["sko_1_tahun"] // mapping header //merge data
      );

      // Konversi data
      const jsonInvestasi = convertSpreadsheetToJSONWithRange(
        dataInvestasi.data, // data spreadsheet
        4, //index mulai data
        4, //index akhir data
        headerInvestasi
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        investasi: jsonInvestasi.data,
        pos_kepegawaian: jsonResultKepegawaian.data,
        pos_pemeliharaan: jsonResultPemeliharaan.data,
        pos_administrasi_umum: jsonResultAdministrasiUmum.data,
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

module.exports = AnggaranController;
