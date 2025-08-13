const express = require("express");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx"); // Untuk membaca file Excel
const SpreadsheetsFunction = require("../function/spreadsheetFunction");

const DebugSpreadshhet = {
  debugAllfiles: async (req, res) => {
    try {
      const dataDebug = await SpreadsheetsFunction.debugAllFiles();

      res.status(200).json({
        status: "success",
        message: "Debug all files successfully",
        data: dataDebug,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to debug all files",
        error: error.message,
      });
    }
  },

  checkPermissions: async (req, res) => {
    try {
      const dataDebug = await SpreadsheetsFunction.checkPermissions();

      res.status(200).json({
        status: "success",
        message: "Debug all files successfully",
        data: dataDebug,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to debug all files",
        error: error.message,
      });
    }
  },

  getFilesInFolder: async (req, res) => {
    const folderId = req.params.folderId;
    try {
      const dataDebug = await SpreadsheetsFunction.getFilesInFolder(folderId);

      res.status(200).json({
        status: "success",
        message: "Debug all files successfully",
        data: dataDebug,
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: "Failed to debug all files",
        error: error.message,
      });
    }
  },
};

module.exports = DebugSpreadshhet;
