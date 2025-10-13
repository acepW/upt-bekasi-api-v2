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

const dataAsset = {
  getDataAsset: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.dataAsset.dataAsset.folderId, //folder Id
        dataConfig.dataAsset.dataAsset.spreadsheetId, //spreadsheet Id
        [529526095] // sheet name
      );

      const headerMappingUpt = [
        { field: "point", column: 2 },
        { field: "isi", column: 5 },
        { field: "mva", column: 6 },
      ];

      const headerMappingUltgBekasi = [
        { field: "point", column: 8 },
        { field: "isi", column: 11 },
        { field: "mva", column: 12 },
      ];

      const headerMappingUltgCikarang = [
        { field: "point", column: 14 },
        { field: "isi", column: 16 },
        { field: "mva", column: 17 },
      ];

      const headerMappingAsetTidakOperasi = [
        { field: "point", column: 19 },
        { field: "isi", column: 20 },
      ];

      const headerMappingTotalAset = [{ field: "isi", column: 22 }];

      // Konversi data
      const jsonResultUpt = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        13, //index mulai data
        headerMappingUpt //mapping header
      );

      // Konversi data
      const jsonResultUltgBekasi = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        13, //index mulai data
        headerMappingUltgBekasi //mapping header
      );

      // Konversi data
      const jsonResultUltgCikarang = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        13, //index mulai data
        headerMappingUltgCikarang //mapping header
      );

      // Konversi data
      const jsonResultAssetTidakOperasi = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        14, //index mulai data
        headerMappingAsetTidakOperasi //mapping header
      );

      // Konversi data
      const jsonResultTotalAsset = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        12, //index mulai data
        headerMappingTotalAset //mapping header
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: {
          upt: {
            jumlah_gitet: jsonResultUpt.data[0].isi,
            jumlah_gi: jsonResultUpt.data[1].isi,
            level_tegangan_gi_gitet: {
              "500_kv": jsonResultUpt.data[3].isi,
              "150_kv": jsonResultUpt.data[4].isi,
            },
            level_tegangan_gi_gitset: {
              "500_kv": jsonResultUpt.data[6].isi,
              "150_kv": jsonResultUpt.data[7].isi,
            },
            jumlah_sk: jsonResultUpt.data[8].isi,
            jumlah_transformer: jsonResultUpt.data[9].isi,
            yotal_unit: jsonResultUpt.data[10].isi,
            total_kapasitas: jsonResultUpt.data[11].isi,
            level_tegangan: {
              "500_150_kv": {
                jumlah: jsonResultUpt.data[13].isi,
                mva: jsonResultUpt.data[13].mva,
              },
              "150_20_kv": {
                jumlah: jsonResultUpt.data[14].isi,
                mva: jsonResultUpt.data[14].mva,
              },
            },
            jumlah_tower: jsonResultUpt.data[15].isi,
            total_kms_transmisu: jsonResultUpt.data[16].isi,
            level_tegangan_tower: {
              "500_kv": {
                jumlah: jsonResultUpt.data[18].isi,
                mva: jsonResultUpt.data[18].mva,
              },
              "150_kv": {
                jumlah: jsonResultUpt.data[19].isi,
                mva: jsonResultUpt.data[19].mva,
              },
            },
          },

          ultg_bekasi: {
            jumlah_gitet: jsonResultUltgBekasi.data[0].isi,
            jumlah_gi: jsonResultUltgBekasi.data[1].isi,
            level_tegangan_gi_gitet: {
              "500_kv": jsonResultUltgBekasi.data[3].isi,
              "150_kv": jsonResultUltgBekasi.data[4].isi,
            },
            level_tegangan_gi_gitset: {
              "500_kv": jsonResultUltgBekasi.data[6].isi,
              "150_kv": jsonResultUltgBekasi.data[7].isi,
            },
            jumlah_sk: jsonResultUltgBekasi.data[8].isi,
            jumlah_transformer: jsonResultUltgBekasi.data[9].isi,
            yotal_unit: jsonResultUltgBekasi.data[10].isi,
            total_kapasitas: jsonResultUltgBekasi.data[11].isi,
            level_tegangan: {
              "500_150_kv": {
                jumlah: jsonResultUltgBekasi.data[13].isi,
                mva: jsonResultUltgBekasi.data[13].mva,
              },
              "150_20_kv": {
                jumlah: jsonResultUltgBekasi.data[14].isi,
                mva: jsonResultUltgBekasi.data[14].mva,
              },
            },
            jumlah_tower: jsonResultUltgBekasi.data[15].isi,
            total_kms_transmisu: jsonResultUltgBekasi.data[16].isi,
            level_tegangan_tower: {
              "500_kv": {
                jumlah: jsonResultUltgBekasi.data[18].isi,
                mva: jsonResultUltgBekasi.data[18].mva,
              },
              "150_kv": {
                jumlah: jsonResultUltgBekasi.data[19].isi,
                mva: jsonResultUltgBekasi.data[19].mva,
              },
            },
          },

          ultg_cikarang: {
            jumlah_gitet: jsonResultUltgCikarang.data[0].isi,
            jumlah_gi: jsonResultUltgCikarang.data[1].isi,
            level_tegangan_gi_gitet: {
              "500_kv": jsonResultUltgCikarang.data[3].isi,
              "150_kv": jsonResultUltgCikarang.data[4].isi,
            },
            level_tegangan_gi_gitset: {
              "500_kv": jsonResultUltgCikarang.data[6].isi,
              "150_kv": jsonResultUltgCikarang.data[7].isi,
            },
            jumlah_sk: jsonResultUltgCikarang.data[8].isi,
            jumlah_transformer: jsonResultUltgCikarang.data[9].isi,
            yotal_unit: jsonResultUltgCikarang.data[10].isi,
            total_kapasitas: jsonResultUltgCikarang.data[11].isi,
            level_tegangan: {
              "500_150_kv": {
                jumlah: jsonResultUltgCikarang.data[13].isi,
                mva: jsonResultUltgCikarang.data[13].mva,
              },
              "150_20_kv": {
                jumlah: jsonResultUltgCikarang.data[14].isi,
                mva: jsonResultUltgCikarang.data[14].mva,
              },
            },
            jumlah_tower: jsonResultUltgCikarang.data[15].isi,
            total_kms_transmisu: jsonResultUltgCikarang.data[16].isi,
            level_tegangan_tower: {
              "500_kv": {
                jumlah: jsonResultUltgCikarang.data[18].isi,
                mva: jsonResultUltgCikarang.data[18].mva,
              },
              "150_kv": {
                jumlah: jsonResultUltgCikarang.data[19].isi,
                mva: jsonResultUltgCikarang.data[19].mva,
              },
            },
          },
          aset_tidak_operasi: {
            gi_gitet: {
              "500_kv": jsonResultAssetTidakOperasi.data[1].isi,
              "150_kv": jsonResultAssetTidakOperasi.data[2].isi,
              "70_kv": jsonResultAssetTidakOperasi.data[3].isi,
            },
            trafo: {
              "500_150_kv": jsonResultAssetTidakOperasi.data[7].isi,
              "150_20_kv": jsonResultAssetTidakOperasi.data[8].isi,
              "150_70_kv": jsonResultAssetTidakOperasi.data[9].isi,
            },
            tower: {
              "500_kv": jsonResultAssetTidakOperasi.data[12].isi,
              "150_kv": jsonResultAssetTidakOperasi.data[13].isi,
              "70_kv": jsonResultAssetTidakOperasi.data[14].isi,
            },
          },
          total_aset: {
            title: jsonResultTotalAsset.data[0].isi,
            jumlah: jsonResultUpt.data[20].isi,
          },
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

module.exports = dataAsset;
