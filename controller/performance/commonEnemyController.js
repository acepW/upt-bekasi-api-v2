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

      const headerMappingGiHostpotMtu = [
        { field: "upt", column: 3 },
        { field: "ultg", column: 5 },
        { field: "gi", column: 6 },
        { field: "penghantar", column: 7 },
        { field: "lokasi", column: 8 },
        { field: "alat", column: 9 },
        { field: "role", column: 12 },
        { field: "tgl", column: 13 },
        { field: "komponen", column: 14 },
        { field: "status", column: 23 },
      ];

      const headerMappingGiTekanGas = [
        { field: "upt", column: 3 },
        { field: "ultg", column: 5 },
        { field: "gi", column: 6 },
        { field: "penghantar", column: 7 },
        { field: "lokasi", column: 8 },
        { field: "alat", column: 9 },
        { field: "role", column: 12 },
        { field: "tgl", column: 13 },
        { field: "komponen", column: 14 },
        { field: "status", column: 23 },
      ];

      const headerMappingGiRembesan = [
        { field: "upt", column: 3 },
        { field: "ultg", column: 5 },
        { field: "gi", column: 6 },
        { field: "penghantar", column: 7 },
        { field: "lokasi", column: 9 },
        { field: "alat", column: 99 },
        { field: "role", column: 12 },
        { field: "tgl", column: 13 },
        { field: "komponen", column: 14 },
        { field: "status", column: 23 },
      ];
      const headerMappingProAlarmRelai = [
        { field: "upt", column: 4 },
        { field: "ultg", column: 5 },
        { field: "gi", column: 6 },
        { field: "bay", column: 7 },
        { field: "alat", column: 8 },
        { field: "tgl", column: 9 },
        { field: "kategori_anomali", column: 10 },
        { field: "anomali", column: 11 },
        { field: "status", column: 16 },
      ];
      const headerMappingProHotspotSekunder = [
        { field: "upt", column: 3 },
        { field: "ultg", column: 4 },
        { field: "gi", column: 5 },
        { field: "bay", column: 6 },
        { field: "alat", column: 7 },
        { field: "tgl", column: 8 },
        { field: "anomali", column: 9 },
        { field: "status", column: 14 },
      ];
      const headerMappingProannuniciator = [
        { field: "upt", column: 4 },
        { field: "ultg", column: 5 },
        { field: "gi", column: 6 },
        { field: "bay", column: 7 },
        // { field: "alat", column: 8 },
        // { field: "tgl", column: 9 },
        { field: "anomali", column: 10 },
        { field: "status", column: 15 },
      ];

      const headerMappingJarPentanahan = [
        { field: "lokasi", column: 2 },
        { field: "tgl", column: 3 },
        { field: "upt", column: 4 },
        { field: "ultg", column: 5 },
        { field: "alat", column: 6 },
        { field: "status", column: 23 },
      ];

      const headerMappingJarThermovisi = [
        { field: "upt", column: 2 },
        { field: "ultg", column: 3 },
        { field: "gardu", column: 4 },
        { field: "pengantar", column: 5 },
        { field: "lokasi", column: 6 },
        { field: "pst", column: 7 },
        { field: "alat", column: 8 },
        { field: "tgl", column: 9 },
        { field: "status", column: 23 },
      ];

      const headerMappingJarTegakanTinjut = [
        { field: "tgl_inspeksi", column: 1 },
        { field: "upt", column: 2 },
        { field: "ultg", column: 3 },
        { field: "gi", column: 4 },
        { field: "bay", column: 5 },
        { field: "tower", column: 6 },
        { field: "jumlah", column: 7 },
        { field: "id_pohon", column: 8 },
        { field: "status", column: 13 },
      ];

      // Konversi data
      const jsonResultHotspot = convertSpreadsheetToJSON(
        data.sheetsData[1126382818].data, // data spreadsheet
        1, //index mulai data
        headerMappingGiHostpotMtu
      );

      // Konversi data
      const jsonResultTekananGas = convertSpreadsheetToJSON(
        data.sheetsData[2000372598].data, // data spreadsheet
        1, //index mulai data
        headerMappingGiTekanGas
      );

      // Konversi data
      const jsonResultRembesan = convertSpreadsheetToJSON(
        data.sheetsData[639339136].data, // data spreadsheet
        1, //index mulai data
        headerMappingGiRembesan
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

      const filterHotspot = (() => {
        const filtered = jsonResultHotspot.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

      const filterTekananGas = (() => {
        const filtered = jsonResultTekananGas.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

      const filterRembesan = (() => {
        const filtered = jsonResultRembesan.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

      const filterProAlarmRelai = (() => {
        const filtered = jsonResultProAlarmRelai.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

      const filterProHotspotSekunder = (() => {
        const filtered = jsonResultProHotspotSekunder.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

      const filterProAnnunciator = (() => {
        const filtered = jsonResultProAnnunciator.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

      const filterJarPentanahan = (() => {
        const filtered = jsonResultJarPentanahan.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

      const filterJarThermovisi = (() => {
        const filtered = jsonResultJarThermovisi.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

      const filterJarTegakanTinjut = (() => {
        const filtered = jsonResultJarTegakanTinjut.data.filter(
          (item) => item.upt === "UPT BEKASI"
        );
        const grouped = filtered.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { OPEN: 0, CLOSE: 0 }
        );
        return { status: grouped, data: filtered };
      })();

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
