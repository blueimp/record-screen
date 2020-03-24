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

'use strict'

/**
 * @typedef {object} Result
 * @property {string} stdout Screen recording standard output
 * @property {string} stderr Screen recording error output
 */

/**
 * @typedef {object} Recording
 * @property {Promise<Result>} promise Promise for the active screen recording
 * @property {Function} stop Function to stop the screen recording
 */

/**
 * @typedef {object} Options Screen recording options
 * @property {string} [loglevel=info] Log verbosity level
 * @property {string} [inputFormat=x11grab] Input format
 * @property {string} [resolution] Display resolution (WIDTHxHEIGHT)
 * @property {number} [fps=15] Frames per second to record from input
 * @property {string} [videoFilter] Video filters to apply
 * @property {string} [videoCodec] Video codec
 * @property {string} [pixelFormat=yuv420p] Output pixel format
 * @property {number} [rotate] Rotate metadata, set to 90 to rotate left by 90°
 * @property {string} [hostname=localhost] Server hostname
 * @property {string} [display=0] X11 server display
 * @property {string} [protocol=http] Server protocol
 * @property {string} [username] Basic auth username
 * @property {string} [password] Basic auth password
 * @property {number} [port=9000] Server port
 * @property {string} [pathname] URL path component
 * @property {string} [search] URL query parameter
 */

const fs = require('fs')
const util = require('util')
const { execFile } = require('child_process')
const execFilePromise = util.promisify(execFile)

/**
 * Builds an URL with the given properties.
 *
 * @param {object} [properties] URL properties
 * @param {string} [properties.protocol=http] Server protocol
 * @param {string} [properties.username] Basic auth username
 * @param {string} [properties.password] Basic auth password
 * @param {string} [properties.hostname=localhost] Server hostname
 * @param {number} [properties.port] Server port
 * @param {string} [properties.pathname] URL path component
 * @param {string} [properties.search] URL query parameter
 * @returns {string} URL
 */
function buildURL(properties = {}) {
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
    const key = keys[i]
    const value = properties[key]
    if (value) url[key] = value
  }
  return url.href
}

/**
 * Builds arguments for the ffmpeg call.
 *
 * @param {string} fileName Output file name
 * @param {object} [options] Screen recording options
 * @param {string} [options.loglevel] Log verbosity level
 * @param {string} [options.inputFormat] Input format
 * @param {string} [options.resolution] Display resolution (WIDTHxHEIGHT)
 * @param {number} [options.fps] Frames per second to record from input
 * @param {string} [options.videoFilter] Video filters to apply
 * @param {string} [options.videoCodec] Video codec
 * @param {string} [options.pixelFormat] Output pixel format
 * @param {string} [options.hostname=localhost] Server hostname
 * @param {string} [options.display] X11 server display
 * @param {string} [options.protocol=http] Server protocol
 * @param {string} [options.username] Basic auth username
 * @param {string} [options.password] Basic auth password
 * @param {number} [options.port] Server port
 * @param {string} [options.pathname] URL path component
 * @param {string} [options.search] URL query parameter
 * @returns {Array<string>} ffmpeg arguments list
 */
function buildFFMPEGArgs(fileName, options = {}) {
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
    args.push('-r', String(options.fps))
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
  if (options.videoFilter) {
    args.push('-vf', options.videoFilter)
  }
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
 * Starts a screen recording via ffmpeg.
 *
 * @param {string} fileName Output file name
 * @param {Options} [options] Screen recording options
 * @returns {Recording} Recording object
 */
function recordScreen(fileName, options) {
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
  /**
   * Executes the recording process.
   *
   * @param {Function} resolve Success callback
   * @param {Function} reject Failure callback
   */
  function recordingExecutor(resolve, reject) {
    recProcess = execFile('ffmpeg', args, function (error, stdout, stderr) {
      recProcess = null
      // ffmpeg returns with status 255 when receiving SIGINT:
      if (error && !(error.killed && error.code === 255)) return reject(error)
      return resolve({ stdout, stderr })
    })
  }
  /**
   * Stops the recording process.
   */
  function stop() {
    if (recProcess) recProcess.kill('SIGINT')
  }
  /**
   * Sets meta data on the recorded video.
   *
   * @param {Result} result Recording result object
   * @returns {Promise<Result>} Resolves with a recording result object
   */
  function setMetadata(result) {
    if (!options.rotate) return Promise.resolve(result)
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
  const promise = new Promise(recordingExecutor).then(setMetadata)
  return { promise, stop }
}

module.exports = recordScreen
