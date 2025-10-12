// --- This file is now updated to use ImgBB for image uploads ---

// REMOVED: Firebase Storage imports are no longer needed.
// import { storage } from "../lib/firebase";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import { auth } from "../lib/firebase";

export const UploadFile = async ({ file }) => {
  // --- PASTE YOUR IMGBB API KEY HERE ---
  const apiKey = "8361b5e8c2092bb4c3ecf124fa321763";
  // ------------------------------------

  if (!file) {
    throw new Error("No file provided for upload.");
  }

  // We use FormData to send the file to the ImgBB API
  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", file);

  // Make the API request to ImgBB
  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (result.success) {
    // If the upload was successful, return the image URL
    return { file_url: result.data.url };
  } else {
    // If there was an error, log it and throw an error
    console.error("ImgBB Upload Error:", result);
    throw new Error("Failed to upload image.");
  }
};

// These integrations are still mocks and would need a real backend service (like Cloud Functions) to implement securely.
export const InvokeLLM = async (params) => {
  console.log("Mock InvokeLLM called with prompt:", params.prompt);
  return {
    has_progress: true,
    aligns_with_task: true,
    confidence_score: 95,
    explanation: "Mock AI Validation: The after photo shows significant progress that aligns with the task description. Looks good!"
  };
};

export const SendEmail = async ({ to, subject, body }) => {
  console.log(`Mock SendEmail called:
    To: ${to}
    Subject: ${subject}
    Body: ${body}`);
  return { success: true };
};

