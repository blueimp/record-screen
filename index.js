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
  const opts = Object.assign(
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
  const args = [
    '-y', // Override existing files
    '-loglevel',
    'fatal' // Only show errors that prevent ffmpeg to continue
  ]
  if (opts.resolution) {
    // Must match X11 display resolution when using x11grab:
    args.push('-video_size', opts.resolution)
  }
  if (opts.fps) {
    // Frames per second to record from input:
    args.push('-r', opts.fps)
  }
  if (opts.inputFormat) {
    args.push('-f', opts.inputFormat)
  }
  args.push(
    '-i',
    // Construct the input URL:
    opts.inputFormat === 'x11grab'
      ? `${opts.hostname}:${opts.display}`
      : `${opts.protocol}//${opts.hostname}:${opts.port}`
  )
  if (opts.videoCodec) {
    args.push('-vcodec', opts.videoCodec)
  }
  if (opts.pixelFormat) {
    args.push('-pix_fmt', opts.pixelFormat)
  }
  args.push(fileName)
  let process
  const promise = new Promise(function (resolve, reject) {
    process = execFile('ffmpeg', args, function (error, stdout, stderr) {
      // ffmpeg returns with status 255 when receiving SIGINT:
      if (error && !(error.killed && error.code === 255)) return reject(error)
      return resolve({ stdout, stderr })
    })
  })
  function stop () {
    if (process) process.kill('SIGINT')
  }
  return {
    promise,
    stop
  }
}

module.exports = recordScreen
