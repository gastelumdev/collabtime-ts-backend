import {v2 as cloudinary} from 'cloudinary';

cloudinary.config({ 
    cloud_name: 'dcwwotk0l', 
    api_key: '656962683321671', 
    api_secret: 'ws10jQ3LAshZgVL0apjwcKNHRjY' 
  });

async function handleUpload(file: any) {
    console.log("FILE", file)
    const res = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
    return res;
}

export default handleUpload;