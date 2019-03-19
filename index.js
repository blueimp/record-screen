'use strict'

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

const { execFile } = require('child_process')

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
  const args = [
    '-y', // Override existing files
    '-loglevel',
    'fatal' // Only show errors that prevent ffmpeg to continue
  ]
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
 * @typedef {Object} ScreenRecording
 * @property {Promise} promise Promise object for the active screen recording
 * @property {function} stop Function to stop the screen recording
 */

/**
 * Starts a screen recording via ffmpeg x11grab.
 * @param {string} fileName Output file name
 * @param {Object} [options] Screen recording options
 * @property {string} [options.inputFormat=x11grab] Input format
 * @property {string} [options.resolution] Display resolution (WIDTHxHEIGHT)
 * @property {number} [options.fps=15] Frames per second to record from input
 * @property {string} [options.videoCodec] Video codec
 * @property {string} [options.pixelFormat=yuv420p] Output pixel format
 * @property {string} [options.hostname=localhost] Server hostname
 * @property {string} [options.display=0] X11 server display
 * @property {string} [options.protocol=http] Server protocol
 * @property {string} [options.username] URL username
 * @property {string} [options.password] URL password
 * @property {number} [options.port=9000] Server port
 * @property {string} [options.pathname] URL pathname
 * @property {string} [options.search] URL search
 * @returns {ScreenRecording}
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
  const promise = new Promise(resolveRecordingProcess)
  return { promise, stop }
}

module.exports = recordScreen
