import cloudinary
import cloudinary.uploader
import config

# Configure Cloudinary
cloudinary.config(
    cloud_name=config.CLOUDINARY_CLOUD_NAME,
    api_key=config.CLOUDINARY_API_KEY,
    api_secret=config.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_image(file, folder="qwenify/images"):
    """Upload image to Cloudinary (max 10MB)"""
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type="image"
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"]
    }

def upload_video(file, folder="qwenify/videos"):
    """Upload video to Cloudinary (max 100MB)"""
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type="video"
    )
    return {
        "url": result["secure_url"],
        "public_id": result["public_id"]
    }

def delete_media(public_id, resource_type="image"):
    """Delete media from Cloudinary"""
    return cloudinary.uploader.destroy(public_id, resource_type=resource_type)
