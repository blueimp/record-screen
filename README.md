# Record Screen
> Screen recording function using [FFmpeg](https://www.ffmpeg.org/).  
> Defaults to using `x11grab`, but also supports other input formats.

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  * [x11grab](#x11grab)
  * [mjpeg](#mjpeg)
- [Options](#options)
- [License](#license)
- [Author](#author)

## Requirements
This is a thin wrapper around [FFmpeg](https://www.ffmpeg.org/) and has no other
dependencies.

## Installation
```sh
npm install record-screen
```

## Usage

### x11grab
[Desktop screen recording](https://trac.ffmpeg.org/wiki/Capture/Desktop) using
the `x11grab` input device:

```js
const recordScreen = require('record-screen')

const recording = recordScreen('/tmp/test.mp4', {
  resolution: '1440x900' // Display resolution
})

recording.promise
  .then(result => {
    // Screen recording is done
  })
  .catch(error => {
    // Screen recording has failed
  })

// As an example, stop the screen recording after 5 seconds:
setTimeout(() => recording.stop(), 5000)
```

### mjpeg
Record an MJPEG stream:

```js
const recordScreen = require('record-screen')

const recording = recordScreen('/tmp/test.mp4', {
  inputFormat: 'mjpeg' // Record an MJPEG stream, defaults to port 9100
})

recording.promise
  .then(result => {
    // Screen recording is done
  })
  .catch(error => {
    // Screen recording has failed
  })

// As an example, stop the screen recording after 5 seconds:
setTimeout(() => recording.stop(), 5000)
```

## Options

```js
const defaultOptions = {
  inputFormat: 'x11grab', // Input format, use 'mjpeg' to record an MJPEG stream
  resolution: undefined,  // Display resolution
  fps: 15,                // Frames per second to record from input
  protocol: 'http:',      // Server protocol, ignored for x11grab
  hostname: 'localhost',  // Server hostname
  port: 9100,             // Server port, ignored for x11grab
  display: '0',           // X11 server display, only used for x11grab
  videoCodec: undefined,  // Video codec, defaults to libx264
  pixelFormat: 'yuv420p'  // Output pixel format
}
```

## License
Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author
[Sebastian Tschan](https://blueimp.net/)
