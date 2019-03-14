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
 * Builds arguments for the ffmpeg call.
 * @param {string} fileName Output file name
 * @param {Object} options Screen recording options
 * @returns {Array}
 */
function buildFFMPEGArgs (fileName, options) {
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
      ? `${options.hostname}:${options.display}`
      : `${options.protocol}//${options.hostname}:${options.port}`
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
 * @property {string} [options.resolution] Display resolution
 * @property {number} [options.fps=15] Frames per second
 * @property {string} [options.protocol=http:] Server protocol, ignored for X11
 * @property {string} [options.hostname=localhost] Server hostname
 * @property {string} [options.port=9100] Server port, ignored for X11
 * @property {string} [options.display=0] X11 server display
 * @property {string} [options.videoCodec] Video codec
 * @property {string} [options.pixelFormat=yuv420p] Output pixel format
 * @returns {ScreenRecording}
 */
function recordScreen (fileName, options) {
  const args = buildFFMPEGArgs(
    fileName,
    Object.assign(
      {
        inputFormat: 'x11grab',
        fps: 15,
        protocol: 'http:',
        hostname: 'localhost',
        port: 9100,
        display: '0',
        pixelFormat: 'yuv420p' // QuickTime compatibility
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
