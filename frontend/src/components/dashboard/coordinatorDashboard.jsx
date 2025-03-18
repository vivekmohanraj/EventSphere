import api, { getMediaUrl } from "../../utils/api";

const fetchUserProfile = async () => {
  try {
    const response = await api.get("users/profile/");
    if (response.data) {
      setUserProfile(response.data);
      if (response.data.profile_photo) {
        // Use the utility function to get the full media URL
        setProfilePhotoPreview(getMediaUrl(response.data.profile_photo));
      }
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}; 