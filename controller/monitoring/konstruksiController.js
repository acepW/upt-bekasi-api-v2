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
        [0, 671767085, 1446476439, 1125139855, 535284859] // sheet id
        //non sap , sisa pekerjaan, material bongkaran, non b3, alat berat
      );

      const dataSaldoAkhirUITJBT =
        await SpreadsheetsFunction.getSpecificSheetDataById(
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangSaldoUITJBT
            .folderId, //folder Id
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangSaldoUITJBT
            .spreadsheetId, //spreadsheet Id
          [936401927] // sheet id
          //data untuk material normal,bursa,cadang
        );

      const dataSaldoAkhirUPT =
        await SpreadsheetsFunction.getSpecificSheetDataById(
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangSaldoAkhir
            .folderId, //folder Id
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangSaldoAkhir
            .spreadsheetId, //spreadsheet Id
          [1795387809] // sheet id
          //data untuk saldo
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

      // Konversi data saldo akhir UIT
      const jsonResultSaldoAkhirUIT = convertSpreadsheetToJSON(
        dataSaldoAkhirUITJBT.data, //data spreadsheet
        11, //index awal data
        headerMappingSaldoAkhitUIT //custom header
      );

      const grupSaldoAkhitUIT = groupTypeSaldoUIT(jsonResultSaldoAkhirUIT.data);

      // Konversi data saldo akhir UPT
      const jsonResultSaldoAkhirUPT = convertSpreadsheetToJSON(
        dataSaldoAkhirUPT.data, //data spreadsheet
        1, //index awal data
        headerMappingSaldoAkhitUPT,
        ["bulan", "tahun"] //custom header //merge field
      );

      const grupSaldoAkhirUPT = groupBulanSaldoAkhirUPT(
        jsonResultSaldoAkhirUPT.data
      );

      //alat berat
      // Konversi data
      const jsonResultAlatBerat = convertSpreadsheetToJSON(
        dataGudang.sheetsData[535284859].data, //data spreadsheet
        1, //index awal data
        headerMappingAlatBerat //custom header
      );

      const grupAlatBerat = groupAlatKerja(jsonResultAlatBerat.data);

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
          normal: grupSaldoAkhitUIT.normal.length,
          cadang: grupSaldoAkhitUIT.cadang.length,
          bursa: grupSaldoAkhitUIT.bursa.length,
          non_sap: jsonResultNonSap.data.length,
          sisa_pekerjaan: jsonResultSisaPekerjaan.data.length,
          material_bongkaran: jsonResultMaterialBongkaran.data.length,
          non_b3: filterNonB3.length,
        },
        grafik_matlev: grupSaldoAkhirUPT,
        alat_berat: grupAlatBerat,
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

const headerMappingSaldoAkhitUIT = [
  { field: "no_material", column: 1 },
  { field: "type_valuasi", column: 7 },
];

const headerMappingSaldoAkhitUPT = [
  { field: "bulan", column: 1 },
  { field: "tahun", column: 2 },
  { field: "kontrak", column: 3 },
  { field: "no_kontrak", column: 4 },
  { field: "penerimaan_pengeluaran", column: 5 },
  { field: "nilai", column: 12 },
  { field: "penerimaan", column: 13 },
  { field: "pengeluaran", column: 15 },
];
const headerMappingAlatBerat = [
  { field: "nama", column: 0 },
  { field: "jenis", column: 1 },
  { field: "model", column: 2 },
  { field: "pabrik_pembuat", column: 3 },
  { field: "negara_pembuat", column: 4 },
  { field: "tahun_pembuatan", column: 5 },
  { field: "no_seri", column: 6 },
  { field: "kapasitas_angkat", column: 7 },
  { field: "tinggi_angkat", column: 8 },
  { field: "jenis_penggerak", column: 9 },
];

const headerMappingGudang = [
  { field: "gudang", column: 2 },
  { field: "sub_gudang", column: 3 },
  { field: "luas_gudang", column: 5 },
  { field: "luas_gudang_terpakai", column: 6 },
  { field: "persediaan", column: 9 },
  { field: "cadang", column: 10 },
  { field: "pre_memory", column: 11 },
  { field: "attb", column: 12 },
  { field: "lainnya_limbah_non_b3", column: 13 },
  { field: "waktu_update", column: 24 },
];

function groupAlatKerja(items) {
  const result = {
    forklift: [],
    crane: [],
  };

  items.forEach((item) => {
    const alat = item.jenis.toUpperCase(); // biar tidak case-sensitive

    if (alat.includes("FORKLIFT")) {
      result.forklift.push(item);
    } else if (alat.includes("CRANE")) {
      result.crane.push(item);
    }
  });

  return result;
}

function groupTypeSaldoUIT(items) {
  const result = {
    cadang: [],
    normal: [],
    bursa: [],
  };

  items.forEach((item) => {
    const type = item.type_valuasi.toUpperCase(); // biar tidak case-sensitive

    if (type.includes("MAT CADANG")) {
      result.cadang.push(item);
    } else if (type.includes("NORMAL")) {
      result.normal.push(item);
    } else if (type.includes("BURSA")) {
      result.bursa.push(item);
    }
  });

  return result;
}

function groupBulanSaldoAkhirUPT(items) {
  const result = {
    januari: [],
    februari: [],
    maret: [],
    april: [],
    mei: [],
    juni: [],
    juli: [],
    agustus: [],
    september: [],
    oktober: [],
    november: [],
    desember: [],
  };

  items.forEach((item) => {
    const type = item.bulan.toUpperCase(); // biar tidak case-sensitive

    if (type.includes("JANUARI")) {
      result.januari.push(item);
    } else if (type.includes("FEBRUARI")) {
      result.februari.push(item);
    } else if (type.includes("MARET")) {
      result.maret.push(item);
    } else if (type.includes("APRIL")) {
      result.april.push(item);
    } else if (type.includes("MEI")) {
      result.mei.push(item);
    } else if (type.includes("JUNI")) {
      result.juni.push(item);
    } else if (type.includes("JULI")) {
      result.juli.push(item);
    } else if (type.includes("AGUSTUS")) {
      result.agustus.push(item);
    } else if (type.includes("SEPTEMBER")) {
      result.september.push(item);
    } else if (type.includes("OKTOBER")) {
      result.oktober.push(item);
    } else if (type.includes("NOVEMBER")) {
      result.november.push(item);
    } else if (type.includes("DESEMBER")) {
      result.desember.push(item);
    }
  });

  return result;
}

module.exports = KonstruksiController;
