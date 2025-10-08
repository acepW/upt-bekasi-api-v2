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

const KinerjaUltgController = {
  getKinerjaultg: async (req, res) => {
    try {
      const dataUltgBekasi =
        await SpreadsheetsFunction.getSpecificSheetDataById(
          dataConfig.kinerja.ultg_bekasi.folderId, //folder Id
          dataConfig.kinerja.ultg_bekasi.spreadsheetId, //spreadsheet Id
          "898340897" // sheet id
        );

      const dataUltgCikarang =
        await SpreadsheetsFunction.getSpecificSheetDataById(
          dataConfig.kinerja.ultg_cikarang.folderId, //folder Id
          dataConfig.kinerja.ultg_cikarang.spreadsheetId, //spreadsheet Id
          "988631378" // sheet id
        );

      const headerMapping = [
        { field: "indikator", column: 1 },
        { field: "bobot", column: 4 },
        { field: "target", column: 5 },
        { field: "realisasi", column: 6 },
        { field: "persentase", column: 7 },
        { field: "nilai", column: 8 },
      ];

      // Konversi data
      const jsonResultUltgBekasi = convertSpreadsheetToJSON(
        dataUltgBekasi.data, // data spreadsheet
        7, //index mulai data
        headerMapping, //header mapping,
        ["nilai"] // merge field
      );

      // Konversi data
      const jsonResultUltgCikarang = convertSpreadsheetToJSON(
        dataUltgCikarang.data, // data spreadsheet
        7, //index mulai data
        headerMapping, //header mapping,
        ["nilai"] // merge field
      );

      const DataUltgBekasi = await getProsesKinerja(jsonResultUltgBekasi.data);
      const DataUltgCikarang = await getProsesKinerja(
        jsonResultUltgCikarang.data
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: {
          ultg_bekasi: DataUltgBekasi,
          ultg_cikarang: DataUltgCikarang,
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

async function getProsesKinerja(data) {
  try {
    const DataTLOd = data.find(
      (item) => item.indikator && item.indikator.toLowerCase().includes("tlod")
    );

    const DataTROD = data.find(
      (item) => item.indikator && item.indikator.toLowerCase().includes("trod")
    );

    const DataTLOF = data.find(
      (item) => item.indikator && item.indikator.toLowerCase().includes("tlof")
    );

    const DataTROF = data.find(
      (item) => item.indikator && item.indikator.toLowerCase().includes("trof")
    );

    const DataEmergencyRespon = data.find(
      (item) =>
        item.indikator &&
        item.indikator.toLowerCase().includes("emergency response time")
    );

    const DataPenyelesaianReconductoring = data.find(
      (item) =>
        item.indikator &&
        item.indikator.toLowerCase().includes("penyelesaian reconductoring")
    );

    const DataPengendalianProteksiSecurity = data.find(
      (item) =>
        item.indikator &&
        item.indikator.toLowerCase().includes("pengendalian proteksi security")
    );

    const DataABOF = data.find(
      (item) => item.indikator && item.indikator.toLowerCase().includes("abof")
    );

    const DataFaktorKetersediaanTrafo = data.find(
      (item) =>
        item.indikator &&
        item.indikator
          .toLowerCase()
          .includes("transformator avaliability factor = traf")
    );

    const DataFaktorKetersediaanTransmisi = data.find(
      (item) => item.indikator && item.indikator.toLowerCase().includes("ccaf")
    );

    const DataAntiBlackout = data.find(
      (item) =>
        item.indikator && item.indikator.toLowerCase().includes("anti blackout")
    );

    const DataATTB = data.find(
      (item) => item.indikator && item.indikator.toLowerCase().includes("attb")
    );
    const DataAsetTanah = data.find(
      (item) =>
        item.indikator && item.indikator.toLowerCase().includes("aset tanah")
    );

    const DataDigitalisasi = data.find(
      (item) =>
        item.indikator &&
        item.indikator.toLowerCase().includes("digitalisasi aplikasi")
    );

    const DataPendukungManajemenSDM = data.find(
      (item) =>
        item.indikator &&
        item.indikator.toLowerCase().includes("pendukung manajemen sdm")
    );

    const DataTotalNilai = data.find(
      (item) => item.indikator && item.indikator.toLowerCase().includes("total")
    );

    const DataKeyPerformanceIndicators = data.find(
      (item) =>
        item.indikator &&
        item.indikator.toLowerCase().includes("key performance indicators")
    );

    const DataPerformanceIndicators = data.find(
      (item) =>
        item.indikator &&
        item.indikator.toLowerCase() == "performance indicators"
    );

    return {
      total_nilai: DataTotalNilai || null,
      key_performance_indicators: DataKeyPerformanceIndicators || null,
      performance_indicators: DataPerformanceIndicators || null,
      key_performance: {
        tlod: DataTLOd || null,
        trod: DataTROD || null,
        tlof: DataTLOF || null,
        trof: DataTROF || null,
        emergency_respon_time: DataEmergencyRespon || null,
        penyelesaian_reconductoring: DataPenyelesaianReconductoring || null,
      },
      performance_indicator: {
        pengendalian_proteksi_security:
          DataPengendalianProteksiSecurity || null,
        abof: DataABOF || null,
        faktor_ketersediaan_trafo: DataFaktorKetersediaanTrafo || null,
        faktor_ketersediaan_transmisi: DataFaktorKetersediaanTransmisi || null,
        anti_blackout: DataAntiBlackout || null,
        usulan_penghapusan_atb: DataATTB || null,
        dokumen_legal_aset_tanah: DataAsetTanah || null,
        digitalisasi_aplikasi: DataDigitalisasi || null,
        pendukung_manajemen_sdm: DataPendukungManajemenSDM || null,
      },
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

module.exports = KinerjaUltgController;
