const cloudinary = require("cloudinary").v2;
const { unlinkSync } = require("fs");
const { StatusCodes } = require("http-status-codes");

const CreateError = require("../middleware/createError");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

exports.CloudinaryUploader = async (fileString,options) => {
  let secureUrl;
  try{
    const fileUpload = await cloudinary.uploader.upload(fileString,options)
    secureUrl = fileUpload.secure_url
  }catch(error){
    CreateError(StatusCodes.INTERNAL_SERVER_ERROR,'something went wrong while uploading files')
  }finally{
    return secureUrl 
  }
};
