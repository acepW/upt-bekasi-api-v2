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

const CommonEnemyController = {
  getCommonEnemy: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.performance.commonEnemy.folderId, //folder Id
        dataConfig.performance.commonEnemy.spreadsheetId, //spreadsheet Id
        [
          1126382818, 2000372598, 639339136, 1779772777, 761341867, 2101738356,
          589942551, 91629233, 1300836810,
        ] // sheet id
        //gi hotspot mut, gi tekanan gas,gi rembesan, pro alarm relai, pro hotspot sekunder, annunciator, jar pentanahan, jar thermovisi, jar tegakan tinjut upt (tegakan pohon kritis kalau di rekapnya)
      );

      const headerMappingGi = [
        { field: "upt", column: 3 },
        { field: "status", column: 23 },
      ];
      const headerMappingProAlarmRelai = [
        { field: "upt", column: 4 },
        { field: "status", column: 16 },
      ];
      const headerMappingProHotspotSekunder = [
        { field: "upt", column: 3 },
        { field: "status", column: 14 },
      ];
      const headerMappingProannuniciator = [
        { field: "upt", column: 4 },
        { field: "status", column: 15 },
      ];

      const headerMappingJarPentanahan = [
        { field: "upt", column: 4 },
        { field: "status", column: 23 },
      ];

      const headerMappingJarThermovisi = [
        { field: "upt", column: 2 },
        { field: "status", column: 23 },
      ];

      const headerMappingJarTegakanTinjut = [
        { field: "upt", column: 2 },
        { field: "status", column: 13 },
      ];

      // Konversi data
      const jsonResultHotspot = convertSpreadsheetToJSON(
        data.sheetsData[1126382818].data, // data spreadsheet
        1, //index mulai data
        headerMappingGi
      );

      // Konversi data
      const jsonResultTekananGas = convertSpreadsheetToJSON(
        data.sheetsData[2000372598].data, // data spreadsheet
        1, //index mulai data
        headerMappingGi
      );

      // Konversi data
      const jsonResultRembesan = convertSpreadsheetToJSON(
        data.sheetsData[639339136].data, // data spreadsheet
        1, //index mulai data
        headerMappingGi
      );

      // Konversi data
      const jsonResultProAlarmRelai = convertSpreadsheetToJSON(
        data.sheetsData[1779772777].data, // data spreadsheet
        1, //index mulai data
        headerMappingProAlarmRelai
      );

      // Konversi data
      const jsonResultProHotspotSekunder = convertSpreadsheetToJSON(
        data.sheetsData[761341867].data, // data spreadsheet
        1, //index mulai data
        headerMappingProHotspotSekunder
      );

      // Konversi data
      const jsonResultProAnnunciator = convertSpreadsheetToJSON(
        data.sheetsData[2101738356].data, // data spreadsheet
        1, //index mulai data
        headerMappingProannuniciator
      );

      // Konversi data
      const jsonResultJarPentanahan = convertSpreadsheetToJSON(
        data.sheetsData[589942551].data, // data spreadsheet
        2, //index mulai data
        headerMappingJarPentanahan
      );

      // Konversi data
      const jsonResultJarThermovisi = convertSpreadsheetToJSON(
        data.sheetsData[91629233].data, // data spreadsheet
        3, //index mulai data
        headerMappingJarThermovisi
      );

      // Konversi data
      const jsonResultJarTegakanTinjut = convertSpreadsheetToJSON(
        data.sheetsData[1300836810].data, // data spreadsheet
        1, //index mulai data
        headerMappingJarTegakanTinjut
      );

      const filterHotspot = jsonResultHotspot.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      const filterTekananGas = jsonResultTekananGas.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      const filterRembesan = jsonResultRembesan.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      const filterProAlarmRelai = jsonResultProAlarmRelai.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      const filterProHotspotSekunder = jsonResultProHotspotSekunder.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      const filterProAnnunciator = jsonResultProAnnunciator.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      const filterJarPentanahan = jsonResultJarPentanahan.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      const filterJarThermovisi = jsonResultJarThermovisi.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      const filterJarTegakanTinjut = jsonResultJarTegakanTinjut.data
        .filter((item) => item.upt === "UPT BEKASI")
        .reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data_gi: {
          hotspot: filterHotspot,
          tekanan_gas: filterTekananGas,
          rembesan: filterRembesan,
        },
        data_proteksi: {
          alarm_relai: filterProAlarmRelai,
          hotspot_sekunder: filterProHotspotSekunder,
          annunciator: filterProAnnunciator,
        },
        data_jaringan: {
          pentanahan: filterJarPentanahan,
          thermovisi: filterJarThermovisi,
          tegakan_tinjut: filterJarTegakanTinjut,
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

module.exports = CommonEnemyController;
