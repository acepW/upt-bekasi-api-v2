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

const RekapAnomaliController = {
  getRekapAnomali: async (req, res) => {
    try {
      const [dataAnomaliGi, dataAnomaliJaringan, dataAnomaliProteksi] =
        await Promise.all([
          SpreadsheetsFunction.getSpecificSheetDataById(
            dataConfig.performance.anomaliGi.folderId, //folder Id
            dataConfig.performance.anomaliGi.spreadsheetId, //spreadsheet Id
            [1935746080, 954331737, 1216187522, 1479867489, 1303146936] // sheet id
            //rembesan , kebocoran sf6, thermovisi, rembesan uit, kebocoran gas sf6 uit
          ),
          SpreadsheetsFunction.getSpecificSheetDataById(
            dataConfig.performance.anomaliJaringan.folderId, //folder Id
            dataConfig.performance.anomaliJaringan.spreadsheetId, //spreadsheet Id
            [
              66209448, 790898612, 91417407, 1819316177, 1205103023, 1101962821,
              874629827,
            ] // sheet id
            //grounding,isolator,gsw,pondasi,bracing,jointing,konduktor acc,
          ),
          SpreadsheetsFunction.getSpecificSheetDataById(
            dataConfig.performance.anomaliProteksi.folderId, //folder Id
            dataConfig.performance.anomaliProteksi.spreadsheetId, //spreadsheet Id
            [
              516972869, 1398146234, 1290962390, 1251449348, 572975010,
              2138198502,
            ] // sheet id
            //anounciator,auxiliary,matering,relay,telekomunikasi,sistem dc
          ),
        ]);

      const dataFinalAnomaliGi = await getAnomaliGi(dataAnomaliGi);
      const dataFinalAnomaliJaringan = await getAnomaliJaringan(
        dataAnomaliJaringan
      );

      const dataFinalAnomaliProteksi = await getAnomaliProteksi(
        dataAnomaliProteksi
      );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        anomali_gi: dataFinalAnomaliGi,
        anomali_jaringan: dataFinalAnomaliJaringan,
        anomali_proteksi: dataFinalAnomaliProteksi,
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

async function getAnomaliGi(dataAnomaliGi) {
  // Konversi data gi rembesan
  const jsonResultGiRembesan = convertSpreadsheetToJSON(
    dataAnomaliGi.sheetsData[1935746080].data, // data spreadsheet
    2, //index mulai data
    headerGiRembesan
  );

  const filteredDataGiRembesan = jsonResultGiRembesan.data.filter(
    (item) => item.ultg !== "-" && item.lokasi !== "-"
  );

  // Konversi data gi kebocoran sf6
  const jsonResultGiKebocoranSF6 = convertSpreadsheetToJSON(
    dataAnomaliGi.sheetsData[954331737].data, // data spreadsheet
    4, //index mulai data
    headerGiRembesan
  );

  const filteredDataGiGiKebocoranSF6 = jsonResultGiKebocoranSF6.data.filter(
    (item) => item.ultg !== "-" && item.lokasi !== "-"
  );

  // Konversi data gi thermofisi
  const jsonResultGiThermovisi = convertSpreadsheetToJSON(
    dataAnomaliGi.sheetsData[1216187522].data, // data spreadsheet
    4, //index mulai data
    headerGiRembesan
  );

  const filteredDataGiThermovisi = jsonResultGiThermovisi.data.filter(
    (item) => item.ultg !== "-" && item.lokasi !== "-"
  );

  // Konversi data gi RembesanUIT
  const jsonResultGiRembesanUIT = convertSpreadsheetToJSON(
    dataAnomaliGi.sheetsData[1479867489].data, // data spreadsheet
    1, //index mulai data
    headerGiRembesanUIT
  );

  const filteredDataGiRembesanUIT = jsonResultGiRembesanUIT.data.filter(
    (item) => item.ultg !== "-" && item.lokasi !== "-"
  );

  // Konversi data gi KebocoranGasSF6UIT
  const jsonResultGiKebocoranGasSF6UIT = convertSpreadsheetToJSON(
    dataAnomaliGi.sheetsData[1303146936].data, // data spreadsheet
    1, //index mulai data
    headerGiKebocoranGasSF6UIT
  );

  const filteredDataGiKebocoranGasSF6UIT =
    jsonResultGiKebocoranGasSF6UIT.data.filter(
      (item) => item.ultg !== "-" && item.lokasi !== "-"
    );

  const dataGrupAnomaliGi = {
    rembesan: filteredDataGiRembesan,
    kebocoran_sf6: filteredDataGiGiKebocoranSF6,
    thermofisi: filteredDataGiThermovisi,
    rembesan_uit: filteredDataGiRembesanUIT,
    kebocoran_gas_sf6_uit: filteredDataGiKebocoranGasSF6UIT,
  };

  // Gabungkan semua data jadi satu array
  const mergedAnomaliGi = Object.entries(dataGrupAnomaliGi).flatMap(
    ([kategori, items]) => items.map((item) => ({ ...item, kategori }))
  );

  return mergedAnomaliGi;
}

// anomali gi
const headerGiRembesan = [
  { field: "ultg", column: 6 },
  { field: "lokasi", column: 8 },
  { field: "temuan_anomali", column: 10 },
  { field: "kondisi", column: 13 },
  { field: "tidak_lanjut", column: 15 },
  { field: "status", column: 16 },
];

const headerGiRembesanUIT = [
  { field: "ultg", column: 0 },
  { field: "lokasi", column: 2 },
  { field: "temuan_anomali", column: 5 },
  { field: "kondisi", column: 7 },
  { field: "tidak_lanjut", column: 10 },
  { field: "status", column: 13 },
];

const headerGiKebocoranGasSF6UIT = [
  { field: "ultg", column: 2 },
  { field: "lokasi", column: 4 },
  { field: "temuan_anomali", column: 5 },
  { field: "kondisi", column: 7 },
  { field: "tidak_lanjut", column: 10 },
  { field: "status", column: 13 },
];

async function getAnomaliJaringan(dataAnomaliJaringan) {
  // Konversi data jaringan Grounding
  const jsonResultJaringanGrounding = convertSpreadsheetToJSON(
    dataAnomaliJaringan.sheetsData[66209448].data, // data spreadsheet
    2, //index mulai data
    headerJaringanGrounding
  );

  const filteredDataJaringanGrounding = jsonResultJaringanGrounding.data.filter(
    (item) => item.ultg !== "-" || item.lokasi !== "-"
  );

  // Konversi data jaringan Isolator
  const jsonResultJaringanIsolator = convertSpreadsheetToJSON(
    dataAnomaliJaringan.sheetsData[790898612].data, // data spreadsheet
    1, //index mulai data
    headerJaringanIsolator
  );

  const filteredDataJaringanIsolator = jsonResultJaringanIsolator.data.filter(
    (item) => item.ultg !== "-" && item.lokasi !== "-"
  );

  // Konversi data jaringan Gsw
  const jsonResultJaringanGsw = convertSpreadsheetToJSON(
    dataAnomaliJaringan.sheetsData[91417407].data, // data spreadsheet
    3, //index mulai data
    headerJaringanGsw
  );

  const filteredDataJaringanGsw = jsonResultJaringanGsw.data.filter(
    (item) => item.ultg !== "-" || item.lokasi !== "-"
  );

  // Konversi data jaringan Pondasi
  const jsonResultJaringanPondasi = convertSpreadsheetToJSON(
    dataAnomaliJaringan.sheetsData[1819316177].data, // data spreadsheet
    2, //index mulai data
    headerJaringanPondasi
  );

  const filteredDataJaringanPondasi = jsonResultJaringanPondasi.data.filter(
    (item) => item.ultg !== "-" && item.lokasi !== "-" && item.status !== "-"
  );

  // Konversi data jaringan Bracing
  const jsonResultJaringanBracing = convertSpreadsheetToJSON(
    dataAnomaliJaringan.sheetsData[1205103023].data, // data spreadsheet
    1, //index mulai data
    headerJaringanBracing
  );

  const filteredDataJaringanBracing = jsonResultJaringanBracing.data.filter(
    (item) => item.ultg !== "-" || item.lokasi !== "-"
  );

  // Konversi data jaringan Jointing
  const jsonResultJaringanJointing = convertSpreadsheetToJSON(
    dataAnomaliJaringan.sheetsData[1101962821].data, // data spreadsheet
    3, //index mulai data
    headerJaringanJointing
  );

  const filteredDataJaringanJointing = jsonResultJaringanJointing.data.filter(
    (item) => item.ultg !== "-" || item.lokasi !== "-"
  );

  // Konversi data jaringan KonduktorAcc
  const jsonResultJaringanKonduktorAcc = convertSpreadsheetToJSON(
    dataAnomaliJaringan.sheetsData[874629827].data, // data spreadsheet
    2, //index mulai data
    headerJaringanKonduktorAcc
  );

  const filteredDataJaringanKonduktorAcc =
    jsonResultJaringanKonduktorAcc.data.filter(
      (item) => item.ultg !== "-" || item.lokasi !== "-"
    );

  const dataGrupAnomaliJaringan = {
    grounding: filteredDataJaringanGrounding,
    isolator: filteredDataJaringanIsolator,
    gsw: filteredDataJaringanGsw,
    pondasi: filteredDataJaringanPondasi,
    bracing: filteredDataJaringanBracing,
    jointing: filteredDataJaringanJointing,
    konduktor: filteredDataJaringanKonduktorAcc,
  };

  // Gabungkan semua data jadi satu array
  const mergedAnomaliJaringan = Object.entries(dataGrupAnomaliJaringan).flatMap(
    ([kategori, items]) => items.map((item) => ({ ...item, kategori }))
  );

  return mergedAnomaliJaringan;
}

const headerJaringanGrounding = [
  { field: "ultg", column: 99 },
  { field: "lokasi", column: 1 },
  { field: "temuan_anomali", column: 4 },
  { field: "kondisi", column: 3 },
  { field: "tidak_lanjut", column: 5 },
  { field: "status", column: 6 },
];

const headerJaringanIsolator = [
  { field: "ultg", column: 6 },
  { field: "lokasi", column: 9 },
  { field: "temuan_anomali", column: 14 },
  { field: "kondisi", column: 16 },
  { field: "tidak_lanjut", column: 22 },
  { field: "status", column: 20 },
];

const headerJaringanGsw = [
  { field: "ultg", column: 99 },
  { field: "lokasi", column: 6 },
  { field: "temuan_anomali", column: 99 },
  { field: "kondisi", column: 8 },
  { field: "tidak_lanjut", column: 12 },
  { field: "status", column: 13 },
];

const headerJaringanPondasi = [
  { field: "ultg", column: 4 },
  { field: "lokasi", column: 7 },
  { field: "temuan_anomali", column: 12 },
  { field: "kondisi", column: 14 },
  { field: "tidak_lanjut", column: 18 },
  { field: "status", column: 16 },
];

const headerJaringanBracing = [
  { field: "ultg", column: 7 },
  { field: "lokasi", column: 8 },
  { field: "temuan_anomali", column: 99 },
  { field: "kondisi", column: 9 },
  { field: "tidak_lanjut", column: 13 },
  { field: "status", column: 11 },
];

const headerJaringanJointing = [
  { field: "ultg", column: 7 },
  { field: "lokasi", column: 8 },
  { field: "temuan_anomali", column: 11 },
  { field: "kondisi", column: 10 },
  { field: "tidak_lanjut", column: 13 },
  { field: "status", column: 14 },
];

const headerJaringanKonduktorAcc = [
  { field: "ultg", column: 5 },
  { field: "lokasi", column: 6 },
  { field: "temuan_anomali", column: 9 },
  { field: "kondisi", column: 8 },
  { field: "tidak_lanjut", column: 11 },
  { field: "status", column: 12 },
];

async function getAnomaliProteksi(dataAnomaliProteksi) {
  // Konversi data proteksi anounciator
  const jsonResultProteksiAnounciator = convertSpreadsheetToJSON(
    dataAnomaliProteksi.sheetsData[516972869].data, // data spreadsheet
    4, //index mulai data
    headerProteksiAnounciator
  );

  const filteredDataProteksiAnounciator =
    jsonResultProteksiAnounciator.data.filter(
      (item) => item.ultg !== "-" && item.lokasi !== "-"
    );

  // Konversi data proteksi Auxiliary
  const jsonResultProteksiAuxiliary = convertSpreadsheetToJSON(
    dataAnomaliProteksi.sheetsData[1398146234].data, // data spreadsheet
    4, //index mulai data
    headerProteksiAnounciator
  );

  const filteredDataProteksiAuxiliary = jsonResultProteksiAuxiliary.data.filter(
    (item) => item.ultg !== "-" || item.lokasi !== "-"
  );

  // Konversi data proteksi Matering
  const jsonResultProteksiMatering = convertSpreadsheetToJSON(
    dataAnomaliProteksi.sheetsData[1290962390].data, // data spreadsheet
    4, //index mulai data
    headerProteksiAnounciator
  );

  const filteredDataProteksiMatering = jsonResultProteksiMatering.data.filter(
    (item) => item.ultg !== "-" || item.lokasi !== "-"
  );

  // Konversi data proteksi Relay
  const jsonResultProteksiRelay = convertSpreadsheetToJSON(
    dataAnomaliProteksi.sheetsData[1251449348].data, // data spreadsheet
    26, //index mulai data
    headerProteksiAnounciator
  );

  const filteredDataProteksiRelay = jsonResultProteksiRelay.data.filter(
    (item) =>
      (item.ultg !== "-" || item.lokasi !== "-") &&
      item.ultg !== "ULTG" &&
      item.lokasi !== "LOKASI"
  );

  // Konversi data proteksi Telekomunikasi
  const jsonResultProteksiTelekomunikasi = convertSpreadsheetToJSON(
    dataAnomaliProteksi.sheetsData[572975010].data, // data spreadsheet
    26, //index mulai data
    headerProteksiAnounciator
  );

  const filteredDataProteksiTelekomunikasi =
    jsonResultProteksiTelekomunikasi.data.filter(
      (item) =>
        (item.ultg !== "-" || item.lokasi !== "-") &&
        item.ultg !== "ULTG" &&
        item.lokasi !== "LOKASI"
    );

  // Konversi data proteksi SistemDc
  const jsonResultProteksiSistemDc = convertSpreadsheetToJSON(
    dataAnomaliProteksi.sheetsData[2138198502].data, // data spreadsheet
    26, //index mulai data
    headerProteksiAnounciator
  );

  const filteredDataProteksiSistemDc = jsonResultProteksiSistemDc.data.filter(
    (item) =>
      (item.ultg !== "-" || item.lokasi !== "-") &&
      item.ultg !== "ULTG" &&
      item.lokasi !== "LOKASI"
  );

  const dataGrupAnomaliProteksi = {
    anounciator: filteredDataProteksiAnounciator,
    auxiliary: filteredDataProteksiAuxiliary,
    matering: filteredDataProteksiMatering,
    relay: filteredDataProteksiRelay,
    telekomunikasi: filteredDataProteksiTelekomunikasi,
    sistemDc: filteredDataProteksiSistemDc,
  };

  // Gabungkan semua data jadi satu array
  const mergedAnomaliProteksi = Object.entries(dataGrupAnomaliProteksi).flatMap(
    ([kategori, items]) => items.map((item) => ({ ...item, kategori }))
  );

  return mergedAnomaliProteksi;
}

const headerProteksiAnounciator = [
  { field: "ultg", column: 8 },
  { field: "lokasi", column: 10 },
  { field: "temuan_anomali", column: 12 },
  { field: "kondisi", column: 14 },
  { field: "tidak_lanjut", column: 16 },
  { field: "status", column: 17 },
];

module.exports = RekapAnomaliController;
