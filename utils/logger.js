const winston = require("winston");

const logConfiguration = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
            format: "MMM-DD-YYYY hh:mm:ss"
        }),
        winston.format.printf(
            (info) => `${info.level}: ${[info.timestamp]}: ${info.message}`
        )
    )
};

const logger = winston.createLogger(logConfiguration);

module.exports = logger;
