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

const HsseController = {
  getHssePeralatan: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetData(
        dataConfig.hsse.peralatan.folderId, //folder Id
        dataConfig.hsse.peralatan.spreadsheetId, //spreadsheet Id
        "Data Rekap APD " // sheet name
      );

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        4, //index awal data
        headerMapping, //custom header
        ["item"] // field yang di-merge
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

  getHsseJadwalPekerjaanK3: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.hsse.jadwalPekerjaanK3.folderId, //folder Id
        dataConfig.hsse.jadwalPekerjaanK3.spreadsheetId, //spreadsheet Id
        "667158117" // sheet id
      );

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        9, //index awal data
        headerMappingJadwalPekerjaanK3 //custom header
      );

      const filterJsonResult = filterOutSingleValueData(jsonResult.data);

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: filterJsonResult,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to get data",
        error: error.message,
      });
    }
  },

  getHsseKatalogPeralatan: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.hsse.katalogPeralatan.folderId, //folder Id
        dataConfig.hsse.katalogPeralatan.spreadsheetId, //spreadsheet Id
        "426001325" // sheet id
      );

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        4, //index awal data
        headerMappingKatalogPeralatan //custom header
      );

      const filterJsonResult = filterOutSingleValueData(jsonResult.data);

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: filterJsonResult,
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

function filterOutSingleValueData(data) {
  const emptyValues = new Set(["-", "", null, undefined]);

  return data.filter((item) => {
    let validCount = 0;

    // Early exit jika sudah menemukan 2 field valid
    for (const value of Object.values(item)) {
      if (!emptyValues.has(value)) {
        validCount++;
        if (validCount > 1) {
          return true; // Keep this item
        }
      }
    }

    return false; // Remove items with 0 or 1 valid values
  });
}

