const { connect } = require("mongoose");
const logger = require("../utils/logger");

const ConnectDB = async (mongoUrl) => {
    try {
        await connect(mongoUrl);
        logger.info("connected to database");
    } catch (error) {
        logger.error("Error while connecting to database");
        process.exit(1);
    }
};

module.exports = ConnectDB;
