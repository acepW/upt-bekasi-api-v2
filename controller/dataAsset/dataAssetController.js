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
        [925559602] // sheet name
      );

      //untuk 99 belum ada datanya
      const headerMapping = [
        { field: "upt", column: 1 },
        { field: "ultg", column: 2 },
        {
          field: "gi_gitet",
          type: "group",
          fields: {
            "70_kv": 45,
            "150_kv": 46,
            "500_kv": 47,
          },
        },
        {
          field: "gis_gistet",
          type: "group",
          fields: {
            "70_kv": 49,
            "150_kv": 50,
            "500_kv": 51,
          },
        },
        {
          field: "jumlah_tower",
          type: "group",
          fields: {
            "500_kv": 32,
            "150_kv": 34,
            "70_kv": 36,
          },
        },
        {
          field: "trafo_500_150_kv",
          type: "group",
          fields: {
            jumlah: 3,
            mva: 5,
          },
        },
        {
          field: "trafo_150_70_kv",
          type: "group",
          fields: {
            jumlah: 6,
            mva: 7,

            "150_20_kv": {
              jumlah: 8,
              mva: 9,
            },
          },
        },

        {
          field: "trafo_150_20_kv",
          type: "group",
          fields: {
            jumlah: 8,
            mva: 9,
          },
        },

        {
          field: "kms_500_kv",
          type: "group",
          fields: {
            su: 22,
            sk: 23,
          },
        },
        {
          field: "kms_150_kv",
          type: "group",
          fields: {
            su: 24,
            sk: 25,
          },
        },
        {
          field: "kms_70_kv",
          type: "group",
          fields: {
            su: 26,
            sk: 27,
          },
        },
        { field: "joint_sk", column: 43 },
      ];

      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        7, //index mulai data
        headerMapping, //mapping header
        ["upt"] // merged field
      );

      const flterResult = jsonResult.data.filter(
        (item) => item.upt == "BEKASI"
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        data: flterResult,
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