const headerMapping = [
  { field: "item", column: 0 },
  { field: "apbd", column: 1 },
  { field: "satuan", column: 2 },
  {
    field: "upt_bekasi",
    type: "group",
    fields: {
      standar_kebutuhan: 3,
      jumlah_eksisting: 4,
      selisih: 5,
    },
  },
  {
    field: "ultg_bekasi",
    type: "group",
    fields: {
      standar_kebutuhan: 6,
      jumlah_eksisting: 7,
      selisih: 8,
    },
  },

  {
    field: "ultg_cikarang",
    type: "group",
    fields: {
      standar_kebutuhan: 9,
      jumlah_eksisting: 10,
      selisih: 11,
    },
  },

  {
    field: "gi_poncol_baru",
    type: "group",
    fields: {
      standar_kebutuhan: 12,
      jumlah_eksisting: 13,
      selisih: 14,
    },
  },
  {
    field: "gis_poncol_baru",
    type: "group",
    fields: {
      standar_kebutuhan: 15,
      jumlah_eksisting: 16,
      selisih: 17,
    },
  },
  {
    field: "gi_cikarang",
    type: "group",
    fields: {
      standar_kebutuhan: 18,
      jumlah_eksisting: 19,
      selisih: 20,
    },
  },
  {
    field: "gi_jababeka",
    type: "group",
    fields: {
      standar_kebutuhan: 21,
      jumlah_eksisting: 22,
      selisih: 23,
    },
  },
  {
    field: "gi_rajapaksi",
    type: "group",
    fields: {
      standar_kebutuhan: 24,
      jumlah_eksisting: 25,
      selisih: 26,
    },
  },
  {
    field: "gistet_new_tambun",
    type: "group",
    fields: {
      standar_kebutuhan: 27,
      jumlah_eksisting: 28,
      selisih: 29,
    },
  },
  {
    field: "gitet_muara_tawar",
    type: "group",
    fields: {
      standar_kebutuhan: 30,
      jumlah_eksisting: 31,
      selisih: 32,
    },
  },
  {
    field: "gi_fajar_sw",
    type: "group",
    fields: {
      standar_kebutuhan: 33,
      jumlah_eksisting: 34,
      selisih: 35,
    },
  },
  {
    field: "gi_tambun",
    type: "group",
    fields: {
      standar_kebutuhan: 36,
      jumlah_eksisting: 37,
      selisih: 38,
    },
  },
  {
    field: "gi_toyogiri",
    type: "group",
    fields: {
      standar_kebutuhan: 39,
      jumlah_eksisting: 40,
      selisih: 41,
    },
  },

  {
    field: "gi_gandamekar",
    type: "group",
    fields: {
      standar_kebutuhan: 42,
      jumlah_eksisting: 43,
      selisih: 44,
    },
  },

  {
    field: "gitet_cibatu",
    type: "group",
    fields: {
      standar_kebutuhan: 45,
      jumlah_eksisting: 46,
      selisih: 47,
    },
  },
  {
    field: "gi_cikarang_lippo",
    type: "group",
    fields: {
      standar_kebutuhan: 48,
      jumlah_eksisting: 49,
      selisih: 50,
    },
  },
  {
    field: "gi_hankook",
    type: "group",
    fields: {
      standar_kebutuhan: 51,
      jumlah_eksisting: 52,
      selisih: 53,
    },
  },
  {
    field: "gi_suzuki",
    type: "group",
    fields: {
      standar_kebutuhan: 54,
      jumlah_eksisting: 55,
      selisih: 56,
    },
  },

  {
    field: "gi_tagalherang",
    type: "group",
    fields: {
      standar_kebutuhan: 57,
      jumlah_eksisting: 558,
      selisih: 59,
    },
  },
  {
    field: "gi_mekarsari",
    type: "group",
    fields: {
      standar_kebutuhan: 60,
      jumlah_eksisting: 61,
      selisih: 62,
    },
  },
  {
    field: "gi_juishin",
    type: "group",
    fields: {
      standar_kebutuhan: 63,
      jumlah_eksisting: 64,
      selisih: 65,
    },
  },
  {
    field: "gi_margakarya",
    type: "group",
    fields: {
      standar_kebutuhan: 66,
      jumlah_eksisting: 67,
      selisih: 68,
    },
  },
  {
    field: "gi_panayungan",
    type: "group",
    fields: {
      standar_kebutuhan: 69,
      jumlah_eksisting: 70,
      selisih: 71,
    },
  },

  {
    field: "gi_transheksa",
    type: "group",
    fields: {
      standar_kebutuhan: 72,
      jumlah_eksisting: 73,
      selisih: 74,
    },
  },
  {
    field: "gi_cileungsi_2",
    type: "group",
    fields: {
      standar_kebutuhan: 75,
      jumlah_eksisting: 76,
      selisih: 77,
    },
  },
  {
    field: "total",
    type: "group",
    fields: {
      standar_kebutuhan: 78,
      jumlah_eksisting: 79,
      selisih: 80,
    },
  },
  { field: "presentase_terpenuhi", column: 81 },
];

const headerMappingJadwalPekerjaanK3 = [
  { field: "no", column: 0 },
  { field: "ultg", column: 1 },
  { field: "gardu_induk", column: 2 },
  { field: "bay_lokasi_kerja", column: 3 },
  { field: "tegangan", column: 4 },
  { field: "rencana_mulai_tgl", column: 5 },
  { field: "rencana_mulai_jam", column: 6 },
  { field: "rencana_selesai_tgl", column: 7 },
  { field: "rencana_selesai_jam", column: 8 },
  { field: "uraian_pekerjaan", column: 9 },
  { field: "pelaksana", column: 10 },
  { field: "penanggung_jawab", column: 11 },
  { field: "tim_safety_advisor", column: 12 },
  { field: "keterangan", column: 13 },
];

const headerMappingKatalogPeralatan = [
  { field: "nama_peralatan", column: 1 },
  { field: "standar", column: 2 },
  { field: "model_1_gambar", column: 3 },
  { field: "model_1_spesifikasi", column: 4 },
  { field: "model_1_brand_relevan", column: 5 },
  { field: "model_2_gambar", column: 6 },
  { field: "model_2_spesifikasi", column: 7 },
  { field: "model_2_brand_relevan", column: 8 },
];

module.exports = HsseController;
