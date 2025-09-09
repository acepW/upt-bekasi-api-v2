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

      const headerMapping = [
        { field: "no_kontrak", column: 1 },
        { field: "nama_kontrak", column: 3 },
        { field: "tgl_kontrak", column: 10 },
        { field: "akhir_kontrak", column: 99 }, // 99 untuk kolom yang tidak ada di spreadsheet
        { field: "fisik", column: 17 },
        { field: "bayar", column: 18 },
        { field: "status", column: 99 }, // 99 untuk kolom yang tidak ada di spreadsheet
      ];

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
      const dataGudang = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.monitoring.konstruksi.logistik.monitoringGudang.folderId, //folder Id
        dataConfig.monitoring.konstruksi.logistik.monitoringGudang
          .spreadsheetId, //spreadsheet Id
        [0, 671767085, 1446476439, 1125139855] // sheet id
        //kapasitas gudang , limbah non b3
      );

      // Konversi data
      const jsonResultNonSap = convertSpreadsheetToJSON(
        dataGudang.sheetsData[0].data, //data spreadsheet
        11, //index awal data
        headerMappingNonSap //custom header
      );

      // Konversi data
      const jsonResultSisaPekerjaan = convertSpreadsheetToJSON(
        dataGudang.sheetsData[671767085].data, //data spreadsheet
        11, //index awal data
        headerMappingSisaPekerjaan //custom header
      );

      // Konversi data
      const jsonResultMaterialBongkaran = convertSpreadsheetToJSON(
        dataGudang.sheetsData[1446476439].data, //data spreadsheet
        3, //index awal data
        headerMappingMaterialBongkaran //custom header
      );

      // Konversi data
      const jsonResultNonB3 = convertSpreadsheetToJSON(
        dataGudang.sheetsData[1125139855].data, //data spreadsheet
        11, //index awal data
        headerMappingNonB3 //custom header
      );

      const filterNonB3 = jsonResultNonB3.data.filter(
        (item) => item.nama_material !== "-"
      );

      // // Konversi data
      // const jsonResultGudang = convertSpreadsheetToJSON(
      //   dataGudang.sheetsData[1618970871].data, //data spreadsheet
      //   9, //index awal data
      //   headerMappingGudang //custom header
      // );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        persediaan: {
          non_sap: jsonResultNonSap.data.length,
          sisa_pekerjaan: jsonResultSisaPekerjaan.data.length,
          material_bongkaran: jsonResultMaterialBongkaran.data.length,
          non_b3: filterNonB3.length,
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

const headerMappingNonSap = [
  { field: "deskripsi_material", column: 2 },
  { field: "satuan", column: 5 },
  { field: "lokasi_gudang", column: 6 },
];
const headerMappingSisaPekerjaan = [
  { field: "deskripsi_material", column: 2 },
  { field: "satuan", column: 5 },
  { field: "lokasi_gudang", column: 6 },
];
const headerMappingMaterialBongkaran = [
  { field: "nama_material", column: 1 },
  { field: "tegangan", column: 3 },
  { field: "lokasi_penempatan_material", column: 15 },
];

const headerMappingNonB3 = [
  { field: "nama_material", column: 1 },
  { field: "jumlah", column: 2 },
  { field: "gudang", column: 4 },
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
