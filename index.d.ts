export = recordScreen;
/**
 * Starts a screen recording via ffmpeg.
 *
 * @param {string} fileName Output file name
 * @param {Options} [options] Screen recording options
 * @returns {Recording} Recording object
 */
declare function recordScreen(fileName: string, options?: Options): Recording;
declare namespace recordScreen {
    export { Result, Recording, Options };
}
/**
 * Screen recording options
 */
type Options = {
    /**
     * Log verbosity level
     */
    loglevel?: string;
    /**
     * Input format
     */
    inputFormat?: string;
    /**
     * Display resolution (WIDTHxHEIGHT)
     */
    resolution?: string;
    /**
     * Frames per second to record from input
     */
    fps?: number;
    /**
     * Video filters to apply
     */
    videoFilter?: string;
    /**
     * Video codec
     */
    videoCodec?: string;
    /**
     * Output pixel format
     */
    pixelFormat?: string;
    /**
     * Rotate metadata, set to 90 to rotate left by 90°
     */
    rotate?: number;
    /**
     * Server hostname
     */
    hostname?: string;
    /**
     * X11 server display
     */
    display?: string;
    /**
     * Server protocol
     */
    protocol?: string;
    /**
     * Basic auth username
     */
    username?: string;
    /**
     * Basic auth password
     */
    password?: string;
    /**
     * Server port
     */
    port?: number;
    /**
     * URL path component
     */
    pathname?: string;
    /**
     * URL query parameter
     */
    search?: string;
};
type Recording = {
    /**
     * Promise for the active screen recording
     */
    promise: Promise<Result>;
    /**
     * Function to stop the screen recording
     */
    stop: Function;
};
type Result = {
    /**
     * Screen recording standard output
     */
    stdout: string;
    /**
     * Screen recording error output
     */
    stderr: string;
};
