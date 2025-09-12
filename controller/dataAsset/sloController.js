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

const SloController = {
  getSlo: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.dataAsset.slo.folderId, //folder Id
        dataConfig.dataAsset.slo.spreadsheetId, //spreadsheet Id
        [0, 2060699296, 884789003] // sheet id
      );

      const headerMappingGi = [
        { field: "ultg", column: 1 },
        { field: "gi", column: 2 },
        { field: "justifikasi", column: 10 },
      ];
      const headerMappingJaringan = [
        { field: "ultg", column: 1 },
        { field: "jaringan", column: 2 },
        { field: "justifikasi", column: 10 },
      ];

      const headerMappingmonitoring = [
        { field: "bay_jaringan", column: 0 },
        { field: "target", column: 1 },
        { field: "realisasi", column: 2 },
        { field: "kelengkapan", column: 3 },
      ];

      // Konversi data
      const jsonResultGi = convertSpreadsheetToJSON(
        data.sheetsData[0].data, // data spreadsheet
        5, //index mulai data
        headerMappingGi // mapping header
      );

      const jsonResultJaringan = convertSpreadsheetToJSON(
        data.sheetsData[2060699296].data, // data spreadsheet
        5, //index mulai data
        headerMappingJaringan // mapping header
      );

      const jsonMappingMonitoring = convertSpreadsheetToJSONWithRange(
        data.sheetsData[884789003].data, // data spreadsheet
        5, //index mulai data
        11, //index akhir data
        headerMappingmonitoring // mapping header
      );

      const filterDataGi = jsonResultGi.data.filter(
        (item) => item.justifikasi != "-"
      );

      const filterDataJaringan = jsonResultJaringan.data.filter(
        (item) => item.justifikasi != "-"
      );
      const gabunganData = [...filterDataGi, ...filterDataJaringan];

      //start
      const reSloTahunDepan = gabunganData.filter((d) =>
        d.justifikasi.toLowerCase().includes("habis masa berlaku tahun depan")
      );
      const reSloTahunDepanGrup = groupCount(reSloTahunDepan, "ultg");
      //stop

      //start
      const reSloTahunIni = gabunganData.filter((d) =>
        d.justifikasi.toLowerCase().includes("re-slo")
      );
      const reSloTahunIniGrup = groupCount(reSloTahunIni, "ultg");
      //stop

      //start
      const sloBaru = gabunganData.filter((d) =>
        d.justifikasi.toLowerCase().includes("slo baru")
      );
      const sloBaruGrup = groupCount(sloBaru, "ultg");
      //stop

      //start
      const sloGi = Object.entries(
        filterDataGi.reduce((acc, curr) => {
          if (!acc[curr.ultg]) {
            acc[curr.ultg] = {}; // setiap ultg punya sub-group
          }

          const key = curr.justifikasi; // grouping per justifikasi di dalam ultg
          if (!acc[curr.ultg][key]) {
            acc[curr.ultg][key] = { ...curr, jumlah: 0 };
          }
          acc[curr.ultg][key].jumlah += 1;

          return acc;
        }, {})
      ).map(([ultg, justifikasiObj]) => ({
        ultg,
        data: Object.values(justifikasiObj),
      }));
      //stop

      //start
      const sloJaringan = Object.entries(
        filterDataJaringan.reduce((acc, curr) => {
          if (!acc[curr.ultg]) {
            acc[curr.ultg] = {}; // setiap ultg punya sub-group
          }

          const key = curr.justifikasi; // grouping per justifikasi di dalam ultg
          if (!acc[curr.ultg][key]) {
            acc[curr.ultg][key] = { ...curr, jumlah: 0 };
          }
          acc[curr.ultg][key].jumlah += 1;

          return acc;
        }, {})
      ).map(([ultg, justifikasiObj]) => ({
        ultg,
        data: Object.values(justifikasiObj),
      }));
      //stop

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        re_slo_tahun_depan: reSloTahunDepanGrup,
        re_slo_tahun_ini: reSloTahunIniGrup,
        slo_baru: sloBaruGrup,
        slo_gi: sloGi,
        slo_jaringan: sloJaringan,
        kelengkapan_data_slo: jsonMappingMonitoring.data,
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

function groupCount(arr, field) {
  const result = {};
  arr.forEach((item) => {
    const key = item[field];
    if (!result[key]) result[key] = 0;
    result[key] += 1;
  });

  return Object.entries(result).map(([key, total]) => ({
    [field]: key,
    total,
  }));
}

// fungsi untuk bikin label range
function getRangeLabel(masaKerja) {
  const start = Math.floor((masaKerja - 1) / 5) * 5 + 1; // hitung awal range
  const end = start + 4;

  // khusus untuk 0–5
  if (masaKerja <= 5) return "0-5 tahun";

  return `${start}-${end} tahun`;
}

// fungsi grouping berdasarkan range
function groupByMasaKerja(arr) {
  const result = {};
  arr.forEach((item) => {
    const range = getRangeLabel(item.masa_kerja);
    if (!result[range]) result[range] = 0;
    result[range] += 1;
  });

  return Object.entries(result).map(([range, total]) => ({
    range,
    total,
  }));
}

function validateMapping(data, indexStartData, mapping) {
  const maxColumn = Math.max(...(data[indexStartData]?.map((_, i) => i) || []));
  const errors = [];
  const warnings = [];

  mapping.forEach((map, index) => {
    if (map.type === "group") {
      Object.entries(map.fields).forEach(([subField, column]) => {
        if (column > maxColumn) {
          warnings.push(
            `Mapping ${index}: Group '${map.field}' subfield '${subField}' column ${column} exceeds data range (max: ${maxColumn}) - will use '-'`
          );
        }
        if (column < 0) {
          errors.push(
            `Mapping ${index}: Group '${map.field}' subfield '${subField}' has invalid column index ${column}`
          );
        }
      });
    } else {
      if (map.column > maxColumn) {
        warnings.push(
          `Mapping ${index}: Field '${map.field}' column ${map.column} exceeds data range (max: ${maxColumn}) - will use '-'`
        );
      }
      if (map.column < 0) {
        errors.push(
          `Mapping ${index}: Field '${map.field}' has invalid column index ${map.column}`
        );
      }
    }
  });

  return { errors, warnings };
}

module.exports = SloController;
