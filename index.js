/*
 * Screen recording function using ffmpeg.
 * Defaults to using x11grab, but also supports other input formats.
 *
 * Copyright 2019, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

// @ts-check
'use strict'

const fs = require('fs')
const util = require('util')
const { execFile } = require('child_process')
const execFilePromise = util.promisify(execFile)

/**
 * Builds an URL object with the given properties.
 * @param {Object} [properties] URL properties
 * @returns {string}
 */
function buildURL (properties = {}) {
  const url = new URL('http://localhost')
  const keys = [
    'protocol',
    'username',
    'password',
    'hostname',
    'port',
    'pathname',
    'search'
  ]
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i]
    let value = properties[key]
    if (value) url[key] = value
  }
  return url.href
}

/**
 * Builds arguments for the ffmpeg call.
 * @param {string} fileName Output file name
 * @param {Object} [options] Screen recording options
 * @returns {Array}
 */
function buildFFMPEGArgs (fileName, options = {}) {
  const args = ['-y'] // Override existing files
  if (options.loglevel) {
    args.push('-loglevel', options.loglevel)
  }
  if (options.resolution) {
    // Must match X11 display resolution when using x11grab:
    args.push('-video_size', options.resolution)
  }
  if (options.fps) {
    // Frames per second to record from input:
    args.push('-r', options.fps)
  }
  if (options.inputFormat) {
    args.push('-f', options.inputFormat)
  }
  args.push(
    '-i',
    // Construct the input URL:
    options.inputFormat === 'x11grab'
      ? `${options.hostname || ''}:${options.display}`
      : buildURL(options)
  )
  if (options.videoCodec) {
    args.push('-vcodec', options.videoCodec)
  }
  if (options.pixelFormat) {
    args.push('-pix_fmt', options.pixelFormat)
  }
  args.push(fileName)
  return args
}

/**
 * @typedef {Object} Result
 * @property {string} stdout Screen recording standard output
 * @property {string} stderr Screen recording error output
 */

/**
 * @typedef {Object} Recording
 * @property {Promise<Result>} promise Promise for the active screen recording
 * @property {function} stop Function to stop the screen recording
 */

/**
 * @typedef {Object} Options Screen recording options
 * @property {string} [loglevel=info] Log verbosity level
 * @property {string} [inputFormat=x11grab] Input format
 * @property {string} [resolution] Display resolution (WIDTHxHEIGHT)
 * @property {number} [fps=15] Frames per second to record from input
 * @property {string} [videoCodec] Video codec
 * @property {string} [pixelFormat=yuv420p] Output pixel format
 * @property {number} [rotate] Rotate metadata, set to 90 to rotate left by 90°
 * @property {string} [hostname=localhost] Server hostname
 * @property {string} [display=0] X11 server display
 * @property {string} [protocol=http] Server protocol
 * @property {string} [username] URL username
 * @property {string} [password] URL password
 * @property {number} [port=9000] Server port
 * @property {string} [pathname] URL pathname
 * @property {string} [search] URL search
 */

/**
 * Starts a screen recording via ffmpeg x11grab.
 * @param {string} fileName Output file name
 * @param {Options} [options] Screen recording options
 * @returns {Recording}
 */
function recordScreen (fileName, options) {
  const args = buildFFMPEGArgs(
    fileName,
    Object.assign(
      {
        inputFormat: 'x11grab',
        fps: 15,
        pixelFormat: 'yuv420p', // QuickTime compatibility
        display: '0',
        port: 9000
      },
      options
    )
  )
  let recProcess
  function resolveRecordingProcess (resolve, reject) {
    recProcess = execFile('ffmpeg', args, function (error, stdout, stderr) {
      recProcess = null
      // ffmpeg returns with status 255 when receiving SIGINT:
      if (error && !(error.killed && error.code === 255)) return reject(error)
      return resolve({ stdout, stderr })
    })
  }
  function stop () {
    if (recProcess) recProcess.kill('SIGINT')
  }
  function setMetadata (result) {
    if (!options.rotate) return result
    // Metadata cannot be set when encoding, as the FFmpeg MP4 muxer has a bug
    // that prevents changing metadata: https://trac.ffmpeg.org/ticket/6370
    // So we set the metadata in a separate command execution:
    const tmpFileName = fileName.replace(/[^.]+$/, 'tmp.$&')
    const args = [
      '-y',
      '-loglevel',
      'error',
      '-i',
      fileName,
      '-codec',
      'copy',
      '-map_metadata',
      '0',
      '-metadata:s:v',
      'rotate=' + options.rotate,
      tmpFileName
    ]
    return execFilePromise('ffmpeg', args).then(function () {
      fs.unlinkSync(fileName)
      fs.renameSync(tmpFileName, fileName)
      return result
    })
  }
  const promise = new Promise(resolveRecordingProcess).then(setMetadata)
  return { promise, stop }
}

module.exports = recordScreen
