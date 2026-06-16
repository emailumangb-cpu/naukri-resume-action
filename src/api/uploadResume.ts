import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { uploadFileHeader } from '../utils/headers';
import type { LoginCookies } from '../utils/types';
import { resumeUpdateUrl, resumeUploadUrl } from '../utils/constants';

/**
 * Uploads resume file to Naukri and updates the profile
 * @param cookieHeader Authentication cookies from login
 * @param resumePath Path to the resume file
 * @param resumeId ID of the resume to update
 * @returns Promise resolving to boolean indicating success
 */
export const uploadResume = async (
  cookieHeader: LoginCookies,
  resumePath: string,
  resumeId: string
): Promise<boolean> => {
  try {
    // File upload parameters
    const formKey = 'F51f8e7e54e205';
    const fileKey = 'UyFNbCXtBHdkXQ';
    const uploadCallback = 'true';
    const fileName = path.basename(resumePath);

    // Create form data for file upload
    const formData = new FormData();
    formData.append('formKey', formKey);
    formData.append('fileName', fileName);
    formData.append('uploadCallback', uploadCallback);
    formData.append('fileKey', fileKey);

    const fileBuffer = fs.readFileSync(resumePath);
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf'
    });

    const uploadHeaders = uploadFileHeader(cookieHeader);

    console.log('Uploading file...');

    const uploadResponse = await axios.post(
      `${resumeUploadUrl}?t=${Date.now()}`,
      formData,
      {
        headers: {
          ...uploadHeaders,
          'cache-control': 'no-cache, no-store, must-revalidate',
          pragma: 'no-cache',
          expires: '0'
        }
      }
    );

    if (uploadResponse.status !== 200) {
      console.error(
        'File upload failed:',
        uploadResponse.status,
        uploadResponse.data
      );
      return false;
    }

    console.log('File uploaded successfully!');

    const updateResumeUrl = `${resumeUpdateUrl(resumeId)}?t=${Date.now()}`;

    const updateHeaders = {
      ...uploadFileHeader(cookieHeader),
      'content-type': 'application/json',
      'x-http-method-override': 'PUT',
      'x-requested-with': 'XMLHttpRequest',
      'cache-control': 'no-cache, no-store, must-revalidate',
      pragma: 'no-cache',
      expires: '0',
      appid: '105',
      systemid: '105',
      authorization: `Bearer ${cookieHeader.nauk_at}`
    };

    const updateData = {
      textCV: {
        formKey,
        fileKey,
        textCvContent: ''
      }
    };

    console.log('Updating resume...');

    const updateResponse = await axios.post(updateResumeUrl, updateData, {
      headers: updateHeaders
    });

    if (updateResponse.status !== 200) {
      console.error(
        'Resume update failed:',
        updateResponse.status,
        updateResponse.data
      );
      return false;
    }

    console.log('Resume updated successfully!');
    return true;
  } catch (error) {
    console.error('Error in uploadResume:', error);
    return false;
  }
};
