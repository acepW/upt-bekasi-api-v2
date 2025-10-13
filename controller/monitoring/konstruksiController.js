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

const KonstruksiController = {
  getAdkonDalkon: async (req, res) => {
    try {
      const data = await SpreadsheetsFunction.getSpecificSheetData(
        dataConfig.monitoring.konstruksi.adkonDalkon.folderId, //folder Id
        dataConfig.monitoring.konstruksi.adkonDalkon.spreadsheetId, //spreadsheet Id
        "kontrak AI" // sheet name
      );

      const dataInvestasi = await SpreadsheetsFunction.getSpecificSheetDataById(
        dataConfig.monitoring.investasi.folderId, //folder Id
        dataConfig.monitoring.investasi.spreadsheetId, //spreadsheet Id
        [1941962179] // sheet id
      );

      const headerMapping = [
        { field: "no_kontrak", column: 1 },
        { field: "nama_kontrak", column: 3 },
        { field: "nilai_terkontrak", column: 4 },
        { field: "sudah_bayar", column: 6 },
        { field: "tgl_kontrak", column: 9 },
        { field: "tgl_efektif_kontrak", column: 10 },
        { field: "akhir_kontrak", column: 12 },
        { field: "fisik", column: 17 },
        { field: "bayar", column: 18 },
        { field: "status", column: 99 }, // 99 untuk kolom yang tidak ada di spreadsheet
      ];

      const headerInvestasi = [
        {
          field: "skki_terbit",
          type: "group",
          fields: {
            januari: 60,
            februari: 61,
            maret: 62,
            april: 63,
            mei: 64,
            juni: 65,
            juli: 66,
            agustus: 67,
            september: 68,
            oktober: 69,
            november: 70,
            desember: 71,
          },
        },

        {
          field: "aki_terbayar",
          type: "group",
          fields: {
            januari: 72,
            februari: 73,
            maret: 74,
            april: 75,
            mei: 76,
            juni: 77,
            juli: 78,
            agustus: 79,
            september: 80,
            oktober: 81,
            november: 82,
            desember: 83,
          },
        },
      ];

      const headerInvestasiAkiTerbit = [{ field: "total", column: 5 }];
      // Konversi data
      const jsonResult = convertSpreadsheetToJSON(
        data.data, //data spreadsheet
        6, //index awal data
        headerMapping //custom header
      );

      // Konversi data
      const jsonInvestasi = convertSpreadsheetToJSONWithRange(
        dataInvestasi.data, // data spreadsheet
        4, //index mulai data
        4, //index akhir data
        headerInvestasi
      );

      // Konversi data
      const jsonInvestasiAkiTerbit = convertSpreadsheetToJSONWithRange(
        dataInvestasi.data, // data spreadsheet
        3, //index mulai data
        3, //index akhir data
        headerInvestasiAkiTerbit
      );

      // filter data, hilangkan yang no_kontrak atau nama_kontrak bernilai "-"
      const filteredData = jsonResult.data.filter(
        (item) => item.no_kontrak !== "-" && item.nama_kontrak !== "-"
      );

      const convertedData = filteredData.map((item) => ({
        ...item,
        nilai_terkontrak: parseCurrency(item.nilai_terkontrak),
        sudah_bayar: parseCurrency(item.sudah_bayar),
      }));
      const grouped = Object.values(
        convertedData.reduce((acc, item) => {
          const year = new Date(item.tgl_efektif_kontrak).getFullYear();

          if (!acc[year]) {
            acc[year] = {
              tahun: year,
              total_kontrak: 0,
              progress_fisik: 0,
              progress_bayar: 0,
              data: [],
            };
          }

          //acc[year].data.push(item);
          acc[year].total_kontrak += 1;

          if (
            item.fisik === "100%" ||
            item.fisik === "100.00%" ||
            item.fisik === "100"
          ) {
            acc[year].progress_fisik += 1;
          }
          if (
            item.bayar === "100%" ||
            item.bayar === "100.00%" ||
            item.bayar === "100"
          ) {
            acc[year].progress_bayar += 1;
          }

          return acc;
        }, {})
      );

      const pratinjauKontrak = groupCount(convertedData, "status");

      //untuk skki terbit dan aki tebayar
      // ambil bulan sekarang (misal: Oktober → index ke-9)
      const bulanSekarang = new Date().getMonth(); // 0-based (0 = Januari)
      const bulanSampai = bulanList[bulanSekarang];

      // fungsi untuk ubah string seperti "8,703,728.2050" ke angka
      const parseNumber = (str) => Number(str.replace(/,/g, "") || 0);

      // ambil data pertama (kalau hanya 1)
      const { skki_terbit, aki_terbayar } = jsonInvestasi.data[0];

      // hitung total SKKI terbit (semua bulan)
      const totalSkkiTerbit = Object.values(skki_terbit).reduce(
        (sum, val) => sum + parseNumber(val),
        0
      );

      // hitung total AKI terbayar hanya sampai bulan sekarang
      let totalAkiTerbayar = 0;
      for (let i = 0; i <= bulanSekarang; i++) {
        const bulan = bulanList[i];
        totalAkiTerbayar += parseNumber(aki_terbayar[bulan]);
      }

      // const anggaranInvestasi = convertedData.reduce(
      //   (acc, item) => {
      //     acc.skki_terbit += item.nilai_terkontrak;
      //     acc.aki_terbayar += item.sudah_bayar;
      //     return acc;
      //   },
      //   { skki_terbit: 0, aki_terbayar: 0 }
      // );

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        anggaran_investasi: {
          skki_terbit: totalSkkiTerbit.toLocaleString(),
          aki_terbayar: totalAkiTerbayar.toLocaleString(),
          aki_terbit: jsonInvestasiAkiTerbit.data[0]?.total,
        },
        data_kontrak: convertedData,
        grafik_progres_fisik: grouped,
        pratinjau_kontrak: pratinjauKontrak,
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
      // eksekusi bersamaan
      const [
        dataGudang,
        dataSaldoAkhirUITJBT,
        dataSaldoAkhirUPT,
        dataMatlevGudang,
      ] = await Promise.all([
        SpreadsheetsFunction.getSpecificSheetDataById(
          dataConfig.monitoring.konstruksi.logistik.monitoringGudang.folderId, //folder Id
          dataConfig.monitoring.konstruksi.logistik.monitoringGudang
            .spreadsheetId, //spreadsheet Id
          [0, 671767085, 1446476439, 1125139855, 535284859, 1618970871] // sheet id
          //non sap , sisa pekerjaan, material bongkaran, non b3, alat berat, kapasitas gudang
        ),
        SpreadsheetsFunction.getSpecificSheetDataById(
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangSaldoUITJBT
            .folderId, //folder Id
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangSaldoUITJBT
            .spreadsheetId, //spreadsheet Id
          [936401927] // sheet id
          //data untuk material normal,bursa,cadang
        ),
        SpreadsheetsFunction.getSpecificSheetDataById(
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangSaldoAkhir
            .folderId, //folder Id
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangSaldoAkhir
            .spreadsheetId, //spreadsheet Id
          [1795387809] // sheet id
          //data untuk saldo
        ),

        SpreadsheetsFunction.getSpecificSheetDataById(
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangMatlev
            .folderId, //folder Id
          dataConfig.monitoring.konstruksi.logistik.monitoringGudangMatlev
            .spreadsheetId, //spreadsheet Id
          [980137360] // sheet id
          //data untuk matlev
        ),
      ]);

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
        headerMappingSaldoAkhitUPT, //custom header
        ["bulan", "tahun", "pragnosa_akhir_bulan", "progres_realisasi"] //merge field
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

      // Konversi data
      const jsonResultGudang = convertSpreadsheetToJSON(
        dataGudang.sheetsData[1618970871].data, //data spreadsheet
        9, //index awal data
        headerMappingGudang //custom header
      );

      // Konversi data
      const jsonResultMatlev = convertSpreadsheetToJSON(
        dataMatlevGudang.data, //data spreadsheet
        2, //index awal data
        headerMappingMatlev //custom header
      );

      const bulan = [
        "januari",
        "februari",
        "maret",
        "april",
        "mei",
        "juni",
        "juli",
        "agustus",
        "september",
        "oktober",
        "november",
        "desember",
      ];

      //filter untuk matlev
      // hanya ambil data yang `no` isinya angka
      const filtered = jsonResultMatlev.data.filter((item) =>
        /^\d+$/.test(item.no)
      );

      const resultMatlev = {};

      // inisialisasi bulan
      bulan.forEach((b) => {
        resultMatlev[b] = [];
      });

      // isi data kategori + nilai
      filtered.forEach((item) => {
        bulan.forEach((b) => {
          const val = parseFloat(item[b]);
          if (!isNaN(val)) {
            resultMatlev[b].push({
              kategori: item.kategori,
              nilai: val,
            });
          }
        });
      });

      res.status(200).json({
        status: "success",
        message: "get data successfully",
        matlev: resultMatlev,
        persediaan: {
          normal: grupSaldoAkhitUIT.normal.length,
          cadang: grupSaldoAkhitUIT.cadang.length,
          bursa: grupSaldoAkhitUIT.bursa.length,
          non_sap: jsonResultNonSap.data.length,
          sisa_pekerjaan: jsonResultSisaPekerjaan.data.length,
          material_bongkaran: jsonResultMaterialBongkaran.data.length,
          non_b3: filterNonB3.length,
          normal_data: grupSaldoAkhitUIT.normal,
          cadang_data: grupSaldoAkhitUIT.cadang,
          bursa_data: grupSaldoAkhitUIT.bursa,
        },
        grafik_saldo: grupSaldoAkhirUPT,
        data_gudang: jsonResultGudang.data,
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
  { field: "deskripsi_material", column: 2 },
  { field: "satuan", column: 5 },
  { field: "tipe_material", column: 6 },
  { field: "type_valuasi", column: 7 },
  { field: "lokasi_gudang", column: 8 },
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
  { field: "pragnosa_akhir_bulan", column: 19 },
  { field: "progres_realisasi", column: 20 },
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

const headerMappingMatlev = [
  { field: "no", column: 0 },
  { field: "kategori", column: 1 },
  { field: "januari", column: 99 },
  { field: "februari", column: 99 },
  { field: "maret", column: 99 },
  { field: "april", column: 2 },
  { field: "mei", column: 3 },
  { field: "juni", column: 4 },
  { field: "juli", column: 5 },
  { field: "agustus", column: 6 },
  { field: "september", column: 7 },
  { field: "oktober", column: 8 },
  { field: "november", column: 9 },
  { field: "desember", column: 10 },
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
    saldo_januari: { rencana: 0, realisasi: 0 },
    saldo_februari: { rencana: 0, realisasi: 0 },
    saldo_maret: { rencana: 0, realisasi: 0 },
    saldo_april: { rencana: 0, realisasi: 0 },
    saldo_mei: { rencana: 0, realisasi: 0 },
    saldo_juni: { rencana: 0, realisasi: 0 },
    saldo_juli: { rencana: 0, realisasi: 0 },
    saldo_agustus: { rencana: 0, realisasi: 0 },
    saldo_september: { rencana: 0, realisasi: 0 },
    saldo_oktober: { rencana: 0, realisasi: 0 },
    saldo_november: { rencana: 0, realisasi: 0 },
    saldo_desember: { rencana: 0, realisasi: 0 },
  };

  items.forEach((item) => {
    const type = item.bulan.toUpperCase(); // biar tidak case-sensitive

    if (type.includes("JANUARI")) {
      result.januari.push(item);

      if (result.saldo_januari.rencana == 0) {
        result.saldo_januari.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_januari.realisasi == 0) {
        result.saldo_januari.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("FEBRUARI")) {
      result.februari.push(item);

      if (result.saldo_februari.rencana == 0) {
        result.saldo_februari.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_februari.realisasi == 0) {
        result.saldo_februari.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("MARET")) {
      result.maret.push(item);

      if (result.saldo_maret.rencana == 0) {
        result.saldo_maret.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_maret.realisasi == 0) {
        result.saldo_maret.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("APRIL")) {
      result.april.push(item);

      if (result.saldo_april.rencana == 0) {
        result.saldo_april.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_april.realisasi == 0) {
        result.saldo_april.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("MEI")) {
      result.mei.push(item);

      if (result.saldo_mei.rencana == 0) {
        result.saldo_mei.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_mei.realisasi == 0) {
        result.saldo_mei.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("JUNI")) {
      result.juni.push(item);

      if (result.saldo_juni.rencana == 0) {
        result.saldo_juni.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_juni.realisasi == 0) {
        result.saldo_juni.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("JULI")) {
      result.juli.push(item);

      if (result.saldo_juli.rencana == 0) {
        result.saldo_juli.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_juli.realisasi == 0) {
        result.saldo_juli.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("AGUSTUS")) {
      result.agustus.push(item);

      if (result.saldo_agustus.rencana == 0) {
        result.saldo_agustus.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_agustus.realisasi == 0) {
        result.saldo_agustus.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("SEPTEMBER")) {
      result.september.push(item);

      if (result.saldo_september.rencana == 0) {
        result.saldo_september.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_september.realisasi == 0) {
        result.saldo_september.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("OKTOBER")) {
      result.oktober.push(item);

      if (result.saldo_oktober.rencana == 0) {
        result.saldo_oktober.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_oktober.realisasi == 0) {
        result.saldo_oktober.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("NOVEMBER")) {
      result.november.push(item);

      if (result.saldo_november.rencana == 0) {
        result.saldo_november.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_november.realisasi == 0) {
        result.saldo_november.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    } else if (type.includes("DESEMBER")) {
      result.desember.push(item);

      if (result.saldo_desember.rencana == 0) {
        result.saldo_desember.rencana = convertToNumber(
          item.pragnosa_akhir_bulan == "-" ? "0" : item.pragnosa_akhir_bulan
        );
      }

      if (result.saldo_desember.realisasi == 0) {
        result.saldo_desember.realisasi = convertToNumber(
          item.progres_realisasi == "-" ? "0" : item.progres_realisasi
        );
      }
    }
  });

  return result;
}

function convertToNumber(value) {
  return parseInt(
    value.replace(/[^0-9]/g, ""), // hapus semua karakter selain angka
    10
  );
}

// ambil tahun dari tgl_efektif_kontrak
function getYear(dateStr) {
  if (!dateStr || dateStr === "-") return null;
  return new Date(dateStr).getFullYear();
}

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

// fungsi helper untuk ubah string jadi number
const parseCurrency = (value) => {
  if (!value || value === "-") return 0;
  return Number(value.replace(/,/g, ""));
};

// daftar bulan dalam urutan
const bulanList = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
];

module.exports = KonstruksiController;
