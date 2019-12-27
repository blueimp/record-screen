# Record Screen

> Screen recording function using [FFmpeg](https://www.ffmpeg.org/).  
> Defaults to using `x11grab`, but also supports other input formats.

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [x11grab](#x11grab)
  - [mjpeg](#mjpeg)
- [Options](#options)
- [Testing](#testing)
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
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
  })
  .catch(error => {
    // Screen recording has failed
    console.error(error)
  })

// As an example, stop the screen recording after 5 seconds:
setTimeout(() => recording.stop(), 5000)
```

### mjpeg

Record an MJPEG stream:

```js
const recordScreen = require('record-screen')

const recording = recordScreen('/tmp/test.mp4', {
  inputFormat: 'mjpeg' // Record an MJPEG stream, defaults to port 9000
})

recording.promise
  .then(result => {
    // Screen recording is done
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
  })
  .catch(error => {
    // Screen recording has failed
    console.error(error)
  })

// As an example, stop the screen recording after 5 seconds:
setTimeout(() => recording.stop(), 5000)
```

## Options

```js
const defaultOptions = {
  // shared options:
  loglevel: undefined, // Log level, defaults to "info"
  inputFormat: 'x11grab', // Input format, use 'mjpeg' to record an MJPEG stream
  resolution: undefined, // Display resolution (WIDTHxHEIGHT)
  fps: 15, // Frames per second to record from input
  videoFilter: undefined, // Video filters to apply, e.g. 'crop=480:300:960:600'
  videoCodec: undefined, // Video codec, defaults to libx264 for mp4 output
  pixelFormat: 'yuv420p', // Output pixel format
  rotate: undefined, // Rotate metadata, set to 90 to rotate left by 90°
  hostname: 'localhost', // Server hostname
  // x11grab options:
  display: '0', // X11 server display
  // options ignored for x11grab:
  protocol: 'http', // Server protocol
  username: undefined, // Basic auth username
  password: undefined, // Basic auth password
  port: 9000, // Server port
  pathname: undefined, // URL path component
  search: undefined // URL query parameter
}
```

## Testing

1. Start [Docker](https://docs.docker.com/).
2. Install development dependencies:
   ```sh
   npm install
   ```
3. Run the tests:
   ```sh
   npm test
   ```

## License

Released under the [MIT license](https://opensource.org/licenses/MIT).

## Author

[Sebastian Tschan](https://blueimp.net/)
