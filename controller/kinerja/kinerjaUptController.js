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
        { field: "persentase", column: 7 },
        { field: "nilai", column: 8 },
      ];

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, // data spreadsheet
        7, //index mulai data
        headerMapping, //header mapping,
        ["nilai"] // merge field
      );

      const DataTLOd = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("tlod")
      );

      const DataTROD = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("trod")
      );

      const DataTLOF = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("tlof")
      );

      const DataTROF = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("trof")
      );

      const DataEmergencyRespon = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("emergency response time")
      );

      const DataVerifikasiKKP = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("verifikasi kkp")
      );

      const DataPenyelesaianReconductoring = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("penyelesaian reconductoring")
      );

      const DataPengendalianProteksiSecurity = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator
            .toLowerCase()
            .includes("pengendalian proteksi security")
      );

      const DataABOF = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("abof")
      );

      const DataFaktorKetersediaanTrafo = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator
            .toLowerCase()
            .includes("transformator avaliability factor = traf")
      );

      const DataFaktorKetersediaanTransmisi = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("ccaf")
      );

      const DataPengendalianPenggunaanAnggaran = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator
            .toLowerCase()
            .includes("pengendalian penggunaan anggaran")
      );

      const DataAntiBlackout = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("anti blackout")
      );

      const DataATTB = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("attb")
      );
      const DataAsetTanah = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("aset tanah")
      );

      const DataDigitalisasi = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("digitalisasi aplikasi")
      );

      const DataHcrOcr = jsonResult.data.find(
        (item) => item.indikator && item.indikator.toLowerCase().includes("hcr")
      );

      const DataProduktifitasUnit = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("produktivitas unit")
      );

      const DataTJSL = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator
            .toLowerCase()
            .includes("pengelolaan komunikasi dan tjsl")
      );

      const DataBisnisEkselen = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("bisnis ekselen")
      );

      const DataMaturityLevelSustainability = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("maturity level sustainability")
      );

      const DataMaturityLevelTransmisi = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator
            .toLowerCase()
            .includes("maturity level pergudangan transmisi")
      );

      const DataRoadmapPerbaikan = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("roadmap perbaikan")
      );

      const DataTotalNilai = jsonResult.data.find(
        (item) =>
          item.indikator && item.indikator.toLowerCase().includes("total")
      );

      const DataKeyPerformanceIndicators = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase().includes("key performance indicators")
      );

      const DataPerformanceIndicators = jsonResult.data.find(
        (item) =>
          item.indikator &&
          item.indikator.toLowerCase() == "performance indicators"
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: {
          total_nilai: DataTotalNilai || null,
          key_performance_indicators: DataKeyPerformanceIndicators || null,
          performance_indicators: DataPerformanceIndicators || null,
          key_performance: {
            tlod: DataTLOd || null,
            trod: DataTROD || null,
            tlof: DataTLOF || null,
            trof: DataTROF || null,
            emergency_respon_time: DataEmergencyRespon || null,
            verifikasi_kkp: DataVerifikasiKKP || null,
            penyelesaian_reconductoring: DataPenyelesaianReconductoring || null,
          },
          performance_indicator: {
            pengendalian_proteksi_security:
              DataPengendalianProteksiSecurity || null,
            abof: DataABOF || null,
            faktor_ketersediaan_trafo: DataFaktorKetersediaanTrafo || null,
            faktor_ketersediaan_transmisi:
              DataFaktorKetersediaanTransmisi || null,
            pengendalian_penggunaan_anggaran:
              DataPengendalianPenggunaanAnggaran || null,
            anti_blackout: DataAntiBlackout || null,
            usulan_penghapusan_atb: DataATTB || null,
            dokumen_legal_aset_tanah: DataAsetTanah || null,
            digitalisasi_aplikasi: DataDigitalisasi || null,
            hcr_ocr: DataHcrOcr || null,
            produktifitas_unit: DataProduktifitasUnit || null,
            komunikasi_tjsl: DataTJSL || null,
            bisnis_ekselen: DataBisnisEkselen || null,
            maturity_level_sustainability:
              DataMaturityLevelSustainability || null,
            maturity_level_transmisi: DataMaturityLevelTransmisi || null,
            roadmap_pergudangan: DataRoadmapPerbaikan || null,
          },
        },
        tes: jsonResult.data,
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
